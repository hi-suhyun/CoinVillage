import { useEffect } from "react";
import { Modal, View, Text, Image, Pressable } from "react-native";
import { useMiniGame } from "../context/MiniGameContext";
import { useTicker } from "../hooks/useTicker";
import { leadingCoin, slotOf, voteStats, DEFENSE_COST } from "../utils/predict";
import { COINS, ALL_MARKETS } from "../data/coins";
import { pct, ratioPct } from "../utils/format";
import PixelButton from "./PixelButton";
import theme from "../theme";

const SLOT_LABEL = { am: "오전", pm: "오후" };

// round.resolveAt을 "오늘 12:00 공개" / "내일 00:00 공개"처럼 사람이 읽을 문구로.
function resolveTimeLabel(ts) {
  const d = new Date(ts);
  const sameDay = d.toDateString() === new Date().toDateString();
  const hh = String(d.getHours()).padStart(2, "0");
  return `${sameDay ? "오늘" : "내일"} ${hh}:00 결과 공개`;
}

function RoundStatus({ round }) {
  if (!round) {
    return (
      <Text style={{ fontFamily: theme.font.regular, color: theme.colors.sub }}>아직 참여하지 않았어요.</Text>
    );
  }
  if (!round.resolved) {
    return (
      <Text style={{ fontFamily: theme.font.regular, color: theme.colors.warn }}>
        예측 {round.pick === "up" ? "상승" : "하락"} 참여 완료 · {resolveTimeLabel(round.resolveAt)}
      </Text>
    );
  }
  return (
    <View>
      <Text
        style={{
          fontFamily: theme.font.pixel, fontSize: theme.size.sm,
          color: round.win ? theme.colors.up : theme.colors.sub, includeFontPadding: false,
        }}
      >
        {round.win ? "예측 성공! 🎉" : round.usedDefense ? "실패했지만 방어권으로 연승 유지" : "예측 실패"}
      </Text>
      <Text style={{ fontFamily: theme.font.regular, color: theme.colors.sub }}>
        실제 변동률 {pct(round.rate)} · 예측 {round.pick === "up" ? "상승" : "하락"}
      </Text>
    </View>
  );
}

// 참여를 마친 회차에만(herding 방지) 보여주는 상승/하락 투표 현황. 백엔드가 없어 실제 집계는
// 불가능하므로 회차 시드로 그럴듯하게 흉내낸다(utils/predict.voteStats) — 초보자에게 "다른
// 사람들은 어떻게 예측했는지" 참고 정보를 준다.
function VoteStatusBar({ round, slot, rate }) {
  const stats = voteStats(round.day, slot, round.entryMarket, rate);
  return (
    <View style={{ marginTop: 6 }}>
      <View
        style={{
          flexDirection: "row", height: 14, borderWidth: 2, borderColor: theme.colors.ink,
          borderRadius: theme.pixel.radiusRound, overflow: "hidden", marginBottom: 4,
        }}
      >
        <View style={{ flex: Math.max(0.0001, stats.up), backgroundColor: theme.colors.up }} />
        <View style={{ flex: Math.max(0.0001, stats.down), backgroundColor: theme.colors.down }} />
      </View>
      <Text style={{ fontFamily: theme.font.regular, fontSize: theme.size.xs, color: theme.colors.sub }}>
        상승 {ratioPct(stats.up)} · 하락 {ratioPct(stats.down)} · {stats.participants}명 참여 · 당신의 선택: {round.pick === "up" ? "상승" : "하락"}
      </Text>
    </View>
  );
}

export default function PredictModal({ visible, onClose }) {
  const { points, predict, submitPrediction, resolvePending, buyDefense } = useMiniGame();
  const { prices, rates, tickers } = useTicker(ALL_MARKETS);

  // 화면을 여는 순간 정산 시각이 지난 회차가 있으면 그때의 최신가로 정산한다.
  useEffect(() => {
    resolvePending(prices);
  }, [prices]);

  if (!predict) return null;
  const coin = leadingCoin(tickers, COINS);
  const slot = slotOf(Date.now());
  const canPick = coin && !predict[slot];
  const priceReady = coin && Number(prices[coin.market]) > 0;

  function pick(dir) {
    if (!priceReady) return;
    submitPrediction(dir, Number(prices[coin.market]), coin.market);
  }

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: theme.colors.chrome,
            borderTopWidth: theme.pixel.border, borderLeftWidth: theme.pixel.border, borderRightWidth: theme.pixel.border,
            borderColor: theme.colors.ink,
            borderTopLeftRadius: theme.pixel.radiusRound, borderTopRightRadius: theme.pixel.radiusRound,
            padding: theme.spacing.lg,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: theme.spacing.sm }}>
            <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.lg, color: theme.colors.brand, includeFontPadding: false }}>
              시장 Up/Down 예측
            </Text>
            <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.sm, color: theme.colors.sub, includeFontPadding: false }}>
              {points}P 보유
            </Text>
          </View>
          <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.sm, color: theme.colors.sub, marginBottom: theme.spacing.md, includeFontPadding: false }}>
            연승 {predict.streak} · 방어권 {predict.tickets}개
          </Text>

          {["am", "pm"].map((s) => (
            <View key={s} style={{ marginBottom: theme.spacing.md }}>
              <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.sm, color: theme.colors.text, marginBottom: 4, includeFontPadding: false }}>
                {SLOT_LABEL[s]} 회차
              </Text>
              <RoundStatus round={predict[s]} />
              {predict[s] && <VoteStatusBar round={predict[s]} slot={s} rate={rates[predict[s].entryMarket]} />}
            </View>
          ))}

          {canPick && (
            <>
              <View style={{ alignItems: "center", marginBottom: theme.spacing.lg }}>
                <Image source={coin.sprite} style={{ width: 64, height: 64, marginBottom: 8 }} resizeMode="contain" />
                <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.md, color: theme.colors.text, includeFontPadding: false }}>
                  오늘의 대장주: {coin.name}
                </Text>
                <Text style={{ fontFamily: theme.font.regular, color: theme.colors.sub, marginTop: 4 }}>
                  {SLOT_LABEL[slot]} 회차 마감까지, 오를까요 내릴까요?
                </Text>
              </View>
              <View style={{ flexDirection: "row", marginBottom: theme.spacing.md }}>
                <PixelButton title="📈 상승" onPress={() => pick("up")} color={theme.colors.up} disabled={!priceReady} style={{ flex: 1, marginRight: 8 }} />
                <PixelButton title="📉 하락" onPress={() => pick("down")} color={theme.colors.down} disabled={!priceReady} style={{ flex: 1 }} />
              </View>
            </>
          )}

          <PixelButton
            title={`연승 방어권 구매 (${DEFENSE_COST}P)`}
            onPress={buyDefense}
            color={theme.colors.warn}
            disabled={points < DEFENSE_COST}
            style={{ marginBottom: 8 }}
          />
          <PixelButton title="닫기" onPress={onClose} color={theme.colors.border} textColor={theme.colors.text} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
