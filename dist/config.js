export const defaultClassNames = {
    root: "a11y-slider",
    track: "a11y-slider__track",
    slide: "a11y-slider__item",
    arrow: "a11y-slider__buttons",
    dots: "a11y-slider__dots",
    dot: "a11y-slider__dot",
    active: "is-active",
    pause: "a11y-slider__pause",
    status: "a11y-slider-status",
};
export const defaultLabels = {
    ja: {
        slide: "{i}枚目 / 全{total}枚",
        dot: "{i}枚目へ",
        pause: "一時停止",
        play: "再生",
        prev: "前のスライド",
        next: "次のスライド",
        region: "スライダー",
        buttonRegion: "スライダー操作",
        regionLabel: "画像カルーセル",
        dotRegion: "スライドページネーション",
        slideStatus: "{current}枚目のスライドが表示されました", // slidesToShow: 1 の場合
        slideRangeStatus: "{start}枚目から{end}枚目のスライドが表示されました", // slidesToShow: 2 以上の場合
    },
    en: {
        slide: "Slide {i} of {total}",
        dot: "Go to slide {i}",
        pause: "Pause",
        play: "Play",
        prev: "Previous",
        next: "Next",
        region: "Slider",
        buttonRegion: "Slider Controls",
        regionLabel: "Image Carousel",
        dotRegion: "Slide Pagination",
        slideStatus: "Slide {current} of {total} is displayed",
        slideRangeStatus: "Slides {start} to {end} of {total} are displayed",
    },
};
export const defaultIcons = {
    pause: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M520-200v-560h240v560H520Zm-320 0v-560h240v560H200Zm400-80h80v-400h-80v400Zm-320 0h80v-400h-80v400Zm0-400v400-400Zm320 0v400-400Z"/></svg>`,
    play: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="m380-300 280-180-280-180v360ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>`,
};
export function getLabel(key, opts = {}) {
    let { lang = "ja", override = {}, params = {} } = opts;
    const safeLang = (lang in defaultLabels ? lang : "ja");
    let str = (override && override[key]) ||
        defaultLabels[safeLang][key] ||
        defaultLabels["ja"][key] ||
        "";
    return str.replace(/\{(\w+)\}/g, (_, k) => params[k] !== undefined ? params[k] : "");
}
