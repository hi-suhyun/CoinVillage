import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, View, Text } from "react-native";
import theme from "../theme";

export default function BalloonWhale({ width, onDone }) {
  const x = useRef(new Animated.Value(-120)).current;
  const [popup, setPopup] = useState(false);
  useEffect(() => {
    Animated.timing(x, { toValue: width + 120, duration: 7000, useNativeDriver: true }).start(() => onDone && onDone());
  }, []);
  return (
    <Animated.View style={{ position: "absolute", top: 40, transform: [{ translateX: x }], zIndex: 7 }}>
      <Pressable onPress={() => setPopup((v) => !v)}>
        <View style={{ width: 90, height: 46 }}>
          <View style={{ position: "absolute", left: 0, top: 8, width: 76, height: 34, borderRadius: 18, backgroundColor: "#7AA9D6" }} />
          <View style={{ position: "absolute", left: 64, top: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: "#7AA9D6" }} />
          <View style={{ position: "absolute", left: 8, top: 16, width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" }} />
        </View>
      </Pressable>
      {popup && (
        <View style={{ marginTop: 6, backgroundColor: "rgba(255,255,255,0.96)", borderRadius: theme.radius.md, padding: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.brand, maxWidth: 200 }}>
          <Text style={{ fontFamily: theme.font.bold, color: theme.colors.brand }}>대형 고래 출현</Text>
          <Text style={{ fontFamily: theme.font.regular, color: theme.colors.text, marginTop: 4 }}>큰 거래가 지나가며 선물을 떨어뜨렸어요.</Text>
        </View>
      )}
    </Animated.View>
  );
}
