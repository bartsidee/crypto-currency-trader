import * as colors from "colors";
import * as fs from "fs";
import * as path from "path";
import * as _ from "lodash";
import * as parse from "date-fns/parse";
import * as subHours from "date-fns/sub_hours";
import * as differenceInDays from "date-fns/difference_in_days";
import * as differenceInMinutes from "date-fns/difference_in_minutes";
import * as cliTable from "cli-table2";
import * as program from "commander";
import * as inquirer from "inquirer";
import { Logger } from "../core/logger";

import BinanceRest, { BinanceKlinesIntervalEnum } from "../core/api/binance.api";
import { BinanceExchange } from "../core/exchange/binance";
import { BackTestResult } from "./models/backtestresult";
import { StrategyResult } from "./models/strategyresult";
import { ITrait } from "./traits/itrait";
import { ITradingStrategy } from "../core/interfaces/itradingstrategy";
import Constants, { ReturnOnInvestmentTuple } from "../core/constants";
import { Candle } from "../core/models/candle";
import { SellType } from "../core/models/selltype";
import { Period, PeriodToMinutes } from "../core/models/period";
import { Trade } from "../core/store/entities/trade";

import { AdxT } from "./traits/adx";
import { AoT } from "./traits/ao";
import { CciT } from "./traits/cci";
import { CmoT } from "./traits/cmo";
import { EmaCrossT } from "./traits/emacross";
import { MfiT } from "./traits/mfi";
import { RsiT } from "./traits/rsi";
import { SmaCrossT } from "./traits/smacross";
import { PpoT } from "./traits/ppo";

import { AdxMomentum } from "../core/strategies/adxmomentum";
import { AdxSmas } from "../core/strategies/adxsmas";
import { AwesomeMacd } from "../core/strategies/awesomemacd";
import { AwesomeSma } from "../core/strategies/awesomesma";
import { Base150 } from "../core/strategies/base150";
import { BbandRsi } from "../core/strategies/bbandrsi";
import { BigThree } from "../core/strategies/bigthree";
import { BreakoutMa } from "../core/strategies/breakoutma";
import { CciEma } from "../core/strategies/cciema";
import { CciRsi } from "../core/strategies/ccirsi";
import { CciScalper } from "../core/strategies/cciscalper";
import { DeriveOscillator } from "../core/strategies/derivativeoscillator";
import { DoubleVolatility } from "../core/strategies/doublevolatility";
import { EmaAdx } from "../core/strategies/emaadx";
import { EmaAdxF } from "../core/strategies/emaadxf";
import { EmaAdxMacd } from "../core/strategies/emaadxmacd";
import { EmaAdxSmall } from "../core/strategies/emaadxsmall";
import { EmaCross } from "../core/strategies/emacross";
import { EmaStochRsi } from "../core/strategies/emastochrsi";
import { FaMaMaMa } from "../core/strategies/famamama";
import { FifthElement } from "../core/strategies/fifthelement";
import { Fractals } from "../core/strategies/fractals";
import { FreqTrade } from "../core/strategies/freqtrade";
import { MacdSma } from "../core/strategies/macdsma";
import { MacdTema } from "../core/strategies/macdtema";
import { Momentum } from "../core/strategies/momentum";
import { PowerRanger } from "../core/strategies/powerranger";
import { RsiBbands } from "../core/strategies/rsibband";
import { RsiMacd } from "../core/strategies/rsimacd";
import { RsiMacdAwesome } from "../core/strategies/rsimacdawesome";
import { RsiMacdMfi } from "../core/strategies/rsimacdmfi";
import { RsiSarAwesome } from "../core/strategies/rsisarawesome";
import { SarAwesome } from "../core/strategies/sarawesome";
import { SarRsi } from "../core/strategies/sarrsi";
import { SarStoch } from "../core/strategies/sarstoch";
import { SimpleBearBull } from "../core/strategies/simplebearbull";
import { SmaCrossover } from "../core/strategies/smacrossover";
import { SmaSar } from "../core/strategies/smasar";
import { SmaStochRsi } from "../core/strategies/smastochrsi";
import { StochAdx } from "../core/strategies/stochadx";
import { ThreeMAgos } from "../core/strategies/threemagos";
import { TripleMa } from "../core/strategies/triplema";
import { Wvf } from "../core/strategies/wvf";
import { WvfExtended } from "../core/strategies/wvfextended";
import { PpoEma } from "../core/strategies/ppo";
import { MacdRoc } from "../core/strategies/macdroc";
import { Keltner } from "../core/strategies/keltner";

import { hidden } from "colors";
import { subMinutes } from "date-fns";

import { GenerateChart } from "./chart";

Logger.setLogger(console.log);

