// 실제 시장 평균 등락률(marketAvg)로 결정되는 마을 날씨 4단계. 문구마다 초보자가 자연스럽게
// 익힐 만한 실전 투자 감각을 하나씩 담는다 — "학습"이 아니라 게임 이벤트로 전달.
const TIERS = [
  { key: "sunny", label: "맑음", min: 0.01, message: "오늘 마을 날씨가 맑아요! 근데 너무 급하게 오르면 그만큼 빨리 식을 수도 있어요." },
  { key: "cloudy", label: "흐림", min: -0.01, message: "오늘은 다들 잠잠하네요. 이런 날엔 무리해서 사고팔지 않아도 괜찮아요." },
  { key: "rain", label: "비", min: -0.05, message: "다들 우산을 써야겠어요. 떨어질 때 겁먹고 던지기보다 원칙을 지키는 게 중요해요." },
  { key: "storm", label: "태풍", min: -Infinity, message: "마을에 태풍 경보가 떴어요! 이런 날은 무리한 매매보다 지켜보는 게 나을 수도 있어요." },
];

function weatherOf(avgRate) {
  const r = Number(avgRate) || 0;
  for (const tier of TIERS) {
    if (r >= tier.min) return tier;
  }
  return TIERS[TIERS.length - 1];
}

module.exports = { TIERS, weatherOf };
