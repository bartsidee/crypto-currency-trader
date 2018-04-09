import * as subHours from "date-fns/sub_hours";
import * as subMinutes from "date-fns/sub_minutes";
import * as format from "date-fns/format";
import * as startOfDay from "date-fns/start_of_day";
import * as differenceInMinutes from "date-fns/difference_in_minutes";
import * as _ from "lodash";
import * as azure from "azure-storage";

import { Logger } from "../logger";
import { IExchangeManager } from "../interfaces/iexchangemanager";
import { INotificationManager } from "../interfaces/inotificationmanager";
import { ITradingStrategy } from "../interfaces/itradingstrategy";
import { ITradeManager } from "../interfaces/itrademanager";

import { ConnectionManager } from "../store/connectionmanager";
import { BinanceExchange } from "../exchange/binance";

import Constants from "../constants";

import { Candle } from "../models/candle";
import { MarketSummary } from "../store/entities/marketsummery";
import { SellType } from "../models/selltype";
import { Period, PeriodToMinutes } from "../models/period";
import { Ticker } from "../models/ticker";
import { Balance } from "../store/entities/balance";
import { Trade } from "../store/entities/trade";
import { Portfolio } from "../store/entities/portfolio";
import { BookOrderTypeEnum } from "../models/bookorder";

export class TradeManager implements ITradeManager {
  private _totalBalance: Balance;

  private _dayBalance: Balance;

  private _totalBalanceExists: boolean;

  private _dayBalanceExists: boolean;

  private _oldDayBalance: number;

  private _oldTotalBalance: number;

  public constructor (private _strategy: string, private _exchange: IExchangeManager, private _notification: INotificationManager) {

  }

