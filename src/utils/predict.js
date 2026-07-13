// 시장 Up/Down 예측 — 대장주 선정/시간대/승패/연승 보상. 순수함수, 상수는 여기서 튜닝.
//
// 예측은 참여 즉시 정산되지 않는다. 참여 시점의 가격(entryPrice)만 기록해두고, 그 회차가
// 끝나는 시각(resolveAt) 이후 실제로 가격이 얼마가 됐는지로 나중에 정산한다:
//   - 오전 회차(am)는 그날 정오에 결과가 공개된다.
//   - 오후 회차(pm)는 다음날 자정(=다음날 오전 시작)에 결과가 공개된다.
// 백엔드가 없는 로컬 데모라 "정확히 그 시각의 가격"을 저장해둘 수는 없고, resolveAt이
// 지난 뒤 앱을 열었을 때 그 순간의 최신가로 근사해 정산한다.
const { hashSeed, mulberry32 } = require("./prng");

// 24h 거래대금(accTradePrice24h)이 가장 큰 코인을 그날의 "대장주"로 선정.
// tickers는 useTicker()의 tickers(=market→{price,rate,accTradePrice24h,...}), 값이 없으면 0 취급.
function leadingCoin(tickers, coins) {
  if (!coins || coins.length === 0) return null;
  let best = coins[0];
  let bestVal = Number(tickers && tickers[best.market] && tickers[best.market].accTradePrice24h) || 0;
  for (let i = 1; i < coins.length; i++) {
    const c = coins[i];
    const v = Number(tickers && tickers[c.market] && tickers[c.market].accTradePrice24h) || 0;
    if (v > bestVal) {
      best = c;
      bestVal = v;
    }
  }
  return best;
}

// 정오(로컬 시각) 이전=오전 회차, 이후=오후 회차.
function slotOf(ts) {
  return new Date(ts).getHours() < 12 ? "am" : "pm";
}

// today(YYYY-MM-DD) 기준 그 슬롯의 결과 공개 시각(로컬 epoch ms).
function resolveAt(today, slot) {
  const [y, m, d] = today.split("-").map(Number);
  if (slot === "am") return new Date(y, m - 1, d, 12, 0, 0, 0).getTime();
  return new Date(y, m - 1, d + 1, 0, 0, 0, 0).getTime(); // 다음날 00:00 — Date가 월/연 overflow도 알아서 처리
}

// 보합(0%)은 상승/하락 어느 예측도 승리로 인정하지 않는다(무승부를 이득으로 만들지 않기 위함).
function resolvePrediction(pick, rate) {
  const r = Number(rate) || 0;
  if (pick === "up") return r > 0;
  if (pick === "down") return r < 0;
  return false;
}

// 연승 배수: 1연승 10P, 2연승 20P, 3연승 40P... (10 * 2^(n-1)), 무한정 커지지 않게 상한.
const STREAK_CAP = 160;
function streakReward(streak, cap = STREAK_CAP) {
  const n = Math.max(1, Math.floor(streak) || 1);
  return Math.min(cap, 10 * Math.pow(2, n - 1));
}

const DEFENSE_COST = 50; // 연승 방어권 — 실패 시 배수 초기화를 1회 막아준다.
// 예측 성공 시 리그 활동성 점수에도 소량 반영.
const ACTIVITY_POINTS = 3;

function freshPredictState() {
  return { streak: 0, tickets: 0, am: null, pm: null };
}

// round가 "오늘 이 슬롯에 이미 참여한 것"으로 취급돼야 하는지. 같은 날 만든 회차면 당연히
// 참여한 것이고, 다른 날짜의 회차라도 아직 정산 전이면(=결과를 놓치면 안 되므로) 새 참여를
// 막아 정산될 때까지 자리를 지킨다.
function alreadyPlayed(round, today) {
  if (!round) return false;
  if (round.day === today) return true;
  return !round.resolved;
}

