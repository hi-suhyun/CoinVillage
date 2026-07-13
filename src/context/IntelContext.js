import { createContext, useContext, useEffect, useState } from "react";
import { getJSON, setJSON } from "../store/storage";
import { useLeague } from "./LeagueContext";
import { isoDay } from "../utils/wordle";
import { pickTodayEntry, intelRank, INTEL_ACTIVITY_POINTS } from "../utils/intel";
import { INTEL_ENTRIES } from "../data/intel";

const IntelCtx = createContext(null);
const KEY = "intel";

function initialIntel() {
  return { points: 0, totalRead: 0, lastReadDay: null, collected: [] };
}

export function IntelProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState(null);
  const { addActivityPoints } = useLeague();

  useEffect(() => {
    (async () => {
      const v = await getJSON(KEY);
      setState(v || initialIntel());
      setReady(true);
    })();
  }, []);

  async function persist(next) {
    setState(next);
    await setJSON(KEY, next);
    return next;
  }

  const today = state ? isoDay(Date.now()) : null;
  const todayEntry = today ? pickTodayEntry(INTEL_ENTRIES, today) : null;
  const readToday = state ? state.lastReadDay === today : false;
  const rank = state ? intelRank(state.totalRead) : null;

  async function markRead() {
    if (!state) return { ok: false };
    if (readToday) return { ok: false, error: "오늘 첩보는 이미 확인했어요" };
    const collected = state.collected || [];
    const next = {
      points: state.points + INTEL_ACTIVITY_POINTS,
      totalRead: state.totalRead + 1,
      lastReadDay: today,
      collected: collected.includes(todayEntry.key) ? collected : [...collected, todayEntry.key],
    };
    await persist(next);
    addActivityPoints(INTEL_ACTIVITY_POINTS);
    return { ok: true };
  }

  const collected = state?.collected || [];

  return (
    <IntelCtx.Provider value={{ ready, points: state?.points ?? 0, rank, todayEntry, readToday, collected, markRead }}>
      {children}
    </IntelCtx.Provider>
  );
}

export const useIntel = () => useContext(IntelCtx);
