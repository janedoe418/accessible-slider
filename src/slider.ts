import {
  defaultClassNames,
  defaultIcons,
  defaultLabels,
  getLabel,
  type Lang,
} from "./config.js";

function debounce<T extends (...args: any[]) => void>(func: T, wait = 300) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return function (this: any, ...args: Parameters<T>) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), wait);
  };
}

export interface AccessibleSliderOptions {
  autoplay?: boolean;
  autoplaySpeed?: number;
  slidesToShow?: number;
  breakpoints?: {
    [width: number]: Partial<Omit<AccessibleSliderOptions, "breakpoints">>;
  };
  loop?: boolean;
  arrows?: boolean;
  dots?: boolean;
  arrowLabels?: {
    prev?: string;
    next?: string;
  };
  dotLabel?: string;
  a11y?: {
    regionLabel?: string;
    buttonRegionLabel?: string;
    live?: boolean;
  };
  classNames?: {
    root?: string;
    track?: string;
    slide?: string;
    arrow?: string;
    dots?: string;
    dot?: string;
    active?: string;
    pause?: string;
  };
  lang?: Lang;
  labels?: Partial<(typeof defaultLabels)["ja"]>;
  icons?: {
    pause?: string;
    play?: string;
  };
}

export class AccessibleSlider {
  root: HTMLElement;
  options: AccessibleSliderOptions;
  originalOptions: AccessibleSliderOptions;
  items: HTMLElement[] = [];
  currentIndex: number = 0;
  track!: HTMLElement;
  dotsContainer?: HTMLElement;
  autoplayTimer?: ReturnType<typeof setInterval>;
  isPaused: boolean = false;

  constructor(root: HTMLElement, options: AccessibleSliderOptions = {}) {
    this.root = root;
    this.options = { ...options };
    this.originalOptions = { ...this.options };
    this.updateOptionsForCurrentBreakpoint();
    this.init();

    window.addEventListener(
      "resize",
      debounce(() => {
        this.updateOptionsForCurrentBreakpoint();
        this.updateSliderSize();
      }, 200)
    );
  }

  public init() {
    this.setupTrack();
    this.setupAria();
    this.setupNav();
    this.setupDots();
    this.setupAutoplay();
    this.updateSliderSize();
  }

  private getClass(name: keyof typeof defaultClassNames) {
    return this.options.classNames?.[name] || defaultClassNames[name];
  }

  private getSlides() {
    const slideSelector = "." + this.getClass("slide");
    return Array.from(
      this.root.querySelectorAll(slideSelector)
    ) as HTMLElement[];
  }

  private setupTrack() {
    let track = this.root.querySelector(
      "." + this.getClass("track")
    ) as HTMLElement | null;
    if (!track) {
      track = document.createElement("div");
      track.className = this.getClass("track");
      this.getSlides().forEach((item) => track!.appendChild(item));
      this.root.insertBefore(track, this.root.firstChild);
    }
    this.track = track;
    this.items = Array.from(
      track.querySelectorAll("." + this.getClass("slide"))
    ) as HTMLElement[];
  }

  private setupAria() {
    this.items.forEach((item, index) => {
      item.setAttribute(
        "aria-label",
        getLabel("slide", {
          lang: this.options.lang,
          override: this.options.labels,
          params: { i: index + 1, total: this.items.length },
        })
      );
      item.setAttribute("aria-hidden", "true");
      item.classList.remove(this.getClass("active"));
      item.removeAttribute("aria-live");
    });
    if (this.items.length > 0) {
      this.items[0].setAttribute("aria-hidden", "false");
      this.items[0].classList.add(this.getClass("active"));
      this.items[0].setAttribute("aria-live", "polite");
    }
  }

  private setupNav() {
    const nav = this.root.querySelector("." + this.getClass("arrow"));
    if (!nav) return;
    nav.setAttribute(
      "aria-label",
      getLabel("buttonRegion", {
        lang: this.options.lang,
        override: this.options.labels,
      })
    );
    const btns = nav.querySelectorAll("button");
    if (btns[0]) {
      btns[0].setAttribute(
        "aria-label",
        getLabel("prev", {
          lang: this.options.lang,
          override: this.options.labels,
        })
      );
      btns[0].onclick = () => this.gotoSlide(this.currentIndex - 1);
    }
    if (btns[1]) {
      btns[1].setAttribute(
        "aria-label",
        getLabel("next", {
          lang: this.options.lang,
          override: this.options.labels,
        })
      );
      btns[1].onclick = () => this.gotoSlide(this.currentIndex + 1);
    }
  }

  private setupDots() {
    if (!this.options.dots) return;
    let dots = this.root.parentNode?.querySelector(
      "." + this.getClass("dots")
    ) as HTMLElement | null;
    if (!dots) {
      dots = document.createElement("div");
      dots.className = this.getClass("dots");
      this.root.parentNode?.insertBefore(dots, this.root.nextSibling);
    }
    this.dotsContainer = dots;
    this.renderDots();
  }

