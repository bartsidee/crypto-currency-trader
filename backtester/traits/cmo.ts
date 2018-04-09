
import { ITrait } from "./itrait";
import { Candle } from "../../core/models/candle";
import { Cmo } from "../../core/indicators/cmo";

export class CmoT implements ITrait {
  Create(candles: Candle[]): number[] {
    let awesomeOscillator = Cmo(candles);
    let result: number[] = [];

    for (let value of awesomeOscillator) {
      if (value && value < -70)
        result.push(1);
      else if (value && value  > 70)
        result.push(-1);
      else
        result.push(0);
    }
    return result;
  }
}