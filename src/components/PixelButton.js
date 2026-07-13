import { useState } from "react";
import { TouchableOpacity, Text } from "react-native";
import theme from "../theme";

// 눌리면 그림자가 사라지며 살짝 내려앉는 아케이드풍 픽셀 버튼.
//
// Pressable이 아니라 TouchableOpacity를 쓰는 이유: 텍스트 입력 옆에 있는 버튼(예: 확인)을
// 키보드가 열린 채로 탭하면, ScrollView의 keyboardShouldPersistTaps="handled"가 그 첫 탭을
// (키보드를 닫기 위해) 삼켜버리는 경우가 있는데, 이 판별 로직은 예전 Touchable* 계열 컴포넌트
// 기준으로 작성돼 있어 Pressable은 "처리 가능한 대상"으로 인식되지 않아 첫 탭이 버튼까지
// 아예 전달되지 않는다(onPressIn조차 안 뜸). TouchableOpacity는 이 판별을 확실히 통과한다.
export default function PixelButton({ title, onPress, color, textColor = "#fff", disabled, small, style }) {
  const [pressed, setPressed] = useState(false);
  const bg = disabled ? theme.colors.border : color || theme.colors.brand;
  const down = pressed && !disabled;
  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={disabled ? undefined : onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        {
          backgroundColor: bg,
          borderWidth: theme.pixel.border,
          borderColor: theme.colors.ink,
          borderRadius: theme.pixel.radiusRound,
          paddingVertical: small ? 8 : 13,
          paddingHorizontal: small ? 14 : 16,
          alignItems: "center",
          justifyContent: "center",
          boxShadow: down ? "0px 0px 0px transparent" : `${theme.pixel.shadow}px ${theme.pixel.shadow}px 0px ${theme.colors.ink}`,
          transform: down ? [{ translateX: theme.pixel.shadow }, { translateY: theme.pixel.shadow }] : [],
        },
        style,
      ]}
    >
      <Text style={{ fontFamily: theme.font.pixel, color: textColor, fontSize: small ? theme.size.sm : theme.size.md, includeFontPadding: false }}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}
