"use strict";
const SAVE_KEY="ryakudatsu_v0.31";
const HOME=5;
const RECRUIT_LIMIT=5;

const WOMEN = CHARACTERS.map(c=>[c.name,c.aff,c.rank,c.temper]);
const PROFILE = {};
CHARACTERS.forEach(c=>{PROFILE[c.name]={id:c.id,age:c.age,sex:c.sex,height:c.height,birth:c.birth};});

const POWER_TABLE={S:{troops:10000,resist:80},A:{troops:5000,resist:60},B:{troops:3000,resist:40},C:{troops:1500,resist:20}};

const TACTICS={
 totsugeki:{label:"突撃",beats:"houi",loses:"geigeki"},
 houi:{label:"包囲",beats:"geigeki",loses:"totsugeki"},
 geigeki:{label:"迎撃",beats:"totsugeki",loses:"houi"}
};
const TACTIC_KEYS=["totsugeki","houi","geigeki"];
const TACTIC_WEIGHT={
 totsugeki:{"剛毅":1.2,"激昂":1.2,"傲慢":1.2},
 houi:{"理知的":1.2,"冷静":1.2,"強欲":1.2},
 geigeki:{"貞淑":1.2,"律儀":1.2,"頑固":1.2,"打算":1.2}
};

const ECON_TYPES={
 kousen:{label:"好戦",order:["heisya","kozan","hatake","ichi","kura","kajiba"]},
 shougyou:{label:"商業",order:["ichi","kozan","kura","hatake","heisya","kajiba"]},
 noukou:{label:"農耕",order:["hatake","kura","ichi","heisya","kozan","kajiba"]},
 jousai:{label:"城塞",order:["heisya","kura","hatake","kozan","ichi","kajiba"]}
};
const TEMPER_ECON={
 "剛毅":"kousen","激昂":"kousen",
 "理知的":"shougyou","冷静":"shougyou","傲慢":"shougyou","強欲":"shougyou",
 "貞淑":"noukou","律儀":"noukou","謙虚":"noukou","無欲":"noukou",
 "頑固":"jousai","打算":"jousai"
};

const AXES=[
 {a:"傲慢",b:"謙虚",eff:{resist:1,display:1}},
 {a:"剛毅",b:"弱気",eff:{combat:1,milk:1}},
 {a:"頑固",b:"素直",eff:{resist:1,decay:-1}},
 {a:"冷静",b:"激昂",eff:{combat:1,resist:1}},
 {a:"理知的",b:"感情的",eff:{yield:1,decay:1}},
 {a:"強欲",b:"無欲",eff:{display:1,resist:-1}},
 {a:"貞淑",b:"淫乱",eff:{resist:1,decay:-1}},
 {a:"律儀",b:"打算",eff:{yield:1,decay:1}}
];
const B_EFF={
 "謙虚":{decay:1,yield:1},"弱気":{resist:1,harami:1},"素直":{decay:1,yield:1},"激昂":{decay:1,harami:1},
 "感情的":{resist:1,milk:1},"無欲":{decay:1,yield:1},"淫乱":{harami:1,milk:1},"打算":{display:1,decay:1}
};
const TEMPER_EFF={};
AXES.forEach(ax=>{TEMPER_EFF[ax.a]=ax.eff;});
for(const k in B_EFF)TEMPER_EFF[k]=B_EFF[k];

const MIN_TURN={"頑固":3,"貞淑":3,"傲慢":3,"剛毅":2,"律儀":2,"理知的":2,"強欲":2,"激昂":1,"感情的":1,"冷静":1,"打算":1,"淫乱":1,"無欲":1,"素直":0,"弱気":0,"謙虚":0};
const CONTACT_ONLY={"頑固":true,"貞淑":true};

const CONTACT={
 "傲慢":{shame:2,pain:1,kind:-1},"謙虚":{shame:1,pain:-1,kind:2},"剛毅":{shame:1,pain:2,kind:1},"弱気":{shame:-1,pain:1,kind:2},
 "頑固":{shame:2,pain:1,kind:-1},"素直":{shame:1,pain:-1,kind:2},"冷静":{shame:1,pain:1,kind:1},"激昂":{shame:-1,pain:2,kind:1},
 "理知的":{shame:1,pain:1,kind:2},"感情的":{shame:-1,pain:1,kind:2},"強欲":{shame:2,pain:1,kind:-1},"無欲":{shame:1,pain:1,kind:2},
 "貞淑":{shame:1,pain:-1,kind:2},"淫乱":{shame:2,pain:2,kind:1},"律儀":{shame:1,pain:1,kind:2},"打算":{shame:2,pain:1,kind:-1}
};
const CONTACT_LABEL={shame:"辱める",pain:"痛めつける",kind:"可愛がる"};
const STAGE_COEF={1:1.2,2:1.25};

const HOUSING={chinretsu:"display",sanden:"nikubenki",bokujou:"milk"};
const HOUSING_LABEL={display:"陳列",nikubenki:"肉便器",milk:"乳牛"};
const HOUSING_CLASS={display:"disp",nikubenki:"niku",milk:"milk"};

const SLOT_KEYS=["topLeft","top","topRight","left","right"];
const SLOT_LABEL={topLeft:"左上",top:"上",topRight:"右上",left:"左",right:"右",center:"中心"};

const ADJ={
 topLeft:["top","left"],
 top:["topLeft","topRight"],
 topRight:["top","right"],
 left:["topLeft","center"],
 right:["topRight","center"],
 center:["left","right"]
};

