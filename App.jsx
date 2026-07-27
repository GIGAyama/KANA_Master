/* ==============================================================
   ひらがな・カタカナ かきかたマスター ＋ ことばあつめ
   --------------------------------------------------------------
   小学１年生のための、ひらがな・カタカナ反復練習＋単語収集アプリ

   ＜たのしさUPの追加機能＞
   - 音声よみあげ（タップで読んでくれる）
   - マスコット「ひよこさん」のおうえん
   - 連続学習日数のストリーク 🔥
   - レベル（しょうごう）と バッジ図鑑 🎖
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
const KANA_KINDS = [
  { key: 'seion',     label: 'せいおん',  short: 'せいおん',  icon: '🌸' },
  { key: 'dakuon',    label: 'だくおん',  short: '゛',        icon: '🌟' },
  { key: 'handakuon', label: 'はんだくおん', short: '゜',     icon: '⭐' },
  { key: 'youon',     label: 'ようおん・そくおん', short: 'ゃゅょっ', icon: '✨' },
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

// ★カスタマイズポイント: 「ことばあつめ」のヒント
const WORD_HINTS_HIRA = [
  { w:'あめ', e:'🍬' }, { w:'いぬ', e:'🐶' }, { w:'うみ', e:'🌊' }, { w:'えき', e:'🚉' },
  { w:'おに', e:'👹' }, { w:'かに', e:'🦀' }, { w:'きく', e:'🌼' }, { w:'くも', e:'☁️' },
  { w:'こま', e:'🪀' }, { w:'さくら', e:'🌸' }, { w:'すいか', e:'🍉' }, { w:'そら', e:'🌌' },
  { w:'たこ', e:'🐙' }, { w:'つき', e:'🌙' }, { w:'にじ', e:'🌈' }, { w:'はな', e:'🌺' },
  { w:'ふね', e:'🚢' }, { w:'ほし', e:'⭐' }, { w:'みず', e:'💧' }, { w:'もも', e:'🍑' },
  { w:'やま', e:'⛰️' }, { w:'ゆき', e:'❄️' }, { w:'りんご', e:'🍎' }, { w:'れもん', e:'🍋' },
  // 濁音
  { w:'ぞう', e:'🐘' }, { w:'でんわ', e:'☎️' }, { w:'ぶどう', e:'🍇' }, { w:'かばん', e:'🎒' },
  { w:'だんご', e:'🍡' }, { w:'べんとう', e:'🍱' },
  // 半濁音
  { w:'ぱんだ', e:'🐼' }, { w:'えんぴつ', e:'✏️' }, { w:'ぷりん', e:'🍮' }, { w:'たんぽぽ', e:'🌼' },
  // 拗音・促音
  { w:'ちょう', e:'🦋' }, { w:'きって', e:'📮' }, { w:'でんしゃ', e:'🚃' }, { w:'がっこう', e:'🏫' },
];
const WORD_HINTS_KATA = [
  { w:'アイス', e:'🍦' }, { w:'イルカ', e:'🐬' }, { w:'ウサギ', e:'🐰' }, { w:'エビ', e:'🦐' },
  { w:'オムレツ', e:'🍳' }, { w:'カバ', e:'🦛' }, { w:'キリン', e:'🦒' }, { w:'クマ', e:'🐻' },
  { w:'ケーキ', e:'🍰' }, { w:'コアラ', e:'🐨' }, { w:'サメ', e:'🦈' }, { w:'シマウマ', e:'🦓' },
  { w:'スイカ', e:'🍉' }, { w:'タコ', e:'🐙' }, { w:'チーズ', e:'🧀' }, { w:'トマト', e:'🍅' },
  { w:'ネコ', e:'🐱' }, { w:'ヘビ', e:'🐍' }, { w:'バナナ', e:'🍌' }, { w:'ライオン', e:'🦁' },
  // 濁音
  { w:'ゴリラ', e:'🦍' }, { w:'ダチョウ', e:'🐦' }, { w:'ブタ', e:'🐷' }, { w:'ゾウ', e:'🐘' },
  // 半濁音
  { w:'パンダ', e:'🐼' }, { w:'ピアノ', e:'🎹' }, { w:'プリン', e:'🍮' }, { w:'ペンギン', e:'🐧' },
  // 拗音・促音
  { w:'チョコ', e:'🍫' }, { w:'コップ', e:'🥤' }, { w:'ジャム', e:'🍓' },
];
const EMOJI_CHOICES = ['😀','🍎','🐶','🐱','🌸','⭐','🌈','🍰','🚗','⚽','🎈','💧','🌙','☀️','🦋','🐟','🍓','🍙','🚀','🎵'];

// コンピュータがしりとりで使う単語リスト（ひらがな）
const SHIRITORI_CPU_WORDS = [
  {w:'あり',e:'🐜'},{w:'あひる',e:'🦆'},{w:'あさ',e:'🌅'},{w:'あき',e:'🍂'},{w:'あかい',e:'❤️'},
  {w:'いか',e:'🦑'},{w:'いちご',e:'🍓'},{w:'いえ',e:'🏠'},{w:'いし',e:'🪨'},{w:'いもうと',e:'👧'},
  {w:'うし',e:'🐄'},{w:'うちわ',e:'🪭'},{w:'うさぎ',e:'🐰'},{w:'うた',e:'🎵'},{w:'うで',e:'💪'},
  {w:'えき',e:'🚉'},{w:'えんぴつ',e:'✏️'},{w:'えほん',e:'📚'},{w:'えび',e:'🦐'},{w:'えいが',e:'🎬'},
  {w:'おに',e:'👹'},{w:'おかし',e:'🍰'},{w:'おつき',e:'🌙'},{w:'おはな',e:'🌺'},{w:'おおかみ',e:'🐺'},
  {w:'かに',e:'🦀'},{w:'かめ',e:'🐢'},{w:'かさ',e:'☂️'},{w:'かえる',e:'🐸'},{w:'かぜ',e:'💨'},{w:'かわ',e:'🏞️'},
  {w:'きつね',e:'🦊'},{w:'きのこ',e:'🍄'},{w:'きりん',e:'🦒'},{w:'きく',e:'🌼'},{w:'きじ',e:'🐦'},
  {w:'くじら',e:'🐋'},{w:'くり',e:'🌰'},{w:'くるま',e:'🚗'},{w:'くも',e:'☁️'},{w:'くさ',e:'🌿'},
  {w:'けむり',e:'💨'},{w:'けいと',e:'🧶'},{w:'けが',e:'🩹'},{w:'けむし',e:'🐛'},
  {w:'こうもり',e:'🦇'},{w:'こども',e:'👶'},{w:'こうえん',e:'🌳'},{w:'こおり',e:'🧊'},{w:'こま',e:'🪀'},{w:'こころ',e:'💗'},
  {w:'さかな',e:'🐟'},{w:'さる',e:'🐒'},{w:'さんぽ',e:'🚶'},{w:'さくら',e:'🌸'},{w:'さとう',e:'🍬'},{w:'さむい',e:'🥶'},
  {w:'しか',e:'🦌'},{w:'しろ',e:'🏰'},{w:'しお',e:'🧂'},{w:'したぎ',e:'👕'},{w:'しんかんせん',e:'🚄'},
  {w:'すずめ',e:'🐦'},{w:'すみれ',e:'🌸'},{w:'すいか',e:'🍉'},{w:'すもう',e:'🤼'},{w:'すな',e:'🏖️'},{w:'すき',e:'❤️'},
  {w:'せみ',e:'🦟'},{w:'せかい',e:'🌍'},{w:'せんせい',e:'👨‍🏫'},{w:'せっけん',e:'🧼'},{w:'せわ',e:'🫂'},
  {w:'そら',e:'🌌'},{w:'そうじ',e:'🧹'},{w:'そと',e:'🌿'},{w:'そり',e:'🛷'},{w:'そば',e:'🍜'},
  {w:'たこ',e:'🐙'},{w:'たぬき',e:'🦝'},{w:'たまご',e:'🥚'},{w:'たき',e:'💦'},{w:'たいよう',e:'☀️'},{w:'たか',e:'🦅'},
  {w:'ちょう',e:'🦋'},{w:'ちきゅう',e:'🌍'},{w:'ちゃわん',e:'🍵'},{w:'ちから',e:'💪'},
  {w:'つき',e:'🌙'},{w:'つる',e:'🦢'},{w:'つみき',e:'🧱'},{w:'つばさ',e:'🪶'},{w:'つち',e:'🌱'},{w:'つゆ',e:'💧'},
  {w:'てんき',e:'⛅'},{w:'てがみ',e:'✉️'},{w:'てんとう',e:'🐞'},{w:'てつ',e:'⚙️'},{w:'てら',e:'⛩️'},
  {w:'とり',e:'🐦'},{w:'とら',e:'🐯'},{w:'とまと',e:'🍅'},{w:'とうふ',e:'🫙'},{w:'とかげ',e:'🦎'},{w:'ともだち',e:'👫'},
  {w:'なみ',e:'🌊'},{w:'なし',e:'🍐'},{w:'なつ',e:'☀️'},{w:'なまこ',e:'🦑'},{w:'なわ',e:'🪢'},
  {w:'にじ',e:'🌈'},{w:'にわ',e:'🌿'},{w:'にんじん',e:'🥕'},{w:'にく',e:'🥩'},{w:'にわとり',e:'🐔'},{w:'にほん',e:'🎌'},
  {w:'ぬの',e:'🧵'},{w:'ぬいぐるみ',e:'🧸'},{w:'ぬりえ',e:'🖍️'},
  {w:'ねこ',e:'🐱'},{w:'ねずみ',e:'🐭'},{w:'ねんど',e:'🎨'},{w:'ねむい',e:'😴'},
  {w:'のり',e:'🌿'},{w:'のはら',e:'🌾'},{w:'のこぎり',e:'🪚'},{w:'のみもの',e:'🥤'},
  {w:'はな',e:'🌺'},{w:'はと',e:'🕊️'},{w:'はし',e:'🌉'},{w:'はる',e:'🌸'},{w:'はりねずみ',e:'🦔'},{w:'はやし',e:'🌲'},
  {w:'ひよこ',e:'🐥'},{w:'ひつじ',e:'🐑'},{w:'ひこうき',e:'✈️'},{w:'ひかり',e:'💡'},{w:'ひまわり',e:'🌻'},{w:'ひみつ',e:'🤫'},
  {w:'ふね',e:'🚢'},{w:'ふくろう',e:'🦉'},{w:'ふうせん',e:'🎈'},{w:'ふゆ',e:'❄️'},{w:'ふで',e:'🖌️'},{w:'ふじさん',e:'🗻'},
  {w:'へび',e:'🐍'},{w:'へや',e:'🏠'},{w:'へいわ',e:'☮️'},{w:'へそ',e:'🫙'},
  {w:'ほし',e:'⭐'},{w:'ほたる',e:'✨'},{w:'ほおずき',e:'🏮'},{w:'ほんや',e:'📚'},{w:'ほね',e:'🦴'},
  {w:'まつ',e:'🌲'},{w:'まくら',e:'🛏️'},{w:'まめ',e:'🫘'},{w:'まち',e:'🏙️'},{w:'まいにち',e:'📅'},{w:'まぐろ',e:'🐟'},
  {w:'みず',e:'💧'},{w:'みかん',e:'🍊'},{w:'みつばち',e:'🐝'},{w:'みち',e:'🛣️'},{w:'みそしる',e:'🍲'},{w:'みんな',e:'👥'},
  {w:'むし',e:'🐛'},{w:'むらさき',e:'🔮'},{w:'むすび',e:'🍙'},{w:'むかし',e:'📜'},{w:'むぎ',e:'🌾'},
  {w:'めだか',e:'🐟'},{w:'めがね',e:'👓'},{w:'めがみ',e:'👸'},{w:'めし',e:'🍚'},{w:'めいろ',e:'🗺️'},
  {w:'もも',e:'🍑'},{w:'もり',e:'🌲'},{w:'もぐら',e:'🐭'},{w:'もち',e:'🍡'},{w:'もくば',e:'🎠'},{w:'もみじ',e:'🍁'},
  {w:'やすみ',e:'😴'},{w:'やま',e:'⛰️'},{w:'やね',e:'🏠'},{w:'やかん',e:'🫖'},{w:'やど',e:'🏨'},
  {w:'ゆき',e:'❄️'},{w:'ゆび',e:'☝️'},{w:'ゆうひ',e:'🌅'},{w:'ゆかた',e:'👘'},{w:'ゆめ',e:'💭'},{w:'ゆか',e:'🪵'},
  {w:'よる',e:'🌙'},{w:'よこ',e:'↔️'},{w:'よつば',e:'🍀'},{w:'よみもの',e:'📖'},
  {w:'らいおん',e:'🦁'},{w:'らっこ',e:'🦦'},{w:'らくだ',e:'🐪'},{w:'らくがき',e:'🖍️'},
  {w:'りんご',e:'🍎'},{w:'りす',e:'🐿️'},{w:'りゅう',e:'🐉'},{w:'りか',e:'🔬'},
  {w:'るすばん',e:'🔐'},{w:'るりいろ',e:'💙'},
  {w:'れもん',e:'🍋'},{w:'れんこん',e:'🥗'},{w:'れっしゃ',e:'🚂'},{w:'れいぞうこ',e:'🧊'},{w:'れんしゅう',e:'✏️'},
  {w:'ろうそく',e:'🕯️'},{w:'ろば',e:'🫏'},{w:'ろけっと',e:'🚀'},{w:'ろうか',e:'🏫'},
  {w:'わに',e:'🐊'},{w:'わかめ',e:'🌿'},{w:'わたあめ',e:'🍭'},{w:'わかば',e:'🌱'},{w:'わらい',e:'😄'},{w:'わすれもの',e:'🎒'},
];

// ★カスタマイズポイント: レベル（しょうごう）
const LEVELS = [
  { min:  0, title: 'みならい',       icon: '🌱', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  { min:  5, title: 'がんばりや',     icon: '🌷', color: 'bg-rose-100 text-rose-700 border-rose-300' },
  { min: 15, title: 'もじチャレンジャー', icon: '🌟', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  { min: 30, title: 'もじはかせ',     icon: '📖', color: 'bg-sky-100 text-sky-700 border-sky-300' },
  { min: 50, title: 'もじマスター',   icon: '👑', color: 'bg-violet-100 text-violet-700 border-violet-300' },
  { min: 80, title: 'もじキング',     icon: '🏆', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  { min: 92, title: 'でんせつの もじびと', icon: '🐉', color: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-300' },
];
function getCurrentLevel(masteredCount) {
  return [...LEVELS].reverse().find(l => masteredCount >= l.min) || LEVELS[0];
}

// ★カスタマイズポイント: バッジ（ごほうびシール）
const BADGES = [
  { id: 'first',     title: 'はじめの いっぽ',   icon: '🌱', desc: 'はじめての じを マスター',     check: ({m,w,s}) => m.length >= 1 },
  { id: 'hira5',     title: 'ひらがな ５じ',     icon: '🌷', desc: 'ひらがなを ５じ おぼえた',     check: ({m})     => m.filter(c => HIRA_LIST.includes(c)).length >= 5 },
  { id: 'hira23',    title: 'ひらがな はんぶん', icon: '🌸', desc: 'ひらがなを ２３じ おぼえた',   check: ({m})     => m.filter(c => HIRA_LIST.includes(c)).length >= 23 },
  { id: 'hiraAll',   title: 'ひらがな かんぺき', icon: '🌻', desc: 'ひらがなを ぜんぶ おぼえた',   check: ({m})     => HIRA_LIST.every(c => m.includes(c)) },
  { id: 'kata5',     title: 'カタカナ ５じ',     icon: '⭐', desc: 'カタカナを ５じ おぼえた',     check: ({m})     => m.filter(c => KATA_LIST.includes(c)).length >= 5 },
  { id: 'kata23',    title: 'カタカナ はんぶん', icon: '✨', desc: 'カタカナを ２３じ おぼえた',   check: ({m})     => m.filter(c => KATA_LIST.includes(c)).length >= 23 },
  { id: 'kataAll',   title: 'カタカナ かんぺき', icon: '🎀', desc: 'カタカナを ぜんぶ おぼえた',   check: ({m})     => KATA_LIST.every(c => m.includes(c)) },
  { id: 'word5',     title: 'ことば あつめ びと', icon: '🍎', desc: 'ことばを ５こ あつめた',       check: ({w})     => w.length >= 5 },
  { id: 'word20',    title: 'ことば コレクター', icon: '🍰', desc: 'ことばを ２０こ あつめた',     check: ({w})     => w.length >= 20 },
  { id: 'word50',    title: 'ことば はかせ',     icon: '👑', desc: 'ことばを ５０こ あつめた',     check: ({w})     => w.length >= 50 },
  { id: 'streak3',   title: '３にち つづけた',   icon: '🔥', desc: '３にち れんぞくで れんしゅう', check: ({s})     => s >= 3 },
  { id: 'streak7',   title: '１しゅうかん',      icon: '🚀', desc: '７にち れんぞくで れんしゅう', check: ({s})     => s >= 7 },
  { id: 'allKana',   title: 'もじキング！',      icon: '🏆', desc: 'ひらがな・カタカナ ぜんぶ',    check: ({m})     => HIRA_LIST.every(c => m.includes(c)) && KATA_LIST.every(c => m.includes(c)) },
];

// LocalStorage キー
const KEY_MASTERED = 'kkm_v2_mastered';        // 旧データ（マイグレーション用）
const KEY_PROGRESS = 'kkm_v3_progress';        // ★新：文字ごとの学習ステージ
const KEY_WORDS    = 'kkm_v2_words';
const KEY_COUNT    = 'kkm_v2_count';
const KEY_STREAK   = 'kkm_v2_streak';   // { count, lastDate }
const KEY_BADGES   = 'kkm_v2_badges';   // 取得済みバッジID
const KEY_VOICE    = 'kkm_v2_voice';    // 音声よみあげON/OFF

/* ──────────────────────────────────────────────────────────────
   学習ステージ（あたらしい設計）
   ────────────────────────────────────────────────────────────── */
