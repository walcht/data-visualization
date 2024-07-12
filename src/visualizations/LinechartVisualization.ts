import { Selection, create } from "d3-selection";
import { ResizableVisualzation } from "../core/ResizableVisualization";
import { AccidentData } from "../interfaces/AccidentData";
import { ScaleLinear, scaleLinear, ScaleTime, scaleUtc } from "d3-scale";
import { axisBottom, axisLeft } from "d3-axis";
import { group, extent } from "d3-array";
import { utcDay, utcHour } from "d3-time";
import { utcFormat } from "d3-time-format";
import { curveStepAfter, line } from "d3-shape";

class LineChartVisualization extends ResizableVisualzation {
  private readonly svg: Selection<SVGSVGElement, undefined, null, undefined>;
  private readonly path: Selection<SVGPathElement, undefined, null, undefined>;
  private readonly g: Selection<SVGGElement, undefined, null, undefined>;
  private readonly x: ScaleTime<number, number>;
  private readonly y: ScaleLinear<number, number>;

  private currentData: AccidentData[] | undefined = undefined;

  private readonly margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  } = {
    top: 30,
    right: 20,
    bottom: 40,
    left: 80,
  };

  public constructor(container: HTMLDivElement) {
    super(container);
    this.svg = create("svg").attr("width", "100%").attr("height", "100%");
    this.path = this.svg
      .append("path")
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5);
    this.g = this.svg
      .append("g")
      .attr("stroke", "#000")
      .attr("stroke-opacity", 0.2);
    this.x = scaleUtc();
    this.y = scaleLinear();
    this.container.append(this.svg.node()!);
  }

  public update(data: AccidentData[]) {
    this.currentData = data;
    // pre-process received data
    const hours = utcHour.range(
      utcDay.floor(data[0].date),
      utcDay.ceil(data[0].date),
    );
    const hourlyGrouped = new Map<Date, AccidentData[]>();
    const tmp = group(data, (d) => utcHour(d.date));
    // order the date group-by
    [...tmp.keys()].sort().forEach((hour) => {
      hourlyGrouped.set(hour, tmp.get(hour)!);
    });
    let hourlyMax = Number.NEGATIVE_INFINITY;
    hourlyGrouped.forEach((v) => {
      hourlyMax = Math.max(hourlyMax, v.length);
    });
    // update X axis contain
    this.x.domain([hours[0], hours[hours.length - 1]]);
    this.svg.select<SVGGElement>("g.x-axis").remove();
    this.svg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${this.height - this.margins.bottom})`)
      .call(axisBottom(this.x).tickFormat(utcFormat("%H") as any))
      .call((g) =>
        g
          .append("text")
          .attr("text-anchor", "end")
          .attr("x", this.width - this.margins.right)
          .attr("y", this.margins.bottom - 15)
          .text("→ Day Hour"),
      );
    // update Y axis domain and y axis container
    this.y.domain([0, hourlyMax]);
    this.svg.select<SVGGElement>("g.y-axis").remove();
    this.svg
      .append("g")
      .attr("class", "y-axis")
      .attr("transform", `translate(${this.margins.left},0)`)
      .call(axisLeft(this.y))
      .call((g) =>
        g
          .append("text")
          .attr("text-anchor", "start")
          .attr("x", -this.margins.left + 10)
          .attr("y", 15)
          .text("↑ Number Accidents"),
      );
    // update path
    const orderedPoints = new Array<[number, number]>();
    hourlyGrouped.forEach((v, hour) => {
        orderedPoints.push([this.x(hour), this.y(v.length)]);
    });
    orderedPoints.sort((a, b) => a[0] - b[0]);
    const l = line<[number, number]>()
      .x((d) => d[0])
      .y((d) => d[1])
      .curve(curveStepAfter);
    this.path.attr("d", l(orderedPoints));
    // update dots
    this.g
      .selectAll("circle")
      .data(hourlyGrouped)
      .join("circle")
      .attr("cx", ([hour]) => this.x(hour))
      .attr("cy", ([, v]) => this.y(v.length))
      .attr("fill", "white")
      .attr("r", 2.5)
      .append("title")
      .text(
        ([hour, v]) =>
          `hour: ${utcFormat("%H:%M")(hour)}\nday: ${utcFormat("%B %d, %Y")(
            hour,
          )}\naccidents: ${v.length}`,
      );
  }

  protected override resize(): void {
    this.x.range([this.margins.left, this.width - this.margins.right]);
    this.y.range([this.height - this.margins.bottom, this.margins.top]);
    // call update again if there is data currently visualized
    if (this.currentData) this.update(this.currentData);
  }
}

export { LineChartVisualization };
