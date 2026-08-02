/* ==============================================================
   studyLog.js — 学習ログ共通スキーマ study.v1（保存だけを行う層）

   ロジック版：1.1（仕様書 §5.1.2 の参照実装）
   配布形態  ：グローバル（IIFE）／仕様書 §5.1.1

   このファイルは GIGA山の学習アプリ 9 本で **まったく同じ動き** をします。
   コメントや書きかた（ESM／グローバル）の違いは認められていますが、
   ロジック本体の版ずれは認められていません。直したときは
   仕様書 §5.1.3 の配布状況表を更新し、全アプリへ配り直してください。

   ここがやること／やらないこと
   ・やること   … 学習ログを端末（localStorage）へ 1 件ためる
   ・やらないこと … 外部への送信。送信は同じオリジンに置いた
                    別ページ（学習ポータル）の仕事です（仕様書 §0-1）

   このアプリ固有の「結果 → レコード」の組み立ては studySession.js が
   受け持ちます。ここには **どのアプリにも共通で不変の処理だけ** を置きます。

   なぜグローバル形態か
   ・かきかたマスターは Babel standalone で <script type="text/babel"> を
     変換する構成のため、App.jsx から ESM の import ができません。
     そのため globalThis.StudyLog 経由で呼びます（仕様書 §3.10.6）。
   ============================================================== */
(function (global) {
  'use strict';

  /* 仕様書 §5.1.2 の参照実装の版。目視で照合できるように公開する */
  var LOGIC_VERSION = '1.1';

  /* 全アプリ共通のキー。**このアプリ専用のキーではない**ので、
     リセット処理やクリーンアップの対象に入れないこと（仕様書 §1.1・§1.2）。 */
  var STUDY_LOG_KEY   = 'study.records.v1';
  var STUDY_LOG_MAX   = 500;   // これを超えたら古いものから捨てる（§1.3）
  var STUDY_ITEMS_MAX = 200;   // 1 レコードの設問層の上限（§2.10）

  function uuid() {
    try {
      if (global.crypto && typeof global.crypto.randomUUID === 'function') {
        return global.crypto.randomUUID();
      }
    } catch (e) { /* 使えない環境では下の代替へ */ }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  /* 自由入力に由来する値をそのまま残さない（仕様書 §2.10）。
     12 文字を超えるもの、想定外の記号を含むものは捨てる。 */
  function sanitizeWrong(v) {
    return (typeof v === 'string' && v.length <= 12 && !/[<>{}\\]/.test(v)) ? v : null;
  }

  /**
   * 学習ログを 1 件ためる。
   * @param {Object} rec study.v1 のレコード（studySession.js が組み立てたもの）
   * @returns {string|null} ためたレコードの id。ためられなかったときは null
   */
  function saveStudyRecord(rec) {
    try {
      // 必須項目の検証はここで一度だけ行う（仕様書 §2.2）
      if (!rec || !rec.appId || !rec.unit || !rec.unit.id) return null;
      if (typeof rec.elapsedMs !== 'number' || rec.elapsedMs < 0) return null;
      if (!rec.summary || typeof rec.summary.count !== 'number') return null;

      var items;
      if (Object.prototype.toString.call(rec.items) === '[object Array]') {
        items = rec.items.slice(0, STUDY_ITEMS_MAX).map(function (it) {
          var out = {};
          for (var k in it) if (Object.prototype.hasOwnProperty.call(it, k)) out[k] = it[k];
          if (Object.prototype.toString.call(it.wrong) === '[object Array]') {
            out.wrong = it.wrong.map(sanitizeWrong).filter(Boolean);
          } else {
            delete out.wrong;
          }
          return out;
        });
      }

      var entry = {
        schema: 'study.v1',
        id: uuid(),
        kind: 'session',
        source: 'course',
        multiplayer: false,
        grading: 'objective',
        status: 'completed',
        timeBasis: 'app'
      };
      for (var key in rec) if (Object.prototype.hasOwnProperty.call(rec, key)) entry[key] = rec[key];
      entry.items = items;
      entry.elapsedMs = Math.round(rec.elapsedMs);

      // 保存済みログの読み出し。
      // 中身が壊れている（JSON として読めない／配列でない）場合は空からやり直す。
      // ここで外側の catch に流すと、一度壊れた端末は以降ずっと1件も保存できなくなる。
      var raw = global.localStorage.getItem(STUDY_LOG_KEY);
      var log = [];
      if (raw) {
        try {
          var parsed = JSON.parse(raw);
          if (Object.prototype.toString.call(parsed) === '[object Array]') log = parsed;
        } catch (e) { /* 壊れていた → 空からやり直す */ }
      }

      log.push(entry);
      if (log.length > STUDY_LOG_MAX) log.splice(0, log.length - STUDY_LOG_MAX);
      global.localStorage.setItem(STUDY_LOG_KEY, JSON.stringify(log));
      return entry.id;
    } catch (e) {
      // 保存失敗はアプリの動作を妨げない。ログの都合で練習が止まってはならない。
      if (global.console && global.console.warn) global.console.warn('[studyLog] save failed', e);
      return null;
    }
  }

  /* 公開する名前は仕様書 §5.1.3 のとおりにそろえる */
  var StudyLog = {
    LOGIC_VERSION: LOGIC_VERSION,
    STUDY_LOG_KEY: STUDY_LOG_KEY,
    STUDY_LOG_MAX: STUDY_LOG_MAX,
    STUDY_ITEMS_MAX: STUDY_ITEMS_MAX,
    saveStudyRecord: saveStudyRecord
  };

  global.StudyLog = StudyLog;
  // Node から読めるようにしておく（tools/check-study.js のスキーマ検査用）
  if (typeof module !== 'undefined' && module.exports) module.exports = StudyLog;
})(typeof globalThis !== 'undefined' ? globalThis : this);
