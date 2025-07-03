<div class="js-a11y-slider" role="region" aria-label="画像スライダー">
    <img src="https://placehold.co/600x400" alt="説明文" aria-label="スライド 1/4番目" aria-live="polite" aria-hidden="false" class="js-a11y-slider__item is-active">
    <img src="https://placehold.co/600x400" alt="説明文" aria-label="スライド 2/4番目" aria-hidden="true" class="js-a11y-slider__item">
    <img src="https://placehold.co/600x400" alt="説明文" aria-label="スライド 3/4番目" aria-hidden="true" class="js-a11y-slider__item">
    <img src="https://placehold.co/600x400" alt="説明文" aria-label="スライド 4/4番目" aria-hidden="true" class="js-a11y-slider__item">
    <nav class="js-a11y-slider__buttons" aria-label="スライダー操作">
        <button aria-label="前のスライド">←</button>
        <button aria-label="次のスライド">→</button>
    </nav>
</div>
<!--
  ドットナビゲーションはキーボード操作に対応しています。
  - Tabキーで各ドットへ移動
  - 左右キー（←→）で前後ドット＆スライドに移動
  - Enter/Spaceでそのスライドにジャンプ
-->
<div class="js-a11y-slider__dots" role="tablist">
  <button role="tab" aria-label="1枚目へ" aria-selected="true">1</button>
  <button role="tab" aria-label="2枚目へ">2</button>
  <button role="tab" aria-label="3枚目へ">3</button>
  <button role="tab" aria-label="4枚目へ">4</button>
</div>  