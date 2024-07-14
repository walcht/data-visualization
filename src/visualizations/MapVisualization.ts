import { AccidentData } from "../interfaces/AccidentData";
import { Selection, create } from "d3-selection";
import { tile, tileWrap } from "d3-tile";
import { ZoomBehavior, ZoomTransform, zoom, zoomIdentity } from "d3-zoom";
import { ResizableVisualzation } from "../core/ResizableVisualization";
import { geoMercator, GeoProjection } from "d3-geo";
import { Hexbin, hexbin } from "d3-hexbin";
import { ScalePower, scaleSqrt } from "d3-scale";
import { max } from "d3-array";
import { brush, BrushBehavior } from "d3-brush";

enum TileProviders {
  CARTODB_DARKMATTER,
  OPENSTREETMAP,
}

type TileProviderData = {
  url: (x: number, y: number, z: number) => string;
  tileSize: number;
};

type Options = {
  /**
   * initail tile layer provider. Defaults to CARTODB_DARKMATTER
   */
  initialTileProvider: TileProviders;
  /**
   * initial scale (a power of 2). Defaults to 1 << 14
   */
  initialScale: number;
  /**
   * initial center in WGS84 [lat, lon] coordinates in degrees. Defaults to [-2.983333, 53.400002]
   */
  initialCenter: [number, number];
};

type BinData = {
  /**
   * Projected X coordinates in view space (width) of a geoposition
   */
  x: number;
  /**
   * Projected Y coordinates in view space (width) of a geoposition
   */
  y: number;
  /**
   * Reference to original datapoint. Useful to avoid inverse operations
   * (e.g., for tooltips, selections, etc.)
   */
  datapoint: AccidentData;
};

type BrushSelection = [[number, number], [number, number]];

