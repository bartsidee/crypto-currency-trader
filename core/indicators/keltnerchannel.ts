import { Candle } from "../models/candle";
import * as talib from "talib-binding";
import { FixIndicatorOrdering } from "./baseindicator";

export interface KeltnerChannel {
  UpperBand: (number| undefined)[];
  MiddleBand: (number| undefined)[];
  LowerBand: (number| undefined)[];
}

export let KeltnerChannel = function(source: Candle[], period: number = 25, multiplier: number = 2): KeltnerChannel {
  let ema = talib.EMA(
    source.map((x) => { return x.Close; }),
    period
  );

  let atr = talib.ATR(
    source.map((x) => { return x.High; }),
    source.map((x) => { return x.Low; }),
    source.map((x) => { return x.Close; }),
    period
  );

  return {
    UpperBand: FixIndicatorOrdering(ema.map((x, index) => { return x + (atr[index] * multiplier); }) , source.length),
    MiddleBand: FixIndicatorOrdering(ema, source.length),
    LowerBand: FixIndicatorOrdering(ema.map((x, index) => { return x - (atr[index] * multiplier); }), source.length)
  };
};
