import { Candle } from "../models/candle";
import { FixIndicatorOrdering } from "./baseindicator";
import * as talib from "talib-binding";

export let Adx = function(source: Candle[], period: number = 14): (number| undefined)[] {
  let highs = source.map((x) => {
    return x.High;
  });
  let lows = source.map((x) => {
    return x.Low;
  });
  let closes = source.map((x) => {
    return x.Close;
  });

  return FixIndicatorOrdering(talib.ADX(
    highs,
    lows,
    closes,
    period
  ), source.length);
};
