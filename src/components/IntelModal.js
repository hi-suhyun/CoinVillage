import { Modal, View, Text, Image, Pressable } from "react-native";
import { useIntel } from "../context/IntelContext";
import { COINS } from "../data/coins";
import { INTEL_ACTIVITY_POINTS } from "../utils/intel";
import PixelButton from "./PixelButton";
import theme from "../theme";

const documentIcon = require("../../assets/icons/document.png");

// 오늘의 첩보 리포트. entry가 주어지면(모은 첩보함에서 다시 열람) 그 항목을 보여주고,
// 없으면 오늘의 첩보를 보여준다 — 코인 관련 첩보면 그 코인 스프라이트를 곁들여 정원/거래소의
// 펫과 같은 캐릭터라는 걸 알아보게 한다.
export default function IntelModal({ visible, entry, onClose }) {
  const { rank, todayEntry, readToday, markRead } = useIntel();
  const shown = entry || todayEntry;
  if (!shown) return null;
  const isToday = todayEntry && shown.key === todayEntry.key;
  const pending = isToday && !readToday; // 아직 정보력을 안 받은, 오늘의 새 첩보
  const coin = shown.coin ? COINS.find((c) => c.market === shown.coin) : null;

  async function confirm() {
    if (pending) await markRead();
    onClose();
  }

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: theme.colors.chrome,
            borderTopWidth: theme.pixel.border, borderLeftWidth: theme.pixel.border, borderRightWidth: theme.pixel.border,
            borderColor: theme.colors.ink,
            borderTopLeftRadius: theme.pixel.radiusRound, borderTopRightRadius: theme.pixel.radiusRound,
            padding: theme.spacing.lg,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: theme.spacing.sm }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image source={documentIcon} style={{ width: 22, height: 22, marginRight: 6 }} resizeMode="contain" />
              <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.lg, color: theme.colors.brand, includeFontPadding: false }}>
                첩보 {pending ? "도착" : "열람"}
              </Text>
            </View>
            <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.sm, color: theme.colors.sub, includeFontPadding: false }}>
              {rank?.label}
            </Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: theme.spacing.md }}>
            {coin ? (
              <View
                style={{
                  width: 40, height: 40, borderRadius: 20, marginRight: theme.spacing.sm,
                  backgroundColor: theme.colors.base, alignItems: "center", justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 22 }}>{shown.emoji}</Text>
              </View>
            ) : (
              <Text style={{ fontSize: 28, marginRight: theme.spacing.sm }}>{shown.emoji}</Text>
            )}
            <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.md, color: theme.colors.text, includeFontPadding: false, flexShrink: 1 }}>
              {shown.title}
            </Text>
          </View>

          <Text style={{ fontFamily: theme.font.regular, color: theme.colors.text, lineHeight: 22, marginBottom: theme.spacing.md }}>
            {shown.body}
          </Text>

          {pending ? (
            <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.xs, color: theme.colors.warn, marginBottom: theme.spacing.sm, includeFontPadding: false }}>
              확인하면 정보력 +{INTEL_ACTIVITY_POINTS}P
            </Text>
          ) : (
            <Text style={{ fontFamily: theme.font.pixel, fontSize: theme.size.xs, color: theme.colors.sub, marginBottom: theme.spacing.sm, includeFontPadding: false }}>
              {isToday ? "오늘 첩보는 이미 확인했어요" : "이미 모은 첩보예요"}
            </Text>
          )}

          <PixelButton title={pending ? "확인했다" : "닫기"} onPress={confirm} color={theme.colors.brand} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
