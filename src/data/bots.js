// 시즌·체급별 결정론적 봇 로스터/스탯 생성. 같은 (seasonId, weightClass) 시드는
// 시즌 내내 동일한 로스터를 만들어야 하므로(다음 진입 때도 랭킹이 안정적으로 보이도록)
// 문자열 해시 → mulberry32 시드 PRNG를 사용한다(Math.random 금지).
const { hashSeed, mulberry32, shuffle } = require("../utils/prng");

const NICKNAME_POOL = [
  "도지대장", "샤크핀", "불장러", "존버킹", "물타기장인", "무릎매수", "떡상요정", "떡락방어자",
  "밈코인헌터", "고래사냥꾼", "익절러", "손절러", "차트요정", "물린개미", "야수의심장",
  "레버리지왕", "존버의신", "새벽매매러", "김프헌터", "청산방지단", "매집왕", "단타요정",
  "장투마스터", "코인농부", "풍선지기", "정원사길동", "펭귄투자자", "봉크마스터", "페페투자자",
  "시바술사",
];

function generateBots(seasonId, weightClass, count) {
  const rng = mulberry32(hashSeed(`${seasonId}:${weightClass}`));
  const shuffled = shuffle(NICKNAME_POOL, rng);
  return shuffled.slice(0, count).map((nickname) => ({
    nickname,
    seed: hashSeed(`${seasonId}:${weightClass}:${nickname}`),
  }));
}

// seasonProgress(0~1) 진행도에 따라 살아있는 느낌을 주도록 봇별 시드로 편차를 준다.
function botStats(bot, seasonProgress) {
  const rng = mulberry32(bot.seed);
  const drift = (rng() * 2 - 1) * 30; // -30 ~ +30
  const returnPct = drift * Math.max(0, Math.min(1, seasonProgress));
  const maxDrawdown = Math.min(1, rng() * 0.5);
  const activityPoints = Math.floor(rng() * 250);
  return { returnPct, maxDrawdown, activityPoints };
}

// (seasonId, nickname)로 시드를 고정해 상위 랭커의 "참고용" 포트폴리오를 만든다.
// 실제 보유가 없는 봇에게 그럴듯한 종목·비중을 부여하되, 시즌 내내(그리고 재조회 시)
// 항상 같은 배분이 나와야 한다. 반환 형식은 utils/wallet.js의 holdingRatios()와 동일해
// 같은 비중 바/리스트 UI를 그대로 재사용할 수 있게 한다.
function botPortfolio(seasonId, nickname, coins) {
  const rng = mulberry32(hashSeed(`${seasonId}:${nickname}:portfolio`));
  const count = Math.min(coins.length, 2 + Math.floor(rng() * 3)); // 2~4개
  const picked = shuffle(coins, rng).slice(0, count);
  const cashWeight = 0.05 + rng() * 0.25; // 현금 5~30%
  const coinWeight = 1 - cashWeight;
  const rawWeights = picked.map(() => 0.2 + rng() * 0.8);
  const rawTotal = rawWeights.reduce((sum, w) => sum + w, 0);

  const rows = [{ key: "CASH", label: "현금", ratio: cashWeight }];
  picked.forEach((c, i) => {
    rows.push({ key: c.market, label: c.nick || c.market.replace("KRW-", ""), ratio: (rawWeights[i] / rawTotal) * coinWeight });
  });
  return rows;
}

module.exports = { NICKNAME_POOL, generateBots, botStats, botPortfolio };