  ///  <summary>
  ///  Queries the persistence layer for open trades and
  ///  handles them, otherwise a new trade is created.
  ///  </summary>
  ///  <returns></returns>
  public async Process() {
    //  Create two batches that we can use to update our tables.
    let tradeBatch = ConnectionManager.TableBatch();
    let balanceBatch = ConnectionManager.TableBatch();

    //  Get our current trades.
    let tradeTable = await ConnectionManager.GetTable(Constants.OrderTableName, Constants.IsDryRunning);
    let activeTradeEntries = await tradeTable.CreateQuery("IsOpen == ?bool?", true);
    let activeTrades = activeTradeEntries.map((x) => {
      return new Trade(Trade.convertFromAzureTableEntity(x));
    });

    //  Get our portfolio
    let portfolioTable = await ConnectionManager.GetTable(Constants.PortfolioTableName, Constants.IsDryRunning);
    let portfolioEntries = await portfolioTable.CreateLimitQuery(2, "PartitionKey == ?", this._strategy.toUpperCase());
    let portfolios = portfolioEntries.map(x => {
      return new Portfolio(Portfolio.convertFromAzureTableEntity(x));
    });

    // get the latest portfolio
    if (portfolios.length == 0) return Logger.warn("No portfolio found");
    let portfolio = portfolios[0];

    // get market data
    let marketTable = await ConnectionManager.GetTable(Constants.MarketTableName, Constants.IsDryRunning);
    let marketEntities = await marketTable.CreateQuery("PartitionKey == ?", "MARKETS");
    let markets = _.map(marketEntities, (x) => new MarketSummary(MarketSummary.convertFromAzureTableEntity(x)));

    // all coins currently in active trading
    let portfolioCoins = _.uniq(_.keys(portfolio)).filter((x) => ["Date", "PartitionKey", "RowKey", "Timestamp"].indexOf(x) == -1);

    // round portfolio weight values to blocks of 1% and make sure total keeps 100%
    portfolio = ((data, keys) => {
      // round numbers
      let values = keys.map((key) => {
        return Math.floor(data[key] * 10) / 10;
      });
      let maxIndex = values.indexOf(<number>_.max(values));
      let diff = Math.round((1 - _.sum(values)) * 10) / 10; // total should be 100%, get the diff after rounding
      values[maxIndex] += diff;     // add diff to highest number, quick dirty correction
      for (let key in data) {
        if (keys.indexOf(key) === -1) continue;
        data[key] = values[keys.indexOf(key)];  // append corrected value to portfolio
      }
      return data;
    })(portfolio, portfolioCoins);

    //  get current balance
    let balanceTable = await ConnectionManager.GetTable(Constants.BalanceTableName, Constants.IsDryRunning);
    let totalbalanceEntity = _.first(await balanceTable.CreateQuery("RowKey == ?", "TOTAL"));
    if (totalbalanceEntity) this._totalBalance = new Balance(Balance.convertFromAzureTableEntity(totalbalanceEntity));
    let dayBalanceEntity = _.first(await balanceTable.CreateQuery("RowKey == ?", format(new Date(), "YYYYMMDD")));
    if (dayBalanceEntity) this._dayBalance = new Balance(Balance.convertFromAzureTableEntity(dayBalanceEntity));

    //  Create both the balances if they don't exist yet.
    this.CreateBalancesIfNotExists(balanceBatch);

    //  Handle our active trades.
    for (let trade of activeTrades) {
      let orders = await this._exchange.GetOpenOrders(trade.Market);
      let index = activeTrades.indexOf(trade);
      let openOrder = _.find(orders, (x) => { return x.OrderId == trade.OpenOrderId; });
      if (openOrder) {
        // remove open trades after 3m and if 0 quantity sold/bought, we lost the momentum
        // open sell trades
        if (trade.OpenOrderId && trade.SellOrderId && differenceInMinutes(new Date(), <Date>trade.CloseDate) > 3) {

          // cancel the order
          Logger.info(`Close open sell order for trade ${trade.OpenOrderId}`);
          await this._exchange.CancelOrder(trade.Market, trade.OpenOrderId);

          //  Get order balance
          let bookOrder = await this._exchange.GetOrder(trade.Market, trade.OpenOrderId);
          if (bookOrder && bookOrder.ExecutedQuantity < bookOrder.OriginalQuantity && (bookOrder.OriginalQuantity - bookOrder.ExecutedQuantity) > trade.AmountPrecision) {
            let tradeTable = await ConnectionManager.GetTable(Constants.OrderTableName, Constants.IsDryRunning);
            // create partial trade
            let holdPercentage = (trade.Quantity - bookOrder.ExecutedQuantity) / trade.Quantity;
            trade.OpenOrderId = undefined; // no active trades
            let [openTrade, soldTrade] = await this.SplitTrades(trade, trade.InvestmentWeight * holdPercentage);
            // close the old trade
            if (soldTrade) {
              soldTrade = this.CloseTradeIfFulfilled(soldTrade);
              tradeTable.insertOrReplaceEntity(Trade.convertToAzureTableEntity(soldTrade));
              Logger.info(`SELL order partially completed ${soldTrade.Market} (${soldTrade.Quantity}/${trade.Quantity} units)`);
              this.SendNotification(`SELL order partially completed ${soldTrade.Market} at ${soldTrade.OpenRate}BTC (${soldTrade.Quantity}/${trade.Quantity} units)`);
            }
            // cleanup and store the new trade
            openTrade.CloseDate = undefined;
            openTrade.CloseProfitPercentage = undefined;
            openTrade.CloseProfit = undefined;
            openTrade.CloseRate = undefined;
            openTrade.SellOrderId = undefined;
            trade = openTrade;
            // put in new sell order
            try {
              trade = await this.ExecuteSell(trade);
            } catch (e) {}
            tradeTable.insertOrReplaceEntity(Trade.convertToAzureTableEntity(trade));
          }

        // open buy trades
        } else if (trade.OpenOrderId && trade.BuyOrderId && differenceInMinutes(new Date(), <Date>trade.OpenDate) > 3) {
          Logger.info(`Close open buy order for trade ${trade.OpenOrderId}`);
          // cancel the order
          let order = _.find(orders, (x) => { return x.OrderId == trade.OpenOrderId; });
          await this._exchange.CancelOrder(trade.Market, trade.OpenOrderId);

          //  Get order balance
          let bookOrder = await this._exchange.GetOrder(trade.Market, trade.OpenOrderId);
          if (bookOrder && bookOrder.ExecutedQuantity < bookOrder.OriginalQuantity && bookOrder.ExecutedQuantity > trade.AmountPrecision) {
            let tradeTable = await ConnectionManager.GetTable(Constants.OrderTableName, Constants.IsDryRunning);
            // create partial trade as we purchased not the full amount after the cancelation
            let holdPercentage = bookOrder.ExecutedQuantity / trade.Quantity;
            trade.OpenOrderId = undefined;
            let [openTrade, noneTrade] = await this.SplitTrades(trade, trade.InvestmentWeight * holdPercentage);
            Logger.info(`BUY order partially completed ${openTrade.Market} (${openTrade.Quantity}/${trade.Quantity} units)`);
            this.SendNotification(`BUY order partially completed ${openTrade.Market} at ${openTrade.OpenRate}BTC (${openTrade.Quantity}/${trade.Quantity} units)`);
            tradeTable.insertOrReplaceEntity(Trade.convertToAzureTableEntity(openTrade));
            // weight difference
            let diffWeight = trade.InvestmentWeight * (1 - holdPercentage);
            trade = openTrade;
            // create new buy order for the missing part
            try {
              let newTrade = await this.ExecuteBuy(<MarketSummary>{Name: trade.Market, PricePrecision: trade.PricePrecision, AmountPrecision: trade.AmountPrecision}, diffWeight);
              if (newTrade) trade = await this.MergeTrades(trade, newTrade);
            } catch (e) {}
            tradeTable.insertOrReplaceEntity(Trade.convertToAzureTableEntity(trade));
          } else {
            // remove this trade as it was never actioned and nothing purchased
            tradeBatch.deleteEntity(Trade.convertToAzureTableEntity(trade));
            activeTrades.splice(index, 1); // remove from active trades
            this.SendNotification(`Cancelled BUY order ${trade.Market} at ${trade.OpenRate}BTC (${trade.Quantity} units)`);
          }
        } else {
          //  This means we're still buying it.
          Logger.info(`Already an open order for trade ${trade.OpenOrderId}`);
        }
      }
      else {
        trade.OpenOrderId = undefined;
        //  No open order with the order ID of the trade.
        //  Check if this trade can be closed
        trade = this.CloseTradeIfFulfilled(trade);
        if (trade.IsOpen) {
          //  Check if we can sell our current pair
          Logger.info(`Check if we should sell ${trade.Market}`);
          let [coin, reversed] = this._exchange.convertMarketToCoin(trade.Market);
          let weight = (coin in portfolio) ? portfolio[coin] : 0;
          try {
            trade = await this.HandleTrade(trade, weight);
          } catch (e) {
            Logger.warn("Error during sell", e);
          }
        }
        tradeBatch.insertOrReplaceEntity(Trade.convertToAzureTableEntity(trade));
      }

    }

    // we should have a buy signal
    // and no active trades for this market
    let buyMarkets = portfolioCoins.filter((coin) => {
      let market = this._exchange.convertCoinToMarket(coin);
      return portfolio[coin] > 0 && !activeTrades.find((trade) => trade.Market === market);
    });

    // execute new buy action for the unhandled / updated markets
    for (let coin of buyMarkets) {
      let market = this._exchange.convertCoinToMarket(coin);
      let pair = markets.find((x) => x.Name === market);
      if (pair) {
        try {
          let trade = await this.ExecuteBuy(pair, portfolio[coin]);
          if (trade) {
            activeTrades.push(trade);
            tradeBatch.insertOrReplaceEntity(Trade.convertToAzureTableEntity(trade));
          }
        } catch (e) {
          Logger.warn("Error during buy", e);
        }
      }
    }

    Logger.info(`Currently handling ${activeTrades.length} trades.`);
    //  If these actually changed make a roundtrip to the server to set them.
    if (this._dayBalanceExists && (this._oldDayBalance != this._dayBalance.Profit)) {
      balanceBatch.insertOrReplaceEntity(Balance.convertToAzureTableEntity(this._dayBalance));
    }

    if (this._totalBalanceExists && (this._oldTotalBalance != this._totalBalance.Profit)) {
      balanceBatch.insertOrReplaceEntity(Balance.convertToAzureTableEntity(this._totalBalance));
    }

    if (tradeBatch.size() > 0) await tradeTable.executeBatch(tradeBatch);
    if (balanceBatch.size() > 0) await balanceTable.executeBatch(balanceBatch);

  }

