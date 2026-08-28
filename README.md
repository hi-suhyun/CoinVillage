# CoinVillage 

가상 코인으로 투자를 연습하는 교육용 모바일 게임입니다. 실제 자산 없이 가상 지갑으로 매수/매도를 경험하며, 날씨·리그·정원(펫 성장)·워들 같은 미니게임 요소로 투자 개념을 재미있게 학습할 수 있도록 만들었습니다.

2026 SKYSH 해커톤 참가작입니다.

## 주요 기능

- **가상 지갑**: 투자 한도를 설정하고 가상 코인을 매수/매도, 거래 내역 관리
- **시세 시뮬레이션**: 날씨 등 이벤트가 코인 시세에 영향을 주는 마켓 로직
- **손절 알림**: 보유 코인의 손실률 기반 스탑로스 트리거
- **리그**: 다른 유저와 수익률 경쟁
- **정원(펫 성장)**: 투자 성과에 따라 자라는 캐릭터/정원 요소
- **미니게임**: 코인 관련 워들(단어 맞추기) 게임
- **용어 사전**: 투자 용어 설명(글로서리)

## 기술 스택

- [Expo](https://expo.dev) / React Native 0.81
- [Expo Router](https://docs.expo.dev/router/introduction/) (파일 기반 라우팅)
- Decimal.js (정밀한 금액 계산)
- AsyncStorage (로컬 데이터 저장)
- Jest (테스트)

## 시작하기

```bash
npm install
npm start        # Expo 개발 서버 실행
npm run android  # Android
npm run ios      # iOS
```

## 테스트

```bash
npm test
```

## 폴더 구조

```
app/            expo-router 화면 (로그인, 탭: 자산/상점/정원/리그)
src/components/ UI 컴포넌트
src/context/    전역 상태 (지갑, 인증, 리그, 미니게임 등)
src/data/       코인/날씨/봇/용어 등 정적 데이터
src/store/      로컬 저장소 유틸
src/utils/      마켓/지갑/시즌 등 핵심 로직
__tests__/      유닛 테스트
```
