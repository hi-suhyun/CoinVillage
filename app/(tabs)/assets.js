import { useState } from "react";
import { ScrollView, View, Text, Alert, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useTicker } from "../../src/hooks/useTicker";
import { useWallet } from "../../src/context/WalletContext";
import { useLeagueStandings } from "../../src/hooks/useLeagueStandings";
import { totalAssets, limitUsage, holdingRatios } from "../../src/utils/wallet";
import { ALL_MARKETS } from "../../src/data/coins";
import { won, ratioPct } from "../../src/utils/format";
import { MAX_LIMIT } from "../../src/utils/auth";
import RatioBar from "../../src/components/RatioBar";
import PixelFrame from "../../src/components/PixelFrame";
import PixelButton from "../../src/components/PixelButton";
import Field from "../../src/components/Field";
import StopLossModal from "../../src/components/StopLossModal";
import theme from "../../src/theme";

const PALETTE = ["#E03E3E", "#1565C0", "#7BBF53", "#D97706", "#093687", "#8B5CF6", "#999999"];
const WEIGHT_LABEL = { small: "소형 리그", mid: "중형 리그", large: "대형 리그" };

function Card({ children }) {
  return (
    <PixelFrame style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.md }}>
      {children}
    </PixelFrame>
  );
}

export default function Assets() {
  const router = useRouter();
  const { prices } = useTicker(ALL_MARKETS);
  const { wallet, setLimit } = useWallet();
  const leagueInfo = useLeagueStandings();
  const [limitInput, setLimitInput] = useState("");
  const [stopLossMarket, setStopLossMarket] = useState(null);
  if (!wallet) return null;

  const total = totalAssets(wallet, prices);
  const usage = limitUsage(wallet);
  const ratios = holdingRatios(wallet, prices);
  const hasLimit = Number(wallet.initialLimit) > 0;
  const hasActivity = Object.keys(wallet.holdings).length > 0 || wallet.trades.length > 0;

  function applyLimit() {
    const n = Number(limitInput);
    if (!limitInput || !isFinite(n) || n <= 0) return;
    if (hasLimit && hasActivity) {
      Alert.alert(
        "투자 한도 재설정",
        "한도를 재설정하면 보유 코인과 거래 내역이 모두 초기화됩니다. 계속할까요?",
        [
          { text: "취소", style: "cancel" },
          { text: "재설정", style: "destructive", onPress: async () => { await setLimit(n); setLimitInput(""); } },
        ]
      );
    } else {
      setLimit(n);
      setLimitInput("");
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.base }}
      contentContainerStyle={{ padding: theme.spacing.md }}
    >
      {/* 블록 ①: 투자 한도 설정/재설정 + 한도 사용률. 가입 시가 아니라 여기서 직접 설정한다. */}
      <Card>
        {hasLimit ? (
          <>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: theme.spacing.md,
              }}
            >
              <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.sm, color: theme.colors.sub, includeFontPadding: false }}>투자 한도</Text>
              <Text style={{ fontFamily: theme.font.bold, color: theme.colors.text }}>
                {won(wallet.initialLimit)}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.sm, color: theme.colors.sub, includeFontPadding: false }}>
                한도 사용률
              </Text>
              <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.sm, color: theme.colors.brand, includeFontPadding: false }}>
                {Math.round(usage * 100)}%
              </Text>
            </View>
            <RatioBar ratio={usage} />
          </>
        ) : (
          <Text style={{ fontFamily: theme.font.regular, color: theme.colors.sub, marginBottom: theme.spacing.sm }}>
            아직 투자 한도가 설정되지 않았습니다. 한도를 설정하면 그 금액이 가용현금으로 채워집니다.
          </Text>
        )}
        <View style={{ marginTop: theme.spacing.md }}>
          <Field
            label={hasLimit ? "한도 재설정 (원)" : "투자 한도 설정 (원)"}
            value={limitInput}
            onChangeText={setLimitInput}
            keyboardType="number-pad"
            placeholder={`최대 ${MAX_LIMIT.toLocaleString()}원`}
          />
          <PixelButton title={hasLimit ? "재설정" : "설정하기"} onPress={applyLimit} color={theme.colors.brand} />
        </View>
      </Card>

      {/* 블록 ②: 가용현금(위 작게, sub 색) + 총자산(아래 볼드 large) — 한 카드에 통합 */}
      <Card>
        <Text style={{ color: theme.colors.sub, fontSize: theme.size.sm }}>
          <Text style={{ fontFamily: theme.font.pixel, includeFontPadding: false }}>가용현금  </Text>
          <Text style={{ fontFamily: theme.font.regular }}>{won(wallet.cashKRW)}</Text>
        </Text>
        <Text style={{ marginTop: 4 }}>
          <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.md, color: theme.colors.sub, includeFontPadding: false }}>총 자산  </Text>
          <Text style={{ fontFamily: theme.font.bold, fontSize: 26, color: theme.colors.text }}>{won(total)}</Text>
        </Text>
      </Card>

      {/* 블록 ③: 리그 요약 — 탭하면 리그 탭으로 이동 */}
      {leagueInfo.ready && leagueInfo.hasLimit && (
        <Pressable onPress={() => router.push("/(tabs)/league")}>
          <Card>
            {leagueInfo.needsNickname ? (
              <>
                <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.sm, color: theme.colors.text, includeFontPadding: false }}>
                  리그 참가하기
                </Text>
                <Text style={{ fontFamily: theme.font.regular, color: theme.colors.sub, marginTop: 4 }}>
                  닉네임을 정하고 다른 투자자들과 순위를 겨뤄보세요. 탭해서 시작하기.
                </Text>
              </>
            ) : (
              <>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: theme.spacing.sm }}>
                  <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.md, color: theme.colors.text, includeFontPadding: false }}>
                    {WEIGHT_LABEL[leagueInfo.weightClass]}
                  </Text>
                  <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.sm, color: theme.colors.sub, includeFontPadding: false }}>
                    D-{leagueInfo.daysLeft}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.sm, color: theme.colors.sub, includeFontPadding: false }}>
                    {leagueInfo.mine.rank}위 / {leagueInfo.standings.length}명
                  </Text>
                  <Text style={{ fontFamily: theme.font.bold, fontSize: theme.size.lg, color: theme.colors.brand }}>
                    {leagueInfo.mine.totalScore}점
                  </Text>
                </View>
              </>
            )}
          </Card>
        </Pressable>
      )}

      {/* 블록 ④: 보유 비중 */}
      <Card>
        <Text
          style={{
            fontFamily: theme.font.pixel,
            fontSize: theme.size.md,
            color: theme.colors.text,
            marginBottom: theme.spacing.md,
            includeFontPadding: false,
          }}
        >
          보유 비중
        </Text>
        <View
          style={{
            flexDirection: "row",
            height: 18,
            borderWidth: 2,
            borderColor: theme.colors.ink,
            borderRadius: theme.pixel.radiusRound,
            overflow: "hidden",
            marginBottom: theme.spacing.md,
          }}
        >
          {ratios.map((r, i) => (
            <View
              key={r.key}
              style={{
                flex: Math.max(0.0001, r.ratio),
                backgroundColor: PALETTE[i % PALETTE.length],
              }}
            />
          ))}
        </View>
        {ratios.map((r, i) => {
          const isCoin = r.key !== "CASH";
          const stopLoss = isCoin ? wallet.stopLoss && wallet.stopLoss[r.key] : null;
          const row = (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 4,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.sm, color: theme.colors.text, includeFontPadding: false }}>
                  <Text style={{ color: PALETTE[i % PALETTE.length] }}>{"■ "}</Text>
                  {r.label}
                </Text>
                {stopLoss ? (
                  <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.xs, color: theme.colors.warn, marginLeft: 6, includeFontPadding: false }}>
                    자동손절 -{Math.round(stopLoss * 100)}%
                  </Text>
                ) : null}
              </View>
              <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.sm, color: theme.colors.sub, includeFontPadding: false }}>
                {ratioPct(r.ratio)}
              </Text>
            </View>
          );
          return isCoin ? (
            <Pressable key={r.key} onPress={() => setStopLossMarket(r.key)}>
              {row}
            </Pressable>
          ) : (
            <View key={r.key}>{row}</View>
          );
        })}
      </Card>
      <Text style={{ fontFamily: theme.font.regular, color: theme.colors.sub, marginTop: -theme.spacing.sm, marginBottom: theme.spacing.md }}>
        보유 코인을 탭하면 자동손절을 설정할 수 있어요.
      </Text>

      <StopLossModal
        visible={Boolean(stopLossMarket)}
        market={stopLossMarket}
        onClose={() => setStopLossMarket(null)}
      />
    </ScrollView>
  );
}
