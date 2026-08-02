/* ==============================================================
   ひらがな・カタカナ かきかたマスター ＋ ことばあつめ
   --------------------------------------------------------------
   小学１年生のための、ひらがな・カタカナ反復練習＋単語収集アプリ

   ＜たのしさUPの追加機能＞
   - 音声よみあげ（タップで読んでくれる）
   - マスコット「ことりせんせい」のおうえん
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

// ★カスタマイズポイント: 「ことばあつめ」のヒント
const WORD_HINTS_HIRA = [
  { w:'あめ', p:'sweet' }, { w:'いぬ', p:'dog' }, { w:'うみ', p:'water' }, { w:'えき', p:'train' },
  { w:'おに', p:'person' }, { w:'かに', p:'octopus' }, { w:'きく', p:'flower' }, { w:'くも', p:'cloud' },
  { w:'こま', p:'tool' }, { w:'さくら', p:'flower' }, { w:'すいか', p:'fruit' }, { w:'そら', p:'cloud' },
  { w:'たこ', p:'octopus' }, { w:'つき', p:'moon' }, { w:'にじ', p:'rainbow' }, { w:'はな', p:'flower' },
  { w:'ふね', p:'ship' }, { w:'ほし', p:'star' }, { w:'みず', p:'water' }, { w:'もも', p:'fruit' },
  { w:'やま', p:'mountain' }, { w:'ゆき', p:'snow' }, { w:'りんご', p:'fruit' }, { w:'れもん', p:'fruit' },
  // 濁音
  { w:'ぞう', p:'animal' }, { w:'でんわ', p:'tool' }, { w:'ぶどう', p:'fruit' }, { w:'かばん', p:'bag' },
  { w:'だんご', p:'sweet' }, { w:'べんとう', p:'rice' },
  // 半濁音
  { w:'ぱんだ', p:'animal' }, { w:'えんぴつ', p:'pencil' }, { w:'ぷりん', p:'sweet' }, { w:'たんぽぽ', p:'flower' },
  // 拗音・促音
  { w:'ちょう', p:'bug' }, { w:'きって', p:'tool' }, { w:'でんしゃ', p:'train' }, { w:'がっこう', p:'school' },
];
const WORD_HINTS_KATA = [
  { w:'アイス', p:'sweet' }, { w:'イルカ', p:'fish' }, { w:'ウサギ', p:'rabbit' }, { w:'エビ', p:'octopus' },
  { w:'オムレツ', p:'rice' }, { w:'カバ', p:'animal' }, { w:'キリン', p:'animal' }, { w:'クマ', p:'animal' },
  { w:'ケーキ', p:'sweet' }, { w:'コアラ', p:'animal' }, { w:'サメ', p:'fish' }, { w:'シマウマ', p:'animal' },
  { w:'スイカ', p:'fruit' }, { w:'タコ', p:'octopus' }, { w:'チーズ', p:'rice' }, { w:'トマト', p:'vegetable' },
  { w:'ネコ', p:'cat' }, { w:'ヘビ', p:'animal' }, { w:'バナナ', p:'fruit' }, { w:'ライオン', p:'animal' },
  // 濁音
  { w:'ゴリラ', p:'animal' }, { w:'ダチョウ', p:'bird' }, { w:'ブタ', p:'animal' }, { w:'ゾウ', p:'animal' },
  // 半濁音
  { w:'パンダ', p:'animal' }, { w:'ピアノ', p:'music' }, { w:'プリン', p:'sweet' }, { w:'ペンギン', p:'bird' },
  // 拗音・促音
  { w:'チョコ', p:'sweet' }, { w:'コップ', p:'drink' }, { w:'ジャム', p:'fruit' },
];

// 「ことばを つくろう」でこどもが えらべる さしえ
const PICT_CHOICES = [
  'fruit','sweet','rice','drink','vegetable',
  'dog','cat','rabbit','bird','fish',
  'octopus','bug','animal','flower','tree',
  'leaf','star','moon','sun','cloud',
  'rain','snow','rainbow','mountain','water',
  'car','train','ship','plane','house',
  'school','book','pencil','ball','music',
  'person','heart','bag','cloth','tool',
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

// コンピュータがしりとりで使う単語リスト（ひらがな）
const SHIRITORI_CPU_WORDS = [
  {w:'あり',p:'bug'},{w:'あひる',p:'bird'},{w:'あさ',p:'sun'},{w:'あき',p:'leaf'},{w:'あかい',p:'heart'},
  {w:'いか',p:'octopus'},{w:'いちご',p:'fruit'},{w:'いえ',p:'house'},{w:'いし',p:'mountain'},{w:'いもうと',p:'person'},
  {w:'うし',p:'animal'},{w:'うちわ',p:'tool'},{w:'うさぎ',p:'rabbit'},{w:'うた',p:'music'},{w:'うで',p:'person'},
  {w:'えき',p:'train'},{w:'えんぴつ',p:'pencil'},{w:'えほん',p:'book'},{w:'えび',p:'octopus'},{w:'えいが',p:'tool'},
  {w:'おに',p:'person'},{w:'おかし',p:'sweet'},{w:'おつき',p:'moon'},{w:'おはな',p:'flower'},{w:'おおかみ',p:'animal'},
  {w:'かに',p:'octopus'},{w:'かめ',p:'animal'},{w:'かさ',p:'rain'},{w:'かえる',p:'animal'},{w:'かぜ',p:'cloud'},{w:'かわ',p:'water'},
  {w:'きつね',p:'animal'},{w:'きのこ',p:'vegetable'},{w:'きりん',p:'animal'},{w:'きく',p:'flower'},{w:'きじ',p:'bird'},
  {w:'くじら',p:'fish'},{w:'くり',p:'vegetable'},{w:'くるま',p:'car'},{w:'くも',p:'cloud'},{w:'くさ',p:'leaf'},
  {w:'けむり',p:'cloud'},{w:'けいと',p:'tool'},{w:'けが',p:'tool'},{w:'けむし',p:'bug'},
  {w:'こうもり',p:'animal'},{w:'こども',p:'person'},{w:'こうえん',p:'tree'},{w:'こおり',p:'snow'},{w:'こま',p:'tool'},{w:'こころ',p:'heart'},
  {w:'さかな',p:'fish'},{w:'さる',p:'animal'},{w:'さんぽ',p:'person'},{w:'さくら',p:'flower'},{w:'さとう',p:'sweet'},{w:'さむい',p:'snow'},
  {w:'しか',p:'animal'},{w:'しろ',p:'house'},{w:'しお',p:'rice'},{w:'したぎ',p:'cloth'},{w:'しんかんせん',p:'train'},
  {w:'すずめ',p:'bird'},{w:'すみれ',p:'flower'},{w:'すいか',p:'fruit'},{w:'すもう',p:'person'},{w:'すな',p:'mountain'},{w:'すき',p:'heart'},
  {w:'せみ',p:'bug'},{w:'せかい',p:'star'},{w:'せんせい',p:'person'},{w:'せっけん',p:'tool'},{w:'せわ',p:'person'},
  {w:'そら',p:'cloud'},{w:'そうじ',p:'tool'},{w:'そと',p:'leaf'},{w:'そり',p:'snow'},{w:'そば',p:'rice'},
  {w:'たこ',p:'octopus'},{w:'たぬき',p:'animal'},{w:'たまご',p:'rice'},{w:'たき',p:'water'},{w:'たいよう',p:'sun'},{w:'たか',p:'bird'},
  {w:'ちょう',p:'bug'},{w:'ちきゅう',p:'star'},{w:'ちゃわん',p:'drink'},{w:'ちから',p:'person'},
  {w:'つき',p:'moon'},{w:'つる',p:'bird'},{w:'つみき',p:'tool'},{w:'つばさ',p:'bird'},{w:'つち',p:'leaf'},{w:'つゆ',p:'rain'},
  {w:'てんき',p:'cloud'},{w:'てがみ',p:'pencil'},{w:'てんとう',p:'bug'},{w:'てつ',p:'tool'},{w:'てら',p:'house'},
  {w:'とり',p:'bird'},{w:'とら',p:'animal'},{w:'とまと',p:'vegetable'},{w:'とうふ',p:'rice'},{w:'とかげ',p:'animal'},{w:'ともだち',p:'person'},
  {w:'なみ',p:'water'},{w:'なし',p:'fruit'},{w:'なつ',p:'sun'},{w:'なまこ',p:'octopus'},{w:'なわ',p:'tool'},
  {w:'にじ',p:'rainbow'},{w:'にわ',p:'leaf'},{w:'にんじん',p:'vegetable'},{w:'にく',p:'rice'},{w:'にわとり',p:'bird'},{w:'にほん',p:'mountain'},
  {w:'ぬの',p:'cloth'},{w:'ぬいぐるみ',p:'tool'},{w:'ぬりえ',p:'pencil'},
  {w:'ねこ',p:'cat'},{w:'ねずみ',p:'animal'},{w:'ねんど',p:'tool'},{w:'ねむい',p:'moon'},
  {w:'のり',p:'leaf'},{w:'のはら',p:'leaf'},{w:'のこぎり',p:'tool'},{w:'のみもの',p:'drink'},
  {w:'はな',p:'flower'},{w:'はと',p:'bird'},{w:'はし',p:'tool'},{w:'はる',p:'flower'},{w:'はりねずみ',p:'animal'},{w:'はやし',p:'tree'},
  {w:'ひよこ',p:'bird'},{w:'ひつじ',p:'animal'},{w:'ひこうき',p:'plane'},{w:'ひかり',p:'light'},{w:'ひまわり',p:'flower'},{w:'ひみつ',p:'person'},
  {w:'ふね',p:'ship'},{w:'ふくろう',p:'bird'},{w:'ふうせん',p:'ball'},{w:'ふゆ',p:'snow'},{w:'ふで',p:'pencil'},{w:'ふじさん',p:'mountain'},
  {w:'へび',p:'animal'},{w:'へや',p:'house'},{w:'へいわ',p:'heart'},{w:'へそ',p:'person'},
  {w:'ほし',p:'star'},{w:'ほたる',p:'light'},{w:'ほおずき',p:'light'},{w:'ほんや',p:'book'},{w:'ほね',p:'tool'},
  {w:'まつ',p:'tree'},{w:'まくら',p:'cloth'},{w:'まめ',p:'vegetable'},{w:'まち',p:'house'},{w:'まいにち',p:'book'},{w:'まぐろ',p:'fish'},
  {w:'みず',p:'water'},{w:'みかん',p:'fruit'},{w:'みつばち',p:'bug'},{w:'みち',p:'tool'},{w:'みそしる',p:'drink'},{w:'みんな',p:'person'},
  {w:'むし',p:'bug'},{w:'むらさき',p:'shape'},{w:'むすび',p:'rice'},{w:'むかし',p:'book'},{w:'むぎ',p:'leaf'},
  {w:'めだか',p:'fish'},{w:'めがね',p:'tool'},{w:'めがみ',p:'person'},{w:'めし',p:'rice'},{w:'めいろ',p:'book'},
  {w:'もも',p:'fruit'},{w:'もり',p:'tree'},{w:'もぐら',p:'animal'},{w:'もち',p:'sweet'},{w:'もくば',p:'tool'},{w:'もみじ',p:'leaf'},
  {w:'やすみ',p:'moon'},{w:'やま',p:'mountain'},{w:'やね',p:'house'},{w:'やかん',p:'drink'},{w:'やど',p:'house'},
  {w:'ゆき',p:'snow'},{w:'ゆび',p:'person'},{w:'ゆうひ',p:'sun'},{w:'ゆかた',p:'cloth'},{w:'ゆめ',p:'moon'},{w:'ゆか',p:'tree'},
  {w:'よる',p:'moon'},{w:'よこ',p:'shape'},{w:'よつば',p:'leaf'},{w:'よみもの',p:'book'},
  {w:'らいおん',p:'animal'},{w:'らっこ',p:'octopus'},{w:'らくだ',p:'animal'},{w:'らくがき',p:'pencil'},
  {w:'りんご',p:'fruit'},{w:'りす',p:'animal'},{w:'りゅう',p:'animal'},{w:'りか',p:'tool'},
  {w:'るすばん',p:'tool'},{w:'るりいろ',p:'shape'},
  {w:'れもん',p:'fruit'},{w:'れんこん',p:'vegetable'},{w:'れっしゃ',p:'train'},{w:'れいぞうこ',p:'snow'},{w:'れんしゅう',p:'pencil'},
  {w:'ろうそく',p:'light'},{w:'ろば',p:'animal'},{w:'ろけっと',p:'plane'},{w:'ろうか',p:'school'},
  {w:'わに',p:'animal'},{w:'わかめ',p:'leaf'},{w:'わたあめ',p:'sweet'},{w:'わかば',p:'leaf'},{w:'わらい',p:'person'},{w:'わすれもの',p:'bag'},
];

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
  yamabuki: { text:'text-yamabuki-700', icon:'text-yamabuki-600', chip:'bg-yamabuki-50 text-yamabuki-700 border-yamabuki-300', solid:'bg-yamabuki-600 border-yamabuki-700', topRule:'border-t-yamabuki-600', leftRule:'border-yamabuki-400 border-l-yamabuki-600', markRing:'border-yamabuki-300 text-yamabuki-600', stat:'bg-yamabuki-50 border-yamabuki-200', statLabel:'text-yamabuki-600', statValue:'text-yamabuki-700' },
  sumi:     { text:'text-sumi-700',     icon:'text-sumi-500',     chip:'bg-sumi-50 text-sumi-600 border-sumi-300',        solid:'bg-sumi-600 border-sumi-700',         topRule:'border-t-sumi-600',     leftRule:'border-sumi-400 border-l-sumi-600',         markRing:'border-sumi-300 text-sumi-500',    stat:'bg-sumi-50 border-sumi-200',         statLabel:'text-sumi-600',     statValue:'text-sumi-700' },
};

/* 学習の 4 だんかい。画面のどこでも おなじ 順番・おなじ 色・おなじ しるし
   で見えるように、名まえ・色・アイコンを ここに一元化する。
   ・num   … 見出しにつける漢数字（教科書の「一 二 三 四」）
   ・icon  … UI アイコンの名まえ（ICONS のキー）
   ・tone  … TONES のキー */
