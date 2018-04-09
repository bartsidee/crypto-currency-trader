import { Candle } from "../models/candle";
import * as talib from "talib-binding";
import { FixIndicatorOrdering } from "./baseindicator";

export interface MacdItem {
  Macd: (number| undefined)[];
  Signal: (number| undefined)[];
  Hist: (number| undefined)[];
}

export let Macd = function(source: Candle[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): MacdItem {
  let [Macd, Signal, Hist] = talib.MACD(
    source.map((x) => { return x.Close; }),
    fastPeriod,
    slowPeriod,
    signalPeriod
  );
  return <MacdItem> {
    Macd: FixIndicatorOrdering(Macd, source.length),
    Signal: FixIndicatorOrdering(Signal, source.length),
    Hist: FixIndicatorOrdering(Hist, source.length),
  };
};
