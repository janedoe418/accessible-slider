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
    status?: string;
  };
  lang?: Lang;
  labels?: Partial<(typeof defaultLabels)["ja"]>;
  icons?: {
    pause?: string;
    play?: string;
  };
}

export class AccessibleSlider {
  // 1. プロパティ定義
  // -------------------------------------------------------------
  root: HTMLElement;
  options: AccessibleSliderOptions;
  originalOptions: AccessibleSliderOptions;
  items: HTMLElement[] = [];
  currentIndex: number = 0;
  track!: HTMLElement;
  dotsContainer?: HTMLElement;
  autoplayTimer?: ReturnType<typeof setInterval>;
  isPaused: boolean = false;
  pauseButton?: HTMLButtonElement;


  // 2. コンストラクター
  // -------------------------------------------------------------
  constructor(root: HTMLElement, options: AccessibleSliderOptions = {}) {
    this.root = root;
    this.options = { ...options };
    this.originalOptions = { ...this.options };
    this.updateOptionsForCurrentBreakpoint(); // 初期化の一部
    this.init(); // 全体の初期化処理を呼び出す

    // リサイズイベントのリスナーは、クラスの外部との主要な接点なので、コンストラクタの最後に置く
    window.addEventListener(
      "resize",
      debounce(() => {
        this.updateOptionsForCurrentBreakpoint();
        this.updateSliderSize();
      }, 200)
    );
  }


  // 3. パブリックAPI (外部から直接呼び出される主要メソッド)
  // -------------------------------------------------------------

  public init() {
    // コンポーネントの初期化フロー全体を制御
    this.setupTrack();
    this.setupAria();
    this.setupNav();
    this.setupDots();
    this.setupAutoplay();
    this.updateSliderSize();

    // 全体のA11y属性とキーボードナビゲーションの追加
    this.root.setAttribute("tabindex", "0");
    this.root.setAttribute("role", "region");
    this.root.setAttribute(
      "aria-label",
      getLabel("regionLabel", {
        lang: this.options.lang,
        override: this.options.labels,
      })
    );
    this.addKeyboardNavigation();

    this.updateSlideStatusAnnouncement();
  }

  public gotoSlide(index: number) {

    if (!this.items.length || index === this.currentIndex) {
      return;
    }

    // スライド遷移の主要ロジック
    const slidesToShow = this.options.slidesToShow ?? 1;
    const maxIndex = this.items.length - slidesToShow;

    // ループ処理
    if (!this.options.loop) {
      if (index < 0) index = 0;
      if (index > maxIndex) index = maxIndex;
    } else {
      if (index < 0) index = maxIndex;
      if (index > maxIndex) index = 0;
    }

    // ARIA属性とアクティブクラスの更新
    this.items.forEach((item, i) => {
      const isActive = i >= index && i < index + slidesToShow;
      item.setAttribute("aria-hidden", isActive ? "false" : "true");
      item.classList.toggle(this.getClass("active"), isActive);
      item.removeAttribute("aria-live"); // 常に削除されるようにする
    });

    this.currentIndex = index;
    this.updateTrackPosition(); // DOM更新
    if (this.options.dots) this.renderDots(); // ドットの更新
    this.updateSlideStatusAnnouncement(); // ステータスアナウンス
    this.preloadNextSlideImages(); // 次のスライド画像をプリロード

    // ユーザー操作による自動再生の再開/リセット
    if (this.options.autoplay && !this.isPaused) {
      this.stopAutoplay();
      setTimeout(() => {
        if (!this.isPaused) {
          this.startAutoplay();
        }
      }, 5000);
    }
  }

  public startAutoplay() {
    // 自動再生の開始
    if (this.isPaused) return;
    this.stopAutoplay(); // 既存のタイマーをクリア

    const speed = this.shouldReduceMotion() ? 99999999 : (this.options.autoplaySpeed || 3000); // 非常に長い秒数で実質無効化

    this.autoplayTimer = setInterval(() => {
      this.gotoSlide(this.currentIndex + 1);
    }, speed);
  }

