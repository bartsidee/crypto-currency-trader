import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";
import { CandleVariable } from "../models/candlevariable";
import * as _ from "lodash";

import { Sma } from "../indicators/sma";
import { Rsi } from "../indicators/rsi";

/// https://www.liteforex.com/beginners/trading-strategies/detail/679/
export class DoubleVolatility extends ITradingStrategy {

  Name = "Double Volatility";

  Prepare(): number[] {
    let result: number[] = [];

    let sma5High = Sma(this.Candles, 5, CandleVariable.High);
    let sma20High = Sma(this.Candles, 20, CandleVariable.High);
    let sma20Low = Sma(this.Candles, 20, CandleVariable.Low);
    let closes = _.map(this.Candles, (x) => x.Close);
    let opens = _.map(this.Candles, (x) => x.Open);
    let rsi = Rsi(this.Candles, 11);

    for (let i = 0; i < this.Candles.length; i++) {
      let sma5HighValue = sma5High[i];
      let sma20HighValue =  sma20High[i];
      let sma20LowValue =  sma20Low[i];
      let rsiValue =  rsi[i];
      if (i < 1 || !sma5HighValue || !sma20HighValue || !sma20LowValue || !rsiValue)
        result.push(0);
      else if (sma5HighValue > sma20HighValue && rsiValue > 65 && Math.abs(opens[i] - closes[i]) / Math.abs(opens[i - 1] - closes[i - 1]) < 2)
        result.push(1);
      else if (sma5HighValue < sma20LowValue && rsiValue < 35)
        result.push(-1);
      else
        result.push(0);
    }
    return result;
  }
}