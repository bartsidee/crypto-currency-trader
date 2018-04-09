
import { ITrait } from "./itrait";
import { Candle } from "../../core/models/candle";
import { Ema } from "../../core/indicators/ema";

export class EmaCrossT implements ITrait {
  Create(candles: Candle[]): number[] {
    let ema10 = Ema(candles, 10);
    let ema20 = Ema(candles, 20);
    let result: number[] = [];

    for (let i = 0; i < candles.length; i++) {
      let ema10Value = ema10[i];
      let ema20Value = ema20[i];
      if (i == 0 || !ema10Value || !ema20Value)
        result.push(0);
      else if (<number>ema20[i - 1] > <number>ema10[i - 1] && ema20Value < ema10Value)
        result.push(1);
      else if (<number>ema20[i - 1] < <number>ema10[i - 1] && ema20Value > ema10Value)
        result.push(-1);
      else
        result.push(0);
    }
    return result;
  }
}