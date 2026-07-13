// 리그 체급/점수/순위 계산. 순수함수 — 상수는 여기서 튜닝.
const WEIGHT_LIMITS = { small: 1000000, mid: 3000000 };
const SCORING = { activityCap: 200, defenseMax: 300 };

function weightClass(initialLimit) {
  const n = Number(initialLimit) || 0;
  if (n <= WEIGHT_LIMITS.small) return "small";
  if (n <= WEIGHT_LIMITS.mid) return "mid";
  return "large";
}

// valueHistory: [{ value }] 시간순(오래된 것부터). 러닝 피크 대비 최대 낙폭 비율[0,1].
function computeMaxDrawdown(valueHistory) {
  if (!valueHistory || valueHistory.length < 2) return 0;
  let peak = Number(valueHistory[0].value) || 0;
  let maxDrawdown = 0;
  for (const point of valueHistory) {
    const v = Number(point.value) || 0;
    if (v > peak) peak = v;
    if (peak > 0) {
      const drawdown = (peak - v) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }
  }
  return maxDrawdown;
}

function scoreBreakdown({ returnPct, maxDrawdown, activityPoints }) {
  const returnScore = Math.round((returnPct || 0) * 10);
  const defenseScore = Math.round((1 - (maxDrawdown || 0)) * SCORING.defenseMax);
  const activityScore = Math.min(activityPoints || 0, SCORING.activityCap);
  return { returnScore, defenseScore, activityScore, totalScore: returnScore + defenseScore + activityScore };
}

// user/bots 엔트리를 합쳐 총점 내림차순 정렬 + 1부터 rank 부여. user 엔트리엔 isUser:true 마킹.
function buildStandings({ user, bots }) {
  const entries = [{ ...user, isUser: true }, ...bots.map((b) => ({ ...b, isUser: false }))];
  entries.sort((a, b) => b.totalScore - a.totalScore);
  return entries.map((e, i) => ({ ...e, rank: i + 1 }));
}

module.exports = { weightClass, computeMaxDrawdown, scoreBreakdown, buildStandings };
