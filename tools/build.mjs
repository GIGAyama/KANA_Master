#!/usr/bin/env node
/* ==============================================================
   tools/build.mjs — 「先に つくっておく」ビルド

   つかいかた:  npm run build

   なぜ これが 要るのか
   --------------------------------------------------------------
   もとは ブラウザに つぎの 4 本を 読ませていた。

     https://cdn.tailwindcss.com                （CSS を その場で 生成）
     https://unpkg.com/react@18/…               （React 本体）
     https://unpkg.com/react-dom@18/…           （React DOM）
     https://unpkg.com/@babel/standalone/…      （JSX を その場で 変換・約3MB）

   学校のネットワークは これらを ふさいでいることがある。
   1本でも ふさがれると **画面が 白いまま 何も 出ない。**
   児童からは「こわれている」としか 見えず、原因は アプリの外に あるので
   先生が しらべても わからない。
   しかも @babel/standalone の 役目は「ブラウザの中で JSX を 翻訳すること」
   なので、ひらくたびに 42万字の App.jsx を 全部 コンパイルし直していた。

   そこで 全部 ここで 先に つくる。ブラウザは できあがったものを 読むだけ。

   原本（ここを直す）           生成物（手で編集しない）
   --------------------------------------------------------------
   src/App.jsx               →  js/app.js
   src/extra.css             ┐
   tailwind.config.js        ┴→ css/app.css
   src/install-hook.js       →  js/install-hook.js
   src/watchdog.js           →  js/watchdog.js
   src/boot.js               →  js/boot.js
   node_modules/react*       →  vendor/react.js
   （かきじゅんデータ は npm run kanjivg で data/kanjivg-kana.js）

   生成物も リポジトリに コミットする。GitHub Pages が リポジトリを
   そのまま 配るためで、ここを 追跡から 外すと 公開ページが 空になる。
   **原本を 直したら かならず `npm run build` を 走らせてから push すること。**
   （CI が 走らせ忘れを 見つける：tools/check-project.mjs）
   ============================================================== */
import { readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import esbuild from 'esbuild';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const p = (...xs) => join(ROOT, ...xs);
const kb = (f) => (statSync(f).size / 1024).toFixed(1) + ' KB';
const GENERATED = '/* 生成物です。手で編集しないでください。原本を直して `npm run build` を走らせること。 */\n';

for (const d of ['js', 'css', 'vendor']) mkdirSync(p(d), { recursive: true });

/* ── 1. vendor/react.js ────────────────────────────────────────
   react の package.json は exports で umd/ を 公開していないため
   require.resolve('react/umd/…') は ERR_PACKAGE_PATH_NOT_EXPORTED に なる。
   パスで 直に 指定すること。 */
const vendorParts = [
  'node_modules/react/umd/react.production.min.js',
  'node_modules/react-dom/umd/react-dom.production.min.js',
].map((rel) => readFileSync(p(rel), 'utf8'));
writeFileSync(
  p('vendor/react.js'),
  GENERATED + '/* React 18 + ReactDOM 18（UMD 版）。npm で版を固定して とりこんでいる。 */\n' +
  vendorParts.join('\n;\n'),
  'utf8',
);

/* ── 2. css/app.css ────────────────────────────────────────────
   Tailwind の CLI に 使うクラスを 探させて、いる分だけの CSS を つくる。
   そのうしろに アプリ固有の CSS（src/extra.css）を つなぐ。
   ならび順が だいじ：utilities より あとに 置かないと
   .kkm-app-root などの 上書きが 効かない。 */
const twEntry = p('.tailwind-entry.css');
writeFileSync(twEntry, '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n', 'utf8');
const twOut = execFileSync(
  process.execPath,
  [p('node_modules/tailwindcss/lib/cli.js'), '-c', p('tailwind.config.js'), '-i', twEntry, '--minify'],
  { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
);
writeFileSync(
  p('css/app.css'),
  GENERATED + twOut.trimEnd() + '\n\n/* ===== ここから src/extra.css（原本） ===== */\n' +
  readFileSync(p('src/extra.css'), 'utf8'),
  'utf8',
);
execFileSync('rm', ['-f', twEntry]);

/* ── 3. js/app.js ──────────────────────────────────────────────
   JSX を ここで 1 回だけ 変換する（ブラウザでは しない）。
   React / ReactDOM は vendor/react.js が 置いた グローバルを つかうので、
   classic ランタイム（React.createElement）に そろえる。 */
await esbuild.build({
  entryPoints: [p('src/App.jsx')],
  outfile: p('js/app.js'),
  bundle: true,
  format: 'iife',
  target: ['chrome100', 'safari15', 'firefox100'],
  jsx: 'transform',
  jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment',
  loader: { '.jsx': 'jsx' },
  minify: true,
  legalComments: 'none',
  banner: { js: GENERATED },
  logLevel: 'warning',
});

/* ── 4. そのままコピーするもの ─────────────────────────────── */
for (const name of ['install-hook.js', 'boot.js', 'watchdog.js']) {
  writeFileSync(p('js', name), GENERATED + readFileSync(p('src', name), 'utf8'), 'utf8');
}

console.log('✔ ビルド完了');
for (const f of ['vendor/react.js', 'css/app.css', 'js/app.js', 'js/install-hook.js', 'js/watchdog.js', 'js/boot.js', 'data/kanjivg-kana.js']) {
  console.log(`   ${f.padEnd(24)} ${kb(p(f))}`);
}
