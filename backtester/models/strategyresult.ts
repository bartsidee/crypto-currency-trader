import { Candle } from "../../core/models/candle";
export class StrategyResult {
  Name: string;
  TotalTrades: number;
  ProfitTrades: number;
  NonProfitTrades: number;
  TotalProfit: number;
  BuyAndHold: number;
  AvgProfit: number;
  AvgTime: number;
  public constructor(init?: Partial<StrategyResult>) {
    Object.assign(this, init);
  }
}