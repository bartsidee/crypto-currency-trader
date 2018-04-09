import { TableUtilities } from "azure-storage";

export class TableEntity {

  static convertToAzureTableEntity(object: TableEntity): Object {
    let entity: any = {};
    let entGen = TableUtilities.entityGenerator;
    for (let i in object) {
      if (object.hasOwnProperty(i)) {
        switch (typeof (<any>object)[i]) {
          case "boolean":
            entity[i] = entGen.Boolean((<any>object)[i]);
            break;
          case "number":
            // float
            if ((<any>object)[i] % 1 !== 0)
              entity[i] = entGen.Double((<any>object)[i]);
            // integer
            else
              entity[i] = entGen.Int32((<any>object)[i]);
            break;
          case "string":
            entity[i] = entGen.String((<any>object)[i]);
            break;
          default:
            if (Object.prototype.toString.call((<any>object)[i]) === "[object Date]") {
              entity[i] = entGen.DateTime((<any>object)[i]);
            }
            break;
        }
      }
   }
   return entity;
  }

  static convertFromAzureTableEntity(object: any): Partial<TableEntity> | undefined {
    if (!object) return;
    let data: any = {};
    for (let i in object) {
      if (object.hasOwnProperty(i)) {
        if (i == ".metadata") continue;
        if (object[i]["$"] == "Edm.DateTime") data[i] = new Date(object[i]["_"]);
        else data[i] = object[i]["_"];
      }
   }
   return data;
  }

  PartitionKey: string;
  RowKey: string;
  Timestamp: Date;

  public constructor(init?: Partial<TableEntity>) {
    Object.assign(this, init);
  }
}

