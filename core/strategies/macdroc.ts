import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";
import { CandleVariable } from "../models/candlevariable";
import * as _ from "lodash";

import { Macd } from "../indicators/macd";
import { RocNumber } from "../indicators/roc";
import { FixIndicatorOrdering } from "../indicators/baseindicator";

export class MacdRoc extends ITradingStrategy {

  Name = "MACD ROC";

  Prepare(): number[] {
    let result: number[] = [];

    let macd = Macd(this.Candles, 11, 27, 9);

    let macdSig = macd.Macd.map((x, index) => { return macd.Signal[index] == undefined ? undefined : <number>x - <number>macd.Signal[index]; });

    let rocSign2 = FixIndicatorOrdering(<number[]>RocNumber(<number[]>macdSig.filter((x) => x !== undefined).map((x: number) => x), 2), macdSig.length);
    let rocSign8 = FixIndicatorOrdering(<number[]>RocNumber(<number[]>macdSig.filter((x) => x !== undefined).map((x: number) => x), 8), macdSig.length);
    for (let i = 0; i < this.Candles.length; i++) {

      let rocSign2Value = rocSign2[i];
      let rocSign8Value = rocSign8[i];
      let macdSigValue = macdSig[i];
      if (i < 26 || !rocSign2Value || !rocSign8Value || !macdSigValue)
        result.push(0);
      // macd sign < 0 and and beginning of rising trend
      else if (macdSigValue < 0 && rocSign2Value > rocSign8Value)
        result.push(1);
      // macd sign > 0 and beginning of declining trend
      else if (macdSigValue > 0 && rocSign2Value < rocSign8Value)
        result.push(-1);
      else
        result.push(0);
    }
    return result;
  }
}