import { datasetImporter } from "./importer/datasetImporter";
import { MapVisualization } from "./visualizations/MapVisualization";
import { groupByYears } from "./preprocessing/groupByYears";
import { StackedBarChartVisualization } from "./visualizations/StackedBarChartVisualization";
import {
  AccidentSeverity,
  JunctionControl,
  RoadType,
} from "./interfaces/AccidentData";

const mapContainer = document.querySelector("#map-container") as HTMLDivElement;
if (mapContainer == null) {
  throw new Error("couldn't find the map container");
}
const csvDatasetImporter = document.querySelector(
  "#csv-dataset-importer"
) as HTMLInputElement;
if (csvDatasetImporter == null) {
  throw new Error("couldn't find the CSV dataset importer");
}
const importBtn = document.querySelector("#import-btn") as HTMLButtonElement;
if (importBtn == null) {
  throw new Error("couldn't find the import button");
}
const yearInput = document.querySelector(
  "#timestamp-player-range-input"
) as HTMLInputElement;
if (yearInput == null) {
  throw new Error(
    "couldn't find the timestamp (year) range input. Aborting ..."
  );
}
const barChartContainer00 = document.querySelector(
  "#horizontal-bar-chart-container-00"
) as HTMLDivElement;
if (barChartContainer00 == null) {
  throw new Error("couldn't find horizontal bar container 00. Aborting ...");
}
const barChartContainer01 = document.querySelector(
  "#horizontal-bar-chart-container-01"
) as HTMLDivElement;
if (barChartContainer01 == null) {
  throw new Error("couldn't find horizontal bar container 01. Aborting ...");
}
const mapVisualization = new MapVisualization(mapContainer);
const barChartVisualization00 = new StackedBarChartVisualization(
  barChartContainer00,
  (d) => d.roadType,
  (k: RoadType) => RoadType[k],
  (d) => d.accidentSeverity,
  (k: AccidentSeverity) => ["#ffdd59", "#ffa801", "#ff3f34"][k - 1]
);
const barChartVisualization01 = new StackedBarChartVisualization(
  barChartContainer01,
  (d) => d.juncitionControl,
  (k: JunctionControl) => JunctionControl[k],
  (d) => d.accidentSeverity,
  (k: AccidentSeverity) => ["#ffdd59", "#ffa801", "#ff3f34"][k - 1]
);
importBtn.addEventListener("click", async () => {
  if (!csvDatasetImporter.files?.length) {
    return;
  }
  const accidentsData = await datasetImporter(csvDatasetImporter.files[0]);
  const accidentsDataYearly = groupByYears(accidentsData);
  barChartVisualization00.update(accidentsDataYearly.get(2013)!);
  barChartVisualization01.update(accidentsDataYearly.get(2013)!);
  // mapVisualization.update(accidentsDataYearly.get(2013)!);
});
