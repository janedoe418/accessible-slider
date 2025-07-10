# Accessible Slider

## 🇯🇵 日本語

### 概要

Accessible Sliderは、アクセシビリティに最大限配慮して設計されたシンプルなスライダー（カルーセル）です。WAI-ARIAのベストプラクティス、キーボードナビゲーション、スクリーンリーダー対応、そしてユーザーの環境設定（`prefers-reduced-motion`）への配慮など、すべてのユーザーに快適な体験を提供することを目指しています。

このスライダーは、JavaScriptの機能提供に特化しており、**細かなスタイリングはご自身のプロジェクトのCSSで自由にカスタマイズ**していただくことを想定しています。

### 特徴

  * **包括的なアクセシビリティ対応**:
      * ARIA属性の適切な使用 (`aria-label`, `aria-hidden`, `aria-live`)
      * スクリーンリーダー向けの状態アナウンス機能
      * キーボードナビゲーション（矢印キー、Home/End、Space）
      * フォーカス管理の実装
      * `prefers-reduced-motion` メディアクエリへの対応
  * **堅牢な設計**:
      * TypeScriptによる型安全性
      * ブレイクポイント対応
      * 自動再生の一時停止/再生機能
      * リサイズ時の適切な再計算
      * 次スライドの画像プリロード機能
      * 基本的なエラーハンドリング
  * **シンプルな構造**:
      * 機能別にメソッドが整理された、読みやすいコードベース

### インストール

本リポジトリから `dist/slider.js` と `dist/config.js` をダウンロードし、ご自身のプロジェクトの適切なディレクトリに配置してください。
（ご自身で `src/slider.ts` と `src/config.ts` を編集・トランスパイルして使用していただいても構いません。）

例:

```
your-project/
├── index.html
└── js/
    ├── slider.js
    └── config.js
```

### 使用方法

#### 1\. HTML構造

スライダーの基本的なHTML構造は以下のようになります。

  * スライダーのルート要素には、**必須**で `class="a11y-slider"` を、任意のID (`id="mySlider"`) を付与してください。
  * スライドアイテムには**必須**で `class="a11y-slider__item"` を付与し、ルート要素の直接の子要素として配置します。**`a11y-slider__track` はJavaScriptによって動的に生成され、これらのアイテムを内包します。**
  * ナビゲーションボタンを設置する場合（オプション `arrows: true`）、`class="a11y-slider__buttons"` の `nav` 要素内に、`class="a11y-slider__prev"` と `class="a11y-slider__next"` を持つ `button` 要素を配置してください。ボタンの中身はテキストでもSVGでもお好みで設定できます。**`aria-label` などのアクセシビリティ属性はJavaScriptが自動で付与します。**
  * ドットナビゲーションは、オプションで `dots: true` を設定した場合にJavaScriptによって自動で生成されるため、HTMLへの記述は不要です。

<!-- end list -->

```html
<div class="a11y-slider" id="mySlider">
  <img src="https://placehold.co/600x400" alt="スライド1の内容を説明する代替テキスト" class="a11y-slider__item">
  <img src="https://placehold.co/600x400/000000/FFFFFF/png" alt="スライド2の内容を説明する代替テキスト" class="a11y-slider__item">
  <img src="https://placehold.co/600x400/orange/white" alt="スライド3の内容を説明する代替テキスト" class="a11y-slider__item">
  <img src="https://placehold.co/600x400/transparent/F00" alt="スライド4の内容を説明する代替テキスト" class="a11y-slider__item">

  <nav class="a11y-slider__buttons">
    <button class="a11y-slider__prev">←</button>
    <button class="a11y-slider__next">→</button>
    </nav>
</div>

```

#### 2\. JavaScript

HTMLファイルでスクリプトを読み込み、インスタンスを作成します。

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accessible Slider Demo</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <div class="a11y-slider" id="mySlider">
    </div>

  <script type="module">
    // config.js は slider.js から自動的にインポートされるため、直接読み込む必要はありません。
    import { AccessibleSlider } from './js/slider.js'; // ★パスをプロジェクトに合わせて調整してください

    document.addEventListener('DOMContentLoaded', () => {
      const sliderRoot = document.getElementById('mySlider');
      if (sliderRoot) {
        new AccessibleSlider(sliderRoot, {
          // オプションをここに記述
          autoplay: true,
          autoplaySpeed: 5000,
          slidesToShow: 1,
          loop: true,
          arrows: true,
          dots: true,
          a11y: {
            live: true,
          },
          classNames: {
            // クラス名は、config.ts/js を直接編集してビルドするか、
            // あるいはここに記述してインスタンスごとに上書きできます。
            // 例: root: 'my-custom-slider',
          },
          labels: {
            // ラベルは、config.ts/js を直接編集してビルドするか、
            // あるいはここに記述してインスタンスごとに上書きできます。
            // 例: next: '次のスライドへ',
          },
          breakpoints: {
            // ブレイクポイントの例
            768: {
              slidesToShow: 2,
              // loop: false,
            },
            1024: {
              slidesToShow: 3,
            }
          }
        });
      }
    });
  </script>