// 예측 1회 참여. 결과는 즉시 나오지 않고 참여 시점 가격(entryPrice)과 정산 시각(resolveAt)만
// 기록한다. 승패는 resolvePredictions가 그 시각 이후에 계산한다.
function applyPrediction(predictState, pick, entryPrice, entryMarket, today, slot) {
  if (alreadyPlayed(predictState[slot], today)) {
    return { ok: false, error: "이번 회차는 이미 참여했습니다", predict: predictState };
  }
  const price = Number(entryPrice) || 0;
  if (price <= 0) return { ok: false, error: "시세를 불러오는 중입니다", predict: predictState };
  const round = {
    day: today, pick, entryMarket, entryPrice: price,
    resolveAt: resolveAt(today, slot), resolved: false, win: null, rate: null, usedDefense: false,
  };
  return { ok: true, predict: { ...predictState, [slot]: round } };
}

// exitPrices: useTicker()의 prices(market→현재가). resolveAt을 지난 미정산 회차들을 그 시점까지
// 확인 가능한 최신가로 정산한다. 정산된 회차 목록(활동성 점수/포인트 반영용)을 함께 반환한다.
function resolvePredictions(predictState, exitPrices, now) {
  let next = predictState;
  const resolved = [];
  for (const slot of ["am", "pm"]) {
    const round = next[slot];
    if (!round || round.resolved) continue;
    if (now < round.resolveAt) continue;
    const exitPrice = exitPrices && exitPrices[round.entryMarket];
    if (exitPrice == null || !round.entryPrice) continue;

    const rate = (Number(exitPrice) - round.entryPrice) / round.entryPrice;
    const win = resolvePrediction(round.pick, rate);
    let { streak, tickets } = next;
    let usedDefense = false;
    if (win) {
      streak += 1;
    } else if (tickets > 0) {
      usedDefense = true;
      tickets -= 1; // 연승 방어권 소모 — streak는 초기화되지 않음
    } else {
      streak = 0;
    }
    const pointsGain = win ? streakReward(streak) : 0;
    next = { ...next, [slot]: { ...round, resolved: true, win, rate, usedDefense }, streak, tickets };
    resolved.push({ slot, win, rate, pointsGain, usedDefense, pick: round.pick });
  }
  return { predict: next, resolved };
}

function applyDefensePurchase(predictState, points) {
  if (points < DEFENSE_COST) return { ok: false, error: "포인트가 부족합니다", predict: predictState };
  return { ok: true, predict: { ...predictState, tickets: predictState.tickets + 1 }, pointsSpent: DEFENSE_COST };
}

// 회차(day, slot, market)별로 안정적인 상승/하락 투표 현황을 만든다(백엔드가 없어 실제
// 집계는 불가능 — 시드로 그럴듯하게 흉내낸다). 실제 등락률(rate)로 살짝 편향을 줘서
// "시장이 오르는 중이면 상승 쪽이 좀 더 많다"는 느낌을 준다. 투표를 마친 뒤에만 공개해
// 사용자가 자신의 선택을 먼저 하도록 유도한다(herding 방지).
function voteStats(day, slot, market, rate) {
  const rng = mulberry32(hashSeed(`${day}:${slot}:${market}`));
  const base = 0.3 + rng() * 0.4; // 0.30~0.70
  const r = Number(rate) || 0;
  const nudge = Math.max(-1, Math.min(1, r * 5)) * 0.15; // rate ±20%p에서 포화
  const up = Math.max(0.15, Math.min(0.85, base + nudge));
  const participants = 200 + Math.floor(rng() * 800);
  return { up, down: 1 - up, participants };
}

module.exports = {
  leadingCoin, slotOf, resolveAt, resolvePrediction, streakReward,
  freshPredictState, applyPrediction, resolvePredictions, applyDefensePurchase, voteStats,
  DEFENSE_COST, ACTIVITY_POINTS,
};
