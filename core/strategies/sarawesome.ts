import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";
import { CandleVariable } from "../models/candlevariable";
import * as _ from "lodash";

import { Ema } from "../indicators/ema";
import { Sar } from "../indicators/sar";
import { AwesomeOscillator } from "../indicators/awesomeoscillator";

/// This is a strategy most suited for 30 minute ticks.
export class SarAwesome extends ITradingStrategy {

  Name = "SAR Awesome";

  Prepare(): number[] {
    let result: number[] = [];

    let sar = Sar(this.Candles);
    let ema5 = Ema(this.Candles, 5);
    let ao = AwesomeOscillator(this.Candles);
    let closes = this.Candles.map((x) => x.Close);
    let highs = this.Candles.map((x) => x.High);
    let lows = this.Candles.map((x) => x.Low);

    for (let i = 0; i < this.Candles.length; i++) {
      let currentSar = sar[i];
      let priorSar = sar[i - 1];
      let earlierSar = sar[i - 2];
      let lastHigh = highs[i];
      let lastLow = lows[i];
      let aoValue = ao[0];
      let ema5Value = ema5[0];

      if (i == 0 || !currentSar || !priorSar || !earlierSar || !lastHigh || !lastLow || !aoValue || !ema5Value)
        result.push(0);
      else if ((currentSar > lastHigh) && (priorSar > lastHigh) && (earlierSar > lastHigh) && aoValue > 0 && ema5Value < closes[i])
        result.push(1);
      else if ((currentSar < lastLow) && (priorSar < lastLow) && (earlierSar < lastLow) && aoValue < 0 && ema5Value > closes[i])
        result.push(-1);
      else
        result.push(0);
    }
    return result;
  }
}