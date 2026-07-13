const { hashSeed, mulberry32, shuffle } = require("../src/utils/prng");

test("hashSeed: 같은 문자열 → 같은 해시(결정론)", () => {
  expect(hashSeed("2026-07:mid")).toBe(hashSeed("2026-07:mid"));
});
test("hashSeed: 다른 문자열 → 대개 다른 해시", () => {
  expect(hashSeed("2026-07:mid")).not.toBe(hashSeed("2026-07:large"));
});

test("mulberry32: 같은 시드 → 같은 난수 스트림(결정론)", () => {
  const a = mulberry32(42);
  const b = mulberry32(42);
  expect(a()).toBe(b());
  expect(a()).toBe(b());
});
test("mulberry32: 값은 [0,1) 범위", () => {
  const rng = mulberry32(123);
  for (let i = 0; i < 20; i++) {
    const v = rng();
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThan(1);
  }
});

test("shuffle: 같은 시드 rng → 같은 순서(결정론)", () => {
  const arr = ["a", "b", "c", "d", "e"];
  const a = shuffle(arr, mulberry32(7));
  const b = shuffle(arr, mulberry32(7));
  expect(a).toEqual(b);
});
test("shuffle: 원본 배열을 변형하지 않고 같은 원소를 보존", () => {
  const arr = ["a", "b", "c"];
  const out = shuffle(arr, mulberry32(1));
  expect(arr).toEqual(["a", "b", "c"]); // 원본 불변
  expect([...out].sort()).toEqual(["a", "b", "c"]);
});
