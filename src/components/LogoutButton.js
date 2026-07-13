import { useState } from "react";
import { Pressable, Text, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import theme from "../theme";

export default function LogoutButton() {
  const { logout } = useAuth();
  const router = useRouter();
  const [pressed, setPressed] = useState(false);

  function onPress() {
    Alert.alert("로그아웃", "정말 로그아웃하시겠어요?", [
      { text: "취소", style: "cancel" },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={{
        marginRight: theme.spacing.md,
        marginBottom: 6,
        paddingVertical: 5,
        paddingHorizontal: 12,
        backgroundColor: theme.colors.up,
        borderWidth: theme.pixel.border,
        borderColor: theme.colors.ink,
        borderRadius: theme.pixel.radiusRound,
        boxShadow: pressed ? "0px 0px 0px transparent" : `${theme.pixel.shadow}px ${theme.pixel.shadow}px 0px ${theme.colors.ink}`,
        transform: pressed ? [{ translateX: theme.pixel.shadow }, { translateY: theme.pixel.shadow }] : [],
      }}
    >
      <Text style={{ color: "#fff", fontFamily: theme.font.pixel, fontSize: 12, includeFontPadding: false }}>로그아웃</Text>
    </Pressable>
  );
}
