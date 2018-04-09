import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";
import { CandleVariable } from "../models/candlevariable";
import * as _ from "lodash";

import { Fisher } from "../indicators/fisher";
import { AwesomeOscillator } from "../indicators/awesomeoscillator";

export class FisherTransform extends ITradingStrategy {

  Name = "Fisher Transform";

  Prepare(): number[] {
    let result: number[] = [];

    let fishers = Fisher(this.Candles, 10);
    let ao = AwesomeOscillator(this.Candles);
    for (let i = 0; i < this.Candles.length; i++) {
      let fishersValue = fishers[i];
      let aoValue = ao[i];
      if (i == 0 || !fishersValue || !aoValue)
        result.push(0);
      else if (fishersValue < 0 && <any>fishers[i - 1] > 0 && aoValue < 0)
        result.push(1);
      else if (fishers[i] == 1)
        result.push(-1);
      else
        result.push(0);
    }
    return result;
  }
}