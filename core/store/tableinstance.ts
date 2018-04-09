import * as azure from "azure-storage";

export class TableInstance {
  constructor(public tableName: string, public tableService: azure.TableService) {
  }
  public CreateQuery(condition: string, ...args: any[]): Promise<any[]> {
    return new Promise((resolve, reject) => {
      let query = new azure.TableQuery()
        .where(condition, ...args);
      this.tableService.queryEntities(this.tableName, query, <any> undefined, {}, function (error, result, response) {
        if (error) return reject(error);
        resolve(result.entries);
      });
    });
  }

  public CreateLimitQuery(limit = 10, condition: string, ...args: any[]): Promise<any[]> {
    return new Promise((resolve, reject) => {
      let query = new azure.TableQuery()
        .where(condition, ...args)
        .top(limit);
      this.tableService.queryEntities(this.tableName, query, <any> undefined, {}, function (error, result, response) {
        if (error) return reject(error);
        resolve(result.entries);
      });
    });
  }
  public executeBatch(batch: azure.TableBatch) {
    return new Promise((resolve, reject) => {
      this.tableService.executeBatch(this.tableName, batch, function (error, result, response) {
        if (error) return reject(error);
        resolve(result.entries);
      });
    });
  }

  public insertOrReplaceEntity(entity: object) {
    return new Promise((resolve, reject) => {
      this.tableService.insertOrReplaceEntity(this.tableName, entity, function (error, result, response) {
        if (error) return reject(error);
        resolve();
      });
    });
  }

  public insertEntity(entity: object) {
    return new Promise((resolve, reject) => {
      this.tableService.insertEntity(this.tableName, entity, function (error, result, response) {
        if (error) return reject(error);
        resolve();
      });
    });
  }

  public deleteTableIfExists() {
    return new Promise((resolve, reject) => {
      this.tableService.deleteTableIfExists(this.tableName, function (error, result, response) {
        if (error) return reject(error);
        resolve();
      });
    });
  }
}