const STAGE_INFO = [
  { key: 0, num: '',  icon: 'lock',   label: 'みがくぜん',   tone: 'sumi'   },
  { key: 1, num: '一', icon: 'play',   label: 'かきじゅん',   tone: 'ai'     },
  { key: 2, num: '二', icon: 'brush',  label: 'なぞりがき',   tone: 'midori' },
  { key: 3, num: '三', icon: 'pen',    label: 'じぶんでかく', tone: 'fuji'   },
  { key: 4, num: '四', icon: 'maru',   label: 'かんぺき',     tone: 'shu'    },
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
   1.9. 画面の色（キャンバス用）

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
const playPingPong = () => { initAudio(); playTone(659.25, 'sine', 0.15, 0.1); setTimeout(() => playTone(880, 'sine', 0.3, 0.1), 100); };
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
   ちゃんと 0 点に近づく。 */
const SHAPE_N = 24;          // くらべる点の数（お手本のサンプル数とそろえる）
const SHAPE_FREE = 0.03;     // これくらいのズレは 1年生なら ふつう（減点しない）
const SHAPE_SPAN = 0.13;     // ここまで離れると 0 点（マスの 1/8 ほど）
const SHAPE_SHIFT_CAP = 0.045; // 打ち消してよい「字ぜんたいの平行移動」の上限
function evalShape(usrPolys, tplPolys) {
  const n = Math.min(usrPolys.length, tplPolys.length);
  if (n === 0) return 0;
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
    pairs.push([up, tp]);
    for (let k = 0; k < SHAPE_N; k++) { dx += up[k].x - tp[k].x; dy += up[k].y - tp[k].y; m++; }
  }
  if (pairs.length === 0 || m === 0) return 0;
  dx /= m; dy /= m;
  // 打ち消すのは「すこしのズレ」まで。字ぜんたいが大きくずれているのは
  // かたち以前の問題なので、ここでも きちんと点が下がるようにする。
  const shift = Math.hypot(dx, dy);
  if (shift > SHAPE_SHIFT_CAP) { const k = SHAPE_SHIFT_CAP / shift; dx *= k; dy *= k; }

  // ② 平行移動ぶんを取りのぞいて、線どうしの離れぐあいをはかる
  const perStroke = [];
  for (const [up, tp] of pairs) {
    let mean = 0, worst = 0;
    for (let k = 0; k < SHAPE_N; k++) {
      const d = Math.hypot(up[k].x - dx - tp[k].x, up[k].y - dy - tp[k].y);
      mean += d;
      if (d > worst) worst = d;
    }
    mean /= SHAPE_N;
    // ふだんのズレ（平均）と、いちばん外れたところ（最大）の両方を見る。
    // 平均が良くても 1 か所だけ大きく外れていれば、そのぶん下がる。
    const meanScore  = clamp01(1 - (mean  - SHAPE_FREE) / SHAPE_SPAN);
    const worstScore = clamp01(1 - (worst - SHAPE_FREE * 2) / (SHAPE_SPAN * 2.2));
    perStroke.push(0.75 * meanScore + 0.25 * worstScore);
  }
  // 画ごとの点は「ならし」だけでなく「いちばん悪い画」も見る。
  // ならしだけだと、3画のうち 2画が上手なら 1画がまるで違っていても
  // 隠れてしまう。1画でも大きくずれていれば ちゃんと点が下がるようにする。
  const avg = perStroke.reduce((a, b) => a + b, 0) / perStroke.length;
  const worstStroke = Math.min(...perStroke);
  return 0.72 * avg + 0.28 * worstStroke;
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
    case 'shape':     return ok ? 'お手本の せんに もうすこし ちかづけよう' : 'お手本を よく みて、せんの かたちを まねしよう';
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
    { key: 'shape',     label: 'せんの かたち',     max: 30, raw: evalShape(usrPolys, tplPolys) },
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
  return { total, breakdown, comment, passed: total >= 60 };
}

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
// ちいさく出すときは 花びらを へらして線を太くする。
// 花びらが 8 枚のままだと 15px くらいでは つぶれて 歯車のように見えてしまう。
const HANAMARU_LARGE = { d: hanamaruPath(8, 31, 13), w: 5.5, r: 15 };
const HANAMARU_SMALL = { d: hanamaruPath(5, 27, 18), w: 7,   r: 11 };

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
      <circle cx="50" cy="50" r={s.r} className={draw ? 'kkm-draw' : undefined}
              style={draw ? { '--kkm-dash': Math.ceil(2 * Math.PI * s.r) + 4, '--kkm-draw-dur': `${duration * 0.6}s`, '--kkm-draw-delay': `${duration * 0.75}s` } : undefined}/>
    </svg>
  );
}

