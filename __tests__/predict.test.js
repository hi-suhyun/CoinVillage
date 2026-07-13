const {
  leadingCoin, slotOf, resolveAt, resolvePrediction, streakReward, DEFENSE_COST,
  freshPredictState, applyPrediction, resolvePredictions, applyDefensePurchase, voteStats,
} = require("../src/utils/predict");

const DAY = "2026-07-10";
const NEXT_DAY = "2026-07-11";
const MARKET = "KRW-DOGE";

const COINS = [
  { market: "KRW-DOGE" },
  { market: "KRW-MEW" },
  { market: "KRW-SHIB" },
];

test("leadingCoin: 24h 거래대금이 가장 큰 코인을 대장주로 선택", () => {
  const tickers = {
    "KRW-DOGE": { accTradePrice24h: "1000" },
    "KRW-MEW": { accTradePrice24h: "5000" },
    "KRW-SHIB": { accTradePrice24h: "2000" },
  };
  expect(leadingCoin(tickers, COINS).market).toBe("KRW-MEW");
});

test("leadingCoin: 티커 정보가 없으면 첫 코인으로 폴백", () => {
  expect(leadingCoin({}, COINS).market).toBe("KRW-DOGE");
  expect(leadingCoin(null, COINS).market).toBe("KRW-DOGE");
});

test("slotOf: 정오 이전은 am, 이후는 pm", () => {
  expect(slotOf(new Date(2026, 6, 10, 9, 0).getTime())).toBe("am");
  expect(slotOf(new Date(2026, 6, 10, 14, 0).getTime())).toBe("pm");
  expect(slotOf(new Date(2026, 6, 10, 11, 59).getTime())).toBe("am");
  expect(slotOf(new Date(2026, 6, 10, 12, 0).getTime())).toBe("pm");
});

test("resolveAt: 오전 회차는 당일 정오, 오후 회차는 다음날 자정에 결과가 공개된다", () => {
  expect(resolveAt(DAY, "am")).toBe(new Date(2026, 6, 10, 12, 0, 0, 0).getTime());
  expect(resolveAt(DAY, "pm")).toBe(new Date(2026, 6, 11, 0, 0, 0, 0).getTime());
});

test("resolvePrediction: 상승 예측 + 실제 상승 → 승", () => {
  expect(resolvePrediction("up", 0.05)).toBe(true);
  expect(resolvePrediction("up", -0.01)).toBe(false);
});
test("resolvePrediction: 하락 예측 + 실제 하락 → 승", () => {
  expect(resolvePrediction("down", -0.02)).toBe(true);
  expect(resolvePrediction("down", 0.01)).toBe(false);
});
test("resolvePrediction: 보합(0%)은 어느 쪽도 승리하지 않음", () => {
  expect(resolvePrediction("up", 0)).toBe(false);
  expect(resolvePrediction("down", 0)).toBe(false);
});

test("streakReward: 연승 배수 10/20/40/80 증가, 이후 상한", () => {
  expect(streakReward(1)).toBe(10);
  expect(streakReward(2)).toBe(20);
  expect(streakReward(3)).toBe(40);
  expect(streakReward(4)).toBe(80);
  expect(streakReward(5)).toBeLessThanOrEqual(160);
  expect(streakReward(20)).toBeLessThanOrEqual(streakReward(5) * 2); // 상한이 걸려 무한정 커지지 않음
});

test("DEFENSE_COST는 양수 상수", () => {
  expect(DEFENSE_COST).toBeGreaterThan(0);
});

