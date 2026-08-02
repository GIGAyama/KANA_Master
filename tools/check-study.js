#!/usr/bin/env node
/* ==============================================================
   tools/check-study.js — 学習ログ（study.v1）の 仕様準拠テスト

   つかいかた:  node tools/check-study.js

   なぜ これが 要るのか
   --------------------------------------------------------------
   学習ログは「ためた あとで 先生が まとめて 見る」データなので、
   まちがった 形で ためても **その場では 誰も 気づけません。**
   気づくのは 学期の おわりに 集計が 合わないとき です。

   そこで レコードの 組み立てを 純関数（studySession.js の
   `buildStudyRecord`）に して、localStorage にも DOM にも 触れない形に
   してあります。Node から そのまま 呼べるので、仕様書の 各条項を
   ここで テストに できます（仕様書 §6。Typa の tools/check-study.js が先例）。

   ここで 見ているのは 主に つぎの 5 つです。
     1. `attempted === items.length`（200 件で 切り詰めた ときも）
     2. `activeMs <= elapsedMs`
     3. 集計から 外すべき レコードが 正答率の 分母に 入っていないこと
     4. 中断・完走の 判定が 意図どおりで あること
     5. リセット機能が `study.records.v1` に 触れないこと
   ============================================================== */
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');

/* ── localStorage の ふり（studyLog.js を Node で うごかすため）── */
function fakeStorage() {
  const map = new Map();
  return {
    get length() { return map.size; },
    key: (i) => Array.from(map.keys())[i],
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
    clear: () => { map.clear(); },
    _map: map,
  };
}
global.localStorage = fakeStorage();

const StudyLog = require(path.join(ROOT, 'studyLog.js'));
const KanaStudy = require(path.join(ROOT, 'studySession.js'));

/* ── ちいさな テストランナー ── */
let pass = 0;
const fails = [];
function ok(name, cond) {
  if (cond) { pass++; return; }
  fails.push(name);
}
function eq(name, a, b) { ok(`${name}（${JSON.stringify(a)} === ${JSON.stringify(b)}）`, a === b); }

const T0 = Date.parse('2026-08-02T09:00:00+09:00');

/* 何もんか こたえた ふつうの クイズ 1 レコード分の 入力を つくる */
function quizInput(over) {
  const items = [];
  for (let i = 0; i < 6; i++) {
    items.push({ q: 's:sokuon:きって', ok: i % 2 === 0, firstTry: i % 2 === 0, tries: 1, ms: 3000 });
  }
  return Object.assign({
    mode: 'special', unitId: 'special-sokuon', unitTitle: 'とくべつな おと：つまる おと（っ）',
    source: 'course', status: 'completed',
    startedAt: T0, endedAt: T0 + 60000, activeMs: 45000,
    count: 6, items,
    ext: { ability: 'special', unitKey: 'sokuon', tier: 2 },
  }, over || {});
}

/* ══════════════════════════════════════════════════════════════
   1. コア層（§2.2 必須項目・§9.2 受け入れ条件）
   ══════════════════════════════════════════════════════════════ */
{
  const r = KanaStudy.buildStudyRecord(quizInput());
  eq('schema は study.v1', r.schema, 'study.v1');
  eq('appId は §3.1 の予約値', r.appId, 'kana-master');
  ok('appVersion がある', typeof r.appVersion === 'string' && r.appVersion.length > 0);
  eq('kind は session（§3.10.5）', r.kind, 'session');
  ok('mode は英数小文字とハイフンのみ（§2.2）', /^[a-z0-9-]+$/.test(r.mode));
  ok('unit.id がある（§2.5）', typeof r.unit.id === 'string' && r.unit.id.length > 0);
  ok('unit.title がある', typeof r.unit.title === 'string' && r.unit.title.length > 0);
  eq('unit.grade は 1（小学1年）', r.unit.grade, 1);
  eq('unit.preset は true（すべて組み込みの単元）', r.unit.preset, true);
  eq('grading は objective（§3.10.1）', r.grading, 'objective');
  eq('multiplayer は false（共有端末型のモードは無い）', r.multiplayer, false);
  eq('timeBasis は app（§7）', r.timeBasis, 'app');
  ok('startedAt は ISO 8601（§2.2）', !isNaN(Date.parse(r.startedAt)) && /T/.test(r.startedAt));
  ok('endedAt は ISO 8601（§2.3）', !isNaN(Date.parse(r.endedAt)));
  ok('elapsedMs は 0 以上 24 時間以内（§9.2）', r.elapsedMs >= 0 && r.elapsedMs <= 86400000);
  ok('elapsedMs は整数', Number.isInteger(r.elapsedMs));
  ok('count は 0 以上 1000 以下（§9.2）', r.summary.count >= 0 && r.summary.count <= 1000);
  ok('firstTryCorrect は count 以下（§9.2）', r.summary.firstTryCorrect <= r.summary.count);
  ok('attempted は count 以下（§9.2）', r.summary.attempted <= r.summary.count);
  ok('items は 200 件以下（§9.2）', r.items.length <= 200);
  ok('ext はシリアライズ後 8KB 以下（§9.2）', JSON.stringify(r.ext).length <= 8192);
  ok('全体はシリアライズ後 64KB 以下（§9.2）', JSON.stringify(r).length <= 65536);
}

