import { useState } from "react";
import { View, Text, Image, Pressable } from "react-native";
import { coinPrice, pct } from "../utils/format";
import PixelButton from "./PixelButton";
import MarqueeText from "./MarqueeText";
import theme from "../theme";

// 행 전체가 눌러서 코인 정보를 여는 박스이므로 PixelButton과 동일한 눌림 그림자 효과를 준다.
// (매수/매도 버튼은 별도 Pressable이라 자기 그림자를 따로 갖는다.)
export default function CoinRow({ coin, price, rate, onBuy, onSell, onInfo }) {
  const [pressed, setPressed] = useState(false);
  const up = (Number(rate) || 0) >= 0;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
        backgroundColor: theme.colors.card,
        borderWidth: theme.pixel.border,
        borderColor: theme.colors.ink,
        borderRadius: theme.pixel.radiusRound,
        boxShadow: pressed ? "0px 0px 0px transparent" : `${theme.pixel.shadow}px ${theme.pixel.shadow}px 0px ${theme.colors.ink}`,
        transform: pressed ? [{ translateX: theme.pixel.shadow }, { translateY: theme.pixel.shadow }] : [],
      }}
    >
      <Pressable
        onPress={onInfo}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={{ flex: 1, flexDirection: "row", alignItems: "center", minWidth: 0 }}
      >
        <Image source={coin.sprite} style={{ width: 64, height: 64, marginRight: theme.spacing.md }} resizeMode="contain" />
        <View style={{ flex: 1, minWidth: 0, marginRight: theme.spacing.sm }}>
          <View style={{ flexDirection: "row", alignItems: "baseline" }}>
            <MarqueeText
              text={coin.name}
              style={{ flexShrink: 1 }}
              textStyle={{ fontFamily: theme.font.pixel, fontSize: theme.size.sm, color: theme.colors.text, includeFontPadding: false }}
            />
            <Text numberOfLines={1} style={{ fontFamily: theme.font.pixel, fontSize: theme.size.xs, color: theme.colors.sub, marginLeft: 6, includeFontPadding: false }}>{coin.nick}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: 3 }}>
            <Text numberOfLines={1} style={{ flexShrink: 1, fontFamily: theme.font.regular, color: theme.colors.text }}>{coinPrice(price)}</Text>
            <Text numberOfLines={1} style={{ fontFamily: theme.font.pixel, fontSize: theme.size.xs, color: up ? theme.colors.up : theme.colors.down, marginLeft: 6, includeFontPadding: false }}>{pct(rate)}</Text>
          </View>
        </View>
      </Pressable>
      <PixelButton title="매수" onPress={onBuy} color={theme.colors.up} small style={{ marginRight: 8 }} />
      <PixelButton title="매도" onPress={onSell} color={theme.colors.down} small />
    </View>
  );
}
