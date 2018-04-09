# CurrencyTrader
This is an Azure Functions-based cryptocurrency trading bot build in NodeJS based on a portfolio distibution. It uses the following cloud components to function:

- Azure Functions
- Azure Table Storage

A lot of the logic is based on the [Myth](https://github.com/sthewissen/Mynt) bot and was converted to Typescript. The bot currently supports trading on the Binance exchange. This software was primarily created for educational purposes only. Don't risk money which you are afraid to lose. 

The trading strategy is based on portfolio distribution, meaning that 100% of BTC assets will be used during trade and distributed over (multiple) currency markets providing the best opportunities. (this includes USDT)

The bot runs the below scripts at a pre-defined interval
- every 1d;  rebuild market table, this is a table holding the trading volumes of currency markets (the app trades with highest volume markets only)
- every 12h; verify if transaction fees should be refilled (BNB balance for Binance)
- every 30m; rebuild a trading portfolio, based on the updated 30m candle data a currency a new portfolio is build. A market is included in the portfolio if the strategy indicators from the chosen strategy is positive.
- every 1m; action trades with Binance, the script will very the portfolio in the azure table and compare it with the actual trading balance.

### Configuration

The main portfolio strategy can be configured in the file:
./function-timer-portfolio/index.ts (line 50)

There are a few settings you can configure to alter the behavior of the bot. These settings are stored in the `./core/constants.ts` file.

| Setting | Description |
| ------- | ------ |
| `IsDryRunning` | This variable defines whether or not the bot is performing actual live trades. When dry-running the entire process is handled as it would be in a live scenario, but there is no actual communication with an exchange happening. |
| `BinancepiKey` | The API key to use to communicate with Binance. |
| `BinanceApiSecret` | The secret key to use to communicate with Binance. |
| `MaxNumberOfConcurrentTrades` | The maximum number of concurrent trades the trader will perform. |
| `StartCapital` | The initial capital of BTC used as investment. |
| `MinAmountOfBtcToInvestPerTrader` | The max amount of BTC each trader has at its disposal to invest. |
| `MaxAmountOfBtcToInvestPerTrader` | The min amount of BTC each trader has at its disposal to invest. |
| `TransactionFeePercentage` | The transaction fee percentage for the exchange we're using, for Binance this is 0,1%. |
| `StopLossPercentage` | The amount of profit at which we mitigate our losses and stop a trade (e.g. `-0.03` for a loss of 3%). |
| `MinimumAmountOfVolume` | Setting this to `0` means we will not look at volume and only look at our `AlwaysTradeList`. Setting this to any value higher than `0` means we will get a list of markets currently trading a volume above this value and analyze those for buy signals. |
| `AskLastBalance` | Sets the bidding price. A value of 0.0 will use the ask price, 1.0 will use the last price and values between those interpolate between ask and last price. Using the ask price will guarantee quick success in bid, but the bot will also end up paying more then would probably have been necessary. |
| `ReturnOnInvestment` | A list of duration and profit pairs. The duration is a value in minutes and the profit is a double containing a percentage. This list is used to define constraints such as "Sell when 5 minutes have passed and profit is at 3%". |
| `MarketBlackList` | A list of market names to never trade on (e.g. "XVGBTC"). |
| `AlwaysTradeList` | A list of market names to always trade on (e.g. "OMGBTC"). |
| `StopLossAnchors` | A list of percentages at which we want to lock in profit. Basically these function as a trailing stop loss. When profit reaches one of these percentages the stop loss is adjusted to this value. That way when profit drops below that we immediately sell. |
| `AzureStorageConnection` | The connection to the Azure Table Storage used to store our data. |
| `OrderTableName` | The table name for the Order table. |
| `BalanceTableName` | The table name for the Balance table. |

### Strategies

At the heart of this bot sit the strategies. These are all implementations of the `ITradingStrategy` interface and contain a `Prepare()` method that expects a `List<Candle>` objects. This method returns a list of integer values containing any of these three values:

- `-1` - This is a sell signal.
- `1` - This is a buy signal
- `0` - This is the signal to do absolutely nothing.

Within this preparation method you are free to use any type of indicator you want to determine what action to take at a specific moment in time. 

### Indicators

All indicators use a C wrapper of the TA-Lib library. They are implemented as extension methods on `List<Candle>`. These candles can be used for every type of technical analysis because they also contain high, low, close, open and volume indicators for that moment in time. Not all indicators that are present in TA-Lib are implemented however. You can always submit a PR for a new indicator if you need it.

| Indicator | Default values | Extension method |
| ------ | ------ | ------ |
| Average Directional Movement Index | Period: 14 | Adx()
| Awesome Oscillator | Return RAW data: false | AwesomeOscillator()
| Bollinger Bands | Period: 5, Deviation up: 2, Deviation down: 2 | Bbands()
| Bear/Bull | N/A | BearBull()
| Commodity Channel Index | Period: 14 | Cci()
| Chande Momentum Oscillator | Period: 14 | Cmo()
| Derivative Oscillator | | DerivativeOscillator()
| Exponential Moving Average | Period: 30, Candle variable: Close | Ema()
| Fisher Ehlers | Period: 10 | Fisher()
| Moving Average Convergence/Divergence | Fast period: 12, Slow period: 26, Signal period: 9 | Macd()
| MESA Adaptive Moving Average | Fast period: 12, Slow period: 26, Signal period: 9 | Mama()
| Momentum Flow Index | Period: 14 | Mfi()
| Minus Directional Indicator | Period: 14 | MinusDI()
| Momentum | Period: 10 | Mom()
| Plus Directional Indicator | Period: 14 | PlusDI()
| Relative Strength Index | Period: 14 | Rsi()
| SAR | Acceleration factor: 0.02, Max. acceleration factor: 0.2 | Sar()
| Simple Moving Average | Period: 30, Candle variable: Close | Sma()
| Stochastics | Fast K period: 5, Slow K period: 3, Slow MA type: SMA, Slow D period: 3, Slow D MA type: SMA | Stoch()
| Stochastics Fast | Fast K period: 5, Fast D period: 3, Fast D MA type: SMA | StochFast()
| Stochastic RSI | Period: 14, Candle variable: Close, Fast K period: 3, Fast D period: 3, Fast D MA type: SMA | StochRsi()
| Triple Exponential Moving Average | Period: 20, Candle variable: Close | Tema()
| Weighted Moving Average | Period: 30, Candle variable: Close | Wma()

### Notifications
You can send/receive notifications using an implementation of the `INotificationManager` interface. Currently the default implementation uses Azure Notification Hubs to send these notifications to all devices registered within the configured Notification Hub. To implement your own custom notifications such as e.g. receiving an e-mail you can implement the `INotificationManager` interface and pass it into the `TradeManager` instance within the `TradeTimer` Azure Function.

Supported notification managers are:

- Push notification in the accompanying mobile app
- Slack channel using WebHooks
- Telegram chat using WebHooks

### Backtesting
The project also contains a console application that can be used to backtest your strategies.

```console
ts-node ./backtester/program.ts --help
```

The console application contains a few of the same variables (such as stoploss percentage, RoI) as the Azure Function that handles trading so you can also tweak these to change the results of your backtest.

### Upload to Azure
When linked to an azure app service the provided build script should auto compile the project during deployment, unfortunatly I had the experience that it fails on the native talib bindings. 

As a result you can manually compile the code on a local windows machine and upload the project using the below command:
```console
npm run build
npm run zip
az functionapp deployment source config-zip  -g <myResourceGroup> -n <app_name> --src ./bin/currencytrader.zip
```
