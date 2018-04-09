import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";
import { CandleVariable } from "../models/candlevariable";
import * as _ from "lodash";

import { Rsi } from "../indicators/rsi";
import { Macd } from "../indicators/macd";
import { Mfi } from "../indicators/mfi";
import { AwesomeOscillator } from "../indicators/awesomeoscillator";

export class RsiMacdMfi extends ITradingStrategy {

  Name = "RSI MACD MFI";

  Prepare(): number[] {
    let result: number[] = [];

    let macd = Macd(this.Candles, 5, 10, 4);
    let rsi = Rsi(this.Candles, 16);
    let mfi = Mfi(this.Candles);
    let ao = AwesomeOscillator(this.Candles);
    let closes = this.Candles.map((x) => x.Close);

    for (let i = 0; i < this.Candles.length; i++) {
      let rsiValue = rsi[i];
      let macdValue = macd.Hist[i];
      let aoValue = ao[i];
      let mfiValue = mfi[i];

      if (i == 0 || !rsiValue || !macdValue || !aoValue || !mfiValue)
        result.push(0);
      else if (mfiValue < 30 && rsiValue < 45 && aoValue > 0)
        result.push(1);
      else if (mfiValue > 30 && rsiValue > 45 && aoValue < 0)
        result.push(-1);
      else
        result.push(0);
    }
    return result;
  }
}