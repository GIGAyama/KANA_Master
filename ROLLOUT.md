# ロールアウトの記録 — KANA_Master

GIGA Standard v5 / Part III（`/rollout`）。
**ほかのリポジトリにも 効く 知見**を ここに 残す。

- 2026-08-04 P0 → P0.5 → P1 → P2 → P3（一部）→ P4 を 実施
- ブランチ `claude/rollout-abbu1c`
- 詳しい 実測値は `AUDIT.md`

---

## このリポジトリで 何を したか

| フェーズ | 内容 | 結果 |
|---|---|---|
| P0 法務 | LICENSE / dependabot.yml / .gitignore / THIRD-PARTY-NOTICES.md | 新規作成 |
| **P0.5 依存** | `@babel/standalone` ＋ Tailwind CDN ＋ unpkg React ＋ jsDelivr KanjiVG を 全廃 | **CDN 実行コード 0 バイト** |
| P1 表示・PWA | 拡大禁止の解除／コントラスト／タップ44px／CSP／SW 一式 | コントラスト 0件・タップ 0件・PWA 9/9 |
| P2 性能 | 画像は 前回までに 最適化済み（最大 38.9KB）。maskable を 画素で 確認 | 追加作業なし |
| P3 保守性 | MANUAL.md / AUDIT.md / README 改訂。**分割は 提案に とどめた** | — |
| P4 品質ゲート | `tools/check-project.mjs`（20項目・`--self-test` 付き）＋ CI | `pull_request` でも 走る |

---

## ほかのリポジトリでも 使える 知見

### 1. 🆕 かきじゅんデータ（KanjiVG）を CDN から 取っているアプリは、**中心機能ごと 止まっている**

v5 §6 は 「React / Tailwind / Babel を ブラウザへ 送るな」と 書いているが、
**同じ 話が データにも ある。**

このアプリは `cdn.jsdelivr.net/gh/KanjiVG/kanjivg@master/kanji/*.svg` を
使うたび 取りに いっていた。ふさがれると `fetch` が 失敗して `null` が かえり、
**お手本も かきじゅんアニメも なぞり書きも 出ない。**
「かきかたマスター」の 中心機能が 丸ごと 消える。

ひらがな・カタカナ 176文字ぶんで **49KB しか なかった**。持ってしまえばよい。

```bash
# 横断でさがす
grep -rn "cdn.jsdelivr.net/gh/KanjiVG" $(git ls-files '*.js' '*.jsx' '*.html')
```

**`raw.githubusercontent.com` は この作業環境から 到達できる**
（`cdn.jsdelivr.net` は 不可）。取りこみ用スクリプトは
`tools/fetch-kanjivg.mjs` が そのまま 流用できる。
ライセンス（CC BY-SA 3.0）の 表示を 忘れないこと。

### 2. 🆕 コントラストを 測るなら、`opacity` と SVG の `fill` を 見ないと 数字が 嘘に なる

v5 §7-2 は oklch とグラデーションと絵文字を 挙げているが、
実際に 当ててみて **さらに 3 つ** 出た。

| 見落とし | 何が 起きるか |
|---|---|
| **`opacity`** | `getComputedStyle(el).color` は opacity を **含まない**。`text-sumi-700`（9.75）に `opacity-70` が 掛かっていると 実際は **3.39**。良い数字が 出るので 気づけない |
| **SVG の `<text>`** | `color` ではなく `fill` で 描かれる。`color` を 読むと **比 1.0** の 誤報 |
| **祖先が `opacity: 0`** | アニメの 途中で あとから 出る 要素。これも **比 1.0** の 誤報 |

このアプリでは 色を 直したあと、**`opacity` を 見るように して はじめて
残り 5件が 見えた。** 色だけ 直して 終わりに していたら 見のがしていた。

### 3. 🆕 `.tap-44` は `:where()` で 書く

v5 §2-9 の レシピは `.tap-44 { position: relative }`。
これを そのまま 当てると、**すでに Tailwind の `.absolute` が 付いている
「とじる」ボタンの 位置指定を 上書きして こわす**（詳細度が 同じで、
CSS の 読みこみ順しだいで どちらが 勝つか 変わる＝こわれやすい）。

```css
:where(.tap-44) { position: relative; }   /* 詳細度 0 なので .absolute が 勝つ */
```

### 4. 🆕 タップ領域は **1つずつ 付けて 回らない**

