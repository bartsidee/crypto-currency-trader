import { AdxSmas } from "./adxsmas";
import { Candle } from "../models/candle";
import { Logger } from "../logger";

function fillArray(value: any, len: number) {
  if (len == 0) return [];
  let a = [value];
  while (a.length * 2 <= len) a = a.concat(a);
  if (a.length < len) a = a.concat(a.slice(0, len - a.length));
  return a;
}

test("ADX Test", () => {
  let sampleCandles: Candle[] = fillArray({
    Timestamp: new Date(),
    High: 2,
    Low: 1,
    Open: 1.5,
    Close: 1.7,
    Volume: 11234,
  }, 40);

  let strategy = new AdxSmas();
  strategy.Candles = sampleCandles;
  let results = strategy.Prepare();
  // expect(results).toEqual([100, 100]);
});