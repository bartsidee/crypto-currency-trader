import { Candle } from "../models/candle";

export let Fisher = function(source: Candle[], period: number = 10): (number | undefined)[] {
  let nValues1: number[] = [];
  let fishers: number[] = [];
  let result: (number | undefined)[] = [];
  let highLowAverages = source.map((x) => { return ((x.High + x.Low) / 2); });
  for (let i: number = 0; (i < source.length); i++) {
    if (i < 2) {
      result.push(undefined);
      nValues1.push(0);
      fishers.push(0);
    }
    else {
      let maxH = 0;
      let minH = 0;
      if (i < 9) {
        maxH = Math.max(...highLowAverages.slice(0, i + 1));
        minH = Math.min(...highLowAverages.slice(0, i + 1));
      }
      else {
        maxH = Math.max(...highLowAverages.slice(i + (1 - period), period));
        minH = Math.min(...highLowAverages.slice(i + (1 - period), period));
      }

      let nValue1 = 0.33 * 2 * ((highLowAverages[i] - minH) / (maxH - minH) - 0.5) + 0.67 * nValues1[i - 1];
      nValues1.push(nValue1);

      let nValue2 = nValue1 > 0.99 ? .999 : (nValue1 < -.99 ? -.999 : nValue1);

      let nFish = 0.5 * Math.log((1 + nValue2) / (1 - nValue2)) + 0.5 * fishers[i - 1];
      fishers.push(nFish);
      if (fishers[i] > fishers[i - 1])
        result.push(1);
      else if (fishers[i] < fishers[i - 1])
        result.push(-1);
      else
        result.push(0);
    }
  }

  return result;
};
