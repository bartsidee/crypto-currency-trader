import { BookOrderTypeEnum } from "./bookorder";

export interface OpenOrder {
  Market: string;
  OrderId: number;
  Price: number;
  Quantity: number;
  QuantityRemaining: number;
  OrderType: BookOrderTypeEnum;
  Limit: number;
  Time: Date;
}