/* ==============================================================
   watchdog.js — 「よみこみちゅう…」で 止まったままに しない【原本】

   index.html は 出たのに App が 出てこない、という 止まり方が ある。
     ・回線が とても おそい（校内 Wi-Fi・テザリング）
     ・保存してある ファイルの どれかが こわれている／古い
     ・js/app.js が 実行の とちゅうで 落ちた
   どれも 児童からは「よみこみちゅう… のまま」としか 見えない。
   ボタンも 出ないので **手の うちようが ない。**
   ここで 声を かけ、それでも だめなら 自分で 直せる ボタンを 出す。

   【重要】この1本は <head> で **同期で** 読むこと（defer に しない）。
     時計を うごかしはじめるのが ねらいなので、あとの ファイルの
     ダウンロードを 待ってからでは 意味が ない。js/app.js は 380KB あり、
     おそい 回線では そこで 何分も 止まる。defer に すると この見張りは
     **いちばん 助けが 要る その間、動かない。**
     中身を ちいさく 保つこと（読みこみを 1ms でも 遅らせないため）。

   【重要】見た目は すべて element.style で 書く。この画面が 出るときは
     css/app.css 自体が 来ていない ことが あり、クラス名では 何も 当たらない。
     （CSP の style-src には 'unsafe-inline' が あるので これは 通る）

   【重要】localStorage には 一切 さわらない。「なおす」で 消すのは
     このアプリの Service Worker と キャッシュだけ。がんばりの きろくは
     残す。同じサイトには 他のアプリも 居るので、自分の 名札が
     付いたものだけを 消すこと。
   ============================================================== */
(function () {
  'use strict';

  var WAIT_MSG_MS  = 8000;    // ここまでは だまって 待つ
  var WAIT_HELP_MS = 25000;   // ここを こえたら 直す ボタンを 出す

  var rootEl = function () { return document.getElementById('root'); };

  /* App が 出たかどうか。React が #root を 描くと
     「よみこみちゅう…」の div は 消える。それを 目じるしに する。 */
  var mounted = function () {
    var r = rootEl();
    return !!r && !r.querySelector('.kkm-loading');
  };

  /* 何が まだ 届いていないかを 見る。先生に そのまま 伝えてもらえる ことばで。 */
  var missing = function () {
    var out = [];
    if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') out.push('React');
    if (!window.KANJIVG_KANA) out.push('かきじゅんデータ');
    if (!window.StudyLog || !window.KanaStudy) out.push('学習ログ');
    var css = false;
    try {
      for (var i = 0; i < document.styleSheets.length; i++) {
        var sh = document.styleSheets[i];
        if (sh.href && sh.href.indexOf('css/app.css') !== -1) css = true;
      }
    } catch (e) { css = true; }   // 見られないときは 疑わない
    if (!css) out.push('見た目（CSS）');
    return out;
  };

  var button = function (parent, label, onClick) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.style.cssText = 'display:block;width:100%;min-height:56px;margin:12px 0 0;padding:0 20px;'
      + 'font-size:17px;font-weight:700;font-family:inherit;color:#ffffff;background:#b34328;'
      + 'border:none;border-radius:14px;box-shadow:0 4px 0 #93331e;touch-action:manipulation;';
    b.addEventListener('click', onClick);
    parent.appendChild(b);
    return b;
  };

  /* 「なおす」= このアプリの Service Worker と キャッシュだけを 捨てて
     読みこみ直す。記録には さわらない。 */
  var repair = function (btn) {
    btn.disabled = true;
    btn.textContent = 'なおしています…';
    var here = new URL('./', location.href).href;    // 例：https://…/KANA_Master/
    var jobs = [];
    if ('serviceWorker' in navigator) {
      jobs.push(navigator.serviceWorker.getRegistrations()
        .then(function (rs) {
          return Promise.all(rs
            .filter(function (r) { return r.scope.indexOf(here) === 0; })   // ← 自分の分だけ
            .map(function (r) { return r.unregister(); }));
        }).catch(function () {}));
    }
    if (window.caches) {
      jobs.push(caches.keys().then(function (ks) {
        return Promise.all(ks
          .filter(function (k) { return k.indexOf('kkm-') === 0; })         // ← 自分の分だけ
          .map(function (k) { return caches.delete(k); }));
      }).catch(function () {}));
    }
    Promise.all(jobs).then(function () {
      location.replace(new URL('./index.html', location.href).href);
    });
  };

  var shown = false;
  var showHelp = function () {
    if (shown || mounted()) return;
    var r = rootEl();
    if (!r) return;
    shown = true;
    r.textContent = '';

    var d = document.createElement('div');
    d.style.cssText = 'max-width:420px;margin:0 auto;padding:28px 22px;text-align:center;'
      + 'font-weight:600;line-height:1.8;color:#2e2a25;';
    r.appendChild(d);

    var h = document.createElement('p');
    h.style.cssText = 'font-size:20px;font-weight:700;margin:0 0 10px;word-break:keep-all;';
    h.textContent = 'よみこみに 時間が かかっています';
    d.appendChild(h);

    var p = document.createElement('p');
    p.style.cssText = 'font-size:16px;margin:0 0 6px;word-break:keep-all;';
    p.textContent = 'したの ボタンを おしてみてね。';
    d.appendChild(p);

    button(d, 'もういちど よみこむ', function () { location.reload(); });
    var fix = button(d, 'アプリを なおす', function () { repair(fix); });
    fix.style.background = '#5c554c';
    fix.style.boxShadow = '0 4px 0 #3d382f';

    var note = document.createElement('p');
    note.style.cssText = 'font-size:13px;margin:18px 0 0;color:#5c554c;';
    var lack = missing();
    note.textContent = '「なおす」を おしても、がんばりの きろくは 消えません。'
      + (lack.length ? '（まだ とどいていない もの：' + lack.join('・') + '）' : '');
    d.appendChild(note);
  };

  var showWaiting = function () {
    if (shown || mounted()) return;
    var el = document.querySelector('.kkm-loading');
    if (el) el.textContent = 'よみこみちゅう… もう すこし まってね';
  };

  setTimeout(showWaiting, WAIT_MSG_MS);
  setTimeout(showHelp, WAIT_HELP_MS);
})();
