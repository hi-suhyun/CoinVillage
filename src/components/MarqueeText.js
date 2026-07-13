import { useEffect, useRef, useState } from "react";
import { Animated, View, Text } from "react-native";

const GAP = 24; // 반복 사이 간격(px)

// 컨테이너보다 넓어 다 안 보이는 텍스트를 좌로 무한 스크롤해 결국 전체 내용이 보이게 한다.
// 화면에 보이지 않는 측정용 Text를 절대위치(position:absolute)로 따로 둬서, 부모의
// flex/축소 계산과 전혀 무관하게 콘텐츠의 "진짜" 자연 폭을 정확히 잰다.
export default function MarqueeText({ text, style, textStyle, speed = 34 }) {
  const [containerW, setContainerW] = useState(0);
  const [textW, setTextW] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  const animRef = useRef(null);

  const overflowing = containerW > 0 && textW > containerW;

  useEffect(() => {
    animRef.current?.stop();
    if (overflowing) {
      const distance = textW + GAP;
      x.setValue(0);
      animRef.current = Animated.loop(
        Animated.timing(x, {
          toValue: -distance,
          duration: (distance / speed) * 1000,
          useNativeDriver: true,
        })
      );
      animRef.current.start();
    } else {
      x.setValue(0);
    }
    return () => animRef.current?.stop();
  }, [overflowing, textW, text]);

  return (
    <View style={[{ overflow: "hidden" }, style]} onLayout={(e) => setContainerW(e.nativeEvent.layout.width)}>
      {/* 화면에는 보이지 않는 측정용 텍스트. absolute라 부모 크기 계산에 전혀 관여하지
          않고, 부모가 어떤 크기로 잡히든 순수하게 자기 콘텐츠 크기로만 측정된다. */}
      <Text
        numberOfLines={1}
        onLayout={(e) => setTextW(e.nativeEvent.layout.width)}
        style={[textStyle, { position: "absolute", opacity: 0 }]}
      >
        {text}
      </Text>

      {overflowing ? (
        <Animated.View style={{ flexDirection: "row", alignSelf: "flex-start", transform: [{ translateX: x }] }}>
          <Text numberOfLines={1} style={textStyle}>
            {text}
          </Text>
          <Text numberOfLines={1} style={[textStyle, { marginLeft: GAP }]}>
            {text}
          </Text>
        </Animated.View>
      ) : (
        <Text numberOfLines={1} style={textStyle}>
          {text}
        </Text>
      )}
    </View>
  );
}
