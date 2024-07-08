import { group } from "d3-array";
import { AccidentData } from "../interfaces/AccidentData";

function groupByYears(
  data: Array<AccidentData>,
): Map<number, Array<AccidentData>> {
  return group(data, (d) => d.date.getUTCFullYear());
}

export { groupByYears };
