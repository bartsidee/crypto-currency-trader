import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";
import { CandleVariable } from "../models/candlevariable";
import * as _ from "lodash";

import { Sma } from "../indicators/sma";
import { Ema } from "../indicators/ema";

export class TripleMa extends ITradingStrategy {

  Name = "Triple MA";

  Prepare(): number[] {
    let result: number[] = [];

    let sma20 = Sma(this.Candles, 20);
    let sma50 = Sma(this.Candles, 50);
    let ema = Ema(this.Candles, 1);

    let closes = this.Candles.map((x) => x.Close);

    for (let i = 0; i < this.Candles.length; i++) {
      let sma20Value = sma20[i];
      let sma50Value = sma50[i];
      let emaValue = ema[i];

      if (i == 0 || !sma20Value || !emaValue || !sma50Value)
        result.push(0);
      else if (emaValue > sma50Value && <number>ema[i - 1] < <number>sma50[i - 1])
        result.push(1); // A cross of the EMA and long SMA is a buy signal.
      else if ((emaValue < sma50Value && <number>ema[i - 1] > <number>sma50[i - 1]) || (emaValue < sma20Value && <number>ema[i - 1] > <number>sma20[i - 1]))
        result.push(-1); // As soon as our EMA crosses below an SMA its a sell signal.
      else
        result.push(0);
    }

    return result;
  }
}