// 0: 未学習
// 1: 書き順アニメをみた
// 2: なぞり書きを TRACE_REQUIRED 回 こなした
// 3: ガイドなしで FREE_REQUIRED 回 れんぞくでせいかい（ほぼマスター）
// 4: その文字を使ったことばを 1つ以上あつめた（完全マスター 💮）
const TRACE_REQUIRED = 2;
const FREE_REQUIRED  = 3;

const STAGE_INFO = [
  { key: 0, icon: '🔒', label: 'みがくぜん',    color: 'text-slate-400'   },
  { key: 1, icon: '📺', label: 'かきじゅん',   color: 'text-sky-500'     },
  { key: 2, icon: '✏️', label: 'なぞりがき',   color: 'text-emerald-500' },
  { key: 3, icon: '✒️', label: 'じぶんでかく', color: 'text-violet-500'  },
  { key: 4, icon: '💮', label: 'かんぺき',     color: 'text-amber-500'   },
];

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
const playPingPong = () => { initAudio(); playTone(659.25, 'sine', 0.15, 0.1); setTimeout(() => playTone(880, 'sine', 0.3, 0.1), 100); };
const playBuzzer   = () => { initAudio(); playTone(150, 'square', 0.2, 0.05); };
const playFanfare  = () => { initAudio(); [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => setTimeout(() => playTone(f, 'sine', 0.4, 0.15), i*150)); };
const playPickup   = () => { initAudio(); playTone(880, 'sine', 0.1); setTimeout(() => playTone(1108, 'sine', 0.15), 80); };
const playBadge    = () => { initAudio(); [659.25, 783.99, 987.77, 1318.5].forEach((f, i) => setTimeout(() => playTone(f, 'triangle', 0.3, 0.12), i*120)); };

