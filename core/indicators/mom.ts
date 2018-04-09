import { Candle } from "../models/candle";
import * as talib from "talib-binding";
import { FixIndicatorOrdering } from "./baseindicator";

export let Mom = function(source: Candle[], period: number = 14): (number| undefined)[] {
  return FixIndicatorOrdering(talib.MOM(
    source.map((x) => { return x.Close; }),
    period
  ), source.length);
};
