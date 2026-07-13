// topGapRatio: 스프라이트 원본이 정사각형보다 넓어(가로>세로) resizeMode="contain"으로
// size×size 정사각 박스에 넣을 때 위/아래에 생기는 레터박스(투명 여백) 비율. Character.js가
// 풍선/추 문자열 길이를 여기에 맞춰 보정해 캐릭터와 끊어져 보이지 않게 한다. 세로가 더 긴
// 스프라이트(도지/캣인어독스월드/시바이누)는 세로 레터박스가 없어 0(생략).
// balloonColor: theme.colors.balloons 팔레트와 동일한 값을 코인마다 하나씩 배정
// (data 파일은 CommonJS라 theme의 ES 모듈을 직접 참조하지 않고 값만 복제).
const COINS = [
  { market: "KRW-DOGE", name: "도지코인", nick: "DOGE", dp: 4, sprite: require("../../assets/characters/pets/doge.png"), balloonColor: "#E8412F" },
  { market: "KRW-MEW", name: "뮤코인", nick: "MEW", dp: 2, sprite: require("../../assets/characters/pets/mew.png"), balloonColor: "#F2A93B" },
  { market: "KRW-SHIB", name: "시바이누", nick: "SHIB", dp: 0, sprite: require("../../assets/characters/pets/shib.png"), balloonColor: "#4CAF50" },
  { market: "KRW-PEPE", name: "페페", nick: "PEPE", dp: 0, sprite: require("../../assets/characters/pets/pepe.png"), topGapRatio: 0.14, balloonColor: "#3E9DE8" },
  { market: "KRW-BONK", name: "봉크", nick: "BONK", dp: 0, sprite: require("../../assets/characters/pets/bonk.png"), topGapRatio: 0.16, balloonColor: "#9B6BD9" },
  { market: "KRW-PENGU", name: "퍼지펭귄", nick: "PENGU", dp: 2, sprite: require("../../assets/characters/pets/pengu.png"), topGapRatio: 0.04, balloonColor: "#F2679B" },
];
const USDT_MARKET = "KRW-USDT";
const ALL_MARKETS = [...COINS.map((c) => c.market), USDT_MARKET];
const THRESHOLDS = { small: 50000, whale: 1000000 };
module.exports = { COINS, USDT_MARKET, ALL_MARKETS, THRESHOLDS };
