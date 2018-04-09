export class ReturnOnInvestmentTuple {
  constructor(public Duration: number, public Profit: number) {}
}

export default class Constants {

  public static IsDryRunning: boolean = false;

  //  Binance settings
  public static BinanceApiKey: string = process.env.BIN_KEY || "";

  public static BinanceApiSecret: string = process.env.BIN_SECRET || "";

  //  Azure settings
  public static ConnectionString: string = process.env.AzureWebJobsStorage || "";

  public static MarketTableName: string = "markets";

  public static OrderTableName: string = "orders";

  public static PortfolioTableName: string = "portfolio";

  public static BalanceTableName: string = "balance";

  // Telegram

  public static BotToken: string = "";

  public static ChatId: string = "";

  //  Trade settings

  public static StartCapital: number = 0.02;

  public static MaxNumberOfConcurrentTrades: number = 3;

  public static MinAmountOfBtcToInvestPerTrader: number = 0.00500000;

  public static MaxAmountOfBtcToInvestPerTrader: number = 0.02500000;

  // public static TransactionFeePercentage: number = 0.001;
  // pay now with BNB
  public static TransactionFeePercentage: number = 0.001;

  public static MinimumBTCTransactionVolume: number = 0.002;

  //  If we go below this profit percentage, we sell immediately.
  public static StopLossPercentage: number = -0.06;

  //  Setting this to 0 means we will not look at volume and only look at our AlwaysTradeList.
  //  Setting this to any value higher than 0 means we will get a list of markets currently
  //  trading a volume above this value and analyze those for buy signals.
  public static MinimumAmountOfVolume: number = 400;

  //  Sets the bidding price. A value of 0.0 will use the ask price, 1.0 will use the last price and values between
  //  those interpolate between ask and last price. Using the ask price will guarantee quick success in bid, but
  //  the bot will also end up paying more then would probably have been necessary.
  public static AskLastBalance: number = 0.1;

  //  A list of duration and profit pairs. The duration is a value in minutes and the profit is a
  //  double containing a percentage. This list is used to define constraints such as
  //  "Sell when 5 minutes have passed and profit is at 3%".
  public static ReturnOnInvestment: ReturnOnInvestmentTuple[] = [
    // new ReturnOnInvestmentTuple(60, 0.9),
    // new ReturnOnInvestmentTuple(120, 0.08),
    // new ReturnOnInvestmentTuple(240, 0.07),
    // new ReturnOnInvestmentTuple(360, 0.06)

  ];

  //  These are anchors for which we lock in profits to close a trade.
  public static StopLossAnchors: number[] = [
    0.01, 0.02, 0.03, 0.05, 0.08, 0.13, 0.21
  ];

  public static StopLossAnchorOffset = 0.01;

  //  These are the markets we don't want to trade on
  public static MarketBlackList: string[] = [];

  //  These are the markets we want to trade on regardless of volume
  public static AlwaysTradeList: string[] = [
    "BTC_ARK", "BTC_OMG", "BTC_NEO", "BTC_XRP", "BTC_LSK", "BTC_ETH"
  ];
}