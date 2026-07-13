import { useEffect, useRef } from "react";
import { Animated, Image, View } from "react-native";

const SIZE = 128;

// 마을 중앙에 서 있는 주인공(플레이어) — 배회하지 않고 제자리에서 숨쉬듯 살짝 위아래로 움직인다.
export default function VillageAvatar({ stage }) {
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: -3, duration: 1500, useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={{ alignItems: "center" }} pointerEvents="none">
      <Animated.View style={{ transform: [{ translateY: bob }] }}>
        <Image source={stage.sprite} style={{ width: SIZE, height: SIZE }} resizeMode="contain" />
      </Animated.View>
      <View style={{ width: SIZE * 0.6, height: 12, borderRadius: 6, backgroundColor: "rgba(0,0,0,0.2)", marginTop: -10 }} />
    </View>
  );
}

export const VILLAGE_AVATAR_SIZE = SIZE;
