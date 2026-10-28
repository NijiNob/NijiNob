// ============================================================
// characters.js — キャラクターデータ
// キャラ1人 = 1ブロック。名前・所属・格・気質・プロフをここに集約。
// 修正はこのファイルだけで完結する。
//
// プロフ未入力のキャラは age/height/birth を "-" にする。
// id は「苗字_名前」のローマ字、頭大文字。画像は images/<id>.png。
// ============================================================

const CHARACTERS = [
  // ---- S ----
  { name:"月ノ美兎", aff:"にじさんじ", rank:"S", temper:["理知的","傲慢"], id:"Tsukino_Mito", age:"16", sex:"女", height:"151cm", birth:"9月24日" },
  { name:"樋口楓", aff:"にじさんじ", rank:"S", temper:["剛毅","律儀"], id:"Higuchi_Kaede", age:"17", sex:"女", height:"167cm", birth:"-" },
  { name:"椎名唯華", aff:"にじさんじ", rank:"S", temper:["打算","冷静"], id:"Shiina_Yuika", age:"17", sex:"女", height:"153cm", birth:"4月17日" },
  { name:"星川サラ", aff:"にじさんじ", rank:"S", temper:["激昂","感情的"], id:"Hoshikawa_Sara", age:"-", sex:"女", height:"147cm", birth:"8月7日" },
  { name:"橘ひなの", aff:"ぶいすぽ", rank:"S", temper:["傲慢","淫乱"], id:"Tachibana_Hinano", age:"-", sex:"女", height:"154cm", birth:"11月11日" },
  { name:"胡桃のあ", aff:"ぶいすぽ", rank:"S", temper:["理知的","冷静"], id:"Kurumi_Noa", age:"-", sex:"女", height:"155cm", birth:"2月13日" },

  // ---- A ----
  { name:"夜見れな", aff:"にじさんじ", rank:"A", temper:["冷静","打算"], id:"Yorumi_Rena", age:"17", sex:"女", height:"154cm", birth:"2月27日" },
  { name:"ドーラ", aff:"にじさんじ", rank:"A", temper:["剛毅","傲慢"], id:"Dola", age:"359", sex:"女", height:"175cm", birth:"8月19日" },
  { name:"ラトナ・プティ", aff:"にじさんじ", rank:"A", temper:["剛毅","律儀"], id:"Ratna_Petit", age:"21", sex:"女", height:"157cm", birth:"10月14日" },
  { name:"健屋花那", aff:"にじさんじ", rank:"A", temper:["貞淑","律儀"], id:"Sukoya_Kana", age:"-", sex:"女", height:"163cm", birth:"5月14日" },
  { name:"フレン・E・ルスタリオ", aff:"にじさんじ", rank:"A", temper:["素直","感情的"], id:"Furen_E_Lustario", age:"20代", sex:"女", height:"163㎝", birth:"3月10日" },
  { name:"一ノ瀬うるは", aff:"ぶいすぽ", rank:"A", temper:["傲慢","強欲"], id:"Ichinose_Uruha", age:"-", sex:"女", height:"158cm", birth:"12月23日" },
  { name:"八雲べに", aff:"ぶいすぽ", rank:"A", temper:["打算","淫乱"], id:"Yakumo_Beni", age:"-", sex:"女", height:"159cm", birth:"9月25日" },
  { name:"藍沢エマ", aff:"ぶいすぽ", rank:"A", temper:["打算","謙虚"], id:"Aizawa_Ema", age:"-", sex:"女", height:"156cm", birth:"1月31日" },
  { name:"英リサ", aff:"ぶいすぽ", rank:"A", temper:["傲慢","理知的"], id:"Hanabusa_Risa", age:"-", sex:"女", height:"160cm", birth:"6月3日" },
  { name:"本間ひまわり", aff:"にじさんじ", rank:"A", temper:["素直","感情的"], id:"Honma_Himawari", age:"高校2年生", sex:"女", height:"153cm", birth:"8月10日" },
  { name:"天宮こころ", aff:"にじさんじ", rank:"A", temper:["謙虚","無欲"], id:"Amamiya_Kokoro", age:"-", sex:"女", height:"150cm", birth:"7月1日" },
  { name:"夕陽リリ", aff:"にじさんじ", rank:"A", temper:["冷静","理知的"], id:"Yuuhi_Riri", age:"16歳", sex:"女", height:"164cm", birth:"1月21日" },
  { name:"花芽すみれ", aff:"ぶいすぽ", rank:"A", temper:["律儀","淫乱"], id:"Kaga_Sumire", age:"-", sex:"女", height:"154cm", birth:"4月2日" },
  { name:"小森めと", aff:"ぶいすぽ", rank:"A", temper:["感情的","淫乱"], id:"Komori_Meto", age:"-", sex:"女", height:"156cm", birth:"12月10日" },
  { name:"周央サンゴ", aff:"にじさんじ", rank:"A", temper:["激昂","打算"], id:"Suou_Sango", age:"12歳", sex:"女", height:"148cm", birth:"3月6日" },
  { name:"花芽なずな", aff:"ぶいすぽ", rank:"A", temper:["剛毅","律儀"], id:"Kaga_Nazuna", age:"-", sex:"女", height:"154cm", birth:"4月2日" },
  { name:"奈羅花", aff:"にじさんじ", rank:"A", temper:["傲慢","激昂"], id:"Naraka", age:"106歳", sex:"女", height:"138cm", birth:"7月10日" },

  // ---- B ----
  { name:"魔界ノりりむ", aff:"にじさんじ", rank:"B", temper:["激昂","淫乱"], id:"Makai_no_Ririmu", age:"13歳", sex:"女", height:"138cm", birth:"1月15日" },
  { name:"来栖夏芽", aff:"にじさんじ", rank:"B", temper:["謙虚","素直"], id:"Kurusu_Natsume", age:"25歳", sex:"女", height:"163cm", birth:"9月7日" },
  { name:"空星きらめ", aff:"にじさんじ", rank:"B", temper:["感情的","無欲"], id:"Sorahoshi_Kirame", age:"16歳", sex:"女", height:"147cm", birth:"4月30日" },
  { name:"東堂コハク", aff:"にじさんじ", rank:"B", temper:["剛毅","頑固"], id:"Toudou_Kohaku", age:"-", sex:"女", height:"162㎝", birth:"9月29日" },
  { name:"北小路ヒスイ", aff:"にじさんじ", rank:"B", temper:["貞淑","律儀"], id:"Kitakouji_Hisui", age:"24歳", sex:"女", height:"160cm", birth:"4月13日" },
  { name:"西園チグサ", aff:"にじさんじ", rank:"B", temper:["素直","無欲"], id:"Nishizono_Chigusa", age:"17歳", sex:"女", height:"157cm", birth:"7月20日" },
  { name:"鷹宮リオン", aff:"にじさんじ", rank:"B", temper:["傲慢","強欲"], id:"Takamiya_Rion", age:"-", sex:"女", height:"158cm", birth:"1月7日" },
  { name:"桜凛月", aff:"にじさんじ", rank:"B", temper:["謙虚","冷静"], id:"Sakura_Ritsuki", age:"樹齢19年", sex:"女", height:"150cm", birth:"4月1日" },
  { name:"メリッサ・キンレンカ", aff:"にじさんじ", rank:"B", temper:["理知的","冷静"], id:"Melissa_Kinrenka", age:"-", sex:"不明", height:"	158cm", birth:"5月11日" },
  { name:"如月れん", aff:"にじさんじ", rank:"B", temper:["頑固","無欲"], id:"Kisaragi_Ren", age:"-", sex:"女", height:"165cm", birth:"5月5日" },
  { name:"緑仙", aff:"にじさんじ", rank:"B", temper:["理知的","無欲"], id:"Ryushen", age:"24歳", sex:"非公開", height:"164.3cm", birth:"4月16日" },
  { name:"神成きゅぴ", aff:"ぶいすぽ", rank:"B", temper:["激昂","剛毅"], id:"Kaminari_Kyupi", age:"-", sex:"女", height:"-", birth:"-" },
  { name:"紫宮るな", aff:"ぶいすぽ", rank:"B", temper:["傲慢","弱気"], id:"Shinomiya_Runa", age:"-", sex:"女", height:"147cm", birth:"2月22日" },
  { name:"夢野あかり", aff:"ぶいすぽ", rank:"B", temper:["無欲","淫乱"], id:"Yumeno_Akari", age:"-", sex:"女", height:"149cm", birth:"5月5日" },
  { name:"夜乃くろむ", aff:"ぶいすぽ", rank:"B", temper:["貞淑","素直"], id:"Yano_Kuromu", age:"-", sex:"女", height:"150cm", birth:"6月16日" },
  { name:"紡木こかげ", aff:"ぶいすぽ", rank:"B", temper:["素直","無欲"], id:"Tsumugi_Kokage", age:"-", sex:"女", height:"152cm", birth:"10月26日" },
  { name:"千燈ゆうひ", aff:"ぶいすぽ", rank:"B", temper:["激昂","剛毅"], id:"Sendou_Yuuhi", age:"-", sex:"女", height:"159cm", birth:"12月3日" },
  { name:"蝶屋はなび", aff:"ぶいすぽ", rank:"B", temper:["貞淑","頑固"], id:"Chouya_Hanabi", age:"-", sex:"女", height:"170cm", birth:"4月9日" },
  { name:"静凛", aff:"にじさんじ", rank:"B", temper:["冷静","理知的"], id:"Shizuka_Rin", age:"17歳", sex:"女", height:"158cm", birth:"8月28日" },
  { name:"物述有栖", aff:"にじさんじ", rank:"B", temper:["謙虚","素直"], id:"Mononobe_Alice", age:"16歳", sex:"女", height:"143cm", birth:"11月16日" },
  { name:"竜胆尊", aff:"にじさんじ", rank:"B", temper:["傲慢","強欲"], id:"Rindou_Mikoto", age:"9907歳", sex:"女", height:"130cm", birth:"10月20日" },
  { name:"町田ちま", aff:"にじさんじ", rank:"B", temper:["謙虚","無欲"], id:"Machida_Chima", age:"18歳", sex:"女", height:"147cm", birth:"8月5日" },
  { name:"アンジュ・カトリーナ", aff:"にじさんじ", rank:"B", temper:["傲慢","強欲"], id:"Ange_Katrina", age:"26歳", sex:"女", height:"147cm", birth:"9月30日" },
  { name:"シスター・クレア", aff:"にじさんじ", rank:"B", temper:["貞淑","律儀"], id:"Sister_Claire", age:"27歳", sex:"女", height:"150cm", birth:"10月4日" },
  { name:"アルス・アルマル", aff:"にじさんじ", rank:"B", temper:["理知的","無欲"], id:"Ars_Almal", age:"16歳", sex:"女", height:"143cm", birth:"3月21日" },
  { name:"レヴィ・エリファ", aff:"にじさんじ", rank:"B", temper:["激昂","強欲"], id:"Levi_Elipha", age:"13歳", sex:"女", height:"-", birth:"8月18日" },
  { name:"早瀬走", aff:"にじさんじ", rank:"B", temper:["律儀","冷静"], id:"Hayase_Sou", age:"34歳", sex:"女", height:"169.9cm", birth:"3月20日" },

  // ---- C ----
  { name:"小雀とと", aff:"ぶいすぽ", rank:"C", temper:["頑固","無欲"], id:"Kogara_Toto", age:"-", sex:"女", height:"148cm", birth:"10月10日" },
  { name:"家長むぎ", aff:"にじさんじ", rank:"C", temper:["貞淑","弱気"], id:"Ienaga_Mugi", age:"22歳", sex:"女", height:"157cm", birth:"11月7日" },
  { name:"エリー・コニファー", aff:"にじさんじ", rank:"C", temper:["理知的","冷静"], id:"Eli_Conifer", age:"-", sex:"女", height:"154.5cm", birth:"9月27日" },
  { name:"山神カルタ", aff:"にじさんじ", rank:"C", temper:["傲慢","強欲"], id:"Yamagami_Karuta", age:"16歳", sex:"女", height:"158cm", birth:"8月11日" },
  { name:"えま★おうがすと", aff:"にじさんじ", rank:"C", temper:["激昂","弱気"], id:"Ema_August", age:"2477歳", sex:"女", height:"138cm", birth:"8月8日" },
  { name:"ルイス・キャミー", aff:"にじさんじ", rank:"C", temper:["貞淑","素直"], id:"Luis_Cammy", age:"-", sex:"女", height:"168cm", birth:"2月22日" },
  { name:"兎咲ミミ", aff:"ぶいすぽ", rank:"C", temper:["素直","無欲"], id:"Tosaki_Mimi", age:"-", sex:"女", height:"148cm", birth:"3月3日" },
  { name:"空澄セナ", aff:"ぶいすぽ", rank:"C", temper:["剛毅","頑固"], id:"Asumi_Sena", age:"-", sex:"女", height:"155cm", birth:"1月18日" },
  { name:"猫汰つな", aff:"ぶいすぽ", rank:"C", temper:["激昂","感情的"], id:"Nekota_Tsuna", age:"-", sex:"女", height:"157cm", birth:"11月27日" },
  { name:"白波らむね", aff:"ぶいすぽ", rank:"C", temper:["頑固","無欲"], id:"Shiranami_Ramune", age:"-", sex:"女", height:"153cm", birth:"3月21日" },
  { name:"飛鳥ひな", aff:"にじさんじ", rank:"C", temper:["貞淑","頑固"], id:"Asuka_Hina", age:"17歳", sex:"女", height:"145cm ", birth:"17歳" },
  { name:"雨森小夜", aff:"にじさんじ", rank:"C", temper:["冷静","理知的"], id:"Amemori_Sayo", age:"17歳", sex:"女", height:"157cm", birth:"6月11日" }
];

