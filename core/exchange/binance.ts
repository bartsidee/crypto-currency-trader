import { IExchangeManager } from "../interfaces/iexchangemanager";

import { Candle } from "../models/candle";
import { MarketSummary } from "../store/entities/marketsummery";
import { OpenOrder } from "../models/openorder";
import { BookOrder, BookOrderTypeEnum } from "../models/bookorder";
import { Ticker } from "../models/ticker";
import { Period } from "../models/period";

import { Logger } from "../logger";
import Constants from "../constants";
import * as _ from "lodash";
import * as subDays from "date-fns/sub_days";
import * as startOfDay from "date-fns/start_of_day";
import BinanceRest, {
  BinanceOrderSideEnum,
  BinanceOrderTypeEnum,
  BinanceOrderTimeInForceEnum,
  BinanceKlinesIntervalEnum
} from "../api/binance.api";

export class BinanceExchange implements IExchangeManager {
  private _dryRun: boolean;
  private _api: BinanceRest;
  constructor(dryrun = true) {
    this._dryRun = dryrun;
    this._api = new BinanceRest({
      key: Constants.BinanceApiKey,
      secret: Constants.BinanceApiSecret
    });
    this.CheckMarketExistance();
  }

  roundAmount(amount: number, tickSize: number = 0.00000001) {
    let t = -Math.log10(tickSize);
    let precision = Math.pow(10, t);
    amount *= precision;
    amount = Math.floor(amount);
    amount /= precision;
    return amount;
  }

  convertMarketToSymbol(market: string) {
    let [coin1, coin2] = market.split("_");
    return coin2 + coin1;
  }

  convertSymbolToMarket(symbol: string) {
    let index = symbol.indexOf("BTC");
    if (index == 0)
      index = 3;
    return [symbol.slice(index), symbol.slice(0, index)].join("_");
  }

  convertMarketToCoin(market: string): [string, boolean] {
    let [coin1, coin2] = market.split("_");
    if (coin1 == "BTC") {
      return [coin2, false];
    // reversed trade
    } else {
      return [`reversed_${coin1}`, true];
    }
  }

  convertCoinToMarket(coin: string): string {
    return coin.startsWith("reversed_") ? `${coin.replace("reversed_", "")}_BTC` : `BTC_${coin}`;
  }

  async CheckMarketExistance() {
    Logger.info("Binance:: CheckMarketExistance");
    let markets = await this.GetMarkets();
    for (let market of Constants.MarketBlackList) {
      if (markets.indexOf(market) === -1)
        throw new Error(`Pair ${market} is not available at Binance`);
    }
  }

  async Buy(market: string, quantity: number, rate: number, isReversed = false): Promise<number>  {
    let [coin, reversed] = this.convertMarketToCoin(market);
    if (!isReversed && reversed) return this.Sell(market, this.roundAmount(quantity * rate, 0.000001), this.roundAmount(1 / rate, 0.01), true);

    Logger.info("Binance:: Buy", market, quantity, rate);
    if (this._dryRun) return -1;

    let result = await this._api.newOrder({
      symbol: this.convertMarketToSymbol(market),
      side: BinanceOrderSideEnum.BUY,
      type: BinanceOrderTypeEnum.LIMIT,
      timeInForce: BinanceOrderTimeInForceEnum.GTC,
      quantity: quantity,
      price: rate
    });
    return result.orderId;
  }

  async Sell(market: string, quantity: number, rate: number, isReversed = false): Promise<number> {
    let [coin, reversed] = this.convertMarketToCoin(market);
    if (!isReversed && reversed) return this.Buy(market, this.roundAmount(quantity * rate, 0.000001), this.roundAmount(1 / rate, 0.01), true);

    Logger.info("Binance:: Sell", market, quantity, rate);
    if (this._dryRun) return -1;

    let result = await this._api.newOrder({
      symbol: this.convertMarketToSymbol(market),
      side: BinanceOrderSideEnum.SELL,
      type: BinanceOrderTypeEnum.LIMIT,
      timeInForce: BinanceOrderTimeInForceEnum.GTC,
      quantity: quantity,
      price: rate
    });
    return result.orderId;
  }

  async CancelOrder(market: string, orderId: number) {
    Logger.info("Binance:: CancelOrder", market, orderId);
    if (this._dryRun) return;

    let result = await this._api.cancelOrder({
      symbol: this.convertMarketToSymbol(market),
      orderId: orderId
    });
  }

