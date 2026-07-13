import { View } from "react-native";
import theme from "../theme";

export default function RatioBar({ ratio, color }) {
  const pct = Math.max(0, Math.min(1, ratio)) * 100;
  return (
    <View
      style={{
        height: 16,
        backgroundColor: theme.colors.border,
        borderWidth: 2,
        borderColor: theme.colors.ink,
        borderRadius: theme.pixel.radiusRound,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          width: `${pct}%`,
          height: "100%",
          backgroundColor: color || theme.colors.brand,
        }}
      />
    </View>
  );
}
