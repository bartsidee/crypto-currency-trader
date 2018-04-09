import * as azure from "azure-storage";
import { TableInstance } from "./tableinstance";
import Constants from "../constants";

export class ConnectionManager {
  public static GetTableService() {
    return azure.createTableService(Constants.ConnectionString);
  }
  public static DeleteTable(tableName: string, dryRun: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      let name = tableName + (dryRun ? "TEST" : "");
      let tableService = ConnectionManager.GetTableService();
      tableService.deleteTableIfExists(name, function(error, result, response) {
        if (!error) {
          resolve();
        } else {
          reject(error);
        }
      });
    });
  }
  public static GetTable(tableName: string, dryRun: boolean): Promise<TableInstance> {
    return new Promise((resolve, reject) => {
      let name = tableName + (dryRun ? "DryRun" : "");
      let tableService = ConnectionManager.GetTableService();
      tableService.createTableIfNotExists(name, function(error, result, response) {
        if (!error) {
          resolve(new TableInstance(name, tableService));
        } else {
          reject(error);
        }
      });
    });
  }

  public static TableBatch() {
    return new azure.TableBatch();
  }
}