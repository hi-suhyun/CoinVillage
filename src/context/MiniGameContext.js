import { createContext, useContext, useEffect, useState } from "react";
import { getJSON, setJSON } from "../store/storage";
import { useLeague } from "./LeagueContext";
import {
  isoDay, isoWeekKey, freshWordleState, rollWordle, applyGuess, applyHint,
  ACTIVITY_POINTS as WORDLE_ACTIVITY_POINTS,
} from "../utils/wordle";
import {
  slotOf, freshPredictState, applyPrediction, resolvePredictions, applyDefensePurchase,
  ACTIVITY_POINTS as PREDICT_ACTIVITY_POINTS,
} from "../utils/predict";
import { WORD_BANK } from "../data/wordle";

const MiniGameCtx = createContext(null);
const KEY = "minigame";

function initialMiniGame() {
  return { points: 0, wordle: freshWordleState(), predict: freshPredictState() };
}

export function MiniGameProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [mg, setMg] = useState(null);
  const { addActivityPoints } = useLeague();

  useEffect(() => {
    (async () => {
      const v = await getJSON(KEY);
      setMg(v || initialMiniGame());
      setReady(true);
    })();
  }, []);

  async function persist(next) {
    setMg(next);
    await setJSON(KEY, next);
    return next;
  }

  // 매 렌더 "지금" 기준으로 파생 — 저장된 값이 어제 것이어도 액션 전에 이미 오늘 상태로 보인다.
  const now = Date.now();
  const today = mg ? isoDay(now) : null;
  const weekKey = mg ? isoWeekKey(now) : null;
  const wordle = mg ? rollWordle(mg.wordle, today, weekKey) : null;
  // predict는 각 회차(am/pm)가 자기 day/resolveAt을 들고 있어 별도 롤오버가 필요 없다.
  const predict = mg ? mg.predict : null;

  function submitWordleGuess(guess) {
    const r = applyGuess(mg.wordle, guess, today, weekKey, WORD_BANK);
    if (!r.ok) return r;
    persist({ ...mg, points: mg.points + r.pointsGain, wordle: r.wordle });
    if (r.solved) addActivityPoints(WORDLE_ACTIVITY_POINTS);
    return r;
  }

  function useHint() {
    const r = applyHint(mg.wordle, mg.points, today, weekKey, WORD_BANK);
    if (!r.ok) return r;
    persist({ ...mg, points: mg.points - r.pointsSpent, wordle: r.wordle });
    return r;
  }

  // entryPrice/entryMarket: 호출측이 useTicker + utils/predict.leadingCoin으로 구해 전달하는
  // 참여 시점 가격 — 승패는 즉시 정해지지 않고 resolvePending이 나중에 정산한다.
  function submitPrediction(pick, entryPrice, entryMarket) {
    const slot = slotOf(now);
    const r = applyPrediction(mg.predict, pick, entryPrice, entryMarket, today, slot);
    if (!r.ok) return r;
    persist({ ...mg, predict: r.predict });
    return r;
  }

  // prices: useTicker()의 prices(market→현재가). 정산 시각이 지난 회차가 있으면 정산하고
  // 포인트/활동성 점수를 지급한다. 정산할 게 없으면 아무 것도 하지 않는다.
  function resolvePending(prices) {
    if (!mg) return;
    const out = resolvePredictions(mg.predict, prices, Date.now());
    if (out.resolved.length === 0) return;
    const pointsGain = out.resolved.reduce((sum, r) => sum + r.pointsGain, 0);
    persist({ ...mg, points: mg.points + pointsGain, predict: out.predict });
    for (const r of out.resolved) {
      if (r.win) addActivityPoints(PREDICT_ACTIVITY_POINTS);
    }
  }

  function buyDefense() {
    const r = applyDefensePurchase(mg.predict, mg.points);
    if (!r.ok) return r;
    persist({ ...mg, points: mg.points - r.pointsSpent, predict: r.predict });
    return r;
  }

  // 데모 전용: 오늘의 플레이 기록(잠금)만 초기화. 포인트/연승/방어권/주간 누적은 유지.
  function resetToday() {
    persist({
      ...mg,
      wordle: { ...freshWordleState(), weekKey: wordle.weekKey, weekSolves: wordle.weekSolves },
      predict: { ...mg.predict, am: null, pm: null },
    });
  }

  return (
    <MiniGameCtx.Provider
      value={{
        ready, points: mg?.points ?? 0, wordle, predict,
        submitWordleGuess, useHint, submitPrediction, resolvePending, buyDefense, resetToday,
      }}
    >
      {children}
    </MiniGameCtx.Provider>
  );
}

export const useMiniGame = () => useContext(MiniGameCtx);