  async GetBalance(...currency: string[]) {
    if (this._dryRun) return [999.9];
    currency = currency.map((x) => x.replace("reversed_", ""));

    let result = await this._api.account();

    let balances = result.balances.filter((balance) => {
      return currency.indexOf(balance.asset) > -1;
    });

    return balances.map((balance) => {
      Logger.info(`Binance:: Market: ${currency} Balance: ${(!balance) ? 0 : this.roundAmount(parseFloat(balance.free))}`);
      return (!balance) ? 0 : this.roundAmount(parseFloat(balance.free));
    });
  }

  async GetMarkets() {
    Logger.info("Binance:: GetMarkets");
    let result = await this._api.allPrices();
    let markets = _.filter(result, (x) => { return x.symbol.indexOf("BTC") > -1; });
    return _.map(markets, (market) => {
        return this.convertSymbolToMarket(market.symbol);
    });
  }

  async GetMarketSummaries(): Promise<MarketSummary[]> {
    Logger.info("Binance:: GetMarketSummaries");
    let markets = await this._api.getMarketSummeries();
    markets = _.filter(markets, (x) => { return x.active === true && x.symbol.indexOf("BTC") > -1; });
    return _.map(markets, (market) => {
      let marketName = this.convertSymbolToMarket(market.symbol);
      let [coin, reversed] = this.convertMarketToCoin(marketName);
      if (reversed) {
        return new MarketSummary({
          Name: marketName,
          High: this.roundAmount(1 / parseFloat(market.low)),
          Low: this.roundAmount(1 / parseFloat(market.high)),
          Close: this.roundAmount(1 / parseFloat(market.close)),
          Volume: this.roundAmount(parseFloat(market.volume) * parseFloat(market.close), parseFloat(market.tickSize)),
          PricePrecision: 0.00000001,
          AmountPrecision: parseFloat(market.tickSize),
          TimeStamp: new Date(),
          PartitionKey: "MARKETS",
          RowKey: marketName
        });
      } else {
        return new MarketSummary({
          Name: marketName,
          High: this.roundAmount(parseFloat(market.high)),
          Low: this.roundAmount(parseFloat(market.low)),
          Close: this.roundAmount(parseFloat(market.close)),
          Volume: this.roundAmount(parseFloat(market.volume)),
          PricePrecision: parseFloat(market.tickSize),
          AmountPrecision: parseFloat(market.minTrade),
          TimeStamp: new Date(),
          PartitionKey: "MARKETS",
          RowKey: marketName
        });
      }
    });
  }

  async GetAvarageMarketVolumeOnPeriod(market: string, days: number): Promise<number> {
    let klines = await this.GetTickerHistory(market, startOfDay(subDays(new Date(), days)), Period.Day);
    return _.sumBy(klines, (x) => x.Volume) / days;
  }

  async GetOpenOrders(market: string): Promise<OpenOrder[]> {
    Logger.info("Binance:: GetOpenOrders", market);
    if (this._dryRun) return [];

    let results = await this._api.openOrders({
      symbol: this.convertMarketToSymbol(market)
    });

    return _.map(results, (openOrder) => {
      let [coin, reversed] = this.convertMarketToCoin(market);
      if (reversed) {
        return {
          Market: this.convertSymbolToMarket(openOrder.symbol),
          OrderId: openOrder.orderId,
          Price: this.roundAmount(1 / parseFloat(openOrder.price)),
          Quantity: this.roundAmount(parseFloat(openOrder.origQty) * parseFloat(openOrder.price)),
          QuantityRemaining: this.roundAmount((parseFloat(openOrder.origQty) - parseFloat(openOrder.executedQty))  * parseFloat(openOrder.price)),
          OrderType: openOrder.side === BinanceOrderSideEnum.BUY ? BookOrderTypeEnum.SELL : BookOrderTypeEnum.BUY,
          Limit: this.roundAmount(1 / parseFloat(openOrder.stopPrice)),
          Time: new Date(openOrder.time)
        };
      } else {
        return {
          Market: this.convertSymbolToMarket(openOrder.symbol),
          OrderId: openOrder.orderId,
          Price: this.roundAmount(parseFloat(openOrder.price)),
          Quantity: this.roundAmount(parseFloat(openOrder.origQty)),
          QuantityRemaining: this.roundAmount(parseFloat(openOrder.origQty) - parseFloat(openOrder.executedQty)),
          OrderType: openOrder.side === BinanceOrderSideEnum.BUY ? BookOrderTypeEnum.BUY : BookOrderTypeEnum.SELL,
          Limit: this.roundAmount(parseFloat(openOrder.stopPrice)),
          Time: new Date(openOrder.time)
        };
      }
    });
  }

