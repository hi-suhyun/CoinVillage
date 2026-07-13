const { clampLimit, isValidPassword, isValidEmail, isValidLoginPassword, verify } = require("../src/utils/auth");

test("500만 초과 클램프", () => {
  expect(clampLimit(9000000)).toBe(5000000);
  expect(clampLimit(3000000)).toBe(3000000);
  expect(clampLimit(-100)).toBe(0);
  expect(clampLimit("abc")).toBe(0);
});
test("비번 4~6자리 숫자만 유효", () => {
  expect(isValidPassword("1234")).toBe(true);
  expect(isValidPassword("123456")).toBe(true);
  expect(isValidPassword("123")).toBe(false);
  expect(isValidPassword("1234567")).toBe(false);
  expect(isValidPassword("12a4")).toBe(false);
});
test("해시 일치 검증", () => {
  expect(verify("abc", "abc")).toBe(true);
  expect(verify("abc", "xyz")).toBe(false);
});
test("이메일 형식 검증", () => {
  expect(isValidEmail("a@b.com")).toBe(true);
  expect(isValidEmail("a.b@c.co.kr")).toBe(true);
  expect(isValidEmail("a@b")).toBe(false);
  expect(isValidEmail("ab.com")).toBe(false);
  expect(isValidEmail("")).toBe(false);
});
test("로그인 비밀번호 6자 이상", () => {
  expect(isValidLoginPassword("abcdef")).toBe(true);
  expect(isValidLoginPassword("abcde")).toBe(false);
  expect(isValidLoginPassword("")).toBe(false);
});
