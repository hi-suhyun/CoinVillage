import { View, Text, TextInput } from "react-native";
import theme from "../theme";

export default function Field({ label, hint, error, style, ...props }) {
  return (
    <View style={{ marginBottom: theme.spacing.md }}>
      <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.sm, color: theme.colors.text, marginBottom: theme.spacing.xs, includeFontPadding: false }}>
        {label}
      </Text>
      <TextInput
        placeholderTextColor={theme.colors.sub}
        style={[
          {
            borderWidth: 2,
            borderColor: error ? theme.colors.up : theme.colors.ink,
            borderRadius: theme.pixel.radiusRound,
            padding: theme.spacing.md,
            fontFamily: theme.font.regular,
            color: theme.colors.text,
            backgroundColor: "#fff",
          },
          style,
        ]}
        {...props}
      />
      {error ? (
        <Text style={{ color: theme.colors.up, fontFamily: theme.font.regular, marginTop: 4 }}>{error}</Text>
      ) : hint ? (
        <Text style={{ color: theme.colors.sub, fontFamily: theme.font.regular, marginTop: 4 }}>{hint}</Text>
      ) : null}
    </View>
  );
}
