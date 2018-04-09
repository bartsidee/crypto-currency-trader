import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";
import { CandleVariable } from "../models/candlevariable";
import * as _ from "lodash";

import { Sma } from "../indicators/sma";
import { Ema } from "../indicators/ema";
import { Wma } from "../indicators/wma";

/// https://www.tradingview.com/script/uCV8I4xA-Bollinger-RSI-Double-Strategy-by-ChartArt-v1-1/
export class ThreeMAgos extends ITradingStrategy {

  Name = "Three MAgos";

  Prepare(): number[] {
    let result: number[] = [];

    let sma = Sma(this.Candles, 15);
    let ema = Ema(this.Candles, 15);
    let wma = Wma(this.Candles, 15);

    let closes = this.Candles.map((x) => x.Close);

    let bars = [];
    for (let i = 0; i < this.Candles.length; i++) {
      let smaValue = sma[i];
      let emaValue = ema[i];
      let wmaValue = wma[i];

      if (i == 0 || !smaValue || !emaValue || !wmaValue)
        bars.push("red");
      else if ((closes[i] > smaValue) && (closes[i] > emaValue) && (closes[i] > wmaValue))
        bars.push("green");
      else if ((closes[i] > smaValue) || (closes[i] > emaValue) || (closes[i] > wmaValue))
        bars.push("blue");
      else
        bars.push("red");
    }

    for (let i = 0; i < this.Candles.length; i++) {
      let smaValue = sma[i];
      let emaValue = ema[i];
      let wmaValue = wma[i];

      if (i == 0 || !smaValue || !emaValue || !wmaValue)
        result.push(0);
      else if (bars[i] == "blue" && bars[i - 1] == "red")
        result.push(1);
      else if (bars[i] == "blue" && bars[i - 1] == "green")
        result.push(-1);
      else
        result.push(0);
    }
    return result;
  }
}