/* ══════════════════════════════════════════════════════════════
   2. §2.7 attempted === items.length
   ══════════════════════════════════════════════════════════════ */
{
  const r = KanaStudy.buildStudyRecord(quizInput());
  eq('attempted は items の要素数と一致する', r.summary.attempted, r.items.length);
  eq('firstTryCorrect は items から数える', r.summary.firstTryCorrect, 3);
  eq('correct は items から数える', r.summary.correct, 3);

  // 中断：8 もん 出して 3 もんだけ こたえた
  const partial = KanaStudy.buildStudyRecord(quizInput({
    status: 'aborted', count: 8, items: quizInput().items.slice(0, 3),
  }));
  eq('中断レコードは attempted < count（§5.4）', partial.summary.attempted, 3);
  eq('中断レコードの count は出題数のまま', partial.summary.count, 8);
  eq('中断レコードは status: aborted', partial.status, 'aborted');
  eq('未着手は attempted に数えない', partial.summary.attempted, partial.items.length);
}

/* ══════════════════════════════════════════════════════════════
   3. §2.7 items 200 件超過（切り詰めと ext.itemsTruncated）

   制限時間まで 出題が つづく ちからだめしなど、出題数が 事前に
   定まらない ときに 実際に 起こりうる。切り詰めは **組み立て側で** 行い、
   `summary` は 切り詰め後の `items` から 算出する。
   ══════════════════════════════════════════════════════════════ */
{
  const many = [];
  for (let i = 0; i < 260; i++) many.push({ q: 'r:あ', ok: true, firstTry: true, tries: 1 });
  const r = KanaStudy.buildStudyRecord(quizInput({ count: 260, items: many }));
  eq('items は 200 件で切り詰められる', r.items.length, 200);
  eq('切り詰め後も attempted === items.length', r.summary.attempted, r.items.length);
  eq('firstTryCorrect は切り詰め後の items から', r.summary.firstTryCorrect, 200);
  eq('count は切り詰めの影響を受けない', r.summary.count, 260);
  ok('ext.itemsTruncated に真の値が退避される', !!r.ext.itemsTruncated);
  eq('itemsTruncated.attempted は実際の解答数', r.ext.itemsTruncated.attempted, 260);
  eq('itemsTruncated.firstTryCorrect も実際の値', r.ext.itemsTruncated.firstTryCorrect, 260);

  const plain = KanaStudy.buildStudyRecord(quizInput());
  ok('切り詰めが起きていないレコードには itemsTruncated を付けない',
    plain.ext.itemsTruncated === undefined);
}

/* ══════════════════════════════════════════════════════════════
   4. §2.8 activeMs のクランプ
   ══════════════════════════════════════════════════════════════ */
{
  const r = KanaStudy.buildStudyRecord(quizInput({ activeMs: 999999 }));
  ok('activeMs は elapsedMs を超えない', r.activeMs <= r.elapsedMs);
  eq('activeMs は elapsedMs に抑えこまれる', r.activeMs, r.elapsedMs);

  const neg = KanaStudy.buildStudyRecord(quizInput({ activeMs: -5 }));
  ok('activeMs は 0 以上（§9.2）', neg.activeMs >= 0);

  eq('無操作の判定は 60 秒（全アプリ共通・§2.8）', KanaStudy.IDLE_MS, 60000);
  eq('中断とみなす離席は 5 分（§5.4）', KanaStudy.AWAY_MS, 300000);
}

