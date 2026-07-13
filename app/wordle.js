import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMiniGame } from "../src/context/MiniGameContext";
import { evaluateGuess, pickDailyWord, isoDay, HINT_COST, MAX_TRIES } from "../src/utils/wordle";
import { WORD_LENGTH, WORD_BANK } from "../src/data/wordle";
import Field from "../src/components/Field";
import PixelButton from "../src/components/PixelButton";
import theme from "../src/theme";

// Wordle 타일 색상 — 정답/포함/없음 전용 색이라 theme에 없는 값을 여기서만 씀
// (theme.colors.up/down은 상승·하락 전용 의미라 재사용하지 않음).
const CORRECT = "#4CAF50";
const PRESENT = "#E0A82E";

function Tile({ ch, state, size = 40 }) {
  const bg = state === "correct" ? CORRECT : state === "present" ? PRESENT : theme.colors.sub;
  return (
    <View
      style={{
        width: size, height: size, marginRight: 6, borderRadius: theme.pixel.radiusRound,
        backgroundColor: bg, alignItems: "center", justifyContent: "center",
      }}
    >
      <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.md, color: "#fff", includeFontPadding: false }}>{ch}</Text>
    </View>
  );
}

// 게임 방법 색상 범례 한 줄: 작은 타일 + 설명.
function LegendRow({ state, ch, desc }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: theme.spacing.xs }}>
      <Tile ch={ch} state={state} size={28} />
      <Text style={{ flex: 1, fontFamily: theme.font.regular, color: theme.colors.text }}>{desc}</Text>
    </View>
  );
}

// 미니게임 탭의 "플레이" 버튼에서 진입하는 금융 워들 전용 화면. 처음 보는 사람도 규칙을
// 알 수 있도록 상단에 게임 방법을 두고, 그 아래에서 바로 플레이한다.
export default function Wordle() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { points, wordle, submitWordleGuess, useHint } = useMiniGame();
  const [guess, setGuess] = useState("");
  const [err, setErr] = useState("");

  if (!wordle) return null;
  const today = isoDay(Date.now());
  const answer = pickDailyWord(today, WORD_BANK);
  const over = wordle.solved || wordle.failed;
  const triesLeft = MAX_TRIES - wordle.guesses.length;
  const hintsLeft = WORD_LENGTH - 1 - wordle.hintsUsed;

  function submit() {
    setErr("");
    const r = submitWordleGuess(guess);
    if (!r.ok) { setErr(r.error); return; }
    setGuess("");
  }
  function hint() {
    setErr("");
    const r = useHint();
    if (!r.ok) setErr(r.error);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.base }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* 루트 Stack이 headerShown:false라 픽셀 테마에 맞춘 헤더를 직접 그린다. */}
      <View style={{ paddingTop: insets.top, backgroundColor: theme.colors.chrome, borderBottomWidth: theme.pixel.border, borderBottomColor: theme.colors.ink }}>
        <View style={{ height: theme.layout.headerBase, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: theme.spacing.md }}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.lg, color: theme.colors.brand, includeFontPadding: false }}>‹ 뒤로</Text>
          </Pressable>
          <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.lg, color: theme.colors.brand, includeFontPadding: false }}>금융 워들</Text>
          <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.sm, color: theme.colors.sub, includeFontPadding: false }}>{points}P</Text>
        </View>
      </View>

      <ScrollView keyboardShouldPersistTaps="always" contentContainerStyle={{ padding: theme.spacing.lg }}>
        {/* 게임 방법 */}
        <View
          style={{
            backgroundColor: theme.colors.panel,
            borderWidth: theme.pixel.border, borderColor: theme.colors.ink, borderRadius: theme.pixel.radiusRound,
            padding: theme.spacing.md, marginBottom: theme.spacing.lg,
          }}
        >
          <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.md, color: theme.colors.text, marginBottom: theme.spacing.sm, includeFontPadding: false }}>
            게임 방법
          </Text>
          <Text style={{ fontFamily: theme.font.regular, color: theme.colors.text, lineHeight: 22, marginBottom: theme.spacing.md }}>
            매일 바뀌는 {WORD_LENGTH}음절 금융 단어를 {MAX_TRIES}번 안에 맞혀보세요. 단어를 입력하고 '확인'을 누르면 음절마다 색으로 힌트를 줍니다.
          </Text>
          <LegendRow state="correct" ch="가" desc="음절과 위치가 모두 정답이에요." />
          <LegendRow state="present" ch="나" desc="단어에 있지만 위치가 달라요." />
          <LegendRow state="absent" ch="다" desc="단어에 없는 음절이에요." />
          <Text style={{ fontFamily: theme.font.regular, color: theme.colors.sub, lineHeight: 20, marginTop: theme.spacing.xs }}>
            · 하루 한 번만 도전할 수 있어요.{"\n"}· 힌트 버튼은 {HINT_COST}P를 쓰고 음절 하나를 공개해요.
          </Text>
        </View>

        {/* 지금까지 입력한 정답들 */}
        {wordle.guesses.map((g, i) => (
          <View key={i} style={{ flexDirection: "row", marginBottom: 8 }}>
            {evaluateGuess(answer, g).map((t, j) => (
              <Tile key={j} ch={t.ch} state={t.state} />
            ))}
          </View>
        ))}

        {wordle.hints.length > 0 && !over && (
          <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.xs, color: theme.colors.warn, marginBottom: 8, includeFontPadding: false }}>
            힌트: {wordle.hints.map((h) => `${h.index + 1}번째 음절 = ${h.ch}`).join(", ")}
          </Text>
        )}

        {!over && (
          // 한글 입력은 조합 중인 자모까지 문자 수에 포함되므로 keystroke마다 자르지 않고
          // 길이 검증은 제출 시(submitWordleGuess)에서 처리한다.
          <Field
            label={`정답 입력 (${triesLeft}번 남음)`}
            value={guess}
            onChangeText={setGuess}
            placeholder={`${WORD_LENGTH}음절 단어`}
            error={err}
          />
        )}

        {over && (
          <Text
            style={{
              fontFamily: theme.font.pixel, fontSize: theme.size.md, color: wordle.solved ? CORRECT : theme.colors.up,
              marginBottom: theme.spacing.sm, includeFontPadding: false,
            }}
          >
            {wordle.solved ? "정답입니다! 🎉" : `아쉬워요! 정답은 "${answer}" 였어요.`}
          </Text>
        )}

        <View style={{ flexDirection: "row", marginTop: theme.spacing.sm }}>
          {over ? (
            <PixelButton title="뒤로" onPress={() => router.back()} color={theme.colors.brand} style={{ flex: 1 }} />
          ) : (
            <>
              <PixelButton
                title={`힌트 (${HINT_COST}P)`}
                onPress={hint}
                color={theme.colors.warn}
                disabled={hintsLeft <= 0 || points < HINT_COST}
                style={{ flex: 1, marginRight: 8 }}
              />
              <PixelButton title="확인" onPress={submit} color={theme.colors.brand} style={{ flex: 2 }} />
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
