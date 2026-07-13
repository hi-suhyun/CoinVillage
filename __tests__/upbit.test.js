const { parseTickers } = require("../src/api/upbit");

test("ticker 응답 파싱", () => {
  const json = [
    { market: "KRW-DOGE", trade_price: 184.2, signed_change_rate: 0.032 },
    { market: "KRW-USDT", trade_price: 1380, signed_change_rate: -0.004 },
  ];
  const r = parseTickers(json);
  expect(r["KRW-DOGE"].price).toBe("184.2");
  expect(r["KRW-DOGE"].rate).toBe(0.032);
  expect(r["KRW-USDT"].price).toBe("1380");
});
