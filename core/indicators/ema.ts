import { Candle } from "../models/candle";
import { CandleVariable } from "../models/candlevariable";
import * as talib from "talib-binding";
import { FixIndicatorOrdering } from "./baseindicator";

export let Ema = function(source: Candle[], period: number = 30, type: CandleVariable = CandleVariable.Close): (number| undefined)[] {
  let valuesToCheck: number[];
  switch (type) {
    case CandleVariable.Open:
      valuesToCheck = source.map((x) => { return x.Open; });
      break;
    case CandleVariable.Low:
      valuesToCheck = source.map((x) => { return x.Low; });
      break;
    case CandleVariable.High:
      valuesToCheck = source.map((x) => { return x.High; });
      break;
    default:
      valuesToCheck = source.map((x) => { return x.Close; });
      break;
  }
  return FixIndicatorOrdering(talib.EMA(
    valuesToCheck,
    period
  ), source.length);
};


export let EmaNumber = function(source: number[], period: number = 30): (number| undefined)[] {
  return FixIndicatorOrdering(talib.EMA(
    source,
    period
  ), source.length);
};
