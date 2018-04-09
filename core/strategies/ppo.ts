import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";
import { CandleVariable } from "../models/candlevariable";
import * as _ from "lodash";

import { Sma, SmaNumber } from "../indicators/sma";
import { Ppo } from "../indicators/ppo";
import { Ema, EmaNumber } from "../indicators/ema";
import { Adx } from "../indicators/adx";
import { FixIndicatorOrdering } from "../indicators/baseindicator";
import { Macd } from "../indicators/macd";

/// http://stockcharts.com/school/doku.php?id=chart_school:technical_indicators:price_oscillators_ppo
export class PpoEma extends ITradingStrategy {

  Name = "Ppo Ema";

  Prepare(): number[] {
    let result: number[] = [];

    let fastLength = 11;
    let slowLength = 27;
    let signalLength = 9;

    let ppo = Ppo(this.Candles, fastLength, slowLength, signalLength);
    let macd = Macd(this.Candles, fastLength, slowLength);

    let sma = Sma(this.Candles, slowLength);

    let closes = this.Candles.map((x) => x.Close);
    for (let i = 0; i < this.Candles.length; i++) {
      let ppoValue = ppo.Ppo[i];
      let signalValue = ppo.Signal[i];
      let smaValue = sma[i];
      let macdValue = macd.Macd[i];

      if ( i < 2 || !ppoValue || !signalValue || !macdValue || !smaValue)
        result.push(0);
      else {
        if ((<number>ppo.Ppo[i - 1] > <number>ppo.Signal[i - 1]) && ppoValue < signalValue && ppoValue > 0)
          result.push(1);
        else if ((<number>ppo.Ppo[i - 1] < <number>ppo.Signal[i - 1]) && ppoValue > signalValue && ppoValue < 0)
          result.push(-1);
        else
          result.push(0);
      }
   }
    return result;
  }
}