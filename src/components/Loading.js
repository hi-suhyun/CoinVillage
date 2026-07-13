import { View, ActivityIndicator } from "react-native";
import theme from "../theme";

export default function Loading() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.sky }}>
      <ActivityIndicator color={theme.colors.brand} />
    </View>
  );
}
