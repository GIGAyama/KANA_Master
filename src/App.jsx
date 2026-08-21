/* ==============================================================
   ひらがな・カタカナ かきかたマスター ＋ ことばあつめ
   --------------------------------------------------------------
   小学１年生のための、ひらがな・カタカナ反復練習＋単語収集アプリ

   ＜たのしさUPの追加機能＞
   - 音声よみあげ（タップで読んでくれる）
   - マスコット「えんぴつせんせい」のおうえん
   - 連続学習日数のストリーク
   - レベル（しょうごう）と ごほうびの はんこ図鑑
   - きょうの もじ（デイリーチャレンジ）

   先生がカスタマイズしたい場合は、下の "// ★カスタマイズポイント"
   と書かれた箇所を中心に書き換えてみてください。
   ============================================================== */

const { useState, useEffect, useRef, useCallback, useMemo } = React;

/* ──────────────────────────────────────────────────────────────
   1. データ定数
   ────────────────────────────────────────────────────────────── */

// ★カスタマイズポイント: 50音表
const HIRA_TABLE = [
  'あ','い','う','え','お',  'か','き','く','け','こ',
  'さ','し','す','せ','そ',  'た','ち','つ','て','と',
  'な','に','ぬ','ね','の',  'は','ひ','ふ','へ','ほ',
  'ま','み','む','め','も',  'や','' ,'ゆ','' ,'よ',
  'ら','り','る','れ','ろ',  'わ','' ,'' ,'' ,'を',  'ん','' ,'' ,'' ,''
];
const KATA_TABLE = [
  'ア','イ','ウ','エ','オ',  'カ','キ','ク','ケ','コ',
  'サ','シ','ス','セ','ソ',  'タ','チ','ツ','テ','ト',
  'ナ','ニ','ヌ','ネ','ノ',  'ハ','ヒ','フ','ヘ','ホ',
  'マ','ミ','ム','メ','モ',  'ヤ','' ,'ユ','' ,'ヨ',
  'ラ','リ','ル','レ','ロ',  'ワ','' ,'' ,'' ,'ヲ',  'ン','' ,'' ,'' ,''
];
const HIRA_LIST = HIRA_TABLE.filter(c => c);
const KATA_LIST = KATA_TABLE.filter(c => c);

// ★カスタマイズポイント: 濁音・半濁音・拗音／促音（小書き）の表
const HIRA_DAKUON_TABLE = [
  'が','ぎ','ぐ','げ','ご',
  'ざ','じ','ず','ぜ','ぞ',
  'だ','ぢ','づ','で','ど',
  'ば','び','ぶ','べ','ぼ',
];
const HIRA_HANDAKUON_TABLE = [
  'ぱ','ぴ','ぷ','ぺ','ぽ',
];
// 拗音は「き」＋「ゃ」のように２文字で書くため、まずは小書き文字の書き方だけ練習する
const HIRA_YOUON_TABLE = [
  'ゃ','ゅ','ょ','っ',
];
const KATA_DAKUON_TABLE = [
  'ガ','ギ','グ','ゲ','ゴ',
  'ザ','ジ','ズ','ゼ','ゾ',
  'ダ','ヂ','ヅ','デ','ド',
  'バ','ビ','ブ','ベ','ボ',
];
const KATA_HANDAKUON_TABLE = [
  'パ','ピ','プ','ペ','ポ',
];
const KATA_YOUON_TABLE = [
  'ャ','ュ','ョ','ッ',
];
const HIRA_DAKUON_LIST    = HIRA_DAKUON_TABLE.filter(c => c);
const HIRA_HANDAKUON_LIST = HIRA_HANDAKUON_TABLE.filter(c => c);
const HIRA_YOUON_LIST     = HIRA_YOUON_TABLE.filter(c => c);
const KATA_DAKUON_LIST    = KATA_DAKUON_TABLE.filter(c => c);
const KATA_HANDAKUON_LIST = KATA_HANDAKUON_TABLE.filter(c => c);
const KATA_YOUON_LIST     = KATA_YOUON_TABLE.filter(c => c);
const HIRA_ALL_LIST = [...HIRA_LIST, ...HIRA_DAKUON_LIST, ...HIRA_HANDAKUON_LIST, ...HIRA_YOUON_LIST];
const KATA_ALL_LIST = [...KATA_LIST, ...KATA_DAKUON_LIST, ...KATA_HANDAKUON_LIST, ...KATA_YOUON_LIST];

// 文字のしゅるい（清音／濁音／半濁音／拗音・促音）
// short: せまい画面むけの みじかい見出し／label: ひろい画面むけの ただしい名まえ
const KANA_KINDS = [
  // label: ゆとりのあるとき／mid: せまい枠のとき／short: スマホのとき
  { key: 'seion',     label: 'せいおん',          mid: 'せいおん',   short: 'せい' },
  { key: 'dakuon',    label: 'だくおん',          mid: 'だくおん',   short: 'だく' },
  { key: 'handakuon', label: 'はんだくおん',      mid: 'はんだくおん', short: 'はん' },
  { key: 'youon',     label: 'ようおん・そくおん', mid: 'ようおん',   short: 'よう' },
];
function getKanaTable(kanaMode, kanaKind) {
  if (kanaMode === 'katakana') {
    if (kanaKind === 'dakuon')    return KATA_DAKUON_TABLE;
    if (kanaKind === 'handakuon') return KATA_HANDAKUON_TABLE;
    if (kanaKind === 'youon')     return KATA_YOUON_TABLE;
    return KATA_TABLE;
  }
  if (kanaKind === 'dakuon')    return HIRA_DAKUON_TABLE;
  if (kanaKind === 'handakuon') return HIRA_HANDAKUON_TABLE;
  if (kanaKind === 'youon')     return HIRA_YOUON_TABLE;
  return HIRA_TABLE;
}
function getKanaList(kanaMode, kanaKind) {
  return getKanaTable(kanaMode, kanaKind).filter(c => c);
}
function getKindOfChar(c) {
  if (HIRA_DAKUON_LIST.includes(c) || KATA_DAKUON_LIST.includes(c))       return 'dakuon';
  if (HIRA_HANDAKUON_LIST.includes(c) || KATA_HANDAKUON_LIST.includes(c)) return 'handakuon';
  if (HIRA_YOUON_LIST.includes(c) || KATA_YOUON_LIST.includes(c))         return 'youon';
  return 'seion';
}

/* ──────────────────────────────────────────────────────────────
   ことばの さしえ（ピクトグラム）

   絵文字は使わず、線だけで描いた かんたんな アイコン（PICTS）で表す。
   端末やフォントによって見た目が変わらず、教科書のさしえのように
   おちついたトーンでそろう。

   ことばのデータは絵文字ではなく「p: 'dog'」のように PICTS のキーを持つ。
   ★カスタマイズポイント: さしえを増やしたいときは PICTS にキーを足して、
   ここの p: に書くだけでよい。
   ────────────────────────────────────────────────────────────── */

// ★カスタマイズポイント: 「ことばを つくろう」で こどもが えらべる さしえ
//
// さしえは わざと 16 こに しぼってある。1年生に 40 この 絵から えらばせると、
// ことばを 書くことより「絵さがし」に 気もちが いってしまい、手が とまる。
// ここは ことばの なかまを ざっくり えらぶだけの場所なので、
//
//   ・ぜんぶ 1 画面に おさまる かずにする（スクロールさせない）
//   ・絵の 下に ことばの ラベルを 出す（絵の いみを 当てさせない）
//
// の 2 つを まもる。ふやしたくなったら、まず 1 つ けすこと。
//
// ※ ここに ない さしえ（PICTS のキー）も、もんだいの データや、
//   むかし ほぞんした ことばでは そのまま つかえる。この表は
//   「子どもに えらばせる ぶん」だけを しぼったもの。
const PICT_CHOICES = [
  { name:'rice',   label:'たべもの' },
  { name:'fruit',  label:'くだもの' },
  { name:'sweet',  label:'おかし'   },
  { name:'drink',  label:'のみもの' },
  { name:'animal', label:'どうぶつ' },
  { name:'bird',   label:'とり'     },
  { name:'fish',   label:'さかな'   },
  { name:'bug',    label:'むし'     },
  { name:'flower', label:'はな'     },
  { name:'tree',   label:'き'       },
  { name:'cloud',  label:'てんき'   },
  { name:'water',  label:'みず'     },
  { name:'car',    label:'のりもの' },
  { name:'house',  label:'いえ'     },
  { name:'school', label:'がっこう' },
  { name:'person', label:'ひと'     },
];

// 旧バージョン（絵文字で保存された ことば）を さしえに読みかえる表。
// 保存ずみの学習記録をこわさないための移行用で、新しく増やす必要はない。
const EMOJI_TO_PICT = {
  '😀':'person','🍎':'fruit','🐶':'dog','🐱':'cat','🌸':'flower','⭐':'star','🌈':'rainbow',
  '🍰':'sweet','🚗':'car','⚽':'ball','🎈':'ball','💧':'water','🌙':'moon','☀':'sun',
  '🦋':'bug','🐟':'fish','🍓':'fruit','🍙':'rice','🚀':'plane','🎵':'music',
  '🍬':'sweet','🌊':'water','🚉':'train','👹':'person','🦀':'octopus','🌼':'flower','☁':'cloud',
  '🪀':'tool','🍉':'fruit','🌌':'cloud','🐙':'octopus','🌺':'flower','🚢':'ship','🍑':'fruit',
  '⛰':'mountain','❄':'snow','🍋':'fruit','🐘':'animal','☎':'tool','🍇':'fruit','🎒':'bag',
  '🍡':'sweet','🍱':'rice','🐼':'animal','✏':'pencil','🍮':'sweet','📮':'tool','🚃':'train',
  '🏫':'school','🍦':'sweet','🐬':'fish','🐰':'rabbit','🦐':'octopus','🍳':'rice','🦛':'animal',
  '🦒':'animal','🐻':'animal','🐨':'animal','🦈':'fish','🦓':'animal','🧀':'rice','🍅':'vegetable',
  '🐍':'animal','🍌':'fruit','🦁':'animal','🦍':'animal','🐦':'bird','🐷':'animal','🎹':'music',
  '🐧':'bird','🍫':'sweet','🥤':'drink','✨':'star',
};
// 保存ずみの ことばから さしえのキーを求める（旧データもここで吸収する）
function pictOf(word) {
  if (!word) return 'shape';
  if (word.pict) return word.pict;
  if (word.emoji) {
    // 絵文字の異体字セレクタ（U+FE0F）は取りのぞいて照合する
    const bare = String(word.emoji).replace(/️/g, '');
    if (EMOJI_TO_PICT[bare]) return EMOJI_TO_PICT[bare];
  }
  return 'shape';
}

/* ══════════════════════════════════════════════════════════════
   1.1. ことばずかん ── このアプリの ことばは ぜんぶ ここ

   1年生が 1年かんで 出あう ことばを「なかま」ごとに まとめた、
   このアプリ ゆいいつの ことばの もとだね。ここに 1 語 足すと、

     ・あたまの おと（「あ」から はじまる ことばは どれ？）
     ・ことばの なかの もじ／にた もじ さがし
     ・なかまの ことば（たべものは どれ？）
     ・はんたいの ことば
     ・しりとり
     ・ことばあつめの ヒント

   の ぜんぶで つかわれる。**べつの場所に ことばの表を 作らないこと。**

     w … ことば（ひらがなだけ／カタカナだけ で書く）
     p … さしえ（PICTS のキー）
     g … なかま（WORD_GROUPS のキー）

   ★カスタマイズポイント: ことばを ふやすときは この 2 つの表に 足すだけ。
   ══════════════════════════════════════════════════════════════ */

/* なかま（教科書の「なかまの ことば」に そろえてある）。

     key   … 保存と 参照に つかう名まえ
     title … 子どもに見せる名まえ
     ask   … 「なかまの ことば」の といかけ
     quiz  … もんだいに つかってよい なかまか。
             「みの まわりの もの」のように 何でも 当てはまってしまう
             なかまは false（ことばは つかうが 出題には しない）。
     avoid … まちがい選択肢に つかっては いけない なかま。
             「どうぶつは どれ？」に「すずめ」を まぜると、とりも
             どうぶつなので こたえが 2 つに なってしまう。
     text  … 絵にできない なかま（うごき・ようす・いろ・あいさつ など）。
             text どうし だけで もんだいを つくるので、さしえの
             ある／ない が こたえの ヒントに ならない。 */
const WORD_GROUPS = [
  { key:'body',    title:'からだ',              ask:'からだの ことばは どれ？',                 quiz:true  },
  { key:'family',  title:'ひと・かぞく',        ask:'ひとを あらわす ことばは どれ？',          quiz:true  },
  { key:'school',  title:'がっこう',            ask:'がっこうに あるものは どれ？',             quiz:true,  avoid:['study','tool','town'] },
  { key:'study',   title:'べんきょうの どうぐ', ask:'べんきょうに つかう ものは どれ？',        quiz:true,  avoid:['school','tool'] },
  { key:'food',    title:'たべもの',            ask:'たべものは どれ？',                        quiz:true,  avoid:['yasai'] },
  { key:'yasai',   title:'やさい・くだもの',    ask:'やさいや くだものは どれ？',               quiz:true,  avoid:['food','plant'] },
  { key:'animal',  title:'どうぶつ',            ask:'どうぶつは どれ？',                        quiz:true,  avoid:['bird','bug','sea'] },
  { key:'bird',    title:'とり',                ask:'とりは どれ？',                            quiz:true  },
  { key:'bug',     title:'むし',                ask:'むしは どれ？',                            quiz:true  },
  { key:'sea',     title:'うみの いきもの',     ask:'うみの いきものは どれ？',                 quiz:true  },
  { key:'plant',   title:'はな・き',            ask:'はなや きは どれ？',                       quiz:true,  avoid:['nature','yasai'] },
  { key:'weather', title:'てんき・きせつ',      ask:'てんきや きせつの ことばは どれ？',        quiz:true,  avoid:['nature'] },
  { key:'nature',  title:'しぜん',              ask:'しぜんの ことばは どれ？',                 quiz:true,  avoid:['weather','plant','sea','town'] },
  { key:'vehicle', title:'のりもの',            ask:'のりものは どれ？',                        quiz:true  },
  { key:'town',    title:'いえ・まち',          ask:'いえや まちに あるものは どれ？',          quiz:true,  avoid:['school','tool','nature'] },
  { key:'tool',    title:'みの まわりの もの',  ask:'',                                         quiz:false },
  { key:'cloth',   title:'きるもの',            ask:'きるものは どれ？',                        quiz:true,  avoid:['tool'] },
  { key:'play',    title:'あそび',              ask:'あそびの ことばは どれ？',                 quiz:true,  avoid:['tool','school'] },
  { key:'verb',    title:'うごきの ことば',     ask:'うごきを あらわす ことばは どれ？',        quiz:true,  text:true },
  { key:'adj',     title:'ようすの ことば',     ask:'ようすを あらわす ことばは どれ？',        quiz:true,  text:true, avoid:['color','feel'] },
  /* きもちの ことばは「ようすの ことば」から 分けて 持つ。
     「うれしい」は ようすの ことばでも あるので、まぜたままだと
     「ようすを あらわす ことばは どれ？」の こたえが 2 つに なる。
     たがいを avoid に 入れて、まちがい選択肢に つかわない。 */
  { key:'feel',    title:'きもちの ことば',     ask:'きもちを あらわす ことばは どれ？',        quiz:true,  text:true, avoid:['adj'] },
  { key:'color',   title:'いろ',                ask:'いろの なまえは どれ？',                   quiz:true,  text:true, avoid:['adj'] },
  { key:'time',    title:'とき',                ask:'ときを あらわす ことばは どれ？',          quiz:true,  text:true },
  { key:'place',   title:'ばしょ・むき',        ask:'ばしょや むきを あらわす ことばは どれ？', quiz:true,  text:true },
  { key:'aisatsu', title:'あいさつ',            ask:'あいさつの ことばは どれ？',               quiz:true,  text:true },
  { key:'other',   title:'そのほか',            ask:'',                                         quiz:false },
];
const WORD_GROUP_MAP = {};
WORD_GROUPS.forEach(g => { WORD_GROUP_MAP[g.key] = g; });
// 「なかまの ことば」の もんだいに つかえる なかま だけ
const QUIZ_GROUPS = WORD_GROUPS.filter(g => g.quiz);

/* ひらがなの ことば（1年生の 語彙）。
   おなじ ことばを 2 つの なかまに 書かないこと（あめ＝雨／飴 のように
   まぎれる ものは、どちらか 1 つに きめて べつの ことばを つかう）。 */
const WORD_BANK = [
  /* ── からだ ── */
  {w:'あたま',p:'person',g:'body'},{w:'かお',p:'person',g:'body'},{w:'め',p:'person',g:'body'},
  {w:'みみ',p:'person',g:'body'},{w:'くち',p:'person',g:'body'},{w:'て',p:'person',g:'body'},
  {w:'あし',p:'person',g:'body'},{w:'ゆび',p:'person',g:'body'},{w:'つめ',p:'person',g:'body'},
  {w:'かた',p:'person',g:'body'},{w:'くび',p:'person',g:'body'},{w:'せなか',p:'person',g:'body'},
  {w:'おなか',p:'person',g:'body'},{w:'ひざ',p:'person',g:'body'},{w:'ひじ',p:'person',g:'body'},
  {w:'うで',p:'person',g:'body'},{w:'むね',p:'person',g:'body'},{w:'のど',p:'person',g:'body'},
  {w:'ほね',p:'person',g:'body'},{w:'へそ',p:'person',g:'body'},{w:'かみのけ',p:'person',g:'body'},
  {w:'まつげ',p:'person',g:'body'},{w:'ほほ',p:'person',g:'body'},{w:'あご',p:'person',g:'body'},
  {w:'こし',p:'person',g:'body'},{w:'ひたい',p:'person',g:'body'},{w:'くちびる',p:'person',g:'body'},
  {w:'おしり',p:'person',g:'body'},{w:'ほっぺた',p:'person',g:'body'},{w:'まゆげ',p:'person',g:'body'},
  {w:'しっぽ',p:'animal',g:'body'},{w:'きば',p:'animal',g:'body'},{w:'くちばし',p:'bird',g:'body'},
  {w:'あくび',p:'person',g:'body'},{w:'いびき',p:'person',g:'body'},{w:'くしゃみ',p:'person',g:'body'},
  {w:'しゃっくり',p:'person',g:'body'},{w:'なみだ',p:'water',g:'body'},

  /* ── ひと・かぞく ── */
  {w:'おとうさん',p:'person',g:'family'},{w:'おかあさん',p:'person',g:'family'},
  {w:'おにいさん',p:'person',g:'family'},{w:'おねえさん',p:'person',g:'family'},
  {w:'おじいさん',p:'person',g:'family'},{w:'おばあさん',p:'person',g:'family'},
  {w:'あかちゃん',p:'person',g:'family'},{w:'いもうと',p:'person',g:'family'},
  {w:'おとうと',p:'person',g:'family'},{w:'ともだち',p:'person',g:'family'},
  {w:'せんせい',p:'person',g:'family'},{w:'こども',p:'person',g:'family'},{w:'おとな',p:'person',g:'family'},
  {w:'かぞく',p:'person',g:'family'},{w:'みんな',p:'person',g:'family'},{w:'ぼく',p:'person',g:'family'},
  {w:'わたし',p:'person',g:'family'},{w:'おきゃくさん',p:'person',g:'family'},
  {w:'おじさん',p:'person',g:'family'},{w:'おばさん',p:'person',g:'family'},{w:'ふたご',p:'person',g:'family'},
  {w:'きょうだい',p:'person',g:'family'},{w:'ひとり',p:'person',g:'family'},{w:'ふたり',p:'person',g:'family'},
  {w:'じぶん',p:'person',g:'family'},{w:'きみ',p:'person',g:'family'},{w:'あなた',p:'person',g:'family'},
  {w:'なかよし',p:'heart',g:'family'},

  /* ── がっこう ── */
  {w:'がっこう',p:'school',g:'school'},{w:'きょうしつ',p:'school',g:'school'},
  {w:'こくばん',p:'school',g:'school'},{w:'つくえ',p:'tool',g:'school'},{w:'いす',p:'tool',g:'school'},
  {w:'こうてい',p:'school',g:'school'},{w:'たいいくかん',p:'school',g:'school'},
  {w:'としょしつ',p:'school',g:'school'},{w:'ろうか',p:'school',g:'school'},
  {w:'げたばこ',p:'school',g:'school'},{w:'ほけんしつ',p:'school',g:'school'},
  {w:'きゅうしょく',p:'rice',g:'school'},{w:'そうじ',p:'tool',g:'school'},{w:'こくご',p:'book',g:'school'},
  {w:'さんすう',p:'book',g:'school'},{w:'おんがく',p:'music',g:'school'},{w:'たいいく',p:'ball',g:'school'},
  {w:'ずこう',p:'pencil',g:'school'},{w:'りか',p:'leaf',g:'school'},{w:'せいかつ',p:'leaf',g:'school'},
  {w:'しゅくだい',p:'book',g:'school'},{w:'じゅぎょう',p:'school',g:'school'},
  {w:'にゅうがく',p:'school',g:'school'},{w:'そつぎょう',p:'school',g:'school'},
  {w:'うんどうかい',p:'ball',g:'school'},{w:'えんそく',p:'mountain',g:'school'},
  {w:'ちょうれい',p:'school',g:'school'},{w:'がっきゅう',p:'school',g:'school'},
  {w:'ほうかご',p:'school',g:'school'},{w:'おんどく',p:'book',g:'school'},{w:'けいさん',p:'book',g:'school'},
  {w:'じかんわり',p:'book',g:'school'},{w:'せいと',p:'person',g:'school'},{w:'とうばん',p:'school',g:'school'},

  /* ── べんきょうの どうぐ ── */
  {w:'えんぴつ',p:'pencil',g:'study'},{w:'けしごむ',p:'pencil',g:'study'},{w:'ものさし',p:'pencil',g:'study'},
  {w:'ふでばこ',p:'bag',g:'study'},{w:'したじき',p:'book',g:'study'},{w:'じょうぎ',p:'pencil',g:'study'},
  {w:'ふで',p:'pencil',g:'study'},{w:'きょうかしょ',p:'book',g:'study'},{w:'えほん',p:'book',g:'study'},
  {w:'ずかん',p:'book',g:'study'},{w:'にっき',p:'book',g:'study'},{w:'かみ',p:'book',g:'study'},
  {w:'ほん',p:'book',g:'study'},{w:'よみもの',p:'book',g:'study'},{w:'ふうとう',p:'book',g:'study'},
  {w:'がようし',p:'book',g:'study'},{w:'しゅうじ',p:'pencil',g:'study'},{w:'がびょう',p:'tool',g:'study'},
  {w:'ちず',p:'book',g:'study'},{w:'じしょ',p:'book',g:'study'},{w:'ぶんぼうぐ',p:'pencil',g:'study'},
  {w:'いろえんぴつ',p:'pencil',g:'study'},{w:'れんらくちょう',p:'book',g:'study'},{w:'ぺん',p:'pencil',g:'study'},
  {w:'ふでいれ',p:'bag',g:'study'},

  /* ── たべもの ── */
  {w:'ごはん',p:'rice',g:'food'},{w:'たまご',p:'rice',g:'food'},{w:'にく',p:'rice',g:'food'},
  {w:'みそしる',p:'drink',g:'food'},{w:'おにぎり',p:'rice',g:'food'},{w:'うどん',p:'rice',g:'food'},
  {w:'そば',p:'rice',g:'food'},{w:'おかし',p:'sweet',g:'food'},{w:'あめだま',p:'sweet',g:'food'},
  {w:'もち',p:'sweet',g:'food'},{w:'だんご',p:'sweet',g:'food'},{w:'わたあめ',p:'sweet',g:'food'},
  {w:'せんべい',p:'sweet',g:'food'},{w:'さとう',p:'sweet',g:'food'},{w:'しお',p:'rice',g:'food'},
  {w:'しょうゆ',p:'drink',g:'food'},{w:'とうふ',p:'rice',g:'food'},{w:'なっとう',p:'rice',g:'food'},
  {w:'ぎゅうにゅう',p:'drink',g:'food'},{w:'おちゃ',p:'drink',g:'food'},{w:'のみもの',p:'drink',g:'food'},
  {w:'のり',p:'rice',g:'food'},{w:'てんぷら',p:'rice',g:'food'},{w:'からあげ',p:'rice',g:'food'},
  {w:'たまごやき',p:'rice',g:'food'},{w:'やきそば',p:'rice',g:'food'},{w:'むすび',p:'rice',g:'food'},
  {w:'めし',p:'rice',g:'food'},{w:'べんとう',p:'rice',g:'food'},{w:'ぜんざい',p:'sweet',g:'food'},
  {w:'おでん',p:'rice',g:'food'},{w:'ぞうに',p:'rice',g:'food'},{w:'あぶら',p:'rice',g:'food'},
  {w:'ぎょうざ',p:'rice',g:'food'},{w:'おかゆ',p:'rice',g:'food'},{w:'つけもの',p:'vegetable',g:'food'},
  {w:'みずあめ',p:'sweet',g:'food'},{w:'ようかん',p:'sweet',g:'food'},{w:'どらやき',p:'sweet',g:'food'},
  {w:'まんじゅう',p:'sweet',g:'food'},{w:'おしるこ',p:'drink',g:'food'},{w:'こんにゃく',p:'rice',g:'food'},
  {w:'ちくわ',p:'rice',g:'food'},{w:'かまぼこ',p:'rice',g:'food'},{w:'やきいも',p:'vegetable',g:'food'},
  {w:'たこやき',p:'rice',g:'food'},{w:'おこのみやき',p:'rice',g:'food'},{w:'ざるそば',p:'rice',g:'food'},
  {w:'ゆでたまご',p:'rice',g:'food'},{w:'はちみつ',p:'sweet',g:'food'},{w:'ふりかけ',p:'rice',g:'food'},
  {w:'おやつ',p:'sweet',g:'food'},{w:'まぜごはん',p:'rice',g:'food'},

  /* ── やさい・くだもの ── */
  {w:'りんご',p:'fruit',g:'yasai'},{w:'みかん',p:'fruit',g:'yasai'},{w:'いちご',p:'fruit',g:'yasai'},
  {w:'すいか',p:'fruit',g:'yasai'},{w:'もも',p:'fruit',g:'yasai'},{w:'ぶどう',p:'fruit',g:'yasai'},
  {w:'なし',p:'fruit',g:'yasai'},{w:'かき',p:'fruit',g:'yasai'},{w:'くり',p:'fruit',g:'yasai'},
  {w:'なす',p:'vegetable',g:'yasai'},{w:'きゅうり',p:'vegetable',g:'yasai'},
  {w:'にんじん',p:'vegetable',g:'yasai'},{w:'だいこん',p:'vegetable',g:'yasai'},
  {w:'たまねぎ',p:'vegetable',g:'yasai'},{w:'じゃがいも',p:'vegetable',g:'yasai'},
  {w:'かぼちゃ',p:'vegetable',g:'yasai'},{w:'とうもろこし',p:'vegetable',g:'yasai'},
  {w:'ほうれんそう',p:'vegetable',g:'yasai'},{w:'きのこ',p:'vegetable',g:'yasai'},
  {w:'まめ',p:'vegetable',g:'yasai'},{w:'れんこん',p:'vegetable',g:'yasai'},
  {w:'ごぼう',p:'vegetable',g:'yasai'},{w:'さつまいも',p:'vegetable',g:'yasai'},
  {w:'とまと',p:'vegetable',g:'yasai'},{w:'れもん',p:'fruit',g:'yasai'},{w:'ねぎ',p:'vegetable',g:'yasai'},
  {w:'はくさい',p:'vegetable',g:'yasai'},{w:'えだまめ',p:'vegetable',g:'yasai'},
  {w:'ごま',p:'vegetable',g:'yasai'},{w:'しいたけ',p:'vegetable',g:'yasai'},{w:'びわ',p:'fruit',g:'yasai'},
  {w:'ざくろ',p:'fruit',g:'yasai'},{w:'すもも',p:'fruit',g:'yasai'},{w:'いちじく',p:'fruit',g:'yasai'},
  {w:'ぎんなん',p:'fruit',g:'yasai'},{w:'かぶ',p:'vegetable',g:'yasai'},{w:'おくら',p:'vegetable',g:'yasai'},
  {w:'そらまめ',p:'vegetable',g:'yasai'},{w:'ゆず',p:'fruit',g:'yasai'},{w:'あんず',p:'fruit',g:'yasai'},
  {w:'たけのこ',p:'vegetable',g:'yasai'},{w:'さくらんぼ',p:'fruit',g:'yasai'},

  /* ── どうぶつ ── */
  {w:'いぬ',p:'dog',g:'animal'},{w:'ねこ',p:'cat',g:'animal'},{w:'うし',p:'animal',g:'animal'},
  {w:'うま',p:'animal',g:'animal'},{w:'ぶた',p:'animal',g:'animal'},{w:'ひつじ',p:'animal',g:'animal'},
  {w:'やぎ',p:'animal',g:'animal'},{w:'さる',p:'animal',g:'animal'},{w:'くま',p:'animal',g:'animal'},
  {w:'きつね',p:'animal',g:'animal'},{w:'たぬき',p:'animal',g:'animal'},{w:'りす',p:'animal',g:'animal'},
  {w:'ねずみ',p:'animal',g:'animal'},{w:'もぐら',p:'animal',g:'animal'},{w:'しか',p:'animal',g:'animal'},
  {w:'ぞう',p:'animal',g:'animal'},{w:'きりん',p:'animal',g:'animal'},{w:'らいおん',p:'animal',g:'animal'},
  {w:'とら',p:'animal',g:'animal'},{w:'かば',p:'animal',g:'animal'},{w:'さい',p:'animal',g:'animal'},
  {w:'うさぎ',p:'rabbit',g:'animal'},{w:'はりねずみ',p:'animal',g:'animal'},
  {w:'おおかみ',p:'animal',g:'animal'},{w:'こうもり',p:'animal',g:'animal'},{w:'かえる',p:'animal',g:'animal'},
  {w:'とかげ',p:'animal',g:'animal'},{w:'へび',p:'animal',g:'animal'},{w:'かめ',p:'animal',g:'animal'},
  {w:'わに',p:'animal',g:'animal'},{w:'ろば',p:'animal',g:'animal'},{w:'らくだ',p:'animal',g:'animal'},
  {w:'いのしし',p:'animal',g:'animal'},{w:'こぶた',p:'animal',g:'animal'},{w:'こいぬ',p:'dog',g:'animal'},
  {w:'こねこ',p:'cat',g:'animal'},{w:'ざりがに',p:'bug',g:'animal'},{w:'ひょう',p:'animal',g:'animal'},
  {w:'ぱんだ',p:'animal',g:'animal'},{w:'やまねこ',p:'cat',g:'animal'},{w:'こうし',p:'animal',g:'animal'},

  /* ── とり ── */
  {w:'とり',p:'bird',g:'bird'},{w:'すずめ',p:'bird',g:'bird'},{w:'はと',p:'bird',g:'bird'},
  {w:'からす',p:'bird',g:'bird'},{w:'つばめ',p:'bird',g:'bird'},{w:'にわとり',p:'bird',g:'bird'},
  {w:'ひよこ',p:'bird',g:'bird'},{w:'つる',p:'bird',g:'bird'},{w:'はくちょう',p:'bird',g:'bird'},
  {w:'たか',p:'bird',g:'bird'},{w:'ふくろう',p:'bird',g:'bird'},{w:'きじ',p:'bird',g:'bird'},
  {w:'あひる',p:'bird',g:'bird'},{w:'かも',p:'bird',g:'bird'},{w:'わし',p:'bird',g:'bird'},
  {w:'きつつき',p:'bird',g:'bird'},{w:'うぐいす',p:'bird',g:'bird'},{w:'ぶんちょう',p:'bird',g:'bird'},
  {w:'くじゃく',p:'bird',g:'bird'},{w:'ぺんぎん',p:'bird',g:'bird'},{w:'ぺりかん',p:'bird',g:'bird'},
  {w:'かもめ',p:'bird',g:'bird'},{w:'めじろ',p:'bird',g:'bird'},{w:'ひばり',p:'bird',g:'bird'},
  {w:'がちょう',p:'bird',g:'bird'},

  /* ── むし ── */
  {w:'むし',p:'bug',g:'bug'},{w:'あり',p:'bug',g:'bug'},{w:'ちょう',p:'bug',g:'bug'},
  {w:'せみ',p:'bug',g:'bug'},{w:'とんぼ',p:'bug',g:'bug'},{w:'ばった',p:'bug',g:'bug'},
  {w:'こおろぎ',p:'bug',g:'bug'},{w:'かまきり',p:'bug',g:'bug'},{w:'かぶとむし',p:'bug',g:'bug'},
  {w:'くわがた',p:'bug',g:'bug'},{w:'てんとうむし',p:'bug',g:'bug'},{w:'ほたる',p:'bug',g:'bug'},
  {w:'はち',p:'bug',g:'bug'},{w:'みつばち',p:'bug',g:'bug'},{w:'けむし',p:'bug',g:'bug'},
  {w:'だんごむし',p:'bug',g:'bug'},{w:'かたつむり',p:'bug',g:'bug'},{w:'こがねむし',p:'bug',g:'bug'},
  {w:'すずむし',p:'bug',g:'bug'},{w:'なめくじ',p:'bug',g:'bug'},{w:'みみず',p:'bug',g:'bug'},
  {w:'あぶ',p:'bug',g:'bug'},{w:'はえ',p:'bug',g:'bug'},{w:'あめんぼ',p:'bug',g:'bug'},
  {w:'げんごろう',p:'bug',g:'bug'},{w:'ぞうむし',p:'bug',g:'bug'},{w:'きりぎりす',p:'bug',g:'bug'},
  {w:'いもむし',p:'bug',g:'bug'},{w:'さなぎ',p:'bug',g:'bug'},

  /* ── うみの いきもの ── */
  {w:'さかな',p:'fish',g:'sea'},{w:'たこ',p:'octopus',g:'sea'},{w:'いか',p:'octopus',g:'sea'},
  {w:'えび',p:'octopus',g:'sea'},{w:'かに',p:'octopus',g:'sea'},{w:'くじら',p:'fish',g:'sea'},
  {w:'めだか',p:'fish',g:'sea'},{w:'きんぎょ',p:'fish',g:'sea'},{w:'まぐろ',p:'fish',g:'sea'},
  {w:'さんま',p:'fish',g:'sea'},{w:'いわし',p:'fish',g:'sea'},{w:'わかめ',p:'leaf',g:'sea'},
  {w:'こんぶ',p:'leaf',g:'sea'},{w:'なまこ',p:'octopus',g:'sea'},{w:'ひとで',p:'star',g:'sea'},
  {w:'くらげ',p:'water',g:'sea'},{w:'かい',p:'octopus',g:'sea'},{w:'やどかり',p:'octopus',g:'sea'},
  {w:'うに',p:'octopus',g:'sea'},{w:'あさり',p:'octopus',g:'sea'},{w:'らっこ',p:'octopus',g:'sea'},
  {w:'あざらし',p:'fish',g:'sea'},{w:'せいうち',p:'animal',g:'sea'},{w:'おっとせい',p:'animal',g:'sea'},
  {w:'うみがめ',p:'fish',g:'sea'},{w:'ひらめ',p:'fish',g:'sea'},{w:'かれい',p:'fish',g:'sea'},
  {w:'ふぐ',p:'fish',g:'sea'},{w:'たい',p:'fish',g:'sea'},{w:'ぶり',p:'fish',g:'sea'},
  {w:'うなぎ',p:'fish',g:'sea'},{w:'どじょう',p:'fish',g:'sea'},{w:'なまず',p:'fish',g:'sea'},
  {w:'ふな',p:'fish',g:'sea'},{w:'こい',p:'fish',g:'sea'},{w:'さんご',p:'fish',g:'sea'},
  {w:'いそぎんちゃく',p:'octopus',g:'sea'},{w:'しじみ',p:'fish',g:'sea'},{w:'はまぐり',p:'fish',g:'sea'},
  {w:'あわび',p:'fish',g:'sea'},{w:'さざえ',p:'fish',g:'sea'},{w:'かつお',p:'fish',g:'sea'},
  {w:'しゃち',p:'fish',g:'sea'},

  /* ── はな・き ── */
  {w:'はな',p:'flower',g:'plant'},{w:'おはな',p:'flower',g:'plant'},{w:'さくら',p:'flower',g:'plant'},
  {w:'ひまわり',p:'flower',g:'plant'},{w:'たんぽぽ',p:'flower',g:'plant'},{w:'あさがお',p:'flower',g:'plant'},
  {w:'すみれ',p:'flower',g:'plant'},{w:'うめ',p:'flower',g:'plant'},{w:'まつ',p:'tree',g:'plant'},
  {w:'たけ',p:'tree',g:'plant'},{w:'もみじ',p:'leaf',g:'plant'},{w:'いちょう',p:'leaf',g:'plant'},
  {w:'わかば',p:'leaf',g:'plant'},{w:'くさ',p:'leaf',g:'plant'},{w:'き',p:'tree',g:'plant'},
  {w:'たね',p:'leaf',g:'plant'},{w:'えだ',p:'tree',g:'plant'},{w:'はっぱ',p:'leaf',g:'plant'},
  {w:'よつば',p:'leaf',g:'plant'},{w:'ほおずき',p:'flower',g:'plant'},{w:'どんぐり',p:'tree',g:'plant'},
  {w:'まつぼっくり',p:'tree',g:'plant'},{w:'つぼみ',p:'flower',g:'plant'},{w:'はなびら',p:'flower',g:'plant'},
  {w:'むぎ',p:'leaf',g:'plant'},{w:'ざっそう',p:'leaf',g:'plant'},{w:'すぎ',p:'tree',g:'plant'},
  {w:'ぶな',p:'tree',g:'plant'},{w:'かえで',p:'leaf',g:'plant'},{w:'つばき',p:'flower',g:'plant'},
  {w:'あじさい',p:'flower',g:'plant'},{w:'ゆり',p:'flower',g:'plant'},{w:'ひなぎく',p:'flower',g:'plant'},
  {w:'れんげ',p:'flower',g:'plant'},{w:'しばふ',p:'leaf',g:'plant'},{w:'なのはな',p:'flower',g:'plant'},
  {w:'へちま',p:'leaf',g:'plant'},{w:'ひょうたん',p:'vegetable',g:'plant'},{w:'ねっこ',p:'tree',g:'plant'},
  {w:'みき',p:'tree',g:'plant'},{w:'つくし',p:'leaf',g:'plant'},{w:'よもぎ',p:'leaf',g:'plant'},
  {w:'ささ',p:'leaf',g:'plant'},{w:'すすき',p:'leaf',g:'plant'},{w:'くき',p:'leaf',g:'plant'},

  /* ── てんき・きせつ ── */
  {w:'はれ',p:'sun',g:'weather'},{w:'あめ',p:'rain',g:'weather'},{w:'くもり',p:'cloud',g:'weather'},
  {w:'くも',p:'cloud',g:'weather'},{w:'ゆき',p:'snow',g:'weather'},{w:'かぜ',p:'cloud',g:'weather'},
  {w:'かみなり',p:'cloud',g:'weather'},{w:'にじ',p:'rainbow',g:'weather'},{w:'つゆ',p:'rain',g:'weather'},
  {w:'こおり',p:'snow',g:'weather'},{w:'しも',p:'snow',g:'weather'},{w:'きり',p:'cloud',g:'weather'},
  {w:'たいふう',p:'cloud',g:'weather'},{w:'はる',p:'flower',g:'weather'},{w:'なつ',p:'sun',g:'weather'},
  {w:'あき',p:'leaf',g:'weather'},{w:'ふゆ',p:'snow',g:'weather'},{w:'ゆうやけ',p:'sun',g:'weather'},
  {w:'あさやけ',p:'sun',g:'weather'},{w:'ゆきだるま',p:'snow',g:'weather'},{w:'こがらし',p:'cloud',g:'weather'},
  {w:'ひざし',p:'sun',g:'weather'},{w:'みぞれ',p:'snow',g:'weather'},{w:'あられ',p:'snow',g:'weather'},
  {w:'ふぶき',p:'snow',g:'weather'},{w:'つらら',p:'snow',g:'weather'},{w:'ゆうだち',p:'rain',g:'weather'},
  {w:'あまぐも',p:'cloud',g:'weather'},

  /* ── しぜん ── */
  {w:'やま',p:'mountain',g:'nature'},{w:'かわ',p:'water',g:'nature'},{w:'うみ',p:'water',g:'nature'},
  {w:'そら',p:'cloud',g:'nature'},{w:'つき',p:'moon',g:'nature'},{w:'ほし',p:'star',g:'nature'},
  {w:'たいよう',p:'sun',g:'nature'},{w:'いし',p:'mountain',g:'nature'},{w:'すな',p:'mountain',g:'nature'},
  {w:'もり',p:'tree',g:'nature'},{w:'はやし',p:'tree',g:'nature'},{w:'のはら',p:'leaf',g:'nature'},
  {w:'たき',p:'water',g:'nature'},{w:'なみ',p:'water',g:'nature'},{w:'みず',p:'water',g:'nature'},
  {w:'ちきゅう',p:'star',g:'nature'},{w:'つち',p:'leaf',g:'nature'},{w:'ひかり',p:'light',g:'nature'},
  {w:'ゆうひ',p:'sun',g:'nature'},{w:'あさひ',p:'sun',g:'nature'},{w:'ふじさん',p:'mountain',g:'nature'},
  {w:'いけ',p:'water',g:'nature'},{w:'たんぼ',p:'leaf',g:'nature'},{w:'はたけ',p:'leaf',g:'nature'},
  {w:'みずうみ',p:'water',g:'nature'},{w:'おか',p:'mountain',g:'nature'},{w:'がけ',p:'mountain',g:'nature'},
  {w:'しま',p:'mountain',g:'nature'},{w:'みずたまり',p:'water',g:'nature'},
  {w:'どうくつ',p:'mountain',g:'nature'},{w:'ぬま',p:'water',g:'nature'},{w:'いずみ',p:'water',g:'nature'},
  {w:'かざん',p:'mountain',g:'nature'},{w:'なぎさ',p:'water',g:'nature'},{w:'きし',p:'water',g:'nature'},
  {w:'どろ',p:'mountain',g:'nature'},{w:'みかづき',p:'moon',g:'nature'},

  /* ── のりもの ── */
  {w:'くるま',p:'car',g:'vehicle'},{w:'でんしゃ',p:'train',g:'vehicle'},{w:'しんかんせん',p:'train',g:'vehicle'},
  {w:'じてんしゃ',p:'car',g:'vehicle'},{w:'ひこうき',p:'plane',g:'vehicle'},{w:'ふね',p:'ship',g:'vehicle'},
  {w:'きしゃ',p:'train',g:'vehicle'},{w:'れっしゃ',p:'train',g:'vehicle'},{w:'ちかてつ',p:'train',g:'vehicle'},
  {w:'じどうしゃ',p:'car',g:'vehicle'},{w:'しょうぼうしゃ',p:'car',g:'vehicle'},
  {w:'きゅうきゅうしゃ',p:'car',g:'vehicle'},{w:'いかだ',p:'ship',g:'vehicle'},{w:'のりもの',p:'car',g:'vehicle'},
  {w:'ぎょせん',p:'ship',g:'vehicle'},{w:'ほかけぶね',p:'ship',g:'vehicle'},
  {w:'ひこうせん',p:'plane',g:'vehicle'},{w:'せんすいかん',p:'ship',g:'vehicle'},{w:'ばす',p:'car',g:'vehicle'},

  /* ── いえ・まち ── */
  {w:'いえ',p:'house',g:'town'},{w:'へや',p:'house',g:'town'},{w:'まど',p:'house',g:'town'},
  {w:'やね',p:'house',g:'town'},{w:'かいだん',p:'house',g:'town'},{w:'げんかん',p:'house',g:'town'},
  {w:'だいどころ',p:'house',g:'town'},{w:'おふろ',p:'water',g:'town'},{w:'にわ',p:'leaf',g:'town'},
  {w:'もん',p:'house',g:'town'},{w:'ゆか',p:'house',g:'town'},{w:'こうえん',p:'tree',g:'town'},
  {w:'おみせ',p:'shop',g:'town'},{w:'びょういん',p:'house',g:'town'},{w:'えき',p:'train',g:'town'},
  {w:'ゆうびんきょく',p:'shop',g:'town'},{w:'こうばん',p:'house',g:'town'},{w:'としょかん',p:'book',g:'town'},
  {w:'こうさてん',p:'car',g:'town'},{w:'しんごう',p:'light',g:'town'},{w:'みち',p:'car',g:'town'},
  {w:'まち',p:'shop',g:'town'},{w:'てら',p:'castle',g:'town'},{w:'じんじゃ',p:'castle',g:'town'},
  {w:'ほんや',p:'shop',g:'town'},{w:'やど',p:'house',g:'town'},{w:'ぎんこう',p:'shop',g:'town'},
  {w:'ぱんや',p:'shop',g:'town'},{w:'やおや',p:'shop',g:'town'},{w:'はなや',p:'shop',g:'town'},
  {w:'やっきょく',p:'shop',g:'town'},{w:'こうじょう',p:'house',g:'town'},{w:'ぼくじょう',p:'house',g:'town'},
  {w:'どうろ',p:'house',g:'town'},{w:'ふみきり',p:'train',g:'town'},{w:'だんち',p:'house',g:'town'},
  {w:'ゆうえんち',p:'castle',g:'town'},{w:'どうぶつえん',p:'animal',g:'town'},{w:'すいぞくかん',p:'fish',g:'town'},
  {w:'はくぶつかん',p:'book',g:'town'},{w:'びじゅつかん',p:'book',g:'town'},{w:'ばすてい',p:'car',g:'town'},
  {w:'ちゅうしゃじょう',p:'car',g:'town'},{w:'しやくしょ',p:'house',g:'town'},{w:'しょうぼうしょ',p:'house',g:'town'},
  {w:'やたい',p:'shop',g:'town'},{w:'ぽすと',p:'house',g:'town'},

  /* ── みの まわりの もの（出題には つかわない なかま） ── */
  {w:'とけい',p:'tool',g:'tool'},{w:'めがね',p:'tool',g:'tool'},{w:'かさ',p:'rain',g:'tool'},
  {w:'かばん',p:'bag',g:'tool'},{w:'ぼうし',p:'cloth',g:'tool'},{w:'くつ',p:'cloth',g:'tool'},
  {w:'はさみ',p:'tool',g:'tool'},{w:'さら',p:'tool',g:'tool'},{w:'はし',p:'tool',g:'tool'},
  {w:'せっけん',p:'tool',g:'tool'},{w:'ちゃわん',p:'tool',g:'tool'},{w:'やかん',p:'drink',g:'tool'},
  {w:'なべ',p:'tool',g:'tool'},{w:'ほうき',p:'tool',g:'tool'},{w:'ぞうきん',p:'tool',g:'tool'},
  {w:'ばけつ',p:'tool',g:'tool'},{w:'かがみ',p:'tool',g:'tool'},{w:'まくら',p:'cloth',g:'tool'},
  {w:'ふとん',p:'cloth',g:'tool'},{w:'たんす',p:'tool',g:'tool'},{w:'でんわ',p:'tool',g:'tool'},
  {w:'でんき',p:'light',g:'tool'},{w:'れいぞうこ',p:'snow',g:'tool'},{w:'けいと',p:'tool',g:'tool'},
  {w:'なわ',p:'tool',g:'tool'},{w:'のこぎり',p:'tool',g:'tool'},{w:'うちわ',p:'tool',g:'tool'},
  {w:'ろうそく',p:'light',g:'tool'},{w:'てがみ',p:'book',g:'tool'},{w:'かぎ',p:'tool',g:'tool'},
  {w:'おかね',p:'tool',g:'tool'},{w:'さいふ',p:'bag',g:'tool'},{w:'きって',p:'tool',g:'tool'},
  {w:'きっぷ',p:'train',g:'tool'},{w:'ぬの',p:'cloth',g:'tool'},{w:'ざぶとん',p:'cloth',g:'tool'},
  {w:'ふろしき',p:'cloth',g:'tool'},{w:'したぎ',p:'cloth',g:'tool'},{w:'ぐんて',p:'cloth',g:'tool'},
  {w:'かぐ',p:'tool',g:'tool'},{w:'はぶらし',p:'tool',g:'tool'},{w:'ばんそうこう',p:'tool',g:'tool'},
  {w:'でんち',p:'light',g:'tool'},{w:'でんとう',p:'light',g:'tool'},{w:'すず',p:'tool',g:'tool'},
  {w:'ちりとり',p:'tool',g:'tool'},{w:'じょうろ',p:'water',g:'tool'},{w:'かびん',p:'flower',g:'tool'},
  {w:'きゅうす',p:'drink',g:'tool'},{w:'ざる',p:'tool',g:'tool'},{w:'おぼん',p:'tool',g:'tool'},
  {w:'はけ',p:'pencil',g:'tool'},{w:'くぎ',p:'tool',g:'tool'},{w:'かなづち',p:'tool',g:'tool'},
  {w:'とだな',p:'house',g:'tool'},{w:'ひきだし',p:'house',g:'tool'},{w:'ほうちょう',p:'tool',g:'tool'},
  {w:'まないた',p:'tool',g:'tool'},{w:'しゃもじ',p:'tool',g:'tool'},{w:'おたま',p:'tool',g:'tool'},
  {w:'かんづめ',p:'rice',g:'tool'},{w:'こづつみ',p:'bag',g:'tool'},{w:'はんこ',p:'tool',g:'tool'},
  {w:'せんぷうき',p:'tool',g:'tool'},{w:'そうじき',p:'tool',g:'tool'},{w:'せんたくき',p:'tool',g:'tool'},
  {w:'すいはんき',p:'rice',g:'tool'},{w:'でんしれんじ',p:'tool',g:'tool'},{w:'ぼうえんきょう',p:'tool',g:'tool'},
  {w:'じしゃく',p:'tool',g:'tool'},{w:'こっぷ',p:'tool',g:'tool'},{w:'なぷきん',p:'tool',g:'tool'},
  {w:'ぺんき',p:'tool',g:'tool'},{w:'ものおき',p:'house',g:'tool'},

  /* ── きるもの ── */
  {w:'ようふく',p:'cloth',g:'cloth'},{w:'くつした',p:'cloth',g:'cloth'},{w:'てぶくろ',p:'cloth',g:'cloth'},
  {w:'ゆかた',p:'cloth',g:'cloth'},{w:'きもの',p:'cloth',g:'cloth'},{w:'うわぎ',p:'cloth',g:'cloth'},
  {w:'ながぐつ',p:'cloth',g:'cloth'},{w:'まえかけ',p:'cloth',g:'cloth'},{w:'はだぎ',p:'cloth',g:'cloth'},
  {w:'ずぼん',p:'cloth',g:'cloth'},{w:'ぱじゃま',p:'cloth',g:'cloth'},{w:'えぷろん',p:'cloth',g:'cloth'},
  {w:'ぱんつ',p:'cloth',g:'cloth'},{w:'すりっぱ',p:'cloth',g:'cloth'},{w:'ぽけっと',p:'cloth',g:'cloth'},
  {w:'はんかち',p:'cloth',g:'cloth'},{w:'ねまき',p:'cloth',g:'cloth'},{w:'くつひも',p:'cloth',g:'cloth'},
  {w:'ぼたん',p:'cloth',g:'cloth'},{w:'えりまき',p:'cloth',g:'cloth'},{w:'ずきん',p:'cloth',g:'cloth'},
  {w:'たび',p:'cloth',g:'cloth'},{w:'げた',p:'cloth',g:'cloth'},{w:'ぞうり',p:'cloth',g:'cloth'},
  {w:'うわばき',p:'cloth',g:'cloth'},{w:'みずぎ',p:'cloth',g:'cloth'},{w:'きぬ',p:'cloth',g:'cloth'},

  /* ── あそび ── */
  {w:'なわとび',p:'ball',g:'play'},{w:'ぶらんこ',p:'ball',g:'play'},{w:'すべりだい',p:'ball',g:'play'},
  {w:'てつぼう',p:'ball',g:'play'},{w:'すなば',p:'mountain',g:'play'},{w:'かくれんぼ',p:'person',g:'play'},
  {w:'おにごっこ',p:'person',g:'play'},{w:'かるた',p:'book',g:'play'},{w:'つみき',p:'tool',g:'play'},
  {w:'こま',p:'tool',g:'play'},{w:'たこあげ',p:'tool',g:'play'},{w:'けんだま',p:'ball',g:'play'},
  {w:'おりがみ',p:'tool',g:'play'},{w:'ふうせん',p:'ball',g:'play'},{w:'しゃぼんだま',p:'ball',g:'play'},
  {w:'ぬりえ',p:'pencil',g:'play'},{w:'ぬいぐるみ',p:'rabbit',g:'play'},{w:'おもちゃ',p:'ball',g:'play'},
  {w:'うた',p:'music',g:'play'},{w:'おどり',p:'music',g:'play'},{w:'そり',p:'snow',g:'play'},
  {w:'すもう',p:'person',g:'play'},{w:'さんぽ',p:'person',g:'play'},{w:'めいろ',p:'book',g:'play'},
  {w:'もくば',p:'tool',g:'play'},{w:'ねんど',p:'tool',g:'play'},{w:'おに',p:'person',g:'play'},
  {w:'えいが',p:'tool',g:'play'},{w:'らくがき',p:'pencil',g:'play'},{w:'ぴあの',p:'music',g:'play'},
  {w:'らっぱ',p:'music',g:'play'},{w:'たいこ',p:'music',g:'play'},{w:'ふえ',p:'music',g:'play'},
  {w:'すごろく',p:'book',g:'play'},{w:'おてだま',p:'ball',g:'play'},{w:'あやとり',p:'tool',g:'play'},
  {w:'かけっこ',p:'person',g:'play'},{w:'かざぐるま',p:'shape',g:'play'},{w:'じゃんけん',p:'person',g:'play'},
  {w:'なぞなぞ',p:'book',g:'play'},{w:'ぜんまい',p:'tool',g:'play'},{w:'ままごと',p:'house',g:'play'},
  {w:'どろだんご',p:'shape',g:'play'},{w:'やきゅう',p:'ball',g:'play'},{w:'すいえい',p:'water',g:'play'},
  {w:'つなひき',p:'person',g:'play'},{w:'たまいれ',p:'ball',g:'play'},{w:'ぼうけん',p:'mountain',g:'play'},
  {w:'かみひこうき',p:'plane',g:'play'},

  /* ── うごきの ことば ── */
  {w:'はしる',p:'person',g:'verb'},{w:'あるく',p:'person',g:'verb'},{w:'とぶ',p:'bird',g:'verb'},
  {w:'およぐ',p:'water',g:'verb'},{w:'たべる',p:'rice',g:'verb'},{w:'のむ',p:'drink',g:'verb'},
  {w:'ねる',p:'moon',g:'verb'},{w:'おきる',p:'sun',g:'verb'},{w:'よむ',p:'book',g:'verb'},
  {w:'かく',p:'pencil',g:'verb'},{w:'きく',p:'music',g:'verb'},{w:'みる',p:'person',g:'verb'},
  {w:'いう',p:'person',g:'verb'},{w:'はなす',p:'person',g:'verb'},{w:'わらう',p:'heart',g:'verb'},
  {w:'なく',p:'heart',g:'verb'},{w:'もつ',p:'person',g:'verb'},{w:'なげる',p:'ball',g:'verb'},
  {w:'すわる',p:'person',g:'verb'},{w:'たつ',p:'person',g:'verb'},{w:'あそぶ',p:'ball',g:'verb'},
  {w:'あらう',p:'water',g:'verb'},{w:'ぬぐ',p:'cloth',g:'verb'},{w:'とる',p:'person',g:'verb'},
  {w:'うたう',p:'music',g:'verb'},{w:'おどる',p:'music',g:'verb'},{w:'さがす',p:'person',g:'verb'},
  {w:'ならべる',p:'shape',g:'verb'},{w:'つくる',p:'tool',g:'verb'},{w:'いく',p:'person',g:'verb'},
  {w:'のる',p:'car',g:'verb'},{w:'おりる',p:'car',g:'verb'},{w:'はいる',p:'house',g:'verb'},
  {w:'でる',p:'house',g:'verb'},{w:'あける',p:'house',g:'verb'},{w:'しめる',p:'house',g:'verb'},
  {w:'おす',p:'person',g:'verb'},{w:'ひく',p:'person',g:'verb'},{w:'はねる',p:'person',g:'verb'},
  {w:'ころぶ',p:'person',g:'verb'},{w:'のぼる',p:'person',g:'verb'},{w:'うける',p:'person',g:'verb'},
  {w:'ける',p:'person',g:'verb'},{w:'つかむ',p:'person',g:'verb'},{w:'はこぶ',p:'person',g:'verb'},
  {w:'ならぶ',p:'person',g:'verb'},{w:'まぜる',p:'person',g:'verb'},{w:'かぶる',p:'person',g:'verb'},
  {w:'ぬる',p:'person',g:'verb'},{w:'ぬく',p:'person',g:'verb'},{w:'ぬれる',p:'person',g:'verb'},
  {w:'しらべる',p:'book',g:'verb'},{w:'くらべる',p:'person',g:'verb'},{w:'かぞえる',p:'book',g:'verb'},
  {w:'おぼえる',p:'heart',g:'verb'},{w:'できる',p:'person',g:'verb'},{w:'なでる',p:'person',g:'verb'},
  {w:'へる',p:'person',g:'verb'},{w:'へらす',p:'person',g:'verb'},{w:'へこむ',p:'person',g:'verb'},
  {w:'まげる',p:'person',g:'verb'},{w:'つづく',p:'person',g:'verb'},{w:'つづける',p:'person',g:'verb'},
  {w:'きづく',p:'heart',g:'verb'},{w:'ちかづく',p:'person',g:'verb'},{w:'かたづける',p:'house',g:'verb'},
  {w:'ちぢむ',p:'cloth',g:'verb'},{w:'ちぢめる',p:'cloth',g:'verb'},{w:'ちぢれる',p:'cloth',g:'verb'},
  {w:'そそぐ',p:'water',g:'verb'},{w:'ちぢこまる',p:'person',g:'verb'},{w:'みがく',p:'person',g:'verb'},
  {w:'たたく',p:'person',g:'verb'},{w:'ふく',p:'person',g:'verb'},{w:'ほる',p:'person',g:'verb'},
  {w:'つむ',p:'person',g:'verb'},{w:'はく',p:'person',g:'verb'},{w:'まわる',p:'person',g:'verb'},
  {w:'とまる',p:'person',g:'verb'},{w:'はじまる',p:'person',g:'verb'},{w:'おわる',p:'person',g:'verb'},
  {w:'ひろう',p:'person',g:'verb'},{w:'すてる',p:'person',g:'verb'},{w:'わける',p:'person',g:'verb'},
  {w:'あつめる',p:'person',g:'verb'},{w:'くばる',p:'person',g:'verb'},{w:'むすぶ',p:'person',g:'verb'},
  {w:'ほどく',p:'person',g:'verb'},{w:'のばす',p:'person',g:'verb'},{w:'ちぎる',p:'person',g:'verb'},
  {w:'そだてる',p:'leaf',g:'verb'},{w:'しゃがむ',p:'person',g:'verb'},{w:'ゆれる',p:'person',g:'verb'},
  {w:'こぐ',p:'person',g:'verb'},{w:'がんばる',p:'heart',g:'verb'},

  /* ── ようすの ことば ── */
  {w:'おおきい',p:'shape',g:'adj'},{w:'ちいさい',p:'shape',g:'adj'},{w:'たかい',p:'mountain',g:'adj'},
  {w:'ひくい',p:'shape',g:'adj'},{w:'ながい',p:'shape',g:'adj'},{w:'みじかい',p:'shape',g:'adj'},
  {w:'あつい',p:'sun',g:'adj'},{w:'さむい',p:'snow',g:'adj'},{w:'つめたい',p:'snow',g:'adj'},
  {w:'あたたかい',p:'sun',g:'adj'},{w:'あまい',p:'sweet',g:'adj'},{w:'からい',p:'vegetable',g:'adj'},
  {w:'すっぱい',p:'fruit',g:'adj'},{w:'おいしい',p:'rice',g:'adj'},{w:'はやい',p:'car',g:'adj'},
  {w:'おそい',p:'ship',g:'adj'},{w:'あかるい',p:'light',g:'adj'},{w:'くらい',p:'moon',g:'adj'},
  {w:'おもい',p:'shape',g:'adj'},{w:'かるい',p:'cloud',g:'adj'},{w:'ひろい',p:'shape',g:'adj'},
  {w:'せまい',p:'shape',g:'adj'},{w:'つよい',p:'person',g:'adj'},{w:'よわい',p:'person',g:'adj'},
  {w:'おおい',p:'shape',g:'adj'},{w:'すくない',p:'shape',g:'adj'},{w:'あたらしい',p:'star',g:'adj'},
  {w:'ふるい',p:'castle',g:'adj'},{w:'きれい',p:'flower',g:'adj'},{w:'まるい',p:'shape',g:'adj'},
  {w:'やわらかい',p:'cloth',g:'adj'},{w:'かたい',p:'mountain',g:'adj'},{w:'あかい',p:'heart',g:'adj'},
  {w:'あおい',p:'water',g:'adj'},{w:'しろい',p:'snow',g:'adj'},{w:'くろい',p:'shape',g:'adj'},
  {w:'ぴかぴか',p:'star',g:'adj'},{w:'ぽかぽか',p:'sun',g:'adj'},{w:'ぱちぱち',p:'light',g:'adj'},
  {w:'ぷかぷか',p:'cloud',g:'adj'},{w:'ぐるぐる',p:'shape',g:'adj'},{w:'ぐらぐら',p:'shape',g:'adj'},
  {w:'ざあざあ',p:'rain',g:'adj'},{w:'そよそよ',p:'cloud',g:'adj'},{w:'ふわふわ',p:'cloud',g:'adj'},
  {w:'つるつる',p:'shape',g:'adj'},{w:'ざらざら',p:'shape',g:'adj'},{w:'べたべた',p:'shape',g:'adj'},
  {w:'ぬるぬる',p:'shape',g:'adj'},{w:'ぼこぼこ',p:'shape',g:'adj'},{w:'でこぼこ',p:'shape',g:'adj'},
  {w:'ぱらぱら',p:'rain',g:'adj'},{w:'ぽつぽつ',p:'rain',g:'adj'},{w:'ぴょんぴょん',p:'rabbit',g:'adj'},
  {w:'ぐっすり',p:'moon',g:'adj'},{w:'ぴったり',p:'shape',g:'adj'},{w:'まっすぐ',p:'shape',g:'adj'},
  {w:'じょうず',p:'person',g:'adj'},{w:'へた',p:'person',g:'adj'},{w:'しずか',p:'heart',g:'adj'},
  {w:'にぎやか',p:'heart',g:'adj'},{w:'ぜんぶ',p:'shape',g:'adj'},{w:'はんぶん',p:'shape',g:'adj'},
  {w:'きらきら',p:'star',g:'adj'},{w:'ふかふか',p:'cloud',g:'adj'},{w:'からから',p:'water',g:'adj'},
  {w:'びしょびしょ',p:'rain',g:'adj'},{w:'ざぶざぶ',p:'water',g:'adj'},{w:'どんどん',p:'light',g:'adj'},
  {w:'そっと',p:'heart',g:'adj'},{w:'ゆっくり',p:'heart',g:'adj'},{w:'すばやい',p:'person',g:'adj'},
  {w:'ふとい',p:'shape',g:'adj'},{w:'ほそい',p:'shape',g:'adj'},{w:'あさい',p:'water',g:'adj'},
  {w:'ふかい',p:'water',g:'adj'},{w:'ちかい',p:'shape',g:'adj'},{w:'とおい',p:'shape',g:'adj'},
  {w:'おなじ',p:'shape',g:'adj'},{w:'ぬるい',p:'water',g:'adj'},{w:'すずしい',p:'cloud',g:'adj'},
  {w:'きたない',p:'shape',g:'adj'},{w:'うつくしい',p:'flower',g:'adj'},{w:'めずらしい',p:'star',g:'adj'},
  {w:'ぱくぱく',p:'rice',g:'adj'},{w:'ぺらぺら',p:'book',g:'adj'},{w:'ぺたぺた',p:'shape',g:'adj'},
  {w:'ぺろぺろ',p:'sweet',g:'adj'},{w:'ぷりぷり',p:'fish',g:'adj'},{w:'ぷちぷち',p:'fruit',g:'adj'},
  {w:'ぱりぱり',p:'leaf',g:'adj'},{w:'ぽろぽろ',p:'rain',g:'adj'},{w:'ぽんぽん',p:'ball',g:'adj'},
  {w:'ぴりぴり',p:'heart',g:'adj'},{w:'ぴよぴよ',p:'bird',g:'adj'},{w:'ぴくぴく',p:'person',g:'adj'},
  {w:'ぷらぷら',p:'person',g:'adj'},{w:'ぽたぽた',p:'water',g:'adj'},{w:'ぺちゃんこ',p:'shape',g:'adj'},
  {w:'ぬくもり',p:'heart',g:'adj'},

  /* ── きもちの ことば ── */
  {w:'うれしい',p:'heart',g:'feel'},{w:'かなしい',p:'heart',g:'feel'},{w:'たのしい',p:'heart',g:'feel'},
  {w:'さびしい',p:'heart',g:'feel'},{w:'ねむい',p:'moon',g:'feel'},{w:'いたい',p:'heart',g:'feel'},
  {w:'こわい',p:'heart',g:'feel'},{w:'はずかしい',p:'heart',g:'feel'},{w:'やさしい',p:'heart',g:'feel'},
  {w:'しんぱい',p:'heart',g:'feel'},{w:'あんしん',p:'heart',g:'feel'},{w:'びっくり',p:'heart',g:'feel'},
  {w:'どきどき',p:'heart',g:'feel'},{w:'わくわく',p:'heart',g:'feel'},{w:'にこにこ',p:'heart',g:'feel'},
  {w:'しょんぼり',p:'heart',g:'feel'},{w:'おこる',p:'heart',g:'feel'},{w:'くやしい',p:'heart',g:'feel'},
  {w:'すき',p:'heart',g:'feel'},{w:'きらい',p:'heart',g:'feel'},{w:'げんき',p:'heart',g:'feel'},
  {w:'へいき',p:'heart',g:'feel'},{w:'ぷんぷん',p:'heart',g:'feel'},{w:'ぺこぺこ',p:'heart',g:'feel'},
  {w:'ぞくぞく',p:'heart',g:'feel'},{w:'ほっと',p:'heart',g:'feel'},{w:'うきうき',p:'heart',g:'feel'},
  {w:'しあわせ',p:'heart',g:'feel'},{w:'はらはら',p:'heart',g:'feel'},{w:'いらいら',p:'heart',g:'feel'},
  {w:'がっかり',p:'heart',g:'feel'},{w:'ためいき',p:'heart',g:'feel'},

  /* ── いろ ── */
  {w:'あか',p:'shape',g:'color'},{w:'あお',p:'shape',g:'color'},{w:'きいろ',p:'shape',g:'color'},
  {w:'しろ',p:'shape',g:'color'},{w:'くろ',p:'shape',g:'color'},{w:'みどり',p:'shape',g:'color'},
  {w:'ちゃいろ',p:'shape',g:'color'},{w:'むらさき',p:'shape',g:'color'},{w:'ももいろ',p:'shape',g:'color'},
  {w:'みずいろ',p:'shape',g:'color'},{w:'だいだいいろ',p:'shape',g:'color'},{w:'はいいろ',p:'shape',g:'color'},
  {w:'きんいろ',p:'shape',g:'color'},{w:'ぎんいろ',p:'shape',g:'color'},{w:'るりいろ',p:'shape',g:'color'},
  {w:'ぴんく',p:'shape',g:'color'},{w:'こんいろ',p:'shape',g:'color'},{w:'そらいろ',p:'shape',g:'color'},
  {w:'きみどり',p:'shape',g:'color'},{w:'こげちゃ',p:'shape',g:'color'},{w:'しゅいろ',p:'shape',g:'color'},
  {w:'べにいろ',p:'shape',g:'color'},{w:'ぶどういろ',p:'shape',g:'color'},{w:'ねずみいろ',p:'shape',g:'color'},
  {w:'あいいろ',p:'shape',g:'color'},{w:'にじいろ',p:'rainbow',g:'color'},

  /* ── とき ── */
  {w:'あさ',p:'sun',g:'time'},{w:'ひる',p:'sun',g:'time'},{w:'よる',p:'moon',g:'time'},
  {w:'ゆうがた',p:'sun',g:'time'},{w:'ひるま',p:'sun',g:'time'},{w:'きょう',p:'sun',g:'time'},
  {w:'あした',p:'sun',g:'time'},{w:'きのう',p:'moon',g:'time'},{w:'あさって',p:'sun',g:'time'},
  {w:'まいにち',p:'sun',g:'time'},{w:'いま',p:'tool',g:'time'},{w:'さっき',p:'tool',g:'time'},
  {w:'むかし',p:'book',g:'time'},{w:'ことし',p:'sun',g:'time'},{w:'やすみ',p:'moon',g:'time'},
  {w:'たんじょうび',p:'sweet',g:'time'},{w:'ゆうべ',p:'moon',g:'time'},{w:'ひるやすみ',p:'sun',g:'time'},
  {w:'なつやすみ',p:'sun',g:'time'},{w:'ふゆやすみ',p:'snow',g:'time'},{w:'はるやすみ',p:'flower',g:'time'},
  {w:'げつようび',p:'moon',g:'time'},{w:'かようび',p:'star',g:'time'},{w:'すいようび',p:'water',g:'time'},
  {w:'もくようび',p:'tree',g:'time'},{w:'きんようび',p:'sun',g:'time'},{w:'どようび',p:'star',g:'time'},
  {w:'にちようび',p:'sun',g:'time'},{w:'じかん',p:'tool',g:'time'},{w:'よあけ',p:'sun',g:'time'},
  {w:'らいねん',p:'star',g:'time'},{w:'きょねん',p:'star',g:'time'},{w:'おととい',p:'star',g:'time'},
  {w:'ずっと',p:'star',g:'time'},{w:'すぐ',p:'star',g:'time'},{w:'とき',p:'tool',g:'time'},

  /* ── ばしょ・むき ── */
  {w:'うえ',p:'shape',g:'place'},{w:'した',p:'shape',g:'place'},{w:'なか',p:'shape',g:'place'},
  {w:'そと',p:'shape',g:'place'},{w:'まえ',p:'shape',g:'place'},{w:'うしろ',p:'shape',g:'place'},
  {w:'みぎ',p:'shape',g:'place'},{w:'ひだり',p:'shape',g:'place'},{w:'となり',p:'shape',g:'place'},
  {w:'よこ',p:'shape',g:'place'},{w:'ちかく',p:'shape',g:'place'},{w:'とおく',p:'shape',g:'place'},
  {w:'あいだ',p:'shape',g:'place'},{w:'まわり',p:'shape',g:'place'},{w:'ここ',p:'shape',g:'place'},
  {w:'むこう',p:'shape',g:'place'},{w:'てまえ',p:'shape',g:'place'},{w:'おく',p:'shape',g:'place'},
  {w:'かど',p:'shape',g:'place'},{w:'すみ',p:'shape',g:'place'},{w:'うらがわ',p:'shape',g:'place'},
  {w:'ななめ',p:'shape',g:'place'},{w:'まんなか',p:'shape',g:'place'},{w:'ひがし',p:'sun',g:'place'},
  {w:'にし',p:'sun',g:'place'},{w:'みなみ',p:'sun',g:'place'},{w:'きた',p:'sun',g:'place'},
  {w:'ちかみち',p:'shape',g:'place'},

  /* ── あいさつ ── */
  {w:'おはよう',p:'sun',g:'aisatsu'},{w:'こんにちは',p:'person',g:'aisatsu'},
  {w:'こんばんは',p:'moon',g:'aisatsu'},{w:'さようなら',p:'person',g:'aisatsu'},
  {w:'ありがとう',p:'heart',g:'aisatsu'},{w:'ごめんなさい',p:'heart',g:'aisatsu'},
  {w:'いただきます',p:'rice',g:'aisatsu'},{w:'ごちそうさま',p:'rice',g:'aisatsu'},
  {w:'おやすみなさい',p:'moon',g:'aisatsu'},{w:'いってきます',p:'house',g:'aisatsu'},
  {w:'ただいま',p:'house',g:'aisatsu'},{w:'おかえり',p:'house',g:'aisatsu'},
  {w:'はじめまして',p:'person',g:'aisatsu'},{w:'おめでとう',p:'heart',g:'aisatsu'},
  {w:'どういたしまして',p:'heart',g:'aisatsu'},{w:'いってらっしゃい',p:'heart',g:'aisatsu'},
  {w:'ごめんね',p:'heart',g:'aisatsu'},{w:'しつれいします',p:'heart',g:'aisatsu'},
  {w:'よろしく',p:'heart',g:'aisatsu'},{w:'おじゃまします',p:'heart',g:'aisatsu'},
  {w:'がんばって',p:'heart',g:'aisatsu'},{w:'おつかれさま',p:'heart',g:'aisatsu'},
  {w:'ばいばい',p:'heart',g:'aisatsu'},

  /* ── そのほか（出題には つかわないが、しりとりや 読みで つかう） ── */
  {w:'けむり',p:'cloud',g:'other'},{w:'けが',p:'heart',g:'other'},{w:'こころ',p:'heart',g:'other'},
  {w:'せかい',p:'star',g:'other'},{w:'せわ',p:'heart',g:'other'},{w:'ちから',p:'person',g:'other'},
  {w:'つばさ',p:'bird',g:'other'},{w:'てつ',p:'tool',g:'other'},{w:'にほん',p:'mountain',g:'other'},
  {w:'ひみつ',p:'heart',g:'other'},{w:'へいわ',p:'heart',g:'other'},{w:'ゆめ',p:'moon',g:'other'},
  {w:'るすばん',p:'house',g:'other'},{w:'れんしゅう',p:'pencil',g:'other'},{w:'わらい',p:'heart',g:'other'},
  {w:'わすれもの',p:'bag',g:'other'},{w:'めがみ',p:'person',g:'other'},{w:'りゅう',p:'animal',g:'other'},
  {w:'ことば',p:'book',g:'other'},{w:'なまえ',p:'pencil',g:'other'},{w:'こえ',p:'music',g:'other'},
  {w:'おと',p:'music',g:'other'},{w:'ゆげ',p:'cloud',g:'other'},{w:'かげ',p:'sun',g:'other'},
  {w:'なぞ',p:'book',g:'other'},{w:'みぞ',p:'water',g:'other'},{w:'ぜろ',p:'shape',g:'other'},
  {w:'ぜんいん',p:'person',g:'other'},{w:'かぜぐすり',p:'tool',g:'other'},{w:'ぜっけん',p:'cloth',g:'other'},
  {w:'はなぢ',p:'person',g:'other'},{w:'ひづめ',p:'animal',g:'other'},{w:'こづかい',p:'shop',g:'other'},
  {w:'つづき',p:'book',g:'other'},{w:'ぬいもの',p:'cloth',g:'other'},{w:'へんじ',p:'person',g:'other'},
  {w:'しるし',p:'shape',g:'other'},{w:'かたち',p:'shape',g:'other'},{w:'におい',p:'flower',g:'other'},
  {w:'あじ',p:'rice',g:'other'},{w:'おんど',p:'sun',g:'other'},{w:'ばんごう',p:'book',g:'other'},
];

/* カタカナの ことば。
   ちいさい ァィゥェォ は 1年生の 学習はんいの 外で、拍の かぞえかたも
   むずかしくなるので つかわない（フォーク・ソファ など）。 */
const WORD_BANK_KATA = [
  /* ── がっこう ── */
  {w:'プール',p:'water',g:'school'},{w:'ロッカー',p:'school',g:'school'},{w:'チョーク',p:'pencil',g:'school'},
  {w:'グラウンド',p:'school',g:'school'},{w:'クラス',p:'school',g:'school'},{w:'テスト',p:'book',g:'school'},
  {w:'プリント',p:'book',g:'school'},{w:'チャイム',p:'music',g:'school'},{w:'マラソン',p:'ball',g:'school'},
  {w:'リレー',p:'ball',g:'school'},{w:'ドッジボール',p:'ball',g:'school'},{w:'キャンプ',p:'mountain',g:'school'},
  {w:'ハイキング',p:'mountain',g:'school'},{w:'カレンダー',p:'book',g:'school'},
  {w:'タイマー',p:'tool',g:'school'},{w:'スピーカー',p:'music',g:'school'},{w:'マイク',p:'music',g:'school'},
  {w:'ホームルーム',p:'school',g:'school'},{w:'ランチ',p:'rice',g:'school'},{w:'バザー',p:'shop',g:'school'},
  {w:'ゲタバコ',p:'school',g:'school'},

  /* ── べんきょうの どうぐ ── */
  {w:'ノート',p:'book',g:'study'},{w:'クレヨン',p:'pencil',g:'study'},{w:'ランドセル',p:'bag',g:'study'},
  {w:'ハサミ',p:'tool',g:'study'},{w:'コンパス',p:'pencil',g:'study'},{w:'ホッチキス',p:'tool',g:'study'},
  {w:'セロテープ',p:'tool',g:'study'},{w:'クリップ',p:'tool',g:'study'},{w:'ボールペン',p:'pencil',g:'study'},
  {w:'マーカー',p:'pencil',g:'study'},{w:'マジック',p:'pencil',g:'study'},{w:'シール',p:'star',g:'study'},
  {w:'カード',p:'book',g:'study'},{w:'スケッチブック',p:'book',g:'study'},{w:'カッター',p:'tool',g:'study'},
  {w:'テープ',p:'tool',g:'study'},{w:'ケシゴム',p:'pencil',g:'study'},{w:'リコーダー',p:'music',g:'study'},
  {w:'パレット',p:'pencil',g:'study'},{w:'メモ',p:'book',g:'study'},{w:'スタンプ',p:'tool',g:'study'},
  {w:'ペン',p:'pencil',g:'study'},

  /* ── たべもの ── */
  {w:'パン',p:'rice',g:'food'},{w:'カレー',p:'rice',g:'food'},{w:'ジュース',p:'drink',g:'food'},
  {w:'ミルク',p:'drink',g:'food'},{w:'チーズ',p:'rice',g:'food'},{w:'バター',p:'rice',g:'food'},
  {w:'ケーキ',p:'sweet',g:'food'},{w:'プリン',p:'sweet',g:'food'},{w:'アイス',p:'sweet',g:'food'},
  {w:'チョコ',p:'sweet',g:'food'},{w:'ドーナツ',p:'sweet',g:'food'},{w:'ゼリー',p:'sweet',g:'food'},
  {w:'ラーメン',p:'rice',g:'food'},{w:'スープ',p:'drink',g:'food'},{w:'サラダ',p:'vegetable',g:'food'},
  {w:'オムレツ',p:'rice',g:'food'},{w:'ハンバーグ',p:'rice',g:'food'},{w:'ピザ',p:'rice',g:'food'},
  {w:'コーヒー',p:'drink',g:'food'},{w:'ジャム',p:'sweet',g:'food'},{w:'ヨーグルト',p:'sweet',g:'food'},
  {w:'ソース',p:'rice',g:'food'},{w:'ソーセージ',p:'rice',g:'food'},{w:'パスタ',p:'rice',g:'food'},
  {w:'グラタン',p:'rice',g:'food'},{w:'シチュー',p:'rice',g:'food'},{w:'ハンバーガー',p:'rice',g:'food'},
  {w:'サンドイッチ',p:'rice',g:'food'},{w:'ホットケーキ',p:'sweet',g:'food'},{w:'クッキー',p:'sweet',g:'food'},
  {w:'ビスケット',p:'sweet',g:'food'},{w:'キャラメル',p:'sweet',g:'food'},{w:'ガム',p:'sweet',g:'food'},
  {w:'アイスクリーム',p:'sweet',g:'food'},{w:'ソフトクリーム',p:'sweet',g:'food'},
  {w:'ポテト',p:'vegetable',g:'food'},{w:'コロッケ',p:'rice',g:'food'},{w:'ハム',p:'rice',g:'food'},
  {w:'ベーコン',p:'rice',g:'food'},{w:'ウインナー',p:'rice',g:'food'},{w:'ライス',p:'rice',g:'food'},
  {w:'ワッフル',p:'sweet',g:'food'},{w:'クレープ',p:'sweet',g:'food'},{w:'マカロニ',p:'rice',g:'food'},
  {w:'ピラフ',p:'rice',g:'food'},{w:'オムライス',p:'rice',g:'food'},{w:'チャーハン',p:'rice',g:'food'},
  {w:'ギョーザ',p:'rice',g:'food'},{w:'カステラ',p:'sweet',g:'food'},{w:'ポップコーン',p:'sweet',g:'food'},
  {w:'マシュマロ',p:'sweet',g:'food'},{w:'チョコレート',p:'sweet',g:'food'},{w:'ケチャップ',p:'drink',g:'food'},
  {w:'マヨネーズ',p:'drink',g:'food'},{w:'ミートソース',p:'rice',g:'food'},{w:'ミートボール',p:'rice',g:'food'},
  {w:'ナポリタン',p:'rice',g:'food'},{w:'シュークリーム',p:'sweet',g:'food'},{w:'ヌードル',p:'rice',g:'food'},
  {w:'スナック',p:'sweet',g:'food'},{w:'トースト',p:'rice',g:'food'},{w:'ホットドッグ',p:'rice',g:'food'},
  {w:'タルト',p:'sweet',g:'food'},{w:'ババロア',p:'sweet',g:'food'},{w:'ココア',p:'drink',g:'food'},
  {w:'ソーダ',p:'drink',g:'food'},{w:'サイダー',p:'drink',g:'food'},{w:'ラムネ',p:'drink',g:'food'},
  {w:'ムギチャ',p:'drink',g:'food'},{w:'ゼリービーンズ',p:'sweet',g:'food'},{w:'ヨーカン',p:'sweet',g:'food'},
  {w:'オヤツ',p:'sweet',g:'food'},{w:'ノリ',p:'rice',g:'food'},{w:'ノリマキ',p:'rice',g:'food'},
  {w:'ゼンザイ',p:'sweet',g:'food'},{w:'ゼラチン',p:'sweet',g:'food'},{w:'デザート',p:'sweet',g:'food'},
  {w:'ゲンマイ',p:'rice',g:'food'},{w:'ゾウニ',p:'rice',g:'food'},{w:'デコレーション',p:'sweet',g:'food'},

  /* ── やさい・くだもの ── */
  {w:'モモ',p:'fruit',g:'yasai'},{w:'トマト',p:'vegetable',g:'yasai'},{w:'キャベツ',p:'vegetable',g:'yasai'},
  {w:'ピーマン',p:'vegetable',g:'yasai'},{w:'レモン',p:'fruit',g:'yasai'},{w:'メロン',p:'fruit',g:'yasai'},
  {w:'バナナ',p:'fruit',g:'yasai'},{w:'オレンジ',p:'fruit',g:'yasai'},{w:'キウイ',p:'fruit',g:'yasai'},
  {w:'ニンジン',p:'vegetable',g:'yasai'},{w:'ダイコン',p:'vegetable',g:'yasai'},
  {w:'タマネギ',p:'vegetable',g:'yasai'},{w:'ジャガイモ',p:'vegetable',g:'yasai'},
  {w:'サツマイモ',p:'vegetable',g:'yasai'},{w:'カボチャ',p:'vegetable',g:'yasai'},
  {w:'キュウリ',p:'vegetable',g:'yasai'},{w:'ナス',p:'vegetable',g:'yasai'},
  {w:'レタス',p:'vegetable',g:'yasai'},{w:'ハクサイ',p:'vegetable',g:'yasai'},
  {w:'ホウレンソウ',p:'vegetable',g:'yasai'},{w:'ネギ',p:'vegetable',g:'yasai'},
  {w:'ゴボウ',p:'vegetable',g:'yasai'},{w:'トウモロコシ',p:'vegetable',g:'yasai'},
  {w:'ブロッコリー',p:'vegetable',g:'yasai'},{w:'アスパラ',p:'vegetable',g:'yasai'},
  {w:'セロリ',p:'vegetable',g:'yasai'},{w:'パセリ',p:'vegetable',g:'yasai'},
  {w:'マメ',p:'vegetable',g:'yasai'},{w:'エダマメ',p:'vegetable',g:'yasai'},{w:'ミカン',p:'fruit',g:'yasai'},
  {w:'リンゴ',p:'fruit',g:'yasai'},{w:'イチゴ',p:'fruit',g:'yasai'},{w:'スイカ',p:'fruit',g:'yasai'},
  {w:'ブドウ',p:'fruit',g:'yasai'},{w:'ナシ',p:'fruit',g:'yasai'},{w:'カキ',p:'fruit',g:'yasai'},
  {w:'クリ',p:'fruit',g:'yasai'},{w:'サクランボ',p:'fruit',g:'yasai'},{w:'パイナップル',p:'fruit',g:'yasai'},
  {w:'パパイヤ',p:'fruit',g:'yasai'},{w:'マンゴー',p:'fruit',g:'yasai'},{w:'ザクロ',p:'fruit',g:'yasai'},
  {w:'ビワ',p:'fruit',g:'yasai'},{w:'ユズ',p:'fruit',g:'yasai'},{w:'アンズ',p:'fruit',g:'yasai'},
  {w:'ライム',p:'fruit',g:'yasai'},{w:'ブルーベリー',p:'fruit',g:'yasai'},{w:'マツタケ',p:'vegetable',g:'yasai'},
  {w:'シイタケ',p:'vegetable',g:'yasai'},{w:'タケノコ',p:'vegetable',g:'yasai'},
  {w:'カブ',p:'vegetable',g:'yasai'},{w:'ピーナッツ',p:'vegetable',g:'yasai'},
  {w:'クルミ',p:'vegetable',g:'yasai'},{w:'レンコン',p:'vegetable',g:'yasai'},
  {w:'オクラ',p:'vegetable',g:'yasai'},{w:'ミニトマト',p:'vegetable',g:'yasai'},
  {w:'ソラマメ',p:'vegetable',g:'yasai'},{w:'ヘチマ',p:'vegetable',g:'yasai'},

  /* ── どうぶつ ── */
  {w:'パンダ',p:'animal',g:'animal'},{w:'ライオン',p:'animal',g:'animal'},{w:'ゾウ',p:'animal',g:'animal'},
  {w:'キリン',p:'animal',g:'animal'},{w:'コアラ',p:'animal',g:'animal'},{w:'ゴリラ',p:'animal',g:'animal'},
  {w:'カバ',p:'animal',g:'animal'},{w:'クマ',p:'animal',g:'animal'},{w:'ブタ',p:'animal',g:'animal'},
  {w:'ヒツジ',p:'animal',g:'animal'},{w:'ウサギ',p:'rabbit',g:'animal'},{w:'ネズミ',p:'animal',g:'animal'},
  {w:'シマウマ',p:'animal',g:'animal'},{w:'ラクダ',p:'animal',g:'animal'},{w:'トナカイ',p:'animal',g:'animal'},
  {w:'リス',p:'animal',g:'animal'},{w:'ワニ',p:'animal',g:'animal'},{w:'ヘビ',p:'animal',g:'animal'},
  {w:'ネコ',p:'cat',g:'animal'},{w:'イヌ',p:'dog',g:'animal'},{w:'サル',p:'animal',g:'animal'},
  {w:'ウマ',p:'animal',g:'animal'},{w:'ウシ',p:'animal',g:'animal'},{w:'ヤギ',p:'animal',g:'animal'},
  {w:'キツネ',p:'animal',g:'animal'},{w:'タヌキ',p:'animal',g:'animal'},{w:'シカ',p:'animal',g:'animal'},
  {w:'サイ',p:'animal',g:'animal'},{w:'トラ',p:'animal',g:'animal'},{w:'ヒョウ',p:'animal',g:'animal'},
  {w:'チーター',p:'animal',g:'animal'},{w:'カンガルー',p:'animal',g:'animal'},
  {w:'コウモリ',p:'animal',g:'animal'},{w:'モグラ',p:'animal',g:'animal'},
  {w:'ハリネズミ',p:'animal',g:'animal'},{w:'オオカミ',p:'animal',g:'animal'},{w:'カメ',p:'animal',g:'animal'},
  {w:'トカゲ',p:'animal',g:'animal'},{w:'カエル',p:'animal',g:'animal'},{w:'イノシシ',p:'animal',g:'animal'},
  {w:'ロバ',p:'animal',g:'animal'},{w:'ハムスター',p:'animal',g:'animal'},
  {w:'モルモット',p:'animal',g:'animal'},{w:'アライグマ',p:'animal',g:'animal'},
  {w:'ナマケモノ',p:'animal',g:'animal'},{w:'カメレオン',p:'animal',g:'animal'},
  {w:'イグアナ',p:'animal',g:'animal'},{w:'オランウータン',p:'animal',g:'animal'},
  {w:'チンパンジー',p:'animal',g:'animal'},{w:'ザリガニ',p:'bug',g:'animal'},{w:'シマリス',p:'animal',g:'animal'},
  {w:'ポニー',p:'animal',g:'animal'},{w:'ヌー',p:'animal',g:'animal'},{w:'ヤマネコ',p:'cat',g:'animal'},
  {w:'コブタ',p:'animal',g:'animal'},{w:'バク',p:'animal',g:'animal'},{w:'ゼブラ',p:'animal',g:'animal'},

  /* ── とり ── */
  {w:'ペンギン',p:'bird',g:'bird'},{w:'ダチョウ',p:'bird',g:'bird'},{w:'フクロウ',p:'bird',g:'bird'},
  {w:'ハト',p:'bird',g:'bird'},{w:'ニワトリ',p:'bird',g:'bird'},{w:'スズメ',p:'bird',g:'bird'},
  {w:'カラス',p:'bird',g:'bird'},{w:'ツバメ',p:'bird',g:'bird'},{w:'インコ',p:'bird',g:'bird'},
  {w:'ツル',p:'bird',g:'bird'},{w:'タカ',p:'bird',g:'bird'},{w:'ワシ',p:'bird',g:'bird'},
  {w:'カモメ',p:'bird',g:'bird'},{w:'カモ',p:'bird',g:'bird'},{w:'アヒル',p:'bird',g:'bird'},
  {w:'ハクチョウ',p:'bird',g:'bird'},{w:'キジ',p:'bird',g:'bird'},{w:'クジャク',p:'bird',g:'bird'},
  {w:'フラミンゴ',p:'bird',g:'bird'},{w:'オウム',p:'bird',g:'bird'},{w:'ヒヨコ',p:'bird',g:'bird'},
  {w:'メジロ',p:'bird',g:'bird'},{w:'ヒバリ',p:'bird',g:'bird'},{w:'ウグイス',p:'bird',g:'bird'},
  {w:'キツツキ',p:'bird',g:'bird'},{w:'ペリカン',p:'bird',g:'bird'},{w:'ブンチョウ',p:'bird',g:'bird'},
  {w:'カワセミ',p:'bird',g:'bird'},{w:'サギ',p:'bird',g:'bird'},{w:'トキ',p:'bird',g:'bird'},

  /* ── むし ── */
  {w:'チョウ',p:'bug',g:'bug'},{w:'セミ',p:'bug',g:'bug'},{w:'カブトムシ',p:'bug',g:'bug'},
  {w:'クワガタ',p:'bug',g:'bug'},{w:'バッタ',p:'bug',g:'bug'},{w:'アリ',p:'bug',g:'bug'},
  {w:'トンボ',p:'bug',g:'bug'},{w:'ホタル',p:'bug',g:'bug'},{w:'ハチ',p:'bug',g:'bug'},
  {w:'ムシ',p:'bug',g:'bug'},{w:'テントウムシ',p:'bug',g:'bug'},{w:'カマキリ',p:'bug',g:'bug'},
  {w:'コオロギ',p:'bug',g:'bug'},{w:'スズムシ',p:'bug',g:'bug'},{w:'ダンゴムシ',p:'bug',g:'bug'},
  {w:'カタツムリ',p:'bug',g:'bug'},{w:'ケムシ',p:'bug',g:'bug'},{w:'ミツバチ',p:'bug',g:'bug'},
  {w:'アメンボ',p:'bug',g:'bug'},{w:'ゲンゴロウ',p:'bug',g:'bug'},{w:'クモ',p:'bug',g:'bug'},
  {w:'ミミズ',p:'bug',g:'bug'},{w:'ハエ',p:'bug',g:'bug'},{w:'アブ',p:'bug',g:'bug'},
  {w:'チョウチョ',p:'bug',g:'bug'},{w:'イモムシ',p:'bug',g:'bug'},{w:'サナギ',p:'bug',g:'bug'},
  {w:'タマムシ',p:'bug',g:'bug'},{w:'コガネムシ',p:'bug',g:'bug'},{w:'ミノムシ',p:'bug',g:'bug'},
  {w:'キリギリス',p:'bug',g:'bug'},{w:'ヤゴ',p:'bug',g:'bug'},{w:'ゾウムシ',p:'bug',g:'bug'},
  {w:'マユ',p:'bug',g:'bug'},

  /* ── うみの いきもの ── */
  {w:'イルカ',p:'fish',g:'sea'},{w:'クジラ',p:'fish',g:'sea'},{w:'サメ',p:'fish',g:'sea'},
  {w:'タコ',p:'octopus',g:'sea'},{w:'イカ',p:'octopus',g:'sea'},{w:'エビ',p:'octopus',g:'sea'},
  {w:'カニ',p:'octopus',g:'sea'},{w:'メダカ',p:'fish',g:'sea'},{w:'クラゲ',p:'water',g:'sea'},
  {w:'マグロ',p:'fish',g:'sea'},{w:'ラッコ',p:'octopus',g:'sea'},{w:'サカナ',p:'fish',g:'sea'},
  {w:'キンギョ',p:'fish',g:'sea'},{w:'サンマ',p:'fish',g:'sea'},{w:'イワシ',p:'fish',g:'sea'},
  {w:'ワカメ',p:'leaf',g:'sea'},{w:'コンブ',p:'leaf',g:'sea'},{w:'ナマコ',p:'octopus',g:'sea'},
  {w:'ヒトデ',p:'octopus',g:'sea'},{w:'ヤドカリ',p:'octopus',g:'sea'},{w:'ウニ',p:'octopus',g:'sea'},
  {w:'アサリ',p:'fish',g:'sea'},{w:'アザラシ',p:'animal',g:'sea'},{w:'セイウチ',p:'animal',g:'sea'},
  {w:'オットセイ',p:'animal',g:'sea'},{w:'ウミガメ',p:'fish',g:'sea'},{w:'ヒラメ',p:'fish',g:'sea'},
  {w:'カレイ',p:'fish',g:'sea'},{w:'フグ',p:'fish',g:'sea'},{w:'タイ',p:'fish',g:'sea'},
  {w:'ブリ',p:'fish',g:'sea'},{w:'ウナギ',p:'fish',g:'sea'},{w:'ドジョウ',p:'fish',g:'sea'},
  {w:'ナマズ',p:'fish',g:'sea'},{w:'フナ',p:'fish',g:'sea'},{w:'コイ',p:'fish',g:'sea'},
  {w:'サンゴ',p:'flower',g:'sea'},{w:'イソギンチャク',p:'octopus',g:'sea'},{w:'シジミ',p:'octopus',g:'sea'},
  {w:'ハマグリ',p:'octopus',g:'sea'},{w:'ホタテ',p:'octopus',g:'sea'},{w:'カツオ',p:'fish',g:'sea'},
  {w:'サバ',p:'fish',g:'sea'},{w:'タラ',p:'fish',g:'sea'},{w:'アワビ',p:'octopus',g:'sea'},
  {w:'サザエ',p:'octopus',g:'sea'},{w:'シャチ',p:'animal',g:'sea'},{w:'マンボウ',p:'fish',g:'sea'},
  {w:'エイ',p:'fish',g:'sea'},

  /* ── はな・き ── */
  {w:'バラ',p:'flower',g:'plant'},{w:'チューリップ',p:'flower',g:'plant'},{w:'ヒマワリ',p:'flower',g:'plant'},
  {w:'サボテン',p:'tree',g:'plant'},{w:'タンポポ',p:'flower',g:'plant'},{w:'ツリー',p:'tree',g:'plant'},
  {w:'ユリ',p:'flower',g:'plant'},{w:'サクラ',p:'flower',g:'plant'},{w:'ウメ',p:'flower',g:'plant'},
  {w:'マツ',p:'tree',g:'plant'},{w:'タケ',p:'tree',g:'plant'},{w:'モミジ',p:'leaf',g:'plant'},
  {w:'イチョウ',p:'leaf',g:'plant'},{w:'スミレ',p:'flower',g:'plant'},{w:'アサガオ',p:'flower',g:'plant'},
  {w:'コスモス',p:'flower',g:'plant'},{w:'パンジー',p:'flower',g:'plant'},
  {w:'カーネーション',p:'flower',g:'plant'},{w:'アジサイ',p:'flower',g:'plant'},{w:'ツバキ',p:'flower',g:'plant'},
  {w:'キク',p:'flower',g:'plant'},{w:'スイセン',p:'flower',g:'plant'},{w:'シバフ',p:'leaf',g:'plant'},
  {w:'ドングリ',p:'tree',g:'plant'},{w:'マツボックリ',p:'tree',g:'plant'},{w:'ヨツバ',p:'leaf',g:'plant'},
  {w:'クローバー',p:'leaf',g:'plant'},{w:'ススキ',p:'leaf',g:'plant'},{w:'ツクシ',p:'leaf',g:'plant'},
  {w:'ヨモギ',p:'leaf',g:'plant'},{w:'ササ',p:'leaf',g:'plant'},{w:'スギ',p:'tree',g:'plant'},
  {w:'ブナ',p:'tree',g:'plant'},{w:'カエデ',p:'leaf',g:'plant'},{w:'ヤシ',p:'tree',g:'plant'},
  {w:'シダ',p:'leaf',g:'plant'},{w:'コケ',p:'leaf',g:'plant'},{w:'ネッコ',p:'tree',g:'plant'},
  {w:'ツボミ',p:'flower',g:'plant'},{w:'ハナビラ',p:'flower',g:'plant'},{w:'ユーカリ',p:'tree',g:'plant'},
  {w:'ユリノキ',p:'tree',g:'plant'},{w:'ツユクサ',p:'flower',g:'plant'},{w:'トゲ',p:'leaf',g:'plant'},
  {w:'ゼラニウム',p:'flower',g:'plant'},

  /* ── しぜん ── */
  

  /* ── のりもの ── */
  {w:'バス',p:'car',g:'vehicle'},{w:'タクシー',p:'car',g:'vehicle'},{w:'トラック',p:'car',g:'vehicle'},
  {w:'パトカー',p:'car',g:'vehicle'},{w:'ロケット',p:'plane',g:'vehicle'},
  {w:'ヘリコプター',p:'plane',g:'vehicle'},{w:'ボート',p:'ship',g:'vehicle'},{w:'ヨット',p:'ship',g:'vehicle'},
  {w:'バイク',p:'car',g:'vehicle'},{w:'ダンプカー',p:'car',g:'vehicle'},{w:'ショベルカー',p:'car',g:'vehicle'},
  {w:'ブルドーザー',p:'car',g:'vehicle'},{w:'モノレール',p:'train',g:'vehicle'},
  {w:'ケーブルカー',p:'train',g:'vehicle'},{w:'スクーター',p:'car',g:'vehicle'},{w:'カヌー',p:'ship',g:'vehicle'},
  {w:'ゴンドラ',p:'ship',g:'vehicle'},{w:'タンクローリー',p:'car',g:'vehicle'},
  {w:'キックボード',p:'car',g:'vehicle'},{w:'ロープウエー',p:'train',g:'vehicle'},
  {w:'モーターボート',p:'ship',g:'vehicle'},{w:'レーシングカー',p:'car',g:'vehicle'},
  {w:'スケボー',p:'car',g:'vehicle'},{w:'ミニカー',p:'car',g:'vehicle'},{w:'キュウキュウシャ',p:'car',g:'vehicle'},

  /* ── いえ・まち ── */
  {w:'デパート',p:'shop',g:'town'},{w:'スーパー',p:'shop',g:'town'},{w:'コンビニ',p:'shop',g:'town'},
  {w:'ビル',p:'house',g:'town'},{w:'マンション',p:'house',g:'town'},{w:'アパート',p:'house',g:'town'},
  {w:'トンネル',p:'house',g:'town'},{w:'ホテル',p:'house',g:'town'},{w:'レストラン',p:'shop',g:'town'},
  {w:'ベンチ',p:'house',g:'town'},{w:'エレベーター',p:'house',g:'town'},{w:'エスカレーター',p:'house',g:'town'},
  {w:'ガソリンスタンド',p:'shop',g:'town'},{w:'パーキング',p:'car',g:'town'},{w:'ゴミバコ',p:'tool',g:'town'},
  {w:'マンホール',p:'house',g:'town'},{w:'ヘリポート',p:'plane',g:'town'},{w:'ヘイ',p:'house',g:'town'},
  {w:'ゲンカン',p:'house',g:'town'},

  /* ── みの まわりの もの（出題には つかわない なかま） ── */
  {w:'テレビ',p:'tool',g:'tool'},{w:'ラジオ',p:'music',g:'tool'},{w:'カメラ',p:'tool',g:'tool'},
  {w:'コップ',p:'drink',g:'tool'},{w:'スプーン',p:'tool',g:'tool'},{w:'ナイフ',p:'tool',g:'tool'},
  {w:'タオル',p:'cloth',g:'tool'},{w:'ボタン',p:'cloth',g:'tool'},{w:'ドア',p:'house',g:'tool'},
  {w:'カーテン',p:'cloth',g:'tool'},{w:'ベッド',p:'cloth',g:'tool'},{w:'テーブル',p:'tool',g:'tool'},
  {w:'ストーブ',p:'light',g:'tool'},{w:'パソコン',p:'tool',g:'tool'},{w:'ポスト',p:'tool',g:'tool'},
  {w:'ヤカン',p:'drink',g:'tool'},{w:'ルーペ',p:'tool',g:'tool'},{w:'モップ',p:'tool',g:'tool'},
  {w:'ハンガー',p:'tool',g:'tool'},{w:'バケツ',p:'tool',g:'tool'},{w:'ホウキ',p:'tool',g:'tool'},
  {w:'ナベ',p:'tool',g:'tool'},{w:'ザル',p:'tool',g:'tool'},{w:'ミシン',p:'tool',g:'tool'},
  {w:'アイロン',p:'tool',g:'tool'},{w:'ドライヤー',p:'tool',g:'tool'},{w:'エアコン',p:'tool',g:'tool'},
  {w:'スリッパ',p:'cloth',g:'tool'},{w:'タンス',p:'house',g:'tool'},{w:'ハブラシ',p:'tool',g:'tool'},
  {w:'シャンプー',p:'tool',g:'tool'},{w:'タオルケット',p:'cloth',g:'tool'},{w:'トイレ',p:'house',g:'tool'},
  {w:'リモコン',p:'tool',g:'tool'},{w:'スイッチ',p:'light',g:'tool'},{w:'コンセント',p:'light',g:'tool'},
  {w:'スマホ',p:'tool',g:'tool'},{w:'プリンター',p:'tool',g:'tool'},{w:'マウス',p:'tool',g:'tool'},
  {w:'キーボード',p:'tool',g:'tool'},{w:'ヘッドホン',p:'music',g:'tool'},{w:'イヤホン',p:'music',g:'tool'},
  {w:'ライト',p:'light',g:'tool'},{w:'ランプ',p:'light',g:'tool'},{w:'ボトル',p:'drink',g:'tool'},
  {w:'ペットボトル',p:'drink',g:'tool'},{w:'ストロー',p:'drink',g:'tool'},{w:'スポンジ',p:'tool',g:'tool'},
  {w:'マット',p:'house',g:'tool'},{w:'カーペット',p:'house',g:'tool'},{w:'クッション',p:'house',g:'tool'},
  {w:'シーツ',p:'cloth',g:'tool'},{w:'タワシ',p:'tool',g:'tool'},{w:'ゴム',p:'tool',g:'tool'},
  {w:'ヒモ',p:'tool',g:'tool'},{w:'ハシゴ',p:'tool',g:'tool'},{w:'ノコギリ',p:'tool',g:'tool'},
  {w:'ドライバー',p:'tool',g:'tool'},{w:'ホース',p:'water',g:'tool'},{w:'ジョウロ',p:'water',g:'tool'},
  {w:'スコップ',p:'tool',g:'tool'},{w:'カナヅチ',p:'tool',g:'tool'},{w:'オモチャバコ',p:'bag',g:'tool'},
  {w:'メジャー',p:'tool',g:'tool'},{w:'ゾウキン',p:'tool',g:'tool'},{w:'レイゾウコ',p:'tool',g:'tool'},
  {w:'ペンキ',p:'tool',g:'tool'},{w:'ヘラ',p:'tool',g:'tool'},{w:'デンチ',p:'light',g:'tool'},
  {w:'チューブ',p:'tool',g:'tool'},{w:'ビデオ',p:'tool',g:'tool'},

  /* ── きるもの ── */
  {w:'シャツ',p:'cloth',g:'cloth'},{w:'ズボン',p:'cloth',g:'cloth'},{w:'スカート',p:'cloth',g:'cloth'},
  {w:'セーター',p:'cloth',g:'cloth'},{w:'コート',p:'cloth',g:'cloth'},{w:'パジャマ',p:'cloth',g:'cloth'},
  {w:'マスク',p:'cloth',g:'cloth'},{w:'リボン',p:'cloth',g:'cloth'},{w:'ベルト',p:'cloth',g:'cloth'},
  {w:'ポケット',p:'cloth',g:'cloth'},{w:'エプロン',p:'cloth',g:'cloth'},{w:'ハンカチ',p:'cloth',g:'cloth'},
  {w:'ワンピース',p:'cloth',g:'cloth'},{w:'ジャンパー',p:'cloth',g:'cloth'},{w:'ブラウス',p:'cloth',g:'cloth'},
  {w:'ソックス',p:'cloth',g:'cloth'},{w:'タイツ',p:'cloth',g:'cloth'},{w:'ブーツ',p:'cloth',g:'cloth'},
  {w:'サンダル',p:'cloth',g:'cloth'},{w:'スニーカー',p:'cloth',g:'cloth'},{w:'キャップ',p:'cloth',g:'cloth'},
  {w:'ヘルメット',p:'cloth',g:'cloth'},{w:'マフラー',p:'cloth',g:'cloth'},{w:'グローブ',p:'cloth',g:'cloth'},
  {w:'ネクタイ',p:'cloth',g:'cloth'},{w:'ユニホーム',p:'cloth',g:'cloth'},{w:'ジャージ',p:'cloth',g:'cloth'},
  {w:'パーカー',p:'cloth',g:'cloth'},{w:'ベスト',p:'cloth',g:'cloth'},{w:'トレーナー',p:'cloth',g:'cloth'},
  {w:'スカーフ',p:'cloth',g:'cloth'},{w:'ヘアピン',p:'cloth',g:'cloth'},{w:'ポンチョ',p:'cloth',g:'cloth'},
  {w:'レインコート',p:'cloth',g:'cloth'},{w:'カッパ',p:'cloth',g:'cloth'},{w:'ミズギ',p:'cloth',g:'cloth'},
  {w:'リュック',p:'bag',g:'cloth'},{w:'ズック',p:'cloth',g:'cloth'},{w:'ユカタ',p:'cloth',g:'cloth'},
  {w:'ユビワ',p:'cloth',g:'cloth'},{w:'ペンダント',p:'cloth',g:'cloth'},{w:'ゲタ',p:'cloth',g:'cloth'},
  {w:'ゾウリ',p:'cloth',g:'cloth'},{w:'キヌ',p:'cloth',g:'cloth'},{w:'ヨウフク',p:'cloth',g:'cloth'},
  {w:'ゼッケン',p:'cloth',g:'cloth'},{w:'ヘアバンド',p:'cloth',g:'cloth'},

  /* ── あそび ── */
  {w:'ボール',p:'ball',g:'play'},{w:'ブランコ',p:'ball',g:'play'},{w:'スキー',p:'snow',g:'play'},
  {w:'スケート',p:'snow',g:'play'},{w:'ゲーム',p:'tool',g:'play'},{w:'カルタ',p:'book',g:'play'},
  {w:'ピアノ',p:'music',g:'play'},{w:'オルガン',p:'music',g:'play'},{w:'ラッパ',p:'music',g:'play'},
  {w:'サッカー',p:'ball',g:'play'},{w:'カスタネット',p:'music',g:'play'},{w:'ヌイグルミ',p:'rabbit',g:'play'},
  {w:'ソリ',p:'snow',g:'play'},{w:'バスケット',p:'ball',g:'play'},{w:'バレーボール',p:'ball',g:'play'},
  {w:'テニス',p:'ball',g:'play'},{w:'バドミントン',p:'ball',g:'play'},{w:'ソフトボール',p:'ball',g:'play'},
  {w:'ダンス',p:'music',g:'play'},{w:'バレエ',p:'music',g:'play'},{w:'カラオケ',p:'music',g:'play'},
  {w:'パズル',p:'book',g:'play'},{w:'ブロック',p:'shape',g:'play'},{w:'トランプ',p:'book',g:'play'},
  {w:'シーソー',p:'shape',g:'play'},{w:'ジャングルジム',p:'shape',g:'play'},{w:'トランポリン',p:'shape',g:'play'},
  {w:'フラフープ',p:'shape',g:'play'},{w:'キャッチボール',p:'ball',g:'play'},{w:'サイクリング',p:'car',g:'play'},
  {w:'ボウリング',p:'ball',g:'play'},{w:'ローラースケート',p:'shape',g:'play'},{w:'ギター',p:'music',g:'play'},
  {w:'ドラム',p:'music',g:'play'},{w:'タンバリン',p:'music',g:'play'},{w:'トライアングル',p:'music',g:'play'},
  {w:'ハーモニカ',p:'music',g:'play'},{w:'シンバル',p:'music',g:'play'},{w:'マラカス',p:'music',g:'play'},
  {w:'ラジコン',p:'car',g:'play'},{w:'プラモデル',p:'tool',g:'play'},{w:'ロボット',p:'tool',g:'play'},
  {w:'シャボンダマ',p:'shape',g:'play'},{w:'ヒーロー',p:'person',g:'play'},{w:'アスレチック',p:'mountain',g:'play'},
  {w:'ユキダルマ',p:'snow',g:'play'},{w:'ユニコーン',p:'animal',g:'play'},{w:'ヨーヨー',p:'shape',g:'play'},
  {w:'ナゾナゾ',p:'book',g:'play'},{w:'ヌリエ',p:'pencil',g:'play'},{w:'ゼンマイ',p:'tool',g:'play'},

  /* ── いろ ── */
  {w:'ピンク',p:'shape',g:'color'},{w:'グレー',p:'shape',g:'color'},{w:'ブルー',p:'shape',g:'color'},
  {w:'グリーン',p:'shape',g:'color'},{w:'イエロー',p:'shape',g:'color'},{w:'ホワイト',p:'shape',g:'color'},
  {w:'ブラック',p:'shape',g:'color'},{w:'シルバー',p:'shape',g:'color'},{w:'ゴールド',p:'shape',g:'color'},
  {w:'レインボー',p:'rainbow',g:'color'},{w:'クリームイロ',p:'shape',g:'color'},

  /* ── そのほか（出題には つかわないが、しりとりや 読みで つかう） ── */
  {w:'ハート',p:'heart',g:'other'},{w:'マーク',p:'shape',g:'other'},{w:'リズム',p:'music',g:'other'},
  {w:'オンプ',p:'music',g:'other'},{w:'テンポ',p:'music',g:'other'},{w:'ニュース',p:'book',g:'other'},
  {w:'プレゼント',p:'bag',g:'other'},{w:'クリスマス',p:'star',g:'other'},{w:'サンタクロース',p:'person',g:'other'},
  {w:'ピクニック',p:'mountain',g:'other'},{w:'バレンタイン',p:'heart',g:'other'},{w:'スタート',p:'star',g:'other'},
  {w:'ゴール',p:'star',g:'other'},{w:'ルール',p:'book',g:'other'},{w:'チーム',p:'person',g:'other'},
  {w:'グループ',p:'person',g:'other'},{w:'メンバー',p:'person',g:'other'},{w:'ナンバー',p:'book',g:'other'},
  {w:'サイズ',p:'shape',g:'other'},{w:'デザイン',p:'shape',g:'other'},{w:'アイデア',p:'light',g:'other'},
  {w:'エネルギー',p:'light',g:'other'},{w:'スピード',p:'car',g:'other'},{w:'パワー',p:'heart',g:'other'},
  {w:'ラッキー',p:'star',g:'other'},{w:'メール',p:'book',g:'other'},{w:'ヒント',p:'light',g:'other'},
  {w:'ページ',p:'book',g:'other'},{w:'タイトル',p:'book',g:'other'},{w:'モード',p:'shape',g:'other'},
  {w:'ドレミ',p:'music',g:'other'},{w:'ミゾ',p:'water',g:'other'},{w:'ヌマ',p:'water',g:'other'},{w:'ナゾ',p:'book',g:'other'},
  {w:'カイゾク',p:'ship',g:'other'},{w:'ゼロ',p:'shape',g:'other'},{w:'ヒゲ',p:'person',g:'other'},
  {w:'ミカヅキ',p:'moon',g:'other'},{w:'カンヅメ',p:'rice',g:'other'},{w:'コヅツミ',p:'bag',g:'other'},
  {w:'ヌノ',p:'cloth',g:'other'},
];

/* はんたいの ことば（1年生の「はんたいの いみの ことば」）。
   ここから 行き・帰り の 2 とおりの もんだいを 作る。 */
const OPPOSITE_PAIRS = [
  ['おおきい','ちいさい'],['たかい','ひくい'],['ながい','みじかい'],
  ['あつい','さむい'],['つめたい','あたたかい'],['あまい','からい'],
  ['あたらしい','ふるい'],['はやい','おそい'],['おもい','かるい'],
  ['あかるい','くらい'],['ひろい','せまい'],['つよい','よわい'],
  ['おおい','すくない'],['うれしい','かなしい'],['かたい','やわらかい'],
  ['うえ','した'],['まえ','うしろ'],['みぎ','ひだり'],['なか','そと'],
  ['あさ','よる'],['のる','おりる'],['はいる','でる'],
  ['あける','しめる'],['たつ','すわる'],['おきる','ねる'],['わらう','なく'],
];
const OPPOSITE_MAP = {};
OPPOSITE_PAIRS.forEach(([a, b]) => { OPPOSITE_MAP[a] = b; OPPOSITE_MAP[b] = a; });
const OPPOSITE_WORDS = Object.keys(OPPOSITE_MAP);

/* ───── ここから下は 上の 2 つの表から 自動で つくる ───── */

// おなじ ことばが 2 か所に あったら、先に 書いたほうを のこす。
function dedupeWords(list) {
  const seen = new Set();
  const out = [];
  list.forEach(x => { if (!seen.has(x.w)) { seen.add(x.w); out.push(x); } });
  return out;
}
const ALL_WORDS = dedupeWords([...WORD_BANK, ...WORD_BANK_KATA]);
function bankOf(script) { return script === 'katakana' ? WORD_BANK_KATA : WORD_BANK; }

/* ことば → ことばずかん（1,727語）の データ の 早びき表。

   子どもが じぶんで 書いた ことばが この 表に あれば、さしえ（p）と
   なかま（g）を **その場で 引いて** つかう。子どもに 入力させたり、
   べつの 説明文を 書きたしたり しないこと。ことばの もとだねは
   WORD_BANK / WORD_BANK_KATA の 1 か所の まま にする（§1.1）。

   ※ ほぞんする ときも なかまは 書きこまない。あとで ことばを 足したら
     むかし あつめた ことばにも あとから なかまが つくようにする。 */
const WORD_INFO = new Map(ALL_WORDS.map(x => [x.w, x]));
// ずかんに ない ことばの さしえ。えらばなければ 中立の しるしに なる。
const DEFAULT_PICT = 'shape';
function guessPict(text) {
  const info = WORD_INFO.get(text);
  return (info && info.p) || DEFAULT_PICT;
}
// なかまの 名まえ（「たべもの」など）。ことばずかんに ない ことばは 空。
function groupTitleOf(text) {
  const info = WORD_INFO.get(text);
  const g = info && WORD_GROUP_MAP[info.g];
  return g ? g.title : '';
}

// しりとりで コンピュータが つかう ことば。
// あいさつ（おはよう・ありがとう）は しりとりの ことばに ならないので のぞく。
const SHIRITORI_CPU_WORDS = WORD_BANK.filter(x => x.w.length >= 2 && x.g !== 'aisatsu');

/* ことばあつめの ヒント。
   「じぶんで 書ける じ だけで 作れる ことば」に しぼるのは 画面の
   しごとなので、ここでは ならべる じゅんばんだけを きめる。
   なかまを 1 語ずつ 順に とっていく（同じ なかまばかりに ならない）。 */
function orderHints(list) {
  const count = {};
  return list
    .filter(x => x.w.length >= 2 && x.w.length <= 4)
    .map((x, i) => ({ x, n: (count[x.g] = (count[x.g] || 0) + 1), i }))
    .sort((a, b) => (a.n - b.n) || (a.x.w.length - b.x.w.length) || (a.i - b.i))
    .map(e => ({ w: e.x.w, p: e.x.p }));
}
const WORD_HINTS_HIRA = orderHints(WORD_BANK);
const WORD_HINTS_KATA = orderHints(WORD_BANK_KATA);

// ★カスタマイズポイント: レベル（しょうごう）
// icon は PICTS のキー、color は Tailwind のクラス（index.html の配色定義より）
const LEVELS = [
  { min:  0, title: 'みならい',            icon: 'leaf',     color: 'bg-midori-50 text-midori-700 border-midori-300' },
  { min:  5, title: 'がんばりや',          icon: 'flower',   color: 'bg-shu-50 text-shu-700 border-shu-300' },
  { min: 15, title: 'もじチャレンジャー',  icon: 'star',     color: 'bg-yamabuki-50 text-yamabuki-700 border-yamabuki-300' },
  { min: 30, title: 'もじはかせ',          icon: 'book',     color: 'bg-ai-50 text-ai-700 border-ai-300' },
  { min: 50, title: 'もじマスター',        icon: 'pencil',   color: 'bg-fuji-50 text-fuji-700 border-fuji-300' },
  { min: 80, title: 'もじキング',          icon: 'mountain', color: 'bg-yamabuki-100 text-yamabuki-800 border-yamabuki-400' },
  { min: 92, title: 'でんせつの もじびと', icon: 'sun',      color: 'bg-shu-100 text-shu-800 border-shu-400' },
];
function getCurrentLevel(masteredCount) {
  return [...LEVELS].reverse().find(l => masteredCount >= l.min) || LEVELS[0];
}

// ★カスタマイズポイント: バッジ（ごほうびの はんこ）
const BADGES = [
  { id: 'first',     title: 'はじめの いっぽ',   icon: 'leaf',     desc: 'はじめての じを マスター',     check: ({m,w,s}) => m.length >= 1 },
  { id: 'hira5',     title: 'ひらがな ５じ',     icon: 'flower',   desc: 'ひらがなを ５じ おぼえた',     check: ({m})     => m.filter(c => HIRA_LIST.includes(c)).length >= 5 },
  { id: 'hira23',    title: 'ひらがな はんぶん', icon: 'tree',     desc: 'ひらがなを ２３じ おぼえた',   check: ({m})     => m.filter(c => HIRA_LIST.includes(c)).length >= 23 },
  { id: 'hiraAll',   title: 'ひらがな かんぺき', icon: 'sun',      desc: 'ひらがなを ぜんぶ おぼえた',   check: ({m})     => HIRA_LIST.every(c => m.includes(c)) },
  { id: 'kata5',     title: 'カタカナ ５じ',     icon: 'star',     desc: 'カタカナを ５じ おぼえた',     check: ({m})     => m.filter(c => KATA_LIST.includes(c)).length >= 5 },
  { id: 'kata23',    title: 'カタカナ はんぶん', icon: 'moon',     desc: 'カタカナを ２３じ おぼえた',   check: ({m})     => m.filter(c => KATA_LIST.includes(c)).length >= 23 },
  { id: 'kataAll',   title: 'カタカナ かんぺき', icon: 'rainbow',  desc: 'カタカナを ぜんぶ おぼえた',   check: ({m})     => KATA_LIST.every(c => m.includes(c)) },
  { id: 'word5',     title: 'ことば あつめ びと', icon: 'fruit',   desc: 'ことばを ５こ あつめた',       check: ({w})     => w.length >= 5 },
  { id: 'word20',    title: 'ことば コレクター', icon: 'bag',      desc: 'ことばを ２０こ あつめた',     check: ({w})     => w.length >= 20 },
  { id: 'word50',    title: 'ことば はかせ',     icon: 'book',     desc: 'ことばを ５０こ あつめた',     check: ({w})     => w.length >= 50 },
  { id: 'streak3',   title: '３にち つづけた',   icon: 'light',    desc: '３にち れんぞくで れんしゅう', check: ({s})     => s >= 3 },
  { id: 'streak7',   title: '１しゅうかん',      icon: 'school',   desc: '７にち れんぞくで れんしゅう', check: ({s})     => s >= 7 },
  { id: 'allKana',   title: 'もじキング！',      icon: 'mountain', desc: 'ひらがな・カタカナ ぜんぶ',    check: ({m})     => HIRA_LIST.every(c => m.includes(c)) && KATA_LIST.every(c => m.includes(c)) },
];

// LocalStorage キー
// localStorage は gigayama.github.io というサイト全体で共有されるため、
// 同じサイトに置いた他のアプリと記録がぶつからないよう、キーは必ず
// この接頭辞（kkm）で始めること。消すときもこの接頭辞で絞りこむ。
const STORAGE_PREFIX = 'kkm';
const KEY_MASTERED = 'kkm_v2_mastered';        // 旧データ（マイグレーション用）
const KEY_PROGRESS = 'kkm_v3_progress';        // ★新：文字ごとの学習ステージ
const KEY_WORDS    = 'kkm_v2_words';
const KEY_COUNT    = 'kkm_v2_count';
const KEY_STREAK   = 'kkm_v2_streak';   // { count, lastDate }
const KEY_BADGES   = 'kkm_v2_badges';   // 取得済みバッジID
const KEY_VOICE    = 'kkm_v2_voice';    // 音声よみあげON/OFF
const KEY_SIRI_BEST = 'kkm_siri_best';  // しりとりの最高記録

/* ──────────────────────────────────────────────────────────────
   学習ステージ（あたらしい設計）
   ────────────────────────────────────────────────────────────── */
// 0: 未学習
// 1: 書き順アニメをみた
// 2: なぞり書きを TRACE_REQUIRED 回 こなした
// 3: ガイドなしで FREE_REQUIRED 回 れんぞくでせいかい（ほぼマスター）
// 4: その文字を使ったことばを 1つ以上あつめた（完全マスター＝花丸）
const TRACE_REQUIRED = 2;
const FREE_REQUIRED  = 3;

/* 色の組みあわせ表。

   Tailwind のクラス名は `text-${tone}-600` のような文字列の足し算では作らず、
   かならずこの表から まるごと取り出すこと。クラス名を組み立ててしまうと、
   ビルド時に「使われているクラス」として見つけてもらえず、色が出なくなる。

     text     … 見出しなど こい文字色
     icon     … アイコン・しるしの色
     chip     … うすい下地の小さな札（背景＋文字＋わく）
     solid    … ぬりつぶしのボタン（背景＋わく。文字は白）
     topRule  … カードの上ぶちに引く色つきの線
     leftRule … カードの左ぶちに引く色つきの線
     markRing … もじ表のかどにつける しるしの わくと文字
     stat     … 数字をならべる小さなカード                            */
const TONES = {
  shu:      { text:'text-shu-700',      icon:'text-shu-600',      chip:'bg-shu-50 text-shu-700 border-shu-300',           solid:'bg-shu-600 border-shu-700',           topRule:'border-t-shu-600',      leftRule:'border-shu-400 border-l-shu-600',           markRing:'border-shu-300 text-shu-600',      stat:'bg-shu-50 border-shu-200',           statLabel:'text-shu-600',      statValue:'text-shu-700' },
  ai:       { text:'text-ai-700',       icon:'text-ai-600',       chip:'bg-ai-50 text-ai-700 border-ai-300',              solid:'bg-ai-600 border-ai-700',             topRule:'border-t-ai-600',       leftRule:'border-ai-400 border-l-ai-600',             markRing:'border-ai-300 text-ai-600',        stat:'bg-ai-50 border-ai-200',             statLabel:'text-ai-600',       statValue:'text-ai-700' },
  midori:   { text:'text-midori-700',   icon:'text-midori-600',   chip:'bg-midori-50 text-midori-700 border-midori-300',  solid:'bg-midori-600 border-midori-700',     topRule:'border-t-midori-600',   leftRule:'border-midori-400 border-l-midori-600',     markRing:'border-midori-300 text-midori-600',stat:'bg-midori-50 border-midori-200',     statLabel:'text-midori-600',   statValue:'text-midori-700' },
  fuji:     { text:'text-fuji-700',     icon:'text-fuji-600',     chip:'bg-fuji-50 text-fuji-700 border-fuji-300',        solid:'bg-fuji-600 border-fuji-700',         topRule:'border-t-fuji-600',     leftRule:'border-fuji-400 border-l-fuji-600',         markRing:'border-fuji-300 text-fuji-600',    stat:'bg-fuji-50 border-fuji-200',         statLabel:'text-fuji-600',     statValue:'text-fuji-700' },
  yamabuki: { text:'text-yamabuki-700', icon:'text-yamabuki-700', chip:'bg-yamabuki-50 text-yamabuki-700 border-yamabuki-300', solid:'bg-yamabuki-600 border-yamabuki-700', topRule:'border-t-yamabuki-600', leftRule:'border-yamabuki-400 border-l-yamabuki-600', markRing:'border-yamabuki-300 text-yamabuki-700', stat:'bg-yamabuki-50 border-yamabuki-200', statLabel:'text-yamabuki-700', statValue:'text-yamabuki-700' },
  sumi:     { text:'text-sumi-700',     icon:'text-sumi-600',     chip:'bg-sumi-50 text-sumi-600 border-sumi-300',        solid:'bg-sumi-600 border-sumi-700',         topRule:'border-t-sumi-600',     leftRule:'border-sumi-400 border-l-sumi-600',         markRing:'border-sumi-300 text-sumi-600',    stat:'bg-sumi-50 border-sumi-200',         statLabel:'text-sumi-600',     statValue:'text-sumi-700' },
};

/* 大きい ボタンの「したの あつみ」の 色（.kkm-primary / .kkm-solid の 影）。
   押すと 沈む 立体に 見せるための 濃いめの 色で、TONES の solid と 対に なる。
   Tailwind の クラス名では 指定できない（CSS 変数に わたす）ので ここに 置く。 */
const TONE_DEEP = {
  shu: '#93331e', ai: '#263a54', midori: '#315035',
  fuji: '#493c60', yamabuki: '#7a5618', sumi: '#443f38',
};

/* 学習の 4 だんかい。画面のどこでも おなじ 順番・おなじ 色・おなじ しるし
   で見えるように、名まえ・色・アイコンを ここに一元化する。
   ・num   … 見出しにつける漢数字（教科書の「一 二 三 四」）
   ・icon  … UI アイコンの名まえ（ICONS のキー）
   ・tone  … TONES のキー */
/* num は だんかいの 番号。
   もとは 教科書らしさを ねらって 漢数字（一 二 三 四）を つかっていたが、
   まるの 中に 1 字だけ 出る ところなので ふりがなを ふれない。
   まだ 漢字を ならっていない 1年生が 読めないままに なるので、
   だれでも 読める 算用数字に あらためた。 */
const STAGE_INFO = [
  { key: 0, num: '',  icon: 'lock',   label: 'みがくぜん',   tone: 'sumi'   },
  { key: 1, num: '1', icon: 'play',   label: 'かきじゅん',   tone: 'ai'     },
  { key: 2, num: '2', icon: 'brush',  label: 'なぞりがき',   tone: 'midori' },
  { key: 3, num: '3', icon: 'pen',    label: 'じぶんでかく', tone: 'fuji'   },
  { key: 4, num: '4', icon: 'maru',   label: 'かんぺき',     tone: 'shu'    },
];

/* ステップを ひとつ 上がった ときの ことば。
   採点の 画面（<ScorePopup>）と おしらせ（<StageUpPopup>）の 両方で
   おなじ 文を つかうため、ここに 一元化する。 */
const STAGE_UP_TEXT = {
  2: { num: '2', title: 'なぞり クリア！', sub: 'つぎは じぶんで かいてみよう', tone: 'midori' },
  3: { num: '3', title: 'じぶんで かく クリア！', sub: 'ことばを 1こ あつめれば 花丸！', tone: 'fuji' },
  4: { num: '4', title: '花丸！ かんぺき',     sub: 'ほんとうに じぶんの じに なったよ', tone: 'shu' },
};

function newStageObj(stage=0) {
  return { stage, traced: 0, free: 0, freeStreak: 0, sawAnime: false };
}
function getStage(progress, char) { return progress?.[char]?.stage ?? 0; }
function getMasteredList(progress) {
  return Object.keys(progress || {}).filter(c => progress[c].stage >= 4);
}
function getUsableInWordsList(progress) {
  // ステージ3以上の文字は「ことばあつめ」に使える（ことばを使うことでステージ4に到達できる）
  return Object.keys(progress || {}).filter(c => progress[c].stage >= 3);
}
function loadInitialProgress() {
  try {
    const r = localStorage.getItem(KEY_PROGRESS);
    if (r != null) return JSON.parse(r);
    // 旧 mastered からの移行（既存ユーザーの進捗を維持）
    const old = JSON.parse(localStorage.getItem(KEY_MASTERED) || '[]');
    const initial = {};
    old.forEach(c => {
      initial[c] = { stage: 4, traced: TRACE_REQUIRED, free: FREE_REQUIRED, freeStreak: FREE_REQUIRED, sawAnime: true };
    });
    // 移行結果を即時に書き戻す。ここで失敗しても次回に再試行されればよい。
    try { localStorage.setItem(KEY_PROGRESS, JSON.stringify(initial)); } catch (e) {}
    return initial;
  } catch { return {}; }
}

/* ══════════════════════════════════════════════════════════════
   1.5. 「おと」と「もじ」をつなぐ しくみ（あたらしい学習モデルの土台）

   1年生が いちばん つまずくのは 字の形ではなく、
   「耳できいた おと」を「かみに書く もじ」に なおすところ。
     ・きって  … つまる おと（っ）が 聞こえても 書きおとす
     ・きゃ    … 2 もじで 1 つの おと（拗音）
     ・おとうさん … のばす おとを「お」と書いてしまう
     ・わたしは … 「わ」と読むのに「は」と書く
   ここでは この「おと（拍）」と「マス（文字）」の関係を、アプリ全体で
   ただ 1 か所の関数として定義する。画面はすべてこれを見る。
   ══════════════════════════════════════════════════════════════ */

// 小書き（ちいさく書く）かな。拗音の ゃゅょ、促音の っ、外来語の ぁぃぅぇぉ。
const SMALL_KANA = 'ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮヵヶ';
const CHOUON_MARK = 'ー';
function isSmallKana(c) { return !!c && SMALL_KANA.indexOf(c) >= 0; }
function isSokuon(c)    { return c === 'っ' || c === 'ッ'; }
function isYouonSmall(c){ return 'ゃゅょャュョ'.indexOf(c) >= 0; }
function isDakuonChar(c){ return HIRA_DAKUON_LIST.includes(c) || KATA_DAKUON_LIST.includes(c); }

// マス（原稿用紙の ます）＝ 1 文字 1 マス。小さい字も 1 マスを つかう。
function splitCells(w) { return Array.from(w || ''); }

// 拍（はく）＝ 手を たたく かず。
//   ・小さい ゃゅょ だけが 前の字と いっしょで 1 つ（きゃ ＝ 2 もじ 1 拍）
//   ・小さい っ・ん・のばす ー は、それぞれ それだけで 1 つ
// 例：きゃ→1、きって→3、おかあさん→5、ケーキ→3、でんしゃ→3
//
// ★ のばす ー を 前の字に くっつけては いけない。
//   ひらがなの「おとうさん」は「う」を 1 拍と かぞえるのに、
//   カタカナの「ケーキ」だけ 2 拍に なってしまい、
//   子どもに 教える きまりが 表と裏で くいちがう。
function splitMora(w) {
  const out = [];
  for (const c of splitCells(w)) {
    if (out.length > 0 && isSmallKana(c) && !isSokuon(c)) {
      out[out.length - 1] += c;
    } else {
      out.push(c);
    }
  }
  return out;
}
function moraCount(w) { return splitMora(w).length; }

/* ──────────────────────────────────────────────────────────────
   1.6. とくべつな おと（特殊音節）の カリキュラム

   1年生の つまずきを 6 つの ユニットに 分けて、
   「なにが むずかしいのか」を 子どもの ことばで 言いきる。
   ことばは すべて 1年生が 知っている ものだけ。

   ・key    … 保存につかう名まえ
   ・title  … 子どもに見せる名まえ
   ・rule   … おぼえかたの ひとこと（これが この単元の すべて）
   ・words  … れんしゅうに つかう ことば
   ・bad    … ことばごとの「よくある まちがい」（1年生が じっさいに 書く形）
   ・why    … こたえあわせの ひとこと（ふつうは いらない。長音の 例外だけ）
   ・hear   … 耳で 聞きわける 相手（最小対立ペア）。あると 聞きとりの
              もんだいが 出る。つけて よいのは **音が ちがう 単元だけ**
              ＝ 濁音（かぎ／かき）・促音（ねっこ／ねこ）・拗音（きゃく／きく）。
              のばす おと（おとうさん／おとおさん）と くっつきの ことば
              （は／わ）は **音が おなじ** なので、耳では ぜったいに
              きめられない。つけては いけない。
              さしえ（p）は かならず 相手と ちがう ものに する。音が
              つかえない 端末では「えに あう ほう」に 化けるため。
   ────────────────────────────────────────────────────────────── */

// ん・っ・ゃゅょ・のばす・てん/まる・は へ を の 6 ユニット。
const SPECIAL_UNITS = [
  {
    key: 'dakuten', title: 'てん と まる', mark: '゛゜', tone: 'ai', icon: 'pen',
    lead: 'にごる おと', rule: 'みぎうえに てんてん「゛」や まる「゜」を つけると、おとが かわるよ。',
    tips: ['か → が（てんてん）', 'は → ば（てんてん）', 'は → ぱ（まる）'],
    words: [
      { w:'かぎ',   p:'tool',    bad:['かき','がき'], hear:[{ w:'かき', p:'fruit' }] },
      { w:'めがね', p:'tool',    bad:['めかね','めがれ'] },
      { w:'ぶどう', p:'fruit',   bad:['ふどう','ぶとう'] },
      { w:'でんわ', p:'tool',    bad:['てんわ','でんは'] },
      { w:'ぞう',   p:'animal',  bad:['そう','ぞお'] },
      { w:'だんご', p:'sweet',   bad:['たんご','だんこ'] },
      { w:'ひげ',   p:'person',  bad:['ひけ','びげ'] },
      { w:'かばん', p:'bag',     bad:['かはん','がばん'] },
      { w:'えんぴつ', p:'pencil', bad:['えんひつ','えんびつ'] },
      { w:'たんぽぽ', p:'flower', bad:['たんぼぼ','たんほほ'] },
      { w:'ぱんだ', p:'animal',  bad:['ばんだ','はんだ'] },
      { w:'てんぷら', p:'rice',  bad:['てんぶら','てんふら'] },
      { w:'かぶとむし', p:'bug', bad:['かふとむし','がぶとむし'] },
      { w:'じてんしゃ', p:'car', bad:['してんしゃ','じでんしゃ'] },
      { w:'ぎゅうにゅう', p:'drink', bad:['きゅうにゅう','ぎゆうにゅう'] },
      { w:'かがみ', p:'tool',    bad:['かかみ','がかみ'] },
      { w:'ぶらんこ', p:'ball',  bad:['ふらんこ','ぶらんご'] },
      { w:'ざぶとん', p:'cloth', bad:['さぶとん','ざふとん'] },
      { w:'でんき',  p:'light',  bad:['てんき','でんぎ'] },
      { w:'ごはん',  p:'rice',   bad:['こはん','ごばん'] },
      { w:'ぞうきん', p:'tool',  bad:['そうきん','ぞうぎん'] },
      { w:'たまご',  p:'rice',   bad:['たまこ','だまご'] },
      { w:'とんぼ',  p:'bug',    bad:['とんほ','とんぽ'] },
      { w:'げたばこ', p:'school', bad:['けたばこ','げたはこ'] },
      // てんてん・まるが つかない ことば（こたえの かたよりを なくす・§17.9）
      { w:'かき',   p:'fruit',  plain:true, bad:['かぎ','がき'],
        why:'かき に てんてんは つかないよ（かぎ とは べつの ことば）' },
      { w:'かさ',   p:'rain',   plain:true, bad:['がさ','かざ'],
        why:'かさ に てんてんは つかないよ' },
      { w:'はさみ', p:'tool',   plain:true, bad:['ばさみ','はざみ'],
        why:'はさみ に てんてんは つかないよ' },
      { w:'たいこ', p:'music',  plain:true, bad:['だいこ','たいご'],
        why:'たいこ に てんてんは つかないよ' },
    ],
  },
  {
    key: 'hatsuon', title: 'はねる おと', mark: 'ん', tone: 'midori', icon: 'maru',
    lead: 'ん', rule: '「ん」も、ひとつぶんの おと。てを 1 かい たたくよ。',
    tips: ['みかん → み・か・ん（3つ）', 'ん は ことばの はじめには こない'],
    words: [
      { w:'みかん',   p:'fruit',    bad:['みか','みんか'] },
      { w:'りんご',   p:'fruit',    bad:['りご','りんこ'] },
      { w:'ぱん',     p:'rice',     bad:['ぱ','ばん'] },
      { w:'えんぴつ', p:'pencil',   bad:['えぴつ','えんびつ'] },
      { w:'せんせい', p:'person',   bad:['せせい','せんせえ'] },
      { w:'しんぶん', p:'book',     bad:['しぶん','しんぶ'] },
      { w:'でんしゃ', p:'train',    bad:['でしゃ','でんしや'] },
      { w:'にんじん', p:'vegetable',bad:['にじん','にんじ'] },
      { w:'ほん',     p:'book',     bad:['ほ','ほう'] },
      { w:'かんばん', p:'shop',     bad:['かばん','かんぱん'] },
      { w:'てんき',   p:'cloud',    bad:['てき','てんぎ'] },
      { w:'こんにちは', p:'person',  bad:['こにちは','こんにちわ'] },
      { w:'たんぽぽ', p:'flower',   bad:['たぽぽ','たんぼぼ'] },
      { w:'ぶらんこ', p:'ball',     bad:['ぶらこ','ぶらんご'] },
      { w:'しんかんせん', p:'train', bad:['しかんせん','しんかせん'] },
      { w:'こうえん', p:'tree',     bad:['こうえ','こえん'] },
      { w:'みんな',   p:'person',   bad:['みな','みっな'] },
      { w:'さんぽ',   p:'person',   bad:['さぽ','さんぼ'] },
      { w:'ふうせん', p:'ball',     bad:['ふうせ','ふせん'] },
      { w:'げんかん', p:'house',    bad:['げかん','げんか'] },
      { w:'たんじょうび', p:'sweet', bad:['たじょうび','たんじょうひ'] },
      // 「ん」の 入らない ことば（こたえの かたよりを なくす・§17.9）
      { w:'かば',   p:'animal', plain:true, bad:['かばん','かんば'],
        why:'かば に「ん」は つかないよ（かばん とは べつの ことば）' },
      { w:'しか',   p:'animal', plain:true, bad:['しかん','しんか'],
        why:'し・か で おとは 2つ。「ん」は つかないよ' },
      { w:'ふね',   p:'ship',   plain:true, bad:['ふねん','ふんね'],
        why:'ふ・ね で おとは 2つ。「ん」は つかないよ' },
    ],
  },
  {
    key: 'sokuon', title: 'つまる おと', mark: 'っ', tone: 'shu', icon: 'brush',
    lead: 'ちいさい っ', rule: '「っ」は ちいさく かいて、いちど とまる おと。マスは ちゃんと 1 つ つかうよ。',
    tips: ['きって → き・っ・て（3つ）', 'ちいさい っ は みぎしたに ちいさく', 'こえに ださないけれど、たしかに ある おと'],
    words: [
      { w:'きって',   p:'tool',   bad:['きて','きつて'] },
      { w:'がっこう', p:'school', bad:['がこう','がつこう'] },
      { w:'らっぱ',   p:'music',  bad:['らぱ','らつぱ'] },
      { w:'コップ',   p:'drink',  bad:['コプ','コツプ'] },
      { w:'きっぷ',   p:'train',  bad:['きぷ','きつぷ'] },
      { w:'しっぽ',   p:'cat',    bad:['しぽ','しつぽ'] },
      { w:'まっち',   p:'light',  bad:['まち','まつち'], hear:[{ w:'まち', p:'shop' }] },
      { w:'ラッコ',   p:'octopus',bad:['ラコ','ラツコ'] },
      { w:'せっけん', p:'tool',   bad:['せけん','せつけん'] },
      { w:'なっとう', p:'rice',   bad:['なとう','なつとう'] },
      { w:'ポケット', p:'cloth',  bad:['ポケト','ポケツト'] },
      { w:'いっぱい', p:'drink',  bad:['いぱい','いつぱい'] },
      { w:'ざっし',   p:'book',   bad:['ざし','ざつし'] },
      { w:'ばった',   p:'bug',    bad:['ばた','ばつた'] },
      { w:'ろけっと', p:'plane',  bad:['ろけと','ろけつと'] },
      { w:'いっしょ', p:'person', bad:['いしょ','いつしょ'] },
      { w:'ねっこ',   p:'tree',   bad:['ねこ','ねつこ'], hear:[{ w:'ねこ', p:'cat' }] },
      { w:'とっきゅう', p:'train', bad:['ときゅう','とつきゅう'] },
      { w:'あさって', p:'sun',    bad:['あさて','あさつて'] },
      { w:'にっき',   p:'book',   bad:['にき','につき'] },
      { w:'サッカー', p:'ball',   bad:['サカー','サツカー'] },
      { w:'スリッパ', p:'cloth',  bad:['スリパ','スリツパ'] },
      { w:'ロッカー', p:'school', bad:['ロカー','ロツカー'] },
      // ちいさい「っ」の 入らない ことば（こたえの かたよりを なくす・§17.9）
      { w:'ねこ',   p:'cat',    plain:true, bad:['ねっこ','ねつこ'],
        why:'ね・こ で おとは 2つ。ちいさい「っ」は はいらないよ（ねっこ とは べつの ことば）' },
      { w:'まち',   p:'shop',   plain:true, bad:['まっち','まつち'],
        why:'ま・ち で おとは 2つ。ちいさい「っ」は はいらないよ（まっち とは べつの ことば）' },
      { w:'ぶた',   p:'animal', plain:true, bad:['ぶった','ぶつた'],
        why:'ぶ・た で おとは 2つ。ちいさい「っ」は はいらないよ' },
    ],
  },
  {
    key: 'youon', title: 'ねじれる おと', mark: 'ゃゅょ', tone: 'fuji', icon: 'pencil',
    lead: 'ちいさい ゃ ゅ ょ', rule: '「きゃ」は 2 もじで、おとは 1 つ。ちいさい ゃゅょ は ちいさく かくよ。',
    tips: ['きゃ・きゅ・きょ は てを 1 かい たたく', 'ちいさい ゃ と おおきい や は べつの もの', 'でんしゃ → で・ん・しゃ（3つ）'],
    words: [
      { w:'でんしゃ',   p:'train',  bad:['でんしや','でしゃ'] },
      { w:'きんぎょ',   p:'fish',   bad:['きんぎよ','きぎょ'] },
      { w:'ちょう',     p:'bug',    bad:['ちよう','ちょ'] },
      { w:'しゃぼんだま', p:'ball', bad:['しやぼんだま','しゃぼだま'] },
      { w:'おもちゃ',   p:'ball',   bad:['おもちや','おもちゅ'] },
      { w:'きゅうしょく',p:'rice',  bad:['きゆうしょく','きゅうしよく'] },
      { w:'チョコ',     p:'sweet',  bad:['チヨコ','チコ'] },
      { w:'ジュース',   p:'drink',  bad:['ジユース','ジュス'] },
      { w:'びょういん', p:'house',  bad:['びよういん','びょいん'], hear:[{ w:'びよういん', p:'shop' }] },
      { w:'しゅくだい', p:'pencil', bad:['しゆくだい','しくだい'] },
      { w:'にんぎょう', p:'person', bad:['にんぎよう','にんぎょ'] },
      { w:'キャベツ',   p:'vegetable', bad:['キヤベツ','キベツ'] },
      { w:'ちゃわん',   p:'drink',  bad:['ちやわん','ちわん'] },
      { w:'おちゃ',     p:'drink',  bad:['おちや','おち'] },
      { w:'きょうしつ', p:'school', bad:['きようしつ','きょしつ'] },
      { w:'じてんしゃ', p:'car',    bad:['じてんしや','じてしゃ'] },
      { w:'ぎゅうにゅう', p:'drink', bad:['ぎゆうにゅう','ぎゅうにゆう'] },
      { w:'しゃしん',   p:'tool',   bad:['しやしん','ししん'] },
      { w:'びょうき',   p:'person', bad:['びようき','びょき'] },
      { w:'ひゃく',     p:'book',   bad:['ひやく','ひく'] },
      { w:'きゃく',     p:'person', bad:['きやく','きく'], hear:[{ w:'きく', p:'flower' }] },
      { w:'シャツ',     p:'cloth',  bad:['シヤツ','シツ'] },
      { w:'ジャム',     p:'sweet',  bad:['ジヤム','ジム'] },
      // ちいさい ゃゅょ の 入らない ことば（こたえの かたよりを なくす・§17.9）
      { w:'ひよこ',     p:'bird',   plain:true, bad:['ひょこ','ひよっこ'],
        why:'ひ・よ・こ で おとは 3つ。おおきい「よ」だよ' },
      { w:'たいよう',   p:'sun',    plain:true, bad:['たいょう','たいよお'],
        why:'た・い・よ・う で おとは 4つ。おおきい「よ」だよ' },
      { w:'びよういん', p:'shop',   plain:true, bad:['びょういん','びよいん'],
        why:'び・よ・う・い・ん で おとは 5つ。おおきい「よ」だよ（びょういん とは べつの ことば）' },
    ],
  },
  {
    key: 'chouon', title: 'のばす おと', mark: 'ー', tone: 'yamabuki', icon: 'star',
    lead: 'のばして よむ おと', rule: 'ひらがなは「う」や「あ」で のばす。カタカナは ぼう「ー」で のばすよ。',
    tips: ['おとうさん は「お」ではなく「う」', 'おかあさん は「あ」', 'おねえさん は「え」', 'カタカナは ぜんぶ「ー」'],
    words: [
      { w:'おとうさん', p:'person', bad:['おとおさん','おとさん'] },
      { w:'おかあさん', p:'person', bad:['おかーさん','おかわさん'] },
      { w:'おねえさん', p:'person', bad:['おねいさん','おねさん'] },
      { w:'とけい',     p:'tool',   bad:['とけえ','とけ'] },
      { w:'せんせい',   p:'person', bad:['せんせえ','せんせ'] },
      { w:'ほうき',     p:'tool',   bad:['ほおき','ほき'] },
      { w:'ひこうき',   p:'plane',  bad:['ひこおき','ひこき'] },
      { w:'こおり',     p:'snow',   bad:['こうり','こり'], why:'こ・お・り で おとは 3つ。のばす おとを「う」では なく「お」と かく なかま' },
      { w:'おおきい',   p:'mountain', bad:['おうきい','おきい'], why:'お・お・き・い で おとは 4つ。のばす おとを「お」と かく なかま' },
      { w:'とおい',     p:'mountain', bad:['とうい','とい'], why:'と・お・い で おとは 3つ。のばす おとを「お」と かく なかま' },
      { w:'ケーキ',     p:'sweet',  bad:['ケエキ','ケーキー'] },
      { w:'ノート',     p:'book',   bad:['ノオト','ノト'] },
      { w:'ラーメン',   p:'rice',   bad:['ラアメン','ラメン'] },
      { w:'スキー',     p:'snow',   bad:['スキイ','スキ'] },
      { w:'コーヒー',   p:'drink',  bad:['コオヒイ','コヒー'] },
      { w:'ゆうびん',   p:'tool',   bad:['ゆおびん','ゆびん'] },
      { w:'ぼうし',     p:'cloth',  bad:['ぼおし','ぼし'] },
      { w:'きょうしつ', p:'school', bad:['きょおしつ','きょしつ'] },
      { w:'ふうせん',   p:'ball',   bad:['ふおせん','ふせん'] },
      { w:'とうもろこし', p:'vegetable', bad:['とおもろこし','ともろこし'] },
      { w:'こうえん',   p:'tree',   bad:['こおえん','こえん'] },
      { w:'おうさま',   p:'castle', bad:['おおさま','おさま'] },
      { w:'とおり',     p:'car',    bad:['とうり','とり'], why:'と・お・り で おとは 3つ。のばす おとを「お」と かく なかま' },
      { w:'テーブル',   p:'tool',   bad:['テエブル','テブル'] },
      { w:'セーター',   p:'cloth',  bad:['セエター','セター'] },
      { w:'プール',     p:'water',  bad:['プウル','プル'] },
      { w:'チーズ',     p:'rice',   bad:['チイズ','チズ'] },
      // のばさない ことば（こたえの かたよりを なくす・§17.9）
      { w:'おばさん',   p:'person', plain:true, bad:['おばあさん','おばーさん'],
        why:'お・ば・さ・ん で おとは 4つ。のばさないよ（おばあさん とは べつの ことば）' },
      { w:'おじさん',   p:'person', plain:true, bad:['おじいさん','おじーさん'],
        why:'お・じ・さ・ん で おとは 4つ。のばさないよ（おじいさん とは べつの ことば）' },
      { w:'ゆき',       p:'snow',   plain:true, bad:['ゆうき','ゆーき'],
        why:'ゆ・き で おとは 2つ。のばさないよ' },
    ],
  },
  {
    key: 'joshi', title: 'くっつきの ことば', mark: 'はへを', tone: 'sumi', icon: 'book',
    lead: 'は・へ・を', rule: 'ことばと ことばを くっつける「は・へ・を」は、「わ・え・お」と よむよ。',
    tips: ['わたしは → 「わ」と よむけど「は」と かく', 'がっこうへ → 「え」と よむけど「へ」と かく', 'ほんを → 「お」と よむけど「を」と かく',
           'ことばの なかの わ・え・お は そのまま かく（にわとり・こうえん・おにぎり）'],
    /* くっつきの ことばは 文で おぼえる（◯ のところを えらぶ）。

       `plain: true` は **こたえが わ・え・お に なる** 文。
       もとは どの 文も こたえが は・へ・を だったので、文を 読まずに
       「めずらしい ほうの 字」を えらべば ぜんぶ あたって しまい、
       この単元が いちばん 教えたい「くっつきの ことば か どうか」の
       みわけが れんしゅうに ならなかった。
       ことばの なかの わ・え・お（にわとり・こうえん・おにぎり）を
       まぜて、はじめて 文を 読む 必要が 出る。 */
    sentences: [
      { s:'わたし◯ いちねんせいです。', a:'は', c:['は','わ'], p:'person' },
      { s:'ぼく◯ げんきです。',       a:'は', c:['は','わ'], p:'person' },
      { s:'がっこう◯ いきます。',     a:'へ', c:['へ','え'], p:'school' },
      { s:'こうえん◯ あるく。',       a:'へ', c:['へ','え'], p:'tree' },
      { s:'ほん◯ よむ。',             a:'を', c:['を','お'], p:'book' },
      { s:'ごはん◯ たべる。',         a:'を', c:['を','お'], p:'rice' },
      { s:'えんぴつ◯ もつ。',         a:'を', c:['を','お'], p:'pencil' },
      { s:'うみ◯ いく。',             a:'へ', c:['へ','え'], p:'water' },
      { s:'これ◯ ぼくの かさです。',  a:'は', c:['は','わ'], p:'rain' },
      { s:'いえ◯ かえる。',           a:'へ', c:['へ','え'], p:'house' },
      { s:'おかあさん◯ やさしいです。', a:'は', c:['は','わ'], p:'person' },
      { s:'あした◯ にちようびです。', a:'は', c:['は','わ'], p:'sun' },
      { s:'いぬ◯ かわいい。',         a:'は', c:['は','わ'], p:'dog' },
      { s:'きょう◯ はれです。',       a:'は', c:['は','わ'], p:'cloud' },
      { s:'とりが そら◯ とぶ。',      a:'を', c:['を','お'], p:'bird' },
      { s:'ぎゅうにゅう◯ のむ。',     a:'を', c:['を','お'], p:'drink' },
      { s:'くつ◯ はく。',             a:'を', c:['を','お'], p:'cloth' },
      { s:'えほん◯ よむ。',           a:'を', c:['を','お'], p:'book' },
      { s:'えき◯ あるく。',           a:'へ', c:['へ','え'], p:'train' },
      { s:'ともだち◯ てがみを かく。', a:'へ', c:['へ','え'], p:'person' },
      { s:'やま◯ のぼる。',           a:'を', c:['を','お'], p:'mountain' },
      { s:'こうえん◯ はしる。',       a:'を', c:['を','お'], p:'tree' },
      // ここから下は こたえが わ・え・お（ことばの なかの おと）
      { s:'に◯とりが ないた。',       a:'わ', c:['は','わ'], p:'bird',   plain:true,
        why:'「にわとり」の わ は ことばの なか。くっつきの ことばでは ないよ' },
      { s:'か◯で およぐ。',           a:'わ', c:['は','わ'], p:'water',  plain:true,
        why:'「かわ」の わ は ことばの なか。くっつきの ことばでは ないよ' },
      { s:'ひま◯りが さいた。',       a:'わ', c:['は','わ'], p:'flower', plain:true,
        why:'「ひまわり」の わ は ことばの なか。くっつきの ことばでは ないよ' },
      { s:'◯んぴつで かく。',         a:'え', c:['へ','え'], p:'pencil', plain:true,
        why:'「えんぴつ」の え は ことばの なか。くっつきの ことばでは ないよ' },
      { s:'こう◯んで あそぶ。',       a:'え', c:['へ','え'], p:'tree',   plain:true,
        why:'「こうえん」の え は ことばの なか。くっつきの ことばでは ないよ' },
      { s:'◯ほんが すきです。',       a:'え', c:['へ','え'], p:'book',   plain:true,
        why:'「えほん」の え は ことばの なか。くっつきの ことばでは ないよ' },
      { s:'◯にぎりを たべる。',       a:'お', c:['を','お'], p:'rice',   plain:true,
        why:'「おにぎり」の お は ことばの なか。くっつきの ことばでは ないよ' },
      { s:'◯かあさんと あるく。',     a:'お', c:['を','お'], p:'person', plain:true,
        why:'「おかあさん」の お は ことばの なか。くっつきの ことばでは ないよ' },
      { s:'あ◯い そらだ。',           a:'お', c:['を','お'], p:'cloud',  plain:true,
        why:'「あおい」の お は ことばの なか。くっつきの ことばでは ないよ' },
    ],
    words: [],
  },
];
const SPECIAL_UNIT_MAP = {};
SPECIAL_UNITS.forEach(u => { SPECIAL_UNIT_MAP[u.key] = u; });

/* くっつきの ことばの こたえあわせ。
   もとは `unit.tips[0]` を そのまま 出していたので、「を」の もんだいでも
   「へ」の もんだいでも かならず「わたしは →『わ』と よむけど…」と
   出ていた。**といた もんだいと 合わない こたえあわせ**は、1年生には
   ただの ノイズに なる。じょしごとに 言いきる。 */
const JOSHI_WHY = {
  'は': '「わ」と よむけど「は」と かくよ（くっつきの ことば）',
  'へ': '「え」と よむけど「へ」と かくよ（くっつきの ことば）',
  'を': '「お」と よむけど「を」と かくよ（くっつきの ことば）',
};
/* 手あつい ステージで 出す はやみ表（かき → よみ）。
   3 つ ぜんぶを ならべる ことが だいじ。こたえの 1 つだけを 見せると
   「どれを えらぶか」を 教えて しまう。 */
const JOSHI_PAIRS = [['は', 'わ'], ['へ', 'え'], ['を', 'お']];

/* こたえあわせの ひとこと。
   もとは 単元の `rule` を そのまま 出していたので、単元の 中の もんだいは
   ぜんぶ おなじ 文が 出ていた（「また おなじ もんだいだ」と 感じる もと）。
   ことばごとに 拍と マスを 言えば、そのことば の こたえあわせに なる。
   数は かならず §1.5 の `splitMora` / `splitCells` から とる（ただ 1 か所）。
   長音の「お で のばす」ような **ことばごとの わけ** は `wordObj.why` に
   手で 書いておく（あれば そちらを 先に 出す）。 */
function whyFor(unit, wordObj) {
  if (wordObj && wordObj.why) return wordObj.why;
  const m = splitMora(wordObj.w), c = splitCells(wordObj.w);
  return `${m.join('・')} で おとは ${m.length}つ・マスは ${c.length}つ`;
}

// ことばの なかで「とくべつな おと」に あたる マスを 見つける。
// ここが 出題の 穴（ブランク）に なる。見つからなければ 空の 配列。
function specialCellsRawOf(word, unitKey) {
  const cells = splitCells(word);
  const idx = [];
  cells.forEach((c, i) => {
    if (unitKey === 'sokuon'  && isSokuon(c)) idx.push(i);
    if (unitKey === 'youon'   && isYouonSmall(c)) idx.push(i);
    if (unitKey === 'hatsuon' && (c === 'ん' || c === 'ン')) idx.push(i);
    if (unitKey === 'dakuten' && (isDakuonChar(c) || HIRA_HANDAKUON_LIST.includes(c) || KATA_HANDAKUON_LIST.includes(c))) idx.push(i);
    if (unitKey === 'chouon'  && (c === CHOUON_MARK || (i > 0 && 'あいうえおアイウエオ'.indexOf(c) >= 0))) idx.push(i);
  });
  return idx;
}
function specialCellsOf(word, unitKey) {
  const idx = specialCellsRawOf(word, unitKey);
  return idx.length > 0 ? idx : [Math.max(0, splitCells(word).length - 1)];
}
/* その ことばに、この単元の おとが じっさいに 入っているか。
   `plain: true` の ことば（ねこ・かば・おばさん…）は 入っていない。
   マスを 抜く／マスに 書く もんだいは 単元の おとが ないと なりたたないので、
   ここで 出しわける（§17.9）。 */
function hasSpecialSound(word, unitKey) { return specialCellsRawOf(word, unitKey).length > 0; }

/* 穴に する マスを えらぶ。
   1 つだけ 抜くと、のこりの 字が こたえを ほとんど 決めて しまう
   （「が□こう」の 穴は 見なくても っ）。2 つ 抜くと、まぐれで そろう
   見こみが 1/3 → 1/9 に なり、ことばを 頭から 組みたてる 必要が 出る。

   1 つめは かならず **その単元の おと**（`specialCellsOf`）。
   2 つめは その となりを 先に とる（となりが 決まらないと 拗音・長音は
   きまらない：「ちょ」の ょ は ち が 見えて はじめて えらべる）。 */
function specialBlanksFor(word, unitKey, n = 1) {
  const cells = splitCells(word);
  const main = specialCellsOf(word, unitKey);
  const out = [main[0]];
  if (n > 1) {
    const rest = [];
    // となり（うしろ → まえ）→ その単元の 2 つめ → のこり
    for (const d of [1, -1]) { const i = main[0] + d; if (i >= 0 && i < cells.length) rest.push(i); }
    main.slice(1).forEach(i => rest.push(i));
    cells.forEach((c, i) => rest.push(i));
    for (const i of rest) {
      if (out.length >= n) break;
      if (!out.includes(i)) out.push(i);
    }
  }
  return out.sort((a, b) => a - b);
}

// 穴に入れる まちがい候補（にた形・にた おと）をつくる。
const KANA_SMALL_BIG = {
  'ゃ':'や','ゅ':'ゆ','ょ':'よ','っ':'つ','ぁ':'あ','ぃ':'い','ぅ':'う','ぇ':'え','ぉ':'お',
  'ャ':'ヤ','ュ':'ユ','ョ':'ヨ','ッ':'ツ','ァ':'ア','ィ':'イ','ゥ':'ウ','ェ':'エ','ォ':'オ',
};
// おおきい字 → その ちいさい字（「おおきい／ちいさい」の 見わけ表示に つかう）
const KANA_SMALL_BIG_REV = {};
Object.keys(KANA_SMALL_BIG).forEach(s => { KANA_SMALL_BIG_REV[KANA_SMALL_BIG[s]] = s; });
const KANA_DAKU_PLAIN = {
  'が':'か','ぎ':'き','ぐ':'く','げ':'け','ご':'こ','ざ':'さ','じ':'し','ず':'す','ぜ':'せ','ぞ':'そ',
  'だ':'た','ぢ':'ち','づ':'つ','で':'て','ど':'と','ば':'は','び':'ひ','ぶ':'ふ','べ':'へ','ぼ':'ほ',
  'ぱ':'は','ぴ':'ひ','ぷ':'ふ','ぺ':'へ','ぽ':'ほ',
  'ガ':'カ','ギ':'キ','グ':'ク','ゲ':'ケ','ゴ':'コ','ザ':'サ','ジ':'シ','ズ':'ス','ゼ':'セ','ゾ':'ソ',
  'ダ':'タ','ヂ':'チ','ヅ':'ツ','デ':'テ','ド':'ト','バ':'ハ','ビ':'ヒ','ブ':'フ','ベ':'ヘ','ボ':'ホ',
  'パ':'ハ','ピ':'ヒ','プ':'フ','ペ':'ヘ','ポ':'ホ',
};
const KANA_HANDAKU_PAIR = { 'ば':'ぱ','び':'ぴ','ぶ':'ぷ','べ':'ぺ','ぼ':'ぽ','ぱ':'ば','ぴ':'び','ぷ':'ぶ','ぺ':'べ','ぽ':'ぼ',
  'バ':'パ','ビ':'ピ','ブ':'プ','ベ':'ペ','ボ':'ポ','パ':'バ','ピ':'ビ','プ':'ブ','ペ':'ベ','ポ':'ボ' };
const CHOUON_SWAP = { 'う':'お','お':'う','あ':'わ','え':'い','い':'え','ー':'ー' };

/* ことばの「よくある まちがい」から、その マスに 入る まちがい字を とりだす。
   きって／きつて なら 2 マスめが っ／つ。ここは **人が 書いた 教材**（§1.6）
   なので、きまりから 組みたてた 候補より ずっと よい。
   マスの かずが ちがう まちがい（きて＝字が 足りない）は マスに 入らないので のぞく。 */
function cellDistractorsFromBad(wordObj, idx) {
  if (!wordObj || !wordObj.bad) return [];
  const cells = splitCells(wordObj.w);
  const out = [];
  for (const b of wordObj.bad) {
    const bc = splitCells(b);
    if (bc.length !== cells.length) continue;
    let diff = 0;
    for (let i = 0; i < cells.length; i++) if (bc[i] !== cells[i]) diff++;
    if (diff === 1 && bc[idx] !== cells[idx] && !out.includes(bc[idx])) out.push(bc[idx]);
  }
  return out;
}

/* 穴に 入れる 候補を つくる。
   ならびは ①その ことばの まちがい（あれば）②大小の 相手 ③単元の きまり。

   もとは 足りないぶんを `'あいうえおつやゆよんー'` から 順に つめていたので、
   「らっぱ」の 穴に **あ** が ならぶような、1年生が ぜったい 書かない
   候補が 出ていた。まちがい候補が「ありえない」と、子どもは 中身を 見ずに
   のこりから えらべて しまう。**足りなければ へらす**（つめない）。 */
function cellChoicesFor(correct, unitKey, wordObj, idx) {
  const out = [correct];
  const push = (c) => { if (c && c !== correct && !out.includes(c)) out.push(c); };
  cellDistractorsFromBad(wordObj, idx).forEach(push);
  if (isSmallKana(correct)) {
    push(KANA_SMALL_BIG[correct]);            // ちいさい字が正解 → おおきい字を まちがい候補に
  } else {
    /* おおきい字が正解 → ちいさい字を まちがい候補に。
       ただし **つ・やゆよ だけ**。1年生が まちがえて ちいさく 書くのは
       つまる おとと ねじれる おとで、「ちょう」を「ちょぅ」、
       「おとうさん」を「おとぅさん」と 書く子は いない。
       ありえない ふだを ならべると、中身を 見ずに のこりから えらべて しまう。 */
    const small = KANA_SMALL_BIG_REV[correct];
    if (small && (isSokuon(small) || isYouonSmall(small))) push(small);
  }
  if (unitKey === 'dakuten') { push(KANA_DAKU_PLAIN[correct]); push(KANA_HANDAKU_PAIR[correct]); }
  if (unitKey === 'chouon')  { push(CHOUON_SWAP[correct]); push(CHOUON_MARK); }
  if (unitKey === 'hatsuon') { push('ん'); push('つ'); }
  return out.slice(0, 4);
}

/* 「おとは いくつ？」の えらぶ かず。
   もとは いつでも 1..6 の 6 つ ならべていたので、手あつい ステージ
   （えらぶ かずを へらす はずの ところ）でも まぐれ 1/6 のままだった。

   まちがい候補の 主役は **マスの かず**（`splitCells`）。
   「きって」を 3 つでは なく 3 マスぶん…ではなく、「がっこう」を
   4 と こたえて しまう＝マスを かぞえて しまう のが、この単元が
   まさに 教えている まちがい。まぐれで 消さずに、正面から 出す。 */
function countChoicesFor(word, maxChoices) {
  const mora = moraCount(word);
  const cells = splitCells(word).length;
  if (!(maxChoices > 0) || maxChoices >= 6) return COUNT_CHOICES;
  const set = [mora, cells, mora - 1, mora + 1, cells + 1].filter(n => n >= 1 && n <= 8);
  const uniq = Array.from(new Set(set)).sort((a, b) => a - b);
  // かならず こたえを ふくむ（絞りこみで 落ちないように）
  return uniq.includes(mora) ? uniq.slice(0, 4) : [mora, ...uniq].slice(0, 4).sort((a, b) => a - b);
}

/* ──────────────────────────────────────────────────────────────
   1.7. にた かたちの もじ（弁別）

   「ぬ／め」「シ／ツ」のように、1年生が いちばん まちがえる 組みあわせ。
   ここを 見わける れんしゅうを 用意しないと、書けても 読めない ままになる。
   ────────────────────────────────────────────────────────────── */
const CONFUSABLE_SETS = [
  { kana:'hiragana', chars:['ぬ','め'] },
  { kana:'hiragana', chars:['は','ほ','ま'] },
  { kana:'hiragana', chars:['わ','ね','れ'] },
  { kana:'hiragana', chars:['さ','き','ち'] },
  { kana:'hiragana', chars:['る','ろ'] },
  { kana:'hiragana', chars:['い','り'] },
  { kana:'hiragana', chars:['つ','し','く'] },
  { kana:'hiragana', chars:['あ','お','む'] },
  { kana:'hiragana', chars:['こ','い','に'] },
  { kana:'katakana', chars:['シ','ツ'] },
  { kana:'katakana', chars:['ソ','ン'] },
  { kana:'katakana', chars:['ク','ワ','ケ'] },
  { kana:'katakana', chars:['ノ','メ','ヌ'] },
  { kana:'katakana', chars:['ス','ヌ'] },
  { kana:'katakana', chars:['マ','ム'] },
  { kana:'katakana', chars:['チ','テ'] },
  { kana:'katakana', chars:['ア','マ'] },
  { kana:'katakana', chars:['コ','ユ'] },
];
function confusablesOf(char) {
  const hit = CONFUSABLE_SETS.find(s => s.chars.includes(char));
  return hit ? hit.chars.filter(c => c !== char) : [];
}

/* ──────────────────────────────────────────────────────────────
   1.8. まなぶ じゅんばん（やさしい もじ から）

   五十音表は「あ」から ならんでいるが、書きやすさの じゅんでは ない。
   はじめの 1 文字で つまずかせないため、画数の すくない やさしい 字から
   すすめる。表示は 教科書どおり 五十音のまま、すすめる順だけを かえる。
   ────────────────────────────────────────────────────────────── */
const LEARN_ORDER_HIRA = [
  // 1 画
  'く','し','つ','て','の','へ','ひ','る','ろ','ん','そ',
  // 2 画
  'い','う','え','こ','ち','と','ぬ','ね','み','め','ゆ','よ','ら','り','れ','わ','す',
  // 3 画
  'あ','お','か','け','さ','せ','に','は','ま','む','も','や','を',
  // 4 画
  'き','た','な','ふ','ほ',
];
const LEARN_ORDER_KATA = [
  'ノ','フ','ヘ','レ',
  'ア','イ','カ','ク','コ','ス','セ','ソ','ト','ナ','ニ','ヌ','ハ','ヒ','マ','ム','メ','ヤ','ユ','ラ','リ','ル','ワ','ン',
  'ウ','エ','オ','キ','ケ','サ','シ','タ','チ','ツ','テ','ミ','モ','ヨ','ロ','ヲ',
  'ネ','ホ',
];
function learnOrderOf(kanaMode) {
  return kanaMode === 'katakana' ? LEARN_ORDER_KATA : LEARN_ORDER_HIRA;
}

/* ──────────────────────────────────────────────────────────────
   1.85. あたまの おと の ことば（読みの れんしゅうに つかう）

   「あ」→ どの え？ のように、もじと おとを つなぐ 出題に つかう。
   ことばは 1.1 の ことばずかん（WORD_BANK / WORD_BANK_KATA）から
   そのまま とる。ここに ことばの表を 作らないこと。
   ────────────────────────────────────────────────────────────── */
// 先頭の文字 → ことば の 索引をつくる（もじ ↔ え の 出題に つかう）。
// ことばずかん（WORD_BANK / WORD_BANK_KATA）ただ 1 つから 作るので、
// ことばを 足せば 出題も そのまま ふえる。
// 1 もじの ことば（て・め・き）は「あたまの おと」の もんだいに ならない
// ので のぞく（こたえが 出題の もじ そのものに なってしまう）。
const HEAD_WORD_INDEX = (() => {
  const map = {};
  ALL_WORDS.forEach(x => {
    if (x.w.length < 2) return;
    const c = x.w[0];
    if (!map[c]) map[c] = [];
    map[c].push(x);
  });
  return map;
})();
function headWordsOf(char) { return HEAD_WORD_INDEX[char] || []; }
// その文字が ひらがな／カタカナ どちらの なかまか。
// 出題の えらびかたを そろえるために つかう（ひらがなの もんだいに
// カタカナの ことばが まじると、1年生には むずかしすぎる）。
function scriptOf(char) { return KATA_ALL_LIST.includes(char) ? 'katakana' : 'hiragana'; }
function headWordCharsOf(script) {
  return Object.keys(HEAD_WORD_INDEX).filter(c => scriptOf(c) === script);
}

/* ══════════════════════════════════════════════════════════════
   1.86. 多層指導モデル MIM の 考えかたを 入れる

   MIM（Multilayer Instruction Model／海津亜希子）は、読みの つまずきを
   「顕在化する前」に つかまえて、子どもごとに 指導の あつさを かえる
   モデル。とくに 特殊音節（っ・ゃゅょ・のばす おと）に 焦点を あてている
   点が、このアプリの ねらいと そのまま かさなる。

   このアプリに 取り入れたのは 次の 4 つ。

   ① 視覚化（ドット）
      目に見えない「おと」を ●（ドット）で 見えるようにする。
        ねこ  → ● ●
        ねっこ → ● ・ ●   （小さい ● ＝ 音を出さない ところ）
      拗音は 2 もじで ● 1 つ、長音は ● どうしを 線でつなぐ。

   ② 動作化（リズム）
      ・清音・濁音・半濁音 … 手を 1 かい たたく
      ・小さい っ         … 両手を グーに にぎって 音を出さない
      ・のばす おと       … 手を よこに ひっぱる
      道具を使わず 自分の体で ルールを 確かめられるようにする。

   ③ 進みぐあいの ものさし（MIM-PM 型の ちからだめし）
      2 分（1 分 × 2 つ）の みじかい 課題を くりかえし 受けて、
      「正しい ことばを 見つける 速さ」の 変化を 折れ線で 追う。

   ④ 3 つの ステージ（層）で 指導を かえる
      ちからだめしの 結果から、その子に 合う あつさの 指導を 出す。
        1st … みんなと同じ量。ヒントなし
        2nd … 量をしぼり、ドットを つねに出す。2 たくにする。
              こたえた あとに 動作化で たしかめる
        3rd … さらにしぼり、**まず 動作化を 見せてから** といてもらう

      ※ ③ の「まず 見せてから」は、ながく **書いてあるだけ** だった。
        じっさいの コードは こたえた あとにしか リズムを 出しておらず、
        児童むけの せつめい・先生むけの せつめい・この 節 の 3 か所が
        そろって 実装と くいちがっていた。`tierPlan().rhythm` を
        'before' / 'after' / 'none' に して 文言に 合わせた（§18.6）。

   ※ ステージの さかいめ（点数）は このアプリ独自の めやすで、
     MIM の正式な標準得点では ありません。あくまで
     「いま どのくらいの 手あつさが 要りそうか」の 目じるしです。
   ══════════════════════════════════════════════════════════════ */

// かなの「だん（母音）」。長音（のばす おと）かどうかの 判定に つかう。
const VOWEL_ROWS = {
  a: 'あかさたなはまやらわがざだばぱゃァカサタナハマヤラワガザダバパャ',
  i: 'いきしちにひみりぎじぢびぴィキシチニヒミリギジヂビピ',
  u: 'うくすつぬふむゆるぐずづぶぷゅゥクスツヌフムユルグズヅブプュ',
  e: 'えけせてねへめれげぜでべぺェケセテネヘメレゲゼデベペ',
  o: 'おこそとのほもよろごぞどぼぽょォコソトノホモヨロゴゾドボポョ',
};
function vowelOf(kana) {
  for (const v in VOWEL_ROWS) if (VOWEL_ROWS[v].indexOf(kana) >= 0) return v;
  return null;
}
// 「のばす おと」になる くみあわせ（お＋う、え＋い など）
const CHOUON_PAIRS = { a: 'あ', i: 'い', u: 'う', e: 'えい', o: 'おう' };

/* 1 拍ぶんの しゅるいを きめる。ドットの 形と 手の うごきは これで きまる。
     'plain'   … ふつうの おと（手を 1 かい たたく）
     'sokuon'  … つまる おと（グーに にぎる。音は 出さない）
     'youon'   … ねじれる おと（2 もじで 1 かい）
     'chouon'  … のばす おと（手を よこに ひっぱる）
     'hatsuon' … はねる おと（ん。1 かい たたく） */
function moraKinds(word) {
  const moras = splitMora(word);
  return moras.map((m, i) => {
    const chars = splitCells(m);
    const last = chars[chars.length - 1];
    if (isSokuon(m)) return 'sokuon';
    if (m === 'ん' || m === 'ン') return 'hatsuon';
    if (last === CHOUON_MARK) return 'chouon';
    if (chars.length > 1 && isYouonSmall(last)) return 'youon';
    // ひらがなの のばす おと：まえの だんと 合っていれば 長音
    if (chars.length === 1 && i > 0) {
      const prev = moras[i - 1];
      const pv = vowelOf(splitCells(prev)[splitCells(prev).length - 1]);
      if (pv && (CHOUON_PAIRS[pv] || '').indexOf(m) >= 0) return 'chouon';
    }
    return 'plain';
  });
}
const MORA_KIND_INFO = {
  plain:   { label: 'たたく',   hand: 'clap', hint: 'てを 1 かい たたく' },
  hatsuon: { label: 'たたく',   hand: 'clap', hint: '「ん」も 1 かい たたく' },
  youon:   { label: 'まとめて', hand: 'clap', hint: '2 もじ まとめて 1 かい' },
  sokuon:  { label: 'にぎる',   hand: 'fist', hint: 'グーに にぎって おとを ださない' },
  chouon:  { label: 'ひっぱる', hand: 'pull', hint: 'てを よこに ひっぱって のばす' },
};

/* ──────────────────────────────────────────────────────────────
   1.56. ちからだめし（MIM-PM 型）の もんだい

   MIM-PM の テスト①「絵に合うことば探し」に ならって、
     清音 → 濁音・半濁音 → 長音 → 促音 → 拗音 → 拗長音 → カタカナ
   の じゅんを 1 サイクルとして 5 回 くりかえす。
   まちがい選択肢は MIM と同じく
     形が にている／濁点の 有無／語順の 入れかえ／音が にている／
     長音・促音・拗音の あやまり
   から つくる。
   ────────────────────────────────────────────────────────────── */
const MIM_PM_ITEMS = [
  // ── サイクル 1 ──
  { w:'ねこ',        p:'cat',       k:'seion',   bad:['こね','ぬこ'] },
  { w:'めがね',      p:'tool',      k:'dakuon',  bad:['めかね','めがれ'] },
  { w:'おかあさん',  p:'person',    k:'chouon',  bad:['おかさん','おかわさん'] },
  { w:'きって',      p:'tool',      k:'sokuon',  bad:['きて','きつて'] },
  { w:'でんしゃ',    p:'train',     k:'youon',   bad:['でんしや','でしゃ'] },
  { w:'きゅうしょく',p:'rice',      k:'youchou', bad:['きゆうしょく','きゅしょく'] },
  { w:'ケーキ',      p:'sweet',     k:'kata',    bad:['ケエキ','ケーキー'] },
  // ── サイクル 2 ──
  { w:'くるま',      p:'car',       k:'seion',   bad:['るくま','くろま'] },
  { w:'ぱんだ',      p:'animal',    k:'dakuon',  bad:['ばんだ','はんだ'] },
  { w:'とけい',      p:'tool',      k:'chouon',  bad:['とけえ','とけ'] },
  { w:'がっこう',    p:'school',    k:'sokuon',  bad:['がこう','がつこう'] },
  { w:'きんぎょ',    p:'fish',      k:'youon',   bad:['きんぎよ','きぎょ'] },
  { w:'びょういん',  p:'house',     k:'youchou', bad:['びよういん','びょいん'] },
  { w:'ノート',      p:'book',      k:'kata',    bad:['ノオト','ノトー'] },
  // ── サイクル 3 ──
  { w:'たいこ',      p:'music',     k:'seion',   bad:['こいた','たいご'] },
  { w:'ぶどう',      p:'fruit',     k:'dakuon',  bad:['ふどう','ぶとう'] },
  { w:'おとうさん',  p:'person',    k:'chouon',  bad:['おとおさん','おとさん'] },
  { w:'らっぱ',      p:'music',     k:'sokuon',  bad:['らぱ','らつぱ'] },
  { w:'おもちゃ',    p:'ball',      k:'youon',   bad:['おもちや','おもちゅ'] },
  { w:'ちょうちょ',  p:'bug',       k:'youchou', bad:['ちようちょ','ちょちょ'] },
  { w:'ラーメン',    p:'rice',      k:'kata',    bad:['ラアメン','ラメーン'] },
  // ── サイクル 4 ──
  { w:'さかな',      p:'fish',      k:'seion',   bad:['かさな','さがな'] },
  { w:'えんぴつ',    p:'pencil',    k:'dakuon',  bad:['えんひつ','えんびつ'] },
  { w:'こおり',      p:'snow',      k:'chouon',  bad:['こうり','こり'] },
  { w:'しっぽ',      p:'cat',       k:'sokuon',  bad:['しぽ','しつぽ'] },
  { w:'しゅくだい',  p:'pencil',    k:'youon',   bad:['しゆくだい','しくだい'] },
  { w:'きょうしつ',  p:'school',    k:'youchou', bad:['きようしつ','きょしつ'] },
  { w:'コップ',      p:'drink',     k:'kata',    bad:['コプ','コツプ'] },
  // ── サイクル 5 ──
  { w:'はさみ',      p:'tool',      k:'seion',   bad:['さはみ','はざみ'] },
  { w:'だんご',      p:'sweet',     k:'dakuon',  bad:['たんご','だんこ'] },
  { w:'おねえさん',  p:'person',    k:'chouon',  bad:['おねいさん','おねさん'] },
  { w:'なっとう',    p:'rice',      k:'sokuon',  bad:['なとう','なつとう'] },
  { w:'しゃぼんだま',p:'ball',      k:'youon',   bad:['しやぼんだま','しゃぼだま'] },
  { w:'にんぎょう',  p:'person',    k:'youchou', bad:['にんぎよう','にんぎょ'] },
  { w:'スキー',      p:'snow',      k:'kata',    bad:['スキイ','スキ'] },
  // ── サイクル 6 ──
  { w:'つくえ',      p:'tool',      k:'seion',   bad:['くつえ','つくね'] },
  { w:'かぎ',        p:'tool',      k:'dakuon',  bad:['かき','かに'] },
  { w:'ぼうし',      p:'cloth',     k:'chouon',  bad:['ぼおし','ぼし'] },
  { w:'せっけん',    p:'tool',      k:'sokuon',  bad:['せけん','せつけん'] },
  { w:'おちゃ',      p:'drink',     k:'youon',   bad:['おちや','おちゅ'] },
  { w:'きょうりゅう',p:'animal',    k:'youchou', bad:['きようりゅう','きょりゅう'] },
  { w:'クレヨン',    p:'pencil',    k:'kata',    bad:['クレオン','クレヨ'] },
  // ── サイクル 7 ──
  { w:'ひまわり',    p:'flower',    k:'seion',   bad:['ひわまり','ひまわに'] },
  { w:'たんぽぽ',    p:'flower',    k:'dakuon',  bad:['たんぼぼ','たんほほ'] },
  { w:'ゆうびん',    p:'tool',      k:'chouon',  bad:['ゆおびん','ゆびん'] },
  { w:'きっぷ',      p:'train',     k:'sokuon',  bad:['きぷ','きつぷ'] },
  { w:'ちゃわん',    p:'drink',     k:'youon',   bad:['ちやわん','ちゃおん'] },
  { w:'しょうがっこう',p:'school',  k:'youchou', bad:['しようがっこう','しょがっこう'] },
  { w:'ポケット',    p:'cloth',     k:'kata',    bad:['ポケト','ポケツト'] },
  // ── サイクル 8 ──
  { w:'かぶとむし',  p:'bug',       k:'seion',   bad:['かぶむとし','かぶとむに'] },
  { w:'かばん',      p:'bag',       k:'dakuon',  bad:['かはん','かばに'] },
  { w:'おおきい',    p:'mountain',  k:'chouon',  bad:['おうきい','おきい'] },
  { w:'いっぱい',    p:'drink',     k:'sokuon',  bad:['いぱい','いつぱい'] },
  { w:'じゃんけん',  p:'person',    k:'youon',   bad:['じやんけん','じゃけん'] },
  { w:'ぎゅうにゅう',p:'drink',     k:'youchou', bad:['ぎゆうにゅう','ぎゅにゅう'] },
  { w:'コーヒー',    p:'drink',     k:'kata',    bad:['コオヒイ','コーヒ'] },
];

/* テスト②「3つの ことば さがし」。
   くぎりの ない かなの ならびを 見て、ことばの きれめに 線を いれる。
   まとまりで 読む ちから（流暢性）を みる。 */
const MIM_PM_CHUNKS = [
  ['あかい','かさ','とけい'],
  ['ねこ','がっこう','ほん'],
  ['でんしゃ','みかん','そら'],
  ['おかあさん','りんご','うみ'],
  ['きって','さかな','やま'],
  ['ちょうちょ','はな','いぬ'],
  ['せんせい','つくえ','まど'],
  ['らっぱ','たいこ','うた'],
  ['おもちゃ','はこ','いす'],
  ['ゆき','こおり','さむい'],
  ['あめ','かさ','ながぐつ'],
  ['きゅうしょく','ぎゅうにゅう','パン'],
  ['ふうせん','いぬ','はしる'],
  ['にわとり','たまご','あさ'],
  ['しんかんせん','えき','きっぷ'],
  ['きょうしつ','こくばん','つくえ'],
  ['てがみ','ポスト','ゆうびん'],
  ['おにいさん','おねえさん','いもうと'],
  ['なつやすみ','うみ','すいか'],
  ['あかい','きいろ','あおい'],
  ['じてんしゃ','こうえん','ともだち'],
  ['えんぴつ','けしごむ','ノート'],
  ['おはよう','ありがとう','さようなら'],
  ['おおきい','ちいさい','ながい'],
];

/* ──────────────────────────────────────────────────────────────
   1.57. ステージ（層）の 判定

   ちからだめしの 点数と、ふだんの とくべつな おとの 正答ぐあいから、
   いま その子に 合う 指導の あつさを きめる。
   ※ さかいめの 数字は このアプリ独自の めやす。
   ────────────────────────────────────────────────────────────── */
const KEY_MIM = 'kkm_v4_mim';   // ちからだめしの きろく
const MIM_TIER_INFO = {
  1: { key:1, name:'1st ステージ', short:'ふつう',   tone:'midori',
       desc:'みんなと おなじ すすみかたで だいじょうぶ。',
       teacher:'通常の量で進めます。ヒントは出さず、まちがえたぶんだけ復習に回します。' },
  2: { key:2, name:'2nd ステージ', short:'すこし ていねい', tone:'ai',
       desc:'ドットを つねに だして、といた あとに リズムで たしかめるよ。',
       teacher:'語数をしぼり、ドット（視覚化）を常時表示、選択肢を2つに減らし、解答後に動作化（リズム）で確認させます。' },
  3: { key:3, name:'3rd ステージ', short:'とても ていねい', tone:'shu',
       desc:'まず リズムを みてから、ゆっくり といて いこう。',
       teacher:'語数をさらにしぼり、毎問ドット＋動作化（リズム）を先に見せてから解答させます。' },
};
// ちからだめし 1 かいぶんの 点数から ステージを きめる
function tierFromScore(total) {
  if (total >= 12) return 1;
  if (total >= 6)  return 2;
  return 3;
}
// ふだんの とくべつな おとの あたりぐあい（ちからだめし いがい の めやす）
function specialRateOf(skill) {
  let ok = 0, ng = 0;
  for (const id in (skill || {})) {
    if (id.indexOf('s:') !== 0) continue;
    ok += skill[id].ok || 0; ng += skill[id].ng || 0;
  }
  return { n: ok + ng, rate: ok + ng > 0 ? ok / (ok + ng) : 0 };
}
/* いまの ステージ。

   もとは ちからだめしを 1 かい 受けると、**つぎの ちからだめし（2 しゅうかん後）
   まで 指導の あつさが 一切 変わらなかった**。README は「MIM の いちばんの
   核心は、アセスメントと 指導が つながっていること」と 書いているのに、
   のびても つまずいても 14 日 そのままに なる。

   ちからだめしの けっかを 土台に して、ふだんの あたりぐあいが
   はっきり ずれている ときだけ **1 だん だけ** ずらす。
   毎日 ゆれると 先生が 見て わからなく なるので、
   ・20 もん いじょう こたえている ことを 条件に する
   ・さかいめは これまでと おなじ 0.8 / 0.55
   ・ずらすのは ±1 まで（ちからだめしの けっかを 大きくは こえない）
   ちからだめしの きろく（mim.log）そのものは さわらない。 */
function currentTier(mim, skill) {
  const last = (mim?.log || [])[(mim?.log || []).length - 1];
  const { n, rate } = specialRateOf(skill);
  if (!last) {
    // まだ 受けていないときは、とくべつな おとの 成績から おおまかに
    if (n < 10) return 1;                  // データが すくないうちは ふつう
    if (rate >= 0.8) return 1;
    if (rate >= 0.55) return 2;
    return 3;
  }
  if (n < 20) return last.tier;            // 見きわめるには まだ 少ない
  const shift = rate >= 0.8 ? -1 : rate < 0.55 ? 1 : 0;
  return Math.max(1, Math.min(3, last.tier + shift));
}
// ステージごとの 出題の あつさ
/* `sizeHint`：えらぶ ボタンに「ちいさい／おおきい」と 書きそえるか。
   これは 足場なので、手あつい ステージだけ。1st で 出すと
   「っ と つ、どっち？」の こたえを そのまま 教えて しまう。

   `words`（つかう ことばの かず）は ステージが 上がるほど しぼる。
   これは README §2 の ねらいどおり。ただし 3rd を 2 語に すると
   「つづけて おなじ ことばを 出さない」と かならず A-B-A-B に
   なって しまうので 3 語に する。3 語 × 4 かたち＝12 とおり あるので
   4 もんの あいだ 組みあわせは 一度も かさならない。

   `formats`（つかう もんだいの かたち）は §17.9 の 台帳の かぎ。 */
/* `rhythm`：動作化（リズム）を いつ 見せるか。
     'before' … こたえる まえ（3rd ステージ。MIM_TIER_INFO と §1.86 の
                「まず 動作化を 見せてから といてもらう」は これ）
     'after'  … こたえた あと（もう いちど 体に 入れてから つぎへ）
     'none'   … 出さない */
function tierPlan(tier) {
  if (tier >= 3) return { count: 4, words: 3,  maxChoices: 2, blanks: 1, dots: true,  rhythm: 'before', sizeHint: true,
                          formats: ['spell', 'fill', 'count', 'listenCount', 'write'] };
  if (tier === 2) return { count: 5, words: 5,  maxChoices: 2, blanks: 2, dots: true,  rhythm: 'after',  sizeHint: true,
                          formats: ['spell', 'fill', 'count', 'listenCount', 'listenPair', 'write'] };
  return              { count: 6, words: 12, maxChoices: 3, blanks: 2, dots: false, rhythm: 'none',   sizeHint: false,
                          formats: ['spell', 'fill', 'count', 'listenCount', 'listenPair', 'write'] };
}
// ちからだめしを すすめる とき（はじめて／2 しゅうかん あいた）
const MIM_CHECK_INTERVAL_DAYS = 14;
function mimCheckDue(mim) {
  const log = mim?.log || [];
  if (log.length === 0) return true;
  return dayNumber() - (log[log.length - 1].day || 0) >= MIM_CHECK_INTERVAL_DAYS;
}

/* ══════════════════════════════════════════════════════════════
   1.9. わすれないための しくみ（かんかくを あけて ふくしゅう）

   おぼえた ことは 何もしないと わすれる。だから このアプリは
   「1 かい できた」で 終わりにせず、日を あけて もういちど 出す。

     はこ 0 → きょう       （まちがえた ものは ここに もどる）
     はこ 1 → あした
     はこ 2 → 2 日ご
     はこ 3 → 4 日ご
     はこ 4 → 1 しゅうかんご
     はこ 5 → 2 しゅうかんご
     はこ 6 → 1 かげつご（もう だいじょうぶ）

   できたら はこが 1 つ すすみ、まちがえたら はこ 0 に もどる。
   これを「よむ ちから」と「とくべつな おと」の りょうほうに つかう。
   ══════════════════════════════════════════════════════════════ */
const KEY_SKILL   = 'kkm_v4_skill';    // ふくしゅうの はこ（SRS）
const KEY_DAYLOG  = 'kkm_v4_daylog';   // 日ごとの がんばり（はんこカレンダー）

const SRS_INTERVALS = [0, 1, 2, 4, 7, 14, 30];   // はこ → 何日あける
const SRS_MAX_BOX = SRS_INTERVALS.length - 1;

// item id のつけかた（アプリ全体で これだけ）
//   よむ：        'r:あ'
//   とくべつ：    's:sokuon:きって'
//   にたもの：    'c:ぬ'
//   なかま：      'g:animal'
//   はんたい：    'o:おおきい'
function srsIdRead(char)          { return 'r:' + char; }
function srsIdSpecial(unit, word) { return 's:' + unit + ':' + word; }
function srsIdConfuse(char)       { return 'c:' + char; }
function srsIdGroup(groupKey)     { return 'g:' + groupKey; }
function srsIdOpposite(word)      { return 'o:' + word; }

function dayNumber(d = new Date()) {
  // ローカル時間の「日」を通し番号にする（時刻のずれで前後しないように）
  return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000);
}
function srsNew() { return { box: 0, due: dayNumber(), ok: 0, ng: 0 }; }
function srsAnswer(rec, correct) {
  const cur = rec || srsNew();
  const box = correct ? Math.min(SRS_MAX_BOX, (cur.box || 0) + 1) : 0;
  return {
    box,
    due: dayNumber() + SRS_INTERVALS[box],
    ok: (cur.ok || 0) + (correct ? 1 : 0),
    ng: (cur.ng || 0) + (correct ? 0 : 1),
  };
}
function srsIsDue(rec) { return !rec || (rec.due ?? 0) <= dayNumber(); }
// おぼえた（もう しばらく 出さなくてよい）と 言える はこ
const SRS_LEARNED_BOX = 3;
function srsIsLearned(rec) { return (rec?.box || 0) >= SRS_LEARNED_BOX; }
/* にがて＝まちがえた まま、まだ 1 かいも やりなおせていない もの。

   もとは `box <= 1` を にがてと していた。ところが はこ 1 は
   「きょう できた → つぎは あした」の じょうたい で、**その日は もう
   出題されない**（`srsIsDue` が false）。つまり ふくしゅうを やりきっても
   ホームの「にがてを やっつける」は その日じゅう 消えず、
   「やっても へらない」画面に なっていた。

   はこ 0 だけを にがてと すれば、
     まちがえる → はこ 0（にがて・きょう また 出る）
     できた     → はこ 1（にがて から 外れる・あした また 出る）
   と なり、ふだの ふえかたと 画面の 見た目が そろう。 */
function srsIsWeak(rec) { return !!rec && (rec.ng || 0) >= 1 && (rec.box || 0) === 0; }

/* ──────────────────────────────────────────────────────────────
   1.95. きょうの めあて（3 つだけ）

   「なにを どこまで やれば おわりか」が 見えないと、子どもは 自分から
   はじめられない。毎日 おなじ 3 つ、5 分で おわる 量にする。
   ────────────────────────────────────────────────────────────── */
const MISSIONS = [
  /* `go` は 画面に わたす おまけ。ふくしゅうは 押した とたんに
     「ぜんぶ まぜて」が はじまる（コースを えらぶ 画面を はさまない）。 */
  { key: 'review',  goal: 6, title: 'ふくしゅう',       sub: 'まえに やった もんだい',   view: 'sound',   go: 'mix', tone: 'midori', icon: 'check' },
  { key: 'write',   goal: 2, title: 'もじを かく',       sub: 'あたらしい じ を 1つ',     view: 'write',   tone: 'ai',     icon: 'pen' },
  { key: 'special', goal: 6, title: 'とくべつな おと',   sub: 'っ ゃゅょ ん のばす',      view: 'special', tone: 'shu',    icon: 'brush' },
];
function emptyDayRecord() { return { review: 0, write: 0, special: 0, words: 0, check: 0, done: false }; }
/* きょうの めあての 数。
   「とくべつな おと」は **1 セットぶん**が めあて なので、ステージで
   出題数が かわる ぶん（6 / 5 / 4）を そのまま めあてに する。
   6 で 決めうちに していると、手あつい 指導を うけている 子ほど
   リングを 閉じるのに 2 セット やらされる ことに なっていた。 */
function missionGoal(m, tier) {
  if (m.key === 'special') return tierPlan(tier).count;
  return m.goal;
}
function isDayComplete(rec, tier = 1) {
  if (!rec) return false;
  return MISSIONS.every(m => (rec[m.key] || 0) >= missionGoal(m, tier));
}

/* ──────────────────────────────────────────────────────────────
   2.0. 画面の色（キャンバス用）

   色の定義は index.html の CSS 変数ただ 1 か所。ここでは読み出すだけにして、
   キャンバス（お手本・書いた線）と HTML で ぜったいに ちがう色にならない
   ようにする。読めない環境のために ひかえの値を持っておく。

   ※ 書体は HTML 側の --kkm-font-kyokasho だけで決まる。お手本は
     かきじゅんデータ（KanjiVG）から描くので、キャンバスに文字は出さない。
   ────────────────────────────────────────────────────────────── */
const __cssVarCache = {};
function themeColor(name, fallback) {
  if (__cssVarCache[name] != null) return __cssVarCache[name];
  let v = '';
  try { v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); } catch (e) {}
  __cssVarCache[name] = v || fallback;
  return __cssVarCache[name];
}

/* ──────────────────────────────────────────────────────────────
   2. 音と演出
   ────────────────────────────────────────────────────────────── */
let audioCtx = null;
let voiceEnabled = true; // 音声OFFのときは効果音もすべて止める
function initAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
function playTone(freq, type, duration, vol = 0.1) {
  if (!voiceEnabled || !audioCtx) return;
  try {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, audioCtx.currentTime);
    g.gain.setValueAtTime(vol, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}
/* せいかいの 音。
   れんぞくで あたるほど 音が 半音ずつ 上がっていく（4 つぶんまで）。
   おなじ 音を くり返すより「つづけて あてたい」が つよく なる。
   まちがえると コンボは 0 に もどるので、音も もとの 高さに もどる。 */
const playPingPong = (streak = 0) => {
  initAudio();
  const up = Math.pow(2, Math.min(streak, 4) / 12);   // 半音 × コンボ数
  playTone(659.25 * up, 'sine', 0.15, 0.1);
  setTimeout(() => playTone(880 * up, 'sine', 0.3, 0.1), 100);
};
const playBuzzer   = () => { initAudio(); playTone(150, 'square', 0.2, 0.05); };
const playFanfare  = () => { initAudio(); [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => setTimeout(() => playTone(f, 'sine', 0.4, 0.15), i*150)); };
const playPickup   = () => { initAudio(); playTone(880, 'sine', 0.1); setTimeout(() => playTone(1108, 'sine', 0.15), 80); };
const playBadge    = () => { initAudio(); [659.25, 783.99, 987.77, 1318.5].forEach((f, i) => setTimeout(() => playTone(f, 'triangle', 0.3, 0.12), i*120)); };

// 音声よみあげ（Web Speech API）
// voices ロードが非同期のブラウザでは初回呼び出し時点で空配列が返ることが
// あるため、null を「キャッシュ未確定」として扱う。`voiceschanged` で再取得。
let cachedJaVoice = null;
function getJaVoice() {
  if (cachedJaVoice) return cachedJaVoice;
  if (!window.speechSynthesis) return null;
  const voices = speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null; // 未ロード：キャッシュしない
  cachedJaVoice = voices.find(v => v.lang && v.lang.startsWith('ja')) || null;
  return cachedJaVoice;
}
/* この 端末で「耳の もんだい」を 出して よいか。
   聞きとりの もんだいは 音が ないと **原理的に とけない** ので、
   出す まえに かならず ここを 見る（§17.9 の `usable`）。
   声の 一覧は おそく 読みこまれる ことが あるので、まだ 無いときは
   「無い」と あつかう（安全側）。voiceschanged で つぎの 回から 拾う。 */
function ttsAvailable() {
  try {
    return !!(typeof window !== 'undefined' && window.speechSynthesis && getJaVoice());
  } catch (e) { return false; }
}
// 同じテキストを連打しても無音にならないよう、直前と同じ場合は何もしない。
// 異なるテキストのときだけ cancel する。
let lastSpeakText = '';
let lastSpeakAt = 0;
function speakText(text, enabled = true) {
  if (!enabled || !voiceEnabled || !text || !window.speechSynthesis) return;
  try {
    const now = performance.now();
    // 同一テキストを 250ms 以内に連打したら無視（Safari で無音化するのを防ぐ）
    if (text === lastSpeakText && now - lastSpeakAt < 250) return;
    // 別テキストのときだけ、いま喋っている音をキャンセル
    if (text !== lastSpeakText && speechSynthesis.speaking) speechSynthesis.cancel();
    lastSpeakText = text; lastSpeakAt = now;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ja-JP';
    u.rate = 0.9;
    u.pitch = 1.1;
    const v = getJaVoice(); if (v) u.voice = v;
    u.onend = () => { lastSpeakText = ''; };
    u.onerror = () => { lastSpeakText = ''; };
    speechSynthesis.speak(u);
  } catch (e) {}
}

// 触覚フィードバック（対応端末のみ。OFF は voiceEnabled に追従）
function vibrate(pattern) {
  if (!voiceEnabled) return;
  try { navigator.vibrate && navigator.vibrate(pattern); } catch (e) {}
}
const hapticTick    = () => vibrate(8);
const hapticOk      = () => vibrate(12);
const hapticErr     = () => vibrate([24, 40, 24]);
const hapticTriumph = () => vibrate([40, 30, 60]);

function burstConfetti() {
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;
  if (document.hidden) return; // バックグラウンドでは動かさない
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssW = window.innerWidth, cssH = window.innerHeight;
  canvas.width  = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
  canvas.style.width  = cssW + 'px';
  canvas.style.height = cssH + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  // 和の色（朱・金・藍・若竹・和紙）。にぎやかすぎない色みでそろえる。
  const colors = ['#c85a3c','#d97e65','#d9a840','#e8c470','#6081a6','#6d9872','#eae2d2'];
  const particles = Array.from({ length: 80 }, () => ({
    x: cssW/2, y: cssH/2,
    r: Math.random()*8+4,
    dx: Math.random()*12-6, dy: Math.random()*-12-4,
    color: colors[Math.floor(Math.random()*colors.length)],
    tilt: Math.random()*0.07+0.05, ang: 0
  }));
  function render() {
    // タブが隠れたら描画を止める。このとき消しておかないと、最後のコマが
    // 画面に貼りついたまま残り、戻ってきたとき紙吹雪が固まって見える。
    if (document.hidden) { ctx.clearRect(0,0,cssW,cssH); return; }
    ctx.clearRect(0,0,cssW,cssH);
    let active = 0;
    particles.forEach(p => {
      p.ang += p.tilt;
      p.y += (Math.cos(p.ang)+1+p.r/2)/2;
      p.x += Math.sin(p.ang)*2 + p.dx;
      p.dy += 0.15; p.y += p.dy;
      if (p.y <= cssH) active++;
      ctx.beginPath(); ctx.lineWidth = p.r; ctx.strokeStyle = p.color;
      ctx.moveTo(p.x+p.r, p.y); ctx.lineTo(p.x, p.y+p.r); ctx.stroke();
    });
    if (active > 0) requestAnimationFrame(render);
    else ctx.clearRect(0,0,cssW,cssH);
  }
  render();
}

/* ──────────────────────────────────────────────────────────────
   3. KanjiVG
   ────────────────────────────────────────────────────────────── */
/* KanjiVG の線の太さ（109 座標系）。
   お手本・書き順アニメの両方でこの値をつかい、子どもが書く線の太さ
   （マスの 0.07 ＝ 109 座標系で 約7.6）と ほぼ そろえてある。
   こうすると なぞった線が お手本を ちょうど おおいかくす。 */
const KVG_STROKE_W = 7;

/* かきじゅんデータは アプリの中に 持っている（data/kanjivg-kana.js）。

   もとは 使うたびに cdn.jsdelivr.net から とってきていた。
   ところが 学校のネットワークは そこを ふさいでいることがある。
   ふさがれると お手本も かきじゅんアニメも なぞり書きも 出ないまま、
   児童からは「こわれている」としか 見えない。しかも 原因は アプリの外に
   あるので 先生が しらべても わからない。
   ひらがな・カタカナ 176文字ぶんで 49KB しか ないので、
   まるごと 持ってしまうほうが よい。これで 電波が なくても 動く。

   データを つくりなおす： npm run kanjivg
   よび出し側は これまでどおり await して よいように、形は そのままにしてある。 */
/* KanjiVG に 無い 字を ここで 手で 持つ。

   「ー」は かなでは ないので KanjiVG の 176 字に 入っていない。
   でも のばす おとの 単元で 書かせたい ので、よこ 1 画を 自前で 書く。
   ざひょうけいは KanjiVG と おなじ 109 × 109。

   ⚠️ 手本が まっすぐな 線 1 本なので、かたちの 採点は ゆるく なる
      （だいたい よこ線なら 通る）。`scoreSpecialWrite` の がわで
      「かたむきが よこから ±20 どいない」「ながさが マスの はんぶん
      いじょう」を 別に 見て おぎなう。ほかの 字ほど 厳しくは できない。
   ※ data/kanjivg-kana.js は `npm run kanjivg` の 生成物なので
     そちらに 書いては いけない（つぎの 生成で 消える）。 */
const EXTRA_KANA_PATHS = { 'ー': ['M 20,54 L 89,54'] };

/* ══════════════════════════════════════════════════════════════
   3.45. ちいさい字は マスの みぎしたの へやに

   1年生の ノートでは、ちいさい じ（っ ゃ ゅ ょ …）は マスを 4 つに
   わった **みぎしたの へや**に 小さく 書く。アプリでも `KanaCell` と
   `WriteCell` が その へやを 朱色の 点線で 見せている。

   ところが お手本の もとに している KanjiVG は、ちいさい字を
   「すこし 小さく・すこし 下」に 置いて いるだけで **よこは まん中**。
   （実測・109 の ざひょうけい：っ は 中心 (53,73)、ゃ は (56,64)。
     みぎしたの へやの 中心は (77,77)。）
   その ため「かく」画面では、点線の へやと お手本が くいちがい、
   ちいさい字を まん中に 書いても お手本どおりに なって しまっていた。

   お手本・なぞりの めじるし・かきじゅんアニメ・採点は **ぜんぶ この
   関数が 返す パスから** 出ている。だから ここで へやに 入れれば、
   どの 画面でも 言うことが そろう。

   ※ KanjiVG の パスは `M`（絶対）と `c`（相対 3 次ベジェ）しか つかって
     いない（176 字ぜんぶ 確認ずみ）。だから 絶対の M だけ ずらし、
     相対の c は 倍率だけ かければ よい。知らない 命令が 出てきたら
     さわらずに もとの パスを 返す。
   ══════════════════════════════════════════════════════════════ */
// KanaCell / WriteCell の 点線と おなじ へや（109 の ざひょうけい）
const SMALL_ROOM = { x0: 54.5, y0: 54.5, x1: 100.3, y1: 100.3 };
const SMALL_ROOM_FILL = 0.92;          // へやいっぱいだと きゅうくつなので すこし あける

function kvgNumFmt(v) { return String(Math.round(v * 100) / 100); }
// パスを s 倍して (tx,ty) ずらす。あつかえない 命令が あれば null。
function transformKvgPath(d, s, tx, ty) {
  const tok = String(d).match(/[A-Za-z]|-?\d*\.?\d+/g);
  if (!tok) return null;
  const out = [];
  let i = 0;
  while (i < tok.length) {
    const cmd = tok[i++];
    if (cmd === 'M') {                                   // 絶対：倍率＋ずらし
      if (i + 1 >= tok.length) return null;
      out.push('M', kvgNumFmt(+tok[i++] * s + tx), kvgNumFmt(+tok[i++] * s + ty));
    } else if (cmd === 'c') {                            // 相対：倍率だけ
      out.push('c');
      while (i < tok.length && !/[A-Za-z]/.test(tok[i])) out.push(kvgNumFmt(+tok[i++] * s));
    } else {
      return null;                                       // 知らない 命令
    }
  }
  return out.join(' ');
}

const __smallKanaCache = {};
function placeSmallKana(char, paths) {
  if (__smallKanaCache[char]) return __smallKanaCache[char];
  // 手本の 外わくを 測る（sampleSvgPath は 0..1 で かえす）
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const d of paths) {
    for (const p of sampleSvgPath(d, 24)) {
      if (p.x < x0) x0 = p.x; if (p.x > x1) x1 = p.x;
      if (p.y < y0) y0 = p.y; if (p.y > y1) y1 = p.y;
    }
  }
  if (!isFinite(x0) || x1 <= x0 || y1 <= y0) return paths;   // 測れないときは そのまま
  x0 *= 109; x1 *= 109; y0 *= 109; y1 *= 109;
  const roomW = (SMALL_ROOM.x1 - SMALL_ROOM.x0) * SMALL_ROOM_FILL;
  const roomH = (SMALL_ROOM.y1 - SMALL_ROOM.y0) * SMALL_ROOM_FILL;
  const s = Math.min(roomW / (x1 - x0), roomH / (y1 - y0));
  // 字の まん中を へやの まん中に あわせる
  const tx = (SMALL_ROOM.x0 + SMALL_ROOM.x1) / 2 - ((x0 + x1) / 2) * s;
  const ty = (SMALL_ROOM.y0 + SMALL_ROOM.y1) / 2 - ((y0 + y1) / 2) * s;
  const moved = paths.map(d => transformKvgPath(d, s, tx, ty));
  if (moved.some(d => !d)) return paths;                     // 1 つでも だめなら さわらない
  __smallKanaCache[char] = moved;
  return moved;
}

/* ══════════════════════════════════════════════════════════════
   3.46. 画面に 出す ちいさい字も みぎしたの へやへ

   §3.45 で なおしたのは **お手本の パス**（かきじゅんアニメ・なぞり・
   採点）。けれど もんだいの マス（`KanaCell`）が 出しているのは
   フォントの 字 そのもので、そこは 手つかずの ままだった。

   書体は ちいさい字を「すこし 小さく・すこし 下」に 置くだけで、
   よこは ほぼ まん中。その ため マスの 中では
     ・朱色の 点線の へや（みぎした）は 空のまま
     ・字は へやの 外（まん中）
   と なり、「ちいさい じは この へやに 書く」と 教えている そばから
   お手本の ならびが そう なっていなかった。

   ずらす 量を 数で 書いておくことは できない。この アプリの 書体は
   端末に あるものを つかう ならび（UD デジタル教科書体／游教科書体／
   Klee One／ゴシック・§index.html）で、どれが 当たるかで 字の
   すみずみが かわるから。そこで **その 場で 字を 測って** へやに
   合わせる。measureText の actualBoundingBox は 字の インクの
   すみずみを かえすので、書体が かわっても ずれない。

   ⚠️ Klee One は あとから とどく Web フォント。とどいた ところで
      測りなおす（`document.fonts.ready`）。測れない ブラウザでは
      これまでどおり まん中に 出す（字が 消えるより ましなので）。
   ══════════════════════════════════════════════════════════════ */
const KVG_UNIT = 109;            // KanjiVG の ざひょうけい（マス 1 つぶん）
const GLYPH_INK_EM = 100;        // 測るときの フォントサイズ

// 1em を 1 とした 字の インクの すみずみ。測れないときは null。
const __glyphInkCache = new Map();
function measureGlyphInk(char) {
  if (__glyphInkCache.has(char)) return __glyphInkCache.get(char);
  let ink = null;
  try {
    const ctx = document.createElement('canvas').getContext('2d');
    const stack = getComputedStyle(document.documentElement)
      .getPropertyValue('--kkm-font-kyokasho').trim();
    ctx.font = `400 ${GLYPH_INK_EM}px ${stack || 'sans-serif'}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const m = ctx.measureText(char);
    // actualBoundingBoxLeft / Ascent は「置いた ところから 左／上へ 何 px」
    const x0 = -m.actualBoundingBoxLeft,  x1 = m.actualBoundingBoxRight;
    const y0 = -m.actualBoundingBoxAscent, y1 = m.actualBoundingBoxDescent;
    if ([x0, x1, y0, y1].every(Number.isFinite) && x1 > x0 && y1 > y0) {
      ink = { x0: x0 / GLYPH_INK_EM, y0: y0 / GLYPH_INK_EM,
              x1: x1 / GLYPH_INK_EM, y1: y1 / GLYPH_INK_EM };
    }
  } catch { ink = null; }
  __glyphInkCache.set(char, ink);
  return ink;
}

// Web フォントが とどいたら 測りなおす（それまでは 代わりの 書体の 数）
let __glyphFontsReady = typeof document === 'undefined' || !document.fonts;
const __glyphInkWaiters = new Set();
if (!__glyphFontsReady) {
  document.fonts.ready.then(() => {
    __glyphFontsReady = true;
    __glyphInkCache.clear();
    const fns = [...__glyphInkWaiters];
    __glyphInkWaiters.clear();
    fns.forEach(fn => fn());
  }).catch(() => { __glyphFontsReady = true; });
}
function useGlyphInk(char) {
  const [, bump] = useState(0);
  useEffect(() => {
    if (__glyphFontsReady) return;
    const fn = () => bump(n => n + 1);
    __glyphInkWaiters.add(fn);
    return () => { __glyphInkWaiters.delete(fn); };
  }, []);
  return char ? measureGlyphInk(char) : null;
}

// 字の インクを へやの まん中に そろえる（かえすのは KanjiVG と おなじ 109 の ざひょう）
function fitInkToSmallRoom(ink) {
  const roomW = (SMALL_ROOM.x1 - SMALL_ROOM.x0) * SMALL_ROOM_FILL;
  const roomH = (SMALL_ROOM.y1 - SMALL_ROOM.y0) * SMALL_ROOM_FILL;
  const inkW = ink.x1 - ink.x0, inkH = ink.y1 - ink.y0;
  const fontSize = Math.min(roomW / inkW, roomH / inkH);
  // ベースラインの 置きどころ（インクの まん中が へやの まん中に くるように）
  const x = (SMALL_ROOM.x0 + SMALL_ROOM.x1) / 2 - (ink.x0 + inkW / 2) * fontSize;
  const y = (SMALL_ROOM.y0 + SMALL_ROOM.y1) / 2 - (ink.y0 + inkH / 2) * fontSize;
  return { fontSize, x, y };
}

// 字の かきじゅん（同期）。生成データ → 手で 持つ ぶん の じゅんに 引く。
function kanaPathsOf(char) {
  const table = (typeof globalThis !== 'undefined' && globalThis.KANJIVG_KANA) || null;
  const paths = (table && table[char]) || EXTRA_KANA_PATHS[char];
  if (!paths || !paths.length) return null;
  // ちいさい字は みぎしたの へやへ（§3.45）
  return isSmallKana(char) ? placeSmallKana(char, paths) : paths;
}

const kanjiPathsCache = {};
async function fetchKanjiVG(char) {
  if (kanjiPathsCache[char]) return kanjiPathsCache[char];
  const paths = kanaPathsOf(char);
  if (!paths) return null;                    // 表に無い文字（呼び出し側が null を見る）
  kanjiPathsCache[char] = paths;
  return paths;
}
/* ──────────────────────────────────────────────────────────────
   3.5. 採点ロジック（独自）

   1年生でも納得感のあるフィードバックを返すために、ピクセル一致では
   なく「筆跡そのもの」の幾何的特徴で採点する。

   呼び出し側で画数（ストローク数）が一致していることを保証してから
   呼ぶこと（画数違反は採点せず、別途やり直しフローを起こす）。

   観点と配点（合計100点。scoreHandwriting の items と必ずそろえること）：
     ・せんの かたち      30点（お手本の線とどれだけ重なっているか）★主役
     ・かきじゅん         15点（画の順番だけを見る）
     ・はじめと むき      15点（画ごとの始点の位置 + 向きベクトル）
     ・おおきさ・いち     20点（バウンディングボックスの大きさ・中心）
     ・マスの つかいかた  10点（マスを4等分した部屋の使い方）
     ・せんの こうさ      10点（必要な交差ペアの有無）

   「せんの かたち」が主役。ほかの観点は 始点・外形・部屋といった あらい特徴
   しか見ないので、これが無いと「外形のなかを ぐちゃぐちゃ」でも高得点に
   なってしまう（じっさい 花丸が出ていた）。配点を変えるときは、かたちの
   比重を いちばん重いままにしておくこと。

   戻り値：{ total, breakdown:[{key,label,score,max,status,advice}], comment, passed }
   ────────────────────────────────────────────────────────────── */

// SVG パス文字列を N 点にサンプリングして [{x,y}] in [0..1] で返す
// 計測のたびに body へ <svg> を挿入していたが、レイアウトを誘発するため
// アプリ寿命を通じて使い回す「画面外の単一の SVG」へ集約する。
// さらに (d, n) をキーに結果をキャッシュして、同じ文字を何度書いても
// 一回しか計算しないようにする。
const __svgMeasureSvg = (() => {
  if (typeof document === 'undefined') return null;
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
  svg.style.position = 'absolute';
  svg.style.left = '-9999px'; svg.style.top = '-9999px';
  svg.style.visibility = 'hidden';
  svg.setAttribute('aria-hidden', 'true');
  // mount 時に body へ挿入（実 DOM に居ないと getTotalLength の結果が
  // ブラウザによって不正確になる）
  if (document.body) document.body.appendChild(svg);
  else document.addEventListener('DOMContentLoaded', () => document.body.appendChild(svg), { once: true });
  return svg;
})();
const __sampleCache = new Map();      // key: `${n}|${d}` → [{x,y}]
const __startEndCache = new Map();    // key: d → {s:{x,y}, e:{x,y}}
const __pathLengthCache = new Map();  // key: d → number (109 座標系)
function sampleSvgPath(d, n) {
  if (!d || !__svgMeasureSvg) return [];
  const key = `${n}|${d}`;
  const cached = __sampleCache.get(key);
  if (cached) return cached;
  const svgNS = 'http://www.w3.org/2000/svg';
  const p = document.createElementNS(svgNS, 'path');
  p.setAttribute('d', d);
  __svgMeasureSvg.appendChild(p);
  const len = p.getTotalLength();
  __pathLengthCache.set(d, len);
  const pts = [];
  if (len > 0 && n >= 2) {
    for (let i = 0; i < n; i++) {
      const t = (i / (n - 1)) * len;
      const pt = p.getPointAtLength(t);
      pts.push({ x: pt.x / 109, y: pt.y / 109 });
    }
  }
  __svgMeasureSvg.removeChild(p);
  __sampleCache.set(key, pts);
  return pts;
}

// 近すぎる点を間引く（ノイズと計算量を減らす）
function simplifyPoints(pts) {
  if (!pts || pts.length === 0) return [];
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const prev = out[out.length - 1];
    if (Math.hypot(pts[i].x - prev.x, pts[i].y - prev.y) > 0.005) out.push(pts[i]);
  }
  if (out.length === 1 && pts.length > 1) out.push(pts[pts.length - 1]);
  return out;
}

// 点列を「長さの割合」で n 等分して取りなおす（0..1 の座標のまま）。
// お手本（sampleSvgPath）も同じ取りかたなので、k 番目どうしを
// そのまま比べられる＝「同じ進みぐあいの場所」で見くらべられる。
function resamplePolyline(poly, n) {
  if (!poly || poly.length < 2 || n < 2) return null;
  const cum = [0];
  for (let i = 1; i < poly.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(poly[i].x - poly[i - 1].x, poly[i].y - poly[i - 1].y));
  }
  const total = cum[cum.length - 1];
  if (!(total > 0)) return null;
  const out = [];
  let j = 1;
  for (let k = 0; k < n; k++) {
    const target = (total * k) / (n - 1);
    while (j < cum.length - 1 && cum[j] < target) j++;
    const seg = cum[j] - cum[j - 1];
    const t = seg > 0 ? (target - cum[j - 1]) / seg : 0;
    out.push({
      x: poly[j - 1].x + (poly[j].x - poly[j - 1].x) * t,
      y: poly[j - 1].y + (poly[j].y - poly[j - 1].y) * t,
    });
  }
  return out;
}

// マスを4等分した部屋番号（0:TL, 1:TR, 2:BL, 3:BR）
function quadrantOf(p) {
  return (p.x >= 0.5 ? 1 : 0) | (p.y >= 0.5 ? 2 : 0);
}
// 線の長さで重み付けした「部屋ごとの存在割合」を返す（合計1）
// 「点が部屋にあるか」だけでなく「どれだけ書いているか」で測るので、
// 真ん中に小さく書いて4部屋を通過しただけ、では満点にならない。
function roomDensity(polys) {
  const bins = [0, 0, 0, 0];
  let total = 0;
  for (const poly of polys) {
    for (let i = 1; i < poly.length; i++) {
      const a = poly[i - 1], b = poly[i];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      if (len === 0) continue;
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      bins[quadrantOf(mid)] += len;
      total += len;
    }
  }
  if (total === 0) return bins;
  return bins.map(v => v / total);
}

// 2線分の交差判定（端点接触は除外）
function segmentsCross(a1, a2, b1, b2) {
  const sgn = (v) => v > 1e-9 ? 1 : v < -1e-9 ? -1 : 0;
  const o = (p, q, r) => sgn((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
  const o1 = o(a1, a2, b1), o2 = o(a1, a2, b2);
  const o3 = o(b1, b2, a1), o4 = o(b1, b2, a2);
  return o1 !== 0 && o2 !== 0 && o3 !== 0 && o4 !== 0 && o1 !== o2 && o3 !== o4;
}
function polylinesCross(p, q) {
  for (let i = 0; i < p.length - 1; i++) {
    for (let j = 0; j < q.length - 1; j++) {
      if (segmentsCross(p[i], p[i+1], q[j], q[j+1])) return true;
    }
  }
  return false;
}
function crossPairSet(polys) {
  const pairs = new Set();
  for (let i = 0; i < polys.length; i++) {
    for (let j = i + 1; j < polys.length; j++) {
      if (polylinesCross(polys[i], polys[j])) pairs.add(`${i},${j}`);
    }
  }
  return pairs;
}

/* 観点⓪：かたち（0..1）── いちばん大事な観点

   画ごとに、お手本の線と じっさいに書いた線を「同じ進みぐあいの場所」で
   くらべ、どれだけ離れているかをはかる。

   ＜これが無かったころの問題＞
   ほかの観点は、始点・終点・マスの部屋・外形しか見ていなかった。そのため
     ・曲がるところを 直線で ずぼらに書く
     ・外形のなかを ぐちゃぐちゃに ぬりつぶす
     ・下から上へ 逆向きに 書く
   でも高い点が出てしまい、じっさい「ぐちゃぐちゃ」で花丸が取れていた。
   線そのものを くらべることで、この 3 つが いちどに ふせげる。

   進みぐあいの順にくらべる（k 番目どうし）ので、逆向き・順番ちがいは
   自動的に大きく離れ、点が下がる。

   ＜位置ずれは ここでは見ない＞
   字ぜんたいが おなじだけ ずれているぶんは、先に打ち消してから くらべる。
   「書く場所」は『おおきさ・いち』と『はじめと むき』が すでに見ているので、
   ここでも数えると 1 つのミスを 3 回減点することになってしまう。
   打ち消すのは「ぜんたいの平行移動」だけなので、字のかたちが ちがう
   （ぐちゃぐちゃ・逆向き・直線ですます）ときは どう動かしても重ならず、
   ちゃんと 0 点に近づく。

   ＜戻り値＞
   点数（score）だけでなく、画ごとの内訳（perStroke）も返す。
   赤ペン添削（§3.6）が「どの画の どこが いちばん ずれたか」を
   そのまま しるしに するので、ここで いちど 測ったものを 使いまわす。 */
const SHAPE_N = 24;          // くらべる点の数（お手本のサンプル数とそろえる）
const SHAPE_FREE = 0.03;     // これくらいのズレは 1年生なら ふつう（減点しない）
const SHAPE_SPAN = 0.13;     // ここまで離れると 0 点（マスの 1/8 ほど）
const SHAPE_SHIFT_CAP = 0.045; // 打ち消してよい「字ぜんたいの平行移動」の上限
function analyzeShape(usrPolys, tplPolys) {
  const none = { score: 0, perStroke: [], dx: 0, dy: 0 };
  const n = Math.min(usrPolys.length, tplPolys.length);
  if (n === 0) return none;
  const clamp01 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;

  // ① 画ごとに「同じ進みぐあいの場所」の点をそろえ、あわせて平行移動ぶんを出す
  const pairs = [];
  let dx = 0, dy = 0, m = 0;
  for (let i = 0; i < n; i++) {
    const t = tplPolys[i];
    if (!t || t.length < 2) continue;
    const tp = t.length === SHAPE_N ? t : resamplePolyline(t, SHAPE_N);
    const up = resamplePolyline(usrPolys[i], SHAPE_N);
    if (!tp || !up) continue;
    pairs.push({ i, up, tp });
    for (let k = 0; k < SHAPE_N; k++) { dx += up[k].x - tp[k].x; dy += up[k].y - tp[k].y; m++; }
  }
  if (pairs.length === 0 || m === 0) return none;
  dx /= m; dy /= m;
  // 打ち消すのは「すこしのズレ」まで。字ぜんたいが大きくずれているのは
  // かたち以前の問題なので、ここでも きちんと点が下がるようにする。
  const shift = Math.hypot(dx, dy);
  if (shift > SHAPE_SHIFT_CAP) { const k = SHAPE_SHIFT_CAP / shift; dx *= k; dy *= k; }

  // ② 平行移動ぶんを取りのぞいて、線どうしの離れぐあいをはかる
  const perStroke = [];
  for (const pair of pairs) {
    const { up, tp } = pair;
    let mean = 0, worst = 0, worstIdx = 0;
    for (let k = 0; k < SHAPE_N; k++) {
      const d = Math.hypot(up[k].x - dx - tp[k].x, up[k].y - dy - tp[k].y);
      mean += d;
      if (d > worst) { worst = d; worstIdx = k; }
    }
    mean /= SHAPE_N;
    // ふだんのズレ（平均）と、いちばん外れたところ（最大）の両方を見る。
    // 平均が良くても 1 か所だけ大きく外れていれば、そのぶん下がる。
    const meanScore  = clamp01(1 - (mean  - SHAPE_FREE) / SHAPE_SPAN);
    const worstScore = clamp01(1 - (worst - SHAPE_FREE * 2) / (SHAPE_SPAN * 2.2));
    perStroke.push({
      i: pair.i, up, tp, mean, worst, worstIdx,
      score: 0.75 * meanScore + 0.25 * worstScore,
    });
  }
  // 画ごとの点は「ならし」だけでなく「いちばん悪い画」も見る。
  // ならしだけだと、3画のうち 2画が上手なら 1画がまるで違っていても
  // 隠れてしまう。1画でも大きくずれていれば ちゃんと点が下がるようにする。
  const avg = perStroke.reduce((a, b) => a + b.score, 0) / perStroke.length;
  const worstStroke = Math.min(...perStroke.map(s => s.score));
  return { score: 0.72 * avg + 0.28 * worstStroke, perStroke, dx, dy };
}

// 観点①-a：かきじゅん（純粋な順番のみ）（0..1）
// ユーザーの i 番目の画の始点が、お手本の「i 番目の画の始点」に最も近いかを判定。
// 順番が正しい限り、書き始めの位置が多少ズレても満点。
function evalStrokeSequence(usrPolys, tplPolys) {
  const n = Math.min(usrPolys.length, tplPolys.length);
  if (n === 0) return 0;
  const tplStarts = tplPolys.map(t => (t && t.length > 0) ? t[0] : null);
  let sum = 0, cnt = 0;
  for (let i = 0; i < n; i++) {
    const u = usrPolys[i];
    const tStart = tplStarts[i];
    if (!u || u.length === 0 || !tStart) continue;
    const us = u[0];
    const correctDist = Math.hypot(us.x - tStart.x, us.y - tStart.y);
    let bestDist = Infinity;
    for (const ts of tplStarts) {
      if (!ts) continue;
      const d = Math.hypot(us.x - ts.x, us.y - ts.y);
      if (d < bestDist) bestDist = d;
    }
    if (correctDist <= bestDist + 1e-6) {
      // 正しい順番（i 番目のお手本始点が最近傍）
      sum += 1.0;
    } else {
      // 他の画のほうが近い：相対距離で部分点
      sum += (bestDist + 0.02) / (correctDist + 0.02);
    }
    cnt++;
  }
  return cnt === 0 ? 0 : sum / cnt;
}

// 観点①-b：はじめと むき（0..1）
// 画ごとの「書き始めの位置」と「向き」がお手本と合っているかを評価。
function evalStrokeStartAndDir(usrPolys, tplPolys) {
  const n = Math.min(usrPolys.length, tplPolys.length);
  if (n === 0) return 0;
  let sum = 0, cnt = 0;
  for (let i = 0; i < n; i++) {
    const u = usrPolys[i], t = tplPolys[i];
    if (u.length < 2 || t.length < 2) continue;
    const us = u[0], ue = u[u.length - 1];
    const ts = t[0], te = t[t.length - 1];
    // 始点距離：0.22（マスの 1/4 強）以上ズレたら 0 点
    const ds = Math.hypot(us.x - ts.x, us.y - ts.y);
    const posScore = Math.max(0, 1 - ds / 0.22);
    // 向きベクトルの cos 類似度を [0..1] にマップ（逆向きで 0）
    const uvx = ue.x - us.x, uvy = ue.y - us.y;
    const tvx = te.x - ts.x, tvy = te.y - ts.y;
    const ul = Math.hypot(uvx, uvy), tl = Math.hypot(tvx, tvy);
    let dirScore = 0.5;
    if (ul > 0.01 && tl > 0.01) {
      const cos = (uvx * tvx + uvy * tvy) / (ul * tl);
      dirScore = Math.max(0, cos);
    }
    // 位置と向きを乗算で結合（位置が大きく外れた画は向きが合っていても部分点止まり）
    const per = dirScore * (0.25 + 0.75 * posScore);
    sum += per;
    cnt++;
  }
  return cnt === 0 ? 0 : sum / cnt;
}

// 観点②：部屋の使い方（0..1）
// 線長で重み付けした 4部屋の分布を、お手本とユーザーで比較する（TVD ベース）。
// 「ちょこっと部屋を横切る」では満点にならず、各部屋にどれだけ書いている
// かで採点される。
function evalRooms(usrPolys, tplPolys) {
  const dt = roomDensity(tplPolys);
  const du = roomDensity(usrPolys);
  const ts = dt.reduce((a, b) => a + b, 0);
  const us = du.reduce((a, b) => a + b, 0);
  if (ts === 0 && us === 0) return 1;
  if (ts === 0 || us === 0) return 0;
  // 全変動距離（TVD）：0=完全一致、1=完全に違う分布
  let tvd = 0;
  for (let i = 0; i < 4; i++) tvd += Math.abs(dt[i] - du[i]);
  tvd = tvd / 2;
  // 厳しめに：TVD=0.3 で半分くらいの点になるよう指数で曲げる
  return Math.max(0, Math.pow(1 - tvd, 1.4));
}

// 観点③：線の交差（0..1）
function evalCrossings(usrPolys, tplPolys) {
  const t = crossPairSet(tplPolys);
  const u = crossPairSet(usrPolys);
  if (t.size === 0 && u.size === 0) return 1;
  let inter = 0;
  for (const k of u) if (t.has(k)) inter++;
  if (t.size === 0) {
    // 不要な交差を作ってしまった → 1本あたり 30% 減点（最低 0）
    return Math.max(0, 1 - u.size * 0.3);
  }
  const precision = u.size === 0 ? 0 : inter / u.size;
  const recall    = inter / t.size;
  if (precision + recall === 0) return 0;
  return (2 * precision * recall) / (precision + recall);
}

// 点列全体の外形（無ければ null）
function bboxOfPolys(polys) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, n = 0;
  for (const poly of polys || []) for (const p of poly) {
    if (p.x < x0) x0 = p.x;
    if (p.x > x1) x1 = p.x;
    if (p.y < y0) y0 = p.y;
    if (p.y > y1) y1 = p.y;
    n++;
  }
  return n === 0 ? null : { x0, y0, x1, y1 };
}

// 観点④：おおきさ・いち（0..1）
// サイズと中心ズレを「相乗平均」で結合する（どちらかが破綻したら全体が落ちる）。
//
// ＜なおした不具合＞
// もとは「一辺 0.65〜0.95・中心はマスのまんなか」という決めうちの数字で
// 測っていた。しかし正しく書いても
//   ・「し」「へ」「つ」…… 字によって幅・高さは大きくちがう
//   ・「っ」「ゃ」…… 小書き文字は小さく、右下に寄せて書くのが正しい
// ため、きちんと書けているのに大きく減点されてしまっていた。
// お手本（KanjiVG）そのものの外形とくらべるように直した。
function evalBalance(usrPolys, tplPolys) {
  const ub = bboxOfPolys(usrPolys);
  if (!ub) return 0;
  // お手本が取れないときだけ、これまでどおり「マスいっぱい・まんなか」を目安に
  const tb = bboxOfPolys(tplPolys) || { x0: 0.15, y0: 0.15, x1: 0.85, y1: 0.85 };
  const tw = tb.x1 - tb.x0, th = tb.y1 - tb.y0;
  const uw = ub.x1 - ub.x0, uh = ub.y1 - ub.y0;
  // 大きさ：お手本にたいする比率で見る。0.8〜1.25 倍なら満点。
  // 小さすぎは二次関数で大きく減点（縮こまって書くくせを直したいため）。
  const sizeOk = (u, t) => {
    if (t < 0.02) return 1;               // ほぼ点の画は大きさを問わない
    const r = u / t;
    if (r >= 0.8 && r <= 1.25) return 1;
    if (r < 0.8) { const k = r / 0.8; return Math.max(0, k * k); }
    return Math.max(0, 1 - (r - 1.25) / 0.5);
  };
  const sizeScore = (sizeOk(uw, tw) + sizeOk(uh, th)) / 2;
  const ucx = (ub.x0 + ub.x1) / 2, ucy = (ub.y0 + ub.y1) / 2;
  const tcx = (tb.x0 + tb.x1) / 2, tcy = (tb.y0 + tb.y1) / 2;
  const cd = Math.hypot(ucx - tcx, ucy - tcy);
  // お手本の中心からのズレ 0.18（マスの 1/5 弱）以上で 0 点
  const centerScore = Math.max(0, 1 - cd / 0.18);
  return Math.sqrt(sizeScore * centerScore);
}

function adviceFor(key, raw) {
  const good = raw >= 0.85, ok = raw >= 0.6;
  if (good) return 'ばっちり！';
  switch (key) {
    case 'order':     return ok ? 'もうすこし じゅんばんを たしかめてね' : 'かきじゅんを みなおして もう いっかい！';
    case 'startdir':  return ok ? 'はじめの ばしょと むきを みなおそう' : 'はじめの ばしょと えんぴつの むきに きをつけてね';
    case 'rooms':     return ok ? 'マスを もうちょっと ひろく つかおう' : 'すみずみまで つかえる ように しよう';
    case 'crossings': return ok ? 'せんの かさなる ところを ていねいに' : 'せんを ちゃんと かさねて かこう';
    case 'balance':   return ok ? 'まんなかに かくと きれいだよ' : 'マスの まんなかに おおきく かこう';
    case 'shape':     return ok ? 'おてほんの せんに もうすこし ちかづけよう' : 'おてほんを よく みて、せんの かたちを まねしよう';
  }
  return '';
}

/* ──────────────────────────────────────────────────────────────
   3.6. 赤ペン添削（採点の理由を 目に見える しるしに する）

   なぜ 要るのか
   --------------------------------------------------------------
   採点の うちわけは 文字で 出していたが、1年生は まだ ひらがなを
   おぼえている 最中なので、「はじめの ばしょ むきを みなおそう」を
   読んで 自分の 字の どこが そうなのかを 結びつけられない。
   （読める子でも、6 行の 表から 直すところを 選ぶのは むずかしい。）

   そこで 先生が 赤ペンで ○ を つけるのと おなじことを 画面でやる。
   ・自分が 書いた 字の うえに、直すところを 赤い しるしで 指す
   ・しるしは **ひとつの 観点だけ**。いちばん 点の ひくい ところを 選ぶ
   ・よく 書けた 画には 赤い チェックを つけて ほめる

   しるしは すべて 0..1 の マス座標で 返し、SVG 側（<RedPenReview>）が
   109 座標系（KanjiVG と同じ）に なおして 描く。
   ────────────────────────────────────────────────────────────── */

// 2線分の交わる点（交わらないときは null）
function segmentCrossPoint(a1, a2, b1, b2) {
  const d = (a2.x - a1.x) * (b2.y - b1.y) - (a2.y - a1.y) * (b2.x - b1.x);
  if (Math.abs(d) < 1e-12) return null;
  const t = ((b1.x - a1.x) * (b2.y - b1.y) - (b1.y - a1.y) * (b2.x - b1.x)) / d;
  const u = ((b1.x - a1.x) * (a2.y - a1.y) - (b1.y - a1.y) * (a2.x - a1.x)) / d;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return { x: a1.x + (a2.x - a1.x) * t, y: a1.y + (a2.y - a1.y) * t };
}
function polylinesCrossPoint(p, q) {
  for (let i = 0; i < p.length - 1; i++) {
    for (let j = 0; j < q.length - 1; j++) {
      const pt = segmentCrossPoint(p[i], p[i+1], q[j], q[j+1]);
      if (pt) return pt;
    }
  }
  return null;
}
/* 観点ごとの「なおしかた」。

   文は 短く・ひらがなだけ・「なにを どうする」の かたちで そろえる。
   だいじなのは、**文が かならず 自分の しるしの 形を 名ざしする**こと
   （「あかい ○ から」「あかい わくに」…）。こうしておくと、いくつ
   ならんでも、どの文が 絵の どの しるしの ことか 迷わずに たどれる。 */
const REVIEW_FIX_TEXT = {
  shape:     { title: 'せんの かたち',     text: 'あかい せんの ように まげて かこう' },
  order:     { title: 'かきじゅん',         text: 'あかい ばんごうの じゅんに かこう' },
  startdir:  { title: 'はじめと むき',     text: 'あかい ○ から やじるしの むきに かこう' },
  balance:   { title: 'おおきさ・いち',     text: 'あかい わくに ぴったり かこう' },
  rooms:     { title: 'マスの つかいかた', text: 'あかい へやにも かこう' },
  crossings: { title: 'せんの こうさ',     text: 'あかい ○ の ところで せんを かさねよう' },
};

/* いちどに 出す なおすところの 上限。

   ぜんぶ 出すと 赤だらけに なって、1年生には「ぜんぶ だめだった」と
   しか 見えない。点を いちばん 落としている ところから 3 つまでに する。 */
const REVIEW_MAX_FIXES = 3;
// これより 下がったら「なおすところ」に 出す
const REVIEW_FIX_THRESHOLD = 0.8;

/* 観点ひとつぶんの 赤ペンの しるしを つくる。しるしが 置けなければ null。 */
function marksForFix(key, ctx) {
  const { usrPolys, tplPolys, worstShape } = ctx;

  if (key === 'shape') {
    if (!worstShape) return null;
    // お手本の その画を 赤で なぞって 見せ、いちばん ずれた ところを ○ で かこむ
    return [
      { kind: 'trace', pts: worstShape.tp },
      { kind: 'ring', at: worstShape.up[worstShape.worstIdx], r: 0.11 },
    ];
  }

  if (key === 'startdir') {
    // 始点と 向きが いちばん あやしい 画を さがす
    let bad = null, badScore = Infinity;
    const n = Math.min(usrPolys.length, tplPolys.length);
    for (let i = 0; i < n; i++) {
      const u = usrPolys[i], t = tplPolys[i];
      if (!u || u.length < 2 || !t || t.length < 2) continue;
      const ds = Math.hypot(u[0].x - t[0].x, u[0].y - t[0].y);
      const uv = { x: u[u.length-1].x - u[0].x, y: u[u.length-1].y - u[0].y };
      const tv = { x: t[t.length-1].x - t[0].x, y: t[t.length-1].y - t[0].y };
      const ul = Math.hypot(uv.x, uv.y), tl = Math.hypot(tv.x, tv.y);
      const cos = (ul > 0.01 && tl > 0.01) ? (uv.x*tv.x + uv.y*tv.y) / (ul*tl) : 0.5;
      const s = Math.max(0, cos) * Math.max(0, 1 - ds / 0.22);
      if (s < badScore) { badScore = s; bad = t; }
    }
    if (!bad) return null;
    // 矢印は 画の はじめの 4割ぶん。長すぎると 字が 見えなくなる
    const to = bad[Math.max(1, Math.round((bad.length - 1) * 0.4))];
    return [
      { kind: 'ring', at: bad[0], r: 0.075 },
      { kind: 'arrow', from: bad[0], to },
    ];
  }

  if (key === 'order') {
    // 正しい じゅんばんを、お手本の 書きはじめに 番号で ふる
    const out = [];
    tplPolys.forEach((t, i) => {
      if (!t || t.length === 0 || i >= 6) return;
      out.push({ kind: 'num', at: t[0], text: String(i + 1) });
    });
    return out.length ? out : null;
  }

  if (key === 'balance') {
    const tb = bboxOfPolys(tplPolys);
    if (!tb) return null;
    /* わくは お手本の 外がわに すこし ふくらませて 引く。
       ぴったり 引くと、たてに ながい 字では わくの たて線が 字の 線と
       かさなり、線が 点線に なったように 見えてしまう（実際に そう見えた）。 */
    const pad = 0.03;
    const cl = (v) => Math.min(0.99, Math.max(0.01, v));
    return [{ kind: 'box', style: 'target', box: {
      x0: cl(tb.x0 - pad), y0: cl(tb.y0 - pad), x1: cl(tb.x1 + pad), y1: cl(tb.y1 + pad),
    } }];
  }

  if (key === 'rooms') {
    // お手本より 書けていない 部屋を ぬる（いちばん 足りない ところ ひとつ）
    const dt = roomDensity(tplPolys), du = roomDensity(usrPolys);
    let q = -1, gap = 0.06;
    for (let i = 0; i < 4; i++) { if (dt[i] - du[i] > gap) { gap = dt[i] - du[i]; q = i; } }
    return q >= 0 ? [{ kind: 'quad', q }] : null;
  }

  if (key === 'crossings') {
    // お手本では 交わるのに 自分の字では 交わっていない ところ を ○ で 指す
    const u = crossPairSet(usrPolys);
    for (let i = 0; i < tplPolys.length; i++) {
      for (let j = i + 1; j < tplPolys.length; j++) {
        if (!polylinesCross(tplPolys[i], tplPolys[j]) || u.has(`${i},${j}`)) continue;
        const pt = polylinesCrossPoint(tplPolys[i], tplPolys[j]);
        if (pt) return [{ kind: 'ring', at: pt, r: 0.1 }];
      }
    }
    // 交わらないはずの ところで 交わっている ＝ そこを ○ で 指す
    const t = crossPairSet(tplPolys);
    for (let i = 0; i < usrPolys.length; i++) {
      for (let j = i + 1; j < usrPolys.length; j++) {
        if (!polylinesCross(usrPolys[i], usrPolys[j]) || t.has(`${i},${j}`)) continue;
        const pt = polylinesCrossPoint(usrPolys[i], usrPolys[j]);
        if (pt) return [{ kind: 'ring', at: pt, r: 0.1 }];
      }
    }
    return null;
  }
  return null;
}

/* 赤ペンの しるしを 組み立てる。
   usrPolys / tplPolys … 0..1 の 点列。shapeInfo は analyzeShape の 戻り値。
   items は scoreHandwriting の 観点リスト（key と raw を 見る）。 */
function buildRedPenReview(usrPolys, tplPolys, templatePaths, items, shapeInfo) {
  const per = shapeInfo?.perStroke || [];
  const worstShape = per.length ? per.reduce((a, b) => (b.score < a.score ? b : a)) : null;
  const ctx = { usrPolys, tplPolys, worstShape };

  /* なおすところを えらぶ。

     「点が ひくい 順」ではなく「**落とした 点が 多い 順**」で ならべる。
     おなじ 0.5 でも 30点満点の かたちは 15点、10点満点の こうさは 5点
     しか 落としていない。直して いちばん 効くところから 見せたい。 */
  const ranked = items
    .filter(it => it.raw < REVIEW_FIX_THRESHOLD)
    .map(it => ({ ...it, lost: (1 - it.raw) * it.max }))
    .sort((a, b) => b.lost - a.lost);

  const fixes = [];
  for (const it of ranked) {
    if (fixes.length >= REVIEW_MAX_FIXES) break;
    const marks = marksForFix(it.key, ctx);
    if (!marks || marks.length === 0) continue;
    fixes.push({ key: it.key, ...REVIEW_FIX_TEXT[it.key], marks });
  }

  return { templatePaths, user: usrPolys, fixes };
}

// 自力書きの採点：ユーザー筆跡（画ごとの点列）とお手本パスを比較
// userStrokes: [{ points: [{x,y in 0..1}, ...] }, ...]
// templatePaths: KanjiVG の <path d="..."> 文字列の配列
function scoreHandwriting(userStrokes, templatePaths) {
  if (!userStrokes || !templatePaths || templatePaths.length === 0) return null;
  const tplPolys = templatePaths.map(d => sampleSvgPath(d, 24));
  const usrPolys = userStrokes.map(s => simplifyPoints(s.points || []));
  const shapeInfo = analyzeShape(usrPolys, tplPolys);
  const items = [
    { key: 'shape',     label: 'せんの かたち',     max: 30, raw: shapeInfo.score },
    { key: 'order',     label: 'かきじゅん',         max: 15, raw: evalStrokeSequence(usrPolys, tplPolys) },
    { key: 'startdir',  label: 'はじめと むき',     max: 15, raw: evalStrokeStartAndDir(usrPolys, tplPolys) },
    { key: 'balance',   label: 'おおきさ・いち',     max: 20, raw: evalBalance(usrPolys, tplPolys) },
    { key: 'rooms',     label: 'マスの つかいかた', max: 10, raw: evalRooms(usrPolys, tplPolys) },
    { key: 'crossings', label: 'せんの こうさ',     max: 10, raw: evalCrossings(usrPolys, tplPolys) },
  ];
  const breakdown = items.map(it => ({
    key: it.key,
    label: it.label,
    max: it.max,
    score: Math.round(it.raw * it.max),
    status: it.raw >= 0.85 ? 'good' : it.raw >= 0.6 ? 'ok' : 'bad',
    advice: adviceFor(it.key, it.raw),
  }));
  // かたちは「合格のための必要条件」。ほかの観点（順番・外形・部屋・交差）は
  // あらい特徴しか見ないので、線がまるで違っていても そこそこ点が入ってしまう。
  // かたちが半分に届かないときだけ、合計におさえをかけて合格させない。
  // （かたちが 0.5 以上あれば おさえは かからない＝ふつうに書けていれば無関係）
  const shapeRaw = items[0].raw;
  const gate = shapeRaw >= 0.5 ? 1 : 0.5 + shapeRaw;
  const total = Math.round(breakdown.reduce((s, b) => s + b.score, 0) * gate);
  const comment = total >= 90 ? 'すばらしい！'
                : total >= 70 ? 'じょうず！'
                : total >= 50 ? 'いい かんじ！'
                : 'もう いっかい！';
  let review = null;
  // 赤ペンの しるしは 画面の 見た目だけの もの。ここで こけても
  // 点数は 出さなければならないので、失敗しても 採点は 返す。
  try { review = buildRedPenReview(usrPolys, tplPolys, templatePaths, items, shapeInfo); }
  catch (e) { review = null; }
  return { total, breakdown, comment, passed: total >= 60, review };
}

/* ──────────────────────────────────────────────────────────────
   3.55. とくべつな おとの 書きとり（かるい 採点）

   `scoreHandwriting`（100点・6観点・60点で合格）は「かく」画面の
   まとまった れんしゅう用で、ここには つかわない。りゆうは 2 つ。

   ① 合計 60 点で 通るので、**マス いっぱいの「つ」を 書いても 合格しうる**。
      この単元が 教えているのは まさに その ちがい（ちいさい っ）なので、
      いちばん 見なければ ならない ところを 見のがす。
   ② KanjiVG の ちいさい字の 手本は よこは ほぼ まん中に ある。
      いっぽう `KanaCell` が 画面に 出している 点線の へやは **みぎした**。
      手本の いちを そのまま 採点に つかうと、**アプリ自身の めじるしに
      したがって 書いた子が 減点される**。

   そこで 見るのは 3 つだけ。
     ・かたち   … おたがいの わく に そろえてから くらべる
                  （＝おおきさ・いち を のぞいた「形」だけ）
     ・おおきさ … ちいさい字なら マスの 62% いかに おさまっているか
     ・いち     … ちいさい字なら みぎしたの へやに あるか
                  （＝`KanaCell` の 点線と おなじ きまり）
   かきじゅんは 見るが 落とさない（1年生を ここで 止めない）。
   ────────────────────────────────────────────────────────────── */
// それぞれの わくに そろえる（おおきさ・いちを 打ち消して かたちだけ 見る）
function normalizeToBbox(polys) {
  const b = bboxOfPolys(polys);
  if (!b) return polys;
  const w = Math.max(b.x1 - b.x0, 1e-6), h = Math.max(b.y1 - b.y0, 1e-6);
  const s = Math.max(w, h);                       // よこ・たての ひ は くずさない
  const ox = (s - w) / 2, oy = (s - h) / 2;
  return polys.map(poly => poly.map(p => ({ x: (p.x - b.x0 + ox) / s, y: (p.y - b.y0 + oy) / s })));
}

const SPECIAL_WRITE_SHAPE_PASS = 0.55;   // かたちの 合格ライン
const SPECIAL_WRITE_SMALL_MAX  = 0.62;   // ちいさい字は マスの これいか
const SPECIAL_WRITE_ROOM_MIN   = 0.42;   // みぎしたの へやの さかいめ

function scoreSpecialWrite(userStrokes, templatePaths, char) {
  if (!userStrokes || !userStrokes.length) return { ok: false, reason: 'empty' };
  if (!templatePaths || !templatePaths.length) return null;
  const tpl = templatePaths.map(d => sampleSvgPath(d, 24));
  const usr = userStrokes.map(s => simplifyPoints(s.points || []));
  if (usr.length !== tpl.length) {
    return { ok: false, reason: 'strokes', strokes: usr.length, want: tpl.length };
  }
  const shape = analyzeShape(normalizeToBbox(usr), normalizeToBbox(tpl)).score;
  const bb = bboxOfPolys(usr) || { x0: 0, y0: 0, x1: 1, y1: 1 };
  const w = bb.x1 - bb.x0, h = bb.y1 - bb.y0;
  const cx = (bb.x0 + bb.x1) / 2, cy = (bb.y0 + bb.y1) / 2;
  const small = isSmallKana(char);
  const sizeOk  = !small || (w <= SPECIAL_WRITE_SMALL_MAX && h <= SPECIAL_WRITE_SMALL_MAX);
  const placeOk = !small || (cx >= SPECIAL_WRITE_ROOM_MIN && cy >= SPECIAL_WRITE_ROOM_MIN);
  /* 「ー」だけは 手本が まっすぐな 線 1 本で、かたちの 採点が ゆるい。
     よこ線に なっているか・みじかすぎないかを ここで 見る。 */
  let barOk = true;
  if (char === CHOUON_MARK) {
    const pts = usr[0] || [];
    const a = pts[0], b = pts[pts.length - 1];
    if (!a || !b) barOk = false;
    else {
      const deg = Math.abs(Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI);
      barOk = (deg <= 20 || deg >= 160) && Math.hypot(b.x - a.x, b.y - a.y) >= 0.5;
    }
  }
  const reason = !barOk ? 'bar' : !sizeOk ? 'big' : !placeOk ? 'place'
    : shape < SPECIAL_WRITE_SHAPE_PASS ? 'shape' : null;
  return { ok: !reason, reason, shape: Math.round(shape * 100) / 100 };
}
// 直しかたを 1年生の ことばで（まちがいの 中身は 学習ログの item.wrong にも なる）
const SPECIAL_WRITE_ADVICE = {
  empty:   'まだ かいてないよ。マスの なかに かいてみよう',
  strokes: 'かくすうが ちがうみたい。「かきじゅんを みる」で たしかめよう',
  big:     'もう すこし ちいさく、マスの みぎしたに かこう',
  place:   'マスの みぎしたの へやに かこう',
  shape:   'かたちを もう いちど。「かきじゅんを みる」で たしかめよう',
  bar:     'よこに まっすぐ、ながく ひっぱろう',
};

/* KanjiVG の 1 画をキャンバスに描く。呼ぶまえに ctx を 109 座標系に
   合わせておくこと（線の色・太さも呼び出し側で決める）。
   Path2D が使えない古いブラウザでは、採点と同じ点列でおりかえし線にする。 */
const __hasPath2D = typeof Path2D !== 'undefined';
const __path2dCache = new Map();   // d -> Path2D
function drawKvgStroke(ctx, d) {
  if (!d) return;
  if (__hasPath2D) {
    let p = __path2dCache.get(d);
    if (!p) { try { p = new Path2D(d); } catch (e) { p = null; } __path2dCache.set(d, p); }
    if (p) { ctx.stroke(p); return; }
  }
  // 予備：0..1 に正規化された点列を 109 座標にもどして折れ線で描く
  const pts = sampleSvgPath(d, 48);
  if (pts.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(pts[0].x * 109, pts[0].y * 109);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x * 109, pts[i].y * 109);
  ctx.stroke();
}

function getStartEndPoints(pathStr) {
  if (!pathStr || !__svgMeasureSvg) return { s: { x: 0, y: 0 }, e: { x: 0, y: 0 } };
  const cached = __startEndCache.get(pathStr);
  if (cached) return cached;
  const svgNS = 'http://www.w3.org/2000/svg';
  const p = document.createElementNS(svgNS, 'path');
  p.setAttribute('d', pathStr);
  __svgMeasureSvg.appendChild(p);
  const len = p.getTotalLength();
  __pathLengthCache.set(pathStr, len);
  const s = p.getPointAtLength(0), e = p.getPointAtLength(len);
  __svgMeasureSvg.removeChild(p);
  const result = { s: { x: s.x/109, y: s.y/109 }, e: { x: e.x/109, y: e.y/109 } };
  __startEndCache.set(pathStr, result);
  return result;
}

// 1 つのパスの長さだけ知りたい場合（StrokeOrderAnime 用）
function getPathLength(pathStr) {
  if (!pathStr || !__svgMeasureSvg) return 0;
  const cached = __pathLengthCache.get(pathStr);
  if (cached != null) return cached;
  const svgNS = 'http://www.w3.org/2000/svg';
  const p = document.createElementNS(svgNS, 'path');
  p.setAttribute('d', pathStr);
  __svgMeasureSvg.appendChild(p);
  const len = p.getTotalLength();
  __svgMeasureSvg.removeChild(p);
  __pathLengthCache.set(pathStr, len);
  return len;
}

/* ──────────────────────────────────────────────────────────────
   4. カスタムフック
   ────────────────────────────────────────────────────────────── */
// localStorage の書き込みは保存失敗時にアプリが「黙って進捗を失う」のを防ぐ
// ため、QuotaExceededError を画面に伝播できるフックを介する。
let __storageWarnCb = null;
function setStorageWarnCallback(fn) { __storageWarnCb = fn; }
function safeLocalStorageSet(key, value) {
  try { localStorage.setItem(key, value); return true; }
  catch (e) {
    if (__storageWarnCb) __storageWarnCb(key, e);
    return false;
  }
}
function useLocalStorage(key, initial) {
  const [val, setVal] = useState(() => {
    try { const r = localStorage.getItem(key); return r != null ? JSON.parse(r) : initial; }
    catch { return initial; }
  });
  useEffect(() => { safeLocalStorageSet(key, JSON.stringify(val)); }, [key, val]);
  return [val, setVal];
}

// 「きょう」を YYYY-MM-DD（ローカルタイム）で表現する。toDateString は
// ロケールによって表記が変わり比較が脆い + 日跨ぎ判定のために安定したキー
// が必要。
function todayKey(d = new Date()) {
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function yesterdayKey() {
  const y = new Date(); y.setDate(y.getDate() - 1);
  return todayKey(y);
}

// 連続学習日数（ストリーク）
// 改善点：
//  ・toDateString 依存をやめ、ローカル日付キー（YYYY-MM-DD）で安定比較
//  ・アプリを開いたままの日跨ぎ／スリープ復帰でも streak が伸びる
//    （visibilitychange と次の真夜中タイマーで再チェック）
function useStreak() {
  const [state, setState] = useLocalStorage(KEY_STREAK, { count: 0, lastDate: null });
  const stateRef = useRef(state); stateRef.current = state;
  useEffect(() => {
    let timer = null;
    function check() {
      const today = todayKey();
      const cur = stateRef.current || { count: 0, lastDate: null };
      if (cur.lastDate === today) {
        scheduleNext();
        return;
      }
      const yest = yesterdayKey();
      const next = (cur.lastDate === yest) ? (cur.count || 0) + 1 : 1;
      setState({ count: next, lastDate: today });
      scheduleNext();
    }
    function scheduleNext() {
      // 次の 00:00 + 5 秒に再評価
      const now = new Date();
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1, 0, 0, 5);
      const ms = Math.max(1000, next.getTime() - now.getTime());
      if (timer) clearTimeout(timer);
      timer = setTimeout(check, ms);
    }
    const onVis = () => { if (!document.hidden) check(); };
    document.addEventListener('visibilitychange', onVis);
    check();
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line
  }, []);
  return state.count || 0;
}

// きょうの もじ（毎日変わるデイリーチャレンジ）
// 清音をまずは優先し、すべてマスターしたら濁音・半濁音・拗音にひろがる
// 改善：日跨ぎで自動更新するための tick ステートを内蔵
function useDailyChallenge(kanaMode, mastered) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let timer;
    function schedule() {
      const now = new Date();
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1, 0, 0, 5);
      timer = setTimeout(() => { setTick(t => t + 1); schedule(); }, Math.max(1000, next.getTime() - now.getTime()));
    }
    const onVis = () => { if (!document.hidden) setTick(t => t + 1); };
    document.addEventListener('visibilitychange', onVis);
    schedule();
    return () => { document.removeEventListener('visibilitychange', onVis); clearTimeout(timer); };
  }, []);
  return useMemo(() => {
    const seion = kanaMode === 'katakana' ? KATA_LIST : HIRA_LIST;
    const all   = kanaMode === 'katakana' ? KATA_ALL_LIST : HIRA_ALL_LIST;
    const seionUnmastered = seion.filter(c => !mastered.includes(c));
    const allUnmastered   = all.filter(c => !mastered.includes(c));
    const pool = seionUnmastered.length > 0
      ? seionUnmastered
      : (allUnmastered.length > 0 ? allUnmastered : all);
    // 今日の日付をシードに（同じ日は同じ文字）
    const today = new Date();
    const seed = today.getFullYear()*10000 + (today.getMonth()+1)*100 + today.getDate();
    const idx = seed % pool.length;
    return pool[idx];
    // tick 依存：日跨ぎで再計算
    // eslint-disable-next-line
  }, [kanaMode, mastered, tick]);
}

// 取得済みバッジ管理
// 通知（トースト）は state の更新関数の中では鳴らさない。React は更新関数を
// 複数回呼ぶことがあり（開発時の二重実行や再試行）、そのたびにトーストが
// 出てしまう。「すでに知らせたバッジ」を ref で覚えて差分だけ通知する。
function useAchievements({ mastered, words, streak, earned, setEarned, onNew }) {
  const notifiedRef = useRef(null);
  useEffect(() => {
    // 初回は保存済みのバッジを「通知ずみ」として扱う（起動のたびに鳴らさない）
    if (notifiedRef.current === null) notifiedRef.current = new Set(earned || []);
    const ctx = { m: mastered, w: words, s: streak };
    const nowEarned = BADGES.filter(b => b.check(ctx)).map(b => b.id);
    const fresh = nowEarned.filter(id => !notifiedRef.current.has(id));
    if (fresh.length === 0) return;
    fresh.forEach(id => notifiedRef.current.add(id));
    setEarned(prev => (prev.length === nowEarned.length && nowEarned.every(id => prev.includes(id))) ? prev : nowEarned);
    if (onNew) fresh.forEach(id => onNew(BADGES.find(b => b.id === id)));
    // eslint-disable-next-line
  }, [mastered, words, streak]);
}

/* ──────────────────────────────────────────────────────────────
   4.5. ふくしゅうの はこ（SRS）と きょうの きろく

   おぼえたことを わすれないための しくみ。ここが 学習の 心臓部なので、
   保存も 更新も この 2 つの フックだけを 通す。
   ────────────────────────────────────────────────────────────── */
function useSkill() {
  const [skill, setSkill] = useLocalStorage(KEY_SKILL, {});
  // 1 もんだいに こたえた → はこを すすめる／もどす
  const answer = useCallback((id, correct) => {
    if (!id) return;
    setSkill(prev => ({ ...prev, [id]: srsAnswer(prev[id], correct) }));
  }, [setSkill]);
  return { skill, answerSkill: answer, setSkill };
}

// きょう どれだけ やったか（はんこカレンダーと きょうの めあて に つかう）
function useDayLog(tier = 1) {
  const [log, setLog] = useLocalStorage(KEY_DAYLOG, {});
  const today = todayKey();
  // めあての 数は ステージで かわる（`missionGoal`）ので、いまの ステージを
  // 見て はんこを 押す。setLog の 中から 読めるよう ref に 置いておく。
  const tierRef = useRef(tier);
  useEffect(() => { tierRef.current = tier; }, [tier]);
  const bump = useCallback((key, n = 1) => {
    setLog(prev => {
      const k = todayKey();
      const cur = prev[k] || emptyDayRecord();
      const next = { ...cur, [key]: (cur[key] || 0) + n };
      next.done = isDayComplete(next, tierRef.current);
      // 4 か月より前の きろくは 捨てる（保存容量を まもる）
      const out = { ...prev, [k]: next };
      const keys = Object.keys(out).sort();
      while (keys.length > 130) delete out[keys.shift()];
      return out;
    });
  }, [setLog]);
  const todayRec = log[today] || emptyDayRecord();
  return { log, todayRec, bumpMission: bump };
}

// きょう ふくしゅうすべき もの（はこの きげんが きた もの）を かぞえる
function countDue(skill, prefix) {
  let n = 0;
  for (const id in (skill || {})) {
    if (prefix && id.indexOf(prefix) !== 0) continue;
    if (srsIsDue(skill[id])) n++;
  }
  return n;
}
// にがて（まちがえた ままの もの）を あつめる
function weakItems(skill, prefix) {
  const out = [];
  for (const id in (skill || {})) {
    if (prefix && id.indexOf(prefix) !== 0) continue;
    if (srsIsWeak(skill[id])) out.push(id);
  }
  return out;
}
// item id を 画面に出す ことばに なおす（にがてボックスの ふだ）
function weakLabelOf(id) {
  const [kind, a, b] = String(id).split(':');
  if (kind === 's') return b;                                          // とくべつ → ことば
  if (kind === 'g') return WORD_GROUP_MAP[a]?.title || a;              // なかま → なかまの名まえ
  return a;                                                           // よむ・にたもの・はんたい
}

/* ══════════════════════════════════════════════════════════════
   4.6. 学習ログ（study.v1）への 橋わたし

   おなじサイト（gigayama.github.io）の 学習アプリは、学習のたびに
   共通形式のログを 端末（localStorage の `study.records.v1`）に ためる。
   先生は「まなびクエスト」から それを まとめて 見る。
   仕様書：学習ログ共通スキーマ `study.v1` §3.10

   ここは **知らせるだけ** の うすい層で、なにを 1 レコードにするかは
   studySession.js が きめる。保存は studyLog.js が うけもつ。

   ・アプリは **保存だけ**。外部への送信は 一切 行わない（§0-1）
   ・氏名・出席番号などは **持たない**。だれの記録かは 送信ページが つける（§0-2）
   ・モジュールが 読みこめていなくても アプリは そのまま うごく（§5.1.1）
   ══════════════════════════════════════════════════════════════ */
const KANA_STUDY = (typeof globalThis !== 'undefined' && globalThis.KanaStudy) || null;
const STUDY = KANA_STUDY ? KANA_STUDY.getRecorder() : null;

/* ふくしゅうの はこ（SRS）の いまの ようすを ext に そえる。
   `weakIds` は `s:sokuon:きって` のように **単元と語が ID に 入っている** ので、
   学級で 集計すると「促音の『きって』を 12 人が 落とした」が 直接 見える（§3.10.5）。 */
function studySkillExt(skill) {
  let learned = 0, due = 0;
  for (const id in (skill || {})) {
    if (srsIsLearned(skill[id])) learned++;
    if (srsIsDue(skill[id])) due++;
  }
  return { srsLearned: learned, srsDue: due, weakIds: weakItems(skill, '').slice(0, 40) };
}

/* 配列を まぜる（出題の じゅんばんを 毎回かえる） */
function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function pickSome(arr, n) { return shuffled(arr).slice(0, n); }

// 共有モーダル用フック：Escape、フォーカストラップ、body スクロールロック
// onClose を渡せば Escape 押下で閉じる。dialog ノードの ref を返す。
function useModal(onClose) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    // body スクロールロック
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // 直前のフォーカスを保存
    const prevFocus = document.activeElement;
    // 初期フォーカス：最初のフォーカス可能要素
    const focusables = () => Array.from(dialog.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ));
    requestAnimationFrame(() => {
      const f = focusables();
      if (f.length > 0) f[0].focus();
    });
    function onKey(e) {
      if (e.key === 'Escape') { e.stopPropagation(); onClose && onClose(); return; }
      if (e.key === 'Tab') {
        const f = focusables();
        if (f.length === 0) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prevOverflow;
      try { prevFocus && prevFocus.focus && prevFocus.focus(); } catch (e) {}
    };
  }, [onClose]);
  return ref;
}

// 二重タップ・連打防止：指定ミリ秒以内の再呼び出しを破棄する。
function useDebouncedAction(fn, delay = 350) {
  const lastRef = useRef(0);
  return useCallback((...args) => {
    const now = performance.now();
    if (now - lastRef.current < delay) return;
    lastRef.current = now;
    return fn(...args);
  }, [fn, delay]);
}

// メディアクエリの一致状態を購読する（レイアウト分岐に使う）。
function useMediaQuery(query) {
  const getMatch = () => (typeof window !== 'undefined' && window.matchMedia)
    ? window.matchMedia(query).matches : false;
  const [matches, setMatches] = useState(getMatch);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    // Safari 13 以前は addEventListener 非対応
    mql.addEventListener ? mql.addEventListener('change', onChange) : mql.addListener(onChange);
    return () => {
      mql.removeEventListener ? mql.removeEventListener('change', onChange) : mql.removeListener(onChange);
    };
  }, [query]);
  return matches;
}

// 「アプリとしてインストール」用フック。
//
// 設計方針（Chromebook で ボタンが出ない問題への対策）:
//  1. ボタンの表示条件を beforeinstallprompt に依存させない。
//     このイベントは「ブラウザが未対応」「すでにインストール済みと判定された」
//     「発火タイミングを取りこぼした」など、いろいろな理由で来ないことがある。
//     来なかった場合でもボタンは出し、押されたら手順の案内を表示する。
//  2. 隠すのは「スタンドアロン起動中（＝すでにアプリとして開いている）」の
//     ときだけ。インストール済みフラグを保存しないので、アンインストール
//     すればまたボタンが戻る。
function useInstallPrompt() {
  const read = () => {
    const api = typeof window !== 'undefined' ? window.__kkmInstall : null;
    return {
      standalone: !!(api && api.isStandalone()),
      canPrompt: !!(api && api.deferred),
      platform: (api && api.platform) || 'desktop',
    };
  };
  const [state, setState] = useState(read);

  useEffect(() => {
    const sync = () => setState(read());
    window.addEventListener('kkm-install-change', sync);
    // 旧 index.html がキャッシュから提供された場合の保険
    window.addEventListener('kkm-installable', sync);
    window.addEventListener('kkm-installed', sync);
    // 表示モードの変化（インストール後にアプリウィンドウで開いた等）も追う
    const mqls = ['standalone', 'fullscreen', 'minimal-ui', 'window-controls-overlay']
      .map((m) => (window.matchMedia ? window.matchMedia(`(display-mode: ${m})`) : null))
      .filter(Boolean);
    mqls.forEach((mql) => {
      mql.addEventListener ? mql.addEventListener('change', sync) : mql.addListener(sync);
    });
    // 起動直後に beforeinstallprompt が来るまでの取りこぼし対策
    const t = setTimeout(sync, 1200);
    return () => {
      window.removeEventListener('kkm-install-change', sync);
      window.removeEventListener('kkm-installable', sync);
      window.removeEventListener('kkm-installed', sync);
      mqls.forEach((mql) => {
        mql.removeEventListener ? mql.removeEventListener('change', sync) : mql.removeListener(sync);
      });
      clearTimeout(t);
    };
  }, []);

  // 戻り値: 'accepted' | 'dismissed' | 'unavailable'
  const promptInstall = useCallback(async () => {
    const api = window.__kkmInstall;
    const ev = api && api.deferred;
    if (!ev) return 'unavailable';
    let outcome = 'dismissed';
    try {
      ev.prompt();
      const choice = await ev.userChoice;
      if (choice && choice.outcome === 'accepted') outcome = 'accepted';
    } catch (e) {
      outcome = 'unavailable';
    }
    // prompt() は 1 回しか使えない。使い終わったら捨てて状態を更新する。
    api.deferred = null;
    window.__kkmDeferredInstall = null;
    api.notify();
    return outcome;
  }, []);

  return { ...state, promptInstall };
}

/* ──────────────────────────────────────────────────────────────
   5. アイコン

   絵文字はつかわない。すべて 線だけで描いた SVG にそろえる。
   ・端末やフォントによって見た目が変わらない
   ・currentColor をつかうので、まわりの文字色にすっとなじむ
   ・線の太さ・角のまるさをそろえてあるので、ならべても うるさくならない

   ふたつの種類がある。
     SvgIcon  … 操作をあらわす UI アイコン（ボタン・見出し）
     Pict     … ことばの さしえ（いぬ・はな・でんしゃ など）
   ────────────────────────────────────────────────────────────── */
const SvgIcon = ({ size=20, className='', children, strokeWidth=1.9 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
       fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
       className={className} aria-hidden="true" focusable="false">{children}</svg>
);
const IconPencil   = (p) => <SvgIcon {...p}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></SvgIcon>;
const IconBook     = (p) => <SvgIcon {...p}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></SvgIcon>;
const IconSparkle  = (p) => <SvgIcon {...p}><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></SvgIcon>;
const IconRotate   = (p) => <SvgIcon {...p}><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></SvgIcon>;
const IconX        = (p) => <SvgIcon {...p}><path d="M18 6 6 18M6 6l12 12"/></SvgIcon>;
const IconPlay     = (p) => <SvgIcon {...p}><path d="M6 4l14 8-14 8z"/></SvgIcon>;
const IconPlus     = (p) => <SvgIcon {...p}><path d="M12 5v14M5 12h14"/></SvgIcon>;
const IconTrash    = (p) => <SvgIcon {...p}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14"/></SvgIcon>;
const IconBulb     = (p) => <SvgIcon {...p}><path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 4 12.7c-.7.6-1 1.4-1 2.3v1H9v-1c0-.9-.3-1.7-1-2.3A7 7 0 0 1 12 2z"/></SvgIcon>;
const IconStar     = (p) => <SvgIcon {...p}><path d="M12 2l3 7 7 .8-5 5 1.5 7L12 18l-6.5 3.8L7 14l-5-5L9 8z"/></SvgIcon>;
const IconCheck    = (p) => <SvgIcon {...p}><path d="m5 12 5 5L20 7"/></SvgIcon>;
const IconSettings = (p) => <SvgIcon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h0a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></SvgIcon>;
const IconVolume   = (p) => <SvgIcon {...p}><path d="M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14"/></SvgIcon>;
const IconVolumeX  = (p) => <SvgIcon {...p}><path d="M11 5 6 9H2v6h4l5 4zM22 9l-6 6M16 9l6 6"/></SvgIcon>;
const IconFlame    = (p) => <SvgIcon {...p}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c1.4 0 2.5-1 2.5-2.5 0-1.2-.5-2.2-1.5-3 .5-1 1.5-1.5 3-1.5A4.5 4.5 0 0 1 19 14.5c0 4-3 7.5-7 7.5s-7-3-7-7c0-1.7.6-3.4 2-4.5C8 11.7 8.5 13 8.5 14.5zM13 12V8c0-1.8-1.2-3-3-3 .5 2-1 4-3 4 0 0 1.4 1 1.4 3.5"/></SvgIcon>;
const IconTrophy   = (p) => <SvgIcon {...p}><path d="M6 9H4a2 2 0 0 1-2-2V5h4M18 9h2a2 2 0 0 0 2-2V5h-4M6 5h12v6a6 6 0 0 1-12 0zM12 17v4M8 21h8"/></SvgIcon>;
const IconCalendar = (p) => <SvgIcon {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></SvgIcon>;
const IconGrid     = (p) => <SvgIcon {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></SvgIcon>;
const IconLock     = (p) => <SvgIcon {...p}><rect x="4.5" y="10" width="15" height="10.5" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></SvgIcon>;
const IconBrush    = (p) => <SvgIcon {...p}><path d="M9.5 14.5 19 5a2.1 2.1 0 0 0-3-3l-9.5 9.5z"/><path d="M6.5 11.5c-2 .8-3 2.4-3 4.7 0 .8-.4 1.6-1 2.2 1 .9 2.4 1.4 3.8 1.4 2.7 0 4.7-1.8 4.7-4.3z"/></SvgIcon>;
const IconPen      = (p) => <SvgIcon {...p}><path d="M12.5 2.5 15 5 6.5 20 3 21l1-3.5z"/><path d="m11 4 2.5 2.5"/><path d="M17 21h4"/></SvgIcon>;
const IconSeal     = (p) => <SvgIcon {...p}><rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M8 12h8M12 8v8"/></SvgIcon>;
const IconMaru     = (p) => <SvgIcon {...p}><circle cx="12" cy="12" r="8.5"/></SvgIcon>;
const IconLink     = (p) => <SvgIcon {...p}><path d="M9.5 14.5a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1.2 1.2"/><path d="M14.5 9.5a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1.2-1.2"/></SvgIcon>;
const IconDownload = (p) => <SvgIcon {...p}><path d="M12 3v11M7.5 10 12 14.5 16.5 10"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></SvgIcon>;
const IconTarget   = (p) => <SvgIcon {...p}><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".9" fill="currentColor" stroke="none"/></SvgIcon>;
const IconAlert    = (p) => <SvgIcon {...p}><path d="M12 3.5 21.5 20H2.5z"/><path d="M12 9.5v4.5M12 17.2v.1"/></SvgIcon>;
const IconSearch   = (p) => <SvgIcon {...p}><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/></SvgIcon>;
const IconArrow    = (p) => <SvgIcon {...p}><path d="M4 12h15M13 6l6 6-6 6"/></SvgIcon>;
const IconWifiOff  = (p) => <SvgIcon {...p}><path d="M3 3.5 20.5 21"/><path d="M2.5 9.5A15 15 0 0 1 7 6.6M21.5 9.5a15 15 0 0 0-8-3.4M6 13.3a10 10 0 0 1 2.6-1.7M18 13.3a10 10 0 0 0-3.4-2"/><path d="M9.3 16.9a5 5 0 0 1 5.4.4"/><path d="M12 20.4v.1"/></SvgIcon>;
const IconOffice   = (p) => <SvgIcon {...p}><path d="M3.5 20.5V9l6-4 6 4v11.5"/><path d="M15.5 12.5h5v8"/><path d="M6.5 11h3M6.5 14.5h3M12 20.5V16h-2.5v4.5"/><path d="M2 20.5h20"/></SvgIcon>;
const IconClock    = (p) => <SvgIcon {...p}><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5.3l3.3 2"/></SvgIcon>;
const IconShuffle  = (p) => <SvgIcon {...p}><path d="M16.5 3.5 20 7l-3.5 3.5M16.5 13.5 20 17l-3.5 3.5"/><path d="M4 7h3.2c1.6 0 2.6.9 3.6 2.4l2.4 3.6c1 1.5 2 2.4 3.6 2.4H20"/><path d="M4 17h3.2c1.6 0 2.6-.9 3.6-2.4M16.8 7H20"/></SvgIcon>;

/* --- ことばの さしえ（ピクトグラム） ---
   すべて 24×24 のマスに、おなじ線の太さで描く。
   ★カスタマイズポイント: あたらしい さしえは ここに足す。 */
const PICTS = {
  animal:   <><rect x="4.2" y="8.6" width="12.2" height="6.4" rx="2.6"/><circle cx="19.2" cy="6.8" r="2.6"/><path d="m17.6 8.8-1.8 1.6"/><path d="m18.3 4.6-.5-2.2 2 1.3"/><path d="M6.6 15v4.4M9.9 15v4.4M13.2 15v4.4M15.6 15v4.4"/><path d="M4.3 10.8C2.7 9.9 2.2 8.3 3 6.4"/></>,
  dog:      <><path d="M6 5 4.6 9.8V14a5.5 5.5 0 0 0 5.5 5.5h3.8A5.5 5.5 0 0 0 19.4 14V9.8L18 5l-3.2 2.6H9.2z"/><circle cx="9.6" cy="12" r=".85" fill="currentColor" stroke="none"/><circle cx="14.4" cy="12" r=".85" fill="currentColor" stroke="none"/><path d="M12 14.6v1.2M10.4 17.4h3.2"/></>,
  cat:      <><path d="M12 20.5A6.5 6.5 0 0 1 5.5 14V6.2l3.6 2.6a7 7 0 0 1 5.8 0l3.6-2.6V14a6.5 6.5 0 0 1-6.5 6.5z"/><circle cx="9.8" cy="12.6" r=".85" fill="currentColor" stroke="none"/><circle cx="14.2" cy="12.6" r=".85" fill="currentColor" stroke="none"/><path d="M11.2 15.4h1.6M3 12.6h2.6M18.4 12.6H21M3.4 15.6l2.3-.8M20.6 15.6l-2.3-.8"/></>,
  rabbit:   <><path d="M9.2 9.6C9 7 8.4 3.6 6.9 3.7S5.3 7.3 6.6 10.2M14.8 9.6c.2-2.6.8-6 2.3-5.9s1.6 3.6.3 6.5"/><path d="M12 20.6a5.9 5.9 0 0 1-5.9-5.9 5.9 5.9 0 0 1 11.8 0 5.9 5.9 0 0 1-5.9 5.9z"/><circle cx="10" cy="14" r=".8" fill="currentColor" stroke="none"/><circle cx="14" cy="14" r=".8" fill="currentColor" stroke="none"/><path d="M12 16.2v1"/></>,
  bird:     <><ellipse cx="11" cy="14.6" rx="6" ry="5"/><circle cx="15.6" cy="8.4" r="3.3"/><path d="m18.6 7.1 3.2-.9-2.2 2.5"/><circle cx="16.3" cy="7.9" r=".7" fill="currentColor" stroke="none"/><path d="M9 19.4v2M13 19.4v2"/></>,
  fish:     <><path d="M14.6 12c0 3-2.7 5.5-6 5.5S2.5 15 2.5 12s2.8-5.5 6.1-5.5 6 2.5 6 5.5z"/><path d="m14.6 12 4.6-3.6v7.2z"/><circle cx="6.2" cy="10.6" r=".8" fill="currentColor" stroke="none"/></>,
  octopus:  <><path d="M6 12.5a6 6 0 0 1 12 0V15H6z"/><path d="M6 15c0 2-1 3.2-2.6 3.7M9.6 15c0 2.3-.6 3.7-1.6 4.7M14.4 15c0 2.3.6 3.7 1.6 4.7M18 15c0 2 1 3.2 2.6 3.7"/><circle cx="9.8" cy="11.2" r=".8" fill="currentColor" stroke="none"/><circle cx="14.2" cy="11.2" r=".8" fill="currentColor" stroke="none"/></>,
  bug:      <><ellipse cx="12" cy="13.8" rx="5.4" ry="6.4"/><path d="M12 7.4v12.8M6.7 11h10.6M6.7 16.6h10.6"/><circle cx="12" cy="5.6" r="2.1"/><path d="m10.2 3.8-1.6-2M13.8 3.8l1.6-2"/></>,
  flower:   <><circle cx="12" cy="5.6" r="2.5"/><circle cx="16.4" cy="8.8" r="2.5"/><circle cx="14.7" cy="14" r="2.5"/><circle cx="9.3" cy="14" r="2.5"/><circle cx="7.6" cy="8.8" r="2.5"/><circle cx="12" cy="10.2" r="2.1"/><path d="M12 16.4V22"/><path d="M12 19c1.6 0 2.7-1 3-2.4-1.6-.2-2.7.7-3 2.4z"/></>,
  tree:     <><path d="M12 2.8 5.3 12h3.3L4 18.6h16L15.4 12h3.3z"/><path d="M12 18.6V22"/></>,
  leaf:     <><path d="M20.5 3.5c0 8.3-5.7 13.5-11.4 13.5a5.2 5.2 0 0 1-1.8-.3C5.3 9.1 11.5 3.5 20.5 3.5z"/><path d="M3.5 20.5C5.6 14.3 10.3 9.6 16 7"/></>,
  fruit:    <><path d="M12 7.6c-1-1-2.4-1.6-3.8-1.4C5.6 6.5 4 9 4 12.1c0 4.4 3 8 5.5 8 1 0 1.7-.5 2.5-.5s1.5.5 2.5.5c2.5 0 5.5-3.6 5.5-8 0-3.1-1.6-5.6-4.2-5.9-1.4-.2-2.8.4-3.8 1.4z"/><path d="M12 7.6V4.4"/><path d="M12 4.4c2 0 3.5-1 4-2.6-2.2-.3-3.6.8-4 2.6z"/></>,
  vegetable:<><path d="M12 22c-2.9-2.7-4.5-6-4.5-9 0-2.4 2-4.4 4.5-4.4s4.5 2 4.5 4.4c0 3-1.6 6.3-4.5 9z"/><path d="M8.9 13.6h6.2M9.8 16.6h4.4M10.8 19.3h2.4"/><path d="M12 9V6.3"/><path d="M12 6.3c-1.9-.5-2.9-2-2.7-3.9 1.8.3 2.7 1.7 2.7 3.9zM12 6.3c1.9-.5 2.9-2 2.7-3.9-1.8.3-2.7 1.7-2.7 3.9z"/></>,
  rice:     <><path d="M11 3.7a2 2 0 0 1 2 0c.5.3.8.8 1.1 1.3l5.6 10.3c1 1.8-.3 4-2.4 4H6.7c-2.1 0-3.4-2.2-2.4-4L9.9 5c.3-.5.6-1 1.1-1.3z"/><path d="M7.6 15.6h8.8v3.7H7.6z"/></>,
  sweet:    <><path d="M1.4 12h3.6"/><circle cx="8.5" cy="12" r="3.4"/><circle cx="14.6" cy="12" r="3.4"/><circle cx="20.4" cy="12" r="3.2"/></>,
  drink:    <><path d="M4.6 7h13.2l-1.2 11.2a2 2 0 0 1-2 1.8H7.8a2 2 0 0 1-2-1.8z"/><path d="M17.6 10.2h1.9a2.3 2.3 0 0 1 0 4.6h-1.5"/><path d="M4 7h14.4"/></>,
  sun:      <><circle cx="12" cy="12" r="4.4"/><path d="M12 2v2.6M12 19.4V22M2 12h2.6M19.4 12H22M4.9 4.9l1.9 1.9M17.2 17.2l1.9 1.9M4.9 19.1l1.9-1.9M17.2 6.8l1.9-1.9"/></>,
  moon:     <><path d="M20.2 14.6A8.6 8.6 0 0 1 9.4 3.8 8.6 8.6 0 1 0 20.2 14.6z"/></>,
  star:     <><path d="m12 2.8 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.6l-5.8 3.1 1.1-6.5L2.6 9.6l6.5-.9z"/></>,
  cloud:    <><path d="M7 18.6a4.6 4.6 0 0 1 .4-9.2 5.6 5.6 0 0 1 10.5 1.6 4 4 0 0 1-.4 7.6z"/></>,
  rain:     <><path d="M12 3.4a8.6 8.6 0 0 1 8.6 8.6H3.4A8.6 8.6 0 0 1 12 3.4z"/><path d="M12 12v6.6a2 2 0 0 1-4 0"/><path d="M12 3.4V1.8"/></>,
  snow:     <><path d="M12 2v20M3.3 7l17.4 10M20.7 7 3.3 17"/><path d="m9.2 3.9 2.8 1.8 2.8-1.8M9.2 20.1l2.8-1.8 2.8 1.8"/><path d="m4.3 10.5.3-3.4 3.3-.6M19.7 13.5l-.3 3.4-3.3.6M19.7 10.5l-.3-3.4-3.3-.6M4.3 13.5l.3 3.4 3.3.6"/></>,
  rainbow:  <><path d="M2.8 18.5a9.2 9.2 0 0 1 18.4 0"/><path d="M6.5 18.5a5.5 5.5 0 0 1 11 0"/><path d="M10 18.5a2 2 0 0 1 4 0"/></>,
  mountain: <><path d="M2.2 19.6 9 7.4l3.8 6.8L15.4 9.8l6.4 9.8z"/><path d="M6.6 13.2 9 7.4l2.3 4.1c-1.4 1-3.1 1.5-4.7 1.7z"/></>,
  water:    <><path d="M2 8.4q2.5-3 5 0t5 0 5 0 5 0"/><path d="M2 13.4q2.5-3 5 0t5 0 5 0 5 0"/><path d="M2 18.4q2.5-3 5 0t5 0 5 0 5 0"/></>,
  car:      <><path d="M3 16.6v-3.3c0-.6.2-1.1.6-1.5l1.6-1.6 1.4-3A2 2 0 0 1 8.4 6h7.2a2 2 0 0 1 1.8 1.2l1.4 3 1.6 1.6c.4.4.6.9.6 1.5v3.3z"/><path d="M5.4 10.4h13.2"/><circle cx="7.6" cy="16.6" r="1.9"/><circle cx="16.4" cy="16.6" r="1.9"/></>,
  train:    <><rect x="5" y="3.4" width="14" height="13" rx="3"/><path d="M5 10h14"/><circle cx="8.8" cy="13.3" r="1.1"/><circle cx="15.2" cy="13.3" r="1.1"/><path d="m7.6 16.4-2 4M16.4 16.4l2 4M9.2 20.4h5.6"/></>,
  ship:     <><path d="M2.8 16.4h18.4l-2.2 3.4a2 2 0 0 1-1.7.9H6.7a2 2 0 0 1-1.7-.9z"/><path d="M5.6 16.4v-4h12.8v4"/><path d="M12 12.4V3.6l6 4.6h-6"/></>,
  plane:    <><path d="M11 2.6c.6 0 1.1.5 1.1 1.1v6l8.6 4.8v2.2l-8.6-2.6v3.9l2.7 1.8v1.4L11 20.1l-3.8 1.1v-1.4l2.7-1.8v-3.9l-8.6 2.6v-2.2l8.6-4.8v-6c0-.6.5-1.1 1.1-1.1z"/></>,
  house:    <><path d="M3.2 10.6 12 3.4l8.8 7.2"/><path d="M5.4 9.7V20.4h13.2V9.7"/><path d="M9.8 20.4v-5.6h4.4v5.6"/></>,
  school:   <><path d="M3.4 20.4V9.4L12 3.8l8.6 5.6v11z"/><path d="M12 3.8V1.4l3.6 1.1L12 3.8"/><path d="M9.4 20.4v-5.2h5.2v5.2"/><path d="M6.6 11.2h2.6M14.8 11.2h2.6"/><path d="M2 20.4h20"/></>,
  book:     <><path d="M3.6 4.4h5.6A2.6 2.6 0 0 1 11.8 7v12.4a2 2 0 0 0-2-2H3.6z"/><path d="M20.4 4.4h-5.6A2.6 2.6 0 0 0 12.2 7v12.4a2 2 0 0 1 2-2h6.2z"/></>,
  pencil:   <><path d="M16.4 3.2 20.8 7.6 8 20.4l-5.2 1.4 1.4-5.2z"/><path d="m14.2 5.4 4.4 4.4M3.9 16.3l3.8 3.8"/></>,
  ball:     <><circle cx="12" cy="12" r="9"/><path d="M12 3c2.6 2.6 3.9 5.6 3.9 9s-1.3 6.4-3.9 9M12 3C9.4 5.6 8.1 8.6 8.1 12s1.3 6.4 3.9 9"/><path d="M3.3 10.4h17.4M3.3 13.6h17.4"/></>,
  music:    <><path d="M9 17.6V5.4l10-2v12"/><path d="m9 9.4 10-2"/><ellipse cx="6.4" cy="18.2" rx="2.6" ry="2.1"/><ellipse cx="16.4" cy="16.2" rx="2.6" ry="2.1"/></>,
  person:   <><circle cx="12" cy="7.4" r="3.6"/><path d="M4.4 20.6a7.6 7.6 0 0 1 15.2 0z"/></>,
  heart:    <><path d="M12 20.4S3.4 14.8 3.4 9.1a4.7 4.7 0 0 1 8.6-2.7 4.7 4.7 0 0 1 8.6 2.7c0 5.7-8.6 11.3-8.6 11.3z"/></>,
  bag:      <><rect x="3.8" y="8" width="16.4" height="12.4" rx="2.6"/><path d="M8.4 8V6a3.6 3.6 0 0 1 7.2 0v2"/><path d="M3.8 13.4h16.4"/><rect x="10.4" y="11.8" width="3.2" height="3.2" rx=".8"/></>,
  cloth:    <><path d="M8.6 3.4 4 6l1.5 4.1 2-1v11.5h9V9.1l2 1L20 6l-4.6-2.6L12 5.5z"/></>,
  tool:     <><rect x="3.4" y="8.6" width="17.2" height="11.8" rx="1.6"/><path d="M3.4 12.6h17.2M12 8.6v11.8"/><path d="M12 8.6C10.4 5 8.9 3.4 7.4 4S6.4 8.1 12 8.6zM12 8.6c1.6-3.6 3.1-5.2 4.6-4.6s1 4.1-4.6 4.6z"/></>,
  light:    <><path d="M9.2 18h5.6M10.2 21h3.6"/><path d="M12 2.8a6.6 6.6 0 0 1 3.9 12c-.6.5-1 1.2-1 2H9.1c0-.8-.4-1.5-1-2A6.6 6.6 0 0 1 12 2.8z"/></>,
  shop:     <><path d="M4 10v9.5h16V10"/><path d="M2.5 10 4.6 4.8h14.8L21.5 10z"/><path d="M2.5 10a2.4 2.4 0 0 0 4.75 0 2.4 2.4 0 0 0 4.75 0 2.4 2.4 0 0 0 4.75 0 2.4 2.4 0 0 0 4.75 0"/><path d="M9.2 19.5v-5h5.6v5"/></>,
  castle:   <><path d="M12 2.4 4.6 6.8h14.8z"/><path d="M6.4 6.8v3.6h11.2V6.8"/><path d="M4.4 10.4 2.6 14.6h18.8l-1.8-4.2z"/><path d="M5.2 14.6v6h13.6v-6"/><path d="M2 20.6h20"/><path d="M10 20.6v-4h4v4"/></>,
  shape:    <><circle cx="7.2" cy="8" r="4"/><rect x="13" y="4" width="8" height="8" rx="1.2"/><path d="m12 14 5 8H7z"/></>,
};
/* ことばの さしえ 1 つ。size は px。 */
const Pict = ({ name, size=24, className='', strokeWidth=1.6 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
       fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
       className={className} aria-hidden="true" focusable="false">
    {PICTS[name] || PICTS.shape}
  </svg>
);

/* --- 花丸（はなまる） ---
   「かんぺき」をあらわす、このアプリでいちばん大事なしるし。
   先生が赤ペンで書いてくれる花丸を、朱色の線でそのまま描く。

   形は計算でつくる（座標を手で書かない）。花びらは「まんなかから rm はなれた
   ところに置いた 半径 rp の円」をぐるりと n 個ならべ、となりあう円の交点
   （＝谷）どうしを 円弧でつないだもの。こうすると花びらの先が まるくなり、
   星形ではなく ちゃんと花に見える。

     rm … 花びらの中心までのきょり    tip  （とがった先）= rm + rp
     rp … 花びらの半径                notch（花びらの谷）= 計算で出る
   ★カスタマイズポイント: 花びらの数・大きさは下の LARGE / SMALL を変える。 */
function hanamaruPath(n, rm, rp, cx = 50, cy = 50) {
  const step = (Math.PI * 2) / n, half = step / 2;
  const h2 = rp * rp - Math.pow(rm * Math.sin(half), 2);
  if (h2 <= 0) return '';   // となりの花びらと交わらない組みあわせ（形にならない）
  const rn = rm * Math.cos(half) - Math.sqrt(h2);   // 谷の半径
  const notch = (i) => {
    const a = -Math.PI / 2 + (i + 0.5) * step;
    return `${(cx + rn * Math.cos(a)).toFixed(2)} ${(cy + rn * Math.sin(a)).toFixed(2)}`;
  };
  let d = `M${notch(-1)}`;
  // 大きいほうの弧（large-arc=1）を、時計まわり（sweep=1）にたどる
  for (let i = 0; i < n; i++) d += ` A${rp} ${rp} 0 1 1 ${notch(i)}`;
  return d + ' Z';
}
/* 花丸の まんなかの「うずまき」。

   先生が 赤ペンで 花丸を 書くときは、まんなかから ぐるぐると 外へ
   まわしていく。まるを 1 つ 置くより、この うずのほうが
   「先生が その場で 書いてくれた」感じが 出る。

   アルキメデスの うず（まわった ぶんだけ 半径が のびる）を 点で ひろって、
   1 本の 線に する。線どうしが くっつくと ただの 円ばんに 見えるので、
   1 まわりぶんの 半径の のび（(rEnd-rStart)/turns）は、かならず
   線の太さより じゅうぶん 大きく しておくこと。 */
function spiralPath(turns, rStart, rEnd, cx = 50, cy = 50, samples = 144, phase = -Math.PI * 0.6) {
  const total = turns * Math.PI * 2;
  const pts = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const a = phase + t * total;
    const r = rStart + (rEnd - rStart) * t;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return 'M' + pts[0] + 'L' + pts.slice(1).join('L');
}

/* 花びらは 8 まい。谷（花びらと 花びらの あいだ）を ふかくとって、
   ひとつひとつが まるく ふくらんで 見えるようにする。

   ちいさく出すときは 花びらを へらして線を太くする。
   花びらが 8 枚のままだと 15px くらいでは つぶれて 歯車のように見えてしまう。
   おなじ りゆうで、うずまきも ちいさいときは まき数を へらす。 */
const HANAMARU_LARGE = { d: hanamaruPath(8, 30, 15.5), w: 5.2, s: spiralPath(2.0, 3.5, 24.5), tilt: -16 };
const HANAMARU_SMALL = { d: hanamaruPath(5, 27, 18),   w: 7,   s: spiralPath(1.0, 5, 14),     tilt: -16 };

function Hanamaru({ size = 24, className = '', draw = false, duration = 0.9, color = 'currentColor' }) {
  const s = size < 24 ? HANAMARU_SMALL : HANAMARU_LARGE;
  // 線を引いていく演出のために、実際の線の長さを測る（結果はキャッシュされる）。
  // draw を使わないときは測らない＝ふだんの表示に余計な計算をかけない。
  const drawStyle = draw
    ? { '--kkm-dash': Math.ceil(getPathLength(s.d)) + 8, '--kkm-draw-dur': `${duration}s` }
    : undefined;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 100 100"
         fill="none" stroke={color} strokeWidth={s.w} strokeLinecap="round" strokeLinejoin="round"
         className={className} aria-hidden="true" focusable="false">
      <path d={s.d} className={draw ? 'kkm-draw' : undefined} style={drawStyle}/>
      {/* まんなかの うずまき。すこし かたむけて、手で 書いた 感じを 出す。
          描く演出のときは 花びらの あとから、まんなか → そとへ のびていく。 */}
      <path d={s.s} transform={`rotate(${s.tilt} 50 50)`}
            className={draw ? 'kkm-draw' : undefined}
            style={draw ? { '--kkm-dash': Math.ceil(getPathLength(s.s)) + 8, '--kkm-draw-dur': `${duration * 0.8}s`, '--kkm-draw-delay': `${duration * 0.6}s` } : undefined}/>
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────
   5.5. <CorrectFx> / <WrongFx> ── こたえあわせの えんしゅつ

   「あたった！」「ちがった」を、文字を 読まなくても 体で わかるように する。
   1年生は 説明文を 読まないので、色と 形と 動きで 伝えきる。

   モチーフは 先生の 赤ペン。
     せいかい … 朱色の 花丸が どんと 押され、墨の しぶきが とびちる
     ざんねん … 画面は ゆらさず、ふだの ほうだけ そっと 首をふる

   ぜんぶ 0.9 秒いないに おわらせる。長い 演出は
   「はやく つぎを といた」ときほど じゃまに なる。
   ────────────────────────────────────────────────────────────── */
/* しぶきの とび先。毎回 ランダムにすると 画面が おちつかないので 固定。 */
const SPECK_DIRS = [
  [-62, -46], [58, -52], [-74, 26], [70, 30], [-30, -74], [34, -70], [-46, 62], [50, 58],
];
function CorrectFx({ seed, size = 132 }) {
  // seed が かわるたび 演出を やりなおす（key に つかう）
  return (
    <div key={seed} className="pointer-events-none fixed inset-0 z-[380] flex items-center justify-center"
         aria-hidden="true">
      {/* ① 画面が ほんのり 明るくなる */}
      <span className="kkm-flash absolute inset-0 bg-shu-200/50"/>
      {/* ② 朱色の 波紋が 2 まい ひろがる */}
      {[0, 0.12].map((d, i) => (
        <span key={i} className="kkm-ink-ring absolute rounded-full border-4 border-shu-500"
              style={{ width: size, height: size, '--kkm-delay': `${d}s` }}/>
      ))}
      {/* ③ 墨の しぶき */}
      {SPECK_DIRS.map((v, i) => (
        <span key={i} className="kkm-speck absolute w-2.5 h-2.5 rounded-full bg-shu-500"
              style={{ '--kkm-dx': `${v[0]}px`, '--kkm-dy': `${v[1]}px`, '--kkm-delay': `${0.05 + i * 0.015}s` }}/>
      ))}
      {/* ④ 花丸を その場で 描く */}
      <span className="kkm-hanamaru-in relative text-shu-600 drop-shadow">
        <Hanamaru size={size} draw duration={0.5}/>
      </span>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   5.6. <Furi> ── ふりがな

   1年生は 漢字を まだ 読めない。だから 子どもに 見せる ところでは
   **漢字を つかわない**のが 原則で、どうしても 漢字で 見せたい ことばだけ
   ふりがなを つける。

   いまの ところ 例外は「花丸」ひとつだけ。これは 先生が 赤ペンで
   書いてくれる しるしの 名まえで、学校で 耳から 覚える ことばなので、
   字は 漢字のまま 見せて 読みだけ そえる。

   読みは **この表 1 か所** だけで きめる。ふやすときは ここに 足すこと。
   （大人むけの まとめ＝<GuardianPanel> は 大人の ことばで 書くので
     ここを 通さない。）

   ※ rt に 色を 決めうちしない（`src/extra.css`）。朱色の ボタンの上に
      のった ときに 読めなくなるため。検査でも 見張っている。 */
const FURIGANA = { '花丸': 'はなまる' };
const FURI_RE = new RegExp('(' + Object.keys(FURIGANA).join('|') + ')', 'g');
function Furi({ children }) {
  if (typeof children !== 'string') return children || null;
  if (children.indexOf('花丸') < 0) return children;      // ほとんどの 文は そのまま
  return children.split(FURI_RE).map((part, i) =>
    FURIGANA[part]
      ? <ruby key={i}>{part}<rt>{FURIGANA[part]}</rt></ruby>
      : <React.Fragment key={i}>{part}</React.Fragment>);
}
/* 読みあげ・aria-label むけ。ふりがなを ふれない ところでは かなに ひらく。 */
function toKana(s) {
  return typeof s === 'string' ? s.replace(FURI_RE, (m) => FURIGANA[m] || m) : s;
}

/* 名まえから UI アイコンを引く（STAGE_INFO などの設定から使う） */
const ICONS = {
  lock: IconLock, play: IconPlay, brush: IconBrush, pen: IconPen, maru: IconMaru,
  check: IconCheck, star: IconStar, trophy: IconTrophy, book: IconBook, pencil: IconPencil,
  grid: IconGrid, rotate: IconRotate, bulb: IconBulb,
};

/* ──────────────────────────────────────────────────────────────
   6. <Mascot> ── 「えんぴつせんせい」が声をかける

   えんぴつの すがたを した せんせい。絵は 2 まいの PNG で持っている。
     mascot.png       … かお〜ちょうネクタイ（小さいマスでも 顔が見える）
     mascot-full.png  … ぜんしん（ふきだしの となりに 立たせる用）
   きもち（mood）で 変わるのは うごきだけ。絵は いつも同じ。

   ※ 画像は もとの絵の たてよこ比のまま出す（object-contain / width auto）。
     たて・よこを 決めうちで のばすと 顔がゆがむので しないこと。
   ────────────────────────────────────────────────────────────── */
const MASCOT_SRC      = './mascot.png';
const MASCOT_FULL_SRC = './mascot-full.png';
const MASCOT_FULL_RATIO = 394 / 512;   // mascot-full.png の よこ ÷ たて
const MASCOT_MOODS = {
  happy: 'kkm-float',
  cheer: 'kkm-breathe',
  wow:   'kkm-breathe',
  sad:   'kkm-mascot-sad',
};
function MascotFace({ size = 40, mood = 'happy' }) {
  return (
    <img src={MASCOT_SRC} alt="" aria-hidden="true" draggable="false"
         width={size} height={size}
         className={`block object-contain ${MASCOT_MOODS[mood] || MASCOT_MOODS.happy}`}
         style={{ width: size, height: size }}/>
  );
}
function MascotFull({ height = 78, mood = 'happy' }) {
  const w = Math.round(height * MASCOT_FULL_RATIO);
  return (
    <img src={MASCOT_FULL_SRC} alt="" aria-hidden="true" draggable="false"
         width={w} height={height}
         className={`block object-contain ${MASCOT_MOODS[mood] || MASCOT_MOODS.happy}`}
         style={{ width: w, height }}/>
  );
}
function Mascot({ message, mood = 'happy', size = 'normal' }) {
  const px = size === 'small' ? 34 : 52;
  return (
    <div className="flex items-center gap-2">
      {/* ぜんしんは たてに長いので、顔が同じくらいの大きさに見える たかさにする */}
      <div className="shrink-0"><MascotFull height={Math.round(px * 1.7)} mood={mood}/></div>
      {message && (
        <div key={message}
          className="relative bg-white border border-shu-200 rounded-lg px-2.5 py-1.5 shadow-sm kkm-pop-in min-w-0">
          {/* ふきだしの しっぽ */}
          <span aria-hidden="true"
            className="absolute left-[-5px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rotate-45 bg-white border-l border-b border-shu-200"/>
          <span className="relative text-[11px] md:text-sm font-semibold text-sumi-700 leading-snug"><Furi>{message}</Furi></span>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   7. <LevelBadge> / <StreakBadge>
   ────────────────────────────────────────────────────────────── */
function LevelBadge({ masteredCount, onClick }) {
  const lv = getCurrentLevel(masteredCount);
  return (
    <button onClick={onClick}
      className={`kkm-btn hidden 2xl:flex items-center gap-2 px-3 h-12 rounded-xl border-2 text-base font-semibold ${lv.color}`}>
      <Pict name={lv.icon} size={20}/><span>{lv.title}</span>
    </button>
  );
}
function StreakBadge({ streak }) {
  if (streak <= 0) return null;
  return (
    <div className="flex items-center gap-1.5 px-3 h-12 rounded-xl bg-shu-50 text-shu-700 border-2 border-shu-200 text-base font-semibold tabular-nums"
         title={`${streak}にち れんぞくで れんしゅうちゅう`}>
      <IconCalendar size={18}/>{streak}にち
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   8. <Header>
   ────────────────────────────────────────────────────────────── */
/* 画面（タブ）はここ 1 か所で定義する。
   パソコンのヘッダーと スマホの下タブで、順番も名まえも かならず そろう。

   ならびは「学びの じゅんばん」そのもの。
     ホーム   … きょう なにを やるかを きめる（まよわせない）
     かく     … 手で 書いて 形を おぼえる
     よむ     … もじと おとを むすびつける
     とくべつ … っ ゃゅょ ん のばす は へ を（1年生の やま）
     ずかん   … あつめた ことばで あそぶ（ごほうび） */
const VIEW_TABS = [
  { key: 'home',    label: 'ホーム',   short: 'ホーム',   Icon: IconTarget },
  { key: 'write',   label: 'かく',     short: 'かく',     Icon: IconPencil },
  { key: 'sound',   label: 'よむ',     short: 'よむ',     Icon: IconSearch },
  { key: 'special', label: 'とくべつ', short: 'とくべつ', Icon: IconBrush  },
  { key: 'words',   label: 'ずかん',   short: 'ずかん',   Icon: IconBook   },
];

/* アプリのしるし＝朱印（しゅいん）。教科書の おわりに押してある はんこのイメージ。 */
function AppSeal({ size = 36 }) {
  return (
    <div className="shrink-0 rounded-md bg-shu-600 text-white flex items-center justify-center shadow-sm border border-shu-700"
         style={{ width: size, height: size }} aria-hidden="true">
      <span className="kkm-glyph leading-none" style={{ fontSize: size * 0.5 }}>か</span>
    </div>
  );
}

/* ヘッダーの まるい ボタン（はんこ・おと・せってい）。
   1年生の 指に あわせて 48px。アイコンも 大きくする。 */
function HeaderIconButton({ onClick, label, tone, children, badge, pressed }) {
  return (
    <button onClick={onClick} title={label} aria-label={label} aria-pressed={pressed}
      className={`kkm-btn relative w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl border-2 flex items-center justify-center ${tone}`}>
      {children}
      {badge > 0 && (
        <span aria-hidden="true"
          className="absolute -top-1.5 -right-1.5 bg-shu-600 text-white text-[11px] font-semibold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1 tabular-nums border border-white">
          {badge}
        </span>
      )}
    </button>
  );
}

function Header({ view, setView, mastered, onReset, onOpenBadges, streak, voiceOn, setVoiceOn, earnedCount, showInstall, installReady, onInstall }) {
  return (
    <nav className="shrink-0 bg-white/95 backdrop-blur border-b-2 border-shu-600 px-2 md:px-5 py-1.5 md:py-2 flex justify-between items-center z-10 gap-2 relative">
      {/* 左：しるし + アプリ名。
          せまい画面では 名まえを みじかく する。長い 見出しは 1年生には
          読む ものではなく「じゃまな もよう」に なってしまう。 */}
      <div className="flex items-center gap-2 md:gap-2.5 min-w-0 shrink">
        <AppSeal size={40}/>
        <h1 className="text-base md:text-lg font-semibold leading-tight truncate text-sumi-800 tracking-wide">
          {/* せまい画面では 朱印だけ。名まえを 出すと ボタンの ばしょが なくなる。
              （読みあげには いつも のこす＝ sr-only） */}
          <span className="sr-only">ひらがな・カタカナ かきかたマスター</span>
          {/* lg（1024〜1279px）は 上の タブが ならぶので 名まえを 出さない。
              出すと タブか ボタンが はみ出す。 */}
          <span aria-hidden="true" className="hidden md:inline lg:hidden 2xl:inline">かきかたマスター</span>
        </h1>
      </div>

      {/* 中央：ビュー切替（教科書のインデックスのように、朱の下線でいまの場所を示す）。
          ひろい画面でも 押しやすいよう、字も 当たり判定も 大きくとる。 */}
      <div className="kkm-header-tabs hidden lg:flex items-end gap-1 self-stretch shrink-0 -mb-1.5 md:-mb-2">
        {VIEW_TABS.map(t => {
          const on = view === t.key;
          return (
            <button key={t.key} onClick={() => setView(t.key)} aria-current={on ? 'page' : undefined}
              className={`kkm-btn relative flex items-center gap-2 px-3 lg:px-5 pt-2.5 pb-3 text-base font-semibold rounded-t-lg whitespace-nowrap ${
                on ? 'text-shu-700 bg-shu-50' : 'text-sumi-600 hover:text-shu-600 hover:bg-washi-100'
              }`}>
              <span className={on ? 'kkm-nav-hop inline-flex' : 'inline-flex'} key={on ? 'on' : 'off'}>
                <t.Icon size={20}/>
              </span>
              {t.label}
              {on && <span aria-hidden="true" className="kkm-underline absolute left-2 right-2 bottom-0 h-[4px] rounded-full bg-shu-600"/>}
            </button>
          );
        })}
      </div>

      {/* 右：ステータス類 */}
      <div className="flex items-center gap-1.5 shrink-0">
        {showInstall && (
          <button onClick={onInstall} title="この がめんを アプリとして ついかする"
            aria-label="この がめんを アプリとして ついかする"
            className={`kkm-btn kkm-ripple flex items-center justify-center gap-1.5 px-2.5 2xl:px-3 h-12 min-w-[48px] min-h-[48px] rounded-xl bg-midori-600 text-white text-sm font-semibold border-2 border-midori-700 ${installReady ? 'kkm-pulse-ring' : ''}`}>
            <IconDownload size={20}/>
            <span className="hidden 2xl:inline">アプリにする</span>
          </button>
        )}
        <span className="hidden 2xl:block"><StreakBadge streak={streak}/></span>
        <LevelBadge masteredCount={mastered.length} onClick={onOpenBadges}/>
        <HeaderIconButton onClick={onOpenBadges} label="ごほうびの はんこ ずかん を ひらく"
          badge={earnedCount}
          tone="bg-yamabuki-50 hover:bg-yamabuki-100 text-yamabuki-700 border-yamabuki-300">
          <IconTrophy size={22}/>
        </HeaderIconButton>
        <HeaderIconButton onClick={() => setVoiceOn(v => !v)} pressed={voiceOn}
          label={voiceOn ? 'おとを オフにする' : 'おとを オンにする'}
          tone={voiceOn ? 'bg-ai-50 text-ai-700 border-ai-300 hover:bg-ai-100' : 'bg-sumi-50 text-sumi-600 border-sumi-300 hover:bg-sumi-100'}>
          {voiceOn ? <IconVolume size={22}/> : <IconVolumeX size={22}/>}
        </HeaderIconButton>
        <HeaderIconButton onClick={onReset} label="れんしゅうデータをリセット"
          tone="bg-sumi-50 hover:bg-shu-50 text-sumi-600 hover:text-shu-600 border-sumi-300">
          <IconSettings size={22}/>
        </HeaderIconButton>
      </div>
    </nav>
  );
}

/* ──────────────────────────────────────────────────────────────
   9. <Footer>
   ────────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="shrink-0 w-full bg-white border-t border-sumi-200 py-1 text-center text-[10px] md:text-xs text-sumi-600 font-medium">
      ©2026 ひらがな・カタカナかきかたマスター ・
      {/* このリンクは 既定で 42×14px しか なく 指では 押せない。
          見た目は そのままに、tap-44 で 当たり判定だけ ひろげる。 */}
      <a href="https://giga-school.com" target="_blank" rel="noopener noreferrer"
         className="tap-44 inline-block text-shu-700 hover:text-shu-800 hover:underline ml-1">GIGA山</a>
    </footer>
  );
}

/* ──────────────────────────────────────────────────────────────
   10. <ModeTabsMobile>
   ────────────────────────────────────────────────────────────── */
/* スマホの したタブ。
   もとは たかさ 34px・文字 10px しか なく、1年生の 指では
   となりの タブを 押してしまう ことが 多かった。
   アイコン 26px・文字 13px・たかさ 62px に ひろげ、
   えらんだ ところは 朱色の 札に して ひとめで わかるようにする。 */
function ModeTabsMobile({ view, setView }) {
  return (
    <div className="kkm-bottom-nav lg:hidden flex items-stretch gap-1 bg-white border-t-2 border-shu-600 px-1 md:px-3 pt-1 pb-0.5 relative z-10">
      {VIEW_TABS.map(t => {
        const on = view === t.key;
        return (
          <button key={t.key} onClick={() => setView(t.key)} aria-current={on ? 'page' : undefined}
            className={`kkm-btn relative flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[58px] rounded-lg text-[13px] font-semibold leading-none ${
              on ? 'text-white bg-shu-600 shadow-sm' : 'text-sumi-600'
            }`}>
            <span key={on ? 'on' : 'off'} className={`inline-flex ${on ? 'kkm-nav-hop' : ''}`}>
              <t.Icon size={26}/>
            </span>
            {t.short}
          </button>
        );
      })}
    </div>
  );
}

/* 教科書の見出し。朱色の縦罫＋見出し文字で、どのセクションでも同じ形にする。 */
function SectionTitle({ children, right, className = '' }) {
  return (
    <div className={`flex items-center justify-between gap-2 shrink-0 ${className}`}>
      <h2 className="kkm-heading-rule text-lg font-semibold text-sumi-800 truncate">{children}</h2>
      {right}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   11. <DailyChallenge> ── きょうの もじ
   ────────────────────────────────────────────────────────────── */
function DailyChallenge({ char, kanaMode, progress, onPick }) {
  if (!char) return null;
  const stage = getStage(progress, char);
  const isMastered = stage >= 4;
  return (
    <button onClick={() => onPick(char)}
      className="kkm-btn kkm-ripple w-full kkm-sheet border-l-4 border-l-shu-600 rounded-md p-2 md:p-2.5 flex items-center gap-3 text-left">
      <div className="flex items-center justify-center bg-washi-100 rounded-md w-11 h-11 md:w-14 md:h-14 border border-shu-200 shrink-0">
        <span className="kkm-glyph text-2xl md:text-3xl text-shu-700">{char}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] md:text-xs font-semibold text-shu-700 flex items-center gap-1">
          <IconTarget size={12}/> きょうの もじ ・ {kanaMode === 'katakana' ? 'カタカナ' : 'ひらがな'}
        </div>
        <div className="text-xs md:text-sm font-semibold text-sumi-700 truncate mt-0.5">
          {isMastered ? 'もう おぼえたよ。もう いっかい かいてみよう' : 'この もじに チャレンジ してみよう'}
        </div>
      </div>
      {isMastered
        ? <span className="shrink-0 text-shu-600"><Hanamaru size={26}/></span>
        : <span className="shrink-0 text-shu-500"><IconArrow size={18}/></span>}
    </button>
  );
}

/* ──────────────────────────────────────────────────────────────
   12. <KanaTable>
   ────────────────────────────────────────────────────────────── */
/* 学習だんかいの しるし（もじ表のかどに出す小さな印） */
function StageMark({ stage, className = '' }) {
  if (!stage) return null;
  if (stage >= 4) {
    return <span className={`text-shu-600 ${className}`}><Hanamaru size={14}/></span>;
  }
  const info = STAGE_INFO[stage];
  const Icon = ICONS[info.icon] || IconMaru;
  return (
    <span className={`inline-flex items-center justify-center w-[15px] h-[15px] rounded-full bg-white border ${TONES[info.tone].markRing} ${className}`}>
      <Icon size={9}/>
    </span>
  );
}

/* 五十音表の 行（ぎょう）の見出し。「あぎょう」「かぎょう」のように、
   教科書とおなじ かたまりで もじを つかめるようにする。

   もとは「あ行」と 漢字で 出していたが、「行」は 2年生で ならう字で、
   36px の 見出しには ふりがなも 入らない。かなだけで 出せるよう、
   もじ（あ）と よみ（ぎょう）を 上下 2 だんに 分けて かえす。 */
function rowLabelOf(rowChars) {
  const filled = rowChars.filter(Boolean);
  if (filled.length === 0) return null;
  const leader = filled[0];
  if (filled.length === 1 && (leader === 'ん' || leader === 'ン')) return { head: leader, tail: '' };
  return { head: leader, tail: 'ぎょう' };
}

function KanaTable({ kanaMode, setKanaMode, kanaKind, setKanaKind, progress, currentChar, onSelect, onSequence, onRandom }) {
  const table = getKanaTable(kanaMode, kanaKind);
  // いま見ている表の「かんぺき（花丸）」進捗
  const { doneCount, totalCount, pct } = useMemo(() => {
    const list = table.filter(Boolean);
    const done = list.filter(c => getStage(progress, c) >= 4).length;
    return { doneCount: done, totalCount: list.length, pct: list.length ? Math.round((done / list.length) * 100) : 0 };
  }, [table, progress]);
  const allDone = totalCount > 0 && doneCount === totalCount;

  // 5 つずつの「行」にまとめる。5 でわりきれない表（ゃゅょっ）は行見出しを出さない。
  const rows = useMemo(() => {
    const out = [];
    for (let i = 0; i < table.length; i += 5) out.push(table.slice(i, i + 5));
    return out;
  }, [table]);
  const showRowLabels = table.length % 5 === 0;

  return (
    <div className="kkm-sheet rounded-xl p-2.5 md:p-3 flex flex-col h-full min-h-0">
      {/* ① どの文字を学ぶか：ひらがな／カタカナ */}
      <div className="shrink-0 mb-2">
        <KanaModeSwitch kanaMode={kanaMode} setKanaMode={setKanaMode}/>
      </div>

      {/* ② どの しゅるい を学ぶか：せいおん／だくおん／はんだくおん／ようおん。
          もとは 10px の 4 つならびで、どれが えらばれているか 見わけにくかった。
          字を 大きくし、えらんだ ものは 朱色の 札に する。 */}
      <div className="grid grid-cols-4 gap-1.5 mb-2.5 shrink-0">
        {KANA_KINDS.map(k => (
          <button key={k.key} onClick={() => setKanaKind(k.key)} aria-pressed={kanaKind === k.key} title={k.label}
            className={`kkm-btn min-h-[48px] px-1 rounded-lg font-semibold text-base border-2 leading-tight ${
              kanaKind === k.key
                ? 'bg-shu-600 text-white border-shu-700'
                : 'bg-white text-sumi-600 border-sumi-300 hover:bg-washi-100'
            }`}>
            <span className="block xl:hidden">{k.short}</span>
            <span className="hidden xl:block truncate px-0.5">{k.mid}</span>
          </button>
        ))}
      </div>

      {/* ③ この表の しんちょく（花丸になった もじの かず） */}
      <div className="shrink-0 mb-2 kkm-progress-row">
        <div className="flex items-center justify-between text-base font-semibold text-sumi-700 mb-1">
          <span className="flex items-center gap-1.5 text-shu-700"><Hanamaru size={20}/> かんぺき</span>
          <span aria-live="polite" className="tabular-nums">{doneCount} / {totalCount}{allDone ? '　ぜんぶ！' : ''}</span>
        </div>
        <div className="h-3 rounded-full bg-washi-300 overflow-hidden"
          role="progressbar" aria-valuemin="0" aria-valuemax={totalCount} aria-valuenow={doneCount}
          aria-label={`かんぺきに なった もじ ${doneCount} / ${totalCount}`}>
          <div className={`h-full rounded-full transition-all duration-500 ${allDone ? 'bg-yamabuki-400 kkm-sheen' : 'bg-shu-500'}`}
            style={{ width: `${pct}%` }}/>
        </div>
      </div>

      {/* ④ 五十音表 */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-washi-100 rounded-lg p-2 md:p-2.5 border border-sumi-200">
        <div className="max-w-md mx-auto flex flex-col gap-1.5">
          {rows.map((row, r) => (
            <div key={r} className="flex items-center gap-1.5">
              {showRowLabels && (() => {
                const rl = rowLabelOf(row);
                if (!rl) return <div aria-hidden="true" className="shrink-0 w-11"/>;
                return (
                  <div aria-hidden="true"
                    className="shrink-0 w-11 text-center leading-none select-none text-sumi-600">
                    <div className="kkm-glyph text-lg">{rl.head}</div>
                    {/* 「ぎょう」は 読むための ものではなく、行の 目じるし。
                        こども スケールの 底上げを かけると 44px の 列で
                        1 文字ずつ 折れてしまうので、ここだけ 大きさを 直に きめる。 */}
                    {rl.tail && (
                      <div className="font-semibold mt-0.5 whitespace-nowrap" style={{ fontSize: 12 }}>{rl.tail}</div>
                    )}
                  </div>
                );
              })()}
              <div className="flex-1 grid grid-cols-5 gap-1.5">
                {row.map((char, i) => {
                  if (!char) return <div key={i} className="aspect-square"/>;
                  const stage = getStage(progress, char);
                  const isCurrent = currentChar === char;
                  // 学習だんかいごとの見た目（色は STAGE_INFO の tone とそろえる）
                  let cls = 'bg-white text-sumi-700 border-sumi-200 hover:bg-washi-100 hover:border-shu-300';
                  let extra = '';
                  if (stage === 1)      cls = 'bg-ai-50 text-ai-700 border-ai-300';
                  else if (stage === 2) cls = 'bg-midori-50 text-midori-700 border-midori-300';
                  else if (stage === 3) cls = 'bg-fuji-50 text-fuji-700 border-fuji-300';
                  else if (stage === 4) { cls = 'bg-shu-50 text-shu-700 border-shu-400'; extra = 'kkm-sheen'; }
                  if (isCurrent) { cls = 'bg-shu-600 text-white border-shu-700 shadow-md'; extra = 'kkm-pulse-ring'; }
                  return (
                    <button key={i} onClick={() => onSelect(char)}
                      aria-label={`${char}${stage >= 4 ? '（かんぺき）' : ''}`}
                      aria-current={isCurrent ? 'true' : undefined}
                      className={`kkm-glyph kkm-btn aspect-square rounded-lg text-2xl md:text-3xl border-2 relative ${cls} ${extra}`}>
                      {char}
                      {!isCurrent && stage > 0 && (
                        <StageMark stage={stage} className="absolute -top-1 -right-1 leading-none"/>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 学習だんかいの はんれい（この色は なにを あらわすか）。
            もじを えらぶ ときには 要らない ので、ひろい画面だけに 出す。 */}
        <div className="hidden lg:flex mt-3 pt-2 border-t border-sumi-200 flex-wrap justify-center gap-x-3 gap-y-1 text-xs font-semibold px-1">
          {STAGE_INFO.slice(1).map(s => (
            <span key={s.key} className={`inline-flex items-center gap-1 ${TONES[s.tone].icon}`}>
              <StageMark stage={s.key}/>{s.label}
            </span>
          ))}
        </div>
      </div>

      {/* ⑤ まとめて れんしゅうする */}
      <div className="flex gap-2 mt-2.5 shrink-0">
        <button onClick={onSequence} style={{ '--kkm-shadow-color': '#ded8cd' }}
          className="kkm-btn kkm-ripple kkm-solid flex-1 font-semibold text-base bg-white text-sumi-700 border-2 border-sumi-300 hover:border-shu-400 hover:text-shu-700 flex items-center justify-center gap-2 whitespace-nowrap">
          <IconArrow size={20}/> じゅんばん
        </button>
        <button onClick={onRandom} style={{ '--kkm-shadow-color': '#ded8cd' }}
          className="kkm-btn kkm-ripple kkm-solid flex-1 font-semibold text-base bg-white text-sumi-700 border-2 border-sumi-300 hover:border-shu-400 hover:text-shu-700 flex items-center justify-center gap-2 whitespace-nowrap">
          <IconShuffle size={20}/> ばらばら
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   13. <PracticeBoard> ── 練習キャンバス
   ────────────────────────────────────────────────────────────── */
const TOLERANCE = 0.22; // 始点・終点の許容範囲（大きいほど優しい）

/* ステージごとの さいしょの ひとこと。

   ⚠️ ここに「あと なんかい」を 書かないこと。
      おなじ ことが 見出し・ステップ・ふきだしの 3 か所に ならぶと、
      1年生は どれを 読めば よいか わからなくなる。回数は ステップの
      行（<StageStepper>）だけが 言う。ここは 声かけに 徹する。 */
function stageMascotMessage(char, stage, so) {
  if (!char) return '';
  // 見出しの 1 行に おさまる 長さ（10 字ぐらいまで）に そろえる。
  // 長いと せまい画面で 2 行に なり、そのぶん かきとりの マスが 小さくなる。
  if (stage === 0) return 'かきじゅんを みよう';
  if (stage === 1) return 'なぞって かこう';
  if (stage === 2) return 'じぶんで かこう';
  if (stage === 3) return 'じぶんで かこう';
  return '花丸！ よく できました';
}

/* ちいさい字を 書く「みぎしたの へや」の めじるし。

   ことばを つかわずに 形で 見せる（1年生には「小」も「ちいさい」も
   マスの 中では 読めない・§18.5）。すう値は §3.45 の `SMALL_ROOM` と
   おなじ ＝ よこ・たてとも 50%〜92%。お手本の 字も そこに 入るので、
   点線と お手本と 採点が かならず 一致する。

   ⚠️ 「かく」画面・かきじゅんアニメ・マス表示（KanaCell）・とくべつの
      かきとり（WriteCell）で かならず おなじ ものを つかうこと。
      1 か所だけ ちがうと「どこに 書くのか」が 画面ごとに 変わる。 */
function SmallKanaRoom({ tone = 'border-shu-300', fill = false }) {
  return (
    <span aria-hidden="true"
      className={`absolute right-[8%] bottom-[8%] w-[42%] h-[42%] rounded-[3px] border-2 border-dashed pointer-events-none ${tone} ${fill ? 'bg-shu-50/50' : ''}`}/>
  );
}

/* ちいさい字（っ ゃ ゅ ょ …）を、その へやの 中に そろえて 出す（§3.46）。

   マスと おなじ 109 の ざひょうけいの SVG に 置くので、マスが
   何 px でも ずれない。大きさ・いちは お手本（`placeSmallKana`）と
   おなじ きまりから 出しているので、画面の 字と お手本と 採点が そろう。

   色は `fill="currentColor"`。マスの 状態（ok / ng / hint …）の
   文字色を そのまま つぐ。

   ⚠️ 字が 測れない ブラウザでは、これまでどおり マスの まん中に 出す。
      いちが そろわないのは こまるが、字が 消えるよりは ましなので。
      `size` は その ときに つかう マスの 一辺（px）。 */
function SmallKanaGlyph({ char, size }) {
  const ink = useGlyphInk(char);
  if (!ink) {
    return <span className="kkm-glyph relative leading-none" style={{ fontSize: size * 0.62 }}>{char}</span>;
  }
  const { fontSize, x, y } = fitInkToSmallRoom(ink);
  return (
    <>
      <svg aria-hidden="true" viewBox={`0 0 ${KVG_UNIT} ${KVG_UNIT}`}
        className="absolute inset-0 w-full h-full pointer-events-none">
        <text className="kkm-glyph" x={x} y={y} fontSize={fontSize} fill="currentColor">{char}</text>
      </svg>
      {/* 字は SVG の 中に 入るので、読みあげ用に 本文としても 置いておく */}
      <span className="sr-only">{char}</span>
    </>
  );
}

function PracticeBoard({ char, paths, stageObj, onAnimeViewed, onRoundComplete, onMistakeStreakReset, onStrokeCountMismatch, onWriteAttempt, practiceCount, voiceOn, onGoToWords, onNextChar, fetchError, onRetryFetch }) {
  const writeRef = useRef(null);
  const inkRef   = useRef(null);
  const guideRef = useRef(null);
  const [currentStroke, setCurrentStroke] = useState(0);
  const [isCleared, setIsCleared] = useState(false);
  const [showAnime, setShowAnime] = useState(false);
  const [mistakes, setMistakes]   = useState(0);
  const [hasMistaken, setHasMistaken] = useState(false);
  const [mascotMsg, setMascotMsg] = useState('');
  const [mascotMood, setMascotMood] = useState('cheer');
  const prevStageRef = useRef(stageObj?.stage ?? 0);
  const [stageUp, setStageUp] = useState(null); // { from, to }
  const [scoreInfo, setScoreInfo] = useState(null); // { total, breakdown, comment, passed }
  const drawingRef = useRef(false);
  const lastRef    = useRef({ x: 0, y: 0 });
  // 自力モードでユーザーが書いた画ごとの点列 [{points:[{x,y in 0..1}]}, ...]
  const userStrokesRef   = useRef([]);
  const currentPointsRef = useRef([]);
  // なぞり書きモード：失敗した画を取り消すために、書き始め直前の writeRef
  // の中身を別キャンバスに drawImage で複製しておく（getImageData はretina
  // で重く、CSP next-tick で iOS が停止することがある）。
  const traceSnapshotRef = useRef(null); // HTMLCanvasElement
  // 現在アクティブなポインター ID（一本指でしか書かせない）
  const activePointerRef = useRef(null);
  // 一度でも pen 入力を受けたら以後は pen を優先しタッチ系を弾く（パームリジェクション）
  const sawPenRef = useRef(false);
  // 高頻度な pointermove を rAF で合流させて 1 フレーム 1 描画に抑える
  const pendingPointsRef = useRef([]);
  const rafIdRef = useRef(0);
  // 1文字ぶん書きおえたあとの「お祝い → リセット」タイマー。
  // 途中で別の文字に切りかえられたときに取り消せるよう ref で持つ
  // （放っておくと、次の文字で書きはじめた線が消されてしまう）。
  const resetTimerRef = useRef(0);
  function clearResetTimer() {
    if (resetTimerRef.current) { clearTimeout(resetTimerRef.current); resetTimerRef.current = 0; }
  }
  /* 学習ログ：1 かい ぶん（1 文字を 書きおえる／採点する）の 記録に つかう。
     ・roundStartRef … その 1 かいを 書きはじめた 時刻（`item.ms`）
     ・roundMissRef  … その 1 かいの 中で まちがえた かず（`item.tries`）
     ・roundHintRef  … かきじゅんアニメ を 見たか（`item.hint`）
     どれも 画面には ださない。1 かいが おわるたび 0 に もどす。 */
  const roundStartRef = useRef(Date.now());
  const roundMissRef  = useRef(0);
  const roundHintRef  = useRef(false);
  function resetRoundLog() {
    roundStartRef.current = Date.now();
    roundMissRef.current = 0;
    roundHintRef.current = false;
  }

  // まちがえたときに マスを ゆらす（アニメーションが終わったら class を外す）
  const [shaking, setShaking] = useState(false);
  const shakeTimerRef = useRef(0);
  function clearShakeTimer() {
    if (shakeTimerRef.current) { clearTimeout(shakeTimerRef.current); shakeTimerRef.current = 0; }
  }
  useEffect(() => clearShakeTimer, []);

  // ステージから派生するモード
  const stage = stageObj?.stage ?? 0;
  const isTraceMode = stage < 2;   // ステージ0,1 → なぞり書き（ガイド表示）
  // 最新stateをrefにキャッシュ（native event listenerでのstale closure対策）
  const stateRef = useRef({});
  stateRef.current = { paths, currentStroke, isCleared, char, mistakes, hasMistaken, voiceOn, stage };

  /* --- ライフサイクル --- */
  useEffect(() => {
    clearResetTimer();
    setCurrentStroke(0); setIsCleared(false);
    setMistakes(0); setHasMistaken(false);
    // 未学習の文字を選んだら、まず書き順アニメを自動再生（スキップ可）
    // ただし、まだ paths が届いていない／取得失敗のときはアニメを開かない。
    const initialStage = stageObj?.stage ?? 0;
    prevStageRef.current = initialStage;
    if (char && initialStage === 0 && paths && paths.length > 0) {
      setShowAnime(true);
    } else {
      setShowAnime(false);
    }
    setMascotMsg(char ? stageMascotMessage(char, initialStage, stageObj) : '');
    setMascotMood(initialStage >= 4 ? 'wow' : 'cheer');
    resetRoundLog();
    clearAll();
    if (char) requestAnimationFrame(() => { resize(); redrawGuide(); });
    if (char && voiceOn) setTimeout(() => speakText(char, voiceOn), 200);
    // eslint-disable-next-line
  }, [char, paths]);

  // ステージアップ検知（セクション終わりにだけ「よくできました」を演出）
  useEffect(() => {
    const prev = prevStageRef.current;
    if (stage > prev) {
      if (stage >= 2) {
        setStageUp({ from: prev, to: stage });
        playFanfare();
        burstConfetti();
        hapticTriumph();
        if (voiceOn) setTimeout(() => speakText('よくできました', voiceOn), 200);
      }
      if (stage === 3) {
        setMascotMsg('あと ひといき！ ことばを 1こ あつめて 花丸に しよう');
        setMascotMood('wow');
      } else if (stage === 2) {
        setMascotMsg('なぞり ばっちり！ こんどは おてほん なしで かいてみよう');
        setMascotMood('wow');
      } else if (stage === 4) {
        setMascotMsg('花丸！ かんぺきです');
        setMascotMood('wow');
      } else if (stage === 1) {
        // 書き順アニメをみたあとは、つぎになぞるよう声をかける
        setMascotMsg(stageMascotMessage(char, 1, stageObj));
        setMascotMood('cheer');
      }
    } else if (stage < prev) {
      // ステージダウン（画数違い等でやり直し）：かきじゅんアニメ → なぞり書きへ
      setScoreInfo(null);
      setCurrentStroke(0);
      setMistakes(0); setHasMistaken(false);
      clearAll();
      requestAnimationFrame(() => { redrawGuide(); });
      setShowAnime(true);
      setMascotMsg('かくすうを そろえて かいてみよう！ まずは かきじゅんを みてね');
      setMascotMood('sad');
    }
    prevStageRef.current = stage;
  }, [stage]);

  useEffect(() => {
    const onR = () => { resize(); redrawGuide(); redrawInk(); };
    window.addEventListener('resize', onR);
    // メディアクエリやflexレイアウト変動でキャンバスのCSSサイズが変わったときも追従。
    // （回転だけでなく、マスコット/ステッパー等の表示切替にも対応）
    let ro = null;
    if (typeof ResizeObserver !== 'undefined' && writeRef.current) {
      ro = new ResizeObserver(() => { resize(); redrawGuide(); redrawInk(); });
      ro.observe(writeRef.current);
    }
    return () => {
      window.removeEventListener('resize', onR);
      if (ro) ro.disconnect();
    };
  }, []);

  // ※ お手本は かきじゅんデータから描くので、Web フォントの読み込み完了を
  //   待って描きなおす必要はない（書体が変わっても お手本の形は変わらない）。

  useEffect(() => { redrawInk(); /* eslint-disable-line */ }, [currentStroke, paths]);
  // ステージが変わるとガイドの表示も切り替わる
  useEffect(() => { redrawGuide(); /* eslint-disable-line */ }, [stage]);

  /* --- 入力：Pointer Events に一本化（マウス/タッチ/ペン）---
     ・touchstart + onMouseDown の二重発火を解消
     ・setPointerCapture で指が要素外に出ても追従
     ・pen を一度でも認識したら以後 touch を無視（手のひら誤入力対策）
     ・pointermove は rAF にバッチして 60fps に揃える
     ・preventDefault は touch-action:none と組み合わせてスクロールを抑止 */
  useEffect(() => {
    const canvas = writeRef.current;
    if (!canvas) return;

    function shouldAccept(e) {
      // pen を一度でも受けたら touch は無視する。マウスは常に受ける。
      if (e.pointerType === 'touch' && sawPenRef.current) return false;
      return true;
    }

    function onPointerDown(e) {
      if (!shouldAccept(e)) return;
      if (e.pointerType === 'pen') sawPenRef.current = true;
      if (activePointerRef.current !== null) return; // すでに別ポインター描画中
      activePointerRef.current = e.pointerId;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault();
      doStart(e.clientX, e.clientY);
    }
    function onPointerMove(e) {
      if (activePointerRef.current !== e.pointerId) return;
      // getCoalescedEvents で取りこぼしのない高解像度入力にする
      const events = (typeof e.getCoalescedEvents === 'function' && e.getCoalescedEvents().length > 0)
        ? e.getCoalescedEvents() : [e];
      for (const ev of events) pendingPointsRef.current.push({ x: ev.clientX, y: ev.clientY });
      e.preventDefault();
      scheduleFlush();
    }
    function onPointerEnd(e) {
      if (activePointerRef.current !== e.pointerId) return;
      activePointerRef.current = null;
      try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}
      // 残った point を吐き出してから end
      flushPoints();
      e.preventDefault();
      doEnd();
    }
    function onPointerCancel(e) {
      if (activePointerRef.current !== e.pointerId) return;
      activePointerRef.current = null;
      pendingPointsRef.current = [];
      drawingRef.current = false;
      // 取り消し（失敗扱いではなく無効化）
      currentPointsRef.current = [];
    }

    canvas.addEventListener('pointerdown',   onPointerDown);
    canvas.addEventListener('pointermove',   onPointerMove);
    canvas.addEventListener('pointerup',     onPointerEnd);
    canvas.addEventListener('pointercancel', onPointerCancel);
    // iOS Safari のスクロール抑止
    const block = (e) => { if (drawingRef.current) e.preventDefault(); };
    canvas.addEventListener('touchmove', block, { passive: false });

    return () => {
      canvas.removeEventListener('pointerdown',   onPointerDown);
      canvas.removeEventListener('pointermove',   onPointerMove);
      canvas.removeEventListener('pointerup',     onPointerEnd);
      canvas.removeEventListener('pointercancel', onPointerCancel);
      canvas.removeEventListener('touchmove',     block);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = 0;
      pendingPointsRef.current = [];
      clearResetTimer();
    };
    // eslint-disable-next-line
  }, []);

  // rAF バッチ：1 フレームに蓄積した点をひと続きの lineTo として描く
  function scheduleFlush() {
    if (rafIdRef.current) return;
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = 0;
      flushPoints();
    });
  }
  function flushPoints() {
    const points = pendingPointsRef.current;
    if (points.length === 0) return;
    pendingPointsRef.current = [];
    for (const p of points) doMove(p.x, p.y);
  }

  /* --- 描画ヘルパー --- */
  function clearAll() {
    [writeRef, inkRef, guideRef].forEach(r => {
      const c = r.current; if (!c) return;
      const ctx = c.getContext('2d'); ctx.clearRect(0, 0, c.width, c.height);
    });
    userStrokesRef.current = [];
    currentPointsRef.current = [];
    traceSnapshotRef.current = null;
  }
  function resize() {
    const c = writeRef.current; if (!c) return;
    const rect = c.getBoundingClientRect();
    const cssSize = Math.round(Math.min(rect.width, rect.height));
    if (cssSize <= 0) return;
    // Retina ディスプレイで線がぼやけないよう、内部解像度を DPR 倍に上げる。
    // 描画コード側は `c.width`（= raster）を「論理サイズ」として扱っているため
    // setTransform は使わず、座標変換側で raster ピクセルへ換算する。
    // CSS 側は依然として親要素フィット（100%×100%）で描画される。
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pixelSize = Math.round(cssSize * dpr);
    [writeRef, inkRef, guideRef].forEach(r => {
      const cv = r.current;
      if (!cv) return;
      if (cv.width !== pixelSize || cv.height !== pixelSize) {
        cv.width = pixelSize; cv.height = pixelSize;
      }
    });
  }
  /* お手本（うすい文字）を描く。

     お手本は フォントではなく、かきじゅんデータ（KanjiVG）そのものを描く。
     書き順アニメ・書きはじめの赤い点・採点は もともと KanjiVG の座標を
     見ているので、お手本も同じデータから描けば

       ・アニメで見た形と なぞる形が ぴったり同じになる
       ・赤い点が かならず 線の書きはじめの上に のる
       ・端末に教科書体が入っているかどうかで お手本の形が変わらない

     という 3 つが いちどに そろう。
     （フォントで描いていたころは、字形が KanjiVG と別ものだったため、
       外形を合わせても 線の内側の位置までは 合わせられなかった。） */
  function redrawGuide() {
    const c = guideRef.current; if (!c) return;
    const ctx = c.getContext('2d'); const s = c.width;
    ctx.clearRect(0, 0, s, s);
    // 自力モード（ステージ2以上）ではガイドを描かない
    if (stateRef.current.stage >= 2) return;
    const paths = stateRef.current.paths;
    if (!paths || paths.length === 0) return;
    ctx.save();
    ctx.scale(s / 109, s / 109);   // KanjiVG の 109 座標系にそろえる
    ctx.strokeStyle = themeColor('--kkm-guide', '#e5ded0');
    ctx.lineWidth = KVG_STROKE_W;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const d of paths) drawKvgStroke(ctx, d);
    ctx.restore();
  }
  // inkRef は書きおえた画を別レイヤーに出すための予備。いまは
  // 子どもが書いた線（writeRef）がそのまま残るので、クリアするだけ。
  function redrawInk() {
    const c = inkRef.current; if (!c) return;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
  }

  /* --- 座標変換ヘルパー --- */
  function toCanvas(clientX, clientY) {
    const c = writeRef.current; if (!c) return null;
    const rect = c.getBoundingClientRect();
    const nx = (clientX - rect.left) / rect.width;
    const ny = (clientY - rect.top)  / rect.height;
    return { nx, ny, cx: nx * c.width, cy: ny * c.height };
  }

  /* --- 描画ロジック（Pointer Events / マウス共用） --- */
  // バックアップ用キャンバスを取得（lazy 生成）
  function getBackupCanvas() {
    let b = traceSnapshotRef.current;
    const main = writeRef.current;
    if (!main) return null;
    if (!b) {
      b = document.createElement('canvas');
      traceSnapshotRef.current = b;
    }
    if (b.width !== main.width || b.height !== main.height) {
      b.width = main.width; b.height = main.height;
    }
    return b;
  }
  function doStart(clientX, clientY) {
    const { paths: ps, currentStroke: cs, isCleared: ic, stage: st } = stateRef.current;
    if (!ps || ps.length === 0 || ic) return;
    initAudio();
    const pt = toCanvas(clientX, clientY); if (!pt) return;
    if (st < 2) {
      // なぞり書き：かきじゅんを厳しくチェック
      if (cs >= ps.length) return;
      const target = getStartEndPoints(ps[cs]).s;
      const dist = Math.hypot(pt.nx - target.x, pt.ny - target.y);
      if (dist > TOLERANCE) { onMistake(); return; }
    }
    drawingRef.current = true;
    lastRef.current = { x: pt.cx, y: pt.cy };
    // 自力モード：この画の点列を新たに記録しはじめる
    if (st >= 2) currentPointsRef.current = [{ x: pt.nx, y: pt.ny }];
    const c = writeRef.current;
    // なぞり書き：失敗時にこの画だけ取り消せるよう、書き始め前を別キャンバスに退避。
    // drawImage は GPU 経路を通り、getImageData/putImageData よりも高速。
    if (st < 2) {
      const b = getBackupCanvas();
      if (b) {
        const bctx = b.getContext('2d');
        bctx.clearRect(0, 0, b.width, b.height);
        bctx.drawImage(c, 0, 0);
      }
    }
    const ctx = c.getContext('2d');
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineWidth = c.width * 0.07;
    // なぞり書きは 朱色（赤えんぴつ）、じぶんで書くときは 墨色。
    // どちらも すきとおらない色にすること。半とうめいだと、1 画を細かい線分に
    // わけて描くたびに 丸い線のはしが かさなって、数珠つなぎの点々に見えてしまう。
    ctx.strokeStyle = st >= 2
      ? themeColor('--kkm-sumi', '#2e2a25')
      : themeColor('--kkm-shu-light', '#d97e65');
    ctx.beginPath(); ctx.moveTo(pt.cx, pt.cy); ctx.lineTo(pt.cx + 0.01, pt.cy + 0.01); ctx.stroke();
    hapticTick();
  }
  function doMove(clientX, clientY) {
    if (!drawingRef.current) return;
    const pt = toCanvas(clientX, clientY); if (!pt) return;
    if (stateRef.current.stage >= 2) currentPointsRef.current.push({ x: pt.nx, y: pt.ny });
    const ctx = writeRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(lastRef.current.x, lastRef.current.y);
    ctx.lineTo(pt.cx, pt.cy);
    ctx.stroke();
    lastRef.current = { x: pt.cx, y: pt.cy };
  }
  function doEnd() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const { paths: ps, currentStroke: cs, char: ch, hasMistaken: hm, stage: st } = stateRef.current;
    if (!ps || ps.length === 0) return;
    if (st >= 2) {
      // 自力モード：採点しないでインクをそのまま残す（「できた」ボタンで採点）
      // タップだけの誤入力（点列が短すぎる）は画として数えない
      const pts = currentPointsRef.current || [];
      let span = 0;
      for (let i = 1; i < pts.length; i++) span += Math.hypot(pts[i].x - pts[i-1].x, pts[i].y - pts[i-1].y);
      if (pts.length >= 2 && span > 0.02) {
        userStrokesRef.current.push({ points: pts });
        setCurrentStroke(s => s + 1);
      }
      currentPointsRef.current = [];
      return;
    }
    const target = getStartEndPoints(ps[cs]).e;
    const c = writeRef.current;
    const nx = lastRef.current.x / c.width;
    const ny = lastRef.current.y / c.height;
    const dist = Math.hypot(nx - target.x, ny - target.y);
    if (dist < TOLERANCE) {
      // 成功
      hapticOk();
      const next = cs + 1;
      setCurrentStroke(next);
      if (next >= ps.length) {
        playPingPong();
        setMascotMsg('できたよ！'); setMascotMood('happy');
        // 「花丸・よくできました」を出すあいだは書けないようにする（isCleared）。
        // これまで true にする箇所が無く、演出がまったく出ていなかった。
        setIsCleared(true);
        onRoundComplete(ch, !hm);
        /* 学習ログ：なぞり書きの 1 かい（§3.10.2）。
           お手本を なぞって 書けたので `ok: true`、けれど **お手本という
           こたえが 出ている** ので `hint: true` かつ `firstTry: false` にする。
           なぞりを 初回正答に 数えると、なぞりを くりかえす 児童ほど
           正答率が 高く 見える 逆転が 起きる。
           このレコードは `ext.guided: true` が つくので、受信側でも
           正答率の 集計から 外れる（§9.3.1）。 */
        onWriteAttempt && onWriteAttempt(ch, {
          guided: true, stage: st,
          ok: true, firstTry: false, hint: true,
          tries: roundMissRef.current + 1,
          ms: Date.now() - roundStartRef.current,
        });
        resetRoundLog();
        clearResetTimer();
        resetTimerRef.current = setTimeout(() => {
          resetTimerRef.current = 0;
          setCurrentStroke(0); setIsCleared(false);
          setMistakes(0); setHasMistaken(false);
          clearAll(); redrawGuide();
        }, 1300);   // ExcellentPopup の演出（出る→見せる→消える）が終わる長さ
      } else {
        playPingPong();
        setMascotMsg('いい ちょうし！'); setMascotMood('happy');
        setMistakes(0);
      }
    } else {
      // 失敗：この画ぶんのインクだけ取り消す（既存の成功画は残す）
      const snap = traceSnapshotRef.current;
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, c.width, c.height);
      if (snap) ctx.drawImage(snap, 0, 0);
      onMistake();
    }
  }
  function onMistake() {
    playBuzzer();
    hapticErr();
    setHasMistaken(true);
    roundMissRef.current += 1;
    // まちがえたことが 目でもわかるように、マスを ひとゆすりする
    setShaking(true);
    clearShakeTimer();
    shakeTimerRef.current = setTimeout(() => { shakeTimerRef.current = 0; setShaking(false); }, 420);
    // 自力モード（ステージ2以上）では、ミスした瞬間にれんぞくカウントをリセット
    if (stateRef.current.stage >= 2) {
      onMistakeStreakReset && onMistakeStreakReset(stateRef.current.char);
    }
    setMistakes(m => {
      const nm = m + 1;
      if (nm >= 3) {
        // ３回まちがえたら自動で書き順アニメ
        setShowAnime(true);
        setMascotMsg('かきじゅんを みてみよう'); setMascotMood('sad');
        return 0;
      } else {
        setMascotMsg(nm === 1 ? 'あかい ○ の ところから かいてね' : 'もういちど ちょうせん！');
        setMascotMood('sad');
        return nm;
      }
    });
  }
  // かきじゅんアニメ＝**こたえそのもの**。見た 1 かいは 初回正答に 数えない（§2.10）
  useEffect(() => { if (showAnime) roundHintRef.current = true; }, [showAnime]);

  function restart() {
    clearResetTimer();
    setCurrentStroke(0); setIsCleared(false);
    setMistakes(0); setHasMistaken(false);
    resetRoundLog();
    clearAll(); redrawGuide();
    setMascotMsg('もう いっかい がんばろう！'); setMascotMood('cheer');
  }

  // 自力モードの採点：「できた」ボタンで呼ばれる
  function submitFreeWrite() {
    const { paths: ps, char: ch, stage: st } = stateRef.current;
    if (st < 2 || !ps || ps.length === 0 || !writeRef.current) return;
    const userStrokes = userStrokesRef.current;
    if (!userStrokes || userStrokes.length === 0) {
      setMascotMsg('まだ なにも かいてないよ！'); setMascotMood('sad');
      return;
    }
    // 画数チェック（絶対条件）：違うときは採点せず、かきじゅんからやり直し
    if (userStrokes.length !== ps.length) {
      playBuzzer();
      setMascotMsg(`かくすうが ちがうよ（${userStrokes.length}→${ps.length}かく）`);
      setMascotMood('sad');
      if (voiceOn) setTimeout(() => speakText('かくすうが ちがいます。もういちど かきじゅんから みてみよう', voiceOn), 150);
      onMistakeStreakReset && onMistakeStreakReset(ch);
      onStrokeCountMismatch && onStrokeCountMismatch(ch);
      /* 学習ログ：画数が ちがう＝この 1 かいは 書けていない。
         採点まで たどりつかないので `onRoundComplete` は 呼ばれないが、
         ここで 落とすと「書こうとして できなかった」が まるごと 消える。 */
      onWriteAttempt && onWriteAttempt(ch, {
        guided: false, stage: st,
        ok: false, firstTry: false, hint: roundHintRef.current,
        tries: roundMissRef.current + 1,
        ms: Date.now() - roundStartRef.current,
      });
      resetRoundLog();
      // ステージダウン effect でキャンバス・ストローク履歴がクリアされる
      return;
    }
    const result = scoreHandwriting(userStrokes, ps);
    if (!result) return;
    setScoreInfo(result);
    if (result.passed) { playFanfare(); hapticTriumph(); }
    else { playPingPong(); hapticOk(); }
    if (voiceOn) setTimeout(() => speakText(`${result.total}てん`, voiceOn), 150);
    onRoundComplete(ch, result.passed);
    /* 学習ログ：自力書きの 1 かい（§3.10.2）。
       **初回正答は 自力書きだけ から 数える。** ここでの 初回正答は
       「かきじゅんアニメ（＝こたえ）を 見ず、やり直しも せずに 合格した」こと。
       ヒントを 見て 合格した 回を 初回正答に すると、支援を 多く うけた
       児童ほど 成績が よく 見える 逆転が 起きる（§2.10）。 */
    onWriteAttempt && onWriteAttempt(ch, {
      guided: false, stage: st,
      ok: result.passed,
      firstTry: result.passed && roundMissRef.current === 0 && !roundHintRef.current,
      hint: roundHintRef.current,
      tries: roundMissRef.current + 1,
      ms: Date.now() - roundStartRef.current,
    });
    resetRoundLog();
  }
  function closeScorePopup() {
    clearResetTimer();
    setScoreInfo(null);
    // ステップアップの おしらせは 採点の画面の 中で 出しきっているので、
    // ここで 落とす。落とさないと 閉じた あとに もう いちど 出てくる。
    setStageUp(null);
    setCurrentStroke(0); setMistakes(0); setHasMistaken(false);
    clearAll();
    setMascotMsg(stageMascotMessage(char, stage, stageObj));
    setMascotMood(stage >= 4 ? 'wow' : 'cheer');
  }

  /* つぎに 押す ボタンを 決める。

     1年生が いちばん こまるのは「書けた。……で、つぎは？」の ところ。
     とくに『じぶんで かく』を クリアしても、ことばを あつめるまでは
     花丸に ならないので、書く画面に とどまったまま 手が 止まってしまう。
     そこで **1 かい 書きおわるたび**に つぎの 一手を 出す。
     まよわせないよう、いちばん 大きい ボタンは いつも 1 つだけにする。 */
  function nextStepActions(result) {
    const st = stage;
    const passed = !!result?.passed;
    const hasNext = !!onNextChar;
    const left = Math.max(0, FREE_REQUIRED - (stageObj?.freeStreak || 0));
    const again = { key: 'again', label: 'もう いちど かく', icon: <IconRotate size={16}/> };
    const anime = { key: 'anime', label: 'かきじゅんを みる', icon: <IconPlay size={16}/>,
                    onClick: () => { if (paths && paths.length > 0) setShowAnime(true); } };
    const next  = { key: 'next', label: 'つぎの もじへ', icon: <IconArrow size={16}/>, onClick: onNextChar };

    if (!passed) {
      return [{ ...again, label: 'もう いちど かく', tone: 'shu', icon: <IconRotate size={18}/> }, anime];
    }
    if (st >= 4) {
      return [hasNext ? { ...next, tone: 'shu', icon: <IconArrow size={18}/> } : { ...again, tone: 'shu' }, hasNext ? again : anime];
    }
    if (st === 3) {
      return [
        { key: 'words', label: 'ことばを あつめる', sub: 'あと 1こで 花丸！', tone: 'shu',
          icon: <Hanamaru size={18} color="#fff"/>, onClick: onGoToWords },
        hasNext ? next : null,
        { ...again, plain: true },
      ].filter(Boolean);
    }
    // ステージ2（じぶんで かく の れんしゅう中）
    return [{ key: 'again', label: 'つづけて かく', sub: `あと ${left} かい`, tone: 'shu',
              icon: <IconPen size={18}/> }];
  }

  /* --- 始点ヒント（赤い点滅マーカー） --- */
  const startHint = useMemo(() => {
    if (!paths || paths.length === 0 || currentStroke >= paths.length || isCleared) return null;
    // 自力モードでは始点ヒントを出さない（どこから書いてもよい）
    if (stage >= 2) return null;
    const s = getStartEndPoints(paths[currentStroke]).s;
    return { x: s.x * 100, y: s.y * 100 };
  }, [paths, currentStroke, isCleared, stage]);

  return (
    <div className="kkm-sheet rounded-xl p-2 md:p-3 flex flex-col h-full min-h-0 kkm-practice-board">
      {/* ── 見出しは 1 行にまとめる ────────────────────────────────
          もとは「いま なにを するか」「ステップ」「マスコットの ひとこと」を
          たて 3 段に ならべていた。字を 大きくした ぶん この 3 段だけで
          187px を つかい、**いちばん 大事な かきとりの マスが 小さく**なった。

          言っている ことは どれも 近いので、1 行に たたむ。
            えんぴつせんせい の ひとこと … いま なにを するか（＋ 声かけ）
            ●─●─○─○ と 「あと n かい」  … どこまで きたか
          ひろい画面では 1 行、せまい画面では 2 行に 折りかえす（flex-wrap）。 */}
      {char && (
        <div className="flex items-center gap-2 flex-wrap mb-2 shrink-0 kkm-board-header">
          {/* basis を きめておく（flex-1 だけだと、せまい画面で 折りかえさずに
              つぶれて、ひとことが まるごと 消えてしまう）。
              ひろい画面では ステップと よこに ならび、せまい画面では 下に 折れる。 */}
          <div className={`flex items-center gap-2 grow basis-[10rem] min-w-0 rounded-lg border-2 pr-2.5 ${
            isTraceMode ? 'bg-midori-50 border-midori-300' : 'bg-fuji-50 border-fuji-300'
          }`}>
            <span className="shrink-0 pl-1.5 py-0.5"><MascotFace size={34} mood={mascotMood}/></span>
            {/* 長い ひとこと（「かくすうが ちがうよ」など）は 2 行までは 折りかえす。
                truncate（1 行で 切る）に すると、だいじな しらせが 読めなくなる。 */}
            <span key={mascotMsg}
              className={`kkm-fade-in text-base sm:text-lg font-semibold leading-snug line-clamp-2 ${
                isTraceMode ? 'text-midori-700' : 'text-fuji-700'
              }`}>
              <Furi>{mascotMsg}</Furi>
            </span>
          </div>
          <StageStepper stage={stage} stageObj={stageObj}/>
        </div>
      )}
      {!char && (
        <div className="mb-2 shrink-0 kkm-board-header">
          <span className="text-lg font-semibold px-3 py-1.5 rounded-lg border-2 text-sumi-600 bg-washi-100 border-sumi-300">
            もじを えらんでください
          </span>
        </div>
      )}

      {/* かきとりのマス（原稿用紙のマス目のイメージ） */}
      <div className="flex-1 flex items-center justify-center min-h-0 min-w-0 relative w-full kkm-square-fit-container">
        <div className={`relative bg-white rounded-md border-2 overflow-hidden kkm-square-fit ${
              shaking ? 'border-shu-500 kkm-shake' : 'border-shu-300'
            }`}>
          <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-shu-200 pointer-events-none z-[5]"/>
          <div className="absolute left-1/2 top-0 bottom-0 border-l border-dashed border-shu-200 pointer-events-none z-[5]"/>
          {/* ちいさい字は みぎしたの へやに 小さく 書く（§3.45） */}
          {isSmallKana(char) && <span className="absolute inset-0 z-[6]"><SmallKanaRoom/></span>}
          <canvas ref={guideRef} className="absolute inset-0 w-full h-full z-[1]"/>
          <canvas ref={inkRef}   className="absolute inset-0 w-full h-full z-[10]"/>
          {/* 始点ヒント（朱色の点滅マーカー）。
              いれものは かならず 正方形（w-5 h-5）にして、中の丸を absolute で
              ぴったり重ねる。inline-flex のままだと 行のベースラインぶんだけ
              いれものが たてに のびて、点が 数 px 上にずれてしまう。 */}
          {startHint && (
            <div className="absolute z-[15] pointer-events-none w-5 h-5"
                 style={{ left: `${startHint.x}%`, top: `${startHint.y}%`, transform: 'translate(-50%, -50%)' }}>
              <span className="absolute inset-0 block rounded-full bg-shu-400 opacity-70 animate-ping"/>
              <span className="absolute inset-0 block rounded-full bg-shu-600 border-2 border-white shadow"/>
            </div>
          )}
          <canvas ref={writeRef}
            className="absolute inset-0 w-full h-full z-[20] cursor-crosshair"
            style={{ touchAction: 'none' }}
            role="img"
            aria-label={char ? `${char} のかきとり`: 'もじを えらんでください'}
          />
          {!char && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-sumi-600 gap-2 pointer-events-none" aria-label="もじを えらんでください">
              <IconGrid size={44}/>
              <span className="text-xs font-semibold">もじを えらんでください</span>
            </div>
          )}
          {char && paths === null && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-shu-600 z-[30] pointer-events-none gap-2" role="status" aria-live="polite">
              <div className="kkm-float"><MascotFace size={40} mood="happy"/></div>
              <div className="text-xs font-semibold text-sumi-600">よみこみちゅう…</div>
            </div>
          )}
          {char && fetchError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/92 z-[30] gap-2 p-4 text-center" role="alert">
              <span className="text-sumi-600"><IconWifiOff size={34}/></span>
              <div className="text-sm font-semibold text-shu-700">よみこめなかったよ</div>
              <div className="text-xs text-sumi-600 font-medium">インターネットが つながって いるか たしかめてね</div>
              <button onClick={onRetryFetch}
                className="kkm-btn kkm-ripple mt-1 px-4 py-2 rounded-md bg-shu-600 text-white font-semibold text-sm border border-shu-700 min-h-[44px]">
                もういちど ためす
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 自力モード：「できた」採点ボタン */}
      {char && stage >= 2 && (
        <SubmitButton onSubmit={submitFreeWrite} disabled={!!scoreInfo}/>
      )}

      {/* ステージ3 → ことばで 花丸 への みちしるべ */}
      {char && stage === 3 && (
        <button onClick={onGoToWords}
          className="kkm-cta-btn kkm-btn kkm-ripple mt-2 py-2.5 px-3 rounded-lg bg-shu-50 text-shu-800 font-semibold text-base border-2 border-shu-300 flex items-center justify-center gap-2 shrink-0 min-h-[52px]">
          <Hanamaru size={22}/> ことばを 1こ あつめて <Furi>花丸</Furi>に
          <IconArrow size={20}/>
        </button>
      )}

      {/* 花丸まで いった もじは、この画面に とどまる りゆうが ない。
          「つぎの もじへ」を いつでも 押せるところに 出しておく。 */}
      {char && stage >= 4 && onNextChar && (
        <button onClick={onNextChar} style={{ '--kkm-shadow-color': TONE_DEEP.shu }}
          className="kkm-cta-btn kkm-btn kkm-ripple kkm-solid mt-2 px-3 bg-shu-600 text-white font-semibold text-lg border-2 border-shu-700 flex items-center justify-center gap-2 shrink-0">
          <Furi>花丸</Furi>！ つぎの もじへ <IconArrow size={22}/>
        </button>
      )}

      {/* したの 3 つは「たすけて」の ボタン。
          いつも おなじ ばしょ・おなじ ならびに 置き、字と アイコンを 大きくする。 */}
      <div className="flex gap-2 mt-2.5 shrink-0 kkm-practice-buttons">
        <button onClick={restart} disabled={!char}
          aria-label="ここまでの れんしゅうを やりなおす"
          className="kkm-btn kkm-ripple flex-1 py-2 rounded-lg font-semibold text-base bg-white text-sumi-600 border-2 border-sumi-300 hover:border-sumi-400 disabled:opacity-40 flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-2 min-h-[56px]">
          <IconRotate size={22}/> やりなおし
        </button>
        <button onClick={() => char && speakText(char, voiceOn)} disabled={!char || !voiceOn}
          aria-label={char ? `${char} を よみあげる`: 'もじを よみあげる'}
          className="kkm-btn kkm-ripple flex-1 py-2 rounded-lg font-semibold text-base bg-white text-midori-700 border-2 border-midori-300 hover:bg-midori-50 disabled:opacity-40 flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-2 min-h-[56px]">
          <IconVolume size={22}/> よんで
        </button>
        <button onClick={() => paths && paths.length > 0 && setShowAnime(true)} disabled={!char || !paths || paths.length === 0}
          aria-label="かきじゅんを みる"
          className="kkm-btn kkm-ripple flex-1 py-2 rounded-lg font-semibold text-base bg-white text-ai-700 border-2 border-ai-300 hover:bg-ai-50 disabled:opacity-40 flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-2 min-h-[56px]">
          <IconPlay size={22}/> かきじゅん
        </button>
      </div>

      {showAnime && paths && (
        <StrokeOrderAnime paths={paths} char={char}
          onClose={() => { setShowAnime(false); onAnimeViewed && onAnimeViewed(char); }}/>
      )}
      {isCleared && <ExcellentPopup/>}
      {scoreInfo && (
        <ScorePopup result={scoreInfo} char={char} stageUp={stageUp}
          actions={nextStepActions(scoreInfo)} onClose={closeScorePopup}/>
      )}
      {/* 採点の画面が 出ているときは、その中で ステップアップも 知らせている。
          二重に かさねると 1年生には どちらを 押すのか わからなくなる。 */}
      {stageUp && !scoreInfo && (
        <StageUpPopup info={stageUp} onClose={() => setStageUp(null)}
          onGoToWords={onGoToWords} onNextChar={onNextChar}/>
      )}
    </div>
  );
}

// 連打防止つきの採点ボタン（300ms 以内の二度押しを破棄）
function SubmitButton({ onSubmit, disabled }) {
  const guarded = useDebouncedAction(onSubmit, 350);
  return (
    <button onClick={guarded} disabled={disabled} style={{ '--kkm-shadow-color': TONE_DEEP.shu }}
      className="kkm-cta-btn kkm-btn kkm-ripple kkm-primary mt-2 px-3 bg-shu-600 text-white font-semibold border-2 border-shu-700 flex items-center justify-center gap-2.5 shrink-0 disabled:opacity-60">
      <IconCheck size={26}/> かけた！ さいてん
    </button>
  );
}

/* ──────────────────────────────────────────────────────────────
   13.5. <StageStepper> / <StageUpPopup>

   学習のながれを 4 だんかいに整理して、いつも同じ形で見せる。
     一 かきじゅんを みる → 二 なぞる → 三 じぶんで かく → 四 ことばに つかう
   いま どこに いて、あと どれだけで つぎに すすめるかが 一目でわかるように、
   だんかいの あいだを 線でつなぎ、のこり回数も その場に出す。
   ────────────────────────────────────────────────────────────── */
/* もとは 4 だんかいを 4 まいの 札で ならべ、それぞれに 名まえと 回数を
   そえていた。情報は 正しいが、1年生の 目には 10px の 字が 8 つ ならぶ
   「もよう」に しか 見えず、けっきょく どれも 読まれなかった。

   そこで **今いる 1 つだけを ことばで 言う**。ほかの だんかいは
   まるい しるし（一 二 三 四）だけに して、すすんだ ところを 朱色で ぬる。
   「あと なんかい」も ここに 1 つだけ 出す。 */
function StageStepper({ stage, stageObj }) {
  const steps = [
    { idx: 1, label: 'かきじゅんを みる' },
    { idx: 2, label: 'なぞって かく', left: TRACE_REQUIRED - Math.min(stageObj?.traced || 0, TRACE_REQUIRED) },
    { idx: 3, label: 'じぶんで かく', left: FREE_REQUIRED - Math.min(stageObj?.freeStreak || 0, FREE_REQUIRED) },
    { idx: 4, label: 'ことばに つかう' },
  ];
  // いま とりくんで いる だんかい（ぜんぶ おわっていれば 4）
  const cur = steps.find(s => stage < s.idx) || steps[steps.length - 1];
  const done = stage >= 4;
  /* よこ 1 列に おさめる。かきとりの マスの たかさを けずらないことが
     いちばん だいじなので、ここは たてに つみあげない。 */
  return (
    <div className="flex items-center gap-2 shrink-0 kkm-stepper-row" aria-label="がくしゅうの ステップ">
      {/* まるの ならびは スマホでは 出さない。
         せまい画面で これを 出すと 見出しが 2 行に 折れ、そのぶん
         かきとりの マスが 小さくなる。1年生が 見て うごくのは
         「あと n かい」の ほうなので、そちらを のこす。 */}
      <ol className="hidden sm:flex items-center gap-1">
        {steps.map((s, i) => {
          const info = STAGE_INFO[s.idx];
          const cleared = stage >= s.idx;
          const active = s.idx === cur.idx && !done;
          return (
            <React.Fragment key={s.idx}>
              <li aria-current={active ? 'step' : undefined}
                className={`shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors duration-300 ${
                  cleared ? 'bg-shu-600 border-shu-700 text-white'
                  : active ? 'bg-white border-shu-500 text-shu-700 kkm-pulse-ring'
                  : 'bg-washi-100 border-sumi-200 text-sumi-600'
                }`}>
                {cleared
                  ? <IconCheck size={18}/>
                  : <span className="kkm-glyph text-base leading-none">{info.num}</span>}
              </li>
              {i < steps.length - 1 && (
                <span aria-hidden="true"
                  className={`w-2 h-[3px] rounded-full transition-colors duration-300 ${stage > s.idx ? 'bg-shu-400' : 'bg-sumi-200'}`}/>
              )}
            </React.Fragment>
          );
        })}
      </ol>
      <div className="text-lg font-semibold text-sumi-700 leading-tight whitespace-nowrap">
        {done
          ? <span className="text-shu-700"><Furi>花丸！</Furi></span>
          : cur.left > 0
            ? <>あと <span className="text-2xl tabular-nums text-shu-700">{cur.left}</span> かい</>
            : <span className="text-shu-700">{cur.label}</span>}
      </div>
    </div>
  );
}

/* ステップを ひとつ 上がった ことを 知らせる 画面。

   もとは 数秒で 勝手に 消える 帯だった。読むのに 時間の かかる 1年生には
   「見る まえに 消えた」に なりやすく、しかも 消えたあとは もとの
   書く画面に もどるだけなので、**学習の 区切りに ならなかった。**
   ここは 立ちどまる ところなので、自分で タップするまで 消さない。
   そのかわり つぎに 押す ボタンを かならず 出す。 */
function StageUpPopup({ info, onClose, onGoToWords, onNextChar }) {
  const [show, setShow] = useState(false);
  const close = useCallback(() => {
    setShow(false);
    setTimeout(() => onClose && onClose(), 300);
  }, [onClose]);
  const dialogRef = useModal(close);
  useEffect(() => { setShow(true); }, []);
  const run = useCallback((fn) => {
    setShow(false);
    setTimeout(() => { onClose && onClose(); fn && fn(); }, 300);
  }, [onClose]);

  const m = STAGE_UP_TEXT[info.to];
  if (!m) return null;
  const t = TONES[m.tone];
  // つぎの 一手。3（＝ことば待ち）だけは ことばあつめが 主役。
  const main = info.to === 3 && onGoToWords
    ? { label: 'ことばを あつめる', icon: <Hanamaru size={19} color="#fff"/>, onClick: onGoToWords }
    : info.to >= 4 && onNextChar
      ? { label: 'つぎの もじへ', icon: <IconArrow size={19}/>, onClick: onNextChar }
      : { label: 'つぎへ すすむ', icon: <IconArrow size={19}/>, onClick: null };

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={m.title}
      className={`fixed inset-0 z-[180] flex items-center justify-center bg-sumi-900/35 p-3 transition-opacity duration-300 ${
        show ? 'opacity-100' : 'opacity-0'
      }`}>
      <div className={`bg-white px-5 md:px-7 py-5 md:py-6 rounded-xl shadow-xl border border-sumi-300 border-t-4 ${t.topRule} max-w-sm w-full text-center transition-transform duration-300 ${
        show ? 'scale-100' : 'scale-95'
      }`}>
        <div className="flex items-center justify-center gap-3">
          {/* はんこを おした演出 */}
          <span className={`kkm-stamp shrink-0 w-16 h-16 rounded-lg border-2 text-white flex items-center justify-center ${t.solid}`}>
            {info.to >= 4 ? <Hanamaru size={38} color="#fff" draw/> : <span className="kkm-glyph text-3xl leading-none">{m.num}</span>}
          </span>
          <div className="text-left">
            <div className={`text-2xl font-semibold leading-tight ${t.text}`}><Furi>{m.title}</Furi></div>
            <div className="text-base font-medium text-sumi-600 mt-1"><Furi>{m.sub}</Furi></div>
          </div>
        </div>
        <button onClick={() => run(main.onClick)} autoFocus
          style={{ '--kkm-shadow-color': TONE_DEEP[m.tone] || TONE_DEEP.shu }}
          className={`kkm-cta-btn kkm-btn kkm-ripple kkm-primary mt-5 w-full px-4 text-white font-semibold border-2 flex items-center justify-center gap-2.5 ${t.solid}`}>
          {main.icon} {main.label}
        </button>
        {main.onClick && (
          <button onClick={close}
            className="kkm-btn mt-2 w-full px-4 py-2.5 rounded-lg bg-white border-2 border-sumi-300 text-sumi-700 font-semibold text-base min-h-[52px]">
            もう いちど かく
          </button>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   14. <StrokeOrderAnime>
   ────────────────────────────────────────────────────────────── */
function StrokeOrderAnime({ paths, char, onClose }) {
  const svgRef = useRef(null);
  const [speed, setSpeed] = useState(5);
  const [playing, setPlaying] = useState(false);
  const lengthsRef = useRef([]);
  const dialogRef = useModal(onClose);

  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    svg.innerHTML = '';
    const svgNS = 'http://www.w3.org/2000/svg';
    const bgG = document.createElementNS(svgNS,'g'); svg.appendChild(bgG);
    const stG = document.createElementNS(svgNS,'g'); svg.appendChild(stG);
    const nuG = document.createElementNS(svgNS,'g'); svg.appendChild(nuG);
    const lens = []; const placed = [];
    paths.forEach((d, i) => {
      const bg = document.createElementNS(svgNS,'path');
      // うすい下じきの線。太さは 練習キャンバスのお手本と そろえる。
      bg.setAttribute('d', d); bg.setAttribute('stroke', themeColor('--kkm-guide', '#eae2d2')); bg.setAttribute('stroke-width', KVG_STROKE_W);
      bg.setAttribute('fill','none'); bg.setAttribute('stroke-linecap','round'); bg.setAttribute('stroke-linejoin','round');
      bgG.appendChild(bg);
      // 長さと始点はキャッシュから（DOM 挿入なし）
      const len = getPathLength(d) + 8;
      const se  = getStartEndPoints(d);
      const sp  = { x: se.s.x * 109, y: se.s.y * 109 };
      lens.push(len);
      const p = document.createElementNS(svgNS,'path');
      p.setAttribute('d', d); p.setAttribute('stroke', themeColor('--kkm-sumi', '#2e2a25')); p.setAttribute('stroke-width', KVG_STROKE_W);
      p.setAttribute('fill','none'); p.setAttribute('stroke-linecap','round'); p.setAttribute('stroke-linejoin','round');
      p.id = `kkm-anime-${i}`;
      p.style.strokeDasharray = len; p.style.strokeDashoffset = len; p.style.opacity = '0';
      stG.appendChild(p);
      let cx = Math.max(8, Math.min(101, sp.x - 12));
      let cy = Math.max(8, Math.min(101, sp.y - 12));
      let collision = true, ang = 0, rad = 0, step = 0; const bx = cx, by = cy;
      while (collision && step < 50) {
        collision = false;
        if (cx < 8 || cx > 101 || cy < 8 || cy > 101) collision = true;
        if (!collision) for (const q of placed) if (Math.hypot(cx-q.x, cy-q.y) < 13) { collision = true; break; }
        if (collision) { step++; ang += Math.PI/3; if (step % 6 === 0) rad += 6; cx = bx+Math.cos(ang)*(6+rad); cy = by+Math.sin(ang)*(6+rad); }
      }
      placed.push({ x: cx, y: cy });
      const g = document.createElementNS(svgNS,'g'); g.id = `kkm-num-${i}`; g.style.opacity = '0';
      const c = document.createElementNS(svgNS,'circle');
      c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r','5.5');
      c.setAttribute('fill','#ffffff'); c.setAttribute('stroke',themeColor('--kkm-shu','#b34328')); c.setAttribute('stroke-width','1.2');
      const t = document.createElementNS(svgNS,'text');
      t.setAttribute('x', cx); t.setAttribute('y', cy+0.5);
      t.setAttribute('text-anchor','middle'); t.setAttribute('dominant-baseline','central');
      t.setAttribute('font-size','6'); t.setAttribute('font-weight','700'); t.setAttribute('fill',themeColor('--kkm-shu','#b34328'));
      t.textContent = (i+1).toString();
      g.appendChild(c); g.appendChild(t); nuG.appendChild(g);
    });
    lengthsRef.current = lens;
  }, [paths]);

  async function play() {
    if (playing) return; setPlaying(true); initAudio();
    paths.forEach((_, i) => {
      const p = document.getElementById(`kkm-anime-${i}`);
      const n = document.getElementById(`kkm-num-${i}`);
      if (p) { p.style.transition = 'none'; p.style.strokeDashoffset = lengthsRef.current[i]; p.style.opacity = '0'; }
      if (n) n.style.opacity = '0';
    });
    await new Promise(r => setTimeout(r, 100));
    for (let i = 0; i < paths.length; i++) {
      const p = document.getElementById(`kkm-anime-${i}`);
      const n = document.getElementById(`kkm-num-${i}`); if (!p) continue;
      if (n) n.style.opacity = '1';
      await new Promise(r => setTimeout(r, 400));
      const len = lengthsRef.current[i] || 50;
      const dur = Math.max(220, (len/50) * (11-speed) * 130);
      p.style.opacity = '1';
      p.style.transition = `stroke-dashoffset ${dur}ms linear`;
      void p.getBoundingClientRect();
      p.style.strokeDashoffset = '0';
      playTone(500 + i*40, 'triangle', dur/1000, 0.05);
      await new Promise(r => setTimeout(r, dur+50));
    }
    setPlaying(false);
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-sumi-900/40 backdrop-blur-sm p-2 md:p-4 overflow-auto kkm-fade-in" onClick={onClose}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={`${char} のかきじゅん`}
        className="bg-white rounded-xl shadow-xl border border-sumi-300 border-t-4 border-t-ai-600 p-3 md:p-5 max-w-md w-full my-auto kkm-pop-in" onClick={(e) => { e.stopPropagation(); }}>
        <div className="flex justify-between items-center mb-2.5 gap-2">
          <h3 className="kkm-heading-rule text-lg font-semibold text-sumi-800">「{char}」の かきじゅん</h3>
          <button onClick={onClose} aria-label="とじる"
            className="kkm-btn w-12 h-12 rounded-xl bg-sumi-50 hover:bg-sumi-100 border-2 border-sumi-300 text-sumi-600 flex items-center justify-center min-w-[48px] min-h-[48px]"><IconX size={24}/></button>
        </div>
        <div className="aspect-square bg-white rounded-lg border-2 border-shu-200 relative overflow-hidden mb-3 mx-auto" style={{ maxHeight: 'min(58vh, 58dvh)', maxWidth: '100%', width: 'min(58vh, 58dvh, 100%)' }}>
          <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-shu-200"/>
          <div className="absolute left-1/2 top-0 bottom-0 border-l border-dashed border-shu-200"/>
          {/* かきじゅんアニメでも おなじ へやを 見せる（§3.45） */}
          {isSmallKana(char) && <SmallKanaRoom/>}
          <svg ref={svgRef} viewBox="0 0 109 109" className="w-full h-full relative z-10"/>
        </div>
        {/* ① もういちど 見る（大きく）② はやさ ③ なぞりに すすむ の 3 つだけ。
            1年生が まようのは「見おわった。つぎ どうする？」の ところ なので、
            すすむ ボタンを かならず 出す。 */}
        <div className="flex gap-3 items-center">
          <button onClick={play} disabled={playing} style={{ '--kkm-shadow-color': TONE_DEEP.ai }}
            className="kkm-btn kkm-ripple kkm-solid px-5 font-semibold text-lg text-white bg-ai-600 border-2 border-ai-700 disabled:opacity-50 flex items-center gap-2 shrink-0">
            <IconPlay size={24}/> {playing ? 'さいせいちゅう' : 'みる'}
          </button>
          <div className="flex-1 min-w-0">
            <label className="sr-only" htmlFor="kkm-anime-speed">アニメの はやさ</label>
            <input id="kkm-anime-speed" type="range" min="1" max="10" value={speed} onChange={(e) => setSpeed(+e.target.value)} className="w-full"/>
            <div className="flex justify-between text-sm text-sumi-600 font-semibold"><span>ゆっくり</span><span>はやい</span></div>
          </div>
        </div>
        <button onClick={onClose} style={{ '--kkm-shadow-color': TONE_DEEP.shu }}
          className="kkm-btn kkm-ripple kkm-primary w-full mt-3 bg-shu-600 text-white font-semibold border-2 border-shu-700 flex items-center justify-center gap-2.5">
          <IconPen size={26}/> じぶんで かいて みる
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   15. <ExcellentPopup> ── 1 文字ぶん かきおえた ときの演出

   先生が赤ペンで 花丸を つけてくれるところを そのまま見せる。
   線が１本ずつ 引かれていき、さいごに「よくできました」の はんこが押される。
   ────────────────────────────────────────────────────────────── */
function ExcellentPopup() {
  const [show, setShow] = useState(false);
  // 出る(0.5秒) → 見せる(0.3秒) → 消える(0.5秒)。呼び出し側は 1.3 秒後に外すので、
  // 途中でぶつ切りにならないようここのタイミングと合わせておくこと。
  useEffect(() => { setShow(true); const t = setTimeout(() => setShow(false), 800); return () => clearTimeout(t); }, []);
  return (
    <div className={`fixed inset-0 z-[150] pointer-events-none flex items-center justify-center transition-all duration-500 ${
      show ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
    }`}>
      <div className="flex flex-col items-center gap-2">
        {/* 朱色の花丸を その場で描く */}
        <span className="text-shu-600 drop-shadow-sm">
          <Hanamaru size={168} draw duration={0.55}/>
        </span>
        {/* そのあとに「よくできました」の はんこを おす */}
        <span className="kkm-stamp text-shu-700 bg-white/95 border-2 border-shu-600 rounded-md px-4 py-1.5 shadow-sm"
              style={{ animationDelay: '0.45s' }}>
          <span className="text-lg md:text-2xl font-semibold tracking-[0.2em] whitespace-nowrap">よくできました</span>
        </span>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   15.2. <RedPenReview> ── 赤ペンの 添削を そのまま 見せる

   自分が 書いた 字の うえに、先生が 赤ペンで つける しるしを のせる。
   ・うすい グレー … お手本
   ・こい 黒       … 自分が 書いた せん
   ・朱色         … なおすところ（○・やじるし・なぞり・わく・ばんごう）と
                     よく できた ところ（チェック）

   しるしの 中身は buildRedPenReview（§3.6）が 決める。ここは 描くだけ。
   座標は 0..1 で 受けとり、KanjiVG と おなじ 109 の マスに 直して 描く。
   ────────────────────────────────────────────────────────────── */
const RPR_S = 109;                 // マスの 一辺（KanjiVG の 座標系）
/* しるしを 出す ペース。

   なおすところが 3 つ あっても、いちどに ぜんぶ 描いてはいけない。
   ○ と わくと やじるしが かさなり、赤だらけで 何も 読めなくなる
   （じっさい わくの 線が 字の 線に かさなって、書いた 線が 点線に
   なったように 見えた）。**いちどに 見せるのは 1 か所だけ**にして、
   先生が 1 か所ずつ 赤ペンを 入れていくように 順に 出す。 */
const RPR_MARK_GAP = 0.3;          // おなじ なおすところの 中の しるしの 間（秒）
const RPR_START    = 0.3;          // 字が 出てから 赤ペンが 入るまでの 間
const RPR_STEP_MS  = 3200;         // つぎの なおすところに うつるまで
function rprDelay(index) { return RPR_START + index * RPR_MARK_GAP; }

function RedPenReview({ review, active = 0, label }) {
  if (!review) return null;
  const shu   = themeColor('--kkm-shu', '#b34328');
  const guide = themeColor('--kkm-guide', '#e5ded0');
  const sumi  = themeColor('--kkm-sumi', '#2e2a25');
  const soft  = themeColor('--kkm-sumi-soft', '#7a7267');
  const S = RPR_S;
  const at = (p) => ({ x: p.x * S, y: p.y * S });
  const polyD = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${(p.x * S).toFixed(2)} ${(p.y * S).toFixed(2)}`).join(' ');
  const polyLen = (pts) => {
    let l = 0;
    for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i].x - pts[i-1].x, pts[i].y - pts[i-1].y);
    return l * S;
  };
  // 線を 引いていく 演出（引ききったら そのまま のこる）
  const drawStyle = (len, dur, delay) => ({
    '--kkm-dash': Math.ceil(len) + 6,
    '--kkm-draw-dur': `${dur}s`,
    '--kkm-draw-delay': `${delay}s`,
  });

  const nodes = [];
  {
    const fix = (review.fixes || [])[active];
    (fix?.marks || []).forEach((m, mi) => {
      const delay = rprDelay(mi);
      // active を key に まぜて、なおすところを 切りかえるたび
      // 赤ペンの 線が また 引きなおされるようにする
      const key = `f${active}-${mi}`;
      if (m.kind === 'trace' && m.pts) {
        nodes.push(
          <path key={key} d={polyD(m.pts)} fill="none" stroke={shu} strokeWidth="5"
                strokeLinecap="round" strokeLinejoin="round" opacity="0.75"
                className="kkm-draw" style={drawStyle(polyLen(m.pts), 0.75, delay)}/>
        );
      } else if (m.kind === 'ring' && m.at) {
        const c = at(m.at), r = (m.r || 0.1) * S;
        nodes.push(
          <circle key={key} cx={c.x} cy={c.y} r={r} fill="none" stroke={shu} strokeWidth="3.4"
                  strokeLinecap="round" className="kkm-draw"
                  style={drawStyle(2 * Math.PI * r, 0.5, delay)}/>
        );
      } else if (m.kind === 'arrow' && m.from && m.to) {
        const a = at(m.from), b = at(m.to);
        const vx = b.x - a.x, vy = b.y - a.y;
        const len = Math.hypot(vx, vy) || 1;
        const ux = vx / len, uy = vy / len;
        const h = 8;   // やじりの 長さ
        const wing = (deg) => {
          const r = deg * Math.PI / 180;
          return `${(b.x - (ux * Math.cos(r) - uy * Math.sin(r)) * h).toFixed(2)} ${(b.y - (ux * Math.sin(r) + uy * Math.cos(r)) * h).toFixed(2)}`;
        };
        nodes.push(
          <g key={key}>
            <path d={`M${a.x.toFixed(2)} ${a.y.toFixed(2)} L${b.x.toFixed(2)} ${b.y.toFixed(2)}`}
                  fill="none" stroke={shu} strokeWidth="3.4" strokeLinecap="round"
                  className="kkm-draw" style={drawStyle(len, 0.4, delay)}/>
            <path d={`M${wing(28)} L${b.x.toFixed(2)} ${b.y.toFixed(2)} L${wing(-28)}`}
                  fill="none" stroke={shu} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"
                  className="kkm-draw" style={drawStyle(h * 2, 0.25, delay + 0.32)}/>
          </g>
        );
      } else if (m.kind === 'num' && m.at) {
        const c = at(m.at);
        // 番号は 1 つずつ ポンと 出す（じゅんばんが 目で 追える）
        nodes.push(
          <g key={key} className="kkm-mark-pop"
             style={{ animationDelay: `${delay + mi * 0.1}s`, transformOrigin: `${c.x}px ${c.y}px` }}>
            <circle cx={c.x} cy={c.y} r="8.5" fill="#ffffff" stroke={shu} strokeWidth="2.6"/>
            <text x={c.x} y={c.y} textAnchor="middle" dominantBaseline="central"
                  fontSize="11" fontWeight="700" fill={shu}>{m.text}</text>
          </g>
        );
      } else if (m.kind === 'box' && m.box) {
        const b = m.box;
        const target = m.style === 'target';
        nodes.push(
          <rect key={key} className="kkm-fade-in" style={{ animationDelay: `${delay}s` }}
                x={(b.x0 * S).toFixed(2)} y={(b.y0 * S).toFixed(2)}
                width={((b.x1 - b.x0) * S).toFixed(2)} height={((b.y1 - b.y0) * S).toFixed(2)}
                fill="none" stroke={target ? shu : soft} strokeWidth={target ? 3 : 2}
                strokeDasharray={target ? '7 5' : '3 4'} rx="3"/>
        );
      } else if (m.kind === 'quad') {
        const x = (m.q & 1) ? S / 2 : 0, y = (m.q & 2) ? S / 2 : 0;
        nodes.push(
          <rect key={key} className="kkm-fade-in" style={{ animationDelay: `${delay}s` }}
                x={x} y={y} width={S / 2} height={S / 2}
                fill={shu} fillOpacity="0.12" stroke={shu} strokeWidth="2.4" strokeDasharray="7 5"/>
        );
      }
    });
  }

  return (
    <svg viewBox={`0 0 ${S} ${S}`} className="block w-full h-full" role="img"
         aria-label={label || 'あかペンの てんさく'}>
      {/* マス（白地・十字の点線・朱色のわく） */}
      <rect x="0.9" y="0.9" width={S - 1.8} height={S - 1.8} rx="4" fill="#ffffff" stroke="#e3a793" strokeWidth="1.8"/>
      <path d={`M0 ${S/2} H${S} M${S/2} 0 V${S}`} stroke="#f0cec2" strokeWidth="1" strokeDasharray="4 4"/>
      {/* お手本（うすいグレー） */}
      {(review.templatePaths || []).map((d, i) => (
        <path key={`t${i}`} d={d} fill="none" stroke={guide} strokeWidth={KVG_STROKE_W}
              strokeLinecap="round" strokeLinejoin="round"/>
      ))}
      {/* 自分が 書いた せん */}
      {(review.user || []).map((poly, i) => (
        poly && poly.length >= 2
          ? <path key={`u${i}`} d={polyD(poly)} fill="none" stroke={sumi} strokeWidth="6"
                  strokeLinecap="round" strokeLinejoin="round"/>
          : null
      ))}
      {/* 赤ペンの しるし */}
      {nodes}
    </svg>
  );
}

/* なおすところの 一覧に そえる、しるしの 見本（ミニチュア）。

   絵の 中の しるしと 文を つなぐ ための ものなので、**絵で 使ったのと
   おなじ 形**を そのまま 小さく 描く。文字を 読まなくても
   「この 形の しるしの こと だ」と たどれる。 */
function ReviewMarkChip({ kind }) {
  const shu = themeColor('--kkm-shu', '#b34328');
  const common = { fill: 'none', stroke: shu, strokeLinecap: 'round', strokeLinejoin: 'round' };
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true" focusable="false" className="shrink-0">
      <rect x="1" y="1" width="24" height="24" rx="3" fill="#fff" stroke="#e3a793" strokeWidth="1"/>
      {kind === 'shape' && <path d="M9 5c-1 5-1 9 1 12s5 3 7 1" {...common} strokeWidth="2.6"/>}
      {kind === 'startdir' && (
        <>
          {/* ○ の 下に まっすぐ やじるし。くっつけると 虫めがねに 見える */}
          <circle cx="13" cy="7" r="4" {...common} strokeWidth="2.2"/>
          <path d="M13 13v7M9.5 16.5 13 20l3.5-3.5" {...common} strokeWidth="2.2"/>
        </>
      )}
      {kind === 'order' && (
        <>
          <circle cx="8" cy="13" r="5" fill="#fff" stroke={shu} strokeWidth="2"/>
          <text x="8" y="13" textAnchor="middle" dominantBaseline="central" fontSize="7" fontWeight="700" fill={shu}>1</text>
          <circle cx="19" cy="13" r="5" fill="#fff" stroke={shu} strokeWidth="2"/>
          <text x="19" y="13" textAnchor="middle" dominantBaseline="central" fontSize="7" fontWeight="700" fill={shu}>2</text>
        </>
      )}
      {kind === 'balance' && <rect x="5" y="5" width="16" height="16" rx="2" {...common} strokeWidth="2.4" strokeDasharray="4 3"/>}
      {kind === 'rooms' && (
        <>
          <rect x="4" y="4" width="18" height="18" rx="1.5" stroke="#e3a793" strokeWidth="1.4" fill="none"/>
          <rect x="4" y="4" width="9" height="9" fill={shu} fillOpacity="0.25" stroke={shu} strokeWidth="2" strokeDasharray="4 3"/>
        </>
      )}
      {kind === 'crossings' && (
        <>
          <path d="M6 7 20 19M20 7 6 19" stroke="#cfc7b8" strokeWidth="2" strokeLinecap="round" fill="none"/>
          <circle cx="13" cy="13" r="5.5" {...common} strokeWidth="2.4"/>
        </>
      )}
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────
   15.3. <ScorePopup> ── 自力書きの採点結果＝「1 かいの おわり」の画面

   ここは 点数を 出すだけの ふきだしでは ない。**1 かい 書きおえた ことの
   区切り**として つかう画面なので、つぎの 3 つを かならず 出す。

     ① 赤ペンの てんさく … どこを どう なおすかを 絵で 見せる
     ② いま どこまで きたか … ステップと のこり回数
     ③ つぎに 押す ボタン  … 迷わないよう **いちばん大きい ボタンが 1 つ**

   自動では 閉じない。1年生は 読むのが おそいので、勝手に 消えると
   「見る まえに なくなった」に なる。閉じるのは かならず 本人の タップ。
   ────────────────────────────────────────────────────────────── */
function ScorePopup({ result, char, stageUp, actions = [], onClose }) {
  const [show, setShow] = useState(false);
  const [detail, setDetail] = useState(false);
  const close = useCallback(() => {
    setShow(false);
    setTimeout(() => onClose && onClose(), 300);
  }, [onClose]);
  const dialogRef = useModal(close);
  useEffect(() => { setShow(true); }, []);
  // ボタンは「閉じてから 次へ」。閉じるまえに 画面を 変えると
  // ポップアップが 出たまま 別の 画面に 残ることがある。
  const runAction = useCallback((fn) => {
    setShow(false);
    setTimeout(() => { onClose && onClose(); fn && fn(); }, 300);
  }, [onClose]);

  const { total, breakdown = [], comment, passed, review } = result || {};
  const fixes = review?.fixes || [];
  /* なおすところは 1 か所ずつ 見せる（かさねると 赤だらけで 読めない）。
     ひとりでに つぎへ うつるが、いちど 自分で えらんだら 止める。 */
  const [activeFix, setActiveFix] = useState(0);
  const [autoStep, setAutoStep] = useState(true);
  useEffect(() => {
    if (!autoStep || fixes.length < 2) return;
    const id = setInterval(() => setActiveFix(i => (i + 1) % fixes.length), RPR_STEP_MS);
    return () => clearInterval(id);
  }, [autoStep, fixes.length]);
  // 教科書の評価と同じ しるし。花丸 ＞ ◎ ＞ ○ ＞ △
  const rank = total >= 90 ? 'hanamaru' : total >= 70 ? '◎' : total >= 50 ? '○' : '△';
  const t = TONES[passed ? 'shu' : 'ai'];
  // うちわけの しるし（できた／もうすこし／がんばろう）
  const markFor = (s) => s === 'good' ? '◎' : s === 'ok' ? '○' : '△';
  const markToneFor = (s) => s === 'good' ? 'text-shu-600' : s === 'ok' ? 'text-midori-600' : 'text-sumi-600';
  const fixKeys = new Set(fixes.map(f => f.key));
  const clear = stageUp ? STAGE_UP_TEXT[stageUp.to] : null;

  const big = actions.filter(a => a && !a.plain);
  const plain = actions.filter(a => a && a.plain);

  return (
    <div
      className={`fixed inset-0 z-[170] flex items-center justify-center transition-opacity duration-300 bg-sumi-900/35 p-2 md:p-3 overflow-y-auto ${
        show ? 'opacity-100' : 'opacity-0'
      } pointer-events-auto`}
      role="dialog" aria-modal="true" aria-label={`さいてんけっか ${total} てん`}
      ref={dialogRef}
    >
      {/* 合格した ときは、画面ぜんたいに 花丸を 1 回 押す。
          点数を 読むより さきに「できた」が 体に とどく。 */}
      {passed && <CorrectFx seed={`score-${total}`} size={170}/>}
      <div className={`bg-white rounded-xl shadow-xl border border-sumi-300 border-t-4 ${t.topRule} pointer-events-auto max-w-lg w-full my-auto transition-transform duration-300 ${
        show ? 'scale-100' : 'scale-95'
      }`}>
        {/* ── ステップを クリアした ときの おしらせ（区切りが いちばん 目立つ） ── */}
        {clear && (
          <div className={`kkm-rise-in flex items-center gap-2.5 px-4 py-2.5 rounded-t-[5px] border-b-2 ${TONES[clear.tone].chip}`}>
            <span className={`kkm-stamp shrink-0 w-11 h-11 rounded-lg border-2 text-white flex items-center justify-center ${TONES[clear.tone].solid}`}>
              {stageUp.to >= 4 ? <Hanamaru size={26} color="#fff" draw/> : <span className="kkm-glyph text-xl leading-none">{clear.num}</span>}
            </span>
            <span className="text-lg font-semibold"><Furi>{clear.title}</Furi></span>
          </div>
        )}

        <div className="px-4 md:px-6 py-3 md:py-4">
          {/* ── 点数（読まなくても わかるよう しるしを 大きく） ── */}
          <div className="flex items-center justify-center gap-3 md:gap-4">
            <span className="shrink-0 flex items-center justify-center w-14 h-14 md:w-16 md:h-16">
              {rank === 'hanamaru'
                ? <span className={t.icon}><Hanamaru size={58} draw duration={0.6}/></span>
                : <span className={`kkm-stamp kkm-glyph text-5xl md:text-6xl leading-none ${t.icon}`}>{rank}</span>}
            </span>
            <span className="text-left">
              <span className={`block text-base md:text-lg font-semibold ${t.text}`}>{comment}</span>
              <span className="flex items-baseline gap-1 text-sumi-800">
                <span className="text-4xl md:text-5xl font-semibold tabular-nums">{total}</span>
                <span className="text-sm md:text-base font-semibold text-sumi-600">/ 100 てん</span>
              </span>
            </span>
          </div>

          {/* ── 赤ペンの てんさく ── */}
          {review && (
            <div className="mt-3 flex flex-col sm:flex-row items-center sm:items-start gap-3">
              <div className="w-48 sm:w-52 shrink-0 aspect-square kkm-pop-in">
                <RedPenReview review={review} active={activeFix}
                  label={char ? `${char} の あかペン てんさく` : 'あかペン てんさく'}/>
              </div>
              <div className="flex-1 min-w-0 w-full">
                {fixes.length > 0 ? (
                  <>
                    <div className="inline-flex items-center gap-1.5 text-[11px] md:text-xs font-semibold text-shu-700 bg-shu-50 border border-shu-300 rounded-md px-2 py-1">
                      <IconPen size={13}/> ここを なおそう
                      {fixes.length > 1 && <span className="tabular-nums">（{fixes.length}こ）</span>}
                    </div>
                    {/* いま 絵に 出ている なおすところが どれかが わかるように、
                        えらばれている 行だけ 朱色で 立てる。押せば その場所に うつる。 */}
                    <ul className="mt-1.5 flex flex-col gap-1.5">
                      {fixes.map((f, i) => {
                        const on = i === activeFix;
                        return (
                          <li key={f.key} className="kkm-rise-in" style={{ animationDelay: `${0.25 + i * 0.12}s` }}>
                            <button type="button" aria-pressed={on}
                              onClick={() => { setAutoStep(false); setActiveFix(i); }}
                              className={`kkm-btn w-full flex items-center gap-2 text-left rounded-md px-2 py-1.5 border-l-4 border transition-colors duration-200 ${
                                on ? 'bg-shu-50 border-shu-300 border-l-shu-600'
                                   : 'bg-washi-100 border-sumi-200 border-l-sumi-200 opacity-70'
                              }`}>
                              <ReviewMarkChip kind={f.key}/>
                              <span className="min-w-0">
                                <span className={`block text-xs md:text-base font-semibold leading-snug ${on ? 'text-sumi-800' : 'text-sumi-700'}`}>{f.text}</span>
                                <span className="block text-[10px] md:text-[11px] font-semibold text-sumi-600">{f.title}</span>
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                ) : (
                  <div className="text-center sm:text-left">
                    <div className="inline-flex items-center gap-1.5 text-[11px] md:text-xs font-semibold text-shu-700 bg-shu-50 border border-shu-300 rounded-md px-2 py-1">
                      <Hanamaru size={13}/> なおすところ なし
                    </div>
                    <div className="text-sm md:text-lg font-semibold text-sumi-800 mt-1.5 leading-snug">ぜんぶ おてほんどおり！</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── つぎに どうするか（いちばん大きい ボタンが 1 つだけ） ── */}
          {big.length > 0 && (
            <div className="mt-3 flex flex-col gap-1.5">
              {big.map((a, i) => (
                <button key={a.key} onClick={() => runAction(a.onClick)}
                  style={i === 0 ? { '--kkm-shadow-color': TONE_DEEP[a.tone || 'shu'] } : undefined}
                  className={`kkm-cta-btn kkm-btn kkm-ripple w-full px-4 font-semibold flex items-center justify-center gap-2.5 ${
                    i === 0
                      ? `kkm-primary text-white border-2 ${TONES[a.tone || 'shu'].solid}`
                      : `py-2.5 rounded-lg text-base bg-white border-2 border-sumi-300 text-sumi-700 min-h-[52px]`
                  }`}>
                  {a.icon}
                  <span><Furi>{a.label}</Furi></span>
                  {a.sub && <span className={`text-sm font-semibold ${i === 0 ? 'opacity-90' : 'text-sumi-600'}`}><Furi>{a.sub}</Furi></span>}
                </button>
              ))}
            </div>
          )}

          {/* ── こまかい てん（大人・先生むけ。ふだんは たたんでおく） ── */}
          <div className="mt-2 flex items-center justify-center gap-3">
            {plain.map(a => (
              <button key={a.key} onClick={() => runAction(a.onClick)}
                className="kkm-btn text-[11px] md:text-xs font-semibold text-sumi-600 underline underline-offset-2 min-h-[40px] px-2">
                {a.label}
              </button>
            ))}
            <button onClick={() => setDetail(v => !v)} aria-expanded={detail}
              className="kkm-btn text-[11px] md:text-xs font-semibold text-sumi-600 underline underline-offset-2 min-h-[40px] px-2 flex items-center gap-1">
              <IconSearch size={13}/> {detail ? 'てんすうを とじる' : 'てんすうを くわしく'}
            </button>
          </div>

          {detail && (
            <div className="mt-2 bg-washi-100 border border-sumi-200 rounded-md p-3 text-left text-sumi-700 kkm-rise-in">
              <div className="kkm-heading-rule text-[11px] md:text-xs font-semibold mb-2">さいてんの うちわけ</div>
              <ul className="divide-y divide-sumi-200">
                {breakdown.map(b => (
                  <li key={b.key} className={`flex items-center gap-2 text-xs md:text-sm py-1.5 ${
                    fixKeys.has(b.key) ? 'bg-shu-50 -mx-1 px-1 rounded' : ''
                  }`}>
                    <span className={`kkm-glyph text-lg md:text-xl w-6 text-center leading-none ${markToneFor(b.status)}`}>{markFor(b.status)}</span>
                    <span className="font-semibold w-24 md:w-32 shrink-0">{b.label}</span>
                    <span className="font-semibold tabular-nums w-10 md:w-12 shrink-0 text-right">{b.score}/{b.max}</span>
                    <span className="text-[10px] md:text-xs text-sumi-600 flex-1">{b.advice}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   15.5. <WordMasterPopup> ── ことばで文字が花丸になった瞬間の演出
   ────────────────────────────────────────────────────────────── */
function WordMasterPopup({ info, onClose }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(true);
    const t = setTimeout(() => { setShow(false); setTimeout(onClose, 400); }, 3200);
    function onKey(e) { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShow(false); setTimeout(onClose, 400); } }
    document.addEventListener('keydown', onKey);
    return () => { clearTimeout(t); document.removeEventListener('keydown', onKey); };
  }, [onClose]);
  if (!info) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label="ことばで めざめたよ"
      className={`fixed inset-0 z-[350] flex items-center justify-center transition-all duration-500 ${
      show ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
    }`} onClick={onClose}>
      <div className="bg-white px-6 md:px-9 py-5 md:py-6 rounded-lg shadow-xl border border-sumi-300 border-t-4 border-t-shu-600 max-w-md mx-3 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
        <div className="text-center">
          <div className="text-[11px] md:text-sm font-semibold text-shu-700 mb-2">ことばに つかって <Furi>花丸</Furi>に なりました</div>
          {/* ことばが ながいと 花丸が いくつも つくので、おりかえして ならべる */}
          <div className="flex flex-wrap justify-center gap-5 my-4">
            {info.chars.map((c, i) => (
              <div key={i} className="relative kkm-pop-in w-12 h-12" style={{ animationDelay: `${i * 0.12}s` }}>
                {/* もじの まわりを かこむように 花丸を 大きめに描く。
                    花丸のまんなかの丸（直径 ≒ 大きさの 3 割）に もじが おさまる大きさにする。 */}
                <span className="kkm-glyph absolute inset-0 flex items-center justify-center text-2xl text-shu-700">{c}</span>
                <span className="absolute -inset-6 flex items-center justify-center text-shu-600 pointer-events-none">
                  <Hanamaru size={96} draw duration={0.7}/>
                </span>
              </div>
            ))}
          </div>
          <div className="text-sm md:text-lg font-semibold text-sumi-700 mt-2">
            「{info.text}」で <span className="text-shu-700">かんぺき</span>！
          </div>
          <button onClick={onClose} autoFocus
            className="kkm-btn kkm-ripple mt-4 px-6 py-2.5 rounded-md bg-shu-600 text-white font-semibold text-sm border border-shu-700 min-h-[44px]">
            やったー！
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   16. <BadgeToast> ── バッジ獲得トースト
   ────────────────────────────────────────────────────────────── */
function BadgeToast({ badge, onClose }) {
  useEffect(() => {
    playBadge();
    hapticTriumph();
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  if (!badge) return null;
  return (
    <div role="status" aria-live="polite"
      className="kkm-badge-toast fixed top-20 left-1/2 -translate-x-1/2 z-[400]"
      onClick={onClose}>
      <div className="bg-white border border-yamabuki-400 border-l-4 border-l-yamabuki-600 rounded-lg shadow-xl px-4 py-3 flex items-center gap-3 cursor-pointer">
        <div className="shrink-0 w-11 h-11 rounded-md bg-yamabuki-50 border border-yamabuki-300 text-yamabuki-700 flex items-center justify-center kkm-stamp">
          <Pict name={badge.icon} size={26}/>
        </div>
        <div>
          <div className="text-[10px] font-semibold text-yamabuki-700">はんこを もらいました</div>
          <div className="text-sm md:text-base font-semibold text-sumi-800">{badge.title}</div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   17. <AchievementsModal> ── ごほうびシールずかん
   ────────────────────────────────────────────────────────────── */
function AchievementsModal({ earned, mastered, words, streak, onClose }) {
  const lv = getCurrentLevel(mastered.length);
  const nextLv = LEVELS.find(l => l.min > mastered.length);
  const totalHira = mastered.filter(c => HIRA_LIST.includes(c)).length;
  const totalKata = mastered.filter(c => KATA_LIST.includes(c)).length;
  const dialogRef = useModal(onClose);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-sumi-900/50 backdrop-blur-sm p-3 kkm-fade-in" onClick={onClose}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="ごほうびの はんこずかん"
        className="bg-white rounded-lg shadow-xl border border-sumi-300 border-t-4 border-t-yamabuki-600 max-w-2xl w-full max-h-[92vh] overflow-y-auto p-4 md:p-5 kkm-pop-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 gap-2">
          <h2 className="kkm-heading-rule text-lg font-semibold text-sumi-800 flex items-center gap-2">
            <IconTrophy size={24}/> ごほうびの はんこずかん
          </h2>
          <button onClick={onClose} aria-label="とじる"
            className="kkm-btn shrink-0 w-12 h-12 rounded-xl bg-sumi-50 hover:bg-sumi-100 border-2 border-sumi-300 text-sumi-600 flex items-center justify-center min-w-[48px] min-h-[48px]"><IconX size={24}/></button>
        </div>

        {/* いまの しょうごう */}
        <div className={`rounded-md border p-3 mb-3 ${lv.color}`}>
          <div className="flex items-center gap-3">
            <div className="shrink-0"><Pict name={lv.icon} size={34}/></div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-semibold">いまの しょうごう</div>
              <div className="text-base md:text-lg font-semibold truncate">{lv.title}</div>
            </div>
            <div className="text-right text-xs font-semibold shrink-0">
              <div className="tabular-nums">{mastered.length} じ</div>
              {nextLv && <div className="tabular-nums">つぎ：あと {nextLv.min - mastered.length} じ</div>}
            </div>
          </div>
        </div>

        {/* いまの きろく */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {[
            { label: 'ひらがな', value: `${totalHira}/46`, tone: 'shu'      },
            { label: 'カタカナ', value: `${totalKata}/46`, tone: 'ai'       },
            { label: 'ことば',   value: `${words.length}こ`, tone: 'midori' },
            { label: 'れんぞく', value: `${streak}にち`,   tone: 'yamabuki' },
          ].map(s => (
            <div key={s.label} className={`border rounded-md p-2 text-center ${TONES[s.tone].stat}`}>
              <div className={`text-[10px] font-semibold ${TONES[s.tone].statLabel}`}>{s.label}</div>
              <div className={`text-lg font-semibold tabular-nums ${TONES[s.tone].statValue}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* はんこ グリッド */}
        <div className="kkm-heading-rule text-xs font-semibold text-sumi-600 mb-2">
          もらった はんこ <span className="tabular-nums">{earned.length} / {BADGES.length}</span>
        </div>
        {/* はんこは 1 まいずつ 横ならびに する。
            3 れつに つめると、字を 大きくした とたん 1 文字ずつ 折れて
            「はじめのい っぽ」のように 読めなく なる。 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {BADGES.map(b => {
            const has = earned.includes(b.id);
            return (
              <div key={b.id}
                className={`rounded-xl border-2 p-3 flex items-center gap-3 text-left ${
                  has ? 'bg-yamabuki-50 border-yamabuki-300 kkm-lift'
                      : 'bg-washi-100 border-sumi-200'
                }`}>
                <div className={`shrink-0 w-12 h-12 rounded-lg bg-white border-2 flex items-center justify-center ${
                  has ? 'text-yamabuki-700 border-yamabuki-300' : 'text-sumi-600 border-sumi-200'
                }`}>
                  {has ? <Pict name={b.icon} size={30}/> : <IconLock size={26}/>}
                </div>
                <div className="min-w-0">
                  <div className={`text-lg font-semibold leading-tight ${has ? 'text-sumi-800' : 'text-sumi-600'}`}>{b.title}</div>
                  <div className="text-sm text-sumi-600 mt-0.5 leading-snug">{b.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   18. <WordCollection> ── ことばあつめ
   ────────────────────────────────────────────────────────────── */
/* ──────────────────────────────────────────────────────────────
   17b. <WordTown> ── ことばタウン（言葉が増えるとまちが育つ）
   ────────────────────────────────────────────────────────────── */
function WordTown({ wordCount }) {
  // ことばが ふえるほど、まちに たてものが 1 つずつ ふえていく
  const STAGES = [
    { at:1,  pict:'leaf',   name:'くさはら' },
    { at:5,  pict:'house',  name:'おうち'   },
    { at:10, pict:'tree',   name:'こうえん' },
    { at:20, pict:'shop',   name:'おみせ'   },
    { at:35, pict:'school', name:'がっこう' },
    { at:50, pict:'castle', name:'おしろ'   },
  ];
  const next = STAGES.find(s => wordCount < s.at);
  if (wordCount === 0) return null;
  const progress = next ? Math.round((wordCount / next.at) * 100) : 100;

  return (
    <div className="bg-washi-100 border border-sumi-200 rounded-md p-2.5 mb-3 shrink-0">
      <div className="flex items-center justify-between mb-2 gap-2">
        <span className="kkm-heading-rule text-xs md:text-sm font-semibold text-sumi-700">ことばの まち</span>
        <span className="text-[10px] font-semibold text-sumi-600 tabular-nums shrink-0">
          {wordCount}この ことばで そだちました
        </span>
      </div>

      {/* まちなみ（地面の線の上に、できた たてものが ならぶ） */}
      <div className="flex items-end justify-between gap-1 border-b-2 border-sumi-300 pb-1.5 px-1">
        {STAGES.map((s, i) => {
          const built = wordCount >= s.at;
          return (
            <div key={i} title={`${s.name}（ことば ${s.at}こ）`}
              className={`flex flex-col items-center gap-0.5 transition-all duration-500 ${
                built ? 'text-shu-600 opacity-100' : 'text-sumi-600 opacity-50'
              }`}>
              <span className={built ? 'kkm-pop-in' : ''}>
                {built ? <Pict name={s.pict} size={26}/> : <IconLock size={18}/>}
              </span>
              <span className="text-[8px] md:text-[9px] font-semibold leading-none">{s.name}</span>
            </div>
          );
        })}
      </div>

      {/* つぎの たてものまでの めやす */}
      <div className="mt-2">
        <div className="h-1.5 rounded-full bg-washi-300 overflow-hidden">
          <div className="h-full rounded-full bg-midori-500 transition-all duration-700" style={{ width: `${progress}%` }}/>
        </div>
        <p className="text-[10px] md:text-[11px] font-semibold text-center mt-1.5 text-sumi-600">
          {next
            ? <>あと <span className="text-shu-700 tabular-nums">{next.at - wordCount}</span>こ で「{next.name}」が できます</>
            : <span className="text-shu-700">まちが かんせいしました！</span>}
        </p>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   17c. <ShiritoriGame> ── しりとりゲーム
   ────────────────────────────────────────────────────────────── */
/* いま 書いている ことばが ことばずかんに あるとき、その ことばに ついて
   すでに アプリが 知っていることを 出す。

   ・なかま（たべもの・どうぶつ など）… 教科書の「なかまの ことば」と 同じ 名まえ
   ・はんたいの ことば（おおきい ⇄ ちいさい）… 「よむ」で つかっている 表から

   語義（ことばの 意味の 文）は このアプリの データには **ない**。
   むりに 書きたすと ことばの もとだねが 2 か所に なるので、ここでは
   すでに ある データを 引くだけに とどめる。 */
function WordBankHint({ text }) {
  const title = groupTitleOf(text);
  const opposite = OPPOSITE_MAP[text];
  if (!title && !opposite) return null;
  return (
    <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
      {title && (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-ai-50 border border-ai-200 text-ai-700">
          <IconBook size={13}/>{title}の なかま
        </span>
      )}
      {opposite && (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-fuji-50 border border-fuji-200 text-fuji-700">
          はんたいは <span className="kkm-glyph text-sm">{opposite}</span>
        </span>
      )}
    </div>
  );
}

// しりとりの ことばの さいごの じ（小書きは 大きい じに 読みかえる）。
// ゲームの 中でも 入力の 画面でも つかうので、部品の 外に 出しておく。
const SMALL_TO_LARGE = {'ぁ':'あ','ぃ':'い','ぅ':'う','ぇ':'え','ぉ':'お','っ':'つ','ゃ':'や','ゅ':'ゆ','ょ':'よ','ゎ':'わ'};
function getLastChar(word) {
  if (!word || word.length === 0) return '';
  const last = word[word.length - 1];
  return SMALL_TO_LARGE[last] || last;
}

/* しりとりの とちゅうで じぶんで ことばを 書く 画面。

   ずかんに ある ことばしか つかえないと、ひらがなを ぜんぶ おぼえるまで
   しりとりが 成りたたない。そこで ここで 好きな ことばを 書けるようにして、
   ゲームが おわったら ずかんへ うつす（＝あそびが そのまま ことばあつめに なる）。 */
function ShiritoriWriteSheet({ startChar, progress, usedWords, collectedTexts, voiceOn, onCancel, onSubmit }) {
  const MAX_LEN = 8;
  const [rest, setRest] = useState('');
  const [kindTab, setKindTab] = useState('seion');
  const [pickedPict, setPickedPict] = useState(null);
  const dialogRef = useModal(onCancel);
  const table = getKanaTable('hiragana', kindTab);

  const text = startChar + rest;
  const pict = pickedPict || guessPict(text);
  const already = usedWords.has(text);
  const endsWithN = getLastChar(text) === 'ん';
  const canSubmit = text.length >= 2 && !already;
  // この ことばで 花丸に なる もじ（ずかんに 入れる ときに 上がる）
  const willMaster = useMemo(
    () => Array.from(new Set(text.split(''))).filter(c => getStage(progress, c) === 3),
    [text, progress]);

  function addChar(c) { if (text.length < MAX_LEN) { setRest(r => r + c); speakText(c, voiceOn); } }
  function backspace() { setRest(r => r.slice(0, -1)); }
  const handleSubmit = useDebouncedAction(() => { if (canSubmit) onSubmit({ text, pict }); }, 400);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-sumi-900/40 backdrop-blur-sm p-3 kkm-fade-in" onClick={onCancel}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="じぶんで ことばを かく"
        className="bg-white rounded-lg shadow-xl border border-sumi-300 border-t-4 border-t-shu-600 max-w-lg w-full max-h-[92vh] flex flex-col kkm-pop-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center px-4 md:px-5 pt-4 pb-3 shrink-0">
          <h3 className="kkm-heading-rule font-semibold text-base text-sumi-800">
            「{startChar}」から はじまる ことば
          </h3>
          <button onClick={onCancel} aria-label="とじる"
            className="kkm-btn w-11 h-11 rounded-md bg-sumi-50 hover:bg-sumi-100 border border-sumi-200 text-sumi-600 flex items-center justify-center min-w-[44px] min-h-[44px]"><IconX size={18}/></button>
        </div>

        <div className="px-4 md:px-5 overflow-y-auto flex-1 min-h-0">
          {/* ① いま かいている ことば。さいしょの じは けせない（ルールを まもる） */}
          <div className="bg-washi-100 rounded-md border border-sumi-200 p-3 mb-2 flex items-center gap-3 min-h-[76px]">
            <span className="text-shu-600 shrink-0"><Pict name={pict} size={38}/></span>
            <span className="kkm-glyph flex-1 text-2xl md:text-3xl text-sumi-800 break-all min-w-0">
              <span className="text-shu-700">{startChar}</span>{rest}
              {rest.length === 0 && <span className="text-sumi-600 text-lg">　…つづきを かこう</span>}
            </span>
            <button onClick={() => speakText(text, voiceOn)} disabled={!voiceOn}
              aria-label="いまの ことばを よみあげる"
              className="kkm-btn w-11 h-11 min-w-[44px] min-h-[44px] rounded-md bg-white border border-ai-300 text-ai-700 flex items-center justify-center disabled:opacity-40">
              <IconVolume size={19}/>
            </button>
            <button onClick={backspace} disabled={rest.length === 0}
              aria-label="さいごの じを けす"
              className="kkm-btn w-11 h-11 min-w-[44px] min-h-[44px] rounded-md bg-white border border-shu-300 text-shu-600 flex items-center justify-center disabled:opacity-40">
              <IconX size={19}/>
            </button>
          </div>

          {/* ② いま つたえるべき ことは 1 つだけ にする */}
          {already ? (
            <p className="mb-2 text-xs font-semibold text-shu-700 bg-shu-50 border border-shu-200 rounded-md px-3 py-2">
              その ことばは もう つかいました
            </p>
          ) : endsWithN ? (
            <p className="mb-2 text-xs font-semibold text-shu-700 bg-shu-50 border border-shu-200 rounded-md px-3 py-2">
              「ん」で おわると まけに なります
            </p>
          ) : collectedTexts.has(text) ? (
            <p className="mb-2 text-xs font-semibold text-sumi-600 bg-washi-100 border border-sumi-200 rounded-md px-3 py-2">
              ずかんに ある ことばです
            </p>
          ) : text.length >= 2 && (
            <p className="mb-2 text-xs font-semibold text-midori-700 bg-midori-50 border border-midori-200 rounded-md px-3 py-2 flex items-center gap-1.5">
              <IconPlus size={14}/> あそんだ あとに ずかんへ ついかします
            </p>
          )}

          {/* ことばずかんに ある ことばなら、なかまと はんたいの ことばを 出す */}
          <WordBankHint text={text}/>

          {willMaster.length > 0 && (
            <div className="mb-2 bg-shu-50 border border-shu-300 rounded-md px-3 py-2 text-center text-xs font-semibold text-shu-800">
              <span className="inline-flex items-center gap-1.5">
                <Hanamaru size={16}/> この ことばで <span className="text-base tabular-nums">{willMaster.length}</span>この じが <Furi>花丸</Furi>に なります
              </span>
            </div>
          )}

          {/* ③ もじを えらぶ。まだ かいていない じも つかえる。 */}
          <div className="mb-3">
            <div className="kkm-heading-rule text-xs font-semibold text-sumi-600 mb-1.5">
              もじを えらぶ<span className="font-medium text-sumi-600">（まだ かいて いない じも つかえます）</span>
            </div>
            <div className="grid grid-cols-4 gap-1 mb-1.5">
              {KANA_KINDS.map(k => (
                <button key={k.key} onClick={() => setKindTab(k.key)} aria-pressed={kindTab === k.key} title={k.label}
                  className={`kkm-btn py-1.5 rounded-md font-semibold text-[10px] md:text-xs border ${
                    kindTab === k.key
                      ? 'bg-shu-50 text-shu-700 border-shu-400'
                      : 'bg-white text-sumi-600 border-sumi-200 hover:bg-washi-100'
                  }`}>
                  <span className="block md:hidden">{k.short}</span>
                  <span className="hidden md:block truncate px-0.5">{k.mid}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-5 gap-1.5 bg-washi-100 p-2 rounded-md border border-sumi-200">
              {table.map((c, i) => {
                if (!c) return <div key={i} className="aspect-square"/>;
                const stage = getStage(progress, c);
                const willPromote = stage === 3;
                return (
                  <button key={i} onClick={() => addChar(c)} disabled={text.length >= MAX_LEN}
                    aria-label={`${c}${willPromote ? '（つかうと はなまるに なります）' : ''}`}
                    className={`kkm-glyph kkm-btn relative aspect-square rounded-md text-xl md:text-2xl border disabled:opacity-40 ${
                      willPromote
                        ? 'bg-fuji-50 border-fuji-400 text-fuji-700 hover:bg-fuji-100'
                        : 'bg-white border-sumi-300 text-sumi-700 hover:border-shu-300'
                    }`}>
                    {c}
                    {stage > 0 && <StageMark stage={stage} className="absolute -top-1 -right-1 leading-none"/>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ④ なかまの さしえ。えらばなければ ことばずかんから 自動で つく。 */}
          <div className="mb-3">
            <div className="kkm-heading-rule text-xs font-semibold text-sumi-600 mb-1.5">
              なかまを えらぶ<span className="font-medium text-sumi-600">（えらばなくても いいです）</span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 p-0.5">
              {PICT_CHOICES.map(c => (
                <button key={c.name} onClick={() => setPickedPict(c.name)} aria-pressed={pict === c.name} aria-label={c.label}
                  className={`kkm-btn rounded-md border flex flex-col items-center justify-center gap-0.5 py-1.5 ${
                    pict === c.name ? 'bg-shu-50 border-shu-500 text-shu-700' : 'bg-white border-sumi-200 text-sumi-600 hover:border-shu-300'
                  }`}>
                  <Pict name={c.name} size={22}/>
                  <span className="text-[9px] font-semibold leading-none">{c.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 px-4 md:px-5 pt-3 pb-4 border-t border-sumi-200 bg-white rounded-b-lg shrink-0">
          <button onClick={onCancel}
            className="kkm-btn flex-1 py-2.5 rounded-md font-semibold text-sm bg-white text-sumi-600 border border-sumi-300 min-h-[44px]">やめる</button>
          <button disabled={!canSubmit} onClick={handleSubmit}
            className="kkm-btn kkm-ripple flex-[2] py-2.5 rounded-md font-semibold text-base bg-shu-600 text-white border border-shu-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 min-h-[44px]">
            <IconCheck size={18}/> これに する
          </button>
        </div>
      </div>
    </div>
  );
}

function ShiritoriGame({ words, progress, onAddMany, voiceOn }) {
  const [gameState, setGameState] = useState('idle');
  const [chain, setChain] = useState([]);
  const [usedWords, setUsedWords] = useState(new Set());
  const [currentChar, setCurrentChar] = useState(null);
  const [thinking, setThinking] = useState(false);
  const [writeOpen, setWriteOpen] = useState(false);
  // ゲームの 中で じぶんで 書いた「ずかんに ない ことば」。
  // とちゅうで 入れると 演出が じゃまに なるので、おわるまで ためておく。
  const [freshWords, setFreshWords] = useState([]);
  const [savedWords, setSavedWords] = useState([]);
  const [bestChain, setBestChain] = useState(() => {
    try {
      const n = parseInt(localStorage.getItem(KEY_SIRI_BEST) || '0', 10);
      return Number.isFinite(n) && n > 0 ? n : 0;   // 壊れた値で NaN にならないように
    } catch { return 0; }
  });
  const chainRef = useRef(null);
  // コンピュータの「かんがえてる」タイマー。画面を離れたり もういちど
  // はじめたりしたときに取り消せるよう ref で持つ（放っておくと、あとから
  // 前のゲームの手が割りこんでくる）。
  const cpuTimerRef = useRef(0);
  function clearCpuTimer() {
    if (cpuTimerRef.current) { clearTimeout(cpuTimerRef.current); cpuTimerRef.current = 0; }
  }
  useEffect(() => clearCpuTimer, []);

  const hiraganaWords = words.filter(w => w.kanaMode === 'hiragana');
  // ずかんに ある ことば（かなの しゅるいは 問わない）。おなじ ことばを
  // 二重に ためないための 照合に つかう。
  const collectedTexts = useMemo(() => new Set(words.map(w => w.text)), [words]);

  function updateBest(len) {
    if (len > bestChain) {
      setBestChain(len);
      safeLocalStorageSet(KEY_SIRI_BEST, String(len));
    }
  }

  /* ゲームの おわり。ここで はじめて、じぶんで 書いた ことばを ずかんへ うつす。
     かち・まけ・こうさん の どの みちからも かならず ここを 通す。 */
  function finish(result, chainLen, freshList) {
    clearCpuTimer();
    updateBest(chainLen);
    setThinking(false);
    setWriteOpen(false);
    setGameState(result);
    const list = (freshList || []).filter(w => !collectedTexts.has(w.text));
    setSavedWords(list);
    setFreshWords([]);
    if (list.length > 0 && onAddMany) {
      onAddMany(list.map(w => ({ text: w.text, pict: w.pict, kanaMode: 'hiragana' })));
    }
  }

  function startGame() {
    clearCpuTimer();
    const playerFirstChars = new Set(hiraganaWords.map(w => w.text[0]));
    let startOptions = SHIRITORI_CPU_WORDS.filter(w => {
      const last = getLastChar(w.w);
      return playerFirstChars.has(last) && last !== 'ん';
    });
    if (startOptions.length === 0) startOptions = SHIRITORI_CPU_WORDS.filter(w => getLastChar(w.w) !== 'ん');
    if (startOptions.length === 0) startOptions = SHIRITORI_CPU_WORDS;

    const start = startOptions[Math.floor(Math.random() * startOptions.length)];
    const lastChar = getLastChar(start.w);
    const initialChain = [{ word: start.w, pict: start.p, isPlayer: false }];

    setChain(initialChain);
    setUsedWords(new Set([start.w]));
    setCurrentChar(lastChar);
    setGameState('playing');
    setThinking(false);
    setWriteOpen(false);
    setFreshWords([]);
    setSavedWords([]);
    speakText(start.w, voiceOn);
  }

  /* こたえる。entry は ずかんの ことばでも、じぶんで 書いた ことばでも よい。
       { text, pict, isNew }   isNew … ずかんに まだ ない ことば */
  function playerPlay(entry) {
    if (gameState !== 'playing' || thinking) return;

    const newUsed = new Set([...usedWords, entry.text]);
    const lastChar = getLastChar(entry.text);
    const newChain = [...chain, { word: entry.text, pict: entry.pict, isPlayer: true, isNew: entry.isNew }];
    // finish() には この場で 作った ものを わたす。state は まだ 古いまま。
    const newFresh = entry.isNew ? [...freshWords, { text: entry.text, pict: entry.pict }] : freshWords;

    setChain(newChain);
    setUsedWords(newUsed);
    setFreshWords(newFresh);
    setWriteOpen(false);
    speakText(entry.text, voiceOn);

    if (lastChar === 'ん') {
      hapticErr();
      finish('lost', newChain.length, newFresh);
      return;
    }
    hapticOk();

    setThinking(true);
    clearCpuTimer();
    cpuTimerRef.current = setTimeout(() => {
      cpuTimerRef.current = 0;
      const available = SHIRITORI_CPU_WORDS.filter(w => w.w[0] === lastChar && !newUsed.has(w.w));
      if (available.length === 0) {
        finish('won', newChain.length, newFresh);
        playFanfare();
        burstConfetti();
        return;
      }
      const pick = available[Math.floor(Math.random() * available.length)];
      const newUsed2 = new Set([...newUsed, pick.w]);
      const compLastChar = getLastChar(pick.w);
      const newChain2 = [...newChain, { word: pick.w, pict: pick.p, isPlayer: false }];

      setChain(newChain2);
      setUsedWords(newUsed2);
      speakText(pick.w, voiceOn);
      setThinking(false);

      if (compLastChar === 'ん') {
        finish('won', newChain2.length, newFresh);
        playFanfare();
        burstConfetti();
        return;
      }
      setCurrentChar(compLastChar);
    }, 1200);
  }

  function forfeit() {
    finish('lost', chain.length, freshWords);
  }

  useEffect(() => {
    if (chainRef.current) chainRef.current.scrollTop = chainRef.current.scrollHeight;
  }, [chain, thinking]);

  const playableWords = gameState === 'playing' && currentChar && !thinking
    ? hiraganaWords.filter(w => w.text[0] === currentChar && !usedWords.has(w.text))
    : [];

  // かった／まけた ときに つないだ ことばを ふりかえる
  const ChainSummary = () => (
    <div className="flex flex-wrap gap-1 justify-center">
      {chain.map((e, i) => (
        <span key={i} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
          e.isPlayer ? 'bg-ai-50 text-ai-700 border-ai-200' : 'bg-washi-100 text-sumi-600 border-sumi-200'
        }`}>
          <Pict name={e.pict} size={13}/>{e.word}
        </span>
      ))}
    </div>
  );

  // ゲームの あとに ずかんへ 入った ことばの おしらせ。
  // ⚠️ 部品（<Foo/>）に せず、JSX を かえす ただの 関数に する。
  //    render の 中で 部品を 作ると 毎回 別の 型に なり、押している ボタンが
  //    作りなおされて フォーカスが はずれる。
  const savedNotice = () => savedWords.length === 0 ? null : (
    <div className="bg-midori-50 border border-midori-300 rounded-md p-3 w-full max-w-xs">
      <p className="text-xs font-semibold text-midori-700 mb-2 flex items-center justify-center gap-1.5">
        <IconPlus size={14}/> ずかんに <span className="text-base tabular-nums">{savedWords.length}</span>こ ついかしました
      </p>
      <div className="flex flex-wrap gap-1 justify-center">
        {savedWords.map(w => (
          <span key={w.text} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white border border-midori-300 text-midori-700">
            <Pict name={w.pict} size={13}/>{w.text}
          </span>
        ))}
      </div>
    </div>
  );

  // 「じぶんで かく」への 入口。ずかんに ことばが なくても あそべる。
  const writeButton = (big) => (
    <button onClick={() => setWriteOpen(true)}
      className={`kkm-btn kkm-ripple rounded-md font-semibold border flex items-center justify-center gap-1.5 ${
        big
          ? 'w-full px-4 py-3 text-base bg-shu-600 text-white border-shu-700'
          : 'px-4 py-2.5 text-sm bg-white text-shu-700 border-shu-400 min-h-[44px]'
      }`}>
      <IconPen size={18}/> じぶんで ことばを かく
    </button>
  );

  return (
    <div className="flex-1 p-2 md:p-4 min-h-0 overflow-hidden flex flex-col gap-3">
      <div className="kkm-sheet rounded-lg p-3 md:p-4 flex flex-col h-full overflow-hidden gap-3">

        <SectionTitle right={bestChain > 0 && (
          <span className="text-xs font-semibold text-yamabuki-700 bg-yamabuki-50 border border-yamabuki-200 rounded-md px-2.5 py-1 shrink-0 tabular-nums">
            さいこう {bestChain}こ
          </span>
        )}>しりとり</SectionTitle>

        {/* ⚠️ スクロールする はこの 中で justify-center を つかうと、はみ出した
            ぶんの **上がわが スクロールで 出せなくなる**（scrollTop を 負に
            できない）。中に min-h-full の はこを 1 まい 入れて、みじかい ときは
            まんなか、ながい ときは 上から ならぶようにする。 */}
        {gameState === 'idle' && (
          <div className="flex-1 overflow-y-auto">
          <div className="min-h-full flex flex-col items-center justify-center gap-4 text-center px-2 py-2">
            <MascotFace size={56} mood="cheer"/>
            <p className="font-semibold text-sumi-800 text-base">コンピュータと しりとりを しましょう</p>
            {/* あそびかた：番号つきで じゅんに 読める形にする */}
            <ol className="bg-washi-100 border border-sumi-200 rounded-md p-3 text-sm text-sumi-700 text-left max-w-xs w-full space-y-2">
              <li className="kkm-heading-rule text-xs font-semibold text-sumi-800 !border-l-shu-600 mb-1">あそびかた</li>
              {[
                'コンピュータが さいしょの ことばを いいます',
                'その さいごの もじから はじまる ことばを こたえます',
                '「ん」で おわったら まけです',
                'コンピュータが こたえられなくなったら かちです',
              ].map((t, i) => (
                <li key={i} className="flex gap-2 items-start text-[13px] leading-snug">
                  <span aria-hidden="true" className="shrink-0 w-5 h-5 rounded-full bg-shu-600 text-white text-[11px] font-semibold flex items-center justify-center">{i + 1}</span>
                  <span>{t}</span>
                </li>
              ))}
            </ol>
            <div className="bg-white border border-sumi-200 rounded-md p-3 text-sm font-semibold text-sumi-700 max-w-xs w-full">
              あなたの てふだ：<span className="text-shu-700 text-base tabular-nums">{hiraganaWords.length}</span>この ことば
              <div className="mt-1.5 flex items-start gap-1.5 text-[11px] font-medium text-sumi-600 text-left">
                <span className="text-midori-700 shrink-0 mt-0.5"><IconBulb size={14}/></span>
                <span>てふだに ない ことばも じぶんで かけます。<br/>あそんだ あと、ずかんに ついかされます。</span>
              </div>
            </div>
            <button onClick={startGame}
              className="kkm-btn kkm-ripple px-10 py-3 rounded-md font-semibold text-lg bg-shu-600 text-white border border-shu-700 flex items-center gap-2">
              <IconPlay size={18}/> はじめる
            </button>
          </div>
          </div>
        )}

        {gameState === 'playing' && (
          <>
            <div ref={chainRef} className="flex-1 overflow-y-auto space-y-2 min-h-0 bg-washi-100 rounded-md p-2 border border-sumi-200">
              {chain.map((entry, i) => (
                <div key={i} className={`flex items-end gap-2 kkm-rise-in ${entry.isPlayer ? 'flex-row-reverse' : 'flex-row'}`}>
                  <span className="text-[10px] text-sumi-600 font-semibold shrink-0 mb-1">{entry.isPlayer ? 'あなた' : 'コンピュータ'}</span>
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold max-w-[68%] border ${
                    entry.isPlayer
                      ? 'bg-shu-600 text-white border-shu-700 rounded-br-sm'
                      : 'bg-white border-sumi-200 text-sumi-700 rounded-bl-sm'
                  }`}>
                    <Pict name={entry.pict} size={20} className="shrink-0"/>
                    <span className="kkm-glyph text-base">{entry.word}</span>
                    {i < chain.length - 1 && (
                      <span className="kkm-glyph text-[11px] ml-0.5">→{getLastChar(entry.word)}</span>
                    )}
                  </div>
                </div>
              ))}
              {thinking && (
                <div className="flex items-end gap-2">
                  <span className="text-[10px] text-sumi-600 font-semibold mb-1">コンピュータ</span>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-sumi-200 text-sumi-600 text-sm font-semibold rounded-bl-sm">
                    <span className="kkm-breathe"><IconClock size={16}/></span> かんがえています…
                  </div>
                </div>
              )}
            </div>

            {!thinking && currentChar && (
              <div className="shrink-0 space-y-2">
                <div className="text-center">
                  <span className="inline-flex items-center gap-1.5 bg-shu-50 border border-shu-300 rounded-md px-3 py-1.5">
                    <span className="kkm-glyph text-2xl text-shu-700 leading-none">「{currentChar}」</span>
                    <span className="text-xs md:text-sm text-sumi-600 font-semibold">から はじまる ことばは？</span>
                  </span>
                </div>
                {playableWords.length > 0 ? (
                  <>
                    <div className="flex flex-wrap gap-2 justify-center max-h-[22vh] overflow-y-auto p-0.5">
                      {playableWords.map(w => (
                        <button key={w.id} onClick={() => playerPlay({ text: w.text, pict: pictOf(w), isNew: false })}
                          aria-label={`${w.text} を こたえる`}
                          className="kkm-btn kkm-ripple flex items-center gap-1.5 px-3.5 py-2 rounded-md font-semibold bg-white border border-sumi-300 text-sumi-800 hover:border-shu-400 hover:text-shu-700 min-h-[44px]">
                          <Pict name={pictOf(w)} size={20}/>
                          <span className="kkm-glyph text-base">{w.text}</span>
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-center">{writeButton(false)}</div>
                  </>
                ) : (
                  /* てふだに なくても ゆきどまりに しない。
                     じぶんで 書けば つづけられる（＝ずかんが そだつ）。 */
                  <div className="bg-washi-100 border border-sumi-200 rounded-md p-3 text-center space-y-2">
                    <p className="text-[11px] text-sumi-600 font-semibold">
                      てふだに「{currentChar}」から はじまる ことばが ありません。<br/>じぶんで かいて こたえましょう。
                    </p>
                    {writeButton(true)}
                    <button onClick={forfeit}
                      className="kkm-btn px-4 py-2 rounded-md bg-white border border-sumi-300 text-sumi-600 font-semibold text-sm min-h-[40px]">まけを みとめる</button>
                  </div>
                )}
                <div className="text-center text-[11px] text-sumi-600 font-semibold tabular-nums">
                  てふだ {hiraganaWords.length}こ ／ つなげた {chain.length}こ
                </div>
              </div>
            )}
          </>
        )}

        {gameState === 'won' && (
          <div className="flex-1 overflow-y-auto">
          <div className="min-h-full flex flex-col items-center justify-center gap-3 text-center px-2 py-2">
            <span className="text-shu-600"><Hanamaru size={92} draw duration={0.7}/></span>
            <p className="font-semibold text-xl text-shu-700">かちました！</p>
            <div className="bg-washi-100 border border-sumi-200 rounded-md p-3 w-full max-w-xs">
              <p className="text-xs text-sumi-600 font-semibold mb-2">つなげた ながさ <span className="text-2xl text-shu-700 tabular-nums">{chain.length}</span>こ</p>
              <ChainSummary/>
            </div>
            {savedNotice()}
            <button onClick={startGame}
              className="kkm-btn kkm-ripple px-8 py-2.5 rounded-md font-semibold bg-shu-600 text-white border border-shu-700">
              もう いちど あそぶ
            </button>
          </div>
          </div>
        )}

        {gameState === 'lost' && (
          <div className="flex-1 overflow-y-auto">
          <div className="min-h-full flex flex-col items-center justify-center gap-3 text-center px-2 py-2">
            <MascotFace size={56} mood="sad"/>
            <p className="font-semibold text-lg text-sumi-700">まけちゃった…</p>
            <div className="bg-washi-100 border border-sumi-200 rounded-md p-3 w-full max-w-xs">
              <p className="text-xs text-sumi-600 font-semibold mb-2">つなげた ながさ <span className="text-2xl text-ai-700 tabular-nums">{chain.length}</span>こ</p>
              <ChainSummary/>
            </div>
            {savedNotice()}
            {hiraganaWords.length < 15 && (
              <div className="flex items-start gap-2 bg-white border border-sumi-200 rounded-md p-2.5 text-[11px] font-semibold text-sumi-600 max-w-xs text-left">
                <span className="text-yamabuki-700 shrink-0 mt-0.5"><IconBulb size={15}/></span>
                <span>じぶんで かいた ことばも てふだに なります。<br/>
                  <span className="text-sumi-600 font-medium tabular-nums">いま {hiraganaWords.length}こ → もくひょう 15こ</span></span>
              </div>
            )}
            <button onClick={startGame}
              className="kkm-btn kkm-ripple px-8 py-2.5 rounded-md font-semibold bg-shu-600 text-white border border-shu-700">
              もう いちど あそぶ
            </button>
          </div>
          </div>
        )}
      </div>

      {writeOpen && currentChar && (
        <ShiritoriWriteSheet startChar={currentChar} progress={progress}
          usedWords={usedWords} collectedTexts={collectedTexts} voiceOn={voiceOn}
          onCancel={() => setWriteOpen(false)}
          onSubmit={({ text, pict }) => playerPlay({ text, pict, isNew: !collectedTexts.has(text) })}/>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   18. <WordCollection>
   ────────────────────────────────────────────────────────────── */
function WordCollection({ kanaMode, setKanaMode, progress, usableInWords, words, onAdd, onDelete, voiceOn }) {
  const [addOpen, setAddOpen] = useState(false);
  const collected = words.filter(w => w.kanaMode === kanaMode);
  const hints = kanaMode === 'katakana' ? WORD_HINTS_KATA : WORD_HINTS_HIRA;
  const availableHints = hints.filter(h => h.w.split('').every(c => usableInWords.includes(c)) && !words.some(w => w.text === h.w));
  // ステージ3（あと一歩で花丸）の文字一覧 — モチベーション用
  const almostChars = (kanaMode === 'katakana' ? KATA_ALL_LIST : HIRA_ALL_LIST).filter(c => getStage(progress, c) === 3);

  return (
    <div className="kkm-sheet rounded-xl p-3 md:p-4 flex flex-col h-full overflow-hidden">
      {/* 見出しと きりかえは 2 だんに 分ける。1 行に つめると
          「あつめた こ…」のように 見出しが 切れて 読めなくなる。 */}
      <div className="shrink-0 mb-3 flex flex-col gap-2">
        <SectionTitle>
          あつめた ことば
          <span className="ml-2 text-base font-semibold text-shu-700 tabular-nums">{collected.length}こ</span>
        </SectionTitle>
        <KanaModeSwitch kanaMode={kanaMode} setKanaMode={setKanaMode}/>
      </div>

      <WordTown wordCount={words.length}/>

      <div className="flex-1 overflow-y-auto bg-washi-100 rounded-lg p-3 border border-sumi-200 mb-3">
        {collected.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-sumi-600 gap-3 py-10 text-center">
            <Mascot message="まだ ことばが ありません" mood="cheer"/>
            <p className="text-base font-medium">したの「あたらしい ことばを ふやす」から ついかしよう</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {collected.slice().reverse().map(w => {
              // なかまは ほぞんせず、そのつど ことばずかんから 引く。
              // あとから ことばずかんが ふえれば、むかし あつめた ことばにも つく。
              const groupTitle = groupTitleOf(w.text);
              return (
              <div key={w.id} className="bg-white rounded-lg border-2 border-sumi-200 p-3 flex flex-col items-center gap-1.5 relative group kkm-lift kkm-pop-in">
                <span className="text-shu-600 group-hover:text-shu-700 transition-colors"><Pict name={pictOf(w)} size={40}/></span>
                <button onClick={() => speakText(w.text, voiceOn)} disabled={!voiceOn}
                  aria-label={voiceOn ? `${w.text} を よみあげる` : `${w.text}`}
                  className="kkm-glyph kkm-btn text-2xl text-sumi-800 hover:text-shu-700 disabled:cursor-default">
                  {w.text}
                </button>
                {groupTitle && (
                  <span className="text-[10px] font-semibold text-ai-700 bg-ai-50 border border-ai-200 rounded px-1.5 py-0.5 leading-none">
                    {groupTitle}
                  </span>
                )}
                <button onClick={() => onDelete(w.id)}
                  aria-label={`${w.text} を けす`}
                  className="kkm-btn absolute top-1 right-1 w-8 h-8 min-w-[32px] min-h-[32px] rounded-md text-sumi-600 opacity-60 md:opacity-0 md:group-hover:opacity-100 hover:bg-shu-50 hover:text-shu-600 flex items-center justify-center">
                  <IconTrash size={14}/>
                </button>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* あと ひといきで 花丸になる もじ */}
      {almostChars.length > 0 && (
        <div className="bg-fuji-50 border border-fuji-200 rounded-md p-2.5 mb-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-fuji-700 mb-1.5">
            <IconPen size={14}/> この じを ことばに つかうと <Furi>花丸</Furi>に なります
          </div>
          <div className="flex flex-wrap gap-1.5">
            {almostChars.map(c => (
              <span key={c} className="kkm-glyph inline-flex items-center justify-center w-9 h-9 rounded-md bg-white border border-fuji-400 text-fuji-700 text-xl">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {availableHints.length > 0 && (
        <div className="bg-washi-100 border border-sumi-200 rounded-md p-2.5 mb-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-sumi-600 mb-1.5">
            <IconBulb size={14}/> いまの じで つくれる ことば
          </div>
          <div className="flex flex-wrap gap-1.5">
            {availableHints.slice(0, 8).map(h => {
              // この ことばで 花丸になる もじの かず
              const willMaster = h.w.split('').filter(c => getStage(progress, c) === 3).length;
              return (
                <button key={h.w} onClick={() => { onAdd({ text: h.w, pict: h.p, kanaMode }); speakText(h.w, voiceOn); }}
                  className={`kkm-btn kkm-ripple relative border rounded-md pl-2 pr-2.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 ${
                    willMaster > 0 ? 'bg-shu-50 border-shu-400 text-shu-800' : 'bg-white border-sumi-300 text-sumi-700 hover:border-shu-300'
                  }`}>
                  <Pict name={h.p} size={16}/>
                  <span className="kkm-glyph text-sm">{h.w}</span>
                  {willMaster > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-shu-600 text-white text-[9px] font-semibold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 tabular-nums">+{willMaster}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button onClick={() => setAddOpen(true)} style={{ '--kkm-shadow-color': TONE_DEEP.shu }}
        className="kkm-btn kkm-ripple kkm-primary font-semibold bg-shu-600 text-white border-2 border-shu-700 flex items-center justify-center gap-2.5 shrink-0">
        <IconPlus size={26}/> あたらしい ことばを ふやす
      </button>

      {addOpen && (
        <WordAddModal kanaMode={kanaMode} progress={progress} usableInWords={usableInWords} voiceOn={voiceOn}
          onCancel={() => setAddOpen(false)}
          onSave={(w) => { onAdd(w); speakText(w.text, voiceOn); setAddOpen(false); }}/>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   19. <WordAddModal>
   ────────────────────────────────────────────────────────────── */
function WordAddModal({ kanaMode, progress, usableInWords, voiceOn, onCancel, onSave }) {
  const [text, setText] = useState('');
  // さしえは「まだ えらんでいない（null）」を もつ。えらんでいない あいだは
  // ことばずかんから 引いた さしえを つかうので、よく つかう ことばは
  // なにも しなくても 正しい 絵に なる。
  const [pickedPict, setPickedPict] = useState(null);
  const pict = pickedPict || guessPict(text);
  const [kindTab, setKindTab] = useState('seion');
  const table = getKanaTable(kanaMode, kindTab);
  const canSave = text.length >= 1;
  const dialogRef = useModal(onCancel);
  // この ことばで 花丸になる もじ（できあがりの したみ）
  const willMaster = useMemo(() => Array.from(new Set(text.split(''))).filter(c => getStage(progress, c) === 3), [text, progress]);
  function addChar(c) { if (text.length < 8) { setText(t => t + c); speakText(c, voiceOn); } }
  function backspace() { setText(t => t.slice(0, -1)); }
  const handleSave = useDebouncedAction(() => { if (canSave) onSave({ text, pict, kanaMode }); }, 400);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-sumi-900/40 backdrop-blur-sm p-3 kkm-fade-in" onClick={onCancel}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="あたらしい ことばを ふやす"
        className="bg-white rounded-lg shadow-xl border border-sumi-300 border-t-4 border-t-shu-600 max-w-lg w-full max-h-[92vh] flex flex-col kkm-pop-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center px-4 md:px-5 pt-4 pb-3 shrink-0">
          <h3 className="kkm-heading-rule font-semibold text-base text-sumi-800">ことばを つくる</h3>
          <button onClick={onCancel} aria-label="とじる"
            className="kkm-btn w-11 h-11 rounded-md bg-sumi-50 hover:bg-sumi-100 border border-sumi-200 text-sumi-600 flex items-center justify-center min-w-[44px] min-h-[44px]"><IconX size={18}/></button>
        </div>

        <div className="px-4 md:px-5 overflow-y-auto flex-1 min-h-0">
        {/* ① できあがりの したみ */}
        <div className="bg-washi-100 rounded-md border border-sumi-200 p-3 mb-3 flex items-center gap-3 min-h-[76px]">
          <span className="text-shu-600 shrink-0"><Pict name={pict} size={38}/></span>
          <span className="kkm-glyph flex-1 text-2xl md:text-3xl text-sumi-800 break-all min-w-0">
            {text || <span className="text-sumi-600 text-lg">なにを かこうかな？</span>}
          </span>
          {text.length > 0 && (
            <>
              <button onClick={() => speakText(text, voiceOn)} disabled={!voiceOn}
                aria-label="いまの ことばを よみあげる"
                className="kkm-btn w-11 h-11 min-w-[44px] min-h-[44px] rounded-md bg-white border border-ai-300 text-ai-700 flex items-center justify-center disabled:opacity-40">
                <IconVolume size={19}/>
              </button>
              <button onClick={backspace}
                aria-label="さいごの じを けす"
                className="kkm-btn w-11 h-11 min-w-[44px] min-h-[44px] rounded-md bg-white border border-shu-300 text-shu-600 flex items-center justify-center">
                <IconX size={19}/>
              </button>
            </>
          )}
        </div>

        {/* ことばずかんに ある ことばなら、なかまと はんたいの ことばを 出す */}
        <WordBankHint text={text}/>

        {/* ② さしえを えらぶ
            えらぶ かずを 16 に しぼり、ぜんぶを ひと目に 出す（スクロール
            させない）。絵の いみを 当てさせないよう、下に ことばを そえる。 */}
        <div className="mb-3">
          <div className="kkm-heading-rule text-xs font-semibold text-sumi-600 mb-1.5">
            なかまを えらぶ
            <span className="font-medium text-sumi-600">
              {pickedPict || !guessPict(text) || guessPict(text) === DEFAULT_PICT
                ? '（にている ものを えらべば だいじょうぶ）'
                : '（ずかんから もってきました。かえても いいです）'}
            </span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 p-0.5">
            {PICT_CHOICES.map(c => (
              <button key={c.name} onClick={() => setPickedPict(c.name)} aria-pressed={pict === c.name} aria-label={c.label}
                className={`kkm-btn rounded-md border flex flex-col items-center justify-center gap-0.5 py-1.5 ${
                  pict === c.name ? 'bg-shu-50 border-shu-500 text-shu-700' : 'bg-white border-sumi-200 text-sumi-600 hover:border-shu-300'
                }`}>
                <Pict name={c.name} size={22}/>
                <span className="text-[9px] font-semibold leading-none">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {willMaster.length > 0 && (
          <div className="mb-3 bg-shu-50 border border-shu-300 rounded-md px-3 py-2 text-center text-xs md:text-sm font-semibold text-shu-800 kkm-pop-in">
            <span className="inline-flex items-center gap-1.5">
              <Hanamaru size={16}/> この ことばで <span className="text-base tabular-nums">{willMaster.length}</span>この じが <Furi>花丸</Furi>に なります
            </span>
            <div className="mt-1.5 flex justify-center gap-1.5">
              {willMaster.map(c => (
                <span key={c} className="kkm-glyph inline-flex items-center justify-center w-7 h-7 rounded-md bg-white border border-shu-400 text-shu-700 text-base">{c}</span>
              ))}
            </div>
          </div>
        )}

        {/* ③ もじを えらぶ */}
        <div className="mb-3">
          <div className="kkm-heading-rule text-xs font-semibold text-sumi-600 mb-1.5">
            もじを えらぶ<span className="font-medium text-sumi-600">（まだ かいて いない じも つかえます）</span>
          </div>
          <div className="grid grid-cols-4 gap-1 mb-1.5">
            {KANA_KINDS.map(k => (
              <button key={k.key} onClick={() => setKindTab(k.key)} aria-pressed={kindTab === k.key} title={k.label}
                className={`kkm-btn py-1.5 rounded-md font-semibold text-[10px] md:text-xs border ${
                  kindTab === k.key
                    ? 'bg-shu-50 text-shu-700 border-shu-400'
                    : 'bg-white text-sumi-600 border-sumi-200 hover:bg-washi-100'
                }`}>
                <span className="block md:hidden">{k.short}</span>
                <span className="hidden md:block truncate px-0.5">{k.mid}</span>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-5 gap-1.5 bg-washi-100 p-2 rounded-md border border-sumi-200">
            {table.map((c, i) => {
              if (!c) return <div key={i} className="aspect-square"/>;
              // まだ かいて いない じも つかえる（つかえないと、ならう前の
              // ことばが 1 つも つくれない）。かける じは 見た目で わかるようにする。
              const ok = usableInWords.includes(c);
              const stage = getStage(progress, c);
              const willPromote = stage === 3;
              return (
                <button key={i} onClick={() => addChar(c)}
                  aria-label={`${c}${willPromote ? '（つかうと はなまるに なります）' : ''}`}
                  className={`kkm-glyph kkm-btn relative aspect-square rounded-md text-xl md:text-2xl border ${
                    willPromote
                      ? 'bg-fuji-50 border-fuji-400 text-fuji-700 hover:bg-fuji-100'
                      : ok
                        ? 'bg-white border-sumi-300 text-sumi-700 hover:border-shu-300'
                        : 'bg-washi-100 border-sumi-200 text-sumi-600 hover:border-shu-300'
                  }`}>
                  {c}
                  {stage > 0 && <StageMark stage={stage} className="absolute -top-1 -right-1 leading-none"/>}
                </button>
              );
            })}
          </div>
        </div>

        </div>

        <div className="flex gap-2 px-4 md:px-5 pt-3 pb-4 border-t border-sumi-200 bg-white rounded-b-lg shrink-0">
          <button onClick={onCancel}
            className="kkm-btn flex-1 py-2.5 rounded-md font-semibold text-sm bg-white text-sumi-600 border border-sumi-300 min-h-[44px]">やめる</button>
          <button disabled={!canSave} onClick={handleSave}
            className="kkm-btn kkm-ripple flex-[2] py-2.5 rounded-md font-semibold text-base bg-shu-600 text-white border border-shu-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 min-h-[44px]">
            <IconCheck size={18}/> ずかんに ついか
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   20. <ResetModal>
   ────────────────────────────────────────────────────────────── */
function ResetModal({ onCancel, onConfirm }) {
  const dialogRef = useModal(onCancel);
  const guardedConfirm = useDebouncedAction(onConfirm, 500);
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-sumi-900/40 backdrop-blur-sm p-4 kkm-fade-in" onClick={onCancel}>
      <div ref={dialogRef} role="alertdialog" aria-modal="true" aria-label="データをけしますか？"
        className="bg-white rounded-lg shadow-xl border border-sumi-300 border-t-4 border-t-shu-600 p-5 max-w-sm w-full flex flex-col items-center gap-3 kkm-pop-in" onClick={(e) => e.stopPropagation()}>
        <span className="text-shu-600"><IconAlert size={38}/></span>
        <p className="text-base font-semibold text-sumi-800 text-center leading-relaxed">
          いままで れんしゅうした<br/>データを ぜんぶ けしますか？
        </p>
        <p className="text-xs text-sumi-600 font-medium text-center">もとには もどせません。</p>
        <div className="flex gap-2 w-full mt-2">
          <button onClick={onCancel} autoFocus
            className="kkm-btn flex-1 py-2.5 rounded-md font-semibold bg-white text-sumi-700 border border-sumi-300 min-h-[44px]">やめる</button>
          <button onClick={guardedConfirm}
            className="kkm-btn kkm-ripple flex-1 py-2.5 rounded-md font-semibold bg-shu-600 text-white border border-shu-700 min-h-[44px]">けす</button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   20-b. <InstallGuideModal> ── ブラウザが自動インストールを出せないとき
   ────────────────────────────────────────────────────────────── */
// beforeinstallprompt が取得できない環境（Chromebook で既に別アプリと
// 判定された・Safari・イベント未発火 など）でも、必ず手動の手順を案内する。
const INSTALL_STEPS = {
  chromeos: {
    title: 'Chromebook で アプリにする',
    steps: [
      'アドレスバーの みぎはしにある「⊕（インストール）」アイコンを クリック',
      'なければ みぎうえの「⋮」→「キャスト、保存、共有」→「ページをアプリとしてインストール」',
      '「インストール」を えらぶと、ランチャー（◯ボタン）に アイコンが できます',
    ],
  },
  desktop: {
    title: 'パソコン（Chrome）で アプリにする',
    steps: [
      'アドレスバーの みぎはしにある「⊕（インストール）」アイコンを クリック',
      'なければ みぎうえの「⋮」→「キャスト、保存、共有」→「ページをアプリとしてインストール」',
      '「インストール」を えらぶと、デスクトップに アイコンが できます',
    ],
  },
  edge: {
    title: 'パソコン（Edge）で アプリにする',
    steps: [
      'みぎうえの「…」を クリック',
      '「アプリ」→「このサイトをアプリとしてインストール」を えらぶ',
      '「インストール」を おすと アイコンが できます',
    ],
  },
  android: {
    title: 'Android で アプリにする',
    steps: [
      'みぎうえの「⋮」を タップ',
      '「アプリをインストール」または「ホーム画面に追加」を えらぶ',
      '「インストール」を おすと ホームがめんに アイコンが できます',
    ],
  },
  ios: {
    title: 'iPhone・iPad（Safari）で アプリにする',
    steps: [
      'がめんの したにある「共有」ボタン（四角から 上むきの やじるし）を タップ',
      'メニューを したに スクロールして「ホーム画面に追加」を えらぶ',
      'みぎうえの「追加」を おすと アイコンが できます',
    ],
  },
};

function InstallGuideModal({ platform, onClose }) {
  const dialogRef = useModal(onClose);
  const guide = INSTALL_STEPS[platform] || INSTALL_STEPS.desktop;
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-sumi-900/40 backdrop-blur-sm p-4 kkm-fade-in" onClick={onClose}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="アプリとして ついかする ほうほう"
        className="bg-white rounded-lg shadow-xl border border-sumi-300 border-t-4 border-t-midori-600 p-5 max-w-md w-full max-h-[85vh] overflow-y-auto flex flex-col gap-3 kkm-pop-in"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <span className="text-midori-700"><IconDownload size={24}/></span>
          <h2 className="text-lg font-semibold text-sumi-800 flex-1">{guide.title}</h2>
        </div>
        {/* この手順は 端末の メニューの ことばを そのまま 引くので、漢字を
            かなに ひらけない（ちがう ことばに すると 見つけられなくなる）。
            そこで「大人が 読む ところ」だと はっきり 断っておく。 */}
        <p className="text-sm font-semibold text-sumi-600">おうちの方・先生へ</p>
        <ol className="flex flex-col gap-2 mt-1">
          {guide.steps.map((s, i) => (
            <li key={i} className="flex gap-2.5 items-start bg-washi-100 rounded-md p-3 border border-sumi-200">
              <span aria-hidden="true"
                className="shrink-0 w-6 h-6 rounded-full bg-midori-600 text-white text-xs font-semibold flex items-center justify-center">{i + 1}</span>
              <span className="text-sm font-medium text-sumi-700 leading-relaxed">{s}</span>
            </li>
          ))}
        </ol>
        <p className="text-xs text-sumi-600 font-medium leading-relaxed">
          すでに インストールずみの ときは、ボタンを おしても なにも おきません。
          ランチャーや ホームがめんの アイコンから ひらいてください。
        </p>
        <button onClick={onClose} autoFocus
          className="kkm-btn kkm-ripple w-full py-2.5 rounded-md font-semibold bg-midori-600 text-white border border-midori-700 min-h-[44px]">
          わかりました
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   21. <MainBoard>
   ────────────────────────────────────────────────────────────── */
function MainBoard({ kanaMode, setKanaMode, kanaKind, setKanaKind, progress, mastered, onAnimeViewed, onRoundComplete, onMistakeStreakReset, onStrokeCountMismatch, onWriteAttempt, practiceCount, voiceOn, onGoToWords, requestedChar, onConsumeRequested }) {
  const [currentChar, setCurrentChar] = useState(null);
  const [paths, setPaths] = useState(null);
  const [fetchError, setFetchError] = useState(false);
  const [playMode, setPlayMode] = useState('free');
  const dailyChar = useDailyChallenge(kanaMode, mastered);
  // 並行に複数のフェッチを起動した場合、最後に選んだ文字の結果だけ反映するため
  // 連番で識別する
  const fetchSeqRef = useRef(0);
  // selectChar は毎回作りなおしたくない（effect の依存に入っている）ので、
  // いまの progress は ref ごしに読む
  const progressRef = useRef(progress);
  progressRef.current = progress;

  const selectChar = useCallback(async (c, mode='free') => {
    const seq = ++fetchSeqRef.current;
    /* 学習ログ：**かくは 文字ごとに 1 レコード**（§3.10.5）。
       文字を えらんだ ときに はじめると、かきじゅんアニメを 見ている 時間も
       その 文字に 取りくんだ 時間として のこる。前の 文字の レコードは
       ここで しめられる（beginWrite の 中で 前のを 終わらせている）。 */
    if (STUDY && c) {
      const st = getStage(progressRef.current, c);
      STUDY.beginWrite(c, st, st < 2, scriptOf(c));
    }
    setPlayMode(mode); setCurrentChar(c); setPaths(null); setFetchError(false);
    const p = await fetchKanjiVG(c);
    if (seq !== fetchSeqRef.current) return; // 古い結果は捨てる
    if (!p) { setPaths([]); setFetchError(true); return; }
    setPaths(p);
  }, []);
  const retryFetch = useCallback(() => {
    if (currentChar) selectChar(currentChar, playMode);
  }, [currentChar, playMode, selectChar]);

  // デイリーチャレンジ：文字に合わせて しゅるい も自動で切り替え
  function pickDaily(c) {
    const kind = getKindOfChar(c);
    if (kind !== kanaKind) setKanaKind(kind);
    selectChar(c, 'free');
  }

  // ホームの「つぎの もじ」から とんできたときは、その文字をすぐ ひらく
  useEffect(() => {
    if (!requestedChar) return;
    const kind = getKindOfChar(requestedChar);
    if (kind !== kanaKind) setKanaKind(kind);
    const isKata = KATA_ALL_LIST.includes(requestedChar);
    if (isKata && kanaMode !== 'katakana') setKanaMode('katakana');
    if (!isKata && kanaMode !== 'hiragana') setKanaMode('hiragana');
    selectChar(requestedChar, 'free');
    onConsumeRequested && onConsumeRequested();
    // eslint-disable-next-line
  }, [requestedChar]);

  /* まとめて れんしゅうする ときの じゅんばん。
     五十音の「あ」からではなく、画数の すくない やさしい 字から すすめる。
     はじめの 1 文字で つまずかせないための ならびで、表の 見た目
     （教科書どおりの 五十音）は かえない。 */
  function startSequence() {
    const list = getKanaList(kanaMode, kanaKind);
    const order = learnOrderOf(kanaMode).filter(c => list.includes(c));
    const seq = order.length > 0 ? order : list;
    const target = seq.find(c => getStage(progress, c) < 4) || seq[0];
    selectChar(target, 'sequential');
  }
  function startRandom() {
    const list = getKanaList(kanaMode, kanaKind);
    let pool = list.filter(c => getStage(progress, c) < 4);
    if (pool.length === 0) pool = list;
    // 直前と同じ文字を連続で出さない（プールが 2 つ以上ある場合）
    if (currentChar && pool.length > 1) pool = pool.filter(c => c !== currentChar);
    const target = pool[Math.floor(Math.random()*pool.length)];
    selectChar(target, 'random');
  }
  function nextChar() {
    if (!currentChar) return;
    const list = getKanaList(kanaMode, kanaKind);
    if (playMode === 'random') return startRandom();
    // じゅんばん練習も「やさしい じゅん」でつなぐ
    const order = learnOrderOf(kanaMode).filter(c => list.includes(c));
    const seq = order.length > 0 ? order : list;
    const idx = seq.indexOf(currentChar);
    if (idx < 0) { return selectChar(seq[0], playMode); }
    selectChar(seq[(idx+1) % seq.length], playMode);
  }
  // 表のしゅるい／かなが切り替わったとき、いまの文字がその表にないなら選択解除
  useEffect(() => {
    if (!currentChar) return;
    const list = getKanaList(kanaMode, kanaKind);
    if (!list.includes(currentChar)) { setCurrentChar(null); setPaths(null); }
    // eslint-disable-next-line
  }, [kanaMode, kanaKind]);

  const stageObj = currentChar ? (progress[currentChar] || newStageObj()) : null;

  // sequence/random モードでは、現在の文字がステージ4に到達したら自動で次の文字へ
  useEffect(() => {
    if (!currentChar) return;
    if (playMode === 'free') return;
    if (stageObj && stageObj.stage >= 4) {
      const t = setTimeout(() => nextChar(), 1800);
      return () => clearTimeout(t);
    }
  }, [currentChar, stageObj?.stage, playMode]);

  // レイアウト分岐：
  //   ・よこ向き、または画面幅 ≥1024px（PC・タブレット横）→ 表と練習を左右に並べる
  //   ・たて向きのスマホ／タブレット → 練習キャンバスを画面いっぱいに大きく表示し、
  //     文字の表は「もじをえらぶ」ボタンで開くドロワーにする
  const wideLayout = useMediaQuery('(min-width: 1024px), (orientation: landscape)');
  const [tableOpen, setTableOpen] = useState(false);

  // たて向きモードで、まだ何も選んでいなければ最初に表を開いて選択をうながす
  const autoOpenedRef = useRef(false);
  useEffect(() => {
    if (wideLayout) { setTableOpen(false); return; }
    if (!autoOpenedRef.current && !currentChar) {
      autoOpenedRef.current = true;
      setTableOpen(true);
    }
  }, [wideLayout, currentChar]);

  // ドロワー内での操作は、文字を選んだら自動で閉じる
  const pickFromDrawer  = useCallback((c) => { selectChar(c, 'free'); setTableOpen(false); }, [selectChar]);
  const seqFromDrawer   = useCallback(() => { startSequence(); setTableOpen(false); }, [startSequence]);
  const randFromDrawer  = useCallback(() => { startRandom();   setTableOpen(false); }, [startRandom]);

  const board = (
    <PracticeBoard char={currentChar} paths={paths} stageObj={stageObj}
      onAnimeViewed={onAnimeViewed}
      onRoundComplete={onRoundComplete}
      onMistakeStreakReset={onMistakeStreakReset}
      onStrokeCountMismatch={onStrokeCountMismatch}
      onWriteAttempt={onWriteAttempt}
      practiceCount={practiceCount} voiceOn={voiceOn}
      onGoToWords={onGoToWords}
      onNextChar={currentChar ? nextChar : null}
      fetchError={fetchError} onRetryFetch={retryFetch}/>
  );

  if (wideLayout) {
    return (
      <div className="flex-1 flex flex-col p-2 md:p-4 min-h-0 overflow-hidden gap-2 md:gap-3 kkm-main-pad">
        <div className="shrink-0 kkm-daily-wrap">
          <DailyChallenge char={dailyChar} kanaMode={kanaMode} progress={progress}
            onPick={pickDaily}/>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-2 md:gap-4 min-h-0 overflow-hidden">
          <KanaTable kanaMode={kanaMode} setKanaMode={setKanaMode}
            kanaKind={kanaKind} setKanaKind={setKanaKind}
            progress={progress} currentChar={currentChar}
            onSelect={(c) => selectChar(c,'free')}
            onSequence={startSequence} onRandom={startRandom}/>
          {board}
        </div>
      </div>
    );
  }

  // ── たて向き：練習キャンバスを大きく、表はドロワー ──
  return (
    <div className="flex-1 flex flex-col p-1.5 min-h-0 overflow-hidden gap-1.5 kkm-main-pad">
      {/* もじをえらぶバー（現在の文字＋表を開くボタン） */}
      <div className="shrink-0 flex items-center gap-2">
        <button onClick={() => setTableOpen(true)}
          aria-haspopup="dialog" aria-expanded={tableOpen}
          style={{ '--kkm-shadow-color': TONE_DEEP.shu }}
          className="kkm-btn kkm-ripple kkm-solid flex-1 flex items-center justify-center gap-2.5 font-semibold text-lg bg-shu-600 text-white border-2 border-shu-700">
          <IconGrid size={24}/>
          {currentChar ? 'べつの もじ' : 'もじを えらぶ'}
        </button>
        {currentChar && (
          <div className="shrink-0 flex items-center justify-center bg-white rounded-lg w-14 h-14 border-2 border-shu-300">
            <span className="kkm-glyph text-3xl text-shu-700">{currentChar}</span>
          </div>
        )}
      </div>

      {/* 練習キャンバスは のこりの たかさ・はば いっぱいに広げる（flex-1 min-h-0）。
          PracticeBoard 自身が h-full なので、包む側で高さを確定させる。 */}
      <div className="flex-1 min-h-0 flex flex-col">
        {board}
      </div>

      {/* もじの表（ボトムシート・ドロワー） */}
      {tableOpen && (
        <KanaDrawer onClose={() => setTableOpen(false)}>
          <KanaTable kanaMode={kanaMode} setKanaMode={setKanaMode}
            kanaKind={kanaKind} setKanaKind={setKanaKind}
            progress={progress} currentChar={currentChar}
            onSelect={pickFromDrawer}
            onSequence={seqFromDrawer} onRandom={randFromDrawer}/>
        </KanaDrawer>
      )}
    </div>
  );
}

/* もじ表を下から出すボトムシート（たて向きレイアウト用） */
function KanaDrawer({ children, onClose }) {
  const ref = useModal(onClose);
  return (
    <div className="fixed inset-0 z-[300] flex flex-col justify-end" role="dialog" aria-modal="true" aria-label="もじを えらぶ">
      <div className="absolute inset-0 bg-sumi-900/40 backdrop-blur-sm kkm-fade-in" onClick={onClose}/>
      <div ref={ref}
        className="relative w-full max-h-[88vh] bg-washi-100 rounded-t-xl shadow-2xl border-t-4 border-shu-600 flex flex-col kkm-sheet-up"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {/* 見出しの 行。とじる ボタンは かならず ここに 場所を とる
            （中身に かさねると、中の ボタンが 大きく なった とき かくれる）。 */}
        <div className="shrink-0 flex items-center gap-2 px-3 pt-2 pb-1.5 border-b border-sumi-200">
          <span className="w-12 shrink-0" aria-hidden="true"/>
          <span className="flex-1 text-center text-lg font-semibold text-sumi-700">もじを えらぶ</span>
          <button onClick={onClose} aria-label="とじる"
            className="kkm-btn shrink-0 w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl bg-white border-2 border-sumi-300 text-sumi-600 flex items-center justify-center">
            <IconX size={24}/>
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden p-3 pt-2">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   18.4. MIM の 視覚化（ドット）と 動作化（リズム）

   目に見えない「おと」を、● と 手の うごきで つかめるようにする。
   このアプリで 特殊音節を あつかう ところは、ぜんぶ ここを 通す。
   ══════════════════════════════════════════════════════════════ */

/* 手の うごきの えほんアイコン。
   なるべく 小さくても わかるよう、実物そっくりではなく 記号にしている。 */
const IconClap     = (p) => <SvgIcon {...p}><rect x="7" y="9" width="10" height="10" rx="3"/><path d="M9.5 9V6.6M12 9V5.6M14.5 9V6.6"/><path d="M4 5.6 5.9 7.2M20 5.6 18.1 7.2"/></SvgIcon>;
const IconFist     = (p) => <SvgIcon {...p}><rect x="6" y="7.5" width="12" height="11" rx="4"/><path d="M9 11.5h6M9 14.5h6"/></SvgIcon>;
const IconPullSide = (p) => <SvgIcon {...p}><rect x="3.5" y="7.5" width="8" height="10" rx="3"/><path d="M13.5 12.5h7M17.5 9.5l3 3-3 3"/></SvgIcon>;
const HAND_ICONS = { clap: IconClap, fist: IconFist, pull: IconPullSide };

/* 拍（おと）を ● で あらわす 1 行。マスの ま下に そろえて出す。
     ふつうの おと … ぬりつぶした ●
     つまる おと   … 小さい 白い ○（音を 出さない）
     ねじれる おと … ● 1 つ ＋ 2 マスを つなぐ かっこ
     のばす おと   … ● ＋ まえの ● とを つなぐ よこ線 */
function MimDots({ word, cellSize = 52, gap = 6, activeMora = -1, className = '' }) {
  const moras = splitMora(word);
  const kinds = moraKinds(word);
  return (
    <div className={`flex ${className}`} style={{ gap }} aria-hidden="true">
      {moras.map((m, i) => {
        const span = splitCells(m).length;
        const width = span * cellSize + (span - 1) * gap;
        const kind = kinds[i];
        const on = i === activeMora;
        // まえの 拍の ● の まん中まで 線を のばす（拗長音でも ずれないように）
        const prevSpan = i > 0 ? splitCells(moras[i - 1]).length : 1;
        const prevHalf = (prevSpan * cellSize + (prevSpan - 1) * gap) / 2;
        return (
          <span key={i} className="relative flex items-center justify-center shrink-0" style={{ width, height: 20 }}>
            {/* のばす おと：まえの ● とを 線でつなぐ */}
            {kind === 'chouon' && i > 0 && (
              <span className="absolute top-1/2 -translate-y-1/2 border-t-2 border-shu-500"
                style={{ right: '50%', width: (width / 2) + gap + prevHalf }}/>
            )}
            {/* ねじれる おと：2 マスぶんを かっこで まとめる */}
            {kind === 'youon' && (
              <span className="absolute inset-x-1 top-0 h-2 border-t-2 border-x-2 border-fuji-400 rounded-t-md"/>
            )}
            <span className={`relative rounded-full transition-all duration-150 ${
              kind === 'sokuon'
                ? `border-2 border-dashed ${on ? 'border-shu-600 bg-shu-100' : 'border-sumi-400 bg-white'}`
                : `${on ? 'bg-shu-600' : 'bg-sumi-500'}`
            }`}
              style={kind === 'sokuon'
                ? { width: 10, height: 10 }
                : { width: on ? 16 : 13, height: on ? 16 : 13 }}/>
          </span>
        );
      })}
    </div>
  );
}

/* 動作化：リズムに あわせて 手を うごかす。
   ・ふつうの おと … たたく（音が 鳴る）
   ・つまる おと   … にぎる（音を 鳴らさない）← ここが いちばん 大事
   ・のばす おと   … よこに ひっぱる */
function RhythmPlayer({ word, cellSize = 46, autoPlay = false, voiceOn = true, compact = false, onDone, showCells = true }) {
  const [active, setActive] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const timersRef = useRef([]);
  const kinds = useMemo(() => moraKinds(word), [word]);
  const moras = useMemo(() => splitMora(word), [word]);

  const clearTimers = useCallback(() => { timersRef.current.forEach(clearTimeout); timersRef.current = []; }, []);
  useEffect(() => clearTimers, [clearTimers]);

  const play = useCallback(() => {
    clearTimers();
    setPlaying(true);
    initAudio();
    const step = 620;
    moras.forEach((m, i) => {
      timersRef.current.push(setTimeout(() => {
        setActive(i);
        hapticTick();
        // つまる おと は 音を 出さない（グーに にぎる ところ）
        if (kinds[i] === 'sokuon') return;
        if (kinds[i] === 'chouon') playTone(587.33, 'sine', 0.42, 0.09);
        else playTone(783.99, 'sine', 0.12, 0.09);
      }, i * step));
    });
    timersRef.current.push(setTimeout(() => {
      setActive(-1); setPlaying(false);
      if (voiceOn) speakText(word, voiceOn);
      // 「まず リズムを 見せてから といてもらう」ときに、見おわりを 知らせる
      onDone && onDone();
    }, moras.length * step + 250));
  }, [moras, kinds, word, voiceOn, clearTimers, onDone]);

  useEffect(() => {
    setActive(-1); setPlaying(false); clearTimers();
    if (autoPlay) { const t = setTimeout(play, 350); return () => clearTimeout(t); }
    // eslint-disable-next-line
  }, [word, autoPlay]);

  const info = active >= 0 ? MORA_KIND_INFO[kinds[active]] : null;
  const Hand = info ? HAND_ICONS[info.hand] : IconClap;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="inline-flex flex-col items-center gap-1">
        {/* `showCells` を false に すると 字を ふせて リズムだけ 見せる。
            「ただしい かきかたは どっち？」の まえに 動作化を 出すとき、
            字を そのまま ならべたら こたえを 見せて しまうため。
            ドット（拍）と 手の うごきは そのまま 出す — 拍の かずは
            2nd・3rd では もともと つねに 見えている ので 新たな 手がかりでは ない。 */}
        {showCells && (
          <div className="flex" style={{ gap: 6 }}>
            {splitCells(word).map((c, i) => <KanaCell key={i} char={c} size={cellSize}/>)}
          </div>
        )}
        <MimDots word={word} cellSize={cellSize} gap={6} activeMora={active}/>
      </div>

      {!compact && (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md border min-h-[42px] ${
          info ? 'bg-shu-50 border-shu-300 text-shu-700' : 'bg-washi-100 border-sumi-200 text-sumi-600'
        }`}>
          <span className={info ? 'kkm-pop-in' : ''}><Hand size={22}/></span>
          <span className="text-sm font-semibold">{info ? info.hint : '「リズム」を おしてね'}</span>
        </div>
      )}

      <button onClick={play} disabled={playing}
        className="kkm-btn kkm-ripple px-4 py-2 rounded-md bg-shu-600 text-white font-semibold text-sm border border-shu-700 flex items-center justify-center gap-2 disabled:opacity-60 min-h-[42px]">
        <IconClap size={17}/> {playing ? 'てを たたこう…' : 'リズムで やってみる'}
      </button>
    </div>
  );
}

/* 手の うごきの きまり（まなぶ画面で 見せる はやみ表） */
function RhythmLegend() {
  const rows = [
    { kind:'plain',  ex:'か' },
    { kind:'sokuon', ex:'っ' },
    { kind:'chouon', ex:'う' },
    { kind:'youon',  ex:'ゃ' },
  ];
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {rows.map(r => {
        const info = MORA_KIND_INFO[r.kind];
        const Hand = HAND_ICONS[info.hand];
        return (
          <div key={r.kind} className="flex items-center gap-2 rounded-md border border-sumi-200 bg-washi-100 px-2 py-1.5">
            <span className="kkm-glyph text-lg leading-none text-sumi-700 w-5 text-center">{r.ex}</span>
            <span className="text-shu-600 shrink-0"><Hand size={18}/></span>
            <span className="text-[11px] font-semibold text-sumi-600 leading-tight">{info.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   18.45. <MimCheckView> ── ちからだめし「よみめいじん」

   MIM-PM に ならった 2 分（1 分 × 2）の みじかい 課題。
   点数そのものより、**まえの じぶんと くらべて のびているか** を見る。
   結果から その子に 合う ステージ（指導の あつさ）を きめる。
   ══════════════════════════════════════════════════════════════ */
const MIM_TEST_SECONDS = 60;

/* のこり時間の わっか */
function CountDown({ left, total }) {
  return (
    <div className="flex items-center gap-2">
      <ProgressRing pct={(left / total) * 100} size={38} stroke={4}
        color={left <= 10 ? 'var(--kkm-shu)' : '#40608a'}>
        <span className={`text-[11px] font-semibold tabular-nums ${left <= 10 ? 'text-shu-700' : 'text-ai-700'}`}>{left}</span>
      </ProgressRing>
      <span className="text-[11px] font-semibold text-sumi-600">びょう</span>
    </div>
  );
}

/* テスト②「3つの ことば さがし」の 1 もん。
   もじと もじの あいだを タップして、ことばの きれめに 線を いれる。 */
function ChunkQuestion({ chunk, onDone }) {
  const text = chunk.join('');
  const chars = splitCells(text);
  const answer = useMemo(() => {
    const out = []; let acc = 0;
    for (let i = 0; i < chunk.length - 1; i++) { acc += splitCells(chunk[i]).length; out.push(acc); }
    return out;
  }, [chunk]);
  const [cuts, setCuts] = useState([]);

  function toggle(pos) {
    setCuts(prev => {
      const next = prev.includes(pos) ? prev.filter(p => p !== pos) : [...prev, pos].sort((a, b) => a - b);
      if (next.length === answer.length) {
        const ok = next.every((p, i) => p === answer[i]);
        setTimeout(() => onDone(ok), 260);
      }
      return next;
    });
  }
  const size = chars.length > 8 ? 34 : 42;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-xs md:text-sm font-semibold text-sumi-600">3 つの ことばに せんで わけよう</div>
      <div className="flex items-center flex-wrap justify-center">
        {chars.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && (
              <button onClick={() => toggle(i)} aria-label={`${i}ばんめの あとで きる`}
                className="kkm-btn relative flex items-center justify-center shrink-0"
                style={{ width: 16, height: size }}>
                <span className={`block rounded-full transition-all ${
                  cuts.includes(i) ? 'bg-shu-600 w-1' : 'bg-sumi-200 w-0.5'
                }`} style={{ height: cuts.includes(i) ? size : size * 0.5 }}/>
              </button>
            )}
            <KanaCell char={c} size={size}/>
          </React.Fragment>
        ))}
      </div>
      <div className="text-[11px] font-medium text-sumi-600">もじの あいだを タップすると せんが ひけるよ</div>
    </div>
  );
}

/* テスト①「えに あう ことば さがし」の 1 もん。
   えを 見て、ただしい かきかたの ことばを えらぶ。

   ならびを ここ（子の コンポーネント）で きめているのは わけが ある。
   おやの <MimCheckView> は のこり秒を 1 びょうごとに かきかえるので、
   えらぶ ボタンを おやの 中で つくると **1 びょうごとに ならびが まざり**、
   ゆびを のばした さきの ことばが 入れかわってしまう。
   1 もんの あいだ ならびは かえない（ならびを まぜるのは 出だしの 1 かいだけ）。 */
function SpellQuestion({ item, onAnswer }) {
  const choices = useMemo(() => shuffled([item.w, ...item.bad]), [item]);
  return (
    <>
      <div className="flex items-center justify-center w-24 h-24 rounded-lg bg-washi-100 border border-sumi-200 text-sumi-700">
        <Pict name={item.p} size={58}/>
      </div>
      <div className="w-full max-w-md grid grid-cols-1 sm:grid-cols-3 gap-2">
        {choices.map(c => (
          <button key={c} onClick={() => onAnswer(c)}
            className="kkm-btn kkm-ripple rounded-lg bg-white border-2 border-sumi-300 hover:border-shu-400 py-3 px-2 min-h-[56px] flex items-center justify-center">
            <span className="kkm-glyph text-lg md:text-xl text-sumi-800 leading-none">{c}</span>
          </button>
        ))}
      </div>
    </>
  );
}

function MimCheckView({ mim, setMim, voiceOn, onClose, onChecked, tier = 1 }) {
  const [phase, setPhase] = useState('intro');   // intro / test1 / rest / test2 / result
  const [left, setLeft] = useState(MIM_TEST_SECONDS);
  const [idx, setIdx] = useState(0);
  const [t1, setT1] = useState(0);
  const [t2, setT2] = useState(0);
  const [flash, setFlash] = useState(null);
  const items1 = useMemo(() => shuffled(MIM_PM_ITEMS), []);
  const items2 = useMemo(() => shuffled(MIM_PM_CHUNKS), []);

  // タイマー
  useEffect(() => {
    if (phase !== 'test1' && phase !== 'test2') return;
    setLeft(MIM_TEST_SECONDS);
    const id = setInterval(() => {
      setLeft(l => {
        if (l <= 1) {
          clearInterval(id);
          setPhase(p => (p === 'test1' ? 'rest' : 'result'));
          return 0;
        }
        return l - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  // 結果を きろくする
  const savedRef = useRef(false);
  useEffect(() => {
    if (phase !== 'result' || savedRef.current) return;
    savedRef.current = true;
    const total = t1 + t2;
    const tier = tierFromScore(total);
    setMim(prev => {
      const log = [...((prev && prev.log) || []), { day: dayNumber(), date: todayKey(), t1, t2, total, tier }];
      while (log.length > 24) log.shift();
      return { ...(prev || {}), log };
    });
    onChecked && onChecked();
    playFanfare(); burstConfetti(); hapticTriumph();
    // eslint-disable-next-line
  }, [phase]);

  /* ── 学習ログ（§3.10.4）──
     ちからだめしは 1 ぷん×2 の みじかい 課題。**2 つの課題は べつの もの**なので、
     `ext.testType`（spelling / segmentation）で 分けて 1 かいずつ レコードに する。
     この 点数を 他アプリの 正答率と ならべては ならない（制限時間つきの 流暢性課題で
     性質が ちがう）。受信側は `mode: "mimcheck"` を 正答率の 集計から 外している。
     時間切れが この課題の「おわり」なので、完走＝時間いっぱい やりきったとき。 */
  const askedRef = useRef(Date.now());
  const scoreRef = useRef(0);
  useEffect(() => {
    if (!STUDY || !KANA_STUDY) return;
    if (phase === 'test1' || phase === 'test2') {
      scoreRef.current = 0;
      askedRef.current = Date.now();
      STUDY.begin({ ...KANA_STUDY.mimUnit(),
        ext: { tier, testType: phase === 'test1' ? 'spelling' : 'segmentation', score: 0 } });
    } else if (phase === 'rest' || phase === 'result') {
      STUDY.markCompleted();
      STUDY.end('completed');
    }
    // eslint-disable-next-line
  }, [phase]);

  function noteMimAnswer(qText, ok, chosen) {
    if (!STUDY || !KANA_STUDY) return;
    scoreRef.current += ok ? 1 : 0;
    const ms = Date.now() - askedRef.current;
    askedRef.current = Date.now();
    STUDY.item({ q: KANA_STUDY.questionId(qText), ok, firstTry: ok, tries: 1, ms,
      wrong: ok ? undefined : chosen });
    STUDY.patchExt({ score: scoreRef.current });
  }

  function answer1(choice, item) {
    const ok = choice === item.w;
    noteMimAnswer(item.w, ok, choice);
    if (ok) { setT1(v => v + 1); playPingPong(); } else { playBuzzer(); }
    setFlash(ok ? 'ok' : 'ng');
    setTimeout(() => { setFlash(null); setIdx(i => i + 1); }, 260);
  }
  function answer2(ok) {
    // 3 つの ことばを つないだ 文字れつ は 20 文字を こえうるので、
    // 設問 ID は きまった ハッシュ（djb2）で みじかくする（§2.10）
    noteMimAnswer(items2[idx % items2.length].join(''), ok, null);
    if (ok) { setT2(v => v + 1); playPingPong(); } else { playBuzzer(); }
    setFlash(ok ? 'ok' : 'ng');
    setTimeout(() => { setFlash(null); setIdx(i => i + 1); }, 320);
  }

  /* ── はじめの あんない ── */
  if (phase === 'intro') {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto p-3 md:p-4">
        <div className="max-w-xl mx-auto flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <button onClick={onClose} aria-label="もどる"
              className="kkm-btn w-9 h-9 shrink-0 rounded-md bg-white border border-sumi-300 text-sumi-600 flex items-center justify-center">
              <IconX size={16}/>
            </button>
            <SectionTitle>ちからだめし「よみめいじん」</SectionTitle>
          </div>
          <div className="kkm-sheet rounded-lg p-4 flex items-center gap-3 border-l-4 border-l-ai-600">
            <MascotFace size={48} mood="cheer"/>
            <div className="text-sm md:text-base font-semibold text-sumi-800 leading-snug">
              1 ぷんずつ、2 かい。<br/>
              どれだけ はやく ただしい ことばを みつけられるか ためしてみよう。
            </div>
          </div>
          <ol className="flex flex-col gap-2">
            {[
              { n:'１', t:'えに あう ことば さがし', s:'えを みて、ただしい かきかたを えらぶ（1ぷん）' },
              { n:'２', t:'3 つの ことば さがし',   s:'つながった もじを 3 つの ことばに わける（1ぷん）' },
            ].map(x => (
              <li key={x.n} className="kkm-sheet rounded-lg p-3 flex items-center gap-3">
                <span className="kkm-glyph shrink-0 w-9 h-9 rounded-md bg-ai-50 border border-ai-300 text-ai-700 flex items-center justify-center text-lg">{x.n}</span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-sumi-800">{x.t}</span>
                  <span className="block text-[11px] font-medium text-sumi-600">{x.s}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="text-[11px] font-medium text-sumi-600 leading-relaxed kkm-sheet rounded-lg p-3">
            まちがえても だいじょうぶ。この けっかで「いま どのくらい ていねいに
            すすめると いいか」を きめるだけだよ。
          </div>
          <button onClick={() => { setIdx(0); setPhase('test1'); }}
            className="kkm-btn kkm-ripple py-3.5 rounded-md bg-ai-600 text-white font-semibold text-base border border-ai-700 flex items-center justify-center gap-2 min-h-[52px]">
            <IconPlay size={18}/> はじめる
          </button>
        </div>
      </div>
    );
  }

  /* ── 1 と 2 の あいだ ── */
  if (phase === 'rest') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
        <MascotFace size={56} mood="wow"/>
        <div className="text-xl font-semibold text-sumi-800">1 つめ おわり！</div>
        <div className="text-sm font-medium text-sumi-600">
          ただしく えらべたのは <span className="text-shu-700 font-semibold tabular-nums">{t1}</span> こ
        </div>
        <button onClick={() => { setIdx(0); setPhase('test2'); }}
          className="kkm-btn kkm-ripple px-6 py-3 rounded-md bg-ai-600 text-white font-semibold border border-ai-700 min-h-[48px]">
          つぎへ（3 つの ことば さがし）
        </button>
      </div>
    );
  }

  /* ── 結果 ── */
  if (phase === 'result') {
    const total = t1 + t2;
    const tier = tierFromScore(total);
    const info = MIM_TIER_INFO[tier];
    const t = TONES[info.tone];
    const log = (mim?.log || []);
    return (
      <div className="flex-1 min-h-0 overflow-y-auto p-3 md:p-4">
        <div className="max-w-xl mx-auto flex flex-col gap-3 text-center">
          <span className={`kkm-stamp mx-auto w-24 h-24 rounded-lg border-2 flex items-center justify-center ${t.solid} text-white`}>
            <span className="text-4xl font-semibold tabular-nums">{total}</span>
          </span>
          <div className="text-xl font-semibold text-sumi-800">よく がんばりました！</div>
          <div className="text-sm font-medium text-sumi-600">
            えに あう ことば {t1} こ ・ 3 つの ことば {t2} もん
          </div>
          <div className={`kkm-sheet rounded-lg p-3 border-l-4 ${t.leftRule} text-left`}>
            <div className={`text-sm font-semibold ${t.text}`}>これからの すすめかた：{info.short}</div>
            <div className="text-xs font-medium text-sumi-600 mt-1 leading-snug">{info.desc}</div>
          </div>
          {/* きろくは 上の useEffect で すでに 足してある。ここで もう一度
              足すと 同じ点が 2 つ ならぶので、そのまま 見せる。 */}
          <MimHistoryChart log={log}/>
          <button onClick={onClose}
            className="kkm-btn kkm-ripple py-3 rounded-md bg-shu-600 text-white font-semibold border border-shu-700 min-h-[48px]">
            おわる
          </button>
        </div>
      </div>
    );
  }

  /* ── テスト中 ── */
  const isT1 = phase === 'test1';
  const item = isT1 ? items1[idx % items1.length] : items2[idx % items2.length];
  return (
    <div className={`flex-1 min-h-0 flex flex-col p-2 md:p-4 transition-colors duration-150 ${
      flash === 'ok' ? 'bg-midori-50' : flash === 'ng' ? 'bg-shu-50' : ''
    }`}>
      <div className="shrink-0 flex items-center justify-between gap-2 px-1 pb-2">
        <span className="text-xs font-semibold text-sumi-600 truncate">
          {isT1 ? '① えに あう ことば さがし' : '② 3 つの ことば さがし'}
        </span>
        <span className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-semibold text-shu-700 tabular-nums">{isT1 ? t1 : t2} こ</span>
          <CountDown left={left} total={MIM_TEST_SECONDS}/>
        </span>
      </div>
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4">
        {isT1 ? (
          <SpellQuestion key={idx} item={item} onAnswer={c => answer1(c, item)}/>
        ) : (
          <ChunkQuestion key={idx} chunk={item} onDone={answer2}/>
        )}
      </div>
    </div>
  );
}

/* ちからだめしの のびを 折れ線で 見せる（まえの じぶんとの くらべ） */
function MimHistoryChart({ log }) {
  const data = (log || []).slice(-8);
  if (data.length === 0) return null;
  const w = 280, h = 84, pad = 10;
  const max = Math.max(20, ...data.map(d => d.total));
  const pts = data.map((d, i) => {
    const x = data.length === 1 ? w / 2 : pad + (i * (w - pad * 2)) / (data.length - 1);
    const y = h - pad - ((d.total / max) * (h - pad * 2));
    return { x, y, d };
  });
  return (
    <div className="kkm-sheet rounded-lg p-3">
      <div className="text-xs font-semibold text-sumi-600 mb-1 text-left">ちからだめしの のび</div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="ちからだめしの てんすうの うつりかわり">
        <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#ded8cd" strokeWidth="1.5"/>
        {pts.length > 1 && (
          <polyline fill="none" stroke="var(--kkm-shu)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"
            points={pts.map(p => `${p.x},${p.y}`).join(' ')}/>
        )}
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="#fff" stroke="var(--kkm-shu)" strokeWidth="2.5"/>
            <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="10" fill="#5c554c" fontWeight="600">{p.d.total}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   18.5. マス（原稿用紙）で 見せる しくみ

   このアプリの あたらしい 主役。「おと」と「マス」の 関係を、
   どの画面でも おなじ 見た目で 見せる。
     ・1 もじ ＝ 1 マス（ちいさい っ ゃゅょ も かならず 1 マス）
     ・おと（拍）の くぎりは マスの したに 朱色の 弧で 見せる
   ══════════════════════════════════════════════════════════════ */

/* もじ 1 つぶんの マス。ちいさい字には うっすら「ちいさく かく」めやすを出す。 */
function KanaCell({ char, size = 56, state = 'plain', onClick, ariaLabel }) {
  // state: plain（ふつう）/ blank（あな）/ target（いま こたえる あな）/ ok / ng / hint
  const styles = {
    plain:  'bg-white border-sumi-300 text-sumi-800',
    blank:  'bg-washi-100 border-dashed border-sumi-300 text-sumi-600',
    target: 'bg-shu-50 border-dashed border-shu-500 text-shu-700 kkm-pulse-ring',
    ok:     'bg-midori-50 border-midori-500 text-midori-700',
    ng:     'bg-shu-50 border-shu-500 text-shu-700',
    hint:   'bg-yamabuki-50 border-yamabuki-400 text-yamabuki-700',
  };
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag onClick={onClick} aria-label={ariaLabel}
      className={`relative shrink-0 rounded-md border-2 flex items-center justify-center ${styles[state] || styles.plain} ${onClick ? 'kkm-btn' : ''}`}
      style={{ width: size, height: size }}>
      {/* 原稿用紙の 十字の めやす */}
      <span aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <span className="absolute top-1/2 left-1 right-1 border-t border-dashed border-sumi-200"/>
        <span className="absolute left-1/2 top-1 bottom-1 border-l border-dashed border-sumi-200"/>
      </span>
      {/* ちいさい字（っ ゃ ゅ ょ）の めじるし。

          もとは かどに 漢字で「小」と 出していた。1年生には 読めないうえに、
          9px では ふりがなも ふれない。かなで「ちいさい」と 書く手も あるが、
          マスの 中で 字と かさなって しまう。

          そこで **ことばを つかわずに** 見せる。1年生の ノートと おなじ、
          マスを 4 つに わった 右下の へやを 朱色の 点線で かこむ。
          「ちいさい じは この へやに 書く」が 形で わかる。
          字より さきに 置いて、字の うしろに 敷く。
          へやの 大きさは `SmallKanaRoom` に まとめてある（§3.45）。 */}
      {isSmallKana(char) && <SmallKanaRoom/>}
      {/* ちいさい字は **へやの 中**に 出す（§3.46）。
          書体は ちいさい字を まん中に 置くので、そのまま ならべると
          点線の へやが 空のまま 字だけ 外に 出て、この アプリが
          教えている「みぎしたの へやに 書く」と 食いちがっていた。
          測れない ブラウザでは これまでどおり まん中に 出す。 */}
      {char
        ? (isSmallKana(char)
            ? <SmallKanaGlyph char={char} size={size}/>
            : <span className="kkm-glyph relative leading-none" style={{ fontSize: size * 0.62 }}>{char}</span>)
        : <span className="relative leading-none font-semibold" style={{ fontSize: size * 0.4 }}>?</span>}
    </Tag>
  );
}

/* ══════════════════════════════════════════════════════════════
   18.55. <WriteCell> ── マス 1 つぶんの かきとり

   とくべつな おとの もんだいの 中で、**ことばの 中の ただしい マス**に
   ちいさい っ や ゃゅょ を じっさいに 書かせる。
   「よんで えらぶ」だけでは、書けるように なったかは わからない。

   ⚠️ `PracticeBoard`（§14）は つかわない・つかえない。
      あちらは なぞり／自力の きりかえ、かきじゅんの きびしい チェック、
      合格したら 進みぐあいを 進めて つぎの 字へ 送る… という
      「かく」画面ぜんたいの しくみを かかえた 750 行の 部品で、
      もんだい 1 もんの 中に 置くには 大きすぎ、しかも 進みぐあいや
      日課の かぞえに 二重に ひびく。

   ⚠️ 入力の しょり（ポインタの とらえ・手のひらの ごにゅうりょく よけ・
      rAF での まとめ描き・DPR）は `PracticeBoard` から **写して** いる。
      共通の 部品に まとめるのが 本すじだが、それは アプリで いちばん
      よく つかう 画面の 入力経路を 実機なしで 書きかえる ことに なる。
      ここでは 写しで 進め、**まとめるのは べつの 変更**で 行う。
      （直すときは 両方を 直すこと。むこうは §14 の doStart / doMove / doEnd）
   ══════════════════════════════════════════════════════════════ */
function WriteCell({ char, onStrokes, showGuide = false, resetKey = 0, style }) {
  const boxRef = useRef(null);
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastRef = useRef({ x: 0, y: 0 });
  const curRef = useRef([]);                  // いま 書いている 画の 点（0..1）
  const strokesRef = useRef([]);              // 書きおわった 画
  const activeIdRef = useRef(null);
  const sawPenRef = useRef(false);
  const pendingRef = useRef([]);
  const rafRef = useRef(0);
  const [strokeCount, setStrokeCount] = useState(0);
  const paths = useMemo(() => kanaPathsOf(char), [char]);

  /* 大きさは **入れものに あわせる**（DPR は 2 まで。それ以上は おそくなるだけ）。
     はじめは 決めうちの 64px だったが、1年生の ゆびでは 小さすぎて
     書けなかった。画面の はばと たかさから きめて、大きく とる。 */
  const fit = useCallback(() => {
    const c = canvasRef.current, box = boxRef.current;
    if (!c || !box) return;
    const cssSize = Math.max(48, Math.round(box.clientWidth));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const px = Math.round(cssSize * dpr);
    if (c.width !== px || c.height !== px) { c.width = px; c.height = px; return true; }
    return false;
  }, []);

  const redraw = useCallback(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d'); const s = c.width;
    ctx.clearRect(0, 0, s, s);
    // うすい お手本（「かきじゅんを みる」を 押したときだけ）
    if (showGuide && paths) {
      ctx.save();
      ctx.scale(s / 109, s / 109);
      ctx.strokeStyle = themeColor('--kkm-guide', '#e5ded0');
      ctx.lineWidth = KVG_STROKE_W; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const d of paths) drawKvgStroke(ctx, d);
      ctx.restore();
    }
    // 書いた 線
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineWidth = s * 0.09;
    ctx.strokeStyle = themeColor('--kkm-sumi', '#2e2a25');
    for (const st of strokesRef.current) {
      const pts = st.points || [];
      if (pts.length < 2) continue;
      ctx.beginPath(); ctx.moveTo(pts[0].x * s, pts[0].y * s);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x * s, pts[i].y * s);
      ctx.stroke();
    }
  }, [showGuide, paths]);

  useEffect(() => { fit(); redraw(); }, [fit, redraw]);
  // 画面の むき が かわっても マスの 大きさを 追わせる
  useEffect(() => {
    const box = boxRef.current;
    if (!box || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => { fit(); redraw(); });
    ro.observe(box);
    return () => ro.disconnect();
  }, [fit, redraw]);
  // 「けす」や つぎの もんだいで まっさらに もどす
  useEffect(() => {
    strokesRef.current = []; curRef.current = []; setStrokeCount(0);
    fit(); redraw();
    // eslint-disable-next-line
  }, [resetKey, char]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const toXY = (clientX, clientY) => {
      const r = canvas.getBoundingClientRect();
      return { x: (clientX - r.left) / r.width, y: (clientY - r.top) / r.height };
    };
    const flush = () => {
      rafRef.current = 0;
      const pts = pendingRef.current; pendingRef.current = [];
      if (!drawingRef.current || pts.length === 0) return;
      const c = canvasRef.current; if (!c) return;
      const ctx = c.getContext('2d'); const s = c.width;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.lineWidth = s * 0.09;
      ctx.strokeStyle = themeColor('--kkm-sumi', '#2e2a25');
      for (const raw of pts) {
        const p = toXY(raw.x, raw.y);
        curRef.current.push(p);
        ctx.beginPath();
        ctx.moveTo(lastRef.current.x * s, lastRef.current.y * s);
        ctx.lineTo(p.x * s, p.y * s);
        ctx.stroke();
        lastRef.current = p;
      }
    };
    const schedule = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(flush); };

    function onDown(e) {
      if (e.pointerType === 'touch' && sawPenRef.current) return;   // 手のひら よけ
      if (e.pointerType === 'pen') sawPenRef.current = true;
      if (activeIdRef.current !== null) return;
      activeIdRef.current = e.pointerId;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault();
      initAudio();
      const p = toXY(e.clientX, e.clientY);
      drawingRef.current = true;
      lastRef.current = p;
      curRef.current = [p];
      hapticTick();
    }
    function onMove(e) {
      if (activeIdRef.current !== e.pointerId) return;
      const evs = (typeof e.getCoalescedEvents === 'function' && e.getCoalescedEvents().length > 0)
        ? e.getCoalescedEvents() : [e];
      for (const ev of evs) pendingRef.current.push({ x: ev.clientX, y: ev.clientY });
      e.preventDefault();
      schedule();
    }
    function onUp(e) {
      if (activeIdRef.current !== e.pointerId) return;
      activeIdRef.current = null;
      try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}
      flush();
      e.preventDefault();
      if (!drawingRef.current) return;
      drawingRef.current = false;
      // ちょんと さわっただけ（点が みじかすぎる）は 1 画に かぞえない
      const pts = curRef.current || [];
      let span = 0;
      for (let i = 1; i < pts.length; i++) span += Math.hypot(pts[i].x - pts[i-1].x, pts[i].y - pts[i-1].y);
      if (pts.length >= 2 && span > 0.02) {
        strokesRef.current.push({ points: pts });
        setStrokeCount(n => n + 1);
        onStrokes && onStrokes(strokesRef.current);
      }
      curRef.current = [];
    }
    function onCancel(e) {
      if (activeIdRef.current !== e.pointerId) return;
      activeIdRef.current = null; pendingRef.current = [];
      drawingRef.current = false; curRef.current = [];
    }
    const block = (e) => { if (drawingRef.current) e.preventDefault(); };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onCancel);
    canvas.addEventListener('touchmove', block, { passive: false });
    return () => {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onCancel);
      canvas.removeEventListener('touchmove', block);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0; pendingRef.current = [];
    };
    // eslint-disable-next-line
  }, [onStrokes]);

  return (
    <div ref={boxRef} className="relative shrink-0 aspect-square rounded-lg border-4 border-dashed border-shu-400 bg-white"
      style={style}>
      {/* 原稿用紙の 十字と、ちいさい字の へや（KanaCell と おなじ めじるし） */}
      <span aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <span className="absolute top-1/2 left-2 right-2 border-t-2 border-dashed border-sumi-200"/>
        <span className="absolute left-1/2 top-2 bottom-2 border-l-2 border-dashed border-sumi-200"/>
        {/* へやの 大きさは 「かく」画面・マス表示と おなじ（§3.45） */}
        {isSmallKana(char) && <SmallKanaRoom tone="border-shu-400" fill/>}
      </span>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full rounded-lg"
        style={{ touchAction: 'none' }}
        aria-label={`${char} を かく ところ（いま ${strokeCount} かく）`}/>
    </div>
  );
}

/* ことばを マスに ならべて 見せる。あな（blanks）は こたえる ところ。 */
function WordCells({ word, size = 56, blanks = [], filled = {}, activeBlank = -1, judged = null, showMora = false, activeMora = -1, onTapCell }) {
  const cells = splitCells(word);
  const moraNum = splitMora(word).length;
  return (
    <div className="inline-flex flex-col items-center gap-1">
      <div className="flex gap-1.5 flex-wrap justify-center">
        {cells.map((c, i) => {
          const isBlank = blanks.includes(i);
          const put = filled[i];
          let state = 'plain', shown = c;
          if (isBlank) {
            if (judged) { state = put === c ? 'ok' : 'ng'; shown = put || c; }
            else if (put) { state = 'hint'; shown = put; }
            else { state = (i === activeBlank) ? 'target' : 'blank'; shown = ''; }
          }
          return <KanaCell key={i} char={shown} size={size} state={state}
                    onClick={onTapCell ? () => onTapCell(i) : undefined}
                    ariaLabel={isBlank ? `${i+1}ばんめ の あな` : `${i+1}ばんめ ${c}`}/>;
        })}
      </div>
      {/* MIM の 視覚化：おと（拍）を ● で 見せる。
          小さい ○ は「音を出さない」ところ（つまる おと）。 */}
      {showMora && <MimDots word={word} cellSize={size} gap={6} activeMora={activeMora} className="mt-0.5"/>}
      {showMora && (
        <div className="text-[11px] md:text-xs font-semibold text-shu-700 tabular-nums">
          おと {moraNum} つ ・ マス {cells.length} つ
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   18.6. もんだいの かたち（アプリじゅうで 1 つだけ）

   よむ・とくべつな おと・ふくしゅう は、ぜんぶ この 1 つの
   もんだいカードで 出す。子どもは 画面が かわっても まよわない。

   もんだい（question）の かたち：
     kind 'choice' … えらぶ（ことば・もじ・え）
     kind 'cells'  … マスの あなを うめる
     kind 'count'  … おとの かずを こたえる
   ══════════════════════════════════════════════════════════════ */
const COUNT_CHOICES = [1, 2, 3, 4, 5, 6];
// えらぶ かずの ならべかた。Tailwind に 拾わせるため、class 名は べた書きする。
const COUNT_GRID = { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' };

function QuestionCard({ q, onAnswer, voiceOn, support = null, combo = 0 }) {
  const [filled, setFilled] = useState({});
  const [judged, setJudged] = useState(null);   // { correct, chosen }
  const answeredRef = useRef(false);
  /* MIM の 動作化を「こたえる まえ」に 見せる ステージ（3rd）で、
     リズムを 見おわったかどうか。見おわるまで えらぶ ふだを 出さない。 */
  const [rhythmSeen, setRhythmSeen] = useState(false);
  // かきとりの もんだい用
  const [writeGuide, setWriteGuide] = useState(false);   // お手本を すかして 出しているか
  const [writeReset, setWriteReset] = useState(0);       // 「けす」を 押した かず
  const [writeTries, setWriteTries] = useState(0);       // 「できた」を 押した かず
  const [writeMsg, setWriteMsg] = useState(null);        // 直しかたの ひとこと
  const writeStrokesRef = useRef([]);

  useEffect(() => {
    setFilled({}); setJudged(null); answeredRef.current = false; setRhythmSeen(false);
    setWriteGuide(false); setWriteReset(0); setWriteTries(0); setWriteMsg(null);
    writeStrokesRef.current = [];
  }, [q.uid]);

  /* `rhythm` は 'before'（こたえる まえ）／'after'（こたえた あと）／'none'。
     むかしの true / false も うけとる（true＝'after'）。 */
  const rhythmMode = support?.rhythm === true ? 'after'
    : support?.rhythm === false ? 'none'
    : (support?.rhythm || 'none');
  /* 動作化に つかう ことば。`q.word`（画面に マスで 出す ことば）とは
     分けて もつ。「ただしい かきかたは どっち？」の もんだいには
     `q.word` が ない（あったら こたえが 見えて しまう）が、
     リズムは その ことばで 見せたい。 */
  const rhythmWord = q.rhythmWord || q.word;
  // いま かきとりの もんだいを といている ところか
  const writing = q.kind === 'write' && !judged;
  /* かきとりでは リズムを 先に 出さない。
     リズムの ふだ＋ことば＋大きい マス＋3 つの ボタンを たてに ならべると
     画面から はみ出して、いちばん 大事な 書く ところが つぶれる。
     手を うごかす こと じたいが この もんだいの ねらいでも ある。 */
  const rhythmFirst = rhythmMode === 'before' && !!rhythmWord && !judged && !writing;

  /* もしもの ときの 逃げ道。リズムの 知らせが 来なくても、
     しばらくしたら かならず ふだを 出す（画面が 止まったままに ならない）。 */
  useEffect(() => {
    if (!rhythmFirst || rhythmSeen) return;
    const t = setTimeout(() => setRhythmSeen(true), 9000);
    return () => clearTimeout(t);
  }, [rhythmFirst, rhythmSeen, q.uid]);

  /* 耳の もんだいが いま 成りたつか。
     出題を つくる ときに 音の 有無は 見ている（§17.9 `usable`）が、
     **もんだいの とちゅうで 音を きる**ことが できる（ヘッダの ボタン）。
     その ときに とけない札が のこらないよう、ここでも 見て
     字や えを 出して 別の もんだいに 変える。 */
  const audioOk = !!voiceOn && ttsAvailable();
  const listening = !!q.say && audioOk;
  const lead = listening || !q.leadNoAudio ? q.lead : q.leadNoAudio;
  const ask  = listening || !q.askNoAudio  ? q.ask  : q.askNoAudio;

  // よみあげ（つかえる 端末だけ。なくても もんだいは とける）
  useEffect(() => {
    if (q.say && voiceOn) { const t = setTimeout(() => speakText(q.say, voiceOn), 250); return () => clearTimeout(t); }
  }, [q.uid, q.say, voiceOn]);

  const blanks = q.blanks || [];
  const activeBlank = blanks.find(i => !filled[i]);
  /* 「ちいさい／おおきい」の めやす。
     ちいさい字が えらべる ときだけ 出す … のは いいのだが、これを
     つねに 出すと **大小が といの ものずばりの もんだいでは こたえを
     教えて しまう**（「っ と つ、どっち？」に「ちいさい」と 書いてある）。
     手あつい ステージ（2nd・3rd）の 足場としては 要るので、
     `support.sizeHint` で 出し分ける。1st ステージでは 出さない。 */
  const showSizeHint = !!support?.sizeHint
    && !!(q.choices && q.choices.some(c => isSmallKana(c.label)));

  function finish(correct, chosen) {
    if (answeredRef.current) return;
    answeredRef.current = true;
    setJudged({ correct, chosen });
    if (correct) { playPingPong(combo); hapticOk(); }
    else { playBuzzer(); hapticErr(); }
    if (voiceOn && q.answerSay) setTimeout(() => speakText(q.answerSay, voiceOn), 350);
    // えらんだ ものも いっしょに わたす。まちがえた ときの 中身は
    // 学習ログの `item.wrong` になり、先生が つまずきの 中身を たどれる（§2.10）
    onAnswer(correct, chosen);
  }

  function tapChoice(v) {
    if (judged) return;
    if (q.kind === 'cells') {
      if (activeBlank === undefined) return;
      const next = { ...filled, [activeBlank]: v };
      setFilled(next);
      const rest = blanks.find(i => !next[i]);
      if (rest === undefined) {
        const cells = splitCells(q.word);
        finish(blanks.every(i => next[i] === cells[i]), next);
      }
    } else if (q.kind === 'count') {
      finish(v === q.answer, v);
    } else {
      finish(v === q.answer, v);
    }
  }
  /* かきとりの 判定。
     えらぶ もんだいと ちがい **やり直しが ある**ので、`tries` と
     「お手本を 見たか」を 数えて そのまま 学習ログに わたす。
     ここが この アプリで はじめて `firstTry` が ほんとうの 意味を もつ 場所。
     3 かい 目は かならず 先へ 進める（1年生を ここで 止めない）。 */
  function finishWrite() {
    if (judged) return;
    const tries = writeTries + 1;
    setWriteTries(tries);
    const r = scoreSpecialWrite(writeStrokesRef.current, kanaPathsOf(q.writeChar), q.writeChar);
    const ok = !!(r && r.ok);
    if (ok || tries >= 3) {
      finish(ok, { tries, hint: writeGuide, reason: r && r.reason ? r.reason : undefined });
      return;
    }
    // まだ やり直せる。どこを 直すかを 出して、書いた線は のこす
    playBuzzer(); hapticErr();
    setWriteMsg(SPECIAL_WRITE_ADVICE[(r && r.reason) || 'shape'] || SPECIAL_WRITE_ADVICE.shape);
  }

  function undo() {
    if (judged) return;
    const done = blanks.filter(i => filled[i]);
    if (done.length === 0) return;
    const last = done[done.length - 1];
    const next = { ...filled }; delete next[last];
    setFilled(next);
  }

  return (
    <div key={q.uid} className="kkm-view-in flex-1 min-h-0 flex flex-col items-center justify-center gap-3 md:gap-4 px-1">
      {/* せいかいの えんしゅつ（花丸が どんと 出る） */}
      {judged?.correct && <CorrectFx seed={q.uid}/>}

      {/* といかけ。1年生は ここを 読んでから 手が うごく。いちばん 大きく。 */}
      <div className="text-center shrink-0">
        <div className="text-sm font-semibold text-shu-700">{lead}</div>
        <div className="text-xl md:text-2xl font-semibold text-sumi-800 mt-1 leading-snug">{ask}</div>
      </div>

      {/* もう いちど きく。
          耳の もんだいなのに **聞きなおす 手だてが 1 つも なかった**。
          1 かい 聞きのがしたら あてずっぽうに なるので かならず 置く。 */}
      {listening && q.replay && !judged && (
        <button onClick={() => speakText(q.replay, voiceOn)}
          className="kkm-btn kkm-ripple shrink-0 px-5 py-2.5 rounded-full bg-ai-600 text-white border-2 border-ai-700 font-semibold text-base flex items-center gap-2 min-h-[48px]">
          <IconVolume size={20}/> もう いちど きく
        </button>
      )}

      {/* もんだいの ほんたい */}
      <div className={`shrink-0 flex flex-col items-center gap-2 ${judged && !judged.correct ? 'kkm-wobble' : ''}`}>
        {/* `listenPict` は 音が つかえなく なったときだけ 出す 逃げ道の え。
            音が 出ている あいだに 出したら こたえが 見えて しまう。 */}
        {/* かきとりの ときは さしえを 出さない。ことばは すぐ下の マスに
            出ているので わかるし、そのぶん 書く ところを 大きく できる。 */}
        {!writing && (q.pict || (!listening && q.listenPict)) && (
          <div className="flex items-center justify-center w-24 h-24 md:w-28 md:h-28 rounded-xl bg-washi-100 border-2 border-sumi-200 text-sumi-700">
            <Pict name={q.pict || q.listenPict} size={64}/>
          </div>
        )}
        {q.glyph && (
          <div className="flex items-center justify-center w-28 h-28 md:w-32 md:h-32 rounded-xl bg-white border-4 border-shu-400 shadow-sm">
            <span className="kkm-glyph text-6xl md:text-7xl text-shu-700 leading-none">{q.glyph}</span>
          </div>
        )}
        {q.sentence && (
          <div className="kkm-glyph text-xl md:text-3xl text-sumi-800 text-center leading-relaxed px-2">
            {q.sentence.split('◯').map((part, i) => (
              <React.Fragment key={i}>
                {part}
                {i === 0 && (
                  <span className={`inline-flex items-center justify-center align-middle mx-1 w-12 h-12 md:w-14 md:h-14 rounded-lg border-4 ${
                    judged ? (judged.correct ? 'border-midori-500 bg-midori-50 text-midori-700' : 'border-shu-500 bg-shu-50 text-shu-700')
                           : 'border-dashed border-shu-500 bg-shu-50 text-shu-700'
                  }`}>
                    {judged ? q.answer : '？'}
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
        {/* 耳の もんだいでは、こたえるまで 字を ふせる。
            字が 見えていると 拍では なく **マスを かぞえて** しまい、
            「おと と マスは ちがう」という この単元の かなめの 逆に なる。 */}
        {q.word && !(q.hideWord && listening && !judged) && (
          <WordCells word={q.word}
            /* かきとりでは、書く マスを あけて 見せる（どこに 書くかの 目じるし）。 */
            blanks={writing ? [q.writeAt] : blanks}
            filled={writing ? {} : filled}
            activeBlank={writing ? q.writeAt : (activeBlank === undefined ? -1 : activeBlank)}
            judged={judged}
            /* MIM：2nd・3rd ステージでは ドットを つねに 出しておく。
               1st ステージでは こたえあわせの ときだけ 出す。 */
            showMora={!!support?.dots || (!!judged && q.kind === 'count')}
            /* かきとりの ときは 下の 大きい マスが 主役。ことばは
               「どこに 書くか」を 見せる ための わき役なので 小さくする。 */
            size={writing ? 40 : (splitCells(q.word).length > 5 ? 46 : 64)}/>
        )}

        {/* かきとりの マス。
            はじめは ことばの マスの 1 つを キャンバスに 入れかえていたが、
            それでは 一辺 64px しか なく **1年生の ゆびでは 書けなかった**
            （「かく」画面は スマホで 360px とっている・6c80a56）。
            ことばは 上に 小さく のこして「どこに 書くか」を 見せ、
            書く ところは 下に 大きく とる。紙の れんしゅうちょうと おなじ ならび。 */}
        {writing && (
          <div className="flex flex-col items-center gap-1">
            {/* ⚠️ `kkm-nudge` と `rotate-90` を おなじ タグに つけない。
                アニメの keyframes が transform を まるごと 置きかえるので
                回転が 消えて、下むきの はずの やじるしが よこを むく。
                ゆれ（外）と 回転（内）で タグを 分ける。 */}
            <span className="kkm-nudge text-shu-600 leading-none">
              <span className="block rotate-90"><IconArrow size={22}/></span>
            </span>
            <WriteCell char={q.writeChar} showGuide={writeGuide} resetKey={writeReset}
              onStrokes={(s) => { writeStrokesRef.current = s; }}
              style={{ width: 'min(70vw, 34vh, 300px)' }}/>
          </div>
        )}
        {/* MIM の 動作化。
            3rd ステージは **こたえる まえ** に 見せる（`'before'`）。
            指導の あつさの せつめい（MIM_TIER_INFO・§1.86）が
            「まず 動作化を 見せてから といてもらう」と 言っているのに、
            これまでは こたえた あとにしか 出ていなかった。文言に 合わせる。
            2nd までは これまでどおり こたえあわせの あと（`'after'`）。 */}
        {rhythmFirst && (
          <div className="kkm-sheet rounded-lg p-2 md:p-3 kkm-pop-in border-2 border-shu-300">
            <div className="text-sm font-semibold text-shu-700 text-center mb-1">まず リズムを みてね</div>
            {/* 字は ふせる。「どっち？」の こたえが 見えて しまうため。 */}
            <RhythmPlayer word={rhythmWord} cellSize={38} autoPlay voiceOn={voiceOn}
              showCells={false} onDone={() => setRhythmSeen(true)}/>
          </div>
        )}
        {rhythmMode === 'after' && judged && rhythmWord && (
          <div className="kkm-sheet rounded-lg p-2 md:p-3 kkm-pop-in">
            <RhythmPlayer word={rhythmWord} cellSize={38} autoPlay voiceOn={voiceOn} compact/>
          </div>
        )}
        {/* くっつきの ことばは 文の もんだいで `q.word` が ない。
            ドットも リズムも `q.word` を 見て 出しているので、この単元だけ
            手あつい ステージでも 足場が 1 つも 付かなかった。
            この単元の かなめは 拍では なく「よみ と かき の ずれ」なので、
            そこを ことばで 見せる。 */}
        {!!support?.dots && q.joshiHint && !judged && (
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {JOSHI_PAIRS.map(([w, r]) => (
              <span key={w} className="flex items-center gap-1 px-2 py-1 rounded-md bg-washi-100 border border-sumi-200">
                <span className="kkm-glyph text-lg leading-none text-shu-700">{w}</span>
                <span className="text-xs font-semibold text-sumi-500">→</span>
                <span className="kkm-glyph text-lg leading-none text-sumi-700">{r}</span>
                <span className="text-[11px] font-semibold text-sumi-600">と よむ</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* こたえの えらびかた。
          指でも まちがえないよう、えらぶ ボタンは 大きく（さいてい 92px）、
          字も 大きく する。押した ときは カードが 沈む。 */}
      {!judged && rhythmFirst && !rhythmSeen && (
        <div className="shrink-0 text-base font-semibold text-sumi-600">てを うごかして みよう…</div>
      )}
      {/* かきとり：けす／かきじゅんを みる／できた */}
      {!judged && q.kind === 'write' && (
        <div className="shrink-0 flex flex-col items-center gap-2 w-full max-w-xl">
          {writeMsg && (
            <div className="w-full rounded-lg border-2 border-yamabuki-400 bg-yamabuki-50 px-3 py-2 text-center text-base font-semibold text-yamabuki-700 kkm-pop-in">
              {writeMsg}
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={() => { setWriteReset(n => n + 1); setWriteMsg(null); writeStrokesRef.current = []; }}
              className="kkm-btn px-4 py-2.5 rounded-lg bg-white border-2 border-sumi-300 text-base font-semibold text-sumi-600 flex items-center gap-2 min-h-[48px]">
              <IconRotate size={18}/> けす
            </button>
            <button onClick={() => setWriteGuide(g => !g)} aria-pressed={writeGuide}
              className={`kkm-btn px-4 py-2.5 rounded-lg border-2 text-base font-semibold flex items-center gap-2 min-h-[48px] ${
                writeGuide ? 'bg-ai-50 border-ai-400 text-ai-700' : 'bg-white border-sumi-300 text-sumi-600'
              }`}>
              <IconBulb size={18}/> おてほん
            </button>
          </div>
          <button onClick={finishWrite} style={{ '--kkm-shadow-color': TONE_DEEP.shu }}
            className="kkm-btn kkm-ripple kkm-primary w-full max-w-xs px-8 bg-shu-600 text-white font-semibold border-2 border-shu-700">
            できた！
          </button>
        </div>
      )}

      {!judged && q.kind !== 'write' && !(rhythmFirst && !rhythmSeen) && (
        <div className={`shrink-0 w-full max-w-xl grid gap-2.5 ${
          /* かずは 6 つ ならべる ときだけ 3×2。しぼった ときは
             そのまま 1 れつに ならべる（すきまが あくと 押しにくい）。
             ※ class 名は かならず ここに 書ききる。`grid-cols-${n}` のように
                組みたてると Tailwind が 拾えず、ならびが こわれる。 */
          q.kind === 'count' ? (COUNT_GRID[(q.countChoices || COUNT_CHOICES).length] || 'grid-cols-3 md:grid-cols-6')
          : q.choiceLayout === 'word' ? 'grid-cols-2'
          : q.choices.length <= 2 ? 'grid-cols-2'
          : q.choices.length === 3 ? 'grid-cols-3'
          : 'grid-cols-4'
        }`}>
          {q.kind === 'count'
            ? (q.countChoices || COUNT_CHOICES).map((n, i) => (
                <button key={n} onClick={() => tapChoice(n)}
                  style={{ '--kkm-i': i, '--kkm-shadow-color': '#ded8cd' }}
                  className="kkm-btn kkm-ripple kkm-solid kkm-stagger aspect-square md:aspect-auto md:py-5 rounded-xl bg-white border-2 border-sumi-300 hover:border-shu-400 text-3xl font-semibold text-sumi-800 tabular-nums">
                  {n}
                </button>
              ))
            : q.choices.map((c, i) => (
                <button key={i} onClick={() => tapChoice(c.value)}
                  style={{ '--kkm-i': i, '--kkm-shadow-color': '#ded8cd' }}
                  className="kkm-btn kkm-ripple kkm-solid kkm-stagger rounded-xl bg-white border-2 border-sumi-300 hover:border-shu-400 flex flex-col items-center justify-center gap-1 p-2 min-h-[92px]">
                  {c.pict && <Pict name={c.pict} size={38}/>}
                  <span className={`kkm-glyph leading-none text-sumi-800 ${c.pict ? 'text-lg' : 'text-4xl md:text-5xl'}`}>{c.label}</span>
                  {/* ちいさい字と おおきい字は 形が おなじで 大きさだけ ちがう。
                      見た目だけでは まよいやすいので、ことばでも 言いきる。 */}
                  {showSizeHint && !c.pict && c.label.length === 1 && (isSmallKana(c.label) || KANA_SMALL_BIG_REV[c.label]) && (
                    <span className={`text-xs font-semibold leading-none ${isSmallKana(c.label) ? 'text-shu-600' : 'text-sumi-600'}`}>
                      {isSmallKana(c.label) ? 'ちいさい' : 'おおきい'}
                    </span>
                  )}
                </button>
              ))}
        </div>
      )}

      {/* あなを 1 つ もどす */}
      {!judged && q.kind === 'cells' && blanks.length > 1 && Object.keys(filled).length > 0 && (
        <button onClick={undo}
          className="kkm-btn shrink-0 px-4 py-2.5 rounded-lg bg-white border-2 border-sumi-300 text-base font-semibold text-sumi-600 flex items-center gap-2 min-h-[48px]">
          <IconRotate size={18}/> ひとつ もどす
        </button>
      )}

      {/* こたえあわせ。
          「あたった／ちがった」が 字を 読まなくても わかるよう、
          色・大きな しるし・ひとことの 順に 目に 入る ならびにする。 */}
      {judged && (
        <div className={`shrink-0 w-full max-w-xl rounded-xl border-4 p-4 text-center kkm-pop-in ${
          judged.correct ? 'bg-midori-50 border-midori-400' : 'bg-shu-50 border-shu-400'
        }`}>
          <div className="flex items-center justify-center gap-3">
            {judged.correct
              ? <span className="text-shu-600"><Hanamaru size={44} draw/></span>
              : <span className="text-shu-600"><IconX size={36}/></span>}
            <span className={`text-2xl font-semibold ${judged.correct ? 'text-midori-700' : 'text-shu-700'}`}>
              {judged.correct ? 'せいかい！' : 'おしい！'}
            </span>
          </div>
          {!judged.correct && q.answerText && (
            <div className="mt-2 text-lg font-semibold text-sumi-800">
              こたえは <span className="kkm-glyph text-2xl text-shu-700">{q.answerText}</span>
            </div>
          )}
          {q.why && <div className="mt-1.5 text-base font-medium text-sumi-700 leading-snug">{q.why}</div>}
        </div>
      )}
    </div>
  );
}

/* もんだいを ならべて 出す「れんしゅう 1 セット」。
   おわると 花丸の せいせきが 出て、まちがえた ものは あしたの
   ふくしゅうに もどる（SRS）。 */
function QuizRunner({ title, tone = 'shu', questions, voiceOn, onAnswered, onFinish, onQuit, support = null }) {
  const [idx, setIdx] = useState(0);
  const [okCount, setOkCount] = useState(0);
  const [done, setDone] = useState(false);
  const [wrongs, setWrongs] = useState([]);
  // れんぞく せいかい（コンボ）。2 つ つづいたら ふだを 出して、
  // 「つづけて あてたい」を つくる。まちがえたら 0 に もどる。
  const [combo, setCombo] = useState(0);
  const t = TONES[tone] || TONES.shu;
  const q = questions[idx];
  // この もんだいを 出した 時刻。学習ログの `item.ms`（設問ごとの 解答時間）に つかう。
  // 「正解だが 20 びょう かかった＝まだ 定着していない」を つかまえる ための 値。
  const askedAtRef = useRef(Date.now());
  useEffect(() => { askedAtRef.current = Date.now(); }, [idx]);

  const handleAnswer = useCallback((correct, chosen) => {
    if (correct) { setOkCount(c => c + 1); setCombo(c => c + 1); }
    else { setWrongs(w => [...w, questions[idx]]); setCombo(0); }
    onAnswered && onAnswered(questions[idx], correct, Date.now() - askedAtRef.current, chosen);
    const last = idx + 1 >= questions.length;
    /* こたえあわせの あとに リズム（動作化）を 見せる ステージ（2nd）では、
       それを 見おわるまで つぎへ すすまない。3rd は リズムを **まえ**に
       見せるので、こたえた あとは ふつうの はやさで よい。 */
    const afterRhythm = support?.rhythm === 'after' || support?.rhythm === true;
    const wait = questions[idx].wait
      ?? (afterRhythm ? (correct ? 4200 : 5200) : (correct ? 1100 : 2200));
    setTimeout(() => {
      if (last) { setDone(true); playFanfare(); burstConfetti(); }
      else setIdx(i => i + 1);
    }, wait);
  }, [idx, questions, onAnswered, support]);

  useEffect(() => {
    if (!done) return;
    hapticTriumph();
    onFinish && onFinish(okCount, questions.length);
    // eslint-disable-next-line
  }, [done]);

  if (!questions || questions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center kkm-view-in">
        <MascotFace size={70} mood="happy"/>
        <div className="text-xl font-semibold text-sumi-700">いまは もんだいが ないよ</div>
        <div className="text-base font-medium text-sumi-600">もじを かく れんしゅうを すると、もんだいが ふえるよ</div>
        <button onClick={onQuit} style={{ '--kkm-shadow-color': TONE_DEEP.shu }}
          className="kkm-btn kkm-ripple kkm-primary mt-2 px-8 bg-shu-600 text-white font-semibold border-2 border-shu-700">
          もどる
        </button>
      </div>
    );
  }

  if (done) {
    const pct = Math.round((okCount / questions.length) * 100);
    const perfect = okCount === questions.length;
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-5 text-center kkm-view-in overflow-y-auto">
        <span className={`kkm-stamp w-28 h-28 rounded-xl border-4 flex items-center justify-center ${t.solid} text-white shrink-0`}>
          {perfect ? <Hanamaru size={68} color="#fff" draw/> : <span className="text-4xl font-semibold tabular-nums">{pct}</span>}
        </span>
        <div className="text-2xl font-semibold text-sumi-800">
          {perfect ? 'ぜんもん せいかい！' : `${questions.length}もん ちゅう ${okCount}もん せいかい`}
        </div>
        <Mascot mood={perfect ? 'wow' : 'cheer'}
          message={perfect ? 'かんぺき！ すごいね' : wrongs.length > 0 ? 'まちがえた ところは あした もういちど でるよ' : 'よく がんばりました'}/>
        {wrongs.length > 0 && (
          <div className="w-full max-w-md rounded-xl border-2 border-shu-300 bg-shu-50 p-3">
            <div className="text-base font-semibold text-shu-700 mb-2">もういちど みておこう</div>
            <div className="flex flex-wrap justify-center gap-2">
              {wrongs.map((w, i) => (
                <span key={i} className="kkm-glyph px-2.5 py-1.5 rounded-lg bg-white border-2 border-shu-300 text-sumi-800 text-xl">
                  {w.answerText || w.word || w.answer}
                </span>
              ))}
            </div>
          </div>
        )}
        <button onClick={onQuit} style={{ '--kkm-shadow-color': TONE_DEEP.shu }}
          className="kkm-btn kkm-ripple kkm-primary mt-1 px-10 bg-shu-600 text-white font-semibold border-2 border-shu-700 shrink-0">
          おわる
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* すすみぐあい。
          「あと なんもん か」が ひとめで わかるよう、といた ぶんは
          花丸の 玉で うめていく（帯の 数字より 数えやすい）。 */}
      <div className="shrink-0 flex items-center gap-2.5 px-1 pb-2.5">
        <button onClick={onQuit} aria-label="やめる"
          className="kkm-btn w-12 h-12 shrink-0 rounded-xl bg-white border-2 border-sumi-300 text-sumi-600 flex items-center justify-center">
          <IconX size={22}/>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-base font-semibold text-sumi-700 mb-1.5">
            <span className="truncate">{title}</span>
            <span className="tabular-nums shrink-0 text-lg">{idx + 1} / {questions.length}</span>
          </div>
          <div className="flex gap-1" aria-hidden="true">
            {questions.map((_, i) => (
              <span key={i} className={`h-2.5 flex-1 rounded-full transition-colors duration-300 ${
                i < idx ? 'bg-shu-500' : i === idx ? 'bg-shu-300' : 'bg-washi-300'
              }`}/>
            ))}
          </div>
        </div>
        {/* れんぞく せいかいの ふだ */}
        {combo >= 2 ? (
          <span key={combo}
            className="kkm-combo-in shrink-0 flex items-center gap-1 px-2.5 h-12 rounded-xl bg-yamabuki-50 border-2 border-yamabuki-300 text-yamabuki-700 text-base font-semibold tabular-nums">
            <IconStar size={18}/>{combo}<span className="hidden sm:inline">れんぞく</span>
          </span>
        ) : (
          <span className="shrink-0 flex items-center gap-1 px-2.5 h-12 rounded-xl bg-white border-2 border-shu-200 text-shu-700 text-lg font-semibold tabular-nums">
            <Hanamaru size={20}/>{okCount}
          </span>
        )}
      </div>
      <QuestionCard q={q} onAnswer={handleAnswer} voiceOn={voiceOn} support={support} combo={combo}/>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   18.7. もんだいを つくる（出題エンジン）

   ここが「なにを 出すか」を きめる ゆいいつの 場所。
   ・まだ ならっていない ものは 出さない
   ・ふくしゅうの きげんが きた ものを 先に 出す
   ・まちがえた ものは つぎの 日に かならず 出る
   ══════════════════════════════════════════════════════════════ */
let __quizUid = 0;
function nextUid() { return ++__quizUid; }

/* ① あたまの おと：「あ」から はじまる ことばは どれ？ */
function makeHeadSoundQuestion(char) {
  const mine = headWordsOf(char);
  if (mine.length === 0) return null;
  const target = mine[Math.floor(Math.random() * mine.length)];
  const others = [];
  // まちがい候補は おなじ なかま（ひらがな どうし／カタカナ どうし）から えらぶ
  const pool = shuffled(headWordCharsOf(scriptOf(char)).filter(c => c !== char));
  for (const c of pool) {
    if (others.length >= 3) break;
    const list = headWordsOf(c);
    if (list.length === 0) continue;
    const cand = list[Math.floor(Math.random() * list.length)];
    if (cand.p === target.p) continue;                       // 同じ さしえは まぎらわしい
    if (others.some(o => o.p === cand.p)) continue;
    others.push(cand);
  }
  if (others.length < 3) return null;
  return {
    uid: nextUid(), id: srsIdRead(char), kind: 'choice', choiceLayout: 'word',
    lead: 'あたまの おと', ask: `「${char}」から はじまる ことばは どれ？`,
    glyph: char,
    choices: shuffled([target, ...others]).map(w => ({ value: w.w, label: w.w, pict: w.p })),
    answer: target.w, answerText: target.w, answerSay: target.w,
    why: `${target.w} は「${char}」から はじまるね`,
  };
}

/* ② ことばの なかの もじ：にた かたちの もじと 見わける */
function makeCellQuestion(wordObj, blankIdx, char, extraChoices, lead, ask, why, srsId) {
  const wrong = (extraChoices && extraChoices.length > 0) ? extraChoices : confusablesOf(char);
  const fillerSrc = scriptOf(char) === 'katakana' ? 'アイウエオカキクケコ' : 'あいうえおかきくけこ';
  const filler = fillerSrc.split('').filter(c => c !== char);
  const choices = [char];
  for (const c of wrong) if (choices.length < 4 && !choices.includes(c)) choices.push(c);
  for (const c of shuffled(filler)) if (choices.length < 4 && !choices.includes(c)) choices.push(c);
  return {
    uid: nextUid(), id: srsId, kind: 'cells',
    lead, ask, pict: wordObj.p, word: wordObj.w, blanks: [blankIdx],
    choices: shuffled(choices).map(c => ({ value: c, label: c })),
    answer: char, answerText: wordObj.w, answerSay: wordObj.w, why,
  };
}
function makeWordCharQuestion(char) {
  const mine = headWordsOf(char);
  const conf = confusablesOf(char);
  // にた かたちの もじが ある字は「ことばの なかで 見わける」もんだいにする
  const list = mine.length > 0 ? mine : null;
  if (!list) return null;
  const w = list[Math.floor(Math.random() * list.length)];
  return makeCellQuestion(w, 0, char, conf,
    'ことばの はじめ', 'あいた マスに はいる もじは どれ？',
    conf.length > 0 ? `「${char}」と「${conf[0]}」は にているね。よく みくらべよう` : `${w.w} の はじめは「${char}」`,
    srsIdRead(char));
}
/* ③ にたもの さがし：ことばの まんなかで 見わける */
function makeConfuseQuestion(char) {
  const conf = confusablesOf(char);
  if (conf.length === 0) return null;
  // その字を ふくむ ことばを さがす（おなじ なかまの ことばだけ）
  const all = bankOf(scriptOf(char));
  const hits = all.filter(x => x.w.indexOf(char) > 0);
  const w = hits.length > 0 ? hits[Math.floor(Math.random() * hits.length)] : null;
  if (!w) return null;
  return makeCellQuestion(w, w.w.indexOf(char), char, conf,
    'にた もじ さがし', 'あいた マスに はいる もじは どれ？',
    `「${char}」と「${conf.join('」「')}」は かたちが にているよ`,
    srsIdConfuse(char));
}

/* ④ とくべつな おと：どっちが ただしい かきかた？ */
function makeSpellingQuestion(unit, wordObj, maxChoices = 3) {
  // MIM の 2nd・3rd ステージでは えらぶ かずを へらして、
  // 「ちがいは どこか」だけに 気もちを 向けられるようにする。
  const bads = (wordObj.bad || []).slice(0, Math.max(1, maxChoices - 1));
  if (bads.length === 0) return null;
  return {
    uid: nextUid(), id: srsIdSpecial(unit.key, wordObj.w), kind: 'choice', choiceLayout: 'word',
    lead: unit.title, ask: 'ただしい かきかたは どっち？',
    pict: wordObj.p, rhythmWord: wordObj.w,
    choices: shuffled([wordObj.w, ...bads]).map(w => ({ value: w, label: w })),
    answer: wordObj.w, answerText: wordObj.w, answerSay: wordObj.w,
    why: whyFor(unit, wordObj),
  };
}
/* ⑤ とくべつな おと：マスに いれよう */
function makeFillQuestion(unit, wordObj, maxChoices = 4, blanks = 1) {
  const cells = splitCells(wordObj.w);
  // マスが 2 つしか ない ことば（ぱん・ぞう）で 2 つ 抜くと 手がかりが
  // 残らない。ことばの 長さに 合わせて 穴の かずを おさえる。
  const want = Math.max(1, Math.min(blanks, cells.length - 1));
  const idx = specialBlanksFor(wordObj.w, unit.key, want);
  const correct = cells[idx[0]];
  /* えらぶ ふだは 穴ごとに 分けず、ぜんぶの 穴で 1 まとまりに する。
     どのマスに どれが 入るかを じぶんで きめる ことに 意味が あるので、
     穴ごとに ふだを 分けたら ただの 2 かいの 3択に なって しまう。 */
  const pool = [];
  idx.forEach(i => cellChoicesFor(cells[i], unit.key, wordObj, i).forEach(c => {
    if (!pool.includes(c)) pool.push(c);
  }));
  // こたえの 字は かならず のこす。まちがい候補だけを けずる。
  const answers = idx.map(i => cells[i]);
  const limit = Math.max(answers.length + 1, Math.max(2, maxChoices));
  const choices = pool.filter(c => answers.includes(c))
    .concat(pool.filter(c => !answers.includes(c))).slice(0, limit);
  return {
    uid: nextUid(), id: srsIdSpecial(unit.key, wordObj.w), kind: 'cells',
    lead: unit.title,
    ask: idx.length > 1 ? 'あいた マスを うめよう' : 'あいた マスに はいる もじは どれ？',
    pict: wordObj.p, word: wordObj.w, rhythmWord: wordObj.w, blanks: idx,
    choices: shuffled(choices).map(c => ({ value: c, label: c })),
    answer: correct, answerText: wordObj.w, answerSay: wordObj.w,
    why: whyFor(unit, wordObj),
  };
}
/* ⑥ とくべつな おと：おとは いくつ？（手を たたく かず） */
function makeCountQuestion(unit, wordObj, maxChoices = 6) {
  return {
    uid: nextUid(), id: srsIdSpecial(unit.key, wordObj.w), kind: 'count',
    lead: 'てを たたこう', ask: 'この ことばの おとは いくつ？',
    pict: wordObj.p, word: wordObj.w, rhythmWord: wordObj.w,
    answer: moraCount(wordObj.w), answerText: String(moraCount(wordObj.w)), answerSay: wordObj.w,
    countChoices: countChoicesFor(wordObj.w, maxChoices),
    why: whyFor(unit, wordObj),
  };
}
/* ⑥b とくべつな おと：きいて、おとの かずを こたえる

   これまで とくべつな おとの もんだいは、**こたえる まえに 一度も
   ことばを 読みあげて いなかった**（`q.say` を だれも つけていない）。
   耳で きいた おとを かみに 書く ところが つまずきの 中心（§1.5）
   なのに、耳を つかう 場めんが 出題に 1 つも 無かった。

   ここは 字を ふせて 音だけ 出す。字が 見えていると 拍では なく
   **マスを かぞえて** しまい、この単元が 教えたい ことの 逆に なる。 */
function makeListenCountQuestion(unit, wordObj) {
  return {
    ...makeCountQuestion(unit, wordObj, 4), uid: nextUid(),
    lead: 'よく きいてね', ask: 'きこえた ことばの おとは いくつ？',
    say: wordObj.w, replay: wordObj.w, hideWord: true,
    // 音が とちゅうで つかえなく なったら、字を 出して ふつうの 拍の もんだいに もどす
    leadNoAudio: 'てを たたこう', askNoAudio: 'この ことばの おとは いくつ？',
  };
}

/* ⑥c とくべつな おと：きいて、どちらの ことばか えらぶ

   「ねこ」と「ねっこ」を 音で 聞きわける。促音・濁音・拗音は
   **音が ちがう** ので これが なりたつ。
   のばす おと（おとうさん／おとおさん）と くっつきの ことば（は／わ）は
   **音が おなじ** なので、耳では ぜったいに きめられない。
   この 2 つの 単元には 出さない（`hear` を 持たせない）。 */
function makeListenPairQuestion(unit, wordObj) {
  const pair = (wordObj.hear || [])[0];
  if (!pair) return null;
  // どちらを 鳴らすかは 毎回 かえる。かたほうに 決めると
  // 「っ の ほうを えらぶ」を おぼえて しまう。
  const target = Math.random() < 0.5 ? { w: wordObj.w, p: wordObj.p } : pair;
  const other  = target.w === wordObj.w ? pair : { w: wordObj.w, p: wordObj.p };
  const m = splitMora(target.w);
  return {
    uid: nextUid(), id: srsIdSpecial(unit.key, wordObj.w), kind: 'choice', choiceLayout: 'word',
    lead: 'よく きいてね', ask: 'きこえた ことばは どっち？',
    say: target.w, replay: target.w,
    /* 音が とちゅうで つかえなく なったときの 逃げ道。
       `listenPict` は **音が つかえる あいだは 出さない**（出したら
       こたえが 見えて しまう）。音が 消えて はじめて 出し、
       「えに あう ことばは どっち？」に なる。とけない札は 出さない。 */
    listenPict: target.p,
    leadNoAudio: 'えを みてね', askNoAudio: 'えに あう ことばは どっち？',
    choices: shuffled([target, other]).map(x => ({ value: x.w, label: x.w })),
    answer: target.w, answerText: target.w, answerSay: target.w,
    rhythmWord: target.w,
    why: `${m.join('・')} で おとは ${m.length}つ`,
  };
}

/* ⑥d とくべつな おと：ことばの 中の ただしい マスに **じっさいに 書く**

   ここまでの かたちは ぜんぶ「よんで えらぶ」だった。えらべる ように
   なった ことと、書ける ように なった ことは べつ（README §2 の 4 つの ちから）。
   「が□こう」の □ に ちいさい っ を 書いて はじめて、大きさも いちも
   じぶんで きめた ことに なる。

   ・書く 字は その単元の おと（`specialCellsOf` の さいしょ）。
   ・かきじゅんデータの ない 字は 出さない（`fits` で 見る）。 */
function makeWriteQuestion(unit, wordObj) {
  const cells = splitCells(wordObj.w);
  const at = specialCellsOf(wordObj.w, unit.key)[0];
  const target = cells[at];
  if (!target || !kanaPathsOf(target)) return null;
  return {
    uid: nextUid(), id: srsIdSpecial(unit.key, wordObj.w), kind: 'write',
    lead: 'かいて みよう', ask: `あいた マスに 「${target}」を かこう`,
    pict: wordObj.p, word: wordObj.w, writeAt: at, writeChar: target,
    answer: target, answerText: wordObj.w, answerSay: wordObj.w,
    rhythmWord: wordObj.w,
    why: isSmallKana(target)
      ? `ちいさい「${target}」は マスの みぎしたに、ちいさく かくよ`
      : whyFor(unit, wordObj),
    // 書く もんだいは こたえあわせを 読む 時間が いる
    wait: 3600,
  };
}

/* ⑦ くっつきの ことば（は・へ・を）は 文で 出す */
function makeJoshiQuestion(unit, sentObj) {
  return {
    uid: nextUid(), id: srsIdSpecial(unit.key, sentObj.s), kind: 'choice',
    lead: unit.title, ask: 'あいた ところに はいる もじは？',
    pict: sentObj.p, sentence: sentObj.s, joshiHint: true,
    choices: shuffled(sentObj.c).map(c => ({ value: c, label: c })),
    answer: sentObj.a, answerText: sentObj.a,
    answerSay: sentObj.s.replace('◯', sentObj.a),
    // こたえが わ・え・お の 文（`plain`）は「くっつきの ことばでは ない」ことが
    // こたえあわせ なので、文ごとの `why` を さきに 出す。
    why: sentObj.why || JOSHI_WHY[sentObj.a] || unit.rule,
  };
}

/* ⑧ なかまの ことば：「たべものは どれ？」

   教科書の「なかまの ことば」。もじが 読めるように なっても、
   ことばの いみが なかまで つながっていないと 文が 読めない。

   まちがい選択肢は 1 つの なかまから 1 語ずつ、しかも その なかまと
   かさなる なかま（どうぶつ ↔ とり）を のぞいて えらぶ。こたえが
   2 つに なる もんだいを 出さないための しかけ。 */
function makeGroupQuestion(groupKey, script) {
  const g = WORD_GROUP_MAP[groupKey];
  if (!g || !g.quiz) return null;
  const bank = bankOf(script);
  const mine = bank.filter(x => x.g === groupKey);
  if (mine.length === 0) return null;
  const target = mine[Math.floor(Math.random() * mine.length)];
  const skip = new Set([groupKey, ...(g.avoid || [])]);
  const pool = shuffled(bank.filter(x => {
    const og = WORD_GROUP_MAP[x.g];
    // 絵の ある／ない が こたえの ヒントに ならないよう、
    // さしえを 出す なかま どうし・出さない なかま どうしで まぜる
    return og && og.quiz && !skip.has(x.g) && !!og.text === !!g.text;
  }));
  const others = [];
  for (const c of pool) {
    if (others.length >= 3) break;
    if (others.some(o => o.g === c.g)) continue;                    // なかまは かぶらせない
    if (!g.text && (c.p === target.p || others.some(o => o.p === c.p))) continue;   // さしえも かぶらせない
    others.push(c);
  }
  if (others.length < 3) return null;
  return {
    uid: nextUid(), id: srsIdGroup(groupKey), kind: 'choice', choiceLayout: 'word',
    lead: 'なかまの ことば', ask: g.ask,
    choices: shuffled([target, ...others]).map(x => ({ value: x.w, label: x.w, pict: g.text ? null : x.p })),
    answer: target.w, answerText: target.w, answerSay: target.w,
    why: `${target.w} は「${g.title}」の なかま`,
  };
}

/* ⑨ はんたいの ことば：「おおきい ⇔ ちいさい」 */
function makeOppositeQuestion(word) {
  const ans = OPPOSITE_MAP[word];
  if (!ans) return null;
  const others = shuffled(OPPOSITE_WORDS.filter(w => w !== word && w !== ans)).slice(0, 3);
  if (others.length < 3) return null;
  return {
    uid: nextUid(), id: srsIdOpposite(word), kind: 'choice', choiceLayout: 'word',
    lead: 'はんたいの ことば', ask: `「${word}」の はんたいは どれ？`,
    choices: shuffled([ans, ...others]).map(w => ({ value: w, label: w })),
    answer: ans, answerText: ans, answerSay: ans,
    why: `${word} ⇔ ${ans}`,
  };
}

/* ══════════════════════════════════════════════════════════════
   17.9. とくべつな おとの 出題（かたちの 台帳）

   もとは かたちが 3 つ しか なく、`makers[i % 3](unit, pool[i % 語数])`
   の 総当たりで 出していた。これだと **ことばを しぼると もんだいも
   1 対 1 で しぼられる**。3rd ステージは 2 語 × 3 かたち＝じっさいには
   4 もん 中 2 語しか 出ず、「また おなじ もんだい」に なっていた。

   ねらい（README §2）は 「ことばを しぼって くりかえす」ことで、
   **おなじ もんだいを くりかえす ことでは ない**。
   そこで かたちを 台帳に して、ことばと 課題を きりはなす。
     ・1 セットの 中で おなじ（ことば × かたち）は 出さない
     ・つづけて おなじ ことばを 出さない
     ・つかえない かたち（音声が ない 端末の 聞きとりなど）は
       **えらぶ 前に** 外す ＝ 出題数が へらない

   `chance` は「まぐれで あたる 見こみ」。tier だけを 見て 正答率を
   ならべると 手あつい 指導の 児童ほど よく 見える 逆転が 起きるので
   （§18.9）、じっさいに 出した かたちの まざりを 学習ログに のこす。
   ══════════════════════════════════════════════════════════════ */
const SPECIAL_FORMATS = {
  spell: {
    // ことばぜんたいの 見わけ。まちがい選択肢は 人が 書いた `bad`。
    fits: (unit, w) => (w.bad || []).length > 0,
    make: (unit, w, p) => makeSpellingQuestion(unit, w, p.maxChoices),
    chance: (q) => 1 / Math.max(2, q.choices.length),
  },
  fill: {
    // マスの 中の 1 字。ちいさい字の 有無・いちを 見る。
    // 単元の おとが 入っていない ことば（`plain`）は 抜く マスが ないので 出さない。
    fits: (unit, w) => hasSpecialSound(w.w, unit.key),
    make: (unit, w, p) => makeFillQuestion(unit, w, p.maxChoices + 1, p.blanks || 1),
    // 穴が 2 つ なら、ふだの ならびから 2 つ えらぶ ことに なる（1/n × 1/n）
    chance: (q) => Math.pow(1 / Math.max(2, q.choices.length), (q.blanks || [0]).length),
  },
  count: {
    // 拍の 分解。いちばん 土台に なる 課題（README §2）。
    fits: () => true,
    // 1st は 1..6 のまま のこす（いちばん むずかしい 形）。手あつい ステージだけ しぼる。
    make: (unit, w, p) => makeCountQuestion(unit, w, p.maxChoices >= 3 ? 6 : 4),
    chance: (q) => 1 / (q.countChoices || COUNT_CHOICES).length,
  },
  listenCount: {
    // 耳で きいて 拍を かぞえる。字を ふせるので マスを かぞえられない。
    usable: (unit, o) => !!o.canListen,
    fits: () => true,
    make: (unit, w) => makeListenCountQuestion(unit, w),
    chance: (q) => 1 / (q.countChoices || COUNT_CHOICES).length,
  },
  listenPair: {
    // 最小対立ペア（ねこ／ねっこ）。音が ちがう 単元にだけ `hear` を もたせて ある。
    usable: (unit, o) => !!o.canListen,
    fits: (unit, w) => (w.hear || []).length > 0,
    make: (unit, w) => makeListenPairQuestion(unit, w),
    chance: () => 0.5,
  },
  write: {
    // ことばの 中の ただしい マスに じっさいに 書く。えらぶ もんだいと
    // ちがい、まぐれで あたる ことが ない（chance ≒ 0）。
    // 1 セットに 1 もんだけ（`buildSpecialQuestions` で かぞえる）。
    fits: (unit, w) => {
      if (!hasSpecialSound(w.w, unit.key)) return false;   // 単元の おとが ない ことばは 書く ものが ない
      const at = specialCellsOf(w.w, unit.key)[0];
      const c = splitCells(w.w)[at];
      return !!(c && kanaPathsOf(c));          // かきじゅんデータの ない 字は 出さない
    },
    make: (unit, w) => makeWriteQuestion(unit, w),
    chance: () => 0,
    max: 1,       // 1 セットに 1 もん。書くのは 時間が かかるので 5 ふんに おさめる
  },
  joshi: {
    // くっつきの ことばは 文でしか れんしゅうに ならないので、この単元 せんよう。
    fits: (unit, s) => !!s.s,
    make: (unit, s) => makeJoshiQuestion(unit, s),
    chance: (q) => 1 / Math.max(2, q.choices.length),
  },
};

// { spell:2, fill:2, count:1 } のように かぞえる（ログ用）
function countBy(list, keyFn) {
  const out = {};
  for (const x of list) { const k = keyFn(x); if (k) out[k] = (out[k] || 0) + 1; }
  return out;
}
// じっさいに 画面に ならんだ えらぶ かず（ログ用）
function actualChoiceCount(q) {
  if (q.kind === 'count') return (q.countChoices || COUNT_CHOICES).length;
  return (q.choices || []).length;
}
// この 1 セットの「まぐれで あたる 見こみ」の へいきん
function meanChance(qs) {
  const vals = qs.map(q => {
    const f = SPECIAL_FORMATS[q.format];
    if (f && f.chance) { try { return f.chance(q); } catch (e) {} }
    return 1 / Math.max(2, actualChoiceCount(q));
  });
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
}

/* ある ユニットの もんだいを つくる（ふくしゅう ゆうせん）。

   plan は MIM の ステージ（層）から きまる 指導の あつさ。
     count      … 何もん 出すか
     words      … 何この ことばを つかうか（少ないほど くりかえす）
     maxChoices … えらぶ かず（少ないほど やさしい）
     formats    … つかう もんだいの かたち
   ステージが 上がる（＝手あつくする）ほど、あつかう ことばを しぼって
   おなじ ものを くりかえす。これが MIM の 2nd・3rd ステージの 考えかた。
   ただし **くりかえすのは ことばで、もんだいでは ない**（上の 台帳）。 */
function buildSpecialQuestions(unitKey, n, skill, plan, opts = {}) {
  const unit = SPECIAL_UNIT_MAP[unitKey];
  if (!unit) return [];
  const p = plan || tierPlan(1);
  const count = n || p.count;

  // ことばの 単元と 文の 単元（くっつきの ことば）を おなじ しくみで あつかう
  const isSentence = !!(unit.sentences && unit.sentences.length);
  const items = isSentence ? unit.sentences : unit.words;
  if (!items || items.length === 0) return [];
  const keyOf = (x) => (isSentence ? x.s : x.w);

  // つかえる かたちを **さきに** きめる（あとから 落とすと 出題数が へる）
  const wanted = isSentence ? ['joshi'] : (p.formats || ['spell', 'fill', 'count']);
  const formats = wanted.filter(k => {
    const f = SPECIAL_FORMATS[k];
    return f && (!f.usable || f.usable(unit, opts));
  });
  if (formats.length === 0) return [];

  // ふくしゅうの きげんが きた ものを 先に（これまでどおり）
  const sorted = shuffled(items).sort((a, b) => {
    const da = srsIsDue(skill?.[srsIdSpecial(unit.key, keyOf(a))]) ? 0 : 1;
    const db = srsIsDue(skill?.[srsIdSpecial(unit.key, keyOf(b))]) ? 0 : 1;
    return da - db;
  });
  /* つかう ことばの かず。ステージで しぼる（`p.words`）が、
     **かたちが 1 つしか ない 単元では ことばが そのまま もんだいの かず**に
     なるので、`count ÷ かたちの かず` を 下まわらせない。
     くっつきの ことば（かたちは 文の 1 つだけ）で 3 語 4 もんに すると、
     かならず どれかの 文が 2 回 出て しまう。 */
  const need = Math.ceil(count / formats.length);
  const poolSize = Math.max(2, need, Math.min(sorted.length, p.words));
  const pool = sorted.slice(0, Math.min(sorted.length, poolSize));

  /* こたえの かたよりを なくす（§17.9）。
     ふだんの ことばは ぜんぶ「その単元の おとが 入っている」ので、
     もんだいを 読まずに **とくべつな 字が ある ほう**を えらぶだけで
     あたって しまう。単元の おとが **入らない** ことば（`plain`：
     ねこ・かば・おばさん、くっつきの ことばなら わ・え・お の 文）を
     台帳に 足して あるので、1 セットに かならず 両方を 入れる。 */
  const hasPlainItem = items.some(x => x.plain);
  if (hasPlainItem && pool.length >= 2) {
    [true, false].forEach(wantPlain => {
      if (pool.some(x => !!x.plain === wantPlain)) return;
      const add = sorted.find(x => !!x.plain === wantPlain);
      if (add) pool[pool.length - 1] = add;
    });
  }

  const used = new Set();          // 'ことば|かたち' … 1 セットに 1 回まで
  const out = [];
  let prevKey = null;
  const limit = pool.length * formats.length * 2 + 8;   // 空まわりの とめ木
  for (let guard = 0; out.length < count && guard < limit; guard++) {
    // ① つづけて おなじ ことばに ならないよう えらぶ（1 語しか ないときは のぞく）
    const cands = pool.filter(x => keyOf(x) !== prevKey || pool.length === 1);
    // ② まだ 出していない 組みあわせが のこっている ことばを ゆうせん
    //    （その ことばで つくれない かたちは かぞえない。`plain` の ことばは
    //     マス・かきとりが 出せないので、かぞえに 入れると いつまでも 先に えらばれる）
    const remain = (x) => formats.filter(f => !used.has(keyOf(x) + '|' + f)
      && SPECIAL_FORMATS[f].fits(unit, x, p)).length;
    const best = Math.max(...cands.map(remain));
    if (best === 0) { used.clear(); prevKey = null; continue; }   // ぜんぶ 出しきったら やりなおす
    const item = shuffled(cands.filter(x => remain(x) === best))[0];
    /* ③ その ことばで まだ 出していない かたちから 1 つ。
       ここで まったくの ランダムに すると、5 もん ぜんぶ「かきかたは
       どっち？」に なる セットが ふつうに 出る。1 セットの 中で
       見わけ・マス・拍 が そろうよう、**まだ 少ない かたちを 先に** とる。
       （拍の 分解は すべての 土台なので、セットから 消えては こまる） */
    const usedCount = countBy(out, q => q.format);
    const fs = shuffled(formats.filter(f => !used.has(keyOf(item) + '|' + f)
      && !((SPECIAL_FORMATS[f].max || Infinity) <= (usedCount[f] || 0))   // 1 セットの 上かぎり
      && SPECIAL_FORMATS[f].fits(unit, item, p)))
      .sort((a, b) => (usedCount[a] || 0) - (usedCount[b] || 0));
    let q = null, chosen = null;
    for (const f of fs) {
      q = SPECIAL_FORMATS[f].make(unit, item, p, opts);
      if (q) { chosen = f; break; }
      used.add(keyOf(item) + '|' + f);        // つくれない 組みあわせは 二度と ためさない
    }
    if (!q) { formats.forEach(f => used.add(keyOf(item) + '|' + f)); continue; }
    q.format = chosen;
    q.plainItem = !!item.plain;
    used.add(keyOf(item) + '|' + chosen);
    out.push(q);
    prevKey = keyOf(item);
  }

  /* 上の えらびかたは `plain` の ことばを 後まわしに する（つかえる
     かたちが 少ない ぶん `remain` が 小さい）。そのままだと 1 セットに
     0〜1 もんしか 入らず、「とくべつな 字が ある ほう」を えらぶだけで
     ほとんど あたって しまう。
     3 もんに 1 もんを めやすに、足りないぶんを さしかえる。
     さしかえる かたちは「ただしい かきかたは どっち？」を 先に する
     ―― こたえの かたよりが いちばん 出るのが この かたちだから。 */
  const plainWant = hasPlainItem ? Math.max(1, Math.round(count / 3)) : 0;
  if (plainWant > 0 && out.length >= 2) {
    let have = out.filter(q => q.plainItem).length;
    const slots = shuffled(out.map((q, i) => i).filter(i => !out[i].plainItem));
    for (const x of shuffled(items.filter(y => y.plain))) {
      if (have >= plainWant || slots.length === 0) break;
      const fs = shuffled(formats.filter(f => !used.has(keyOf(x) + '|' + f)
        && SPECIAL_FORMATS[f].fits(unit, x, p)))
        .sort((a, b) => (b === 'spell' ? 1 : 0) - (a === 'spell' ? 1 : 0));
      let made = null, madeFormat = null;
      for (const f of fs) {
        made = SPECIAL_FORMATS[f].make(unit, x, p, opts);
        if (made) { madeFormat = f; break; }
      }
      if (!made) continue;
      made.format = madeFormat;
      made.plainItem = true;
      used.add(keyOf(x) + '|' + madeFormat);
      out[slots.pop()] = made;
      have++;
    }
  }
  return out.slice(0, count);
}

/* よむ ちからの もんだいを n もん つくる。
   じぶんで 書いたことの ある もじ（なぞり以上）から 出す。 */
function readableChars(progress, kanaMode) {
  const list = kanaMode === 'katakana' ? KATA_LIST : HIRA_LIST;
  const learned = list.filter(c => getStage(progress, c) >= 1);
  // まだ 何も 書いていない子には、やさしい じゅんの さいしょの 10 文字を出す
  // （五十音の あたまから 出すと、いきなり むずかしい「あ」に なってしまう）
  return learned.length >= 4 ? learned : learnOrderOf(kanaMode).filter(c => list.includes(c)).slice(0, 10);
}
function buildReadQuestions(n, progress, skill, kanaMode) {
  const chars = readableChars(progress, kanaMode);
  const sorted = shuffled(chars).sort((a, b) => {
    const da = srsIsDue(skill?.[srsIdRead(a)]) ? 0 : 1;
    const db = srsIsDue(skill?.[srsIdRead(b)]) ? 0 : 1;
    return da - db;
  });
  const makers = [makeHeadSoundQuestion, makeWordCharQuestion, makeConfuseQuestion];
  const out = [];
  for (let i = 0; out.length < n && i < sorted.length * 3; i++) {
    const c = sorted[i % sorted.length];
    const q = makers[i % makers.length](c);
    if (q) out.push(q);
  }
  // 足りないぶんは あたまの おと で うめる
  for (let i = 0; out.length < n && i < sorted.length; i++) {
    const q = makeHeadSoundQuestion(sorted[i]);
    if (q) out.push(q);
  }
  return out.slice(0, n);
}

/* ことばの もんだいを n もん つくる（なかまの ことば／はんたいの ことば）。
   もじが 書けるか どうかとは 関係なく 出せるので、いつでも つかえる。
   ここも ふくしゅうの きげんが 来ている ものを 先に 出す。 */
function buildWordMeaningQuestions(n, skill, kanaMode) {
  const keys = shuffled(QUIZ_GROUPS.map(g => g.key)).sort((a, b) =>
    (srsIsDue(skill?.[srsIdGroup(a)]) ? 0 : 1) - (srsIsDue(skill?.[srsIdGroup(b)]) ? 0 : 1));
  const words = shuffled(OPPOSITE_WORDS).sort((a, b) =>
    (srsIsDue(skill?.[srsIdOpposite(a)]) ? 0 : 1) - (srsIsDue(skill?.[srsIdOpposite(b)]) ? 0 : 1));
  const out = [];
  for (let i = 0; out.length < n && i < keys.length + words.length; i++) {
    // なかま と はんたい を こうごに 出す
    const q = (i % 2 === 0)
      ? makeGroupQuestion(keys[Math.floor(i / 2) % keys.length], kanaMode)
      : makeOppositeQuestion(words[Math.floor(i / 2) % words.length]);
    if (q) out.push(q);
  }
  return out.slice(0, n);
}

/* ふくしゅう：きげんの きた ものを 種類を まぜて 出す */
function buildReviewQuestions(n, progress, skill, kanaMode) {
  const due = Object.keys(skill || {}).filter(id => srsIsDue(skill[id]));
  /* にがて（まちがえた まま はこ 0 の もの）を いちばん 先に。
     ホームの「にがてを やっつける」は ここへ 来るので、この なかに
     にがてが 入っていないと、押しても にがてが へらない。 */
  due.sort((a, b) => (srsIsWeak(skill[b]) ? 1 : 0) - (srsIsWeak(skill[a]) ? 1 : 0)
    || (skill[b].ng || 0) - (skill[a].ng || 0));
  const out = [];
  for (const id of due) {
    if (out.length >= n) break;
    const [kind, a, b] = id.split(':');
    let q = null;
    if (kind === 'r') q = Math.random() < 0.5 ? makeHeadSoundQuestion(a) : makeWordCharQuestion(a);
    else if (kind === 'c') q = makeConfuseQuestion(a);
    else if (kind === 'g') q = makeGroupQuestion(a, kanaMode);
    else if (kind === 'o') q = makeOppositeQuestion(a);
    else if (kind === 's') {
      const unit = SPECIAL_UNIT_MAP[a];
      if (unit) {
        if (unit.sentences) {
          const s = unit.sentences.find(x => x.s === b);
          if (s) q = makeJoshiQuestion(unit, s);
        } else {
          const w = unit.words.find(x => x.w === b);
          /* かたちは 台帳（`SPECIAL_FORMATS`）から えらぶ。
             3 つを 決めうちで まわしていたので、単元の おとが 入らない
             ことば（`plain`：ねこ・かば…）に「あいた マスに はいる もじは？」が
             出て しまって いた。`fits` を 見れば その ことばで なりたつ
             かたちだけに なる。 */
          const plan1 = tierPlan(1);
          if (w) {
            for (const f of shuffled(['spell', 'fill', 'count'].filter(k => SPECIAL_FORMATS[k].fits(unit, w, plan1)))) {
              q = SPECIAL_FORMATS[f].make(unit, w, plan1);
              if (q) break;
            }
          }
        }
      }
    }
    if (q) out.push(q);
  }
  // まだ足りなければ あたらしい もんだいを たす。
  // ことばの もんだい（なかま・はんたい）も かならず 1 つは まぜて、
  // 字だけでなく ことばの いみも ふくしゅうに 入るようにする。
  if (out.length < n) out.push(...buildWordMeaningQuestions(1, skill, kanaMode));
  if (out.length < n) out.push(...buildReadQuestions(n - out.length, progress, skill, kanaMode));
  if (out.length < n) out.push(...buildSpecialQuestions('hatsuon', n - out.length, skill));
  return shuffled(out).slice(0, n);
}

/* ══════════════════════════════════════════════════════════════
   18.8. <SoundView> ── よむ ちからを そだてる

   書けるだけでは 読めない。ここでは「もじ ↔ おと ↔ ことば」を
   むすびつける れんしゅうを する。にた かたちの もじの 見わけも ここ。
   ══════════════════════════════════════════════════════════════ */
const SOUND_COURSES = [
  { key:'head',    title:'あたまの おと',   sub:'この もじから はじまる ことばは？', tone:'ai',     icon:'star'  },
  { key:'inword',  title:'ことばの なかの もじ', sub:'あいた マスに はいる もじは？', tone:'midori', icon:'book'  },
  { key:'confuse', title:'にた もじ さがし', sub:'ぬ と め、シ と ツ を みわける',   tone:'fuji',   icon:'pencil'},
  { key:'group',   title:'なかまの ことば',  sub:'たべもの・どうぶつ・いろ で わける', tone:'midori', icon:'grid'  },
  { key:'opposite',title:'はんたいの ことば', sub:'おおきい ⇔ ちいさい',              tone:'ai',     icon:'rotate'},
  { key:'mix',     title:'ぜんぶ まぜて',    sub:'ふくしゅうも いっしょに',          tone:'shu',    icon:'check' },
];
function SoundView({ kanaMode, setKanaMode, progress, skill, answerSkill, bumpMission, voiceOn, initialCourse, onConsumeInitial }) {
  const [running, setRunning] = useState(null);   // { key, title, tone, questions }
  const dueCount = useMemo(() => countDue(skill, ''), [skill]);

  function start(course) {
    let qs = [];
    const chars = readableChars(progress, kanaMode);
    const sorted = shuffled(chars).sort((a, b) =>
      (srsIsDue(skill?.[srsIdRead(a)]) ? 0 : 1) - (srsIsDue(skill?.[srsIdRead(b)]) ? 0 : 1));
    if (course.key === 'head')    qs = sorted.map(makeHeadSoundQuestion).filter(Boolean).slice(0, 8);
    if (course.key === 'inword')  qs = sorted.map(makeWordCharQuestion).filter(Boolean).slice(0, 8);
    if (course.key === 'confuse') {
      const conf = shuffled(CONFUSABLE_SETS.filter(s => s.kana === kanaMode).flatMap(s => s.chars));
      qs = conf.map(makeConfuseQuestion).filter(Boolean).slice(0, 8);
      if (qs.length < 4) qs = qs.concat(sorted.map(makeWordCharQuestion).filter(Boolean).slice(0, 8 - qs.length));
    }
    if (course.key === 'group') {
      const keys = shuffled(QUIZ_GROUPS.map(g => g.key)).sort((a, b) =>
        (srsIsDue(skill?.[srsIdGroup(a)]) ? 0 : 1) - (srsIsDue(skill?.[srsIdGroup(b)]) ? 0 : 1));
      qs = keys.map(k => makeGroupQuestion(k, kanaMode)).filter(Boolean).slice(0, 8);
    }
    if (course.key === 'opposite') {
      const words = shuffled(OPPOSITE_WORDS).sort((a, b) =>
        (srsIsDue(skill?.[srsIdOpposite(a)]) ? 0 : 1) - (srsIsDue(skill?.[srsIdOpposite(b)]) ? 0 : 1));
      qs = words.map(makeOppositeQuestion).filter(Boolean).slice(0, 8);
    }
    if (course.key === 'mix')     qs = buildReviewQuestions(8, progress, skill, kanaMode);
    // 学習ログ：この コース 1 かいぶんが 1 レコード（§3.10.5）。
    // 「よむ」と「ことば」は たがいに 代わりが 利かない ちからなので、
    // `mode` を 分けて 出す（合算した 正答率を 主指標に しない・§3.7.1）。
    const meta = KANA_STUDY && KANA_STUDY.soundUnitOf(course.key);
    if (STUDY && meta) {
      STUDY.begin({ ...meta, count: qs.length,
        ext: { ability: meta.mode, kanaMode, ...studySkillExt(skill) } });
    }
    playPickup();
    setRunning({ ...course, questions: qs });
  }

  /* ホームの「ふくしゅう」「にがてを やっつける」から 来たときは、
     コースを えらぶ 画面を 見せずに その場で はじめる。
     もとは かならず 一覧に とまっていたので、「ふくしゅうを する」と
     きめて 押した 子が もう一度 えらばされ、しかも どれが ふくしゅうなのか
     （＝「ぜんぶ まぜて」）が 名前から わからなかった。 */
  const startRef = useRef(start);
  startRef.current = start;
  useEffect(() => {
    if (!initialCourse) return;
    onConsumeInitial && onConsumeInitial();
    const course = SOUND_COURSES.find(c => c.key === initialCourse);
    if (course) startRef.current(course);
  }, [initialCourse]);   // eslint-disable-line react-hooks/exhaustive-deps

  if (running) {
    return (
      <div className="flex-1 min-h-0 flex flex-col p-2 md:p-4 kkm-main-pad">
        <div className="kkm-sheet rounded-lg p-2 md:p-3 flex-1 min-h-0 flex flex-col">
          <QuizRunner title={running.title} tone={running.tone} questions={running.questions} voiceOn={voiceOn}
            onAnswered={(q, ok, ms, chosen) => {
              answerSkill(q.id, ok); bumpMission('review');
              // 1 もんは 1 かいしか こたえられないので、初回正答＝正答（§2.7）。
              // `q.id` は SRS の ID（`r:あ` / `g:animal` など）で、単元と同じく 不変。
              STUDY && STUDY.item({ q: q.id, ok, firstTry: ok, tries: 1, ms,
                wrong: ok ? undefined : chosen });
            }}
            onFinish={() => { if (STUDY) { STUDY.markCompleted(); STUDY.end('completed'); } }}
            onQuit={() => { STUDY && STUDY.end('aborted'); setRunning(null); }}/>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-3 md:p-4 kkm-main-pad kkm-view-in">
      <div className="max-w-3xl mx-auto flex flex-col gap-3 pb-4">
        {/* 見出しは 1 行だけ。長い せつめいは 1年生には 読まれない。 */}
        <div className="kkm-sheet rounded-xl p-3 flex items-center gap-3 border-l-4 border-l-shu-600">
          <MascotFace size={54} mood="cheer"/>
          <div className="min-w-0">
            <div className="text-xl font-semibold text-sumi-800">どれを やる？</div>
            <div className="text-base font-semibold text-sumi-600 mt-0.5">
              {dueCount > 0
                ? <span className="text-shu-700">ふくしゅうが {dueCount}こ まってるよ</span>
                : 'すきな れんしゅうを えらんでね'}
            </div>
          </div>
        </div>
        <KanaModeSwitch kanaMode={kanaMode} setKanaMode={setKanaMode}/>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 md:gap-3">
          {SOUND_COURSES.map((c, i) => {
            const t = TONES[c.tone];
            const Icon = ICONS[c.icon] || IconMaru;
            return (
              <button key={c.key} onClick={() => start(c)} style={{ '--kkm-i': i }}
                className={`kkm-btn kkm-lift kkm-sheet kkm-stagger rounded-xl p-4 text-left border-l-4 ${t.leftRule} flex items-center gap-3.5 min-h-[92px]`}>
                <span className={`shrink-0 w-14 h-14 rounded-xl border-2 flex items-center justify-center ${t.chip}`}>
                  <Icon size={28}/>
                </span>
                <span className="flex-1 min-w-0">
                  <span className={`block text-xl font-semibold leading-tight ${t.text}`}>{c.title}</span>
                  <span className="block text-base font-medium text-sumi-600 mt-1">{c.sub}</span>
                </span>
                <IconArrow size={26} className="shrink-0 text-sumi-600"/>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ひらがな／カタカナの 切りかえ（画面ごとに おなじ形で 出す） */
function KanaModeSwitch({ kanaMode, setKanaMode }) {
  const hira = kanaMode === 'hiragana';
  return (
    <div className="flex gap-2 shrink-0">
      <button onClick={() => setKanaMode('hiragana')} aria-pressed={hira}
        style={{ '--kkm-shadow-color': hira ? TONE_DEEP.shu : '#ded8cd' }}
        className={`kkm-btn kkm-ripple kkm-solid flex-1 font-semibold text-xl border-2 ${
          hira ? 'bg-shu-600 text-white border-shu-700' : 'bg-white text-sumi-600 border-sumi-300 hover:bg-washi-100'
        }`}>ひらがな</button>
      <button onClick={() => setKanaMode('katakana')} aria-pressed={!hira}
        style={{ '--kkm-shadow-color': !hira ? TONE_DEEP.ai : '#ded8cd' }}
        className={`kkm-btn kkm-ripple kkm-solid flex-1 font-semibold text-xl border-2 ${
          !hira ? 'bg-ai-600 text-white border-ai-700' : 'bg-white text-sumi-600 border-sumi-300 hover:bg-washi-100'
        }`}>カタカナ</button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   18.9. <SpecialView> ── とくべつな おと

   このアプリで いちばん 大事な 画面。
   っ・ゃゅょ・ん・のばす おと・てん まる・は へ を の 6 つを、
   「まなぶ → といてみる」の 2 だんかいで しっかり 身につける。
   ══════════════════════════════════════════════════════════════ */
/* 拗音（ねじれる おと）の いちらん表。
   「き＋ゃ」で 1 つの おとに なることを、表の形で いっぺんに つかむ。 */
const YOUON_BASE = ['き','し','ち','に','ひ','み','り','ぎ','じ','び','ぴ'];
const YOUON_SMALL = ['ゃ','ゅ','ょ'];
function YouonTable() {
  return (
    <div className="kkm-sheet rounded-lg p-3">
      <div className="text-xs font-semibold text-fuji-700 mb-2 flex items-center gap-1.5">
        <IconGrid size={15}/> ねじれる おとの いちらん（どれも おとは 1 つ）
      </div>
      <div className="overflow-x-auto">
        <div className="inline-grid gap-1" style={{ gridTemplateColumns: `repeat(${YOUON_SMALL.length}, minmax(0, 1fr))` }}>
          {YOUON_BASE.map(b => YOUON_SMALL.map(s => (
            <span key={b + s}
              className="kkm-glyph inline-flex items-center justify-center px-2 py-1.5 rounded-md bg-washi-100 border border-fuji-200 text-sumi-800 text-lg leading-none whitespace-nowrap">
              {b}{s}
            </span>
          )))}
        </div>
      </div>
      <div className="text-[11px] font-medium text-sumi-600 mt-2 leading-snug">
        カタカナも おなじ（キャ・キュ・キョ …）。マスは 2 つ、おとは 1 つ だよ。
      </div>
    </div>
  );
}

/* 「まなぶ」カード：この おとの きまりを ひとことで つたえる */
function UnitLesson({ unit, onStart, onBack, onWrite, voiceOn, tier = 1 }) {
  const t = TONES[unit.tone] || TONES.shu;
  const sample = unit.words[0] || (unit.sentences ? null : null);
  const tierInfo = MIM_TIER_INFO[tier] || MIM_TIER_INFO[1];
  // この単元で 手で 書けるように しておきたい 小さい字
  const writeChars = unit.key === 'sokuon' ? ['っ'] : unit.key === 'youon' ? ['ゃ','ゅ','ょ'] : [];
  /* 画面の 組みたて（ここが 大事）
     もとは「きまり → リズム → おぼえかた → 表 → かく → といてみる」を
     ぜんぶ たてに ならべていた。1年生の 画面では 3 スクロールぶんに なり、
     **いちばん 押してほしい「といて みる」が いつも 画面の 外**にあった。

     そこで
       ・上に のこすのは「きまり」と「リズム」の 2 つだけ
       ・そのほかは たたんで しまう（見たい 子だけ ひらく）
       ・「といて みる」は 画面の 下に はりつけて いつでも 押せる
     に あらためる。 */
  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-2xl mx-auto flex flex-col gap-3 p-1 pb-3">
          <div className="flex items-center gap-2.5">
            <button onClick={onBack} aria-label="もどる"
              className="kkm-btn w-12 h-12 shrink-0 rounded-xl bg-white border-2 border-sumi-300 text-sumi-600 flex items-center justify-center">
              <IconX size={22}/>
            </button>
            <SectionTitle>{unit.title}</SectionTitle>
          </div>

          {/* ① この おとの きまり（ひとこと） */}
          <div className={`kkm-sheet kkm-stagger rounded-xl p-4 border-l-4 ${t.leftRule} text-center`} style={{ '--kkm-i': 0 }}>
            <div className="kkm-glyph text-6xl md:text-7xl leading-none mb-2" style={{ color: 'var(--kkm-shu)' }}>{unit.mark}</div>
            <div className="text-lg md:text-xl font-semibold text-sumi-800 leading-snug">{unit.rule}</div>
          </div>

          {/* ② MIM の 中心：おとを ● で 見せて（視覚化）、
                 手の うごきで 体に 入れる（動作化）。 */}
          {sample && (
            <div className="kkm-sheet kkm-stagger rounded-xl p-3 flex flex-col items-center gap-3" style={{ '--kkm-i': 1 }}>
              <div className="text-base font-semibold text-sumi-700">おとを ● で みて、てで たしかめよう</div>
              <RhythmPlayer word={sample.w} cellSize={52} voiceOn={voiceOn}/>
            </div>
          )}

          {/* ③ ここから下は「もっと しりたい 子」むけ。ふだんは たたんでおく。 */}
          <div className="kkm-stagger flex flex-col gap-2.5" style={{ '--kkm-i': 2 }}>
            <Disclosure title="おぼえかた" tone={unit.tone} icon={<IconBulb size={20}/>}>
              <ul className="flex flex-col gap-2 px-1">
                {unit.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-base font-medium text-sumi-700">
                    <span className="shrink-0 mt-1 text-shu-600"><IconCheck size={18}/></span>
                    <span className="kkm-glyph">{tip}</span>
                  </li>
                ))}
              </ul>
              <div className="text-base font-medium text-sumi-600 leading-snug px-1">
                マスは 1 もじに 1 つ。ちいさい じも かならず 1 マス つかうよ。<br/>
                ちいさい ○ の ところは、くちを とじて おとを ださない ところ。
              </div>
              <RhythmLegend/>
            </Disclosure>

            {unit.key === 'youon' && (
              <Disclosure title="ねじれる おとの いちらん" tone="fuji" icon={<IconGrid size={20}/>}>
                <YouonTable/>
              </Disclosure>
            )}

            {writeChars.length > 0 && onWrite && (
              <Disclosure title="この ちいさい じを かいて みる" tone="fuji" icon={<IconPen size={20}/>}>
                <div className="flex gap-2">
                  {writeChars.map(c => (
                    <button key={c} onClick={() => onWrite(c)} style={{ '--kkm-shadow-color': TONE_DEEP.fuji }}
                      className="kkm-btn kkm-ripple kkm-solid flex-1 bg-white border-2 border-fuji-300 text-fuji-700 font-semibold flex items-center justify-center gap-2">
                      <span className="kkm-glyph text-3xl leading-none">{c}</span>
                      <IconPen size={20}/>
                    </button>
                  ))}
                </div>
              </Disclosure>
            )}

            {tier > 1 && (
              <div className={`rounded-xl border-2 p-3 text-base font-medium leading-snug ${TONES[tierInfo.tone].chip}`}>
                {tierInfo.desc}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ④ いちばん 押してほしい ボタンは、スクロールしても いつも 見える
             ところに 置く（画面の 下に はりつける）。 */}
      <div className="shrink-0 pt-2 pb-1.5 max-w-2xl w-full mx-auto">
        <button onClick={onStart} style={{ '--kkm-shadow-color': TONE_DEEP.shu }}
          className="kkm-btn kkm-ripple kkm-primary w-full bg-shu-600 text-white font-semibold border-2 border-shu-700 flex items-center justify-center gap-2.5">
          <IconPlay size={26}/> といて みる（{tierPlan(tier).count} もん）
        </button>
      </div>
    </div>
  );
}

function SpecialView({ skill, answerSkill, bumpMission, voiceOn, initialUnit, onConsumeInitial, onGoWrite, tier = 1 }) {
  const [openUnit, setOpenUnit] = useState(null);   // ユニットの key
  const [running, setRunning] = useState(null);
  // MIM：ちからだめしの けっかから きまる「指導の あつさ」
  const plan = useMemo(() => tierPlan(tier), [tier]);

  useEffect(() => {
    if (initialUnit) { setOpenUnit(initialUnit); onConsumeInitial && onConsumeInitial(); }
    // eslint-disable-next-line
  }, [initialUnit]);

  function startUnit(key) {
    /* この 端末で 耳の もんだいを 出せるか。**出題を つくる まえに** きめる。
       あとから 落とすと もんだいの かずが へって しまう（§17.9）。 */
    const canListen = voiceOn && ttsAvailable();
    const qs = buildSpecialQuestions(key, plan.count, skill, plan, { canListen });
    // 学習ログ：ユニット 1 かいぶんが 1 レコード。
    // **`ext.tier` を かならず 記録する**（§3.10.3）。えらぶ かずが 3→2 に へれば
    // あてずっぽうの 正答率が 33%→50% に 上がるため、tier を 見ずに 正答率を
    // ならべると **手あつい 指導を うけている 児童ほど 成績が よく 見える** 逆転が 起きる。
    // …ところが **tier だけでは 足りない**。えらぶ かずは じっさいには
    // ことばの `bad` の かずでも かわるし、もんだいの かたちが まざれば
    // 1 セットの まぐれ率は tier から 引けなく なる。じっさいに 出した
    // 中身（かたちの まざり・えらぶ かず・まぐれの 見こみ）を そえておく。
    const meta = KANA_STUDY && KANA_STUDY.specialUnitOf(key);
    if (STUDY && meta) {
      STUDY.begin({ ...meta, count: qs.length,
        ext: { ability: 'special', unitKey: key, tier,
               formats: countBy(qs, q => q.format),
               choiceN: qs.map(actualChoiceCount),
               chance: Math.round(meanChance(qs) * 1000) / 1000,
               // 日本語の こえが ある 端末か。耳の もんだいが 出たか どうかが
               // 変わるので、これを 見ずに 正答率を ならべては いけない。
               audio: canListen,
               ...studySkillExt(skill) } });
    }
    playPickup();
    setRunning({ key, questions: qs });
  }

  if (running) {
    const unit = SPECIAL_UNIT_MAP[running.key];
    return (
      <div className="flex-1 min-h-0 flex flex-col p-2 md:p-4 kkm-main-pad">
        <div className="kkm-sheet rounded-lg p-2 md:p-3 flex-1 min-h-0 flex flex-col">
          <QuizRunner title={unit.title} tone={unit.tone} questions={running.questions} voiceOn={voiceOn}
            support={{ dots: plan.dots, rhythm: plan.rhythm, sizeHint: plan.sizeHint }}
            onAnswered={(q, ok, ms, chosen) => {
              answerSkill(q.id, ok); bumpMission('special');
              /* えらぶ もんだいは 1 もん 1 かいなので 初回正答＝正答。
                 かきとりだけは **やり直しと お手本** が あるので、
                 `chosen` に そのぶんが 入って くる。ヒントを 見て
                 合格した 回を 初回正答に すると、支援を 多く うけた
                 児童ほど 成績が よく 見える 逆転が 起きる（§2.10）ので、
                 お手本を 見た 回は `firstTry` から 外す。 */
              const d = (chosen && typeof chosen === 'object' && 'tries' in chosen) ? chosen : null;
              STUDY && STUDY.item({
                q: q.id, ok,
                firstTry: d ? (ok && d.tries === 1 && !d.hint) : ok,
                tries: d ? d.tries : 1,
                hint: d ? !!d.hint : undefined,
                ms,
                // かきとりの まちがいは「どこを 直すか」（big / place / shape / strokes）。
                // どの ふだを 押したかより 先生には 役に立つ。
                wrong: ok ? undefined : (d ? d.reason : chosen),
              });
            }}
            onFinish={() => { if (STUDY) { STUDY.markCompleted(); STUDY.end('completed'); } }}
            onQuit={() => { STUDY && STUDY.end('aborted'); setRunning(null); setOpenUnit(null); }}/>
        </div>
      </div>
    );
  }

  if (openUnit) {
    const unit = SPECIAL_UNIT_MAP[openUnit];
    return (
      <div className="flex-1 min-h-0 flex flex-col p-2 md:p-4 kkm-main-pad">
        <UnitLesson unit={unit} onStart={() => startUnit(openUnit)} onBack={() => setOpenUnit(null)}
          onWrite={onGoWrite} voiceOn={voiceOn} tier={tier}/>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-3 md:p-4 kkm-main-pad kkm-view-in">
      <div className="max-w-3xl mx-auto flex flex-col gap-3 pb-4">
        <div className="kkm-sheet rounded-xl p-3 flex items-center gap-3 border-l-4 border-l-shu-600">
          <MascotFace size={54} mood="wow"/>
          <div className="min-w-0">
            <div className="text-xl font-semibold text-sumi-800">とくべつな おと</div>
            <div className="text-base font-semibold text-sumi-600 mt-0.5">
              おとの かずと マスの かずを あわせよう
            </div>
          </div>
        </div>

        {/* カードには すすみぐあいの 数字を **置かない**。

            もとは 右はしに「0/28」、下に 帯を 出していた。中身は
            「この単元の ことばの うち はこ 3 いじょう（＝3 かい 正解）に
            なった 語の かず」だったが、
              ・1 セットは 6 もん、1 もん 1 語。単元は 28 語
              ・きげんの きた 語を 先に 出す（§17.9）ので、きょう 正解した 語は
                あした期限に なり **きょうは もう 選ばれない** → つぎの セットは
                また べつの 6 語に 散る
              ・分子が 1 ふえるには **おなじ語で 3 かい 正解**が いる。
                1 かい まちがえると はこ 0 に もどる
            の 3 つが かみ合わず、1 単元を 13〜15 セット（80 もん超）といて
            やっと 0/28 が 1/28 に なる。ホームの めあては 1 日 6 もんなので、
            ふつうに つかうかぎり **数字は 何しゅうかんも 0 のまま**だった。
            「やっても うごかない 数字」は はげみに ならず、
            「じぶんは すすんでいない」という まちがった しらせに なる。
            はこ（SRS）じたいは 出題じゅんに ひきつづき つかうので、
            **画面から 数字を 消すだけ**に する。 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 md:gap-3">
          {SPECIAL_UNITS.map((u, i) => {
            const t = TONES[u.tone] || TONES.shu;
            return (
              <button key={u.key} onClick={() => { playPickup(); setOpenUnit(u.key); }} style={{ '--kkm-i': i }}
                className={`kkm-btn kkm-lift kkm-sheet kkm-stagger rounded-xl p-4 text-left border-l-4 ${t.leftRule}`}>
                <div className="flex items-center gap-3.5">
                  <span className={`shrink-0 w-16 h-16 rounded-xl border-2 flex items-center justify-center ${t.chip}`}>
                    <span className="kkm-glyph text-3xl leading-none">{u.mark}</span>
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className={`block text-xl font-semibold leading-tight ${t.text}`}>{u.title}</span>
                    <span className="block text-base font-medium text-sumi-600 mt-1 truncate">{u.lead}</span>
                  </span>
                  {/* 右はしが 空くので、押せることが わかる 矢じるしを 置く
                      （ホームの「つぎの もじ」と おなじ つかいかた）。 */}
                  <IconArrow size={24} className="shrink-0 text-sumi-400"/>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   18.95. <HomeView> ── きょうの めあて

   「なにを どこまで やれば おわりか」を 1 画面で 見せる。
   毎日 おなじ 3 つ。おわると カレンダーに はんこが おされる。
   ══════════════════════════════════════════════════════════════ */
function ProgressRing({ pct, size = 46, stroke = 5, color = 'var(--kkm-shu)', children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#eae2d2" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, pct / 100))}
          style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.4,1,.4,1)' }}/>
      </svg>
      <span className="relative">{children}</span>
    </span>
  );
}

/* はんこカレンダー：やった日に 朱色の はんこが つく */
function StampCalendar({ log }) {
  const now = new Date();
  const year = now.getFullYear(), month = now.getMonth();
  const first = new Date(year, month, 1);
  const days = new Date(year, month + 1, 0).getDate();
  const lead = first.getDay();
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  const today = now.getDate();
  return (
    <div className="kkm-sheet rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs md:text-sm font-semibold text-sumi-700 flex items-center gap-1.5">
          <IconCalendar size={15}/> {month + 1}がつの がんばり
        </span>
        <span className="text-[11px] font-semibold text-shu-700 tabular-nums">
          はんこ {cells.filter(d => d && log[todayKey(new Date(year, month, d))]?.done).length}こ
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1 max-w-[19rem] mx-auto">
        {/* ようびは かなで 出す。「日月火水木金土」は 1年生では
            まだ 読めない ことが 多く、ここは ふりがなを ふる すきまも ない。 */}
        {['にち','げつ','か','すい','もく','きん','ど'].map(w => (
          <div key={w} className="text-center text-[11px] font-semibold text-sumi-600">{w}</div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={i}/>;
          const rec = log[todayKey(new Date(year, month, d))];
          const stamped = rec?.done;
          const touched = rec && !stamped && (rec.review || rec.write || rec.special || rec.check);
          return (
            <div key={i} className={`aspect-square rounded-md flex items-center justify-center text-[10px] font-semibold border ${
              stamped ? 'bg-shu-50 border-shu-300 text-shu-700'
              : touched ? 'bg-washi-100 border-sumi-200 text-sumi-600'
              : 'bg-white border-sumi-100 text-sumi-600'
            } ${d === today ? 'ring-2 ring-shu-400' : ''}`}>
              {stamped ? <Hanamaru size={16}/> : d}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* おうちのひと・せんせい むけの まとめ。

   子どもの画面を じゃましないよう、たたんである。ここだけは 大人の
   ことばで、「いま どこで つまずいているか」を はっきり書く。 */
function GuardianPanel({ progress, skill, log, words, mim, tier, onCheck }) {
  const info = useMemo(() => {
    // この 30 日で れんしゅうした 日数
    let days = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const r = log[todayKey(d)];
      if (r && (r.review || r.write || r.special || r.words || r.check)) days++;
    }
    // にがて（まちがえた ままの もの）を 単元ごとに かぞえる
    const byUnit = {};
    const weakChars = [];
    const weakWords = [];
    for (const id in (skill || {})) {
      if (!srsIsWeak(skill[id])) continue;
      const [kind, a, b] = id.split(':');
      if (kind === 's') byUnit[a] = (byUnit[a] || 0) + 1;
      else if (kind === 'r' || kind === 'c') weakChars.push(a);
      else weakWords.push(weakLabelOf(id));            // なかま・はんたい（ことばの いみ）
    }
    const worstUnit = Object.keys(byUnit).sort((x, y) => byUnit[y] - byUnit[x])[0];
    const due = countDue(skill, '');
    const writeDone = HIRA_LIST.concat(KATA_LIST).filter(c => getStage(progress, c) >= 3).length;
    return { days, byUnit, weakChars: weakChars.slice(0, 12), weakWords: weakWords.slice(0, 8), worstUnit, due, writeDone };
  }, [progress, skill, log]);

  const advice = info.worstUnit
    ? `いま いちばん つまずいているのは「${SPECIAL_UNIT_MAP[info.worstUnit]?.title || info.worstUnit}」です。この単元を いっしょに 音読しながら もう一度どうぞ。`
    : info.weakChars.length > 0
      ? '形の にた文字（ぬ／め、シ／ツ など）で つまずいています。「よむ」の「にた もじ さがし」が ききます。'
      : info.weakWords.length > 0
        ? `ことばの いみ（${info.weakWords.slice(0, 3).join('・')} など）で つまずいています。「よむ」の「なかまの ことば」「はんたいの ことば」を いっしょに どうぞ。`
      : tier >= 3
        ? 'ちからだめしの結果から、いまは手あつい支援が要る段階です。「とくべつ」の各単元を、リズム（動作化）をいっしょにやりながら少しずつ進めてください。'
        : tier === 2
          ? 'ちからだめしの結果から、少していねいに進める段階です。ドットを見せながら、同じことばをくり返し扱うのが有効です。'
          : '大きな つまずきは ありません。1日 5分の 3つのめあてを つづけてください。';

  return (
    <details className="kkm-sheet rounded-lg overflow-hidden">
      <summary className="cursor-pointer select-none px-4 py-3.5 min-h-[60px] text-base font-semibold text-sumi-700 flex items-center gap-3">
        <span className="shrink-0 w-10 h-10 rounded-lg border-2 bg-sumi-50 text-sumi-600 border-sumi-300 flex items-center justify-center">
          <IconSearch size={20}/>
        </span>
        おうちの方・先生へ（学習のようす）
      </summary>
      <div className="px-3 pb-3 pt-1 flex flex-col gap-2 text-xs md:text-sm">
        {/* 多層指導モデル MIM の考え方にならった「いまの指導の層」 */}
        <div className={`rounded-md border p-2.5 ${TONES[(MIM_TIER_INFO[tier] || MIM_TIER_INFO[1]).tone].stat}`}>
          <div className="flex items-center justify-between gap-2">
            <span className={`font-semibold ${TONES[(MIM_TIER_INFO[tier] || MIM_TIER_INFO[1]).tone].statValue}`}>
              いまの指導ステージ：{(MIM_TIER_INFO[tier] || MIM_TIER_INFO[1]).name}
            </span>
            <button onClick={onCheck}
              className="kkm-btn shrink-0 px-2 py-1 rounded border border-sumi-300 bg-white text-[11px] font-semibold text-sumi-600">
              ちからだめしを する
            </button>
          </div>
          <div className="text-[11px] font-medium text-sumi-600 mt-1 leading-relaxed">
            {(MIM_TIER_INFO[tier] || MIM_TIER_INFO[1]).teacher}
          </div>
          <div className="text-[10px] font-medium text-sumi-600 mt-1 leading-relaxed">
            ※ 多層指導モデル MIM の考え方（アセスメントと指導の連動）にならった、
            このアプリ独自の目安です。MIM-PM の正式な標準得点ではありません。
          </div>
        </div>
        {(mim?.log || []).length > 0 && <MimHistoryChart log={mim.log}/>}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label:'この30日の学習日数', value:`${info.days}日`,        tone:'shu' },
            { label:'自力で書ける文字',   value:`${info.writeDone}字`,   tone:'ai' },
            { label:'集めた ことば',      value:`${words.length}語`,      tone:'midori' },
            { label:'復習まちの問題',     value:`${info.due}問`,          tone:'fuji' },
          ].map(s => {
            const t = TONES[s.tone];
            return (
              <div key={s.label} className={`rounded-md border p-2 ${t.stat}`}>
                <div className={`text-[10px] font-semibold ${t.statLabel}`}>{s.label}</div>
                <div className={`text-lg font-semibold tabular-nums ${t.statValue}`}>{s.value}</div>
              </div>
            );
          })}
        </div>
        <div className="rounded-md border border-sumi-200 bg-washi-100 p-2.5 font-medium text-sumi-700 leading-relaxed">
          {advice}
        </div>
        {info.weakChars.length > 0 && (
          <div>
            <div className="text-[11px] font-semibold text-sumi-600 mb-1">つまずいている文字</div>
            <div className="flex flex-wrap gap-1">
              {info.weakChars.map(c => (
                <span key={c} className="kkm-glyph px-2 py-0.5 rounded border border-shu-200 bg-shu-50 text-shu-800">{c}</span>
              ))}
            </div>
          </div>
        )}
        <div className="text-[10px] font-medium text-sumi-600 leading-relaxed">
          記録はこの端末の中だけに保存され、どこにも送信されません。
          消したいときは 右上の設定（歯車）から「さいしょから」を選んでください。
        </div>
      </div>
    </details>
  );
}

/* たたんで しまっておく はこ。
   1年生の 画面に「いま いらない もの」を 置かないための どうぐ。
   ひらくのは 本人か おうちの方。とじている あいだは 見出し 1 行だけ。 */
function Disclosure({ title, icon, children, defaultOpen = false, tone = 'sumi' }) {
  const [open, setOpen] = useState(defaultOpen);
  const t = TONES[tone] || TONES.sumi;
  return (
    <div className="kkm-sheet rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)} aria-expanded={open}
        className="kkm-btn w-full flex items-center gap-3 px-4 py-3.5 text-left min-h-[60px]">
        <span className={`shrink-0 w-10 h-10 rounded-lg border-2 flex items-center justify-center ${t.chip}`}>
          {icon}
        </span>
        <span className="flex-1 text-base font-semibold text-sumi-800">{title}</span>
        <span aria-hidden="true"
          className={`shrink-0 text-sumi-600 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}>
          <IconArrow size={22}/>
        </span>
      </button>
      {open && (
        <div className="kkm-unfold px-3 pb-3 flex flex-col gap-3 border-t border-sumi-200 pt-3">
          {children}
        </div>
      )}
    </div>
  );
}

/* ホームの「つぎは これ」＝ 画面で いちばん 大きい ボタン。
   1年生が まよわないよう、**押す ところは 1つだけ** にする。 */
function NextUpButton({ tone = 'shu', eyebrow, title, sub, icon, onClick, glyph }) {
  const t = TONES[tone] || TONES.shu;
  return (
    <button onClick={onClick} style={{ '--kkm-shadow-color': TONE_DEEP[tone] || TONE_DEEP.shu }}
      className={`kkm-btn kkm-ripple kkm-primary w-full ${t.solid} border-2 text-white flex items-center gap-4 px-4 py-4 text-left`}>
      <span className="shrink-0 w-16 h-16 rounded-xl bg-white/20 border-2 border-white/45 flex items-center justify-center">
        {glyph
          ? <span className="kkm-glyph text-4xl leading-none">{glyph}</span>
          : icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold text-white/85">{eyebrow}</span>
        <span className="block text-xl md:text-2xl font-semibold leading-tight mt-0.5">{title}</span>
        {sub && <span className="block text-sm font-semibold text-white/85 mt-1">{sub}</span>}
      </span>
      <span className="shrink-0 kkm-nudge rotate-90"><IconArrow size={30}/></span>
    </button>
  );
}

function HomeView({ progress, mastered, skill, todayRec, log, streak, kanaMode, setKanaMode, onGo, words, mim, tier }) {
  const allDone = isDayComplete(todayRec, tier);
  const nextChar = useMemo(() => {
    const order = learnOrderOf(kanaMode);
    return order.find(c => getStage(progress, c) < 2) || order.find(c => getStage(progress, c) < 4) || order[0];
  }, [progress, kanaMode]);
  const weak = useMemo(() => weakItems(skill, '').slice(0, 8), [skill]);
  /* すすみぐあいは「かんぺきに なった もじの かず」だけを 出す。
     もとは ここに「とくべつな おと」の 行も あったが、あれは ふくしゅうの
     はこ 3 いじょうの 語かずで、ふつうに つかうかぎり 何しゅうかんも 0 のまま
     だった（§18.9）。うごかない 帯を ならべても 何も つたわらないので やめる。 */
  const stats = useMemo(() => {
    const hira = HIRA_LIST.filter(c => getStage(progress, c) >= 4).length;
    const kata = KATA_LIST.filter(c => getStage(progress, c) >= 4).length;
    return {
      hira: { done: hira, total: HIRA_LIST.length },
      kata: { done: kata, total: KATA_LIST.length },
    };
  }, [progress]);

  /* 「つぎは これ」を 1つに しぼる。
     ①ちからだめしの 日 → ②まだ おわっていない めあての さいしょの 1つ
     → ③ぜんぶ おわったら ことばあつめ。
     ならべて えらばせるのでは なく、**アプリの ほうが 決める**。 */
  const mimDue = mimCheckDue(mim);
  const nextMission = MISSIONS.find(m => (todayRec[m.key] || 0) < missionGoal(m, tier));

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-3 md:p-4 kkm-main-pad">
      <div className="max-w-3xl mx-auto flex flex-col gap-3 md:gap-4 pb-4">

        {/* ① あいさつ。数字は ならべない（きょう やることに 目を 向けたい）。 */}
        <div className="kkm-sheet kkm-stagger rounded-xl p-3 md:p-4 flex items-center gap-3 border-l-4 border-l-shu-600" style={{ '--kkm-i': 0 }}>
          <div className="shrink-0 kkm-float"><MascotFace size={58} mood={allDone ? 'wow' : 'cheer'}/></div>
          <div className="flex-1 min-w-0">
            <div className="text-xl font-semibold text-sumi-800 leading-snug">
              {allDone ? 'きょうは ぜんぶ おわったよ！' : 'きょうも 5ふん、やってみよう'}
            </div>
            <div className="text-sm font-semibold text-sumi-600 mt-1">
              {streak > 0 ? `${streak}にち つづいているよ` : 'はじめの 1ぽを ふみだそう'}
            </div>
          </div>
          {allDone && <span className="shrink-0 kkm-stamp text-shu-600"><Hanamaru size={52} draw/></span>}
        </div>

        {/* ② つぎに やること。画面で いちばん 大きい ボタン、1つだけ。 */}
        <div className="kkm-stagger" style={{ '--kkm-i': 1 }}>
          {mimDue ? (
            <NextUpButton tone="ai" eyebrow="2 ふんの ちからだめし"
              title={(mim?.log || []).length === 0 ? 'よみめいじんに ちょうせん！' : 'まえより のびたか ためそう'}
              icon={<IconClock size={34}/>} onClick={() => onGo('mim')}/>
          ) : nextMission ? (
            <NextUpButton tone={nextMission.tone} eyebrow="つぎは これ"
              title={nextMission.title} sub={nextMission.sub}
              icon={React.createElement(ICONS[nextMission.icon] || IconMaru, { size: 34 })}
              onClick={() => onGo(nextMission.view, nextMission.go)}/>
          ) : (
            <NextUpButton tone="shu" eyebrow="きょうの めあては たっせい"
              title="ことばを あつめよう" sub="あつめた ことばで しりとりも できるよ"
              icon={<IconBook size={34}/>} onClick={() => onGo('words')}/>
          )}
        </div>

        {/* ③ きょうの めあて 3 つ。
            「あと なんかい？」だけが 読めれば よい。字を 大きく、数を 主役に する。 */}
        <div className="kkm-stagger" style={{ '--kkm-i': 2 }}>
          <SectionTitle className="mb-2">きょうの めあて</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 md:gap-3">
            {MISSIONS.map(m => {
              const t = TONES[m.tone];
              // めあての 数は ステージで かわる（とくべつは 6 / 5 / 4）
              const goal = missionGoal(m, tier);
              const now = Math.min(todayRec[m.key] || 0, goal);
              const pct = Math.round((now / goal) * 100);
              const cleared = now >= goal;
              const Icon = ICONS[m.icon] || IconMaru;
              return (
                <button key={m.key} onClick={() => onGo(m.view, m.go)}
                  className={`kkm-btn kkm-lift kkm-sheet rounded-xl p-3.5 text-left flex items-center gap-3 border-l-4 min-h-[84px] ${t.leftRule} ${
                    cleared ? 'bg-shu-50/60' : ''
                  }`}>
                  <ProgressRing pct={pct} size={58} stroke={6}>
                    {cleared
                      ? <span className="text-shu-600 kkm-stamp"><Hanamaru size={30}/></span>
                      : <span className={t.icon}><Icon size={26}/></span>}
                  </ProgressRing>
                  <span className="flex-1 min-w-0">
                    <span className={`block text-lg font-semibold leading-tight ${t.text}`}>{m.title}</span>
                    <span className="block text-base font-semibold text-sumi-700 mt-1">
                      {cleared
                        ? 'できた！'
                        : <>のこり <span className="text-xl tabular-nums text-shu-700">{goal - now}</span> かい</>}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ④ にがては 出たときだけ。ふだんは 画面に 置かない。
            押したら コースを えらばせず、その場で「ぜんぶ まぜて」を はじめる。
            にがては `buildReviewQuestions` が いちばん 先に 出す。 */}
        {weak.length > 0 && (
          <button onClick={() => onGo('sound', 'mix')}
            className="kkm-btn kkm-lift kkm-sheet kkm-stagger rounded-xl p-3.5 border-l-4 border-l-shu-600 text-left flex items-center gap-3"
            style={{ '--kkm-i': 3 }}>
            <span className="shrink-0 w-12 h-12 rounded-lg bg-shu-50 border-2 border-shu-300 text-shu-600 flex items-center justify-center">
              <IconAlert size={24}/>
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-lg font-semibold text-shu-700">にがてを やっつける</span>
              <span className="flex flex-wrap gap-1.5 mt-1.5">
                {weak.slice(0, 6).map(id => (
                  <span key={id} className="kkm-glyph px-2 py-1 rounded-md bg-white border border-shu-300 text-shu-800 text-base leading-none">
                    {weakLabelOf(id)}
                  </span>
                ))}
              </span>
            </span>
            <IconArrow size={24} className="shrink-0 text-shu-600"/>
          </button>
        )}

        {/* ⑤ ここから下は「見たいときだけ ひらく」。
            すすみぐあい・カレンダー・先生むけの まとめは、毎日 見る ものでは
            ないので、ふだんは たたんでおく。ホームは 3 つの めあてだけに する。 */}
        <div className="kkm-stagger flex flex-col gap-2.5" style={{ '--kkm-i': 4 }}>
          <Disclosure title="つぎの もじを えらぶ" tone="ai" icon={<IconPencil size={20}/>}>
            <KanaModeSwitch kanaMode={kanaMode} setKanaMode={setKanaMode}/>
            <button onClick={() => onGo('write', nextChar)}
              className="kkm-btn kkm-ripple kkm-solid w-full bg-white rounded-xl p-3 flex items-center gap-3 text-left border-2 border-ai-300">
              <span className="shrink-0 w-16 h-16 rounded-lg bg-washi-100 border-2 border-ai-300 flex items-center justify-center">
                <span className="kkm-glyph text-4xl text-ai-700">{nextChar}</span>
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-ai-700">つぎの もじ</span>
                <span className="block text-lg font-semibold text-sumi-800 mt-0.5">かんたんな じから かこう</span>
              </span>
              <IconArrow size={24} className="shrink-0 text-ai-600"/>
            </button>
          </Disclosure>

          <Disclosure title="すすみぐあいを みる" tone="midori" icon={<IconGrid size={20}/>}>
            <div className="flex flex-col gap-3 px-1">
              {[
                { label:'ひらがな', v:stats.hira, bar:'bg-shu-500' },
                { label:'カタカナ', v:stats.kata, bar:'bg-ai-500' },
              ].map(row => (
                <div key={row.label}>
                  <div className="flex items-center justify-between text-base font-semibold text-sumi-700 mb-1">
                    <span>{row.label}</span>
                    <span className="tabular-nums">{row.v.done} / {row.v.total}</span>
                  </div>
                  <div className="h-3 rounded-full bg-washi-300 overflow-hidden">
                    <div className={`h-full rounded-full ${row.bar} kkm-bar-grow`}
                      style={{ width: `${row.v.total ? (row.v.done / row.v.total) * 100 : 0}%` }}/>
                  </div>
                </div>
              ))}
            </div>
            <StampCalendar log={log}/>
          </Disclosure>

          <GuardianPanel progress={progress} skill={skill} log={log} words={words} mim={mim} tier={tier}
            onCheck={() => onGo('mim')}/>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   21.5. <CollectionView> ── ずかん（あつめた ことば と しりとり）

   ごほうびの 画面。じぶんで あつめた ことばが たまっていく ようすを
   見せて、「もっと あつめたい」を つくる。
   ────────────────────────────────────────────────────────────── */
const COLLECTION_TABS = [
  { key: 'words',     label: 'ことばずかん', Icon: IconBook },
  { key: 'shiritori', label: 'しりとり',     Icon: IconLink },
];
function CollectionView({ kanaMode, setKanaMode, progress, usableInWords, words, onAdd, onAddMany, onDelete, voiceOn }) {
  const [tab, setTab] = useState('words');
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="shrink-0 flex gap-2 px-3 md:px-4 pt-2.5">
        {COLLECTION_TABS.map(t => {
          const on = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} aria-pressed={on}
              style={{ '--kkm-shadow-color': on ? TONE_DEEP.shu : '#ded8cd' }}
              className={`kkm-btn kkm-ripple kkm-solid flex-1 font-semibold text-lg border-2 flex items-center justify-center gap-2 ${
                on ? 'bg-shu-600 text-white border-shu-700' : 'bg-white text-sumi-600 border-sumi-300 hover:bg-washi-100'
              }`}>
              <t.Icon size={22}/> {t.label}
            </button>
          );
        })}
      </div>
      {tab === 'words' ? (
        <div className="flex-1 p-3 md:p-4 min-h-0 overflow-hidden">
          <WordCollection kanaMode={kanaMode} setKanaMode={setKanaMode}
            progress={progress} usableInWords={usableInWords}
            words={words} onAdd={onAdd} onDelete={onDelete} voiceOn={voiceOn}/>
        </div>
      ) : (
        <ShiritoriGame words={words} progress={progress} onAddMany={onAddMany} voiceOn={voiceOn}/>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   22. <App> ── ルートコンポーネント
   ────────────────────────────────────────────────────────────── */
// PWA ショートカット（manifest の ?view=...）や共有 URL から初期ビューを決める
const VIEW_KEYS = VIEW_TABS.map(t => t.key);
function getInitialView() {
  try {
    const v = new URLSearchParams(window.location.search).get('view');
    if (VIEW_KEYS.includes(v)) return v;
    // 旧バージョンの リンク（practice / shiritori）も うけとる
    if (v === 'practice') return 'write';
    if (v === 'shiritori') return 'words';
  } catch (e) {}
  return 'home';
}

function App() {
  const [view, setView] = useState(getInitialView);
  const [kanaMode, setKanaMode] = useState('hiragana');
  const [kanaKind, setKanaKind] = useState('seion');
  const [progress, setProgress] = useState(loadInitialProgress);
  // いちばん大事な学習記録。容量オーバーで保存できなかったときは、黙って
  // 失うのではなく safeLocalStorageSet 経由で画面に知らせる。
  useEffect(() => { safeLocalStorageSet(KEY_PROGRESS, JSON.stringify(progress)); }, [progress]);
  const mastered = useMemo(() => getMasteredList(progress), [progress]);
  const usableInWords = useMemo(() => getUsableInWordsList(progress), [progress]);
  const [words, setWords]       = useLocalStorage(KEY_WORDS, []);
  const [practiceCount, setPracticeCount] = useLocalStorage(KEY_COUNT, {});
  const [earned, setEarned]     = useLocalStorage(KEY_BADGES, []);
  const [voiceOn, setVoiceOn]   = useLocalStorage(KEY_VOICE, true);
  const [resetOpen, setResetOpen] = useState(false);
  const [badgesOpen, setBadgesOpen] = useState(false);
  const [toastBadge, setToastBadge] = useState(null);
  const [wordCelebration, setWordCelebration] = useState(null); // { chars: [...] } ことばで花丸になった文字
  const streak = useStreak();
  const install = useInstallPrompt();
  const [installGuideOpen, setInstallGuideOpen] = useState(false);
  // あたらしい学習モデルの 2 本柱：ふくしゅうの はこ（SRS）と きょうの きろく
  const { skill, answerSkill } = useSkill();
  // MIM：ちからだめしの きろくと、そこから きまる 指導の ステージ（層）。
  // めあての 数が ステージで かわる ので、きょうの きろくより 先に きめる。
  const [mim, setMim] = useLocalStorage(KEY_MIM, { log: [] });
  const tier = useMemo(() => currentTier(mim, skill), [mim, skill]);
  const { log: dayLog, todayRec, bumpMission } = useDayLog(tier);
  // ホームから「この もじを かこう」と とんでくるときの うけわたし
  const [requestedChar, setRequestedChar] = useState(null);
  const [requestedUnit, setRequestedUnit] = useState(null);
  const [requestedCourse, setRequestedCourse] = useState(null);   // 「よむ」を すぐ はじめる コース
  const [dayDonePopup, setDayDonePopup] = useState(false);
  const dayDoneRef = useRef(null);

  // ブラウザの インストールダイアログが つかえるならそれを出し、
  // だめなら 手順の案内モーダルを出す（＝ボタンが「無反応」にならない）。
  const handleInstall = useCallback(async () => {
    const outcome = await install.promptInstall();
    if (outcome === 'unavailable') setInstallGuideOpen(true);
  }, [install.promptInstall]);

  // 音声リスト読み込み（ブラウザによっては遅延発火）
  useEffect(() => {
    if (!window.speechSynthesis) return;
    function refresh() { cachedJaVoice = null; getJaVoice(); }
    speechSynthesis.addEventListener
      ? speechSynthesis.addEventListener('voiceschanged', refresh)
      : (speechSynthesis.onvoiceschanged = refresh);
    refresh();
    return () => {
      if (speechSynthesis.removeEventListener) speechSynthesis.removeEventListener('voiceschanged', refresh);
      else speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // 音声OFFのときは効果音もすべてミュート
  useEffect(() => {
    voiceEnabled = voiceOn;
    if (!voiceOn && window.speechSynthesis) {
      try { speechSynthesis.cancel(); } catch (e) {}
    }
  }, [voiceOn]);

  // localStorage 書き込み失敗（容量超過など）を画面に表示
  const [storageWarn, setStorageWarn] = useState(false);
  useEffect(() => {
    setStorageWarnCallback(() => setStorageWarn(true));
    return () => setStorageWarnCallback(null);
  }, []);

  // タブ復帰時に Safari の speechSynthesis が固まっていることがあるので
  // 直近のフラグをリセットしておく
  useEffect(() => {
    function onVis() {
      if (!document.hidden) lastSpeakText = '';
    }
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // バッジ達成監視
  useAchievements({ mastered, words, streak, earned, setEarned,
    onNew: (b) => setToastBadge(b) });

  // きょうの めあてを ぜんぶ おわらせた しゅんかんに はんこを おす
  useEffect(() => {
    const key = todayKey();
    if (dayDoneRef.current === null) { dayDoneRef.current = isDayComplete(todayRec, tier) ? key : ''; return; }
    if (isDayComplete(todayRec, tier) && dayDoneRef.current !== key) {
      dayDoneRef.current = key;
      playFanfare(); burstConfetti(); hapticTriumph();
      setDayDonePopup(true);
    }
  }, [todayRec, tier]);

  const bumpCount = useCallback((char) => {
    setPracticeCount(prev => ({ ...prev, [char]: (prev[char] || 0) + 1 }));
  }, [setPracticeCount]);

  // ステージ1：書き順アニメをみた
  const onAnimeViewed = useCallback((char) => {
    if (!char) return;
    setProgress(prev => {
      const cur = prev[char] || newStageObj();
      if (cur.sawAnime && cur.stage >= 1) return prev;
      return { ...prev, [char]: { ...cur, sawAnime: true, stage: Math.max(cur.stage, 1) } };
    });
  }, []);

  // 1ラウンド完了（書き順すべて成功）：ステージに応じてカウンタを更新
  const onRoundComplete = useCallback((char, clean) => {
    if (!char) return;
    bumpCount(char);
    bumpMission('write');
    setProgress(prev => {
      const cur = prev[char] || newStageObj();
      let next = { ...cur };
      if (next.stage < 2) {
        // なぞり書きフェーズ：きれいさは問わずカウント
        next.traced = (next.traced || 0) + 1;
        next.sawAnime = true; // アニメみずに直接練習した場合もここで保証
        if (next.traced >= TRACE_REQUIRED) next.stage = 2;
        else next.stage = Math.max(next.stage, 1);
      } else if (next.stage < 4) {
        // 自力フェーズ：cleanのときだけれんぞくカウントを伸ばす
        next.free = (next.free || 0) + 1;
        if (clean) {
          next.freeStreak = (next.freeStreak || 0) + 1;
          if (next.freeStreak >= FREE_REQUIRED && next.stage < 3) next.stage = 3;
        } else {
          next.freeStreak = 0;
        }
      } else {
        // すでに完全マスター：カウントだけ伸ばす
        next.free = (next.free || 0) + 1;
        if (clean) next.freeStreak = (next.freeStreak || 0) + 1;
        else next.freeStreak = 0;
      }
      return { ...prev, [char]: next };
    });
  }, [bumpCount, bumpMission]);

  // 自力モードでミスした瞬間：れんぞくカウントをリセット（ラウンドの途中ミスもペナルティ）
  const onMistakeStreakReset = useCallback((char) => {
    if (!char) return;
    setProgress(prev => {
      const cur = prev[char];
      if (!cur || cur.freeStreak === 0 || cur.stage < 2) return prev;
      return { ...prev, [char]: { ...cur, freeStreak: 0 } };
    });
  }, []);

  /* 学習ログ：かくの 1 かい ぶんを レコードに ためる（§3.10.2）。
     なぞり書き（`guided: true`）と 自力書き（`guided: false`）は **混ぜない**。
     切りかわった 時点で レコードが 分かれる（studySession.js の writeAttempt）。 */
  const onWriteAttempt = useCallback((char, attempt) => {
    if (STUDY) STUDY.writeAttempt(char, attempt, scriptOf(char));
  }, []);

  /* かくモードの 段階（4 段階）を、いま 記録中の レコードに 反映する。
     レコードの 中で 段階が 上がると `ext.stageUp: true` が 立ち、
     先生は「今週 かんぺきに なった 字」を 数えられる（§3.10.2）。 */
  useEffect(() => {
    if (!STUDY) return;
    const uid = STUDY.currentUnitId();
    if (!uid || uid.indexOf('kana-') !== 0) return;
    STUDY.noteStage(getStage(progress, uid.slice(5)));
  }, [progress]);

  /* 画面を はなれたら、記録中の レコードを その場で しめる（§3.10.5）。
     タブごと 消えた ときは studySession.js の `pagehide` が 受けもつ。
     1 年生は タブを 閉じる 操作が 多いので、両方 いる。 */
  useEffect(() => () => { if (STUDY) STUDY.end('aborted'); }, [view]);

  // 画数が一致しなかったとき：採点せず、かきじゅんアニメ→なぞり書きのサイクルへ戻す
  const onStrokeCountMismatch = useCallback((char) => {
    if (!char) return;
    setProgress(prev => {
      const cur = prev[char];
      if (!cur) return prev;
      return { ...prev, [char]: { ...cur, stage: 0, traced: 0, freeStreak: 0, sawAnime: false } };
    });
  }, []);

  // ことばを ずかんに ついかする。
  // しりとりの あとに「ゲーム中に つかった あたらしい ことば」を まとめて
  // 入れることが あるので、本体は 配列で うけとる。1 つずつ よぶと 音や
  // 花丸の おいわいが 何回も かさなって うるさくなる。
  const addWords = useCallback((list) => {
    const items = (Array.isArray(list) ? list : [list]).filter(w => w && w.text);
    if (items.length === 0) return;
    const stamp = Date.now();
    setWords(prev => [...prev, ...items.map((w, i) => ({ id: stamp + i + Math.random(), ...w, date: stamp }))]);
    playPickup();
    bumpMission('words', items.length);
    // ことばに使った文字のうち、ステージ3だったものをステージ4へ昇格
    const chars = Array.from(new Set(items.flatMap(w => (w.text || '').split(''))));
    setProgress(prev => {
      const advanced = [];
      const next = { ...prev };
      chars.forEach(c => {
        const cur = next[c];
        if (cur && cur.stage === 3) {
          next[c] = { ...cur, stage: 4 };
          advanced.push(c);
        }
      });
      if (advanced.length > 0) {
        setTimeout(() => {
          playFanfare();
          burstConfetti();
          setWordCelebration({ chars: advanced, text: items.map(w => w.text).join('・') });
        }, 50);
      }
      return next;
    });
  }, [setWords, bumpMission]);
  const addWord = useCallback((w) => addWords([w]), [addWords]);
  const deleteWord = useCallback((id) => {
    setWords(prev => prev.filter(w => w.id !== id));
  }, [setWords]);

  // ホームの カードから 各画面へ とぶ（もじや ユニットを 指定できる）
  const goTo = useCallback((v, payload) => {
    if (v === 'write' && payload) setRequestedChar(payload);
    if (v === 'special' && payload) setRequestedUnit(payload);
    if (v === 'sound' && payload) setRequestedCourse(payload);
    setView(v);
  }, []);

  // 「さいしょから」＝このアプリの記録だけを消す。
  // localStorage.clear() は gigayama.github.io というサイト全体の保存を消すので、
  // 同じサイトに置いた他のアプリ（けいさんカードなど）の学習記録まで
  // 巻きぞえで消えてしまう。必ず kkm 接頭辞の付いたキーだけを削除すること。
  //
  // **`study.records.v1` は ぜったいに 消さない**（仕様書 §1.2）。
  // これは 9 つの アプリで 共有している 学習ログで、このアプリ専用の キーでは ない。
  // 先生へ 送るまえに 消すと、児童が 学習した きろくが 誰にも 気づかれないまま
  // 永久に 失われる。接頭辞で しぼっている ので いまも 対象外だが、
  // 将来の 書きかえで 巻きぞえに ならないよう、名指しでも 外しておく。
  const resetAll = () => {
    try {
      const keep = (KANA_STUDY && globalThis.StudyLog && globalThis.StudyLog.STUDY_LOG_KEY) || 'study.records.v1';
      const mine = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k !== keep && k.startsWith(STORAGE_PREFIX)) mine.push(k);
      }
      mine.forEach((k) => localStorage.removeItem(k));
    } catch (e) { /* 消せなくても再読み込みはする */ }
    window.location.reload();
  };

  return (
    <div className="h-screen flex flex-col kkm-app-bg overflow-hidden relative kkm-app-root"
      style={{ fontFamily: 'var(--kkm-font-kyokasho)', fontWeight: 600 }}>
      <canvas id="confettiCanvas" className="fixed inset-0 pointer-events-none z-[400]"/>
      <Header view={view} setView={setView} mastered={mastered}
        onReset={() => setResetOpen(true)}
        onOpenBadges={() => setBadgesOpen(true)}
        streak={streak} voiceOn={voiceOn} setVoiceOn={setVoiceOn}
        earnedCount={earned.length}
        showInstall={!install.standalone} installReady={install.canPrompt}
        onInstall={handleInstall}/>

      {/* key に view を 入れて、画面が かわるたび 中身を 作りなおす。
          こうすると 紙を めくるような きりかえ（.kkm-view-in）が
          どの 画面でも かならず 走り、「いま うつった」ことが わかる。 */}
      <main key={view} className="kkm-view-in flex-1 flex flex-col min-h-0 overflow-hidden">
        {view === 'home' && (
          <HomeView progress={progress} mastered={mastered} skill={skill}
            todayRec={todayRec} log={dayLog} streak={streak}
            kanaMode={kanaMode} setKanaMode={setKanaMode}
            words={words} onGo={goTo} mim={mim} tier={tier}/>
        )}
        {view === 'mim' && (
          <MimCheckView mim={mim} setMim={setMim} voiceOn={voiceOn} tier={tier}
            onChecked={() => bumpMission('check')}
            onClose={() => setView('home')}/>
        )}
        {view === 'write' && (
          <MainBoard kanaMode={kanaMode} setKanaMode={setKanaMode}
            kanaKind={kanaKind} setKanaKind={setKanaKind}
            progress={progress} mastered={mastered}
            onAnimeViewed={onAnimeViewed}
            onRoundComplete={onRoundComplete}
            onMistakeStreakReset={onMistakeStreakReset}
            onStrokeCountMismatch={onStrokeCountMismatch}
            onWriteAttempt={onWriteAttempt}
            practiceCount={practiceCount} voiceOn={voiceOn}
            requestedChar={requestedChar}
            onConsumeRequested={() => setRequestedChar(null)}
            onGoToWords={() => setView('words')}/>
        )}
        {view === 'sound' && (
          <SoundView kanaMode={kanaMode} setKanaMode={setKanaMode}
            progress={progress} skill={skill} answerSkill={answerSkill}
            bumpMission={bumpMission} voiceOn={voiceOn}
            initialCourse={requestedCourse} onConsumeInitial={() => setRequestedCourse(null)}/>
        )}
        {view === 'special' && (
          <SpecialView skill={skill} answerSkill={answerSkill}
            bumpMission={bumpMission} voiceOn={voiceOn}
            initialUnit={requestedUnit} onConsumeInitial={() => setRequestedUnit(null)}
            onGoWrite={(c) => goTo('write', c)} tier={tier}/>
        )}
        {view === 'words' && (
          <CollectionView kanaMode={kanaMode} setKanaMode={setKanaMode}
            progress={progress} usableInWords={usableInWords}
            words={words} onAdd={addWord} onAddMany={addWords}
            onDelete={deleteWord} voiceOn={voiceOn}/>
        )}
      </main>

      <ModeTabsMobile view={view} setView={setView}/>
      <Footer/>

      {installGuideOpen && <InstallGuideModal platform={install.platform} onClose={() => setInstallGuideOpen(false)}/>}
      {resetOpen   && <ResetModal onCancel={() => setResetOpen(false)} onConfirm={resetAll}/>}
      {badgesOpen  && <AchievementsModal earned={earned} mastered={mastered} words={words} streak={streak}
                          onClose={() => setBadgesOpen(false)}/>}
      {toastBadge  && <BadgeToast badge={toastBadge} onClose={() => setToastBadge(null)}/>}
      {wordCelebration && <WordMasterPopup info={wordCelebration} onClose={() => setWordCelebration(null)}/>}
      {dayDonePopup && <DayDonePopup streak={streak} onClose={() => setDayDonePopup(false)}/>}
      {storageWarn && (
        <div role="alert"
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[500] bg-white border border-shu-400 border-l-4 border-l-shu-600 text-sumi-800 rounded-lg px-4 py-3 shadow-xl max-w-sm flex items-start gap-2.5 kkm-pop-in">
          <span className="text-shu-600 shrink-0 mt-0.5" aria-hidden="true"><IconAlert size={20}/></span>
          <div className="flex-1">
            <div className="text-sm font-semibold">ほぞん が できませんでした</div>
            <div className="text-xs font-medium text-sumi-600 mt-0.5">ブラウザの ようりょうが いっぱいです。ことばを すこし けして みてください。</div>
          </div>
          <button onClick={() => setStorageWarn(false)} aria-label="とじる"
            className="kkm-btn w-8 h-8 min-w-[32px] min-h-[32px] rounded-md bg-sumi-50 hover:bg-sumi-100 text-sumi-600 flex items-center justify-center">
            <IconX size={16}/>
          </button>
        </div>
      )}
    </div>
  );
}

/* きょうの めあてを ぜんぶ おわらせた ときの はんこ */
function DayDonePopup({ streak, onClose }) {
  const ref = useModal(onClose);
  useEffect(() => { const t = setTimeout(onClose, 5200); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed inset-0 z-[350] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-sumi-900/45 backdrop-blur-sm kkm-fade-in" onClick={onClose}/>
      <div ref={ref} className="relative kkm-sheet rounded-xl px-6 py-6 max-w-xs w-full text-center border-t-4 border-t-shu-600 kkm-pop-in">
        <span className="kkm-stamp inline-flex w-24 h-24 rounded-lg bg-shu-600 border-2 border-shu-700 items-center justify-center">
          <Hanamaru size={62} color="#fff" draw/>
        </span>
        <div className="text-xl font-semibold text-sumi-800 mt-3">きょうの めあて たっせい！</div>
        <div className="text-sm font-medium text-sumi-600 mt-1">
          カレンダーに はんこを おしたよ。{streak > 1 && `${streak}にち れんぞく！`}
        </div>
        <button onClick={onClose}
          className="kkm-btn kkm-ripple mt-4 w-full py-3 rounded-md bg-shu-600 text-white font-semibold border border-shu-700">
          やったー！
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   23. レンダリング
   ────────────────────────────────────────────────────────────── */
ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