  ///  <summary>
  ///  Creates our total and daily balance records in the Azure Table Storage.
  ///  </summary>
  ///  <param name="balanceBatch"></param>
  private CreateBalancesIfNotExists(balanceBatch: azure.TableBatch) {
    this._totalBalanceExists = (this._totalBalance != undefined);
    this._dayBalanceExists = (this._dayBalance != undefined);
    if (this._totalBalance === undefined) {
      this._totalBalance = new Balance({
        PartitionKey : "BALANCE",
        RowKey : "TOTAL",
        LastUpdated : new Date(),
        StartBalance: Constants.StartCapital,
        TotalBalance: Constants.StartCapital,
        Profit : 0
      });
      balanceBatch.insertEntity(Balance.convertToAzureTableEntity(this._totalBalance), <any>undefined);
    }
    else {
      this._oldTotalBalance = this._totalBalance.Profit || 0;
    }

    if (this._dayBalance === undefined) {
      this._dayBalance = new Balance({
        PartitionKey : "BALANCE",
        RowKey : format(new Date(), "YYYYMMDD"),
        BalanceDate : startOfDay(new Date),
        StartBalance: this._totalBalance.TotalBalance,
        LastUpdated : new Date(),
        Profit : 0
      });
      balanceBatch.insertEntity(Balance.convertToAzureTableEntity(this._dayBalance), <any>undefined);
    }
    else {
      this._oldDayBalance = this._dayBalance.Profit || 0;
    }

  }

