#!/usr/bin/env node
/* ==============================================================
   tools/check-project.mjs — 品質ゲート（静的な 見張り）

   つかいかた:  npm run check        （CI と 同じもの）

   ここで 見るのは「読めば わかること」だけ。
   コントラスト・タップ領域・Service Worker の ふるまいは 読んでも
   わからないので、実ブラウザの ツールで 別に 測る。
     node tools/measure-display.mjs
     node tools/measure-pwa.mjs

   ⚠️ 検査は かならず「わざと 壊して」通ることを たしかめること。
      「0件でした」だけでは、検査が 動いているのか 何も 見ていないのか
      区別が つかない。
        node tools/check-project.mjs --self-test
      で、各 検査に わざと 壊した 入力を 与えて、ちゃんと 落ちるかを 見る。
   ============================================================== */
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const p = (...xs) => join(ROOT, ...xs);
const read = (f) => (existsSync(p(f)) ? readFileSync(p(f), 'utf8') : null);

/* git が つかえない場所（tarball を ひろげただけ、など）でも
   検査ぜんたいが スタックトレースで 死なないようにする。
   「見られなかった」ことは はっきり 出す。だまって 素通りさせない。 */
const git = (args) => {
  try { return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); }
  catch (e) { return null; }
};

/* コメントを 落としてから 判定する。
   「localStorage は 操作しない」という **注意書き** に 検査が 反応して
   誤検知する、という 事故が 実際に あった。 */
const stripComments = (s) => s
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');

/* HTML の コメントも 同じ理由で 落とす。
   「CSP を 入れると <script> が 動かなくなる」と 書いた **説明文** に
   インライン検査が 反応して 誤検知した（実際に 踏んだ）。 */
const stripHtmlComments = (s) => s.replace(/<!--[\s\S]*?-->/g, ' ');

/* ── 検査の 定義 ────────────────────────────────────────
   run(ctx) は 問題の 説明（文字列）の 配列を 返す。空なら 合格。
   broken は 自己テスト用の「わざと 壊した 入力」。 */
