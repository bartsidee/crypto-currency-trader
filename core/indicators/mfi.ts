import { Candle } from "../models/candle";
import * as talib from "talib-binding";
import { FixIndicatorOrdering } from "./baseindicator";

export let Mfi = function(source: Candle[], period: number = 14): (number| undefined)[] {
  return FixIndicatorOrdering(talib.MFI(
    source.map((x) => { return x.High; }),
    source.map((x) => { return x.Low; }),
    source.map((x) => { return x.Close; }),
    source.map((x) => { return x.Volume; }),
    period
  ), source.length);
};
