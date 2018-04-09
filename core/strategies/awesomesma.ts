import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";

import { AwesomeOscillator } from "../indicators/awesomeoscillator";
import { Sma } from "../indicators/sma";

export class AwesomeSma extends ITradingStrategy {

  Name = "Awesome SMA";

  Prepare(): number[] {
    let result: number[] = [];
    let ao = AwesomeOscillator(this.Candles);
    let smaShort = Sma(this.Candles, 20);
    let smaLong = Sma(this.Candles, 40);
    for (let i: number = 0; (i < this.Candles.length); i++) {
      let smaShortValue = smaShort[i];
      let smaLongValue = smaLong[i];
      let aoValue = ao[i];
      if (i == 0 || !smaShortValue || !aoValue || !smaLongValue) {
        result.push(0);
      }
      else if ((aoValue > 0 && <number>ao[i - 1] < 0 && smaShortValue > smaLongValue) ||
        (aoValue > 0 && smaShortValue > smaLongValue && <number>smaShort[i - 1] < <number>smaLong[i - 1])) {
        result.push(1);
      }
      else {
        result.push(0);
      }

    }

    return result;
  }
}