const CHECKS = [

  { id: 'LEGAL_FILES', title: '法務ファイルが ある',
    run: () => ['LICENSE', '.gitignore', '.github/dependabot.yml', 'THIRD-PARTY-NOTICES.md']
      .filter((f) => !existsSync(p(f))).map((f) => `${f} が ない`),
    selfTest: () => (existsSync(p('LICENSE')) ? [] : ['x']).length === 0 },

  { id: 'SECRETS', title: '秘密ファイルを コミットしていない',
    run: () => {
      const out = git(['ls-files']);
      if (out === null) return ['git が つかえないので 見られなかった（未計測）'];
      return out.split('\n').filter((f) => /(^|\/)(\.clasp\.json|\.env(\..*)?|.*\.pem|id_rsa)$/.test(f))
        .map((f) => `${f} が 追跡されている`);
    } },

  { id: 'NO_BROWSER_BABEL', title: 'ブラウザで JSX を コンパイルしていない',
    files: ['index.html', 'offline.html'],
    test: (src, f) => (/babel\/standalone|type=["']text\/babel["']/.test(src)
      ? [`${f}: @babel/standalone を ブラウザへ 送っている（3MB・毎回コンパイル・ふさがれると 白い画面）`] : []),
    broken: '<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>' },

  { id: 'NO_CDN_CODE', title: 'CDN から 実行コードを 取っていない',
    files: ['index.html', 'offline.html', 'sw.js', 'src/App.jsx', 'src/boot.js', 'src/install-hook.js'],
    test: (src, f) => {
      const hits = [...src.matchAll(/https:\/\/(cdn\.jsdelivr\.net|unpkg\.com|cdnjs\.[a-z.]+|cdn\.tailwindcss\.com)[^\s"'`)]*/g)]
        .map((m) => m[0]);
      return hits.map((h) => `${f}: ${h} … 学校で ふさがれると 起動しない`);
    },
    broken: 'const u = "https://cdn.jsdelivr.net/npm/chart.js";' },

  { id: 'VIEWPORT', title: 'viewport が ただしい',
    files: ['index.html', 'offline.html'],
    test: (src, f) => {
      const m = src.match(/<meta[^>]*name=["']viewport["'][^>]*>/i);
      if (!m) return [`${f}: viewport が ない`];
      const c = m[0];
      const bad = [];
      if (!/viewport-fit=cover/.test(c)) bad.push(`${f}: viewport-fit=cover が ない`);
      if (/user-scalable\s*=\s*no|maximum-scale/.test(c)) bad.push(`${f}: 拡大を 禁止している（見えづらい子が 拡大できない）`);
      return bad;
    },
    broken: '<meta name="viewport" content="width=device-width, user-scalable=no, viewport-fit=cover">' },

  { id: 'CSP', title: 'CSP が 入っていて インラインを 許していない',
    files: ['index.html'],
    test: (src, f) => {
      /* content の 値は ダブルクォートで 囲む 前提で 取り出す。
         ["'] で ゆるく 受けると、`default-src 'self'` の
         シングルクォートで 切れてしまい、いつも「object-src が ない」に なる。 */
      const m = src.match(/<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*content="([^"]*)"/i);
      if (!m) return [`${f}: CSP が ない`];
      const c = m[1];
      const bad = [];
      if (/script-src[^;]*'unsafe-inline'/.test(c)) bad.push(`${f}: script-src に 'unsafe-inline' … CSP の 意味が ほぼ 無くなる`);
      if (/script-src[^;]*'unsafe-eval'/.test(c)) bad.push(`${f}: script-src に 'unsafe-eval'`);
      if (/frame-ancestors/.test(c)) bad.push(`${f}: frame-ancestors は <meta> では 無視される（HTTP ヘッダーで 設定すること）`);
      if (!/object-src\s+'none'/.test(c)) bad.push(`${f}: object-src 'none' が ない`);
      return bad;
    },
    broken: `<meta http-equiv="Content-Security-Policy" content="script-src 'self' 'unsafe-inline'; object-src 'none';">` },

  { id: 'NO_INLINE_SCRIPT', title: 'インラインの <script> と onclick= が ない',
    files: ['index.html', 'offline.html'],
    test: (src, f) => {
      const bad = [];
      src = stripHtmlComments(src);
      // src を 持たない <script> ＝ 中身が 書いてある
      for (const m of src.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi)) {
        if (m[1].trim()) bad.push(`${f}: インラインの <script> … CSP script-src 'self' では 動かない`);
      }
      if (/\son[a-z]+\s*=\s*["'][^"']/i.test(src)) bad.push(`${f}: onclick= などの 属性 … CSP script-src 'self' では 動かない`);
      return bad;
    },
    broken: '<button onclick="initGame()">start</button>' },

  { id: 'VIEWPORT_100VH', title: '100vh を 単独で 使っていない',
    files: ['src/extra.css', 'offline.html'],
    test: (src, f) => {
      const bad = [];
      const lines = src.split('\n');
      lines.forEach((line, i) => {
        if (!/\b100vh\b/.test(line)) return;
        // @supports not (height: 100dvh) の 中と、直前・直後に dvh が ある
        // 二段書きは 正しい形。前方も 見ないと 誤検知する。
        const near = lines.slice(Math.max(0, i - 6), i + 3).join('\n');
        if (/dvh/.test(near)) return;
        bad.push(`${f}:${i + 1}: 100vh が 単独（モバイルの アドレスバー分 はみ出す）`);
      });
      return bad;
    },
    broken: '.a { height: 100vh; }' },

  { id: 'SW_CACHE_WIPE', title: 'sw.js が 自アプリの キャッシュだけを 消している',
    files: ['sw.js'],
    test: (src, f) => {
      const code = stripComments(src);
      if (!/caches\.keys\(\)/.test(code)) return [];
      /* ⚠️ 「消す式」を 正規表現で 追ってはいけない。
            `(k) => caches.delete(k)` のような 書き方を 見落とす。
            見るべきは **startsWith で 絞る式が あるか**。 */
      if (!/startsWith\s*\(\s*CACHE_PREFIX|startsWith\s*\(\s*['"`]/.test(code)) {
        return [`${f}: caches.keys() を 接頭辞で 絞らずに 消している … 同じサイトの 他のアプリが 圏外で 起動しなくなる`];
      }
      return [];
    },
    broken: 'const k = await caches.keys(); await Promise.all(k.map((n) => caches.delete(n)));' },

  { id: 'SW_NO_SKIPWAITING_ON_INSTALL', title: 'sw.js の install で skipWaiting していない',
    files: ['sw.js'],
    test: (src, f) => {
      const code = stripComments(src);
      const m = code.match(/addEventListener\(\s*['"]install['"][\s\S]*?\n\}\);/);
      if (m && /skipWaiting/.test(m[0])) {
        return [`${f}: install の 中で skipWaiting している … 児童が 書いている 最中に 画面が 入れかわり、書きかけの 字が 消える`];
      }
      return [];
    },
    broken: `self.addEventListener('install', (e) => { self.skipWaiting(); });\n});` },

  { id: 'SW_NO_LOCALSTORAGE', title: 'sw.js が localStorage に 触れていない',
    files: ['sw.js'],
    test: (src, f) => (/localStorage/.test(stripComments(src)) ? [`${f}: localStorage を さわっている`] : []),
    broken: 'localStorage.setItem("a", 1);' },

  { id: 'NO_LOCALSTORAGE_CLEAR', title: 'localStorage.clear() を 使っていない',
    files: ['src/App.jsx', 'studyLog.js', 'studySession.js', 'src/boot.js'],
    test: (src, f) => (/localStorage\s*\.\s*clear\s*\(/.test(stripComments(src))
      ? [`${f}: localStorage.clear() … 9アプリ共通の 学習ログ（study.records.v1）まで 消える`] : []),
    broken: 'localStorage.clear();' },

  { id: 'SW_REGISTER_READYSTATE', title: 'Service Worker の登録に readyState の分岐が ある',
    files: ['src/boot.js'],
    test: (src, f) => {
      const code = stripComments(src);
      if (!/serviceWorker\s*\.\s*register/.test(code)) return [`${f}: 登録していない`];
      if (!/readyState/.test(code)) {
        return [`${f}: load を 待つだけ … もう load が 済んでいると リスナーは 付くが 二度と 呼ばれず、だまって 登録されない`];
      }
      return [];
    },
    broken: `window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));` },

  { id: 'CONTROLLERCHANGE_GUARD', title: 'controllerchange を 利用者が 押したときだけ 受けている',
    files: ['src/boot.js'],
    test: (src, f) => {
      const code = stripComments(src);
      if (!/controllerchange/.test(code)) return [];
      const m = code.match(/controllerchange[\s\S]{0,400}/);
      if (!/userAsked|askedUpdate|accepted/i.test(m[0])) {
        return [`${f}: controllerchange を そのまま 受けている … 初回訪問が かならず 1回 読みこみ直される`];
      }
      return [];
    },
    broken: `navigator.serviceWorker.addEventListener('controllerchange', () => location.reload());` },

  { id: 'SW_NAVIGATE_OK_ONLY', title: 'sw.js が エラー画面を アプリ本体として 保存していない',
    files: ['sw.js'],
    test: (src, f) => {
      const code = stripComments(src);
      const m = code.match(/req\.mode\s*===\s*['"]navigate['"][\s\S]*?\n  \}/);
      if (!m) return [`${f}: 画面遷移（navigate）の あつかいが 見あたらない`];
      if (!/\.ok\b/.test(m[0])) {
        return [`${f}: navigate の 返事を .ok で 見ていない … fetch は 404 でも 成功で かえる。`
              + ' サーバーの エラー画面を アプリ本体として 保存し、圏外でも 404 が 出つづける'];
      }
      return [];
    },
    broken: `  if (req.mode === 'navigate') {\n    const fresh = await fetch(req);\n    cache.put('./index.html', fresh.clone());\n    return fresh;\n  }` },

  { id: 'PAGES_404', title: '404.html が あって リンクが 絶対パス',
    run: () => {
      const src = read('404.html');
      if (!src) return ['404.html が ない … GitHub の 英語の 404（File not found）が そのまま 子どもに 出る'];
      const bad = [];
      /* この1枚は いろいろな URL の 代わりに 出される。相対パスだと
         行き先が たたかれた URL しだいで ずれる。 */
      const rels = [...stripHtmlComments(src).matchAll(/(?:href|src)\s*=\s*"(?!https?:|\/|#|data:)([^"]*)"/g)];
      if (rels.length) bad.push(`404.html: 相対パスの リンクが ある（${rels.map((r) => r[1]).join(', ')}） … /KANA_Master/ から はじまる 絶対パスに すること`);
      if (!/href\s*=\s*"\/KANA_Master\/"/.test(src)) bad.push('404.html: アプリに もどる リンク（/KANA_Master/）が ない');
      return bad;
    } },

  { id: 'MANIFEST_ID', title: 'manifest の id/scope/start_url が リポジトリ名の 絶対パス',
    run: () => {
      const src = read('manifest.webmanifest');
      if (!src) return ['manifest.webmanifest が ない'];
      const m = JSON.parse(src);
      const want = '/KANA_Master/';
      return ['id', 'scope', 'start_url']
        .filter((k) => !m[k] || !String(m[k]).startsWith(want))
        .map((k) => `manifest.webmanifest: ${k} = ${JSON.stringify(m[k])} … "${want}" から はじまる 絶対パスに すること`);
    } },

  { id: 'APPLE_TOUCH_ICON_OPAQUE', title: 'apple-touch-icon に 透明が ない',
    run: () => {
      const f = p('apple-touch-icon.png');
      if (!existsSync(f)) return ['apple-touch-icon.png が ない'];
      // PNG の IHDR：カラータイプ 4(gray+alpha) / 6(rgba) は 透明を 持てる
      const buf = readFileSync(f);
      const colorType = buf[25];
      const hasTRNS = buf.includes(Buffer.from('tRNS'));
      if (colorType === 4 || colorType === 6 || hasTRNS) {
        return ['apple-touch-icon.png が 透明を 持てる形式 … iOS は 透明を 黒で うめるので 四隅が 黒く 出る'];
      }
      return [];
    } },

  { id: 'IMG_SIZE', title: '画像が 150KB 以下',
    run: () => readdirSync(ROOT).filter((f) => f.endsWith('.png'))
      .filter((f) => statSync(p(f)).size > 150 * 1024)
      .map((f) => `${f}: ${(statSync(p(f)).size / 1024).toFixed(0)}KB … 150KB を こえている`) },

  { id: 'RT_COLOR', title: 'ふりがな（rt）の色を 決め打ちしていない',
    files: ['src/extra.css', 'offline.html', 'index.html'],
    test: (src, f) => {
      const bad = [];
      for (const m of src.matchAll(/(^|[\s,{}])rt\s*\{([^}]*)\}/g)) {
        if (/color\s*:/.test(m[2]) && !/inherit/.test(m[2])) {
          bad.push(`${f}: rt の色を 決め打ちしている … 色のついた ボタンの上で 読めなくなる`);
        }
      }
      return bad;
    },
    broken: 'rt { color: #666; }' },

  { id: 'BUILD_IS_FRESH', title: '生成物が 原本と そろっている',
    run: () => {
      // 原本を 直したのに npm run build を 走らせ忘れた、を 見つける。
      // ビルドし直して 差分が 出ないかを git で 見る。
      try {
        execFileSync(process.execPath, [p('tools/build.mjs')], { cwd: ROOT, stdio: 'ignore' });
      } catch (e) {
        return [`ビルドが 通らない: ${e.message.split('\n')[0]}`];
      }
      /* porcelain の 2文字目が 作業ツリー側の 状態。
         「A 」＝ 追加したが 中身は そろっている（合格）
         「AM」「 M」＝ ビルドし直したら 中身が かわった（＝走らせ忘れ）
         「??」＝ 追跡していない 生成物
         ここを 見わけないと、はじめて コミットする ときに かならず 落ちる。 */
      const status = git(['status', '--porcelain', '--', 'js', 'css', 'vendor']);
      if (status === null) return ['git が つかえないので 見られなかった（未計測）'];
      const lines = status.split('\n').filter(Boolean);
      const dirty = lines.filter((l) => l.startsWith('??') || l[1] === 'M' || l[1] === 'D');
      return dirty.length ? [`原本を 直したのに npm run build を 走らせていない:\n${dirty.join('\n')}`] : [];
    } },

  /* ことばずかんの 手あつさを まもる 検査。

     この アプリの もんだいは ぜんぶ WORD_BANK / WORD_BANK_KATA から
     つくる（あたまの おと・にた もじ さがし・なかまの ことば・
     ことばあつめの ヒント・しりとり）。ある字の ことばが 少ないと、
     その字の もんだいだけ **おなじ ことばが 何度も 出る**。
     だから「どの字にも 10 語いじょう」を 数で まもる。

     を・ヲ・ぢ・ヂ・ヅ は 日本語の しくみじょう ことばの 中に
     ほとんど 出てこない（を／ヲ は 助詞だけ、ぢ／づ は 現代かなづかいで
     つかえる ことばが かぎられ、カタカナ語には まず 出ない）。
     この 5 字だけは **いまの 数を 下限**に して、へったら 落とす。 */
  { id: 'WORD_COVERAGE', title: 'どの字にも ことばが 10語いじょう ある',
    files: ['src/App.jsx'],
    test: (src, f) => {
      const MIN = 10;
      // 日本語の しくみじょう 10 語に とどかない字。数字は「いまの 実数」＝下限。
      const FLOOR = { 'を': 0, 'ヲ': 0, 'ぢ': 5, 'ヂ': 0, 'ヅ': 4 };
      const block = (name, open, close) => {
        const i = src.indexOf(`const ${name} = ${open}`);
        if (i < 0) return null;
        let d = 0, j = i + `const ${name} = `.length;
        for (; j < src.length; j++) {
          if (src[j] === open) d++;
          if (src[j] === close) { d--; if (d === 0) return src.slice(i, j); }
        }
        return null;
      };
      const words = (name) => {
        const b = block(name, '[', ']');
        return b === null ? null : [...b.matchAll(/\{w:'([^']+)',p:'([^']+)',g:'([^']+)'\}/g)]
          .map((m) => ({ w: m[1], p: m[2], g: m[3] }));
      };
      const chars = (name) => {
        const b = block(name, '[', ']');
        return b === null ? null : [...b.matchAll(/'([^']*)'/g)].map((m) => m[1]).filter(Boolean);
      };
      const bad = [];
      const hira = words('WORD_BANK'), kata = words('WORD_BANK_KATA');
      if (!hira || !kata) return [`${f}: WORD_BANK / WORD_BANK_KATA が 読めない`];

      // ① なかま と さしえの 名まえが じっさいに ある か
      const pictBlock = block('PICTS', '{', '}');
      const groupBlock = block('WORD_GROUPS', '[', ']');
      const picts = new Set(pictBlock ? [...pictBlock.matchAll(/^\s{2}([a-zA-Z][a-zA-Z0-9]*)\s*:/gm)].map((m) => m[1]) : []);
      const groups = new Set(groupBlock ? [...groupBlock.matchAll(/key:\s*'([a-z]+)'/g)].map((m) => m[1]) : []);
      const seen = new Set();
      for (const x of [...hira, ...kata]) {
        if (picts.size && !picts.has(x.p)) bad.push(`${x.w}: さしえ '${x.p}' が PICTS に ない`);
        if (groups.size && !groups.has(x.g)) bad.push(`${x.w}: なかま '${x.g}' が WORD_GROUPS に ない`);
        if (seen.has(x.w)) bad.push(`${x.w}: おなじ ことばが 2 か所に ある`);
        seen.add(x.w);
      }

      // ② どの字にも 10 語いじょう あるか
      const tables = [
        ['ひらがな', ['HIRA_TABLE', 'HIRA_DAKUON_TABLE', 'HIRA_HANDAKUON_TABLE', 'HIRA_YOUON_TABLE'], hira],
        ['カタカナ', ['KATA_TABLE', 'KATA_DAKUON_TABLE', 'KATA_HANDAKUON_TABLE', 'KATA_YOUON_TABLE'], kata],
      ];
      for (const [label, names, bank] of tables) {
        const list = names.flatMap((n) => chars(n) || []);
        if (!list.length) { bad.push(`${label}の 50音表が 読めない`); continue; }
        const count = {};
        list.forEach((c) => { count[c] = 0; });
        bank.forEach((x) => {
          const once = new Set();
          for (const c of x.w) if (c in count && !once.has(c)) { once.add(c); count[c]++; }
        });
        const thin = list.filter((c) => count[c] < (c in FLOOR ? FLOOR[c] : MIN));
        thin.forEach((c) => bad.push(
          `${label}「${c}」の ことばが ${count[c]} 語（${c in FLOOR ? `下限 ${FLOOR[c]}` : `${MIN} 語いる`}）`));
      }
      return bad.slice(0, 20);
    },
    broken: "const WORD_BANK = [{w:'あい',p:'heart',g:'other'},];\nconst WORD_BANK_KATA = [{w:'アイ',p:'heart',g:'other'},];\nconst HIRA_TABLE = ['あ','い'];\nconst KATA_TABLE = ['ア','イ'];\n" },

  { id: 'FILE_SIZE', title: '1ファイルが 5,000行 / 400KB を こえていない',
    /* ⚠️ ここだけ 警告あつかい。
       巨大ファイルの 分割は 自動で やってはいけない（分割案を 出して
       合意を 取り、1機能ずつ 進める）ため、CI を 赤で 止め続けても
       誰も 直せない。数字は 出し続けて、忘れられないようにする。 */
    warnOnly: true,
    run: () => {
      const targets = ['src/App.jsx', 'index.html', 'sw.js', 'studySession.js', 'studyLog.js'];
      return targets.filter((f) => existsSync(p(f))).flatMap((f) => {
        const src = readFileSync(p(f), 'utf8');
        const lines = src.split('\n').length;
        const kb = Buffer.byteLength(src) / 1024;
        const bad = [];
        if (lines > 5000) bad.push(`${f}: ${lines} 行（上限 5,000）`);
        if (kb > 400) bad.push(`${f}: ${kb.toFixed(0)}KB（上限 400KB）`);
        return bad;
      });
    } },
];

/* ── 走らせる ──────────────────────────────────────────── */
const selfTest = process.argv.includes('--self-test');

if (selfTest) {
  console.log('── 自己テスト：わざと 壊した 入力を 与えて、検査が 落ちるかを 見る ──\n');
  let bad = 0;
  for (const c of CHECKS) {
    if (!c.broken || !c.test) { console.log(`  －  ${c.id.padEnd(30)} （壊した入力を 用意していない）`); continue; }
    const got = c.test(c.broken, '<self-test>');
    const caught = got.length > 0;
    if (!caught) bad++;
    console.log(`  ${caught ? '✅' : '❌'}  ${c.id.padEnd(30)} ${caught ? got[0].slice(0, 80) : '**見のがした**'}`);
  }
  console.log(`\n${bad === 0 ? '✅ 検査は ちゃんと 動いている' : `❌ ${bad} 件の 検査が 何も 見ていない`}`);
  process.exit(bad ? 1 : 0);
}

let failed = 0;
for (const c of CHECKS) {
  let problems = [];
  if (c.run) problems = c.run();
  else {
    for (const f of c.files) {
      const src = read(f);
      if (src === null) { problems.push(`${f} が ない`); continue; }
      problems.push(...c.test(src, f));
    }
  }
  if (problems.length) {
    if (!c.warnOnly) failed++;
    console.log(`${c.warnOnly ? '⚠️ ' : '❌'} ${c.title}${c.warnOnly ? '（警告：分割は 合意のうえで 進める）' : ''}`);
    problems.forEach((x) => console.log(`     ${x}`));
  } else {
    console.log(`✅ ${c.title}`);
  }
}
console.log(`\n${failed === 0 ? '✅ 品質ゲート 合格' : `❌ ${failed} 件`}`);
process.exit(failed ? 1 : 0);
