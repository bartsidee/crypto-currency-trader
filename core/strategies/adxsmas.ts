import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";

import { Sma } from "../indicators/sma";
import { Adx } from "../indicators/adx";

///  http://www.binarytribune.com/forex-trading-strategies/combining-average-directional-movement-index-and-emas/
export class AdxSmas extends ITradingStrategy {

  Name = "ADX Smas";

  Prepare(): number[] {
    let result: number[] = [];
    let sma6 = Sma(this.Candles, 3);
    let sma40 = Sma(this.Candles, 10);
    let adx = Adx(this.Candles, 14);
    for (let i: number = 0; (i < this.Candles.length); i++) {
      let adxValue = adx[i];
      let sma6Value = sma6[i];
      let sma40Vaue = sma40[i];
      if (i == 0 || !adxValue || !sma40Vaue || !sma6Value) {
        result.push(0);
      }
      else {
        let sixCross = ((<number>sma6[i - 1] < sma40Vaue && sma6Value > sma40Vaue) ? 1 : 0);
        let fortyCross = ((<number>sma40[i - 1] < sma6Value && sma40Vaue > sma6Value) ? 1 : 0);
        if (adxValue > 25 && sixCross == 1) {
          result.push(1);
        }
        else if (adxValue < 25 && fortyCross == 1) {
          result.push(-1);
        }
        else {
          result.push(0);
        }

      }

    }

    return result;
  }
}