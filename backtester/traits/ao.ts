
import { ITrait } from "./itrait";
import { Candle } from "../../core/models/candle";
import { AwesomeOscillator } from "../../core/indicators/awesomeoscillator";

export class AoT implements ITrait {
  Create(candles: Candle[]): number[] {
    let awesomeOscillator = AwesomeOscillator(candles);
    let result: number[] = [];

    for (let value of awesomeOscillator) {
      if (value && value > 0)
        result.push(1);
      if (value && value < 0)
        result.push(1);
      else
        result.push(0);
    }
    return result;
  }
}