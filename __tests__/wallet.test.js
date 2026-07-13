const { buy, sell, totalAssets, limitUsage, holdingRate, stopLossTriggers } = require("../src/utils/wallet");

const base = () => ({ cashKRW: "1000000", initialLimit: "1000000", holdings: {}, trades: [] });

test("매수: 현금 차감 + 보유 증가", () => {
  const r = buy(base(), "KRW-DOGE", "100", "180");
  expect(r.ok).toBe(true);
  expect(r.wallet.cashKRW).toBe("982000"); // 1000000 - 18000
  expect(r.wallet.holdings["KRW-DOGE"].qty).toBe("100");
});
test("매수: 현금 초과 거부", () => {
  const r = buy(base(), "KRW-DOGE", "100000", "180");
  expect(r.ok).toBe(false);
});
test("부동소수 미소수량 매도 — 전량 매도시 잔량 0 및 키 제거", () => {
  let w = base();
  w = buy(w, "KRW-DOGE", "0.0001", "180").wallet;
  expect(w.holdings["KRW-DOGE"].qty).toBe("0.0001");
  const r = sell(w, "KRW-DOGE", "0.0001", "200");
  expect(r.ok).toBe(true);
  expect(r.wallet.holdings["KRW-DOGE"]).toBeUndefined(); // 잔존 미소수량 없음
});
test("매도: 보유 초과 거부", () => {
  let w = buy(base(), "KRW-DOGE", "100", "180").wallet;
  const r = sell(w, "KRW-DOGE", "101", "200");
  expect(r.ok).toBe(false);
});
test("totalAssets = 현금 + 평가금액", () => {
  let w = buy(base(), "KRW-DOGE", "100", "180").wallet; // cash 982000, 100개
  expect(totalAssets(w, { "KRW-DOGE": "200" })).toBe("1002000"); // 982000 + 20000
});
test("limitUsage = 투입비중", () => {
  let w = buy(base(), "KRW-DOGE", "100", "180").wallet; // 18000 투입
  expect(limitUsage(w)).toBeCloseTo(0.018);
});

test("holdingRate: 매수가와 현재가가 같으면 0% (본전 = 0% 기준선)", () => {
  expect(holdingRate("180", "180")).toBe(0);
});
test("holdingRate: 매수가 대비 등락률 계산 (시장 24h 등락률과 무관)", () => {
  expect(holdingRate("180", "198")).toBeCloseTo(0.1); // +10%
  expect(holdingRate("200", "180")).toBeCloseTo(-0.1); // -10%
});
test("holdingRate: 매수 정보/현재가 없으면 0", () => {
  expect(holdingRate(null, "180")).toBe(0);
  expect(holdingRate("180", null)).toBe(0);
  expect(holdingRate("0", "180")).toBe(0);
});

test("stopLossTriggers: 손절 설정이 없는 보유는 트리거되지 않는다", () => {
  let w = buy(base(), "KRW-DOGE", "100", "200").wallet; // stopLoss 미설정
  expect(stopLossTriggers(w, { "KRW-DOGE": "150" })).toEqual([]);
});
test("stopLossTriggers: 매수가 대비 하락률이 임계치 이상이면 트리거된다", () => {
  let w = buy(base(), "KRW-DOGE", "100", "200").wallet;
  w = { ...w, stopLoss: { "KRW-DOGE": 0.1 } }; // -10% 설정
  const r = stopLossTriggers(w, { "KRW-DOGE": "170" }); // -15%
  expect(r).toEqual([{ market: "KRW-DOGE", qty: "100", price: "170" }]);
});
test("stopLossTriggers: 임계치보다 적게 하락했으면 트리거되지 않는다", () => {
  let w = buy(base(), "KRW-DOGE", "100", "200").wallet;
  w = { ...w, stopLoss: { "KRW-DOGE": 0.2 } }; // -20% 설정
  expect(stopLossTriggers(w, { "KRW-DOGE": "190" })).toEqual([]); // -5%
});
test("stopLossTriggers: 시세가 없거나 0이면 트리거하지 않는다", () => {
  let w = buy(base(), "KRW-DOGE", "100", "200").wallet;
  w = { ...w, stopLoss: { "KRW-DOGE": 0.1 } };
  expect(stopLossTriggers(w, {})).toEqual([]);
  expect(stopLossTriggers(w, { "KRW-DOGE": "0" })).toEqual([]);
});
test("stopLossTriggers: 여러 보유 중 조건을 만족하는 것만 반환한다", () => {
  let w = buy(base(), "KRW-DOGE", "100", "200").wallet;
  w = buy(w, "KRW-MEW", "10", "1000").wallet;
  w = { ...w, stopLoss: { "KRW-DOGE": 0.1, "KRW-MEW": 0.1 } };
  const r = stopLossTriggers(w, { "KRW-DOGE": "170", "KRW-MEW": "950" }); // DOGE -15%, MEW -5%
  expect(r).toEqual([{ market: "KRW-DOGE", qty: "100", price: "170" }]);
});
test("sell: 보유를 전량 매도하면 해당 코인의 손절 설정도 함께 제거된다", () => {
  let w = buy(base(), "KRW-DOGE", "100", "200").wallet;
  w = { ...w, stopLoss: { "KRW-DOGE": 0.1 } };
  const r = sell(w, "KRW-DOGE", "100", "170");
  expect(r.ok).toBe(true);
  expect(r.wallet.stopLoss["KRW-DOGE"]).toBeUndefined();
});
test("sell: 일부만 매도하면 손절 설정은 유지된다", () => {
  let w = buy(base(), "KRW-DOGE", "100", "200").wallet;
  w = { ...w, stopLoss: { "KRW-DOGE": 0.1 } };
  const r = sell(w, "KRW-DOGE", "50", "170");
  expect(r.wallet.stopLoss["KRW-DOGE"]).toBe(0.1);
});