/* 名まえから UI アイコンを引く（STAGE_INFO などの設定から使う） */
const ICONS = {
  lock: IconLock, play: IconPlay, brush: IconBrush, pen: IconPen, maru: IconMaru,
  check: IconCheck, star: IconStar, trophy: IconTrophy, book: IconBook, pencil: IconPencil,
};

/* ──────────────────────────────────────────────────────────────
   6. <Mascot> ── 「ことりせんせい」が声をかける

   絵文字のひよこは使わず、線だけで描いた ことり にした。
   きもち（mood）で 目・口・うごきだけが変わり、形はいつも同じ。
   ────────────────────────────────────────────────────────────── */
const MASCOT_MOODS = {
  happy: { anim: 'kkm-float',   eye: 'dot',   beakUp: false },
  cheer: { anim: 'kkm-breathe', eye: 'dot',   beakUp: true  },
  wow:   { anim: 'kkm-breathe', eye: 'wide',  beakUp: true  },
  sad:   { anim: '',            eye: 'droop', beakUp: false },
};
function MascotFace({ size = 40, mood = 'happy' }) {
  const m = MASCOT_MOODS[mood] || MASCOT_MOODS.happy;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false"
         className={m.anim}>
      {/* からだ */}
      <path d="M24 43c-8.3 0-15-6.3-15-14.5S15.7 14 24 14s15 6.3 15 14.5S32.3 43 24 43z"
            fill="#faf7f0" stroke="#443f38" strokeWidth="2.2" strokeLinejoin="round"/>
      {/* あたまの毛 */}
      <path d="M24 14V8M24 8c-1.6-1.8-1.3-3.8.7-5 .8 2 .4 3.7-.7 5z"
            stroke="#443f38" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {/* つばさ */}
      <path d="M11.5 27c2.6 1 4 3.2 4.2 6.5-2.6-.4-4.2-2.5-4.2-6.5zM36.5 27c-2.6 1-4 3.2-4.2 6.5 2.6-.4 4.2-2.5 4.2-6.5z"
            fill="#f4cec2" stroke="#443f38" strokeWidth="1.8" strokeLinejoin="round"/>
      {/* め */}
      {m.eye === 'wide' ? (
        <><circle cx="19" cy="25" r="2.6" fill="#443f38"/><circle cx="29" cy="25" r="2.6" fill="#443f38"/>
          <circle cx="19.9" cy="24" r=".9" fill="#fff"/><circle cx="29.9" cy="24" r=".9" fill="#fff"/></>
      ) : m.eye === 'droop' ? (
        <path d="M16.6 25.6q2.4-2.4 4.8 0M26.6 25.6q2.4-2.4 4.8 0"
              stroke="#443f38" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
      ) : (
        <><circle cx="19" cy="25" r="1.9" fill="#443f38"/><circle cx="29" cy="25" r="1.9" fill="#443f38"/></>
      )}
      {/* くちばし */}
      {m.beakUp
        ? <path d="M21 30h6l-3 3.4z" fill="#b34328" stroke="#93331e" strokeWidth="1.4" strokeLinejoin="round"/>
        : <path d="M21.5 30.5h5l-2.5 2.8z" fill="#b34328" stroke="#93331e" strokeWidth="1.4" strokeLinejoin="round"/>}
      {/* ほっぺ */}
      <circle cx="15.4" cy="29.5" r="2" fill="#f4cec2"/><circle cx="32.6" cy="29.5" r="2" fill="#f4cec2"/>
    </svg>
  );
}
function Mascot({ message, mood = 'happy', size = 'normal' }) {
  const px = size === 'small' ? 34 : 52;
  return (
    <div className="flex items-center gap-2">
      <div className="shrink-0"><MascotFace size={px} mood={mood}/></div>
      {message && (
        <div key={message}
          className="relative bg-white border border-shu-200 rounded-lg px-2.5 py-1.5 shadow-sm kkm-pop-in min-w-0">
          {/* ふきだしの しっぽ */}
          <span aria-hidden="true"
            className="absolute left-[-5px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rotate-45 bg-white border-l border-b border-shu-200"/>
          <span className="relative text-[11px] md:text-sm font-semibold text-sumi-700 leading-snug">{message}</span>
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
      className={`kkm-btn hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold ${lv.color}`}>
      <Pict name={lv.icon} size={15}/><span>{lv.title}</span>
    </button>
  );
}
function StreakBadge({ streak }) {
  if (streak <= 0) return null;
  return (
    <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-shu-50 text-shu-700 border border-shu-200 text-xs font-semibold tabular-nums"
         title={`${streak}にち れんぞくで れんしゅうちゅう`}>
      <IconCalendar size={13}/>{streak}<span className="hidden md:inline">にち</span>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   8. <Header>
   ────────────────────────────────────────────────────────────── */
// 上下のタブ（もじをかく／ことばずかん／しりとり）はここ 1 か所で定義する。
// パソコンのヘッダーと スマホの下タブで、順番も名まえも かならず そろう。
const VIEW_TABS = [
  { key: 'practice',  label: 'もじをかく',   Icon: IconPencil },
  { key: 'words',     label: 'ことばずかん', Icon: IconBook   },
  { key: 'shiritori', label: 'しりとり',     Icon: IconLink   },
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

function Header({ view, setView, mastered, onReset, onOpenBadges, streak, voiceOn, setVoiceOn, earnedCount, showInstall, installReady, onInstall }) {
  return (
    <nav className="shrink-0 bg-white/95 backdrop-blur border-b-2 border-shu-600 px-3 md:px-5 py-1.5 md:py-2 flex justify-between items-center z-10 gap-2 relative">
      {/* 左：しるし + アプリ名。せまい画面では名前のほうを縮める（タブは縮めない）。 */}
      <div className="flex items-center gap-2 md:gap-2.5 min-w-0 shrink">
        <AppSeal size={34}/>
        <h1 className="text-[13px] md:text-lg font-semibold leading-tight truncate text-sumi-800 tracking-wide">
          ひらがな・カタカナ<br className="md:hidden"/><span className="hidden md:inline"> </span>かきかたマスター
        </h1>
      </div>

      {/* 中央：ビュー切替（教科書のインデックスのように、朱の下線でいまの場所を示す） */}
      <div className="hidden sm:flex items-end gap-1 self-stretch shrink-0 -mb-1.5 md:-mb-2">
        {VIEW_TABS.map(t => {
          const on = view === t.key;
          return (
            <button key={t.key} onClick={() => setView(t.key)} aria-current={on ? 'page' : undefined}
              className={`kkm-btn relative flex items-center gap-1.5 px-2.5 lg:px-4 pt-2 pb-2.5 text-sm font-semibold rounded-t-md whitespace-nowrap ${
                on ? 'text-shu-700 bg-shu-50' : 'text-sumi-500 hover:text-shu-600 hover:bg-washi-100'
              }`}>
              <t.Icon size={16}/> {t.label}
              {on && <span aria-hidden="true" className="kkm-underline absolute left-2 right-2 bottom-0 h-[3px] rounded-full bg-shu-600"/>}
            </button>
          );
        })}
      </div>

      {/* 右：ステータス類 */}
      <div className="flex items-center gap-1.5 shrink-0">
        {showInstall && (
          <button onClick={onInstall} title="この がめんを アプリとして ついかする"
            aria-label="この がめんを アプリとして ついかする"
            className={`kkm-btn kkm-ripple flex items-center gap-1.5 px-2.5 md:px-3 h-10 min-h-[40px] rounded-md bg-midori-600 text-white text-xs md:text-sm font-semibold border border-midori-700 ${installReady ? 'kkm-pulse-ring' : ''}`}>
            <IconDownload size={16}/>
            <span className="hidden sm:inline">アプリにする</span>
          </button>
        )}
        <span className="hidden xl:block"><StreakBadge streak={streak}/></span>
        <LevelBadge masteredCount={mastered.length} onClick={onOpenBadges}/>
        <button onClick={onOpenBadges} title="ごほうびの はんこ" aria-label="ごほうびの はんこ ずかん を ひらく"
          className="kkm-btn relative w-11 h-11 min-w-[44px] min-h-[44px] rounded-md bg-yamabuki-50 hover:bg-yamabuki-100 text-yamabuki-700 border border-yamabuki-200 flex items-center justify-center">
          <IconTrophy size={19}/>
          {earnedCount > 0 && (
            <span aria-hidden="true" className="absolute -top-1.5 -right-1.5 bg-shu-600 text-white text-[10px] font-semibold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 tabular-nums">{earnedCount}</span>
          )}
        </button>
        <button onClick={() => setVoiceOn(v => !v)}
          title={voiceOn ? 'おとを オフにする' : 'おとを オンにする'}
          aria-label={voiceOn ? 'おとを オフにする' : 'おとを オンにする'}
          aria-pressed={voiceOn}
          className={`kkm-btn w-11 h-11 min-w-[44px] min-h-[44px] rounded-md flex items-center justify-center border ${
            voiceOn ? 'bg-ai-50 text-ai-700 border-ai-200 hover:bg-ai-100' : 'bg-sumi-50 text-sumi-400 border-sumi-200 hover:bg-sumi-100'
          }`}>
          {voiceOn ? <IconVolume size={19}/> : <IconVolumeX size={19}/>}
        </button>
        <button onClick={onReset} title="データをリセット" aria-label="れんしゅうデータをリセット"
          className="kkm-btn w-11 h-11 min-w-[44px] min-h-[44px] rounded-md bg-sumi-50 hover:bg-shu-50 text-sumi-500 hover:text-shu-600 border border-sumi-200 flex items-center justify-center">
          <IconSettings size={19}/>
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
    <footer className="shrink-0 w-full bg-white border-t border-sumi-200 py-1 text-center text-[10px] md:text-xs text-sumi-500 font-medium">
      ©2026 ひらがな・カタカナかきかたマスター ・
      <a href="https://note.com/cute_borage86" target="_blank" rel="noopener noreferrer"
         className="text-shu-700 hover:text-shu-800 hover:underline ml-1">GIGA山</a>
    </footer>
  );
}

/* ──────────────────────────────────────────────────────────────
   10. <ModeTabsMobile>
   ────────────────────────────────────────────────────────────── */
function ModeTabsMobile({ view, setView }) {
  return (
    <div className="sm:hidden flex bg-white border-b border-sumi-200 relative z-10">
      {VIEW_TABS.map(t => {
        const on = view === t.key;
        return (
          <button key={t.key} onClick={() => setView(t.key)} aria-current={on ? 'page' : undefined}
            className={`kkm-btn relative flex-1 flex items-center justify-center gap-1 py-2 text-xs font-semibold ${
              on ? 'text-shu-700 bg-shu-50' : 'text-sumi-500'
            }`}>
            <t.Icon size={14}/> {t.label}
            {on && <span aria-hidden="true" className="kkm-underline absolute left-3 right-3 bottom-0 h-[3px] rounded-full bg-shu-600"/>}
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
      <h2 className="kkm-heading-rule text-sm md:text-base font-semibold text-sumi-800 truncate">{children}</h2>
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

/* 五十音表の 行（ぎょう）の見出し。「あ行」「か行」のように、
   教科書とおなじ かたまりで もじを つかめるようにする。 */
function rowLabelOf(rowChars) {
  const filled = rowChars.filter(Boolean);
  if (filled.length === 0) return '';
  const leader = filled[0];
  if (filled.length === 1 && (leader === 'ん' || leader === 'ン')) return leader;
  return leader + '行';
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
    <div className="kkm-sheet rounded-lg p-2 md:p-3 flex flex-col h-full min-h-0">
      {/* ① どの文字を学ぶか：ひらがな／カタカナ */}
      <div className="flex gap-1.5 mb-1.5 shrink-0">
        <button onClick={() => setKanaMode('hiragana')} aria-pressed={kanaMode === 'hiragana'}
          className={`kkm-btn kkm-ripple flex-1 py-1.5 md:py-2 rounded-md font-semibold text-sm md:text-base border ${
            kanaMode === 'hiragana' ? 'bg-shu-600 text-white border-shu-700' : 'bg-washi-100 text-sumi-500 border-sumi-200 hover:bg-washi-200'
          }`}>ひらがな</button>
        <button onClick={() => setKanaMode('katakana')} aria-pressed={kanaMode === 'katakana'}
          className={`kkm-btn kkm-ripple flex-1 py-1.5 md:py-2 rounded-md font-semibold text-sm md:text-base border ${
            kanaMode === 'katakana' ? 'bg-ai-600 text-white border-ai-700' : 'bg-washi-100 text-sumi-500 border-sumi-200 hover:bg-washi-200'
          }`}>カタカナ</button>
      </div>

      {/* ② どの しゅるい を学ぶか：せいおん／だくおん／はんだくおん／ようおん */}
      <div className="grid grid-cols-4 gap-1 mb-2 shrink-0">
        {KANA_KINDS.map(k => (
          <button key={k.key} onClick={() => setKanaKind(k.key)} aria-pressed={kanaKind === k.key} title={k.label}
            className={`kkm-btn py-1 md:py-1.5 rounded-md font-semibold text-[10px] md:text-xs border leading-tight ${
              kanaKind === k.key
                ? 'bg-shu-50 text-shu-700 border-shu-400'
                : 'bg-white text-sumi-500 border-sumi-200 hover:bg-washi-100'
            }`}>
            <span className="block md:hidden">{k.short}</span>
            <span className="hidden md:block truncate px-0.5">{k.label}</span>
          </button>
        ))}
      </div>

      {/* ③ この表の しんちょく（花丸になった もじの かず） */}
      <div className="shrink-0 mb-2 kkm-progress-row">
        <div className="flex items-center justify-between text-[10px] md:text-xs font-semibold text-sumi-600 mb-1">
          <span className="flex items-center gap-1 text-shu-700"><Hanamaru size={15}/> かんぺき</span>
          <span aria-live="polite" className="tabular-nums">{doneCount} / {totalCount}{allDone ? '　ぜんぶ！' : ''}</span>
        </div>
        <div className="h-2 rounded-full bg-washi-300 overflow-hidden"
          role="progressbar" aria-valuemin="0" aria-valuemax={totalCount} aria-valuenow={doneCount}
          aria-label={`かんぺきに なった もじ ${doneCount} / ${totalCount}`}>
          <div className={`h-full rounded-full transition-all duration-500 ${allDone ? 'bg-yamabuki-400 kkm-sheen' : 'bg-shu-500'}`}
            style={{ width: `${pct}%` }}/>
        </div>
      </div>

      {/* ④ 五十音表 */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-washi-100 rounded-md p-1.5 md:p-2.5 border border-sumi-200">
        <div className="max-w-sm mx-auto flex flex-col gap-1 md:gap-1.5">
          {rows.map((row, r) => (
            <div key={r} className="flex items-center gap-1 md:gap-1.5">
              {showRowLabels && (
                <div aria-hidden="true"
                  className="shrink-0 w-6 md:w-8 text-[9px] md:text-[11px] font-semibold text-sumi-400 text-center leading-none select-none">
                  {rowLabelOf(row)}
                </div>
              )}
              <div className="flex-1 grid grid-cols-5 gap-1 md:gap-1.5">
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
                      className={`kkm-glyph kkm-btn aspect-square rounded-md text-lg md:text-2xl border relative ${cls} ${extra}`}>
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

        {/* 学習だんかいの はんれい（この色は なにを あらわすか） */}
        <div className="mt-2.5 pt-2 border-t border-sumi-200 flex flex-wrap justify-center gap-x-2.5 gap-y-1 text-[9px] md:text-[10px] font-semibold px-1">
          {STAGE_INFO.slice(1).map(s => (
            <span key={s.key} className={`inline-flex items-center gap-1 ${TONES[s.tone].icon}`}>
              <StageMark stage={s.key}/>{s.label}
            </span>
          ))}
        </div>
      </div>

      {/* ⑤ まとめて れんしゅうする */}
      <div className="flex gap-1.5 mt-2 shrink-0">
        <button onClick={onSequence}
          className="kkm-btn kkm-ripple flex-1 py-2 rounded-md font-semibold text-xs md:text-sm bg-white text-sumi-700 border border-sumi-300 hover:border-shu-400 hover:text-shu-700 flex items-center justify-center gap-1.5 min-h-[40px]">
          <IconArrow size={15}/> あいうえお<span className="hidden md:inline">じゅん</span>
        </button>
        <button onClick={onRandom}
          className="kkm-btn kkm-ripple flex-1 py-2 rounded-md font-semibold text-xs md:text-sm bg-white text-sumi-700 border border-sumi-300 hover:border-shu-400 hover:text-shu-700 flex items-center justify-center gap-1.5 min-h-[40px]">
          <IconShuffle size={15}/> ばらばら
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
  if (stage === 3) return 'あと ひといき！ ことばを 1こ あつめて 花丸に しよう';
  return '花丸！ もう いちど かいてみる？';
}

function PracticeBoard({ char, paths, stageObj, onAnimeViewed, onRoundComplete, onMistakeStreakReset, onStrokeCountMismatch, practiceCount, voiceOn, onGoToWords, fetchError, onRetryFetch }) {
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
  function restart() {
    clearResetTimer();
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
    clearResetTimer();
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
    <div className="kkm-sheet rounded-lg p-2 md:p-3 flex flex-col h-full min-h-0 kkm-practice-board">
      <div className="flex justify-between items-center mb-1.5 shrink-0 gap-2 kkm-board-header">
        <span className={`text-[10px] md:text-sm font-semibold px-2 md:px-2.5 py-1 rounded-md truncate border ${
          isTraceMode ? 'text-midori-700 bg-midori-50 border-midori-200' : 'text-fuji-700 bg-fuji-50 border-fuji-200'
        }`}>
          {char ? (isTraceMode ? `「${char}」を なぞって かこう` : `「${char}」を じぶんで かこう`) : 'もじを えらんでください'}
        </span>
        {char && (
          <span className="text-[10px] md:text-xs font-semibold text-sumi-500 bg-washi-100 border border-sumi-200 px-2 py-1 rounded-md shrink-0 tabular-nums">
            {practiceCount[char] || 0} かい
          </span>
        )}
      </div>

      {/* 学習ステップ（いま どのだんかいか） */}
      {char && (
        <StageStepper stage={stage} stageObj={stageObj}/>
      )}

      {char && (
        <div className="mb-1.5 shrink-0 kkm-practice-mascot">
          <Mascot message={mascotMsg} mood={mascotMood} size="small"/>
        </div>
      )}

      {/* かきとりのマス（原稿用紙のマス目のイメージ） */}
      <div className="flex-1 flex items-center justify-center min-h-0 min-w-0 relative w-full kkm-square-fit-container">
        <div className={`relative bg-white rounded-md border-2 overflow-hidden kkm-square-fit ${
              shaking ? 'border-shu-500 kkm-shake' : 'border-shu-300'
            }`}>
          <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-shu-200 pointer-events-none z-[5]"/>
          <div className="absolute left-1/2 top-0 bottom-0 border-l border-dashed border-shu-200 pointer-events-none z-[5]"/>
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
            <div className="absolute inset-0 flex flex-col items-center justify-center text-sumi-300 gap-2 pointer-events-none" aria-label="もじを えらんでください">
              <IconGrid size={44}/>
              <span className="text-xs font-semibold">もじを えらんでください</span>
            </div>
          )}
          {char && paths === null && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-shu-600 z-[30] pointer-events-none gap-2" role="status" aria-live="polite">
              <div className="kkm-float"><MascotFace size={40} mood="happy"/></div>
              <div className="text-xs font-semibold text-sumi-500">よみこみちゅう…</div>
            </div>
          )}
          {char && fetchError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/92 z-[30] gap-2 p-4 text-center" role="alert">
              <span className="text-sumi-400"><IconWifiOff size={34}/></span>
              <div className="text-sm font-semibold text-shu-700">よみこめなかったよ</div>
              <div className="text-xs text-sumi-500 font-medium">インターネットが つながって いるか たしかめてね</div>
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
          className="kkm-cta-btn kkm-btn kkm-ripple mt-1.5 py-2 px-3 rounded-md bg-shu-50 text-shu-800 font-semibold text-xs md:text-sm border border-shu-300 flex items-center justify-center gap-2 shrink-0">
          <Hanamaru size={17}/> ことばを 1こ あつめて 花丸に しよう
          <IconArrow size={15}/>
        </button>
      )}

      <div className="flex gap-1.5 mt-2 shrink-0 kkm-practice-buttons">
        <button onClick={restart} disabled={!char}
          aria-label="ここまでの れんしゅうを やりなおす"
          className="kkm-btn kkm-ripple flex-1 py-2 rounded-md font-semibold text-xs md:text-sm bg-white text-sumi-600 border border-sumi-300 hover:border-sumi-400 disabled:opacity-40 flex items-center justify-center gap-1.5 min-h-[44px]">
          <IconRotate size={15}/> やりなおし
        </button>
        <button onClick={() => char && speakText(char, voiceOn)} disabled={!char || !voiceOn}
          aria-label={char ? `${char} を よみあげる`: 'もじを よみあげる'}
          className="kkm-btn kkm-ripple flex-1 py-2 rounded-md font-semibold text-xs md:text-sm bg-white text-midori-700 border border-midori-300 hover:bg-midori-50 disabled:opacity-40 flex items-center justify-center gap-1.5 min-h-[44px]">
          <IconVolume size={15}/> よんで
        </button>
        <button onClick={() => paths && paths.length > 0 && setShowAnime(true)} disabled={!char || !paths || paths.length === 0}
          aria-label="かきじゅんを みる"
          className="kkm-btn kkm-ripple flex-1 py-2 rounded-md font-semibold text-xs md:text-sm bg-white text-ai-700 border border-ai-300 hover:bg-ai-50 disabled:opacity-40 flex items-center justify-center gap-1.5 min-h-[44px]">
          <IconPlay size={15}/> かきじゅん
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
      className="kkm-cta-btn kkm-btn kkm-ripple mt-1.5 py-2.5 px-3 rounded-md bg-shu-600 text-white font-semibold text-sm md:text-base border border-shu-700 flex items-center justify-center gap-2 shrink-0 disabled:opacity-60 min-h-[44px]">
      <IconCheck size={17}/> かけた！ さいてんする
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
function StageStepper({ stage, stageObj }) {
  const steps = [
    { idx: 1, label: 'かきじゅん' },
    { idx: 2, label: 'なぞる',   sub: `${Math.min(stageObj?.traced || 0, TRACE_REQUIRED)}/${TRACE_REQUIRED}` },
    { idx: 3, label: 'じぶんで', sub: `${Math.min(stageObj?.freeStreak || 0, FREE_REQUIRED)}/${FREE_REQUIRED}` },
    { idx: 4, label: 'ことば' },
  ];
  return (
    <ol className="flex items-stretch mb-2 shrink-0 text-[10px] md:text-xs font-semibold kkm-stepper-row"
        aria-label="学習の ステップ">
      {steps.map((s, i) => {
        const info = STAGE_INFO[s.idx];
        const done = stage >= s.idx;
        const active = !done && (stage + 1 === s.idx);
        const Icon = ICONS[info.icon] || IconMaru;
        const cls = done
          ? TONES[info.tone].chip
          : active
            ? 'bg-white text-sumi-700 border-shu-400 ring-1 ring-shu-200'
            : 'bg-washi-100 text-sumi-300 border-sumi-200';
        return (
          <li key={i} className="flex-1 flex items-center min-w-0" aria-current={active ? 'step' : undefined}>
            <div className={`flex-1 rounded-md border px-1 py-1 text-center min-w-0 transition-colors duration-300 ${cls}`}>
              <div className="flex items-center justify-center gap-1 leading-none">
                <span className="kkm-glyph text-[10px] md:text-xs opacity-70">{info.num}</span>
                {done && s.idx >= 4
                  ? <span className="text-shu-600"><Hanamaru size={14}/></span>
                  : done ? <IconCheck size={13}/> : <Icon size={13}/>}
              </div>
              <div className="leading-tight mt-0.5 truncate">{s.label}</div>
              {s.sub && !done && active && <div className="text-[9px] tabular-nums opacity-70">{s.sub}</div>}
            </div>
            {/* だんかいを つなぐ線（すすんだところは 朱色になる） */}
            {i < steps.length - 1 && (
              <span aria-hidden="true"
                className={`w-1.5 md:w-2 h-[2px] shrink-0 transition-colors duration-300 ${stage > s.idx ? 'bg-shu-400' : 'bg-sumi-200'}`}/>
            )}
          </li>
        );
      })}
    </ol>
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
    2: { num: '二', title: 'なぞり クリア', sub: 'つぎは じぶんで かいてみよう', tone: 'midori' },
    3: { num: '三', title: 'ほぼ マスター', sub: 'ことばを 1こ あつめれば 花丸！', tone: 'fuji' },
    4: { num: '四', title: 'かんぺき',     sub: 'ほんとうに じぶんの じに なったよ', tone: 'shu' },
  };
  const m = msgMap[info.to];
  if (!m) return null;
  const t = TONES[m.tone];
  return (
    <div className={`fixed inset-x-0 top-0 z-[180] pointer-events-none flex justify-center transition-all duration-300 pt-3 md:pt-5 ${
      show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'
    }`}>
      <div className={`bg-white px-5 md:px-7 py-3 md:py-4 rounded-lg shadow-lg border border-l-4 ${t.leftRule} max-w-sm mx-3 text-center pointer-events-auto`}>
        <div className="flex items-center justify-center gap-2">
          {/* はんこを おした演出 */}
          <span className={`kkm-stamp shrink-0 w-9 h-9 rounded-md border text-white flex items-center justify-center ${t.solid}`}>
            {info.to >= 4 ? <Hanamaru size={22} color="#fff"/> : <span className="kkm-glyph text-lg leading-none">{m.num}</span>}
          </span>
          <div className="text-left">
            <div className={`text-base md:text-xl font-semibold ${t.text}`}>{m.title}</div>
            <div className="text-[11px] md:text-sm font-medium text-sumi-600 mt-0.5">{m.sub}</div>
          </div>
        </div>
        {info.to === 3 && onGoToWords && (
          <button onClick={onGoToWords}
            className="kkm-btn kkm-ripple mt-2.5 w-full px-4 py-2 rounded-md bg-fuji-600 text-white font-semibold text-sm border border-fuji-700 flex items-center justify-center gap-1.5">
            ことばずかんへ <IconArrow size={15}/>
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
        className="bg-white rounded-lg shadow-xl border border-sumi-300 border-t-4 border-t-ai-600 p-3 md:p-5 max-w-md w-full my-auto kkm-pop-in" onClick={(e) => { e.stopPropagation(); }}>
        <div className="flex justify-between items-center mb-2 md:mb-3">
          <h3 className="kkm-heading-rule text-sm md:text-base font-semibold text-sumi-800">「{char}」の かきじゅん</h3>
          <button onClick={onClose} aria-label="とじる"
            className="kkm-btn w-11 h-11 rounded-md bg-sumi-50 hover:bg-sumi-100 border border-sumi-200 text-sumi-600 flex items-center justify-center min-w-[44px] min-h-[44px]"><IconX size={18}/></button>
        </div>
        <div className="aspect-square bg-white rounded-md border-2 border-shu-200 relative overflow-hidden mb-3 mx-auto" style={{ maxHeight: 'min(70vh, 70dvh)', maxWidth: '100%', width: 'min(70vh, 70dvh, 100%)' }}>
          <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-shu-200"/>
          <div className="absolute left-1/2 top-0 bottom-0 border-l border-dashed border-shu-200"/>
          <svg ref={svgRef} viewBox="0 0 109 109" className="w-full h-full relative z-10"/>
        </div>
        <div className="flex gap-3 items-center">
          <button onClick={play} disabled={playing}
            className="kkm-btn kkm-ripple px-5 py-2.5 rounded-md font-semibold text-white bg-ai-600 border border-ai-700 disabled:opacity-50 flex items-center gap-1.5 min-h-[44px]">
            <IconPlay size={17}/> {playing ? 'さいせいちゅう' : 'みる'}
          </button>
          <div className="flex-1">
            <label className="sr-only" htmlFor="kkm-anime-speed">アニメの はやさ</label>
            <input id="kkm-anime-speed" type="range" min="1" max="10" value={speed} onChange={(e) => setSpeed(+e.target.value)} className="w-full"/>
            <div className="flex justify-between text-[10px] text-sumi-500 font-semibold mt-0.5"><span>ゆっくり</span><span>はやい</span></div>
          </div>
        </div>
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
  // 教科書の評価と同じ しるし。花丸 ＞ ◎ ＞ ○ ＞ △
  const rank = total >= 90 ? 'hanamaru' : total >= 70 ? '◎' : total >= 50 ? '○' : '△';
  const t = TONES[passed ? 'shu' : 'ai'];
  // うちわけの しるし（できた／もうすこし／がんばろう）
  const markFor = (s) => s === 'good' ? '◎' : s === 'ok' ? '○' : '△';
  const markToneFor = (s) => s === 'good' ? 'text-shu-600' : s === 'ok' ? 'text-midori-600' : 'text-sumi-400';

  return (
    <div
      className={`fixed inset-0 z-[170] flex items-center justify-center transition-all duration-300 bg-sumi-900/25 p-3 ${
        show ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
      } pointer-events-auto`}
      onClick={close}
      role="dialog" aria-modal="true" aria-label={`さいてんけっか ${total} てん`}
    >
      <div className={`bg-white px-5 md:px-8 py-4 md:py-5 rounded-lg shadow-xl border border-sumi-300 border-t-4 ${t.topRule} text-center pointer-events-auto max-w-md w-full`}
           onClick={(e) => e.stopPropagation()}>
        {/* 赤ペンの しるし */}
        <div className="flex items-center justify-center h-16 md:h-20">
          {rank === 'hanamaru'
            ? <span className={t.icon}><Hanamaru size={72} draw duration={0.6}/></span>
            : <span className={`kkm-stamp kkm-glyph text-6xl md:text-7xl leading-none ${t.icon}`}>{rank}</span>}
        </div>
        <div className={`text-base md:text-lg font-semibold mt-1 ${t.text}`}>{comment}</div>
        <div className="mt-1 flex items-baseline justify-center gap-1 text-sumi-800">
          <span className="text-4xl md:text-5xl font-semibold tabular-nums">{total}</span>
          <span className="text-base md:text-lg font-semibold text-sumi-500">/ 100 てん</span>
        </div>
        {!detail && (
          <div className="mt-3 flex justify-center gap-2">
            <button onClick={(e) => { e.stopPropagation(); setDetail(true); }}
              className="kkm-btn kkm-ripple px-4 py-2 rounded-md bg-white border border-sumi-300 text-sumi-700 text-xs md:text-sm font-semibold min-h-[44px] flex items-center gap-1.5">
              <IconSearch size={15}/> くわしく みる
            </button>
            <button onClick={(e) => { e.stopPropagation(); close(); }}
              className={`kkm-btn kkm-ripple px-5 py-2 rounded-md border text-white text-xs md:text-sm font-semibold min-h-[44px] ${t.solid}`}>
              とじる
            </button>
          </div>
        )}
        {detail && (
          <div className="mt-3 bg-washi-100 border border-sumi-200 rounded-md p-3 text-left text-sumi-700">
            <div className="kkm-heading-rule text-[11px] md:text-xs font-semibold mb-2">さいてんの うちわけ</div>
            <ul className="divide-y divide-sumi-200">
              {breakdown.map(b => (
                <li key={b.key} className="flex items-center gap-2 text-xs md:text-sm py-1.5">
                  <span className={`kkm-glyph text-lg md:text-xl w-6 text-center leading-none ${markToneFor(b.status)}`}>{markFor(b.status)}</span>
                  <span className="font-semibold w-24 md:w-32 shrink-0">{b.label}</span>
                  <span className="font-semibold tabular-nums w-10 md:w-12 shrink-0 text-right">{b.score}/{b.max}</span>
                  <span className="text-[10px] md:text-xs text-sumi-500 flex-1">{b.advice}</span>
                </li>
              ))}
            </ul>
            <button onClick={(e) => { e.stopPropagation(); close(); }}
              className="kkm-btn mt-3 w-full px-4 py-2 rounded-md bg-white border border-sumi-300 text-xs md:text-sm font-semibold text-sumi-600 min-h-[40px]">
              とじる
            </button>
          </div>
        )}
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
          <div className="text-[11px] md:text-sm font-semibold text-shu-700 mb-2">ことばに つかって 花丸に なりました</div>
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
        <div className="flex justify-between items-center mb-4">
          <h2 className="kkm-heading-rule text-base md:text-lg font-semibold text-sumi-800 flex items-center gap-2">
            <IconTrophy size={20}/> ごほうびの はんこずかん
          </h2>
          <button onClick={onClose} aria-label="とじる"
            className="kkm-btn w-11 h-11 rounded-md bg-sumi-50 hover:bg-sumi-100 border border-sumi-200 text-sumi-600 flex items-center justify-center min-w-[44px] min-h-[44px]"><IconX size={18}/></button>
        </div>

        {/* いまの しょうごう */}
        <div className={`rounded-md border p-3 mb-3 ${lv.color}`}>
          <div className="flex items-center gap-3">
            <div className="shrink-0"><Pict name={lv.icon} size={34}/></div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-semibold opacity-70">いまの しょうごう</div>
              <div className="text-base md:text-lg font-semibold truncate">{lv.title}</div>
            </div>
            <div className="text-right text-xs font-semibold shrink-0">
              <div className="tabular-nums">{mastered.length} じ</div>
              {nextLv && <div className="opacity-70 tabular-nums">つぎ：あと {nextLv.min - mastered.length} じ</div>}
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
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
          {BADGES.map(b => {
            const has = earned.includes(b.id);
            return (
              <div key={b.id}
                className={`rounded-md border p-2.5 flex flex-col items-center text-center ${
                  has ? 'bg-yamabuki-50 border-yamabuki-300 kkm-lift'
                      : 'bg-washi-100 border-sumi-200'
                }`}>
                <div className={has ? 'text-yamabuki-700' : 'text-sumi-300'}>
                  {has ? <Pict name={b.icon} size={30}/> : <IconLock size={26}/>}
                </div>
                <div className={`text-[11px] font-semibold mt-1.5 ${has ? 'text-sumi-800' : 'text-sumi-400'}`}>{b.title}</div>
                <div className="text-[9px] text-sumi-500 mt-0.5 leading-snug">{b.desc}</div>
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
        <span className="text-[10px] font-semibold text-sumi-500 tabular-nums shrink-0">
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
                built ? 'text-shu-600 opacity-100' : 'text-sumi-300 opacity-50'
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

  function updateBest(len) {
    if (len > bestChain) {
      setBestChain(len);
      safeLocalStorageSet(KEY_SIRI_BEST, String(len));
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
    speakText(start.w, voiceOn);
  }

  function playerPlay(wordObj) {
    if (gameState !== 'playing' || thinking) return;

    const newUsed = new Set([...usedWords, wordObj.text]);
    const lastChar = getLastChar(wordObj.text);
    const newChain = [...chain, { word: wordObj.text, pict: pictOf(wordObj), isPlayer: true }];

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
    clearCpuTimer();
    cpuTimerRef.current = setTimeout(() => {
      cpuTimerRef.current = 0;
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
      const newChain2 = [...newChain, { word: pick.w, pict: pick.p, isPlayer: false }];

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
    clearCpuTimer();
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

  return (
    <div className="flex-1 p-2 md:p-4 min-h-0 overflow-hidden flex flex-col gap-3">
      <div className="kkm-sheet rounded-lg p-3 md:p-4 flex flex-col h-full overflow-hidden gap-3">

        <SectionTitle right={bestChain > 0 && (
          <span className="text-xs font-semibold text-yamabuki-700 bg-yamabuki-50 border border-yamabuki-200 rounded-md px-2.5 py-1 shrink-0 tabular-nums">
            さいこう {bestChain}こ
          </span>
        )}>しりとり</SectionTitle>

        {gameState === 'idle' && hiraganaWords.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-4">
            <MascotFace size={56} mood="sad"/>
            <p className="font-semibold text-sumi-700 text-sm md:text-base">ひらがなの ことばが まだ ありません</p>
            <p className="text-xs text-sumi-500 leading-relaxed">「ことばずかん」で ことばを あつめてから<br/>あそんでください</p>
            <div className="flex items-center gap-2 bg-washi-100 border border-sumi-200 rounded-md p-2.5 text-[11px] text-sumi-600 font-semibold">
              <IconBulb size={15}/> ことばが おおいほど しりとりに つよくなります
            </div>
          </div>
        )}

        {gameState === 'idle' && hiraganaWords.length > 0 && (
          <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center gap-4 text-center px-2 py-2">
            <MascotFace size={56} mood="cheer"/>
            <p className="font-semibold text-sumi-800 text-base">コンピュータと しりとりを しましょう</p>
            {/* あそびかた：番号つきで じゅんに 読める形にする */}
            <ol className="bg-washi-100 border border-sumi-200 rounded-md p-3 text-sm text-sumi-700 text-left max-w-xs w-full space-y-2">
              <li className="kkm-heading-rule text-xs font-semibold text-sumi-800 !border-l-shu-600 mb-1">あそびかた</li>
              {[
                'コンピュータが さいしょの ことばを いいます',
                'その さいごの もじから はじまる「あつめた ことば」を えらびます',
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
            </div>
            <button onClick={startGame}
              className="kkm-btn kkm-ripple px-10 py-3 rounded-md font-semibold text-lg bg-shu-600 text-white border border-shu-700 flex items-center gap-2">
              <IconPlay size={18}/> はじめる
            </button>
          </div>
        )}

        {gameState === 'playing' && (
          <>
            <div ref={chainRef} className="flex-1 overflow-y-auto space-y-2 min-h-0 bg-washi-100 rounded-md p-2 border border-sumi-200">
              {chain.map((entry, i) => (
                <div key={i} className={`flex items-end gap-2 kkm-rise-in ${entry.isPlayer ? 'flex-row-reverse' : 'flex-row'}`}>
                  <span className="text-[10px] text-sumi-400 font-semibold shrink-0 mb-1">{entry.isPlayer ? 'あなた' : 'コンピュータ'}</span>
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold max-w-[68%] border ${
                    entry.isPlayer
                      ? 'bg-shu-600 text-white border-shu-700 rounded-br-sm'
                      : 'bg-white border-sumi-200 text-sumi-700 rounded-bl-sm'
                  }`}>
                    <Pict name={entry.pict} size={20} className="shrink-0"/>
                    <span className="kkm-glyph text-base">{entry.word}</span>
                    {i < chain.length - 1 && (
                      <span className="kkm-glyph text-[11px] opacity-70 ml-0.5">→{getLastChar(entry.word)}</span>
                    )}
                  </div>
                </div>
              ))}
              {thinking && (
                <div className="flex items-end gap-2">
                  <span className="text-[10px] text-sumi-400 font-semibold mb-1">コンピュータ</span>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-sumi-200 text-sumi-400 text-sm font-semibold rounded-bl-sm">
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
                  <div className="flex flex-wrap gap-2 justify-center max-h-[26vh] overflow-y-auto p-0.5">
                    {playableWords.map(w => (
                      <button key={w.id} onClick={() => playerPlay(w)}
                        aria-label={`${w.text} を こたえる`}
                        className="kkm-btn kkm-ripple flex items-center gap-1.5 px-3.5 py-2 rounded-md font-semibold bg-white border border-sumi-300 text-sumi-800 hover:border-shu-400 hover:text-shu-700 min-h-[44px]">
                        <Pict name={pictOf(w)} size={20}/>
                        <span className="kkm-glyph text-base">{w.text}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="bg-shu-50 border border-shu-200 rounded-md p-3 text-center">
                    <p className="font-semibold text-shu-700 mb-1 text-sm">「{currentChar}」から はじまる ことばが ありません</p>
                    <p className="text-[11px] text-sumi-600 mb-2">「ことばずかん」で「{currentChar}」から はじまる ことばを あつめましょう</p>
                    <button onClick={forfeit}
                      className="kkm-btn px-4 py-2 rounded-md bg-white border border-sumi-300 text-sumi-600 font-semibold text-sm min-h-[40px]">まけを みとめる</button>
                  </div>
                )}
                <div className="text-center text-[11px] text-sumi-500 font-semibold tabular-nums">
                  てふだ {hiraganaWords.length}こ ／ つなげた {chain.length}こ
                </div>
              </div>
            )}
          </>
        )}

        {gameState === 'won' && (
          <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center gap-3 text-center px-2">
            <span className="text-shu-600"><Hanamaru size={92} draw duration={0.7}/></span>
            <p className="font-semibold text-xl text-shu-700">かちました！</p>
            <div className="bg-washi-100 border border-sumi-200 rounded-md p-3 w-full max-w-xs">
              <p className="text-xs text-sumi-600 font-semibold mb-2">つなげた ながさ <span className="text-2xl text-shu-700 tabular-nums">{chain.length}</span>こ</p>
              <ChainSummary/>
            </div>
            <button onClick={startGame}
              className="kkm-btn kkm-ripple px-8 py-2.5 rounded-md font-semibold bg-shu-600 text-white border border-shu-700">
              もう いちど あそぶ
            </button>
          </div>
        )}

        {gameState === 'lost' && (
          <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center gap-3 text-center px-2">
            <MascotFace size={56} mood="sad"/>
            <p className="font-semibold text-lg text-sumi-700">まけちゃった…</p>
            <div className="bg-washi-100 border border-sumi-200 rounded-md p-3 w-full max-w-xs">
              <p className="text-xs text-sumi-600 font-semibold mb-2">つなげた ながさ <span className="text-2xl text-ai-700 tabular-nums">{chain.length}</span>こ</p>
              <ChainSummary/>
            </div>
            {hiraganaWords.length < 15 && (
              <div className="flex items-start gap-2 bg-white border border-sumi-200 rounded-md p-2.5 text-[11px] font-semibold text-sumi-600 max-w-xs text-left">
                <span className="text-yamabuki-600 shrink-0 mt-0.5"><IconBulb size={15}/></span>
                <span>ことばを もっと あつめると つよくなれます。<br/>
                  <span className="text-sumi-500 font-medium tabular-nums">いま {hiraganaWords.length}こ → もくひょう 15こ</span></span>
              </div>
            )}
            <button onClick={startGame}
              className="kkm-btn kkm-ripple px-8 py-2.5 rounded-md font-semibold bg-shu-600 text-white border border-shu-700">
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
function WordCollection({ kanaMode, setKanaMode, progress, usableInWords, words, onAdd, onDelete, voiceOn }) {
  const [addOpen, setAddOpen] = useState(false);
  const collected = words.filter(w => w.kanaMode === kanaMode);
  const hints = kanaMode === 'katakana' ? WORD_HINTS_KATA : WORD_HINTS_HIRA;
  const availableHints = hints.filter(h => h.w.split('').every(c => usableInWords.includes(c)) && !words.some(w => w.text === h.w));
  // ステージ3（あと一歩で花丸）の文字一覧 — モチベーション用
  const almostChars = (kanaMode === 'katakana' ? KATA_ALL_LIST : HIRA_ALL_LIST).filter(c => getStage(progress, c) === 3);

  return (
    <div className="kkm-sheet rounded-lg p-3 md:p-4 flex flex-col h-full overflow-hidden">
      <SectionTitle className="mb-3"
        right={
          <div className="flex rounded-md border border-sumi-200 overflow-hidden shrink-0">
            <button onClick={() => setKanaMode('hiragana')} aria-pressed={kanaMode === 'hiragana'}
              className={`kkm-btn px-3 py-1.5 text-xs md:text-sm font-semibold ${
                kanaMode === 'hiragana' ? 'bg-shu-600 text-white' : 'bg-white text-sumi-500'
              }`}>ひらがな</button>
            <button onClick={() => setKanaMode('katakana')} aria-pressed={kanaMode === 'katakana'}
              className={`kkm-btn px-3 py-1.5 text-xs md:text-sm font-semibold border-l border-sumi-200 ${
                kanaMode === 'katakana' ? 'bg-ai-600 text-white' : 'bg-white text-sumi-500'
              }`}>カタカナ</button>
          </div>
        }>
        あつめた ことば
        <span className="ml-2 text-xs font-semibold text-sumi-500 tabular-nums">{collected.length}こ</span>
      </SectionTitle>

      <WordTown wordCount={words.length}/>

      <div className="flex-1 overflow-y-auto bg-washi-100 rounded-md p-3 border border-sumi-200 mb-3">
        {collected.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-sumi-500 gap-3 py-10 text-center">
            <Mascot message="まだ ことばが ありません" mood="cheer"/>
            <p className="text-xs">したの「あたらしい ことばを ふやす」から ついかしましょう</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-2.5">
            {collected.slice().reverse().map(w => (
              <div key={w.id} className="bg-white rounded-md border border-sumi-200 p-3 flex flex-col items-center gap-1.5 relative group kkm-lift kkm-pop-in">
                <span className="text-shu-600 group-hover:text-shu-700 transition-colors"><Pict name={pictOf(w)} size={34}/></span>
                <button onClick={() => speakText(w.text, voiceOn)} disabled={!voiceOn}
                  aria-label={voiceOn ? `${w.text} を よみあげる` : `${w.text}`}
                  className="kkm-glyph kkm-btn text-lg text-sumi-800 hover:text-shu-700 disabled:cursor-default">
                  {w.text}
                </button>
                <button onClick={() => onDelete(w.id)}
                  aria-label={`${w.text} を けす`}
                  className="kkm-btn absolute top-1 right-1 w-8 h-8 min-w-[32px] min-h-[32px] rounded-md text-sumi-400 opacity-60 md:opacity-0 md:group-hover:opacity-100 hover:bg-shu-50 hover:text-shu-600 flex items-center justify-center">
                  <IconTrash size={14}/>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* あと ひといきで 花丸になる もじ */}
      {almostChars.length > 0 && (
        <div className="bg-fuji-50 border border-fuji-200 rounded-md p-2.5 mb-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-fuji-700 mb-1.5">
            <IconPen size={14}/> この じを ことばに つかうと 花丸に なります
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

      <button onClick={() => setAddOpen(true)}
        className="kkm-btn kkm-ripple py-3 rounded-md font-semibold text-base bg-shu-600 text-white border border-shu-700 flex items-center justify-center gap-2 shrink-0 min-h-[48px]">
        <IconPlus size={19}/> あたらしい ことばを ふやす
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
  const [pict, setPict] = useState(PICT_CHOICES[0]);
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
            {text || <span className="text-sumi-300 text-lg">なにを かこうかな？</span>}
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

        {/* ② さしえを えらぶ */}
        <div className="mb-3">
          <div className="kkm-heading-rule text-xs font-semibold text-sumi-600 mb-1.5">さしえを えらぶ</div>
          <div className="grid grid-cols-8 sm:grid-cols-10 gap-1 max-h-[128px] overflow-y-auto p-0.5">
            {PICT_CHOICES.map(name => (
              <button key={name} onClick={() => setPict(name)} aria-pressed={pict === name} aria-label={name}
                className={`kkm-btn aspect-square rounded-md border flex items-center justify-center ${
                  pict === name ? 'bg-shu-50 border-shu-500 text-shu-700' : 'bg-white border-sumi-200 text-sumi-500 hover:border-shu-300'
                }`}><Pict name={name} size={20}/></button>
            ))}
          </div>
        </div>

        {willMaster.length > 0 && (
          <div className="mb-3 bg-shu-50 border border-shu-300 rounded-md px-3 py-2 text-center text-xs md:text-sm font-semibold text-shu-800 kkm-pop-in">
            <span className="inline-flex items-center gap-1.5">
              <Hanamaru size={16}/> この ことばで <span className="text-base tabular-nums">{willMaster.length}</span>この じが 花丸に なります
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
            もじを えらぶ<span className="font-medium text-sumi-500">（じぶんで かける じだけ つかえます）</span>
          </div>
          <div className="grid grid-cols-4 gap-1 mb-1.5">
            {KANA_KINDS.map(k => (
              <button key={k.key} onClick={() => setKindTab(k.key)} aria-pressed={kindTab === k.key} title={k.label}
                className={`kkm-btn py-1.5 rounded-md font-semibold text-[10px] md:text-xs border ${
                  kindTab === k.key
                    ? 'bg-shu-50 text-shu-700 border-shu-400'
                    : 'bg-white text-sumi-500 border-sumi-200 hover:bg-washi-100'
                }`}>
                <span className="block md:hidden">{k.short}</span>
                <span className="hidden md:block truncate px-0.5">{k.mid}</span>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-5 gap-1.5 bg-washi-100 p-2 rounded-md border border-sumi-200">
            {table.map((c, i) => {
              if (!c) return <div key={i} className="aspect-square"/>;
              const ok = usableInWords.includes(c);
              const stage = getStage(progress, c);
              const willPromote = stage === 3;
              return (
                <button key={i} disabled={!ok} onClick={() => addChar(c)}
                  aria-label={`${c}${willPromote ? '（つかうと 花丸に なります）' : ''}`}
                  className={`kkm-glyph kkm-btn relative aspect-square rounded-md text-xl md:text-2xl border ${
                    ok
                      ? (willPromote
                          ? 'bg-fuji-50 border-fuji-400 text-fuji-700 hover:bg-fuji-100'
                          : 'bg-white border-sumi-300 text-sumi-700 hover:border-shu-300')
                      : 'bg-sumi-50 border-sumi-200 text-sumi-300 cursor-not-allowed'
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
        <p className="text-xs text-sumi-500 font-medium text-center">もとには もどせません。</p>
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
          <span className="text-midori-700"><IconDownload size={22}/></span>
          <h2 className="text-base font-semibold text-sumi-800 flex-1">{guide.title}</h2>
        </div>
        <ol className="flex flex-col gap-2 mt-1">
          {guide.steps.map((s, i) => (
            <li key={i} className="flex gap-2.5 items-start bg-washi-100 rounded-md p-3 border border-sumi-200">
              <span aria-hidden="true"
                className="shrink-0 w-6 h-6 rounded-full bg-midori-600 text-white text-xs font-semibold flex items-center justify-center">{i + 1}</span>
              <span className="text-sm font-medium text-sumi-700 leading-relaxed">{s}</span>
            </li>
          ))}
        </ol>
        <p className="text-xs text-sumi-500 font-medium leading-relaxed">
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
          className="kkm-btn kkm-ripple flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md font-semibold text-base bg-shu-600 text-white border border-shu-700 min-h-[48px]">
          <IconGrid size={18}/>
          {currentChar ? 'べつの もじを えらぶ' : 'もじを えらぶ'}
        </button>
        {currentChar && (
          <div className="shrink-0 flex items-center justify-center bg-white rounded-md w-12 h-12 border border-shu-300">
            <span className="kkm-glyph text-2xl text-shu-700">{currentChar}</span>
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
        className="relative w-full max-h-[86vh] bg-washi-100 rounded-t-lg shadow-2xl border-t-4 border-shu-600 flex flex-col kkm-sheet-up"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="shrink-0 flex items-center justify-between px-4 pt-2 pb-1">
          <div className="mx-auto w-12 h-1.5 rounded-full bg-sumi-300" aria-hidden="true"/>
          <button onClick={onClose} aria-label="とじる"
            className="kkm-btn absolute right-3 top-2 w-10 h-10 min-w-[40px] min-h-[40px] rounded-md bg-white border border-sumi-200 text-sumi-600 flex items-center justify-center">
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
  // 「さいしょから」＝このアプリの記録だけを消す。
  // localStorage.clear() は gigayama.github.io というサイト全体の保存を消すので、
  // 同じサイトに置いた他のアプリ（けいさんカードなど）の学習記録まで
  // 巻きぞえで消えてしまう。必ず kkm 接頭辞の付いたキーだけを削除すること。
  const resetAll = () => {
    try {
      const mine = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(STORAGE_PREFIX)) mine.push(k);
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
              progress={progress} usableInWords={usableInWords}
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
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[500] bg-white border border-shu-400 border-l-4 border-l-shu-600 text-sumi-800 rounded-lg px-4 py-3 shadow-xl max-w-sm flex items-start gap-2.5 kkm-pop-in">
          <span className="text-shu-600 shrink-0 mt-0.5" aria-hidden="true"><IconAlert size={20}/></span>
          <div className="flex-1">
            <div className="text-sm font-semibold">ほぞん が できませんでした</div>
            <div className="text-xs font-medium text-sumi-600 mt-0.5">ブラウザの ようりょうが いっぱいです。ことばを すこし けして みてください。</div>
          </div>
          <button onClick={() => setStorageWarn(false)} aria-label="とじる"
            className="kkm-btn w-8 h-8 min-w-[32px] min-h-[32px] rounded-md bg-sumi-50 hover:bg-sumi-100 text-sumi-500 flex items-center justify-center">
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
