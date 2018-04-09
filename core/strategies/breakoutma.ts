import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";
import { CandleVariable } from "../models/candlevariable";

import { Adx } from "../indicators/adx";
import { Ema } from "../indicators/ema";
import { Sma } from "../indicators/sma";


/// Technically this is a 1d, but can be used more for e.g. 1 hour ticks.
export class BreakoutMa extends ITradingStrategy {

  Name = "Breakout MA";

  Prepare(): number[] {
    let result: number[] = [];

    let sma20 = Sma(this.Candles, 20, CandleVariable.Low);
    let ema34 = Ema(this.Candles, 34);
    let adx = Adx(this.Candles, 13);

    for (let i = 0; i < this.Candles.length; i++) {
      let ema34Value = ema34[i];
      let sma20Value =  sma20[i];
      let adxValue = adx[i];
      if (!ema34Value || !sma20Value || !adxValue)
        result.push(0);
      else if (ema34Value > sma20Value && adxValue > 25)
          result.push(1);
      else if (ema34Value < sma20Value && adxValue > 25)
          result.push(-1);
      else
          result.push(0);
    }
    return result;
  }
}