/* ══════════════════════════════════════════════════════════════
   5. §5.4 1 問も解答していない中断は保存しない
   ══════════════════════════════════════════════════════════════ */
{
  ok('解答 0 件のレコードは作らない',
    KanaStudy.buildStudyRecord(quizInput({ items: [], status: 'aborted' })) === null);
  ok('items が無いレコードも作らない',
    KanaStudy.buildStudyRecord(quizInput({ items: undefined })) === null);
}

/* ══════════════════════════════════════════════════════════════
   6. §3.10.1 モードと単元の割りあて

   4 つの ちからは たがいに 代わりが 利かない。`mode` で 分かれていないと
   受信側が 合算した 正答率を 出してしまう。
   ══════════════════════════════════════════════════════════════ */
{
  const expect = {
    head:     ['read',   'read-head'],
    inword:   ['read',   'read-inword'],
    confuse:  ['read',   'read-confuse'],
    group:    ['vocab',  'vocab-group'],
    opposite: ['vocab',  'vocab-opposite'],
    mix:      ['review', 'review-mixed'],
  };
  Object.keys(expect).forEach((key) => {
    const u = KanaStudy.soundUnitOf(key);
    eq(`よむ画面 ${key} の mode`, u.mode, expect[key][0]);
    eq(`よむ画面 ${key} の unit.id`, u.unitId, expect[key][1]);
  });
  eq('ふくしゅうの出題元は review（SRS の期限到来分・§2.4）',
    KanaStudy.soundUnitOf('mix').source, 'review');
  eq('通常の出題元は course', KanaStudy.soundUnitOf('head').source, 'course');
  ok('知らないコースには単元を作らない', KanaStudy.soundUnitOf('nope') === null);

  ['dakuten', 'hatsuon', 'sokuon', 'youon', 'chouon', 'joshi'].forEach((key) => {
    const u = KanaStudy.specialUnitOf(key);
    eq(`とくべつな おと ${key} の mode`, u.mode, 'special');
    eq(`とくべつな おと ${key} の unit.id`, u.unitId, 'special-' + key);
  });
  ok('とくべつな おと は 6 ユニット（§3.10.1）',
    Object.keys(KanaStudy.SPECIAL_UNIT_TITLES).length === 6);

  eq('ちからだめしの mode', KanaStudy.mimUnit().mode, 'mimcheck');
  eq('ちからだめしの unit.id', KanaStudy.mimUnit().unitId, 'mim-check');
}

/* ══════════════════════════════════════════════════════════════
   7. §3.10.2 なぞり書きと自力書きを混ぜない

   なぞりを 初回正答に 数えると、なぞりを くりかえす 児童ほど
   正答率が 高く 見える 逆転が 起きる。
   ══════════════════════════════════════════════════════════════ */
{
  const saved = [];
  const rec = KanaStudy.createRecorder({ save: (r) => { saved.push(r); return r.unit.id; }, now: clock() });

  rec.beginWrite('あ', 0, true, 'hiragana');
  rec.writeAttempt('あ', { guided: true, ok: true, firstTry: false, hint: true, tries: 1, ms: 8000, stage: 0 }, 'hiragana');
  rec.writeAttempt('あ', { guided: true, ok: true, firstTry: false, hint: true, tries: 1, ms: 7000, stage: 1 }, 'hiragana');
  // 段階が 2 に 上がって 自力書きへ。ここで レコードが 分かれる
  rec.writeAttempt('あ', { guided: false, ok: true, firstTry: true, hint: false, tries: 1, ms: 9000, stage: 2 }, 'hiragana');
  rec.end('completed');

  eq('なぞりと自力でレコードが分かれる', saved.length, 2);
  const g = saved[0], s = saved[1];
  eq('なぞりのレコードは ext.guided: true', g.ext.guided, true);
  eq('なぞりのレコードは初回正答 0（自力書きだけから数える）', g.summary.firstTryCorrect, 0);
  ok('なぞりの item は hint: true（お手本＝こたえが出ている・§2.10）',
    g.items.every((it) => it.hint === true && it.firstTry === false));
  eq('自力のレコードは ext.guided: false', s.ext.guided, false);
  eq('自力のレコードは初回正答を数える', s.summary.firstTryCorrect, 1);
  eq('かくの unit.id は文字ごと（§3.10.2）', g.unit.id, 'kana-あ');
  eq('かくの mode', g.mode, 'write');
  eq('かくの ext.ability', g.ext.ability, 'write');
  eq('かくの ext.kanaMode', g.ext.kanaMode, 'hiragana');
  eq('かくの count は書いた回数（§3.10.1）', g.summary.count, g.items.length);
  eq('かくは未着手が残らないので completed（§3.10.5）', g.status, 'completed');
}

