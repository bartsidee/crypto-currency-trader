import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";
import { CandleVariable } from "../models/candlevariable";
import * as _ from "lodash";

import { Sma } from "../indicators/sma";
import { Stoch } from "../indicators/stoch";
import { Rsi } from "../indicators/rsi";

export class SmaStochRsi extends ITradingStrategy {

  Name = "SMA Stoch RSI";

  Prepare(): number[] {
    let result: number[] = [];

    let stoch = Stoch(this.Candles, 8);
    let rsi = Rsi(this.Candles, 3);
    let sma150 = Sma(this.Candles, 150);
    let closes = this.Candles.map((x) => x.Close);
    for (let i = 0; i < this.Candles.length; i++) {
      let stochKValue = stoch.K[i];
      let stochDValue = stoch.D[i];
      let rsiValue = rsi[i];
      let sma150Value = sma150[i];

      if (i == 0 || !rsiValue || !sma150Value || !stochKValue || !stochDValue)
        result.push(0);
      else if (closes[i] > sma150Value && stochKValue > 70 && rsiValue < 20 && stochKValue > stochDValue)
        result.push(1);
      else  if (closes[i] < sma150Value && stochKValue > 70 && rsiValue > 80 && stochKValue < stochDValue)
        result.push(-1);
      else
        result.push(0);
    }
    return result;
  }
}