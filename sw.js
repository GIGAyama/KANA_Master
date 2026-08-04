/* ==============================================================
   Service Worker — ひらがな・カタカナ かきかたマスター
   --------------------------------------------------------------
   ・アプリ本体（App shell）を キャッシュして 圏外でも 起動できるようにする
   ・キャッシュ名に バージョンを 持たせ、更新時に 古いキャッシュを 掃除する

   【重要】activate では 自アプリ以外の キャッシュを 削除しない。
     gigayama.github.io は 複数アプリで 同一オリジンを 共有しているため、
     CACHE_PREFIX で はじまる キャッシュだけを 掃除する。
     （caches.keys() を 全消しすると 他のアプリが 圏外で 起動しなくなる）

   【重要】この Service Worker は localStorage を 一切 操作しない。
     （Service Worker からは そもそも 触れない。学習ログは 画面側の責任）
   ============================================================== */

// 原本を直して npm run build を走らせたら、かならず この数字を 上げること
// （上げ忘れると 古いキャッシュが 残り、更新が 反映されない）
const APP_VERSION = 'v14';

// このアプリ専用の 目じるし。
// キャッシュ置き場（CacheStorage）は gigayama.github.io という サイト全体で
// 共有されており、同じサイトに 置いた 他のアプリの 保存も 一緒に 見えてしまう。
// 掃除するときは「自分の 名札が 付いた 保存だけ」に 限ること。
const CACHE_PREFIX  = 'kkm-';
const CACHE_STATIC  = `${CACHE_PREFIX}shell-${APP_VERSION}`;
const CACHE_RUNTIME = `${CACHE_PREFIX}runtime-${APP_VERSION}`;

/* 起動に 必要な アプリ本体。相対パスで 登録し、GitHub Pages の
   サブパス（/KANA_Master/）でも そのまま 動くようにする。

   CDN から とってくる 実行コードは もう 1 バイトも 無い。
   React も かきじゅんデータも この一覧の 中に 入っている。 */
const PRECACHE_URLS = [
  './',
  './index.html',
  './offline.html',
  './manifest.webmanifest',
  './css/app.css',
  './vendor/react.js',
  './data/kanjivg-kana.js',
  './studyLog.js',
  './studySession.js',
  './js/app.js',
  './js/install-hook.js',
  './js/boot.js',
  './favicon.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-192.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
  './mascot.png',
  './mascot-full.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_STATIC);
    // 1本でも 失敗すると addAll 全体が 落ちるため、個別に 入れる
    await Promise.all(PRECACHE_URLS.map((u) =>
      cache.add(new Request(u, { cache: 'reload' }))
        .catch((err) => console.warn('[sw] precache skipped', u, err))));

    // ここでは skipWaiting しない。
    // 児童が 書いている 最中に 画面が 入れかわると、書きかけの 字や
    // えらんだ もじが 消える。画面側で「さいしんに する」を
    // おしてもらってから 切りかえる（js/boot.js）。
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE_STATIC && k !== CACHE_RUNTIME)
      .map((k) => caches.delete(k)));          // ← 自アプリ分だけ 削除
    await self.clients.claim();
  })());
});

// 画面側で「さいしんに する」が おされたときだけ 切りかえる
self.addEventListener('message', (event) => {
  const d = event.data;
  // 旧版の画面が 文字列で 送ってくる場合も 受けられるようにしておく
  if (d === 'SKIP_WAITING' || (d && d.type === 'SKIP_WAITING')) self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (e) { return; }

  /* 1) 画面遷移（HTML）：ネットワーク優先。
        更新を すぐ 届け、圏外なら 保存してある 本体を 出す。
        本体も まだ 無い（はじめから 圏外だった）ときは、ブラウザの
        「接続できません」画面ではなく アプリと同じ配色の offline.html。 */
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_STATIC);
        cache.put('./index.html', fresh.clone()).catch(() => {});
        return fresh;
      } catch (e) {
        const cache = await caches.open(CACHE_STATIC);
        return (await cache.match('./index.html'))
            || (await cache.match('./'))
            || (await cache.match('./offline.html'))
            || Response.error();
      }
    })());
    return;
  }

  /* 2) マニフェスト：ネットワーク優先（圏外のときだけ キャッシュ）。
        ブラウザは この内容で インストール可否と アプリの識別子（id）を
        判定する。キャッシュ優先にすると 古い id を 返してしまい、
        「アプリにする」が 出ない・別アプリと 同一視される 原因になる。 */
  if (url.origin === self.location.origin && url.pathname.endsWith('/manifest.webmanifest')) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_STATIC);
      try {
        const fresh = await fetch(req);
        if (fresh && fresh.ok) cache.put(req, fresh.clone()).catch(() => {});
        return fresh;
      } catch (e) {
        return (await cache.match(req))
            || (await cache.match('./manifest.webmanifest'))
            || Response.error();
      }
    })());
    return;
  }

  /* 3) このアプリの フォルダ（/KANA_Master/…）の 中のファイル：
        キャッシュ優先（校内 Wi-Fi が こんでいても すぐ 出る）→ 影で 更新。
        ※ 同じサイトでも 自分の フォルダの 外＝ 他のアプリの ファイルは
          さわらない。横取りして キャッシュすると、他のアプリに
          古い 中身を 返してしまう。 */
  if (req.url.startsWith(self.registration.scope)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_STATIC);
      const cached = await cache.match(req);
      if (cached) {
        fetch(req).then((res) => {
          if (res && res.ok) cache.put(req, res.clone()).catch(() => {});
        }).catch(() => {});
        return cached;
      }
      try {
        const res = await fetch(req);
        if (res && res.ok) {
          const runtime = await caches.open(CACHE_RUNTIME);
          runtime.put(req, res.clone()).catch(() => {});
        }
        return res;
      } catch (e) {
        return Response.error();
      }
    })());
    return;
  }

  // それ以外（Google Fonts など 見た目だけの もの）は ふつうに ネットワークへ。
  // 届かなくても 端末の フォントに 落ちるだけで、アプリは 動く。
});