/* ══════════════════════════════════════════════════════════════
   8. §3.10.2 ext.stage / ext.stageUp
   ══════════════════════════════════════════════════════════════ */
{
  const saved = [];
  const rec = KanaStudy.createRecorder({ save: (r) => saved.push(r), now: clock() });

  rec.beginWrite('き', 2, false, 'hiragana');
  rec.writeAttempt('き', { guided: false, ok: true, firstTry: true, tries: 1, ms: 5000, stage: 2 }, 'hiragana');
  rec.noteStage(3);                       // 段階が 上がった
  rec.end('completed');
  eq('段階は ext.stage に入る', saved[0].ext.stage, 3);
  eq('段階が上がった回は ext.stageUp: true', saved[0].ext.stageUp, true);

  saved.length = 0;
  rec.beginWrite('く', 2, false, 'hiragana');
  rec.writeAttempt('く', { guided: false, ok: false, firstTry: false, tries: 1, ms: 5000, stage: 2 }, 'hiragana');
  rec.noteStage(2);
  rec.end('completed');
  eq('段階が上がらなければ stageUp は false', saved[0].ext.stageUp, false);

  // 段階 0 → 1 は「かきじゅんアニメを見た」だけ。まだ 1 画も書いていないので
  // stageUp に数えない（アプリの画面でも「よくできました」は出ない）
  saved.length = 0;
  rec.beginWrite('け', 0, true, 'hiragana');
  rec.writeAttempt('け', { guided: true, ok: true, firstTry: false, hint: true, tries: 1, ms: 5000, stage: 0 }, 'hiragana');
  rec.noteStage(1);
  rec.end('completed');
  eq('アニメを見ただけ（0→1）は stageUp にしない', saved[0].ext.stageUp, false);

  saved.length = 0;
  rec.beginWrite('こ', 1, true, 'hiragana');
  rec.writeAttempt('こ', { guided: true, ok: true, firstTry: false, hint: true, tries: 1, ms: 5000, stage: 1 }, 'hiragana');
  rec.noteStage(2);
  rec.end('completed');
  eq('なぞりを やりきった（1→2）は stageUp', saved[0].ext.stageUp, true);
}

/* ══════════════════════════════════════════════════════════════
   9. §3.10.3 MIM の層（tier）を必ず残す

   えらぶ かずが 3→2 に へれば あてずっぽうの 正答率が 33%→50% に 上がる。
   tier を 見ずに 正答率を ならべると、**手あつい 指導を うけている 児童ほど
   成績が よく 見える** 逆転が 起きる。
   ══════════════════════════════════════════════════════════════ */
{
  const r = KanaStudy.buildStudyRecord(quizInput({ ext: { ability: 'special', unitKey: 'sokuon', tier: 3 } }));
  eq('とくべつな おと には ext.tier がある', r.ext.tier, 3);
  eq('ext.unitKey がある（受信側が 6 ユニット別に見る）', r.ext.unitKey, 'sokuon');
}

