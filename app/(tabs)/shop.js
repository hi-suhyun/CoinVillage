import { useState } from "react";
import { ScrollView, View, Text } from "react-native";
import { useTicker } from "../../src/hooks/useTicker";
import { useWallet } from "../../src/context/WalletContext";
import { useAuth } from "../../src/context/AuthContext";
import { COINS, ALL_MARKETS } from "../../src/data/coins";
import CoinRow from "../../src/components/CoinRow";
import TradeModal from "../../src/components/TradeModal";
import CoinInfoModal from "../../src/components/CoinInfoModal";
import GlossaryBar from "../../src/components/GlossaryBar";
import theme from "../../src/theme";

export default function Shop() {
  const { prices, rates, tickers, offline } = useTicker(ALL_MARKETS);
  const { wallet, doBuy, doSell } = useWallet();
  const { verifyPin } = useAuth();
  const [modal, setModal] = useState(null); // { coin, side }
  const [infoCoin, setInfoCoin] = useState(null);

  async function onConfirm({ qty, password }) {
    const ok = await verifyPin(password);
    if (!ok) return { ok: false, error: "PIN이 일치하지 않습니다" };
    const price = prices[modal.coin.market];
    return modal.side === "buy" ? doBuy(modal.coin.market, qty, price) : doSell(modal.coin.market, qty, price);
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.base }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.md }}>
        {offline ? <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.sm, color: theme.colors.warn, marginBottom: 8, includeFontPadding: false }}>오프라인 시세 (목업)</Text> : null}
        {COINS.map((coin) => (
          <CoinRow key={coin.market} coin={coin} price={prices[coin.market] || "0"} rate={rates[coin.market] || 0}
            onBuy={() => setModal({ coin, side: "buy" })}
            onSell={() => setModal({ coin, side: "sell" })}
            onInfo={() => setInfoCoin(coin)} />
        ))}
        <GlossaryBar />
      </ScrollView>
      <TradeModal
        visible={!!modal}
        coin={modal?.coin}
        side={modal?.side}
        price={modal ? (prices[modal.coin.market] || "0") : "0"}
        holdingQty={modal && wallet?.holdings[modal.coin.market]?.qty}
        cashKRW={wallet?.cashKRW || "0"}
        offline={offline}
        onClose={() => setModal(null)}
        onConfirm={onConfirm}
      />
      <CoinInfoModal
        visible={!!infoCoin}
        coin={infoCoin}
        ticker={infoCoin ? tickers[infoCoin.market] : null}
        holding={infoCoin ? wallet?.holdings[infoCoin.market] : null}
        onClose={() => setInfoCoin(null)}
      />
    </View>
  );
}
