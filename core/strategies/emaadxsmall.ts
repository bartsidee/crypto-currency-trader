import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";
import { CandleVariable } from "../models/candlevariable";
import * as _ from "lodash";

import { Macd } from "../indicators/macd";
import { Ema } from "../indicators/ema";
import { MinusDi } from "../indicators/minusdi";
import { PlusDi } from "../indicators/plusdi";

/// http://best-binary-options-strategy.com/binary-option-trading-using-the-adx-and-ema-cross-system/
export class EmaAdxSmall extends ITradingStrategy {

  Name = "EMA ADX Small";

  Prepare(): number[] {
    let result: number[] = [];

    let emaFast = Ema(this.Candles, 3);
    let emaSlow = Ema(this.Candles, 10);
    let plusDi = PlusDi(this.Candles, 14);
    let minusDi = MinusDi(this.Candles, 14);

    for (let i = 0; i < this.Candles.length; i++) {
      let emaFastValue = emaFast[i];
      let emaSlowValue = emaSlow[i];
      let minusDiValue = minusDi[i];
      let plusDiValue = plusDi[i];
      if (i == 0 || !emaFastValue || !emaSlowValue || !minusDiValue || !plusDiValue)
        result.push(0);
      else if (emaFastValue > emaSlowValue && (<any>emaFast[i - 1] < <any>emaSlow[i - 1] || <any>plusDi[i - 1] < <any>minusDi[i - 1]) && plusDiValue > 20 && plusDiValue > minusDiValue)
        result.push(1);
      else if (emaFastValue < emaSlowValue && (<any>emaFast[i - 1] > <any>emaSlow[i - 1] || <any>plusDi[i - 1] > <any>minusDi[i - 1]) && plusDiValue < 20 && plusDiValue < minusDiValue)
        result.push(-1);
      else
        result.push(0);
    }
    return result;
  }
}