import { Candle } from "../models/candle";
import * as talib from "talib-binding";
import { FixIndicatorOrdering } from "./baseindicator";

export let Roc = function(source: Candle[], period: number = 14): (number| undefined)[] {
  return FixIndicatorOrdering(talib.ROC(
    source.map((x) => { return x.Close; }),
    period
  ), source.length);
};

export let RocNumber = function(source: number[], period: number = 14): (number| undefined)[] {
  return FixIndicatorOrdering(talib.ROC(
    source,
    period
  ), source.length);
};