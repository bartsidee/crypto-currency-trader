import "source-map-support/register";
import { ConnectionManager } from "../core/store/connectionmanager";
import Constants from "../core/constants";
import { Balance } from "../core/store/entities/balance";
import { Trade } from "../core/store/entities/trade";

import { TradeDto } from "../core/models/tradedto";
import { TradeHistoryDto } from "../core/models/tradehistorydto";

import * as subDays from "date-fns/sub_days";
import * as format from "date-fns/format";
import * as _ from "lodash";
import { HttpContext, IFunctionRequest } from "../core/azure-functions";
import { Logger } from  "../core/logger";

// http method to get the trade history
export default async function (context: HttpContext, req: IFunctionRequest) {
  Logger.setLogger(context.log);
  try {
    let tradeTable = await ConnectionManager.GetTable(Constants.OrderTableName, Constants.IsDryRunning);
    let balanceTable = await ConnectionManager.GetTable(Constants.BalanceTableName, Constants.IsDryRunning);

    let tradeHistoryEntities = await tradeTable.CreateQuery("IsOpen == ?bool?", false);
    let tradeHistory = tradeHistoryEntities.map((x) => {
      return new Trade(Trade.convertFromAzureTableEntity(x));
    });
    tradeHistory = _.sortBy(tradeHistory, (x) => {
      return -x.OpenDate.getTime();
    });

    let totalBalanceEntity = _.first(await balanceTable.CreateQuery("PartitionKey == ? && RowKey == ?",  "BALANCE", "TOTAL"));
    let totalBalance = new Balance(Balance.convertFromAzureTableEntity(totalBalanceEntity));

    let dayBalanceEntity = _.first(await balanceTable.CreateQuery("PartitionKey == ? && RowKey == ?",  "BALANCE", format(subDays(new Date(), 1), "YYYYMMDD")));
    let dayBalance = new Balance(Balance.convertFromAzureTableEntity(dayBalanceEntity));

    let hist = new TradeHistoryDto();
    hist.Trades = tradeHistory.map((x) => {
      return new TradeDto(x);
    });
    hist.TotalProfit = totalBalance.Profit ? totalBalance.Profit : 0;
    hist.TotalProfitPercentage = totalBalance.ProfitPercentage ? totalBalance.ProfitPercentage : 0;
    hist.OverallBalance = totalBalance.TotalBalance ? totalBalance.TotalBalance : 0;
    hist.TodaysProfit = dayBalance.Profit ? dayBalance.Profit : 0;
    hist.TodaysProfitPercentage = dayBalance.ProfitPercentage ? dayBalance.ProfitPercentage : 0;

    // Fetching the name from the path parameter in the request URL
    return { status: 200, body: hist};
  }
  catch (ex) {
    Logger.error(ex);
  }
}