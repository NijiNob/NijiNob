(function(){
"use strict";
const SAVE_KEY="ryakudatsu_v0.28";
const HOME=5;

const WOMEN = CHARACTERS.map(c=>[c.name,c.aff,c.rank,c.temper]);
const PROFILE = {};
CHARACTERS.forEach(c=>{PROFILE[c.name]={id:c.id,age:c.age,sex:c.sex,height:c.height,birth:c.birth};});

const POWER_TABLE={S:{troops:10000,resist:80},A:{troops:5000,resist:60},B:{troops:3000,resist:40},C:{troops:1500,resist:20}};

/* ===== 戦術（三すくみ） ===== */
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
function pickEnemyTactic(t){
 const weights=TACTIC_KEYS.map(k=>{
  let w=1;
  t.generals.forEach(g=>g.temper.forEach(x=>{
   if(TACTIC_WEIGHT[k][x.name])w*=TACTIC_WEIGHT[k][x.name];
  }));
  return w;
 });
 const total=weights.reduce((a,b)=>a+b,0);
 let r=Math.random()*total;
 for(let i=0;i<TACTIC_KEYS.length;i++){r-=weights[i];if(r<=0)return TACTIC_KEYS[i];}
 return "houi";
}

/* ===== 敵の経済タイプ ===== */
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
function decideEcon(generals){
 const count={};
 generals.forEach(g=>g.temper.forEach(t=>{
  const e=TEMPER_ECON[t.name];
  if(e)count[e]=(count[e]||0)+1;
 }));
 let best=null,bestN=0;
 for(const k in count){if(count[k]>bestN){bestN=count[k];best=k;}}
 return best||"noukou";
}

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
function temperMinTurn(t){let m=0;t.forEach(x=>{m=Math.max(m,MIN_TURN[x.name]||0);});return m;}
function temperContactOnly(t){return t.some(x=>CONTACT_ONLY[x.name]);}

const CONTACT={
 "傲慢":{shame:2,pain:1,kind:-1},"謙虚":{shame:1,pain:-1,kind:2},"剛毅":{shame:1,pain:2,kind:1},"弱気":{shame:-1,pain:1,kind:2},
 "頑固":{shame:2,pain:1,kind:-1},"素直":{shame:1,pain:-1,kind:2},"冷静":{shame:1,pain:1,kind:1},"激昂":{shame:-1,pain:2,kind:1},
 "理知的":{shame:1,pain:1,kind:2},"感情的":{shame:-1,pain:1,kind:2},"強欲":{shame:2,pain:1,kind:-1},"無欲":{shame:1,pain:1,kind:2},
 "貞淑":{shame:1,pain:-1,kind:2},"淫乱":{shame:2,pain:2,kind:1},"律儀":{shame:1,pain:1,kind:2},"打算":{shame:2,pain:1,kind:-1}
};
const CONTACT_LABEL={shame:"辱める",pain:"痛めつける",kind:"優しくする"};
const STAGE_COEF={1:1.2,2:1.25};

function rollTemper(){
 const idx=shuffle([0,1,2,3,4,5,6,7]).slice(0,2);
 return idx.map(i=>{const ax=AXES[i];const a=Math.random()<0.5;return {name:a?ax.a:ax.b,axis:i,stage:1};});
}
function fixedTemper(names){return names.map(n=>{let axis=0;AXES.forEach((ax,i)=>{if(ax.a===n||ax.b===n)axis=i;});return {name:n,axis,stage:1};});}
function temperLabel(t){return t.map(x=>x.name).join("・");}
function temperMods(t){const mods={};t.forEach(x=>{const eff=TEMPER_EFF[x.name]||{};const c=STAGE_COEF[x.stage]||1;for(const k in eff){const v=eff[k];if(v>0)mods[k]=(mods[k]||1)*c;else mods[k]=(mods[k]||1)/c;}});return mods;}
function modOf(t,key){const m=temperMods(t);return m[key]||1;}

/* ===== 特徴 ===== */
function traitsFor(name){return (typeof traitsForName==="function")?traitsForName(name):[];}
function rollNonVirgin(name){return (typeof window!=="undefined"&&window.rollNonVirgin)?window.rollNonVirgin(name):false;}

const HOUSING={chinretsu:"display",sanden:"nikubenki",bokujou:"milk"};
const HOUSING_LABEL={display:"陳列",nikubenki:"肉便器",milk:"乳牛"};
const HOUSING_CLASS={display:"disp",nikubenki:"niku",milk:"milk"};

const SLOT_KEYS=["topLeft","top","topRight","left","right"];
const SLOT_LABEL={topLeft:"左上",top:"上",topRight:"右上",left:"左",right:"右",center:"中心"};
function newSlots(){return {center:{type:"center",lv:1},topLeft:null,top:null,topRight:null,left:null,right:null};}
function unlockedSlots(c){const lv=c.slots.center.lv;const open=["topLeft","top"];if(lv>=2)open.push("topRight");if(lv>=3)open.push("right");if(lv>=4)open.push("left");return open;}
function isUnlocked(c,key){return unlockedSlots(c).includes(key);}

const ADJ={
 topLeft:["top","left"],
 top:["topLeft","topRight"],
 topRight:["top","right"],
 left:["topLeft","center"],
 right:["topRight","center"],
 center:["left","right"]
};
function neighborsOf(key){return ADJ[key]||[];}

const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{const r=a.slice();for(let i=r.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[r[i],r[j]]=[r[j],r[i]];}return r;};
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const fmt=n=>Math.floor(n).toLocaleString("ja-JP");
function fmtMilk(v){v=v||0;if(v<1000)return v+"ml";return (Math.floor(v/100)/10).toFixed(1)+"L";}
let state, selected=5, rightTab="country", leftTab="log", toastTimer, bldTab="general", capFilter="all", captureQueue=[];

function capLimit(){return 2+centerCapBonus()+specialCapBonus()+(treeOwned("cap1")?4:0);}
function centerCapBonus(){return (state.countries[HOME].slots.center.lv-1)*2;}
function specialCapBonus(){return GOKUSHA_CAP[state.specials.gokusha.lv]||0;}
function prestigeBonus(){return Math.min(0.25,state.player.prestige/3000);}
function recruitBonus(){let n=0;state.countries.forEach(c=>{if(c.owner!=="player")return;SLOT_KEYS.forEach(k=>{const s=c.slots[k];if(s&&s.type==="kajiba")n+=s.lv*0.10;});});if(treeOwned("army1"))n+=0.15;return 1+n;}
function descOf(B,lv){return B.desc[clamp(lv-1,0,4)]||B.desc[0];}
function maxSpecial(type){let m=0;state.countries.forEach(c=>{if(c.owner!=="player")return;SLOT_KEYS.forEach(k=>{const s=c.slots[k];if(s&&s.type===type)m=Math.max(m,s.lv);});});return m;}
function centerNote(lv){return `兵糧 +${200*lv} / 金 +${150*lv} / 兵力 +${100*lv} / 威信 +${10*lv}`;}
function isBroke(){return state.player.gold<0||state.player.food<0;}

/* ===== 隣接ボーナス ===== */
function workersAt(c,type){return state.captives.filter(t=>t.assignedCountry===c.id&&t.role===HOUSING[type]).length;}
function adjacencyBonus(c,key){
 const out={};const workers={};
 const target=c.slots[key];
 if(!target)return {bonus:out,workers};
 neighborsOf(key).forEach(nk=>{
  const ns=c.slots[nk];
  if(!ns)return;
  const def=ADJ_BONUS[ns.type]?.[target.type];
  if(!def)return;
  const w=workersAt(c,ns.type);
  if(w<=0)return;
  let v=adjBonusValue(ns.type,target.type,w);
  if(treeOwned("home3"))v*=1.1;
  if(ns.type==="sanden"){
   const boosters=state.captives.filter(t=>t.assignedCountry===c.id&&t.role==="nikubenki"&&t.dispSlot===nk);
   boosters.forEach(t=>{v*=traitEff(t,"niku_adj");});
  }
  if(ns.type==="bokujou"){
   const boosters=state.captives.filter(t=>t.assignedCountry===c.id&&t.role==="milk"&&t.dispSlot===nk);
   boosters.forEach(t=>{v*=traitEff(t,"milk_adj");});
  }
  out[target.type]=Math.max(out[target.type]||0,v);
  workers[ns.type]=Math.max(workers[ns.type]||0,w);
 });
 return {bonus:out,workers};
}
function slotCtx(c,key){
 const r=adjacencyBonus(c,key);
 const t=c.slots[key];
 const selfWorkers=t?workersAt(c,t.type):0;
 const srcWorkers=t?Object.values(r.workers).reduce((m,v)=>Math.max(m,v),0):0;
 return {country:c,slot:key,bonus:r.bonus,workers:Math.max(selfWorkers,srcWorkers)};
}

function owned(){return state.countries.filter(c=>c.owner==="player");}
function attackable(){
 const set=new Set();
 owned().forEach(o=>{
  const r=Math.floor(o.id/4),col=o.id%4;
  state.countries.forEach(x=>{
   if(x.owner!=="enemy")return;
   const xr=Math.floor(x.id/4),xc=x.id%4;
   if((Math.abs(xr-r)===1&&xc===col)||(Math.abs(xc-col)===1&&xr===r))set.add(x.id);
  });
 });
 return state.countries.filter(c=>set.has(c.id));
}
function isAttackable(id){return attackable().some(c=>c.id===id);}

/* ===== 国家方針ツリー ===== */
function treeOwned(id){return !!state.tree[id];}
function nodeName(sys,idx){const n=TREE[sys].nodes[idx];return n&&n.name?n.name:`${TREE[sys].label} 第${idx+1}ノード`;}

/* ===== 秘密ステータス ===== */
function initSecret(name,nonVirgin){
 const s={};
 for(const k in SECRET_STATS)s[k]=SECRET_STATS[k].init;
 s.pregBase=0;s.pregCd=0;
 if(nonVirgin){s.defloration=0;s.partners=1+Math.floor(Math.random()*2);}
 return s;
}

function initialState(homeName){
 const pool=shuffle(WOMEN);
 const enemyIds=NAMES.map((_,i)=>i).filter(i=>i!==HOME);
 const r=Math.floor(HOME/4),col=HOME%4;
 const neighbors=[];
 [[r-1,col],[r+1,col],[r,col-1],[r,col+1]].forEach(([rr,cc])=>{
  if(rr>=0&&rr<4&&cc>=0&&cc<4)neighbors.push(rr*4+cc);
 });
 const small=shuffle(neighbors).slice(0,2);
 const smallSet=new Set(small);
 const assign={};
 small.forEach(id=>{assign[id]=1+Math.floor(Math.random()*2);});
 const restIds=enemyIds.filter(id=>!smallSet.has(id));
 const RANK_ORDER={S:0,A:1,B:2,C:3};
 const sorted=[...pool].sort((a,b)=>(RANK_ORDER[b[2]]??3)-(RANK_ORDER[a[2]]??3));
 const smallCount=small.reduce((a,id)=>a+assign[id],0);
 const smallPool=sorted.slice(0,smallCount);
 const restPool=sorted.slice(smallCount);
 let remaining=restPool.length;
 const per=Math.floor(remaining/restIds.length);
 let rem=remaining-per*restIds.length;
 restIds.forEach(id=>{assign[id]=per;});
 shuffle(restIds).slice(0,rem).forEach(id=>{assign[id]++;});
 restIds.forEach(id=>{if(assign[id]<1)assign[id]=1;});
 let si=0,ri=0;
 const countries=NAMES.map((name,i)=>{
  if(i===HOME){return {id:i,name:homeName||NAMES[HOME],owner:"player",troops:2800,food:2800,gold:1800,slots:newSlots(),generals:[]};}
  const n=assign[i]||1;
  const generals=[];
  for(let j=0;j<n;j++){
   const w=(smallSet.has(i)?smallPool[si++]:restPool[ri++])||["名もなき女","にじさんじ","C",null];
   const pt=POWER_TABLE[w[2]]||POWER_TABLE.C;
   const temper=w[3]?fixedTemper(w[3]):rollTemper();
   const cm=modOf(temper,"combat");
   const nonVirgin=rollNonVirgin(w[0]);
   generals.push({name:w[0],affiliation:w[1],rank:w[2],power:Math.round(pt.troops*cm),temper,traits:traitsFor(w[0]),capCount:0,homeId:i,nonVirgin});
  }
  const RANK_ORDER2={S:0,A:1,B:2,C:3};
  const topRank=generals.reduce((m,g)=>(RANK_ORDER2[g.rank]<RANK_ORDER2[m]?g.rank:m),"C");
  const scale={S:{food:5000,gold:3000,center:2},A:{food:4000,gold:2400,center:2},B:{food:3000,gold:1800,center:1},C:{food:2000,gold:1200,center:1}}[topRank];
  const slots=newSlots();
  slots.center.lv=scale.center;
  if(scale.center>=2){slots.topLeft={type:"heisya",lv:1};slots.top={type:"hatake",lv:1};}
  const econ=decideEcon(generals);
  return {id:i,name,owner:"enemy",troops:generals.reduce((s,g)=>s+g.power,0),food:scale.food,gold:scale.gold,slots,generals,econ,nextAct:1+Math.floor(Math.random()*2)};
 });
 return {turn:1,player:{troops:2800,food:2800,gold:1800,prestige:0},countries,captives:[],displayed:[],specials:{gokusha:{lv:0},kanshitou:{lv:0}},tree:{},battle:null,log:[{turn:1,text:"あなたは本拠を構え、女を奪う天下取りの第一歩を踏み出した。",type:"good"}],won:false};
}
function log(text,type="",data=null){state.log.unshift({turn:state.turn,text,type,data});if(state.log.length>100)state.log.length=100;}
function sayGeneral(g,scene){return pick(LINES[scene]||[{text:"……"}]).text;}
function sayCaptive(c,scene){return pick(LINES[scene]||[{text:"……"}]).text;}
function selectedCountry(){return state.countries[selected];}
function toast(s){const el=document.getElementById("toast");el.textContent=s;el.classList.remove("hidden");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.add("hidden"),2300);}
function save(silent=false){try{localStorage.setItem(SAVE_KEY,JSON.stringify({state,selected,rightTab,leftTab}));if(!silent)toast("セーブしました。");}catch(e){if(!silent)toast("保存できませんでした。");}}
function load(){try{const raw=localStorage.getItem(SAVE_KEY);if(!raw){toast("セーブデータがありません。");return;}const d=JSON.parse(raw);if(!d.state||!Array.isArray(d.state.countries))throw Error();state=d.state;if(!state.specials)state.specials={gokusha:{lv:0},kanshitou:{lv:0}};if(!state.tree)state.tree={};if(!("battle" in state))state.battle=null;state.countries.forEach(c=>{if(!c.slots)c.slots=newSlots();if(c.owner==="enemy"){if(!c.econ)c.econ=decideEcon(c.generals||[]);if(!c.nextAct)c.nextAct=state.turn+enemyActionInterval(c);}});state.captives.forEach(t=>{if(!t.secret)t.secret=initSecret(t.name,false);});selected=clamp(d.selected||HOME,0,15);rightTab=d.rightTab||"country";leftTab=d.leftTab||"log";render();toast("ロードしました。");}catch(e){toast("セーブデータを読み込めませんでした。");}}
function reset(){const root=document.getElementById("modalroot");root.innerHTML=`<div class="battleoverlay"><div class="modal"><h2>新規開始</h2><p>現在の進行を破棄して、最初から始めます。</p><div class="eyebrow">本拠の名</div><input id="homeInput" value="${NAMES[HOME]}" maxlength="12"><div class="separator"></div><div style="display:flex;gap:8px"><button class="primary" id="goReset">開始する</button><button id="cancelReset">戻る</button></div></div></div>`;root.querySelector("#cancelReset").onclick=()=>root.innerHTML="";root.querySelector("#goReset").onclick=()=>{const v=root.querySelector("#homeInput").value.trim()||NAMES[HOME];root.innerHTML="";state=initialState(v);selected=HOME;rightTab="country";leftTab="log";render();save(true);toast("新たな略奪が始まりました。");};}

function render(){
 document.getElementById("turn").textContent=state.turn;
 renderHud();renderSideTiles();renderMap();renderRight();renderLeft();
 document.querySelectorAll("[data-rtab]").forEach(b=>b.classList.toggle("active",b.dataset.rtab===rightTab));
 document.querySelectorAll("[data-ltab]").forEach(b=>b.classList.toggle("active",b.dataset.ltab===leftTab));
 const readyCount=state.captives.filter(t=>t.status==="ready").length;
 const capBtn=document.getElementById("capTabBtn");
 capBtn.innerHTML="捕虜"+(readyCount?`<span class="tabbadge">${readyCount}</span>`:"");
 capBtn.classList.toggle("alert",readyCount>0);
 document.getElementById("nextTop").disabled=state.won;
 if(state.won)showVictory();
 save(true);
}
function renderHud(){
 const broke=isBroke();
 const data=[
  ["兵力",fmt(state.player.troops),"クリックで募兵","clickable"],
  ["兵糧",fmt(state.player.food),broke&&state.player.food<0?"破綻：行動不可":"毎ターン消費あり",state.player.food<400?"warn":""],
  ["金",fmt(state.player.gold),broke&&state.player.gold<0?"破綻：行動不可":"内政・募兵","gold"],
  ["威信",fmt(state.player.prestige),"クリックで国家方針","clickable"]
 ];
 document.getElementById("hud").innerHTML=data.map(d=>`<div class="stat ${d[3]}" ${d[3]==="clickable"?`data-open="${d[0]==="兵力"?"recruit":"tree"}"`:""}><div class="k">${d[0]}</div><div class="v">${d[1]}</div><div class="sub">${d[2]}</div></div>`).join("");
 document.querySelectorAll("[data-open='tree']").forEach(el=>el.addEventListener("click",openTree));
 document.querySelectorAll("[data-open='recruit']").forEach(el=>el.addEventListener("click",openRecruit));
 document.getElementById("landCount").textContent=`領土 ${owned().length} / 16`;
}
function renderSideTiles(){
 const land=owned().length;
 const cap=state.captives.length,capMax=capLimit();
 const nikuN=state.captives.filter(t=>t.role==="nikubenki").length;
 const milkN=state.captives.filter(t=>t.role==="milk").length;
 const dispN=state.captives.filter(t=>t.role==="display").length;
 const tiles=[
  ["land","領土",land+"/16"],
  ["recruit","募兵",""],
  ["cap","捕虜",cap+"/"+capMax],
  ["niku","肉便器",nikuN],
  ["milk","乳牛",milkN],
  ["disp","陳列",dispN],
  ["record","領主録",""]
 ];
 document.getElementById("sidetiles").innerHTML=tiles.map(t=>`<div class="stile ${t[0]}" data-tile="${t[0]}"><div class="tk">${t[1]}</div><div class="tv">${t[2]}</div></div>`).join("");
 document.querySelectorAll("[data-tile]").forEach(el=>el.addEventListener("click",()=>onTile(el.dataset.tile)));
}
function onTile(kind){
 if(kind==="land"){rightTab="lands";render();return;}
 if(kind==="record"){openRecord();return;}
 if(kind==="recruit"){openRecruit();return;}
 openCaptiveList(kind);
}
function renderMap(){
 const map=document.getElementById("map");map.innerHTML="";
 const atk=attackable().map(a=>a.id);
 state.countries.forEach(c=>{
  const btn=document.createElement("button");
  const isOwn=c.owner==="player";
  const inBattle=state.battle&&state.battle.targetId===c.id;
  btn.className="country "+(isOwn?"owned ":"")+(selected===c.id?"selected ":"")+(atk.includes(c.id)?"target ":"")+(inBattle?"inbattle":"");
  const badge=inBattle?`<span class="badge battle">交戦中</span>`:`<span class="badge">${isOwn?"自領":(ECON_TYPES[c.econ]?.label||"")+" "+c.generals.length+"女"}</span>`;
  btn.innerHTML=`${badge}<div class="cname">${c.name}</div><div class="cowner">${isOwn?"あなたの勢力":"領主 "+(c.generals[0]?.name||"")}</div>${isOwn?"":`<div class="cstats">兵 ${fmt(c.troops)}</div>`}`;
  btn.addEventListener("click",()=>{
   if(state.battle&&state.battle.targetId===c.id){openBattle();return;}
   selected=c.id;render();
  });
  map.appendChild(btn);
 });
}
function renderRight(){const el=document.getElementById("rightbody");
 if(rightTab==="country"){const c=selectedCountry(),isO=c.owner==="player",canAtk=isAttackable(c.id);const built=SLOT_KEYS.filter(k=>c.slots[k]).map(k=>{const s=c.slots[k];const B=BUILDINGS[s.type];const cls=HOUSING_CLASS[HOUSING[s.type]]||"";return `<span class="pill ${cls}">${B?B.names[s.lv-1]:s.type} Lv${s.lv}</span>`;}).join("");const econPill=!isO&&c.econ?`<span class="pill econ">${ECON_TYPES[c.econ].label}</span>`:"";const inBattle=state.battle&&state.battle.targetId===c.id;el.innerHTML=`<div class="countrydetail"><h3>${c.name}国</h3><div class="eyebrow">${isO?"自勢力の領国":"独立勢力・攻略対象"}</div><div class="pills"><span class="pill ${isO?"owned":""}">${isO?"支配下":"敵勢力"}</span>${econPill}<span class="pill cap">${CENTER.names[c.slots.center.lv-1]} Lv${c.slots.center.lv}</span>${built}</div><div class="detailgrid"><div class="mini"><span>兵力</span><b>${fmt(c.troops)}</b></div><div class="mini"><span>兵糧</span><b>${fmt(c.food)}</b></div><div class="mini"><span>金</span><b>${fmt(c.gold)}</b></div></div><div class="subheading">守る領主</div>${c.generals.length?c.generals.map(g=>`<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #2e2e2e;padding:7px 0"><span><span class="namelink" data-prof="${escapeHtml(g.name)}">${escapeHtml(g.name)}</span> <span class="pill aff">${escapeHtml(g.affiliation)}</span> ${g.temper.map(t=>`<span class="temperpill">${t.name}</span>`).join("")}${(g.traits||[]).map(id=>traitPillHtml(id)).join("")}</span></div>`).join(""):"<div class='eyebrow'>領主なし</div>"}<div class="subheading">行動</div><div style="display:flex;gap:7px;flex-wrap:wrap">${isO?`<button id="localBuild">この国に建設</button>`:`<button class="primary" id="localAttack" ${canAtk&&!state.battle?"":"disabled"}>${inBattle?"交戦を再開":"この国へ攻める"}</button>`}</div>${!isO?`<p class="eyebrow" style="margin-top:9px">${inBattle?"交戦中です。クリックで再開。":canAtk?"侵攻可能な隣接国です。":"自領に隣接していません。"}</p>`:""}</div>`;document.getElementById("localBuild")?.addEventListener("click",openBuild);document.getElementById("localAttack")?.addEventListener("click",()=>{if(inBattle)openBattle();else startBattle();});bindProf(el);}
 else if(rightTab==="lands"){renderLands(el);}
 else if(rightTab==="specials"){renderSpecialsTab(el);}
 else{renderCaptives(el);}}
function renderLands(el){
 const lands=owned();
 if(!lands.length){el.innerHTML='<div class="empty">自領がありません。</div>';return;}
 el.innerHTML=`<div class="captives">${lands.map(c=>{const built=SLOT_KEYS.filter(k=>c.slots[k]).map(k=>{const s=c.slots[k];const B=BUILDINGS[s.type];const cls=HOUSING_CLASS[HOUSING[s.type]]||"";return `<span class="pill ${cls}">${B?B.names[s.lv-1]:s.type} Lv${s.lv}</span>`;}).join("");const capHere=state.captives.filter(t=>t.assignedCountry===c.id).length;return `<div class="captive"><div class="cbody"><div class="cname-row"><h4>${c.name}国</h4></div><div class="cmeta-row"><span class="status">捕虜 ${capHere}</span></div><p>兵 ${fmt(c.troops)} · 兵糧 ${fmt(c.food)} · 金 ${fmt(c.gold)}</p><div class="pills">${built||"<span class='eyebrow'>施設なし</span>"}</div><div class="actions"><button data-goto="${c.id}">この国を開く</button></div></div></div>`;}).join("")}</div>`;
 el.querySelectorAll("[data-goto]").forEach(b=>b.addEventListener("click",()=>{selected=parseInt(b.dataset.goto);rightTab="country";render();}));
}
function renderSpecialsTab(el){
 el.innerHTML=`<p class="eyebrow" style="margin-bottom:10px">勢力全体に効果が及ぶ建造物。国とは別に保有し、レベルアップで強化する。</p><div class="specialrow" id="sprow"></div>`;
 drawSpecials(el);
}
function stampLabel(role,status){
 if(status==="resist"||status==="ready")return "捕虜";
 if(role==="display")return "陳列";
 if(role==="nikubenki")return "肉便器";
 if(role==="milk")return "乳牛";
 return null;
}
function stampHtml(t){
 const label=stampLabel(t.role,t.status);
 if(!label)return "";
 const cls=t.role?"stamp-"+t.role:"stamp-cap";
 return `<span class="stamp ${cls}">${label}</span>`;
}
function traitPillHtml(id){
 const tr=TRAITS[id];
 if(!tr)return `<span class="traitpill">${escapeHtml(id)}</span>`;
 const tip=`<div class="tiptitle">${escapeHtml(tr.label)}</div><div class="tipeff">${escapeHtml(tr.desc||"")}</div>${tr.flavor?`<div class="tipflavor">${escapeHtml(tr.flavor)}</div>`:""}`;
 return `<span class="traitpill" data-trait="${escapeHtml(id)}">${escapeHtml(tr.label)}<span class="tiptext">${tip}</span></span>`;
}
function renderCaptives(el){
 const filters=[["all","全部"],["resist","抵抗中"],["ready","未割当"],["nikubenki","肉便器"],["milk","乳牛"],["display","陳列"]];
 let list=state.captives;
 if(capFilter==="resist")list=list.filter(t=>t.status==="resist");
 else if(capFilter==="ready")list=list.filter(t=>t.status==="ready");
 else if(capFilter==="nikubenki")list=list.filter(t=>t.role==="nikubenki");
 else if(capFilter==="milk")list=list.filter(t=>t.role==="milk");
 else if(capFilter==="display")list=list.filter(t=>t.role==="display");
 const fbar=`<div class="filterbar">${filters.map(f=>`<button data-filter="${f[0]}" class="${capFilter===f[0]?"active":""}">${f[1]}</button>`).join("")}</div>`;
 if(!state.captives.length){el.innerHTML=fbar+'<div class="empty">まだ捕虜はいません。領主を撃破・降伏させて捕らえよう。</div>';bindFilter(el);return;}
 if(!list.length){el.innerHTML=fbar+'<div class="empty">該当する捕虜がいません。</div>';bindFilter(el);return;}
 el.innerHTML=fbar+`<div class="captives">${list.map(t=>{const contactDone=t.contactTurn===state.turn;const mt=temperMinTurn(t.temper),co=temperContactOnly(t.temper);const turnLeft=Math.max(0,mt-(state.turn-(t.capturedTurn||0)));const assigned=t.assignedCountry!=null;const cls=assigned?HOUSING_CLASS[t.role]:"";const p=PROFILE[t.name]||{};const imgSrc=p.id?`images/${p.id}.png`:"";return `<div class="captive"><div class="cimg" data-prof="${escapeHtml(t.name)}">${imgSrc?`<img src="${imgSrc}" alt="${escapeHtml(t.name)}" onerror="this.style.display='none';this.parentNode.textContent='画像準備中';">`:"画像準備中"}${stampHtml(t)}</div><div class="cbody"><div class="cname-row"><h4>◇ <span class="namelink" data-prof="${escapeHtml(t.name)}">${escapeHtml(t.name)}</span></h4></div><div class="cmeta-row"><span class="pill aff">${escapeHtml(t.affiliation||"")}</span>${t.temper.map(x=>`<span class="temperpill">${x.name}</span>`).join("")}${(t.traits||[]).map(id=>traitPillHtml(id)).join("")}<span class="status ${t.status==="ready"?"ready":t.status==="display"?cls:"resist"}">${t.status==="resist"?"抵抗":t.status==="ready"?"屈服可":assigned?`${HOUSING_LABEL[t.role]} @${state.countries[t.assignedCountry].name}`:"未割当"}</span></div>${t.status==="resist"?`<p>抵抗 ${t.resist} / ${t.resistMax}${turnLeft>0?"（あと"+turnLeft+"ターンで減衰開始）":co&&!t.contacted?"（接触するまで減衰せず）":""}</p>`:(t.effect?`<p>${escapeHtml(t.effect)}</p>`:"")}${t.status==="resist"?`<div class="contactrow">${["shame","pain","kind"].map(k=>{const r=contactResult(t,k);const cls2=r>0?"hit":r<0?"miss":"";return `<button data-contact="${t.id}" data-kind="${k}" ${contactDone?"disabled":""} class="${cls2}">${CONTACT_LABEL[k]}${r>0?" ▲":r<0?" ▼":""}</button>`;}).join("")}</div>`:""}${t.status==="ready"?`<div class="actions"><button data-assign="${t.id}">国に割り当て</button></div>`:""}${assigned?`<div class="actions"><button data-unassign="${t.id}" class="danger">割当解除</button></div>`:""}</div></div>`;}).join("")}</div>`;
 bindFilter(el);
 el.querySelectorAll("[data-contact]").forEach(b=>b.addEventListener("click",()=>doContact(b.dataset.contact,b.dataset.kind)));
 el.querySelectorAll("[data-assign]").forEach(b=>b.addEventListener("click",()=>openAssign(b.dataset.assign)));
 el.querySelectorAll("[data-unassign]").forEach(b=>b.addEventListener("click",()=>unassignCaptive(b.dataset.unassign)));
 bindProf(el);
}
function bindFilter(el){el.querySelectorAll("[data-filter]").forEach(b=>b.addEventListener("click",()=>{capFilter=b.dataset.filter;render();}));}
function renderLeft(){const el=document.getElementById("leftbody");el.innerHTML=`<div class="log">${state.log.map((l,i)=>`<div class="logitem ${l.type}"><span class="lt">T${l.turn}</span>${escapeHtml(l.text)}${l.data&&l.data.type==="capture"?`<button class="logreopen" data-logidx="${i}">再表示</button>`:""}</div>`).join("")}</div>`;
 el.querySelectorAll("[data-logidx]").forEach(b=>b.addEventListener("click",()=>{
  const l=state.log[parseInt(b.dataset.logidx)];
  if(!l||!l.data)return;
  const caps=l.data.ids.map(id=>state.captives.find(t=>t.id===id)).filter(Boolean);
  if(caps.length)openCaptureEvent(caps);
  else toast("この捕虜は既に逃げたか、解放されています。");
 }));}
function bindProf(el){el.querySelectorAll("[data-prof]").forEach(n=>n.addEventListener("click",()=>openProfile(n.dataset.prof)));}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}

function findHomeId(name){for(const c of state.countries){if(c.generals.some(g=>g.name===name))return c.id;}const cap=state.captives.find(t=>t.name===name);if(cap)return cap.homeId;return null;}
function statusLabel(name){
 for(const c of state.countries){if(c.generals.some(g=>g.name===name))return `${c.name}国領主`;}
 const t=state.captives.find(x=>x.name===name);
 if(!t)return "-";
 if(t.assignedCountry==null)return "捕虜";
 if(t.role==="nikubenki")return "便器";
 if(t.role==="milk")return "家畜";
 if(t.role==="display")return "公有物";
 return "捕虜";
}
function openProfile(name,tab="normal"){
 const p=PROFILE[name]||{};
 const homeId=findHomeId(name);
 const origin=homeId!=null?state.countries[homeId].name:"-";
 let aff="";let temper=[];let t=null;let traits=[];
 for(const c of state.countries){const g=c.generals.find(x=>x.name===name);if(g){aff=g.affiliation;temper=g.temper;traits=g.traits||[];break;}}
 if(!aff){t=state.captives.find(x=>x.name===name);if(t){aff=t.affiliation;temper=t.temper;traits=t.traits||[];}}
 const imgSrc=p.id?`images/${p.id}.png`:"";
 const stamp=t?stampHtml(t):"";
 const root=document.getElementById("modalroot");
 const tabs=`<div class="bldtabs"><button data-ptab="normal" class="${tab==="normal"?"active":""}">プロフィール</button><button data-ptab="secret" class="${tab==="secret"?"active":""}">秘密</button></div>`;
 let body;
 if(tab==="normal"){
  body=`<div class="proftable"><span class="pk">出身</span><span class="pv">${escapeHtml(origin)}</span><span class="pk">年齢</span><span class="pv">${escapeHtml(p.age||"-")}</span><span class="pk">性別</span><span class="pv">${escapeHtml(p.sex||"女")}</span><span class="pk">身長</span><span class="pv">${escapeHtml(p.height||"-")}</span><span class="pk">誕生日</span><span class="pv">${escapeHtml(p.birth||"-")}</span><span class="pk">気質</span><span class="pv">${temper.length?temper.map(x=>`<span class="temperpill">${x.name}</span>`).join(""):"-"}</span><span class="pk">特徴</span><span class="pv">${traits.length?traits.map(id=>traitPillHtml(id)).join(""):"-"}</span><span class="pk">現状</span><span class="pv">${escapeHtml(statusLabel(name))}</span></div>`;
 }else{
  if(!t){
   let virgin=true;
   for(const c of state.countries){const g=c.generals.find(x=>x.name===name);if(g){virgin=!g.nonVirgin;break;}}
   body=`<div class="proftable"><span class="pk">処女性</span><span class="pv">${virgin?"処女":"非処女"}<span class="eyebrow"> — ${escapeHtml(SECRET_STATS.defloration.flavor)}</span></span></div>`;
  }else{
   const s=t.secret||{};
   body=`<div class="proftable">${Object.keys(SECRET_STATS).map(k=>{const st=SECRET_STATS[k];const raw=s[k]!=null?s[k]:st.init;const val=k==="milk"?fmtMilk(raw):(k==="defloration"?(raw?"処女":"非処女"):raw);return `<span class="pk">${st.label}</span><span class="pv">${val}<span class="eyebrow"> — ${escapeHtml(st.flavor)}</span></span>`;}).join("")}</div>`;
  }
 }
 root.innerHTML=`<div class="battleoverlay"><div class="modal"><div class="profwrap"><div class="profimg">${imgSrc?`<img src="${imgSrc}" alt="${escapeHtml(name)}" onerror="this.style.display='none';this.parentNode.textContent='画像準備中';">`:"画像準備中"}${stamp}</div><div><h2>${escapeHtml(name)}</h2><div class="eyebrow">${escapeHtml(aff||"-")}</div><div class="separator"></div>${tabs}${body}</div></div><div class="separator"></div><button id="closeProf">閉じる</button></div></div>`;
 root.querySelector("#closeProf").onclick=()=>root.innerHTML="";
 root.querySelectorAll("[data-ptab]").forEach(b=>b.onclick=()=>openProfile(name,b.dataset.ptab));
}
function openRecord(){
 const root=document.getElementById("modalroot");
 const rows=state.countries.map(c=>{
  const isOwn=c.owner==="player";
  const gens=c.generals.length?c.generals.map(g=>`<div class="rgrow"><span class="namelink" data-prof="${escapeHtml(g.name)}">${escapeHtml(g.name)}</span>（${escapeHtml(g.affiliation)}）${g.temper.map(t=>`<span class="temperpill">${t.name}</span>`).join("")}${(g.traits||[]).map(id=>traitPillHtml(id)).join("")}</div>`).join(""):`<div class="rgrow eyebrow">領主なし</div>`;
  return `<div class="recordgroup"><div class="rgtitle">${c.name}国 <span class="eyebrow">${isOwn?"— 自勢力":"— 敵勢力"}</span></div>${gens}</div>`;
 }).join("");
 root.innerHTML=`<div class="battleoverlay"><div class="modal"><h2>領主録</h2><p>各国の領主の一覧。名前をクリックでプロフィール。</p><div class="separator"></div>${rows}<div class="separator"></div><button id="closeRec">閉じる</button></div></div>`;
 root.querySelector("#closeRec").onclick=()=>root.innerHTML="";
 bindProf(root);
}

/* ===== 捕虜獲得イベントポップアップ ===== */
function openCaptureEvent(caps){captureQueue=caps.slice();drawCaptureEvent();}
function drawCaptureEvent(){
 const root=document.getElementById("modalroot");
 if(!captureQueue.length){root.innerHTML="";return;}
 const rows=captureQueue.map(t=>{
  const p=PROFILE[t.name]||{};
  const imgSrc=p.id?`images/${p.id}.png`:"";
  const report=`${pick(LINES.report.found)}${pick(LINES.report.flight)}${pick(LINES.report.transit)}`;
  return `<div class="capEventRow"><div class="capEventImg">${imgSrc?`<img src="${imgSrc}" alt="${escapeHtml(t.name)}" onerror="this.style.display='none';this.parentNode.textContent='画像準備中';">`:"画像準備中"}</div><div class="capEventBody"><div class="capEventName">${escapeHtml(t.name)} <span class="pill aff">${escapeHtml(t.affiliation||"")}</span>${t.temper.map(x=>`<span class="temperpill">${x.name}</span>`).join("")}</div><div class="capEventFlavor">${escapeHtml(report)}</div><div class="capEventMeta">抵抗 ${t.resist} / ${t.resistMax}</div></div></div>`;
 }).join("");
 root.innerHTML=`<div class="battleoverlay"><div class="modal wide capEventModal"><div class="eyebrow">CAPTURED</div><h2>捕虜獲得報告</h2><p>${captureQueue.length}名の女を捕らえた。</p><div class="capEventList">${rows}</div><div class="separator"></div><button class="primary" id="closeCapEvent">確認した</button></div></div>`;
 root.querySelector("#closeCapEvent").onclick=()=>{root.innerHTML="";captureQueue=[];};
}

/* ===== 捕虜一覧モーダル ===== */
function openCaptiveList(kind){
 const filterMap={cap:"all",niku:"nikubenki",milk:"milk",disp:"display"};
 const f=filterMap[kind]||"all";
 const titleMap={cap:"捕虜",niku:"肉便器",milk:"乳牛",disp:"陳列"};
 const title=titleMap[kind]||"捕虜";
 let list=state.captives;
 if(f==="nikubenki")list=list.filter(t=>t.role==="nikubenki");
 else if(f==="milk")list=list.filter(t=>t.role==="milk");
 else if(f==="display")list=list.filter(t=>t.role==="display");
 const root=document.getElementById("modalroot");
 const rows=list.length?list.map(t=>{
  const p=PROFILE[t.name]||{};
  const imgSrc=p.id?`images/${p.id}.png`:"";
  const assigned=t.assignedCountry!=null;
  const cls=assigned?HOUSING_CLASS[t.role]:"";
  const contactDone=t.contactTurn===state.turn;
  return `<div class="captive"><div class="cimg" data-prof="${escapeHtml(t.name)}">${imgSrc?`<img src="${imgSrc}" alt="${escapeHtml(t.name)}" onerror="this.style.display='none';this.parentNode.textContent='画像準備中';">`:"画像準備中"}${stampHtml(t)}</div><div class="cbody"><div class="cname-row"><h4>◇ <span class="namelink" data-prof="${escapeHtml(t.name)}">${escapeHtml(t.name)}</span></h4></div><div class="cmeta-row"><span class="pill aff">${escapeHtml(t.affiliation||"")}</span>${t.temper.map(x=>`<span class="temperpill">${x.name}</span>`).join("")}${(t.traits||[]).map(id=>traitPillHtml(id)).join("")}<span class="status ${t.status==="ready"?"ready":t.status==="display"?cls:"resist"}">${t.status==="resist"?"抵抗":t.status==="ready"?"屈服可":assigned?`${HOUSING_LABEL[t.role]} @${state.countries[t.assignedCountry].name}`:"未割当"}</span></div>${t.status==="resist"?`<p>抵抗 ${t.resist} / ${t.resistMax}</p>`:(t.effect?`<p>${escapeHtml(t.effect)}</p>`:"")}${t.status==="resist"?`<div class="contactrow">${["shame","pain","kind"].map(k=>{const r=contactResult(t,k);const cls2=r>0?"hit":r<0?"miss":"";return `<button data-contact="${t.id}" data-kind="${k}" ${contactDone?"disabled":""} class="${cls2}">${CONTACT_LABEL[k]}${r>0?" ▲":r<0?" ▼":""}</button>`;}).join("")}</div>`:""}${t.status==="ready"?`<div class="actions"><button data-assign="${t.id}">国に割り当て</button></div>`:""}${assigned?`<div class="actions"><button data-unassign="${t.id}" class="danger">割当解除</button></div>`:""}</div></div>`;
 }).join(""):`<div class="empty">該当する女がいません。</div>`;
 root.innerHTML=`<div class="battleoverlay"><div class="modal wide"><h2>${title} 一覧</h2><p>${list.length}名。</p><div class="separator"></div><div class="captives" style="max-height:64vh">${rows}</div><div class="separator"></div><button id="closeCL">閉じる</button></div></div>`;
 root.querySelector("#closeCL").onclick=()=>root.innerHTML="";
 root.querySelectorAll("[data-contact]").forEach(b=>b.addEventListener("click",()=>{doContact(b.dataset.contact,b.dataset.kind);openCaptiveList(kind);}));
 root.querySelectorAll("[data-assign]").forEach(b=>b.addEventListener("click",()=>openAssign(b.dataset.assign)));
 root.querySelectorAll("[data-unassign]").forEach(b=>b.addEventListener("click",()=>{unassignCaptive(b.dataset.unassign);openCaptiveList(kind);}));
 bindProf(root);
}

/* ===== 募兵モーダル ===== */
function openRecruit(){
 const root=document.getElementById("modalroot");
 const gold=1000,food=300;
 const gain=Math.round(500*recruitBonus());
 const canGold=state.player.gold>=gold;
 const canFood=state.player.food>=food;
 const can=canGold&&canFood&&!state.won&&!isBroke();
 const maxTimes=Math.max(1,Math.min(
  Math.floor(state.player.gold/gold),
  Math.floor(state.player.food/food)
 ));
 root.innerHTML=`<div class="battleoverlay"><div class="modal"><h2>♟ 募兵</h2><p>金と兵糧を投じ、兵を募る。</p><div class="detailgrid" style="grid-template-columns:1fr 1fr 1fr"><div class="mini"><span>消費 金</span><b style="color:var(--gold)">${fmt(gold)}</b></div><div class="mini"><span>消費 兵糧</span><b>${fmt(food)}</b></div><div class="mini"><span>獲得 兵力</span><b style="color:var(--green)">+${fmt(gain)}</b></div></div>${!canGold?`<p class="eyebrow" style="color:var(--red)">金が足りません。</p>`:""}${!canFood?`<p class="eyebrow" style="color:var(--red)">兵糧が足りません。</p>`:""}${isBroke()?`<p class="eyebrow" style="color:var(--red)">破綻中は募兵できません。</p>`:""}<p class="eyebrow">鍛冶場や国家方針「慰安配給令」で獲得兵が増える。</p><div class="separator"></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="primary" id="doRecruit" ${can?"":"disabled"}>募兵する（金 ${fmt(gold)} / 兵糧 ${fmt(food)} → 兵 +${fmt(gain)}）</button>${maxTimes>1?`<button id="doRecruitMax">最大 ${maxTimes} 回（金 ${fmt(gold*maxTimes)} / 兵糧 ${fmt(food*maxTimes)} → 兵 +${fmt(gain*maxTimes)}）</button>`:""}<button id="closeRecruit">閉じる</button></div></div></div>`;
 root.querySelector("#closeRecruit").onclick=()=>root.innerHTML="";
 root.querySelector("#doRecruit").onclick=()=>{recruit();openRecruit();};
 root.querySelector("#doRecruitMax")?.addEventListener("click",()=>{recruitTimes(maxTimes);openRecruit();});
}

function contactResult(t,kind){let sum=0;t.temper.forEach(x=>{const row=CONTACT[x.name]||{};const base=row[kind]||0;sum+=base*(x.stage||1);});return sum;}
function doContact(id,kind){
 const t=state.captives.find(x=>x.id===id);if(!t||t.status!=="resist")return;
 if(t.contactTurn===state.turn){toast("この女には既に接触済みです。");return;}
 const sum=contactResult(t,kind);let delta=0;
 const cap2=treeOwned("cap2")?1.2:1;
 if(sum>0)delta=-sum*5*cap2;else if(sum<0)delta=Math.abs(sum)*4*cap2;else delta=-1;
 t.resist=Math.max(0,t.resist+delta);t.contactTurn=state.turn;t.contacted=true;
 const scene=kind==="shame"?"contactShame":kind==="pain"?"contactPain":"contactKind";const label=CONTACT_LABEL[kind];
 if(delta<0)log(`「${t.name}」に${label}。抵抗 −${Math.abs(delta)}。${pick(LINES[scene]).text}`,"ero");
 else if(delta>0)log(`「${t.name}」に${label}。逆効果で抵抗 +${delta}。${pick(LINES[scene]).text}`,"warn");
 else log(`「${t.name}」に${label}。抵抗はほとんど動かなかった。`,"");
 if(t.resist<=0){t.resist=0;t.status="ready";log(`捕虜「${t.name}」が屈服した。（気質：${temperLabel(t.temper)}）`,"ero");}
 render();
}

function buildingIncome(){
 let food=0,gold=0,troops=0,upkeep=0,prestige=0;
 state.countries.forEach(c=>{
  if(c.owner!=="player")return;
  const cl=c.slots.center.lv;
  food+=200*cl;gold+=150*cl;troops+=100*cl*(treeOwned("army4")?1.25:1);prestige+=10*cl;
  SLOT_KEYS.forEach(k=>{
   const s=c.slots[k];if(!s)return;const B=BUILDINGS[s.type];if(!B)return;
   let mult=1;
   const bonus=adjacencyBonus(c,k).bonus;
   if(bonus[s.type])mult*=bonus[s.type];
   if(B.eff==="food")food+=B.per*s.lv*mult*(treeOwned("home1")?1.15:1);
   if(B.eff==="gold")gold+=B.per*s.lv*mult*(treeOwned("home2")?1.15:1);
   if(B.eff==="troops")troops+=B.per*s.lv*mult;
   if(B.eff==="goldfood"){gold+=B.per*s.lv*mult*(treeOwned("home2")?1.15:1);food+=B.per2*s.lv*mult;}
   upkeep+=B.upkeep*s.lv;
  });
 });
 if(treeOwned("home4")){food*=1.1;gold*=1.1;troops*=1.1;}
 return {food,gold,troops,upkeep,prestige};
}
function kuraMod(){let k=1;state.countries.forEach(c=>{if(c.owner!=="player")return;SLOT_KEYS.forEach(key=>{const s=c.slots[key];if(s&&s.type==="kura")k-=0.04*s.lv;});});return Math.max(0.4,k);}

function housingCapacity(c,type){let n=0;SLOT_KEYS.forEach(k=>{const s=c.slots[k];if(s&&s.type===type)n+=s.lv;});return n;}
function housingUsed(c,type){return state.captives.filter(t=>t.assignedCountry===c.id&&t.role===HOUSING[type]).length;}

function nextTurn(){
 if(state.won)return;state.turn++;
 const dispByBuilding={};
 state.captives.forEach(t=>{
  if(t.status!=="display"||t.role!=="display")return;
  const key=(t.assignedCountry??"x")+"_"+(t.dispSlot??"x");
  (dispByBuilding[key]=dispByBuilding[key]||[]).push(t);
 });
 Object.values(dispByBuilding).forEach(group=>{
  const n=group.length;
  const mult=n>=3?2:n>=2?1.5:1;
  const gain=Math.round(10*n*mult);
  group.forEach(t=>{state.player.prestige+=Math.round((gain/n)*traitEff(t,"display_adj"));t.dispT=(t.dispT||0)+1;});
 });
 let traitPrestige=0,traitGold=0,traitFood=0,traitTroops=0;
 state.captives.forEach(t=>{
  const a=traitAdd(t);
  traitPrestige+=a.prestige;traitGold+=a.gold;traitFood+=a.food;traitTroops+=a.troops;
 });
 state.player.prestige+=traitPrestige;
 state.player.gold+=traitGold;
 state.player.food+=traitFood;
 state.player.troops+=traitTroops;
 state.captives.forEach(t=>{
  if(!t.secret)return;
  if(t.secret.defloration===1&&state.turn>t.capturedTurn){
   t.secret.defloration=0;
   log(`「${t.name}」は処女を失った。`,"ero");
  }
 });
 state.captives.forEach(t=>{
  if(!t.secret)return;
  if(state.turn<t.capturedTurn)return;
  let lo=0,hi=3;
  if(t.role==="nikubenki"){lo=5;hi=10;}
  else if(t.role==="milk"||t.role==="display"){lo=2;hi=5;}
  const inc=lo+Math.floor(Math.random()*(hi-lo+1));
  const before=t.secret.partners;
  t.secret.partners=Math.min(999,t.secret.partners+inc);
  const realInc=t.secret.partners-before;
  t.secret.creampie=Math.min(999,t.secret.creampie+Math.floor(realInc/2));
 });
 state.captives.forEach(t=>{
  if(!t.secret)return;
  if(t.role!=="milk")return;
  const isBig=(t.traits||[]).includes("big_breast");
  const lo=isBig?15:10,hi=isBig?30:20;
  const inc=lo+Math.floor(Math.random()*(hi-lo+1));
  t.secret.milk=Math.min(9999,t.secret.milk+inc);
 });
 state.captives.forEach(t=>{
  if(!t.secret)return;
  if(t.secret.pregCd&&state.turn<t.secret.pregCd)return;
  const last=t.secret.pregBase||0;
  if(t.secret.creampie-last<10)return;
  t.secret.pregBase=t.secret.creampie;
  t.secret.pregCd=state.turn+6;
  if(Math.random()<0.5){
   t.secret.pregnancies=Math.min(999,t.secret.pregnancies+1);
   log(`「${t.name}」が身ごもった。`,"ero");
  }
 });
 state.captives.forEach(t=>{
  if(!t.secret)return;
  if(t.assignedCountry==null)return;
  if(Math.random()<0.45)t.secret.climax=Math.min(999,t.secret.climax+1);
 });
 const inc=buildingIncome();
 inc.food=Math.floor(inc.food)||0;inc.gold=Math.floor(inc.gold)||0;inc.troops=Math.floor(inc.troops)||0;inc.upkeep=Math.floor(inc.upkeep)||0;inc.prestige=Math.floor(inc.prestige)||0;
 state.player.prestige+=inc.prestige;
 let foodCost=0;
 state.captives.forEach(t=>{foodCost+=5;});
 const upkeep=Math.ceil(state.player.troops*.22*kuraMod());
 state.player.food=Math.floor(state.player.food+inc.food-upkeep-foodCost);
 state.player.gold=Math.floor(state.player.gold+inc.gold-inc.upkeep);
 state.player.troops=Math.floor(state.player.troops+inc.troops);
 state.player.prestige=Math.floor(state.player.prestige*.98);
 let msg=`${pick(LINES.turn).text} 設備収入：兵糧 +${inc.food}、金 +${inc.gold}、兵 +${inc.troops}、威信 +${inc.prestige}。軍勢の兵糧消費 −${upkeep}。`;
 if(foodCost)msg+=`捕虜の糧 −${foodCost}。`;
 if(traitPrestige||traitGold||traitFood||traitTroops)msg+=`特性収入：威信 +${traitPrestige}、金 +${traitGold}、兵糧 +${traitFood}、兵 +${traitTroops}。`;
 if(state.player.food<0){const shortage=Math.ceil(Math.abs(state.player.food)/3);state.player.troops=Math.max(0,state.player.troops-shortage);msg+=`兵糧が尽き、兵 ${shortage} が離散した。`;log(msg,"warn");}
 else log(msg,"");
 state.captives.forEach(t=>{
  if(t.status!=="resist")return;
  const mt=temperMinTurn(t.temper),co=temperContactOnly(t.temper);
  const elapsed=state.turn-(t.capturedTurn||0);
  if(elapsed<mt)return;if(co&&!t.contacted)return;
  const cap3=treeOwned("cap3")?1.5:1;
  t.resist-=Math.max(1,Math.round(10*modOf(t.temper,"decay")*cap3));
  if(t.resist<=0){t.resist=0;t.status="ready";log(`捕虜「${t.name}」が屈服した。（気質：${temperLabel(t.temper)}）`,"ero");}
 });
 const tower=KANSHITOU_ESC[maxSpecial("kanshitou")]||1;
 const starve=state.player.food<=0?2:1;
 const cap4=treeOwned("cap4")?0.5:1;
 [...state.captives].forEach(t=>{let ch=t.status==="resist"?.05*(t.resist/Math.max(1,t.resistMax)):.01;ch*=tower*starve*cap4;if(Math.random()<ch)defect(t);});
 if(state.battle){state.battle.round=0;state.battle.lastEnemyTactic=null;state.battle.lastPlayerTactic=null;state.battle.lastResult=null;}
 enemyTurn();
 render();
}

function enemyActionInterval(c){
 const n=c.generals.length;
 let base=n>=5?2:n>=3?3:4;
 if(treeOwned("enemy3"))base+=1;
 return base;
}
const RANK_FOOD={S:4,A:3,B:2,C:1};
function enemyRankFood(c){
 let best="C";
 c.generals.forEach(g=>{if((RANK_FOOD[g.rank]||1)>(RANK_FOOD[best]||1))best=g.rank;});
 return (RANK_FOOD[best]||1)*400;
}
function enemyIncome(c){
 let food=0,gold=0,troops=0;
 const cl=c.slots.center.lv;
 const e1=treeOwned("enemy1")?0.85:1;
 const e2=treeOwned("enemy2")?0.85:1;
 food+=200*cl*e1;gold+=150*cl;troops+=100*cl*e2;
 SLOT_KEYS.forEach(k=>{
  const s=c.slots[k];if(!s)return;const B=BUILDINGS[s.type];if(!B)return;
  if(B.eff==="food")food+=B.per*s.lv*e1;
  if(B.eff==="gold")gold+=B.per*s.lv;
  if(B.eff==="troops")troops+=B.per*s.lv*e2;
  if(B.eff==="goldfood"){gold+=B.per*s.lv;food+=B.per2*s.lv*e1;}
 });
 return {food,gold,troops};
}
function enemyTurn(){
 state.countries.forEach(c=>{
  if(c.owner!=="enemy")return;
  const inc=enemyIncome(c);
  c.food+=inc.food;
  c.gold+=inc.gold;
  c.troops+=inc.troops;
  c.food=Math.max(0,c.food-Math.ceil(c.troops*.034));
  c.food+=enemyRankFood(c);
  c.food=Math.min(c.food,c.troops*2);
  if(c.food===0)c.troops=Math.max(500,c.troops-40);
  if(state.turn<c.nextAct)return;
  c.nextAct=state.turn+enemyActionInterval(c);
  enemyBuild(c);
  enemyRecruit(c);
 });
}
function enemyBuild(c){
 const econ=ECON_TYPES[c.econ]||ECON_TYPES.noukou;
 const existing=SLOT_KEYS.map(k=>c.slots[k]?.type).filter(Boolean);
 const open=unlockedSlots(c).filter(k=>!c.slots[k]);
 for(const type of econ.order){
  if(existing.includes(type))continue;
  const B=BUILDINGS[type];
  if(c.gold<B.cost)continue;
  if(!open.length)break;
  const key=open.shift();
  c.gold-=B.cost;
  c.slots[key]={type,lv:1};
  return;
 }
 if(!open.length&&c.slots.center.lv<CENTER.max){
  const cost=CENTER.cost[c.slots.center.lv];
  if(c.gold>=cost*2){c.gold-=cost;c.slots.center.lv++;}
 }
}
function enemyRecruit(c){
 if(c.gold<2000)return;
 let times=0;
 while(c.gold>=2000&&times<3){
  const spend=Math.floor(c.gold/2);
  const gain=Math.round(spend/2);
  c.gold-=spend;c.troops+=gain;times++;
 }
}

function defect(t){
 state.captives=state.captives.filter(x=>x!==t);state.displayed=state.displayed.filter(id=>id!==t.id);state.player.prestige=Math.max(0,state.player.prestige-8);
 const others=state.countries.filter(c=>c.owner==="enemy"&&c.id!==t.homeId);
 log(`捕虜「${t.name}」が逃げた。${pick(LINES.escape).text}`,"bad");
 if(!others.length){log(`「${t.name}」は行き場を失い、消えた。`,"bad");return;}
 const dst=pick(others);
 dst.generals.push({name:t.name,affiliation:t.affiliation,rank:t.rank,power:t.power,temper:t.temper,traits:t.traits||[],capCount:t.capCount||0,homeId:t.homeId,nonVirgin:t.secret?t.secret.defloration===0:false});
 dst.troops+=Math.round(t.power*.3);log(`「${t.name}」は${dst.name}国へ亡命した。${dst.name}国の兵が増える。`,"bad");
}

function recruit(){if(state.player.gold<1000){toast("金が足りません。");return;}if(state.player.food<300){toast("兵糧が足りません。");return;}state.player.gold-=1000;state.player.food-=300;const gain=Math.round(500*recruitBonus());state.player.troops+=gain;const home=state.countries[HOME];home.troops+=gain;log(`金 1,000 と兵糧 300 を投じ、兵 ${gain} を募った。`,"good");render();toast(`兵力が${gain}増えました。`);}
function recruitTimes(n){
 let total=0,count=0;
 for(let i=0;i<n;i++){
  if(state.player.gold<1000||state.player.food<300)break;
  state.player.gold-=1000;state.player.food-=300;
  const gain=Math.round(500*recruitBonus());
  state.player.troops+=gain;state.countries[HOME].troops+=gain;
  total+=gain;count++;
 }
 if(count)log(`金 ${fmt(count*1000)} と兵糧 ${fmt(count*300)} を投じ、兵 ${fmt(total)} を募った。（${count}回）`,"good");
 render();
 toast(count?`兵力が${fmt(total)}増えました。`:"募兵できませんでした。");
}

/* ===== 戦闘 ===== */
function startBattle(){
 const target=selectedCountry();
 if(target.owner==="player"){toast("自勢力の国です。");return;}
 if(!isAttackable(target.id)){toast("隣接していません。");return;}
 if(state.battle&&state.battle.targetId!==target.id){toast("交戦中の国があります。");return;}
 state.battle={targetId:target.id,playerTroops:state.player.troops,enemyTroops:target.troops,round:0,lastEnemyTactic:null,lastPlayerTactic:null,lastResult:null};
 log(`⚔ ${target.name}国へ侵攻を開始した。${pick(LINES.battleStart).text}`,"warn");
 openBattle();
}
function openBattle(){
 const t=state.countries[state.battle.targetId];
 const root=document.getElementById("modalroot");
 const pRatio=Math.max(0,state.battle.playerTroops)/Math.max(1,state.battle.playerTroops+state.battle.enemyTroops);
 const RANK_ORDER={S:0,A:1,B:2,C:3};
 const sortedGens=[...t.generals].sort((a,b)=>(RANK_ORDER[a.rank]??3)-(RANK_ORDER[b.rank]??3));
 const genImgs=sortedGens.map(g=>{
  const p=PROFILE[g.name]||{};
  const src=p.id?`images/${p.id}.png`:"";
  return `<div class="enemygen"><div class="enemyimg">${src?`<img src="${src}" alt="${escapeHtml(g.name)}" onerror="this.style.display='none';this.parentNode.textContent='画像準備中';">`:"画像準備中"}</div><div class="enemygname">${escapeHtml(g.name)}</div></div>`;
 }).join("");
 const lastTactic=state.battle.lastEnemyTactic?`<div class="lasttactic">前ラウンド：自「<b>${TACTICS[state.battle.lastPlayerTactic].label}</b>」対敵「<b>${TACTICS[state.battle.lastEnemyTactic].label}</b>」 → <b class="${state.battle.lastResult==="好相性"?"res-good":state.battle.lastResult==="悪相性"?"res-bad":""}">${state.battle.lastResult}</b></div>`:`<div class="lasttactic eyebrow">前ラウンドの結果はまだない</div>`;
 const roundLeft=3-state.battle.round;
 root.innerHTML=`<div class="battleoverlay"><div class="modal wide battlemodal"><h2>⚔ ${t.name}国 攻略戦</h2><div class="battlelayout"><div class="battleside">${genImgs}</div><div class="battlemain"><div class="battlebars"><div><div class="eyebrow">自軍 ${fmt(state.battle.playerTroops)}</div><div class="barwrap"><div class="bar" style="width:${pRatio*100}%"></div></div></div><div><div class="eyebrow">敵軍 ${fmt(state.battle.enemyTroops)}</div><div class="barwrap"><div class="bar enemy" style="width:${(1-pRatio)*100}%"></div></div></div></div>${lastTactic}<div class="roundinfo">残り ${roundLeft} ラウンド（このターン）</div><div class="battleactions">${TACTIC_KEYS.map(k=>`<button data-ba="${k}"><b>${TACTICS[k].label}</b><small>${TACTICS[TACTICS[k].beats].label}に強い</small></button>`).join("")}</div><button class="retreatbtn" data-ba="retreat">撤退</button></div></div></div></div>`;
 root.querySelectorAll("[data-ba]").forEach(b=>b.onclick=()=>battleAction(b.dataset.ba));
}
function battleAction(kind){
 if(kind==="retreat"){
  document.getElementById("modalroot").innerHTML="";
  state.battle=null;render();return;
 }
 const t=state.countries[state.battle.targetId];
 const enemyTactic=pickEnemyTactic(t);
 const K=0.2;
 let eLoss=Math.round(state.battle.playerTroops*K);
 let pLoss=Math.round(state.battle.enemyTroops*K);
 let result="互角";
 if(TACTICS[kind].beats===enemyTactic){eLoss=Math.round(eLoss*1.3);pLoss=Math.round(pLoss*0.7);result="好相性";}
 else if(TACTICS[kind].loses===enemyTactic){eLoss=Math.round(eLoss*0.7);pLoss=Math.round(pLoss*1.3);result="悪相性";}
 if(treeOwned("army2"))eLoss=Math.round(eLoss*1.1);
 if(treeOwned("army3"))pLoss=Math.round(pLoss*0.9);
 state.battle.playerTroops=Math.max(0,state.battle.playerTroops-pLoss);
 state.battle.enemyTroops=Math.max(0,state.battle.enemyTroops-eLoss);
 state.battle.round++;
 state.battle.lastEnemyTactic=enemyTactic;
 state.battle.lastPlayerTactic=kind;
 state.battle.lastResult=result;
 log(`⚔ ${t.name}国と交戦。自「${TACTICS[kind].label}」対敵「${TACTICS[enemyTactic].label}」（${result}）。敵 −${eLoss}、自 −${pLoss}。`,result==="好相性"?"good":result==="悪相性"?"warn":"");
 if(state.battle.enemyTroops<=0){winBattle();return;}
 if(state.battle.playerTroops<=0){loseBattle();return;}
 if(state.battle.round>=3){
  document.getElementById("modalroot").innerHTML="";
  log(`⚔ ${t.name}国との交戦は翌ターンへ持ち越し。`,"warn");
  render();return;
 }
 openBattle();
}
function winBattle(){
 const t=state.countries[state.battle.targetId];
 state.player.troops=state.battle.playerTroops;
 t.owner="player";t.troops=Math.round(state.battle.enemyTroops*0.5);
 log(`⚔ ${t.name}国を制圧した。${pick(LINES.win).text}`,"good");
 state.player.prestige+=15;
 const captured=[];
 t.generals.forEach(g=>{const c=captureGeneral(g,t,treeOwned("enemy4")?10:0);if(c)captured.push(c);});
 t.generals=[];
 state.battle=null;
 document.getElementById("modalroot").innerHTML="";
 render();
 if(captured.length){log(`◇ 捕虜 ${captured.length}名を獲得した。`,"ero",{type:"capture",ids:captured.map(c=>c.id)});openCaptureEvent(captured);}
 if(owned().length>=16)state.won=true;
}
function loseBattle(){
 const t=state.countries[state.battle.targetId];
 state.player.troops=state.battle.playerTroops;
 log(`⚔ ${t.name}国に敗れた。${pick(LINES.lose).text}`,"bad");
 state.battle=null;
 document.getElementById("modalroot").innerHTML="";
 render();
}
function captureGeneral(g,country,extra=0){
 if(state.captives.length>=capLimit()+extra){log(`捕虜枠が満杯。${g.name}は解放した。`,"warn");return null;}
 const pt=POWER_TABLE[g.rank]||POWER_TABLE.C;
 const resistMax=Math.round(pt.resist*modOf(g.temper,"resist"));
 const id="c"+Date.now()+"_"+Math.random().toString(36).slice(2,6);
 const cap={id,name:g.name,affiliation:g.affiliation,rank:g.rank,power:g.power,temper:g.temper,traits:g.traits||[],resist:resistMax,resistMax,status:"resist",capturedTurn:state.turn,homeId:country.id,capCount:g.capCount||0,contacted:false,assignedCountry:null,role:null,dispSlot:null,effect:"",secret:initSecret(g.name,g.nonVirgin)};
 state.captives.push(cap);
 log(`◇ ${g.name}を捕らえた。抵抗 ${resistMax}。${sayGeneral(g,"lose")}`,"ero",{type:"capture",ids:[cap.id]});
 return cap;
}

/* ===== 建設モーダル ===== */
function openBuild(){const c=selectedCountry();if(c.owner!=="player"){toast("自勢力の国を選択してください。");return;}const root=document.getElementById("modalroot");root.innerHTML=`<div class="battleoverlay"><div class="modal wide"><h2>⌂ ${c.name}国 の建設</h2><p>町の中心をレベルアップすると、周囲の枠が解放されます。枠をクリックして施設を建て、もう一度クリックでアップグレード・解体できます。同じ施設は1国に1つまで。</p><div class="slotgrid" id="slotgrid"></div><div class="separator"></div><button id="closeBuild">閉じる</button></div></div>`;
 root.querySelector("#closeBuild").onclick=()=>root.innerHTML="";
 drawSlots(c,root);}
function drawSlots(c,root){const g=root.querySelector("#slotgrid");const order=["topLeft","top","topRight","left","center","right"];
 g.innerHTML=order.map(key=>{
  if(key==="center"){const s=c.slots.center;return `<div class="slot center" data-slot="center"><span class="slotbadge">中心</span><div class="slotlabel">${CENTER.names[s.lv-1]}</div><div class="slotlv">Lv${s.lv} / ${CENTER.max}</div><div class="sloteff">${centerNote(s.lv)}</div></div>`;}
  const open=isUnlocked(c,key);
  if(!open)return `<div class="slot locked"><div class="slotlabel">${SLOT_LABEL[key]}</div><div class="lockmark">🔒 未解放</div></div>`;
  const s=c.slots[key];
  if(!s)return `<div class="slot" data-slot="${key}"><div class="slotlabel">${SLOT_LABEL[key]}</div><div class="slotempty">＋ 建設する</div></div>`;
  const B=BUILDINGS[s.type];
  const isHousing=!!HOUSING[s.type];
  const cls=HOUSING_CLASS[HOUSING[s.type]]||"";
  const ctx=slotCtx(c,key);
  let buff="";
  const bvals=Object.values(ctx.bonus);
  if(bvals.length)buff=`<span class="buffmark">◆隣接 ×${Math.max(...bvals).toFixed(1)}</span>`;
  return `<div class="slot ${cls}" data-slot="${key}"><span class="slotbadge">Lv${s.lv}</span>${buff}<div class="slotlabel">${B?B.names[s.lv-1]:s.type}</div><div class="sloteff">${B?B.note(s.lv,ctx):""}</div>${isHousing?`<button class="assignbtn" data-assignslot="${key}">割り当て (${housingUsed(c,s.type)}/${housingCapacity(c,s.type)})</button>`:""}</div>`;
 }).join("");
 g.querySelectorAll("[data-slot]").forEach(el=>el.addEventListener("click",(e)=>{if(e.target.dataset.assignslot)return;slotClick(c,el.dataset.slot);}));
 g.querySelectorAll("[data-assignslot]").forEach(el=>el.addEventListener("click",(e)=>{e.stopPropagation();openAssignToCountry(c.id,el.dataset.assignslot);}));}
function slotClick(c,key){if(key==="center"){openCenterUpgrade(c);return;}const s=c.slots[key];if(!s){openBuildMenu(c,key);}else{openSlotManage(c,key);}}

function openCenterUpgrade(c){const s=c.slots.center;const root=document.getElementById("modalroot");const max=s.lv>=CENTER.max;const cost=max?0:CENTER.cost[s.lv];root.innerHTML=`<div class="battleoverlay"><div class="modal"><h2>${CENTER.names[s.lv-1]}</h2><p>現在 Lv${s.lv} / ${CENTER.max}</p><div class="effect" style="font-size:14px;font-weight:700;color:var(--gold);background:#1c1c1c;border:1px solid #3a3a3a;border-radius:8px;padding:8px 11px;margin:8px 0">${centerNote(s.lv)}</div><p class="flavor" style="font-size:13.5px;color:#b8b8b8;line-height:1.8">${CENTER.desc[s.lv-1]}</p>${max?`<p class="eyebrow">最大レベルです。</p>`:`<p class="eyebrow">Lv${s.lv+1} にアップグレードすると「${SLOT_LABEL[CENTER.unlockAt[s.lv+1]]}」の枠が解放されます。</p>`}<div class="separator"></div><div style="display:flex;gap:8px"><button class="primary" id="upCenter" ${max||state.player.gold<cost?"disabled":""}>${max?"最大":`Lv${s.lv+1} に上げる（金 ${fmt(cost)}）`}</button><button id="closeC">閉じる</button></div></div></div>`;
 root.querySelector("#closeC").onclick=()=>openBuild();
 root.querySelector("#upCenter")?.addEventListener("click",()=>{if(max||state.player.gold<cost)return;state.player.gold-=cost;s.lv++;log(`${c.name}国の${CENTER.names[s.lv-1]}に発展させた。`,"good");if(CENTER.unlockAt[s.lv])log(`「${SLOT_LABEL[CENTER.unlockAt[s.lv]]}」の枠が解放された。`,"good");openBuild();render();});}

function openBuildMenu(c,key){const root=document.getElementById("modalroot");root.innerHTML=`<div class="battleoverlay"><div class="modal wide"><h2>${SLOT_LABEL[key]} に建設</h2><p>建てる施設を選んでください。同じ施設は1国に1つまで。</p><div class="bldtabs"><button data-btab="general" class="${bldTab==="general"?"active":""}">一般</button><button data-btab="special" class="${bldTab==="special"?"active":""}">捕虜建造物</button></div><div class="bldgrid" id="bldlist"></div><div class="separator"></div><button id="closeBM">閉じる</button></div></div>`;
 root.querySelector("#closeBM").onclick=()=>openBuild();
 root.querySelectorAll("[data-btab]").forEach(b=>b.onclick=()=>{bldTab=b.dataset.btab;openBuildMenu(c,key);});
 drawBuildMenu(c,key,root);}
function drawBuildMenu(c,key,root){const el=root.querySelector("#bldlist");const keys=Object.keys(BUILDINGS).filter(k=>BUILDINGS[k].tab===bldTab);
 const existing=SLOT_KEYS.map(k=>c.slots[k]?.type).filter(Boolean);
 const ctx=slotCtx(c,key);
 el.innerHTML=keys.map(k=>{const B=BUILDINGS[k];const cost=B.cost;const dup=existing.includes(k);const cls=HOUSING_CLASS[HOUSING[k]]||"";return `<div class="bldcard ${cls}"><span class="bldbadge ${dup?"built":""}">${dup?"建設済":"未建設"}</span><h4 class="bldname">${B.label}</h4><div class="bldeff">${B.note(1,ctx)}</div><div class="bldflavor">${escapeHtml(descOf(B,1))}</div><div class="bldcost">費用 <b>金 ${fmt(cost)}</b></div><button class="bldbtn" data-build="${k}" ${state.player.gold<cost||dup?"disabled":""}>${dup?"他国に":"建てる"}</button></div>`;}).join("");
 el.querySelectorAll("[data-build]").forEach(b=>b.onclick=()=>{const k=b.dataset.build,B=BUILDINGS[k],cost=B.cost;if(state.player.gold<cost)return;state.player.gold-=cost;c.slots[key]={type:k,lv:1};log(`${c.name}国の${SLOT_LABEL[key]}に${B.names[0]}を建てた。`,"good");openBuild();render();toast(`${B.label}を建てました。`);});}

function openSlotManage(c,key){const s=c.slots[key];const B=BUILDINGS[s.type];const max=s.lv>=B.max;const cost=max?0:B.cost*(s.lv+1);const isHousing=!!HOUSING[s.type];const ctx=slotCtx(c,key);const root=document.getElementById("modalroot");root.innerHTML=`<div class="battleoverlay"><div class="modal"><h2>${B.names[s.lv-1]} Lv${s.lv}</h2><p>${B.note(s.lv,ctx)}</p><p class="flavor">${descOf(B,s.lv)}</p>${max?"":`<div class="nextlvl">次：${B.names[s.lv]} — ${descOf(B,s.lv+1)}</div>`}${isHousing?`<div class="separator"></div><div class="eyebrow">割り当て：${housingUsed(c,s.type)} / ${housingCapacity(c,s.type)}</div><button id="assignHere">この国に女を割り当てる</button>`:""}<div class="separator"></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="primary" id="upSlot" ${max||state.player.gold<cost?"disabled":""}>${max?"最大":`Lv${s.lv+1} に上げる（金 ${fmt(cost)}）`}</button><button class="danger" id="demolish">解体</button><button id="closeSM">閉じる</button></div></div></div>`;
 root.querySelector("#closeSM").onclick=()=>openBuild();
 root.querySelector("#assignHere")?.addEventListener("click",()=>openAssignToCountry(c.id,key));
 root.querySelector("#upSlot")?.addEventListener("click",()=>{if(max||state.player.gold<cost)return;state.player.gold-=cost;s.lv++;log(`${c.name}国の${B.label}を Lv${s.lv} に上げた。`,"good");openBuild();render();});
 root.querySelector("#demolish")?.addEventListener("click",()=>{c.slots[key]=null;log(`${c.name}国の${B.label}を解体した。（返金なし）`,"warn");openBuild();render();toast(`${B.label}を解体しました。`);});}

/* ===== 勢力建造物 ===== */
function openSpecial(){const root=document.getElementById("modalroot");root.innerHTML=`<div class="battleoverlay"><div class="modal"><h2>◆ 勢力建造物</h2><p>勢力全体で1つずつ。国とは別に保有し、レベルアップで強化します。</p><div class="specialrow" id="sprow"></div><div class="separator"></div><button id="closeSp">閉じる</button></div></div>`;
 root.querySelector("#closeSp").onclick=()=>root.innerHTML="";
 drawSpecials(root);}
function drawSpecials(root){const el=root.querySelector("#sprow");const order=["gokusha","kanshitou"];el.innerHTML=order.map(k=>{const S=SPECIALS[k];const s=state.specials[k];const max=s.lv>=S.max;const cost=max?0:S.cost[s.lv];const nm=s.lv>0?S.names[s.lv-1]:S.label;const fl=s.lv>0?S.desc[s.lv-1]:S.desc[0];const previewLv=Math.min(s.lv+1,S.max);return `<div class="spcard"><h4>${nm}</h4><div class="effect">${S.note(previewLv)}</div><p class="flavor">${fl}</p><p class="flavor eyebrow">現在 Lv${s.lv} / ${S.max}</p><div style="display:flex;gap:6px"><button class="primary" data-sp="${k}" ${max||state.player.gold<cost?"disabled":""}>${max?"最大":s.lv===0?`建てる（金 ${fmt(cost)}）`:`Lv${s.lv+1} に強化（金 ${fmt(cost)}）`}</button></div></div>`;}).join("");
 el.querySelectorAll("[data-sp]").forEach(b=>b.onclick=()=>{const k=b.dataset.sp,S=SPECIALS[k],s=state.specials[k];const max=s.lv>=S.max;const cost=max?0:S.cost[s.lv];if(max||state.player.gold<cost)return;state.player.gold-=cost;s.lv++;log(`勢力建造物「${S.names[s.lv-1]}」を Lv${s.lv} に強化した。`,"good");drawSpecials(root);render();});}

/* ===== 国家方針ツリー ===== */
function openTree(){
 const root=document.getElementById("modalroot");
 root.innerHTML=`<div class="battleoverlay"><div class="modal wide"><h2>国家方針</h2><p>威信を払い、永続強化を解放する。系統は下から順に。</p><div class="treegrid" id="treegrid"></div><div class="separator"></div><button id="closeTree">閉じる</button></div></div>`;
 root.querySelector("#closeTree").onclick=()=>root.innerHTML="";
 drawTree(root);
}
function drawTree(root){
 const g=root.querySelector("#treegrid");
 g.innerHTML=Object.keys(TREE).map(sys=>{
  const S=TREE[sys];
  const nodes=S.nodes.map((n,i)=>{
   const owned=treeOwned(n.id);
   const prevOk=i===0||treeOwned(S.nodes[i-1].id);
   const canBuy=!owned&&prevOk&&state.player.prestige>=n.cost;
   const cls=owned?"owned":canBuy?"buyable":"locked";
   return `<div class="treenode c-${sys} ${cls}" data-node="${n.id}" data-sys="${sys}" data-idx="${i}">${nodeName(sys,i)}</div>`;
  }).join("");
  return `<div class="treecol"><div class="treecolhead c-${sys}">${S.label}</div>${nodes}</div>`;
 }).join("");
 g.querySelectorAll("[data-node]").forEach(el=>el.onclick=()=>openTreeNode(el.dataset.sys,el.dataset.idx));
}
function openTreeNode(sys,idx){
 idx=parseInt(idx);
 const S=TREE[sys];const n=S.nodes[idx];
 const owned=treeOwned(n.id);
 const prevOk=idx===0||treeOwned(S.nodes[idx-1].id);
 const canBuy=!owned&&prevOk&&state.player.prestige>=n.cost;
 const root=document.getElementById("modalroot");
 root.innerHTML=`<div class="battleoverlay"><div class="modal"><h2 style="color:${S.color||"var(--gold)"}">${nodeName(sys,idx)}</h2><div class="eyebrow">${S.label}</div><div class="effect" style="border-color:${S.color||"#3a3a3a"};color:${S.color||"var(--gold)"}">${n.effect||""}</div><p class="flavor">${n.flavor||""}</p><p class="eyebrow">コスト：威信 ${fmt(n.cost)}</p>${!prevOk?'<p class="eyebrow">前のノードが未解放です。</p>':""}<div class="separator"></div><div style="display:flex;gap:8px"><button class="primary" id="buyNode" ${canBuy?"":"disabled"} style="${canBuy?`border-color:${S.color};color:${S.color}`:""}">${owned?"解放済":`解放する（威信 ${fmt(n.cost)}）`}</button><button id="backTree">戻る</button></div></div></div>`;
 root.querySelector("#backTree").onclick=()=>openTree();
 root.querySelector("#buyNode")?.addEventListener("click",()=>{if(!canBuy)return;state.player.prestige-=n.cost;state.tree[n.id]=true;log(`国家方針『${nodeName(sys,idx)}』を解放した。`,"good");openTree();render();});
}

/* ===== 割り当てUI ===== */
function openAssign(capId){const t=state.captives.find(x=>x.id===capId);if(!t)return;const root=document.getElementById("modalroot");
 const countries=owned().filter(c=>Object.keys(HOUSING).some(type=>housingCapacity(c,type)>housingUsed(c,type)));
 if(!countries.length){toast("空きのある収容施設がありません。");return;}
 root.innerHTML=`<div class="battleoverlay"><div class="modal"><h2>◇ ${escapeHtml(t.name)} を割り当て</h2><p>割り当て先の国と役割を選んでください。</p><div id="assignList"></div><div class="separator"></div><button id="closeAs">閉じる</button></div></div>`;
 root.querySelector("#closeAs").onclick=()=>root.innerHTML="";
 const list=root.querySelector("#assignList");
 list.innerHTML=countries.map(c=>{const opts=Object.keys(HOUSING).filter(type=>housingCapacity(c,type)>housingUsed(c,type)).map(type=>`<button data-ctry="${c.id}" data-type="${type}">${HOUSING_LABEL[HOUSING[type]]}（${housingUsed(c,type)}/${housingCapacity(c,type)}）</button>`).join("");return `<div class="bcard"><h4>${c.name}国</h4><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">${opts}</div></div>`;}).join("");
 list.querySelectorAll("[data-ctry]").forEach(b=>b.onclick=()=>{assignTo(t.id,parseInt(b.dataset.ctry),b.dataset.type);root.innerHTML="";render();});}
function openAssignToCountry(countryId,slotKey){const c=state.countries[countryId];const type=c.slots[slotKey].type;const role=HOUSING[type];const root=document.getElementById("modalroot");
 const free=state.captives.filter(t=>t.status==="ready"||(t.assignedCountry!=null));
 root.innerHTML=`<div class="battleoverlay"><div class="modal"><h2>${c.name}国 ${HOUSING_LABEL[role]} に割り当て</h2><p>枠：${housingUsed(c,type)} / ${housingCapacity(c,type)}</p><div id="capList"></div><div class="separator"></div><button id="closeAC">閉じる</button></div></div>`;
 root.querySelector("#closeAC").onclick=()=>openBuild();
 const list=root.querySelector("#capList");
 if(!free.length){list.innerHTML='<div class="empty">割り当て可能な女がいません。</div>';return;}
 list.innerHTML=free.map(t=>`<div class="captive"><div class="cbody"><div class="cname-row"><h4>${escapeHtml(t.name)}</h4></div><div class="cmeta-row"><span class="status">${t.assignedCountry!=null?`${HOUSING_LABEL[t.role]} @${state.countries[t.assignedCountry].name}`:"未割当"}</span></div><div class="actions"><button data-pick="${t.id}">ここに割り当て</button></div></div></div>`).join("");
 list.querySelectorAll("[data-pick]").forEach(b=>b.onclick=()=>{assignTo(b.dataset.pick,countryId,type,slotKey);openBuild();render();});}
function assignTo(capId,countryId,type,slotKey){const t=state.captives.find(x=>x.id===capId);if(!t)return;const c=state.countries[countryId];const role=HOUSING[type];
 if(housingCapacity(c,type)<=housingUsed(c,type)){toast("枠が満杯です。");return;}
 if(!slotKey){slotKey=SLOT_KEYS.find(k=>c.slots[k]&&c.slots[k].type===type&&housingUsedForSlot(c,k)<c.slots[k].lv)||SLOT_KEYS.find(k=>c.slots[k]&&c.slots[k].type===type);}
 t.assignedCountry=countryId;t.role=role;t.status="display";t.dispT=0;t.dispSlot=slotKey||null;
 const y=modOf(t.temper,"yield");
 if(role==="milk"){t.effect="";log(`「${t.name}」を${c.name}国の乳牛に割り当てた。${sayCaptive(t,"assignMilk")}`,"milk");}
 else if(role==="nikubenki"){t.effect="";log(`「${t.name}」を${c.name}国の肉便器に割り当てた。${sayCaptive(t,"assignHarami")}`,"niku");}
 else{const m=1+.2*maxSpecial("chinretsu");t.effect=`陳列 · 威信 +${fmt(Math.round(10*modOf(t.temper,"display")*y*traitEff(t,"display_adj")))} / ターン`;if(!state.displayed.includes(t.id))state.displayed.push(t.id);log(`「${t.name}」を${c.name}国で陳列した。${sayCaptive(t,"display")}`,"disp");}
 toast("割り当てました。");
 if(document.getElementById("slotgrid"))openBuild();
}
function housingUsedForSlot(c,key){const s=c.slots[key];if(!s)return 0;return state.captives.filter(t=>t.assignedCountry===c.id&&t.dispSlot===key).length;}
function unassignCaptive(capId){const t=state.captives.find(x=>x.id===capId);if(!t)return;t.assignedCountry=null;t.role=null;t.status="ready";t.effect="";t.dispSlot=null;state.displayed=state.displayed.filter(id=>id!==t.id);log(`「${t.name}」の割り当てを解除した。`,"");render();if(document.getElementById("slotgrid"))openBuild();}

function showVictory(){if(document.getElementById("victoryOverlay"))return;const root=document.getElementById("modalroot");root.innerHTML=`<div class="battleoverlay" id="victoryOverlay"><div class="modal victory"><div class="eyebrow">THE LAND IS UNITED</div><h2>天下統一</h2><p>全16国を統べ、女たちはあなたのものになった。</p><div class="detailgrid"><div class="mini"><span>統一ターン</span><b>${state.turn}</b></div><div class="mini"><span>威信</span><b>${state.player.prestige}</b></div><div class="mini"><span>捕虜</span><b>${state.captives.length}</b></div></div><div class="separator"></div><button class="primary" id="closeVictory">軍記録を振り返る</button></div></div>`;root.querySelector("#closeVictory").onclick=()=>root.innerHTML="";}

/* ===== 説明書 ===== */
function openManual(){const root=document.getElementById("modalroot");root.innerHTML=`<div class="battleoverlay"><div class="modal wide manual"><h2>説明書</h2><p>このゲームの内政・特殊・収容システムの仕組み。</p>${MANUAL_HTML}<div class="separator"></div><button id="closeMan">閉じる</button></div></div>`;
 root.querySelector("#closeMan").onclick=()=>root.innerHTML="";}

document.getElementById("nextTop").onclick=nextTurn;
document.getElementById("saveBtn").onclick=()=>save(false);
document.getElementById("loadBtn").onclick=load;
document.getElementById("manualBtn").onclick=openManual;
document.getElementById("resetBtn").onclick=reset;
document.getElementById("capTabBtn").onclick=()=>openCaptiveList("cap");
document.querySelectorAll("[data-rtab]").forEach(b=>b.addEventListener("click",()=>{rightTab=b.dataset.rtab;render();}));
document.querySelectorAll("[data-ltab]").forEach(b=>b.addEventListener("click",()=>{leftTab=b.dataset.ltab;render();}));

function startModal(){const root=document.getElementById("modalroot");root.innerHTML=`<div class="battleoverlay"><div class="modal"><div class="eyebrow">NEW GAME</div><h2>本拠の名</h2><p>本拠を構え、女を奪う天下取りを始める。国名は変えられる。</p><input id="homeInput" value="${NAMES[HOME]}" maxlength="12"><div class="separator"></div><button class="primary" id="startGo">開始</button></div></div>`;root.querySelector("#startGo").onclick=()=>{const v=root.querySelector("#homeInput").value.trim()||NAMES[HOME];root.innerHTML="";state=initialState(v);selected=HOME;rightTab="country";leftTab="log";render();};}

try{const raw=localStorage.getItem(SAVE_KEY);if(raw){const d=JSON.parse(raw);if(d.state&&Array.isArray(d.state.countries)){state=d.state;if(!state.specials)state.specials={gokusha:{lv:0},kanshitou:{lv:0}};if(!state.tree)state.tree={};if(!("battle" in state))state.battle=null;state.countries.forEach(c=>{if(!c.slots)c.slots=newSlots();if(c.owner==="enemy"){if(!c.econ)c.econ=decideEcon(c.generals||[]);if(!c.nextAct)c.nextAct=state.turn+enemyActionInterval(c);}});state.captives.forEach(t=>{if(!t.secret)t.secret=initSecret(t.name,false);});selected=clamp(d.selected??HOME,0,15);rightTab=d.rightTab||"country";leftTab=d.leftTab||"log";}else{state=initialState();selected=HOME;}}else{state=initialState();selected=HOME;}}catch(e){state=initialState();selected=HOME;}
if(state.turn===1&&!localStorage.getItem(SAVE_KEY)){render();startModal();}else render();
})();