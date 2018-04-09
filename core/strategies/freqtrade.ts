import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";
import { CandleVariable } from "../models/candlevariable";
import * as _ from "lodash";

import { Sma } from "../indicators/sma";
import { Adx } from "../indicators/adx";
import { Tema } from "../indicators/tema";
import { Mfi } from "../indicators/mfi";
import { Sar } from "../indicators/sar";
import { Cci } from "../indicators/cci";
import { StochFast } from "../indicators/stochfast";
import { Bbands } from "../indicators/bbands";
import { Fisher } from "../indicators/fisher";
import { AwesomeOscillator } from "../indicators/awesomeoscillator";

export class FreqTrade extends ITradingStrategy {

  Name = "FreqTrade";

  Prepare(): number[] {
    let result: number[] = [];

    let sma = Sma(this.Candles, 100);
    let closes = this.Candles.map(x => x.Close);
    let adx = Adx(this.Candles);
    let tema = Tema(this.Candles, 4);
    let mfi = Mfi(this.Candles, 14);
    let sar = Sar(this.Candles, 0.02, 0.22);

    let cci = Cci(this.Candles, 5);
    let stoch = StochFast(this.Candles);
    let bbandsLower = Bbands(this.Candles).MiddleBand;
    let fishers = Fisher(this.Candles);

    for (let i = 0; i < this.Candles.length; i++) {
      let smaValue = sma[i];
      let adxValue = adx[i];
      let temaValue = tema[i];
      let mfiValue = mfi[i];
      let sarValue = sar[i];
      let cciValue = cci[i];
      let stochDValue = stoch.D[i];
      let bbandsLowerValue = bbandsLower[i];
      let fishersLowerValue = fishers[i];
      if (i == 0 || !smaValue || !adxValue || !temaValue || !mfiValue || !sarValue || !cciValue || !stochDValue || !bbandsLowerValue || !fishersLowerValue )
        result.push(0);
      else if (closes[i] < smaValue && cciValue < -100 && stochDValue < 20 && fishersLowerValue < 0 &&
          adxValue > 20 && mfiValue < 30 && temaValue <= bbandsLowerValue)
        result.push(1);
      else if (fishers[i] == 1)
        result.push(-1);
      else
        result.push(0);
    }
    return result;
  }
}