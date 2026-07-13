import { useEffect, useRef } from "react";
import { Animated } from "react-native";

export default function CatPicnic({ width, railTop, sprite, onDone }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.delay(3500),
      Animated.timing(opacity, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start(() => onDone && onDone());
  }, []);
  const cats = [0.2, 0.4, 0.6, 0.8];
  return (
    <Animated.View pointerEvents="none" style={{ position: "absolute", left: 0, top: 0, width, height: railTop + 30, opacity }}>
      {cats.map((p, i) => (
        <Animated.Image key={i} source={sprite}
          style={{ position: "absolute", left: width * p - 16, top: railTop - 26, width: 32, height: 32 }} resizeMode="contain" />
      ))}
    </Animated.View>
  );
}
