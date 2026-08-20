#!/usr/bin/env node
/* ==============================================================
   tools/measure-pwa.mjs — Service Worker の ふるまいを 実測する

   つかいかた:
     node tools/serve.mjs 8788 &
     node tools/measure-pwa.mjs [http://127.0.0.1:8788/KANA_Master/]

   sw.js を 読んでも わからないことばかりなので、実際に 動かして 見る。

     1. Service Worker が ほんとうに 登録されているか
     2. **はじめて ひらいたとき 勝手に 読みこみ直さないか（画面遷移 1回）**
     3. あたらしい ばんは 押すまで 切りかわらないか（3秒 放置）
     4. 押したら 切りかわるか
     5. 同じサイトの 他のアプリの キャッシュを 巻きぞえに していないか
     6. 圏外で 起動するか
     7. サーバーが 404 を かえしても アプリが 出るか（エラー画面を 保存しないか）
     8. 本体が 無ければ offline.html が 出るか
     9. App が 出てこないとき「なおす」ボタンが 出るか
    10. 「なおす」が 他のアプリの キャッシュを 巻きぞえに しないか
   ============================================================== */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const URL_BASE = process.argv[2] || 'http://127.0.0.1:8788/KANA_Master/';
// CHROMIUM_PATH を 決めなければ Playwright が 自分で 入れた ブラウザを つかう（CI はこれ）
const EXE = process.env.CHROMIUM_PATH || undefined;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SW = join(ROOT, 'sw.js');

const ok = (b) => (b ? '✅' : '❌');
const out = [];
const say = (label, pass, detail) => {
  out.push({ label, pass, detail });
  console.log(`${ok(pass)} ${label.padEnd(38)} ${detail}`);
};

const browser = await chromium.launch(EXE ? { executablePath: EXE } : {});
const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
const page = await ctx.newPage();

/* ── 1〜2. まっさらな 状態で 1回 ひらく ──────────────────
   controllerchange を そのまま 受けていると、activate の clients.claim() で
   ページが 管理下に 入った 瞬間に reload が 走り、**初回訪問が かならず
   1回 読みこみ直される**。画面遷移を 数えれば 一発で わかる。 */
let navCount = 0;
page.on('framenavigated', (f) => { if (f === page.mainFrame()) navCount++; });
await page.goto(URL_BASE, { waitUntil: 'load' });
await page.waitForTimeout(6000);   // SW の install → activate → claim を またぐ

const reg = await page.evaluate(async () => {
  const r = await navigator.serviceWorker.getRegistration();
  return r ? { scope: r.scope, active: !!r.active, waiting: !!r.waiting } : null;
});
say('Service Worker が登録されている', !!(reg && reg.active), reg ? `scope=${reg.scope}` : '登録なし');
say('初回訪問で勝手にリロードしない', navCount === 1, `画面遷移 ${navCount} 回（1回なら正常）`);

/* ── 5. 他アプリの キャッシュを 置いてから 版を 上げる ────
   gigayama.github.io は 同一オリジンを 数十本の アプリで 共有している。
   activate で caches.keys() を 全消しすると、他のアプリが 圏外で
   起動しなくなる。実際に 別名の キャッシュを 置いて 生き残るかを 見る。 */
await page.evaluate(async () => {
  await caches.open('keisan-card-static-v1').then((c) => c.put('/other-app-a', new Response('a')));
  await caches.open('townmap-shell-v3').then((c) => c.put('/other-app-b', new Response('b')));
});
const before = await page.evaluate(() => caches.keys());

/* ── 3. 版を 上げて、押すまで 切りかわらないことを 見る ── */
const swSrc = readFileSync(SW, 'utf8');
const bumped = swSrc.replace(/const APP_VERSION = '(v\d+)'/, (m, v) => `const APP_VERSION = '${v}-test'`);
if (bumped === swSrc) { console.error('APP_VERSION を書きかえられませんでした'); process.exit(2); }
writeFileSync(SW, bumped, 'utf8');
try {
  await page.evaluate(async () => {
    const r = await navigator.serviceWorker.getRegistration();
    await r.update();
  });
  await page.waitForTimeout(3000);   // 3秒 放置
  const st = await page.evaluate(async () => {
    const r = await navigator.serviceWorker.getRegistration();
    return { waiting: !!r.waiting, active: r.active && r.active.scriptURL };
  });
  say('押すまで切りかわらない（3秒放置）', st.waiting === true, st.waiting ? 'waiting のまま' : 'かってに 切りかわった');

  const toastShown = await page.locator('.kkm-update-toast').isVisible().catch(() => false);
  say('更新のおしらせが出る', toastShown, toastShown ? '「あたらしい ばんが あります」' : '出ていない');

  /* ── 4. 押したら 切りかわるか ───────────────────────── */
  if (toastShown) {
    navCount = 0;
    await page.locator('.kkm-update-toast__btn').click();
    await page.waitForTimeout(4000);
    const after = await page.evaluate(async () => {
      const r = await navigator.serviceWorker.getRegistration();
      return { waiting: !!r.waiting, keys: await caches.keys() };
    });
    say('押したら切りかわる', after.waiting === false && navCount >= 1, `waiting=${after.waiting} / 読みこみ直し ${navCount} 回`);

    /* ── 5. 判定 ───────────────────────────────────── */
    const survived = ['keisan-card-static-v1', 'townmap-shell-v3'].filter((k) => after.keys.includes(k));
    say('他アプリのキャッシュが残る', survived.length === 2,
      `${survived.length}/2 のこった（前: ${before.filter((k) => !k.startsWith('kkm-')).join(', ')}）`);
    const oldKkm = after.keys.filter((k) => k.startsWith('kkm-') && !k.includes('-test'));
    say('自アプリの古いキャッシュは消える', oldKkm.length === 0, `のこり ${oldKkm.length} 本: ${oldKkm.join(', ') || 'なし'}`);
  }
} finally {
  writeFileSync(SW, swSrc, 'utf8');   // 版を 元に もどす
}

