import { TableEntity } from "./base";

export class MarketSummary extends TableEntity {
  Name: string;
  High: number;
  Low: number;
  Close: number;
  Volume: number;
  PricePrecision: number;
  AmountPrecision: number;
  // Last: number;
  TimeStamp: Date;
  // Bid: number;
  // Ask: number;
  public constructor(init?: Partial<MarketSummary>) {
    super(init);
    Object.assign(this, init);
  }
}