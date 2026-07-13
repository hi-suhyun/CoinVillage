function normalizePosition(rate, maxAbs = 0.2) {
  if (!isFinite(rate)) return 0.5;
  const clamped = Math.max(-maxAbs, Math.min(maxAbs, rate));
  return (clamped + maxAbs) / (2 * maxAbs);
}

function charX(rate, trackWidth, charWidth, pad = 0, maxAbs = 0.2) {
  const usable = trackWidth - charWidth - pad * 2;
  return pad + normalizePosition(rate, maxAbs) * usable;
}

// 세로 레일: 등락률 → 세로 위치. 상승(+)일수록 위(작은 y), 하락(−)일수록 아래(큰 y).
// baseline: 0% 기준선의 세로 위치(트랙 높이 비율, 0=맨 위 1=맨 아래). 0.5보다 크면
// 기준선이 아래로 내려가 상승 쪽 이동 폭이 커져 상승이 더 강조된다.
function charY(rate, trackHeight, charHeight, pad = 0, maxAbs = 0.2, baseline = 0.5) {
  const r = isFinite(rate) ? Math.max(-maxAbs, Math.min(maxAbs, Number(rate))) : 0;
  const topExtreme = pad; // rate = +maxAbs
  const bottomExtreme = trackHeight - charHeight - pad; // rate = -maxAbs
  const baseOffset = baseline * trackHeight - charHeight / 2; // rate = 0
  if (r >= 0) {
    const norm = maxAbs > 0 ? r / maxAbs : 0;
    return baseOffset - norm * (baseOffset - topExtreme);
  }
  const norm = maxAbs > 0 ? -r / maxAbs : 0;
  return baseOffset + norm * (bottomExtreme - baseOffset);
}

// 보유 코인 수만큼 화면 폭을 균등 분할한 한 레인의 폭.
function laneWidth(sceneWidth, count) {
  return count > 0 ? sceneWidth / count : sceneWidth;
}

// index번째 레인 안에서 spriteWidth 스프라이트를 가운데 정렬했을 때의 left x.
function laneX(index, count, sceneWidth, spriteWidth) {
  const lw = laneWidth(sceneWidth, count);
  return lw * index + (lw - spriteWidth) / 2;
}

// 레인 폭에 맞춰 스프라이트 크기를 제한. 코인이 늘면 자동 축소되어 이웃 레인과 겹치지 않음.
function spriteSize(sceneWidth, count, base = 56, gap = 10) {
  const lw = laneWidth(sceneWidth, count);
  return Math.max(24, Math.min(base, Math.floor(lw - gap)));
}

function marketMood(rates) {
  if (!rates || rates.length === 0) return "sunny";
  const avg = rates.reduce((s, r) => s + (Number(r) || 0), 0) / rates.length;
  return avg >= 0 ? "sunny" : "cloudy";
}

function marketAvg(rates) {
  if (!rates || rates.length === 0) return 0;
  return rates.reduce((s, r) => s + (Number(r) || 0), 0) / rates.length;
}

function kimchiSign(usdtRate) {
  return (Number(usdtRate) || 0) >= 0 ? "shine" : "rain";
}

module.exports = { normalizePosition, charX, charY, laneWidth, laneX, spriteSize, marketMood, marketAvg, kimchiSign };
