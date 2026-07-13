import { useState } from "react";
import { ScrollView, View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useLeague } from "../../src/context/LeagueContext";
import { useLeagueStandings } from "../../src/hooks/useLeagueStandings";
import { useWallet } from "../../src/context/WalletContext";
import { useTicker } from "../../src/hooks/useTicker";
import { holdingRatios } from "../../src/utils/wallet";
import { botPortfolio } from "../../src/data/bots";
import { COINS, ALL_MARKETS } from "../../src/data/coins";
import { pct } from "../../src/utils/format";
import PixelFrame from "../../src/components/PixelFrame";
import PixelButton from "../../src/components/PixelButton";
import Field from "../../src/components/Field";
import PortfolioModal from "../../src/components/PortfolioModal";
import theme from "../../src/theme";

const WEIGHT_LABEL = { small: "소형 리그", mid: "중형 리그", large: "대형 리그" };
const LEADERBOARD_LIMIT = 5;

function Card({ children }) {
  return (
    <PixelFrame style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.md }}>
      {children}
    </PixelFrame>
  );
}

function Row({ label, value, valueColor }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
      <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.sm, color: theme.colors.sub, includeFontPadding: false }}>
        {label}
      </Text>
      <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.sm, color: valueColor || theme.colors.text, includeFontPadding: false }}>
        {value}
      </Text>
    </View>
  );
}

// 리더보드 행: 닉네임에 밑줄 + 끝에 ›를 붙여 "탭하면 포트폴리오가 열린다"는 걸 시각적으로
// 드러낸다(단순 텍스트 목록처럼 보이면 아무도 탭해볼 생각을 안 하기 때문). 눌렀을 때도
// 배경이 살짝 눌리는 피드백을 줘 실제로 반응하는 요소라는 확신을 준다.
function LeaderboardRow({ rank, nickname, isUser, value, onPress }) {
  const nameColor = isUser ? theme.colors.brand : theme.colors.text;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 6,
        paddingHorizontal: 8,
        marginHorizontal: -8,
        marginBottom: 2,
        borderRadius: theme.pixel.radiusRound,
        backgroundColor: pressed ? theme.colors.base : "transparent",
      })}
    >
      <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.sm, color: theme.colors.sub, includeFontPadding: false }}>
        {rank}위{"  "}
        <Text style={{ color: nameColor, textDecorationLine: "underline" }}>
          {nickname}{isUser ? " (나)" : ""}
        </Text>
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.sm, color: nameColor, includeFontPadding: false, marginRight: 6 }}>
          {value}점
        </Text>
        <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.md, color: theme.colors.sub, includeFontPadding: false }}>
          ›
        </Text>
      </View>
    </Pressable>
  );
}

