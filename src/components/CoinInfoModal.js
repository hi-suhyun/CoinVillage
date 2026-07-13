import { Modal, View, Text, Image, Pressable } from "react-native";
import { coinPrice, pct, won } from "../utils/format";
import PixelButton from "./PixelButton";
import theme from "../theme";

function signedPrice(n) {
  const v = Number(n) || 0;
  return (v >= 0 ? "+" : "") + coinPrice(n);
}

function InfoRow({ label, value, color }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
      <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.sm, color: theme.colors.sub, includeFontPadding: false }}>{label}</Text>
      <Text style={{ fontFamily: theme.font.regular, fontSize: theme.size.sm, color: color || theme.colors.text }}>{value}</Text>
    </View>
  );
}

// 정원 씬의 코인 스프라이트를 탭했을 때와, 하단 코인 그리드 카드를 탭했을 때 공통으로 뜨는
// 정보 전용(거래 불가) 상세 팝업. coin: data/coins.js 항목, ticker: useTicker()의 tickers[market].
export default function CoinInfoModal({ visible, coin, ticker, holding, onClose }) {
  if (!coin) return null;
  const t = ticker || {};
  const rate = Number(t.rate) || 0;
  const up = rate >= 0;
  const accentColor = up ? theme.colors.up : theme.colors.down;

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: theme.colors.chrome,
            borderTopWidth: theme.pixel.border,
            borderLeftWidth: theme.pixel.border,
            borderRightWidth: theme.pixel.border,
            borderColor: theme.colors.ink,
            borderTopLeftRadius: theme.pixel.radiusRound,
            borderTopRightRadius: theme.pixel.radiusRound,
            padding: theme.spacing.lg,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: theme.spacing.md }}>
            <Image source={coin.sprite} style={{ width: 48, height: 48, marginRight: theme.spacing.md }} resizeMode="contain" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.lg, color: theme.colors.text, includeFontPadding: false }}>
                {coin.name}
              </Text>
              <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.xs, color: theme.colors.sub, includeFontPadding: false }}>
                {coin.nick}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "baseline", marginBottom: theme.spacing.md }}>
            <Text style={{ fontFamily: theme.font.bold, fontSize: theme.size.xl, color: theme.colors.text }}>{coinPrice(t.price)}</Text>
            <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.sm, color: accentColor, marginLeft: 8, includeFontPadding: false }}>
              {t.changePrice !== undefined ? `${signedPrice(t.changePrice)} ` : ""}({pct(rate)})
            </Text>
          </View>

          <InfoRow label="시가" value={t.openingPrice !== undefined ? coinPrice(t.openingPrice) : "-"} />
          <InfoRow label="고가" value={t.highPrice !== undefined ? coinPrice(t.highPrice) : "-"} color={theme.colors.up} />
          <InfoRow label="저가" value={t.lowPrice !== undefined ? coinPrice(t.lowPrice) : "-"} color={theme.colors.down} />
          <InfoRow label="전일 종가" value={t.prevClosingPrice !== undefined ? coinPrice(t.prevClosingPrice) : "-"} />
          <InfoRow
            label="52주 최고"
            value={t.high52w !== undefined ? `${coinPrice(t.high52w)} (${t.high52wDate || "-"})` : "-"}
          />
          <InfoRow
            label="52주 최저"
            value={t.low52w !== undefined ? `${coinPrice(t.low52w)} (${t.low52wDate || "-"})` : "-"}
          />
          <InfoRow label="24시간 거래대금" value={t.accTradePrice24h !== undefined ? won(t.accTradePrice24h) : "-"} />

          <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: theme.spacing.sm }} />

          {holding ? (
            <InfoRow label="보유 수량" value={`${holding.qty} ${coin.nick}`} />
          ) : (
            <InfoRow label="보유 여부" value="보유하지 않음" />
          )}

          <PixelButton title="닫기" onPress={onClose} color={theme.colors.border} textColor={theme.colors.text} style={{ marginTop: theme.spacing.md }} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
