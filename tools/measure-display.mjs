#!/usr/bin/env node
/* ==============================================================
   tools/measure-display.mjs — 実ブラウザで「見え方」を測る

   つかいかた:
     node tools/serve.mjs 8788 &
     node tools/measure-display.mjs [http://127.0.0.1:8788/KANA_Master/]

   測るもの
     1. コントラスト比（本文 4.5:1 / 大きな文字 3:1）
     2. タップ領域 44px（疑似要素 ::after こみ）
     3. 320px 幅で 横スクロールが 出ないか
     4. CSP 違反・JS エラー

   読むだけでは わからないので、画面を 実際に 歩いて 測る。
   ============================================================== */
import { chromium } from 'playwright';

const URL_BASE = process.argv[2] || 'http://127.0.0.1:8788/KANA_Master/';
// CHROMIUM_PATH を 決めなければ Playwright が 自分で 入れた ブラウザを つかう（CI はこれ）
const EXE = process.env.CHROMIUM_PATH || undefined;

/* 歩く画面。name はレポート用、steps は そこへ行くための クリック。 */
const SCREENS = [
  { name: 'ホーム',            steps: [] },
  { name: 'かく（もじ表）',     steps: ['かく'] },
  { name: 'かく（れんしゅう）', steps: ['かく', '@firstChar'] },
  { name: 'よむ',              steps: ['よむ'] },
  { name: 'とくべつな おと',    steps: ['とくべつ'] },
  { name: 'ことばずかん',       steps: ['ずかん'] },
  { name: 'はんこずかん（モーダル）', steps: ['@badges'] },
  { name: 'リセットの かくにん',   steps: ['@reset'] },
];

/* ── ブラウザの中で 走らせる 計測本体 ────────────────────────
   ⚠️ 色は 数字を 拾って 読んではいけない。
      Tailwind v4 は oklch() で 書き出すし、グラデーションや
      半透明が 混ざると 素朴な 解析は 全部 こわれる。
      1px 実際に 塗って getImageData で 読むのが いちばん 確実。 */
