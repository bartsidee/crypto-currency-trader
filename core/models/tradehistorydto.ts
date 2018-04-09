import { TradeDto } from "./tradedto";

export class TradeHistoryDto {
  Trades: TradeDto[];
  TotalProfit: number;
  TotalProfitPercentage: number;
  TodaysProfit: number;
  TodaysProfitPercentage: number;
  OverallBalance: number;
}