export function won(n) {
  const v = Math.round(Number(n) || 0);
  return v.toLocaleString("ko-KR") + "원";
}
export function pct(rate) {
  const v = (Number(rate) || 0) * 100;
  return (v >= 0 ? "+" : "") + v.toFixed(2) + "%";
}

// 코인 단가 표기: 원 미만 시세(대부분의 밈코인)가 반올림으로 0원이 되지 않도록
// 자릿수에 맞춰 소수를 유지한다. won()은 총자산/현금 등 정수 원화 표기 전용.
export function coinPrice(n) {
  const v = Number(n) || 0;
  const abs = Math.abs(v);
  let dp;
  if (abs >= 100) dp = 0;
  else if (abs >= 1) dp = 2;
  else if (abs >= 0.01) dp = 4;
  else dp = 6;
  let s = v.toFixed(dp);
  if (dp > 0) s = s.replace(/0+$/, "").replace(/\.$/, "");
  return s + "원";
}

// 보유 수량처럼 자릿수가 큰 정수를 1.2K · 1.56M · 3B로 축약. 1000 미만은 null을 돌려주어
// 호출부가 소수까지 보이는 기존 표기(toDisplay)를 그대로 쓰게 한다. 정확한 값은 상세 팝업에서 확인.
export function compactCount(n) {
  const v = Number(n) || 0;
  const abs = Math.abs(v);
  if (abs < 1000) return null;
  const UNITS = [[1e12, "T"], [1e9, "B"], [1e6, "M"], [1e3, "K"]];
  for (const [base, suffix] of UNITS) {
    if (abs >= base) {
      return (v / base).toFixed(2).replace(/\.?0+$/, "") + suffix;
    }
  }
  return null;
}

// 비중(0~1) 표기. 소액 보유(<1%)가 정수 반올림으로 0%에 묻혀 "현금 100%"처럼 보이는
// 문제를 막기 위해 소수 첫째 자리까지 표시하고, 그래도 0.0%가 되는 극소 보유는
// "<0.1%"로 표기한다.
export function ratioPct(ratio) {
  const v = ratio * 100;
  if (ratio > 0 && v < 0.1) return "<0.1%";
  return v.toFixed(1) + "%";
}