const IN_PAGE = () => {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 1;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  const parse = (s) => {
    if (!s) return [0, 0, 0, 0];
    cx.clearRect(0, 0, 1, 1);
    cx.fillStyle = '#000';
    cx.fillStyle = s;                       // 解釈できないと #000 のまま残る
    cx.fillRect(0, 0, 1, 1);
    const d = cx.getImageData(0, 0, 1, 1).data;
    const a = d[3] / 255;
    return a === 0 ? [0, 0, 0, 0] : [d[0] / a, d[1] / a, d[2] / a, a];
  };
  const lum = ([r, g, b]) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const over = (fg, bg) => {
    const a = fg[3];
    return [0, 1, 2].map((i) => fg[i] * a + bg[i] * (1 - a)).concat(1);
  };
  const ratio = (a, b) => {
    const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (l1 + 0.05) / (l2 + 0.05);
  };

  /* 実際に 目に 見えている 背景色。
     ⚠️ グラデーション背景は backgroundColor が 透明に なる。
        backgroundImage を 見ないと「白の上の白（比 1.0）」という 誤報になる。
        グラデーションは 中の 色を ぬき出して いちばん 暗い／明るいほうを 使う
        （最悪ケースで 測る）。 */
  const bgOf = (el) => {
    let acc = null;
    for (let n = el; n && n !== document.documentElement.parentNode; n = n.parentElement) {
      const st = getComputedStyle(n);
      const img = st.backgroundImage;
      let layer = parse(st.backgroundColor);
      if (img && img !== 'none') {
        const cols = img.match(/(rgba?\([^)]*\)|oklch\([^)]*\)|#[0-9a-f]{3,8})/gi) || [];
        const solid = cols.map(parse).filter((c) => c[3] > 0.5);
        if (solid.length) {
          // 前景と いちばん 近い＝いちばん 読みにくい 層を 代表に する
          solid.sort((a, b) => lum(a) - lum(b));
          const cand = solid[0];
          if (layer[3] < 1) layer = cand;
        }
      }
      if (layer[3] === 0) continue;
      acc = acc ? over(acc, layer) : layer;
      if (acc[3] >= 0.999) return acc;
    }
    return acc || [255, 255, 255, 1];
  };

  const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{1F1E6}-\u{1F1FF}]/u;
  const results = { contrast: [], tap: [] };

  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    const st = getComputedStyle(el);
    return st.visibility !== 'hidden' && st.display !== 'none' && parseFloat(st.opacity) > 0.05;
  };

  /* ── 1. コントラスト ─────────────────────────────── */
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.nodeValue.trim();
    if (!text) continue;
    const el = node.parentElement;
    if (!el || seen.has(el) || !visible(el)) continue;
    seen.add(el);
    // 絵文字は フォント自身の 色で 描かれ、CSS の color は 効かない。
    // 除外しないと 誤報に なる。
    if (EMOJI.test(text) && text.replace(EMOJI, '').trim() === '') continue;
    const st = getComputedStyle(el);
    // 使用不可の 状態は WCAG の 対象外。濃くすると「もう 済んだもの」が
    // 押せるように 見えてしまう。
    if (el.closest('[disabled],[aria-disabled="true"],.cursor-not-allowed')) continue;

    /* ⚠️ SVG の <text> は color ではなく fill で 描かれる。
       color を 読むと 継承した 別の色を 測ってしまい、
       比 1.0 のような ありえない 数字が 出る（誤報）。 */
    const isSvg = !!el.ownerSVGElement;
    const fgStr = isSvg && st.fill && st.fill !== 'none' ? st.fill : st.color;
    const fg = parse(fgStr);
    if (fg[3] === 0) continue;
    /* ⚠️ opacity を 見ないと 実際より 良い数字が 出る。
       getComputedStyle(el).color は opacity を 含まないので、
       .opacity-50 が 掛かった うすい文字を そのままの 濃さで
       測ってしまう。祖先の opacity を かけ合わせて 前景の α に 織りこむ。
       （背景側の 要素は 別に 塗られるので、ここでは 文字だけに 掛ける） */
    let op = 1;
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      op *= parseFloat(getComputedStyle(n).opacity);
      if (getComputedStyle(n).backgroundColor !== 'rgba(0, 0, 0, 0)') break;
    }
    // 祖先が opacity:0 で まだ 見えていないもの（かきじゅんアニメの 途中で
    // あとから 出てくる 番号など）は 測らない。測ると 比 1.0 の 誤報に なる。
    if (op < 0.05) continue;
    fg[3] *= op;
    const bg = bgOf(el);
    const r = ratio(over(fg, bg), bg);
    const size = parseFloat(st.fontSize);
    const weight = Number(st.fontWeight) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const need = large ? 3 : 4.5;
    if (r + 0.005 < need) {
      results.contrast.push({
        text: text.slice(0, 24), ratio: +r.toFixed(2), need,
        color: fgStr, size, weight,
        sel: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 4).join('.') : ''),
      });
    }
  }

  /* ── 2. タップ領域 ────────────────────────────────
     ボタンを 大きくして 満たすのではなく、疑似要素で 当たり判定だけを
     ひろげている 場合が あるので、::after まで 見る。 */
  const targets = document.querySelectorAll(
    'button, a[href], input:not([type=hidden]), select, textarea, [role="button"], [role="tab"], [tabindex]:not([tabindex="-1"])');
  for (const el of targets) {
    if (!visible(el)) continue;
    if (el.closest('[disabled],[aria-disabled="true"]')) continue;
    const r = el.getBoundingClientRect();
    let w = r.width, h = r.height;
    for (const pseudo of ['::after', '::before']) {
      const ps = getComputedStyle(el, pseudo);
      if (!ps || ps.content === 'none' || ps.position !== 'absolute') continue;
      w = Math.max(w, parseFloat(ps.minWidth) || 0, parseFloat(ps.width) || 0);
      h = Math.max(h, parseFloat(ps.minHeight) || 0, parseFloat(ps.height) || 0);
    }
    // input / select は 疑似要素を 持てないので、かこみの label が
    // 高さを 確保していれば それを 当たり判定と みなす
    if ((h < 44 || w < 44) && /^(INPUT|SELECT)$/.test(el.tagName)) {
      const lab = el.closest('label');
      if (lab) {
        const lr = lab.getBoundingClientRect();
        w = Math.max(w, lr.width); h = Math.max(h, lr.height);
      }
    }
    if (w + 0.5 < 44 || h + 0.5 < 44) {
      results.tap.push({
        label: (el.getAttribute('aria-label') || el.textContent || el.value || el.tagName).trim().slice(0, 24),
        w: +w.toFixed(1), h: +h.toFixed(1),
        sel: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : ''),
      });
    }
  }

  results.hScroll = document.documentElement.scrollWidth - document.documentElement.clientWidth;
  return results;
};

