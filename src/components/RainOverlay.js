import { View } from "react-native";

export default function RainOverlay({ width, height }) {
  const drops = Array.from({ length: 24 });
  return (
    <View pointerEvents="none" style={{ position: "absolute", left: 0, top: 0, width, height }}>
      {drops.map((_, i) => (
        <View key={i} style={{ position: "absolute", left: (i * 53) % width, top: (i * 37) % (height - 20), width: 2, height: 10, backgroundColor: "rgba(180,200,255,0.7)", borderRadius: 1 }} />
      ))}
    </View>
  );
}
