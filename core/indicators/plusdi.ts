import { Candle } from "../models/candle";
import * as talib from "talib-binding";
import { FixIndicatorOrdering } from "./baseindicator";

export let PlusDi = function(source: Candle[], period: number = 14): (number| undefined)[] {
  return FixIndicatorOrdering(talib.PLUS_DI(
    source.map((x) => { return x.High; }),
    source.map((x) => { return x.Low; }),
    source.map((x) => { return x.Close; }),
    period
  ), source.length);
};