export default function League() {
  const router = useRouter();
  const { league, setNickname } = useLeague();
  const { ready, hasLimit, needsNickname, weightClass, daysLeft, standings, mine, lastSeason } = useLeagueStandings();
  const { wallet } = useWallet();
  const { prices } = useTicker(ALL_MARKETS);
  const [nicknameInput, setNicknameInput] = useState("");
  const [selected, setSelected] = useState(null);

  if (!ready) return null;

  if (!hasLimit) {
    return (
      <ScrollView style={{ backgroundColor: theme.colors.base }} contentContainerStyle={{ padding: theme.spacing.md }}>
        <Card>
          <Text style={{ fontFamily: theme.font.regular, color: theme.colors.sub }}>
            리그에 참가하려면 먼저 자산 탭에서 투자 한도를 설정하세요.
          </Text>
        </Card>
      </ScrollView>
    );
  }

  if (needsNickname) {
    return (
      <ScrollView
        style={{ backgroundColor: theme.colors.base }}
        contentContainerStyle={{ padding: theme.spacing.md, flexGrow: 1, justifyContent: "center" }}
        keyboardShouldPersistTaps="handled"
      >
        <Card>
          <Text
            style={{
              fontFamily: theme.font.pixel,
              fontSize: theme.size.md,
              color: theme.colors.text,
              marginBottom: theme.spacing.sm,
              includeFontPadding: false,
            }}
          >
            리그 닉네임을 정해주세요
          </Text>
          <Field
            label="닉네임"
            value={nicknameInput}
            onChangeText={setNicknameInput}
            placeholder="리그에서 표시될 이름"
            maxLength={12}
          />
          <PixelButton
            title="리그 참가하기"
            onPress={() => nicknameInput.trim() && setNickname(nicknameInput)}
            color={theme.colors.brand}
          />
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: theme.colors.base }} contentContainerStyle={{ padding: theme.spacing.md }}>
      {/* 시즌 헤더 */}
      <Card>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.md, color: theme.colors.brand, includeFontPadding: false }}>
            시즌 {league.season.id}
          </Text>
          <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.sm, color: theme.colors.sub, includeFontPadding: false }}>
            D-{daysLeft}
          </Text>
        </View>
      </Card>

      {/* 내 카드: 체급/순위/총점/점수 분해 */}
      <Card>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: theme.spacing.sm }}>
          <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.sm, color: theme.colors.sub, includeFontPadding: false }}>
            {WEIGHT_LABEL[weightClass]}
          </Text>
          <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.sm, color: theme.colors.text, includeFontPadding: false }}>
            {mine.rank}위 / {standings.length}명
          </Text>
        </View>
        <Text style={{ fontFamily: theme.font.bold, fontSize: 32, color: theme.colors.text, marginBottom: theme.spacing.md }}>
          {mine.totalScore}점
        </Text>
        <Row
          label="수익률 점수"
          value={`${mine.returnScore}점 (${pct(mine.returnPct / 100)})`}
          valueColor={mine.returnPct >= 0 ? theme.colors.up : theme.colors.down}
        />
        <Row label="방어력 점수" value={`${mine.defenseScore}점`} />
        <Row label="활동성 점수" value={`${mine.activityScore}점`} />
      </Card>

      {/* 리더보드: 상위 N + 내 순위가 밖이면 별도로 추가 노출 */}
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
          리더보드
        </Text>
        {standings.slice(0, LEADERBOARD_LIMIT).map((s) => (
          <LeaderboardRow
            key={s.rank}
            rank={s.rank}
            nickname={s.nickname}
            isUser={s.isUser}
            value={s.totalScore}
            onPress={() => setSelected(s)}
          />
        ))}
        {mine.rank > LEADERBOARD_LIMIT && (
          <LeaderboardRow rank={mine.rank} nickname={mine.nickname} isUser value={mine.totalScore} onPress={() => setSelected(mine)} />
        )}
        <Text style={{ fontFamily: theme.font.regular, color: theme.colors.sub, marginTop: 4 }}>
          랭커를 탭하면 참고용 포트폴리오를 볼 수 있어요.
        </Text>
      </Card>

      {/* 지난 시즌 기록 (제한 노출) */}
      {lastSeason && (
        <Card>
          <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.sm, color: theme.colors.sub, includeFontPadding: false }}>
            지난 시즌({lastSeason.seasonId}): {lastSeason.rank}위 / {lastSeason.entrants}명, {lastSeason.totalScore}점
          </Text>
        </Card>
      )}

      {/* 활동성(미니게임) 연동 지점 — 실제 활동성 점수는 게임 탭 플레이 결과로 적립된다 */}
      <Card>
        <Text style={{ fontFamily: theme.font.regular, color: theme.colors.sub, marginBottom: theme.spacing.sm }}>
          미니게임에 참여하면 활동성 점수를 얻을 수 있어요.
        </Text>
        <PixelButton title="미니게임 하러 가기" onPress={() => router.push("/(tabs)/games")} color={theme.colors.warn} />
      </Card>

      <PortfolioModal
        visible={Boolean(selected)}
        onClose={() => setSelected(null)}
        nickname={selected && selected.nickname}
        rank={selected && selected.rank}
        returnPct={selected && selected.returnPct}
        isUser={selected && selected.isUser}
        ratios={
          selected
            ? selected.isUser
              ? holdingRatios(wallet, prices)
              : botPortfolio(league.season.id, selected.nickname, COINS)
            : null
        }
      />
    </ScrollView>
  );
}
