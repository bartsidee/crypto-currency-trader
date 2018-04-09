import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";
import { CandleVariable } from "../models/candlevariable";
import * as _ from "lodash";

import { Adx } from "../indicators/adx";
import { Stoch } from "../indicators/stoch";
import { BearBull } from "../indicators/bearbull";

export class StochAdx extends ITradingStrategy {

  Name = "Stoch ADX";

  Prepare(): number[] {
    let result: number[] = [];

    let stoch = Stoch(this.Candles, 13);
    let adx = Adx(this.Candles, 14);
    let bearBull = BearBull(this.Candles);

    for (let i = 0; i < this.Candles.length; i++) {
      let stochKValue = stoch.K[i];
      let stochDValue = stoch.D[i];
      let adxValue = adx[i];
      let bearBullValue = bearBull[i];

      if (i == 0 || !adxValue || !bearBullValue || !stochKValue || !stochDValue)
        result.push(0);
      else if (adxValue > 50 && (stochKValue > 90 || stochDValue > 90) && bearBullValue == -1)
        result.push(-1);
      else if (adxValue < 20 && (stochKValue < 10 || stochDValue < 10) && bearBullValue == 1)
        result.push(1);
      else
        result.push(0);
    }
    return result;
  }
}