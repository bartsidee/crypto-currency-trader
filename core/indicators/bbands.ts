import { Candle } from "../models/candle";
import * as talib from "talib-binding";
import { FixIndicatorOrdering } from "./baseindicator";

export interface Bband {
  UpperBand: (number| undefined)[];
  MiddleBand: (number| undefined)[];
  LowerBand: (number| undefined)[];
}

export let Bbands = function(source: Candle[], period: number = 5, devUp: number  = 2, devDown: number  = 2, type: talib.MATypes = talib.MATypes.SMA): Bband {
  let [UpperBand, MiddleBand, LowerBand] = talib.BBANDS(
    source.map((x) => { return x.Close; }),
    period,
    devUp,
    devDown,
    type
  );

  return {
    UpperBand: FixIndicatorOrdering(UpperBand, source.length),
    MiddleBand: FixIndicatorOrdering(MiddleBand, source.length),
    LowerBand: FixIndicatorOrdering(LowerBand, source.length)
  };
};
