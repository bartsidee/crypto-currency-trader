import { Candle } from "../models/candle";

export class ITradingStrategy {

  Name: string;
  Candles: Candle[] = [];
  Prepare(): number[] {
    return [];
  }
  clone(): ITradingStrategy {
    const copy = new (this.constructor as { new (): ITradingStrategy })();
    Object.assign(copy, this);
    return copy;
  }
}