このアプリは `.kkm-btn` が 81 か所に 付いていた。1つずつ `.tap-44` を
足していたら かならず 付け忘れる（v5 §4 の「送信ボタンだけ 漏れていた」と 同じ形）。

```css
.kkm-btn::before { /* 当たり判定だけ 44×44 */ }
```

**注意：`::after` が すでに 波紋演出（`.kkm-ripple::after`）に 使われていることが 多い。**
その場合は `::before` を つかう。

### 5. 🆕 `input[type=range]` は 疑似要素が 使えない

スライダーは 帯が 8px しか なく 指では つかめないが、`input` は 疑似要素を
持てないので `.tap-44` が 効かない。
**帯の 見た目は 8px の まま、`input` の 高さだけ 44px に する。**

```css
input[type="range"] { height: 44px; background: transparent; -webkit-appearance: none; }
input[type="range"]::-webkit-slider-runnable-track { height: 8px; }
input[type="range"]::-webkit-slider-thumb { width: 24px; height: 24px; margin-top: -8px; }
```

このとき **古い `input[type=range] { height: 8px }` が あとの方に 残っていると
黙って 上書きされて 効かない。** 測っても 直っていないので 混乱する。

### 6. 🆕 品質ゲートの 検査を 書いたら、**わざと 壊して 確かめる**

v5 §P4 の とおり。実際に やって、**自分が 書いた 検査の 不具合が 2件** 出た。

| 不具合 | 中身 |
|---|---|
| CSP の 取りこぼし | `content=["']…["']` と ゆるく 受けたため `default-src 'self'` の シングルクォートで 切れ、**いつも「object-src が ない」に なる** |
| インライン検査の 誤検知 | 「CSP を 入れると `<script>` が 動かなくなる」と 書いた **HTMLコメント**に 反応。判定前に コメントを 落とす |

**CSP を 検査するときは `content="([^"]*)"` と ダブルクォート前提で 取ること。**
CSP の 中身は シングルクォートだらけなので、ゆるい 受け方は 必ず こわれる。

### 7. 🆕 「生成物が 原本と そろっているか」の 検査は `git status` の **2文字目**を 見る

`git status --porcelain` の 出力を そのまま 見ると、
**はじめて コミットする ときに 必ず 落ちる**（新規追加 `A ` を 差分と 取りちがえる）。

```
A   … 追加したが 中身は そろっている（合格）
AM  … ビルドし直したら 中身が かわった（＝走らせ忘れ）
??  … 追跡していない 生成物
```

### 8. 🆕 `package.json` に `"type": "module"` を 足すと、既存の CommonJS ツールが 死ぬ

`tools/check-study.js`（**9アプリ 共通の 先例**）は CommonJS。
`"type": "module"` を 入れた 瞬間に `require is not defined` で 動かなくなる。

**ビルドを 導入する リポジトリでは `"type": "module"` を 書かず、
自分の ツールを `.mjs` に する。** `tailwind.config.js` も CommonJS のままに する。

### 9. 🆕 `--no-save` で 入れた 道具は CI で 必ず こける

手元で `npm i --no-save playwright` として 測っていると、そのまま 動くので
気づけない。**CI は `npm ci` なので 入らず、`Cannot find package 'playwright'` で 落ちる。**

`npx playwright install` が 成功するのも 紛らわしい。あれは npx が その場で
取ってくるだけで、`node_modules` には 残らない。

**計測に つかう道具は かならず devDependencies に 版つきで 書くこと。**
確かめ方は「別の場所に `git archive` で 出して `npm ci` してから 走らせる」。

### 10. Tailwind CDN → ビルドに 移す前に、**クラス名を 組み立てていないか 数える**

CDN 版は ブラウザの DOM を 見て CSS を 作るので、動的に 組み立てた
クラス名でも 効く。ビルドは ソースを 読むので **効かなくなる。**

```bash
grep -on -- '-\${[a-zA-Z_][a-zA-Z0-9_.]*}' $(git ls-files '*.jsx')
```

このリポジトリは `TONES` 表から まるごと 取り出す 約束に なっていて
0 件だった（コメントで 明示されていた）。**移す前に かならず 数えること。**

### 11. 🆕 リポジトリを 改名すると、**配った PWA が 一台ずつ こわれる**

