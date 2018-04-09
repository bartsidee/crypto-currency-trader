import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";
import { CandleVariable } from "../models/candlevariable";
import * as _ from "lodash";

import { Stoch } from "../indicators/stoch";

/// This is a strategy most suited for 1 hour ticks.
export class PowerRanger extends ITradingStrategy {

  Name = "Power Ranger";

  Prepare(): number[] {
    let result: number[] = [];

    let stoch = Stoch(this.Candles, 10);

    for (let i = 0; i < this.Candles.length; i++) {
      let stochKValue = stoch.K[i];
      let stochDValue = stoch.D[i];

      if (i == 0 || !stochKValue || !stochDValue)
        result.push(0);
      else if ((stochKValue > 20 && <number>stoch.K[i - 1] < 20) || (stochDValue > 20 && <number>stoch.D[i - 1] < 20))
        result.push(1);
      else if ((stochKValue < 80 && <number>stoch.K[i - 1] > 80) || (stochDValue < 80 && <number>stoch.D[i - 1] > 80))
        result.push(-1);
      else
        result.push(0);
    }
    return result;
  }
}