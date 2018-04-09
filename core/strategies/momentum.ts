import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";
import { CandleVariable } from "../models/candlevariable";
import * as _ from "lodash";

import { Sma } from "../indicators/sma";
import { Mom } from "../indicators/mom";
import { Rsi } from "../indicators/rsi";

/// This is a strategy most suited for 1 hour ticks.
export class Momentum extends ITradingStrategy {

  Name = "Momentum";

  Prepare(): number[] {
    let result: number[] = [];

    let sma11 = Sma(this.Candles, 11);
    let sma21 = Sma(this.Candles, 21);
    let mom = Mom(this.Candles, 30);
    let rsi = Rsi(this.Candles);
    let closes = this.Candles.map(x => x.Close);

    for (let i = 0; i < this.Candles.length; i++) {
      let sma11Value = sma11[i];
      let sma21Value = sma21[i];
      let momValue = mom[i];
      let rsiValue = rsi[i];

      if (i == 0 || !sma11Value || !sma21Value || !momValue || !rsiValue)
        result.push(0);
      else if (rsiValue < 30 && momValue > 0 && sma11Value > sma21Value && closes[i] > sma21Value && closes[i] > sma11Value)
        result.push(1);
      else if (rsiValue > 70 && momValue < 0 && sma11Value < sma21Value && closes[i] < sma21Value && closes[i] < sma11Value)
        result.push(-1);
      else
        result.push(0);
    }
    return result;
  }
}