import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";
import { CandleVariable } from "../models/candlevariable";
import * as _ from "lodash";

import { Ema } from "../indicators/ema";
import { Stoch } from "../indicators/stoch";
import { Rsi } from "../indicators/rsi";

export class EmaStochRsi extends ITradingStrategy {

  Name = "EMA Stoch RSI";

  Prepare(): number[] {
    let result: number[] = [];

    let stoch = Stoch(this.Candles, 14);
    let ema5 = Ema(this.Candles, 5);
    let ema10 = Ema(this.Candles, 10);
    let rsi = Rsi(this.Candles, 14);

    for (let i = 0; i < this.Candles.length; i++) {
      let ema5Value = ema5[i];
      let ema10Value = ema10[i];
      let rsiValue = rsi[i];

      let slowk1 = stoch.K[i];
      let slowkp = <number>stoch.K[i - 1];
      let slowd1 = stoch.D[i];
      let slowdp = <number>stoch.D[i - 1];
      if (i == 0 || !ema5Value || !ema10Value || !rsiValue || !slowk1 || !slowd1) {
        result.push(0);
      } else {
        let pointedUp = false, pointedDown = false, kUp = false, dUp = false;
        if (slowkp < slowk1) kUp = true;
        if (slowdp < slowd1) dUp = true;
        if (slowkp < 80 && slowdp < 80 && kUp && dUp) pointedUp = true;
        if (slowkp > 20 && slowdp > 20 && !kUp && !dUp) pointedDown = true;

        if (ema5Value >= ema10Value && <any>ema5[i - 1] < ema10Value && rsiValue > 50 && pointedUp)
          result.push(1);
        else if (ema5Value <= ema10Value && <any>ema5[i - 1] > ema10Value && rsiValue < 50 && pointedDown)
          result.push(-1);
        else
          result.push(0);
      }
    }
    return result;
  }
}