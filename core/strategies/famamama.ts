import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";
import { CandleVariable } from "../models/candlevariable";
import * as _ from "lodash";

import { Mama } from "../indicators/mama";

export class FaMaMaMa extends ITradingStrategy {

  Name = "FAMAMAMA";

  Prepare(): number[] {
    let result: number[] = [];

    let mama = Mama(this.Candles, 0.5, 0.05);
    let fama = Mama(this.Candles, 0.25, 0.025);
    for (let i = 0; i < this.Candles.length; i++) {
      let mamaValue = mama.Mama[i];
      let famaValue = fama.Mama[i];

      if (i == 0 || !mamaValue || !famaValue)
        result.push(0);
      else if (famaValue > mamaValue && <number>fama.Mama[i - 1] < mamaValue)
        result.push(1);
      else if (famaValue < mamaValue && <number>fama.Mama[i - 1] > mamaValue)
        result.push(-1);
      else
        result.push(0);
    }
    return result;
  }
}