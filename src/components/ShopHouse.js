import { Image, Pressable, Text, View } from "react-native";
import theme from "../theme";

const houseIcon = require("../../assets/icons/center.png");

export const SHOP_HOUSE_SIZE = { width: 92, height: 116 };

// 잔디/하늘 경계선 쪽에 서 있는 집 — 누르면 거래소 탭으로 이동한다(코인 발견+매수/매도는 거기서).
export default function ShopHouse({ onPress }) {
  return (
    <Pressable onPress={onPress} style={{ alignItems: "center" }} hitSlop={8}>
      <Image source={houseIcon} style={{ width: SHOP_HOUSE_SIZE.width, height: SHOP_HOUSE_SIZE.height }} resizeMode="contain" />
      <View
        style={{
          marginTop: -2, backgroundColor: theme.colors.card,
          borderWidth: 1.5, borderColor: theme.colors.ink, borderRadius: 5,
          paddingHorizontal: 5, paddingVertical: 1,
        }}
      >
        <Text style={{ fontFamily: theme.font.pixel, fontSize: 9, color: theme.colors.ink, includeFontPadding: false }}>거래소</Text>
      </View>
    </Pressable>
  );
}
