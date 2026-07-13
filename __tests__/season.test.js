const { seasonId, seasonBounds, isEnded } = require("../src/utils/season");

test("seasonId = YYYY-MM (월은 1~12로 패딩)", () => {
  expect(seasonId(new Date(2026, 6, 10).getTime())).toBe("2026-07");
  expect(seasonId(new Date(2026, 0, 1).getTime())).toBe("2026-01");
});
test("seasonBounds = 해당 월 1일 00:00 ~ 다음달 1일 00:00", () => {
  const b = seasonBounds(new Date(2026, 6, 10).getTime());
  expect(b.id).toBe("2026-07");
  expect(b.startTs).toBe(new Date(2026, 6, 1, 0, 0, 0, 0).getTime());
  expect(b.endTs).toBe(new Date(2026, 7, 1, 0, 0, 0, 0).getTime());
});
test("seasonBounds 연말 롤오버 (12월 → 다음해 1월)", () => {
  const b = seasonBounds(new Date(2026, 11, 25).getTime());
  expect(b.id).toBe("2026-12");
  expect(b.endTs).toBe(new Date(2027, 0, 1, 0, 0, 0, 0).getTime());
});
test("isEnded: now가 endTs 이상이면 시즌 종료", () => {
  const endTs = new Date(2026, 7, 1).getTime();
  expect(isEnded(endTs - 1, endTs)).toBe(false);
  expect(isEnded(endTs, endTs)).toBe(true);
  expect(isEnded(endTs + 1, endTs)).toBe(true);
});
