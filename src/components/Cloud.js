import { View } from "react-native";

export default function Cloud({ color = "#6B7280" }) {
  return (
    <View style={{ width: 80, height: 44, justifyContent: "center" }}>
      <View style={{ position: "absolute", left: 8, top: 14, width: 64, height: 26, borderRadius: 13, backgroundColor: color }} />
      <View style={{ position: "absolute", left: 18, top: 2, width: 30, height: 30, borderRadius: 15, backgroundColor: color }} />
      <View style={{ position: "absolute", left: 40, top: 6, width: 26, height: 26, borderRadius: 13, backgroundColor: color }} />
    </View>
  );
}
