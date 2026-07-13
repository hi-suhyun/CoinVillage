import { View } from "react-native";
import theme from "../theme";

// 픽셀 게임풍 하드 테두리 카드/패널. 오프셋 그림자는 눌리는 버튼 전용이라 여긴 없음.
export default function PixelFrame({ children, style, color }) {
  return (
    <View
      style={[
        {
          backgroundColor: color || theme.colors.card,
          borderWidth: theme.pixel.border,
          borderColor: theme.colors.ink,
          borderRadius: theme.pixel.radiusRound,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
