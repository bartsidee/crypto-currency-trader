import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";
import { CandleVariable } from "../models/candlevariable";
import * as _ from "lodash";

import { Rsi } from "../indicators/rsi";
import { Sar } from "../indicators/sar";

/// This is a strategy most suited for 1 minute ticks.
export class SarRsi extends ITradingStrategy {

  Name = "SAR RSI";

  Prepare(): number[] {
    let result: number[] = [];

    let sar = Sar(this.Candles);
    let rsi = Rsi(this.Candles);

    let closes = this.Candles.map((x) => x.Close);
    let highs = this.Candles.map((x) => x.High);
    let lows = this.Candles.map((x) => x.Low);
    let opens = this.Candles.map((x) => x.Open);

    for (let i = 0; i < this.Candles.length; i++) {
      let sarValue = sar[i];
      let rsiValue = rsi[i];

      if (i <= 2 || !sarValue || !rsiValue) {
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

        if (rsiValue > 70 && fsar == -1)
          result.push(-1);
        else if (rsiValue < 30 && fsar == 1)
          result.push(1);
        else
          result.push(0);
      }
    }
    return result;
  }
}