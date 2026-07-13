// 월 단위 시즌 경계 계산. 기기 로컬 타임존 기준(자산/거래 타임스탬프와 동일 기준).
function pad2(n) {
  return String(n).padStart(2, "0");
}

function seasonId(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

function seasonBounds(ts) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = d.getMonth();
  const startTs = new Date(y, m, 1, 0, 0, 0, 0).getTime();
  const endTs = new Date(y, m + 1, 1, 0, 0, 0, 0).getTime();
  return { id: seasonId(ts), startTs, endTs };
}

function isEnded(nowTs, endTs) {
  return nowTs >= endTs;
}

module.exports = { seasonId, seasonBounds, isEnded };
