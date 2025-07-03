import { defaultClassNames } from "./config.js";
export class AccessibleSlider {
    constructor(root, options = {}) {
        this.currentIndex = 0;
        this.isPaused = false;
        this.root = root;
        this.options = Object.assign({}, options);
        this.originalOptions = Object.assign({}, this.options);
        this.items = [];
        this.currentIndex = 0;
        this.updateOptionsForCurrentBreakpoint();
        this.init();
        this.updateSliderSize();
        window.addEventListener("resize", () => {
            this.updateOptionsForCurrentBreakpoint();
            this.updateSliderSize();
        });
    }
    init() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
        // trackが既にあれば取得、なければ作る
        let track = this.root.querySelector("." + (((_a = this.options.classNames) === null || _a === void 0 ? void 0 : _a.track) || defaultClassNames.track));
        if (!track) {
            track = document.createElement("div");
            track.className =
                ((_b = this.options.classNames) === null || _b === void 0 ? void 0 : _b.track) || defaultClassNames.track;
            // スライド画像だけtrackにappend
            const slideSelector = "." + (((_c = this.options.classNames) === null || _c === void 0 ? void 0 : _c.slide) || defaultClassNames.slide);
            const slides = Array.from(this.root.querySelectorAll(slideSelector));
            slides.forEach((item) => {
                track.appendChild(item);
            });
            this.root.insertBefore(track, this.root.firstChild);
        }
        this.track = track;
        this.items = Array.from(track.querySelectorAll("." + (((_d = this.options.classNames) === null || _d === void 0 ? void 0 : _d.slide) || defaultClassNames.slide)));
        // aria設定
        this.items.forEach((item, index) => {
            var _a;
            item.setAttribute("aria-label", `スライド ${index + 1}/${this.items.length}番目`);
            item.setAttribute("aria-hidden", "true");
            item.classList.remove(((_a = this.options.classNames) === null || _a === void 0 ? void 0 : _a.active) || defaultClassNames.active);
            item.removeAttribute("aria-live");
        });
        if (this.items.length > 0) {
            this.items[0].setAttribute("aria-hidden", "false");
            this.items[0].classList.add(((_e = this.options.classNames) === null || _e === void 0 ? void 0 : _e.active) || defaultClassNames.active);
            this.items[0].setAttribute("aria-live", "polite");
        }
        // ボタン（nav）はtrack外・root直下
        const nav = this.root.querySelector("." + (((_f = this.options.classNames) === null || _f === void 0 ? void 0 : _f.arrow) || defaultClassNames.arrow));
        if (nav) {
            nav.setAttribute("aria-label", ((_g = this.options.a11y) === null || _g === void 0 ? void 0 : _g.buttonRegionLabel) || "スライダー操作");
            const btns = nav.querySelectorAll("button");
            if (btns[0]) {
                btns[0].setAttribute("aria-label", ((_h = this.options.arrowLabels) === null || _h === void 0 ? void 0 : _h.prev) || "前のスライド");
                btns[0].addEventListener("click", () => this.gotoSlide(this.currentIndex - 1));
            }
            if (btns[1]) {
                btns[1].setAttribute("aria-label", ((_j = this.options.arrowLabels) === null || _j === void 0 ? void 0 : _j.next) || "次のスライド");
                btns[1].addEventListener("click", () => this.gotoSlide(this.currentIndex + 1));
            }
        }
        // dots自動生成
        if (this.options.dots) {
            let dots = (_k = this.root.parentNode) === null || _k === void 0 ? void 0 : _k.querySelector("." + (((_l = this.options.classNames) === null || _l === void 0 ? void 0 : _l.dots) || defaultClassNames.dots));
            if (!dots) {
                dots = document.createElement("div");
                dots.className =
                    ((_m = this.options.classNames) === null || _m === void 0 ? void 0 : _m.dots) || defaultClassNames.dots;
                (_o = this.root.parentNode) === null || _o === void 0 ? void 0 : _o.insertBefore(dots, this.root.nextSibling);
            }
            this.dotsContainer = dots;
            this.renderDots();
        }
        // autoplay
        if (this.options.autoplay) {
            this.setupPauseButton();
            this.startAutoplay();
        }
    }
    setupPauseButton() {
        var _a, _b, _c;
        // nav取得
        const nav = this.root.querySelector("." + (((_a = this.options.classNames) === null || _a === void 0 ? void 0 : _a.arrow) || defaultClassNames.arrow));
        if (!nav)
            return;
        // 停止ボタンなければ自動生成
        let pauseBtn = nav.querySelector("." + (((_b = this.options.classNames) === null || _b === void 0 ? void 0 : _b.pause) || defaultClassNames.pause));
        if (!pauseBtn) {
            pauseBtn = document.createElement("button");
            pauseBtn.className =
                ((_c = this.options.classNames) === null || _c === void 0 ? void 0 : _c.pause) || defaultClassNames.pause;
            pauseBtn.innerHTML = this.getPauseIcon();
            pauseBtn.setAttribute("aria-label", "一時停止");
            nav.appendChild(pauseBtn);
        }
        // イベントバインドは一回だけ
        pauseBtn.onclick = () => {
            if (this.isPaused) {
                this.isPaused = false;
                this.startAutoplay();
                pauseBtn.innerHTML = this.getPauseIcon();
                pauseBtn.setAttribute("aria-label", "一時停止");
            }
            else {
                this.isPaused = true;
                this.stopAutoplay();
                pauseBtn.innerHTML = this.getPlayIcon();
                pauseBtn.setAttribute("aria-label", "再生");
            }
        };
    }
    getPauseIcon() {
        // SVGストップアイコン
        return `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M520-200v-560h240v560H520Zm-320 0v-560h240v560H200Zm400-80h80v-400h-80v400Zm-320 0h80v-400h-80v400Zm0-400v400-400Zm320 0v400-400Z"/></svg>`;
    }
    getPlayIcon() {
        // SVGプレイアイコン
        return `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="m380-300 280-180-280-180v360ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>`;
    }
    renderDots() {
        if (!this.dotsContainer)
            return;
        this.dotsContainer.innerHTML = "";
        this.dotsContainer.setAttribute("role", "tablist");
        this.items.forEach((item, i) => {
            var _a;
            const btn = document.createElement("button");
            btn.type = "button";
            btn.setAttribute("role", "tab");
            btn.setAttribute("aria-label", `${i + 1}枚目へ`);
            btn.setAttribute("tabindex", i === this.currentIndex ? "0" : "-1");
            btn.setAttribute("aria-selected", i === this.currentIndex ? "true" : "false");
            btn.textContent = String(i + 1);
            if (i === this.currentIndex)
                btn.classList.add(((_a = this.options.classNames) === null || _a === void 0 ? void 0 : _a.active) || defaultClassNames.active);
            btn.addEventListener("click", () => {
                this.gotoSlide(i);
            });
            this.dotsContainer.appendChild(btn);
        });
    }
    updateSliderSize() {
        if (!this.track || !this.items.length)
            return;
        const containerWidth = this.root.clientWidth;
        this.items.forEach((item) => {
            item.style.width = containerWidth + "px";
        });
        this.track.style.width = containerWidth * this.items.length + "px";
        this.updateTrackPosition();
    }
    updateTrackPosition() {
        if (!this.track)
            return;
        const containerWidth = this.root.clientWidth;
        this.track.style.transform = `translateX(-${this.currentIndex * containerWidth}px)`;
    }
    startAutoplay() {
        if (this.isPaused)
            return;
        this.stopAutoplay();
        const speed = this.options.autoplaySpeed || 3000;
        this.autoplayTimer = setInterval(() => {
            this.gotoSlide(this.currentIndex + 1);
        }, speed);
    }
    stopAutoplay() {
        if (this.autoplayTimer) {
            clearInterval(this.autoplayTimer);
            this.autoplayTimer = undefined;
        }
    }
    gotoSlide(index) {
        const items = this.items;
        if (!this.options.loop) {
            if (index < 0 || index >= items.length)
                return;
        }
        else {
            if (index < 0)
                index = items.length - 1;
            if (index >= items.length)
                index = 0;
        }
        items.forEach((item, i) => {
            var _a;
            const isActive = i === index;
            item.setAttribute("aria-hidden", isActive ? "false" : "true");
            item.classList.toggle(((_a = this.options.classNames) === null || _a === void 0 ? void 0 : _a.active) || defaultClassNames.active, isActive);
            if (isActive) {
                item.setAttribute("aria-live", "polite");
            }
            else {
                item.removeAttribute("aria-live");
            }
        });
        this.currentIndex = index;
        this.updateTrackPosition();
        if (this.options.dots) {
            this.renderDots();
        }
    }
    updateOptionsForCurrentBreakpoint() {
        if (!this.originalOptions) {
            this.originalOptions = Object.assign({}, this.options);
        }
        const width = window.innerWidth;
        let matched = null;
        let bps = this.originalOptions.breakpoints;
        if (!bps)
            return;
        for (const bp in bps) {
            const bpNum = Number(bp);
            if (width <= bpNum && (matched === null || bpNum < matched)) {
                matched = bpNum;
            }
        }
        // オリジナルから再構成
        this.options = Object.assign({}, this.originalOptions);
        if (matched !== null) {
            Object.assign(this.options, bps[matched]);
        }
    }
}
