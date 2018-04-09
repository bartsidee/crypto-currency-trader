import { Candle } from "../models/candle";
import * as talib from "talib-binding";
import { FixIndicatorOrdering } from "./baseindicator";

export interface StochInt {
  K: (number| undefined)[];
  D: (number| undefined)[];
}

export let Stoch = function(source: Candle[], fastKPeriod: number = 5, slowKPeriod: number = 3, slowKmaType: talib.MATypes = talib.MATypes.SMA,
  slowDPeriod = 3, slowDmaType: talib.MATypes = talib.MATypes.SMA): StochInt {
  let [K, D] = talib.STOCH(
    source.map((x) => { return x.High; }),
    source.map((x) => { return x.Low; }),
    source.map((x) => { return x.Close; }),
    fastKPeriod,
    slowKPeriod,
    slowKmaType,
    slowDPeriod,
    slowDmaType
  );

  return <StochInt> {
    K: FixIndicatorOrdering(K, source.length),
    D: FixIndicatorOrdering(D, source.length),
  };
};
