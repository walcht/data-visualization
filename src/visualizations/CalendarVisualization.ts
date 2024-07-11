import { create, select, Selection } from "d3-selection";
import { ResizableVisualzation } from "../core/ResizableVisualization";
import { AccidentData } from "../interfaces/AccidentData";
import { group, range } from "d3-array";
import {
  timeDay,
  timeYear,
  utcMonday,
  utcMonth,
  utcMonths,
  utcYear,
} from "d3-time";
import { groupByYears } from "../preprocessing/groupByYears";
import { ScaleSequential, scaleSequential } from "d3-scale";
import { interpolateReds } from "d3-scale-chromatic";
import { utcFormat } from "d3-time-format";

type Dims2D = {
  width: number;
  height: number;
};

type DayData = {
  value: number;
  year: number;
  weekInYearIdx: number;
  dayInWeekIdx: number;
  date: Date;
};
/**
 * Creates a modular calendar visualization
 */
class CalendarVisualization extends ResizableVisualzation {
  private readonly svg: Selection<SVGSVGElement, undefined, null, undefined>;
  private readonly g: Selection<SVGGElement, undefined, null, undefined>;

  private readonly processedData = new Map<number, Map<number, DayData>>();
  private readonly yearlyColorScales = new Map<
    number,
    ScaleSequential<string>
  >();

  private selectedDay: Selection<SVGRectElement, any, any, any> | undefined;

  private readonly margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  } = {
    top: 20,
    right: 10,
    bottom: 10,
    left: 80,
  };

  public constructor(container: HTMLDivElement, data: AccidentData[]) {
    super(container);
    this.svg = create("svg").attr("width", "100%").attr("height", "100%");
    this.g = this.svg
      .append("g")
      .attr("transform", `translate(${this.margins.left},${this.margins.top})`);
    this.container.append(this.svg.node()!);
    this.preprocess(data);
    setTimeout(this.update.bind(this), 0);
  }

  private preprocess(data: AccidentData[]): void {
    const yearlyData = groupByYears(data);
    yearlyData.forEach((accidents, year) => {
      const perDayData = new Map<number, DayData>();
      const perDayGroup = group(accidents, (v) =>
        timeDay.count(timeYear(v.date), v.date),
      );
      let dailyMaxForThisYear = Number.NEGATIVE_INFINITY;
      perDayGroup.forEach((dailyAccidents, day) => {
        dailyMaxForThisYear = Math.max(
          dailyMaxForThisYear,
          dailyAccidents.length,
        );
        const date = new Date(dailyAccidents[0].date.toDateString());
        perDayData.set(day, {
          value: dailyAccidents.length,
          // utcMonay.count returns 0-based week number in year
          // with first day in week being Monday
          weekInYearIdx: utcMonday.count(utcYear(date), date),
          // getUTCDay returns 0-based week day number with 0 = Sunday
          // we want 0 = Monday so that weekend line is consecutive
          dayInWeekIdx: (date.getUTCDay() + 6) % 7,
          year: year,
          date: date,
        });
      });
      // fill gap days with empty data
      const perDayDataFilledGaps = new Map<number, DayData>();
      let i = 0;
      for (const k of [...perDayData.keys()].sort()) {
        const v = perDayData.get(k)!;
        if (k > i) {
          while (k > i) {
            const date = new Date(v.date);
            date.setDate(date.getDate() - (k - i));
            perDayDataFilledGaps.set(i, {
              value: 0,
              year: year,
              weekInYearIdx: utcMonday.count(utcYear(date), date),
              dayInWeekIdx: (date.getUTCDay() + 6) % 7,
              date: date,
            });
            ++i;
          }
        }
        perDayDataFilledGaps.set(k, v);
        ++i;
      }
      this.processedData.set(year, perDayDataFilledGaps);
      this.yearlyColorScales.set(
        year,
        scaleSequential(interpolateReds).domain([0, dailyMaxForThisYear]),
      );
    });
  }

  private update() {
    const yearDims: Dims2D = {
      width: this.width - (this.margins.left + this.margins.right),
      height:
        (this.height - (this.margins.top + this.margins.bottom)) /
        this.processedData.size,
    };
    const dayDims: Dims2D = {
      width: Math.floor(yearDims.width / (366 / 7 + 1)),
      height: Math.floor(yearDims.height / 7),
    };
    // create/update year containers
    const years = this.g
      .selectAll("g.year-container")
      .data(this.processedData)
      .join("g")
      .attr("class", "year-container")
      .attr("transform", (_, i) => `translate(0,${yearDims.height * i})`);
    // create/update year labels
    years.select("text.year-label").remove();
    years
      .append("text")
      .attr("class", "year-label")
      .attr("text-anchor", "end")
      .attr("font-size", "10px")
      .attr("x", -35)
      .attr("y", +10)
      .attr("font-weight", "bold")
      .text(([key]) => key);
    // create/update days labels
    years.select("g.day-labels-container").remove();
    years
      .append("g")
      .attr("transform", `translate(-5,+5)`)
      .attr("class", "day-labels-container")
      .attr("text-anchor", "end")
      .attr("font-size", "8px")
      .attr("font-weight", "bold")
      .selectAll()
      .data(range(0, 7))
      .join("text")
      .attr("y", (i) => i * dayDims.height)
      .attr("dy", "0.31em")
      .text((i) => ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"][i]);
    // create/update day rects
    years.select("g").remove();
    const rects = years
      .append("g")
      .selectAll("rect")
      // mapping of every day of this year to data aggregated for that day
      .data(([, v]) => v)
      .join("rect")
      .attr("width", dayDims.width - 1)
      .attr("height", dayDims.height - 1)
      .attr("x", ([, dayData]) => dayData.weekInYearIdx * dayDims.width)
      .attr("y", ([, dayData]) => dayData.dayInWeekIdx * dayDims.height)
      .attr("fill", ([, dayData]) => {
        return this.yearlyColorScales.get(dayData.year)!(dayData.value);
      })
      .on("click", this.onDaySelect.bind(this));
    // add tooltips
    rects
      .append("title")
      .text(
        ([, d]) =>
          `date: ${utcFormat("%B %d, %Y")(d.date)}\naccidents: ${d.value}`,
      );
    // create/update month labels containers
    this.g.select("g.month-labels-container").remove();
    const months = years
      .filter((_, i) => i == 0)
      .append("g")
      .attr("class", "month-labels-container")
      .selectAll()
      .data(([, values]) =>
        utcMonths(
          utcMonth(values.get(0)!.date),
          values.get(values.size - 1)!.date,
        ),
      )
      .join("g");
    months
      .append("text")
      .attr(
        "x",
        (d) => utcMonday.count(utcYear(d), utcMonday.ceil(d)) * dayDims.width,
      )
      .attr("y", -5)
      .text(utcFormat("%b"));
  }

  protected override resize(): void {
    this.update();
  }

  private onDaySelect(e: Event, d: [number, DayData]): void {
    if (this.selectedDay) this.selectedDay.classed("day-selection", false);
    this.selectedDay = select(e.currentTarget as any);
    this.selectedDay?.classed("day-selection", true);
    document.dispatchEvent(
      new CustomEvent("dayselectionevent", {
        detail: {
          data: d,
        },
      }),
    );
  }
}

export { CalendarVisualization };
