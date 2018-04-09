import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";
import { CandleVariable } from "../models/candlevariable";
import * as _ from "lodash";

import { AwesomeOscillator } from "../indicators/awesomeoscillator";

export class Fractals extends ITradingStrategy {

  Name = "Fractals";

  Prepare(): number[] {
    // Settings for this strat.
    let exitAfterBars = 3;
    let useLongerAverage = true;
    let noRepainting = true;

    let result: number[] = [];
    let fractalPrice: number[] = [];
    let fractalAverage: number[] = [];
    let fractalTrend: boolean[] = [];

    let ao = AwesomeOscillator(this.Candles);
    let high = this.Candles.map(x => x.High);
    let highLowAvgs = this.Candles.map(x => (x.High + x.Low) / 2);

    for (let i = 0; i < this.Candles.length; i++) {
      let aoValue = ao[i];
      // Calculate the price for this fractal
      if (i < 4 || !aoValue) {
        fractalPrice.push(0);
        fractalAverage.push(0);
        fractalTrend.push(false);
        result.push(0);
      } else {
        let fractalTop = high[i - 2] > high[i - 3] &&
                        high[i - 2] > high[i - 4] &&
                        high[i - 2] > high[i - 1] &&
                        high[i - 2] > high[i];
        let price = fractalTop ? highLowAvgs[i] : 0;
        fractalPrice.push(price);

        // Calculate the avg price
        let avg = useLongerAverage
            ? (fractalPrice[i - 1] + fractalPrice[i - 2] + fractalPrice[i - 3]) / 3
            : (fractalPrice[i - 1] + fractalPrice[i - 2]) / 2;
        fractalAverage.push(avg);

        // Check the trend.
        let trend = fractalAverage[i] > fractalAverage[i - 1];
        fractalTrend.push(trend);

        let fractalBreakout = noRepainting
            ? highLowAvgs[i - 1] > fractalPrice[i]
            : highLowAvgs[i] > fractalPrice[i];

        let tradeEntry = fractalTrend[i] && fractalBreakout;
        let tradeExit = fractalTrend[i - exitAfterBars] && fractalTrend[i] == false;

        if (tradeExit)
          result.push(-1);
        else if (tradeEntry && aoValue > 0)
          result.push(1);
        else
          result.push(0);
      }
    }
    return result;
  }
}