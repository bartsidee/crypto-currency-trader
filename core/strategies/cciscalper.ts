import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";
import { CandleVariable } from "../models/candlevariable";

import { Cci } from "../indicators/cci";
import { Ema } from "../indicators/ema";

/// https://www.liteforex.com/beginners/trading-strategies/830/
export class CciScalper extends ITradingStrategy {

  Name = "CCI Scalper";

  Prepare(): number[] {
    let result: number[] = [];

    let cci = Cci(this.Candles, 160);
    let ema10 = Ema(this.Candles, 10);
    let ema21 = Ema(this.Candles, 21);
    let ema50 = Ema(this.Candles, 50);

    for (let i = 0; i < this.Candles.length; i++) {
      let cciValue = cci[i];
      let ema10Value =  ema10[i];
      let ema21Value =  ema21[i];
      let ema50Value =  ema50[i];
      if (!cciValue || !ema10Value || !ema21Value || !ema50Value)
        result.push(0);
      else if (cciValue > 0 && ema10Value > ema21Value && ema10Value > ema50Value)
        result.push(1);
      else if (cciValue < -0 && ema10Value < ema21Value && ema10Value < ema50Value)
        result.push(-1);
      else
        result.push(0);
    }
    return result;
  }
}