  ///  <summary>
  ///  Calculates bid target between current ask price and last price.
  ///  </summary>
  ///  <param name="tick"></param>
  ///  <returns></returns>
  private GetTargetBid(tick: Ticker): number {
    //  If the ask is below the last, we can get it on the cheap.
    if (tick.Ask < tick.Last) {
      return tick.Ask;
    }
    return (tick.Ask + (Constants.AskLastBalance * (tick.Last - tick.Ask)));
  }

  private GetTargetAsk(tick: Ticker): number {
    return tick.Bid;
  }

  ///  <summary>
  ///   Sells the current pair if the threshold is reached and updates the trade record.
  ///  </summary>
  ///  <param name="trade"></param>
  private async HandleTrade(trade: Trade, weight: number, force = false): Promise<Trade> {
    if (!trade.IsOpen) {
      //  Trying to handle a closed trade...
      Logger.warn(`Trying to handle a closed trade ${trade.Market} | PK: ${trade.PartitionKey}`);
      return trade;
    }

    // sell forced
    if (force) {
      Logger.info(`Sell trade ${trade.Market} forced`);
      trade = await this.ExecuteSell(trade);
    // sell all as weight is 0
    } else if (weight === 0) {
      Logger.info(`Sell all of ${trade.Market} as new weight is 0`);
      trade = await this.ExecuteSell(trade);
    // sell some as weight is smaller
    } else if (weight < trade.InvestmentWeight) {
      let sellBTC = (trade.InvestmentWeight - weight) * trade.StakeAmount;
      let holdBTC = weight * trade.StakeAmount;
      // sell some if it is within BTC invest limits
      if (sellBTC > Constants.MinimumBTCTransactionVolume && holdBTC > Constants.MinimumBTCTransactionVolume) {
        Logger.info(`Sell some of ${trade.Market} as new weight ${weight} is lower then the old weight ${trade.InvestmentWeight}`);
        let [tradeHold, tradeSell] = await this.SplitTrades(trade, weight);
        // sell the partial trade
        if (tradeSell) {
          tradeSell = await this.ExecuteSell(tradeSell);
          let tradeTable = await ConnectionManager.GetTable(Constants.OrderTableName, Constants.IsDryRunning);
          tradeTable.insertOrReplaceEntity(Trade.convertToAzureTableEntity(tradeSell));
        }
        // update existing trade with the updated new trade
        trade = tradeHold;
      // else sell all
      } else {
        Logger.info(`Sell all of ${trade.Market} as new weight is not within invest bounds`);
        trade = await this.ExecuteSell(trade);
      }
    // buy some as weight is larger
    } else if (weight > trade.InvestmentWeight) {
      Logger.info(`Buy more of ${trade.Market} as new weight ${weight} is higher then the old weight ${trade.InvestmentWeight}`);
      // buy the difference
      let diffWeight = weight - trade.InvestmentWeight;
      let newTrade = await this.ExecuteBuy(<MarketSummary>{Name: trade.Market, PricePrecision: trade.PricePrecision, AmountPrecision: trade.AmountPrecision}, diffWeight);
      if (newTrade) {
        trade = await this.MergeTrades(trade, newTrade);
      }
    }
    return trade;
  }

