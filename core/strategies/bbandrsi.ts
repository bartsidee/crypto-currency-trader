import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";

import { Rsi } from "../indicators/rsi";
import { Bbands } from "../indicators/bbands";

///  https://www.tradingview.com/script/zopumZ8a-Bollinger-RSI-Double-Strategy-by-ChartArt/
export class BbandRsi extends ITradingStrategy {

  Name = "BBand RSI";

  Prepare(): number[] {
    let result: number[] = [];

    let currentPrices = this.Candles.map((x) => { return x.Close; });
    let bbands = Bbands(this.Candles, 22);
    let rsi = Rsi(this.Candles, 13);
    for (let i: number = 0; (i < this.Candles.length); i++) {
      let rsiValue = rsi[i];
      let lowerBandValue = bbands.LowerBand[i];
      if (i == 0 || !rsiValue || !lowerBandValue)
        result.push(0);
      else if (rsiValue < 32 && currentPrices[i] < lowerBandValue)
        result.push(1);
      else if (rsiValue > 70)
        result.push(-1);
      else
        result.push(0);
    }
    return result;
  }
}