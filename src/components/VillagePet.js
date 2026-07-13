import { useEffect, useRef, useState } from "react";
import { Animated, Image, Pressable, Text, View } from "react-native";
import { petStage } from "../utils/petGrowth";
import { won } from "../utils/format";
import theme from "../theme";

const SPEED = 60; // px/s — 걷는 속도
const FACE_SIZE = { 1: 34, 2: 46, 3: 60 };

// 마을 마당을 자유롭게 걸어다니는 코인 펫. 목적지까지 거리에 비례한 시간으로 이동하고,
// 이동 중일 때만 통통 튀는 걸음 바운스를 줘서 "떠다님"이 아니라 "걸음"처럼 보이게 한다.
// exclusions: [{x,y,r}] — 주인공/거래소 집 위로는 걸어가지 않도록 목적지 후보에서 제외.
export default function VillagePet({ coin, value, boundsWidth, boundsHeight, exclusions, onPress }) {
  const stage = petStage(value);
  const size = FACE_SIZE[stage];
  const pos = useRef(new Animated.ValueXY({ x: 10, y: (boundsHeight || 200) * 0.3 })).current;
  const flip = useRef(new Animated.Value(1)).current;
  const bob = useRef(new Animated.Value(0)).current;
  const curPos = useRef({ x: 10, y: (boundsHeight || 200) * 0.3 });
  const [walking, setWalking] = useState(false);

  useEffect(() => {
    if (!boundsWidth || !boundsHeight) return;
    let mounted = true;
    const timers = [];

    function pickTarget() {
      const topPad = boundsHeight * 0.1;
      const bottomPad = size + 46; // 이름표/가격표까지 잘리지 않을 여유
      for (let i = 0; i < 24; i++) {
        const x = 6 + Math.random() * Math.max(10, boundsWidth - size - 12);
        const y = topPad + Math.random() * Math.max(10, boundsHeight - topPad - bottomPad);
        const blocked = (exclusions || []).some((z) => Math.hypot(x - z.x, y - z.y) < z.r);
        if (!blocked) return { x, y };
      }
      return { x: 6, y: topPad };
    }

    function step() {
      if (!mounted) return;
      const target = pickTarget();
      const dist = Math.hypot(target.x - curPos.current.x, target.y - curPos.current.y);
      const duration = Math.max(700, Math.min(3400, (dist / SPEED) * 1000));

      flip.setValue(target.x < curPos.current.x ? -1 : 1);
      setWalking(true);
      Animated.timing(pos, { toValue: target, duration, useNativeDriver: true }).start(({ finished }) => {
        if (!finished || !mounted) return;
        curPos.current = target;
        setWalking(false);
        const pause = 700 + Math.random() * 1600;
        timers.push(setTimeout(step, pause));
      });
    }
    step();

    return () => {
      mounted = false;
      timers.forEach(clearTimeout);
      pos.stopAnimation();
    };
  }, [boundsWidth, boundsHeight]);

  useEffect(() => {
    const seq = walking
      ? [
          Animated.timing(bob, { toValue: -5, duration: 150, useNativeDriver: true }),
          Animated.timing(bob, { toValue: 0, duration: 150, useNativeDriver: true }),
        ]
      : [
          Animated.timing(bob, { toValue: -2, duration: 1300, useNativeDriver: true }),
          Animated.timing(bob, { toValue: 0, duration: 1300, useNativeDriver: true }),
        ];
    const loop = Animated.loop(Animated.sequence(seq));
    loop.start();
    return () => loop.stop();
  }, [walking]);

  return (
    <Animated.View style={{ position: "absolute", transform: pos.getTranslateTransform() }}>
      <Pressable onPress={onPress} hitSlop={8} style={{ alignItems: "center" }}>
        <Animated.View style={{ transform: [{ translateY: bob }, { scaleX: flip }] }}>
          <Image source={coin.sprite} style={{ width: size, height: size }} resizeMode="contain" />
        </Animated.View>
        <Text style={styles.tag}>{coin.nick}</Text>
        <Text style={styles.val}>{won(value)}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = {
  tag: {
    fontFamily: theme.font.pixel, fontSize: 9, color: theme.colors.ink,
    backgroundColor: "rgba(255,255,255,0.8)", borderRadius: 6,
    paddingHorizontal: 5, paddingVertical: 1, marginTop: 3, includeFontPadding: false,
  },
  val: {
    fontFamily: theme.font.pixel, fontSize: 9.5, fontWeight: "700", color: theme.colors.ink,
    backgroundColor: "#FFF2CF", borderWidth: 1.5, borderColor: theme.colors.ink, borderRadius: 6,
    paddingHorizontal: 5, paddingVertical: 1, marginTop: 2, includeFontPadding: false,
  },
};
