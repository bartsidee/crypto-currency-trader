import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";

import { Adx } from "../indicators/adx";
import { Sar } from "../indicators/sar";
import { PlusDi } from "../indicators/plusdi";
import { MinusDi } from "../indicators/minusdi";
import { Mom } from "../indicators/mom";

///  https://www.liteforex.com/beginners/trading-strategies/629/
export class AdxMomentum extends ITradingStrategy {

  Name = "ADX Momentum";

  Prepare(): number[] {
    let result: number[] = [];
    let adx = Adx(this.Candles, 14);
    let diPlus = PlusDi(this.Candles, 25);
    let diMinus = MinusDi(this.Candles, 25);
    let sar = Sar(this.Candles);
    let mom = Mom(this.Candles, 14);
    for (let i: number = 0; (i < this.Candles.length); i++) {
      let adxValue = adx[i];
      let momValue = mom[i];
      let diMinusValue = diMinus[i];
      let diPlusValue = diPlus[i];
      if (!adxValue || !momValue || !diMinusValue || !diPlusValue) {
        result.push(0);
      }
      else if (adxValue > 25 && momValue < 0 && diMinusValue > 25 && diPlusValue < diMinusValue) {
        result.push(-1);
      }
      else if (adxValue > 25 && momValue > 0 && diMinusValue > 25 && diPlusValue > diMinusValue) {
        result.push(1);
      }
      else {
        result.push(0);
      }
    }

    return result;
  }
}