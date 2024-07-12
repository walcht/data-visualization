import { datasetImporter } from "../importer/datasetImporter";

/**
 * Importer GUI for importing and parsing the UK accidents `.csv` dataset
 * @dispatches `import` event when the import button is clicked with available data.
 */
class ImpoterGUI {
  private readonly datasetInput: HTMLInputElement;
  private readonly importBtn: HTMLButtonElement;

  /**
   * @param datasetInput HTML dataset input element
   * @param importBtn HTML import button
   */
  public constructor(
    datasetInput: HTMLInputElement,
    importBtn: HTMLButtonElement,
  ) {
    this.datasetInput = datasetInput;
    this.importBtn = importBtn;
    this.importBtn.addEventListener("click", this.onImport.bind(this));
  }

  private async onImport() {
    // read dataset
    if (!this.datasetInput.files) {
      alert("Input dataset should be provided!");
      return;
    }
    document.dispatchEvent(
      new CustomEvent("import", {
        detail: {
          dataset: await datasetImporter(this.datasetInput.files[0]),
        },
      }),
    );
  }
}

export { ImpoterGUI };
