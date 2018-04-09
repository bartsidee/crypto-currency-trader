import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";

import { AwesomeOscillator } from "../indicators/awesomeoscillator";
import { Macd } from "../indicators/macd";

///  https://www.liteforex.com/beginners/trading-strategies/595/
export class AwesomeMacd extends ITradingStrategy {

  Name = "Awesome MACD";

  Prepare(): number[] {
    let result: number[] = [];
    let ao = AwesomeOscillator(this.Candles);
    let macd = Macd(this.Candles, 5, 7, 4);
    for (let i: number = 0; (i < this.Candles.length); i++) {
      let histValue = macd.Hist[i];
      let aoValue = ao[i];
      if ( i === 0 || !aoValue || !histValue) {
        result.push(0);
      }
      else if (aoValue < 0 && <number>ao[i - 1] > 0 && histValue < 0) {
        result.push(-1);
      }
      else if (aoValue > 0 && <number>ao[i - 1] < 0 &&  histValue > 0) {
        result.push(1);
      }
      else {
        result.push(0);
      }

    }

    return result;
  }
}