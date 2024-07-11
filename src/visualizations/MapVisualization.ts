import { AccidentData } from "../interfaces/AccidentData";
import { Selection, create } from "d3-selection";
import { tile, tileWrap } from "d3-tile";
import { ZoomBehavior, ZoomTransform, zoom, zoomIdentity } from "d3-zoom";
import { ResizableVisualzation } from "../core/ResizableVisualization";
import { geoMercator, GeoProjection } from "d3-geo";
import { Hexbin, hexbin } from "d3-hexbin";
import { ScalePower, scaleSqrt } from "d3-scale";
import { max } from "d3-array";

enum TileProviders {
  OPENSTREETMAP,
}

type TileProviderData = {
  url: (x: number, y: number, z: number) => string;
  tileSize: number;
};

type Options = {
  initialTileProvider: TileProviders;
  initialScale: number;
  initialCenter: [number, number];
  boundingBox: [[number, number], [number, number]];
};

class MapVisualization extends ResizableVisualzation {
  private readonly svg: Selection<SVGSVGElement, undefined, null, undefined>;
  private readonly tile: any;
  private readonly zoom: ZoomBehavior<Element, unknown>;
  private readonly projection: GeoProjection;
  private readonly hexbin: Hexbin<[number, number]>;
  private readonly radius: ScalePower<number, number>;
  private readonly binsContainer: Selection<
    SVGGElement,
    undefined,
    null,
    undefined
  >;
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
  private images: Selection<SVGImageElement, undefined, SVGElement, undefined>;
  private currTransform!: ZoomTransform;
  private currData: AccidentData[] | undefined = undefined;

  public options: Options;
  public tileProviderData: TileProviderData;

  public constructor(container: HTMLDivElement, options?: Partial<Options>) {
    super(container);
    this.options = {
      initialTileProvider:
        (options && options.initialTileProvider) || TileProviders.OPENSTREETMAP,
      initialScale: (options && options.initialScale) || 1 << 14,
      initialCenter: (options && options.initialCenter) || [
        -2.983333, 53.400002,
      ], // Liverpool
      boundingBox: (options && options.boundingBox) || [
        [0, 0],
        [0, 0],
      ],
    };
    this.svg = create("svg").attr("width", "100%").attr("height", "100%");
    this.projection = geoMercator()
      .scale(1 / (2 * Math.PI))
      .translate([0, 0]);
    this.hexbin = hexbin()
      .extent([
        [0, 0],
        [this.width, this.height],
      ])
      .radius(10);
    this.radius = scaleSqrt().range([0, this.hexbin.radius()]);
    this.tileProviderData = this.tileProviders.get(
      this.options.initialTileProvider,
    )!;
    this.tile = tile().tileSize(this.tileProviderData.tileSize).clampX(false);
    this.zoom = zoom()
      .scaleExtent([1 << 8, 1 << 24])
      .extent([
        [0, 0],
        [this.width, this.height],
      ])
      .on("zoom", this.onZoom.bind(this));
    this.images = this.svg
      .append("g")
      .attr("pointer-events", "none")
      .selectAll("image");
    // should be last appended otherwise will get occluded
    this.binsContainer = this.svg.append("g");
    setTimeout(() => {
      this.currTransform = zoomIdentity
        .translate(this.width / 2, this.height / 2)
        .scale(-this.options.initialScale)
        .translate(...this.projection(this.options.initialCenter)!)
        .scale(-1);
      // @ts-ignore
      this.svg.call(this.zoom).call(
        // @ts-ignore
        this.zoom.transform,
        this.currTransform,
      );
    }, 0);
    this.container.append(this.svg.node()!);
  }

  public update(data: AccidentData[]) {
    this.currData = data;
    // create hexagon bins
    let bins = this.hexbin(
      data.reduce((acc, d) => {
        const proj = this.projection([d.longitude, d.latitude]);
        // otherwise when zoomed-in thousands of out-of-view
        // svg paths will still be rendered!
        if (
          !proj ||
          proj[0] < 0 ||
          proj[0] > this.width ||
          proj[1] < 0 ||
          proj[1] > this.height
        )
          return acc;
        acc.push(proj);
        return acc;
      }, new Array<[number, number]>()),
    );
    // update radius domain
    this.radius.domain([0, max(bins, (d) => d.length)!]);
    // filter very small hexagons
    bins = bins.filter((d) => this.radius(d.length) > 1);
    // update bins visualization
    this.binsContainer
      .selectAll("path")
      .data(bins)
      .join("path")
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .attr("d", (d) => this.hexbin.hexagon(this.radius(d.length)))
      .attr("fill", "red")
      .attr("opacity", 0.35);
  }

  protected override resize() {
    this.tile.extent([
      [0, 0],
      [this.width, this.height],
    ]);
    this.zoom.extent([
      [0, 0],
      [this.width, this.height],
    ]);
    this.hexbin.extent([
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
    this.projection
      .scale(this.currTransform.k / (2 * Math.PI))
      .translate([this.currTransform.x, this.currTransform.y]);
    // don't forget to call update again
    if (this.currData != undefined) this.update(this.currData);
    return this.svg.node()!;
  }

  private refreshTransform() {
    try {
      this.svg.call(this.zoom.transform as any, this.currTransform);
    } catch (e) {
      if (!(e instanceof TypeError)) throw e;
    }
  }
}

export { MapVisualization };
