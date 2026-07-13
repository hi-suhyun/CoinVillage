import { useEffect, useRef, useState } from "react";
import { ScrollView, View, Text, Image, Pressable, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { useTicker } from "../../src/hooks/useTicker";
import { useWallet } from "../../src/context/WalletContext";
import { useMiniGame } from "../../src/context/MiniGameContext";
import { useIntel } from "../../src/context/IntelContext";
import { mul } from "../../src/utils/decimal";
import { holdingRate } from "../../src/utils/wallet";
import { slotOf, voteStats } from "../../src/utils/predict";
import { COINS, ALL_MARKETS } from "../../src/data/coins";
import { marketAvg, kimchiSign } from "../../src/utils/market";
import { weatherOf } from "../../src/data/weather";
import { avatarStage } from "../../src/data/avatar";
import { pct } from "../../src/utils/format";
import PixelFrame from "../../src/components/PixelFrame";
import VillageScene from "../../src/components/VillageScene";
import VillageAvatar, { VILLAGE_AVATAR_SIZE } from "../../src/components/VillageAvatar";
import VillagePet from "../../src/components/VillagePet";
import ShopHouse, { SHOP_HOUSE_SIZE } from "../../src/components/ShopHouse";
import Weather from "../../src/components/Weather";
import CatPicnic from "../../src/components/CatPicnic";
import BalloonWhale from "../../src/components/BalloonWhale";
import MarketCard from "../../src/components/MarketCard";
import CoinInfoModal from "../../src/components/CoinInfoModal";
import PredictModal from "../../src/components/PredictModal";
import IntelModal from "../../src/components/IntelModal";
import IntelCollection from "../../src/components/IntelCollection";
import ThinkingTooltip from "../../src/components/ThinkingTooltip";
import WeatherChartModal from "../../src/components/WeatherChartModal";
import { GLOSSARY } from "../../src/data/glossary";
import theme from "../../src/theme";

const documentIcon = require("../../assets/icons/document.png");

const mewSprite = COINS.find((c) => c.market === "KRW-MEW").sprite;
const kimpEntry = GLOSSARY.find((g) => g.term === "김프");
const AVATAR_TOP = 16;
const HOUSE_LEFT = 14;
const HOUSE_TOP = -34;

function HudPill({ label, value, color, onPress }) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper onPress={onPress} style={{ flexDirection: "row", alignItems: "center" }}>
      <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.xs, color: theme.colors.sub, includeFontPadding: false }}>{label} </Text>
      <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.sm, color, includeFontPadding: false }}>{value}</Text>
    </Wrapper>
  );
}

// 오늘 참여한 예측 회차의 상승/하락 투표 현황. 참여 전에는 렌더하지 않는다.
function PredictStatusBar({ round, slot, rate, onPress }) {
  const stats = voteStats(round.day, slot, round.entryMarket, rate);
  return (
    <Pressable onPress={onPress} style={{ marginBottom: theme.spacing.sm }}>
      <PixelFrame style={{ padding: theme.spacing.sm }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.sm, color: theme.colors.text, includeFontPadding: false }}>
            📊 예측 현황
          </Text>
          <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.sm, includeFontPadding: false }}>
            <Text style={{ color: theme.colors.up }}>상승 {Math.round(stats.up * 100)}%</Text>
            <Text style={{ color: theme.colors.sub }}>  ·  </Text>
            <Text style={{ color: theme.colors.down }}>하락 {Math.round(stats.down * 100)}%</Text>
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row", height: 10, borderRadius: theme.pixel.radiusRound,
            overflow: "hidden", borderWidth: theme.pixel.border, borderColor: theme.colors.ink,
          }}
        >
          <View style={{ flex: Math.max(0.0001, stats.up), backgroundColor: theme.colors.up }} />
          <View style={{ flex: Math.max(0.0001, stats.down), backgroundColor: theme.colors.down }} />
        </View>
      </PixelFrame>
    </Pressable>
  );
}

