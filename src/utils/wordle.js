// 금융 단어 워들 — 음절 단위(자모 분해 없음) 정답 비교. 순수함수, 상수는 여기서 튜닝.

// data/bots.js와 같은 FNV-1a 해시. 날짜 문자열 → 오늘의 단어를 결정론적으로 고른다(Math.random 금지).
function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Wordle 표준 2-pass 채점: 1차로 정확한 위치(correct)를 먼저 확정하고 정답 음절 재고에서 빼,
// 2차에서 남은 재고로만 present를 판정한다. 이렇게 해야 중복 음절이 있을 때 과도하게
// present가 나오지 않는다(예: 정답에 1개뿐인 음절을 guess에 2번 넣어도 1개만 인정).
function evaluateGuess(answer, guess) {
  const a = Array.from(answer);
  const g = Array.from(guess);
  const n = a.length;
  const states = new Array(n).fill(null);
  const remaining = {};

  for (let i = 0; i < n; i++) {
    if (g[i] === a[i]) {
      states[i] = "correct";
    } else {
      remaining[a[i]] = (remaining[a[i]] || 0) + 1;
    }
  }
  for (let i = 0; i < n; i++) {
    if (states[i]) continue;
    const ch = g[i];
    if (remaining[ch] > 0) {
      states[i] = "present";
      remaining[ch]--;
    } else {
      states[i] = "absent";
    }
  }
  return g.map((ch, i) => ({ ch, state: states[i] }));
}

function pickDailyWord(dayStr, bank) {
  if (!bank || bank.length === 0) return null;
  return bank[hashSeed(dayStr) % bank.length];
}

// 시도 횟수가 적을수록 보상이 크다(index = tries-1).
const REWARD_BY_TRY = [100, 80, 60, 45, 30, 20];
function wordleReward(tries) {
  const i = Math.max(1, Math.min(REWARD_BY_TRY.length, Math.floor(tries) || 1)) - 1;
  return REWARD_BY_TRY[i];
}

// 주간 완성 횟수(weekSolves)에 따른 계단식 보너스. 매주 다 풀면(7) 큰 보너스.
function weekBonus(weekSolves) {
  const n = Number(weekSolves) || 0;
  if (n >= 7) return 300;
  if (n >= 5) return 100;
  return 0;
}

// utils/season.js와 동일하게 기기 로컬 타임존 기준(자정 경계가 사용자 체감과 일치해야 함).
// toISOString()은 UTC로 변환하므로 자정 근처에서 하루가 어긋날 수 있어 쓰지 않는다.
function pad2(n) {
  return String(n).padStart(2, "0");
}
function isoDay(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// ISO 8601 주차: 월요일 시작, 그 주의 목요일이 속한 연도 기준 주차 번호.
function isoWeekKey(ts) {
  const src = new Date(ts);
  const d = new Date(Date.UTC(src.getFullYear(), src.getMonth(), src.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

const HINT_COST = 15;
const MAX_TRIES = 6;
// 정답 승리 시 리그 활동성 점수(scoreBreakdown의 activityScore)에도 소량 반영.
const ACTIVITY_POINTS = 5;

function freshWordleState() {
  return { day: null, guesses: [], solved: false, failed: false, hintsUsed: 0, hints: [], weekKey: null, weekSolves: 0 };
}

// day/weekKey가 오늘과 다르면(자정이 지났으면) 해당 부분만 리셋한 새 상태를 반환하는 순수 함수.
// weekSolves는 주(weekKey)가 바뀔 때만 0으로 리셋 — 같은 주 안에서는 이어서 누적된다.
function rollWordle(w, today, weekKey) {
  if (w.day === today) return w;
  return { ...freshWordleState(), weekKey, weekSolves: w.weekKey === weekKey ? w.weekSolves : 0 };
}

// 오늘의 추측 1회를 반영한 새 상태 + 획득 포인트를 계산하는 순수 함수(상태 in, 상태 out).
// WalletContext가 utils/wallet.js의 buy/sell을 그대로 쓰는 것과 같은 패턴 — Context는
// Date.now()로 today/weekKey를 구해 넘기고 저장만 담당한다.
function applyGuess(wordleState, guessRaw, today, weekKey, bank) {
  const w = rollWordle(wordleState, today, weekKey);
  if (w.solved || w.failed) return { ok: false, error: "오늘의 워들은 이미 끝났습니다", wordle: w };

  const answer = pickDailyWord(today, bank);
  const wordLen = Array.from(answer).length;
  const guess = String(guessRaw || "").trim();
  if (Array.from(guess).length !== wordLen) return { ok: false, error: `${wordLen}음절로 입력하세요`, wordle: w };

  const guesses = [...w.guesses, guess];
  const solved = guess === answer;
  const failed = !solved && guesses.length >= MAX_TRIES;

  let pointsGain = 0;
  let weekSolves = w.weekSolves;
  if (solved) {
    const prevWeekSolves = weekSolves;
    weekSolves = prevWeekSolves + 1;
    // weekBonus는 누적 solve 수에 대한 계단 함수 — 차이(delta)만큼만 지급해야 임계값을
    // 넘는 그 회차에서 한 번만 보너스가 지급된다(매 solve마다 중복 지급 방지).
    pointsGain = wordleReward(guesses.length) + (weekBonus(weekSolves) - weekBonus(prevWeekSolves));
  }

  const next = { ...w, day: today, weekKey, guesses, solved, failed, weekSolves };
  return { ok: true, wordle: next, solved, failed, pointsGain };
}

// 힌트 1회 사용을 반영한 새 상태 + 소모 포인트. 왼쪽부터 순서대로 한 음절씩 공개하며,
// 최소 한 음절은 항상 가려둔다(단어 길이-1개까지만 힌트 허용) — 힌트만으로 풀리지 않게.
function applyHint(wordleState, points, today, weekKey, bank) {
  const w = rollWordle(wordleState, today, weekKey);
  const answer = pickDailyWord(today, bank);
  const wordLen = Array.from(answer).length;
  if (w.solved || w.failed) return { ok: false, error: "오늘의 워들은 이미 끝났습니다", wordle: w };
  if (w.hintsUsed >= wordLen - 1) return { ok: false, error: "더 이상 힌트를 쓸 수 없습니다", wordle: w };
  if (points < HINT_COST) return { ok: false, error: "포인트가 부족합니다", wordle: w };

  const index = w.hintsUsed;
  const ch = Array.from(answer)[index];
  const hints = [...w.hints, { index, ch }];
  const next = { ...w, day: today, weekKey, hintsUsed: w.hintsUsed + 1, hints };
  return { ok: true, wordle: next, pointsSpent: HINT_COST, hint: { index, ch } };
}

module.exports = {
  evaluateGuess, pickDailyWord, wordleReward, weekBonus, isoDay, isoWeekKey,
  freshWordleState, rollWordle, applyGuess, applyHint,
  HINT_COST, MAX_TRIES, ACTIVITY_POINTS,
};
