// 코인 펫의 성장 단계 — 종류가 아니라 "그 코인 하나를 얼마나 크게 들고 있는가"(평가금액)로
// 결정된다. 시작 자본 5,000원 기준 라운드 넘버 3단계.
const PET_STAGE_THRESHOLDS = [500, 1500, 3000];

function petStage(value) {
  const v = Number(value) || 0;
  if (v >= PET_STAGE_THRESHOLDS[2]) return 3;
  if (v >= PET_STAGE_THRESHOLDS[1]) return 2;
  return 1;
}

module.exports = { PET_STAGE_THRESHOLDS, petStage };
