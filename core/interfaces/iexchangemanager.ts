import { Candle } from "../models/candle";
import { MarketSummary } from "../store/entities/marketsummery";
import { OpenOrder } from "../models/openorder";
import { Ticker } from "../models/ticker";
import { BookOrder } from "../models/bookorder";

export interface IExchangeManager {
  CheckMarketExistance(): Promise<void>;
  Buy(market: string, quantity: number, rate: number): Promise<number>;
  Sell(market: string, quantity: number, rate: number): Promise<number>;
  CancelOrder(market: string, orderId: number): Promise<void>;
  GetBalance(...currency: string[]): Promise<number[]>;
  GetMarkets(): Promise<string[]>;
  GetMarketSummaries(): Promise<MarketSummary[]>;
  GetOpenOrders(market: string): Promise<OpenOrder[]>;
  GetTicker(market: string): Promise<Ticker | undefined>;
  GetOrder(market: string, orderId: number): Promise<BookOrder | undefined>;
  GetTickerHistory(market: string, startDate: Date, period: number): Promise<Candle[]>;
  GetAvarageMarketVolumeOnPeriod(market: string, days: number): Promise<number>;
  roundAmount(amount: number, tickSize?: number): number;
  convertMarketToCoin(market: string): [string, boolean];
  convertCoinToMarket(coin: string): string;
}