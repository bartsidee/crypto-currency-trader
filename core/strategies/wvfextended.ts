import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";
import { CandleVariable } from "../models/candlevariable";
import * as _ from "lodash";

import { AwesomeOscillator } from "../indicators/awesomeoscillator";
import { StochRsi } from "../indicators/stochrsi";
import { SmaNumber } from "../indicators/sma";

export class WvfExtended extends ITradingStrategy {

  Name = "Williams Vix Fix (Extended)";

  Prepare(): number[] {
    let result: number[] = [];

    let ao = AwesomeOscillator(this.Candles);
    let stochRsi = StochRsi(this.Candles, 14);
    let highs = this.Candles.map((x) => x.High);
    let lows = this.Candles.map((x) => x.Low);
    let closes = this.Candles.map((x) => x.Close);
    let opens = this.Candles.map((x) => x.Open);

    let wvfs: number[] = [];
    let standardDevs: (number | undefined)[] = [];
    let rangeHighs: (number | undefined)[] = [];
    let upperRanges: (number | undefined)[] = [];

    let pd = 22; // LookBack Period Standard Deviation High
    let bbl = 20; // Bollinger Band Length
    let mult = 2.0; // Bollinger Band Standard Deviation Up
    let lb = 50; // Look Back Period Percentile High
    let ph = .85; // Highest Percentile - 0.90=90%, 0.95=95%, 0.99=99%
    let pl = 1.01; // Lowest Percentile - 1.10=90%, 1.05=95%, 1.01=99%
    let ltLB = 40; // Long-Term Look Back Current Bar Has To Close Below This Value OR Medium Term")
    let mtLB = 14; // Medium-Term Look Back Current Bar Has To Close Below This Value OR Long Term")
    let str = 3; // Entry Price Action Strength--Close > X Bars Back")

    for (let i = 0; i < this.Candles.length; i++) {
      let itemsToPick = i < pd - 1 ? i + 1 : pd;
      let indexToStartFrom = i < pd - 1 ? 0 : i - pd;

      let highestClose = Math.max(...this.Candles.slice(indexToStartFrom, indexToStartFrom + itemsToPick).map(x => x.Close));
      let wvf = ((highestClose - this.Candles[i].Low) / (highestClose)) * 100;

      // Calculate the WVF
      wvfs.push(wvf);

      let standardDev = 0;

      if (wvfs.length > 1) {
        if (wvfs.length < bbl)
          standardDev = mult * this.standardDeviation(wvfs.slice(0, bbl));
        else
          standardDev = mult * this.standardDeviation(wvfs.slice(wvfs.length - bbl, wvfs.length));
      }

      // Also calculate the standard deviation.
      standardDevs.push(standardDev);
    }

    let midLines = SmaNumber(wvfs, bbl);

    for (let i = 0; i < this.Candles.length; i++) {
      let mideLineValue = midLines[i];
      let standarddevValue = standardDevs[i];

      if (mideLineValue && standarddevValue)
        upperRanges.push(mideLineValue + standarddevValue);
      else
        upperRanges.push(undefined);

      let itemsToPickRange = i < lb - 1 ? i + 1 : lb;
      let indexToStartFromRange = i < lb - 1 ? 0 : i - lb;

      let rangeHigh = Math.max(...wvfs.slice(indexToStartFromRange, indexToStartFromRange + itemsToPickRange)) * ph;
      rangeHighs.push(rangeHigh);
    }

    for (let i = 0; i < this.Candles.length; i++) {
      let upperRangeValue = upperRanges[i];
      let rangeHighValue = rangeHighs[i];
      let aoValue = ao[i];
      let stochRsiKValue = stochRsi.K[i];
      let stochRsiDValue = stochRsi.D[i];
      let wvfsValue = wvfs[i];

      if (!upperRangeValue || !rangeHighValue || !aoValue || !stochRsiKValue || !stochRsiDValue || !wvfsValue) {
        result.push(0);
      } else {

        // Filtered Bar Criteria
        let upRange = lows[i] > lows[i - 1] && closes[i] > highs[i - 1];
        let upRangeAggr = closes[i] > closes[i - 1] && closes[i] > opens[i - 1];

        // Filtered Criteria
        let filtered = ((wvfs[i - 1] >= <number>upperRanges[i - 1] || wvfs[i - 1] >= <number>rangeHighs[i - 1]) &&
                        (wvfsValue < upperRangeValue && wvfs[i] < rangeHighValue));
        let filteredAggr = (wvfs[i - 1] >= <number>upperRanges[i - 1] || wvfs[i - 1] >= <number>rangeHighs[i - 1]) &&
                           !(wvfsValue < upperRangeValue && wvfs[i] < rangeHighValue);

        let filteredAlert = upRange && closes[i] > closes[i - str] &&
                            (closes[i] < closes[i - ltLB] || closes[i] < closes[i - mtLB]) && filtered;
        let aggressiveAlert = upRangeAggr && closes[i] > closes[i - str] &&
                              (closes[i] < closes[i - ltLB] || closes[i] < closes[i - mtLB]) && filteredAggr;

        if ((filteredAlert || aggressiveAlert))
          result.push(1);
        else if (stochRsiKValue > 80 && stochRsiKValue > stochRsiDValue && <number>stochRsi.K[i - 1] < <number>stochRsi.D[i - 1] && aoValue < 0 && <number>ao[i - 1] > 0)
          result.push(-1);
        else
          result.push(0);
      }
    }

    return result;
  }

  private standardDeviation(values: number[]) {
    let avg = this.average(values);
    let squareDiffs = values.map(function(value) {
      let diff = value - avg;
      let sqrDiff = diff * diff;
      return sqrDiff;
    });
    let avgSquareDiff = this.average(squareDiffs);
    let stdDev = Math.sqrt(avgSquareDiff);
    return stdDev;
  }

  private average(data: number[]) {
    let sum = data.reduce((sum: number, value: number) => {
      return sum + value;
    }, 0);

    let avg = sum / data.length;
    return avg;
  }
}