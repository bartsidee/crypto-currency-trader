import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";

import { Sma } from "../indicators/sma";

///  https://www.liteforex.com/beginners/trading-strategies/623/
export class Base150 extends ITradingStrategy {

  Name = "Base 150";

  Prepare(): number[] {
    let result: number[] = [];
    let sma6 = Sma(this.Candles, 6);
    let sma25 = Sma(this.Candles, 25);
    let sma150 = Sma(this.Candles, 150);
    let sma365 = Sma(this.Candles, 365);
    for (let i: number = 0; (i < this.Candles.length); i++) {
      let sma6Value = sma6[i];
      let sma25Value = sma25[i];
      let sma150Value = sma150[i];
      let sma365Value = sma365[i];
      if (i == 0 || !sma6Value || !sma25Value || !sma150Value || !sma365Value) {
        result.push(0);
      }
      else {
        if (sma6Value > sma150Value
            && sma6Value > sma365Value
            && sma25Value > sma150Value
            && sma25Value > sma365Value
            && (<number>sma6[i - 1] < sma150Value
            || <number>sma6[i - 1] < sma365Value
            || <number>sma25[i - 1] < sma150Value
            || <number>sma25[i - 1] < sma365Value))
          result.push(1);
        if (sma6Value < sma150Value
            && sma6Value < sma365Value
            && sma25Value < sma150Value
            && sma25Value < sma365Value
            && (<number>sma6[i - 1] > sma150Value
            || <number>sma6[i - 1] > sma365Value
            || <number>sma25[i - 1] > sma150Value
            || <number>sma25[i - 1] > sma365Value))
          result.push(-1);
        else
          result.push(0);
      }

    }

    return result;
  }
}