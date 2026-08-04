#!/usr/bin/env node
/* ==============================================================
   tools/fetch-kanjivg.mjs
   ── かきじゅんデータ（KanjiVG）を リポジトリの中に とりこむ

   つかいかた:  npm run kanjivg

   なぜ これが 要るのか
   --------------------------------------------------------------
   このアプリの いちばん だいじな機能（かきじゅんアニメ・お手本・なぞり書き）は
   KanjiVG の かきじゅんデータで 動いている。
   これまでは 使うたびに cdn.jsdelivr.net から とってきていた。

   ところが 学校のネットワークは cdn.jsdelivr.net を ふさいでいることがある。
   ふさがれると fetch が 失敗して null が かえり、
   **お手本も かきじゅんアニメも なぞり書きも 出ない。**
   児童からは「こわれている」としか 見えないうえに、
   原因は アプリの外に あるので 先生が しらべても わからない。

   そこで 使う文字（ひらがな・カタカナ）ぶんの かきじゅんデータを
   あらかじめ リポジトリの中に とりこんでおく。
   150文字ぶんでも 数十KB しかない。ネットワークに 一切 たよらなくなる。

   出力： data/kanjivg-kana.js（生成物。手で編集しない）

   ライセンス
   --------------------------------------------------------------
   KanjiVG は Creative Commons Attribution-Share Alike 3.0（CC BY-SA 3.0）。
   出典表示が 必要なので、生成物の 先頭と THIRD-PARTY-NOTICES.md に 明記する。
   ============================================================== */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji';

/* とりこむ文字。
   App.jsx の 50音表・濁音・半濁音・小書きを すべて ふくむ範囲を
   コードポイントで まとめて指定する。あとから 表に文字を足しても
   ここを 直さずに すむようにするため、範囲で 取る。
     U+3041〜U+3096 … ひらがな（ぁ〜ゖ）
     U+30A1〜U+30FA … カタカナ（ァ〜ヺ）
   KanjiVG に 無いものは 404 になるので、その文字だけ とばす。 */
const RANGES = [[0x3041, 0x3096], [0x30a1, 0x30fa]];

const chars = [];
for (const [from, to] of RANGES) {
  for (let cp = from; cp <= to; cp++) chars.push(String.fromCodePoint(cp));
}

/* KanjiVG の SVG から「線そのもの」の d だけを取り出す。
   ファイルには かきじゅんの 番号を書いた <text> の グループも 入っているが、
   そちらは <path> ではないので 自然に 落ちる。
   ブラウザ側（App.jsx）が これまで やっていた
   `doc.querySelectorAll('path')` と 同じ結果に なるように そろえてある。 */
function extractPaths(svgText) {
  const out = [];
  const re = /<path\b[^>]*\bd="([^"]+)"/g;
  let m;
  while ((m = re.exec(svgText)) !== null) out.push(m[1]);
  return out;
}

async function fetchOne(char) {
  const hex = char.codePointAt(0).toString(16).padStart(5, '0');
  const res = await fetch(`${BASE}/${hex}.svg`);
  if (res.status === 404) return null;          // KanjiVG に無い文字
  if (!res.ok) throw new Error(`${char} (${hex}): HTTP ${res.status}`);
  const paths = extractPaths(await res.text());
  return paths.length ? paths : null;
}

const data = {};
let missing = [];
// 一度に 全部 投げると レートリミットに かかるので 8文字ずつ 進める
for (let i = 0; i < chars.length; i += 8) {
  const batch = chars.slice(i, i + 8);
  const got = await Promise.all(batch.map(async (c) => {
    for (let retry = 0; ; retry++) {
      try { return [c, await fetchOne(c)]; }
      catch (e) {
        if (retry >= 3) throw e;
        await new Promise((r) => setTimeout(r, 500 * 2 ** retry));
      }
    }
  }));
  for (const [c, paths] of got) {
    if (paths) data[c] = paths; else missing.push(c);
  }
  process.stdout.write(`\r  ${Math.min(i + 8, chars.length)} / ${chars.length}`);
}
process.stdout.write('\n');

const header = `/* =============================================================
   data/kanjivg-kana.js — かきじゅんデータ（生成物・手で編集しない）

   つくりなおす:  npm run kanjivg

   出典: KanjiVG  https://kanjivg.tagaini.net
     Copyright (C) 2009/2010/2011 Ulrich Apel.
     Licensed under Creative Commons Attribution-Share Alike 3.0
     https://creativecommons.org/licenses/by-sa/3.0/
   ひらがな・カタカナ ${Object.keys(data).length} 文字ぶんの ストロークパス（d 属性）だけを
   ぬき出したもの。SVG の 座標系は 109×109（KanjiVG の 既定）。

   これを リポジトリの中に 置いておくことで、学校のネットワークが
   cdn.jsdelivr.net を ふさいでいても かきじゅんアニメが 出る。
   ============================================================= */
globalThis.KANJIVG_KANA = `;

mkdirSync(join(ROOT, 'data'), { recursive: true });
const body = JSON.stringify(data);
writeFileSync(join(ROOT, 'data/kanjivg-kana.js'), `${header}${body};\n`, 'utf8');

console.log(`✔ data/kanjivg-kana.js  ${Object.keys(data).length} 文字 / ${(body.length / 1024).toFixed(1)} KB`);
if (missing.length) console.log(`  KanjiVG に無かった文字（${missing.length}）: ${missing.join('')}`);
