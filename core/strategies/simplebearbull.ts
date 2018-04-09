import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";
import { CandleVariable } from "../models/candlevariable";
import * as _ from "lodash";

import { Rsi } from "../indicators/rsi";
import { Bbands } from "../indicators/bbands";

export class SimpleBearBull extends ITradingStrategy {

  Name = "The Bull & The Bear";

  Prepare(): number[] {
    let result: number[] = [];

    let closes = this.Candles.map((x) => x.Close);

    for (let i = 0; i < this.Candles.length; i++) {
      if (i >= 2) {
        let current = closes[i];
        let previous = closes[i - 1];
        let prior = closes[i - 2];

        if (current > previous && previous > prior)
          result.push(1);
        else if (current < previous)
          result.push(-1);
        else
          result.push(0);
      } else {
        result.push(0);
      }
    }
    return result;
  }
}