import { useEffect } from "react";
import { Alert } from "react-native";
import { useTicker } from "../hooks/useTicker";
import { useWallet } from "../context/WalletContext";
import { ALL_MARKETS, COINS } from "../data/coins";
import { pct } from "../utils/format";

function coinLabel(market) {
  const c = COINS.find((c) => c.market === market);
  return c ? c.nick : market.replace("KRW-", "");
}

// 화면에 아무것도 그리지 않는 상시 감시 컴포넌트. 탭 레이아웃에 얹어두면 로그인 이후
// 앱을 쓰는 동안 계속 시세를 폴링하며(useTicker), 자동손절 임계치를 넘은 보유가 있으면
// 실제로 매도한다(WalletContext.applyStopLosses). 앱이 꺼져 있는 동안은 동작하지
// 않지만, 다시 켜는 즉시(useTicker가 마운트 시 바로 한 번 조회) 최신가로 재확인한다.
export default function StopLossMonitor() {
  const { ready, applyStopLosses } = useWallet();
  const { prices } = useTicker(ALL_MARKETS);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const fired = await applyStopLosses(prices);
      for (const f of fired) {
        Alert.alert("자동 손절 체결", `${coinLabel(f.market)} ${pct(f.rate)} · 자동으로 매도되었습니다.`);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prices, ready]);

  return null;
}