/* ── 6. 圏外で 起動するか ─────────────────────────────── */
await page.goto(URL_BASE, { waitUntil: 'load' });
await page.waitForTimeout(2500);
await ctx.setOffline(true);
await page.reload({ waitUntil: 'load' }).catch(() => {});
await page.waitForTimeout(2500);
const offlineText = (await page.locator('#root').innerText().catch(() => '')).trim();
say('圏外でも起動する', offlineText.length > 100, `#root の文字数 ${offlineText.length}`);

/* ── 7. サーバーが 404 を かえしても アプリが 出るか ────
   fetch は 404 でも「成功」で かえる。navigate で それを そのまま
   cache.put すると、サーバーの エラー画面が **アプリ本体として** 保存され、
   圏外でも ずっと 404 が 出る。公開 URL（リポジトリ名）を 変えた 直後は、
   入れてある アプリが 古い URL を たたいて 必ず これを 踏む。
   手元のサーバーも 本番と 同じく 404.html を 404 で かえす。 */
await ctx.setOffline(false);
await page.goto(`${URL_BASE}nai-page-for-test.html`, { waitUntil: 'load' }).catch(() => {});
await page.waitForTimeout(2500);
const after404 = (await page.locator('#root').innerText().catch(() => '')).trim();
say('404 でも アプリが 出る', after404.length > 100, `#root の文字数 ${after404.length}`);

const shell404 = await page.evaluate(async () => {
  for (const name of await caches.keys()) {
    if (!name.startsWith('kkm-')) continue;
    const c = await caches.open(name);
    const r = await c.match('./index.html');
    if (r) return await r.text();
  }
  return '';
});
// 404.html だけが 持っている 文字を さがす（title に 入っているので 先頭ちかく）
const poisoned = /ページが みつかりません/.test(shell404);
say('404 を 本体として 保存しない', shell404.length > 0 && !poisoned,
  !shell404.length ? 'index.html が 保存されていない'
  : poisoned ? '**404.html が 本体として 保存された**'
  : '保存してある index.html は アプリ本体のまま');

/* ── 8. 本体が 無ければ offline.html が 出るか ─────────── */
await page.goto(URL_BASE, { waitUntil: 'load' });
await page.waitForTimeout(1500);
await ctx.setOffline(false);
await page.evaluate(async () => {
  // 本体（index.html / ./）だけ 消して、圏外に する
  for (const name of await caches.keys()) {
    if (!name.startsWith('kkm-')) continue;
    const c = await caches.open(name);
    for (const req of await c.keys()) {
      if (/\/KANA_Master\/(index\.html)?$/.test(new URL(req.url).pathname)) await c.delete(req);
    }
  }
});
await ctx.setOffline(true);
await page.reload({ waitUntil: 'load' }).catch(() => {});
await page.waitForTimeout(1500);
const body = await page.locator('body').innerText().catch(() => '');
say('offline.html が出る', /インターネット/.test(body), JSON.stringify(body.replace(/\s+/g, ' ').slice(0, 40)));

/* ── 9〜10. App が 出てこないときの 逃げ道 ────────────────
   index.html は 出たのに js/app.js が 来ない、という 止まり方を つくる。
   児童からは「よみこみちゅう… のまま」に しか 見えない やつ。
   まっさらな 文脈（Service Worker も キャッシュも 無い）で 見る。
   ここが 動かないと、おそい 回線の 教室は 手の うちようが なくなる。 */
{
  const ctx2 = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const p2 = await ctx2.newPage();
  await p2.route('**/js/app.js', (route) => route.abort());
  await p2.goto(URL_BASE, { waitUntil: 'domcontentloaded' }).catch(() => {});

  // 同じサイトの 他のアプリの 保存を 置いておく（巻きぞえの 検査用）
  await p2.evaluate(async () => {
    await caches.open('keisan-card-static-v1').then((c) => c.put('/other-app-a', new Response('a')));
    await caches.open('kkm-shell-vTEST').then((c) => c.put('/mine', new Response('m')));
  });

  const fix = p2.locator('button', { hasText: 'アプリを なおす' });
  const appeared = await fix.waitFor({ state: 'visible', timeout: 45000 }).then(() => true).catch(() => false);
  say('止まったら「なおす」が出る', appeared, appeared ? '25秒で ボタンが 出た' : '出ないまま');

  if (appeared) {
    await fix.click();
    await p2.waitForTimeout(3000);
    const keys = await p2.evaluate(() => caches.keys()).catch(() => []);
    const otherAlive = keys.includes('keisan-card-static-v1');
    const mineGone = !keys.includes('kkm-shell-vTEST');
    say('「なおす」は自分の分だけ消す', otherAlive && mineGone,
      `他アプリ ${otherAlive ? 'のこった' : '**消えた**'} / 自分 ${mineGone ? '消えた' : 'のこった'}`);
  }
  await ctx2.close();
}

await browser.close();
console.log(`\n合格 ${out.filter((o) => o.pass).length} / ${out.length}`);
process.exit(out.every((o) => o.pass) ? 0 : 1);
