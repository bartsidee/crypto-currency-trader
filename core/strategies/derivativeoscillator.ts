import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";
import { CandleVariable } from "../models/candlevariable";

import { DerivativeOscillator } from "../indicators/derivativeoscillator";

export class DeriveOscillator extends ITradingStrategy {

  Name = "Derivative Oscillator";

  Prepare(): number[] {
    let result: number[] = [];

    let derivativeOsc = DerivativeOscillator(this.Candles);

    for (let i = 0; i < this.Candles.length; i++) {
      let derivativeOscValue = derivativeOsc[i];
      if (i == 0 || !derivativeOscValue)
        result.push(0);
      else if (<number> derivativeOsc[i - 1] < 0 && derivativeOscValue > 0)
        result.push(1);
      else if (derivativeOscValue >= 0 && derivativeOscValue <= <number> derivativeOsc[i - 1])
        result.push(-1);
      else
        result.push(0);
    }
    return result;
  }
}