import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";
import { CandleVariable } from "../models/candlevariable";
import * as _ from "lodash";

import { Rsi } from "../indicators/rsi";
import { Bbands } from "../indicators/bbands";

// https://www.tradingview.com/script/uCV8I4xA-Bollinger-RSI-Double-Strategy-by-ChartArt-v1-1/
export class RsiBbands extends ITradingStrategy {

  Name = "RSI Bbands";

  Prepare(): number[] {
    let result: number[] = [];

    let rsi = Rsi(this.Candles, 6);
    let bbands = Bbands(this.Candles, 200);
    let closes = this.Candles.map((x) => x.Close);

    for (let i = 0; i < this.Candles.length; i++) {
      let rsiValue = rsi[i];
      let bbandsUpperValue = bbands.UpperBand[i];
      let bbandsLowerValue = bbands.LowerBand[i];

      if (i == 0 || !rsiValue || !bbandsUpperValue || !bbandsLowerValue)
        result.push(0);
      else if (<number>rsi[i - 1] > 50 && rsiValue <= 50 && <number>closes[i - 1] < <number>bbands.UpperBand[i - 1] && closes[i] > bbandsUpperValue)
        result.push(-1);
      else if (<number>rsi[i - 1] < 50 && rsiValue >= 50 && <number>closes[i - 1] < <number>bbands.LowerBand[i - 1] && closes[i] > bbandsLowerValue)
        result.push(1);
      else
        result.push(0);
    }
    return result;
  }
}