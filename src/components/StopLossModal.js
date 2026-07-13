import { Modal, View, Text, Pressable } from "react-native";
import { useWallet } from "../context/WalletContext";
import { COINS } from "../data/coins";
import PixelButton from "./PixelButton";
import theme from "../theme";

const PRESETS = [5, 10, 15, 20, 30]; // -N%

function coinLabel(market) {
  const c = COINS.find((c) => c.market === market);
  return c ? c.nick : (market || "").replace("KRW-", "");
}

// 보유 코인 하나에 대해 자동 손절 임계치(매수가 대비 -N%)를 켜고 끄는 모달.
// 실제 매도는 StopLossMonitor가 시세를 관찰하다 WalletContext.applyStopLosses로 수행한다.
export default function StopLossModal({ visible, market, onClose }) {
  const { wallet, setStopLoss } = useWallet();
  if (!visible || !market || !wallet) return null;
  const current = wallet.stopLoss && wallet.stopLoss[market];

  function choose(pct) {
    setStopLoss(market, pct == null ? null : pct / 100);
    onClose();
  }

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: theme.colors.chrome,
            borderTopWidth: theme.pixel.border, borderLeftWidth: theme.pixel.border, borderRightWidth: theme.pixel.border,
            borderColor: theme.colors.ink,
            borderTopLeftRadius: theme.pixel.radiusRound, borderTopRightRadius: theme.pixel.radiusRound,
            padding: theme.spacing.lg,
          }}
        >
          <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.lg, color: theme.colors.brand, marginBottom: theme.spacing.sm, includeFontPadding: false }}>
            {coinLabel(market)} 자동 손절
          </Text>
          <Text style={{ fontFamily: theme.font.regular, color: theme.colors.sub, marginBottom: theme.spacing.md }}>
            매수가 대비 설정한 비율 이상 떨어지면 자동으로 전량 매도해요. 앱이 켜져 있을 때만 동작해요.
          </Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: theme.spacing.md }}>
            {PRESETS.map((pct) => (
              <PixelButton
                key={pct}
                title={`-${pct}%`}
                onPress={() => choose(pct)}
                color={current === pct / 100 ? theme.colors.warn : theme.colors.brand}
                small
                style={{ marginRight: 8, marginBottom: 8 }}
              />
            ))}
          </View>

          <PixelButton
            title={current ? "자동손절 끄기" : "닫기"}
            onPress={() => (current ? choose(null) : onClose())}
            color={theme.colors.border}
            textColor={theme.colors.text}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
