
import { ITrait } from "./itrait";
import { Candle } from "../../core/models/candle";
import { Cci } from "../../core/indicators/cci";

export class CciT implements ITrait {
  Create(candles: Candle[]): number[] {
    let awesomeOscillator = Cci(candles);
    let result: number[] = [];

    for (let value of awesomeOscillator) {
      if (value && value > 0)
        result.push(1);
      else if (value && value < -0)
        result.push(-1);
      else
        result.push(0);
    }
    return result;
  }
}