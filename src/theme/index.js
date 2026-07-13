export const theme = {
  colors: {
    grass: "#7EC850", grassDark: "#5BA83A", sky: "#9BDBFF", skyOvercast: "#B9C3CE", skyDark: "#3B4A66",
    rail: "#9B6B3E", railDark: "#6E4A28", brand: "#093687",
    up: "#E8412F", down: "#1466D6", card: "#FFFFFF", text: "#20232A",
    sub: "#6B7280", border: "#E5E7EB", warn: "#E58A00",
    ink: "#2B2B2B",        // 픽셀 하드 테두리/그림자 색
    panel: "#FFF7E6",      // 픽셀 HUD 패널 바탕
    base: "#EDE0C8",       // 화면 베이지 바탕
    chrome: "#FFFFFF",     // 헤더/탭바 등 앱 프레임(크롬) 바탕
    pole: "#C89B63", poleDark: "#8A6636", // 정원 말뚝(지주대) 나무색
    // 코인별 풍선 색상 팔레트 — 상승 시 다 같은 빨강이면 구분이 안 돼서 코인마다 다르게.
    balloons: ["#E8412F", "#F2A93B", "#4CAF50", "#3E9DE8", "#9B6BD9", "#F2679B"],
  },
  font: { regular: "Pretendard", bold: "Pretendard-Bold", pixel: "Galmuri11" },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { sm: 8, md: 14, lg: 20 },
  size: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24, hero: 34 },
  pixel: { border: 2, radius: 0, radiusRound: 14, shadow: 2 }, // 각진 코너 + 오프셋 그림자 (radiusRound은 버튼 전용) — border 원래 3, shadow 원래 3 (되돌리려면 각각 3으로)
  // 헤더/탭바를 커스텀 height로 지정할 때 세이프에어리어(insets)를 직접 더해야 하므로,
  // 기준 높이와 여유 버퍼를 한 곳에서 관리해 _layout.js와 garden.js가 어긋나지 않게 한다.
  layout: { headerBase: 52, headerExtra: 16, tabBase: 54, tabExtra: 16 },
};
export default theme;
