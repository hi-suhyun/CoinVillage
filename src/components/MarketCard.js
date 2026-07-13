import { View, Text, Image, Pressable } from "react-native";
import { pct, compactCount } from "../utils/format";
import { toDisplay } from "../utils/decimal";
import theme from "../theme";

// 정원 화면 하단 코인 그리드용 카드: 스프라이트 + 이름/코드 + (변동률 위, 보유수량 아래).
// 보유 중인 코인만 그려지므로 "미보유" 분기는 없다. 탭하면 상세 팝업(CoinInfoModal)을 연다.
// 클릭 가능한 박스이므로 PixelButton과 동일한 눌림 그림자 효과를 준다.
export default function MarketCard({ coin, rate, qty, onPress }) {
  const up = (Number(rate) || 0) >= 0;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: "48%",
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: theme.colors.card,
        borderWidth: theme.pixel.border,
        borderColor: theme.colors.ink,
        borderRadius: theme.pixel.radiusRound,
        padding: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
        boxShadow: pressed ? "0px 0px 0px transparent" : `${theme.pixel.shadow}px ${theme.pixel.shadow}px 0px ${theme.colors.ink}`,
        transform: pressed ? [{ translateX: theme.pixel.shadow }, { translateY: theme.pixel.shadow }] : [],
      })}
    >
      <Image source={coin.sprite} style={{ width: 32, height: 32, marginRight: theme.spacing.sm }} resizeMode="contain" />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ fontFamily: theme.font.pixel, fontSize: theme.size.xs, color: theme.colors.text, includeFontPadding: false }}>
          {coin.name}
        </Text>
        <Text numberOfLines={1} style={{ fontFamily: theme.font.pixel, fontSize: 10, color: theme.colors.sub, marginTop: 2, includeFontPadding: false }}>
          {coin.nick}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.xs, color: up ? theme.colors.up : theme.colors.down, includeFontPadding: false }}>
          {pct(rate)}
        </Text>
        <Text style={{ fontFamily: theme.font.pixel, fontSize: 10, color: theme.colors.text, marginTop: 2, includeFontPadding: false }}>
          x {compactCount(qty) ?? toDisplay(qty, coin.dp)}
        </Text>
      </View>
    </Pressable>
  );
}
