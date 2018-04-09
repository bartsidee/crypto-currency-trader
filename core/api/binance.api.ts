import * as request from "request-promise-native";
import * as crypto from "crypto";
import * as qs from "querystring";
import { Logger } from "../logger";

export interface BinanceRestOptions {
  key: string;            // Get this from your account on binance.com
  secret: string;         // Same for this
}

export interface BinanceAccountResponseBalance {
  asset: string;
  free: string;
  locked: string;
}
export interface BinanceAccountResponse {
  makerCommission: number;
  takerCommission: number;
  buyerCommission: number;
  sellerCommission: number;
  canTrade: boolean;
  canWithdraw: boolean;
  canDeposit: boolean;
  updateTime: number;
  balances: BinanceAccountResponseBalance[];
}

export interface BinanceAggTradesRequest {
  symbol: string;
  fromId?: number;    // include to retrieve trades with ID >= fromId
  startTime?: number; // Timestamp in ms, include to retrieve trade.timestamp >= startTime
  endTime?: number;   // Timestamp in ms, include to retrieve trade.timestamp <= endTime
  limit?: number;     // Default and maximum of 500
}
export interface BinanceAggTradesResponse {
  a: number;  // aggTradeId
  p: string;  // price
  q: string;  // quantity
  f: number;  // firstTradeId
  l: number;  // lastTradeId
  T: number;  // timestamp
  m: boolean; // maker
  M: boolean; // bestPriceMatch
}

export interface BinanceAllBookTickersResponse {
  symbol: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
}

export interface BinanceAllOrdersRequest {
  symbol: string;
  orderId?: number;   // If set, retrieve orders with ID >= orderId, otherwise most recent are returned
  limit?: number;     // Default and maximum of 500
}
export interface BinanceAllOrdersResponse {
  symbol: string;
  orderId: number;
  clientOrderId: string;
  price: string;
  origQty: string;
  executedQty: string;
  status: string;
  timeInForce: string;
  type: string;
  side: string;
  stopPrice: string;
  icebergQty: string;
  time: number;
}
export interface BinanceAllPricesResponse {
  symbol: string;
  price: string;
}

export interface BinanceCancelOrderRequest {
  symbol: string;
  orderId?: number;               // If not present, origClientOrderId must be sent
  origClientOrderId?: string;     // If not present, orderId must be sent
  newClientOrderId?: string;      // Used to uniquely identify this cancel, generated by default
}
export interface BinanceCancelOrderResponse {
  symbol: string;
  origClientOrderId: string;
  orderId: number;
  clientOrderId: string;
}

export interface BinanceCloseUserDataStreamRequest {
  listenKey: string;
}

export interface BinanceDepositAddressRequest {
  asset: string;
}
export interface BinanceDepositAddressResponse {
  address: string;
  success: boolean;
  addressTag: string;
  asset: string;
}

export enum DepositHistoryStatusEnum {
  Pending = 0,
  Success = 1
}
export interface BinanceDepositHistoryRequest {
  asset?: string;
  status?: DepositHistoryStatusEnum;    // { 0: 'Pending', 1: 'Success' }
  startTime?: number;               // Timestamp in ms
  endTime?: number;                 // Timestamp in ms
}
export interface BinanceDepositHistoryResponseListItem {
  insertTime: number;
  amount: number;
  asset: string;
  address: string;
  addressTag: string;
  txId: string;
  status: DepositHistoryStatusEnum;
}
export interface BinanceDepositHistoryResponse {
  depositList: BinanceDepositHistoryResponseListItem[];
  success: boolean;
}

export interface BinanceDepthRequest {
  symbol: string;
  limit?: number; // Default and maximum of 100
}
export interface BinanceDepthResponse {
  lastUpdateId: number;
  bids: [string, string, any[]][]; // Price, Quantity, Ignored
  asks: [string, string, any[]][]; // Price, Quantity, Ignored
}

export interface BinanceKeepAliveUserDataStreamRequest {
  listenKey: string;
}
export enum BinanceKlinesIntervalEnum {
  OneMinute = "1m",
  ThreeMinutes = "3m",
  FiveMinutes = "5m",
  FiveteenMinutes = "15m",
  ThirthyMinute = "30m",
  OneHour = "1h",
  TwoHours = "2h",
  FourHours = "4h",
  SixHours = "6h",
  EightHours = "8h",
  TwelveHours = "12h",
  OneDay = "1d",
  ThreeDays = "3d",
  OneWeek = "1w",
  OneMonth = "1M"
}
export interface BinanceKlinesRequest {
  symbol: string;
  interval: BinanceKlinesIntervalEnum;
  startTime?: number;
  endTime?: number;
  limit?: number;
}
export interface BinanceKlinesResponse {
  0: number;  // openTime
  1: string;  // open
  2: string;  // high
  3: string;  // low
  4: string;  // close
  5: string;  // volume
  6: number;  // closeTime
  7: string;  // quoteAssetVolume
  8: number;  // trades
  9: string;  // takerBaseAssetVolume
  10: string; // takerQuoteAssetVolume
  11: string; // ignored
}

