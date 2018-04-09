import "source-map-support/register";
import { ConnectionManager } from "../core/store/connectionmanager";
import { Trade } from "../core/store/entities/trade";
import { TradeManager } from "../core/managers/trademanager";
import { TradeDto } from "../core/models/tradedto";
import Constants from "../core/constants";
import { TelegramNotificationManager } from "../core/managers/notification/telegramnotificationmanager";

import * as qs from "querystring";
import * as _ from "lodash";
import { HttpContext, IFunctionRequest } from "../core/azure-functions";
import { Logger } from  "../core/logger";

// http method to directly sell a active trade
export default async function (context: HttpContext, req: IFunctionRequest) {
  Logger.setLogger(context.log);
  try {
    // read json object from request body
    let order = new TradeDto();
    order.Uuid = <string>qs.parse(req.body).Uuid;
    if (!order.Uuid) return { status: 400, body: {error: "missing Uuid value"} };
    let tradeTable = await ConnectionManager.GetTable(Constants.OrderTableName, Constants.IsDryRunning);
    let currentTradeEntry = _.first(await tradeTable.CreateQuery("RowKey == ?", order.Uuid));
    let activeTrade = new Trade(Trade.convertFromAzureTableEntity(currentTradeEntry));

    // Directly sell it off.
    let tradeManager = new TradeManager(<any> undefined, <any> undefined, new TelegramNotificationManager());
    activeTrade = await tradeManager.DirectSell(activeTrade);

    tradeTable.insertOrReplaceEntity(Trade.convertToAzureTableEntity(activeTrade));

    return { status: 200, body: true };
  }
  catch (ex) {
    Logger.error(ex);
  }
}