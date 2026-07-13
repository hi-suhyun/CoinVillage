import { createContext, useContext, useEffect, useState } from "react";
import { getJSON, setJSON } from "../store/storage";
import { buy, sell, holdingRate, stopLossTriggers } from "../utils/wallet";
import { clampLimit } from "../utils/auth";
import { THRESHOLDS } from "../data/coins";

const WalletCtx = createContext(null);
const WALLET_KEY = "wallet";

export function WalletProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [lastEvent, setLastEvent] = useState(null);

  useEffect(() => {
    (async () => { setWallet(await getJSON(WALLET_KEY)); setReady(true); })();
  }, []);

  async function persist(w) { setWallet(w); await setJSON(WALLET_KEY, w); }

  // 회원가입 직후 지갑을 빈 상태로 초기화(투자 한도는 자산 탭에서 따로 설정).
  async function resetWallet() {
    const w = { cashKRW: "0", initialLimit: "0", holdings: {}, trades: [], stopLoss: {} };
    await persist(w);
    return w;
  }

  // 자산 탭에서 투자 한도를 설정/재설정. 재설정 시 보유 코인·거래내역도 함께 초기화된다
  // (UI에서 재설정 전에 Alert로 확인을 받는다).
  async function setLimit(amount) {
    const limit = clampLimit(amount);
    const w = { cashKRW: String(limit), initialLimit: String(limit), holdings: {}, trades: [], stopLoss: {} };
    await persist(w);
    return w;
  }

  function classify(amount) {
    const n = Number(amount);
    if (n >= THRESHOLDS.whale) return "whale";
    if (n <= THRESHOLDS.small) return "small";
    return null;
  }

  async function doBuy(market, qty, price) {
    const r = buy(wallet, market, qty, price);
    if (!r.ok) return r;
    await persist(r.wallet);
    const amount = r.wallet.trades[0].amount;
    const type = classify(amount);
    if (type) setLastEvent({ type, side: "buy", market, ts: Date.now() });
    return r;
  }

  async function doSell(market, qty, price) {
    const r = sell(wallet, market, qty, price);
    if (!r.ok) return r;
    await persist(r.wallet);
    const amount = r.wallet.trades[0].amount;
    const type = classify(amount);
    if (type) setLastEvent({ type, side: "sell", market, ts: Date.now() });
    return r;
  }

  function clearEvent() { setLastEvent(null); }

  // fraction: 0~1(매수가 대비 -N%). null/0이면 해당 코인의 자동손절을 끈다.
  async function setStopLoss(market, fraction) {
    const next = { ...(wallet.stopLoss || {}) };
    if (fraction == null || fraction <= 0) {
      delete next[market];
    } else {
      next[market] = fraction;
    }
    const w = { ...wallet, stopLoss: next };
    await persist(w);
    return w;
  }

  // priceMap: useTicker()의 prices(market→현재가). 임계치를 넘은 보유를 모두 실제로 매도하고
  // (진짜 sell() 경로를 재사용— PIN 확인 없이 즉시 체결), 발동 내역을 반환한다.
  // 알림 표시 등 UI 반응은 호출측(StopLossMonitor)이 담당한다.
  async function applyStopLosses(priceMap) {
    if (!wallet) return [];
    const triggers = stopLossTriggers(wallet, priceMap);
    if (triggers.length === 0) return [];
    let w = wallet;
    const fired = [];
    for (const t of triggers) {
      const before = wallet.holdings[t.market];
      const r = sell(w, t.market, t.qty, t.price);
      if (!r.ok) continue;
      w = r.wallet;
      fired.push({ market: t.market, rate: holdingRate(before.avgBuy, t.price) });
    }
    if (fired.length > 0) await persist(w);
    return fired;
  }

  return (
    <WalletCtx.Provider
      value={{ ready, wallet, resetWallet, setLimit, doBuy, doSell, lastEvent, clearEvent, setStopLoss, applyStopLosses }}
    >
      {children}
    </WalletCtx.Provider>
  );
}

export const useWallet = () => useContext(WalletCtx);