export interface BinanceMyTradesRequest {
  symbol: string;
  fromId?: number;    // TradeId to fetch from. Retrieves most recent trades by default
  limit?: number;     // Default and maximum of 500
}
export interface BinanceMyTradesResponse {
  id: number;
  orderId: number;
  price: string;
  qty: string;
  commission: string;
  commissionAsset: string;
  time: number;
  isBuyer: boolean;
  isMaker: boolean;
  isBestMatch: boolean;
}

export enum BinanceOrderSideEnum {
  BUY = "BUY",
  SELL = "SELL"
}
export enum BinanceOrderTypeEnum {
  LIMIT = "LIMIT",
  MARKET = "MARKET"
}
export enum BinanceOrderTimeInForceEnum {
  GTC = "GTC",
  IOC = "IOC"
}
export interface BinanceNewOrderRequest {
  symbol: string;
  side: BinanceOrderSideEnum;                // BUY, SELL
  type: BinanceOrderTypeEnum;                // LIMIT, MARKET
  timeInForce: BinanceOrderTimeInForceEnum;  // GTC, IOC (Good till cancelled, Immediate or Cancel)
  quantity: number;
  price: number;
  newClientOrderId?: string;          // A unique id for the order, will be generated if not sent
  stopPrice?: number;                 // Used with stop orders
  icebergQty?: number;                // Used with iceberg orders
}
export interface BinanceNewOrderResponse {
  symbol: string;
  orderId: number;
  clientOrderId: string;
  transactTime: number;
}

export interface BinanceOpenOrdersRequest {
  symbol: string;
}
export interface BinanceOpenOrdersResponse {
  symbol: string;
  orderId: number;
  clientOrderId: string;
  price: string;
  origQty: string;
  executedQty: string;
  status: string;
  timeInForce: BinanceOrderTimeInForceEnum;
  type: BinanceOrderTypeEnum;
  side: BinanceOrderSideEnum;
  stopPrice: string;
  icebergQty: string;
  time: number;
}

export interface BinanceQueryOrderRequest {
  symbol: string;
  orderId?: number;           // If not present, origClientOrderId must be sent
  origClientOrderId?: string; // If not present, orderId must be sent
}
export interface BinanceQueryOrderResponse {
  symbol: string;
  orderId: number;
  clientOrderId: string;
  price: string;
  origQty: string;
  executedQty: string;
  status: string;
  timeInForce: BinanceOrderTimeInForceEnum;
  type: BinanceOrderTypeEnum;
  side: BinanceOrderSideEnum;
  stopPrice: string;
  icebergQty: string;
  time: number;
}

export interface BinanceStartUserDataStreamResponse {
  listenKey: string;
}

export interface BinanceTicker24hrRequest {
  symbol: string;
}
export interface BinanceTicker24hrResponse {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

export interface BinanceTimeResponse {
  serverTime: number;
}

export interface BinanceWithdrawRequest {
  asset: string;
  address: string;
  addressTag?: string;    // Secondary address identifier for coins like XRP, XMR, etc...
  amount: number;
  name?: string;           // Description of the address
}
export interface BinanceWithdrawResponse {
  msg: string;
  success: boolean;
  id: string;
}

export enum BinanceWithdrawHistoryStatusEnum {
  EmailSent = 0,
  Cancelled = 1,
  AwaitingApproval = 2,
  Rejected = 3,
  Processing = 4,
  Failure = 5,
  Completed = 6
}
export interface BinanceWithdrawHistoryRequest {
  asset?: string;
  status?: BinanceWithdrawHistoryStatusEnum;
  startTime?: number; // Timestamp in ms
  endTime?: number;   // Timestamp in ms
}
export interface BinanceWithdrawHistoryResponseListitem {
  id: string;
  amount: number;
  address: string;
  asset: string;
  txId: string;
  applyTime: number;
  status: BinanceWithdrawHistoryStatusEnum;
}
export interface BinanceWithdrawHistoryResponse {
  withdrawList: BinanceWithdrawHistoryResponseListitem[];
  success: boolean;
}


export interface BinanceMarketSummery {
  symbol: string;
  active: boolean;
  close: string;
  high: string;
  low: string;
  volume: string;
  decimalPlaces: number;
  tickSize: string;
  minTrade: string;
  minQty: string;
}
export interface BinanceMarketSummeriesResponse {
  data: BinanceMarketSummery[];
}

export enum BinanceSecurityEnum {
  SIGNED,
  APIKEY
}

export default class BinanceRest {
  v1URL = "https://www.binance.com/api/v1/";
  v3URL = "https://www.binance.com/api/v3/";
  baseUrl = "https://www.binance.com/";
  secretKey: string;
  headers: object;
  timeout: 5000;

