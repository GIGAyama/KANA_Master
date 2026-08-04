#!/usr/bin/env node
/* ==============================================================
   tools/serve.mjs — 手元で アプリを ひらくための ちいさなサーバー

   つかいかた:  node tools/serve.mjs [ポート]

   なぜ file:// では だめか
   --------------------------------------------------------------
   Service Worker も CSP も manifest も、file:// では 動かない・効かない。
   実際の GitHub Pages と 同じ「/KANA_Master/ の 下に 置かれた 状態」で
   ひらかないと、測っても 意味の ある 数字に ならない。

   本番と 同じ サブパス（/KANA_Master/）で 配る。
   ============================================================== */
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = '/KANA_Master/';
const PORT = Number(process.argv[2] || 8788);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.jsx': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

http.createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (!path.startsWith(BASE)) {
    // 本番と 同じ サブパスへ 誘導する
    res.writeHead(302, { Location: BASE });
    res.end();
    return;
  }
  let rel = path.slice(BASE.length);
  if (rel === '' || rel.endsWith('/')) rel += 'index.html';
  rel = normalize(rel);
  if (rel.startsWith('..')) { res.writeHead(403); res.end(); return; }

  const file = join(ROOT, rel);
  try {
    if ((await stat(file)).isDirectory()) throw new Error('dir');
    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': TYPES[extname(file)] || 'application/octet-stream',
      // Service Worker の 更新を 手元で 確かめたいので キャッシュさせない
      'Cache-Control': 'no-store',
      // SRI を 付けた 資産を 検査するときのため（本番では 同一オリジン）
      'Access-Control-Allow-Origin': '*',
    });
    res.end(body);
  } catch (e) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404');
  }
}).listen(PORT, () => {
  console.log(`http://127.0.0.1:${PORT}${BASE}`);
});
