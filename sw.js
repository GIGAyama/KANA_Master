/* ==============================================================
   Service Worker — ひらがな・カタカナ かきかたマスター
   --------------------------------------------------------------
   ・アプリ本体（App shell）と CDN 依存をキャッシュしてオフライン起動を可能にする
   ・練習した文字の KanjiVG（書き順データ）は使うたびにキャッシュに残し、
     一度でも見た文字は電波がなくても書けるようにする
   ・キャッシュ名にバージョンを持たせ、更新時に古いキャッシュを掃除する
   ============================================================== */

// App.jsx などを更新したら必ず数字を上げること（古いキャッシュを破棄するため）
const VERSION = 'v6';

// このアプリ専用の目じるし。
// キャッシュ置き場（CacheStorage）は gigayama.github.io というサイト全体で
// 共有されており、同じサイトに置いた他のアプリの保存も一緒に見えてしまう。
// 掃除するときは「自分の名札が付いた保存だけ」に限ること。
const CACHE_PREFIX  = 'kkm-';
const SHELL_CACHE   = `${CACHE_PREFIX}shell-${VERSION}`;
const RUNTIME_CACHE = `${CACHE_PREFIX}runtime-${VERSION}`;
const KANJI_CACHE   = `${CACHE_PREFIX}kanjivg`; // 文字データは版に依存しないので使い回す

// 起動に最低限必要なアプリ本体。相対パスで登録し、GitHub Pages のサブパスでも動く。
const SHELL_ASSETS = [
  './',
  './index.html',
  './App.jsx',
  './manifest.webmanifest',
  './favicon.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-192.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
];

// 初回起動を速くするために事前取得したい CDN 依存（取得失敗しても致命的にしない）
const CDN_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    // 本体は必須（1つでも欠けたら install 失敗にして再試行させる）
    await cache.addAll(SHELL_ASSETS);
    // CDN は best-effort（オフライン初回や CDN 障害でも install を失敗させない）
    await Promise.allSettled(CDN_ASSETS.map(async (url) => {
      try {
        const res = await fetch(url, { mode: 'cors' });
        if (res && (res.ok || res.type === 'opaque')) await cache.put(url, res.clone());
      } catch (e) { /* 無視 */ }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // 現行以外の shell/runtime キャッシュを削除（KanjiVG は残す）
    // ※ 対象は「kkm- で始まる＝このアプリの保存」だけ。ここで全部を消すと、
    //   同じ gigayama.github.io に置いた他のアプリ（けいさんカードなど）の
    //   オフライン用データまで巻きぞえで消えてしまう。
    const keep = new Set([SHELL_CACHE, RUNTIME_CACHE, KANJI_CACHE]);
    const names = await caches.keys();
    await Promise.all(names.map((n) =>
      (n.startsWith(CACHE_PREFIX) && !keep.has(n)) ? caches.delete(n) : null
    ));
    await self.clients.claim();
  })());
});

// ページからの指示で即時更新できるようにする
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

function isKanjiVG(url) {
  return url.hostname === 'cdn.jsdelivr.net' && url.pathname.includes('/KanjiVG/');
}
function isManifest(url) {
  return url.origin === self.location.origin && url.pathname.endsWith('/manifest.webmanifest');
}
function isCdnDependency(url) {
  return (
    url.hostname === 'cdn.tailwindcss.com' ||
    url.hostname === 'unpkg.com' ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  );
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (e) { return; }

  // 1) ページ遷移（HTML）：ネットワーク優先 → 失敗したらキャッシュの index.html
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(SHELL_CACHE);
        cache.put('./index.html', fresh.clone()).catch(() => {});
        return fresh;
      } catch (e) {
        const cache = await caches.open(SHELL_CACHE);
        return (await cache.match('./index.html')) || (await cache.match('./')) || Response.error();
      }
    })());
    return;
  }

  // 2) KanjiVG（書き順データ）：stale-while-revalidate。一度取れれば以後オフラインでも使える
  if (isKanjiVG(url)) {
    event.respondWith((async () => {
      const cache = await caches.open(KANJI_CACHE);
      const cached = await cache.match(req);
      const network = fetch(req).then((res) => {
        if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()).catch(() => {});
        return res;
      }).catch(() => null);
      return cached || (await network) || Response.error();
    })());
    return;
  }

  // 3) マニフェスト：ネットワーク優先（オフライン時のみキャッシュ）。
  //    ブラウザはこの内容でインストール可否とアプリの識別子（id）を判定する。
  //    キャッシュ優先にすると古い id を返してしまい、「アプリにする」が
  //    出ない・別アプリと同一視される、といった不具合の原因になる。
  if (isManifest(url)) {
    event.respondWith((async () => {
      const cache = await caches.open(SHELL_CACHE);
      try {
        const fresh = await fetch(req);
        if (fresh && fresh.ok) cache.put(req, fresh.clone()).catch(() => {});
        return fresh;
      } catch (e) {
        return (await cache.match(req)) || (await cache.match('./manifest.webmanifest')) || Response.error();
      }
    })());
    return;
  }

  // 4) このアプリのフォルダ（/hiragana_katakan_kakikatamaster/…）の中のファイル
  //    & CDN 依存：キャッシュ優先 → バックグラウンド更新
  //    ※ 同じサイトでも自分のフォルダの外＝他のアプリのファイルは触らない。
  //      横取りしてキャッシュすると、他のアプリに古い中身を返してしまう。
  const inScope = req.url.startsWith(self.registration.scope);
  if (inScope || isCdnDependency(url)) {
    event.respondWith((async () => {
      const cacheName = inScope ? SHELL_CACHE : RUNTIME_CACHE;
      const cache = await caches.open(cacheName);
      const cached = await cache.match(req);
      if (cached) {
        // 影で更新（次回に反映）。失敗は黙って無視。
        fetch(req).then((res) => {
          if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()).catch(() => {});
        }).catch(() => {});
        return cached;
      }
      try {
        const res = await fetch(req);
        if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()).catch(() => {});
        return res;
      } catch (e) {
        return Response.error();
      }
    })());
    return;
  }

  // それ以外はふつうにネットワークへ
});
