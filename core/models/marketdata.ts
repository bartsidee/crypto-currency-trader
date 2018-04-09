import { Candle } from "./candle";

export interface MarketData {
  Name: string;
  Candles: Candle[];
  Trend: number[];
}
