import { useMemo, useState } from "react";
import { Modal, View, Text, TextInput, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { D, mul, div, trunc, toDisplay, cmp, gte } from "../utils/decimal";
import { won, coinPrice } from "../utils/format";
import PixelButton from "./PixelButton";
import theme from "../theme";

function formatTime(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function ReceiptRow({ label, value, color }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
      <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.sm, color: theme.colors.sub, includeFontPadding: false }}>{label}</Text>
      <Text style={{ fontFamily: theme.font.bold, fontSize: theme.size.sm, color: color || theme.colors.text }}>{value}</Text>
    </View>
  );
}

// 체결 직후 보여주는 영수증 화면. "실제 업비트 시세로 체결됐다"는 걸 숫자로 증명해
// 게임 내 매수/매도가 그냥 눈속임이 아니라는 신뢰를 준다.
function Receipt({ coin, side, trade, offline, onDone }) {
  const accent = side === "buy" ? theme.colors.up : theme.colors.down;
  return (
    <View>
      <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.xl, color: accent, marginBottom: 4, includeFontPadding: false }}>
        체결 완료
      </Text>
      <Text
        style={{
          fontFamily: theme.font.pixel,
          fontSize: theme.size.xs,
          color: offline ? theme.colors.warn : theme.colors.up,
          marginBottom: theme.spacing.md,
          includeFontPadding: false,
        }}
      >
        {offline ? "⚠ 오프라인 — 목업 시세로 체결됨" : "✓ 업비트 실시간 시세로 체결됨"}
      </Text>

      <View style={{ height: 1, backgroundColor: theme.colors.border, marginBottom: theme.spacing.md }} />

      <ReceiptRow label="코인" value={`${coin.name} (${coin.nick})`} />
      <ReceiptRow label="거래 구분" value={side === "buy" ? "매수" : "매도"} color={accent} />
      <ReceiptRow label="체결 수량" value={`${toDisplay(trade.qty, coin.dp)} ${coin.nick}`} />
      <ReceiptRow label="체결가" value={coinPrice(trade.price)} />
      <ReceiptRow label="체결 총액" value={won(trade.amount)} />
      <ReceiptRow label="체결 시각" value={formatTime(trade.ts)} />

      <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: theme.spacing.sm }} />

      <PixelButton title="확인" onPress={onDone} color={accent} style={{ marginTop: theme.spacing.sm }} />
    </View>
  );
}

// coin: { market, name, nick, dp }, side: 'buy'|'sell', price: string, holdingQty: string|null
export default function TradeModal({ visible, coin, side, price, holdingQty, cashKRW, offline, onClose, onConfirm }) {
  const [qty, setQty] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [receipt, setReceipt] = useState(null);

  const total = useMemo(() => {
    if (!coin || !qty || isNaN(Number(qty))) return "0";
    return mul(qty, price);
  }, [coin, qty, price]);

  if (!coin) return null;

  // 입력 가능한 최대 수량 안내: 매수는 가용현금으로 살 수 있는 최대치, 매도는 보유 수량.
  const maxQty = side === "buy"
    ? (cmp(price, "0") > 0 ? toDisplay(div(cashKRW, price), coin.dp) : "0")
    : toDisplay(holdingQty || "0", coin.dp);

  function onQtyChange(t) {
    // 부동소수점 왜곡 방지: 문자열 그대로 받고 마켓 dp로 절사만
    const cleaned = t.replace(/[^0-9.]/g, "");
    setQty(cleaned);
  }
  function fillMax() {
    if (side === "sell" && holdingQty) setQty(toDisplay(holdingQty, coin.dp));
  }
  async function confirm() {
    setErr("");
    if (!qty || cmp(qty, "0") <= 0) { setErr("수량을 입력하세요"); return; }
    const q = trunc(qty, coin.dp);
    if (cmp(q, "0") <= 0) { setErr("수량이 너무 작습니다"); return; }
    if (side === "buy" && cmp(mul(q, price), cashKRW) > 0) { setErr("가용현금이 부족합니다"); return; }
    if (side === "sell" && !gte(holdingQty || "0", q)) { setErr("보유 수량을 초과했습니다"); return; }
    const r = await onConfirm({ qty: q, password: pw });
    if (!r.ok) { setErr(r.error || "체결에 실패했습니다"); return; }
    setQty(""); setPw("");
    setReceipt(r.wallet.trades[0]);
  }

  function closeAll() {
    setReceipt(null);
    onClose();
  }

  const accent = side === "buy" ? theme.colors.up : theme.colors.down;
  const inputStyle = {
    borderWidth: 2, borderColor: theme.colors.ink, borderRadius: theme.pixel.radiusRound,
    padding: theme.spacing.md, fontFamily: theme.font.regular, backgroundColor: "#fff",
  };

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={closeAll}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          keyboardShouldPersistTaps="always"
          style={{ flexGrow: 0, backgroundColor: "#fff", borderTopWidth: theme.pixel.border, borderLeftWidth: theme.pixel.border, borderRightWidth: theme.pixel.border, borderColor: theme.colors.ink }}
          contentContainerStyle={{ padding: theme.spacing.lg }}
        >
          {receipt ? (
            <Receipt coin={coin} side={side} trade={receipt} offline={offline} onDone={closeAll} />
          ) : (
            <>
              <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.xl, color: accent, marginBottom: 4, includeFontPadding: false }}>
                {coin.name} {side === "buy" ? "매수" : "매도"}
              </Text>
              <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.sm, color: theme.colors.sub, marginBottom: theme.spacing.md, includeFontPadding: false }}>
                현재가 {coinPrice(price)} · {coin.nick}
              </Text>

              <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.sm, marginBottom: 4, includeFontPadding: false }}>수량</Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: theme.spacing.md }}>
                <TextInput value={qty} onChangeText={onQtyChange} keyboardType="decimal-pad" placeholder={`최대 ${maxQty}`}
                  placeholderTextColor={theme.colors.sub} style={[inputStyle, { flex: 1 }]} />
                {side === "sell" && (
                  <PixelButton title="전량" onPress={fillMax} color={theme.colors.down} small style={{ marginLeft: 8 }} />
                )}
              </View>
              {side === "sell" && holdingQty ? (
                <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.sm, color: theme.colors.sub, marginBottom: theme.spacing.md, includeFontPadding: false }}>보유 {toDisplay(holdingQty, coin.dp)} {coin.nick}</Text>
              ) : null}

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: theme.spacing.md }}>
                <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.sm, color: theme.colors.sub, includeFontPadding: false }}>총 금액</Text>
                <Text style={{ fontFamily: theme.font.bold, color: theme.colors.text, fontSize: theme.size.md }}>{won(total)}</Text>
              </View>

              <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.sm, marginBottom: 4, includeFontPadding: false }}>결제 PIN</Text>
              <TextInput value={pw} onChangeText={setPw} secureTextEntry keyboardType="number-pad" maxLength={6} placeholder="가입시 설정한 PIN"
                placeholderTextColor={theme.colors.sub} style={[inputStyle, { marginBottom: theme.spacing.md }]} />

              {err ? <Text style={{ color: theme.colors.up, fontFamily: theme.font.regular, marginBottom: 8 }}>{err}</Text> : null}
              <View style={{ flexDirection: "row" }}>
                <PixelButton title="취소" onPress={closeAll} color={theme.colors.border} textColor={theme.colors.text} style={{ flex: 1, marginRight: 8 }} />
                <PixelButton title={side === "buy" ? "매수 체결" : "매도 체결"} onPress={confirm} color={accent} style={{ flex: 2 }} />
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
