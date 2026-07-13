const MAX_LIMIT = 5000000;

function clampLimit(n) {
  const v = Number(n);
  if (!isFinite(v) || isNaN(v)) return 0;
  return Math.max(0, Math.min(MAX_LIMIT, Math.floor(v)));
}

// 결제 PIN(4~6자리 숫자) 검증. 로그인 비밀번호와 별개로 거래 확인에 쓰인다.
function isValidPassword(pw) {
  return typeof pw === "string" && /^[0-9]{4,6}$/.test(pw);
}

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidLoginPassword(pw) {
  return typeof pw === "string" && pw.length >= 6;
}

function verify(inputHash, storedHash) {
  return Boolean(inputHash) && inputHash === storedHash;
}

module.exports = { clampLimit, isValidPassword, isValidEmail, isValidLoginPassword, verify, MAX_LIMIT };
