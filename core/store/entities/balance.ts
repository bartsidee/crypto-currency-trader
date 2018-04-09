import { TableEntity } from "./base";

export class Balance extends TableEntity {
  StartBalance: number = 0;
  TotalBalance: number = 0;
  Profit?: number;
  ProfitPercentage?: number;
  BalanceDate?: Date;
  LastUpdated: Date = new Date();

  public constructor(init?: Partial<Balance>) {
    super(init);
    Object.assign(this, init);
  }
}
