import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";
import { CandleVariable } from "../models/candlevariable";
import * as _ from "lodash";

import { Stoch } from "../indicators/stoch";
import { StochFast } from "../indicators/stochfast";
import { Sar } from "../indicators/sar";

export class SarStoch extends ITradingStrategy {

  Name = "SAR Stoch";

  Prepare(): number[] {
    let result: number[] = [];

    let sar = Sar(this.Candles, 3);
    let stoch = Stoch(this.Candles, 13);
    let stochFast = StochFast(this.Candles, 13);

    let highs = this.Candles.map((x) => x.High);
    let lows = this.Candles.map((x) => x.Low);
    let closes = this.Candles.map((x) => x.Close);
    let opens = this.Candles.map((x) => x.Open);

    for (let i = 0; i < this.Candles.length; i++) {
      let sarValue = sar[i];
      let stochKValue = stoch.K[i];
      let stochDValue = stoch.D[i];
      let stochFastKValue = stochFast.D[i];
      let stochFastDValue = stochFast.D[i];

      if (i <= 2 || !sarValue || !stochKValue || !stochDValue || !stochFastKValue || !stochFastDValue ) {
        result.push(0);
      } else {
        let currentSar = sarValue;
        let priorSar = <number>sar[i - 1];
        let lastHigh = highs[i];
        let lastLow = lows[i];
        let lastOpen = opens[i];
        let lastClose = closes[i];
        let priorHigh = highs[i - 1];
        let priorLow = lows[i - 1];
        let priorOpen = opens[i - 1];
        let priorClose = closes[i - 1];
        let prevOpen = opens[i - 2];
        let prevClose = closes[i - 2];

        let below = currentSar < lastLow;
        let above = currentSar > lastHigh;
        let redCandle = lastOpen < lastClose;
        let greenCandle = lastOpen > lastClose;
        let priorBelow = priorSar < priorLow;
        let priorAbove = priorSar > priorHigh;
        let priorRedCandle = priorOpen < priorClose;
        let priorGreenCandle = priorOpen > priorClose;
        let prevRedCandle = prevOpen < prevClose;
        let prevGreenCandle = prevOpen > prevClose;

        priorRedCandle = (prevRedCandle || priorRedCandle);
        priorGreenCandle = (prevGreenCandle || priorGreenCandle);

        let fsar = 0;

        if ((priorAbove && priorRedCandle) && (below && greenCandle))
          fsar = 1;
        else if ((priorBelow && priorGreenCandle) && (above && redCandle))
          fsar = -1;

        if (fsar == -1 && (stochKValue > 90 || stochDValue > 90 || stochFastKValue > 90 || stochFastDValue > 90))
          result.push(-1);
        else if (fsar == 1 && (stochKValue < 10 || stochDValue < 10 || stochFastKValue < 10 || stochFastDValue < 10))
          result.push(1);
        else
          result.push(0);
      }
    }
    return result;
  }
}