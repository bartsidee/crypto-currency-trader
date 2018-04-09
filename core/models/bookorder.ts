export enum BookOrderTypeEnum {
  BUY = "BUY",
  SELL = "SELL"
}

export interface BookOrder {
  Market: string;
  OrderId: number;
  Price: number;
  OriginalQuantity: number;
  ExecutedQuantity: number;
  OrderType: BookOrderTypeEnum;
}