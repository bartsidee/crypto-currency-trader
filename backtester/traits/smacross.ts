
import { ITrait } from "./itrait";
import { Candle } from "../../core/models/candle";
import { Sma } from "../../core/indicators/sma";

export class SmaCrossT implements ITrait {
  Create(candles: Candle[]): number[] {
    let sma10 = Sma(candles, 10);
    let sma20 = Sma(candles, 20);
    let result: number[] = [];

    for (let i = 0; i < candles.length; i++) {
      let sma10Value = sma10[i];
      let sma20Value = sma20[i];
      if (i == 0 || !sma10Value || !sma20Value)
        result.push(0);
      else if (<number>sma20[i - 1] > <number>sma10[i - 1] && sma20Value < sma10Value)
        result.push(1);
      else if (<number>sma20[i - 1] < <number>sma10[i - 1] && sma20Value > sma10Value)
        result.push(-1);
      else
        result.push(0);
    }
    return result;
  }
}