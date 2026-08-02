/* ==============================================================
   studySession.js — かきかたマスターの「結果 → 学習ログ」組み立て層

   仕様書：学習ログ共通スキーマ `study.v1` §3.10（かきかたマスター）
   配布形態：グローバル（IIFE）。App.jsx は Babel standalone で変換される
             ため import が使えず、globalThis.KanaStudy 経由で呼びます。

   3 層構成（仕様書 §6）のまん中がこのファイルです。

     studyLog.js     … 全アプリ共通・不変。保存するだけ
     studySession.js … このアプリ固有。何を 1 レコードにするかを決める  ← ここ
     App.jsx         … 画面。学習が起きた瞬間にここへ知らせる

   このファイルの約束
   ・`buildStudyRecord()` は **純関数**。localStorage にも DOM にも触れません。
     そのため Node から呼んで仕様準拠を自動検査できます（tools/check-study.js）。
   ・DOM に触れるのは `createActiveTimer()` と `install()` だけです。
   ・氏名・出席番号などの個人を識別する値は **一切ここへ入れません**（仕様書 §4）。

   ── このアプリを 1 レコードにする単位（仕様書 §3.10.5）──

   画面（`VIEW_TABS`）を 1 つの活動単位とし、その活動に入ってから離れるまでを
   1 レコードにします。ホーム・ずかんは学習活動ではないので記録しません。

   | mode       | 活動                         | unit.id            |
   |------------|------------------------------|--------------------|
   | `write`    | かく（なぞり／自力書き）      | `kana-{文字}`      |
   | `read`     | よむ（あたまのおと・にたもじ）| `read-{種別}`      |
   | `vocab`    | なかまの ことば・はんたいの ことば | `vocab-{種別}` |
   | `special`  | とくべつな おと（6 ユニット） | `special-{key}`    |
   | `review`   | ふくしゅう（混ざり）          | `review-mixed`     |
   | `mimcheck` | ちからだめし（よみめいじん）  | `mim-check`        |

   この 4 つのちから（かく・よむ・ことば・とくべつな おと）は
   **たがいに代わりが利きません。** 合算した正答率を主指標にしないため、
   必ず `mode` で分け、`ext.ability` にも同じ値を残します（仕様書 §3.7.1 / §3.10）。
   ============================================================== */
