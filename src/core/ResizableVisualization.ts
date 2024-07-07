class ResizableVisualzation {
  protected readonly container: HTMLDivElement;
  protected width!: number;
  protected height!: number;

  public constructor(container: HTMLDivElement) {
    this.container = container;
    // don't forget to initialize the width/height
    setTimeout(this.handler.bind(this), 0);
    // watch for resizing events
    window.addEventListener("resize", this.handler.bind(this));
  }

  private handler(): void {
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    console.log(
      `width: ${this.container.clientWidth}; height: ${this.container.clientHeight}`
    );
    this.resize();
  }

  protected resize(): void {}
}

export { ResizableVisualzation };