  private setupAutoplay() {
    if (this.options.autoplay) {
      this.setupPauseButton();
      this.startAutoplay();
    }
  }

  private setupPauseButton() {
    const nav = this.root.querySelector("." + this.getClass("arrow"));
    if (!nav) return;
    let pauseBtn = nav.querySelector(
      "." + this.getClass("pause")
    ) as HTMLButtonElement | null;
    if (!pauseBtn) {
      pauseBtn = document.createElement("button");
      pauseBtn.className = this.getClass("pause");
      pauseBtn.innerHTML = this.getPauseIcon();
      pauseBtn.setAttribute(
        "aria-label",
        getLabel("pause", {
          lang: this.options.lang,
          override: this.options.labels,
        })
      );
      nav.appendChild(pauseBtn);
    }
    pauseBtn.onclick = () => {
      if (this.isPaused) {
        this.isPaused = false;
        this.startAutoplay();
        pauseBtn!.innerHTML = this.getPauseIcon();
        pauseBtn!.setAttribute(
          "aria-label",
          getLabel("pause", {
            lang: this.options.lang,
            override: this.options.labels,
          })
        );
      } else {
        this.isPaused = true;
        this.stopAutoplay();
        pauseBtn!.innerHTML = this.getPlayIcon();
        pauseBtn!.setAttribute(
          "aria-label",
          getLabel("play", {
            lang: this.options.lang,
            override: this.options.labels,
          })
        );
      }
    };
  }

  private getPauseIcon() {
    return this.options.icons?.pause || defaultIcons.pause;
  }
  private getPlayIcon() {
    return this.options.icons?.play || defaultIcons.play;
  }

  private renderDots() {
    if (!this.dotsContainer) return;
    this.dotsContainer.innerHTML = "";
    this.dotsContainer.setAttribute("role", "tablist");
    this.items.forEach((item, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("role", "tab");
      btn.setAttribute(
        "aria-label",
        getLabel("dot", {
          lang: this.options.lang,
          override: this.options.labels,
          params: { i: i + 1, total: this.items.length },
        })
      );
      btn.setAttribute("tabindex", i === this.currentIndex ? "0" : "-1");
      btn.setAttribute(
        "aria-selected",
        i === this.currentIndex ? "true" : "false"
      );
      btn.textContent = String(i + 1);
      if (i === this.currentIndex) btn.classList.add(this.getClass("active"));
      btn.onclick = () => this.gotoSlide(i);
      this.dotsContainer!.appendChild(btn);
    });
  }

  public updateSliderSize() {
    if (!this.track || !this.items.length) return;
    const containerWidth = this.root.clientWidth;
    this.items.forEach((item) => (item.style.width = containerWidth + "px"));
    this.track.style.width = containerWidth * this.items.length + "px";
    this.updateTrackPosition();
  }

  private updateTrackPosition() {
    if (!this.track) return;
    const containerWidth = this.root.clientWidth;
    this.track.style.transform = `translateX(-${
      this.currentIndex * containerWidth
    }px)`;
  }

  public startAutoplay() {
    if (this.isPaused) return;
    this.stopAutoplay();
    const speed = this.options.autoplaySpeed || 3000;
    this.autoplayTimer = setInterval(() => {
      this.gotoSlide(this.currentIndex + 1);
    }, speed);
  }

  public stopAutoplay() {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = undefined;
    }
  }

  public gotoSlide(index: number) {
    if (!this.options.loop) {
      if (index < 0 || index >= this.items.length) return;
    } else {
      if (index < 0) index = this.items.length - 1;
      if (index >= this.items.length) index = 0;
    }
    this.items.forEach((item, i) => {
      const isActive = i === index;
      item.setAttribute("aria-hidden", isActive ? "false" : "true");
      item.classList.toggle(this.getClass("active"), isActive);
      if (isActive) item.setAttribute("aria-live", "polite");
      else item.removeAttribute("aria-live");
    });
    this.currentIndex = index;
    this.updateTrackPosition();
    if (this.options.dots) this.renderDots();
  }

  public updateOptionsForCurrentBreakpoint() {
    if (!this.originalOptions) this.originalOptions = { ...this.options };
    const width = window.innerWidth;
    let matched: number | null = null;
    let bps = this.originalOptions.breakpoints;
    if (!bps) return;
    for (const bp in bps) {
      const bpNum = Number(bp);
      if (width <= bpNum && (matched === null || bpNum < matched))
        matched = bpNum;
    }
    this.options = { ...this.originalOptions };
    if (matched !== null) Object.assign(this.options, bps[matched]);
  }
}
