import { AccidentData } from "../interfaces/AccidentData";
import { groupByYears } from "../preprocessing/groupByYears";

type Options = {
  interval: number;
  loop: boolean;
  autoplay: boolean;
};

class DatePlayer {
  private readonly playStopBtn: HTMLButtonElement;
  private readonly label: HTMLLabelElement;
  private readonly input: HTMLInputElement;
  private readonly loopCheckbox: HTMLInputElement;
  private readonly datalist: HTMLDataListElement;
  private readonly data: AccidentData[];
  private readonly datedData: Map<number, AccidentData[]>;

  private dateMapping: number[];

  private isPlaying: boolean = false;
  private id: number | undefined = undefined;

  public options: Options;

  public constructor(
    input: HTMLInputElement,
    playStopBtn: HTMLButtonElement,
    loopCheckbox: HTMLInputElement,
    label: HTMLLabelElement,
    datalist: HTMLDataListElement,
    data: AccidentData[],
    options?: Partial<Options>,
  ) {
    this.input = input;
    this.playStopBtn = playStopBtn;
    this.label = label;
    this.loopCheckbox = loopCheckbox;
    this.datalist = datalist;
    this.data = data;
    this.options = {
      interval: (options && options.interval) || 1000,
      loop: (options && options.loop) || false,
      autoplay: (options && options.autoplay) || true,
    };
    this.datedData = groupByYears(this.data);
    this.dateMapping = [...this.datedData.keys()].sort();
    this.input.min = "0";
    this.input.max = ([...this.datedData.keys()].length - 1).toString();
    this.input.addEventListener("change", this.onInput.bind(this));
    for (let i = 0; i <= parseInt(this.input.max, 10); ++i) {
      const opt = document.createElement("option");
      opt.value = i.toString();
      opt.label = this.dateMapping[i].toString();
      this.datalist.appendChild(opt);
    }
    setTimeout(() => {
      this.input.value = "0";
      this.onInput();
      if (this.options.autoplay) this.play();
    }, 0);
    this.playStopBtn.addEventListener("click", this.onPlayStop.bind(this));
    this.loopCheckbox.addEventListener("change", this.onLoopToggle.bind(this));
  }

  private update(): void {
    if (this.options.loop) {
      this.id = setTimeout(() => {
        this.input.value = `${
          (parseInt(this.input.value, 10) + 1) %
          (parseInt(this.input.max, 10) + 1)
        }`;
        this.onInput();
        this.update();
      }, this.options.interval);
      return;
    }
    const newInputVal = parseInt(this.input.value, 10) + 1;
    if (newInputVal > parseInt(this.input.max, 10)) {
      this.stop();
      return;
    }
    this.id = setTimeout(() => {
      this.input.value = newInputVal.toString();
      this.onInput();
      this.update();
    }, this.options.interval);
  }

  public play(): void {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.playStopBtn.classList.remove("stopped");
    this.playStopBtn.classList.add("playing");
    this.playStopBtn.textContent = "Stop";
    if (parseInt(this.input.value, 10) == parseInt(this.input.max)) {
      this.input.value = "0";
      this.onInput();
    }
    this.update();
  }

  public stop(): void {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    this.playStopBtn.classList.remove("playing");
    this.playStopBtn.classList.add("stopped");
    this.playStopBtn.textContent = "Play";
    clearTimeout(this.id);
  }

  private onPlayStop(): void {
    this.isPlaying ? this.stop() : this.play();
  }

  private onInput(): void {
    const dateKey = this.dateMapping[parseInt(this.input.value, 10)];
    document.dispatchEvent(
      new CustomEvent("date-update", {
        detail: {
          data: this.datedData.get(dateKey),
        },
      }),
    );
    this.label.textContent = `${dateKey}`;
  }

  private onLoopToggle(): void {
    this.options.loop = this.loopCheckbox.checked;
  }
}

export { DatePlayer };