test("applyPrediction: 참여 직후에는 승패가 정해지지 않고 entryPrice/resolveAt만 기록된다", () => {
  const r = applyPrediction(freshPredictState(), "up", 100, MARKET, DAY, "am");
  expect(r.ok).toBe(true);
  expect(r.predict.am.resolved).toBe(false);
  expect(r.predict.am.win).toBeNull();
  expect(r.predict.am.entryPrice).toBe(100);
  expect(r.predict.am.resolveAt).toBe(resolveAt(DAY, "am"));
});
test("applyPrediction: 같은 회차에 이미 참여했으면(당일) 거부", () => {
  const base = applyPrediction(freshPredictState(), "up", 100, MARKET, DAY, "am").predict;
  const r = applyPrediction(base, "down", 101, MARKET, DAY, "am");
  expect(r.ok).toBe(false);
});
test("applyPrediction: 오전/오후는 서로 독립된 회차", () => {
  const afterAm = applyPrediction(freshPredictState(), "up", 100, MARKET, DAY, "am").predict;
  const r = applyPrediction(afterAm, "down", 101, MARKET, DAY, "pm");
  expect(r.ok).toBe(true);
});
test("applyPrediction: 미정산 상태로 날짜가 넘어간 회차는 정산 전까지 새 참여를 막는다", () => {
  const yesterdayPm = applyPrediction(freshPredictState(), "up", 100, MARKET, DAY, "pm").predict;
  const r = applyPrediction(yesterdayPm, "down", 101, MARKET, NEXT_DAY, "pm");
  expect(r.ok).toBe(false);
});
test("applyPrediction: 정산이 끝난 지난 회차 자리는 새 회차로 덮어쓸 수 있다", () => {
  const placed = applyPrediction(freshPredictState(), "up", 100, MARKET, DAY, "pm").predict;
  const { predict: settled } = resolvePredictions(placed, { [MARKET]: 110 }, resolveAt(DAY, "pm"));
  const r = applyPrediction(settled, "down", 90, MARKET, NEXT_DAY, "pm");
  expect(r.ok).toBe(true);
  expect(r.predict.pm.day).toBe(NEXT_DAY);
});
test("applyPrediction: 시세가 아직 없으면(0 이하) 거부", () => {
  const r = applyPrediction(freshPredictState(), "up", 0, MARKET, DAY, "am");
  expect(r.ok).toBe(false);
});

test("resolvePredictions: 정산 시각 전에는 정산되지 않는다", () => {
  const placed = applyPrediction(freshPredictState(), "up", 100, MARKET, DAY, "am").predict;
  const before = resolveAt(DAY, "am") - 1000;
  const { predict, resolved } = resolvePredictions(placed, { [MARKET]: 110 }, before);
  expect(resolved).toHaveLength(0);
  expect(predict.am.resolved).toBe(false);
});
test("resolvePredictions: 정산 시각 이후 + 상승 시세면 승리, 연승 +1, 보상은 streakReward(연승)", () => {
  const placed = applyPrediction(freshPredictState(), "up", 100, MARKET, DAY, "am").predict;
  const at = resolveAt(DAY, "am");
  const { predict, resolved } = resolvePredictions(placed, { [MARKET]: 110 }, at);
  expect(resolved).toHaveLength(1);
  expect(resolved[0].win).toBe(true);
  expect(resolved[0].pointsGain).toBe(streakReward(1));
  expect(predict.am.resolved).toBe(true);
  expect(predict.am.win).toBe(true);
  expect(predict.streak).toBe(1);
});
test("resolvePredictions: 방어권 없이 패배하면 연승이 0으로 초기화된다", () => {
  const base = { ...freshPredictState(), streak: 3, tickets: 0 };
  const placed = applyPrediction(base, "up", 100, MARKET, DAY, "am").predict;
  const { predict, resolved } = resolvePredictions(placed, { [MARKET]: 90 }, resolveAt(DAY, "am"));
  expect(resolved[0].win).toBe(false);
  expect(predict.streak).toBe(0);
  expect(resolved[0].usedDefense).toBe(false);
  expect(resolved[0].pointsGain).toBe(0);
});
test("resolvePredictions: 방어권을 보유한 채 패배하면 연승이 유지되고 방어권 1개가 소모된다", () => {
  const base = { ...freshPredictState(), streak: 3, tickets: 2 };
  const placed = applyPrediction(base, "up", 100, MARKET, DAY, "am").predict;
  const { predict, resolved } = resolvePredictions(placed, { [MARKET]: 90 }, resolveAt(DAY, "am"));
  expect(resolved[0].win).toBe(false);
  expect(resolved[0].usedDefense).toBe(true);
  expect(predict.streak).toBe(3); // 초기화되지 않음
  expect(predict.tickets).toBe(1); // 1개 소모
});
test("resolvePredictions: 참여 시점 대비 실제 등락(=exitPrice vs entryPrice)으로 정산한다", () => {
  const placed = applyPrediction(freshPredictState(), "down", 100, MARKET, DAY, "am").predict;
  const { resolved } = resolvePredictions(placed, { [MARKET]: 95 }, resolveAt(DAY, "am"));
  expect(resolved[0].rate).toBeCloseTo(-0.05);
  expect(resolved[0].win).toBe(true);
});
test("resolvePredictions: 정산 시각이 지났어도 해당 마켓의 시세가 없으면 보류한다", () => {
  const placed = applyPrediction(freshPredictState(), "up", 100, MARKET, DAY, "am").predict;
  const { predict, resolved } = resolvePredictions(placed, {}, resolveAt(DAY, "am"));
  expect(resolved).toHaveLength(0);
  expect(predict.am.resolved).toBe(false);
});
test("resolvePredictions: 이미 정산된 회차는 다시 정산하지 않는다(중복 지급 방지)", () => {
  const placed = applyPrediction(freshPredictState(), "up", 100, MARKET, DAY, "am").predict;
  const once = resolvePredictions(placed, { [MARKET]: 110 }, resolveAt(DAY, "am")).predict;
  const { resolved } = resolvePredictions(once, { [MARKET]: 999 }, resolveAt(DAY, "am") + 100000);
  expect(resolved).toHaveLength(0);
});
test("resolvePredictions: 오전/오후 두 회차가 각각 다른 시각에 독립적으로 정산된다", () => {
  const afterAm = applyPrediction(freshPredictState(), "up", 100, MARKET, DAY, "am").predict;
  const bothPlaced = applyPrediction(afterAm, "down", 200, MARKET, DAY, "pm").predict;
  // 정오: am만 정산 가능
  const r1 = resolvePredictions(bothPlaced, { [MARKET]: 110 }, resolveAt(DAY, "am"));
  expect(r1.resolved.map((r) => r.slot)).toEqual(["am"]);
  expect(r1.predict.pm.resolved).toBe(false);
  // 다음날 자정: pm도 정산 가능
  const r2 = resolvePredictions(r1.predict, { [MARKET]: 190 }, resolveAt(DAY, "pm"));
  expect(r2.resolved.map((r) => r.slot)).toEqual(["pm"]);
});

