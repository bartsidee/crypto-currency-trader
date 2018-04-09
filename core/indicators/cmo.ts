
import * as talib from "talib-binding";
import { Candle } from "../models/candle";
import { FixIndicatorOrdering } from "./baseindicator";

export let Cmo = function(source: Candle[], period: number = 14): (number| undefined)[] {
  return FixIndicatorOrdering(talib.CMO(
    source.map((x) => { return x.Close; }),
    period
  ), source.length);
};
