import * as talib from "talib-binding";
import { Candle } from "../models/candle";
import { FixIndicatorOrdering } from "./baseindicator";

export let AroonOsc = function(source: Candle[], period: number = 25): (number| undefined)[] {
  return FixIndicatorOrdering(talib.AROONOSC(
    source.map((x) => { return x.High; }),
    source.map((x) => { return x.Low; }),
    period
  ), source.length);
};
