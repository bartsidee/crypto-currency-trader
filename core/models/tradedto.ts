import { Trade } from "../../core/store/entities/trade";
import { Ticker } from "../../core/models/ticker";

export class TradeDto {
  Market: string;
  OpenRate: number;
  CloseRate: number;
  CloseProfit: number;
  CloseProfitPercentage: number;
  StakeAmount: number;
  Quantity: number;
  IsOpen: boolean;
  OpenDate: Date;
  CloseDate: Date;
  Uuid: string;
  CurrentRate: number;
  constructor(trade?: Trade, currentRate?: Ticker | undefined) {
    if (trade) {
      this.Market = trade.Market;
      if (trade.CloseRate) this.CloseRate = trade.CloseRate;
      this.OpenRate = trade.OpenRate;
      if (trade.CloseProfitPercentage) this.CloseProfit = trade.CloseProfitPercentage;
      this.IsOpen = trade.IsOpen;
      if (trade.CloseDate) this.CloseDate = trade.CloseDate;
      this.StakeAmount = trade.StakeAmount;
      this.OpenDate = trade.OpenDate;
      this.Quantity = trade.Quantity;
      if (currentRate) this.CurrentRate = currentRate.Ask;
      this.Uuid = trade.RowKey;
    }
  }
}