import { Tabs } from "expo-router";
import { Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LogoutButton from "../../src/components/LogoutButton";
import StopLossMonitor from "../../src/components/StopLossMonitor";
import theme from "../../src/theme";

function TabLabel({ label, focused }) {
  return (
    <Text
      style={{
        fontFamily: theme.font.pixel,
        color: focused ? theme.colors.brand : theme.colors.sub,
        fontSize: theme.size.lg,
        includeFontPadding: false,
      }}
    >
      {label}
    </Text>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { headerBase, headerExtra, tabBase, tabExtra } = theme.layout;

  return (
    <>
      {/* 화면을 그리지 않는 상시 감시 컴포넌트 — 로그인 이후 탭 안에 있는 동안 자동손절을 감시한다 */}
      <StopLossMonitor />
      <Tabs
        screenOptions={{
          headerRight: () => <LogoutButton />,
          headerTitleStyle: { fontFamily: theme.font.pixel, fontSize: theme.size.lg, color: theme.colors.brand },
          headerStyle: {
            backgroundColor: theme.colors.chrome,
            borderBottomWidth: theme.pixel.border,
            borderBottomColor: theme.colors.ink,
            height: headerBase + insets.top + headerExtra,
          },
          tabBarStyle: {
            backgroundColor: theme.colors.chrome,
            borderTopWidth: theme.pixel.border,
            borderTopColor: theme.colors.ink,
            height: tabBase + insets.bottom + tabExtra,
          },
        }}
      >
        <Tabs.Screen
          name="garden"
          options={{
            title: "홈",
            tabBarIcon: () => null,
            tabBarLabel: ({ focused }) => <TabLabel label="홈" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="assets"
          options={{
            title: "나의 자산",
            tabBarIcon: () => null,
            tabBarLabel: ({ focused }) => <TabLabel label="자산" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="shop"
          options={{
            title: "코인 거래소",
            tabBarIcon: () => null,
            tabBarLabel: ({ focused }) => <TabLabel label="거래소" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="league"
          options={{
            title: "리그",
            tabBarIcon: () => null,
            tabBarLabel: ({ focused }) => <TabLabel label="리그" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="games"
          options={{
            title: "미니게임",
            tabBarIcon: () => null,
            tabBarLabel: ({ focused }) => <TabLabel label="게임" focused={focused} />,
          }}
        />
      </Tabs>
    </>
  );
}
