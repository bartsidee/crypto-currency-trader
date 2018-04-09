
import { ITrait } from "./itrait";
import { Candle } from "../../core/models/candle";
import { Rsi } from "../../core/indicators/rsi";

export class RsiT implements ITrait {
  Create(candles: Candle[]): number[] {
    let awesomeOscillator = Rsi(candles);
    let result: number[] = [];

    for (let value of awesomeOscillator) {
      if (value && value < 30)
        result.push(1);
      else if (value && value > 70)
        result.push(-1);
      else
        result.push(0);
    }
    return result;
  }
}