GitHub Pages の URL は リポジトリ名を そのまま 含む。改名すると
古い URL は **転送されず 404** になる（github.com のページは 転送されるので、
「GitHub は 転送してくれる」と 思いこみやすい）。

このリポジトリは `hiragana_katakan_kakikatamaster` → `KANA_Master` と
改名し、改名より前に ホーム画面へ 入れてあった 端末は そのあと
アドレスバーの ない まっ白な 英語の 404 しか 出なくなった。
インストール済みの アプリは `start_url` を **端末側に** 覚えているので、
リポジトリを どれだけ 直しても その端末には 届かない。

さらに 悪いことに、多くの Service Worker は これを **保存してしまう。**

```js
const fresh = await fetch(req);        // fetch は 404 でも「成功」で かえる
cache.put('./index.html', fresh.clone());   // ← 404 が アプリ本体に なる
return fresh;
```

こうなると 圏外でも 404 が 出る。`.ok` を 見てから 保存し、
`.ok` でない ときは **手元の本体で しのぐ**こと。
（`sw.js` の navigate ／ 検査は `SW_NAVIGATE_OK_ONLY` と
`tools/measure-pwa.mjs` の「404 でも アプリが 出る」）

**症状が 2 つに 分かれることに 注意。** 同じ 原因なのに、端末に
何が のこっているかで 見た目が ちがう。

| 見えかた | 中で 起きていること |
| --- | --- |
| サーバーの 404 | 古い URL に 何も 無い。そのまま 出る |
| **「よみこみちゅう…」から 動かない** | Service Worker が 保存していた **改名前の HTML** を 出し、その中の 部品だけが 消えた フォルダを さがす |

2 つめが やっかいで、**ブラウザでは ふつうに 動く**（正しい URL を
見ている）ため、「アプリだけ こわれている」ように 見える。さらに
**新しく 足した 画面（更新のおしらせ・止まったときの ボタン）は
古い HTML には 入っていない**ので 出ない。**出ないこと 自体が
「古い HTML を 見ている」目じるし**に なる。

横断で 効く 3 つ：

1. **改名する前に**、古い名前の リポジトリを 作り直して 転送用の
   `index.html`（`<meta http-equiv="refresh">`）を 置く。これが 唯一の
   「端末を 触らずに 済む」道。
2. `404.html` を 置く。GitHub の 英語の 404 は、子どもには ただの
   こわれた 画面。アプリへ もどる ボタンを 出す（**リンクは 絶対パス**。
   この1枚は いろいろな URL の 代わりに 出されるので、`./` だと ずれる）。
3. `sw.js` の navigate は `.ok` を 見る。

なお **記録は 消えない**。`localStorage` は パスではなく
オリジン（`https://<user>.github.io`）単位なので、同じ端末・同じブラウザなら
入れ直しても そのまま 引きつがれる。入れ直しを おねがいするときは、
これを 先に 伝えると 保護者が 安心する。

---

## v5 Part V の 「次にやること」への 反映

`kana_master` は **完了**（`@babel/standalone` 使用の 残り10本 のうち 1本）。
同じ手順が そのまま 使えるのは：

```
hagetaka-game / keisan-card / linker-clipper /
online-manuscript-paper（3系統）/ online-publisher-pro /
reflection_journal / townmap_mikke
（Tailwind CDN のみ: gmail_cleaner / officefile_converter）
```

このリポジトリの `tools/` は **ほぼ そのまま 持っていける**。
リポジトリ名（`/KANA_Master/`）を 変えるところは
`tools/serve.mjs` の `BASE` と `tools/check-project.mjs` の `MANIFEST_ID` の 2か所だけ。

**先に 横断で 数えておくと 早い：**

```bash
grep -rln "babel/standalone" $(git ls-files '*.html')
grep -rln "cdn.jsdelivr.net/gh/KanjiVG" $(git ls-files '*.js' '*.jsx' '*.html')
grep -rn "opacity-[1-8]0" $(git ls-files '*.jsx')      # 文字に かかっていないか
grep -Ln "startsWith" $(git ls-files '*sw.js')
```

---

## 未決（人間の判断待ち）

- `src/App.jsx`（7,471行 / 417KB）の 分割 — 分割案は `AUDIT.md` に 記載
- 提示モード（電子黒板）を 足すか
- 生成物を コミットする 方式で よいか
- 本番（`gigayama.github.io`）での 動作確認 — **作業環境から 到達できない**
