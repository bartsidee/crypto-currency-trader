import { ITradingStrategy } from "../../interfaces/itradingstrategy";
import { IExchangeManager } from "../../interfaces/iexchangemanager";
import { BinanceExchange } from "../../exchange/binance";
import Constants from "../../constants";
import * as _ from "lodash";
import * as subHours from "date-fns/sub_hours";
import * as subMinutes from "date-fns/sub_minutes";
import * as differenceInMinutesimport from "date-fns/difference_in_minutes";
import { TelegramNotificationManager } from "./telegramnotificationmanager";
import { Period } from "../../models/period";
import { MarketSummary } from "../../store/entities/marketsummery";
import { ConnectionManager } from "../../store/connectionmanager";
import { Logger } from "../../logger";

export class NotificationManager {

  private _api: IExchangeManager;
  private _strategy: ITradingStrategy;

  public constructor (strategy: ITradingStrategy) {
    this._api = new BinanceExchange(true);
    this._strategy = strategy;
  }
  static sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  ///  <summary>
  ///  List everything that gives a positive trade signal.
  ///  </summary>
  private async ListTrades() {
    Logger.info("NotificationManager:: ListTrades");
    let results: string[] = [];

    // get market data from cache storage
    let marketTable = await ConnectionManager.GetTable(Constants.MarketTableName, Constants.IsDryRunning);
    let marketEntities = await marketTable.CreateQuery("PartitionKey == ?", "MARKETS");
    let markets = _.map(marketEntities, (x) => new MarketSummary(MarketSummary.convertFromAzureTableEntity(x)));

    //  Prioritize markets with high volume.
    markets = _.orderBy(markets, (x) => {
      return -x.Volume;
    });

    // Reduce profits losses on rounding the amounts
    markets = _.filter(markets, (x) => {
      return (Constants.MinAmountOfBtcToInvestPerTrader / x.Close) > (40 * x.AmountPrecision);
    });

    for (let market of markets) {
      try {
        let trend = await this.GetTrend(market.Name);
        if (trend.length > 0 && _.last(trend) == 1) {
          results.push(market.Name);
        }
      }
      catch (e) {
        //  Couldn't get a trend, no worries, move on.
        Logger.info(market.Name, e);
        continue;
      }
      await NotificationManager.sleep(500);
    }
    return results;
  }

  ///  <summary>
  ///  Retrieves a trend list for the given market.
  ///  </summary>
  ///  <param name="tradeMarket"></param>
  ///  <returns></returns>
  private async GetTrend(tradeMarket: string) {
    Logger.info("NotificationManager:: GetTrend", tradeMarket);
    let minimumDate = subHours(new Date(), 120);
    let candles = await this._api.GetTickerHistory(tradeMarket, minimumDate, Period.Hour);
    this._strategy.Candles = _.filter(candles, (candle) => {
      return candle.Timestamp > minimumDate;
    });
    let signalDate = candles[(candles.length - 1)].Timestamp;
    //  This is an outdated candle...
    if (signalDate < subMinutes(new Date(), 120)) {
      return [];
    }

    //  This calculates a buy signal for each candle.
    let trend = this._strategy.Prepare();
    return trend;
  }

  public async Process() {
    Logger.info("NotificationManager:: Process");
    let buySignals = await this.ListTrades();
    let telegramManager = new TelegramNotificationManager();
    if (buySignals.length == 0) {
      Logger.info("NotificationManager:: SendNotification", "No possible trends found...");
      return;
    }

    for (let potentialTrade in buySignals) {
      Logger.info("NotificationManager:: SendNotification", `_Experimental:_ Possible trend coming up for *${potentialTrade}*`);
      telegramManager.SendNotification(`_Experimental:_ Possible trend coming up for *${potentialTrade}*`);
    }

  }
}