/* ── 画面を 歩く ─────────────────────────────────────────── */
async function goTo(page, steps) {
  await page.goto(URL_BASE, { waitUntil: 'load' });
  await page.waitForTimeout(900);
  for (const step of steps) {
    if (step === '@firstChar') {
      await page.locator('button.kkm-glyph, button').filter({ hasText: /^[ぁ-ゖァ-ヺ]$/ }).first().click({ timeout: 5000 });
    } else if (step === '@badges') {
      await page.getByRole('button', { name: 'ごほうびの はんこ ずかん を ひらく' }).first().click({ timeout: 5000 });
    } else if (step === '@reset') {
      await page.getByRole('button', { name: 'れんしゅうデータをリセット' }).first().click({ timeout: 5000 });
    } else {
      await page.getByRole('button', { name: step, exact: false }).first().click({ timeout: 5000 });
    }
    await page.waitForTimeout(700);
  }
  await page.waitForTimeout(400);
}

const browser = await chromium.launch(EXE ? { executablePath: EXE } : {});
const VIEWPORTS = [
  { name: '1366×768（Chromebook）', width: 1366, height: 768 },
  { name: '320×568（下限）',        width: 320,  height: 568 },
];

let totalContrast = 0, totalTap = 0, totalScroll = 0;
const problems = { contrast: new Map(), tap: new Map() };
const jsErrors = [], cspViolations = [];

for (const vp of VIEWPORTS) {
  console.log(`\n══ ${vp.name} ═══════════════════════════════════`);
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => jsErrors.push(e.message));
  page.on('console', (m) => {
    const t = m.text();
    if (/Content Security Policy|Refused to (load|execute|apply)/i.test(t)) cspViolations.push(t);
    else if (m.type() === 'error' && !/fonts\.googleapis\.com|ERR_CONNECTION_RESET|ERR_TUNNEL/.test(t)) jsErrors.push(t);
  });

  for (const s of SCREENS) {
    let r;
    try {
      await goTo(page, s.steps);
      r = await page.evaluate(IN_PAGE);
    } catch (e) {
      console.log(`  ${s.name.padEnd(18)} … たどりつけず（${String(e.message).split('\n')[0].slice(0, 60)}）`);
      continue;
    }
    totalContrast += r.contrast.length;
    totalTap += r.tap.length;
    if (vp.width === 320 && r.hScroll > 0) totalScroll += 1;
    for (const c of r.contrast) problems.contrast.set(`${c.sel}|${c.text}`, { ...c, screen: s.name, vp: vp.width });
    for (const t of r.tap) problems.tap.set(`${t.sel}|${t.label}`, { ...t, screen: s.name, vp: vp.width });
    console.log(`  ${s.name.padEnd(18)} コントラスト ${String(r.contrast.length).padStart(3)}件 / タップ44px未満 ${String(r.tap.length).padStart(3)}件 / 横はみ出し ${r.hScroll}px`);
  }
  await ctx.close();
}
await browser.close();

console.log('\n══ まとめ ═══════════════════════════════════');
console.log(`コントラスト基準未満 : ${problems.contrast.size} 種類（のべ ${totalContrast} 件）`);
for (const c of problems.contrast.values()) {
  console.log(`   ${String(c.ratio).padStart(5)}:1 (要 ${c.need})  "${c.text}"  ${c.color} ${c.size}px/${c.weight}  [${c.screen} ${c.vp}px]  ${c.sel}`);
}
console.log(`タップ領域 44px未満  : ${problems.tap.size} 種類（のべ ${totalTap} 件）`);
for (const t of problems.tap.values()) {
  console.log(`   ${String(t.w).padStart(6)}×${String(t.h).padEnd(6)} "${t.label}"  [${t.screen} ${t.vp}px]  ${t.sel}`);
}
console.log(`320px で 横スクロール : ${totalScroll} 画面`);
console.log(`CSP 違反             : ${cspViolations.length} 件`);
cspViolations.slice(0, 5).forEach((v) => console.log('   ', v.slice(0, 160)));
console.log(`JS エラー            : ${jsErrors.length} 件`);
[...new Set(jsErrors)].slice(0, 8).forEach((v) => console.log('   ', v.slice(0, 160)));

const ng = problems.contrast.size + problems.tap.size + totalScroll + cspViolations.length + jsErrors.length;
process.exit(ng ? 1 : 0);
