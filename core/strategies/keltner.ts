import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";

import { KeltnerChannel } from "../indicators/keltnerchannel";
import { AroonOsc } from "../indicators/aroonosc";
import { StochRsi } from "../indicators/stochrsi";

export class Keltner extends ITradingStrategy {

  Name = "Keltner";

  findLastBuyIndex(array: number[]): number {
    let foundIndex = -1;
    for (let i = array.length;  i > 0; --i) {
      // find last buy
      if (array[i] == 1) {
        foundIndex = i;
        break;
      }
    }
    return foundIndex;
  }

  Prepare(): number[] {
    let result: number[] = [];

    let closes = this.Candles.map((x) => { return x.Close; });

    // determins buy / sell signals in trending market
    let keltner = KeltnerChannel(this.Candles, 22, 2);
    // determines trend
    let aroon = AroonOsc(this.Candles, 32);
    // determines over/under bought
    let stochrsi = StochRsi(this.Candles, 22);

    for (let i: number = 0; (i < this.Candles.length); i++) {
      // uptrend (long)
      if (<number>aroon[i] > 45) {
        let lastBuyIndex = this.findLastBuyIndex(result);
        let stopLoss = lastBuyIndex > -1 ? (<number>keltner.MiddleBand[lastBuyIndex] + 2 * <number>keltner.LowerBand[lastBuyIndex]) / 3 : 0;
        // stock is underbought and close value is below middleband
        if (<number>stochrsi.D[i] < 30 && (closes[i] < <number>keltner.MiddleBand[i])) {
          result.push(1);
        // stock is overbough and close value just dropped from above upperband to below
        } else if (<number>stochrsi.D[i] > 70 &&  (stopLoss > closes[i] || closes[i - 3] > <number>keltner.UpperBand[i] && closes[i] < <number>keltner.UpperBand[i])) {
          result.push(-1);
        } else {
          result.push(0);
        }
      // downtrend (short)
      } else if (<number>aroon[i] < -65) {
        // stock is underbought and close value is below lowerband
        if (<number>stochrsi.D[i] < 20 && (closes[i] < <number>keltner.LowerBand[i])) {
          result.push(1);

        // stock is overbough and close value reaches middleband
        } else if (<number>stochrsi.D[i] > 60 && (closes[i] > <number>keltner.MiddleBand[i])) {
          result.push(-1);
        } else {
          result.push(0);
        }
        // neutral
      } else {
        result.push(0);
      }
    }
    return result;
  }
}