import { createContext, useContext, useEffect, useState } from "react";
import { getJSON, setJSON } from "../store/storage";
import { seasonBounds, isEnded } from "../utils/season";

const LeagueCtx = createContext(null);
const LEAGUE_KEY = "league";
const MAX_HISTORY = 40; // 최대낙폭 계산용 일별 자산 샘플 보관 개수(약 시즌 1개월치)

function freshSeason(startValue) {
  return { ...seasonBounds(Date.now()), startValue: String(startValue) };
}

function initialLeague() {
  return {
    profile: { nickname: "" },
    season: freshSeason("0"),
    activityPoints: 0,
    valueHistory: [],
    archive: [],
  };
}

export function LeagueProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [league, setLeague] = useState(null);

  useEffect(() => {
    (async () => {
      const l = await getJSON(LEAGUE_KEY);
      setLeague(l || initialLeague());
      setReady(true);
    })();
  }, []);

  async function persist(l) {
    setLeague(l);
    await setJSON(LEAGUE_KEY, l);
  }

  async function setNickname(nickname) {
    const l = { ...league, profile: { nickname: String(nickname).trim() } };
    await persist(l);
    return l;
  }

  async function addActivityPoints(n) {
    const amount = Number(n) || 0;
    if (amount <= 0) return league;
    const l = { ...league, activityPoints: league.activityPoints + amount };
    await persist(l);
    return l;
  }

  // 오늘자 자산 스냅샷을 upsert(하루 1개, 재진입 시 최신값으로 덮어씀).
  async function recordDailyValue(value) {
    const day = new Date().toISOString().slice(0, 10);
    const history = league.valueHistory.filter((p) => p.day !== day);
    history.push({ day, value: String(value) });
    const trimmed = history.slice(-MAX_HISTORY);
    const l = { ...league, valueHistory: trimmed };
    await persist(l);
    return l;
  }

  // 시즌이 끝났으면(now >= endTs) 최종 순위를 archive에 남기고 새 시즌으로 리셋한다.
  // standingsEntry: { rank, entrants, totalScore, returnPct, maxDrawdown } — 호출측(화면)이
  // utils/league.js로 계산해 전달한다(이 Context는 영속 상태만 다룬다).
  async function rolloverIfNeeded(currentTotalAssets, standingsEntry) {
    if (!isEnded(Date.now(), league.season.endTs)) return league;
    const archive = standingsEntry
      ? [...league.archive, { seasonId: league.season.id, ...standingsEntry }]
      : league.archive;
    const l = {
      ...league,
      season: freshSeason(currentTotalAssets),
      activityPoints: 0,
      valueHistory: [],
      archive,
    };
    await persist(l);
    return l;
  }

  return (
    <LeagueCtx.Provider
      value={{ ready, league, setNickname, addActivityPoints, recordDailyValue, rolloverIfNeeded }}
    >
      {children}
    </LeagueCtx.Provider>
  );
}

export const useLeague = () => useContext(LeagueCtx);
