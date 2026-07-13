import { Modal, Pressable, View, Text } from "react-native";
import { TIERS } from "../data/weather";
import PixelButton from "./PixelButton";
import theme from "../theme";

const ICON = { sunny: "☀️", cloudy: "☁️", rain: "🌧️", storm: "🌀" };

// TIERS는 min 내림차순(맑음→태풍)으로 정렬돼 있으므로, 각 구간의 상한은 바로 앞 구간의
// min이고 하한은 자기 자신의 min이다. 맨 위(맑음)는 상한이 없고, 맨 아래(태풍)는 하한이 -∞.
function rangeLabel(i) {
  const tier = TIERS[i];
  const upper = i === 0 ? null : TIERS[i - 1].min;
  const lo = tier.min === -Infinity ? null : `${(tier.min * 100).toFixed(0)}%`;
  if (upper == null) return `${lo} 이상`;
  if (lo == null) return `${(upper * 100).toFixed(0)}% 미만`;
  return `${lo} ~ ${(upper * 100).toFixed(0)}%`;
}

// "시장 평균" HUD를 눌렀을 때 뜨는 설명 — 밈코인 평균 등락률이 마을 날씨로 어떻게
// 매핑되는지 보여주고, 지금 날씨(currentKey)를 강조해 "왜 지금 이 날씨인지" 바로 알 수 있게 한다.
export default function WeatherChartModal({ visible, currentKey, onClose }) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center" }}>
        <Pressable
          onPress={() => {}}
          style={{
            width: 300, backgroundColor: "#fff",
            borderRadius: theme.pixel.radiusRound, borderWidth: theme.pixel.border, borderColor: theme.colors.ink,
            padding: theme.spacing.lg,
          }}
        >
          <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.md, color: theme.colors.brand, marginBottom: theme.spacing.sm, includeFontPadding: false }}>
            시장 평균 → 마을 날씨
          </Text>
          <Text style={{ fontFamily: theme.font.regular, color: theme.colors.sub, marginBottom: theme.spacing.md, lineHeight: 20 }}>
            밈코인들의 평균 등락률로 마을 날씨가 정해져요.
          </Text>
          {TIERS.map((tier, i) => {
            const active = tier.key === currentKey;
            return (
              <View
                key={tier.key}
                style={{
                  flexDirection: "row", alignItems: "center",
                  paddingVertical: 8, paddingHorizontal: 10, marginBottom: 6,
                  borderRadius: theme.pixel.radius,
                  borderWidth: active ? theme.pixel.border : 0, borderColor: theme.colors.ink,
                  backgroundColor: active ? theme.colors.panel : "transparent",
                }}
              >
                <Text style={{ fontSize: 18, marginRight: 8 }}>{ICON[tier.key]}</Text>
                <Text style={{ flex: 1, fontFamily: theme.font.pixel, fontSize: theme.size.sm, color: theme.colors.text, includeFontPadding: false }}>
                  {tier.label}
                </Text>
                <Text style={{ fontFamily: theme.font.regular, fontSize: theme.size.xs, color: theme.colors.sub }}>
                  {rangeLabel(i)}
                </Text>
              </View>
            );
          })}
          <PixelButton title="닫기" onPress={onClose} color={theme.colors.border} textColor={theme.colors.text} style={{ marginTop: theme.spacing.sm }} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