</body>
</html>
```

#### 利用可能なオプション

| オプション名 | 型      | デフォルト | 説明                                                                                                        |
| :----------- | :------ | :--------- | :---------------------------------------------------------------------------------------------------------- |
| `autoplay`     | `boolean` | `false`    | スライダーの自動再生を有効にするか                                                                          |
| `autoplaySpeed`| `number`  | `3000`     | 自動再生の間隔（ミリ秒）                                                                                    |
| `slidesToShow` | `number`  | `1`        | 一度に表示するスライドの数                                                                                  |
| `loop`         | `boolean` | `false`    | スライダーのループ再生を有効にするか（最後のスライドから最初のスライドへ、またはその逆）                     |
| `arrows`       | `boolean` | `false`    | 「前へ」「次へ」の矢印ナビゲーションボタンを表示するか                                                      |
| `dots`         | `boolean` | `false`    | ドットナビゲーション（ページネーション）を表示するか                                                        |
| `a11y.live`    | `boolean` | `true`     | スクリーンリーダー向けのライブリージョンによるスライドの状態アナウンスを有効にするか（詳細な設定はconfig.tsで） |
| `classNames`   | `object`  | `{...}`    | スライダーの各要素に適用されるCSSクラス名をカスタマイズ（詳細はconfig.tsを参照）                               |
| `labels`       | `object`  | `{...}`    | アクセシビリティラベルやテキストを言語ごとにカスタマイズ（詳細はconfig.tsを参照）                               |
| `breakpoints`  | `object`  | `{}`       | レスポンシブ対応のためのブレイクポイント設定（例: `{768: {slidesToShow: 2}}`）                              |

#### 3\. CSS

スライダーの機能はJavaScriptで提供されますが、**視覚的なデザインは全てご自身でCSSを記述してください。** 提供されているクラス名（`defaultClassNames`）を参考に、必要に応じてカスタマイズしてください。

提供されているクラス名（`defaultClassNames`）:
`a11y-slider`, `a11y-slider__track`, `a11y-slider__item`, `a11y-slider__buttons`, `a11y-slider__dots`, `a11y-slider__dot`, `is-active`, `a11y-slider__pause`, `a11y-slider-status` (`sr-only` クラスと組み合わせて使用)

### 開発

ローカルで開発を行う場合は、以下のコマンドを使用します。

```bash
# TypeScriptのビルド
npm run build

# ビルドされたファイルをdemoフォルダにコピー (Windows)
npm run copy:win
# ビルドされたファイルをdemoフォルダにコピー (macOS/Linux)
npm run copy:mac

# ビルドしてdemoフォルダにコピー (Windows)
npm run start:win
# ビルドしてdemoフォルダにコピー (macOS/Linux)
npm run start:mac

# ファイル変更を監視して自動ビルド
npm run watch
```

### ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細については、[LICENSE](https://www.google.com/search?q=LICENSE) ファイルを参照してください。

-----

## 🇬🇧 English

### Overview

Accessible Slider is a simple slider (carousel) meticulously designed with maximum accessibility in mind. It aims to provide a comfortable experience for all users by adhering to WAI-ARIA best practices, keyboard navigation, screen reader compatibility, and consideration for user environment settings (`prefers-reduced-motion`).

This slider focuses solely on providing JavaScript functionality. **Detailed styling is expected to be customized by you using your project's CSS.**

### Features

  * **Comprehensive Accessibility Support**:
      * Appropriate use of ARIA attributes (`aria-label`, `aria-hidden`, `aria-live`)
      * Screen reader announcement functionality for status updates
      * Keyboard navigation (Arrow keys, Home/End, Space)
      * Focus management implementation
      * `prefers-reduced-motion` media query support
  * **Robust Design**:
      * Type safety with TypeScript
      * Breakpoint responsiveness
      * Autoplay pause/play functionality
      * Proper recalculation on window resize
      * Next slide image preloading
      * Basic error handling
  * **Simple Structure**:
      * Clean, readable codebase with logically organized methods

### Installation

Download `dist/slider.js` and `dist/config.js` from this repository and place them in the appropriate directory of your project.
(Alternatively, you can edit and transpile `src/slider.ts` and `src/config.ts` yourself for use.)

Example:

```
your-project/
├── index.html
└── js/
    ├── slider.js
    └── config.js
