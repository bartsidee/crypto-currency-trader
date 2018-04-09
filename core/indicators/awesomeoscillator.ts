import { Candle } from "../models/candle";
import * as talib from "talib-binding";
import { FixIndicatorOrdering } from "./baseindicator";

export let AwesomeOscillator =  function(source: Candle[], returnRaw: boolean = false): (number| undefined)[] {
  //  Calculate our Moving Averages
  let values = source.map((x) => { return ((x.High + x.Low) / 2); });
  let smaFast = FixIndicatorOrdering(talib.SMA(
    values,
    5
  ), source.length);

  let smaSlow = FixIndicatorOrdering(talib.SMA(
    values,
    24
  ), source.length);

  let result: (number | undefined)[] = [];
  for (let i = 0; (i < smaFast.length); i++) {
    let  smaFastLast = smaFast[i];
    let smaSlowLast = smaSlow[i];

    if (!smaFastLast || !smaSlowLast) {
      result.push(undefined);

    }
    else if (returnRaw) {
      result.push(smaFastLast - smaSlowLast);

    } else {
      //  The last and second to last values interest us, because we're looking for a cross of these lines.
      //  If it's not the first item, we can check the previous.
      if (i > 0) {
          let smaFastSecondLast = <number>smaFast[i - 1]; // last index should always be defined
          let smaSlowSecondLast = <number>smaSlow[i - 1]; // last index should always be defined
          let aoSecondLast = (smaFastSecondLast - smaSlowSecondLast);
          let aoLast = (smaFastLast - smaSlowLast);
          if (aoSecondLast <= 0 && aoLast > 0) {
            result.push(100);
          }
          else if (aoSecondLast >= 0 && aoLast < 0) {
            result.push(-100);
          }
          else {
            result.push(0);
          }

      } else {
          result.push(0);
      }
    }
  }

  return result;
};
