export interface ITradeManager {

    ///  <summary>
    ///  Queries the persistence layer for open trades and
    ///  handles them, otherwise a new trade is created.
    ///  </summary>
    ///  <returns></returns>
    Process(): Promise<void>;
}