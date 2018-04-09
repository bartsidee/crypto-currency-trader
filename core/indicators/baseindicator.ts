
// TA analsys will mark the x first items not qualified for a calulcation
// make a correction to the results by pushing undefined results into the beginning of the array
// so that the index values match up against the source candle index and can be compared accross different analysis results
export let FixIndicatorOrdering = function (items: number[], sourceLength: number): (number | undefined)[] {
  let missing = sourceLength - items.length;
  let source = <(number | undefined)[]> items;
  for (let i = 0; i < missing; i++) {
    source.unshift(undefined);
  }
  return source;
};