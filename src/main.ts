import { datasetImporter } from "./importer/datasetImporter";
import { MapVisualization } from "./map-visualization/MapVisualization";
import { groupByYears } from "./preprocessing/groupByYears";

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
const mapVisualization = new MapVisualization(mapContainer);
importBtn.addEventListener("click", async () => {
  if (!csvDatasetImporter.files?.length) {
    return;
  }
  const accidentsData = await datasetImporter(csvDatasetImporter.files[0]);
  const accidentsDataYearly = groupByYears(accidentsData);
  // mapVisualization.update(accidentsDataYearly.get(2013)!);
});