interface StrategyConfig {
  [coinpair: string]: {
    strategy: ITradingStrategy;
    trend: number[];
  };
}

interface TradeRefs {
  [coinpair: string]: {
    index: number;
    trade: Trade;
  };
}

let exchange = new BinanceExchange();

export class Program {
  // region trading variables

  public /* const */ static StopLossPercentage: number = -0.5;

  public static ReturnOnInvestment: ReturnOnInvestmentTuple[] = [
    // new ReturnOnInvestmentTuple(60, 0.9),
    // new ReturnOnInvestmentTuple(120, 0.08),
    // new ReturnOnInvestmentTuple(240, 0.07),
    // new ReturnOnInvestmentTuple(360, 0.06)
  ];

  // These are the coins we're interested in.
  // This is what we have some backtest data for.
  // You can always add more backtest data by saving data from the Binance API.
  public static CoinsToBuy: string[] = [
    "TRXBTC", "XVGBTC", "NEBLBTC", "XRPBTC", "ICXBTC", "ELFBTC", "APPCBTC", "ADABTC", "NEOBTC", "ARNBTC", "TNBBTC", "TNBBTC", "ZRXBTC", "XLMBTC", "QTUMBTC", "IOTABTC"
  ];

  // Use these to anchor in your profits. As soon as one of these profit percentages
  // has been reached we adjust our stop loss to become that percentage.
  // That way we theoretically lock in some profits and continue to ride an uptrend
  public static StopLossAnchors: number[] = [
    0.01, 0.02, 0.03, 0.05, 0.08, 0.13, 0.21
  ];

  // percentage offset from StopLossAnchors on which to sell
  public static StopLossAnchorOffset = 0.01;

  public static CandleStickInterval = Period.HalfAnHour;

  public static Traits: ITrait[] = [
    new CciT(),
    new CmoT(),
    new EmaCrossT(),
    new MfiT(),
    new RsiT(),
    new SmaCrossT(),
    new PpoT()
  ];

  public static StartCapital: number = 1;

  public static MaxNumberOfConcurrentTrades: number = 5;

  public static MinAmountOfBtcToInvestPerTrader: number = 0.0025000;

  public static MaxAmountOfBtcToInvestPerTrader: number = 0.02500000;

  public static AmountPrecision = 1;
  public static PricePrecision = 0.00000001;

  public static Strategies: ITradingStrategy[] = [
    // The strategies we want to backtest.
    new AdxMomentum(),
    new AdxSmas(),
    new AwesomeMacd(),
    new AwesomeSma(),
    new Base150(),
    new BbandRsi(),
    new BigThree(),
    new BreakoutMa(),
    new CciEma(),
    new CciRsi(),
    new CciScalper(),
    new DeriveOscillator(),
    new DoubleVolatility(),
    new EmaAdx(),
    new EmaAdxF(),
    new EmaAdxMacd(),
    new EmaAdxSmall(),
    new EmaCross(),
    new EmaStochRsi(),
    new FaMaMaMa(),
    new FifthElement(),
    new Fractals(),
    new FreqTrade(),
    new MacdSma(),
    new MacdTema(),
    new Momentum(),
    new PowerRanger(),
    new RsiBbands(),
    new RsiMacd(),
    new RsiMacdAwesome(),
    new RsiMacdMfi(),
    new RsiSarAwesome(),
    new SarAwesome(),
    new SarRsi(),
    new SarStoch(),
    new SimpleBearBull(),
    new SmaCrossover(),
    new SmaSar(),
    new SmaStochRsi(),
    new StochAdx(),
    new ThreeMAgos(),
    new TripleMa(),
    new Wvf(),
    new WvfExtended(),
    new PpoEma(),
    new MacdRoc(),
    new Keltner()
  ];

  // endregion

