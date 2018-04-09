export class BackTestResult {
  Currency: string;
  Profit: number;
  ProfitPercentage: number;
  Duration: number;
  public constructor(init?: Partial<BackTestResult>) {
    Object.assign(this, init);
  }
}