/* ══════════════════════════════════════════════════════════════
   10. §3.10.4 ちからだめしは課題ごとに 1 レコード
   ══════════════════════════════════════════════════════════════ */
{
  const saved = [];
  const rec = KanaStudy.createRecorder({ save: (r) => saved.push(r), now: clock() });
  const U = KanaStudy.mimUnit();

  rec.begin(Object.assign({}, U, { ext: { tier: 2, testType: 'spelling', score: 0 } }));
  rec.item({ q: 'きって', ok: true, firstTry: true, tries: 1, ms: 2000 });
  rec.item({ q: 'がっこう', ok: false, firstTry: false, tries: 1, ms: 2500, wrong: 'がこう' });
  rec.patchExt({ score: 1 });
  rec.markCompleted();
  rec.end('completed');

  rec.begin(Object.assign({}, U, { ext: { tier: 2, testType: 'segmentation', score: 0 } }));
  rec.item({ q: 'いぬがはしるあおいそら', ok: true, firstTry: true, tries: 1, ms: 4000 });
  rec.patchExt({ score: 1 });
  rec.markCompleted();
  rec.end('completed');

  eq('ちからだめしは 2 つの課題で 2 レコード', saved.length, 2);
  eq('1 つめは spelling', saved[0].ext.testType, 'spelling');
  eq('2 つめは segmentation', saved[1].ext.testType, 'segmentation');
  saved.forEach((r) => {
    eq('ちからだめしの mode は mimcheck（受信側が正答率から外す目じるし）', r.mode, 'mimcheck');
    eq('ちからだめしの unit.id', r.unit.id, 'mim-check');
    ok('ちからだめしには ext.score がある', typeof r.ext.score === 'number');
    ok('ちからだめしには ext.tier がある', typeof r.ext.tier === 'number');
    ok('ちからだめしには ext.ability を付けない（4 つのちからとは別の課題）',
      r.ext.ability === undefined);
  });
  ok('20 文字以内の設問 ID はそのまま', saved[0].items[0].q === 'きって');
  ok('まちがえた中身は wrong に残る', JSON.stringify(saved[0].items[1].wrong) === '["がこう"]');
}

/* ══════════════════════════════════════════════════════════════
   11. §2.10 設問 ID の生成規則（ハッシュは決定的であること）
   ══════════════════════════════════════════════════════════════ */
{
  eq('式・ことばはそのまま', KanaStudy.questionId('s:sokuon:きって'), 's:sokuon:きって');
  eq('空の問題文は q-empty', KanaStudy.questionId(''), 'q-empty');
  const long = 'あいうえおかきくけこさしすせそたちつてとなにぬねの';
  ok('20 文字超はハッシュを前置して短縮', /^w-[0-9a-z]+$/.test(KanaStudy.questionId(long)));
  eq('ハッシュは決定的（乱数・時刻を混ぜない）',
    KanaStudy.questionId(long), KanaStudy.questionId(long));
  ok('別の文字れつは別のハッシュ',
    KanaStudy.questionId(long) !== KanaStudy.questionId(long + 'は'));
  ok('問題文そのものを q に入れない（20 文字を超えない）',
    KanaStudy.questionId(long).length <= 20);
}

/* ══════════════════════════════════════════════════════════════
   12. §2.10 wrong のサニタイズ
   ══════════════════════════════════════════════════════════════ */
{
  ok('13 文字以上は捨てる', KanaStudy.wrongValues('あいうえおかきくけこさしす') === undefined);
  ok('危ない記号を含む値は捨てる', KanaStudy.wrongValues('<script>') === undefined);
  eq('マスに入れた文字はマスの順にならべる',
    JSON.stringify(KanaStudy.wrongValues({ 2: 'つ', 0: 'き' })), '["きつ"]');

  // studyLog.js 側でも もう一度 ふるいに かける（二重の 守り）
  const rec = KanaStudy.buildStudyRecord(quizInput({
    items: [{ q: 'r:あ', ok: false, firstTry: false, wrong: ['あいうえおかきくけこさしすせそ'] }],
  }));
  global.localStorage.clear();
  StudyLog.saveStudyRecord(rec);
  const stored = JSON.parse(global.localStorage.getItem('study.records.v1'))[0];
  eq('長すぎる wrong は保存時に落とされる', stored.items[0].wrong.length, 0);
}

/* ══════════════════════════════════════════════════════════════
   13. §2.11 ext は 8KB を超えない
   ══════════════════════════════════════════════════════════════ */
{
  const weakIds = [];
  for (let i = 0; i < 500; i++) weakIds.push('s:sokuon:ながいながいことば' + i);
  const r = KanaStudy.buildStudyRecord(quizInput({
    ext: { ability: 'special', unitKey: 'sokuon', tier: 1, weakIds },
  }));
  ok('ext は 8KB 以下に収まる', JSON.stringify(r.ext).length <= 8192);
  ok('weakIds は 40 件までに絞られる', r.ext.weakIds.length <= 40);
  ok('主指標（tier・unitKey）は落とさない',
    r.ext.tier === 1 && r.ext.unitKey === 'sokuon');
}