  private static SingleTest(strategy: ITradingStrategy): [StrategyResult[], StrategyResult] {
    let stratResult: StrategyResult;
    let coinResults: StrategyResult[] = [];
    let configuration: StrategyConfig = {};
    let timespan = 0;
    let balance = Program.StartCapital;

    for (let pair of this.CoinsToBuy) {
      let dataJson = require(__dirname + `/data/${pair}.json`);
      let strat = strategy.clone();
      // This creates a list of buy signals.
      strat.Candles = _.map(dataJson, (item) => {
        let c: Candle = {
          Timestamp: new Date(item[6]),
          High: exchange.roundAmount(parseFloat(item[2])),
          Low: exchange.roundAmount(parseFloat(item[3])),
          Open: exchange.roundAmount(parseFloat(item[1])),
          Close: exchange.roundAmount(parseFloat(item[4])),
          Volume: exchange.roundAmount(parseFloat(item[5]))
        };
        return c;
      });
      timespan = strat.Candles.length;
      configuration[pair] = {
        strategy: strat,
        trend: strat.Prepare()
      };
    }

    let tradesCompleted: Trade[] = [];
    let tradesOpen: Trade[] = [];
    for (let i: number = 0; i < timespan; i++) {
      if (balance < 0) {
        console.log(strategy.Name, "!!!BANKRUPT!!!!");
        // console.log("balance", balance.toFixed(8));
        // console.log("%", (i / timespan * 100).toFixed(2));
        break;
      }

      let weight = 1 / _.reduce(configuration, (sum: number, b, index) => {
        return sum + (b.trend[i] === 1 ? 1 : 0);
      }, 0);
      for (let pair in configuration) {
        let trade = tradesOpen.find((x) => { return x.Market == pair; });
        if (trade && configuration[pair].trend[i] !== 1 || trade && trade.InvestmentWeight !== weight) {
          // calculat profit
          let currentRateBid = configuration[pair].strategy.Candles[i].Close;
          let sales = trade.Quantity * currentRateBid * ( 1 - Constants.TransactionFeePercentage);
          let currentProfit = parseFloat((100 * ((sales - trade.StakeAmount) / trade.StakeAmount)).toFixed(2));

          // close trade
          trade.CloseProfitPercentage = currentProfit;
          trade.CloseProfit = exchange.roundAmount(sales - trade.StakeAmount);
          trade.CloseRate = currentRateBid;
          trade.CloseDate = new Date(configuration[pair].strategy.Candles[i].Timestamp);
          balance += trade.StakeAmount + trade.CloseProfit;
          // console.log(i, "SELL", currentProfit.toFixed(2), balance);
          // move trade from open to closed array
          tradesOpen.splice(tradesOpen.indexOf(trade), 1);
          tradesCompleted.push(trade);

        }

        if (configuration[pair].trend[i] === 1 && balance > 0) {
          let quantity = exchange.roundAmount(((balance * weight) / configuration[pair].strategy.Candles[i].Close), Program.AmountPrecision);
          if (quantity === 0) continue;
          let trade = new Trade({
            Market: pair,
            OpenRate: configuration[pair].strategy.Candles[i].Close,
            OpenDate: new Date(configuration[pair].strategy.Candles[i].Timestamp),
            Quantity: quantity,
            StakeAmount: (balance * weight),
            InvestmentWeight: weight,
            AmountPrecision: Program.AmountPrecision,
            PricePrecision: Program.PricePrecision
          });
          // console.log(i, "BUY", (balance * weight), weight, balance);
          balance -= (balance * weight);
          tradesOpen.push(trade);
        }
      }
    }

    for (let pair in configuration) {
      let result = _.filter(tradesCompleted, (x) => { return x.Market == pair; });

      // calculate buy and hold
      let currentRateBid = _.last(configuration[pair].strategy.Candles).Close;
      let stakeAmount = Program.StartCapital / pair.length;
      let quantity = exchange.roundAmount(stakeAmount / _.first(configuration[pair].strategy.Candles).Close, 0.1);
      let sales = quantity * currentRateBid *  (1 - Constants.TransactionFeePercentage);
      if (result.length == 0) {
        coinResults.push(new StrategyResult({
          Name: `${pair}`,
          TotalTrades: 0,
          ProfitTrades: 0,
          NonProfitTrades: 0,
          AvgProfit: 0,
          TotalProfit: 0,
          BuyAndHold: exchange.roundAmount(sales - stakeAmount),
          AvgTime: 0
        }));
      }
      else {
        coinResults.push(new StrategyResult({
          Name: `${pair}`,
          TotalTrades: result.length,
          ProfitTrades: _.filter(result, (x) => { return x.CloseProfit > 0; }).length,
          NonProfitTrades: _.filter(result, (x) => { return x.CloseProfit <= 0; }).length,
          AvgProfit: (_.sum(_.map(result, (x) => x.CloseProfitPercentage)) / result.length),
          TotalProfit: _.sum(_.map(result, (x) => x.CloseProfit)),
          BuyAndHold: exchange.roundAmount(sales - stakeAmount),
          AvgTime: (_.sum(_.map(result, (x) => Math.floor(((<any>x.CloseDate - <any>x.OpenDate) % 86400000) / 3600000) )) / result.length),
        }));
      }
      GenerateChart(pair, configuration[pair].strategy, tradesCompleted);
    }

    if (tradesCompleted.length == 0) {
      stratResult = new StrategyResult({
        Name: `${strategy.Name}`,
        TotalTrades: 0,
        ProfitTrades: 0,
        NonProfitTrades: 0,
        AvgProfit: 0,
        TotalProfit: 0,
        AvgTime: 0,
      });
    }
    else {
      stratResult = new StrategyResult({
        Name: `${strategy.Name}`,
        TotalTrades: tradesCompleted.length,
        ProfitTrades: _.filter(tradesCompleted, (x) => { return x.CloseProfit > 0; }).length,
        NonProfitTrades: _.filter(tradesCompleted, (x) => { return x.CloseProfit <= 0; }).length,
        AvgProfit: (_.sum(_.map(tradesCompleted, (x) => x.CloseProfitPercentage)) / tradesCompleted.length),
        BuyAndHold: _.sum(coinResults.map((x) => x.BuyAndHold)),
        TotalProfit: _.sum(_.map(tradesCompleted, (x) => x.CloseProfit)),
        AvgTime: (_.sum(_.map(tradesCompleted, (x) => Math.floor(((<any>x.CloseDate - <any>x.OpenDate) % 86400000) / 3600000))) / tradesCompleted.length)
      });
    }
    return [coinResults, stratResult];
  }

