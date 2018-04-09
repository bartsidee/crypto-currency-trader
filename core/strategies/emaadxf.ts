import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";
import { CandleVariable } from "../models/candlevariable";
import * as _ from "lodash";

import { Adx } from "../indicators/adx";
import { Ema } from "../indicators/ema";
import { MinusDi } from "../indicators/minusdi";
import { PlusDi } from "../indicators/plusdi";

/// http://www.profitf.com/forex-strategies/ema-adx-15-min-system/
export class EmaAdxF extends ITradingStrategy {

  Name = "EMA ADX F";

  Prepare(): number[] {
    let result: number[] = [];

    let closes = _.map(this.Candles, (x) => x.Close);
    let ema9 = Ema(this.Candles, 9);
    let adx = Adx(this.Candles, 14);
    let minusDI = MinusDi(this.Candles, 14);
    let plusDI = PlusDi(this.Candles, 14);

    for (let i = 0; i < this.Candles.length; i++) {
      let ema9Value = ema9[i];
      let adxValue = adx[i];
      let minusDIValue = minusDI[i];
      let plusDIValue = plusDI[i];
      if (i == 0 || !ema9Value || !adxValue || !minusDIValue || !plusDIValue)
        result.push(0);
      else if (ema9Value < closes[i] && plusDIValue > 20 && plusDIValue > minusDIValue)
        result.push(1);
      else if (ema9Value > closes[i] && minusDIValue > 20 && plusDIValue < minusDIValue)
        result.push(-1);
      else
        result.push(0);
    }
    return result;
  }
}