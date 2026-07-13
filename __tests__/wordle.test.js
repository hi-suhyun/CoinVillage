const {
  evaluateGuess, pickDailyWord, wordleReward, weekBonus, isoDay, isoWeekKey, HINT_COST,
  freshWordleState, rollWordle, applyGuess, applyHint,
} = require("../src/utils/wordle");
const { WORD_LENGTH, WORD_BANK } = require("../src/data/wordle");

const BANK = ["매수세"]; // 결정론적 테스트용 단일 단어 은행 — pickDailyWord가 항상 이 단어를 고름
const DAY = "2026-07-10";
const WEEK = isoWeekKey(new Date(2026, 6, 10).getTime());

test("evaluateGuess: 완전 일치는 전부 correct", () => {
  const r = evaluateGuess("가용현금", "가용현금");
  expect(r.map((x) => x.state)).toEqual(["correct", "correct", "correct", "correct"]);
});

test("evaluateGuess: 위치는 틀리지만 포함된 음절은 present, 없으면 absent", () => {
  // answer: 가용현금, guess: 현금가용 → 전부 다른 위치의 answer 음절과 매치되지만 정확한 위치는 없음
  const r = evaluateGuess("가용현금", "현금가용");
  expect(r.map((x) => x.state)).toEqual(["present", "present", "present", "present"]);
});

test("evaluateGuess: 정답에 없는 음절은 absent", () => {
  const r = evaluateGuess("가용현금", "김치사과");
  expect(r.every((x) => x.state === "absent")).toBe(true);
});

test("evaluateGuess: 중복 음절 처리 — 정답에 1개뿐인 음절을 guess에서 2번 넣으면 하나만 present", () => {
  // answer: 김프김프 (편의상 반복 단어로 중복 케이스 구성), guess가 정답과 다른 위치에서 중복 매치되는 경우
  // 더 명확한 케이스: answer "체결가격"(음절 4개, '결' 1개), guess가 '결'을 두 번 포함
  const r = evaluateGuess("체결가격", "결결가격");
  // index0 guess '결' vs answer[0]='체' → correct 아님, 정답에 '결'은 1개(index1)뿐
  // index1 guess '결' vs answer[1]='결' → correct
  // 두 '결' 중 하나만 correct로 소비되므로 index0의 '결'은 present가 아니라 absent (남은 카운트 0)
  expect(r[1].state).toBe("correct");
  expect(r[0].state).toBe("absent");
  expect(r[2].state).toBe("correct");
  expect(r[3].state).toBe("correct");
});

test("pickDailyWord: 같은 날짜 문자열이면 항상 같은 단어(결정론적)", () => {
  const bank = ["가용현금", "체결가격", "표준화율", "역프리미"];
  const a = pickDailyWord("2026-07-10", bank);
  const b = pickDailyWord("2026-07-10", bank);
  expect(a).toBe(b);
});

test("pickDailyWord: 날짜가 다르면 (대체로) 다른 단어가 나올 수 있다 — 최소한 bank 안의 값", () => {
  const bank = ["가용현금", "체결가격", "표준화율", "역프리미"];
  const w = pickDailyWord("2026-07-11", bank);
  expect(bank).toContain(w);
});

test("wordleReward: 시도 횟수가 적을수록 보상이 크다", () => {
  expect(wordleReward(1)).toBeGreaterThan(wordleReward(3));
  expect(wordleReward(3)).toBeGreaterThan(wordleReward(6));
});

test("weekBonus: 주간 완성 횟수에 따른 계단식 보너스", () => {
  expect(weekBonus(0)).toBe(0);
  expect(weekBonus(4)).toBe(0);
  expect(weekBonus(5)).toBeGreaterThan(0);
  expect(weekBonus(7)).toBeGreaterThan(weekBonus(5));
});

test("isoDay: 같은 날짜의 다른 시각도 같은 날짜 키를 반환", () => {
  const a = isoDay(new Date(2026, 6, 10, 1, 0).getTime());
  const b = isoDay(new Date(2026, 6, 10, 23, 0).getTime());
  expect(a).toBe(b);
});

test("isoWeekKey: 같은 주(월~일)는 같은 주 키를 반환", () => {
  const mon = isoDay(new Date(2026, 6, 6).getTime()); // 참고용
  const a = isoWeekKey(new Date(2026, 6, 6).getTime());
  const b = isoWeekKey(new Date(2026, 6, 10).getTime());
  expect(a).toBe(b);
});

test("HINT_COST는 양수 상수", () => {
  expect(HINT_COST).toBeGreaterThan(0);
});