test("applyDefensePurchase: 포인트를 소모하고 방어권 1개 추가", () => {
  const r = applyDefensePurchase(freshPredictState(), 100);
  expect(r.ok).toBe(true);
  expect(r.predict.tickets).toBe(1);
  expect(r.pointsSpent).toBe(DEFENSE_COST);
});
test("applyDefensePurchase: 포인트 부족하면 거부", () => {
  const r = applyDefensePurchase(freshPredictState(), 0);
  expect(r.ok).toBe(false);
});

test("voteStats: 동일 (day, slot, market, rate) → 동일 결과(결정론)", () => {
  const a = voteStats(DAY, "am", MARKET, 0.02);
  const b = voteStats(DAY, "am", MARKET, 0.02);
  expect(a).toEqual(b);
});
test("voteStats: 상승/하락 비중의 합은 1", () => {
  const s = voteStats(DAY, "am", MARKET, 0.02);
  expect(s.up + s.down).toBeCloseTo(1);
});
test("voteStats: 상승 비중은 [0.15, 0.85] 범위를 벗어나지 않는다", () => {
  const flat = voteStats(DAY, "am", MARKET, 0);
  expect(flat.up).toBeGreaterThanOrEqual(0.15);
  expect(flat.up).toBeLessThanOrEqual(0.85);
  const extremeUp = voteStats(DAY, "am", MARKET, 999);
  expect(extremeUp.up).toBeLessThanOrEqual(0.85);
  const extremeDown = voteStats(DAY, "am", MARKET, -999);
  expect(extremeDown.up).toBeGreaterThanOrEqual(0.15);
});
test("voteStats: 실제 등락률이 높을수록 상승 비중도 높아진다", () => {
  const up = voteStats(DAY, "am", MARKET, 0.1).up;
  const down = voteStats(DAY, "am", MARKET, -0.1).up;
  expect(up).toBeGreaterThan(down);
});
test("voteStats: 참가자 수는 양수", () => {
  const s = voteStats(DAY, "am", MARKET, 0.02);
  expect(s.participants).toBeGreaterThan(0);
});
test("voteStats: 회차(day/slot/market)가 다르면 결과도 달라짐", () => {
  const a = voteStats(DAY, "am", MARKET, 0.02);
  const b = voteStats(DAY, "pm", MARKET, 0.02);
  expect(a).not.toEqual(b);
});
