# CoinVillage: Mafia Tycoon

An educational mobile game for practicing crypto investing. Trade virtual coins with a play-money wallet — no real assets involved — while weather events, a leaderboard league, a growth garden, and a mini word game turn investing concepts into something fun to learn.

Built for the 2026 SKYSH Hackathon.

## Features

- **Virtual wallet**: set an investment limit, buy/sell virtual coins, and track trade history
- **Market simulation**: market logic where events like weather affect coin prices
- **Stop-loss alerts**: triggers based on the loss rate of held coins
- **League**: compete with other users on returns
- **Garden (pet growth)**: a character/garden that grows based on investment performance
- **Mini game**: a coin-themed Wordle-style word game
- **Glossary**: explanations of investing terms

## Tech Stack

- [Expo](https://expo.dev) / React Native 0.81
- [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing)
- Decimal.js (precise money math)
- AsyncStorage (local persistence)
- Jest (testing)

## Getting Started

```bash
npm install
npm start        # start the Expo dev server
npm run android  # Android
npm run ios      # iOS
```

## Testing

```bash
npm test
```

## Project Structure

```
app/            expo-router screens (login, tabs: assets/shop/garden/league)
src/components/ UI components
src/context/    global state (wallet, auth, league, mini-games, etc.)
src/data/       static data — coins, weather, bots, glossary
src/store/      local storage utilities
src/utils/      core logic — market, wallet, season
__tests__/      unit tests
```
