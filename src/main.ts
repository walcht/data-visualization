import { datasetImporter } from "./importer/datasetImporter";
import { MapVisualization } from "./visualizations/MapVisualization";
import { StackedBarChartVisualization } from "./visualizations/StackedBarChartVisualization";
import {
  AccidentSeverity,
  RoadSurfaceConditions,
  RoadType,
  SpeedLimit,
  WeatherConditions,
} from "./interfaces/AccidentData";
import { DatePlayer } from "./core/DatePlayer";
import { CalendarVisualization } from "./visualizations/CalendarVisualization";
import { LineChartVisualization } from "./visualizations/LinechartVisualization";

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
const barChartContainer02 = document.querySelector(
  "#horizontal-bar-chart-container-02",
) as HTMLDivElement;
if (barChartContainer02 == null) {
  throw new Error("couldn't find horizontal bar container 02. Aborting ...");
}
const barChartContainer03 = document.querySelector(
  "#horizontal-bar-chart-container-03",
) as HTMLDivElement;
if (barChartContainer03 == null) {
  throw new Error("couldn't find horizontal bar container 03. Aborting ...");
}
const calendarContainer = document.querySelector(
  "#calendar-container",
) as HTMLDivElement;
if (!calendarContainer) {
  throw new Error(
    "couldn't find the calendar visualization container. Aborting ...",
  );
}
const lineChartContainer = document.querySelector(
  "#line-chart-container",
) as HTMLDivElement;
if (!lineChartContainer) {
  throw new Error(
    "couldn't find the line chart visualization container. Aborting ...",
  );
}

///////////////////////////////////////////////////////////////////////////////
/////////////////////////// Visualizations Pool ///////////////////////////////
///////////////////////////////////////////////////////////////////////////////
const mapVisualization = new MapVisualization(mapContainer);
const stackedBarChartVisualization00 =  new StackedBarChartVisualization(
    barChartContainer00,
    (d) => d.speedLimit,
    Object.values(SpeedLimit).filter((d) => !Number.isNaN(Number(d))),
    (k: SpeedLimit) => SpeedLimit[k].replace("_", " ").toLowerCase(),
    (d) => d.accidentSeverity,
    (k: AccidentSeverity) => ["#ffdd59", "#ffa801", "#ff3f34"][k - 1],
  );
 const stackedBarChartVisualization01 = new StackedBarChartVisualization(
    barChartContainer01,
    (d) => d.roadType,
    Object.values(RoadType).filter((d) => !Number.isNaN(Number(d))),
    (k: RoadType) => RoadType[k].replace("_", " ").toLowerCase(),
    (d) => d.accidentSeverity,
    (k: AccidentSeverity) => ["#ffdd59", "#ffa801", "#ff3f34"][k - 1],
  );
 const stackedBarChartVisualization02 = new StackedBarChartVisualization(
    barChartContainer02,
    (d) => d.roadSurfaceConditions,
    Object.values(RoadSurfaceConditions).filter(
      (d) => !Number.isNaN(Number(d)),
    ),
    (k: RoadSurfaceConditions) =>
      RoadSurfaceConditions[k].replace("_", " ").toLowerCase(),
    (d) => d.accidentSeverity,
    (k: AccidentSeverity) => ["#ffdd59", "#ffa801", "#ff3f34"][k - 1],
  );
 const stackedBarChartVisualization03 = new StackedBarChartVisualization(
    barChartContainer03,
    (d) => d.weatherConditions,
    Object.values(WeatherConditions).filter((d) => !Number.isNaN(Number(d))),
    (k: WeatherConditions) =>
      WeatherConditions[k].replace("_", " ").toLowerCase(),
    (d) => d.accidentSeverity,
    (k: AccidentSeverity) => ["#ffdd59", "#ffa801", "#ff3f34"][k - 1],
  );
const lineChartVisualization = new LineChartVisualization(lineChartContainer);

///////////////////////////////////////////////////////////////////////////////
///////////////////////////// Event Listeners /////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
importBtn.addEventListener("click", async () => {
  if (!csvDatasetImporter.files?.length) {
    alert("Please select a .csv dataset then click on import.");
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
  new CalendarVisualization(calendarContainer, accidentsData);
});
// listen to date update events dispatched by the DatePlayer
document.addEventListener("date-update", (e: any) => {
  mapVisualization.update(e.detail.data);
});
// listen to day selection event dispatched by calendar visualization
document.addEventListener("dayselectionevent", (e: any) => {
  lineChartVisualization.update(e.detail.data);
});
// listen to map (de)selection events and update stacked bar charts accordingly
document.addEventListener("map-selection-update", (e: any) => {
  stackedBarChartVisualization00.update(e.detail.data);
  stackedBarChartVisualization01.update(e.detail.data);
  stackedBarChartVisualization02.update(e.detail.data);
  stackedBarChartVisualization03.update(e.detail.data);
});
