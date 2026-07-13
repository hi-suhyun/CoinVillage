import { View } from "react-native";

export default function Sun() {
  return (
    <View style={{ width: 56, height: 56, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#FFD43B", shadowColor: "#FFD43B", shadowOpacity: 0.9, shadowRadius: 12, elevation: 6 }} />
    </View>
  );
}
