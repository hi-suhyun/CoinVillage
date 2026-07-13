import { useState } from "react";
import { View, Text, Image, Pressable } from "react-native";
import { useIntel } from "../context/IntelContext";
import { INTEL_ENTRIES } from "../data/intel";
import IntelModal from "./IntelModal";
import PixelFrame from "./PixelFrame";
import theme from "../theme";

const documentIcon = require("../../assets/icons/document.png");

// 지금까지 모은 첩보 도감. 모은 것만 나열하고, 새로 모을 때마다 하나씩 늘어난다.
export default function IntelCollection() {
  const { collected } = useIntel();
  const [viewEntry, setViewEntry] = useState(null);
  const collectedEntries = INTEL_ENTRIES.filter((entry) => collected.includes(entry.key));

  return (
    <PixelFrame style={{ padding: theme.spacing.md, marginBottom: theme.spacing.sm }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: theme.spacing.sm }}>
        <Image source={documentIcon} style={{ width: 20, height: 20, marginRight: 6 }} resizeMode="contain" />
        <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.sm, color: theme.colors.text, includeFontPadding: false, flex: 1 }}>
          지금까지 모은 첩보
        </Text>
        <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.sm, color: theme.colors.sub, includeFontPadding: false }}>
          {collectedEntries.length}개
        </Text>
      </View>
      {collectedEntries.length === 0 ? (
        <Text style={{ fontFamily: theme.font.regular, color: theme.colors.sub }}>아직 모은 첩보가 없어요</Text>
      ) : (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {collectedEntries.map((entry) => (
            <Pressable
              key={entry.key}
              onPress={() => setViewEntry(entry)}
              style={({ pressed }) => ({
                width: 36, height: 36,
                borderRadius: theme.pixel.radiusRound,
                borderWidth: theme.pixel.border, borderColor: theme.colors.ink,
                backgroundColor: theme.colors.panel,
                alignItems: "center", justifyContent: "center",
                boxShadow: pressed ? "0px 0px 0px transparent" : `${theme.pixel.shadow}px ${theme.pixel.shadow}px 0px ${theme.colors.ink}`,
                transform: pressed ? [{ translateX: theme.pixel.shadow }, { translateY: theme.pixel.shadow }] : [],
              })}
            >
              <Text style={{ fontSize: 18 }}>{entry.emoji}</Text>
            </Pressable>
          ))}
        </View>
      )}
      <IntelModal visible={!!viewEntry} entry={viewEntry} onClose={() => setViewEntry(null)} />
    </PixelFrame>
  );
}
