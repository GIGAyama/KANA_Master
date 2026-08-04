/* ==============================================================
   install-hook.js — インストールの合図を いちばん先に 受けとる【原本】

   beforeinstallprompt は、条件がそろうと ページの読みこみ直後に
   一度だけ 飛んでくる。この登録が <body> の末尾や React の描画あとだと
   合図を 取りこぼし、「アプリにする」ボタンが 二度と出せなくなる。
   そのため <head> のいちばん上で 同期読みこみする。

   ※ インラインの <script> に 書かないこと。
     CSP（script-src 'self'）で 実行されなくなるため、外部ファイルにする。
   ============================================================== */
(function () {
  var api = window.__kkmInstall = {
    deferred: null,   // 保持した beforeinstallprompt イベント
  };

  // インストール済みのウィンドウ（スタンドアロン起動）かどうか。
  // ここが true のときだけ「アプリにする」ボタンを隠す。
  // ＝ localStorage 等に「インストール済み」を焼き付けないので、
  //   アンインストール後はまたボタンが出る。
  api.isStandalone = function () {
    try {
      if (navigator.standalone === true) return true; // iOS Safari
      if (!window.matchMedia) return false;
      var modes = ['standalone', 'fullscreen', 'minimal-ui', 'window-controls-overlay'];
      for (var i = 0; i < modes.length; i++) {
        if (window.matchMedia('(display-mode: ' + modes[i] + ')').matches) return true;
      }
    } catch (e) {}
    return false;
  };

  // 端末の種類（案内文の出し分け用）
  api.platform = (function () {
    var ua = navigator.userAgent || '';
    if (/CrOS/.test(ua)) return 'chromeos';
    if (/Android/.test(ua)) return 'android';
    if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
    if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return 'ios'; // iPadOS
    if (/Edg\//.test(ua)) return 'edge';
    return 'desktop';
  })();

  // 状態が変わったことを App 側へ通知する
  api.notify = function () {
    try { window.dispatchEvent(new CustomEvent('kkm-install-change')); } catch (e) {}
  };

  window.addEventListener('beforeinstallprompt', function (e) {
    // 既定のミニ情報バーを抑止し、アプリ内のボタンから任意のタイミングで出す
    e.preventDefault();
    api.deferred = e;
    window.__kkmDeferredInstall = e; // 旧版 App.jsx との互換用
    api.notify();
  });

  window.addEventListener('appinstalled', function () {
    api.deferred = null;
    window.__kkmDeferredInstall = null;
    api.notify();
  });
})();
