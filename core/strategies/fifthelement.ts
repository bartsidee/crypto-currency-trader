import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";
import { CandleVariable } from "../models/candlevariable";
import * as _ from "lodash";

import { Macd } from "../indicators/macd";

export class FifthElement extends ITradingStrategy {

  Name = "5th Element";

  Prepare(): number[] {
    let result: number[] = [];

    let macd = Macd(this.Candles, 11, 27, 9);
    for (let i = 0; i < this.Candles.length; i++) {
      let macdValue = macd.Macd[i];
      let histValue = macd.Hist[i];
      let signalValue = macd.Signal[i];

      if (i < 4 || !macdValue || !histValue || !signalValue)
        result.push(0);
      else if ((macdValue - signalValue > 0) && (histValue > <number>macd.Hist[i - 1] && <number>macd.Hist[i - 1] > <number>macd.Hist[i - 2] && <number>macd.Hist[i - 2] > <number>macd.Hist[i - 3] && <number>macd.Hist[i - 3] > <number>macd.Hist[i - 4]))
        result.push(1);
      else if ((macdValue - signalValue > 0) && (histValue < <number>macd.Hist[i - 1] && <number>macd.Hist[i - 1] < <number>macd.Hist[i - 2] && <number>macd.Hist[i - 2] < <number>macd.Hist[i - 3] && <number>macd.Hist[i - 3] < <number>macd.Hist[i - 4]))
        result.push(-1);
      else
        result.push(0);
    }
    return result;
  }
}