/* ══════════════════════════════════════════════════════════════
   14. §5.4 中断・復帰・タブ破棄
   ══════════════════════════════════════════════════════════════ */
{
  // 離席が 5 分をこえたら、**離れた時刻で** 締める。
  // 待っていた 5 分を 学習時間に 入れると 全児童の 学習時間が 水増しされる。
  let t = T0;
  const saved = [];
  const rec = KanaStudy.createRecorder({ save: (r) => saved.push(r), now: () => t });

  rec.begin(Object.assign({ count: 8, ext: {} }, KanaStudy.soundUnitOf('head')));
  t += 30000;
  rec.item({ q: 'r:あ', ok: true, firstTry: true, tries: 1, ms: 3000 });
  rec.noteHidden();          // ここで タブを 離れた（T0+30 秒）
  t += 10 * 60000;           // 10 分 もどらなかった
  rec.noteVisible();

  eq('5 分をこえた離席は中断として保存される', saved.length, 1);
  eq('中断は status: aborted', saved[0].status, 'aborted');
  eq('elapsedMs は離れた時刻で締める（待った 10 分を含めない）', saved[0].elapsedMs, 30000);
  eq('中断時は attempted < count', saved[0].summary.attempted < saved[0].summary.count, true);

  // 復帰したら **新しい** レコードを 始める。中断済みの レコードには 追記しない。
  rec.item({ q: 'r:い', ok: true, firstTry: true, tries: 1, ms: 3000 });
  t += 5000;
  rec.end('completed');
  eq('復帰後は新しいレコードになる', saved.length, 2);
  ok('もとのレコードには追記されない', saved[0].items.length === 1);
  eq('復帰後の count は区切りの残り分', saved[1].summary.count, 7);
  ok('復帰後のレコードは同じ単元', saved[1].unit.id === saved[0].unit.id);

  // 5 分に 満たない 離席は 中断に しない
  saved.length = 0;
  rec.begin(Object.assign({ count: 8, ext: {} }, KanaStudy.soundUnitOf('head')));
  rec.item({ q: 'r:う', ok: true, firstTry: true, tries: 1 });
  rec.noteHidden();
  t += 60000;                // 1 分（先生の 説明を きく ていどの 離席）
  rec.noteVisible();
  eq('5 分に満たない離席は中断にしない', saved.length, 0);
  rec.end('completed');
}
{
  // Chromebook の タブ破棄。`pagehide` で かならず 確定する。
  let t = T0;
  const saved = [];
  const rec = KanaStudy.createRecorder({ save: (r) => saved.push(r), now: () => t });
  rec.begin(Object.assign({ count: 6, ext: {} }, KanaStudy.specialUnitOf('youon')));
  t += 20000;
  rec.item({ q: 's:youon:でんしゃ', ok: true, firstTry: true, tries: 1 });
  rec.notePageHide();
  eq('pagehide でレコードが確定する', saved.length, 1);
  eq('やりかけなら aborted', saved[0].status, 'aborted');

  // 完走ずみで タブが 消えた ときは completed の まま
  saved.length = 0;
  rec.begin(Object.assign({ count: 1, ext: {} }, KanaStudy.specialUnitOf('youon')));
  rec.item({ q: 's:youon:きんぎょ', ok: true, firstTry: true, tries: 1 });
  rec.markCompleted();
  rec.notePageHide();
  eq('完走ずみなら completed', saved[0].status, 'completed');
}

