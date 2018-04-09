
import * as talib from "talib-binding";
import { Candle } from "../models/candle";
import { Rsi } from "./rsi";
import { Ema, EmaNumber } from "./ema";
import { Sma, SmaNumber } from "./sma";
import { FixIndicatorOrdering } from "./baseindicator";

export let DerivativeOscillator = function(source: Candle[]): (number | undefined)[] {
  let rsi = Rsi(source);
  let ema1 = EmaNumber(<number[]>rsi, 5);
  let ema2 = EmaNumber(<number[]>ema1, 3);
  let sma = SmaNumber(<number[]>ema2, 9);

  for (let i = sma.length; i < source.length; i++)
    sma.push(0, <any>undefined);

  for (let i = ema2.length; i < source.length; i++)
    ema2.push(0, <any>undefined);

  let derivativeOsc: (number | undefined)[] = [];

  for (let i = 0; i < sma.length; i++) {
    let ema2Value = ema2[i];
    let smaValue = sma[i];

    if (!smaValue || !ema2Value)
        derivativeOsc.push(undefined);
    else
        derivativeOsc.push(ema2Value - smaValue);
  }

  return derivativeOsc;
};
