import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../src/context/AuthContext";
import { useWallet } from "../src/context/WalletContext";
import { isValidEmail, isValidLoginPassword, isValidPassword } from "../src/utils/auth";
import Field from "../src/components/Field";
import PrimaryButton from "../src/components/PrimaryButton";
import theme from "../src/theme";

// 상단 로그인/회원가입 탭. 계정이 있으면 로그인을, 없으면 회원가입을 기본으로 보여주되
// 언제든 서로 전환할 수 있다 — 로그아웃 후에도 "예전 비밀번호만 묻는" 문제가 없도록
// 이메일+비밀번호를 함께 받는 진짜 로그인 화면으로 고정한다.
function ModeToggle({ mode, setMode }) {
  return (
    <View style={{ flexDirection: "row", marginBottom: theme.spacing.lg, borderWidth: 2, borderColor: theme.colors.ink, borderRadius: theme.pixel.radiusRound, overflow: "hidden" }}>
      {["login", "signup"].map((m) => (
        <Pressable
          key={m}
          onPress={() => setMode(m)}
          style={{ flex: 1, paddingVertical: 10, alignItems: "center", backgroundColor: mode === m ? theme.colors.brand : "#fff" }}
        >
          <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.sm, color: mode === m ? "#fff" : theme.colors.text, includeFontPadding: false }}>
            {m === "login" ? "로그인" : "회원가입"}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function Login() {
  const router = useRouter();
  const { hasAccount, register, login } = useAuth();
  const { resetWallet } = useWallet();
  const [mode, setMode] = useState(hasAccount ? "login" : "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const isReg = mode === "signup";

  async function onSubmit() {
    setErr("");
    if (!isValidEmail(email)) {
      setErr("올바른 이메일을 입력하세요");
      return;
    }
    if (isReg) {
      if (!isValidLoginPassword(password)) {
        setErr("비밀번호는 6자 이상이어야 합니다");
        return;
      }
      if (password !== confirmPassword) {
        setErr("비밀번호가 일치하지 않습니다");
        return;
      }
      if (!isValidPassword(pin)) {
        setErr("결제 PIN은 4~6자리 숫자입니다");
        return;
      }
      await register({ email, password, pin });
      await resetWallet();
      router.replace("/(tabs)/garden");
    } else {
      if (!isValidLoginPassword(password)) {
        setErr("비밀번호는 6자 이상이어야 합니다");
        return;
      }
      const r = await login({ email, password });
      if (!r.ok) {
        setErr(r.error);
        return;
      }
      router.replace("/(tabs)/garden");
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.base }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing.lg,
          backgroundColor: theme.colors.base,
          flexGrow: 1,
          justifyContent: "center",
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={{
            fontFamily: theme.font.pixel,
            fontSize: theme.size.hero,
            color: theme.colors.brand,
            marginBottom: theme.spacing.md,
            includeFontPadding: false,
          }}
        >
          Bitfly
        </Text>

        <ModeToggle mode={mode} setMode={setMode} />

        <Text
          style={{
            fontFamily: theme.font.regular,
            color: theme.colors.sub,
            marginBottom: theme.spacing.lg,
          }}
        >
          {isReg ? "이메일과 비밀번호로 계정을 만드세요" : "이메일과 비밀번호로 로그인하세요"}
        </Text>

        <Field
          label="이메일"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="you@example.com"
        />

        <Field
          label="비밀번호 (6자 이상)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="비밀번호"
        />

        {isReg && (
          <>
            <Field
              label="비밀번호 확인"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholder="비밀번호 확인"
            />
            <Field
              label="결제 PIN (4~6자리)"
              value={pin}
              onChangeText={setPin}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              placeholder="거래 확인용 PIN"
              hint="매수/매도 확인 시 사용하는 별도의 숫자 PIN입니다"
            />
          </>
        )}

        {err ? (
          <Text
            style={{
              color: theme.colors.up,
              fontFamily: theme.font.regular,
              marginBottom: theme.spacing.md,
            }}
          >
            {err}
          </Text>
        ) : null}

        <PrimaryButton title={isReg ? "가입하고 시작하기" : "로그인"} onPress={onSubmit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
