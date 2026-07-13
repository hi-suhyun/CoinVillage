const Decimal = require("decimal.js");
Decimal.set({ precision: 40, rounding: Decimal.ROUND_DOWN });

const D = (x) => new Decimal(x == null || x === "" ? 0 : x);
const add = (a, b) => D(a).plus(D(b)).toString();
const sub = (a, b) => D(a).minus(D(b)).toString();
const mul = (a, b) => D(a).times(D(b)).toString();
const div = (a, b) => D(a).div(D(b)).toString();
const trunc = (x, dp) => D(x).toFixed(dp, Decimal.ROUND_DOWN);
const cmp = (a, b) => D(a).cmp(D(b));
const gt = (a, b) => cmp(a, b) > 0;
const gte = (a, b) => cmp(a, b) >= 0;
const lte = (a, b) => cmp(a, b) <= 0;
const isPos = (x) => D(x).gt(0);
const toDisplay = (x, dp) => {
  const t = D(x).toFixed(dp, Decimal.ROUND_DOWN);
  return new Decimal(t).toString(); // 불필요한 0 제거
};

module.exports = { D, add, sub, mul, div, trunc, cmp, gt, gte, lte, isPos, toDisplay };
