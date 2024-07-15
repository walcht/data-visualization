type Options = {
  /**
   * whether the brush toggle is initially enabled
   * @default false
   */
  initiallyEnabled: boolean;
  /**
   * keyboard key that toggles the brush (equivalent to clicking on the GUI toggle)
   * @default `b`
   */
  keyboardKey: string;
};
class BrushToggleGUI {
  private readonly container: HTMLDivElement;
  private readonly btn: HTMLButtonElement;
  private enabled: boolean;

  public options: Options;

  public constructor(container: HTMLDivElement, options?: Partial<Options>) {
    this.container = container;
    this.options = {
      initiallyEnabled: Boolean(options && options.initiallyEnabled),
      keyboardKey: (options && options.keyboardKey) || "b",
    };
    this.enabled = this.options.initiallyEnabled;
    this.btn = this.createToggleButton();
    window.addEventListener("keypress", (e) => {
      if (e.key == "Control") return;
      if (e.key == "b") this.onToggle();
    });
    this.container.append(this.btn);
    setTimeout(this.onToggle.bind(this), 0);
  }

  private createToggleButton(): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.id = "brush-toggle";
    btn.addEventListener("click", this.onToggle.bind(this));
    btn.textContent = "init";
    return btn;
  }

  private onToggle(): void {
    if (this.enabled) {
      this.enabled = false;
      document.dispatchEvent(
        new CustomEvent("brush-toggle", { detail: { enabled: false } }),
      );
      this.btn.classList.remove("brush-enabled");
      this.btn.classList.add("brush-disabled");
      this.btn.textContent = "Brush ON";
    } else {
      this.enabled = true;
      document.dispatchEvent(
        new CustomEvent("brush-toggle", { detail: { enabled: true } }),
      );
      this.btn.classList.remove("brush-disabled");
      this.btn.classList.add("brush-enabled");
      this.btn.textContent = "Brush OFF";
    }
  }
}

export { BrushToggleGUI };
