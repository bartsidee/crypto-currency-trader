
import { ITrait } from "./itrait";
import { Candle } from "../../core/models/candle";
import { Adx } from "../../core/indicators/adx";

export class AdxT implements ITrait {
  Create(candles: Candle[]): number[] {
    let adx = Adx(candles);
    let result: number[] = [];

    for (let value of adx) {
      if (value && value > 50)
        result.push(1);
      else
        result.push(0);
    }
    return result;
  }
}