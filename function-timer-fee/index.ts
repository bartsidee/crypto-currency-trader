import "source-map-support/register";
import * as _ from "lodash";
import { BinanceExchange } from "../core/exchange/binance";
import { HttpContext, IFunctionRequest } from "../core/azure-functions";
import { Logger } from  "../core/logger";
import { ConnectionManager } from "../core/store/connectionmanager";
import { Balance } from "../core/store/entities/balance";
import Constants from "../core/constants";

// This function triggers every day to re-fill trading fee balance
export default async function (context: HttpContext, req: IFunctionRequest) {
  Logger.setLogger(context.log);
  try {
    // get balance data
    let balanceTable = await ConnectionManager.GetTable(Constants.BalanceTableName, Constants.IsDryRunning);
    let totalbalanceEntity = _.first(await balanceTable.CreateQuery("RowKey == ?", "TOTAL"));
    let balance = new Balance(Balance.convertFromAzureTableEntity(totalbalanceEntity));

    // init exchange
    let exchange = new BinanceExchange(false);

    // Binance uses BNB for trading fees
    let marketName = "BTC_BNB";
    let pricePrecision = 0.0000001;
    let amountPrecision = 0.01;

    // get current balance
    let [coin, reversed] = exchange.convertMarketToCoin(marketName);
    let currentBnbBalance = await exchange.GetBalance(coin);
    Logger.info(`Current BNB balance (${currentBnbBalance} units)`);

    let tick = await exchange.GetTicker(marketName);
    if (!tick) return;
    let thresholdAmount = exchange.roundAmount(balance.TotalBalance * 0.05 / tick.Ask, amountPrecision);
    Logger.info(`Minimum required BNB (${thresholdAmount} units) with current balance ${currentBnbBalance[0]}`);

    // if BNB balance drops below threshold refill the balance
    if (currentBnbBalance[0] < thresholdAmount) {
      //  If the ask is below the last, we can get it on the cheap.
      let rate = (tick.Ask < tick.Last) ? tick.Ask : (tick.Ask + (Constants.AskLastBalance * (tick.Last - tick.Ask)));
      let openRate = exchange.roundAmount(rate, pricePrecision);
      let minimumAmount = Constants.MinimumBTCTransactionVolume * 1.005 / rate;
      let amount = exchange.roundAmount(minimumAmount > thresholdAmount ? minimumAmount : thresholdAmount, amountPrecision);
      Logger.info(`Buying ${marketName} at ${openRate} BTC (${amount} units)`);
      await exchange.Buy(marketName, amount, openRate);
    }

  }
  catch (ex) {
    Logger.error(ex);
  }
}