  public static BackTest(strategy: ITradingStrategy) {
    console.log();
    console.log(`    =============== BACKTESTING REPORT ${strategy.Name} ===============`);
    console.log();
    let [coinResults, stratResult] = Program.SingleTest(strategy);
    Program.PrintStrategyResultResults(coinResults);
    Program.PrintStrategyResultResults([stratResult]);
  }

  public static BackTestAll() {
    console.log();
    console.log("    =============== BACKTESTING REPORT ===============");
    console.log();

    let stratResults: StrategyResult[] = [];
    let balance = Program.StartCapital;
    for (let strategy of _.sortBy(this.Strategies, (x) => { return x.Name; })) {
      try {
        let [coinResults, stratResult] = Program.SingleTest(strategy);
        stratResults.push(stratResult);
      }
      catch (ex /*:Exception*/) {
        console.log(`      ${strategy.Name}: ` + "DNF");
      }
    }
    Program.PrintStrategyResultResults(stratResults);
  }

  public static BackTestCombinations() {
    console.log();
    console.log("    =============== BACKTESTING REPORT ===============");
    console.log();
    let stratResults: StrategyResult[] = [];
    this.Strategies;
    for (let strategy1 of _.sortBy(this.Strategies, (x) => x.Name)) {
      for (let strategy2 of _.sortBy(_.filter(this.Strategies, (x) => { return x.Name !== strategy1.Name; }), (x) => x.Name)) {
        try {
          let results: BackTestResult[] = [];
          for (let pair of this.CoinsToBuy) {
            let dataJson = require(__dirname + `/data/${pair}.json`);
            // This creates a list of buy signals.
            strategy1.Candles = _.map(dataJson, (item) => {
              let c: Candle = {
                Timestamp: new Date(item[6]),
                High: exchange.roundAmount(parseFloat(item[2])),
                Low: exchange.roundAmount(parseFloat(item[3])),
                Open: exchange.roundAmount(parseFloat(item[1])),
                Close: exchange.roundAmount(parseFloat(item[4])),
                Volume: exchange.roundAmount(parseFloat(item[5]))
              };
              return c;
            });
            strategy2.Candles = strategy1.Candles.slice();
            let trend1 = strategy1.Prepare();
            let trend2 = strategy2.Prepare();

            let trade: Trade | undefined = undefined;
            let tradeOpen = 0;
            let trades = [];
            for (let i = 0; i < strategy1.Candles.length; i++) {
              if (trade) {
                let shouldSell = SellType.None;
                [shouldSell, trade] = Program.ShouldSell(trade, strategy1.Candles[i].Close, strategy1.Candles[i].Timestamp);
                if (trend1[i] == -1 || trend2[i] == -1 || shouldSell != SellType.None) {
                  let currentRateBid = strategy1.Candles[i].Close;
                  let sales = (trade.Quantity * currentRateBid) - (trade.Quantity * currentRateBid * Constants.TransactionFeePercentage);
                  let currentProfit = parseFloat((100 * ((sales - trade.StakeAmount) / trade.StakeAmount)).toFixed(2));
                  results.push(new BackTestResult({
                    Currency: pair,
                    Profit: exchange.roundAmount(sales - trade.StakeAmount),
                    ProfitPercentage: currentProfit,
                    Duration: i - tradeOpen
                  }));
                  trade.CloseRate = currentRateBid;
                  trade.CloseDate = strategy1.Candles[i].Timestamp;
                  trades.push(trade);
                  trade = undefined;
                }
              } else if (trend1[i] == 1 || trend2[i] == 1) {
                //  This is a buy signal
                trade = new Trade({
                  OpenRate: strategy1.Candles[i].Close,
                  OpenDate: strategy1.Candles[i].Timestamp,
                  Quantity: exchange.roundAmount((Program.StartCapital / strategy1.Candles[i].Close), Program.AmountPrecision),
                  StakeAmount: Program.StartCapital,
                  AmountPrecision: Program.AmountPrecision,
                  PricePrecision: Program.PricePrecision
                });
                tradeOpen = i;
              }
            }

            if (strategy1.Name == "CCI Scalper" && strategy2.Name == "RRSI MACD") GenerateChart(pair, strategy1, trades);
          }

          console.log(`    ${strategy1.Name} + ${strategy2.Name} FINISHED`);
          if ((results.length == 0)) {
            stratResults.push(new StrategyResult({
              Name: `${strategy1.Name} + ${strategy2.Name}`,
              TotalTrades: 0,
              ProfitTrades: 0,
              NonProfitTrades: 0,
              AvgProfit: 0,
              TotalProfit: 0,
              AvgTime: 0,
            }));
          }
          else {
            stratResults.push(new StrategyResult({
              Name: `${strategy1.Name} + ${strategy2.Name}`,
              TotalTrades: results.length,
              ProfitTrades: _.filter(results, (x) => { return x.Profit > 0; }).length,
              NonProfitTrades: _.filter(results, (x) => { return x.Profit <= 0; }).length,
              TotalProfit: _.sum(_.map(results, (x) => x.Profit)),
              AvgProfit: (_.sum(_.map(results, (x) => x.ProfitPercentage)) / results.length),
              AvgTime: (_.sum(_.map(results, (x) => x.Duration)) / results.length) * PeriodToMinutes(Program.CandleStickInterval) / 60,
            }));
          }
        }
        catch (ex /*:Exception*/) {
          console.log(`      ${strategy1.Name} + ${strategy2.Name}: ` + "DNF");
        }
      }
    }
    Program.PrintStrategyResultResults(stratResults);
  }

