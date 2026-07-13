import { Modal, Pressable, View, Text } from "react-native";
import theme from "../theme";
export default function ThinkingTooltip({ visible, term, desc, onClose }) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.25)", alignItems: "center", justifyContent: "center" }}>
        <View style={{ maxWidth: 300, backgroundColor: "#fff", borderRadius: theme.radius.lg, padding: theme.spacing.lg, borderWidth: 2, borderColor: theme.colors.brand }}>
          <Text style={{ fontFamily: theme.font.bold, color: theme.colors.brand, fontSize: 16, marginBottom: 8 }}>{term}</Text>
          <Text style={{ fontFamily: theme.font.regular, color: theme.colors.text, lineHeight: 22 }}>{desc}</Text>
        </View>
      </Pressable>
    </Modal>
  );
}
