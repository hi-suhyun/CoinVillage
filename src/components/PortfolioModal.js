import { Modal, View, Text, Pressable } from "react-native";
import { ratioPct, pct } from "../utils/format";
import PixelButton from "./PixelButton";
import theme from "../theme";

const PALETTE = ["#E03E3E", "#1565C0", "#7BBF53", "#D97706", "#093687", "#8B5CF6", "#999999"];

// 상위 랭커(봇) 또는 본인의 종목·비중을 보여주는 참고용(읽기 전용) 모달. ratios는
// utils/wallet.js의 holdingRatios()와 data/bots.js의 botPortfolio()가 공통으로 만드는
// [{ key, label, ratio }] 형식을 그대로 받는다 — 두 출처 모두 같은 UI를 재사용한다.
export default function PortfolioModal({ visible, onClose, nickname, rank, returnPct, ratios, isUser }) {
  if (!visible || !ratios) return null;

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
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
            <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.lg, color: theme.colors.brand, includeFontPadding: false }}>
              {rank}위 {nickname}{isUser ? " (나)" : ""}
            </Text>
            <Text
              style={{
                fontFamily: theme.font.pixel, fontSize: theme.size.sm, includeFontPadding: false,
                color: returnPct >= 0 ? theme.colors.up : theme.colors.down,
              }}
            >
              {pct(returnPct / 100)}
            </Text>
          </View>
          <Text style={{ fontFamily: theme.font.regular, color: theme.colors.sub, marginBottom: theme.spacing.md }}>
            {isUser ? "나의 실제 보유 비중이에요." : "참고용 포트폴리오예요. 실제 매매는 직접 판단해서 진행하세요."}
          </Text>

          <View
            style={{
              flexDirection: "row", height: 18, borderWidth: 2, borderColor: theme.colors.ink,
              borderRadius: theme.pixel.radiusRound, overflow: "hidden", marginBottom: theme.spacing.md,
            }}
          >
            {ratios.map((r, i) => (
              <View key={r.key} style={{ flex: Math.max(0.0001, r.ratio), backgroundColor: PALETTE[i % PALETTE.length] }} />
            ))}
          </View>
          {ratios.map((r, i) => (
            <View key={r.key} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
              <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.sm, color: theme.colors.text, includeFontPadding: false }}>
                <Text style={{ color: PALETTE[i % PALETTE.length] }}>{"■ "}</Text>
                {r.label}
              </Text>
              <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.sm, color: theme.colors.sub, includeFontPadding: false }}>
                {ratioPct(r.ratio)}
              </Text>
            </View>
          ))}

          <PixelButton title="닫기" onPress={onClose} color={theme.colors.border} textColor={theme.colors.text} style={{ marginTop: theme.spacing.md }} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
