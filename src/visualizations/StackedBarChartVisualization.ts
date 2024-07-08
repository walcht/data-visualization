import { Selection, create } from "d3-selection";
import { ResizableVisualzation } from "../core/ResizableVisualization";
import { AccidentData } from "../interfaces/AccidentData";
import {
  ScaleBand,
  ScaleLinear,
  ScaleOrdinal,
  scaleBand,
  scaleLinear,
  scaleOrdinal,
} from "d3-scale";
import { axisLeft, axisTop } from "d3-axis";
import { formatPrefix } from "d3-format";

class StackedBarChartVisualization extends ResizableVisualzation {
  private readonly svg: Selection<SVGSVGElement, undefined, null, undefined>;
  private readonly x: ScaleLinear<any, number>;
  private readonly y: ScaleBand<any>;
  private readonly color: ScaleOrdinal<any, string>;
  private readonly g: Selection<SVGGElement, undefined, null, undefined>;

  private readonly outerGroupBy: (d: AccidentData) => any;
  private readonly outerGroupByKeyStringifier: (k: any) => string;
  private readonly innerGroupBy: (d: AccidentData) => any;
  private readonly innerGroupByKeyColor: (k: any) => string;

  private currentData: AccidentData[] | undefined = undefined;

  private readonly margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  } = {
    top: 20,
    right: 20,
    bottom: 0,
    left: 175,
  };
  public constructor(
    container: HTMLDivElement,
    outerGroupBy: (d: AccidentData) => any,
    outerGroupByKeyStringifier: (k: any) => string,
    innerGroupBy: (d: AccidentData) => any,
    innerGroupByColor: (k: any) => string,
  ) {
    super(container);
    this.svg = create("svg").attr("width", "100%").attr("height", "100%");
    this.x = scaleLinear();
    this.y = scaleBand().padding(0.2);
    this.color = scaleOrdinal<number | string, string>();
    // create the rects SVG g container
    this.g = this.svg.append("g");
    this.innerGroupBy = innerGroupBy;
    this.outerGroupBy = outerGroupBy;
    this.outerGroupByKeyStringifier = outerGroupByKeyStringifier;
    this.innerGroupByKeyColor = innerGroupByColor;
    this.container.append(this.svg.node()!);
  }

  public update(data: AccidentData[]) {
    const innerGroupKeys = new Set<any>();
    // preprocess the data
    const _preprocessed = data.reduce((acc, d) => {
      const outer = this.outerGroupBy(d);
      const inner = this.innerGroupBy(d);
      if (acc.get(outer) == undefined) acc.set(outer, new Map());
      const t = acc.get(outer)!;
      if (t.get(inner) == undefined) t.set(inner, 0);
      t.set(inner, t.get(inner)! + 1);
      innerGroupKeys.add(inner);
      return acc;
    }, new Map<any, Map<any, number>>());
    // compute max occurences
    let maxOccurences = Number.NEGATIVE_INFINITY;
    _preprocessed.forEach((v) => {
      maxOccurences = Math.max(
        [...v.values()].reduce((acc, v) => acc + v, 0),
        maxOccurences,
      );
    });
    // to make visualizing inner groupings easier, we pre-compute starting
    // and ending occurences for each inner rect
    const preprocessed = new Map<
      any,
      Map<any, { parentKey: number; start: number; end: number }>
    >();
    for (const [k0, v0] of _preprocessed) {
      // sort in descending order
      const entries = [...v0.entries()]
        .sort((a, b) => b[1] - a[1])
        .reduce((acc, [k, v], i) => {
          if (i == 0) {
            acc.push([k, { parentKey: k0, start: 0, end: v }]);
          } else {
            acc.push([
              k,
              {
                parentKey: k0,
                start: acc[i - 1][1].end,
                end: acc[i - 1][1].end + v,
              },
            ]);
          }
          return acc;
        }, new Array<[any, { parentKey: any; start: number; end: number }]>());
      preprocessed.set(k0, new Map(entries));
    }
    // update the x scale domain and x-axis
    this.x.domain([0, maxOccurences]);
    this.svg.select<SVGGElement>("g.x-axis").remove();
    this.svg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${this.margins.top})`)
      .call(
        axisTop(this.x)
          .ticks(this.width / 80)
          .tickFormat(formatPrefix(".1", 1e3)),
      )
      .call((g) =>
        g
          .selectAll(".tick line")
          .clone()
          .attr("y2", this.height - this.margins.top - this.margins.bottom)
          .attr("stroke-opacity", 0.1),
      );
    // update the y scale domain and y-axis
    this.y.domain(preprocessed.keys());
    this.svg.select<SVGGElement>("g.y-axis").remove();
    this.svg
      .append("g")
      .attr("class", "y-axis")
      .attr("transform", `translate(${this.margins.left},0)`)
      .call(axisLeft(this.y).tickFormat(this.outerGroupByKeyStringifier))
      .call((g) => g.selectAll(".domain").remove());
    // set color scale (could be done in constructor but not nicely...)
    this.color
      .domain(innerGroupKeys)
      .range(
        [...innerGroupKeys.values()].map((v) => this.innerGroupByKeyColor(v)),
      );
    // update the rects
    this.g
      .selectAll("g")
      .data(preprocessed)
      .join("g")
      .attr("x", 0)
      .attr("y", ([k]) => this.y(k)!)
      .selectAll("rect")
      .data(([, v]) => v)
      .join("rect")
      // color according to inner grouping
      .attr("fill", ([k]) => this.color(k))
      .attr("x", ([, v]) => this.x(v.start))
      .attr("y", ([, v]) => this.y(v.parentKey)!)
      .attr("width", ([, v]) => this.x(v.end) - this.x(v.start))
      .attr("height", this.y.bandwidth());
    this.currentData = data;
  }

  protected override resize(): void {
    this.x.range([this.margins.left, this.width - this.margins.right]);
    this.y.range([this.margins.top, this.height - this.margins.bottom]);
    // call update again if there is data currently visualized
    if (this.currentData) this.update(this.currentData);
  }
}

export { StackedBarChartVisualization };
