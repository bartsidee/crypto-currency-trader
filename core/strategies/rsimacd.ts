import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";
import { CandleVariable } from "../models/candlevariable";
import * as _ from "lodash";

import { Rsi } from "../indicators/rsi";
import { Macd } from "../indicators/macd";

export class RsiMacd extends ITradingStrategy {

  Name = "RRSI MACD";

  Prepare(): number[] {
    let result: number[] = [];

    let macd = Macd(this.Candles, 14);
    let rsi = Rsi(this.Candles, 14);

    for (let i = 0; i < this.Candles.length; i++) {
      let rsiValue = rsi[i];
      let macdValue = macd.Macd[i];
      let signalValue = macd.Signal[i];

      if (i == 0 || !rsiValue || !macdValue || !signalValue)
        result.push(0);
      else if (rsiValue > 70 && (macdValue - signalValue) < 0)
        result.push(-1);
      else if (rsiValue < 30 && (macdValue - signalValue) > 0)
        result.push(1);
      else
        result.push(0);
    }
    return result;
  }
}