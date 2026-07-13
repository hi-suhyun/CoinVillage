import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import BackgroundClouds from "./BackgroundClouds";
import RainOverlay from "./RainOverlay";
import theme from "../theme";

// 웹 스케치와 동일한 톤의 3단 하늘 그라데이션 — 위에서 아래로 갈수록 옅어져 지평선이 은은하게 밝아진다.
const SKY_GRADIENT = {
  sunny: ["#BFE9FF", "#D8F3FF", "#EAFAFF"],
  cloudy: ["#C3CCD6", "#D7DEE5", "#E6EBEF"],
  rain: ["#7C8BA0", "#95A2B3", "#B8C2CF"],
  storm: ["#5C6B80", "#7C8BA0", "#93A0AF"],
};
// 잔디도 위(밝음)→아래(짙음) 그라데이션. 태풍일 땐 전체적으로 한 톤 어둡게.
const GRASS_GRADIENT = {
  default: ["#8FD858", "#74C948", "#5BA83A"],
  storm: ["#6FA83E", "#5BA83A", "#3F7A28"],
};

export const GROUND_RATIO = 0.62; // 하늘:잔디 = 38:62, 웹 스케치와 동일 비율

// 마을 씬: 하늘(날씨에 따라 톤 변화) + 잔디 바닥. 정원(GardenScene)의 세로 레일과 달리
// 바닥 위에서 주인공/펫이 자유롭게 배회하는 컨테이너 역할만 한다.
export default function VillageScene({ width, height, weather, skyOverlay, children }) {
  const isRainy = weather.key === "rain" || weather.key === "storm";
  const groundHeight = height * GROUND_RATIO;
  const skyColors = SKY_GRADIENT[weather.key] || SKY_GRADIENT.sunny;
  const grassColors = weather.key === "storm" ? GRASS_GRADIENT.storm : GRASS_GRADIENT.default;

  return (
    <View
      style={{
        height,
        borderWidth: theme.pixel.border,
        borderColor: theme.colors.ink,
        borderRadius: theme.pixel.radiusRound,
        overflow: "hidden",
      }}
    >
      <LinearGradient colors={skyColors} style={{ position: "absolute", left: 0, right: 0, top: 0, height }} />
      {/* 해·먹구름 등 날씨 아이콘은 흘러가는 배경 구름보다 먼저 그려 구름이 그 앞을 지나가게 한다. */}
      {skyOverlay}
      <BackgroundClouds />
      <View pointerEvents="box-none" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: groundHeight }}>
        <LinearGradient colors={grassColors} style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }} />
        {children}
      </View>
      {isRainy && width > 0 && <RainOverlay width={width} height={height} />}
    </View>
  );
}