  // split trade
  private async SplitTrades(trade: Trade, weight: number): Promise<Trade[]> {
    if (weight > trade.InvestmentWeight) return [trade];
    let sellPercentage = (trade.InvestmentWeight - weight) / trade.InvestmentWeight;
    if (this._exchange.roundAmount(trade.Quantity * sellPercentage) === 0 ) return [trade];

    let trade1 = trade.clone();
    trade1.Quantity = trade.Quantity * (1 - sellPercentage);
    trade1.StakeAmount = trade.StakeAmount * (1 - sellPercentage);
    trade1.InvestmentWeight = weight;
    trade1.RowKey = `MNT${(new Date(9999, 12, 31, 23, 59, 59, 9999999).getTime() * 10000 + 621355968000000000) - (new Date().getTime() * 10000 + 621355968000000000)}`;

    let trade2 = trade.clone();
    trade2.Quantity = trade2.Quantity * sellPercentage;
    trade2.StakeAmount = trade2.StakeAmount * sellPercentage;
    trade2.InvestmentWeight = trade2.InvestmentWeight - weight;
    trade2.RowKey = `MNT${(new Date(9999, 12, 31, 23, 59, 59, 9999999).getTime() * 10000 + 621355968000000000) - (new Date().getTime() * 10000 + 621355968000000000) + 1000}`;

    // close old trade
    let tradeTable = await ConnectionManager.GetTable(Constants.OrderTableName, Constants.IsDryRunning);
    trade.IsOpen = false;
    trade.CloseDate = undefined;
    trade.CloseProfitPercentage = undefined;
    trade.CloseProfit = undefined;
    trade.CloseRate = undefined;
    trade.SellOrderId = undefined;
    tradeTable.insertOrReplaceEntity(Trade.convertToAzureTableEntity(trade));

    return [trade1, trade2];
  }