  constructor(options: BinanceRestOptions) {
    this.secretKey = options.secret;
    this.headers = {
      "X-MBX-APIKEY": options.key,
      "Content-Type": "application/x-www-form-urlencoded"
    };
  }

  private sign(queryString: string) {
    return "&signature=" + crypto.createHmac("sha256", this.secretKey)
      .update(queryString)
      .digest("hex");
  }
  private formatQuery(query: any) {
    return "?" + qs.stringify(query);
  }

  // Public APIs
  ping(): Promise<{}> {
    Logger.debug("BinanceAPI:: ping");
    return request({
      method: "GET",
      url: this.v1URL + "ping",
      json: true,
      timeout: this.timeout
    });
  }

  time(): Promise<BinanceTimeResponse> {
    Logger.debug("BinanceAPI:: time");
    return request({
      method: "GET",
      url: this.v1URL + "time",
      json: true,
      timeout: this.timeout
    });
  }

  depth(query: BinanceDepthRequest): Promise<BinanceDepthResponse> {
    Logger.debug("BinanceAPI:: depth", query);
    return request({
      method: "GET",
      url: this.v1URL + "depth" + this.formatQuery(query),
      json: true,
      timeout: this.timeout
    });
  }

  aggTrades(query: BinanceAggTradesRequest): Promise<BinanceAggTradesResponse[]> {
    Logger.debug("BinanceAPI:: aggTrades", query);
    return request({
      method: "GET",
      url: this.v1URL + "aggTrades" + this.formatQuery(query),
      json: true,
      timeout: this.timeout
    });
  }

  klines(query: BinanceKlinesRequest): Promise<BinanceKlinesResponse[]> {
    Logger.debug("BinanceAPI:: klines", query);
    return request({
      method: "GET",
      url: this.v1URL + "klines" + this.formatQuery(query),
      json: true,
      timeout: this.timeout
    });
  }

  ticker24hr(query: BinanceTicker24hrRequest): Promise<BinanceTicker24hrResponse> {
    Logger.debug("BinanceAPI:: ticker24hr", query);
    return request({
      method: "GET",
      url: this.v1URL + "ticker/24hr" + this.formatQuery(query),
      json: true,
      timeout: this.timeout
    });
  }

  allBookTickers(): Promise<BinanceAllBookTickersResponse[]> {
    Logger.debug("BinanceAPI:: allBookTickers");
    return request({
      method: "GET",
      url: this.v1URL + "ticker/allBookTickers",
      json: true,
      timeout: this.timeout
    });
  }

  allPrices(): Promise<BinanceAllPricesResponse[]> {
    return request({
      method: "GET",
      url: this.v1URL + "ticker/allPrices",
      json: true,
      timeout: this.timeout
    });
  }

  // Private APIs
  newOrder(query: BinanceNewOrderRequest): Promise<BinanceNewOrderResponse> {
    Logger.debug("BinanceAPI:: newOrder", query);
    (<any>query).timestamp = Date.now();
    let queryOptions = this.formatQuery(query);
    let url = this.v3URL + "order";
    let data = queryOptions.slice(1) + this.sign(queryOptions.slice(1));
    return request({
      method: "POST",
      url: url,
      form: data,
      headers: this.headers,
      json: true,
      timeout: this.timeout
    });
  }

  testOrder(query: BinanceNewOrderRequest): Promise<{}> {
    Logger.debug("BinanceAPI:: testOrder", query);
    (<any>query).timestamp = Date.now();
    let queryOptions = this.formatQuery(query);
    let url = this.v3URL + "order/test";
    let data = queryOptions.slice(1) + this.sign(queryOptions.slice(1));
    return request({
      method: "POST",
      url: url,
      form: data,
      headers: this.headers,
      json: true,
      timeout: this.timeout
    });
  }

