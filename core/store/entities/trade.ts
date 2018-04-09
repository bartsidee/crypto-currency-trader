import { SellType } from "../../models/selltype";
import { TableEntity } from "./base";

export class Trade extends TableEntity {
  Market: string;
  InvestmentWeight: number;
  OpenRate: number;
  CloseRate?: number;
  CloseProfit?: number;
  CloseProfitPercentage?: number;

  StakeAmount: number;
  Quantity: number;

  IsOpen: boolean = true;

  OpenOrderId?: number;
  BuyOrderId?: number;
  SellOrderId?: number;

  OpenDate: Date = new Date();
  CloseDate?: Date;

  StrategyUsed: string;
  StopLossAnchor?: number;
  SellType: SellType;

  PricePrecision: number;
  AmountPrecision: number;

  public constructor(init?: Partial<Trade>) {
    super(init);
    Object.assign(this, init);
  }

  public clone(): Trade {
    const copy = new (this.constructor as { new (): Trade })();
    Object.assign(copy, this);
    return copy;
  }
}
