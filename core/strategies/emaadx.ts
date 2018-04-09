import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";
import { CandleVariable } from "../models/candlevariable";

import { Adx } from "../indicators/adx";
import { Ema } from "../indicators/ema";

export class EmaAdx extends ITradingStrategy {

  Name = "EMA ADX";

  Prepare(): number[] {
    let result: number[] = [];

    let emaFast = Ema(this.Candles, 12);
    let emaShort = Ema(this.Candles, 36);
    let adx = Adx(this.Candles);

    for (let i = 0; i < this.Candles.length; i++) {
      let emaFastValue =  emaFast[i];
      let emaShortValue =  emaShort[i];
      let adxValue =  adx[i];
      if (i == 0 || !emaFastValue || !emaShortValue || !adxValue)
        result.push(0);
      else if (emaFastValue > emaShortValue && <number>emaFast[i - 1] < emaShortValue && adxValue < 20)
        result.push(1);
      else if (emaFastValue < emaShortValue && <number>emaFast[i - 1] > emaShortValue && adxValue >= 20)
        result.push(-1);
      else
        result.push(0);
    }
    return result;
  }
}