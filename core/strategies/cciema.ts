import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";
import { CandleVariable } from "../models/candlevariable";

import { Cci } from "../indicators/cci";
import { Ema } from "../indicators/ema";

/// https://www.forexstrategiesresources.com/trend-following-forex-strategies/45-cci-and-ema/
export class CciEma extends ITradingStrategy {

  Name = "CCI EMA";

  Prepare(): number[] {
    let result: number[] = [];

    let cci = Cci(this.Candles, 30);
    let ema8 = Ema(this.Candles, 8);
    let ema28 = Ema(this.Candles, 28);

    for (let i = 0; i < this.Candles.length; i++) {
      let cciValue = cci[i];
      let ema8Value =  ema8[i];
      let ema28Value = ema28[i];
      if (i == 0 || !cciValue || !ema8Value || !ema28Value)
        result.push(0);
      else if (cciValue < -100 && ema8Value > ema28Value && <number>ema8[i - 1] < ema28Value)
        result.push(1);
      else if (cciValue > 100 && ema8Value < ema28Value && <number>ema8[i - 1] > ema28Value)
        result.push(-1);
      else
        result.push(0);
    }
    return result;
  }
}