  public stopAutoplay() {
    // 自動再生の停止
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = undefined;
    }
  }

  public updateSliderSize() {
    // スライダーサイズの更新（リサイズ時など）
    if (!this.track || !this.items.length) return;
    const slidesToShow = this.options.slidesToShow ?? 1;
    const containerWidth = this.root.clientWidth;
    const slideWidth = containerWidth / slidesToShow;

    this.items.forEach((item) => (item.style.width = `${slideWidth}px`));
    this.track.style.width = `${slideWidth * this.items.length}px`;
    this.updateTrackPosition();
  }


  // 4. プライベートなセットアップメソッド (コンストラクタやinitから呼ばれる初期設定)
  // -------------------------------------------------------------

  private setupTrack() {
    // トラック要素の準備とスライドアイテムの取得
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
    // 初期ARIA属性の設定
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
    // 初期のアクティブスライドの設定 (aria-live は gotoSlide で管理されるため、ここでは不要)
    if (this.items.length > 0) {
      this.items[0].setAttribute("aria-hidden", "false");
      this.items[0].classList.add(this.getClass("active"));
      // this.items[0].setAttribute("aria-live", "polite"); // gotoSlide で管理
    }
  }

  private setupNav() {
    // ナビゲーション（矢印ボタン）の設定
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
    // ドットナビゲーションの設定
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
    this.renderDots(); // 初回レンダリングを呼び出す
  }

  private setupAutoplay() {
    // 自動再生関連の初期設定
    if (this.options.autoplay) {
      this.setupPauseButton(); // Pauseボタンの準備
      if (!this.isPaused) { // 初期状態が一時停止でなければ開始
        this.startAutoplay();
      }
    }
  }

  private setupPauseButton() {
    // Pause/Playボタンの準備
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
    this.pauseButton = pauseBtn;
    this.pauseButton.onclick = () => this.toggleAutoplay();
  }


  // 5. プライベートなヘルパー/ユーティリティメソッド (他のメソッドから呼ばれる補助関数)
  // -------------------------------------------------------------

  private getClass(name: keyof typeof defaultClassNames) {
    // クラス名を取得
    return this.options.classNames?.[name] || defaultClassNames[name];
  }

  private shouldUseLiveRegion(): boolean {
    // options.a11y.live が undefined または true の場合に true を返す
    // false の場合のみ false を返す
    return this.options.a11y?.live !== false;
  }

  // Reduced Motion を考慮
  private shouldReduceMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private getSlides() {
    // スライド要素のリストを取得
    const slideSelector = "." + this.getClass("slide");
    return Array.from(
      this.root.querySelectorAll(slideSelector)
    ) as HTMLElement[];
  }

  private getPauseIcon() {
    // PauseアイコンのSVGを取得
    return this.options.icons?.pause || defaultIcons.pause;
  }

  private getPlayIcon() {
    // PlayアイコンのSVGを取得
    return this.options.icons?.play || defaultIcons.play;
  }

  private renderDots() {
    // ドットナビゲーションのレンダリング（状態更新に伴い再描画される）
    if (!this.dotsContainer) return;
    this.dotsContainer.innerHTML = "";
    this.dotsContainer.setAttribute("role", "group");
    this.dotsContainer.setAttribute("aria-label", getLabel("dotRegion", {
      lang: this.options.lang,
      override: this.options.labels,
    }));

    const slidesToShow = this.options.slidesToShow ?? 1;
    const dotCount = Math.max(1, this.items.length - slidesToShow + 1);

    for (let i = 0; i < dotCount; i++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = this.getClass("dot");
      btn.setAttribute("role", "button");
      btn.setAttribute(
        "aria-label",
        getLabel("dot", {
          lang: this.options.lang,
          override: this.options.labels,
          params: { i: i + 1, total: dotCount },
        })
      );
      btn.setAttribute("tabindex", i === this.currentIndex ? "0" : "-1");
      // btn.setAttribute("aria-selected", i === this.currentIndex ? "true" : "false"); // role="button" なら不要
      btn.textContent = String(i + 1);
      if (i === this.currentIndex) btn.classList.add(this.getClass("active"));
      btn.onclick = () => this.gotoSlide(i);

      btn.addEventListener("keydown", (e) => {
        let newIndex = i;
        switch (e.key) {
          case "ArrowLeft": e.preventDefault(); newIndex = (i === 0) ? dotCount - 1 : i - 1; break;
          case "ArrowRight": e.preventDefault(); newIndex = (i === dotCount - 1) ? 0 : i + 1; break;
          case "Home": e.preventDefault(); newIndex = 0; break;
          case "End": e.preventDefault(); newIndex = dotCount - 1; break;
          case "Enter":
          case "Space": e.preventDefault(); this.gotoSlide(i); return;
        }

        if (newIndex !== i) {
          this.gotoSlide(newIndex);
          const newActiveDot = this.dotsContainer?.querySelector(
            `.${this.getClass("dot")}[tabindex="0"]`
          ) as HTMLButtonElement;
          if (newActiveDot) {
            newActiveDot.focus();
          }
        }
      });
      this.dotsContainer!.appendChild(btn);
    }
  }

  private updateTrackPosition() {
    // トラックの位置を更新
    if (!this.track) return;
    const slidesToShow = this.options.slidesToShow ?? 1;
    const containerWidth = this.root.clientWidth;
    const slideWidth = containerWidth / slidesToShow;
    this.track.style.transform = `translateX(-${this.currentIndex * slideWidth}px)`;
  }

  private updateSlideStatusAnnouncement() {
    // スライドの状態をスクリーンリーダーに読み上げさせる
    if (!this.shouldUseLiveRegion()) return; // a11y.live が false なら何もしない

    const statusClassName = this.getClass("status");
    let statusEl = this.root.querySelector(`.${statusClassName}`) as HTMLElement;

    if (!statusEl) {
      statusEl = document.createElement('div');
      statusEl.className = `${statusClassName} sr-only`;
      statusEl.setAttribute('aria-live', 'polite');
      statusEl.setAttribute('aria-atomic', 'true');
      this.root.appendChild(statusEl);
    }

    const slidesToShow = this.options.slidesToShow ?? 1;
    let statusText: string;

    if (slidesToShow === 1) {
      // slidesToShow が 1 の場合
      const currentSlideNumber = this.currentIndex + 1;
      const totalSlides = this.items.length; // 全アイテム数でOK
      statusText = getLabel("slideStatus", {
        lang: this.options.lang,
        override: this.options.labels,
        params: { current: currentSlideNumber, total: totalSlides },
      });
    } else {
      // slidesToShow が 2 以上の場合
      const startSlideNumber = this.currentIndex + 1;
      const endSlideNumber = Math.min(this.currentIndex + slidesToShow, this.items.length);
      const totalSlides = this.items.length; // 全アイテム数でOK
      statusText = getLabel("slideRangeStatus", { // 新しいラベルキーを使用
        lang: this.options.lang,
        override: this.options.labels,
        params: { start: startSlideNumber, end: endSlideNumber, total: totalSlides },
      });
    }

    statusEl.textContent = statusText;
  }

  // 次のスライドの画像をプリロード
  private preloadNextSlideImages() {
    // プリロードするスライドの数を調整可能にするか、固定で1つにすることもできます
    const slidesToPreload = 1;

    for (let j = 0; j < slidesToPreload; j++) {
      let nextIndex = this.currentIndex + 1 + j;
      if (this.options.loop) {
        nextIndex = nextIndex % this.items.length;
      } else {
        if (nextIndex >= this.items.length) {
          continue; // ループしない場合、範囲外はプリロードしない
        }
      }

      const nextSlide = this.items[nextIndex];
      const img = nextSlide?.querySelector('img');
      if (img && img.dataset.src && !img.complete) { // data-src属性があればそれを読み込み、まだ完了していなければ
        const tempImg = new Image();
        tempImg.src = img.dataset.src; // 読み込みを開始
        // 読み込み完了後に実際のimg要素のsrcを更新する場合はここで行う
        // tempImg.onload = () => { img.src = img.dataset.src!; };
      } else if (img && !img.complete) { // src属性に直接画像が設定されていて、まだ完了していなければ
        // 現在のsrcを再設定することでブラウザのキャッシュを促す
        const currentSrc = img.src;
        img.src = ''; // 一度クリア
        img.src = currentSrc; // 再設定
      }
    }
  }

  private updateOptionsForCurrentBreakpoint() {
    // ブレイクポイントに基づいてオプションを更新
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

  private addKeyboardNavigation() {
    // スライダー全体のキーボードナビゲーション
    this.root.addEventListener("keydown", (e) => {
      switch (e.key) {
        case "ArrowLeft": e.preventDefault(); this.gotoSlide(this.currentIndex - 1); break;
        case "ArrowRight": e.preventDefault(); this.gotoSlide(this.currentIndex + 1); break;
        case "Home": e.preventDefault(); this.gotoSlide(0); break;
        case "End": e.preventDefault(); const slidesToShow = this.options.slidesToShow ?? 1; this.gotoSlide(this.items.length - slidesToShow); break;
        case "Space":
          if (e.target === this.pauseButton) {
            e.preventDefault();
            this.toggleAutoplay();
          }
          break;
      }
    });
  }

  private toggleAutoplay() {
    // 自動再生の一時停止/再生の切り替え
    if (!this.pauseButton) return;

    if (this.isPaused) {
      this.isPaused = false;
      this.startAutoplay();
      this.pauseButton.innerHTML = this.getPauseIcon();
      this.pauseButton.setAttribute(
        "aria-label",
        getLabel("pause", {
          lang: this.options.lang,
          override: this.options.labels,
        })
      );
    } else {
      this.isPaused = true;
      this.stopAutoplay();
      this.pauseButton.innerHTML = this.getPlayIcon();
      this.pauseButton.setAttribute(
        "aria-label",
        getLabel("play", {
          lang: this.options.lang,
          override: this.options.labels,
        })
      );
    }
  }
}