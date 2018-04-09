import { Candle } from "../models/candle";
import * as talib from "talib-binding";
import { FixIndicatorOrdering } from "./baseindicator";

export interface MamaItem {
  Mama: (number| undefined)[];
  Fama: (number| undefined)[];
}

export let Mama = function(source: Candle[], fastLimit: number = 0, slowLimit: number = 0): MamaItem {
  let [Mama, Fama] = talib.MAMA(
    source.map((x) => { return x.Close; }),
    fastLimit,
    slowLimit
  );
  return <MamaItem> {
    Mama: FixIndicatorOrdering(Mama, source.length),
    Fama: FixIndicatorOrdering(Fama, source.length)
  };
};
