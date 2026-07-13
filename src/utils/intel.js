const { hashSeed, mulberry32 } = require("./prng");

// 정보원 등급 — "정보력"(intel.points)이 아니라 "몇 번 확인했는가"(totalRead) 기준의 자연수 계단.
// 재력(아바타 진화)과는 별개로, 꾸준히 배우는 것만으로도 "마피아 보스"에 도달할 수 있게 하는 축.
const RANKS = [
  { key: "rookie", label: "신입 정보원", min: 0 },
  { key: "agent", label: "요원", min: 3 },
  { key: "boss", label: "마피아 보스", min: 7 },
];

const INTEL_ACTIVITY_POINTS = 5;

// dayKey(YYYY-MM-DD) 시드로 오늘의 첩보를 결정론적으로 고른다(Math.random 금지).
function pickTodayEntry(entries, dayKey) {
  if (!entries || entries.length === 0) return null;
  const rng = mulberry32(hashSeed(`intel:${dayKey}`));
  const idx = Math.floor(rng() * entries.length);
  return entries[idx];
}

function intelRank(totalRead) {
  const n = Number(totalRead) || 0;
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (n >= r.min) rank = r;
  }
  return rank;
}

module.exports = { pickTodayEntry, intelRank, RANKS, INTEL_ACTIVITY_POINTS };
