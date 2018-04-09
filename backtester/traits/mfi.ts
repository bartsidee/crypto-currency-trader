
import { ITrait } from "./itrait";
import { Candle } from "../../core/models/candle";
import { Mfi } from "../../core/indicators/mfi";

export class MfiT implements ITrait {
  Create(candles: Candle[]): number[] {
    let awesomeOscillator = Mfi(candles);
    let result: number[] = [];

    for (let value of awesomeOscillator) {
      if (value && value < 20)
        result.push(1);
      else if (value && value > 80)
        result.push(-1);
      else
        result.push(0);
    }
    return result;
  }
}