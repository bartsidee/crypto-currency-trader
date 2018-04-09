import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";

import { Sma } from "../indicators/sma";

export class BigThree extends ITradingStrategy {

  Name = "Big Three";

  Prepare(): number[] {
    let result: number[] = [];

    let sma20 = Sma(this.Candles, 20);
    let sma40 = Sma(this.Candles, 40);
    let sma80 = Sma(this.Candles, 80);
    for (let i: number = 0; (i < this.Candles.length); i++) {
      let sma20Value = sma20[i];
      let sma40Value = sma40[i];
      let sma80alue = sma80[i];
      if (i < 2 || !sma20Value || !sma40Value || !sma80alue) {
        result.push(0);
      }
      else {
        let lastIsGreen = (this.Candles[i].Close > this.Candles[i].Open);
        let previousIsRed = (this.Candles[(i - 1)].Close < this.Candles[(i - 1)].Open);
        let beforeIsGreen = (this.Candles[(i - 2)].Close > this.Candles[(i - 2)].Open);
        let highestSma = Math.max(sma20Value, sma40Value, sma80alue);

        let lastAboveSma = this.Candles[i].Close > highestSma && this.Candles[i].High > highestSma &&
                            this.Candles[i].Low > highestSma && this.Candles[i].Open > highestSma;

        let previousAboveSma = this.Candles[i - 1].Close > highestSma && this.Candles[i - 1].High > highestSma &&
                            this.Candles[i - 1].Low > highestSma && this.Candles[i - 1].Open > highestSma;

        let beforeAboveSma = this.Candles[i - 2].Close > highestSma && this.Candles[i - 2].High > highestSma &&
                            this.Candles[i - 2].Low > highestSma && this.Candles[i - 2].Open > highestSma;

        let allAboveSma = lastAboveSma && previousAboveSma && beforeAboveSma;
        let hitsAnSma = (sma80alue < this.Candles[i].High && sma80alue > this.Candles[i].Low);

        if (lastIsGreen && previousIsRed && beforeIsGreen && allAboveSma && sma20Value > sma40Value && sma20Value > sma80alue)
          result.push(1);
        else if (hitsAnSma)
          result.push(-1);
        else
          result.push(0);
      }

  }
  return result;
  }
}