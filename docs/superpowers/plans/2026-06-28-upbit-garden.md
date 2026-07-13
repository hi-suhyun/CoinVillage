# 업비트 정원(Upbit Garden) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expo SDK 54(Expo Go 호환) 기반의 업비트 게이미피케이션 앱을 JavaScript로 구현한다 — 가상지갑 매매 시뮬레이션, 실시간 시세 기반 "정원" 시각화, 4개 페이지(온보딩/정원/자산/상점).

**Architecture:** expo-router 파일 기반 라우팅 + Context API 2개(Auth, Wallet) + AsyncStorage 영속. 시세는 업비트 공개 ticker API(무인증) 폴링·목업 폴백. 매매 계산은 전부 문자열+decimal.js. 순수 로직(decimal/market/auth)은 jest로 TDD, UI는 수동 검증.

**Tech Stack:** Expo SDK 54, expo-router, React Native, JavaScript(no TS), decimal.js, expo-crypto, @react-native-async-storage/async-storage, expo-font(Pretendard), jest(jest-expo).

## Global Constraints

- 플랫폼: **Expo SDK 54 고정**, 업그레이드 금지. Expo Go(스토어 버전) 호환 — 커스텀 네이티브 모듈 금지.
- 언어: **JavaScript 전용**. TypeScript 파일(.ts/.tsx) 금지.
- 거래: **실제 주문 API 호출 절대 금지**. 매매는 전부 로컬 가상지갑 시뮬레이션.
- 시세: 업비트 공개 ticker API(`https://api.upbit.com/v1/ticker`, 무인증)만 사용.
- 수량/금액: **전부 문자열 저장 + decimal.js 연산**. 표시는 `toFixed(n, ROUND_DOWN)` 절사.
- 투자 한도 가드레일: 최대 `5000000`원으로 클램프.
- 비밀번호: 4~6자리, **평문 저장 금지** → SHA-256 해시 저장.
- UI: 한국어. **이모지 전면 금지**(모든 시각요소는 스프라이트/벡터). 폰트 Pretendard.
- 지도(/map) 페이지·아이콘 **미포함**.
- 6종 코인 마켓·한글명·닉네임(고정):
  `KRW-DOGE`=도지코인/DOGE, `KRW-MEW`=캣인어독스월드/MEW, `KRW-SHIB`=시바이누/SHIB, `KRW-PEPE`=페페/PEPE, `KRW-BONK`=봉크/BONK, `KRW-PENGU`=퍼지펭귄/PENGU. 김프 근사용 보조 마켓 `KRW-USDT`.
- 스프라이트 매핑: doge=`KakaoTalk_..._191726819_01.png`, mew=`_02`, shib=`_05`, pepe=`_04`, bonk=`KakaoTalk_..._191726819.png`(야구방망이), pengu=`_03`, shop아이콘=`KakaoTalk_..._190214283.png`.

---

## File Structure

```
app/_layout.js            루트: 폰트 로드 + AuthProvider + WalletProvider + Stack
app/index.js              인증 게이트(부팅 분기 리다이렉트)
app/login.js              Page 1 온보딩/로그인
app/(tabs)/_layout.js     탭(정원/자산/상점) + 로그아웃 헤더 버튼
app/(tabs)/garden.js      Page 2 정원
app/(tabs)/assets.js      Page 3 자산
app/(tabs)/shop.js        Page 4 상점
src/utils/decimal.js      Decimal 헬퍼(파싱/연산/절사/비교)
src/utils/market.js       표준화 변동률→위치, 장분위기/김프 부호(순수)
src/utils/auth.js         비번 해시/검증, 한도 클램프(순수, 해시는 주입)
src/store/storage.js      AsyncStorage JSON 래퍼
src/data/coins.js         6종 메타 + 임계값 상수
src/data/glossary.js      용어 한 줄 사전
src/api/upbit.js          ticker fetch + 목업 폴백
src/hooks/useTicker.js    폴링 구독 훅
src/context/AuthContext.js   인증 상태/액션
src/context/WalletContext.js 지갑 상태/체결 액션
src/theme/index.js        색상/타이포/간격 토큰
src/components/*           재사용 컴포넌트(아래 태스크별 생성)
assets/characters/*.png   6종 누끼 스프라이트
assets/icons/shop.png
assets/fonts/Pretendard-*.ttf
__tests__/*               jest 단위 테스트
```

---

## Task 0: Expo SDK 54 프로젝트 스캐폴드

**Files:**
- Create: `package.json`, `app.json`, `babel.config.js`, `index.js`(or expo-router entry), `.gitignore`(존재), `jest.config.js`
- Create: `app/_layout.js`(임시 최소), `app/index.js`(임시 "Hello")

**Interfaces:**
- Produces: 동작하는 Expo SDK 54 + expo-router 프로젝트. `npm test`(jest-expo) 실행 가능.

- [ ] **Step 1: blank-typescript 아님 — JS 템플릿으로 SDK 54 스캐폴드**

빈 디렉터리가 아니므로(기존 `img/`, `docs/`) 임시 폴더에 생성 후 핵심 설정만 가져온다. 임시 생성:

```bash
cd "$(mktemp -d)" && npx -y create-expo-app@latest tmpapp --template blank@54 --no-install
```

생성된 `tmpapp`의 `package.json`/`app.json`/`babel.config.js`를 참고해 루트에 아래를 직접 작성한다(템플릿 그대로 복사하지 말고 SDK 54 버전 핀을 확인해 반영).

- [ ] **Step 2: `package.json` 작성 (expo-router 포함)**

```json
{
  "name": "upbit-garden",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "test": "jest"
  },
  "dependencies": {
    "expo": "~54.0.0",
    "expo-router": "~4.0.0",
    "expo-font": "~13.0.0",
    "expo-crypto": "~14.0.0",
    "expo-constants": "~17.0.0",
    "expo-linking": "~7.0.0",
    "expo-status-bar": "~2.0.0",
    "react": "18.3.1",
    "react-native": "0.76.5",
    "react-native-safe-area-context": "4.12.0",
    "react-native-screens": "~4.4.0",
    "@react-native-async-storage/async-storage": "2.1.0",
    "decimal.js": "^10.4.3"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "jest-expo": "~54.0.0"
  },
  "private": true
}
```

> 주의: 위 버전은 SDK 54 매트릭스 기준 근사치다. Step 1에서 생성한 `tmpapp`의 실제 핀 및 `npx expo install --check`로 정확한 버전으로 교정한다. **SDK major(54)는 절대 변경 금지.**

- [ ] **Step 3: `app.json` 작성 (expo-router plugin, scheme)**

```json
{
  "expo": {
    "name": "업비트 정원",
    "slug": "upbit-garden",
    "scheme": "upbitgarden",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "assetBundlePatterns": ["**/*"],
    "plugins": ["expo-router", "expo-font"],
    "android": { "package": "com.skysh.upbitgarden" },
    "ios": { "bundleIdentifier": "com.skysh.upbitgarden" }
  }
}
```

- [ ] **Step 4: `babel.config.js` 작성**

```js
module.exports = function (api) {
  api.cache(true);
  return { presets: ["babel-preset-expo"] };
};
```

- [ ] **Step 5: `jest.config.js` 작성**

```js
module.exports = {
  preset: "jest-expo",
  testMatch: ["**/__tests__/**/*.test.js"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|decimal.js))"
  ]
};
```

- [ ] **Step 6: 임시 라우트 작성**

`app/_layout.js`:
```js
import { Stack } from "expo-router";
export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

`app/index.js`:
```js
import { Text, View } from "react-native";
export default function Index() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>업비트 정원</Text>
    </View>
  );
}
```

- [ ] **Step 7: 설치 및 검증**

Run: `npm install` (실패 시 `npx expo install --fix` 로 버전 교정)
Run: `npx expo install --check` → 모든 패키지 SDK 54 호환 확인.
Run: `npx jest --version` → 버전 출력(jest 동작 확인).

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "chore: scaffold Expo SDK 54 + expo-router project (JS)"
```

---

## Task 1: decimal 유틸 (TDD)

**Files:**
- Create: `src/utils/decimal.js`
- Test: `__tests__/decimal.test.js`

**Interfaces:**
- Produces:
  - `D(x)` → Decimal 인스턴스(문자열/숫자 안전 파싱).
  - `add(a,b)`, `sub(a,b)`, `mul(a,b)`, `div(a,b)` → 모두 **문자열** 반환.
  - `trunc(x, dp)` → `dp` 자리에서 **절사(ROUND_DOWN)** 한 문자열.
  - `cmp(a,b)` → -1|0|1.
  - `isPos(x)`, `gt(a,b)`, `gte(a,b)`, `lte(a,b)` → boolean.
  - `toDisplay(x, dp)` → 절사 후 사람이 읽는 문자열(불필요한 0 제거).

- [ ] **Step 1: 실패 테스트 작성**

`__tests__/decimal.test.js`:
```js
const { add, sub, mul, div, trunc, cmp, gte, toDisplay } = require("../src/utils/decimal");

test("0.1 + 0.2 정확히 0.3", () => {
  expect(add("0.1", "0.2")).toBe("0.3");
});
test("0.0001 곱셈 왜곡 없음", () => {
  // 0.0001 * 1 은 0.00008969... 같은 왜곡이 나오면 안 됨
  expect(mul("0.0001", "1")).toBe("0.0001");
});
test("trunc 절사: 0.123456789 → 8자리 절사", () => {
  expect(trunc("0.123456789", 8)).toBe("0.12345678");
});
test("cmp 보유량 == 매도량 이면 0 (전량매도 가능 판정)", () => {
  expect(cmp("1234.56789012", "1234.56789012")).toBe(0);
  expect(gte("1234.56789012", "1234.56789012")).toBe(true);
});
test("div 후 trunc 로 마켓 자릿수 고정", () => {
  expect(trunc(div("10000", "184.2"), 8)).toBe("54.28881650");
});
test("toDisplay 불필요한 0 제거", () => {
  expect(toDisplay("54.28881650", 8)).toBe("54.2888165");
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx jest decimal -v`
Expected: FAIL ("Cannot find module ../src/utils/decimal").

- [ ] **Step 3: 구현**

`src/utils/decimal.js`:
```js
const Decimal = require("decimal.js");
Decimal.set({ precision: 40, rounding: Decimal.ROUND_DOWN });

const D = (x) => new Decimal(x == null || x === "" ? 0 : x);
const add = (a, b) => D(a).plus(D(b)).toString();
const sub = (a, b) => D(a).minus(D(b)).toString();
const mul = (a, b) => D(a).times(D(b)).toString();
const div = (a, b) => D(a).div(D(b)).toString();
const trunc = (x, dp) => D(x).toFixed(dp, Decimal.ROUND_DOWN);
const cmp = (a, b) => D(a).cmp(D(b));
const gt = (a, b) => cmp(a, b) > 0;
const gte = (a, b) => cmp(a, b) >= 0;
const lte = (a, b) => cmp(a, b) <= 0;
const isPos = (x) => D(x).gt(0);
const toDisplay = (x, dp) => {
  const t = D(x).toFixed(dp, Decimal.ROUND_DOWN);
  return new Decimal(t).toString(); // 불필요한 0 제거
};

module.exports = { D, add, sub, mul, div, trunc, cmp, gt, gte, lte, isPos, toDisplay };
```

