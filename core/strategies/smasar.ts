import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { Candle } from "../models/candle";
import { CandleVariable } from "../models/candlevariable";
import * as _ from "lodash";

import { Sma } from "../indicators/sma";
import { Sar } from "../indicators/sar";

export class SmaSar extends ITradingStrategy {

  Name = "SMA SAR";

  Prepare(): number[] {
    let result: number[] = [];

    let sma = Sma(this.Candles, 60);
    let sar = Sar(this.Candles);
    let highs = this.Candles.map((x) => x.High);
    let lows = this.Candles.map((x) => x.Low);
    let closes = this.Candles.map((x) => x.Close);
    let opens = this.Candles.map((x) => x.Open);

    for (let i = 0; i < this.Candles.length; i++) {
      let currentSar = sar[i];
      let smaValue = sma[i];

      if (i <= 2 || !currentSar || !smaValue) {
        result.push(0);
      } else {
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

        if (closes[i] > smaValue && fsar == 1)
          result.push(1);
        else if (closes[i] < smaValue && fsar == -1)
          result.push(-1);
        else
          result.push(0);
      }
    }
    return result;
  }
}