  public static BackTestEntryExit() {
    console.log();
    console.log("    =============== BACKTESTING REPORT ===============");
    console.log();
    let stratResults: StrategyResult[] = [];
    for (let entryStrat of _.orderBy(this.Strategies, (x) => x.Name)) {
      for (let exitStrat of _.orderBy(this.Strategies, (x) => x.Name)) {
        try {
          let results: BackTestResult[] = [];
          for (let pair of this.CoinsToBuy) {
            let dataJson = require(__dirname + `/data/${pair}.json`);
            // This creates a list of buy signals.
            entryStrat.Candles = exitStrat.Candles = _.map(dataJson, (item) => {
              let c: Candle = {
                Timestamp: new Date(item[6]),
                High: exchange.roundAmount(parseFloat(item[2])),
                Low: exchange.roundAmount(parseFloat(item[3])),
                Open: exchange.roundAmount(parseFloat(item[1])),
                Close: exchange.roundAmount(parseFloat(item[4])),
                Volume: exchange.roundAmount(parseFloat(item[5]))
              };
              return c;
            });
            let trend1 = entryStrat.Prepare();
            let trend2 = exitStrat.Prepare();
            let trade: Trade | undefined = undefined;
            let trades = [];
            let tradeOpen = 0;
            for (let i: number = 0; (i < entryStrat.Candles.length); i++) {
              if (trade) {
                let shouldSell = SellType.None;
                [shouldSell, trade] = Program.ShouldSell(trade, entryStrat.Candles[i].Close, entryStrat.Candles[i].Timestamp);
                if (trend2[i] == -1 || shouldSell != SellType.None) {
                  let currentRateBid = entryStrat.Candles[i].Close;
                  let sales = (trade.Quantity * currentRateBid) - (trade.Quantity * currentRateBid * Constants.TransactionFeePercentage);
                  let currentProfit = parseFloat((100 * ((sales - trade.StakeAmount) / trade.StakeAmount)).toFixed(2));
                  results.push(new BackTestResult({
                    Currency: pair,
                    Profit: exchange.roundAmount(sales - trade.StakeAmount),
                    ProfitPercentage: currentProfit,
                    Duration: i - tradeOpen
                  }));
                  trade.CloseRate = currentRateBid;
                  trade.CloseDate = entryStrat.Candles[i].Timestamp;
                  trades.push(trade);
                  trade = undefined;
                }
              }
              else if (trend1[i] == 1) {
                //  This is a buy signal
                trade = new Trade({
                  OpenRate: entryStrat.Candles[i].Close,
                  OpenDate: entryStrat.Candles[i].Timestamp,
                  Quantity: exchange.roundAmount((Program.StartCapital / entryStrat.Candles[i].Close), Program.AmountPrecision),
                  StakeAmount: Program.StartCapital,
                  AmountPrecision: Program.AmountPrecision,
                  PricePrecision: Program.PricePrecision
                });
                tradeOpen = i;
              }
            }
          }

          console.log(`    ${entryStrat.Name} + ${exitStrat.Name} FINISHED`);
          if ((results.length == 0)) {
            stratResults.push(new StrategyResult({
              Name: `${entryStrat.Name} + ${exitStrat.Name}`,
              TotalTrades: 0,
              ProfitTrades: 0,
              NonProfitTrades: 0,
              AvgProfit: 0,
              TotalProfit: 0,
              AvgTime: 0,
            }));
          }
          else {
            stratResults.push(new StrategyResult({
              Name: `${entryStrat.Name} + ${exitStrat.Name}`,
              TotalTrades: results.length,
              ProfitTrades: _.filter(results, (x) => { return x.Profit > 0; }).length,
              NonProfitTrades: _.filter(results, (x) => { return x.Profit <= 0; }).length,
              TotalProfit: _.sum(_.map(results, (x) => x.Profit)),
              AvgProfit: (_.sum(_.map(results, (x) => x.ProfitPercentage)) / results.length),
              AvgTime: (_.sum(_.map(results, (x) => x.Duration)) / results.length) * PeriodToMinutes(Program.CandleStickInterval) / 60,
            }));
          }

        }
        catch (ex /*:Exception*/) {
          console.log(`      ${entryStrat.Name} + ${exitStrat.Name}: ` + "DNF");
        }
      }
    }

    Program.PrintStrategyResultResults(stratResults);
  }