/* ===== 固有特性（ライバー名 → 特性ID配列） ===== */
const FIXED_TRAITS={
 // 低身長
 "天宮こころ":["low_height"],
 "周央サンゴ":["low_height"],
 "奈羅花":["low_height"],
 "魔界ノりりむ":["low_height"],
 "空星きらめ":["low_height"],
 "紫宮るな":["low_height"],
 "夜乃くろむ":["low_height"],
 "物述有栖":["low_height"],
 "竜胆尊":["low_height"],
 "町田ちま":["low_height"],
 "アルス・アルマル":["low_height"],
 "小雀とと":["low_height"],
 "えま★おうがすと":["low_height"],
 "兎咲ミミ":["low_height"],
 "飛鳥ひな":["low_height"],
 // 高身長
 "ドーラ":["high_height"],
 "蝶屋はなび":["high_height"],
 "早瀬走":["high_height"],
 "樋口楓":["high_height"],
 "ルイス・キャミー":["high_height"],
 "如月れん":["high_height"],
 // 巨乳
 "八雲べに":["big_breast"],
 "藍沢エマ":["big_breast"],
 "橘ひなの":["big_breast"],
 "胡桃のあ":["big_breast"],
 "猫汰つな":["big_breast"],
 "ドーラ":["big_breast"],
 "アルス・アルマル":["big_breast"],
 "星川サラ":["big_breast"],
 "フレン・E・ルスタリオ":["big_breast"],
 "静凛":["big_breast"],
 // 性別不詳
 "緑仙":["genderless"],
 "メリッサ・キンレンカ":["genderless"]
};
function traitsForName(name){return (FIXED_TRAITS[name]||[]).slice();}

/* ===== 非処女で登場しうるキャラ（名前 → 非処女である確率） ===== */
const NON_VIRGIN_CHANCE={
 "星川サラ":0.5,
 "橘ひなの":0.5,
 "胡桃のあ":0.5,
 "ドーラ":0.5,
 "ラトナ・プティ":0.5,
 "健屋花那":0.5,
 "一ノ瀬うるは":0.5,
 "八雲べに":0.5,
 "奈羅花":0.5,
 "来栖夏芽":0.5,
 "北小路ヒスイ":0.5,
 "鷹宮リオン":0.5,
 "神成きゅぴ":0.5,
 "静凛":0.5,
 "竜胆尊":0.5,
 "早瀬走":0.5,
 "猫汰つな":0.5,
 "家長むぎ":0.5
};
function rollNonVirginBase(name){const p=NON_VIRGIN_CHANCE[name]||0;return Math.random()<p;}

if(typeof window!=="undefined"){window.FIXED_TRAITS=FIXED_TRAITS;window.traitsForName=traitsForName;window.NON_VIRGIN_CHANCE=NON_VIRGIN_CHANCE;window.rollNonVirginBase=rollNonVirginBase;}