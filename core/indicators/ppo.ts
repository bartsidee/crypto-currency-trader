import { Candle } from "../models/candle";
import * as talib from "talib-binding";
import { FixIndicatorOrdering } from "./baseindicator";

export let Ppo = function(source: Candle[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod = 9, type: talib.MATypes = talib.MATypes.EMA) {
  let ppo = talib.PPO(
    source.map((x) => { return x.Close; }),
    fastPeriod,
    slowPeriod,
    type
  );
  let ppoSignal = talib.EMA(
    ppo,
    signalPeriod
  );

  return {
    Ppo: FixIndicatorOrdering(ppo, source.length),
    Signal: FixIndicatorOrdering(ppoSignal, source.length)
  };
};
