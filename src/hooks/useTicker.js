import { useEffect, useRef, useState } from "react";
import { fetchTickers, MOCK_PRICES } from "../api/upbit";

export function useTicker(markets, intervalMs = 5000) {
  const [state, setState] = useState({ data: {}, offline: false, ts: null });
  const lastGood = useRef(null);

  useEffect(() => {
    let alive = true;

    async function tick() {
      try {
        const data = await fetchTickers(markets);
        if (!alive) return;
        lastGood.current = data;
        setState({ data, offline: false, ts: Date.now() });
      } catch {
        if (!alive) return;
        const fallback = lastGood.current || MOCK_PRICES;
        setState({ data: fallback, offline: true, ts: Date.now() });
      }
    }

    tick();
    const id = setInterval(tick, intervalMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [markets.join(","), intervalMs]);

  const prices = {};
  const rates = {};
  for (const [m, v] of Object.entries(state.data)) {
    prices[m] = v.price;
    rates[m] = v.rate;
  }

  return { prices, rates, tickers: state.data, offline: state.offline, ts: state.ts };
}
