import "source-map-support/register";
import { ConnectionManager } from "../core/store/connectionmanager";
import { BinanceExchange } from "../core/exchange/binance";
import { Trade } from "../core/store/entities/trade";
import Constants from "../core/constants";
import { TradeDto } from "../core/models/tradedto";
import { Logger } from "../core/logger";
import * as _ from "lodash";
import { HttpContext, IFunctionRequest } from "../core/azure-functions";

// http method to return the active trades
export default async function (context: HttpContext, req: IFunctionRequest) {
    Logger.setLogger(context.log);
    try {
        let tradeTable = await ConnectionManager.GetTable(Constants.OrderTableName, Constants.IsDryRunning);
        let currentTradeEntries = await tradeTable.CreateQuery("IsOpen == ?bool?", true);
        let currentTrades = currentTradeEntries.map((x) => {
            return new Trade(Trade.convertFromAzureTableEntity(x));
        });

        currentTrades = _.sortBy(currentTrades, "Market");

        let api = new BinanceExchange();
        let trades: TradeDto[] = [];

        for (let trade of currentTrades) {
            let currentRate = await api.GetTicker(trade.Market);
            trades.push(new TradeDto(trade, currentRate));
        }
        return { status: 200, body: trades };
    }
    catch (ex) {
        Logger.error(ex);
    }
}