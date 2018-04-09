
import { ITrait } from "./itrait";
import { Candle } from "../../core/models/candle";
import { Ppo } from "../../core/indicators/ppo";
import { Ema, EmaNumber } from "../../core/indicators/ema";
import { FixIndicatorOrdering } from "../../core/indicators/baseindicator";
import * as _ from "lodash";

export class PpoT implements ITrait {
  Create(candles: Candle[]): number[] {
    let ppo = Ppo(candles);
    let result: number[] = [];

    for (let i = 0; i < candles.length; i++) {
      let ppoValue = ppo.Ppo[i];
      let signalValue = ppo.Signal[i];
      if ((<number>ppo.Ppo[i - 2] > <number>ppo.Signal[i - 2]) && ppoValue < signalValue)
        result.push(1);
      else if ((<number>ppo.Ppo[i - 2] < <number>ppo.Signal[i - 2]) && ppoValue > signalValue)
        result.push(-1);
      else
        result.push(0);
    }
    return result;
  }
}