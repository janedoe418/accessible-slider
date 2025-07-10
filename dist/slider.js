import { defaultClassNames, defaultIcons, getLabel, } from "./config.js";
function debounce(func, wait = 300) {
    let timer;
    return function (...args) {
        if (timer)
            clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), wait);
    };
}
export class AccessibleSlider {
    // 2. コンストラクター
    // -------------------------------------------------------------
    constructor(root, options = {}) {
        this.items = [];
        this.currentIndex = 0;
        this.isPaused = false;
        this.root = root;
        this.options = Object.assign({}, options);
        this.originalOptions = Object.assign({}, this.options);
        this.updateOptionsForCurrentBreakpoint(); // 初期化の一部
        this.init(); // 全体の初期化処理を呼び出す
        // リサイズイベントのリスナーは、クラスの外部との主要な接点なので、コンストラクタの最後に置く
        window.addEventListener("resize", debounce(() => {
            this.updateOptionsForCurrentBreakpoint();
            this.updateSliderSize();
        }, 200));
    }
    // 3. パブリックAPI (外部から直接呼び出される主要メソッド)
    // -------------------------------------------------------------
    init() {
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
        this.root.setAttribute("aria-label", getLabel("regionLabel", {
            lang: this.options.lang,
            override: this.options.labels,
        }));
        this.addKeyboardNavigation();
        this.updateSlideStatusAnnouncement();
    }
    gotoSlide(index) {
        var _a;
        if (!this.items.length || index === this.currentIndex) {
            return;
        }
        // スライド遷移の主要ロジック
        const slidesToShow = (_a = this.options.slidesToShow) !== null && _a !== void 0 ? _a : 1;
        const maxIndex = this.items.length - slidesToShow;
        // ループ処理
        if (!this.options.loop) {
            if (index < 0)
                index = 0;
            if (index > maxIndex)
                index = maxIndex;
        }
        else {
            if (index < 0)
                index = maxIndex;
            if (index > maxIndex)
                index = 0;
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
        if (this.options.dots)
            this.renderDots(); // ドットの更新
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
    startAutoplay() {
        // 自動再生の開始
        if (this.isPaused)
            return;
        this.stopAutoplay(); // 既存のタイマーをクリア
        const speed = this.shouldReduceMotion() ? 99999999 : (this.options.autoplaySpeed || 3000); // 非常に長い秒数で実質無効化
        this.autoplayTimer = setInterval(() => {
            this.gotoSlide(this.currentIndex + 1);
        }, speed);
    }
    stopAutoplay() {
        // 自動再生の停止
        if (this.autoplayTimer) {
            clearInterval(this.autoplayTimer);
            this.autoplayTimer = undefined;
        }
    }
    updateSliderSize() {
        var _a;
        // スライダーサイズの更新（リサイズ時など）
        if (!this.track || !this.items.length)
            return;
        const slidesToShow = (_a = this.options.slidesToShow) !== null && _a !== void 0 ? _a : 1;
        const containerWidth = this.root.clientWidth;
        const slideWidth = containerWidth / slidesToShow;
        this.items.forEach((item) => (item.style.width = `${slideWidth}px`));
        this.track.style.width = `${slideWidth * this.items.length}px`;
        this.updateTrackPosition();
    }
    // 4. プライベートなセットアップメソッド (コンストラクタやinitから呼ばれる初期設定)
    // -------------------------------------------------------------
    setupTrack() {
        // トラック要素の準備とスライドアイテムの取得
        let track = this.root.querySelector("." + this.getClass("track"));
        if (!track) {
            track = document.createElement("div");
            track.className = this.getClass("track");
            this.getSlides().forEach((item) => track.appendChild(item));
            this.root.insertBefore(track, this.root.firstChild);
        }
        this.track = track;
        this.items = Array.from(track.querySelectorAll("." + this.getClass("slide")));
    }
    setupAria() {
        // 初期ARIA属性の設定
        this.items.forEach((item, index) => {
            item.setAttribute("aria-label", getLabel("slide", {
                lang: this.options.lang,
                override: this.options.labels,
                params: { i: index + 1, total: this.items.length },
            }));
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
    setupNav() {
        // ナビゲーション（矢印ボタン）の設定
        const nav = this.root.querySelector("." + this.getClass("arrow"));
        if (!nav)
            return;
        nav.setAttribute("aria-label", getLabel("buttonRegion", {
            lang: this.options.lang,
            override: this.options.labels,
        }));
        const btns = nav.querySelectorAll("button");
        if (btns[0]) {
            btns[0].setAttribute("aria-label", getLabel("prev", {
                lang: this.options.lang,
                override: this.options.labels,
            }));
            btns[0].onclick = () => this.gotoSlide(this.currentIndex - 1);
        }
        if (btns[1]) {
            btns[1].setAttribute("aria-label", getLabel("next", {
                lang: this.options.lang,
                override: this.options.labels,
            }));
            btns[1].onclick = () => this.gotoSlide(this.currentIndex + 1);
        }
    }
    setupDots() {
        var _a, _b;
        // ドットナビゲーションの設定
        if (!this.options.dots)
            return;
        let dots = (_a = this.root.parentNode) === null || _a === void 0 ? void 0 : _a.querySelector("." + this.getClass("dots"));
        if (!dots) {
            dots = document.createElement("div");
            dots.className = this.getClass("dots");
            (_b = this.root.parentNode) === null || _b === void 0 ? void 0 : _b.insertBefore(dots, this.root.nextSibling);
        }
        this.dotsContainer = dots;
        this.renderDots(); // 初回レンダリングを呼び出す
    }
    setupAutoplay() {
        // 自動再生関連の初期設定
        if (this.options.autoplay) {
            this.setupPauseButton(); // Pauseボタンの準備
            if (!this.isPaused) { // 初期状態が一時停止でなければ開始
                this.startAutoplay();
            }
        }
    }
    setupPauseButton() {
        // Pause/Playボタンの準備
        const nav = this.root.querySelector("." + this.getClass("arrow"));
        if (!nav)
            return;
        let pauseBtn = nav.querySelector("." + this.getClass("pause"));
        if (!pauseBtn) {
            pauseBtn = document.createElement("button");
            pauseBtn.className = this.getClass("pause");
            pauseBtn.innerHTML = this.getPauseIcon();
            pauseBtn.setAttribute("aria-label", getLabel("pause", {
                lang: this.options.lang,
                override: this.options.labels,
            }));
            nav.appendChild(pauseBtn);
        }
        this.pauseButton = pauseBtn;
        this.pauseButton.onclick = () => this.toggleAutoplay();
    }
    // 5. プライベートなヘルパー/ユーティリティメソッド (他のメソッドから呼ばれる補助関数)
    // -------------------------------------------------------------
    getClass(name) {
        var _a;
        // クラス名を取得
        return ((_a = this.options.classNames) === null || _a === void 0 ? void 0 : _a[name]) || defaultClassNames[name];
    }
    shouldUseLiveRegion() {
        var _a;
        // options.a11y.live が undefined または true の場合に true を返す
        // false の場合のみ false を返す
        return ((_a = this.options.a11y) === null || _a === void 0 ? void 0 : _a.live) !== false;
    }
    // Reduced Motion を考慮
    shouldReduceMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    getSlides() {
        // スライド要素のリストを取得
        const slideSelector = "." + this.getClass("slide");
        return Array.from(this.root.querySelectorAll(slideSelector));
    }
    getPauseIcon() {
        var _a;
        // PauseアイコンのSVGを取得
        return ((_a = this.options.icons) === null || _a === void 0 ? void 0 : _a.pause) || defaultIcons.pause;
    }
    getPlayIcon() {
        var _a;
        // PlayアイコンのSVGを取得
        return ((_a = this.options.icons) === null || _a === void 0 ? void 0 : _a.play) || defaultIcons.play;
    }
    renderDots() {
        var _a;
        // ドットナビゲーションのレンダリング（状態更新に伴い再描画される）
        if (!this.dotsContainer)
            return;
        this.dotsContainer.innerHTML = "";
        this.dotsContainer.setAttribute("role", "group");
        this.dotsContainer.setAttribute("aria-label", getLabel("dotRegion", {
            lang: this.options.lang,
            override: this.options.labels,
        }));
        const slidesToShow = (_a = this.options.slidesToShow) !== null && _a !== void 0 ? _a : 1;
        const dotCount = Math.max(1, this.items.length - slidesToShow + 1);
        for (let i = 0; i < dotCount; i++) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = this.getClass("dot");
            btn.setAttribute("role", "button");
            btn.setAttribute("aria-label", getLabel("dot", {
                lang: this.options.lang,
                override: this.options.labels,
                params: { i: i + 1, total: dotCount },
            }));
            btn.setAttribute("tabindex", i === this.currentIndex ? "0" : "-1");
            // btn.setAttribute("aria-selected", i === this.currentIndex ? "true" : "false"); // role="button" なら不要
            btn.textContent = String(i + 1);
            if (i === this.currentIndex)
                btn.classList.add(this.getClass("active"));
            btn.onclick = () => this.gotoSlide(i);
            btn.addEventListener("keydown", (e) => {
                var _a;
                let newIndex = i;
                switch (e.key) {
                    case "ArrowLeft":
                        e.preventDefault();
                        newIndex = (i === 0) ? dotCount - 1 : i - 1;
                        break;
                    case "ArrowRight":
                        e.preventDefault();
                        newIndex = (i === dotCount - 1) ? 0 : i + 1;
                        break;
                    case "Home":
                        e.preventDefault();
                        newIndex = 0;
                        break;
                    case "End":
                        e.preventDefault();
                        newIndex = dotCount - 1;
                        break;
                    case "Enter":
                    case "Space":
                        e.preventDefault();
                        this.gotoSlide(i);
                        return;
                }
                if (newIndex !== i) {
                    this.gotoSlide(newIndex);
                    const newActiveDot = (_a = this.dotsContainer) === null || _a === void 0 ? void 0 : _a.querySelector(`.${this.getClass("dot")}[tabindex="0"]`);
                    if (newActiveDot) {
                        newActiveDot.focus();
                    }
                }
            });
            this.dotsContainer.appendChild(btn);
        }
    }
    updateTrackPosition() {
        var _a;
        // トラックの位置を更新
        if (!this.track)
            return;
        const slidesToShow = (_a = this.options.slidesToShow) !== null && _a !== void 0 ? _a : 1;
        const containerWidth = this.root.clientWidth;
        const slideWidth = containerWidth / slidesToShow;
        this.track.style.transform = `translateX(-${this.currentIndex * slideWidth}px)`;
    }
    updateSlideStatusAnnouncement() {
        var _a;
        // スライドの状態をスクリーンリーダーに読み上げさせる
        if (!this.shouldUseLiveRegion())
            return; // a11y.live が false なら何もしない
        const statusClassName = this.getClass("status");
        let statusEl = this.root.querySelector(`.${statusClassName}`);
        if (!statusEl) {
            statusEl = document.createElement('div');
            statusEl.className = `${statusClassName} sr-only`;
            statusEl.setAttribute('aria-live', 'polite');
            statusEl.setAttribute('aria-atomic', 'true');
            this.root.appendChild(statusEl);
        }
        const slidesToShow = (_a = this.options.slidesToShow) !== null && _a !== void 0 ? _a : 1;
        let statusText;
        if (slidesToShow === 1) {
            // slidesToShow が 1 の場合
            const currentSlideNumber = this.currentIndex + 1;
            const totalSlides = this.items.length; // 全アイテム数でOK
            statusText = getLabel("slideStatus", {
                lang: this.options.lang,
                override: this.options.labels,
                params: { current: currentSlideNumber, total: totalSlides },
            });
        }
        else {
            // slidesToShow が 2 以上の場合
            const startSlideNumber = this.currentIndex + 1;
            const endSlideNumber = Math.min(this.currentIndex + slidesToShow, this.items.length);
            const totalSlides = this.items.length; // 全アイテム数でOK
            statusText = getLabel("slideRangeStatus", {
                lang: this.options.lang,
                override: this.options.labels,
                params: { start: startSlideNumber, end: endSlideNumber, total: totalSlides },
            });
        }
        statusEl.textContent = statusText;
    }
    // 次のスライドの画像をプリロード
    preloadNextSlideImages() {
        // プリロードするスライドの数を調整可能にするか、固定で1つにすることもできます
        const slidesToPreload = 1;
        for (let j = 0; j < slidesToPreload; j++) {
            let nextIndex = this.currentIndex + 1 + j;
            if (this.options.loop) {
                nextIndex = nextIndex % this.items.length;
            }
            else {
                if (nextIndex >= this.items.length) {
                    continue; // ループしない場合、範囲外はプリロードしない
                }
            }
            const nextSlide = this.items[nextIndex];
            const img = nextSlide === null || nextSlide === void 0 ? void 0 : nextSlide.querySelector('img');
            if (img && img.dataset.src && !img.complete) { // data-src属性があればそれを読み込み、まだ完了していなければ
                const tempImg = new Image();
                tempImg.src = img.dataset.src; // 読み込みを開始
                // 読み込み完了後に実際のimg要素のsrcを更新する場合はここで行う
                // tempImg.onload = () => { img.src = img.dataset.src!; };
            }
            else if (img && !img.complete) { // src属性に直接画像が設定されていて、まだ完了していなければ
                // 現在のsrcを再設定することでブラウザのキャッシュを促す
                const currentSrc = img.src;
                img.src = ''; // 一度クリア
                img.src = currentSrc; // 再設定
            }
        }
    }
    updateOptionsForCurrentBreakpoint() {
        // ブレイクポイントに基づいてオプションを更新
        if (!this.originalOptions)
            this.originalOptions = Object.assign({}, this.options);
        const width = window.innerWidth;
        let matched = null;
        let bps = this.originalOptions.breakpoints;
        if (!bps)
            return;
        for (const bp in bps) {
            const bpNum = Number(bp);
            if (width <= bpNum && (matched === null || bpNum < matched))
                matched = bpNum;
        }
        this.options = Object.assign({}, this.originalOptions);
        if (matched !== null)
            Object.assign(this.options, bps[matched]);
    }
    addKeyboardNavigation() {
        // スライダー全体のキーボードナビゲーション
        this.root.addEventListener("keydown", (e) => {
            var _a;
            switch (e.key) {
                case "ArrowLeft":
                    e.preventDefault();
                    this.gotoSlide(this.currentIndex - 1);
                    break;
                case "ArrowRight":
                    e.preventDefault();
                    this.gotoSlide(this.currentIndex + 1);
                    break;
                case "Home":
                    e.preventDefault();
                    this.gotoSlide(0);
                    break;
                case "End":
                    e.preventDefault();
                    const slidesToShow = (_a = this.options.slidesToShow) !== null && _a !== void 0 ? _a : 1;
                    this.gotoSlide(this.items.length - slidesToShow);
                    break;
                case "Space":
                    if (e.target === this.pauseButton) {
                        e.preventDefault();
                        this.toggleAutoplay();
                    }
                    break;
            }
        });
    }
    toggleAutoplay() {
        // 自動再生の一時停止/再生の切り替え
        if (!this.pauseButton)
            return;
        if (this.isPaused) {
            this.isPaused = false;
            this.startAutoplay();
            this.pauseButton.innerHTML = this.getPauseIcon();
            this.pauseButton.setAttribute("aria-label", getLabel("pause", {
                lang: this.options.lang,
                override: this.options.labels,
            }));
        }
        else {
            this.isPaused = true;
            this.stopAutoplay();
            this.pauseButton.innerHTML = this.getPlayIcon();
            this.pauseButton.setAttribute("aria-label", getLabel("play", {
                lang: this.options.lang,
                override: this.options.labels,
            }));
        }
    }
}