const DIVISIONS=["第1師団","第2師団","第3師団","第4師団"];
const REGIMENTS=Array.from({length:13},(_,i)=>`第${i+1}連隊`);

const LOG_CAT={good:"finance",warn:"military",bad:"military",ero:"captive",milk:"captive",niku:"captive",disp:"captive","":"system"};
const LOG_FILTERS=[["all","全て"],["finance","出納"],["military","軍事"],["captive","捕虜"],["system","その他"]];

const FIRST_BY_KINDS=["セフレ","彼氏","幼馴染"];
const FIRST_BY_NAMES=["ミュラー","ヴァイス","ロッシ","デュポン","ガルシア","スミス","ブラウン","コスタ","ノヴァク","ヨハンソン","ロペス","フェルナンデス","佐藤","鈴木","高橋","田中","伊藤","渡辺","山本","中村","小林","加藤","吉田","山田","佐々木","山口","松本","井上","木村","林","清水","山崎","森","池田","橋本","石川","前田","藤田","小川","岡田"];
const FIRST_BY_RANKS=["伍長","軍曹","曹長","少尉","中尉","大尉","一等兵","上等兵","上級曹長","少佐","中佐","大佐"];

let state, selected=5, rightTab="country", leftTab="log", toastTimer, bldTab="general", capFilter="all", logFilter="all", captureQueue=[], captureSeq=0;

const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{const r=a.slice();for(let i=r.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[r[i],r[j]]=[r[j],r[i]];}return r;};
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const fmt=n=>Math.floor(n).toLocaleString("ja-JP");
function fmtMilk(v){v=v||0;if(v<1000)return v+"ml";return (Math.floor(v/100)/10).toFixed(1)+"L";}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}

function rollUnit(){return pick(DIVISIONS)+" "+pick(REGIMENTS);}
function rollFirstBy(){return pick(FIRST_BY_KINDS);}
function rollFirstByName(){return pick(FIRST_BY_NAMES)+" "+pick(FIRST_BY_RANKS);}
function neighborsOf(key){return ADJ[key]||[];}
function newSlots(){return {center:{type:"center",lv:1},topLeft:null,top:null,topRight:null,left:null,right:null};}
function unlockedSlots(c){const lv=c.slots.center.lv;const open=["topLeft","top"];if(lv>=2)open.push("topRight");if(lv>=3)open.push("right");if(lv>=4)open.push("left");return open;}
function isUnlocked(c,key){return unlockedSlots(c).includes(key);}

function rollTemper(){
 const idx=shuffle([0,1,2,3,4,5,6,7]).slice(0,2);
 return idx.map(i=>{const ax=AXES[i];const a=Math.random()<0.5;return {name:a?ax.a:ax.b,axis:i,stage:1};});
}
function fixedTemper(names){return names.map(n=>{let axis=0;AXES.forEach((ax,i)=>{if(ax.a===n||ax.b===n)axis=i;});return {name:n,axis,stage:1};});}
function temperLabel(t){return t.map(x=>x.name).join("・");}
function temperMods(t){const mods={};t.forEach(x=>{const eff=TEMPER_EFF[x.name]||{};const c=STAGE_COEF[x.stage]||1;for(const k in eff){const v=eff[k];if(v>0)mods[k]=(mods[k]||1)*c;else mods[k]=(mods[k]||1)/c;}});return mods;}
function modOf(t,key){const m=temperMods(t);return m[key]||1;}
function temperMinTurn(t){let m=0;t.forEach(x=>{m=Math.max(m,MIN_TURN[x.name]||0);});return m;}
function temperContactOnly(t){return t.some(x=>CONTACT_ONLY[x.name]);}

function traitsFor(name){return (typeof window!=="undefined"&&window.traitsForName)?window.traitsForName(name):[];}function rollNonVirgin(name){return (typeof window!=="undefined"&&window.rollNonVirginBase)?window.rollNonVirginBase(name):false;}
/* ===== 秘密ステータス ===== */
function tierOf(key,val){
 const st=SECRET_STATS[key];
 if(!st||!st.tiers)return null;
 let cur=st.tiers[0];
 st.tiers.forEach(t=>{if(val>=t.min)cur=t;});
 return cur;
}
function initSecret(name,nonVirgin){
 const s={};
 for(const k in SECRET_STATS)s[k]=SECRET_STATS[k].init;
 s.pregBase=0;s.pregCd=0;s.firstBy=null;s.tierCache={};
 if(nonVirgin){s.defloration=0;s.partners=1+Math.floor(Math.random()*2);s.firstBy=rollFirstBy();}
 for(const k in SECRET_STATS){const t=tierOf(k,s[k]);s.tierCache[k]=t?t.min:0;}
 return s;
}

function log(text,type="",data=null){state.log.unshift({turn:state.turn,text,type,data});if(state.log.length>100)state.log.length=100;}
function sayGeneral(g,scene){return pick(LINES[scene]||[{text:"……"}]).text;}
function sayCaptive(c,scene){return pick(LINES[scene]||[{text:"……"}]).text;}
function selectedCountry(){return state.countries[selected];}
function toast(s){const el=document.getElementById("toast");el.textContent=s;el.classList.remove("hidden");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.add("hidden"),2300);}
function save(silent=false){try{localStorage.setItem(SAVE_KEY,JSON.stringify({state,selected,rightTab,leftTab}));if(!silent)toast("セーブしました。");}catch(e){if(!silent)toast("保存できませんでした。");}}