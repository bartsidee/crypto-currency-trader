export enum Period {
  Minute,
  FiveMinutes,
  QuarterOfAnHour,
  HalfAnHour,
  Hour,
  Day,
  TwoHours,
  FourHours
}

export let PeriodToMinutes =  function(x: Period) {
  switch (x) {
    case Period.Minute:
      return 1;
    case Period.FiveMinutes:
      return 5;
    case Period.QuarterOfAnHour:
      return 15;
    case Period.HalfAnHour:
      return 30;
    case Period.Hour:
      return 60;
    case Period.Day:
      return 1440;
    case Period.TwoHours:
      return 120;
    case Period.FourHours:
      return 240;
  }
};
