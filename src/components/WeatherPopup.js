import { View, Text } from "react-native";
import theme from "../theme";

export function nowText() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}.${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function WeatherPopup({ message }) {
  return (
    <View style={{ backgroundColor: "rgba(255,255,255,0.96)", borderRadius: theme.radius.md, padding: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.brand, maxWidth: 220 }}>
      <Text style={{ fontFamily: theme.font.bold, color: theme.colors.brand }}>{nowText()}</Text>
      <Text style={{ fontFamily: theme.font.regular, color: theme.colors.text, marginTop: 4 }}>{message}</Text>
    </View>
  );
}
