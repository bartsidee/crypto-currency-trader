import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";
import { CandleVariable } from "../models/candlevariable";

import { Cci } from "../indicators/cci";
import { Rsi } from "../indicators/rsi";

export class CciRsi extends ITradingStrategy {

  Name = "CCI RSI";

  Prepare(): number[] {
    let result: number[] = [];

    let cci = Cci(this.Candles);
    let rsi = Rsi(this.Candles);

    for (let i = 0; i < this.Candles.length; i++) {
      let cciValue = cci[i];
      let rsiValue =  rsi[i];
      if (i == 0 || !cciValue || !rsiValue)
        result.push(0);
      else if (rsiValue < 30 && cciValue < -100)
        result.push(1);
      else if (rsiValue > 70 && cciValue > 100)
        result.push(-1);
      else
        result.push(0);
    }
    return result;
  }
}