import { Candle } from "../models/candle";
import * as talib from "talib-binding";
import { StochInt } from "./stoch";
import { FixIndicatorOrdering } from "./baseindicator";

export let StochFast = function(source: Candle[], fastKPeriod: number = 5, fastDPeriod = 3, fastDmaType: talib.MATypes = talib.MATypes.SMA): StochInt {
  let [K, D] = talib.STOCH(
    source.map((x) => { return x.High; }),
    source.map((x) => { return x.Low; }),
    source.map((x) => { return x.Close; }),
    fastKPeriod,
    fastDPeriod,
    fastDmaType
  );

  return <StochInt> {
    K: FixIndicatorOrdering(K, source.length),
    D: FixIndicatorOrdering(K, source.length)
  };
};
