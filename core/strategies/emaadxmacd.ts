import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";
import { CandleVariable } from "../models/candlevariable";
import * as _ from "lodash";

import { Macd } from "../indicators/macd";
import { Ema } from "../indicators/ema";
import { MinusDi } from "../indicators/minusdi";
import { PlusDi } from "../indicators/plusdi";

/// https://www.liteforex.com/beginners/trading-strategies/76/
export class EmaAdxMacd extends ITradingStrategy {

  Name = "EMA ADX MACD";

  Prepare(): number[] {
    let result: number[] = [];

    let ema4 = Ema(this.Candles, 4);
    let ema10 = Ema(this.Candles, 10);
    let plusDi = PlusDi(this.Candles, 28);
    let minusDi = MinusDi(this.Candles, 28);
    let macd = Macd(this.Candles, 5, 10, 4);

    for (let i = 0; i < this.Candles.length; i++) {
      let ema4Value = ema4[i];
      let ema10Value = ema10[i];
      let minusDiValue = minusDi[i];
      let plusDiValue = plusDi[i];
      let macdValue = macd.Macd[i];
      if (i == 0 || !ema4Value || !ema10Value || !minusDiValue || !plusDiValue || !macdValue)
        result.push(0);
      else if (ema4Value < ema10Value && <any>ema4[i - 1] > ema10Value && macdValue < 0 && plusDiValue > minusDiValue)
        result.push(1);
      else if (ema4Value > ema10Value && <any>ema4[i - 1] < ema10Value && macdValue > 0 && plusDiValue < minusDiValue)
        result.push(-1);
      else
        result.push(0);
    }
    return result;
  }
}