// 오늘 아직 확인 안 한 첩보가 있을 때만 뜨는 배너. 확인 여부와 무관하게 게임 탭에서도
// 다시 볼 수 있으니, 여기선 "안 봤으면 눈에 띄게"만 신경 쓴다.
function IntelBanner({ onPress }) {
  return (
    <Pressable onPress={onPress} style={{ marginBottom: theme.spacing.sm }}>
      <PixelFrame
        color={theme.colors.panel}
        style={{ padding: theme.spacing.sm, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image source={documentIcon} style={{ width: 18, height: 18, marginRight: 6 }} resizeMode="contain" />
          <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.sm, color: theme.colors.text, includeFontPadding: false }}>
            첩보가 도착했어요!
          </Text>
        </View>
        <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.sm, color: theme.colors.brand, includeFontPadding: false }}>
          확인 ›
        </Text>
      </PixelFrame>
    </Pressable>
  );
}

export default function Garden() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const { prices, rates, tickers } = useTicker(ALL_MARKETS);
  const { wallet, lastEvent, clearEvent } = useWallet();
  const { predict } = useMiniGame();
  const { readToday: intelReadToday, todayEntry: intelToday } = useIntel();
  const [cat, setCat] = useState(false);
  const [catKey, setCatKey] = useState(0);
  const [whale, setWhale] = useState(false);
  const [detailCoin, setDetailCoin] = useState(null);
  const [showKimpInfo, setShowKimpInfo] = useState(false);
  const [showWeatherInfo, setShowWeatherInfo] = useState(false);
  const [predictOpen, setPredictOpen] = useState(false);
  const [intelOpen, setIntelOpen] = useState(false);
  const [groundSize, setGroundSize] = useState({ w: 0, h: 0 });
  const catTimer = useRef(null);

  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent.type === "small") {
      setCat(true);
      setCatKey((k) => k + 1);
      if (catTimer.current) clearTimeout(catTimer.current);
      catTimer.current = setTimeout(() => setCat(false), 4600);
    }
    if (lastEvent.type === "whale") setWhale(true);
    clearEvent();
  }, [lastEvent]);

  useEffect(() => () => { if (catTimer.current) clearTimeout(catTimer.current); }, []);

  const sceneW = width - theme.spacing.md * 2;
  const sceneH = Math.min(480, Math.max(360, height * 0.46));

  const owned = COINS.filter(
    (c) => wallet?.holdings[c.market] && Number(wallet.holdings[c.market].qty) > 0
  );
  const heldRates = {};
  const values = {};
  for (const c of owned) {
    const holding = wallet.holdings[c.market];
    heldRates[c.market] = holdingRate(holding.avgBuy, prices[c.market]);
    values[c.market] = Number(mul(holding.qty, prices[c.market] || "0"));
  }
  const maxValue = owned.length ? Math.max(...owned.map((c) => values[c.market])) : 0;
  const stage = avatarStage(maxValue);

  const avg = marketAvg(COINS.map((c) => rates[c.market] || 0));
  const tier = weatherOf(avg);
  const usdtRate = rates["KRW-USDT"] || 0;
  const kimp = kimchiSign(usdtRate);

  const predictSlot = slotOf(Date.now());
  const predictRound = predict && predict[predictSlot];

  const exclusions = groundSize.w > 0
    ? [
        { x: groundSize.w / 2, y: AVATAR_TOP + VILLAGE_AVATAR_SIZE / 2, r: 78 },
        {
          x: HOUSE_LEFT + SHOP_HOUSE_SIZE.width / 2,
          y: HOUSE_TOP + SHOP_HOUSE_SIZE.height / 2,
          r: Math.max(SHOP_HOUSE_SIZE.width, SHOP_HOUSE_SIZE.height) / 2 + 16,
        },
      ]
    : [];

  return (
    <ScrollView style={{ backgroundColor: theme.colors.base }} contentContainerStyle={{ padding: theme.spacing.md }}>
      {intelToday && !intelReadToday && <IntelBanner onPress={() => setIntelOpen(true)} />}

      <IntelCollection />

      {predictRound && (
        <PredictStatusBar
          round={predictRound}
          slot={predictSlot}
          rate={rates[predictRound.entryMarket]}
          onPress={() => setPredictOpen(true)}
        />
      )}

      <View style={{ width: sceneW }}>
        <VillageScene
          width={sceneW}
          height={sceneH}
          weather={tier}
          skyOverlay={<Weather tier={tier} />}
        >
          <View
            style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
            onLayout={(e) => setGroundSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
          >
            <View style={{ position: "absolute", left: HOUSE_LEFT, top: HOUSE_TOP }}>
              <ShopHouse onPress={() => router.push("/(tabs)/shop")} />
            </View>
            <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: AVATAR_TOP, alignItems: "center" }}>
              <VillageAvatar stage={stage} />
            </View>
            {groundSize.w > 0 &&
              owned.map((coin) => (
                <VillagePet
                  key={coin.market}
                  coin={coin}
                  value={values[coin.market] || 0}
                  boundsWidth={groundSize.w}
                  boundsHeight={groundSize.h}
                  exclusions={exclusions}
                  onPress={() => setDetailCoin(coin)}
                />
              ))}
          </View>
        </VillageScene>

        {cat && <CatPicnic key={catKey} width={sceneW} railTop={sceneH - 40} sprite={mewSprite} onDone={() => setCat(false)} />}
        {whale && <BalloonWhale width={sceneW} onDone={() => setWhale(false)} />}
      </View>

      {/* 시장 평균 · 김프 — 김프는 눌러서 용어 설명 */}
      <View style={{ flexDirection: "row", marginTop: theme.spacing.sm, gap: theme.spacing.lg }}>
        <HudPill label="시장 평균" value={pct(avg)} color={avg >= 0 ? theme.colors.up : theme.colors.down} onPress={() => setShowWeatherInfo(true)} />
        <HudPill label="김프" value={pct(usdtRate)} color={usdtRate >= 0 ? theme.colors.up : theme.colors.down} onPress={() => setShowKimpInfo(true)} />
      </View>

      <ThinkingTooltip
        visible={showKimpInfo}
        term={kimpEntry?.term}
        desc={kimpEntry?.desc}
        onClose={() => setShowKimpInfo(false)}
      />
      <WeatherChartModal visible={showWeatherInfo} currentKey={tier.key} onClose={() => setShowWeatherInfo(false)} />

      {/* 경계선 — 마을 씬과 코인 정보 목록을 자연스럽게 구분 */}
      <View style={{ height: 3, backgroundColor: theme.colors.ink, marginTop: theme.spacing.lg, borderRadius: 2 }} />

      {/* 코인 정보 그리드 */}
      <Text
        style={{
          fontFamily: theme.font.pixel,
          fontSize: theme.size.sm,
          color: theme.colors.sub,
          marginTop: theme.spacing.md,
          marginBottom: theme.spacing.sm,
          includeFontPadding: false,
        }}
      >
        코인 정보
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
        {owned.map((coin) => (
          <MarketCard
            key={coin.market}
            coin={coin}
            rate={heldRates[coin.market] || 0}
            qty={wallet.holdings[coin.market].qty}
            onPress={() => setDetailCoin(coin)}
          />
        ))}
      </View>

      <CoinInfoModal
        visible={!!detailCoin}
        coin={detailCoin}
        ticker={detailCoin ? tickers[detailCoin.market] : null}
        holding={detailCoin ? wallet?.holdings[detailCoin.market] : null}
        onClose={() => setDetailCoin(null)}
      />

      <PredictModal visible={predictOpen} onClose={() => setPredictOpen(false)} />
      <IntelModal visible={intelOpen} onClose={() => setIntelOpen(false)} />
    </ScrollView>
  );
}
