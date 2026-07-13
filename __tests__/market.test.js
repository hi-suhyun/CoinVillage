const { normalizePosition, charX, charY, laneX, spriteSize, marketMood, marketAvg, kimchiSign } = require("../src/utils/market");

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
test("charY: 상승(양수)일수록 위(작은 y), 하락(음수)일수록 아래(큰 y)", () => {
  const up = charY(0.2, 400, 60, 0, 0.2);
  const mid = charY(0, 400, 60, 0, 0.2);
  const down = charY(-0.2, 400, 60, 0, 0.2);
  expect(up).toBeLessThan(mid);
  expect(mid).toBeLessThan(down);
  expect(mid).toBeCloseTo((400 - 60) / 2); // 0% 는 트랙 세로 중앙
});

test("charY: pad 로 상/하한 클램프 — 프레임/땅을 뚫지 않음", () => {
  const pad = 20;
  const top = charY(1, 400, 60, pad, 0.2); // 극단 상승
  const bottom = charY(-1, 400, 60, pad, 0.2); // 극단 하락
  expect(top).toBeGreaterThanOrEqual(pad);
  expect(bottom + 60).toBeLessThanOrEqual(400 - pad);
});

test("charY: baseline을 내리면 0%가 트랙 아래쪽에 위치하고 상승 쪽 이동폭이 더 커짐", () => {
  const trackHeight = 400, charHeight = 60, pad = 0, maxAbs = 0.2, baseline = 0.62;
  const mid = charY(0, trackHeight, charHeight, pad, maxAbs, baseline);
  const top = charY(maxAbs, trackHeight, charHeight, pad, maxAbs, baseline); // 극단 상승
  const bottom = charY(-maxAbs, trackHeight, charHeight, pad, maxAbs, baseline); // 극단 하락

  expect(mid).toBeCloseTo(baseline * trackHeight - charHeight / 2);
  expect(top).toBeCloseTo(pad); // 상단 극단은 pad까지
  expect(bottom).toBeCloseTo(trackHeight - charHeight - pad); // 하단 극단은 바닥까지
  // 기준선이 아래로 내려갔으므로 상승 쪽(0→top) 이동폭이 하락 쪽(0→bottom) 이동폭보다 커야 함
  expect(mid - top).toBeGreaterThan(bottom - mid);
});

test("laneX + spriteSize: 인접 레인 스프라이트가 절대 겹치지 않음", () => {
  const sceneW = 360;
  for (let count = 1; count <= 6; count++) {
    const size = spriteSize(sceneW, count);
    for (let i = 0; i < count - 1; i++) {
      const rightEdge = laneX(i, count, sceneW, size) + size;
      const nextLeft = laneX(i + 1, count, sceneW, size);
      expect(rightEdge).toBeLessThanOrEqual(nextLeft);
    }
    // 모든 스프라이트가 씬 폭 안에 들어옴
    expect(laneX(0, count, sceneW, size)).toBeGreaterThanOrEqual(0);
    expect(laneX(count - 1, count, sceneW, size) + size).toBeLessThanOrEqual(sceneW + 0.001);
  }
});

test("marketAvg: 변동률 평균", () => {
  expect(marketAvg([0.1, -0.1, 0.4])).toBeCloseTo(0.1333, 3);
  expect(marketAvg([])).toBe(0);
});

test("marketMood: 평균 음수면 cloudy", () => {
  expect(marketMood([-0.1, 0.02, -0.05])).toBe("cloudy");
  expect(marketMood([0.1, 0.02, 0.05])).toBe("sunny");
});
test("kimchiSign: USDT 변동률 음수면 rain", () => {
  expect(kimchiSign(-0.01)).toBe("rain");
  expect(kimchiSign(0.01)).toBe("shine");
});