  // merge trade
  private async MergeTrades(trade: Trade, newTrade: Trade): Promise<Trade> {
    if (trade.Market !== newTrade.Market) return trade;
    let newPercentage = newTrade.InvestmentWeight / (trade.InvestmentWeight + newTrade.InvestmentWeight);

    let trade1 = trade.clone();
    trade1.Quantity = trade.Quantity + newTrade.Quantity;
    trade1.OpenOrderId = newTrade.OpenOrderId ? newTrade.OpenOrderId : trade.OpenOrderId;
    trade1.OpenDate = trade.OpenDate > newTrade.OpenDate ? trade.OpenDate : newTrade.OpenDate;
    trade1.InvestmentWeight = trade.InvestmentWeight + newTrade.InvestmentWeight;
    trade1.StakeAmount = trade.StakeAmount + newTrade.StakeAmount;
    trade1.OpenRate = trade.OpenRate * (1 - newPercentage) + newTrade.OpenRate * newPercentage;
    trade1.RowKey = `MNT${(new Date(9999, 12, 31, 23, 59, 59, 9999999).getTime() * 10000 + 621355968000000000) - (new Date().getTime() * 10000 + 621355968000000000)}`;

    // close old trade
    let tradeTable = await ConnectionManager.GetTable(Constants.OrderTableName, Constants.IsDryRunning);
    trade.IsOpen = false;
    trade.CloseDate = undefined;
    trade.CloseProfitPercentage = undefined;
    trade.CloseProfit = undefined;
    trade.CloseRate = undefined;
    trade.SellOrderId = undefined;
    tradeTable.insertOrReplaceEntity(Trade.convertToAzureTableEntity(trade));
    return trade1;
  }

  ///  <summary>
  ///  Directly triggers a sell.
  ///  </summary>
  ///  <param name="trade"></param>
  ///  <returns></returns>
  public async DirectSell(trade: Trade): Promise<Trade> {
    Logger.info(`Action DirectSell for ${trade.RowKey}`);
    let currentRate = await this._exchange.GetTicker(trade.Market);
    if (!currentRate) return trade;
    return await this.ExecuteSell(trade);
  }

  ///  <summary>
  ///  Executes a sell for the given trade and current rate.
  ///  </summary>
  private async ExecuteSell(trade: Trade): Promise<Trade>  {
    Logger.info(`Execute Sell ${trade.Market} with quantity ${trade.Quantity}`);
    //  Get available balance
    let [coin, reversed] = this._exchange.convertMarketToCoin(trade.Market);
    let balances = await this._exchange.GetBalance(coin);

    // get price
    let tick = await this._exchange.GetTicker(trade.Market);
    if (!tick) return trade;
    let currentRateBid = this._exchange.roundAmount(this.GetTargetAsk(tick));
    Logger.info(`Execute sell order for trade ${trade.Market} at bid price ${currentRateBid}`);

    // round values
    let amount = this._exchange.roundAmount(trade.Quantity > balances[0] ? balances[0] : trade.Quantity, trade.AmountPrecision);
    currentRateBid = this._exchange.roundAmount(currentRateBid, trade.PricePrecision);

    // Calculate our profit.
    let investment = trade.StakeAmount;
    let sales = amount * currentRateBid * (1 - Constants.TransactionFeePercentage);
    let profit = parseFloat((100 * ((sales - investment) / investment)).toFixed(2));

    // send notification
    this.SendNotification(`Selling ${trade.Market} at ${currentRateBid} BTC (${trade.Quantity} units) with weight ${trade.InvestmentWeight.toFixed(2)} with a profit of ${profit}%`);

    //  Sell the thing.
    let orderId = 9999;
    if (!Constants.IsDryRunning) orderId = await this._exchange.Sell(trade.Market, amount, currentRateBid);
    trade.CloseRate = currentRateBid;
    trade.CloseProfitPercentage = profit;
    trade.CloseProfit = this._exchange.roundAmount(sales - investment);
    trade.CloseDate = new Date();
    trade.OpenOrderId = orderId;
    trade.SellOrderId = orderId;
    return trade;
  }

