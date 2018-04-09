import { Candle } from "../models/candle";
import * as talib from "talib-binding";
import { FixIndicatorOrdering } from "./baseindicator";

export let Sar = function(source: Candle[], accelerationFactor: number = 0.02, maximumAccelerationFactor: number = 0.2): (number| undefined)[] {
  return FixIndicatorOrdering(talib.SAR(
    source.map((x) => { return x.High; }),
    source.map((x) => { return x.Low; }),
    accelerationFactor,
    maximumAccelerationFactor
  ), source.length);
};