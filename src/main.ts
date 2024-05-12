import { datasetImporter } from "./importer/datasetImporter";
import { MapVisualization } from "./map-visualization/MapVisualization";

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
const mapCanvas = mapContainer.querySelector("canvas");
if (mapCanvas == null) {
    throw new Error("couldn't find the map canvas");
}
importBtn.addEventListener("click", async () => {
    if (!csvDatasetImporter.files?.length) {
        return;
    }
    const accidentsData = await datasetImporter(csvDatasetImporter.files[0]);
    console.log(accidentsData);
    new MapVisualization(mapCanvas, accidentsData.map((v) => {return {
        coordinates: [v.longitude, v.latitude],
        casualties: v.nbrOfCasualties,
        severity: Math.floor(v.accidentSeverity * 255 / 3),
        nbrVehicles: v.nbrOfVehicles,
    }}));
});
