import { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { GLOSSARY } from "../data/glossary";
import ThinkingTooltip from "./ThinkingTooltip";
import theme from "../theme";
export default function GlossaryBar() {
  const [sel, setSel] = useState(null);
  return (
    <View style={{ marginTop: theme.spacing.md }}>
      <Text style={{ fontFamily: theme.font.pixel, fontSize: 12, color: theme.colors.sub, marginBottom: 8, includeFontPadding: false }}>코인 용어 — 한 줄 사전</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {GLOSSARY.map((g) => (
          <Pressable key={g.term} onPress={() => setSel(g)}
            style={{ paddingVertical: 6, paddingHorizontal: 12, backgroundColor: "#fff", borderRadius: theme.pixel.radiusRound, borderWidth: 2, borderColor: theme.colors.ink, marginRight: 8 }}>
            <Text style={{ fontFamily: theme.font.pixel, fontSize: 11, color: theme.colors.brand, includeFontPadding: false }}>{g.term}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <ThinkingTooltip visible={!!sel} term={sel?.term} desc={sel?.desc} onClose={() => setSel(null)} />
    </View>
  );
}