  public static BackTestTraits() {
    console.log();
    console.log("    =============== BACKTESTING REPORT ===============");
    console.log();
    let stratResults: StrategyResult[] = [];
    let stratName: string = "";
    for (let x = 1; x < (1 << 9); x++) {
      let useCci = (x & (1 << 0)) != 0;
      let useCmo = (x & (1 << 1)) != 0;
      let useEmaCross = (x & (1 << 2)) != 0;
      let useMfi = (x & (1 << 3)) != 0;
      let useRsi = (x & (1 << 4)) != 0;
      let useSmaCross = (x & (1 << 5)) != 0;
      let useAdx = (x & (1 << 6)) != 0;
      let useAo = (x & (1 << 7)) != 0;
      let usePpo = (x & (1 << 8)) != 0;

      stratName = "";
      stratName += useCci ? "|CCI" : "";
      stratName += useMfi ? "|MFI" : "";
      stratName += useCmo ? "|CMO" : "";
      stratName += useRsi ? "|RSI" : "";
      stratName += useSmaCross ? "|SMA+" : "";
      stratName += useEmaCross ? "|EMA+" : "";
      stratName += useAdx ? "|ADX" : "";
      stratName += useAo ? "|AO" : "";
      stratName += usePpo ? "|PPO" : "";
      stratName = stratName.slice(1);
      try {
        let results: BackTestResult[] = [];
        for (let pair of this.CoinsToBuy) {
          let dataJson = require(__dirname + `/data/${pair}.json`);
          // This creates a list of buy signals.
          let candles = _.map(dataJson, (item) => {
            let c: Candle = {
              Timestamp: new Date(item[6]),
              High: exchange.roundAmount(parseFloat(item[2])),
              Low: exchange.roundAmount(parseFloat(item[3])),
              Open: exchange.roundAmount(parseFloat(item[1])),
              Close: exchange.roundAmount(parseFloat(item[4])),
              Volume: exchange.roundAmount(parseFloat(item[5]))
            };
            return c;
          });
          let cci = new CciT().Create(candles);
          let mfi = new MfiT().Create(candles);
          let cmo = new CmoT().Create(candles);
          let rsi = new RsiT().Create(candles);
          let emacross = new EmaCrossT().Create(candles);
          let smacross = new SmaCrossT().Create(candles);
          let adx = new AdxT().Create(candles);
          let ao = new AoT().Create(candles);
          let ppo = new PpoT().Create(candles);
          let trade: Trade | undefined = undefined;
          let tradeOpen = 0;
          for (let i: number = 0; (i < candles.length); i++) {
            if (trade) {
              let shouldSell = SellType.None;
              [shouldSell, trade] = Program.ShouldSell(trade, candles[i].Close, candles[i].Timestamp);
              if (((useCci && cci[i] == -1) || !useCci) &&
                  ((useMfi && mfi[i] == -1) || !useMfi) &&
                  ((useCmo && cmo[i] == -1) || !useCmo) &&
                  ((useRsi && rsi[i] == -1) || !useRsi) &&
                  ((useEmaCross && emacross[i] == -1) || !useEmaCross) &&
                  ((useSmaCross && smacross[i] == -1) || !useSmaCross) &&
                  ((useAdx && adx[i] == -1) || !useAdx) &&
                  ((useAo && ao[i] == -1) || !useAo) &&
                  ((usePpo && ppo[i] == -1) || !usePpo)
                  || shouldSell !== SellType.None) {
                let currentRateBid = candles[i].Close;
                let sales = (trade.Quantity * currentRateBid) - (trade.Quantity * currentRateBid * Constants.TransactionFeePercentage);
                let currentProfit = parseFloat((100 * ((sales - trade.StakeAmount) / trade.StakeAmount)).toFixed(2));
                results.push(new BackTestResult({
                  Currency: pair,
                  Profit: exchange.roundAmount(sales - trade.StakeAmount),
                  ProfitPercentage: currentProfit,
                  Duration: i - tradeOpen
                }));
                trade = undefined;
              }
            } else if (((useCci && cci[i] == 1) || !useCci) &&
                ((useMfi && mfi[i] == 1) || !useMfi) &&
                ((useCmo && cmo[i] == 1) || !useCmo) &&
                ((useRsi && rsi[i] == 1) || !useRsi) &&
                ((useEmaCross && emacross[i] == 1) || !useEmaCross) &&
                ((useSmaCross && smacross[i] == 1) || !useSmaCross) &&
                ((useAdx && adx[i] == 1) || !useAdx) &&
                ((useAo && ao[i] == 1) || !useAo) &&
                ((usePpo && ppo[i] == 1) || !usePpo)
              ) {

              //  This is a buy signal
              trade = new Trade({
                OpenRate: candles[i].Close,
                OpenDate: candles[i].Timestamp,
                Quantity: exchange.roundAmount((Program.StartCapital / candles[i].Close), Program.AmountPrecision),
                StakeAmount: Program.StartCapital,
                AmountPrecision: Program.AmountPrecision,
                PricePrecision: Program.PricePrecision
              });
              tradeOpen = i;

            }

          }

        }

        console.log(`    ${stratName} FINISHED`);
        if ((results.length == 0)) {
          stratResults.push(new StrategyResult({
            Name: `${stratName}`,
            TotalTrades: 0,
            ProfitTrades: 0,
            NonProfitTrades: 0,
            AvgProfit: 0,
            TotalProfit: 0,
            AvgTime: 0
          }));
        }
        else {
          stratResults.push(new StrategyResult({
            Name: `${stratName}`,
            TotalTrades: results.length,
            ProfitTrades: _.filter(results, (x) => { return x.Profit > 0; }).length,
            NonProfitTrades: _.filter(results, (x) => { return x.Profit <= 0; }).length,
            TotalProfit: _.sum(_.map(results, (x) => x.Profit)),
            AvgProfit: (_.sum(_.map(results, (x) => x.ProfitPercentage)) / results.length),
            AvgTime: (_.sum(_.map(results, (x) => x.Duration)) / results.length) * PeriodToMinutes(Program.CandleStickInterval) / 60,
          }));
        }
      }
      catch (ex /*:Exception*/) {
        console.log(`      ${stratName}: ` + "DNF");
      }
    }

    Program.PrintStrategyResultResults(stratResults);
  }

