import { group } from "d3-array";
import { AccidentData } from "../interfaces/AccidentData";

function groupByYears(
  data: Array<AccidentData>,
): Map<number, Array<AccidentData>> {
  const res = group(data, (d) => d.date.getUTCFullYear());
  // these two years have a lot of invalid data (e.g., date, road type, etc.)
  res.delete(2004);
  res.delete(2008);
  return res;
}

export { groupByYears };