```

### Usage

#### 1\. HTML Structure

The basic HTML structure for the slider is as follows:

  * The slider's root element **must** have `class="a11y-slider"` and an optional ID (`id="mySlider"`).
  * Slide items **must** have `class="a11y-slider__item"` and be placed as direct children of the root element. **The `a11y-slider__track` will be dynamically generated by JavaScript to contain these items.**
  * If you wish to include navigation buttons (optional, for `arrows: true`), place a `nav` element with `class="a11y-slider__buttons"` containing `button` elements with `class="a11y-slider__prev"` and `class="a11y-slider__next"`. You can use text or SVG for the button content. **Accessibility attributes like `aria-label` will be automatically added by JavaScript.**
  * Dot navigation is automatically generated by JavaScript if enabled (`dots: true`), so no HTML markup is required for the dots themselves.

<!-- end list -->

```html
<div class="a11y-slider" id="mySlider">
  <img src="https://placehold.co/600x400" alt="Alternative text describing content of slide 1" class="a11y-slider__item">
  <img src="https://placehold.co/600x400/000000/FFFFFF/png" alt="Alternative text describing content of slide 2" class="a11y-slider__item">
  <img src="https://placehold.co/600x400/orange/white" alt="Alternative text describing content of slide 3" class="a11y-slider__item">
  <img src="https://placehold.co/600x400/transparent/F00" alt="Alternative text describing content of slide 4" class="a11y-slider__item">

  <nav class="a11y-slider__buttons">
    <button class="a11y-slider__prev">←</button>
    <button class="a11y-slider__next">→</button>
    </nav>
</div>

```

#### 2\. JavaScript

Load the scripts in your HTML file and create an instance.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accessible Slider Demo</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <div class="a11y-slider" id="mySlider">
    </div>

  <script type="module">
    // config.js is automatically imported by slider.js, so you don't need to load it directly.
    import { AccessibleSlider } from './js/slider.js'; // ★Adjust path according to your project

    document.addEventListener('DOMContentLoaded', () => {
      const sliderRoot = document.getElementById('mySlider');
      if (sliderRoot) {
        new AccessibleSlider(sliderRoot, {
          // Specify options here
          autoplay: true,
          autoplaySpeed: 5000,
          slidesToShow: 1,
          loop: true,
          arrows: true,
          dots: true,
          a11y: {
            live: true,
          },
          classNames: {
            // Class names can be customized by editing config.ts/js directly and building,
            // or by specifying them here to override on a per-instance basis.
            // Example: root: 'my-custom-slider',
          },
          labels: {
            // Labels can be customized by editing config.ts/js directly and building,
            // or by specifying them here to override on a per-instance basis.
            // Example: next: 'Go to next slide',
          },
          // Breakpoint example
          breakpoints: {
            768: {
              slidesToShow: 2,
              // loop: false,
            },
            1024: {
              slidesToShow: 3,
            }
          }
        });
      }
    });
  </script>
</body>
</html>
```

#### Available Options

| Option Name    | Type      | Default  | Description                                                                                             |
| :------------- | :-------- | :------- | :------------------------------------------------------------------------------------------------------ |
| `autoplay`       | `boolean` | `false`  | Whether to enable autoplay for the slider.                                                              |
| `autoplaySpeed`  | `number`  | `3000`   | The interval for autoplay in milliseconds.                                                              |
| `slidesToShow`   | `number`  | `1`      | The number of slides to display at once.                                                                |
| `loop`           | `boolean` | `false`  | Whether to enable looping playback (from last to first slide and vice-versa).                           |
| `arrows`         | `boolean` | `false`  | Whether to display "Previous" and "Next" arrow navigation buttons.                                      |
| `dots`           | `boolean` | `false`  | Whether to display dot navigation (pagination).                                                         |
| `a11y.live`      | `boolean` | `true`   | Whether to enable live region announcements for slide status to screen readers (more settings in config.ts).|
| `classNames`     | `object`  | `{...}`  | Customize CSS class names applied to various slider elements (see config.ts for details).                 |
| `labels`         | `object`  | `{...}`  | Customize accessibility labels and texts per language (see config.ts for details).                       |
| `breakpoints`    | `object`  | `{}`     | Breakpoint settings for responsive behavior (e.g., `{768: {slidesToShow: 2}}`).                         |

#### 3\. CSS

While the slider's functionality is provided by JavaScript, **all visual design should be implemented by your own CSS.** Refer to the provided class names (`defaultClassNames`) for customization as needed.

Provided class names (`defaultClassNames`):
`a11y-slider`, `a11y-slider__track`, `a11y-slider__item`, `a11y-slider__buttons`, `a11y-slider__dots`, `a11y-slider__dot`, `is-active`, `a11y-slider__pause`, `a11y-slider-status` (to be used with `sr-only` class)

### Development

To develop locally, use the following commands:

```bash
# Build TypeScript
npm run build

# Copy built files to demo folder (Windows)
npm run copy:win
# Copy built files to demo folder (macOS/Linux)
npm run copy:mac

# Build and copy to demo folder (Windows)
npm run start:win
# Build and copy to demo folder (macOS/Linux)
npm run start:mac

# Watch for file changes and auto-build
npm run watch
```

### License

This project is licensed under the MIT License. See the [LICENSE](https://www.google.com/search?q=LICENSE) file for details.

-----