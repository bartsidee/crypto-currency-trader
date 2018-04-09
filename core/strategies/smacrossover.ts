import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";
import { CandleVariable } from "../models/candlevariable";
import * as _ from "lodash";

import { Sma } from "../indicators/sma";

export class SmaCrossover extends ITradingStrategy {

  Name = "SMA Crossover";

  Prepare(): number[] {
    let result: number[] = [];

    let sma12 = Sma(this.Candles, 11);
    let sma26 = Sma(this.Candles, 27);

    for (let i = 0; i < this.Candles.length; i++) {
      let sma12Value = sma12[i];
      let sma26Value = sma26[i];

      if (i == 0 || !sma12Value || !sma26Value)
        result.push(0);
      else if (sma12Value < sma26Value && <number>sma12[i - 1] > sma26Value)
        result.push(1);
      // When the slow SMA moves above the fast SMA, we have a negative cross-over
      else if (sma12Value > sma26Value && <number>sma12[i - 1] < sma26Value)
        result.push(-1);
      else
        result.push(0);
    }
    return result;
  }
}