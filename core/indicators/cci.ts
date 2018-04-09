import * as talib from "talib-binding";
import { Candle } from "../models/candle";
import { FixIndicatorOrdering } from "./baseindicator";

export let Cci = function(source: Candle[], period: number = 14): (number| undefined)[] {
  return FixIndicatorOrdering(talib.CCI(
    source.map((x) => { return x.High; }),
    source.map((x) => { return x.Low; }),
    source.map((x) => { return x.Close; }),
    period
  ), source.length);
};
