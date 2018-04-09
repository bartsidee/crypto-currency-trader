import { TableEntity } from "./base";

export class Portfolio extends TableEntity {
  Date: Date;
  [key: string]: any; // coin weights, sum of all weights is always 1
  public constructor(init?: Partial<Portfolio>) {
    super(init);
    Object.assign(this, init);
  }
}