test("rollWordle: 같은 날이면 그대로 반환", () => {
  const w = { ...freshWordleState(), day: DAY, guesses: ["가나다"] };
  expect(rollWordle(w, DAY, WEEK)).toBe(w);
});
test("rollWordle: 날짜가 바뀌면 오늘 진행상태는 리셋되지만 같은 주면 weekSolves는 유지", () => {
  const w = { ...freshWordleState(), day: "2026-07-09", weekKey: WEEK, weekSolves: 3, guesses: ["가나다"], solved: true };
  const rolled = rollWordle(w, DAY, WEEK);
  expect(rolled.guesses).toEqual([]);
  expect(rolled.solved).toBe(false);
  expect(rolled.weekSolves).toBe(3);
});
test("rollWordle: 주가 바뀌면 weekSolves도 0으로 리셋", () => {
  const w = { ...freshWordleState(), day: "2026-06-20", weekKey: "2026-W25", weekSolves: 5 };
  const rolled = rollWordle(w, DAY, WEEK);
  expect(rolled.weekSolves).toBe(0);
});

test("applyGuess: 오답이면 시도만 늘고 포인트는 0", () => {
  const r = applyGuess(freshWordleState(), "가나다", DAY, WEEK, BANK);
  expect(r.ok).toBe(true);
  expect(r.solved).toBe(false);
  expect(r.wordle.guesses).toEqual(["가나다"]);
  expect(r.pointsGain).toBe(0);
});
test("applyGuess: 정답이면 solved=true + 시도횟수 기반 보상", () => {
  const r = applyGuess(freshWordleState(), "매수세", DAY, WEEK, BANK);
  expect(r.solved).toBe(true);
  expect(r.pointsGain).toBe(wordleReward(1));
});
test("applyGuess: 6번째 오답에서 failed=true", () => {
  let w = freshWordleState();
  for (let i = 0; i < 5; i++) w = applyGuess(w, "가나다", DAY, WEEK, BANK).wordle;
  const r = applyGuess(w, "라마바", DAY, WEEK, BANK);
  expect(r.failed).toBe(true);
  expect(r.wordle.guesses.length).toBe(6);
});
test("applyGuess: 이미 끝난 상태에서는 거부", () => {
  const solvedState = applyGuess(freshWordleState(), "매수세", DAY, WEEK, BANK).wordle;
  const r = applyGuess(solvedState, "매수세", DAY, WEEK, BANK);
  expect(r.ok).toBe(false);
});
test("applyGuess: 주간 5회 달성 순간에만 주간 보너스가 1회 지급된다(중복 지급 없음)", () => {
  const w4 = { ...freshWordleState(), weekKey: WEEK, weekSolves: 4 };
  const r5 = applyGuess(w4, "매수세", DAY, WEEK, BANK); // 4 -> 5회째 solve
  expect(r5.pointsGain).toBe(wordleReward(1) + (weekBonus(5) - weekBonus(4)));
  expect(weekBonus(5) - weekBonus(4)).toBeGreaterThan(0);
});

test("applyHint: 왼쪽부터 순서대로 한 음절씩 공개하고 포인트를 차감", () => {
  const r = applyHint(freshWordleState(), 100, DAY, WEEK, BANK);
  expect(r.ok).toBe(true);
  expect(r.hint).toEqual({ index: 0, ch: "매" });
  expect(r.wordle.hints).toEqual([{ index: 0, ch: "매" }]);
  expect(r.pointsSpent).toBe(HINT_COST);
});
test("applyHint: 포인트가 부족하면 거부", () => {
  const r = applyHint(freshWordleState(), 0, DAY, WEEK, BANK);
  expect(r.ok).toBe(false);
});
test("WORD_BANK: 모든 단어가 WORD_LENGTH 음절이고 중복 없음", () => {
  for (const w of WORD_BANK) {
    expect(Array.from(w).length).toBe(WORD_LENGTH);
  }
  expect(new Set(WORD_BANK).size).toBe(WORD_BANK.length);
});

test("applyHint: 단어 길이-1개까지만 허용(전부 공개는 불가)", () => {
  let w = freshWordleState();
  w = applyHint(w, 100, DAY, WEEK, BANK).wordle; // 1/2 (매수세는 3음절)
  w = applyHint(w, 100, DAY, WEEK, BANK).wordle; // 2/2
  const r = applyHint(w, 100, DAY, WEEK, BANK); // 3번째는 거부
  expect(r.ok).toBe(false);
});
