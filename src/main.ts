import { datasetImporter } from "./importer/datasetImporter";
import { MapVisualization } from "./visualizations/MapVisualization";
import { StackedBarChartVisualization } from "./visualizations/StackedBarChartVisualization";
import {
  AccidentSeverity,
  RoadType,
  WeatherConditions,
} from "./interfaces/AccidentData";
import { DatePlayer } from "./core/DatePlayer";

///////////////////////////////////////////////////////////////////////////////
////////////////////////////////// QUERIES ////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
const mapContainer = document.querySelector("#map-container") as HTMLDivElement;
if (mapContainer == null) {
  throw new Error("couldn't find the map container");
}
const csvDatasetImporter = document.querySelector(
  "#csv-dataset-importer",
) as HTMLInputElement;
if (csvDatasetImporter == null) {
  throw new Error("couldn't find the CSV dataset importer");
}
const importBtn = document.querySelector("#import-btn") as HTMLButtonElement;
if (importBtn == null) {
  throw new Error("couldn't find the import button");
}
const datePlayerInput = document.querySelector(
  "#timestamp-player-range-input",
) as HTMLInputElement;
if (datePlayerInput == null) {
  throw new Error(
    "couldn't find the timestamp (year) range input. Aborting ...",
  );
}
const datePlayerLabel = document.querySelector(
  "#date-player-label",
) as HTMLLabelElement;
if (datePlayerLabel == null) {
  throw new Error("couldn't find the date player label. Aborting ...");
}
const playStopBtn = document.querySelector(
  "#play-stop-btn",
) as HTMLButtonElement;
if (playStopBtn == null) {
  throw new Error(
    "couldn't find the date player's play/stop button. Aborting ...",
  );
}
const datePlayerLoop = document.querySelector(
  "#date-player-loop",
) as HTMLInputElement;
if (datePlayerLoop == null) {
  throw new Error("couldn't find the date player's loop toggle. Aborting ...");
}
const datePlayerList = document.querySelector(
  "#date-player-list",
) as HTMLDataListElement;
if (datePlayerList == null) {
  throw new Error("couldn't find the date player's datalist. Aborting ...");
}
const barChartContainer00 = document.querySelector(
  "#horizontal-bar-chart-container-00",
) as HTMLDivElement;
if (barChartContainer00 == null) {
  throw new Error("couldn't find horizontal bar container 00. Aborting ...");
}
const barChartContainer01 = document.querySelector(
  "#horizontal-bar-chart-container-01",
) as HTMLDivElement;
if (barChartContainer01 == null) {
  throw new Error("couldn't find horizontal bar container 01. Aborting ...");
}

///////////////////////////////////////////////////////////////////////////////
/////////////////////////// Visualizations Pool ///////////////////////////////
///////////////////////////////////////////////////////////////////////////////
const pool = [
  new MapVisualization(mapContainer),
  new StackedBarChartVisualization(
    barChartContainer00,
    (d) => d.weatherConditions,
    Object.values(WeatherConditions).filter((d) => !Number.isNaN(Number(d))),
    (k: WeatherConditions) => WeatherConditions[k],
    (d) => d.accidentSeverity,
    (k: AccidentSeverity) => ["#ffdd59", "#ffa801", "#ff3f34"][k - 1],
    150_000,
  ),
  new StackedBarChartVisualization(
    barChartContainer01,
    (d) => d.roadType,
    Object.values(RoadType).filter((d) => !Number.isNaN(Number(d))),
    (k: RoadType) => RoadType[k],
    (d) => d.accidentSeverity,
    (k: AccidentSeverity) => ["#ffdd59", "#ffa801", "#ff3f34"][k - 1],
    150_000,
  ),
];
importBtn.addEventListener("click", async () => {
  if (!csvDatasetImporter.files?.length) {
    return;
  }
  const accidentsData = await datasetImporter(csvDatasetImporter.files[0]);
  new DatePlayer(
    datePlayerInput,
    playStopBtn,
    datePlayerLoop,
    datePlayerLabel,
    datePlayerList,
    accidentsData,
  );
});
document.addEventListener("date-update", (e: any) => {
  pool.forEach((v) => v.update(e.detail.data));
});