/* ══════════════════════════════════════════════════════════════
   15. studyLog.js（全アプリ共通・不変の層）
   ══════════════════════════════════════════════════════════════ */
{
  eq('ロジック版は 1.1（§5.1.3）', StudyLog.LOGIC_VERSION, '1.1');
  eq('キーは study.records.v1（§1）', StudyLog.STUDY_LOG_KEY, 'study.records.v1');
  eq('上限は 500 件（§1.3）', StudyLog.STUDY_LOG_MAX, 500);
  eq('items の上限は 200 件（§2.10）', StudyLog.STUDY_ITEMS_MAX, 200);
  ok('公開する名前は §5.1.3 のとおり',
    typeof StudyLog.saveStudyRecord === 'function');

  global.localStorage.clear();
  const id = StudyLog.saveStudyRecord(KanaStudy.buildStudyRecord(quizInput()));
  ok('id は UUID 形式（§9.2）',
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
  const log = JSON.parse(global.localStorage.getItem('study.records.v1'));
  eq('1 件ためられる', log.length, 1);

  // 必須項目が 欠けた レコードは ためない（§2.2）
  ok('unit が無いレコードは保存しない', StudyLog.saveStudyRecord({ appId: 'kana-master' }) === null);
  ok('elapsedMs が無いレコードは保存しない',
    StudyLog.saveStudyRecord({ appId: 'kana-master', unit: { id: 'x' } }) === null);

  // 壊れた JSON からの 復帰。ここで あきらめると、一度 壊れた 端末は
  // 以降 ずっと 1 件も 保存できなくなる（しかも 誰も 気づけない）。
  global.localStorage.setItem('study.records.v1', '{ こわれている');
  ok('壊れた保存ずみログからも復帰して保存できる',
    StudyLog.saveStudyRecord(KanaStudy.buildStudyRecord(quizInput())) !== null);
  eq('壊れていたら空からやり直す',
    JSON.parse(global.localStorage.getItem('study.records.v1')).length, 1);

  // 500 件を こえたら 古いものから 捨てる（§1.3）
  global.localStorage.clear();
  for (let i = 0; i < 520; i++) StudyLog.saveStudyRecord(KanaStudy.buildStudyRecord(quizInput()));
  eq('500 件を超えたら古いものから捨てる',
    JSON.parse(global.localStorage.getItem('study.records.v1')).length, 500);
}

/* ══════════════════════════════════════════════════════════════
   16. §1.2 リセットが study.records.v1 に触れないこと

   App.jsx の resetAll と おなじ すじみちを ここで なぞる。
   このアプリの キーだけを 消し、共有の 学習ログには 触れない。
   ══════════════════════════════════════════════════════════════ */
{
  global.localStorage.clear();
  StudyLog.saveStudyRecord(KanaStudy.buildStudyRecord(quizInput()));
  ['kkm_v3_progress', 'kkm_v4_skill', 'kkm_v2_words'].forEach((k) =>
    global.localStorage.setItem(k, '1'));

  const STORAGE_PREFIX = 'kkm';
  const keep = StudyLog.STUDY_LOG_KEY;
  const mine = [];
  for (let i = 0; i < global.localStorage.length; i++) {
    const k = global.localStorage.key(i);
    if (k && k !== keep && k.startsWith(STORAGE_PREFIX)) mine.push(k);
  }
  mine.forEach((k) => global.localStorage.removeItem(k));

  ok('リセット後も学習ログは残る', global.localStorage.getItem(keep) !== null);
  eq('リセット後もレコードは消えない',
    JSON.parse(global.localStorage.getItem(keep)).length, 1);
  ok('このアプリのキーは消える', global.localStorage.getItem('kkm_v3_progress') === null);
}

/* ══════════════════════════════════════════════════════════════
   17. §4 記録してはならないもの
   ══════════════════════════════════════════════════════════════ */
{
  const rec = KanaStudy.buildStudyRecord(quizInput());
  const text = JSON.stringify(rec);
  ['name', 'studentId', 'email', 'userAgent', 'ip'].forEach((k) => {
    ok(`${k} を含まない（アプリ層は匿名・§4）`, text.indexOf('"' + k + '"') < 0);
  });
  ok('ext に内部状態のダンプを入れていない（§2.11）',
    Object.keys(rec.ext).length <= 12);
}

/* ── 実行結果 ── */
function clock() { let t = T0; return () => (t += 1000); }

if (fails.length > 0) {
  console.error(`\n✗ ${fails.length} 件 失敗しました\n`);
  fails.forEach((f) => console.error('  - ' + f));
  process.exit(1);
}
console.log(`✓ ${pass} 件すべて通りました（学習ログ共通スキーマ study.v1 §3.10）`);