// 音声よみあげ（Web Speech API）
// voices ロードが非同期のブラウザでは初回呼び出し時点で空配列が返ることが
// あるため、null を「キャッシュ未確定」として扱う。`voiceschanged` で再取得。
let cachedJaVoice = null;
let voicesResolved = false;
function getJaVoice() {
  if (cachedJaVoice) return cachedJaVoice;
  if (!window.speechSynthesis) return null;
  const voices = speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null; // 未ロード：キャッシュしない
  voicesResolved = true;
  cachedJaVoice = voices.find(v => v.lang && v.lang.startsWith('ja')) || null;
  return cachedJaVoice;
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
  const colors = ['#fde68a','#fca5a5','#bae6fd','#a7f3d0','#c7d2fe','#fbcfe8'];
  const particles = Array.from({ length: 80 }, () => ({
    x: cssW/2, y: cssH/2,
    r: Math.random()*8+4,
    dx: Math.random()*12-6, dy: Math.random()*-12-4,
    color: colors[Math.floor(Math.random()*colors.length)],
    tilt: Math.random()*0.07+0.05, ang: 0
  }));
  function render() {
    if (document.hidden) { return; } // タブが隠れたら描画を止める（後でも勝手に戻らない）
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
const kanjiPathsCache = {};
const kanjiFetchInflight = {}; // char -> Promise（同時呼び出しを束ねる）
async function fetchKanjiVG(char) {
  if (kanjiPathsCache[char]) return kanjiPathsCache[char];
  if (kanjiFetchInflight[char]) return kanjiFetchInflight[char];
  const hex = char.charCodeAt(0).toString(16).padStart(5, '0');
  const url = `https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg@master/kanji/${hex}.svg`;
  // 8 秒のタイムアウトを設けて、固まったネットワークで UI が止まり続けるのを防ぐ
  const promise = (async () => {
    try {
      const ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      const timer = ctrl ? setTimeout(() => ctrl.abort(), 8000) : null;
      const res = await fetch(url, ctrl ? { signal: ctrl.signal } : undefined);
      if (timer) clearTimeout(timer);
      if (!res.ok) throw new Error('http ' + res.status);
      const text = await res.text();
      const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
      const paths = Array.from(doc.querySelectorAll('path')).map(p => p.getAttribute('d')).filter(Boolean);
      kanjiPathsCache[char] = paths;
      return paths;
    } catch (e) {
      return null;
    } finally {
      delete kanjiFetchInflight[char];
    }
  })();
  kanjiFetchInflight[char] = promise;
  return promise;
}
/* ──────────────────────────────────────────────────────────────
   3.5. 採点ロジック（独自）

   1年生でも納得感のあるフィードバックを返すために、ピクセル一致では
   なく「筆跡そのもの」の幾何的特徴で採点する。

   呼び出し側で画数（ストローク数）が一致していることを保証してから
   呼ぶこと（画数違反は採点せず、別途やり直しフローを起こす）。

   観点と配点：
     ・かきじゅん         30点（始点の位置 + 向きベクトル）
     ・マスの つかいかた  30点（マスを4等分した部屋の使い方）
     ・せんの こうさ      20点（必要な交差ペアの有無）
     ・おおきさ・いち     20点（バウンディングボックスの大きさ・中心）

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

// 観点④：おおきさ・いち（0..1）
// サイズと中心ズレを「相乗平均」で結合する（どちらかが破綻したら全体が落ちる）。
function evalBalance(usrPolys) {
  let xmin = 1, xmax = 0, ymin = 1, ymax = 0, n = 0;
  for (const poly of usrPolys) for (const p of poly) {
    if (p.x < xmin) xmin = p.x;
    if (p.x > xmax) xmax = p.x;
    if (p.y < ymin) ymin = p.y;
    if (p.y > ymax) ymax = p.y;
    n++;
  }
  if (n === 0) return 0;
  const w = xmax - xmin, h = ymax - ymin;
  // 一辺 0.65〜0.95 が満点。小さすぎは二次関数で大きく減点
  const sizeOk = (v) => {
    if (v >= 0.65 && v <= 0.95) return 1;
    if (v < 0.65) { const r = v / 0.65; return Math.max(0, r * r); }
    return Math.max(0, 1 - (v - 0.95) / 0.05);
  };
  const sizeScore = (sizeOk(w) + sizeOk(h)) / 2;
  const cx = (xmin + xmax) / 2, cy = (ymin + ymax) / 2;
  const cd = Math.hypot(cx - 0.5, cy - 0.5);
  // 中心からのズレ 0.18 以上で 0 点
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
  }
  return '';
}

// 自力書きの採点：ユーザー筆跡（画ごとの点列）とお手本パスを比較
// userStrokes: [{ points: [{x,y in 0..1}, ...] }, ...]
// templatePaths: KanjiVG の <path d="..."> 文字列の配列
function scoreHandwriting(userStrokes, templatePaths) {
  if (!userStrokes || !templatePaths || templatePaths.length === 0) return null;
  const tplPolys = templatePaths.map(d => sampleSvgPath(d, 24));
  const usrPolys = userStrokes.map(s => simplifyPoints(s.points || []));
  const items = [
    { key: 'order',     label: 'かきじゅん',         max: 15, raw: evalStrokeSequence(usrPolys, tplPolys) },
    { key: 'startdir',  label: 'はじめと むき',     max: 15, raw: evalStrokeStartAndDir(usrPolys, tplPolys) },
    { key: 'rooms',     label: 'マスの つかいかた', max: 30, raw: evalRooms(usrPolys, tplPolys) },
    { key: 'crossings', label: 'せんの こうさ',     max: 20, raw: evalCrossings(usrPolys, tplPolys) },
    { key: 'balance',   label: 'おおきさ・いち',     max: 20, raw: evalBalance(usrPolys) },
  ];
  const breakdown = items.map(it => ({
    key: it.key,
    label: it.label,
    max: it.max,
    score: Math.round(it.raw * it.max),
    status: it.raw >= 0.85 ? 'good' : it.raw >= 0.6 ? 'ok' : 'bad',
    advice: adviceFor(it.key, it.raw),
  }));
  const total = breakdown.reduce((s, b) => s + b.score, 0);
  const comment = total >= 90 ? 'すばらしい！'
                : total >= 70 ? 'じょうず！'
                : total >= 50 ? 'いい かんじ！'
                : 'もう いっかい！';
  return { total, breakdown, comment, passed: total >= 60 };
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
// 改善：earned が同期更新される前に effect が再実行されても二重トーストを
// 起こさないよう、関数型 setter で差分を計算する。
function useAchievements({ mastered, words, streak, setEarned, onNew }) {
  useEffect(() => {
    const ctx = { m: mastered, w: words, s: streak };
    const nowEarned = BADGES.filter(b => b.check(ctx)).map(b => b.id);
    setEarned(prev => {
      const set = new Set(prev);
      const fresh = nowEarned.filter(id => !set.has(id));
      if (fresh.length === 0) return prev;
      fresh.forEach(id => onNew && onNew(BADGES.find(b => b.id === id)));
      return nowEarned;
    });
    // eslint-disable-next-line
  }, [mastered, words, streak]);
}

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
   5. アイコン（lucide風）
   ────────────────────────────────────────────────────────────── */
const SvgIcon = ({ size=20, className='', children }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
       fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
       className={className}>{children}</svg>
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

/* ──────────────────────────────────────────────────────────────
   6. <Mascot> ── ひよこさんが応援
   ────────────────────────────────────────────────────────────── */
function Mascot({ message, mood = 'happy', size = 'normal' }) {
  // mood: happy / cheer / wow / sad
  const face = { happy: '🐤', cheer: '🐥', wow: '🌟🐤', sad: '🐣' }[mood] || '🐤';
  const wrap = size === 'small' ? 'text-2xl' : 'text-4xl md:text-5xl';
  const anim = mood === 'wow' ? 'kkm-sparkle' : mood === 'cheer' ? 'animate-bounce' : 'kkm-float';
  return (
    <div className="flex items-end gap-2">
      <div className={`${wrap} ${anim}`} style={anim === 'animate-bounce' ? { animationDuration: '1.4s' } : undefined}>{face}</div>
      {message && (
        <div className="relative bg-white border-2 border-amber-300 rounded-2xl rounded-bl-none px-3 py-1.5 shadow-sm kkm-pop-in">
          <span className="text-xs md:text-sm font-black text-amber-700">{message}</span>
          <span className="absolute -top-2 -right-2 text-sm kkm-sparkle">✨</span>
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
      className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-xs font-black shadow-sm transition-all active:scale-95 ${lv.color}`}>
      <span>{lv.icon}</span><span>{lv.title}</span>
    </button>
  );
}
function StreakBadge({ streak }) {
  if (streak <= 0) return null;
  return (
    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 border-2 border-orange-300 text-xs font-black shadow-sm">
      🔥 {streak}<span className="hidden md:inline">にち</span>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   8. <Header>
   ────────────────────────────────────────────────────────────── */
function Header({ view, setView, mastered, onReset, onOpenBadges, streak, voiceOn, setVoiceOn, earnedCount, showInstall, installReady, onInstall }) {
  return (
    <nav className="shrink-0 bg-white/90 backdrop-blur border-b-4 border-amber-500 px-3 md:px-6 py-1.5 md:py-2.5 flex justify-between items-center shadow-sm z-10 gap-2 relative overflow-hidden">
      {/* 装飾：背景に浮かぶ絵文字 */}
      <span className="kkm-decor kkm-float-slow text-base md:text-xl" style={{ top: '4px', left: '40%', animationDelay: '0s' }}>⭐</span>
      <span className="kkm-decor kkm-float-slow text-base md:text-xl" style={{ bottom: '2px', left: '55%', animationDelay: '1.2s' }}>🌈</span>
      <span className="kkm-decor kkm-float-slow text-base md:text-xl" style={{ top: '3px', left: '70%', animationDelay: '2.4s' }}>✨</span>
      {/* 左：ロゴ + アプリ名 */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0 min-w-0 relative z-10">
        <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 text-white flex items-center justify-center shadow-md text-xl shrink-0 kkm-wiggle">🐤</div>
        <h1 className="text-sm md:text-xl font-black tracking-tight leading-tight truncate kkm-text-rainbow">
          ひらがな・カタカナ<br className="md:hidden"/>かきかたマスター
        </h1>
      </div>

      {/* 中央：ビュー切替 */}
      <div className="hidden sm:flex bg-amber-50 rounded-full p-1 shadow-inner border border-amber-100 relative z-10">
        <button onClick={() => setView('practice')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-black transition-all active:scale-95 ${
            view === 'practice' ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md' : 'text-amber-700 hover:bg-amber-100'
          }`}><IconPencil size={16}/> もじをかく</button>
        <button onClick={() => setView('words')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-black transition-all active:scale-95 ${
            view === 'words' ? 'bg-gradient-to-br from-pink-400 to-violet-500 text-white shadow-md' : 'text-amber-700 hover:bg-amber-100'
          }`}><IconBook size={16}/> ことばずかん</button>
        <button onClick={() => setView('shiritori')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-black transition-all active:scale-95 ${
            view === 'shiritori' ? 'bg-gradient-to-br from-sky-400 to-blue-500 text-white shadow-md' : 'text-amber-700 hover:bg-amber-100'
          }`}>🎮 しりとり</button>
      </div>

      {/* 右：ステータス類 */}
      <div className="flex items-center gap-1.5 md:gap-2 shrink-0 relative z-10">
        {showInstall && (
          <button onClick={onInstall} title="この がめんを アプリとして ついかする"
            aria-label="この がめんを アプリとして ついかする"
            className={`flex items-center gap-1 px-2.5 md:px-3 h-11 min-h-[44px] rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-xs md:text-sm font-black shadow-md border-2 border-emerald-500 transition-all active:scale-95 kkm-pop ${installReady ? 'kkm-pulse-ring' : ''}`}>
            <span className="text-base" aria-hidden="true">📲</span>
            <span className="hidden sm:inline">アプリにする</span>
          </button>
        )}
        <StreakBadge streak={streak}/>
        <LevelBadge masteredCount={mastered.length} onClick={onOpenBadges}/>
        <button onClick={onOpenBadges} title="ごほうびシール" aria-label="ごほうびシール ずかん を ひらく"
          className="relative w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-yellow-100 hover:bg-yellow-200 text-yellow-700 flex items-center justify-center transition-all active:scale-95 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400">
          <IconTrophy size={20}/>
          {earnedCount > 0 && (
            <span aria-hidden="true" className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">{earnedCount}</span>
          )}
        </button>
        <button onClick={() => setVoiceOn(v => !v)}
          title={voiceOn ? 'おとを オフにする' : 'おとを オンにする'}
          aria-label={voiceOn ? 'おとを オフにする' : 'おとを オンにする'}
          aria-pressed={voiceOn}
          className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-all active:scale-95 shadow-sm focus:outline-none focus:ring-2 ${
            voiceOn ? 'bg-sky-100 text-sky-700 hover:bg-sky-200 focus:ring-sky-400' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 focus:ring-slate-400'
          }`}>
          {voiceOn ? <IconVolume size={20}/> : <IconVolumeX size={20}/>}
        </button>
        <button onClick={onReset} title="データをリセット" aria-label="れんしゅうデータをリセット"
          className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-500 flex items-center justify-center transition-all active:scale-95 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-300">
          <IconSettings size={20}/>
        </button>
      </div>
    </nav>
  );
}

/* ──────────────────────────────────────────────────────────────
   9. <Footer>
   ────────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="shrink-0 w-full bg-white border-t border-slate-200 py-1 text-center text-[10px] md:text-xs text-slate-600 font-bold">
      ©2026 ひらがな・カタカナかきかたマスター ・
      <a href="https://note.com/cute_borage86" target="_blank" rel="noopener noreferrer"
         className="text-amber-700 hover:text-amber-800 hover:underline ml-1">GIGA山</a>
    </footer>
  );
}

/* ──────────────────────────────────────────────────────────────
   10. <ModeTabsMobile>
   ────────────────────────────────────────────────────────────── */
function ModeTabsMobile({ view, setView }) {
  return (
    <div className="sm:hidden flex bg-white rounded-full p-1 shadow-sm border border-amber-100 mx-3 mt-2 relative z-10">
      <button onClick={() => setView('practice')}
        className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-full text-xs font-black transition-all active:scale-95 ${
          view === 'practice' ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow' : 'text-amber-700'
        }`}><IconPencil size={13}/> もじをかく</button>
      <button onClick={() => setView('words')}
        className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-full text-xs font-black transition-all active:scale-95 ${
          view === 'words' ? 'bg-gradient-to-br from-pink-400 to-violet-500 text-white shadow' : 'text-amber-700'
        }`}><IconBook size={13}/> ことばずかん</button>
      <button onClick={() => setView('shiritori')}
        className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-full text-xs font-black transition-all active:scale-95 ${
          view === 'shiritori' ? 'bg-gradient-to-br from-sky-400 to-blue-500 text-white shadow' : 'text-amber-700'
        }`}>🎮 しりとり</button>
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
      className="w-full bg-gradient-to-r from-amber-100 via-pink-100 to-sky-100 border-2 border-amber-300 rounded-2xl p-2 md:p-3 flex items-center gap-2 md:gap-3 shadow-sm hover:shadow-md transition-all active:scale-[0.99] kkm-shimmer">
      <div className="flex items-center justify-center bg-white rounded-xl w-10 h-10 md:w-16 md:h-16 border-2 border-amber-400 shadow-inner shrink-0 kkm-float">
        <span className="text-2xl md:text-4xl font-black text-amber-700">{char}</span>
      </div>
      <div className="flex-1 text-left min-w-0">
        <div className="text-[10px] md:text-xs font-black text-amber-600 flex items-center gap-1">
          <IconCalendar size={12}/> きょうの もじ ・ {kanaMode === 'katakana' ? 'カタカナ' : 'ひらがな'}
        </div>
        <div className="text-xs md:text-base font-black text-slate-700 truncate">
          {isMastered ? '💮 もう おぼえたよ！ もう いっかい かいてみよう' : 'チャレンジ してみよう！'}
        </div>
      </div>
      <div className="text-xl md:text-3xl shrink-0 kkm-sparkle">✨</div>
    </button>
  );
}

/* ──────────────────────────────────────────────────────────────
   12. <KanaTable>
   ────────────────────────────────────────────────────────────── */
function KanaTable({ kanaMode, setKanaMode, kanaKind, setKanaKind, progress, currentChar, onSelect, onSequence, onRandom }) {
  const table = getKanaTable(kanaMode, kanaKind);
  // いま見ている表の「かんぺき（💮）」進捗（がんばりゲージ）
  const { doneCount, totalCount, pct } = useMemo(() => {
    const list = table.filter(Boolean);
    const done = list.filter(c => getStage(progress, c) >= 4).length;
    return { doneCount: done, totalCount: list.length, pct: list.length ? Math.round((done / list.length) * 100) : 0 };
  }, [table, progress]);
  const allDone = totalCount > 0 && doneCount === totalCount;
  return (
    <div className="bg-white/95 backdrop-blur rounded-2xl shadow-sm border-2 border-amber-100 p-2 md:p-4 flex flex-col h-full min-h-0">
      <div className="flex gap-1.5 md:gap-2 mb-1.5 md:mb-2 shrink-0">
        <button onClick={() => setKanaMode('hiragana')}
          className={`flex-1 py-1.5 md:py-2 rounded-xl font-black text-sm md:text-lg transition-all active:scale-95 border-2 ${
            kanaMode === 'hiragana' ? 'bg-gradient-to-br from-pink-400 to-rose-500 text-white border-pink-500 shadow-md' : 'bg-amber-50 text-amber-600 border-amber-100'
          }`}>🌸 ひらがな</button>
        <button onClick={() => setKanaMode('katakana')}
          className={`flex-1 py-1.5 md:py-2 rounded-xl font-black text-sm md:text-lg transition-all active:scale-95 border-2 ${
            kanaMode === 'katakana' ? 'bg-gradient-to-br from-sky-400 to-indigo-500 text-white border-sky-500 shadow-md' : 'bg-amber-50 text-amber-600 border-amber-100'
          }`}>⚡ カタカナ</button>
      </div>

      {/* しゅるい（清音／濁音／半濁音／拗音・促音）のサブタブ */}
      <div className="grid grid-cols-4 gap-1 mb-2 md:mb-3 shrink-0">
        {KANA_KINDS.map(k => (
          <button key={k.key} onClick={() => setKanaKind(k.key)}
            className={`py-1 md:py-1.5 rounded-lg font-black text-[10px] md:text-xs border-2 transition-all active:scale-95 leading-tight ${
              kanaKind === k.key
                ? 'bg-gradient-to-br from-amber-400 to-orange-400 text-white border-amber-500 shadow'
                : 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100'
            }`}>
            <span className="block">{k.short}</span>
          </button>
        ))}
      </div>

      {/* がんばりゲージ：この表で 💮 になった数 */}
      <div className="shrink-0 mb-1.5 md:mb-2 kkm-progress-row" aria-hidden="false">
        <div className="flex items-center justify-between text-[10px] md:text-xs font-black text-amber-700 mb-0.5 px-0.5">
          <span className="flex items-center gap-1">{allDone ? '🏆' : '💮'} かんぺき</span>
          <span aria-live="polite">{doneCount}/{totalCount}{allDone ? ' ぜんぶ！' : ''}</span>
        </div>
        <div className="h-2.5 rounded-full bg-amber-100 border border-amber-200 overflow-hidden"
          role="progressbar" aria-valuemin="0" aria-valuemax={totalCount} aria-valuenow={doneCount}
          aria-label={`かんぺきに なった もじ ${doneCount} / ${totalCount}`}>
          <div className={`h-full rounded-full transition-all duration-500 ${allDone ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 kkm-shimmer' : 'bg-gradient-to-r from-emerald-400 to-teal-400'}`}
            style={{ width: `${pct}%` }}/>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto bg-amber-50/40 rounded-xl p-1.5 md:p-3 border border-amber-100">
        <div className="grid grid-cols-5 gap-1 md:gap-2 max-w-sm mx-auto">
          {table.map((char, i) => {
            if (!char) return <div key={i} className="aspect-square"/>;
            const stage = getStage(progress, char);
            const isCurrent = currentChar === char;
            // ステージに応じた見た目
            let cls = 'bg-white text-slate-700 border-amber-200 hover:bg-amber-50';
            let extra = '';
            if (stage === 1) cls = 'bg-sky-50 text-sky-700 border-sky-300';
            else if (stage === 2) cls = 'bg-emerald-50 text-emerald-700 border-emerald-300';
            else if (stage === 3) { cls = 'bg-violet-50 text-violet-700 border-violet-400 ring-1 ring-violet-200'; extra = 'kkm-pop'; }
            else if (stage === 4) { cls = 'bg-gradient-to-br from-amber-100 to-yellow-200 text-amber-700 border-amber-400 ring-2 ring-amber-300'; extra = 'kkm-shimmer kkm-pop'; }
            if (isCurrent) { cls = 'bg-gradient-to-br from-sky-400 to-indigo-500 text-white border-sky-500 scale-110 z-10 shadow-lg'; extra = 'kkm-pulse-ring'; }
            const info = STAGE_INFO[stage];
            return (
              <button key={i} onClick={() => onSelect(char)}
                className={`aspect-square rounded-lg font-black text-lg md:text-3xl border-2 shadow-sm relative transition-all active:scale-95 ${cls} ${extra}`}>
                {char}
                {!isCurrent && stage > 0 && (
                  <span className={`absolute -top-1 -right-1 text-xs leading-none ${stage === 4 ? 'kkm-sparkle' : ''}`}>{info.icon}</span>
                )}
              </button>
            );
          })}
        </div>
        {/* ステージはんれい */}
        <div className="mt-2 flex flex-wrap justify-center gap-x-2 gap-y-1 text-[10px] font-black text-slate-500 px-1">
          {STAGE_INFO.slice(1).map(s => (
            <span key={s.key} className="inline-flex items-center gap-0.5"><span>{s.icon}</span><span className={s.color}>{s.label}</span></span>
          ))}
        </div>
      </div>

      <div className="flex gap-1.5 md:gap-2 mt-2 md:mt-3 shrink-0">
        <button onClick={onSequence}
          className="flex-1 py-1.5 md:py-2.5 rounded-xl font-black text-xs md:text-base bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow border-b-4 border-emerald-600 transition-all active:scale-95 active:translate-y-0.5 active:border-b-2 flex items-center justify-center gap-1 md:gap-1.5 kkm-pop">
          <IconCheck size={14}/> あいうえお<span className="hidden md:inline">じゅん</span>
        </button>
        <button onClick={onRandom}
          className="flex-1 py-1.5 md:py-2.5 rounded-xl font-black text-xs md:text-base bg-gradient-to-br from-fuchsia-400 to-violet-500 text-white shadow border-b-4 border-violet-600 transition-all active:scale-95 active:translate-y-0.5 active:border-b-2 flex items-center justify-center gap-1 md:gap-1.5 kkm-pop">
          <IconSparkle size={14}/> ばらばら
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   13. <PracticeBoard> ── 練習キャンバス
   ────────────────────────────────────────────────────────────── */
const TOLERANCE = 0.22; // 始点・終点の許容範囲（大きいほど優しい）

// ステージごとの初期メッセージ
function stageMascotMessage(char, stage, so) {
  if (!char) return '';
  if (stage === 0) return `「${char}」の かきじゅんを みてみよう！`;
  if (stage === 1) {
    const left = Math.max(0, TRACE_REQUIRED - (so?.traced || 0));
    return `お手本を なぞって かこう！（あと ${left}かい）`;
  }
  if (stage === 2) {
    const left = Math.max(0, FREE_REQUIRED - (so?.freeStreak || 0));
    return `じぶんで かいてみよう！（れんぞく ${so?.freeStreak || 0}/${FREE_REQUIRED}）`;
  }
  if (stage === 3) return 'もうすこし！ ことばを 1こ あつめて 💮 にしよう！';
  return '💮 かんぺき！ もう いちど かいてみる？';
}

function PracticeBoard({ char, paths, stageObj, onAnimeViewed, onRoundComplete, onMistakeStreakReset, onStrokeCountMismatch, onNext, playMode, practiceCount, voiceOn, onGoToWords, fetchError, onRetryFetch }) {
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

  // ステージから派生するモード
  const stage = stageObj?.stage ?? 0;
  const isTraceMode = stage < 2;   // ステージ0,1 → なぞり書き（ガイド表示）
  // 最新stateをrefにキャッシュ（native event listenerでのstale closure対策）
  const stateRef = useRef({});
  stateRef.current = { paths, currentStroke, isCleared, char, mistakes, hasMistaken, voiceOn, stage };

  /* --- ライフサイクル --- */
  useEffect(() => {
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
        setMascotMsg('もうすこし！ ことばを 1こ あつめて 💮 にしよう！');
        setMascotMood('wow');
      } else if (stage === 2) {
        setMascotMsg('なぞりばっちり！ こんどは ガイドなしで かいてみよう！');
        setMascotMood('wow');
      } else if (stage === 4) {
        setMascotMsg('💮 かんぺき！');
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

  // Web フォント（Klee One）読み込み後にガイドを再描画
  useEffect(() => {
    if (!document.fonts || !document.fonts.ready) return;
    document.fonts.ready.then(() => {
      if (stateRef.current.char) redrawGuide();
    }).catch(() => {});
  }, []);

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
    };
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
  function redrawGuide() {
    const c = guideRef.current; if (!c) return;
    const ctx = c.getContext('2d'); const s = c.width;
    ctx.clearRect(0, 0, s, s);
    // 自力モード（ステージ2以上）ではガイドを描かない
    if (stateRef.current.stage >= 2) return;
    const ch = stateRef.current.char;
    if (!ch) return;
    // 教科書体（OS バンドル）→ Klee One（Web フォント）→ 丸ゴ の順でフォールバック。
    // 画ごとのストロークデータは KanjiVG が引き続き持つので、書き順アニメ・
    // 始点マーカー・採点ロジックは変わらない。
    ctx.save();
    ctx.fillStyle = '#e2e8f0'; // slate-200
    const fontSize = Math.round(s * 0.86);
    ctx.font = `${fontSize}px 'UD デジタル 教科書体 N-R', 'UD Digi Kyokasho N-R', 'UD デジタル 教科書体 NK-R', 'UD Digi Kyokasho NK-R', 'Klee One', 'Hiragino Maru Gothic ProN', sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(ch, s / 2, s / 2);
    ctx.restore();
  }
  // 旧 inkRef（KanjiVG ストロークで完了画を表示）はガイドと字形が
  // 揃わなくなったため使わない。クリアのみ。
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
    ctx.strokeStyle = st >= 2 ? '#1e293b' : 'rgba(14,165,233,0.75)';
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
        onRoundComplete(ch, !hm);
        setTimeout(() => {
          setCurrentStroke(0); setIsCleared(false);
          setMistakes(0); setHasMistaken(false);
          clearAll(); redrawGuide();
        }, 700);
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
        setMascotMsg(nm === 1 ? '🔴の ところから かいてね！' : 'もういちど ちょうせん！');
        setMascotMood('sad');
        return nm;
      }
    });
  }
  function restart() {
    setCurrentStroke(0); setIsCleared(false);
    setMistakes(0); setHasMistaken(false);
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
      setMascotMsg(`かくすうが ちがうよ！（${userStrokes.length}かく → ${ps.length}かく だよ）`);
      setMascotMood('sad');
      if (voiceOn) setTimeout(() => speakText('かくすうが ちがいます。もういちど かきじゅんから みてみよう', voiceOn), 150);
      onMistakeStreakReset && onMistakeStreakReset(ch);
      onStrokeCountMismatch && onStrokeCountMismatch(ch);
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
  }
  function closeScorePopup() {
    setScoreInfo(null);
    setCurrentStroke(0); setMistakes(0); setHasMistaken(false);
    clearAll();
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
    <div className="bg-white/95 backdrop-blur rounded-2xl shadow-sm border-2 border-orange-100 p-2 md:p-4 flex flex-col h-full min-h-0 kkm-practice-board">
      <div className="flex justify-between items-center mb-1 md:mb-2 shrink-0 gap-2 kkm-board-header">
        <span className={`text-[10px] md:text-sm font-bold px-2 md:px-3 py-0.5 md:py-1 rounded-full truncate ${
          isTraceMode ? 'text-emerald-700 bg-emerald-100' : 'text-violet-700 bg-violet-100'
        }`}>
          {char ? (isTraceMode ? `「${char}」を なぞって かこう` : `「${char}」を じぶんで かこう`) : 'もじを えらんでね 👆'}
        </span>
        {char && (
          <span className="text-[10px] md:text-xs font-bold text-amber-600 bg-amber-50 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full shrink-0">
            🏆 {practiceCount[char] || 0} かい
          </span>
        )}
      </div>

      {/* ステージ・ステッパー */}
      {char && (
        <StageStepper stage={stage} stageObj={stageObj}/>
      )}

      {char && (
        <div className="mb-1 md:mb-2 shrink-0 kkm-practice-mascot">
          <Mascot message={mascotMsg} mood={mascotMood} size="small"/>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center min-h-0 min-w-0 relative w-full kkm-square-fit-container">
        <div className="relative bg-white rounded-2xl border-4 border-orange-200 shadow-inner overflow-hidden kkm-square-fit">
          <div className="absolute top-1/2 left-0 right-0 border-t-2 border-dashed border-amber-200 pointer-events-none z-[5]"/>
          <div className="absolute left-1/2 top-0 bottom-0 border-l-2 border-dashed border-amber-200 pointer-events-none z-[5]"/>
          <canvas ref={guideRef} className="absolute inset-0 w-full h-full z-[1]"/>
          <canvas ref={inkRef}   className="absolute inset-0 w-full h-full z-[10]"/>
          {/* 始点ヒント（赤い点滅マーカー） */}
          {startHint && (
            <div className="absolute z-[15] pointer-events-none"
                 style={{ left: `${startHint.x}%`, top: `${startHint.y}%`, transform: 'translate(-50%, -50%)' }}>
              <span className="absolute inset-0 inline-flex h-5 w-5 rounded-full bg-rose-400 opacity-75 animate-ping"/>
              <span className="relative inline-flex rounded-full h-5 w-5 bg-rose-500 border-2 border-white shadow"/>
            </div>
          )}
          <canvas ref={writeRef}
            className="absolute inset-0 w-full h-full z-[20] cursor-crosshair"
            style={{ touchAction: 'none' }}
            role="img"
            aria-label={char ? `${char} のかきとり`: 'もじを えらんでください'}
          />
          {!char && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-300 text-7xl pointer-events-none" aria-label="もじを えらんでください">？</div>
          )}
          {char && paths === null && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-amber-600 z-[30] pointer-events-none gap-2" role="status" aria-live="polite">
              <div className="text-4xl kkm-float" aria-hidden="true">🐤</div>
              <div className="text-sm font-black">よみこみちゅう…</div>
            </div>
          )}
          {char && fetchError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/85 z-[30] gap-2 p-4 text-center" role="alert">
              <div className="text-4xl" aria-hidden="true">📡</div>
              <div className="text-sm font-black text-rose-700">よみこめなかったよ</div>
              <div className="text-xs text-slate-600 font-bold">インターネットが つながって いるか たしかめてね</div>
              <button onClick={onRetryFetch}
                className="mt-1 px-4 py-2 rounded-xl bg-amber-400 text-white font-black text-sm shadow border-b-4 border-amber-600 active:translate-y-0.5 active:border-b-2 min-h-[44px]">
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

      {/* ステージ3 → ことばで💮 への大きなCTA */}
      {char && stage === 3 && (
        <button onClick={onGoToWords}
          className="kkm-cta-btn mt-1 md:mt-2 py-1.5 md:py-2 px-3 rounded-xl bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-300 text-amber-900 font-black text-xs md:text-base shadow border-b-4 border-amber-500 active:translate-y-0.5 active:border-b-2 transition-all flex items-center justify-center gap-2 shrink-0">
          🎀 ことばを 1こ あつめて 💮 にしよう！
        </button>
      )}

      <div className="flex gap-1.5 md:gap-2 mt-2 md:mt-3 shrink-0 kkm-practice-buttons">
        <button onClick={restart} disabled={!char}
          aria-label="ここまでの れんしゅうを やりなおす"
          className="flex-1 py-2 md:py-2.5 rounded-xl font-black text-xs md:text-base bg-orange-50 text-orange-700 shadow-sm border-b-4 border-orange-200 transition-all active:scale-95 active:translate-y-0.5 active:border-b-2 disabled:opacity-40 flex items-center justify-center gap-1 md:gap-1.5 min-h-[44px]">
          <IconRotate size={16}/> やりなおし
        </button>
        <button onClick={() => char && speakText(char, voiceOn)} disabled={!char || !voiceOn}
          aria-label={char ? `${char} を よみあげる`: 'もじを よみあげる'}
          className="flex-1 py-2 md:py-2.5 rounded-xl font-black text-xs md:text-base bg-emerald-100 text-emerald-700 shadow-sm border-b-4 border-emerald-300 transition-all active:scale-95 active:translate-y-0.5 active:border-b-2 disabled:opacity-40 flex items-center justify-center gap-1 md:gap-1.5 min-h-[44px]">
          <IconVolume size={16}/> よんで
        </button>
        <button onClick={() => paths && paths.length > 0 && setShowAnime(true)} disabled={!char || !paths || paths.length === 0}
          aria-label="かきじゅんを みる"
          className="flex-1 py-2 md:py-2.5 rounded-xl font-black text-xs md:text-base bg-sky-100 text-sky-700 shadow-sm border-b-4 border-sky-300 transition-all active:scale-95 active:translate-y-0.5 active:border-b-2 disabled:opacity-40 flex items-center justify-center gap-1 md:gap-1.5 min-h-[44px]">
          <IconPlay size={16}/> かきじゅん
        </button>
      </div>

      {showAnime && paths && (
        <StrokeOrderAnime paths={paths} char={char}
          onClose={() => { setShowAnime(false); onAnimeViewed && onAnimeViewed(char); }}/>
      )}
      {isCleared && <ExcellentPopup/>}
      {scoreInfo && <ScorePopup result={scoreInfo} onClose={closeScorePopup}/>}
      {stageUp && <StageUpPopup info={stageUp} onClose={() => setStageUp(null)} onGoToWords={onGoToWords}/>}
    </div>
  );
}

// 連打防止つきの採点ボタン（300ms 以内の二度押しを破棄）
function SubmitButton({ onSubmit, disabled }) {
  const guarded = useDebouncedAction(onSubmit, 350);
  return (
    <button onClick={guarded} disabled={disabled}
      className="kkm-cta-btn mt-1 md:mt-2 py-2 md:py-2.5 px-3 rounded-xl bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 text-white font-black text-sm md:text-base shadow border-b-4 border-violet-600 active:translate-y-0.5 active:border-b-2 transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-60 min-h-[44px]">
      ✨ できた！ さいてんする
    </button>
  );
}

/* ──────────────────────────────────────────────────────────────
   13.5. <StageStepper> / <StageUpPopup>
   ────────────────────────────────────────────────────────────── */
function StageStepper({ stage, stageObj }) {
  const steps = [
    { idx: 1, icon: '📺', label: 'かきじゅん' },
    { idx: 2, icon: '✏️', label: 'なぞる',   sub: `${Math.min(stageObj?.traced || 0, TRACE_REQUIRED)}/${TRACE_REQUIRED}` },
    { idx: 3, icon: '✒️', label: 'じぶんで', sub: `${Math.min(stageObj?.freeStreak || 0, FREE_REQUIRED)}/${FREE_REQUIRED}` },
    { idx: 4, icon: '💮', label: 'ことば' },
  ];
  return (
    <div className="flex items-stretch gap-0.5 md:gap-1 mb-2 shrink-0 text-[10px] md:text-xs font-black kkm-stepper-row">
      {steps.map((s, i) => {
        const done = stage >= s.idx;
        const active = stage + 1 === s.idx || (stage === s.idx && s.idx < 4) || (stage === 0 && s.idx === 1);
        const cls = done
          ? 'bg-amber-200 text-amber-800 border-amber-400'
          : active
            ? 'bg-white text-slate-700 border-amber-300 ring-2 ring-amber-200'
            : 'bg-slate-50 text-slate-400 border-slate-200';
        return (
          <div key={i} className={`flex-1 rounded-lg border-2 px-1 py-1 text-center ${cls}`}>
            <div className="text-base md:text-lg leading-none">{done ? '✅' : s.icon}</div>
            <div className="leading-tight mt-0.5">{s.label}</div>
            {s.sub && !done && active && <div className="text-[9px] opacity-70">{s.sub}</div>}
          </div>
        );
      })}
    </div>
  );
}

function StageUpPopup({ info, onClose, onGoToWords }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(true);
    // ステージ3に上がったときは、ことばあつめへの導線を残すため長めに表示
    const dur = info.to === 3 ? 5500 : 2200;
    const t = setTimeout(() => { setShow(false); setTimeout(onClose, 400); }, dur);
    return () => clearTimeout(t);
  }, [onClose, info.to]);
  const msgMap = {
    2: { title: 'なぞり クリア！', sub: 'つぎは じぶんで かいてみよう！', color: 'from-emerald-200 to-emerald-100 border-emerald-400 text-emerald-700' },
    3: { title: 'ほぼマスター！', sub: 'ことばを 1こ あつめれば 💮 かんぺき！', color: 'from-violet-200 to-violet-100 border-violet-400 text-violet-700' },
    4: { title: '💮 かんぺき！', sub: 'ほんとうに じぶんの じに なったよ！', color: 'from-amber-200 to-amber-100 border-amber-400 text-amber-700' },
  };
  const m = msgMap[info.to];
  if (!m) return null;
  return (
    <div className={`fixed inset-x-0 top-0 z-[180] pointer-events-none flex justify-center transition-all duration-400 pt-3 md:pt-5 ${
      show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
    }`}>
      <div className={`bg-gradient-to-br ${m.color} px-5 md:px-8 py-3 md:py-4 rounded-3xl shadow-2xl border-4 max-w-sm mx-3 text-center pointer-events-auto -rotate-2`}>
        <div className="text-xl md:text-3xl font-black">{m.title}</div>
        <div className="text-xs md:text-base font-black mt-1 opacity-90">{m.sub}</div>
        {info.to === 3 && onGoToWords && (
          <button onClick={onGoToWords}
            className="mt-2 px-4 py-1.5 rounded-xl bg-white text-violet-700 font-black text-sm shadow border-b-4 border-violet-400 active:translate-y-0.5 active:border-b-2">
            ことばずかんへ →
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
      bg.setAttribute('d', d); bg.setAttribute('stroke', '#fef3c7'); bg.setAttribute('stroke-width','6');
      bg.setAttribute('fill','none'); bg.setAttribute('stroke-linecap','round'); bg.setAttribute('stroke-linejoin','round');
      bgG.appendChild(bg);
      // 長さと始点はキャッシュから（DOM 挿入なし）
      const len = getPathLength(d) + 8;
      const se  = getStartEndPoints(d);
      const sp  = { x: se.s.x * 109, y: se.s.y * 109 };
      lens.push(len);
      const p = document.createElementNS(svgNS,'path');
      p.setAttribute('d', d); p.setAttribute('stroke', '#0f172a'); p.setAttribute('stroke-width','6');
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
      c.setAttribute('fill','#ffffff'); c.setAttribute('stroke','#f97316'); c.setAttribute('stroke-width','1.2');
      const t = document.createElementNS(svgNS,'text');
      t.setAttribute('x', cx); t.setAttribute('y', cy+0.5);
      t.setAttribute('text-anchor','middle'); t.setAttribute('dominant-baseline','central');
      t.setAttribute('font-size','6'); t.setAttribute('font-weight','900'); t.setAttribute('fill','#f97316');
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-2 md:p-4 overflow-auto" onClick={onClose}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={`${char} のかきじゅん`}
        className="bg-white rounded-3xl shadow-2xl border-4 border-sky-200 p-3 md:p-6 max-w-md w-full my-auto" onClick={(e) => { e.stopPropagation(); }}>
        <div className="flex justify-between items-center mb-2 md:mb-3">
          <span className="text-sm font-black text-sky-700 bg-sky-100 px-3 py-1 rounded-full">「{char}」のかきじゅん</span>
          <button onClick={onClose} aria-label="とじる"
            className="w-11 h-11 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all active:scale-95 min-w-[44px] min-h-[44px]"><IconX size={18}/></button>
        </div>
        <div className="aspect-square bg-white rounded-2xl border-4 border-sky-200 shadow-inner relative overflow-hidden mb-2 md:mb-3 mx-auto" style={{ maxHeight: 'min(70vh, 70dvh)', maxWidth: '100%', width: 'min(70vh, 70dvh, 100%)' }}>
          <div className="absolute top-1/2 left-0 right-0 border-t-2 border-dashed border-sky-200"/>
          <div className="absolute left-1/2 top-0 bottom-0 border-l-2 border-dashed border-sky-200"/>
          <svg ref={svgRef} viewBox="0 0 109 109" className="w-full h-full relative z-10"/>
        </div>
        <div className="flex gap-2 items-center">
          <button onClick={play} disabled={playing}
            className="px-5 py-2.5 rounded-xl font-black text-white bg-sky-400 shadow border-b-4 border-sky-600 transition-all active:scale-95 active:translate-y-0.5 active:border-b-2 disabled:opacity-50 flex items-center gap-1.5">
            <IconPlay size={18}/> {playing ? 'さいせいちゅう' : 'みる'}
          </button>
          <div className="flex-1">
            <input type="range" min="1" max="10" value={speed} onChange={(e) => setSpeed(+e.target.value)} className="w-full accent-sky-500"/>
            <div className="flex justify-between text-[10px] text-sky-700 font-bold"><span>🐢 ゆっくり</span><span>はやい 🐇</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   15. <ExcellentPopup>
   ────────────────────────────────────────────────────────────── */
function ExcellentPopup() {
  const [show, setShow] = useState(false);
  useEffect(() => { setShow(true); const t = setTimeout(() => setShow(false), 1400); return () => clearTimeout(t); }, []);
  return (
    <div className={`fixed inset-0 z-[150] pointer-events-none flex items-center justify-center transition-all duration-500 ${
      show ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
    }`}>
      <div className="bg-white/95 backdrop-blur px-6 md:px-10 py-4 md:py-6 rounded-3xl shadow-2xl border-4 border-emerald-400 -rotate-3">
        <span className="text-3xl md:text-6xl font-black text-emerald-500 tracking-widest">💮 よくできました</span>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   15.3. <ScorePopup> ── 自力書きの採点結果
   ────────────────────────────────────────────────────────────── */
function ScorePopup({ result, onClose }) {
  const [show, setShow] = useState(false);
  const [detail, setDetail] = useState(false);
  const close = useCallback(() => {
    setShow(false);
    setTimeout(() => onClose && onClose(), 350);
  }, [onClose]);
  useEffect(() => {
    setShow(true);
    if (!detail) {
      const t = setTimeout(close, 3000);
      return () => clearTimeout(t);
    }
  }, [detail, close]);

  const { total, breakdown = [], comment, passed } = result || {};
  const stars = total >= 90 ? '⭐⭐⭐' : total >= 70 ? '⭐⭐' : total >= 50 ? '⭐' : '✏️';
  const color = passed
    ? 'from-amber-100 via-yellow-50 to-amber-100 border-amber-400 text-amber-700'
    : 'from-sky-100 via-slate-50 to-sky-100 border-sky-400 text-sky-700';
  const iconFor = (s) => s === 'good' ? '💯' : s === 'ok' ? '◯' : '△';

  return (
    <div
      className={`fixed inset-0 z-[170] flex items-center justify-center transition-all duration-400 bg-black/20 ${
        show ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
      } pointer-events-auto`}
      onClick={close}
      role="dialog" aria-modal="true" aria-label={`さいてんけっか ${total} てん`}
    >
      <div className={`bg-gradient-to-br ${color} px-6 md:px-10 py-4 md:py-6 rounded-3xl shadow-2xl border-4 text-center ${detail ? '' : '-rotate-2'} pointer-events-auto max-w-md mx-3`}
           onClick={(e) => e.stopPropagation()}>
        <div className="text-lg md:text-2xl font-black opacity-80">{stars} {comment}</div>
        <div className="mt-1 flex items-baseline justify-center gap-1">
          <span className="text-5xl md:text-7xl font-black tracking-tight">{total}</span>
          <span className="text-xl md:text-2xl font-black opacity-80">/100てん</span>
        </div>
        {!detail && (
          <div className="mt-3 flex justify-center gap-2">
            <button onClick={(e) => { e.stopPropagation(); setDetail(true); }}
              className="px-4 py-2 rounded-full bg-white/80 border-2 border-current text-xs md:text-sm font-black active:scale-95 transition-all min-h-[44px]">
              🔍 くわしく
            </button>
            <button onClick={(e) => { e.stopPropagation(); close(); }}
              className="px-4 py-2 rounded-full bg-white/80 border-2 border-current text-xs md:text-sm font-black active:scale-95 transition-all min-h-[44px]">
              とじる
            </button>
          </div>
        )}
        {detail && (
          <div className="mt-3 bg-white/85 rounded-2xl p-3 text-left text-slate-700">
            <div className="text-[10px] md:text-xs font-black opacity-70 mb-2 text-center">うちわけ</div>
            <ul className="space-y-1.5">
              {breakdown.map(b => (
                <li key={b.key} className="flex items-center gap-2 text-xs md:text-sm">
                  <span className="text-base md:text-lg w-6 text-center">{iconFor(b.status)}</span>
                  <span className="font-black w-24 md:w-32 shrink-0">{b.label}</span>
                  <span className="font-black tabular-nums w-10 md:w-12 shrink-0 text-right">{b.score}/{b.max}</span>
                  <span className="text-[10px] md:text-xs opacity-80 flex-1">{b.advice}</span>
                </li>
              ))}
            </ul>
            <button onClick={(e) => { e.stopPropagation(); close(); }}
              className="mt-3 w-full px-4 py-1.5 rounded-full bg-slate-100 border-2 border-slate-300 text-xs md:text-sm font-black text-slate-600 active:scale-95 transition-all">
              とじる
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   15.5. <WordMasterPopup> ── ことばで文字が💮になった瞬間の演出
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
      <div className="bg-gradient-to-br from-amber-100 via-yellow-50 to-amber-100 px-6 md:px-10 py-5 md:py-7 rounded-3xl shadow-2xl border-4 border-amber-400 max-w-md mx-3 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
        <div className="text-center">
          <div className="text-xs md:text-sm font-black text-amber-700 opacity-90 mb-1">🎉 ことばで めざめたよ！</div>
          <div className="flex justify-center gap-2 my-2 md:my-3">
            {info.chars.map((c, i) => (
              <div key={i} className="relative">
                <span className="inline-block bg-white rounded-2xl border-4 border-amber-400 w-14 h-14 md:w-20 md:h-20 flex items-center justify-center text-3xl md:text-5xl font-black text-amber-700 shadow-lg animate-pulse">{c}</span>
                <span className="absolute -top-2 -right-2 text-2xl md:text-3xl">💮</span>
              </div>
            ))}
          </div>
          <div className="text-base md:text-xl font-black text-amber-700 mt-1">
            「{info.text}」で <span className="text-rose-500">かんぺき</span>！
          </div>
          <button onClick={onClose} autoFocus
            className="mt-3 px-5 py-2 rounded-full bg-white text-amber-700 font-black text-sm shadow border-b-4 border-amber-300 active:translate-y-0.5 active:border-b-2 min-h-[44px]">
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
      <div className="bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-300 border-4 border-amber-500 rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-3 cursor-pointer">
        <div className="text-4xl" aria-hidden="true">{badge.icon}</div>
        <div>
          <div className="text-[10px] font-black text-amber-800 opacity-90">🎉 シールゲット！</div>
          <div className="text-base md:text-lg font-black text-amber-900">{badge.title}</div>
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
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-3" onClick={onClose}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="ごほうびシールずかん"
        className="bg-white rounded-3xl shadow-2xl border-4 border-yellow-300 max-w-2xl w-full max-h-[92vh] overflow-y-auto p-4 md:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl md:text-2xl font-black text-amber-700 flex items-center gap-2">
            <IconTrophy size={26}/> ごほうびシールずかん
          </h2>
          <button onClick={onClose} aria-label="とじる"
            className="w-11 h-11 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all active:scale-95 min-w-[44px] min-h-[44px]"><IconX size={18}/></button>
        </div>

        {/* レベル＆統計 */}
        <div className={`rounded-2xl border-2 p-3 mb-3 ${lv.color}`}>
          <div className="flex items-center gap-3">
            <div className="text-4xl md:text-5xl">{lv.icon}</div>
            <div className="flex-1">
              <div className="text-[10px] font-black opacity-70">いまの しょうごう</div>
              <div className="text-lg md:text-xl font-black">{lv.title}</div>
            </div>
            <div className="text-right text-xs font-black opacity-80">
              <div>🏆 {mastered.length}じ</div>
              {nextLv && <div className="opacity-70">つぎ：あと{nextLv.min - mastered.length}じ</div>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-2 text-center">
            <div className="text-[10px] font-black text-amber-600">ひらがな</div>
            <div className="text-xl font-black text-amber-700">{totalHira}/46</div>
          </div>
          <div className="bg-sky-50 border-2 border-sky-200 rounded-xl p-2 text-center">
            <div className="text-[10px] font-black text-sky-600">カタカナ</div>
            <div className="text-xl font-black text-sky-700">{totalKata}/46</div>
          </div>
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-2 text-center">
            <div className="text-[10px] font-black text-emerald-600">ことば</div>
            <div className="text-xl font-black text-emerald-700">{words.length}こ</div>
          </div>
          <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-2 text-center">
            <div className="text-[10px] font-black text-orange-600">れんぞく</div>
            <div className="text-xl font-black text-orange-700">🔥 {streak}にち</div>
          </div>
        </div>

        {/* バッジグリッド */}
        <div className="text-xs font-black text-slate-500 mb-2">
          ゲットしたシール {earned.length} / {BADGES.length}
        </div>
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
          {BADGES.map(b => {
            const has = earned.includes(b.id);
            return (
              <div key={b.id}
                className={`rounded-xl border-2 p-2.5 flex flex-col items-center text-center transition-all ${
                  has ? 'bg-gradient-to-br from-yellow-100 to-amber-100 border-amber-400 shadow-sm'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                }`}>
                <div className={`text-3xl md:text-4xl ${has ? '' : 'grayscale'}`}>{has ? b.icon : '🔒'}</div>
                <div className={`text-[11px] font-black mt-1 ${has ? 'text-amber-800' : 'text-slate-500'}`}>{b.title}</div>
                <div className="text-[9px] text-slate-500 mt-0.5">{b.desc}</div>
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
  const STAGES = [
    { at:1,  emoji:'🌱', name:'くさはら'  },
    { at:5,  emoji:'🏠', name:'おうち'    },
    { at:10, emoji:'🌳', name:'こうえん'  },
    { at:20, emoji:'🏪', name:'おみせ'    },
    { at:35, emoji:'🏫', name:'がっこう'  },
    { at:50, emoji:'🏰', name:'おしろ'    },
  ];
  const next = STAGES.find(s => wordCount < s.at);
  if (wordCount === 0) return null;
  const progress = next ? Math.round((wordCount / next.at) * 100) : 100;

  return (
    <div className="bg-gradient-to-b from-sky-100 to-emerald-50 border-2 border-sky-200 rounded-2xl p-3 mb-3 shrink-0">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-lg kkm-float">🏙️</span>
          <span className="font-black text-sky-800 text-sm">ことばタウン</span>
        </div>
        <span className="text-[10px] font-black text-sky-600 bg-white/60 rounded-full px-2 py-0.5">
          {wordCount}こ のことばが まちを そだてた！
        </span>
      </div>

      <div className="relative rounded-xl overflow-hidden" style={{height:'72px', background:'linear-gradient(to bottom,#bfdbfe 0%,#93c5fd 55%,#4ade80 78%,#16a34a 100%)'}}>
        <span className="absolute text-sm opacity-80" style={{top:'4px',left:'8px'}}>☁️</span>
        <span className="absolute text-xs opacity-70" style={{top:'9px',left:'64px'}}>☁️</span>
        <span className="absolute text-sm opacity-60" style={{top:'3px',right:'18px'}}>☁️</span>

        <div className="absolute bottom-6 left-3 flex gap-2 items-end">
          {STAGES.map((s, i) => (
            <div key={i} title={s.name}
              className={`flex flex-col items-center transition-all duration-700 ${wordCount >= s.at ? 'opacity-100 scale-100' : 'opacity-20 scale-75'}`}>
              <span className="text-2xl leading-none">{s.emoji}</span>
            </div>
          ))}
          {next && (
            <div className="flex flex-col items-center opacity-20">
              <span className="text-xl">🔒</span>
            </div>
          )}
        </div>

        <div className="absolute bottom-1.5 left-3 right-3 h-1.5 bg-white/30 rounded-full">
          <div className="h-full bg-white/80 rounded-full transition-all duration-700" style={{width:`${progress}%`}}/>
        </div>
      </div>

      <p className="text-[11px] font-black text-center mt-1.5">
        {next
          ? <span className="text-sky-700">あと <span className="text-sky-900 text-sm">{next.at - wordCount}</span>こ で {next.emoji}<span className="text-sky-800">{next.name}</span> が できるよ！</span>
          : <span className="kkm-text-rainbow">🏆 さいこう！ でんせつの まちが かんせいしたよ！</span>
        }
      </p>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   17c. <ShiritoriGame> ── しりとりゲーム
   ────────────────────────────────────────────────────────────── */
function ShiritoriGame({ words, voiceOn }) {
  const SMALL_TO_LARGE = {'ぁ':'あ','ぃ':'い','ぅ':'う','ぇ':'え','ぉ':'お','っ':'つ','ゃ':'や','ゅ':'ゆ','ょ':'よ','ゎ':'わ'};
  function getLastChar(word) {
    if (!word || word.length === 0) return '';
    const last = word[word.length - 1];
    return SMALL_TO_LARGE[last] || last;
  }

  const [gameState, setGameState] = useState('idle');
  const [chain, setChain] = useState([]);
  const [usedWords, setUsedWords] = useState(new Set());
  const [currentChar, setCurrentChar] = useState(null);
  const [thinking, setThinking] = useState(false);
  const [bestChain, setBestChain] = useState(() => {
    try { return parseInt(localStorage.getItem('kkm_siri_best') || '0'); } catch { return 0; }
  });
  const chainRef = useRef(null);

  const hiraganaWords = words.filter(w => w.kanaMode === 'hiragana');

  function updateBest(len) {
    if (len > bestChain) {
      setBestChain(len);
      try { localStorage.setItem('kkm_siri_best', String(len)); } catch {}
    }
  }

  function startGame() {
    const playerFirstChars = new Set(hiraganaWords.map(w => w.text[0]));
    let startOptions = SHIRITORI_CPU_WORDS.filter(w => {
      const last = getLastChar(w.w);
      return playerFirstChars.has(last) && last !== 'ん';
    });
    if (startOptions.length === 0) startOptions = SHIRITORI_CPU_WORDS.filter(w => getLastChar(w.w) !== 'ん');
    if (startOptions.length === 0) startOptions = SHIRITORI_CPU_WORDS;

    const start = startOptions[Math.floor(Math.random() * startOptions.length)];
    const lastChar = getLastChar(start.w);
    const initialChain = [{ word: start.w, emoji: start.e, isPlayer: false }];

    setChain(initialChain);
    setUsedWords(new Set([start.w]));
    setCurrentChar(lastChar);
    setGameState('playing');
    setThinking(false);
    speakText(start.w, voiceOn);
  }

  function playerPlay(wordObj) {
    if (gameState !== 'playing' || thinking) return;

    const newUsed = new Set([...usedWords, wordObj.text]);
    const lastChar = getLastChar(wordObj.text);
    const newChain = [...chain, { word: wordObj.text, emoji: wordObj.emoji, isPlayer: true }];

    setChain(newChain);
    setUsedWords(newUsed);
    speakText(wordObj.text, voiceOn);

    if (lastChar === 'ん') {
      updateBest(newChain.length);
      setGameState('lost');
      hapticErr();
      return;
    }
    hapticOk();

    setThinking(true);
    setTimeout(() => {
      const available = SHIRITORI_CPU_WORDS.filter(w => w.w[0] === lastChar && !newUsed.has(w.w));
      if (available.length === 0) {
        updateBest(newChain.length);
        setGameState('won');
        setThinking(false);
        playFanfare();
        burstConfetti();
        return;
      }
      const pick = available[Math.floor(Math.random() * available.length)];
      const newUsed2 = new Set([...newUsed, pick.w]);
      const compLastChar = getLastChar(pick.w);
      const newChain2 = [...newChain, { word: pick.w, emoji: pick.e, isPlayer: false }];

      setChain(newChain2);
      setUsedWords(newUsed2);
      speakText(pick.w, voiceOn);
      setThinking(false);

      if (compLastChar === 'ん') {
        updateBest(newChain2.length);
        setGameState('won');
        playFanfare();
        burstConfetti();
        return;
      }
      setCurrentChar(compLastChar);
    }, 1200);
  }

  function forfeit() {
    updateBest(chain.length);
    setGameState('lost');
    setThinking(false);
  }

  useEffect(() => {
    if (chainRef.current) chainRef.current.scrollTop = chainRef.current.scrollHeight;
  }, [chain, thinking]);

  const playableWords = gameState === 'playing' && currentChar && !thinking
    ? hiraganaWords.filter(w => w.text[0] === currentChar && !usedWords.has(w.text))
    : [];

  return (
    <div className="flex-1 p-3 md:p-4 min-h-0 overflow-hidden flex flex-col gap-3">
      <div className="bg-white/95 backdrop-blur rounded-2xl shadow-sm border-2 border-sky-200 p-3 md:p-5 flex flex-col h-full overflow-hidden gap-3">

        <div className="flex items-center justify-between shrink-0">
          <h2 className="flex items-center gap-2 text-lg md:text-xl font-black">
            <span className="kkm-float text-2xl">🎮</span>
            <span className="kkm-text-rainbow">しりとり ゲーム</span>
          </h2>
          {bestChain > 0 && (
            <div className="text-xs font-black text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
              🏆 さいこう <span className="text-amber-900 text-sm">{bestChain}</span>こ
            </div>
          )}
        </div>

        {gameState === 'idle' && hiraganaWords.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
            <div className="text-5xl">😢</div>
            <p className="font-black text-slate-700 text-base">ひらがなの ことばが まだ ないよ！</p>
            <p className="text-sm text-slate-500">「ことばずかん」タブで ことばを あつめてから<br/>あそんでね！</p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 font-black">
              💡 ことばが おおいほど しりとりで つよくなるよ！
            </div>
          </div>
        )}

        {gameState === 'idle' && hiraganaWords.length > 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
            <div className="text-6xl kkm-float">🎮</div>
            <p className="font-black text-slate-700 text-lg">コンピュータと しりとり しよう！</p>
            <div className="bg-sky-50 border-2 border-sky-200 rounded-2xl p-4 text-sm text-sky-800 text-left max-w-xs">
              <p className="font-black mb-2 text-center">📖 あそびかた</p>
              <ul className="space-y-1.5 list-none">
                <li>① コンピュータが さいしょの ことばを いう</li>
                <li>② その さいごの もじから はじまる<br/><strong className="text-sky-900">あつめた ことば</strong>を えらぼう！</li>
                <li>③ 「ん」で おわったら まけ</li>
                <li>④ コンピュータが こたえられなかったら かち！</li>
              </ul>
            </div>
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-3 text-sm font-black text-amber-800 max-w-xs w-full">
              ✨ あなたの てふだ: <span className="text-amber-900 text-base">{hiraganaWords.length}</span>こ のことば
              <div className="text-xs font-normal text-amber-600 mt-0.5">ことばが おおいほど つよくなれるよ！</div>
            </div>
            <button onClick={startGame}
              className="px-10 py-3.5 rounded-2xl font-black text-xl bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-lg border-b-4 border-blue-700 transition-all active:scale-95 active:translate-y-0.5 active:border-b-2">
              🎮 スタート！
            </button>
          </div>
        )}

        {gameState === 'playing' && (
          <>
            <div ref={chainRef} className="flex-1 overflow-y-auto space-y-2 min-h-0 bg-slate-50/70 rounded-xl p-2 border border-slate-200">
              {chain.map((entry, i) => (
                <div key={i} className={`flex items-end gap-2 ${entry.isPlayer ? 'flex-row-reverse' : 'flex-row'}`}>
                  <span className="text-xs text-slate-500 font-black shrink-0 mb-0.5">{entry.isPlayer ? 'あなた' : 'CPU'}</span>
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl text-sm font-black shadow-sm max-w-[65%] ${
                    entry.isPlayer
                      ? 'bg-gradient-to-br from-sky-400 to-blue-500 text-white rounded-br-sm'
                      : 'bg-white border-2 border-slate-200 text-slate-700 rounded-bl-sm'
                  }`}>
                    <span className="text-xl shrink-0">{entry.emoji}</span>
                    <span className="text-base">{entry.word}</span>
                    {i < chain.length - 1 && (
                      <span className="text-xs opacity-60 ml-1">→{getLastChar(entry.word)}</span>
                    )}
                  </div>
                </div>
              ))}
              {thinking && (
                <div className="flex items-end gap-2">
                  <span className="text-xs text-slate-500 font-black">CPU</span>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white border-2 border-slate-200 text-slate-400 text-sm font-black rounded-bl-sm">
                    🤔 かんがえてる...
                  </div>
                </div>
              )}
            </div>

            {!thinking && currentChar && (
              <div className="shrink-0 space-y-2">
                <div className="text-center">
                  <span className="inline-block bg-sky-100 border-2 border-sky-300 rounded-xl px-4 py-1.5">
                    <span className="text-2xl font-black text-sky-700">「{currentChar}」</span>
                    <span className="text-sm text-sky-600 ml-1">から はじまる ことばは？</span>
                  </span>
                </div>
                {playableWords.length > 0 ? (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {playableWords.map(w => (
                      <button key={w.id} onClick={() => playerPlay(w)}
                        aria-label={`${w.text} を こたえる`}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-black bg-gradient-to-br from-sky-50 to-blue-50 border-2 border-sky-300 text-sky-800 shadow-sm hover:shadow-md hover:border-sky-400 transition-all active:scale-95 min-h-[44px]">
                        <span className="text-xl" aria-hidden="true">{w.emoji}</span>
                        <span className="text-base">{w.text}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="bg-rose-50 border-2 border-rose-200 rounded-xl p-3 text-center">
                    <p className="font-black text-rose-700 mb-1">😭「{currentChar}」から はじまる ことばが ないよ！</p>
                    <p className="text-xs text-rose-500 mb-2">「ことばずかん」で「{currentChar}」から はじまる ことばを あつめよう！</p>
                    <button onClick={forfeit}
                      className="px-4 py-1.5 rounded-lg bg-rose-200 text-rose-700 font-black text-sm active:scale-95">まけを みとめる</button>
                  </div>
                )}
                <div className="text-center text-xs text-slate-500 font-black">
                  てふだ {hiraganaWords.length}こ ／ つなげた {chain.length}こ
                </div>
              </div>
            )}
          </>
        )}

        {gameState === 'won' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
            <div className="text-7xl kkm-sparkle">🏆</div>
            <p className="font-black text-2xl text-amber-700">やったね！かった！</p>
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 w-full max-w-xs">
              <p className="text-sm text-amber-700 font-black mb-2">つなげた ながさ: <span className="text-3xl text-amber-900">{chain.length}</span>こ</p>
              <div className="flex flex-wrap gap-1 justify-center">
                {chain.map((e, i) => (
                  <span key={i} className={`px-2 py-0.5 rounded-full text-xs font-black ${e.isPlayer ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-600'}`}>
                    {e.emoji}{e.word}
                  </span>
                ))}
              </div>
            </div>
            <button onClick={startGame}
              className="px-8 py-3 rounded-xl font-black text-lg bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow border-b-4 border-blue-700 transition-all active:scale-95">
              もう いちど あそぶ
            </button>
          </div>
        )}

        {gameState === 'lost' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
            <div className="text-7xl">😢</div>
            <p className="font-black text-2xl text-slate-700">まけちゃった...</p>
            <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 w-full max-w-xs">
              <p className="text-sm text-slate-600 font-black mb-2">つなげた ながさ: <span className="text-3xl text-sky-600">{chain.length}</span>こ</p>
              <div className="flex flex-wrap gap-1 justify-center">
                {chain.map((e, i) => (
                  <span key={i} className={`px-2 py-0.5 rounded-full text-xs font-black ${e.isPlayer ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-600'}`}>
                    {e.emoji}{e.word}
                  </span>
                ))}
              </div>
            </div>
            {hiraganaWords.length < 15 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs font-black text-amber-700 max-w-xs">
                💡 ことばを もっと あつめると つよくなれるよ！<br/>
                <span className="font-normal text-amber-600">いま {hiraganaWords.length}こ → もくひょう 15こ！</span>
              </div>
            )}
            <button onClick={startGame}
              className="px-8 py-3 rounded-xl font-black text-lg bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow border-b-4 border-blue-700 transition-all active:scale-95">
              もう いちど あそぶ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   18. <WordCollection>
   ────────────────────────────────────────────────────────────── */
function WordCollection({ kanaMode, setKanaMode, progress, mastered, usableInWords, words, onAdd, onDelete, voiceOn }) {
  const [addOpen, setAddOpen] = useState(false);
  const collected = words.filter(w => w.kanaMode === kanaMode);
  const hints = kanaMode === 'katakana' ? WORD_HINTS_KATA : WORD_HINTS_HIRA;
  const list  = kanaMode === 'katakana' ? KATA_LIST : HIRA_LIST;
  const availableHints = hints.filter(h => h.w.split('').every(c => usableInWords.includes(c)) && !words.some(w => w.text === h.w));
  // ステージ3（あと一歩で💮）の文字一覧 — モチベーション用
  const almostChars = (kanaMode === 'katakana' ? KATA_ALL_LIST : HIRA_ALL_LIST).filter(c => getStage(progress, c) === 3);

  return (
    <div className="bg-white/95 backdrop-blur rounded-2xl shadow-sm border-2 border-amber-100 p-3 md:p-5 flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center mb-3 shrink-0 gap-2">
        <h2 className="flex items-center gap-2 text-lg md:text-xl font-black truncate">
          <span className="kkm-float text-2xl">📖</span>
          <span className="kkm-text-rainbow">あつめた ことば</span>
          <span className="ml-1 text-xs bg-gradient-to-br from-amber-200 to-amber-300 text-amber-800 px-2 py-0.5 rounded-full shadow-sm">{collected.length}</span>
        </h2>
        <div className="flex bg-amber-50 rounded-full p-1 border border-amber-100 shrink-0">
          <button onClick={() => setKanaMode('hiragana')}
            className={`px-3 py-1 rounded-full text-xs md:text-sm font-black transition-all active:scale-95 ${
              kanaMode === 'hiragana' ? 'bg-amber-400 text-white shadow' : 'text-amber-700'
            }`}>ひらがな</button>
          <button onClick={() => setKanaMode('katakana')}
            className={`px-3 py-1 rounded-full text-xs md:text-sm font-black transition-all active:scale-95 ${
              kanaMode === 'katakana' ? 'bg-amber-400 text-white shadow' : 'text-amber-700'
            }`}>カタカナ</button>
        </div>
      </div>

      <WordTown wordCount={words.length}/>

      <div className="flex-1 overflow-y-auto bg-amber-50/40 rounded-xl p-3 border border-amber-100 mb-3">
        {collected.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 py-10">
            <Mascot message="まだ なにも ないよ！" mood="cheer"/>
            <p className="text-xs mt-3">したの「＋ ふやす」ボタンから あたらしい ことばを ついかしよう！</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
            {collected.slice().reverse().map(w => (
              <div key={w.id} className="bg-gradient-to-br from-white to-amber-50 rounded-xl shadow-sm hover:shadow-lg border-2 border-amber-200 p-3 flex flex-col items-center gap-1 relative group kkm-pop kkm-pop-in">
                <span className="text-4xl group-hover:scale-110 transition-transform" aria-hidden="true">{w.emoji || '✨'}</span>
                <button onClick={() => speakText(w.text, voiceOn)} disabled={!voiceOn}
                  aria-label={voiceOn ? `${w.text} を よみあげる` : `${w.text}`}
                  className="font-black text-lg text-slate-700 hover:text-amber-600 transition-all active:scale-95 disabled:cursor-default">
                  {w.text}
                </button>
                <button onClick={() => onDelete(w.id)}
                  aria-label={`${w.text} を けす`}
                  className="absolute top-1 right-1 w-8 h-8 min-w-[32px] min-h-[32px] rounded-full bg-rose-50 text-rose-500 opacity-60 md:opacity-0 md:group-hover:opacity-100 hover:bg-rose-100 flex items-center justify-center transition-all active:scale-95">
                  <IconTrash size={14}/>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* あとひと押しで 💮 になる文字（モチベ強化） */}
      {almostChars.length > 0 && (
        <div className="bg-gradient-to-r from-violet-50 via-fuchsia-50 to-violet-50 border-2 border-violet-300 rounded-xl p-2.5 mb-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-black text-violet-700 mb-1.5">
            ✨ この じを つかうと 💮 に なるよ！
          </div>
          <div className="flex flex-wrap gap-1.5">
            {almostChars.map(c => (
              <span key={c} className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white border-2 border-violet-400 font-black text-violet-700 text-xl shadow-sm">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {availableHints.length > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-2.5 mb-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-black text-yellow-700 mb-1.5">
            <IconBulb size={14}/> いまの じで つくれる ことば
          </div>
          <div className="flex flex-wrap gap-1.5">
            {availableHints.slice(0, 8).map(h => {
              // この単語が💮を作る数を表示
              const willMaster = h.w.split('').filter(c => getStage(progress, c) === 3).length;
              return (
                <button key={h.w} onClick={() => { onAdd({ text: h.w, emoji: h.e, kanaMode }); speakText(h.w, voiceOn); }}
                  className={`relative border rounded-full px-2.5 py-1 text-xs font-black transition-all active:scale-95 shadow-sm ${
                    willMaster > 0 ? 'bg-amber-100 border-amber-400 text-amber-800 ring-2 ring-amber-200' : 'bg-white border-yellow-300 text-yellow-700 hover:bg-yellow-100'
                  }`}>
                  {h.e} {h.w}
                  {willMaster > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">+{willMaster}💮</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button onClick={() => setAddOpen(true)}
        className="py-3 rounded-xl font-black text-base md:text-lg bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 text-white shadow-md border-b-4 border-amber-600 transition-all active:scale-95 active:translate-y-0.5 active:border-b-2 flex items-center justify-center gap-2 shrink-0 kkm-pop">
        <IconPlus size={20}/> あたらしい ことばを ふやす <span className="text-xl">✨</span>
      </button>

      {addOpen && (
        <WordAddModal kanaMode={kanaMode} progress={progress} usableInWords={usableInWords} list={list} voiceOn={voiceOn}
          onCancel={() => setAddOpen(false)}
          onSave={(w) => { onAdd(w); speakText(w.text, voiceOn); setAddOpen(false); }}/>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   19. <WordAddModal>
   ────────────────────────────────────────────────────────────── */
function WordAddModal({ kanaMode, progress, usableInWords, list, voiceOn, onCancel, onSave }) {
  const [text, setText] = useState('');
  const [emoji, setEmoji] = useState(EMOJI_CHOICES[0]);
  const [kindTab, setKindTab] = useState('seion');
  const table = getKanaTable(kanaMode, kindTab);
  const canSave = text.length >= 1;
  const dialogRef = useModal(onCancel);
  // この単語で💮になる数（プレビュー）
  const willMaster = useMemo(() => Array.from(new Set(text.split(''))).filter(c => getStage(progress, c) === 3), [text, progress]);
  function addChar(c) { if (text.length < 8) { setText(t => t + c); speakText(c, voiceOn); } }
  function backspace() { setText(t => t.slice(0, -1)); }
  const handleSave = useDebouncedAction(() => { if (canSave) onSave({ text, emoji, kanaMode }); }, 400);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-3" onClick={onCancel}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="あたらしい ことばを ふやす"
        className="bg-white rounded-3xl shadow-2xl border-4 border-amber-300 max-w-lg w-full max-h-[92vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center px-4 md:px-6 pt-4 md:pt-6 pb-3 shrink-0">
          <h3 className="font-black text-lg text-amber-700 flex items-center gap-2"><IconPlus size={20}/> ことばを つくろう</h3>
          <button onClick={onCancel} aria-label="とじる"
            className="w-11 h-11 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all active:scale-95 min-w-[44px] min-h-[44px]"><IconX size={18}/></button>
        </div>

        <div className="px-4 md:px-6 overflow-y-auto flex-1 min-h-0">
        <div className="bg-amber-50 rounded-2xl border-2 border-amber-200 p-3 md:p-4 mb-3 flex items-center gap-3 min-h-[80px]">
          <span className="text-4xl md:text-5xl">{emoji}</span>
          <span className="flex-1 text-2xl md:text-3xl font-black text-slate-700 break-all">
            {text || <span className="text-slate-300">なにを かこうかな？</span>}
          </span>
          {text.length > 0 && (
            <>
              <button onClick={() => speakText(text, voiceOn)} disabled={!voiceOn}
                aria-label="いまの ことばを よみあげる"
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-sky-100 text-sky-700 flex items-center justify-center transition-all active:scale-95 disabled:opacity-40">
                <IconVolume size={20}/>
              </button>
              <button onClick={backspace}
                aria-label="さいごの じを けす"
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-rose-100 text-rose-600 flex items-center justify-center transition-all active:scale-95">
                <IconX size={20}/>
              </button>
            </>
          )}
        </div>

        <div className="mb-3">
          <div className="text-xs font-black text-slate-500 mb-1.5">えもじ を えらぼう</div>
          <div className="flex flex-wrap gap-1.5">
            {EMOJI_CHOICES.map(e => (
              <button key={e} onClick={() => setEmoji(e)}
                className={`w-9 h-9 md:w-10 md:h-10 text-xl md:text-2xl rounded-lg border-2 transition-all active:scale-95 ${
                  emoji === e ? 'bg-amber-100 border-amber-400 scale-110' : 'bg-white border-slate-200'
                }`}>{e}</button>
            ))}
          </div>
        </div>

        {willMaster.length > 0 && (
          <div className="mb-2 bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-100 border-2 border-amber-400 rounded-xl px-3 py-2 text-center text-xs md:text-sm font-black text-amber-800">
            ✨ この ことばで <span className="text-rose-500 text-base">{willMaster.length}</span>こ の じが 💮 になるよ！
            <div className="mt-1 flex justify-center gap-1.5">
              {willMaster.map(c => (
                <span key={c} className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-white border-2 border-amber-400 text-amber-700 text-base">{c}</span>
              ))}
            </div>
          </div>
        )}

        <div className="mb-3">
          <div className="text-xs font-black text-slate-500 mb-1.5">じぶんで かける じだけ つかえるよ（💮 = ことばで かんぺき）</div>
          <div className="grid grid-cols-4 gap-1 mb-1.5">
            {KANA_KINDS.map(k => (
              <button key={k.key} onClick={() => setKindTab(k.key)}
                className={`py-1 rounded-lg font-black text-[10px] md:text-xs border-2 transition-all active:scale-95 ${
                  kindTab === k.key
                    ? 'bg-amber-400 text-white border-amber-500 shadow'
                    : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
                }`}>{k.short}</button>
            ))}
          </div>
          <div className="grid grid-cols-5 gap-1.5 bg-amber-50/40 p-2 rounded-xl border border-amber-100">
            {table.map((c, i) => {
              if (!c) return <div key={i} className="aspect-square"/>;
              const ok = usableInWords.includes(c);
              const stage = getStage(progress, c);
              const willPromote = stage === 3;
              return (
                <button key={i} disabled={!ok} onClick={() => addChar(c)}
                  className={`relative aspect-square rounded-lg font-black text-xl md:text-2xl border-2 transition-all active:scale-95 ${
                    ok
                      ? (willPromote
                          ? 'bg-violet-50 border-violet-400 text-violet-700 hover:bg-violet-100 shadow-sm ring-2 ring-violet-200'
                          : 'bg-white border-amber-300 text-amber-700 hover:bg-amber-100 shadow-sm')
                      : 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed opacity-60'
                  }`}>
                  {c}
                  {willPromote && <span className="absolute -top-1 -right-1 text-[10px]">✨</span>}
                  {stage === 4 && <span className="absolute -top-1 -right-1 text-[10px]">💮</span>}
                </button>
              );
            })}
          </div>
        </div>

        </div>

        <div className="flex gap-2 px-4 md:px-6 pt-3 pb-4 md:pb-6 border-t border-amber-100 bg-white rounded-b-3xl shrink-0">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl font-black text-sm bg-slate-100 text-slate-600 shadow-sm border-b-4 border-slate-300 transition-all active:scale-95 active:translate-y-0.5 active:border-b-2 min-h-[44px]">やめる</button>
          <button disabled={!canSave} onClick={handleSave}
            className="flex-[2] py-2.5 rounded-xl font-black text-base bg-amber-400 text-white shadow border-b-4 border-amber-600 transition-all active:scale-95 active:translate-y-0.5 active:border-b-2 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 min-h-[44px]">
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
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onCancel}>
      <div ref={dialogRef} role="alertdialog" aria-modal="true" aria-label="データをけしますか？"
        className="bg-white rounded-3xl shadow-2xl border-4 border-rose-300 p-6 max-w-sm w-full flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
        <div className="text-rose-500 text-5xl" aria-hidden="true">⚠️</div>
        <p className="text-base md:text-lg font-black text-slate-700 text-center leading-relaxed">
          いままで れんしゅうした<br/>データを ぜんぶ けしますか？
        </p>
        <p className="text-xs text-slate-500 font-bold">ほんとうに よろしいですか？ もとには もどせません。</p>
        <div className="flex gap-2 w-full mt-2">
          <button onClick={onCancel} autoFocus
            className="flex-1 py-2.5 rounded-xl font-black bg-slate-100 text-slate-600 shadow-sm border-b-4 border-slate-300 transition-all active:scale-95 active:translate-y-0.5 active:border-b-2 min-h-[44px]">やめる</button>
          <button onClick={guardedConfirm}
            className="flex-1 py-2.5 rounded-xl font-black bg-rose-500 text-white shadow border-b-4 border-rose-700 transition-all active:scale-95 active:translate-y-0.5 active:border-b-2 min-h-[44px]">けす</button>
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
      'したの「共有（⬆️）」ボタンを タップ',
      'メニューを したに スクロールして「ホーム画面に追加」を えらぶ',
      'みぎうえの「追加」を おすと アイコンが できます',
    ],
  },
};

function InstallGuideModal({ platform, onClose }) {
  const dialogRef = useModal(onClose);
  const guide = INSTALL_STEPS[platform] || INSTALL_STEPS.desktop;
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="アプリとして ついかする ほうほう"
        className="bg-white rounded-3xl shadow-2xl border-4 border-emerald-300 p-5 md:p-6 max-w-md w-full max-h-[85vh] overflow-y-auto flex flex-col gap-3"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <span className="text-3xl" aria-hidden="true">📲</span>
          <h2 className="text-base md:text-lg font-black text-emerald-700 flex-1">{guide.title}</h2>
        </div>
        <ol className="flex flex-col gap-2 mt-1">
          {guide.steps.map((s, i) => (
            <li key={i} className="flex gap-2 items-start bg-emerald-50 rounded-2xl p-3 border border-emerald-100">
              <span aria-hidden="true"
                className="shrink-0 w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-black flex items-center justify-center">{i + 1}</span>
              <span className="text-sm font-bold text-slate-700 leading-relaxed">{s}</span>
            </li>
          ))}
        </ol>
        <p className="text-xs text-slate-500 font-bold leading-relaxed">
          すでに インストールずみの ときは、ボタンを おしても なにも おきません。
          ランチャーや ホームがめんの アイコンから ひらいてください。
        </p>
        <button onClick={onClose} autoFocus
          className="w-full py-2.5 rounded-xl font-black bg-emerald-500 text-white shadow border-b-4 border-emerald-700 transition-all active:scale-95 active:translate-y-0.5 active:border-b-2 min-h-[44px]">
          わかった
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   21. <MainBoard>
   ────────────────────────────────────────────────────────────── */
function MainBoard({ kanaMode, setKanaMode, kanaKind, setKanaKind, progress, mastered, onAnimeViewed, onRoundComplete, onMistakeStreakReset, onStrokeCountMismatch, practiceCount, voiceOn, onGoToWords }) {
  const [currentChar, setCurrentChar] = useState(null);
  const [paths, setPaths] = useState(null);
  const [fetchError, setFetchError] = useState(false);
  const [playMode, setPlayMode] = useState('free');
  const dailyChar = useDailyChallenge(kanaMode, mastered);
  // 並行に複数のフェッチを起動した場合、最後に選んだ文字の結果だけ反映するため
  // 連番で識別する
  const fetchSeqRef = useRef(0);

  const selectChar = useCallback(async (c, mode='free') => {
    const seq = ++fetchSeqRef.current;
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

  function startSequence() {
    const list = getKanaList(kanaMode, kanaKind);
    const target = list.find(c => getStage(progress, c) < 4) || list[0];
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
    const idx = list.indexOf(currentChar);
    if (idx < 0) { return selectChar(list[0], playMode); }
    const nx  = list[(idx+1) % list.length];
    selectChar(nx, playMode);
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
      onNext={nextChar} playMode={playMode}
      practiceCount={practiceCount} voiceOn={voiceOn}
      onGoToWords={onGoToWords}
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
    <div className="flex-1 flex flex-col p-2 min-h-0 overflow-hidden gap-2 kkm-main-pad">
      {/* もじをえらぶバー（現在の文字＋表を開くボタン） */}
      <div className="shrink-0 flex items-center gap-2">
        <button onClick={() => setTableOpen(true)}
          aria-haspopup="dialog" aria-expanded={tableOpen}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl font-black text-base bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow border-b-4 border-orange-600 transition-all active:scale-95 active:translate-y-0.5 active:border-b-2 kkm-pop min-h-[48px]">
          <span className="text-xl" aria-hidden="true">🔤</span>
          {currentChar ? 'べつの もじを えらぶ' : 'もじを えらぶ'}
        </button>
        {currentChar && (
          <div className="shrink-0 flex items-center justify-center bg-white rounded-2xl w-12 h-12 border-2 border-amber-300 shadow-inner">
            <span className="text-2xl font-black text-amber-700">{currentChar}</span>
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
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}/>
      <div ref={ref}
        className="relative w-full max-h-[86vh] bg-amber-50 rounded-t-3xl shadow-2xl border-t-4 border-amber-300 flex flex-col kkm-pop-in"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="shrink-0 flex items-center justify-between px-4 pt-2 pb-1">
          <div className="mx-auto w-12 h-1.5 rounded-full bg-amber-300" aria-hidden="true"/>
          <button onClick={onClose} aria-label="とじる"
            className="absolute right-3 top-2 w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-white/80 hover:bg-white text-amber-700 flex items-center justify-center shadow active:scale-95">
            <IconX size={18}/>
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden p-3 pt-1">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   22. <App> ── ルートコンポーネント
   ────────────────────────────────────────────────────────────── */
// PWA ショートカット（manifest の ?view=...）や共有 URL から初期ビューを決める
function getInitialView() {
  try {
    const v = new URLSearchParams(window.location.search).get('view');
    if (v === 'words' || v === 'shiritori' || v === 'practice') return v;
  } catch (e) {}
  return 'practice';
}

function App() {
  const [view, setView] = useState(getInitialView);
  const [kanaMode, setKanaMode] = useState('hiragana');
  const [kanaKind, setKanaKind] = useState('seion');
  const [progress, setProgress] = useState(loadInitialProgress);
  useEffect(() => { try { localStorage.setItem(KEY_PROGRESS, JSON.stringify(progress)); } catch {} }, [progress]);
  const mastered = useMemo(() => getMasteredList(progress), [progress]);
  const usableInWords = useMemo(() => getUsableInWordsList(progress), [progress]);
  const [words, setWords]       = useLocalStorage(KEY_WORDS, []);
  const [practiceCount, setPracticeCount] = useLocalStorage(KEY_COUNT, {});
  const [earned, setEarned]     = useLocalStorage(KEY_BADGES, []);
  const [voiceOn, setVoiceOn]   = useLocalStorage(KEY_VOICE, true);
  const [resetOpen, setResetOpen] = useState(false);
  const [badgesOpen, setBadgesOpen] = useState(false);
  const [toastBadge, setToastBadge] = useState(null);
  const [wordCelebration, setWordCelebration] = useState(null); // { chars: [...] } ことばで💮になった文字
  const streak = useStreak();
  const install = useInstallPrompt();
  const [installGuideOpen, setInstallGuideOpen] = useState(false);
  // ブラウザの インストールダイアログが つかえるならそれを出し、
  // だめなら 手順の案内モーダルを出す（＝ボタンが「無反応」にならない）。
  const handleInstall = useCallback(async () => {
    const outcome = await install.promptInstall();
    if (outcome === 'unavailable') setInstallGuideOpen(true);
  }, [install.promptInstall]);

  // 音声リスト読み込み（ブラウザによっては遅延発火）
  useEffect(() => {
    if (!window.speechSynthesis) return;
    function refresh() { cachedJaVoice = null; voicesResolved = false; getJaVoice(); }
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
  useAchievements({ mastered, words, streak, setEarned,
    onNew: (b) => setToastBadge(b) });

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
  // 戻り値：{ newStage, prevStage } を呼び出し側のためにrefで返したいが、
  // setProgress内では難しいのでイベント駆動の通知はsetterで完結させる
  const onRoundComplete = useCallback((char, clean) => {
    if (!char) return;
    bumpCount(char);
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
  }, [bumpCount]);

  // 自力モードでミスした瞬間：れんぞくカウントをリセット（ラウンドの途中ミスもペナルティ）
  const onMistakeStreakReset = useCallback((char) => {
    if (!char) return;
    setProgress(prev => {
      const cur = prev[char];
      if (!cur || cur.freeStreak === 0 || cur.stage < 2) return prev;
      return { ...prev, [char]: { ...cur, freeStreak: 0 } };
    });
  }, []);

  // 画数が一致しなかったとき：採点せず、かきじゅんアニメ→なぞり書きのサイクルへ戻す
  const onStrokeCountMismatch = useCallback((char) => {
    if (!char) return;
    setProgress(prev => {
      const cur = prev[char];
      if (!cur) return prev;
      return { ...prev, [char]: { ...cur, stage: 0, traced: 0, freeStreak: 0, sawAnime: false } };
    });
  }, []);

  const addWord = useCallback((w) => {
    setWords(prev => [...prev, { id: Date.now() + Math.random(), ...w, date: Date.now() }]);
    playPickup();
    // ことばに使った文字のうち、ステージ3だったものをステージ4へ昇格
    const chars = Array.from(new Set((w.text || '').split('')));
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
          setWordCelebration({ chars: advanced, text: w.text });
        }, 50);
      }
      return next;
    });
  }, [setWords]);
  const deleteWord = useCallback((id) => {
    setWords(prev => prev.filter(w => w.id !== id));
  }, [setWords]);
  const resetAll = () => { localStorage.clear(); window.location.reload(); };

  return (
    <div className="h-screen flex flex-col kkm-app-bg overflow-hidden relative kkm-app-root" style={{ fontFamily: "'UD デジタル 教科書体 N-R', 'UD Digi Kyokasho N-R', 'UD デジタル 教科書体 NK-R', 'UD Digi Kyokasho NK-R', 'Klee One', 'Hiragino Maru Gothic ProN', 'Yu Gothic', sans-serif", fontWeight: 600 }}>
      <canvas id="confettiCanvas" className="fixed inset-0 pointer-events-none z-[400]"/>
      <Header view={view} setView={setView} mastered={mastered}
        onReset={() => setResetOpen(true)}
        onOpenBadges={() => setBadgesOpen(true)}
        streak={streak} voiceOn={voiceOn} setVoiceOn={setVoiceOn}
        earnedCount={earned.length}
        showInstall={!install.standalone} installReady={install.canPrompt}
        onInstall={handleInstall}/>
      <ModeTabsMobile view={view} setView={setView}/>

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {view === 'practice' && (
          <MainBoard kanaMode={kanaMode} setKanaMode={setKanaMode}
            kanaKind={kanaKind} setKanaKind={setKanaKind}
            progress={progress} mastered={mastered}
            onAnimeViewed={onAnimeViewed}
            onRoundComplete={onRoundComplete}
            onMistakeStreakReset={onMistakeStreakReset}
            onStrokeCountMismatch={onStrokeCountMismatch}
            practiceCount={practiceCount} voiceOn={voiceOn}
            onGoToWords={() => setView('words')}/>
        )}
        {view === 'words' && (
          <div className="flex-1 p-3 md:p-4 min-h-0 overflow-hidden">
            <WordCollection kanaMode={kanaMode} setKanaMode={setKanaMode}
              progress={progress} mastered={mastered} usableInWords={usableInWords}
              words={words}
              onAdd={addWord} onDelete={deleteWord} voiceOn={voiceOn}/>
          </div>
        )}
        {view === 'shiritori' && (
          <ShiritoriGame words={words} voiceOn={voiceOn}/>
        )}
      </main>

      <Footer/>

      {installGuideOpen && <InstallGuideModal platform={install.platform} onClose={() => setInstallGuideOpen(false)}/>}
      {resetOpen   && <ResetModal onCancel={() => setResetOpen(false)} onConfirm={resetAll}/>}
      {badgesOpen  && <AchievementsModal earned={earned} mastered={mastered} words={words} streak={streak}
                          onClose={() => setBadgesOpen(false)}/>}
      {toastBadge  && <BadgeToast badge={toastBadge} onClose={() => setToastBadge(null)}/>}
      {wordCelebration && <WordMasterPopup info={wordCelebration} onClose={() => setWordCelebration(null)}/>}
      {storageWarn && (
        <div role="alert"
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[500] bg-rose-100 border-2 border-rose-400 text-rose-800 font-black rounded-2xl px-4 py-3 shadow-2xl max-w-sm flex items-start gap-2 kkm-pop-in">
          <span className="text-2xl" aria-hidden="true">⚠️</span>
          <div className="flex-1">
            <div className="text-sm">ほぞん が できませんでした</div>
            <div className="text-xs font-bold opacity-80 mt-0.5">ブラウザの ようりょうが いっぱいです。ことばを すこし けして みてください。</div>
          </div>
          <button onClick={() => setStorageWarn(false)} aria-label="とじる"
            className="w-8 h-8 min-w-[32px] min-h-[32px] rounded-full bg-white/70 hover:bg-white text-rose-600 flex items-center justify-center active:scale-95">
            <IconX size={16}/>
          </button>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   23. レンダリング
   ────────────────────────────────────────────────────────────── */
ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