- [ ] **Step 4: 통과 확인**

Run: `npx jest decimal -v`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/utils/decimal.js __tests__/decimal.test.js && git commit -m "feat: decimal util with ROUND_DOWN precision (TDD)"
```

---

## Task 2: market 유틸 — 표준화/날씨 (TDD)

**Files:**
- Create: `src/utils/market.js`
- Test: `__tests__/market.test.js`

**Interfaces:**
- Produces:
  - `normalizePosition(rate, maxAbs=0.2)` → `[0,1]` float. rate=0→0.5, rate>=maxAbs→1, rate<=-maxAbs→0.
  - `charX(rate, trackWidth, charWidth, pad, maxAbs)` → 캐릭터 left 픽셀값.
  - `marketMood(rates[])` → `"sunny" | "cloudy"` (평균>=0 sunny).
  - `kimchiSign(usdtRate)` → `"shine" | "rain"` (>=0 shine).

- [ ] **Step 1: 실패 테스트 작성**

`__tests__/market.test.js`:
```js
const { normalizePosition, charX, marketMood, kimchiSign } = require("../src/utils/market");

test("rate 0 이면 중앙 0.5", () => {
  expect(normalizePosition(0)).toBeCloseTo(0.5);
});
test("상승 상한 클램프 → 1", () => {
  expect(normalizePosition(0.5, 0.2)).toBe(1);
});
test("하락 하한 클램프 → 0", () => {
  expect(normalizePosition(-0.5, 0.2)).toBe(0);
});
test("charX: 중앙값이면 트랙 가운데", () => {
  // trackWidth 300, charWidth 60, pad 0 → 사용가능 240, 중앙 0.5 → 120
  expect(charX(0, 300, 60, 0, 0.2)).toBe(120);
});
test("marketMood: 평균 음수면 cloudy", () => {
  expect(marketMood([-0.1, 0.02, -0.05])).toBe("cloudy");
  expect(marketMood([0.1, 0.02, 0.05])).toBe("sunny");
});
test("kimchiSign: USDT 변동률 음수면 rain", () => {
  expect(kimchiSign(-0.01)).toBe("rain");
  expect(kimchiSign(0.01)).toBe("shine");
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx jest market -v` → FAIL (module 없음).

- [ ] **Step 3: 구현**

`src/utils/market.js`:
```js
function normalizePosition(rate, maxAbs = 0.2) {
  if (!isFinite(rate)) return 0.5;
  const clamped = Math.max(-maxAbs, Math.min(maxAbs, rate));
  return (clamped + maxAbs) / (2 * maxAbs);
}
function charX(rate, trackWidth, charWidth, pad = 0, maxAbs = 0.2) {
  const usable = trackWidth - charWidth - pad * 2;
  return pad + normalizePosition(rate, maxAbs) * usable;
}
function marketMood(rates) {
  if (!rates || rates.length === 0) return "sunny";
  const avg = rates.reduce((s, r) => s + (Number(r) || 0), 0) / rates.length;
  return avg >= 0 ? "sunny" : "cloudy";
}
function kimchiSign(usdtRate) {
  return (Number(usdtRate) || 0) >= 0 ? "shine" : "rain";
}
module.exports = { normalizePosition, charX, marketMood, kimchiSign };
```

- [ ] **Step 4: 통과 확인**

Run: `npx jest market -v` → PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/utils/market.js __tests__/market.test.js && git commit -m "feat: market util for position/weather (TDD)"
```

---

## Task 3: auth 유틸 — 한도 클램프 & 비번 검증 (TDD)

**Files:**
- Create: `src/utils/auth.js`
- Test: `__tests__/auth.test.js`

**Interfaces:**
- Produces:
  - `clampLimit(n)` → `[0, 5000000]` 정수 클램프. 비숫자→0.
  - `isValidPassword(pw)` → 4~6자리 숫자 문자열이면 true.
  - `verify(inputHash, storedHash)` → 일치 boolean.
  - (해싱 자체는 expo-crypto에서 하므로 여기선 해시 문자열 비교만 — 테스트 가능하게 분리)

- [ ] **Step 1: 실패 테스트 작성**

`__tests__/auth.test.js`:
```js
const { clampLimit, isValidPassword, verify } = require("../src/utils/auth");

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
```

- [ ] **Step 2: 실패 확인**

Run: `npx jest auth -v` → FAIL.

- [ ] **Step 3: 구현**

`src/utils/auth.js`:
```js
const MAX_LIMIT = 5000000;
function clampLimit(n) {
  const v = Number(n);
  if (!isFinite(v) || isNaN(v)) return 0;
  return Math.max(0, Math.min(MAX_LIMIT, Math.floor(v)));
}
function isValidPassword(pw) {
  return typeof pw === "string" && /^[0-9]{4,6}$/.test(pw);
}
function verify(inputHash, storedHash) {
  return Boolean(inputHash) && inputHash === storedHash;
}
module.exports = { clampLimit, isValidPassword, verify, MAX_LIMIT };
```

- [ ] **Step 4: 통과 확인**

Run: `npx jest auth -v` → PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/utils/auth.js __tests__/auth.test.js && git commit -m "feat: auth util clamp/validate/verify (TDD)"
```

---

## Task 4: wallet 체결 로직 (TDD)

**Files:**
- Create: `src/utils/wallet.js`
- Test: `__tests__/wallet.test.js`

**Interfaces:**
- Consumes: `src/utils/decimal.js`.
- Produces (모두 순수함수, 입력 wallet 객체 복사 반환):
  - `buy(wallet, market, qty, price)` → `{ ok, wallet, error }`. amount=mul(qty,price). cash 부족시 `ok:false`.
  - `sell(wallet, market, qty, price)` → `{ ok, wallet, error }`. 보유 초과시 ok:false. qty가 보유와 같으면(cmp=0) 키 제거.
  - `totalAssets(wallet, priceMap)` → 문자열. cash + Σ qty*price.
  - `limitUsage(wallet)` → float [0,1] = (initialLimit-cash)/initialLimit.
  - `holdingRatios(wallet, priceMap)` → `[{ key, label, ratio }]` 현금 포함.

- [ ] **Step 1: 실패 테스트 작성**

`__tests__/wallet.test.js`:
```js
const { buy, sell, totalAssets, limitUsage } = require("../src/utils/wallet");

const base = () => ({ cashKRW: "1000000", initialLimit: "1000000", holdings: {}, trades: [] });

test("매수: 현금 차감 + 보유 증가", () => {
  const r = buy(base(), "KRW-DOGE", "100", "180");
  expect(r.ok).toBe(true);
  expect(r.wallet.cashKRW).toBe("982000"); // 1000000 - 18000
  expect(r.wallet.holdings["KRW-DOGE"].qty).toBe("100");
});
test("매수: 현금 초과 거부", () => {
  const r = buy(base(), "KRW-DOGE", "100000", "180");
  expect(r.ok).toBe(false);
});
test("부동소수 미소수량 매도 — 전량 매도시 잔량 0 및 키 제거", () => {
  let w = base();
  w = buy(w, "KRW-DOGE", "0.0001", "180").wallet;
  expect(w.holdings["KRW-DOGE"].qty).toBe("0.0001");
  const r = sell(w, "KRW-DOGE", "0.0001", "200");
  expect(r.ok).toBe(true);
  expect(r.wallet.holdings["KRW-DOGE"]).toBeUndefined(); // 잔존 미소수량 없음
});
test("매도: 보유 초과 거부", () => {
  let w = buy(base(), "KRW-DOGE", "100", "180").wallet;
  const r = sell(w, "KRW-DOGE", "101", "200");
  expect(r.ok).toBe(false);
});
test("totalAssets = 현금 + 평가금액", () => {
  let w = buy(base(), "KRW-DOGE", "100", "180").wallet; // cash 982000, 100개
  expect(totalAssets(w, { "KRW-DOGE": "200" })).toBe("1002000"); // 982000 + 20000
});
test("limitUsage = 투입비중", () => {
  let w = buy(base(), "KRW-DOGE", "100", "180").wallet; // 18000 투입
  expect(limitUsage(w)).toBeCloseTo(0.018);
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx jest wallet -v` → FAIL.

- [ ] **Step 3: 구현**

`src/utils/wallet.js`:
```js
const { add, sub, mul, div, cmp, gte } = require("./decimal");

function clone(w) {
  return { ...w, holdings: { ...w.holdings }, trades: [...w.trades] };
}
function buy(wallet, market, qty, price) {
  if (cmp(qty, "0") <= 0) return { ok: false, wallet, error: "수량을 확인하세요" };
  const amount = mul(qty, price);
  if (cmp(amount, wallet.cashKRW) > 0) return { ok: false, wallet, error: "가용현금이 부족합니다" };
  const w = clone(wallet);
  w.cashKRW = sub(w.cashKRW, amount);
  const prev = w.holdings[market];
  if (prev) {
    const newQty = add(prev.qty, qty);
    const newCost = add(mul(prev.qty, prev.avgBuy), amount);
    w.holdings[market] = { qty: newQty, avgBuy: div(newCost, newQty) };
  } else {
    w.holdings[market] = { qty: qty.toString(), avgBuy: price.toString() };
  }
  w.trades = [{ market, side: "buy", qty: qty.toString(), price: price.toString(), amount, ts: Date.now() }, ...w.trades].slice(0, 100);
  return { ok: true, wallet: w };
}
function sell(wallet, market, qty, price) {
  const h = wallet.holdings[market];
  if (!h) return { ok: false, wallet, error: "보유 수량이 없습니다" };
  if (cmp(qty, "0") <= 0) return { ok: false, wallet, error: "수량을 확인하세요" };
  if (!gte(h.qty, qty)) return { ok: false, wallet, error: "보유 수량을 초과했습니다" };
  const amount = mul(qty, price);
  const w = clone(wallet);
  w.cashKRW = add(w.cashKRW, amount);
  const remain = sub(h.qty, qty);
  if (cmp(remain, "0") <= 0) {
    delete w.holdings[market];
  } else {
    w.holdings[market] = { qty: remain, avgBuy: h.avgBuy };
  }
  w.trades = [{ market, side: "sell", qty: qty.toString(), price: price.toString(), amount, ts: Date.now() }, ...w.trades].slice(0, 100);
  return { ok: true, wallet: w };
}
function totalAssets(wallet, priceMap) {
  let total = wallet.cashKRW;
  for (const [m, h] of Object.entries(wallet.holdings)) {
    const p = priceMap[m] || "0";
    total = add(total, mul(h.qty, p));
  }
  return total;
}
function limitUsage(wallet) {
  const limit = Number(wallet.initialLimit) || 0;
  if (limit <= 0) return 0;
  const used = limit - Number(wallet.cashKRW);
  return Math.max(0, Math.min(1, used / limit));
}
function holdingRatios(wallet, priceMap) {
  const total = Number(totalAssets(wallet, priceMap)) || 1;
  const rows = [{ key: "CASH", label: "현금", ratio: Number(wallet.cashKRW) / total }];
  for (const [m, h] of Object.entries(wallet.holdings)) {
    const val = Number(mul(h.qty, priceMap[m] || "0"));
    rows.push({ key: m, label: m.replace("KRW-", ""), ratio: val / total });
  }
  return rows;
}
module.exports = { buy, sell, totalAssets, limitUsage, holdingRatios };
```

- [ ] **Step 4: 통과 확인**

Run: `npx jest wallet -v` → PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/utils/wallet.js __tests__/wallet.test.js && git commit -m "feat: virtual wallet buy/sell/total logic (TDD)"
```

---

## Task 5: 정적 데이터 + 테마 토큰

**Files:**
- Create: `src/data/coins.js`, `src/data/glossary.js`, `src/theme/index.js`

**Interfaces:**
- Produces:
  - `COINS` = 6개 배열 `{ market, name, nick, dp, sprite }` (dp=수량 표시 자릿수). `USDT_MARKET="KRW-USDT"`. `THRESHOLDS={ small: 50000, whale: 1000000 }`.
  - `GLOSSARY` = `[{ term, desc }]` 각 desc는 **한 문장**.
  - `theme` = `{ colors, font, spacing, radius }`.

- [ ] **Step 1: `src/data/coins.js`**

```js
const COINS = [
  { market: "KRW-DOGE", name: "도지코인", nick: "DOGE", dp: 4, sprite: require("../../assets/characters/doge.png") },
  { market: "KRW-MEW", name: "캣인어독스월드", nick: "MEW", dp: 2, sprite: require("../../assets/characters/mew.png") },
  { market: "KRW-SHIB", name: "시바이누", nick: "SHIB", dp: 0, sprite: require("../../assets/characters/shib.png") },
  { market: "KRW-PEPE", name: "페페", nick: "PEPE", dp: 0, sprite: require("../../assets/characters/pepe.png") },
  { market: "KRW-BONK", name: "봉크", nick: "BONK", dp: 0, sprite: require("../../assets/characters/bonk.png") },
  { market: "KRW-PENGU", name: "퍼지펭귄", nick: "PENGU", dp: 2, sprite: require("../../assets/characters/pengu.png") },
];
const USDT_MARKET = "KRW-USDT";
const ALL_MARKETS = [...COINS.map((c) => c.market), USDT_MARKET];
const THRESHOLDS = { small: 50000, whale: 1000000 };
module.exports = { COINS, USDT_MARKET, ALL_MARKETS, THRESHOLDS };
```

- [ ] **Step 2: `src/data/glossary.js`** (각 설명 한 문장)

```js
const GLOSSARY = [
  { term: "변동률", desc: "어제 종가 대비 현재 가격이 몇 퍼센트 올랐는지 또는 내렸는지를 나타내는 값입니다." },
  { term: "김프", desc: "같은 코인이 해외보다 한국에서 더 비싸게 거래될 때 그 가격 차이를 부르는 말입니다." },
  { term: "역프", desc: "반대로 한국 가격이 해외보다 더 쌀 때를 가리키는 말입니다." },
  { term: "표준화", desc: "서로 다른 코인의 변동률을 같은 기준으로 환산해 캐릭터 위치로 비교하는 방식입니다." },
  { term: "체결", desc: "주문한 매수 또는 매도가 실제로 거래 완료되는 것을 뜻합니다." },
  { term: "가용현금", desc: "지금 당장 새로운 코인을 살 수 있는, 묶이지 않은 현금입니다." },
];
module.exports = { GLOSSARY };
```

- [ ] **Step 3: `src/theme/index.js`**

```js
export const theme = {
  colors: {
    grass: "#9BD770", grassDark: "#7BBF53", sky: "#BFE6FF", skyDark: "#3B4A66",
    rail: "#9B6B3E", railDark: "#6E4A28", upbitBlue: "#093687",
    up: "#E03E3E", down: "#1565C0", card: "#FFFFFF", text: "#222222",
    sub: "#6B7280", border: "#E5E7EB", warn: "#D97706",
  },
  font: { regular: "Pretendard", bold: "Pretendard-Bold" },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { sm: 8, md: 14, lg: 20 },
};
export default theme;
```

> 색상은 동물의숲풍 파스텔 + 업비트 블루. 한국 관습상 상승=빨강(up), 하락=파랑(down).

- [ ] **Step 4: Commit**

```bash
git add src/data src/theme && git commit -m "feat: coin data, glossary, theme tokens"
```

---

## Task 6: 에셋 준비 — 누끼 스프라이트 & 폰트

**Files:**
- Create: `assets/characters/{doge,mew,shib,pepe,bonk,pengu}.png`, `assets/icons/shop.png`
- Create: `assets/fonts/Pretendard-Regular.ttf`, `assets/fonts/Pretendard-Bold.ttf`
- Create: `scripts/make-transparent.js`

**Interfaces:**
- Produces: 투명 배경 PNG 6종 + 상점 아이콘 + Pretendard 폰트 2종.

- [ ] **Step 1: 누끼 스크립트 작성** (흰 배경 → 알파). Sharp 사용(devDep 임시 설치).

`scripts/make-transparent.js`:
```js
// 흰색 근접 픽셀을 투명 처리. 픽셀아트 경계 보존 위해 임계값 보수적으로.
const sharp = require("sharp");
const path = require("path");
const SRC = path.join(__dirname, "..", "img");
const OUT = path.join(__dirname, "..", "assets", "characters");
const map = {
  "KakaoTalk_20260628_191726819_01.png": "doge.png",
  "KakaoTalk_20260628_191726819_02.png": "mew.png",
  "KakaoTalk_20260628_191726819_05.png": "shib.png",
  "KakaoTalk_20260628_191726819_04.png": "pepe.png",
  "KakaoTalk_20260628_191726819.png": "bonk.png",
  "KakaoTalk_20260628_191726819_03.png": "pengu.png",
};
const THRESH = 238; // 이 값 이상 RGB 전부면 투명
(async () => {
  const fs = require("fs");
  fs.mkdirSync(OUT, { recursive: true });
  for (const [src, out] of Object.entries(map)) {
    const img = sharp(path.join(SRC, src)).ensureAlpha();
    const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += info.channels) {
      if (data[i] >= THRESH && data[i + 1] >= THRESH && data[i + 2] >= THRESH) {
        data[i + 3] = 0;
      }
    }
    await sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
      .png().toFile(path.join(OUT, out));
    console.log("wrote", out);
  }
})();
```

- [ ] **Step 2: 실행 및 시각 확인**

Run: `npm i -D sharp && node scripts/make-transparent.js`
6개 png 생성 확인. 각 파일을 열어 흰 배경이 투명이고 노란 박스/파란 U 로고가 보존됐는지 육안 확인.
주의: 캐릭터 내부 흰색(예: 도지 얼굴 흰털, 펭귄 배)이 과도하게 투명해지면 THRESH를 245로 올리거나 가장자리 flood-fill 방식으로 보수 — **로고/박스 보존 우선**.

- [ ] **Step 3: 상점 아이콘 복사 및 폰트 배치**

```bash
mkdir -p assets/icons assets/fonts
cp "img/KakaoTalk_20260628_190214283.png" assets/icons/shop.png
```
Pretendard 폰트 2종(`Pretendard-Regular.ttf`, `Pretendard-Bold.ttf`)을 `assets/fonts/`에 배치한다. (오픈소스 OFL Pretendard 정식 배포본 ttf 사용.)

- [ ] **Step 4: sharp 제거(런타임 불필요) & 커밋**

```bash
npm un sharp
git add assets scripts && git commit -m "assets: transparent character sprites, shop icon, Pretendard fonts"
```

---

## Task 7: 저장소 래퍼 & 시세 API & 폴링 훅

**Files:**
- Create: `src/store/storage.js`, `src/api/upbit.js`, `src/hooks/useTicker.js`
- Test: `__tests__/upbit.test.js`

**Interfaces:**
- Produces:
  - storage: `getJSON(key)`, `setJSON(key, obj)`, `remove(key)` (async).
  - upbit: `parseTickers(json)` → `{ [market]: { price, rate } }` (순수, 테스트 대상). `fetchTickers(markets)` → 동일 형태, 실패시 throw.
  - `MOCK_PRICES` 상수.
  - useTicker: `useTicker(markets, intervalMs=5000)` → `{ prices, rates, offline, ts }`.

- [ ] **Step 1: parseTickers 실패 테스트**

`__tests__/upbit.test.js`:
```js
const { parseTickers } = require("../src/api/upbit");
test("ticker 응답 파싱", () => {
  const json = [
    { market: "KRW-DOGE", trade_price: 184.2, signed_change_rate: 0.032 },
    { market: "KRW-USDT", trade_price: 1380, signed_change_rate: -0.004 },
  ];
  const r = parseTickers(json);
  expect(r["KRW-DOGE"].price).toBe("184.2");
  expect(r["KRW-DOGE"].rate).toBe(0.032);
  expect(r["KRW-USDT"].price).toBe("1380");
});
```

- [ ] **Step 2: 실패 확인**: `npx jest upbit -v` → FAIL.

- [ ] **Step 3: 구현**

`src/store/storage.js`:
```js
import AsyncStorage from "@react-native-async-storage/async-storage";
export async function getJSON(key) {
  try { const v = await AsyncStorage.getItem(key); return v ? JSON.parse(v) : null; }
  catch { return null; }
}
export async function setJSON(key, obj) {
  try { await AsyncStorage.setItem(key, JSON.stringify(obj)); } catch {}
}
export async function remove(key) {
  try { await AsyncStorage.removeItem(key); } catch {}
}
```

`src/api/upbit.js`:
```js
const BASE = "https://api.upbit.com/v1/ticker";
const MOCK_PRICES = {
  "KRW-DOGE": { price: "184.2", rate: 0.032 },
  "KRW-MEW": { price: "5.1", rate: -0.012 },
  "KRW-SHIB": { price: "0.0231", rate: 0.008 },
  "KRW-PEPE": { price: "0.0152", rate: -0.025 },
  "KRW-BONK": { price: "0.0287", rate: 0.041 },
  "KRW-PENGU": { price: "32.5", rate: 0.011 },
  "KRW-USDT": { price: "1380", rate: 0.002 },
};
function parseTickers(json) {
  const out = {};
  for (const t of json) {
    out[t.market] = { price: String(t.trade_price), rate: Number(t.signed_change_rate) };
  }
  return out;
}
async function fetchTickers(markets) {
  const url = `${BASE}?markets=${markets.join(",")}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error("ticker http " + res.status);
    return parseTickers(await res.json());
  } finally { clearTimeout(timer); }
}
module.exports = { parseTickers, fetchTickers, MOCK_PRICES, BASE };
```

`src/hooks/useTicker.js`:
```js
import { useEffect, useRef, useState } from "react";
import { fetchTickers, MOCK_PRICES } from "../api/upbit";

export function useTicker(markets, intervalMs = 5000) {
  const [state, setState] = useState({ data: {}, offline: false, ts: null });
  const lastGood = useRef(null);
  useEffect(() => {
    let alive = true;
    async function tick() {
      try {
        const data = await fetchTickers(markets);
        if (!alive) return;
        lastGood.current = data;
        setState({ data, offline: false, ts: Date.now() });
      } catch {
        if (!alive) return;
        const fallback = lastGood.current || MOCK_PRICES;
        setState({ data: fallback, offline: true, ts: Date.now() });
      }
    }
    tick();
    const id = setInterval(tick, intervalMs);
    return () => { alive = false; clearInterval(id); };
  }, [markets.join(","), intervalMs]);
  const prices = {}, rates = {};
  for (const [m, v] of Object.entries(state.data)) { prices[m] = v.price; rates[m] = v.rate; }
  return { prices, rates, offline: state.offline, ts: state.ts };
}
```

- [ ] **Step 4: 통과 확인**: `npx jest upbit -v` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/store src/api src/hooks __tests__/upbit.test.js && git commit -m "feat: storage wrapper, upbit ticker api + polling hook"
```

---

## Task 8: AuthContext (온보딩/로그인/로그아웃 상태)

**Files:**
- Create: `src/context/AuthContext.js`

**Interfaces:**
- Consumes: storage, `src/utils/auth.js`, expo-crypto.
- Produces: `AuthProvider`, `useAuth()` → `{ ready, hasAccount, loggedIn, register, login, logout, account }`.
  - `register({ apiKey, secretKey, password, limit })` → 비번 해시 저장 + 한도 클램프, 자동 로그인.
  - `login(password)` → 해시 비교, 성공시 session 저장.
  - `logout()` → session 제거.

- [ ] **Step 1: 구현**

`src/context/AuthContext.js`:
```js
import { createContext, useContext, useEffect, useState } from "react";
import * as Crypto from "expo-crypto";
import { getJSON, setJSON, remove } from "../store/storage";
import { clampLimit, verify } from "../utils/auth";

const AuthCtx = createContext(null);
const AUTH_KEY = "auth", SESSION_KEY = "session";

async function hash(pw) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, String(pw));
}

export function AuthProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [account, setAccount] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    (async () => {
      const a = await getJSON(AUTH_KEY);
      const s = await getJSON(SESSION_KEY);
      setAccount(a);
      setLoggedIn(Boolean(a && s && s.loggedIn));
      setReady(true);
    })();
  }, []);

  async function register({ apiKey, secretKey, password, limit }) {
    const passwordHash = await hash(password);
    const acc = { apiKey, secretKey: secretKey || "", passwordHash, investLimit: clampLimit(limit), createdAt: Date.now() };
    await setJSON(AUTH_KEY, acc);
    await setJSON(SESSION_KEY, { loggedIn: true });
    setAccount(acc); setLoggedIn(true);
    return acc;
  }
  async function login(password) {
    const a = account || (await getJSON(AUTH_KEY));
    if (!a) return { ok: false, error: "가입 정보가 없습니다" };
    const h = await hash(password);
    if (!verify(h, a.passwordHash)) return { ok: false, error: "비밀번호가 일치하지 않습니다" };
    await setJSON(SESSION_KEY, { loggedIn: true });
    setAccount(a); setLoggedIn(true);
    return { ok: true };
  }
  async function logout() {
    await remove(SESSION_KEY);
    setLoggedIn(false);
  }
  async function verifyPassword(password) {
    const a = account || (await getJSON(AUTH_KEY));
    if (!a) return false;
    return verify(await hash(password), a.passwordHash);
  }

  return (
    <AuthCtx.Provider value={{ ready, hasAccount: Boolean(account), loggedIn, account, register, login, logout, verifyPassword }}>
      {children}
    </AuthCtx.Provider>
  );
}
export const useAuth = () => useContext(AuthCtx);
```

- [ ] **Step 2: 커밋**

```bash
git add src/context/AuthContext.js && git commit -m "feat: AuthContext register/login/logout with hashed password"
```

---

## Task 9: WalletContext (가상지갑 + 정원 이벤트 큐)

**Files:**
- Create: `src/context/WalletContext.js`

**Interfaces:**
- Consumes: storage, `src/utils/wallet.js`, `src/data/coins.js`.
- Produces: `WalletProvider`, `useWallet()` → `{ ready, wallet, seed, doBuy, doByQty, doSell, lastEvent, clearEvent }`.
  - `seed(limit)` → 최초 지갑 생성(cash=limit, initialLimit=limit). 이미 있으면 무시.
  - `doBuy(market, qty, price)` / `doSell(market, qty, price)` → wallet.js 호출 + 영속 + `lastEvent` 설정(amount 기준 small/whale 분류).
  - `lastEvent` = `{ type: "small"|"whale", side, market, ts }` (정원 애니 트리거).

- [ ] **Step 1: 구현**

`src/context/WalletContext.js`:
```js
import { createContext, useContext, useEffect, useState } from "react";
import { getJSON, setJSON } from "../store/storage";
import { buy, sell } from "../utils/wallet";
import { THRESHOLDS } from "../data/coins";

const WalletCtx = createContext(null);
const WALLET_KEY = "wallet";

export function WalletProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [lastEvent, setLastEvent] = useState(null);

  useEffect(() => {
    (async () => { setWallet(await getJSON(WALLET_KEY)); setReady(true); })();
  }, []);

  async function persist(w) { setWallet(w); await setJSON(WALLET_KEY, w); }

  async function seed(limit) {
    const existing = await getJSON(WALLET_KEY);
    if (existing) { setWallet(existing); return existing; }
    const w = { cashKRW: String(limit), initialLimit: String(limit), holdings: {}, trades: [] };
    await persist(w);
    return w;
  }
  function classify(amount) { return Number(amount) >= THRESHOLDS.whale ? "whale" : (Number(amount) <= THRESHOLDS.small ? "small" : null); }

  async function doBuy(market, qty, price) {
    const r = buy(wallet, market, qty, price);
    if (!r.ok) return r;
    await persist(r.wallet);
    const amount = r.wallet.trades[0].amount;
    const type = classify(amount);
    if (type) setLastEvent({ type, side: "buy", market, ts: Date.now() });
    return r;
  }
  async function doSell(market, qty, price) {
    const r = sell(wallet, market, qty, price);
    if (!r.ok) return r;
    await persist(r.wallet);
    const amount = r.wallet.trades[0].amount;
    const type = classify(amount);
    if (type) setLastEvent({ type, side: "sell", market, ts: Date.now() });
    return r;
  }
  function clearEvent() { setLastEvent(null); }

  return (
    <WalletCtx.Provider value={{ ready, wallet, seed, doBuy, doSell, lastEvent, clearEvent }}>
      {children}
    </WalletCtx.Provider>
  );
}
export const useWallet = () => useContext(WalletCtx);
```

- [ ] **Step 2: 커밋**

```bash
git add src/context/WalletContext.js && git commit -m "feat: WalletContext with garden event queue"
```

---

## Task 10: 루트 레이아웃 + 폰트 + 인증 게이트

**Files:**
- Modify: `app/_layout.js`, `app/index.js`
- Create: `src/components/Loading.js`

**Interfaces:**
- Consumes: AuthProvider, WalletProvider, useAuth, expo-font.
- Produces: 부팅 시 폰트 로드 → 인증 상태에 따라 `/login` 또는 `/(tabs)/garden` 으로 redirect.

- [ ] **Step 1: `src/components/Loading.js`**

```js
import { View, ActivityIndicator } from "react-native";
import theme from "../theme";
export default function Loading() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.sky }}>
      <ActivityIndicator color={theme.colors.upbitBlue} />
    </View>
  );
}
```

- [ ] **Step 2: `app/_layout.js`**

```js
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../src/context/AuthContext";
import { WalletProvider } from "../src/context/WalletContext";
import Loading from "../src/components/Loading";

export default function RootLayout() {
  const [loaded] = useFonts({
    Pretendard: require("../assets/fonts/Pretendard-Regular.ttf"),
    "Pretendard-Bold": require("../assets/fonts/Pretendard-Bold.ttf"),
  });
  if (!loaded) return <Loading />;
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <WalletProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </WalletProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
```

- [ ] **Step 3: `app/index.js` (인증 게이트)**

```js
import { Redirect } from "expo-router";
import { useAuth } from "../src/context/AuthContext";
import Loading from "../src/components/Loading";

export default function Index() {
  const { ready, loggedIn } = useAuth();
  if (!ready) return <Loading />;
  return <Redirect href={loggedIn ? "/(tabs)/garden" : "/login"} />;
}
```

- [ ] **Step 4: 검증**

Run: `npx expo start` → Expo Go(또는 웹)로 부팅. 가입 정보 없으면 `/login`으로 이동(아직 login 화면은 다음 태스크 — 빈 라우트면 404일 수 있으니 임시 `app/login.js` placeholder 먼저 두고 확인).
임시 `app/login.js`: `export default () => <Text>로그인</Text>;` 로 라우팅 확인 후 다음 태스크에서 교체.

- [ ] **Step 5: 커밋**

```bash
git add app/_layout.js app/index.js src/components/Loading.js app/login.js && git commit -m "feat: root layout, fonts, auth gate redirect"
```

---

## Task 11: Page 1 — 온보딩/로그인 (`app/login.js`)

**Files:**
- Modify: `app/login.js`
- Create: `src/components/Field.js`, `src/components/PrimaryButton.js`

**Interfaces:**
- Consumes: useAuth(register/login/hasAccount), useWallet(seed), `clampLimit`, `isValidPassword`.
- Produces: 가입 폼(API Key, secret 선택, 비번 4~6, 한도≤500만) + 로그인 폼(비번). 성공시 seed 후 `/(tabs)/garden`.

- [ ] **Step 1: 공통 컴포넌트**

`src/components/Field.js`:
```js
import { View, Text, TextInput } from "react-native";
import theme from "../theme";
export default function Field({ label, hint, error, style, ...props }) {
  return (
    <View style={{ marginBottom: theme.spacing.md }}>
      <Text style={{ fontFamily: theme.font.bold, color: theme.colors.text, marginBottom: theme.spacing.xs }}>{label}</Text>
      <TextInput
        placeholderTextColor={theme.colors.sub}
        style={[{ borderWidth: 1, borderColor: error ? theme.colors.up : theme.colors.border, borderRadius: theme.radius.sm, padding: theme.spacing.md, fontFamily: theme.font.regular, color: theme.colors.text, backgroundColor: "#fff" }, style]}
        {...props}
      />
      {error ? <Text style={{ color: theme.colors.up, fontFamily: theme.font.regular, marginTop: 4 }}>{error}</Text>
             : hint ? <Text style={{ color: theme.colors.sub, fontFamily: theme.font.regular, marginTop: 4 }}>{hint}</Text> : null}
    </View>
  );
}
```

`src/components/PrimaryButton.js`:
```js
import { Pressable, Text } from "react-native";
import theme from "../theme";
export default function PrimaryButton({ title, onPress, disabled, color }) {
  return (
    <Pressable onPress={disabled ? undefined : onPress}
      style={{ backgroundColor: disabled ? theme.colors.border : (color || theme.colors.upbitBlue), padding: theme.spacing.md, borderRadius: theme.radius.md, alignItems: "center" }}>
      <Text style={{ color: "#fff", fontFamily: theme.font.bold, fontSize: 16 }}>{title}</Text>
    </Pressable>
  );
}
```

- [ ] **Step 2: `app/login.js`** (가입/로그인 분기, 가드레일 클램프)

```js
import { useState } from "react";
import { ScrollView, View, Text } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../src/context/AuthContext";
import { useWallet } from "../src/context/WalletContext";
import { clampLimit, isValidPassword, MAX_LIMIT } from "../src/utils/auth";
import Field from "../src/components/Field";
import PrimaryButton from "../src/components/PrimaryButton";
import theme from "../src/theme";

export default function Login() {
  const router = useRouter();
  const { hasAccount, register, login } = useAuth();
  const { seed } = useWallet();
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [password, setPassword] = useState("");
  const [limit, setLimit] = useState("");
  const [err, setErr] = useState("");
  const isReg = !hasAccount;

  async function onSubmit() {
    setErr("");
    if (!isValidPassword(password)) { setErr("비밀번호는 4~6자리 숫자입니다"); return; }
    if (isReg) {
      if (!apiKey.trim()) { setErr("업비트 API Key를 입력하세요"); return; }
      const clamped = clampLimit(limit);
      if (clamped <= 0) { setErr("투자 한도를 입력하세요"); return; }
      await register({ apiKey: apiKey.trim(), secretKey: secretKey.trim(), password, limit: clamped });
      await seed(clamped);
      router.replace("/(tabs)/garden");
    } else {
      const r = await login(password);
      if (!r.ok) { setErr(r.error); return; }
      router.replace("/(tabs)/garden");
    }
  }

  const clampedPreview = clampLimit(limit);
  const overLimit = Number(limit) > MAX_LIMIT;

  return (
    <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, backgroundColor: theme.colors.sky, flexGrow: 1, justifyContent: "center" }}>
      <Text style={{ fontFamily: theme.font.bold, fontSize: 28, color: theme.colors.upbitBlue, marginBottom: theme.spacing.lg }}>
        업비트 정원
      </Text>
      <Text style={{ fontFamily: theme.font.regular, color: theme.colors.sub, marginBottom: theme.spacing.lg }}>
        {isReg ? "계정을 연동하고 정원을 시작하세요" : "비밀번호로 로그인하세요"}
      </Text>

      {isReg && (
        <>
          <Field label="업비트 API Key" value={apiKey} onChangeText={setApiKey} placeholder="Access Key" autoCapitalize="none" />
          <Field label="Secret Key (선택)" value={secretKey} onChangeText={setSecretKey} placeholder="Secret Key" autoCapitalize="none" />
          <Field label="투자 한도 (원)" value={limit} onChangeText={setLimit} keyboardType="number-pad"
            placeholder="최대 5,000,000원"
            hint={`최대 한도 5,000,000원${overLimit ? ` · 입력값이 한도를 초과해 ${clampedPreview.toLocaleString()}원으로 제한됩니다` : ""}`} />
        </>
      )}
      <Field label="보안 비밀번호 (4~6자리)" value={password} onChangeText={setPassword}
        keyboardType="number-pad" secureTextEntry maxLength={6} placeholder="숫자 4~6자리" />

      {err ? <Text style={{ color: theme.colors.up, fontFamily: theme.font.regular, marginBottom: theme.spacing.md }}>{err}</Text> : null}
      <PrimaryButton title={isReg ? "가입하고 시작하기" : "로그인"} onPress={onSubmit} />
    </ScrollView>
  );
}
```

- [ ] **Step 3: 검증**

Run: `npx expo start`. 가입 폼 표시 확인 → 한도 9,000,000 입력시 hint에 "5,000,000원으로 제한" 노출 → 비번 4자리, API Key 입력 후 가입 → 정원으로 이동. 앱 재시작시 정보 있으면 로그인 폼.

- [ ] **Step 4: 커밋**

```bash
git add app/login.js src/components/Field.js src/components/PrimaryButton.js && git commit -m "feat: Page 1 onboarding/login with limit guardrail"
```

---

## Task 12: 탭 레이아웃 + 로그아웃 헤더

**Files:**
- Create: `app/(tabs)/_layout.js`, `src/components/LogoutButton.js`

**Interfaces:**
- Consumes: useAuth(logout), expo-router Tabs.
- Produces: 3탭(정원/자산/상점) + 모든 화면 우상단 로그아웃. 로그아웃시 `/login` redirect. 지도 탭 없음.

- [ ] **Step 1: `src/components/LogoutButton.js`**

```js
import { Pressable, Text, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import theme from "../theme";
export default function LogoutButton() {
  const { logout } = useAuth();
  const router = useRouter();
  function onPress() {
    Alert.alert("로그아웃", "정말 로그아웃하시겠어요?", [
      { text: "취소", style: "cancel" },
      { text: "로그아웃", style: "destructive", onPress: async () => { await logout(); router.replace("/login"); } },
    ]);
  }
  return (
    <Pressable onPress={onPress} style={{ marginRight: theme.spacing.md, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: theme.colors.up, borderRadius: theme.radius.sm }}>
      <Text style={{ color: "#fff", fontFamily: theme.font.bold }}>로그아웃</Text>
    </Pressable>
  );
}
```

- [ ] **Step 2: `app/(tabs)/_layout.js`** (텍스트 라벨 탭, 이모지 없음)

```js
import { Tabs } from "expo-router";
import { Text } from "react-native";
import LogoutButton from "../../src/components/LogoutButton";
import theme from "../../src/theme";

function TabLabel({ label, focused }) {
  return <Text style={{ fontFamily: focused ? theme.font.bold : theme.font.regular, color: focused ? theme.colors.upbitBlue : theme.colors.sub, fontSize: 12 }}>{label}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerRight: () => <LogoutButton />,
      headerTitleStyle: { fontFamily: theme.font.bold, color: theme.colors.upbitBlue },
      headerStyle: { backgroundColor: "#fff" },
      tabBarStyle: { backgroundColor: "#fff" },
    }}>
      <Tabs.Screen name="garden" options={{ title: "나의 정원", tabBarIcon: () => null, tabBarLabel: ({ focused }) => <TabLabel label="정원" focused={focused} /> }} />
      <Tabs.Screen name="assets" options={{ title: "나의 자산", tabBarIcon: () => null, tabBarLabel: ({ focused }) => <TabLabel label="자산" focused={focused} /> }} />
      <Tabs.Screen name="shop" options={{ title: "코인 상점", tabBarIcon: () => null, tabBarLabel: ({ focused }) => <TabLabel label="상점" focused={focused} /> }} />
    </Tabs>
  );
}
```

- [ ] **Step 3: 검증**: 3탭 노출, 지도 없음. 로그아웃 → 확인 → `/login` 이동. 앱 재시작시 로그인 페이지.

- [ ] **Step 4: 커밋**

```bash
git add "app/(tabs)/_layout.js" src/components/LogoutButton.js && git commit -m "feat: tabs layout (garden/assets/shop) + logout, no map"
```

---

## Task 13: Page 4 — 코인 상점 리스트 + 용어 사전 + 매매 모달

**Files:**
- Create: `app/(tabs)/shop.js`, `src/components/TradeModal.js`, `src/components/GlossaryBar.js`, `src/components/ThinkingTooltip.js`, `src/components/CoinRow.js`
- Create: `src/utils/format.js`

**Interfaces:**
- Consumes: useTicker, useWallet(doBuy/doSell, wallet), useAuth(verifyPassword), COINS, GLOSSARY, decimal util.
- Produces: 6종 세로 리스트(현재가·변동률·매수/매도), 용어 Thinking Box 툴팁, 매매 모달(한글명·수량·총액·비번·전량매도·정밀도 보정).

- [ ] **Step 1: `src/utils/format.js`**

```js
export function won(n) {
  const v = Math.round(Number(n) || 0);
  return v.toLocaleString("ko-KR") + "원";
}
export function pct(rate) {
  const v = (Number(rate) || 0) * 100;
  return (v >= 0 ? "+" : "") + v.toFixed(2) + "%";
}
```

- [ ] **Step 2: `src/components/ThinkingTooltip.js`** (말풍선형 한 문장 팝업)

```js
import { Modal, Pressable, View, Text } from "react-native";
import theme from "../theme";
export default function ThinkingTooltip({ visible, term, desc, onClose }) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.25)", alignItems: "center", justifyContent: "center" }}>
        <View style={{ maxWidth: 300, backgroundColor: "#fff", borderRadius: theme.radius.lg, padding: theme.spacing.lg, borderWidth: 2, borderColor: theme.colors.upbitBlue }}>
          <Text style={{ fontFamily: theme.font.bold, color: theme.colors.upbitBlue, fontSize: 16, marginBottom: 8 }}>{term}</Text>
          <Text style={{ fontFamily: theme.font.regular, color: theme.colors.text, lineHeight: 22 }}>{desc}</Text>
        </View>
      </Pressable>
    </Modal>
  );
}
```

- [ ] **Step 3: `src/components/GlossaryBar.js`**

```js
import { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { GLOSSARY } from "../data/glossary";
import ThinkingTooltip from "./ThinkingTooltip";
import theme from "../theme";
export default function GlossaryBar() {
  const [sel, setSel] = useState(null);
  return (
    <View style={{ marginTop: theme.spacing.md }}>
      <Text style={{ fontFamily: theme.font.bold, color: theme.colors.sub, marginBottom: 8 }}>코인 용어 — 한 줄 사전</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {GLOSSARY.map((g) => (
          <Pressable key={g.term} onPress={() => setSel(g)}
            style={{ paddingVertical: 6, paddingHorizontal: 12, backgroundColor: "#fff", borderRadius: theme.radius.sm, borderWidth: 1, borderColor: theme.colors.upbitBlue, marginRight: 8 }}>
            <Text style={{ fontFamily: theme.font.regular, color: theme.colors.upbitBlue }}>{g.term}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <ThinkingTooltip visible={!!sel} term={sel?.term} desc={sel?.desc} onClose={() => setSel(null)} />
    </View>
  );
}
```

- [ ] **Step 4: `src/components/TradeModal.js`** (정밀도 보정 핵심)

```js
import { useMemo, useState } from "react";
import { Modal, View, Text, TextInput, Pressable } from "react-native";
import { D, mul, trunc, cmp, gte } from "../utils/decimal";
import { won } from "../utils/format";
import theme from "../theme";

// coin: { market, name, nick, dp }, side: 'buy'|'sell', price: string, holdingQty: string|null
export default function TradeModal({ visible, coin, side, price, holdingQty, cashKRW, onClose, onConfirm }) {
  const [qty, setQty] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  if (!coin) return null;

  const total = useMemo(() => {
    if (!qty || isNaN(Number(qty))) return "0";
    return trunc(mul(qty, price), 0);
  }, [qty, price]);

  function onQtyChange(t) {
    // 부동소수점 왜곡 방지: 문자열 그대로 받고 마켓 dp로 절사만
    const cleaned = t.replace(/[^0-9.]/g, "");
    setQty(cleaned);
  }
  function fillMax() {
    if (side === "sell" && holdingQty) setQty(trunc(holdingQty, coin.dp));
  }
  async function confirm() {
    setErr("");
    if (!qty || cmp(qty, "0") <= 0) { setErr("수량을 입력하세요"); return; }
    const q = trunc(qty, coin.dp);
    if (cmp(q, "0") <= 0) { setErr("수량이 너무 작습니다"); return; }
    if (side === "buy" && cmp(mul(q, price), cashKRW) > 0) { setErr("가용현금이 부족합니다"); return; }
    if (side === "sell" && !gte(holdingQty || "0", q)) { setErr("보유 수량을 초과했습니다"); return; }
    const r = await onConfirm({ qty: q, password: pw });
    if (!r.ok) { setErr(r.error || "체결에 실패했습니다"); return; }
    setQty(""); setPw(""); onClose();
  }

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: theme.spacing.lg }}>
          <Text style={{ fontFamily: theme.font.bold, fontSize: 20, color: side === "buy" ? theme.colors.up : theme.colors.down, marginBottom: 4 }}>
            {coin.name} {side === "buy" ? "매수" : "매도"}
          </Text>
          <Text style={{ fontFamily: theme.font.regular, color: theme.colors.sub, marginBottom: theme.spacing.md }}>
            현재가 {won(price)} · {coin.nick}
          </Text>

          <Text style={{ fontFamily: theme.font.bold, marginBottom: 4 }}>수량</Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: theme.spacing.md }}>
            <TextInput value={qty} onChangeText={onQtyChange} keyboardType="decimal-pad" placeholder={`최대 ${coin.dp}자리`}
              style={{ flex: 1, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, padding: theme.spacing.md, fontFamily: theme.font.regular }} />
            {side === "sell" && (
              <Pressable onPress={fillMax} style={{ marginLeft: 8, padding: theme.spacing.md, backgroundColor: theme.colors.down, borderRadius: theme.radius.sm }}>
                <Text style={{ color: "#fff", fontFamily: theme.font.bold }}>전량</Text>
              </Pressable>
            )}
          </View>
          {side === "sell" && holdingQty ? (
            <Text style={{ fontFamily: theme.font.regular, color: theme.colors.sub, marginBottom: theme.spacing.md }}>보유 {trunc(holdingQty, coin.dp)} {coin.nick}</Text>
          ) : null}

          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: theme.spacing.md }}>
            <Text style={{ fontFamily: theme.font.bold, color: theme.colors.sub }}>총 금액</Text>
            <Text style={{ fontFamily: theme.font.bold, color: theme.colors.text, fontSize: 16 }}>{won(total)}</Text>
          </View>

          <Text style={{ fontFamily: theme.font.bold, marginBottom: 4 }}>비밀번호</Text>
          <TextInput value={pw} onChangeText={setPw} secureTextEntry keyboardType="number-pad" maxLength={6} placeholder="가입시 설정한 비밀번호"
            style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, padding: theme.spacing.md, fontFamily: theme.font.regular, marginBottom: theme.spacing.md }} />

          {err ? <Text style={{ color: theme.colors.up, fontFamily: theme.font.regular, marginBottom: 8 }}>{err}</Text> : null}
          <View style={{ flexDirection: "row" }}>
            <Pressable onPress={onClose} style={{ flex: 1, padding: theme.spacing.md, alignItems: "center", borderRadius: theme.radius.md, backgroundColor: theme.colors.border, marginRight: 8 }}>
              <Text style={{ fontFamily: theme.font.bold, color: theme.colors.text }}>취소</Text>
            </Pressable>
            <Pressable onPress={confirm} style={{ flex: 2, padding: theme.spacing.md, alignItems: "center", borderRadius: theme.radius.md, backgroundColor: side === "buy" ? theme.colors.up : theme.colors.down }}>
              <Text style={{ fontFamily: theme.font.bold, color: "#fff" }}>{side === "buy" ? "매수 체결" : "매도 체결"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
```

- [ ] **Step 5: `src/components/CoinRow.js`**

```js
import { View, Text, Image, Pressable } from "react-native";
import { won, pct } from "../utils/format";
import theme from "../theme";
export default function CoinRow({ coin, price, rate, onBuy, onSell }) {
  const up = (Number(rate) || 0) >= 0;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: theme.radius.md, padding: theme.spacing.md, marginBottom: theme.spacing.sm, borderWidth: 1, borderColor: theme.colors.border }}>
      <Image source={coin.sprite} style={{ width: 48, height: 48, marginRight: theme.spacing.md }} resizeMode="contain" />
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: theme.font.bold, color: theme.colors.text }}>{coin.name} <Text style={{ color: theme.colors.sub }}>{coin.nick}</Text></Text>
        <Text style={{ fontFamily: theme.font.regular, color: theme.colors.text }}>{won(price)} <Text style={{ color: up ? theme.colors.up : theme.colors.down }}>{pct(rate)}</Text></Text>
      </View>
      <Pressable onPress={onBuy} style={{ backgroundColor: theme.colors.up, borderRadius: theme.radius.sm, paddingVertical: 8, paddingHorizontal: 14, marginRight: 6 }}>
        <Text style={{ color: "#fff", fontFamily: theme.font.bold }}>매수</Text>
      </Pressable>
      <Pressable onPress={onSell} style={{ backgroundColor: theme.colors.down, borderRadius: theme.radius.sm, paddingVertical: 8, paddingHorizontal: 14 }}>
        <Text style={{ color: "#fff", fontFamily: theme.font.bold }}>매도</Text>
      </Pressable>
    </View>
  );
}
```

- [ ] **Step 6: `app/(tabs)/shop.js`**

```js
import { useState } from "react";
import { ScrollView, View, Text } from "react-native";
import { useTicker } from "../../src/hooks/useTicker";
import { useWallet } from "../../src/context/WalletContext";
import { useAuth } from "../../src/context/AuthContext";
import { COINS, ALL_MARKETS } from "../../src/data/coins";
import CoinRow from "../../src/components/CoinRow";
import TradeModal from "../../src/components/TradeModal";
import GlossaryBar from "../../src/components/GlossaryBar";
import theme from "../../src/theme";

export default function Shop() {
  const { prices, rates, offline } = useTicker(ALL_MARKETS);
  const { wallet, doBuy, doSell } = useWallet();
  const { verifyPassword } = useAuth();
  const [modal, setModal] = useState(null); // { coin, side }

  async function onConfirm({ qty, password }) {
    const ok = await verifyPassword(password);
    if (!ok) return { ok: false, error: "비밀번호가 일치하지 않습니다" };
    const price = prices[modal.coin.market];
    return modal.side === "buy" ? doBuy(modal.coin.market, qty, price) : doSell(modal.coin.market, qty, price);
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.sky }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.md }}>
        {offline ? <Text style={{ fontFamily: theme.font.regular, color: theme.colors.warn, marginBottom: 8 }}>오프라인 시세 (목업)</Text> : null}
        {COINS.map((coin) => (
          <CoinRow key={coin.market} coin={coin} price={prices[coin.market] || "0"} rate={rates[coin.market] || 0}
            onBuy={() => setModal({ coin, side: "buy" })}
            onSell={() => setModal({ coin, side: "sell" })} />
        ))}
        <GlossaryBar />
      </ScrollView>
      <TradeModal
        visible={!!modal}
        coin={modal?.coin}
        side={modal?.side}
        price={modal ? (prices[modal.coin.market] || "0") : "0"}
        holdingQty={modal && wallet?.holdings[modal.coin.market]?.qty}
        cashKRW={wallet?.cashKRW || "0"}
        onClose={() => setModal(null)}
        onConfirm={onConfirm}
      />
    </View>
  );
}
```

- [ ] **Step 7: 검증 (정밀도 핵심)**

Run: `npx expo start`. 상점에서:
- 매수 모달에 한글명("도지코인") 표시 확인.
- 수량 `0.0001` 입력 → 총액이 왜곡 없이 계산, 체결 후 보유 0.0001 정확.
- 매도 모달 "전량" 버튼 → 보유 정확히 0 청산(잔존 미소수량 없음), 보유키 제거.
- 잘못된 비번 → "비밀번호가 일치하지 않습니다".
- 용어 버튼 클릭 → 한 문장 Thinking Box.

- [ ] **Step 8: 커밋**

```bash
git add "app/(tabs)/shop.js" src/components/TradeModal.js src/components/GlossaryBar.js src/components/ThinkingTooltip.js src/components/CoinRow.js src/utils/format.js && git commit -m "feat: Page 4 shop list, glossary, trade modal with precision"
```

---

## Task 14: Page 3 — 자산/포트폴리오

**Files:**
- Create: `app/(tabs)/assets.js`, `src/components/RatioBar.js`

**Interfaces:**
- Consumes: useTicker, useWallet, `totalAssets`, `limitUsage`, `holdingRatios`, format util.
- Produces: 블록①(한도+사용률), 블록②(가용현금 위 작게 + 총자산 아래 볼드), 블록③(보유 비중).

- [ ] **Step 1: `src/components/RatioBar.js`**

```js
import { View } from "react-native";
import theme from "../theme";
export default function RatioBar({ ratio, color }) {
  const pct = Math.max(0, Math.min(1, ratio)) * 100;
  return (
    <View style={{ height: 14, backgroundColor: theme.colors.border, borderRadius: 7, overflow: "hidden" }}>
      <View style={{ width: `${pct}%`, height: "100%", backgroundColor: color || theme.colors.upbitBlue }} />
    </View>
  );
}
```

- [ ] **Step 2: `app/(tabs)/assets.js`**

```js
import { ScrollView, View, Text } from "react-native";
import { useTicker } from "../../src/hooks/useTicker";
import { useWallet } from "../../src/context/WalletContext";
import { totalAssets, limitUsage, holdingRatios } from "../../src/utils/wallet";
import { ALL_MARKETS } from "../../src/data/coins";
import { won } from "../../src/utils/format";
import RatioBar from "../../src/components/RatioBar";
import theme from "../../src/theme";

const PALETTE = ["#E03E3E", "#1565C0", "#7BBF53", "#D97706", "#093687", "#8B5CF6", "#999999"];

function Card({ children }) {
  return <View style={{ backgroundColor: "#fff", borderRadius: theme.radius.lg, padding: theme.spacing.lg, marginBottom: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border }}>{children}</View>;
}

export default function Assets() {
  const { prices } = useTicker(ALL_MARKETS);
  const { wallet } = useWallet();
  if (!wallet) return null;

  const total = totalAssets(wallet, prices);
  const usage = limitUsage(wallet);
  const ratios = holdingRatios(wallet, prices);

  return (
    <ScrollView style={{ backgroundColor: theme.colors.sky }} contentContainerStyle={{ padding: theme.spacing.md }}>
      {/* 블록 ①: 투자 한도 + 한도 사용률 */}
      <Card>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: theme.spacing.md }}>
          <Text style={{ fontFamily: theme.font.bold, color: theme.colors.sub }}>투자 한도</Text>
          <Text style={{ fontFamily: theme.font.bold, color: theme.colors.text }}>{won(wallet.initialLimit)}</Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
          <Text style={{ fontFamily: theme.font.regular, color: theme.colors.sub }}>한도 사용률</Text>
          <Text style={{ fontFamily: theme.font.bold, color: theme.colors.upbitBlue }}>{Math.round(usage * 100)}%</Text>
        </View>
        <RatioBar ratio={usage} />
      </Card>

      {/* 블록 ②: 가용현금(위 작게) + 총자산(아래 볼드) */}
      <Card>
        <Text style={{ fontFamily: theme.font.regular, color: theme.colors.sub, fontSize: 13 }}>가용현금  {won(wallet.cashKRW)}</Text>
        <Text style={{ fontFamily: theme.font.bold, color: theme.colors.text, fontSize: 26, marginTop: 4 }}>총 자산  {won(total)}</Text>
      </Card>

      {/* 블록 ③: 보유 코인 비중 */}
      <Card>
        <Text style={{ fontFamily: theme.font.bold, color: theme.colors.text, marginBottom: theme.spacing.md }}>보유 비중</Text>
        <View style={{ flexDirection: "row", height: 16, borderRadius: 8, overflow: "hidden", marginBottom: theme.spacing.md }}>
          {ratios.map((r, i) => (
            <View key={r.key} style={{ flex: Math.max(0.0001, r.ratio), backgroundColor: PALETTE[i % PALETTE.length] }} />
          ))}
        </View>
        {ratios.map((r, i) => (
          <View key={r.key} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
            <Text style={{ fontFamily: theme.font.regular, color: theme.colors.text }}>
              <Text style={{ color: PALETTE[i % PALETTE.length], fontFamily: theme.font.bold }}>■ </Text>{r.label}
            </Text>
            <Text style={{ fontFamily: theme.font.regular, color: theme.colors.sub }}>{Math.round(r.ratio * 100)}%</Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}
```

- [ ] **Step 3: 검증**: 매수 후 자산탭 → 한도 사용률 증가, 총자산=현금+평가, 비중바에 코인/현금 표시. 블록 통합 레이아웃 확인(가용현금 작게 위, 총자산 볼드 아래).

- [ ] **Step 4: 커밋**

```bash
git add "app/(tabs)/assets.js" src/components/RatioBar.js && git commit -m "feat: Page 3 assets dashboard with merged blocks"
```

---

## Task 15: Page 2 정원 — 배경/레일/가이드/캐릭터

**Files:**
- Create: `app/(tabs)/garden.js`, `src/components/GardenScene.js`, `src/components/Character.js`, `src/components/GuideBlocks.js`

**Interfaces:**
- Consumes: useTicker, useWallet(wallet), COINS, `charX`, `marketMood`, `kimchiSign`.
- Produces: 잔디/레일 배경, 좌[하락]/우[상승] 가이드 블록, 보유 코인만 spawn, 변동률로 X 이동, Y는 레일 밀착.

- [ ] **Step 1: `src/components/GuideBlocks.js`**

```js
import { View, Text } from "react-native";
import theme from "../theme";
function Block({ text, side }) {
  return (
    <View style={{ position: "absolute", top: theme.spacing.md, [side]: theme.spacing.md, backgroundColor: "rgba(255,255,255,0.9)", borderRadius: theme.radius.sm, paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, borderColor: side === "left" ? theme.colors.down : theme.colors.up, zIndex: 5 }}>
      <Text style={{ fontFamily: theme.font.bold, color: side === "left" ? theme.colors.down : theme.colors.up }}>{text}</Text>
    </View>
  );
}
export default function GuideBlocks() {
  return (<>
    <Block text="◀ 하락" side="left" />
    <Block text="상승 ▶" side="right" />
  </>);
}
```

- [ ] **Step 2: `src/components/Character.js`** (Y 레일 밀착, X 애니메이션)

```js
import { useEffect, useRef } from "react";
import { Animated, Image } from "react-native";
import { charX } from "../utils/market";

const CHAR_W = 64, CHAR_H = 64;
// railTop: 레일 상단 y(잔디-레일 경계). 캐릭터 발을 여기에 밀착.
export default function Character({ coin, rate, trackWidth, railTop }) {
  const x = useRef(new Animated.Value(charX(rate, trackWidth, CHAR_W, 8, 0.2))).current;
  useEffect(() => {
    Animated.timing(x, { toValue: charX(rate, trackWidth, CHAR_W, 8, 0.2), duration: 800, useNativeDriver: true }).start();
  }, [rate, trackWidth]);
  return (
    <Animated.View style={{ position: "absolute", top: railTop - CHAR_H + 6, transform: [{ translateX: x }], width: CHAR_W, height: CHAR_H, zIndex: 3 }}>
      <Image source={coin.sprite} style={{ width: CHAR_W, height: CHAR_H }} resizeMode="contain" />
    </Animated.View>
  );
}
```

- [ ] **Step 3: `src/components/GardenScene.js`** (잔디/레일 영역 + 자식 배치)

```js
import { View } from "react-native";
import theme from "../theme";
// height 고정 정원. grass 위, rail 아래 띠. railTop 계산해 children에 전달은 garden.js에서.
export default function GardenScene({ height, mood, children }) {
  const railH = 28;
  const grassBg = mood === "cloudy" ? theme.colors.grassDark : theme.colors.grass;
  const skyBg = mood === "cloudy" ? theme.colors.skyDark : theme.colors.sky;
  return (
    <View style={{ height, borderRadius: theme.radius.lg, overflow: "hidden", backgroundColor: skyBg }}>
      {/* 잔디 */}
      <View style={{ position: "absolute", left: 0, right: 0, bottom: railH, height: height * 0.32, backgroundColor: grassBg }} />
      {/* 레일 */}
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: railH, backgroundColor: theme.colors.rail }} />
      <View style={{ position: "absolute", left: 0, right: 0, bottom: railH - 3, height: 3, backgroundColor: theme.colors.railDark }} />
      {children}
    </View>
  );
}
```

- [ ] **Step 4: `app/(tabs)/garden.js`** (조립 — 날씨/이벤트는 다음 태스크에서 추가)

```js
import { useState } from "react";
import { View, useWindowDimensions } from "react-native";
import { useTicker } from "../../src/hooks/useTicker";
import { useWallet } from "../../src/context/WalletContext";
import { COINS, ALL_MARKETS } from "../../src/data/coins";
import { marketMood } from "../../src/utils/market";
import GardenScene from "../../src/components/GardenScene";
import GuideBlocks from "../../src/components/GuideBlocks";
import Character from "../../src/components/Character";
import theme from "../../src/theme";

export default function Garden() {
  const { width } = useWindowDimensions();
  const { prices, rates } = useTicker(ALL_MARKETS);
  const { wallet } = useWallet();
  const sceneW = width - theme.spacing.md * 2;
  const sceneH = 420;
  const railH = 28;
  const railTop = sceneH - railH;

  const owned = COINS.filter((c) => wallet?.holdings[c.market] && Number(wallet.holdings[c.market].qty) > 0);
  const mood = marketMood(COINS.map((c) => rates[c.market] || 0));

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.sky, padding: theme.spacing.md }}>
      <View style={{ width: sceneW }}>
        <GardenScene height={sceneH} mood={mood}>
          <GuideBlocks />
          {owned.map((coin) => (
            <Character key={coin.market} coin={coin} rate={rates[coin.market] || 0} trackWidth={sceneW} railTop={railTop} />
          ))}
        </GardenScene>
      </View>
    </View>
  );
}
```

- [ ] **Step 5: 검증**: 보유 코인만 레일 위 등장, 발이 레일에 밀착(떠다님 없음), 변동률 양수면 우측/음수면 좌측. 가이드 블록 좌[하락]/우[상승] 노출. 평균 하락이면 배경 어두워짐.

- [ ] **Step 6: 커밋**

```bash
git add "app/(tabs)/garden.js" src/components/GardenScene.js src/components/Character.js src/components/GuideBlocks.js && git commit -m "feat: Page 2 garden scene, rail-locked characters, guide blocks"
```

---

## Task 16: 날씨 시스템 — 해/먹구름/비 + 클릭 팝업

**Files:**
- Create: `src/components/Weather.js`, `src/components/Sun.js`, `src/components/Cloud.js`, `src/components/RainOverlay.js`, `src/components/WeatherPopup.js`
- Modify: `app/(tabs)/garden.js`

**Interfaces:**
- Consumes: mood(sunny/cloudy), kimp(shine/rain), 현재시각.
- Produces: sunny면 해만, cloudy면 먹구름만(상호배타). 해 클릭→아래 팝업"장이 좋습니다", 먹구름 클릭→위 팝업"장이 좋지 않습니다". 김프 rain이면 비 오버레이.

- [ ] **Step 1: 시각 포맷 + 팝업**

`src/components/WeatherPopup.js`:
```js
import { View, Text } from "react-native";
import theme from "../theme";
export function nowText() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}.${p(d.getHours())}:${p(d.getMinutes())}`;
}
export default function WeatherPopup({ message }) {
  return (
    <View style={{ backgroundColor: "rgba(255,255,255,0.96)", borderRadius: theme.radius.md, padding: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.upbitBlue, maxWidth: 220 }}>
      <Text style={{ fontFamily: theme.font.bold, color: theme.colors.upbitBlue }}>{nowText()}</Text>
      <Text style={{ fontFamily: theme.font.regular, color: theme.colors.text, marginTop: 4 }}>{message}</Text>
    </View>
  );
}
```

- [ ] **Step 2: 해/먹구름/비 (벡터 — react-native-svg 미사용, View 도형으로 구성)**

`src/components/Sun.js`:
```js
import { View } from "react-native";
import theme from "../theme";
export default function Sun() {
  return (
    <View style={{ width: 56, height: 56, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#FFD43B", shadowColor: "#FFD43B", shadowOpacity: 0.9, shadowRadius: 12, elevation: 6 }} />
    </View>
  );
}
```

`src/components/Cloud.js`:
```js
import { View } from "react-native";
export default function Cloud() {
  return (
    <View style={{ width: 80, height: 44, justifyContent: "center" }}>
      <View style={{ position: "absolute", left: 8, top: 14, width: 64, height: 26, borderRadius: 13, backgroundColor: "#6B7280" }} />
      <View style={{ position: "absolute", left: 18, top: 2, width: 30, height: 30, borderRadius: 15, backgroundColor: "#6B7280" }} />
      <View style={{ position: "absolute", left: 40, top: 6, width: 26, height: 26, borderRadius: 13, backgroundColor: "#6B7280" }} />
    </View>
  );
}
```

`src/components/RainOverlay.js`:
```js
import { View } from "react-native";
export default function RainOverlay({ width, height }) {
  const drops = Array.from({ length: 24 });
  return (
    <View pointerEvents="none" style={{ position: "absolute", left: 0, top: 0, width, height }}>
      {drops.map((_, i) => (
        <View key={i} style={{ position: "absolute", left: (i * 53) % width, top: (i * 37) % (height - 20), width: 2, height: 10, backgroundColor: "rgba(180,200,255,0.7)", borderRadius: 1 }} />
      ))}
    </View>
  );
}
```

- [ ] **Step 3: `src/components/Weather.js`** (조립 + 클릭 팝업 위치 규칙)

```js
import { useState } from "react";
import { View, Pressable } from "react-native";
import Sun from "./Sun";
import Cloud from "./Cloud";
import RainOverlay from "./RainOverlay";
import WeatherPopup from "./WeatherPopup";

// mood: 'sunny'|'cloudy', kimp: 'shine'|'rain', size: {width,height}
export default function Weather({ mood, kimp, size }) {
  const [open, setOpen] = useState(false);
  const isSunny = mood === "sunny";
  return (
    <>
      {/* 날씨 오브젝트: 우측 상단 가이드 피해서 좌측~중앙 상단 배치 */}
      <View style={{ position: "absolute", top: 12, left: size.width / 2 - 28, alignItems: "center", zIndex: 4 }}>
        <Pressable onPress={() => setOpen((v) => !v)}>
          {isSunny ? <Sun /> : <Cloud />}
        </Pressable>
        {/* 해: 아래 팝업 / 먹구름: 위 팝업 */}
        {open && isSunny && (<View style={{ marginTop: 6 }}><WeatherPopup message="장이 좋습니다" /></View>)}
      </View>
      {open && !isSunny && (
        <View style={{ position: "absolute", top: 12 - 56, left: size.width / 2 - 110, zIndex: 6 }}>
          <WeatherPopup message="장이 좋지 않습니다" />
        </View>
      )}
      {kimp === "rain" && <RainOverlay width={size.width} height={size.height} />}
    </>
  );
}
```

> 먹구름 팝업은 먹구름 위쪽(top 음수 방향)에, 해 팝업은 해 아래쪽에 배치 — 우상단 가이드 블록과 겹치지 않도록 가로 중앙 기준.

- [ ] **Step 4: `app/(tabs)/garden.js`에 Weather 삽입**

`GardenScene` 자식으로 추가, kimp 계산:
```js
import Weather from "../../src/components/Weather";
import { kimchiSign } from "../../src/utils/market";
// ...
const kimp = kimchiSign(rates["KRW-USDT"] || 0);
// GuideBlocks 아래에:
<Weather mood={mood} kimp={kimp} size={{ width: sceneW, height: sceneH }} />
```

- [ ] **Step 5: 검증**: 평균 양수→해만(먹구름 없음), 음수→먹구름만(해 없음). 해 클릭→아래 "[시각] 장이 좋습니다", 먹구름 클릭→위 "[시각] 장이 좋지 않습니다". USDT 음수면 비. 우상단 가이드 안 가림.

- [ ] **Step 6: 커밋**

```bash
git add src/components/Weather.js src/components/Sun.js src/components/Cloud.js src/components/RainOverlay.js src/components/WeatherPopup.js "app/(tabs)/garden.js" && git commit -m "feat: weather system (sun/cloud/rain) with click popups"
```

---

## Task 17: 정원 이벤트 — 아기 고양이떼 & 풍선 고래

**Files:**
- Create: `src/components/CatPicnic.js`, `src/components/BalloonWhale.js`
- Modify: `app/(tabs)/garden.js`

**Interfaces:**
- Consumes: useWallet(lastEvent, clearEvent).
- Produces: lastEvent.type==='small' → 바닥 고양이떼 일정시간 노출. ==='whale' → 하늘 풍선고래가 가로지르며 선물 낙하, 클릭시 안내 팝업.

- [ ] **Step 1: `src/components/CatPicnic.js`**

```js
import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";
// mew 스프라이트 재사용 — 작은 고양이 여러 마리 바닥 등장 후 사라짐
export default function CatPicnic({ width, railTop, sprite, onDone }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.delay(3500),
      Animated.timing(opacity, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start(() => onDone && onDone());
  }, []);
  const cats = [0.2, 0.4, 0.6, 0.8];
  return (
    <Animated.View pointerEvents="none" style={{ position: "absolute", left: 0, top: 0, width, height: railTop + 30, opacity }}>
      {cats.map((p, i) => (
        <Animated.Image key={i} source={sprite}
          style={{ position: "absolute", left: width * p - 16, top: railTop - 26, width: 32, height: 32 }} resizeMode="contain" />
      ))}
    </Animated.View>
  );
}
```

- [ ] **Step 2: `src/components/BalloonWhale.js`**

```js
import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, View, Text } from "react-native";
import theme from "../theme";
export default function BalloonWhale({ width, onDone }) {
  const x = useRef(new Animated.Value(-120)).current;
  const [popup, setPopup] = useState(false);
  useEffect(() => {
    Animated.timing(x, { toValue: width + 120, duration: 7000, useNativeDriver: true }).start(() => onDone && onDone());
  }, []);
  return (
    <Animated.View style={{ position: "absolute", top: 40, transform: [{ translateX: x }], zIndex: 7 }}>
      <Pressable onPress={() => setPopup((v) => !v)}>
        {/* 풍선 고래 — View 도형 */}
        <View style={{ width: 90, height: 46 }}>
          <View style={{ position: "absolute", left: 0, top: 8, width: 76, height: 34, borderRadius: 18, backgroundColor: "#7AA9D6" }} />
          <View style={{ position: "absolute", left: 64, top: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: "#7AA9D6" }} />
          <View style={{ position: "absolute", left: 8, top: 16, width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" }} />
        </View>
      </Pressable>
      {popup && (
        <View style={{ marginTop: 6, backgroundColor: "rgba(255,255,255,0.96)", borderRadius: theme.radius.md, padding: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.upbitBlue, maxWidth: 200 }}>
          <Text style={{ fontFamily: theme.font.bold, color: theme.colors.upbitBlue }}>대형 고래 출현</Text>
          <Text style={{ fontFamily: theme.font.regular, color: theme.colors.text, marginTop: 4 }}>큰 거래가 정원을 지나가며 선물을 떨어뜨렸어요.</Text>
        </View>
      )}
    </Animated.View>
  );
}
```

- [ ] **Step 3: `app/(tabs)/garden.js` 이벤트 연동**

```js
import { useEffect, useState } from "react";
import CatPicnic from "../../src/components/CatPicnic";
import BalloonWhale from "../../src/components/BalloonWhale";
// COINS에서 mew 스프라이트 찾기
const mewSprite = COINS.find((c) => c.market === "KRW-MEW").sprite;
// 컴포넌트 내부:
const { wallet, lastEvent, clearEvent } = useWallet();
const [cat, setCat] = useState(false);
const [whale, setWhale] = useState(false);
useEffect(() => {
  if (!lastEvent) return;
  if (lastEvent.type === "small") setCat(true);
  if (lastEvent.type === "whale") setWhale(true);
  clearEvent();
}, [lastEvent]);
// GardenScene 자식 마지막에:
{cat && <CatPicnic width={sceneW} railTop={railTop} sprite={mewSprite} onDone={() => setCat(false)} />}
{whale && <BalloonWhale width={sceneW} onDone={() => setWhale(false)} />}
```

- [ ] **Step 4: 검증**: 소액(≤5만원) 매수 → 고양이떼 바닥 등장 후 소멸. 고래(≥100만원) 거래 → 풍선고래 가로지름, 클릭시 안내 팝업.

- [ ] **Step 5: 커밋**

```bash
git add src/components/CatPicnic.js src/components/BalloonWhale.js "app/(tabs)/garden.js" && git commit -m "feat: garden events (cat picnic, balloon whale)"
```

---

## Task 18: 전체 통합 검증 & 회귀 테스트

**Files:**
- Modify: (필요시 버그픽스)
- Create: `docs/superpowers/plans/VERIFICATION.md`

- [ ] **Step 1: 전체 단위 테스트**

Run: `npx jest`
Expected: 모든 테스트 PASS (decimal/market/auth/wallet/upbit).

- [ ] **Step 2: 수동 E2E 체크리스트** (`docs/superpowers/plans/VERIFICATION.md`에 결과 기록)

- [ ] 앱 첫 실행 → 가입 폼. 한도 9,000,000 입력시 500만 클램프 안내.
- [ ] 가입 → 정원 진입. 보유 없으니 레일 비어있음.
- [ ] 상점 → 도지 매수(0.0001 등 미소수량 포함) → 왜곡 없음, 정원에 도지 캐릭터 레일 밀착 등장.
- [ ] 변동률 양수 코인 우측 / 음수 좌측 위치. 가이드 블록 좌[하락]/우[상승].
- [ ] 자산탭 → 한도 사용률·총자산·비중 정확. 블록 통합 레이아웃(가용현금 작게 위 / 총자산 볼드 아래).
- [ ] 매도 "전량" → 보유 0 청산, 캐릭터 제거. 잔존 미소수량 없음.
- [ ] 잘못된 비번 → 체결 거부.
- [ ] 해/먹구름 상호배타 + 클릭 팝업(시각 텍스트 + 멘트, 위치 규칙). 비 효과.
- [ ] 소액→고양이, 고래→풍선고래+클릭 팝업.
- [ ] 로그아웃 → 로그인 페이지. 앱 재시작 → 로그인 페이지(메인 직행 안 됨).
- [ ] 지도 탭/라우트 없음. UI 전체 이모지 없음. Pretendard 적용.

- [ ] **Step 3: 메모리 제약 최종 점검**

- [ ] 주문 API 호출 코드 없음(`grep -rn "v1/orders\|jwt\|Authorization" src app` → 없음).
- [ ] .ts/.tsx 파일 없음.
- [ ] `npx expo install --check` 통과(SDK 54 호환).

- [ ] **Step 4: 커밋**

```bash
git add -A && git commit -m "test: full verification checklist + fixes"
```

---

## Self-Review 결과 (작성자 점검)

- **스펙 커버리지:** Page1~4·날씨·이벤트·정밀도·로그아웃 게이트·블록통합·용어사전·가이드블록·레일밀착·이모지금지·한도가드레일 모두 태스크에 매핑됨.
- **플레이스홀더:** 없음(모든 코드 step에 실제 코드 포함).
- **타입/이름 일관성:** `doBuy/doSell`(Wallet), `verifyPassword`(Auth), `charX/marketMood/kimchiSign`(market), `trunc/cmp/gte`(decimal) 전 태스크 일관.
- **주의 포인트(실행자):** Task 6 누끼 THRESH는 스프라이트 육안 확인하며 보정(로고/박스 보존 우선). Task 0 버전 핀은 생성된 tmpapp 기준으로 교정하되 SDK major 54 고정.
