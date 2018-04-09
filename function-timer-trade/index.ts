import "source-map-support/register";
import { Logger } from "../core/logger";
import { TradeManager } from "../core/managers/trademanager";
import { BinanceExchange } from "../core/exchange/binance";
import { Keltner } from "../core/strategies/keltner";
import { TelegramNotificationManager } from "../core/managers/notification/telegramnotificationmanager";
import { HttpContext, IFunctionRequest } from "../core/azure-functions";
import Constants from "../core/constants";

// This function triggers every 5 minutes on the 2nd second so e.g. 14:05:02, 14:10:02 etc.
export default async function (context: HttpContext, req: IFunctionRequest) {
  Logger.setLogger(context.log);
  try {
    context.log("Starting processing...");

    let strategy = "BbandRsi";
    // Call the Trade manager with the strategy of our choosing.
    let manager = new TradeManager(strategy, new BinanceExchange(Constants.IsDryRunning), new TelegramNotificationManager());
    // Call the process method to start processing the current situation.
    await manager.Process();
  }
  catch (ex) {
    Logger.error(ex);
  }
}