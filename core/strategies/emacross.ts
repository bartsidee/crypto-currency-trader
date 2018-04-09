import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";
import { CandleVariable } from "../models/candlevariable";
import * as _ from "lodash";

import { Ema } from "../indicators/ema";

export class EmaCross extends ITradingStrategy {

  Name = "EMA Cross";

  Prepare(): number[] {
    let result: number[] = [];

    let ema12 = Ema(this.Candles, 11);
    let ema26 = Ema(this.Candles, 27);

    for (let i = 0; i < this.Candles.length; i++) {
      let ema12Value = ema12[i];
      let ema26Value = ema26[i];
      if (i == 0 || !ema12Value || !ema26Value )
        result.push(0);
      else if (ema12Value < ema26Value && <any>ema12[i - 1] > ema26Value)
        result.push(1);
      else if (ema12Value > ema26Value && <any>ema12[i - 1] < ema26Value)
        result.push(-1);
      else
        result.push(0);
    }
    return result;
  }
}