  queryOrder(query: BinanceQueryOrderRequest): Promise<BinanceQueryOrderResponse> {
    Logger.debug("BinanceAPI:: queryOrder", query);
    (<any>query).timestamp = Date.now();
    let queryOptions = this.formatQuery(query);
    let url = this.v3URL + "order" + queryOptions + this.sign(queryOptions.slice(1));
    return request({
      method: "GET",
      url: url,
      headers: this.headers,
      json: true,
      timeout: this.timeout
    });
  }

  cancelOrder(query: BinanceCancelOrderRequest): Promise<BinanceCancelOrderResponse> {
    Logger.debug("BinanceAPI:: cancelOrder", query);
    (<any>query).timestamp = Date.now();
    let queryOptions = this.formatQuery(query);
    let url = this.v3URL + "order" + queryOptions + this.sign(queryOptions.slice(1));
    return request({
      method: "DELETE",
      url: url,
      headers: this.headers,
      json: true,
      timeout: this.timeout
    });
  }

  openOrders(query: BinanceOpenOrdersRequest): Promise<BinanceOpenOrdersResponse[]> {
    Logger.debug("BinanceAPI:: openOrders", query);
    (<any>query).timestamp = Date.now();
    let queryOptions = this.formatQuery(query);
    let url = this.v3URL + "openOrders" + queryOptions + this.sign(queryOptions.slice(1));
    return request({
      method: "GET",
      url: url,
      headers: this.headers,
      json: true,
      timeout: this.timeout
    });
  }

  allOrders(query: BinanceAllOrdersRequest): Promise<BinanceAllOrdersResponse[]> {
    Logger.debug("BinanceAPI:: allOrders", query);
    (<any>query).timestamp = Date.now();
    let queryOptions = this.formatQuery(query);
    let url = this.v3URL + "allOrders" + queryOptions + this.sign(queryOptions.slice(1));
    return request({
      method: "GET",
      url: url,
      headers: this.headers,
      json: true,
      timeout: this.timeout
    });
  }

  account(): Promise<BinanceAccountResponse> {
    Logger.debug("BinanceAPI:: account");
    let queryOptions = this.formatQuery({timestamp: Date.now()});
    let url = this.v3URL + "account" + queryOptions + this.sign(queryOptions.slice(1));
    return request({
      method: "GET",
      url: url,
      headers: this.headers,
      json: true,
      timeout: this.timeout
    });
  }

  myTrades(query: BinanceMyTradesRequest): Promise<BinanceMyTradesResponse[]> {
    Logger.debug("myTrades:: account", query);
    (<any>query).timestamp = Date.now();
    let queryOptions = this.formatQuery(query);
    let url = this.v3URL + "myTrades" + queryOptions + this.sign(queryOptions.slice(1));
    return request({
      method: "GET",
      url: url,
      headers: this.headers,
      json: true,
      timeout: this.timeout
    });
  }

  withdraw(query: BinanceWithdrawRequest): Promise<BinanceWithdrawHistoryResponse> {
    Logger.debug("myTrades:: withdraw", query);
    (<any>query).timestamp = Date.now();
    let queryOptions = this.formatQuery(query);
    let url = this.v1URL + "withdraw";
    let data = queryOptions.slice(1) + this.sign(queryOptions.slice(1));
    return request({
      method: "POST",
      url: url,
      form: data,
      headers: this.headers,
      json: true,
      timeout: this.timeout
    });
  }

  depositHistory(query: BinanceDepositHistoryRequest): Promise<BinanceDepositHistoryResponse> {
    Logger.debug("myTrades:: depositHistory", query);
    (<any>query).timestamp = Date.now();
    let queryOptions = this.formatQuery(query);
    let url = this.v1URL + "getDepositHistory";
    let data = queryOptions.slice(1) + this.sign(queryOptions.slice(1));
    return request({
      method: "POST",
      url: url,
      form: data,
      headers: this.headers,
      json: true,
      timeout: this.timeout
    });
  }

  withdrawHistory(query: BinanceWithdrawRequest): Promise<BinanceWithdrawHistoryResponse> {
    Logger.debug("myTrades:: withdrawHistory", query);
    (<any>query).timestamp = Date.now();
    let queryOptions = this.formatQuery(query);
    let url = this.v1URL + "getWithdrawHistory";
    let data = queryOptions.slice(1) + this.sign(queryOptions.slice(1));
    return request({
      method: "POST",
      url: url,
      form: data,
      headers: this.headers,
      json: true,
      timeout: this.timeout
    });
  }

  getMarketSummeries(): Promise<BinanceMarketSummery[]> {
    Logger.debug("getMarketSummeries");
    return request({
      method: "GET",
      url: `${this.baseUrl}/exchange/public/product`,
      json: true,
      timeout: this.timeout
    }).then((x) => x.data);
  }
}