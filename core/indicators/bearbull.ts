import { Candle } from "../models/candle";

///  A very simple check if the last two candles were bullish or bearish.
export let BearBull = function(source: Candle[]): number[] {
  let closes = source.map((x) => { return x.Close; });
  let result: number[] = [];
  for (let i: number = 0; (i < closes.length); i++) {
    if ((i < 2)) {
      result.push(0);
    }
    else {
      let current = closes[i];
      let previous = closes[(i - 1)];
      let prior = closes[(i - 2)];
      if (((current > previous)
                  && (previous > prior))) {
        result.push(1);
      }

      //  last two candles were bullish
      if (((current < previous)
                  && (previous < prior))) {
        result.push(-1);
      }

      //  last two candles were bearish
      result.push(0);
    }

  }

  return result;
};
