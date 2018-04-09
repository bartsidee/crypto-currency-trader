import "source-map-support/register";
import * as _ from "lodash";
import { HttpContext, IFunctionRequest } from "../core/azure-functions";
import { Logger } from  "../core/logger";
import Constants from "../core/constants";
import { ConnectionManager } from "../core/store/connectionmanager";
import { MarketSummary } from "../core/store/entities/marketsummery";
import { BinanceExchange } from "../core/exchange/binance";

// This function triggers every day to sync the markets
export default async function (context: HttpContext, req: IFunctionRequest) {
  Logger.setLogger(context.log);
  try {
    Logger.info("Starting processing...");
    let exchange = new BinanceExchange();

    // create new table and execute batch
    let marketTable = await ConnectionManager.GetTable(Constants.MarketTableName, Constants.IsDryRunning);

    // get all summeries
    let markets = await exchange.GetMarketSummaries();

    // filter on 24h volume and do not trade BNB
    markets = _.filter(markets, (x) => {
      return (((x.Volume) > Constants.MinimumAmountOfVolume
        || Constants.AlwaysTradeList.indexOf(x.Name) > -1)
        && x.Name.indexOf("BNB") === -1 );
    });

    //  Remove items that are on our blacklist.
    markets = _.filter(markets, (x) => {
      return Constants.MarketBlackList.indexOf(x.Name) === -1;
    });

    // make unique
    markets = _.uniq(markets);

    // get avarage volume over longer period, this takes a while
    for (let market of markets) {
      let volume = await exchange.GetAvarageMarketVolumeOnPeriod(market.Name, 30);
      Logger.info(`The 30 day avarage volume for ${market.Name} is ${volume.toFixed(4)}`);
      market.Volume = Math.round(volume);
    }

    // sort markets by volume descending
    markets = _.sortBy(markets, (x) => {
      return -(x.Volume);
    });

    // slice to max 100 (batch limit)
    if (markets.length > 100) markets = markets.slice(0, 100);

    // delete old data
    let batch1 = ConnectionManager.TableBatch();
    let marketEntities = await marketTable.CreateQuery("PartitionKey == ?", "MARKETS");
    for (let marketEntity of marketEntities) {
      batch1.deleteEntity(marketEntity);
    }
    if (batch1.size() > 0) await marketTable.executeBatch(batch1);

    // insert fresh data
    let batch2 = ConnectionManager.TableBatch();
    for (let market of markets) {
      batch2.insertEntity(MarketSummary.convertToAzureTableEntity(market), <any>undefined);
    }
    if (batch2.size() > 0) await marketTable.executeBatch(batch2);
  }
  catch (ex) {
    Logger.error(ex);
  }
}