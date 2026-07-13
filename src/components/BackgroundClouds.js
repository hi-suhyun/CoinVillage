import { useEffect, useRef, useState } from "react";
import { Animated, View } from "react-native";
import Cloud from "./Cloud";

const PUFF_COLOR = "rgba(255,255,255,0.55)";
const OFF_SCREEN = 140; // 구름이 화면 밖에서 시작/사라지도록 두는 여유 폭

// top(%) 전체에 고르게 퍼뜨리고, duration/delay를 조금씩 다르게 줘서
// 여러 구름이 서로 다른 속도로 자연스럽게 좌→우로 흘러가 보이게 한다.
const LAYOUT = [
  { top: "6%", scale: 0.9, duration: 26000, delay: 0 },
  { top: "18%", scale: 1.1, duration: 32000, delay: 4000 },
  { top: "30%", scale: 0.8, duration: 22000, delay: 9000 },
  { top: "42%", scale: 1.0, duration: 30000, delay: 2000 },
  { top: "55%", scale: 0.85, duration: 24000, delay: 7000 },
  { top: "68%", scale: 1.05, duration: 34000, delay: 12000 },
  { top: "80%", scale: 0.75, duration: 20000, delay: 3000 },
  { top: "92%", scale: 0.95, duration: 28000, delay: 15000 },
];

function DriftingCloud({ top, scale, duration, delay, width }) {
  const x = useRef(new Animated.Value(-OFF_SCREEN)).current;

  useEffect(() => {
    if (!width) return;
    x.setValue(-OFF_SCREEN);
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(x, { toValue: width + OFF_SCREEN, duration, useNativeDriver: true }),
        Animated.timing(x, { toValue: -OFF_SCREEN, duration: 0, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [width]);

  return (
    <Animated.View style={{ position: "absolute", top, transform: [{ translateX: x }, { scale }] }}>
      <Cloud color={PUFF_COLOR} />
    </Animated.View>
  );
}

// 정원 배경에 항상 떠 있는 반투명 구름들 — 코인이 허공에 붕 뜬 느낌을 줄이기 위한
// 기본 배경 레이어. Weather의 mood 표시용 해/구름 아이콘과는 별개로 항상 렌더되며, 좌→우로 흘러간다.
export default function BackgroundClouds() {
  const [width, setWidth] = useState(0);
  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, overflow: "hidden" }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {LAYOUT.map((c, i) => (
        <DriftingCloud key={i} {...c} width={width} />
      ))}
    </View>
  );
}
