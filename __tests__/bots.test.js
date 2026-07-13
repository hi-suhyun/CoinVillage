const { generateBots, botStats, botPortfolio } = require("../src/data/bots");

const COINS = [
  { market: "KRW-DOGE", nick: "DOGE" },
  { market: "KRW-MEW", nick: "MEW" },
  { market: "KRW-SHIB", nick: "SHIB" },
  { market: "KRW-PEPE", nick: "PEPE" },
  { market: "KRW-BONK", nick: "BONK" },
];

test("generateBots: 동일 (seasonId, weightClass) → 동일 로스터(결정론)", () => {
  const a = generateBots("2026-07", "mid", 10);
  const b = generateBots("2026-07", "mid", 10);
  expect(a.map((x) => x.nickname)).toEqual(b.map((x) => x.nickname));
});
test("generateBots: 닉네임은 로스터 내에서 유니크", () => {
  const bots = generateBots("2026-07", "large", 15);
  const names = bots.map((x) => x.nickname);
  expect(new Set(names).size).toBe(names.length);
});
test("generateBots: 요청 개수만큼 생성", () => {
  expect(generateBots("2026-07", "small", 12).length).toBe(12);
});
test("generateBots: 체급이 다르면 로스터도 달라짐", () => {
  const small = generateBots("2026-07", "small", 10).map((x) => x.nickname);
  const large = generateBots("2026-07", "large", 10).map((x) => x.nickname);
  expect(small).not.toEqual(large);
});
test("botStats: 동일 봇 + 동일 시즌진행도 → 동일 스탯(결정론)", () => {
  const bot = generateBots("2026-07", "mid", 5)[0];
  const s1 = botStats(bot, 0.5);
  const s2 = botStats(bot, 0.5);
  expect(s1).toEqual(s2);
});
test("botStats: 최대낙폭은 0~1 범위, 활동포인트는 0 이상", () => {
  const bot = generateBots("2026-07", "mid", 5)[2];
  const s = botStats(bot, 0.8);
  expect(s.maxDrawdown).toBeGreaterThanOrEqual(0);
  expect(s.maxDrawdown).toBeLessThanOrEqual(1);
  expect(s.activityPoints).toBeGreaterThanOrEqual(0);
});

test("botPortfolio: 동일 (seasonId, nickname) → 동일 배분(결정론)", () => {
  const a = botPortfolio("2026-07", "도지대장", COINS);
  const b = botPortfolio("2026-07", "도지대장", COINS);
  expect(a).toEqual(b);
});
test("botPortfolio: 첫 항목은 현금(CASH)", () => {
  const rows = botPortfolio("2026-07", "샤크핀", COINS);
  expect(rows[0].key).toBe("CASH");
  expect(rows[0].label).toBe("현금");
});
test("botPortfolio: 코인 2~4개를 보유(현금 제외)", () => {
  const rows = botPortfolio("2026-07", "불장러", COINS);
  const coinRows = rows.slice(1);
  expect(coinRows.length).toBeGreaterThanOrEqual(2);
  expect(coinRows.length).toBeLessThanOrEqual(4);
});
test("botPortfolio: 모든 비중의 합은 1(오차 허용)", () => {
  const rows = botPortfolio("2026-07", "존버킹", COINS);
  const total = rows.reduce((sum, r) => sum + r.ratio, 0);
  expect(total).toBeCloseTo(1);
});
test("botPortfolio: 모든 비중은 0~1 범위", () => {
  const rows = botPortfolio("2026-07", "물타기장인", COINS);
  for (const r of rows) {
    expect(r.ratio).toBeGreaterThanOrEqual(0);
    expect(r.ratio).toBeLessThanOrEqual(1);
  }
});
test("botPortfolio: 닉네임이 다르면 배분도 달라짐", () => {
  const a = botPortfolio("2026-07", "무릎매수", COINS);
  const b = botPortfolio("2026-07", "떡상요정", COINS);
  expect(a).not.toEqual(b);
});