class MapVisualization extends ResizableVisualzation {
  private readonly svg: Selection<SVGSVGElement, undefined, null, undefined>;
  private readonly tile: any;
  private readonly zoom: ZoomBehavior<Element, unknown>;
  private readonly projection: GeoProjection;
  private readonly hexbin: Hexbin<BinData>;
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
      [
        TileProviders.CARTODB_DARKMATTER,
        {
          url: (x, y, z) =>
            `https://a.basemaps.cartocdn.com/dark_all/${z}/${x}/${y}.png`,
          tileSize: 256,
        },
      ],
    ]);
  private readonly brush: BrushBehavior<any>;
  private images: Selection<SVGImageElement, undefined, SVGElement, undefined>;
  private currTransform!: ZoomTransform;
  private currData: AccidentData[] | undefined = undefined;
  private zoomEnabled: boolean = true;
  private currSelection: BrushSelection | null = null;

  public options: Options;
  public tileProviderData: TileProviderData;

  /**
   * Creates an interactive raster-tiles-based map visualization
   *
   * @param container HTML container where the SVG is going to be appended to
   *
   * @param options optional initial configuration options
   *
   * @dispatches
   * `map-selection-update` event when a brush selection is done with at least one element selected
   * or when a deselection is done.
   */
  public constructor(container: HTMLDivElement, options?: Partial<Options>) {
    super(container);
    this.options = {
      initialTileProvider:
        (options && options.initialTileProvider) ||
        TileProviders.CARTODB_DARKMATTER,
      initialScale: (options && options.initialScale) || 1 << 14,
      initialCenter: (options && options.initialCenter) || [
        -2.983333, 53.400002,
      ], // Liverpool
    };
    this.svg = create("svg").attr("width", "100%").attr("height", "100%");
    this.projection = geoMercator()
      .scale(1 / (2 * Math.PI))
      .translate([0, 0]);
    this.hexbin = hexbin<BinData>()
      .extent([
        [0, 0],
        [this.width, this.height],
      ])
      .x((d) => d.x)
      .y((d) => d.y)
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
      this.enableZoom();
    }, 0);
    this.container.append(this.svg.node()!);
    // create brushing behaviour
    this.brush = brush().on("end", this.onBrush.bind(this));
    window.addEventListener("keypress", (e) => {
      if (e.key == "Control") return;
      if (e.key == "b")
        this.zoomEnabled ? this.disableZoom() : this.enableZoom();
    });
  }

  /**
   * Updates the visualization to reflect the provided data
   * @param data AccidentsData array
   */
  public update(data: AccidentData[]) {
    this.currData = data;
    // create hexagon bins
    let bins = this.hexbin(
      data.reduce((acc, d) => {
        const proj = this.projection([d.longitude, d.latitude]);
        // otherwise when zoomed-in thousands of out-of-view
        // svg paths/circles will still be rendered => very poor performance
        if (
          !proj ||
          proj[0] < 0 ||
          proj[0] > this.width ||
          proj[1] < 0 ||
          proj[1] > this.height
        )
          return acc;
        acc.push({
          x: proj[0],
          y: proj[1],
          datapoint: d,
        });
        return acc;
      }, new Array<BinData>()),
    );
    // update radius domain (max is only for this view - not the entire dataset!)
    this.radius.domain([0, max(bins, (d) => d.length)!]);
    // filter very small hexagons
    bins = bins.filter((d) => this.radius(d.length) > 1);
    // update bins visualization
    this.binsContainer
      .selectAll("circle")
      .data(bins)
      .join("circle")
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .attr("r", (d) => this.radius(d.length))
      .attr("fill", "#e84118")
      .attr("opacity", 0.55);
    // dispatch selection update event even if there is no currenct selection
    this.onBrush({ selection: this.currSelection });
  }

  protected override resize() {
    const view: [[number, number], [number, number]] = [
      [0, 0],
      [this.width, this.height],
    ];
    this.tile.extent(view);
    this.zoom.extent(view);
    this.hexbin.extent(view);
    this.brush.extent(view);
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
    if (!this.zoomEnabled) return;
    try {
      this.svg.call(this.zoom.transform as any, this.currTransform);
    } catch (e) {
      if (!(e instanceof TypeError)) throw e;
    }
  }

  private onBrush({ selection }: { selection: BrushSelection | null }): void {
    this.currSelection = selection;
    if (!this.currSelection) {
      this.binsContainer
        .selectAll("circle")
        .attr("stroke", "none")
        .attr("opacity", 0.55);
      document.dispatchEvent(
        new CustomEvent("map-selection-update", {
          detail: { data: this.currData },
        }),
      );
      return;
    }
    const [[x0, y0], [x1, y1]] = this.currSelection;
    const data = (
      this.binsContainer
        .selectAll("circle")
        .attr("stroke", "none")
        .attr("opacity", 0.55)
        .filter((d: any) => d.x >= x0 && d.x <= x1 && d.y >= y0 && d.y <= y1)
        .attr("stroke", "#f5f6fa")
        .attr("stroke-width", "2px")
        .attr("opacity", 0.95)
        .data()
        .flat() as Array<BinData>
    ).map((d) => d.datapoint);
    if (data)
      document.dispatchEvent(
        new CustomEvent("map-selection-update", { detail: { data: data } }),
      );
  }

  /**
   * Enables zoom behaviour and disables brushing
   */
  public enableZoom(): void {
    // disable brushing
    try {
      this.svg.call(this.brush.clear as any);
    } catch (e) {
      if (!(e instanceof TypeError)) throw e;
    }
    this.svg.on(".brush", null);
    this.zoomEnabled = true;
    this.svg.call(this.zoom as any);
    // remove rects added by brush
    this.svg.selectAll("rect").remove();
    if (this.currSelection)
      document.dispatchEvent(
        new CustomEvent("map-selection-update", {
          detail: { data: this.currData },
        }),
      );
  }

  /**
   * Disables zoom behaviour and enables brushing
   */
  public disableZoom(): void {
    // disable zoom
    this.zoomEnabled = false;
    this.svg.on(".zoom", null);
    // enable brushing
    this.svg.call(this.brush as any);
  }
}

export { MapVisualization };