  async GetTicker(market: string): Promise<Ticker> {
    Logger.info("Binance:: GetTicker", market);
    let ticker = await this._api.ticker24hr({
      symbol: this.convertMarketToSymbol(market)
    });
    let [coin, reversed] = this.convertMarketToCoin(market);
    if (reversed) {
      return {
        Market: this.convertSymbolToMarket(ticker.symbol),
        Ask: this.roundAmount(1 / parseFloat(ticker.askPrice)),
        Bid: this.roundAmount(1 / parseFloat(ticker.bidPrice)),
        Last: this.roundAmount(1 / parseFloat(ticker.lastPrice))
      };
    } else {
      return {
        Market: this.convertSymbolToMarket(ticker.symbol),
        Ask: this.roundAmount(parseFloat(ticker.askPrice)),
        Bid: this.roundAmount(parseFloat(ticker.bidPrice)),
        Last: this.roundAmount(parseFloat(ticker.lastPrice))
      };
    }
  }

  async GetOrder(market: string, orderId: number): Promise<BookOrder> {
    Logger.info("Binance:: GetOrder", market, orderId);
    if (this._dryRun) return <BookOrder>{};

    let result = await this._api.queryOrder({
      symbol: this.convertMarketToSymbol(market),
      orderId: orderId
    });

    let [coin, reversed] = this.convertMarketToCoin(market);
    if (reversed) {
      return {
        OrderId: result.orderId,
        OrderType: result.side === BinanceOrderSideEnum.BUY ? BookOrderTypeEnum.SELL : BookOrderTypeEnum.BUY,
        Price: this.roundAmount(1 / parseFloat(result.price)),
        OriginalQuantity : this.roundAmount(parseFloat(result.origQty) * parseFloat(result.price)),
        ExecutedQuantity : this.roundAmount(parseFloat(result.executedQty) * parseFloat(result.price)),
        Market: this.convertSymbolToMarket(result.symbol)
      };
    } else {
      return {
        OrderId: result.orderId,
        OrderType: result.side === BinanceOrderSideEnum.BUY ? BookOrderTypeEnum.BUY : BookOrderTypeEnum.SELL,
        Price: this.roundAmount(parseFloat(result.price)),
        OriginalQuantity: this.roundAmount(parseFloat(result.origQty)),
        ExecutedQuantity: this.roundAmount(parseFloat(result.executedQty)),
        Market: this.convertSymbolToMarket(result.symbol)
      };
    }
  }

  async GetTickerHistory(market: string, startDate: Date, period: Period): Promise<Candle[]> {
    Logger.info("Binance:: GetTickerHistory", market, startDate, period);
    let BinancePeriod = (() => {
      switch (period) {
        case Period.Day:
          return BinanceKlinesIntervalEnum.OneDay;
        case Period.FiveMinutes:
          return BinanceKlinesIntervalEnum.FiveMinutes;
        case Period.FourHours:
          return BinanceKlinesIntervalEnum.FourHours;
        case Period.HalfAnHour:
          return BinanceKlinesIntervalEnum.ThirthyMinute;
        case Period.Hour:
          return BinanceKlinesIntervalEnum.OneHour;
        case Period.Minute:
          return BinanceKlinesIntervalEnum.OneMinute;
        case Period.QuarterOfAnHour:
          return BinanceKlinesIntervalEnum.FiveteenMinutes;
        case Period.TwoHours:
          return BinanceKlinesIntervalEnum.TwoHours;
      }
    })();

    let result = await this._api.klines({
      symbol: this.convertMarketToSymbol(market),
      interval: BinancePeriod,
      startTime: startDate.getTime()
    });

    let [coin, reversed] = this.convertMarketToCoin(market);
    return _.map(result, (item) => {
      if (reversed) {
        return {
          Timestamp: new Date(item[0]),
          High: this.roundAmount(1 / parseFloat(item[3])),
          Low: this.roundAmount(1 / parseFloat(item[2])),
          Open: this.roundAmount(1 / parseFloat(item[1])),
          Close: this.roundAmount(1 / parseFloat(item[4])),
          Volume: this.roundAmount(parseFloat(item[5]))
        };
      } else {
        return {
          Timestamp: new Date(item[0]),
          High: this.roundAmount(parseFloat(item[2])),
          Low: this.roundAmount(parseFloat(item[3])),
          Open: this.roundAmount(parseFloat(item[1])),
          Close: this.roundAmount(parseFloat(item[4])),
          Volume: this.roundAmount(parseFloat(item[7]))
        };
      }
    });
  }
}