  public static ShouldSell(trade: Trade, currentRateBid: number, utcNow: Date): [SellType, Trade] {
    // return [SellType.None, trade];
    let quantity = exchange.roundAmount(trade.Quantity * (1 - Constants.TransactionFeePercentage), trade.AmountPrecision);
    let investment = trade.StakeAmount;
    let sales = (quantity * currentRateBid) - (quantity * currentRateBid * Constants.TransactionFeePercentage);
    let currentProfit = (sales - investment) / investment; // including all trading fees

    //  Let's not do a stoploss for now...
    if (currentProfit < this.StopLossPercentage) {
      // return [SellType.StopLoss, trade];
    }

    if (trade.StopLossAnchor && currentProfit < trade.StopLossAnchor) {
      return [SellType.StopLossAnchor, trade];
    }

    //  Set a stop loss anchor to minimize losses.
    for (let item of this.StopLossAnchors) {
      if (currentProfit > item) {
        trade.StopLossAnchor = Math.round((item - Program.StopLossAnchorOffset) * 1000) / 1000;
      }
    }

    //  Check if time matches and current rate is above threshold
    for (let item of this.ReturnOnInvestment) {
      // historic trade date has candle / hour where we normally trigger it every x min, so make correction
      // let time = Program.PeriodToMinutes(Program.CandleStickInterval);
      let timeDiff = differenceInMinutes(utcNow, trade.OpenDate);
      if (timeDiff > item.Duration && currentProfit > item.Profit) {
        return [SellType.Timed, trade];
      }
    }

    return [SellType.None, trade];
  }

