const { won, coinPrice, ratioPct, compactCount } = require("../src/utils/format");

test("won: 정수 금액은 그대로 원화 표기", () => {
  expect(won(1234567)).toBe("1,234,567원");
  expect(won(0)).toBe("0원");
});

test("coinPrice: 100원 이상은 정수 원화 표기", () => {
  expect(coinPrice(184.2)).toBe("184원");
  expect(coinPrice(108)).toBe("108원");
});

test("coinPrice: 1원 미만도 0원으로 뭉개지지 않는다", () => {
  expect(coinPrice("0.54")).toBe("0.54원");
  expect(coinPrice("0.0231")).toBe("0.0231원");
  expect(coinPrice("0.0152")).toBe("0.0152원");
  expect(coinPrice("0.0287")).toBe("0.0287원");
});

test("coinPrice: 후행 0은 제거", () => {
  expect(coinPrice("0.5400")).toBe("0.54원");
});

test("coinPrice: 0/무효값은 0원", () => {
  expect(coinPrice(0)).toBe("0원");
  expect(coinPrice(null)).toBe("0원");
  expect(coinPrice(undefined)).toBe("0원");
});

test("ratioPct: 소수 첫째 자리까지 퍼센트로 표기", () => {
  expect(ratioPct(0.453)).toBe("45.3%");
  expect(ratioPct(1)).toBe("100.0%");
  expect(ratioPct(0)).toBe("0.0%");
});
test("ratioPct: 반올림하면 0.0%가 되는 극소 보유는 <0.1%로 표기", () => {
  expect(ratioPct(0.0001)).toBe("<0.1%");
});

test("compactCount: 큰 수량은 K/M/B로 축약하고 후행 0은 제거", () => {
  expect(compactCount(1200)).toBe("1.2K");
  expect(compactCount(1000)).toBe("1K");
  expect(compactCount(1560040)).toBe("1.56M");
  expect(compactCount(5000000)).toBe("5M");
  expect(compactCount(20000000)).toBe("20M");
  expect(compactCount(3000000000)).toBe("3B");
});
test("compactCount: 1000 미만은 null(기존 표기 유지)", () => {
  expect(compactCount(999)).toBe(null);
  expect(compactCount(0)).toBe(null);
});