  ///  <summary>
  ///  Executes a sell for the given trade and current rate.
  ///  </summary>
  private async ExecuteBuy(pair: MarketSummary, btcWeight: number = 1): Promise<Trade | undefined>  {
    Logger.info(`Execute Buy ${pair.Name} with btcWeight ${btcWeight}`);
    //  Get our Bitcoin balance from the exchange
    let currentBtcBalance = await this._exchange.GetBalance("BTC");
    let amountOfBtcToInvest = btcWeight * this._totalBalance.TotalBalance;

    //  Do we even have enough funds to invest?
    if (amountOfBtcToInvest <= Constants.MinimumBTCTransactionVolume) {
      Logger.info("Investment minimum of 0.02 BTC not reached.");
      return; // investment minimum
    }
    if (currentBtcBalance.length > 0 && currentBtcBalance[0] < amountOfBtcToInvest) {
      Logger.info("Insufficient BTC funds to perform a trade.");
      return;
    }

    let ticker = await this._exchange.GetTicker(pair.Name);
    if (!ticker) return;

    let openRate = this._exchange.roundAmount(this.GetTargetBid(ticker), pair.PricePrecision);
    let amount = this._exchange.roundAmount((amountOfBtcToInvest / openRate), pair.AmountPrecision);
    if (amount == 0) return;  // no amount to buy
    if (this._exchange.roundAmount(amount * openRate) <= Constants.MinimumBTCTransactionVolume) return; // min value not reached

    let orderId = 9999;
    if (!Constants.IsDryRunning) orderId = await this._exchange.Buy(pair.Name, amount, openRate);


    this.SendNotification(`Buying ${pair.Name} at ${openRate} BTC (${amount} units) with weight ${btcWeight.toFixed(2)}`);
    return new Trade({
      PartitionKey : "TRADE",
      RowKey : `MNT${(new Date(9999, 12, 31, 23, 59, 59, 9999999).getTime() * 10000 + 621355968000000000) - (new Date().getTime() * 10000 + 621355968000000000)}`,
      Market : pair.Name,
      StakeAmount : amount * openRate,
      OpenRate : openRate,
      OpenDate : new Date(),
      Quantity : amount,
      OpenOrderId : orderId,
      BuyOrderId : orderId,
      InvestmentWeight: btcWeight,
      IsOpen : true,
      StrategyUsed : this._strategy.toUpperCase(),
      SellType : SellType.None,
      PricePrecision: pair.PricePrecision,
      AmountPrecision: pair.AmountPrecision
    });
  }

  ///  <summary>
  ///  Checks if the trade is closable, and if so it is being closed.
  ///  </summary>
  ///  <param name="trade"></param>
  ///  <returns></returns>
  private CloseTradeIfFulfilled(trade: Trade): Trade {
    //  If we don't have an open order and the close rate is already set,
    //  we can close this trade.
    if (trade.CloseProfit !== undefined && trade.CloseProfitPercentage !== undefined && trade.CloseDate !== undefined && trade.CloseRate !== undefined && trade.OpenOrderId == undefined) {
      //  Set our balances straight.
      this._dayBalance.Profit = this._exchange.roundAmount((this._dayBalance.Profit || 0) + trade.CloseProfit);
      this._totalBalance.Profit = this._exchange.roundAmount((this._totalBalance.Profit || 0) + trade.CloseProfit);
      this._totalBalance.TotalBalance = this._exchange.roundAmount(this._totalBalance.TotalBalance + trade.CloseProfit);
      this._dayBalance.LastUpdated = new Date();
      this._totalBalance.LastUpdated = new Date();

      // recalculate balance profit
      this._dayBalance.ProfitPercentage = parseFloat(((this._dayBalance.Profit / this._dayBalance.StartBalance) * 100).toFixed(2));
      this._totalBalance.ProfitPercentage = parseFloat(((this._totalBalance.Profit / this._totalBalance.StartBalance) * 100).toFixed(2));

      trade.IsOpen = false;
      Logger.info(`Sold ${trade.Market} at ${trade.CloseRate} BTC (${trade.Quantity} units) with a profit of ${trade.CloseProfitPercentage}% with weight ${trade.InvestmentWeight.toFixed(2)}`);
      return trade;
    }

    return trade;
  }

  private SendNotification(message: string): void {
    if (this._notification != undefined) {
      try {
        this._notification.SendNotification(message);
      } catch (err) {}
    }
  }
}
