// 배경을 투명 처리한다. 단순히 "흰색에 가까운 모든 픽셀"을 지우면 캐릭터 내부의 흰색 디테일
// (예: 페페의 눈 흰자)까지 함께 지워진다. 대신 이미지 가장자리에서부터 흰색 픽셀을 따라
// flood-fill로 번져나가 "배경과 실제로 연결된" 흰 영역만 투명 처리하고, 다른 색에 둘러싸여
// 고립된 흰 영역(눈 흰자 등)은 배경과 연결되지 않으므로 그대로 남는다.
const { PNG } = require("pngjs");
const path = require("path");
const fs = require("fs");

const SRC = path.join(__dirname, "..", "img");
const OUT = path.join(__dirname, "..", "assets", "characters");

const map = {
  "KakaoTalk_20260628_191726819_01.png": "doge.png",
  "KakaoTalk_20260628_191726819_02.png": "mew.png",
  "KakaoTalk_20260628_191726819_05.png": "shib.png",
  "KakaoTalk_20260628_191726819_04.png": "pepe.png",
  "KakaoTalk_20260628_191726819.png": "bonk.png",
  "KakaoTalk_20260628_191726819_03.png": "pengu.png",
};

// THRESH=245: near-pure white만 배경 후보로 취급.
const THRESH = 245;

function isWhite(data, i) {
  return data[i] >= THRESH && data[i + 1] >= THRESH && data[i + 2] >= THRESH;
}

function clearBackground(png) {
  const { width: w, height: h, data } = png;

  // img/ 원본 자체가 이미 예전(버그 있는) 실행으로 알파가 일부 0으로 저장돼 있을 수 있다.
  // RGB는 그대로 남아있으므로, 알파를 전부 불투명(255)으로 되돌린 뒤 아래 flood-fill로만
  // 투명 여부를 다시 판정한다. 그래야 원본 파일의 손상 여부와 무관하게 항상 같은 결과가 나온다.
  for (let p = 0; p < w * h; p++) data[p * 4 + 3] = 255;

  const bg = new Uint8Array(w * h);
  const stack = [];
  const idx = (x, y) => y * w + x;

  for (let x = 0; x < w; x++) {
    if (isWhite(data, idx(x, 0) * 4)) stack.push([x, 0]);
    if (isWhite(data, idx(x, h - 1) * 4)) stack.push([x, h - 1]);
  }
  for (let y = 0; y < h; y++) {
    if (isWhite(data, idx(0, y) * 4)) stack.push([0, y]);
    if (isWhite(data, idx(w - 1, y) * 4)) stack.push([w - 1, y]);
  }

  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    const p = idx(x, y);
    if (bg[p]) continue;
    if (!isWhite(data, p * 4)) continue;
    bg[p] = 1;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1], [x + 1, y + 1], [x - 1, y - 1], [x + 1, y - 1], [x - 1, y + 1]);
  }

  for (let p = 0; p < w * h; p++) {
    if (bg[p]) data[p * 4 + 3] = 0;
  }
}

fs.mkdirSync(OUT, { recursive: true });
for (const [src, out] of Object.entries(map)) {
  const srcPath = path.join(SRC, src);
  const outPath = path.join(OUT, out);

  const png = PNG.sync.read(fs.readFileSync(srcPath));
  clearBackground(png);
  fs.writeFileSync(outPath, PNG.sync.write(png));

  const stat = fs.statSync(outPath);
  console.log(`wrote ${out} (${(stat.size / 1024).toFixed(1)} KB)`);
}
console.log("Done.");