(function (global) {
  'use strict';

  /* ──────────────────────────────────────────────────────────
     0. 定数
     ────────────────────────────────────────────────────────── */

  /** 仕様書 §3.1 の予約値。受信側の許可リストと必ずそろえること（§9.4） */
  var APP_ID = 'kana-master';

  /** アプリのバージョン。**定数はこの 1 か所だけ**に置き、ここを参照する（§2.2） */
  var APP_VERSION = '1.0.0';

  /** このアプリが出力するスキーマ版（§10） */
  var SCHEMA = 'study.v1';

  /** 小学1年生向けのアプリなので、単元の対象学年は 1 で固定（§2.5） */
  var GRADE = 1;

  var ITEMS_MAX     = 200;    // 設問層の上限（§2.10）
  var COUNT_MAX     = 1000;   // 出題数の上限（§9.2）
  var EXT_MAX_BYTES = 8192;   // 拡張層の上限（§2.11）
  var WEAK_IDS_MAX  = 40;     // にがてボックスは新しい順に 40 件まで
  var WRONG_MAX_LEN = 12;     // 誤答内容の最大文字数（§2.10）

  /** 無操作とみなすまでの時間。**60 秒から変えないこと**（仕様書 §2.8） */
  var IDLE_MS = 60000;

  /** 中断とみなすまでの離席時間。**5 分から短くしないこと**（仕様書 §5.4） */
  var AWAY_MS = 5 * 60000;

  /* ──────────────────────────────────────────────────────────
     1. 単元 ID 表（仕様書 §2.5）

     **表示名から ID を作ってはいけません。** 表示名は言い回しの調整で
     容易に変わり、そのたびに過去データとの接続が切れます。
     ここでは画面の内部キー（`SOUND_COURSES` の `key`、`SPECIAL_UNITS` の
     `key`、かなの文字そのもの）から ID を引きます。内部キーは表示名と
     独立しているため、文言を直しても ID は動きません。

     ID を変えたくなったときは、**旧 ID を同じ単元に向けるエイリアスを
     `UNIT_ALIASES` に残してください。**改名前後の記録がつながります。
     ────────────────────────────────────────────────────────── */

  /** よむ画面のコース key → 学習ログの単元（§3.10.1） */
  var SOUND_UNITS = {
    head:     { mode: 'read',   id: 'read-head',     title: 'よむ：あたまの おと' },
    inword:   { mode: 'read',   id: 'read-inword',   title: 'よむ：ことばの なかの もじ' },
    confuse:  { mode: 'read',   id: 'read-confuse',  title: 'よむ：にた もじ さがし' },
    group:    { mode: 'vocab',  id: 'vocab-group',   title: 'ことば：なかまの ことば' },
    opposite: { mode: 'vocab',  id: 'vocab-opposite', title: 'ことば：はんたいの ことば' },
    // 「ぜんぶ まぜて」は SRS の期限が来たものを先に出すので、
    // 出題元は `course` ではなく `review` になります（仕様書 §2.4）。
    mix:      { mode: 'review', id: 'review-mixed',  title: 'ふくしゅう（まぜて）', source: 'review' }
  };

  /** とくべつな おと の 6 ユニット。**このアプリで最も指導価値が高い 6 つ**（§3.10.1） */
  var SPECIAL_UNIT_TITLES = {
    dakuten: 'てん と まる（濁音・半濁音）',
    hatsuon: 'はねる おと（ん）',
    sokuon:  'つまる おと（っ）',
    youon:   'ねじれる おと（ゃゅょ）',
    chouon:  'のばす おと（ー）',
    joshi:   'くっつきの ことば（は・へ・を）'
  };

  /** ちからだめし（MIM-PM 型）の 2 つの課題（§3.10.4） */
  var MIM_UNIT = { mode: 'mimcheck', id: 'mim-check', title: 'ちからだめし（よみめいじん）' };

  /**
   * 旧 ID → いまの ID の対応表（§2.5）。
   * ID を改名したときは、ここに旧 ID を足して同じ単元に向けてください。
   * いまは改名がないため空です（消さずに残しておくこと）。
   */
  var UNIT_ALIASES = {};

  function resolveUnitId(id) {
    return Object.prototype.hasOwnProperty.call(UNIT_ALIASES, id) ? UNIT_ALIASES[id] : id;
  }

  /* ──────────────────────────────────────────────────────────
     2. 小さな道具
     ────────────────────────────────────────────────────────── */

  function isArray(v) { return Object.prototype.toString.call(v) === '[object Array]'; }
  function isFiniteNum(v) { return typeof v === 'number' && isFinite(v); }
  function clampInt(v, lo, hi) {
    var n = isFiniteNum(v) ? Math.round(v) : 0;
    if (n < lo) n = lo;
    if (n > hi) n = hi;
    return n;
  }

  /** 決定的なハッシュ（djb2）。**乱数や時刻を混ぜないこと**（仕様書 §2.10） */
  function djb2(str) {
    var h = 5381;
    for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }

  /**
   * 設問ID をつくる（仕様書 §2.10 の生成規則）。
   * ・20 文字以内でそのまま使える文字列 … そのまま（ことば・SRS の ID）
   * ・20 文字を超える／使えない記号を含む … ハッシュを前置して短縮
   * ・空                                   … `q-empty`
   *
   * **問題文そのものを入れないこと。** 容量を圧迫し、文言の改訂で
   * 過去データとの接続が切れます。
   */
  function questionId(text) {
    var s = (text === null || text === undefined) ? '' : String(text);
    if (s === '') return 'q-empty';
    if (s.length <= 20 && !/[<>{}\\]/.test(s)) return s;
    return 'w-' + djb2(s);
  }

  /**
   * 児童が選んだ答えを `item.wrong` の形（配列）にそろえる（仕様書 §2.10）。
   * マスに入れる問題では「マス番号 → 文字」の連想配列が届くので、
   * マスの順に並べて 1 つの文字列にします。
   * 12 文字を超えるもの・想定外の記号を含むものは捨てます。
   */
  function wrongValues(chosen) {
    if (chosen === null || chosen === undefined) return undefined;
    var vals;
    if (typeof chosen === 'object') {
      vals = Object.keys(chosen)
        .sort(function (a, b) { return Number(a) - Number(b); })
        .map(function (k) { return chosen[k]; });
    } else {
      vals = [chosen];
    }
    var s = vals.map(function (v) { return String(v); }).join('');
    if (!s || s.length > WRONG_MAX_LEN || /[<>{}\\]/.test(s)) return undefined;
    return [s];
  }

  /**
   * `ext` を 8KB におさめる（仕様書 §2.11）。
   *
   * 受信側は 8KB を超えたレコードを**丸ごと**拒否します。レコード全体を
   * 失うより、補助的な項目を落とすほうが損失が小さいので、
   * **なくても主指標が成り立つものから順に**削ります。
   */
  var EXT_DROP_ORDER = ['weakIds', 'srsDue', 'srsLearned', 'stage'];
  function fitExt(ext) {
    if (!ext) return ext;
    for (var i = 0; i < EXT_DROP_ORDER.length; i++) {
      if (JSON.stringify(ext).length <= EXT_MAX_BYTES) return ext;
      delete ext[EXT_DROP_ORDER[i]];
    }
    return ext;
  }

  /* ──────────────────────────────────────────────────────────
     3. レコードの組み立て（純関数）

     localStorage にも DOM にも触れません。Node から呼べるので、
     仕様の各条項をそのままテストにできます（tools/check-study.js）。
     ────────────────────────────────────────────────────────── */

  /**
   * 1 レコードを組み立てる。
   *
   * @param {Object} input
   *   - mode       {string} write / read / vocab / special / review / mimcheck
   *   - unitId     {string} 単元ID（§2.5。改訂しても不変であること）
   *   - unitTitle  {string} 表示名（教師のスプレッドシートで読む用）
   *   - source     {string} course / review / weak / custom（既定 course）
   *   - status     {string} completed / aborted（既定 completed）
   *   - startedAt  {number|string} 開始時刻（ミリ秒 または ISO 8601）
   *   - endedAt    {number|string} 終了時刻（同上）
   *   - elapsedMs  {number} 実時間。省略時は endedAt - startedAt
   *   - activeMs   {number} 実際に操作していた時間（60 秒基準・§2.8）
   *   - count      {number} 出題された問題数
   *   - items      {Array}  設問層（§2.10）
   *   - ext        {Object} 拡張層（§2.11）
   * @returns {Object|null} study.v1 のレコード。保存すべきでないときは null
   */
  function buildStudyRecord(input) {
    if (!input || !input.mode || !input.unitId) return null;

    var startedMs = toMs(input.startedAt);
    var endedMs   = toMs(input.endedAt);
    if (startedMs === null) return null;
    if (endedMs === null || endedMs < startedMs) endedMs = startedMs;

    var elapsedMs = isFiniteNum(input.elapsedMs) ? Math.round(input.elapsedMs) : (endedMs - startedMs);
    if (!isFiniteNum(elapsedMs) || elapsedMs < 0) elapsedMs = 0;

    // 設問層。200 件を超えるぶんは**組み立て側で**切り詰め、
    // `summary` は切り詰めたあとの `items` から算出する（仕様書 §2.7）。
    var all  = isArray(input.items) ? input.items.map(normalizeItem).filter(Boolean) : [];
    var kept = all.slice(0, ITEMS_MAX);

    var attempted       = kept.length;
    var firstTryCorrect = countBy(kept, 'firstTry');
    var correct         = countBy(kept, 'ok');

    // **1 問も解答していない中断は保存しない**（仕様書 §5.4）。
    // 学習データを持たないレコードでログ枠（500 件）が埋まるのを防ぐ。
    if (attempted === 0) return null;

    // 出題数。切り詰めの影響を受けず、実際に出した数をそのまま入れる（§2.7）
    var count = clampInt(Math.max(isFiniteNum(input.count) ? input.count : 0, attempted), 0, COUNT_MAX);

    var ext = {};
    if (input.ext) for (var k in input.ext) {
      if (Object.prototype.hasOwnProperty.call(input.ext, k) &&
          input.ext[k] !== undefined && input.ext[k] !== null) ext[k] = input.ext[k];
    }
    if (isArray(ext.weakIds)) ext.weakIds = ext.weakIds.slice(0, WEAK_IDS_MAX);
    // 切り詰めが起きたときだけ、実際の解答実績を退避しておく（§2.7）。
    // これが無いと `count - attempted` が未着手数として誤読される。
    if (all.length > kept.length) {
      ext.itemsTruncated = { attempted: all.length, firstTryCorrect: countBy(all, 'firstTry') };
    }
    fitExt(ext);

    // 別々の時計で測ると activeMs > elapsedMs という論理的にありえない値が
    // 生じうるので、保存前に必ず抑え込む（仕様書 §2.8 のクランプ）
    var activeMs = isFiniteNum(input.activeMs) ? Math.max(0, Math.round(input.activeMs)) : null;
    if (activeMs !== null) activeMs = Math.min(activeMs, elapsedMs);

    var rec = {
      schema: SCHEMA,
      appId: APP_ID,
      appVersion: APP_VERSION,

      kind: 'session',
      mode: input.mode,
      unit: {
        id: resolveUnitId(input.unitId),
        title: input.unitTitle || input.unitId,
        grade: GRADE,
        // 単元はすべてアプリ組み込み。児童が作る単元はこのアプリには無い（§2.5）
        preset: true
      },
      source: input.source || 'course',
      multiplayer: false,      // 1 台を交代で使うモードは無い（§2.4.1）
      // 4 つの活動はいずれも客観的な正誤判定（自動採点・選択式）（§3.10.1）
      grading: 'objective',

      startedAt: new Date(startedMs).toISOString(),
      endedAt: new Date(endedMs).toISOString(),
      elapsedMs: elapsedMs,
      timeBasis: 'app',

      status: input.status === 'aborted' ? 'aborted' : 'completed',

      summary: {
        count: count,
        attempted: attempted,
        firstTryCorrect: firstTryCorrect,
        correct: correct
      },

      items: kept,
      ext: ext
    };
    if (activeMs !== null) rec.activeMs = activeMs;
    return rec;
  }

  function toMs(v) {
    if (isFiniteNum(v)) return Math.round(v);
    if (typeof v === 'string') {
      var t = Date.parse(v);
      return isFinite(t) ? t : null;
    }
    return null;
  }

  function countBy(list, key) {
    var n = 0;
    for (var i = 0; i < list.length; i++) if (list[i][key] === true) n++;
    return n;
  }

  /** 設問 1 件を §2.10 の形にそろえる。`q` が作れないものは捨てる */
  function normalizeItem(it) {
    if (!it) return null;
    var q = questionId(it.q);
    var out = { q: q, ok: it.ok === true, firstTry: it.firstTry === true };
    if (isFiniteNum(it.tries) && it.tries > 0) out.tries = Math.round(it.tries);
    if (isFiniteNum(it.ms) && it.ms >= 0) out.ms = Math.round(it.ms);
    if (it.hint === true) out.hint = true;
    var wrong = isArray(it.wrong) ? it.wrong : wrongValues(it.wrong);
    if (wrong && wrong.length > 0) out.wrong = wrong;
    return out;
  }

  /* ──────────────────────────────────────────────────────────
     4. 学習時間の計測（仕様書 §2.8 の参照実装）

     **無操作の判定は 60 秒に固定します。**アプリ独自の理由で短くすると、
     このアプリの `activeMs` だけが系統的に小さく出て、全アプリの学習時間を
     合算した値が実際より少なくなります。熱心に練習した児童ほど時間が
     短く見えるという逆転が起きるので、閾値は動かさないこと。
     ────────────────────────────────────────────────────────── */
  function createActiveTimer(doc, win) {
    var d = doc || global.document;
    var w = win || global;
    var activeMs = 0, mark = Date.now(), idle = false;

    function tick() {
      if (!idle && !(d && d.hidden)) activeMs += Date.now() - mark;
      mark = Date.now();
    }
    function wake() { tick(); idle = false; }

    var t1 = w.setInterval(tick, 1000);
    var t2 = w.setInterval(function () { tick(); idle = true; }, IDLE_MS);
    if (d && d.addEventListener) d.addEventListener('visibilitychange', tick);
    if (d && d.addEventListener) {
      ['click', 'keydown', 'touchstart', 'pointerdown'].forEach(function (ev) {
        d.addEventListener(ev, wake, { passive: true });
      });
    }

    return {
      total: function () { tick(); return activeMs; },
      stop: function () { w.clearInterval(t1); w.clearInterval(t2); }
    };
  }

  /* ──────────────────────────────────────────────────────────
     5. レコーダー（いま記録中の 1 レコードを持つ）

     画面から呼ぶのはここだけです。保存そのものは studyLog.js に任せます。
     ────────────────────────────────────────────────────────── */
  function createRecorder(opts) {
    var o = opts || {};
    var save = o.save || function (rec) {
      var fn = global.StudyLog && global.StudyLog.saveStudyRecord;
      return (typeof fn === 'function') ? fn(rec) : null;
    };
    var now = o.now || function () { return Date.now(); };
    var timer = o.timer || null;

    var cur = null;      // 記録中のレコード
    var resume = null;   // 中断のあと、次の解答で再開するための控え（§5.4）
    var hiddenAt = null; // タブが見えなくなった時刻

    function activeNow() { return timer ? timer.total() : null; }

    /** 新しいレコードを始める。記録中のものがあれば先に締める */
    function begin(meta) {
      if (!meta || !meta.mode || !meta.unitId) return;
      if (cur) end('aborted');
      resume = null;
      cur = {
        mode: meta.mode,
        unitId: meta.unitId,
        unitTitle: meta.unitTitle,
        source: meta.source || 'course',
        count: isFiniteNum(meta.count) ? meta.count : 0,
        ext: meta.ext ? shallow(meta.ext) : {},
        items: [],
        // 既定は「いま」。レコードを 分ける ときだけ、分かれ目の 時刻を もらう
        startedAt: isFiniteNum(meta.startedAt) ? meta.startedAt : now(),
        activeStart: activeNow(),
        stageStart: null,
        completed: false
      };
    }

    /**
     * 解答を 1 件ためる。
     *
     * 中断のあとで解答が届いたときは、**控えておいたメタ情報で
     * 新しいレコードを始めます**（仕様書 §5.4 の 3 原則）。
     * 中断済みのレコードに追記はしません。`pageshow` の登録が要らないのは
     * この作りのためです（保存と同時に次のレコードが走り出す）。
     */
    function item(it) {
      if (!cur && resume) {
        begin({
          mode: resume.mode, unitId: resume.unitId, unitTitle: resume.unitTitle,
          source: resume.source, count: resume.remaining, ext: resume.ext
        });
      }
      if (!cur) return;
      cur.items.push(it);
    }

    function setCount(n) { if (cur && isFiniteNum(n)) cur.count = n; }

    function patchExt(obj) {
      if (!cur || !obj) return;
      for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) cur.ext[k] = obj[k];
    }

    /** その活動の「めあて」に到達した（＝完走）と印をつける */
    function markCompleted() { if (cur) cur.completed = true; }

    /**
     * かくモードの段階（4 段階）を記録する（§3.10.2）。
     * レコードの中で段階が上がったら `ext.stageUp: true` を立てるので、
     * 教師側で「今週かんぺきになった字」を数えられます。
     *
     * ただし **段階 2 以上に上がったときだけ** 立てます。段階 1 は
     * 「かきじゅんアニメを見た」だけで、まだ 1 画も書いていません。
     * アプリの画面でも「よくできました」の演出が出るのは段階 2 からで、
     * ここをそろえないと**教師の集計とアプリの画面が別のものを指す**ことになります。
     */
    var STAGE_UP_MIN = 2;
    function noteStage(stage) {
      if (!cur || cur.mode !== 'write' || !isFiniteNum(stage)) return;
      if (cur.stageStart === null) cur.stageStart = stage;
      cur.ext.stage = stage;
      cur.ext.stageUp = stage > cur.stageStart && stage >= STAGE_UP_MIN;
    }

    /**
     * レコードを締めて保存する。
     * @param {string} status completed / aborted
     * @param {number} [atMs] 締める時刻。離席で中断したときは**離れた時刻**を渡す
     *   （待っていた 5 分を学習時間に含めないため。仕様書 §5.4）
     */
    function end(status, atMs) {
      if (!cur) return null;
      var s = cur;
      cur = null;

      var endedAt = isFiniteNum(atMs) ? atMs : now();
      if (endedAt < s.startedAt) endedAt = s.startedAt;

      var activeMs = null;
      if (s.activeStart !== null && s.activeStart !== undefined) {
        var a = activeNow();
        if (a !== null) activeMs = Math.max(0, a - s.activeStart);
      }

      var finalStatus = (status === 'aborted' && !s.completed) ? 'aborted' : 'completed';
      var remaining = Math.max(0, (s.count || 0) - s.items.length);

      var rec = buildStudyRecord({
        mode: s.mode,
        unitId: s.unitId,
        unitTitle: s.unitTitle,
        source: s.source,
        status: finalStatus,
        startedAt: s.startedAt,
        endedAt: endedAt,
        elapsedMs: endedAt - s.startedAt,
        activeMs: activeMs,
        count: s.count,
        items: s.items,
        ext: s.ext
      });

      // **復帰したら新しいレコードを開始する**（仕様書 §5.4 の 3 原則）。
      // 中断済みのレコードに追記はしない。復帰後の `count` は区切りの残り分。
      // 完走したレコードには控えを残さない（次の解答が古い単元に紛れ込むため）。
      resume = (finalStatus === 'aborted' && remaining > 0)
        ? {
            mode: s.mode, unitId: s.unitId, unitTitle: s.unitTitle, source: s.source,
            ext: shallow(s.ext), remaining: remaining
          }
        : null;
      if (!rec) return null;
      return save(rec);
    }

    /* ── かくモード（文字ごとに 1 レコード・§3.10.5）── */

    /**
     * かくモードのレコードを始める。
     *
     * **なぞり書きと自力書きを混ぜません**（仕様書 §3.10.2）。お手本のある
     * 「なぞり」で正解しても、ガイドなしで書けるとは限らないためです。
     * `guided` が変わった時点でレコードを分け、`ext.guided` で区別します。
     *
     * かくモードのレコードは必ず `completed` になります。出題数は「書いた回数」
     * であり（§3.10.1）、書きおえた回だけが `items` に入るため、**未着手の
     * 問題が残ることがない**からです。書きかけで画面を離れた回は解答が
     * 1 件も無いので、そもそも保存されません（§5.4）。
     */
    function beginWrite(char, stage, guided, kanaMode, startedAt) {
      if (!char) return;
      begin({
        mode: 'write',
        unitId: 'kana-' + char,
        unitTitle: 'かく：' + char,
        source: 'course',
        startedAt: startedAt,
        ext: { ability: 'write', guided: guided === true, kanaMode: kanaMode }
      });
      markCompleted();
      noteStage(stage);
    }

    /**
     * かくモードの 1 回ぶん（1 文字を書きおえた／採点した）を記録する。
     * 文字が変わった、またはなぞり／自力が切りかわったら、レコードを分ける。
     */
    function writeAttempt(char, attempt, kanaMode) {
      if (!char || !attempt) return;
      var unitId = 'kana-' + char;
      var guided = attempt.guided === true;
      if (!cur || cur.mode !== 'write' || cur.unitId !== unitId || cur.ext.guided !== guided) {
        // 分かれ目は「この 1 かいを 書きはじめた 時刻」。ここを「いま」に すると、
        // なぞり → 自力に 切りかわった 回の 時間が まるごと 前の（なぞりの）
        // レコードに 入ってしまい、自力書きの 時間が 実際より みじかく 見える。
        var at = now() - (isFiniteNum(attempt.ms) ? attempt.ms : 0);
        if (cur) end(cur.completed ? 'completed' : 'aborted', at);
        beginWrite(char, attempt.stage, guided, kanaMode, at);
      }
      item({
        q: char,
        ok: attempt.ok === true,
        firstTry: attempt.firstTry === true,
        tries: attempt.tries,
        ms: attempt.ms,
        hint: attempt.hint === true
      });
      // かくモードに「未着手の問題」はない。出題数＝書いた回数（§3.10.1）
      if (cur) cur.count = cur.items.length;
    }

    /* ── 離席・タブ破棄（仕様書 §5.4）── */

    function noteHidden() { hiddenAt = now(); }

    /**
     * タブに戻ってきたとき。**5 分**戻らなかったら中断として締めます。
     * 締める時刻は「タブを離れた時刻」です。待っていた 5 分を学習時間に
     * 含めると、全児童の学習時間が水増しされます。
     * 猶予を短くすると、教師の説明を聞くための数分の離席まで中断になります。
     */
    function noteVisible() {
      var away = hiddenAt;
      hiddenAt = null;
      if (away !== null && cur && (now() - away) >= AWAY_MS) end('aborted', away);
    }

    /**
     * タブが破棄される直前（`pagehide`）。Chromebook ではメモリ不足や
     * スリープでタブごと消えることがあり、これが無いと記録中のレコードが
     * 丸ごと失われます。`beforeunload` は発火しないことがあるので使いません。
     */
    function notePageHide() {
      if (!cur) return;
      end(cur.completed ? 'completed' : 'aborted', hiddenAt !== null ? hiddenAt : undefined);
    }

    function shallow(o) {
      var out = {};
      for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) out[k] = o[k];
      return out;
    }

    return {
      begin: begin,
      item: item,
      setCount: setCount,
      patchExt: patchExt,
      markCompleted: markCompleted,
      noteStage: noteStage,
      end: end,
      beginWrite: beginWrite,
      writeAttempt: writeAttempt,
      noteHidden: noteHidden,
      noteVisible: noteVisible,
      notePageHide: notePageHide,
      currentMode: function () { return cur ? cur.mode : null; },
      currentUnitId: function () { return cur ? cur.unitId : null; }
    };
  }

  /* ──────────────────────────────────────────────────────────
     6. ブラウザでの入り口（シングルトン）
     ────────────────────────────────────────────────────────── */
  var _recorder = null;
  function getRecorder() {
    if (_recorder) return _recorder;
    if (typeof global.document === 'undefined') return null;
    _recorder = createRecorder({ timer: createActiveTimer() });

    global.addEventListener('pagehide', function () { _recorder.notePageHide(); });
    global.document.addEventListener('visibilitychange', function () {
      if (global.document.hidden) _recorder.noteHidden();
      else _recorder.noteVisible();
    });
    return _recorder;
  }

  /* ──────────────────────────────────────────────────────────
     7. 画面から使う小さなヘルパー
     ────────────────────────────────────────────────────────── */

  /** よむ画面のコース key から、学習ログの単元を引く（無ければ null） */
  function soundUnitOf(courseKey) {
    var u = SOUND_UNITS[courseKey];
    return u ? { mode: u.mode, unitId: u.id, unitTitle: u.title, source: u.source || 'course' } : null;
  }

  /** とくべつな おと のユニット key から、学習ログの単元を引く */
  function specialUnitOf(unitKey) {
    if (!SPECIAL_UNIT_TITLES[unitKey]) return null;
    return {
      mode: 'special',
      unitId: 'special-' + unitKey,
      unitTitle: 'とくべつな おと：' + SPECIAL_UNIT_TITLES[unitKey],
      source: 'course'
    };
  }

  /** ちからだめしの単元（2 つの課題はどちらも同じ単元。ext.testType で分ける） */
  function mimUnit() {
    return { mode: MIM_UNIT.mode, unitId: MIM_UNIT.id, unitTitle: MIM_UNIT.title, source: 'course' };
  }

  var KanaStudy = {
    APP_ID: APP_ID,
    APP_VERSION: APP_VERSION,
    SCHEMA: SCHEMA,
    IDLE_MS: IDLE_MS,
    AWAY_MS: AWAY_MS,
    ITEMS_MAX: ITEMS_MAX,
    EXT_MAX_BYTES: EXT_MAX_BYTES,
    SOUND_UNITS: SOUND_UNITS,
    SPECIAL_UNIT_TITLES: SPECIAL_UNIT_TITLES,
    UNIT_ALIASES: UNIT_ALIASES,
    buildStudyRecord: buildStudyRecord,
    questionId: questionId,
    wrongValues: wrongValues,
    fitExt: fitExt,
    createActiveTimer: createActiveTimer,
    createRecorder: createRecorder,
    getRecorder: getRecorder,
    soundUnitOf: soundUnitOf,
    specialUnitOf: specialUnitOf,
    mimUnit: mimUnit
  };

  global.KanaStudy = KanaStudy;
  if (typeof module !== 'undefined' && module.exports) module.exports = KanaStudy;
})(typeof globalThis !== 'undefined' ? globalThis : this);
