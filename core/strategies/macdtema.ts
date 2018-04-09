import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";
import { CandleVariable } from "../models/candlevariable";
import * as _ from "lodash";

import { Macd } from "../indicators/macd";
import { Tema } from "../indicators/tema";

export class MacdTema extends ITradingStrategy {

  Name = "MACD TEMA";

  Prepare(): number[] {
    let result: number[] = [];

    let macd = Macd(this.Candles, 11, 27, 9);
    let tema = Tema(this.Candles, 50);
    let closes = this.Candles.map(x => x.Close);

    for (let i = 0; i < this.Candles.length; i++) {
      let macdValue = macd.Macd[i];
      let temaValue = tema[i];

      if (i == 0 || !macdValue || !temaValue)
        result.push(0);
      else if (temaValue < closes[i] && <number>tema[i - 1] > closes[i - 1] && macdValue > 0 && <number>macd.Macd[i - 1] < 0 )
        result.push(1);
      else if (temaValue > closes[i] && <number>tema[i - 1] < closes[i - 1] && macdValue < 0 && <number>macd.Macd[i - 1] > 0)
        result.push(-1);
      else
        result.push(0);
    }
    return result;
  }
}