  public static async DownloadData() {
    let now = new Date();
    let api = new BinanceRest({
      key: Constants.BinanceApiKey,
      secret: Constants.BinanceApiSecret
    });
    for (let coin of Program.CoinsToBuy) {
      console.log("DownloadData: ", coin, subMinutes(new Date(), PeriodToMinutes(Program.CandleStickInterval) * 500), Program.CandleStickInterval);
      let results = [];
      let BinancePeriod = (() => {
        switch (Program.CandleStickInterval) {
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
      for (let interval = 2; interval > 0; interval--) {
        let result = await api.klines({
          symbol: coin,
          interval: BinancePeriod,
          startTime: subMinutes(now, PeriodToMinutes(Program.CandleStickInterval) * 500 * interval).getTime(),
          limit: 500
        });
        results = results.concat(result);
      }
      fs.writeFile(path.join(__dirname, "data", `${coin}.json`), JSON.stringify(results) , "utf-8", () => {});
    }
  }

  public static PrintStrategyResultResults(results: StrategyResult[]) {
    let totalProfitResults = _.sortBy(results, (x) => x.TotalProfit).reverse();
    let positiveTradesPercentageResults = _.sortBy(results, (x) => (x.TotalTrades > 0 ? (x.ProfitTrades / x.TotalTrades) * 100.0 : 0).toFixed(2)).reverse();
    // let durationPerTradeResults = _.sortBy(results, (x) => x.AvgTime.toFixed(1));
    console.log(`results for last ${differenceInDays(subMinutes(new Date(), PeriodToMinutes(Program.CandleStickInterval) * 500), new Date())} days`);
    Program.WriteSeparator();
    let table = new cliTable({
      head: [
        "Name",
        "Grade",
        "T Total #",
        "T Profitable #",
        "T Nonprofit #",
        "T Profitable %",
        "Profit",
        "Profit %",
        "Buy & Hold %",
        "Avg profit %",
        "Avg time"
      ],
      colWidths: [30, 8, 10, 10, 10, 10, 10, 10, 10, 10]
    });
    let cells = _.sortBy(_.map(results, (strategy) => {
      return [
        strategy.Name,
        _.findIndex(totalProfitResults, (x) => x.Name === strategy.Name) + _.findIndex(positiveTradesPercentageResults, (x) => x.Name === strategy.Name),
        strategy.TotalTrades,
        strategy.ProfitTrades,
        strategy.NonProfitTrades,
        (strategy.TotalTrades > 0 ? (strategy.ProfitTrades / strategy.TotalTrades) * 100.0 : 0).toFixed(2),
        ((profit) => {
          if (profit > 0) return colors.green(profit.toFixed(4));
          if (profit < 0) return colors.red(profit.toFixed(4));
          else return profit.toFixed(4);
        })(strategy.TotalProfit),
        (strategy.TotalProfit / Program.StartCapital * 100).toFixed(2),
        (strategy.BuyAndHold / Program.StartCapital * 100).toFixed(2),
        strategy.AvgProfit.toFixed(2),
        strategy.AvgTime.toFixed(1)
      ];
    }), (x) => -x[1]);
    (<any>table).push(...cells);
    console.log(table.toString());
    Program.WriteSeparator();
  }

  public static WriteSeparator() {
    console.log();
    console.log("    ============================================================");
    console.log();
  }
}

program
  .version("1.0.0")
  .description("Currency Trader Backtesting");

program
  .command("singleStrategy")
  .description("Run a single strategy")
  .action(() => {
    inquirer.prompt([{
      type: "list",
      name: "strategy",
      message: "Which strategy do you want to test?",
      choices: _.map(Program.Strategies, (x) => x.Name).sort()
    }]).then(answers => {
      console.log(`    Backtesting a single strategy. Starting...`);
      Program.BackTest( _.find(Program.Strategies, (x) => { return answers["strategy"] === x.Name; }));
    });
  });

program
  .command("allStrategies")
  .description("Run all strategies")
  .action(() => {
    Program.BackTestAll();
  });

program
  .command("combine2Strategies")
  .description("Combine 2 strategies")
  .action(() => {
    Program.BackTestCombinations();
  });

program
  .command("combineExitEntryStrategies")
  .description("Combine entry/exit strategies")
  .action(() => {
    Program.BackTestEntryExit();
  });

program
  .command("combineTraits")
  .description("Combine traits")
  .action(() => {
    Program.BackTestTraits();
  });

program
  .command("downloadData")
  .description("Download History Data")
  .action(() => {
    Program.DownloadData();
  });

program.parse(process.argv);
