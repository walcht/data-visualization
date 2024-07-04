import { AccidentData } from "../interfaces/AccidentData";
import { Selection, create } from "d3-selection";
import { tile, tileWrap } from "d3-tile";
import { ZoomBehavior, ZoomTransform, zoom, zoomIdentity } from "d3-zoom";

enum TileProviders {
  OPENSTREETMAP,
  CARTODB_DARKMATTER,
}

type TileProviderData = {
  url: (x: number, y: number, z: number) => string;
  tileSize: number;
};

class MapVisualization {
  private readonly container: HTMLDivElement;
  private readonly svg: Selection<SVGSVGElement, undefined, null, undefined>;
  private readonly tile: any;
  private readonly zoom: ZoomBehavior<Element, unknown>;
  private images: Selection<SVGImageElement, undefined, SVGElement, undefined>;
  private readonly tileLayerProviders: Map<TileProviders, TileProviderData> =
    new Map([
      [
        TileProviders.OPENSTREETMAP,
        {
          url: (x, y, z) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`,
          tileSize: 256,
        },
      ],
      [
        TileProviders.CARTODB_DARKMATTER,
        {
          url: (x, y, z) =>
            `https://a.basemaps.cartocdn.com/dark_all/${z}/${x}/${y}.png`,
          tileSize: 256,
        },
      ],
    ]);

  private width: number = 0;
  private height: number = 0;
  private currTransform: ZoomTransform;

  public currentTileProvider: TileProviders = TileProviders.OPENSTREETMAP;

  public constructor(container: HTMLDivElement) {
    this.container = container;
    this.svg = create("svg").attr("preserveAspectRatio", "none");
    this.tile = tile()
      .tileSize(this.tileLayerProviders.get(this.currentTileProvider)!.tileSize)
      .clampX(false);
    this.zoom = zoom()
      .scaleExtent([1 << 8, 1 << 22])
      .on("zoom", this.onZoom.bind(this));
    this.images = this.svg
      .append("g")
      .attr("pointer-events", "none")
      .selectAll("image");
    this.container.append(this.svg.node()!);

    setTimeout(() => {
      this.width = this.container.clientWidth;
      this.height = this.container.clientHeight;
      this.resize();
      console.log(`width: ${this.width}; height: ${this.height};`);
    }, 0);

    this.svg.call(this.zoom as any);
    this.currTransform = zoomIdentity.translate(0, 0).scale(1 << 15);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        this.width = Math.floor(entry.contentBoxSize[0].inlineSize - 10);
        this.height = Math.floor(entry.contentBoxSize[0].blockSize - 10);
        this.resize();
        console.log(`width: ${this.width}; height: ${this.height};`);
      }
    });
    resizeObserver.observe(this.container);
  }

  public update(data: AccidentData[]) {}

  private resize() {
    this.svg.attr("viewBox", [0, 0, this.width, this.height]);
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
      .data(tiles, (d: any) => d) // remove this seemingly unnecessary crap and you will notice some wild flickering...
      .join("image")
      .attr("xlink:href", (d) =>
        this.tileLayerProviders
          .get(this.currentTileProvider)!
          .url(...(tileWrap(d) as [number, number, number]))
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
