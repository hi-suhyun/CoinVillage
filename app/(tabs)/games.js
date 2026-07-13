import { useEffect, useState } from "react";
import { ScrollView, View, Text, Image } from "react-native";
import { useRouter } from "expo-router";
import { useMiniGame } from "../../src/context/MiniGameContext";
import { useIntel } from "../../src/context/IntelContext";
import { useTicker } from "../../src/hooks/useTicker";
import { slotOf } from "../../src/utils/predict";
import { MAX_TRIES } from "../../src/utils/wordle";
import { ALL_MARKETS } from "../../src/data/coins";
import PixelFrame from "../../src/components/PixelFrame";
import PixelButton from "../../src/components/PixelButton";
import PredictModal from "../../src/components/PredictModal";
import IntelModal from "../../src/components/IntelModal";
import theme from "../../src/theme";

const documentIcon = require("../../assets/icons/document.png");

function Card({ children }) {
  return (
    <PixelFrame style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.md }}>
      {children}
    </PixelFrame>
  );
}

function wordleStatus(wordle) {
  if (wordle.solved) return { text: "오늘 완료 ✓", color: theme.colors.up };
  if (wordle.failed) return { text: "오늘 실패", color: theme.colors.sub };
  if (wordle.guesses.length > 0) return { text: `진행중 (${wordle.guesses.length}/${MAX_TRIES})`, color: theme.colors.warn };
  return { text: "미도전", color: theme.colors.sub };
}

const SLOT_LABEL = { am: "오전", pm: "오후" };

export default function Games() {
  const router = useRouter();
  const { ready, points, wordle, predict, resolvePending, resetToday } = useMiniGame();
  const { ready: intelReady, rank: intelRank, points: intelPoints, readToday: intelReadToday } = useIntel();
  const [predictOpen, setPredictOpen] = useState(false);
  const [intelOpen, setIntelOpen] = useState(false);
  const { prices } = useTicker(ALL_MARKETS);

  // 예측 게임 탭을 열 때마다 정산 시각이 지난 회차가 있으면 그때의 최신가로 정산한다.
  useEffect(() => {
    resolvePending(prices);
  }, [prices]);

  if (!ready || !wordle || !predict || !intelReady) return null;

  const ws = wordleStatus(wordle);
  const slot = slotOf(Date.now());
  const round = predict[slot];
  const slotStatusText = !round ? `${SLOT_LABEL[slot]} 회차 대기중` : round.resolved ? `${SLOT_LABEL[slot]} 회차 완료` : `${SLOT_LABEL[slot]} 회차 정산 대기중`;

  return (
    <ScrollView style={{ backgroundColor: theme.colors.base }} contentContainerStyle={{ padding: theme.spacing.md }}>
      <Card>
        <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.sm, color: theme.colors.sub, includeFontPadding: false }}>
          보유 포인트
        </Text>
        <Text style={{ fontFamily: theme.font.bold, fontSize: 32, color: theme.colors.text }}>{points}P</Text>
      </Card>

      <PixelFrame style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.md }}>
        <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.md, color: theme.colors.text, marginBottom: 4, includeFontPadding: false }}>
          금융 워들
        </Text>
        <Text style={{ fontFamily: theme.font.regular, color: theme.colors.sub, marginBottom: theme.spacing.md }}>
          하루 한 번, {MAX_TRIES}번 안에 3음절 금융 단어를 맞혀보세요.
        </Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.sm, color: ws.color, includeFontPadding: false }}>{ws.text}</Text>
          <PixelButton title="플레이" onPress={() => router.push("/wordle")} color={theme.colors.brand} small />
        </View>
      </PixelFrame>

      <PixelFrame style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.md }}>
        <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.md, color: theme.colors.text, marginBottom: 4, includeFontPadding: false }}>
          시장 Up/Down 예측
        </Text>
        <Text style={{ fontFamily: theme.font.regular, color: theme.colors.sub, marginBottom: theme.spacing.md }}>
          오전/오후 하루 2회, 대장주의 등락을 예측하고 연승을 쌓아보세요.
        </Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text numberOfLines={1} style={{ flex: 1, marginRight: theme.spacing.sm, fontFamily: theme.font.pixel, fontSize: theme.size.sm, color: round && round.resolved ? theme.colors.sub : theme.colors.warn, includeFontPadding: false }}>
            {slotStatusText} · 연승 {predict.streak}
          </Text>
          <PixelButton title="플레이" onPress={() => setPredictOpen(true)} color={theme.colors.brand} small />
        </View>
      </PixelFrame>

      <PixelFrame style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.md }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
          <Image source={documentIcon} style={{ width: 18, height: 18, marginRight: 6 }} resizeMode="contain" />
          <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.md, color: theme.colors.text, includeFontPadding: false }}>
            첩보 수집
          </Text>
        </View>
        <Text style={{ fontFamily: theme.font.regular, color: theme.colors.sub, marginBottom: theme.spacing.md }}>
          하루 한 번, 코인과 투자에 대한 첩보를 확인하고 정보력을 쌓으세요.
        </Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text numberOfLines={1} style={{ flex: 1, marginRight: theme.spacing.sm, fontFamily: theme.font.pixel, fontSize: theme.size.sm, color: theme.colors.sub, includeFontPadding: false }}>
            {intelRank?.label} · 정보력 {intelPoints}P{intelReadToday ? " · 오늘 완료 ✓" : ""}
          </Text>
          <PixelButton title="플레이" onPress={() => setIntelOpen(true)} color={theme.colors.brand} small />
        </View>
      </PixelFrame>

      <Card>
        <Text style={{ fontFamily: theme.font.regular, color: theme.colors.sub, marginBottom: theme.spacing.sm }}>
          데모용: 오늘의 플레이 잠금만 초기화합니다(포인트·연승은 유지).
        </Text>
        <PixelButton title="데모: 오늘 기록 초기화" onPress={resetToday} color={theme.colors.border} textColor={theme.colors.text} small />
      </Card>

      <PredictModal visible={predictOpen} onClose={() => setPredictOpen(false)} />
      <IntelModal visible={intelOpen} onClose={() => setIntelOpen(false)} />
    </ScrollView>
  );
}
