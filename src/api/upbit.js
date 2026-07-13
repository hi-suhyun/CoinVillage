const BASE = "https://api.upbit.com/v1/ticker";

// price/rate는 기존 화면(상점/자산/정원)이 그대로 쓰는 필드. 그 외는 코인 상세 팝업에서만 쓰는
// 추가 시세 정보 — Upbit 응답 자체가 이미 포함하고 있어 파싱만 넓히면 된다(추가 API 호출 없음).
const MOCK_PRICES = {
  "KRW-DOGE": {
    price: "184.2", rate: 0.032,
    openingPrice: "180", highPrice: "189", lowPrice: "176", prevClosingPrice: "178.5", changePrice: "5.7",
    accTradePrice24h: "15230000000",
    high52w: "410", high52wDate: "2025-01-15", low52w: "62", low52wDate: "2025-06-02",
  },
  "KRW-MEW": {
    price: "5.1", rate: -0.012,
    openingPrice: "5.18", highPrice: "5.25", lowPrice: "5.05", prevClosingPrice: "5.16", changePrice: "-0.06",
    accTradePrice24h: "850000000",
    high52w: "12.4", high52wDate: "2025-02-20", low52w: "1.8", low52wDate: "2025-05-10",
  },
  "KRW-SHIB": {
    price: "0.0231", rate: 0.008,
    openingPrice: "0.0230", highPrice: "0.0234", lowPrice: "0.0228", prevClosingPrice: "0.02292", changePrice: "0.00018",
    accTradePrice24h: "2100000000",
    high52w: "0.045", high52wDate: "2025-01-08", low52w: "0.014", low52wDate: "2025-04-22",
  },
  "KRW-PEPE": {
    price: "0.0152", rate: -0.025,
    openingPrice: "0.0156", highPrice: "0.0158", lowPrice: "0.0150", prevClosingPrice: "0.01559", changePrice: "-0.00039",
    accTradePrice24h: "3400000000",
    high52w: "0.0312", high52wDate: "2025-03-01", low52w: "0.0089", low52wDate: "2025-06-15",
  },
  "KRW-BONK": {
    price: "0.0287", rate: 0.041,
    openingPrice: "0.0279", highPrice: "0.0292", lowPrice: "0.0276", prevClosingPrice: "0.02757", changePrice: "0.00113",
    accTradePrice24h: "1900000000",
    high52w: "0.052", high52wDate: "2025-02-11", low52w: "0.011", low52wDate: "2025-05-30",
  },
  "KRW-PENGU": {
    price: "32.5", rate: 0.011,
    openingPrice: "32.2", highPrice: "33.1", lowPrice: "31.9", prevClosingPrice: "32.15", changePrice: "0.35",
    accTradePrice24h: "620000000",
    high52w: "58.4", high52wDate: "2025-01-25", low52w: "14.2", low52wDate: "2025-06-08",
  },
  "KRW-USDT": {
    price: "1380", rate: 0.002,
    openingPrice: "1378", highPrice: "1383", lowPrice: "1376", prevClosingPrice: "1377.2", changePrice: "2.8",
    accTradePrice24h: "45000000000",
    high52w: "1450", high52wDate: "2025-01-03", low52w: "1310", low52wDate: "2025-04-18",
  },
};

function parseTickers(json) {
  const out = {};
  for (const t of json) {
    out[t.market] = {
      price: String(t.trade_price),
      rate: Number(t.signed_change_rate),
      openingPrice: t.opening_price != null ? String(t.opening_price) : undefined,
      highPrice: t.high_price != null ? String(t.high_price) : undefined,
      lowPrice: t.low_price != null ? String(t.low_price) : undefined,
      prevClosingPrice: t.prev_closing_price != null ? String(t.prev_closing_price) : undefined,
      changePrice: t.signed_change_price != null ? String(t.signed_change_price) : undefined,
      accTradePrice24h: t.acc_trade_price_24h != null ? String(t.acc_trade_price_24h) : undefined,
      high52w: t.highest_52_week_price != null ? String(t.highest_52_week_price) : undefined,
      high52wDate: t.highest_52_week_date,
      low52w: t.lowest_52_week_price != null ? String(t.lowest_52_week_price) : undefined,
      low52wDate: t.lowest_52_week_date,
    };
  }
  return out;
}

async function fetchTickers(markets) {
  const url = `${BASE}?markets=${markets.join(",")}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error("ticker http " + res.status);
    return parseTickers(await res.json());
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { parseTickers, fetchTickers, MOCK_PRICES, BASE };
