const { add, sub, mul, div, cmp, gte } = require("./decimal");

function clone(w) {
  return { ...w, holdings: { ...w.holdings }, trades: [...w.trades], stopLoss: { ...(w.stopLoss || {}) } };
}

function buy(wallet, market, qty, price) {
  if (cmp(qty, "0") <= 0) return { ok: false, wallet, error: "수량을 확인하세요" };
  const amount = mul(qty, price);
  if (cmp(amount, wallet.cashKRW) > 0) return { ok: false, wallet, error: "가용현금이 부족합니다" };
  const w = clone(wallet);
  w.cashKRW = sub(w.cashKRW, amount);
  const prev = w.holdings[market];
  if (prev) {
    const newQty = add(prev.qty, qty);
    const newCost = add(mul(prev.qty, prev.avgBuy), amount);
    w.holdings[market] = { qty: newQty, avgBuy: div(newCost, newQty) };
  } else {
    w.holdings[market] = { qty: qty.toString(), avgBuy: price.toString() };
  }
  w.trades = [{ market, side: "buy", qty: qty.toString(), price: price.toString(), amount, ts: Date.now() }, ...w.trades].slice(0, 100);
  return { ok: true, wallet: w };
}

function sell(wallet, market, qty, price) {
  const h = wallet.holdings[market];
  if (!h) return { ok: false, wallet, error: "보유 수량이 없습니다" };
  if (cmp(qty, "0") <= 0) return { ok: false, wallet, error: "수량을 확인하세요" };
  if (!gte(h.qty, qty)) return { ok: false, wallet, error: "보유 수량을 초과했습니다" };
  const amount = mul(qty, price);
  const w = clone(wallet);
  w.cashKRW = add(w.cashKRW, amount);
  const remain = sub(h.qty, qty);
  if (cmp(remain, "0") <= 0) {
    delete w.holdings[market];
    if (w.stopLoss) delete w.stopLoss[market]; // 보유가 없어졌으니 손절 설정도 함께 정리
  } else {
    w.holdings[market] = { qty: remain, avgBuy: h.avgBuy };
  }
  w.trades = [{ market, side: "sell", qty: qty.toString(), price: price.toString(), amount, ts: Date.now() }, ...w.trades].slice(0, 100);
  return { ok: true, wallet: w };
}

function totalAssets(wallet, priceMap) {
  let total = wallet.cashKRW;
  for (const [m, h] of Object.entries(wallet.holdings)) {
    const p = priceMap[m] || "0";
    total = add(total, mul(h.qty, p));
  }
  return total;
}

function limitUsage(wallet) {
  const limit = Number(wallet.initialLimit) || 0;
  if (limit <= 0) return 0;
  const used = limit - Number(wallet.cashKRW);
  return Math.max(0, Math.min(1, used / limit));
}

// 보유 코인의 등락률을 "내가 산 가격(avgBuy)" 기준으로 계산. Upbit의 signed_change_rate는
// 전일 종가 대비 시장 전체 등락률이라 매수 시점과 무관 — 정원 화면의 0% 기준선은
// "내 매수가 대비 본전"을 뜻해야 하므로 별도로 계산한다.
function holdingRate(avgBuy, price) {
  if (!avgBuy || cmp(avgBuy, "0") <= 0 || price == null) return 0;
  return Number(div(sub(price, avgBuy), avgBuy));
}

function holdingRatios(wallet, priceMap) {
  const total = Number(totalAssets(wallet, priceMap)) || 1;
  const rows = [{ key: "CASH", label: "현금", ratio: Number(wallet.cashKRW) / total }];
  for (const [m, h] of Object.entries(wallet.holdings)) {
    const val = Number(mul(h.qty, priceMap[m] || "0"));
    rows.push({ key: m, label: m.replace("KRW-", ""), ratio: val / total });
  }
  return rows;
}

// wallet.stopLoss: { [market]: 임계치(0~1, "매수가 대비 이만큼 떨어지면 판다") }.
// 임계치가 설정되어 있고, 그 코인의 현재가가 있으며(0보다 큼), 매수가 대비 하락률이
// 임계치 이상인 보유를 모두 찾는다. 실제 매도는 호출측(WalletContext)이 sell()로 수행한다.
function stopLossTriggers(wallet, priceMap) {
  const stopLoss = wallet.stopLoss || {};
  const triggers = [];
  for (const [market, threshold] of Object.entries(stopLoss)) {
    const h = wallet.holdings[market];
    if (!h) continue;
    const price = priceMap && priceMap[market];
    if (price == null || Number(price) <= 0) continue;
    const rate = holdingRate(h.avgBuy, price);
    if (rate <= -Math.abs(Number(threshold) || 0)) {
      triggers.push({ market, qty: h.qty, price });
    }
  }
  return triggers;
}

module.exports = { buy, sell, totalAssets, limitUsage, holdingRatios, holdingRate, stopLossTriggers };
