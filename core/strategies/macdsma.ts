import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";
import { CandleVariable } from "../models/candlevariable";
import * as _ from "lodash";

import { Macd } from "../indicators/macd";
import { Sma } from "../indicators/sma";

export class MacdSma extends ITradingStrategy {

  Name = "MACD SMA";

  Prepare(): number[] {
    let result: number[] = [];

    let macd = Macd(this.Candles);
    let fastMa = Sma(this.Candles, 11);
    let slowMa = Sma(this.Candles, 27);
    let sma200 = Sma(this.Candles, 200);
    let closes = this.Candles.map(x => x.Close);

    for (let i = 0; i < this.Candles.length; i++) {
      let macdValue = macd.Macd[i];
      let histValue = macd.Hist[i];
      let fastMaValue = fastMa[i];
      let slowMaValue = slowMa[i];
      let sma200Value = sma200[i];

      if (i < 25 || !macdValue || !histValue || !fastMaValue || !slowMaValue || !sma200Value)
        result.push(0);
      else if (slowMaValue < sma200Value)
        result.push(-1);
      else if (histValue > 0 && <number>macd.Hist[i - 1] < 0 && macdValue > 0 && fastMaValue > slowMaValue && closes[i - 27] > sma200Value)
        result.push(1);
      else
        result.push(0);
    }
    return result;
  }
}