const { add, sub, mul, div, trunc, cmp, gte, toDisplay } = require("../src/utils/decimal");

test("0.1 + 0.2 정확히 0.3", () => {
  expect(add("0.1", "0.2")).toBe("0.3");
});
test("0.0001 곱셈 왜곡 없음", () => {
  // 0.0001 * 1 은 0.00008969... 같은 왜곡이 나오면 안 됨
  expect(mul("0.0001", "1")).toBe("0.0001");
});
test("trunc 절사: 0.123456789 → 8자리 절사", () => {
  expect(trunc("0.123456789", 8)).toBe("0.12345678");
});
test("cmp 보유량 == 매도량 이면 0 (전량매도 가능 판정)", () => {
  expect(cmp("1234.56789012", "1234.56789012")).toBe(0);
  expect(gte("1234.56789012", "1234.56789012")).toBe(true);
});
test("div 후 trunc 로 마켓 자릿수 고정", () => {
  expect(trunc(div("10000", "184.2"), 8)).toBe("54.28881650");
});
test("toDisplay 불필요한 0 제거", () => {
  expect(toDisplay("54.28881650", 8)).toBe("54.2888165");
});
