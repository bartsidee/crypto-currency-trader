import { Candle } from "../models/candle";
import { CandleVariable } from "../models/candlevariable";
import * as talib from "talib-binding";
import { StochInt } from "./stoch";
import { FixIndicatorOrdering } from "./baseindicator";

export let StochRsi = function(source: Candle[], optInTimePeriod: number = 14, type: CandleVariable = CandleVariable.Close, fastKPeriod: number = 5, fastDPeriod = 3, fastDmaType: talib.MATypes = talib.MATypes.SMA): StochInt {
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

  let [K, D] = talib.STOCHRSI(
    valuesToCheck,
    optInTimePeriod,
    fastKPeriod,
    fastDPeriod,
    fastDmaType
  );

  return <StochInt> {
    K: FixIndicatorOrdering(K, source.length),
    D: FixIndicatorOrdering(D, source.length),
  };
};
