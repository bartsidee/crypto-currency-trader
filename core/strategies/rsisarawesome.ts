import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";
import { CandleVariable } from "../models/candlevariable";
import * as _ from "lodash";

import { Rsi } from "../indicators/rsi";
import { Sar } from "../indicators/sar";
import { AwesomeOscillator } from "../indicators/awesomeoscillator";

/// http://www.tradeforextrading.com/parabolic-sar-indicator/awesome-oscillator-indicator-relative-strength-index-rsi-indicator-forex-trading-system.htm
export class RsiSarAwesome extends ITradingStrategy {

  Name = "RSI SAR Awesome";

  Prepare(): number[] {
    let result: number[] = [];

    let sar = Sar(this.Candles);
    let rsi = Rsi(this.Candles, 5);
    let ao = AwesomeOscillator(this.Candles);
    let closes = this.Candles.map((x) => x.Close);

    for (let i = 0; i < this.Candles.length; i++) {
      let rsiValue = rsi[i];
      let aoValue = ao[i];
      let currentSar = sar[i];
      let priorSar = <number>sar[i - 1];

      if (i == 0 || !rsiValue || !currentSar || !aoValue)
        result.push(0);
      else if (currentSar < closes[i] && priorSar > closes[i] && aoValue > 0 && rsiValue > 50)
        result.push(1);
      else if (currentSar > closes[i] && priorSar < closes[i] && aoValue < 0 && rsiValue < 50)
        result.push(-1);
      else
        result.push(0);
    }
    return result;
  }
}