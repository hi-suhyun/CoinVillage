import { useState } from "react";
import { View, Pressable } from "react-native";
import Sun from "./Sun";
import Cloud from "./Cloud";
import WeatherPopup from "./WeatherPopup";

// tier: data/weather.js의 weatherOf() 결과 { key, label, message }.
// 실제 비/태풍 연출(하늘 톤, 빗방울)은 VillageScene이 담당하고, 여기서는 탭하면 그날 날씨
// 메시지를 보여주는 아이콘 역할만 한다. 씬 폭 전체에 중앙 정렬해 팝업이 씬 밖으로 잘리지 않게 한다.
export default function Weather({ tier }) {
  const [open, setOpen] = useState(false);
  const isSunny = tier.key === "sunny";

  return (
    <View pointerEvents="box-none" style={{ position: "absolute", top: 12, left: 0, right: 0, alignItems: "center", zIndex: open ? 6 : 0 }}>
      <Pressable onPress={() => setOpen((v) => !v)}>
        {isSunny ? <Sun /> : <Cloud />}
      </Pressable>
      {open && (
        <View style={{ marginTop: 6 }}>
          <WeatherPopup message={`${tier.label} — ${tier.message}`} />
        </View>
      )}
    </View>
  );
}
