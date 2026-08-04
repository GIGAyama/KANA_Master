/* ==============================================================
   boot.js — Service Worker の登録と「あたらしい ばん」の おしらせ【原本】

   ここでやること
     1. Service Worker を登録する（圏外でも アプリが ひらくように）
     2. あたらしい ばんが 用意できたら 画面で しらせる
        …… ただし **利用者が「さいしんに する」を おすまでは 切りかえない**
     3. manifest の id / scope / start_url が この場所と 合っているか 自己点検

   ※ インラインの <script> に 書かないこと（CSP: script-src 'self'）。
   ============================================================== */
(function () {
  'use strict';

  /* ── 1. 「さいしんに する」の おしらせ ─────────────────────
     児童にも わかる ことばで 出す。ボタンを おすまで 切りかわらない。
     （書きかけの 字が 消えると こまるため） */
  var toastEl = null;
  function showUpdateToast(onAccept) {
    if (toastEl) return;                       // 二重に出さない
    toastEl = document.createElement('div');
    toastEl.className = 'kkm-update-toast no-print';
    toastEl.setAttribute('role', 'status');    // 読みあげ（じゃまをしない polite）
    toastEl.setAttribute('aria-live', 'polite');

    var msg = document.createElement('span');
    msg.className = 'kkm-update-toast__msg';
    msg.textContent = 'あたらしい ばんが あります';

    var ok = document.createElement('button');
    ok.type = 'button';
    ok.className = 'kkm-update-toast__btn tap-44';
    ok.textContent = 'さいしんに する';
    ok.addEventListener('click', function () {
      ok.disabled = true;
      msg.textContent = 'いま きりかえています…';
      onAccept();
    });

    var later = document.createElement('button');
    later.type = 'button';
    later.className = 'kkm-update-toast__later tap-44';
    later.setAttribute('aria-label', 'おしらせを とじる');
    later.textContent = 'あとで';
    later.addEventListener('click', function () {
      toastEl.remove();
      toastEl = null;
    });

    toastEl.appendChild(msg);
    toastEl.appendChild(ok);
    toastEl.appendChild(later);
    document.body.appendChild(toastEl);
    ok.focus();
  }

  /* ── 2. Service Worker ───────────────────────────────────── */
  if ('serviceWorker' in navigator) {

    /* controllerchange は **はじめて ひらいたときにも 飛んでくる**。
       Service Worker の activate で clients.claim() を呼ぶと、いま見ている
       ページが 管理下に 入るためである。これを そのまま 受けて reload すると
       **初回訪問が かならず 1回 読みこみ直される**。
       このアプリでは 書いている とちゅうの 字や、えらんだ もじが 消える。

       「もともと 管理下だったか」で 分ける 直し方は 別の形で こわれる
       （入れた 直後に「さいしんに する」を おした場合、切りかわったのに
       読みこみ直されなくなる）。見るべきは **利用者が おしたかどうか** だけ。 */
    var userAskedUpdate = false;
    var reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (!userAskedUpdate || reloading) return;
      reloading = true;
      location.reload();
    });

    var notify = function (worker) {
      showUpdateToast(function () {
        userAskedUpdate = true;
        worker.postMessage({ type: 'SKIP_WAITING' });
      });
    };

    var register = function () {
      navigator.serviceWorker.register('./sw.js').then(function (reg) {
        reg.addEventListener('updatefound', function () {
          var sw = reg.installing;
          if (!sw) return;
          sw.addEventListener('statechange', function () {
            // controller が居る＝はじめての インストールではなく「更新」。
            // 初回で しらせると「入れた 直後に あたらしい ばんが あります」と
            // 出てしまい、こんらんする。
            if (sw.state === 'installed' && navigator.serviceWorker.controller) notify(sw);
          });
        });
        // 前回 ひらいた ときに すでに 用意ができていた場合も ひろう
        if (reg.waiting && navigator.serviceWorker.controller) notify(reg.waiting);
      }).catch(function () { /* SW 非対応でも アプリは そのまま 動く */ });
    };

    /* load が **もう 済んでいる** 場合を かならず 見ること。
       このファイルは <body> の おわりで 読まれるので、端末や
       キャッシュの ぐあいによっては この時点で load が 終わっている。
       そのときに addEventListener('load', …) だけ 書くと リスナーは 付くが
       二度と 呼ばれず、**Service Worker が だまって 登録されない**。 */
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }

  /* ── 3. PWA：アプリの「背番号（id）」が あっているか 自己点検 ──
     gigayama.github.io には 多数の アプリが 同居していて、ブラウザは
     manifest の id / scope で アプリを 見わけている。リポジトリを コピーして
     別アプリを 作ったときに id を 書きかえ忘れると、Chromebook では
     「このアプリのページが、別のアプリのウィンドウで 開いてしまう」
     という 取りちがえが 起きる。気づけるように ここで たしかめて
     開発者ツールの コンソールに 警告を出す（動作そのものは 止めない）。 */
  var selfCheck = function () {
    try {
      fetch('./manifest.webmanifest', { cache: 'no-store' })
        .then(function (r) { return r.json(); })
        .then(function (m) {
          var here = new URL('./', location.href).pathname; // 例：/KANA_Master/
          var problems = [];
          ['id', 'scope', 'start_url'].forEach(function (k) {
            if (!m[k]) { problems.push(k + ' が未設定です'); return; }
            var p = new URL(m[k], location.href).pathname;
            if (p.indexOf(here) !== 0) {
              problems.push(k + ' = "' + m[k] + '" が このフォルダ（' + here + '）の外を指しています');
            }
          });
          if (problems.length) {
            console.warn(
              '[PWA] manifest.webmanifest の設定が このアプリの場所と合っていません。\n' +
              'このままだと、インストールしたアプリが 同じサイトの別アプリと 取りちがえられることがあります。\n' +
              '- ' + problems.join('\n- ') + '\n' +
              'manifest.webmanifest の id / scope / start_url を "' + here + '" から始まる値に直してください。'
            );
          }
        })
        .catch(function () { /* 点検できなくてもアプリは動きます */ });
    } catch (e) { /* 同上 */ }
  };
  if (document.readyState === 'complete') selfCheck();
  else window.addEventListener('load', selfCheck, { once: true });
})();
