const { PET_STAGE_THRESHOLDS } = require("../utils/petGrowth");

// 주인공(플레이어) 아바타 — 마을에서 가장 크게 키운 펫(평가금액 최대)의 단계를 따라 진화한다.
// 코인 종류를 모으는 게 아니라 하나를 크게 키우는 것으로 진화하도록 한 설계.
const AVATAR_STAGES = [
  { key: "seed", label: "초보 투자자", sprite: require("../../assets/characters/avatar/char1.png"), min: 0 },
  { key: "explorer", label: "탐험가", sprite: require("../../assets/characters/avatar/char2.png"), min: PET_STAGE_THRESHOLDS[1] },
  { key: "diamond", label: "다이아몬드 핸드", sprite: require("../../assets/characters/avatar/char3.png"), min: PET_STAGE_THRESHOLDS[2] },
];

// maxPetValue: 보유 코인 중 평가금액이 가장 큰 값(원).
function avatarStage(maxPetValue) {
  const v = Number(maxPetValue) || 0;
  let stage = AVATAR_STAGES[0];
  for (const s of AVATAR_STAGES) {
    if (v >= s.min) stage = s;
  }
  return stage;
}

module.exports = { AVATAR_STAGES, avatarStage };
