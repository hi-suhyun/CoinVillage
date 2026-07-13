const { weightClass, computeMaxDrawdown, scoreBreakdown, buildStandings } = require("../src/utils/league");

test("weightClass 경계값 (소형 ≤1,000,000 / 중형 ≤3,000,000 / 대형 >3,000,000)", () => {
  expect(weightClass(0)).toBe("small");
  expect(weightClass(1000000)).toBe("small");
  expect(weightClass(1000001)).toBe("mid");
  expect(weightClass(3000000)).toBe("mid");
  expect(weightClass(3000001)).toBe("large");
});

test("computeMaxDrawdown: 피크 대비 최대 낙폭 비율", () => {
  expect(computeMaxDrawdown([])).toBe(0);
  expect(computeMaxDrawdown([{ value: "100" }])).toBe(0);
  expect(computeMaxDrawdown([{ value: "100" }, { value: "100" }])).toBe(0);
  expect(computeMaxDrawdown([{ value: "100" }, { value: "120" }, { value: "150" }])).toBe(0);
  expect(computeMaxDrawdown([{ value: "100" }, { value: "150" }, { value: "90" }])).toBeCloseTo(0.4);
});

test("scoreBreakdown: 수익률/방어력/활동성 합산", () => {
  const r = scoreBreakdown({ returnPct: 10, maxDrawdown: 0, activityPoints: 50 });
  expect(r.returnScore).toBe(100);
  expect(r.defenseScore).toBe(300);
  expect(r.activityScore).toBe(50);
  expect(r.totalScore).toBe(450);
});
test("scoreBreakdown: 수익률 음수 허용", () => {
  const r = scoreBreakdown({ returnPct: -5, maxDrawdown: 0, activityPoints: 0 });
  expect(r.returnScore).toBe(-50);
});
test("scoreBreakdown: 활동성 점수는 200점 상한", () => {
  const r = scoreBreakdown({ returnPct: 0, maxDrawdown: 0, activityPoints: 500 });
  expect(r.activityScore).toBe(200);
});
test("scoreBreakdown: 최대낙폭 1(전액손실)이면 방어력 0점", () => {
  const r = scoreBreakdown({ returnPct: 0, maxDrawdown: 1, activityPoints: 0 });
  expect(r.defenseScore).toBe(0);
});

test("buildStandings: 총점 내림차순 정렬 + rank 부여 + 본인 표시", () => {
  const user = { nickname: "나", totalScore: 300 };
  const bots = [
    { nickname: "A", totalScore: 500 },
    { nickname: "B", totalScore: 100 },
  ];
  const standings = buildStandings({ user, bots });
  expect(standings.map((s) => s.nickname)).toEqual(["A", "나", "B"]);
  expect(standings.map((s) => s.rank)).toEqual([1, 2, 3]);
  const mine = standings.find((s) => s.isUser);
  expect(mine.nickname).toBe("나");
  expect(mine.rank).toBe(2);
});
