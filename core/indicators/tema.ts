import { Candle } from "../models/candle";
import { CandleVariable } from "../models/candlevariable";
import * as talib from "talib-binding";
import { FixIndicatorOrdering } from "./baseindicator";

export let Tema = function(source: Candle[], period: number = 20, type: CandleVariable = CandleVariable.Close): (number| undefined)[] {
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

  return FixIndicatorOrdering(talib.TEMA(
    valuesToCheck,
    period
  ), source.length);
};