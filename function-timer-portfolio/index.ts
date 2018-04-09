import "source-map-support/register";
import { Logger } from "../core/logger";
import Constants from "../core/constants";
import { TelegramNotificationManager } from "../core/managers/notification/telegramnotificationmanager";
import { HttpContext, IFunctionRequest } from "../core/azure-functions";

import * as _ from "lodash";
import * as subMinutes from "date-fns/sub_minutes";


import { ITradingStrategy } from "../core/interfaces/itradingstrategy";
import { IExchangeManager } from "../core/interfaces/iexchangemanager";
import { ConnectionManager } from "../core/store/connectionmanager";
import { MarketSummary } from "../core/store/entities/marketsummery";
import { Period, PeriodToMinutes } from "../core/models/period";
import { Portfolio } from "../core/store/entities/portfolio";
import { BinanceExchange } from "../core/exchange/binance";
import { BbandRsi } from "../core/strategies/bbandrsi";

let GetTrend = async function(strategy: ITradingStrategy, exchange: IExchangeManager, marketName: string): Promise<number> {
  let period = Period.HalfAnHour;
  let numberOfCandles = 100;
  let minimumDate = subMinutes(new Date(), PeriodToMinutes(period) * numberOfCandles);
  let candles = await exchange.GetTickerHistory(marketName, minimumDate, period);

  let strat = strategy.clone();
  strat.Candles = _.filter(candles, (candle) => {
    return candle.Timestamp > minimumDate;
  });
  let signalDate = candles[(candles.length - 1)].Timestamp;
  //  This is an outdated candle...
  if (signalDate < subMinutes(new Date(), numberOfCandles)) {
    return 0;
  }

  //  Calculate the signal for this market
  let trend = strat.Prepare();
  return _.last(trend) || 0;
};

// This function triggers every 30 minutes to update the current trade portfolio
export default async function (context: HttpContext, req: IFunctionRequest) {

  Logger.setLogger(context.log);
  try {
    context.log("Starting processing...");

    // input variables
    let exchange = new BinanceExchange(Constants.IsDryRunning);
    let strategy = new BbandRsi();

    // get market data from cache storage
    let marketTable = await ConnectionManager.GetTable(Constants.MarketTableName, Constants.IsDryRunning);
    let marketEntities = await marketTable.CreateQuery("PartitionKey == ?", "MARKETS");
    let markets = _.map(marketEntities, (x) => new MarketSummary(MarketSummary.convertFromAzureTableEntity(x)));

    //  Prioritize markets with high volume.
    markets = _.sortBy(markets, (x) => {
      return -x.Volume;
    });

    // only trade in top 25 volume markets
    markets = markets.slice(0, 25);

    // get trend of the markets and analyse with our strategy
    let positiveMarkets = [];
    for (let market of markets) {
      let trend = await GetTrend(strategy, exchange, market.Name);
      let isPositive = trend === 1;
      if (isPositive) positiveMarkets.push(market);
    }

    // get weight per coin
    let weightPerMarket = 1 / positiveMarkets.length;
    let coins = _.map(positiveMarkets, (x) => {
      let [coin, reversed] = exchange.convertMarketToCoin(x.Name);
      return coin;
    });

    // create portfolio
    let p = new Portfolio();
    p.Date = new Date();
    p.RowKey = `MNT${(new Date(9999, 12, 31, 23, 59, 59, 9999999).getTime() + 621355968000000) - (new Date().getTime() + 621355968000000)}`;
    p.PartitionKey = strategy.Name.toUpperCase();
    p["BTC"] = positiveMarkets.length > 0 ? 0 : 1;
    for (let coin of coins) {
      p[coin] = weightPerMarket;
    }

    // store portfolio in table
    let portfolioTable = await ConnectionManager.GetTable(Constants.PortfolioTableName, Constants.IsDryRunning);
    portfolioTable.insertEntity(Portfolio.convertToAzureTableEntity(p));

  }
  catch (ex) {
    Logger.error(ex);
  }
}