import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../src/context/AuthContext";
import { WalletProvider } from "../src/context/WalletContext";
import { LeagueProvider } from "../src/context/LeagueContext";
import { MiniGameProvider } from "../src/context/MiniGameContext";
import { IntelProvider } from "../src/context/IntelContext";
import Loading from "../src/components/Loading";

export default function RootLayout() {
  const [loaded] = useFonts({
    Pretendard: require("../assets/fonts/Pretendard-Regular.ttf"),
    "Pretendard-Bold": require("../assets/fonts/Pretendard-Bold.ttf"),
    Galmuri11: require("../assets/fonts/Galmuri11.ttf"),
  });
  if (!loaded) return <Loading />;
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <WalletProvider>
          <LeagueProvider>
            <MiniGameProvider>
              <IntelProvider>
                <Stack screenOptions={{ headerShown: false }} />
              </IntelProvider>
            </MiniGameProvider>
          </LeagueProvider>
        </WalletProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
