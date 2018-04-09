import { Candle } from "../../core/models/candle";

export interface ITrait {
    Create(candles: Candle[]): number[];
}