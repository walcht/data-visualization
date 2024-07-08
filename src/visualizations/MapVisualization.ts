import { AccidentData } from "../interfaces/AccidentData";
import { Selection, create } from "d3-selection";
import { tile, tileWrap } from "d3-tile";
import { ZoomBehavior, ZoomTransform, zoom, zoomIdentity } from "d3-zoom";
import { ResizableVisualzation } from "../core/ResizableVisualization";

enum TileProviders {
  OPENSTREETMAP,
}

type TileProviderData = {
  url: (x: number, y: number, z: number) => string;
  tileSize: number;
};

class MapVisualization extends ResizableVisualzation {
  private readonly svg: Selection<SVGSVGElement, undefined, null, undefined>;
  private readonly tile: any;
  private readonly zoom: ZoomBehavior<Element, unknown>;
  private images: Selection<SVGImageElement, undefined, SVGElement, undefined>;
  private readonly tileProviders: Map<TileProviders, TileProviderData> =
    new Map([
      [
        TileProviders.OPENSTREETMAP,
        {
          url: (x, y, z) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`,
          tileSize: 256,
        },
      ],
    ]);

  private currTransform: ZoomTransform;

  public tileProviderData: TileProviderData;

  public constructor(
    container: HTMLDivElement,
    options?: {
      initialTileProvider?: TileProviders;
    },
  ) {
    super(container);
    const defaultOptions = {
      initialTileProvider:
        (options && options.initialTileProvider) || TileProviders.OPENSTREETMAP,
    };
    this.svg = create("svg").attr("width", "100%").attr("height", "100%");
    this.tileProviderData = this.tileProviders.get(
      defaultOptions.initialTileProvider,
    )!;
    this.tile = tile().tileSize(this.tileProviderData.tileSize).clampX(false);
    this.zoom = zoom()
      .scaleExtent([1 << 8, 1 << 22])
      .on("zoom", this.onZoom.bind(this));
    this.images = this.svg
      .append("g")
      .attr("pointer-events", "none")
      .selectAll("image");
    this.container.append(this.svg.node()!);
    this.svg.call(this.zoom as any);
    this.currTransform = zoomIdentity.translate(0, 0).scale(1 << 15);
  }

  public update(_: AccidentData[]) {}

  protected override resize() {
    this.tile.extent([
      [0, 0],
      [this.width, this.height],
    ]);
    this.refreshTransform();
  }

  private onZoom(e: any): SVGSVGElement {
    this.currTransform = e.transform;
    const tiles = this.tile(this.currTransform);
    //@ts-ignore
    this.images = this.images
      .data(tiles, (d: any) => d) // to avoid flickering ...
      .join("image")
      .attr("xlink:href", (d) =>
        this.tileProviderData.url(...(tileWrap(d) as [number, number, number])),
      )
      //@ts-ignore
      .attr("x", ([x]) => (x + tiles.translate[0]) * tiles.scale)
      //@ts-ignore
      .attr("y", ([, y]) => (y + tiles.translate[1]) * tiles.scale)
      .attr("width", tiles.scale)
      .attr("height", tiles.scale);
    return this.svg.node()!;
  }

  private refreshTransform() {
    this.svg.call(this.zoom.transform as any, this.currTransform);
  }
}

export { MapVisualization };
