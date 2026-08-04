# 使わせてもらっているもの

このアプリは、ほかの方が つくって 公開しているものを 使っています。
それぞれの 条件と 出典を ここに まとめます。

---

## KanjiVG（かきじゅんデータ）

- **どこで使っているか**：`data/kanjivg-kana.js`
  （ひらがな・カタカナ 176 文字の ストロークパス。お手本・かきじゅんアニメ・
  なぞり書き・自動採点は すべて このデータで 動いています）
- **出典**：<https://kanjivg.tagaini.net>
  Copyright (C) 2009/2010/2011 Ulrich Apel.
- **ライセンス**：Creative Commons Attribution-Share Alike 3.0（CC BY-SA 3.0）
  <https://creativecommons.org/licenses/by-sa/3.0/>

`data/kanjivg-kana.js` は KanjiVG の SVG から `d` 属性だけを ぬき出した
**派生物**なので、CC BY-SA 3.0 が そのまま かかります（継承）。
このファイルを 別のところで 使うときも、出典表示と 同じライセンスでの
配布が 必要です。リポジトリ全体の MIT ライセンスは このファイルには
かかりません。

> **もとは CDN から とっていました。**
> 使うたびに `cdn.jsdelivr.net` から 読んでいましたが、学校の
> ネットワークが そこを ふさいでいると **お手本も かきじゅんアニメも
> なぞり書きも 出ません。** 児童からは「こわれている」としか 見えず、
> 原因は アプリの外に あるので 先生が しらべても わかりません。
> 49KB しか ないので、リポジトリの中に 持つことにしました。
> つくりなおすとき： `npm run kanjivg`

---

## React / ReactDOM

- **どこで使っているか**：`vendor/react.js`（生成物）
- **出典**：<https://react.dev> / Meta Platforms, Inc.
- **ライセンス**：MIT
- **版**：`package.json` の devDependencies で 固定（18.3.1）

npm から とってきた UMD 版を そのまま つないだものです。
もとは `unpkg.com` から 読んでいましたが、学校で ふさがれると
**画面が 白いまま 何も 出なくなる**ため、自分側に 置きました。

---

## Tailwind CSS

- **どこで使っているか**：`css/app.css`（生成物の 前半）
- **出典**：<https://tailwindcss.com>
- **ライセンス**：MIT
- **版**：`package.json` の devDependencies で 固定（3.4.19）

もとは `cdn.tailwindcss.com` を ブラウザに 読ませて、その場で CSS を
つくらせていました。ふさがれると 色も レイアウトも 一切 当たりません。
いまは ビルド時に 使うクラスぶんだけ つくっています。

---

## Klee One（フォント）

- **どこで使っているか**：`index.html` の Google Fonts 読みこみ
- **出典**：<https://fonts.google.com/specimen/Klee+One>
- **ライセンス**：SIL Open Font License 1.1

これは **見た目だけ**の依存です。学校で ふさがれても
字の形が かわるだけで アプリは そのまま 動きます
（端末側の 教科書体・ゴシック体に 落ちます）。
そのため 自己ホストせず CDN のままに してあります。

## UD デジタル 教科書体

Morisawa 社の 製品で、Windows 10 以降に 標準搭載されています。
**Web フォントとして 配布することは 許諾されていない**ため、
このリポジトリには 一切 含まれていません。
端末に 入っていれば 使われる、という 指定だけを しています
（`src/extra.css` の `--kkm-font-kyokasho`）。
