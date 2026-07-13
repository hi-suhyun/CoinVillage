import { useEffect } from "react";
import { useWallet } from "../context/WalletContext";
import { useLeague } from "../context/LeagueContext";
import { useTicker } from "./useTicker";
import { totalAssets } from "../utils/wallet";
import { weightClass, computeMaxDrawdown, scoreBreakdown, buildStandings } from "../utils/league";
import { isEnded } from "../utils/season";
import { generateBots, botStats } from "../data/bots";
import { ALL_MARKETS } from "../data/coins";

const BOT_COUNT = 15;

// 자산 탭 요약 카드와 리그 탭 화면이 동일한 순위/점수 계산을 공유하기 위한 훅.
// Context는 영속 상태만 갖고, 실제 계산은 여기서 utils/league.js + data/bots.js를 그대로 호출한다.
// 훅은 매 렌더 같은 순서로 호출되어야 하므로(Rules of Hooks), 준비 안 된 상태는 값으로만 분기한다.
export function useLeagueStandings() {
  const { wallet, ready: walletReady } = useWallet();
  const { league, ready: leagueReady, recordDailyValue, rolloverIfNeeded } = useLeague();
  const { prices } = useTicker(ALL_MARKETS);

  const ready = walletReady && leagueReady && Boolean(wallet) && Boolean(league);
  const hasLimit = ready && Number(wallet.initialLimit) > 0;
  const needsNickname = ready && !league.profile.nickname;
  const currentTotal = hasLimit ? totalAssets(wallet, prices) : "0";
  const season = ready ? league.season : null;

  let wc = null;
  let standings = [];
  let mine = null;
  let daysLeft = 0;
  let returnPct = 0;
  let maxDrawdown = 0;

  if (hasLimit) {
    wc = weightClass(wallet.initialLimit);
    const now = Date.now();
    const seasonProgress = Math.max(0, Math.min(1, (now - season.startTs) / (season.endTs - season.startTs)));
    const startValue = Number(season.startValue) || 0;
    returnPct = startValue > 0 ? ((Number(currentTotal) - startValue) / startValue) * 100 : 0;
    maxDrawdown = computeMaxDrawdown(league.valueHistory);
    const userBreakdown = scoreBreakdown({ returnPct, maxDrawdown, activityPoints: league.activityPoints });
    const user = { nickname: league.profile.nickname, returnPct, maxDrawdown, ...userBreakdown };

    const bots = generateBots(season.id, wc, BOT_COUNT).map((bot) => {
      const stats = botStats(bot, seasonProgress);
      return { nickname: bot.nickname, ...stats, ...scoreBreakdown(stats) };
    });

    standings = buildStandings({ user, bots });
    mine = standings.find((s) => s.isUser);
    daysLeft = Math.max(0, Math.ceil((season.endTs - now) / 86400000));
  }

  const lastSeason = ready && league.archive.length ? league.archive[league.archive.length - 1] : null;

  // 진입 시 1회: 오늘자 자산 스냅샷 기록 + 시즌 종료 시 현재 순위를 보관하고 새 시즌 시작.
  useEffect(() => {
    if (!hasLimit || !mine) return;
    recordDailyValue(currentTotal);
    if (isEnded(Date.now(), season.endTs)) {
      rolloverIfNeeded(currentTotal, {
        rank: mine.rank,
        entrants: standings.length,
        totalScore: mine.totalScore,
        returnPct,
        maxDrawdown,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasLimit, season && season.id]);

  return { ready, hasLimit, needsNickname, weightClass: wc, season, daysLeft, standings, mine, lastSeason };
}
