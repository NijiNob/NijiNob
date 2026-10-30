"use strict";

function capLimit(){return 2+centerCapBonus()+specialCapBonus()+(treeOwned("cap1")?4:0);}
function centerCapBonus(){return (state.countries[HOME].slots.center.lv-1)*2;}
function specialCapBonus(){return GOKUSHA_CAP[state.specials.gokusha.lv]||0;}
function recruitLimit(){return RECRUIT_LIMIT+(treeOwned("army3")?2:0);}
function kajibaDmgMult(){let m=1;state.countries.forEach(c=>{if(c.owner!=="player")return;SLOT_KEYS.forEach(k=>{const s=c.slots[k];if(s&&s.type==="kajiba")m*=KAJIBA_DMG[s.lv];});});return m;}
function recruitBonus(){
 let n=0;
 state.countries.forEach(c=>{if(c.owner!=="player")return;SLOT_KEYS.forEach(k=>{const s=c.slots[k];if(s&&s.type==="kajiba")n+=s.lv*0.10;});});
 if(treeOwned("army1"))n+=0.15;
 if(treeOwned("army4"))n+=0.15;
 return 1+n;
}
function buildCostMult(){return treeOwned("home5")?0.9:1;}
function descOf(B,lv){return B.desc[clamp(lv-1,0,4)]||B.desc[0];}
function maxSpecial(type){let m=0;state.countries.forEach(c=>{if(c.owner!=="player")return;SLOT_KEYS.forEach(k=>{const s=c.slots[k];if(s&&s.type===type)m=Math.max(m,s.lv);});});return m;}
function centerNote(lv){return `兵糧 +${200*lv} / 金 +${150*lv} / 兵力 +${100*lv} / 威信 +${10*lv}`;}
function isBroke(){return state.player.gold<0||state.player.food<0;}
function treeOwned(id){return !!state.tree[id];}
function nodeName(sys,idx){const n=TREE[sys].nodes[idx];return n&&n.name?n.name:`${TREE[sys].label} 第${idx+1}ノード`;}

/* ===== 隣接ボーナス ===== */
function workersAt(c,type){return state.captives.filter(t=>t.assignedCountry===c.id&&t.role===HOUSING[type]).length;}
function adjacencyBonus(c,key,targetType){
 const out={};const workers={};
 const target=c.slots[key];
 const tType=targetType||target?.type;
 if(!tType)return {bonus:out,workers};
 neighborsOf(key).forEach(nk=>{
  const ns=c.slots[nk];
  if(!ns)return;
  if(ns.type==="kura"&&["hatake","ichi","kozan","heisya"].includes(tType)){
   out[tType]=Math.max(out[tType]||0,ADJ_LEVEL_TABLE[ns.lv]);
  }
  if(ns.type==="kajiba"&&tType==="heisya"){
   out[tType]=Math.max(out[tType]||0,KAJIBA_ADJ[ns.lv]);
  }
  const def=ADJ_BONUS[ns.type]?.[tType];
  if(!def)return;
  const w=workersAt(c,ns.type);
  if(w<=0)return;
  let v=adjBonusValue(ns.type,tType,w);
  if(treeOwned("home3"))v*=1.20;
  if(ns.type==="sanden"){
   const boosters=state.captives.filter(t=>t.assignedCountry===c.id&&t.role==="nikubenki"&&t.dispSlot===nk);
   boosters.forEach(t=>{v*=traitEff(t,"niku_adj");});
  }
  if(ns.type==="bokujou"){
   const boosters=state.captives.filter(t=>t.assignedCountry===c.id&&t.role==="milk"&&t.dispSlot===nk);
   boosters.forEach(t=>{v*=traitEff(t,"milk_adj");});
  }
  out[tType]=Math.max(out[tType]||0,v);
  workers[tType]=Math.max(workers[tType]||0,w);
 });
 return {bonus:out,workers};
}
function slotCtx(c,key,targetType){
 const r=adjacencyBonus(c,key,targetType);
 return {country:c,slot:key,bonus:r.bonus,workers:r.workers};
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

/* ===== 初期化 ===== */
function initialState(homeName,opts={}){
 const diff=opts.diff||"normal";
 const randomTemper=opts.randomTemper!==false;
 const allVirgin=opts.virgin===true;
 const pool=shuffle(WOMEN);
 const enemyIds=NAMES.map((_,i)=>i).filter(i=>i!==HOME);
 const r=Math.floor(HOME/4),col=HOME%4;
 const neighbors=[];
 [[r-1,col],[r+1,col],[r,col-1],[r,col+1]].forEach(([rr,cc])=>{
  if(rr>=0&&rr<4&&cc>=0&&cc<4)neighbors.push(rr*4+cc);
 });
 let weak=[];
 if(diff==="easy")weak=shuffle(neighbors).slice(0,2);
 else if(diff==="normal")weak=shuffle(neighbors).slice(0,1);
 const weakSet=new Set(weak);
 let mid=[];
 if(diff==="easy"||diff==="normal"){
  const midCand=shuffle(neighbors.filter(id=>!weakSet.has(id)));
  mid=midCand.slice(0,2);
 }
 const midSet=new Set(mid);
 const assign={};
 weak.forEach(id=>{assign[id]=1;});
 mid.forEach(id=>{assign[id]=1;});
 const restIds=enemyIds.filter(id=>!weakSet.has(id)&&!midSet.has(id));
 const RANK_ORDER={S:0,A:1,B:2,C:3};
 const sorted=[...pool].sort((a,b)=>(RANK_ORDER[b[2]]??3)-(RANK_ORDER[a[2]]??3));
 const weakCount=weak.reduce((a,id)=>a+assign[id],0);
 let weakPool=sorted.filter(w=>w[2]==="C");
 if(weakPool.length<weakCount){
  const bPool=sorted.filter(w=>w[2]==="B");
  weakPool=weakPool.concat(bPool.slice(0,weakCount-weakPool.length));
 }
 const weakPoolSet=new Set(weakPool);
 const midCount=mid.length;
 let midPool=sorted.filter(w=>!weakPoolSet.has(w)&&w[2]==="B");
 if(midPool.length<midCount){
  const aPool=sorted.filter(w=>!weakPoolSet.has(w)&&w[2]==="A");
  midPool=midPool.concat(aPool.slice(0,midCount-midPool.length));
 }
 const midPoolSet=new Set(midPool);
 const restPool=sorted.filter(w=>!weakPoolSet.has(w)&&!midPoolSet.has(w));
 const distOf=id=>Math.abs(Math.floor(id/4)-r)+Math.abs(id%4-col);
 const cornerOf=id=>{const rr=Math.floor(id/4),cc=id%4;return (rr===0||rr===3)&&(cc===0||cc===3);};
 const weightOf=id=>{
  const rr=Math.floor(id/4),cc=id%4;
  let w=1+distOf(id);
  if((rr===0||rr===3)&&(cc===0||cc===3))w*=3;
  else if(cc===3)w*=2;
  return w;
};
 const weights=restIds.map(weightOf);
 const totalW=weights.reduce((a,b)=>a+b,0);
 const share=restPool.length;
 let given=0;
 restIds.forEach((id,idx)=>{
  const n=Math.max(1,Math.floor(share*weights[idx]/totalW));
  assign[id]=n;given+=n;
 });
 let left=share-given;
 const order=restIds.map((id,idx)=>idx).sort((a,b)=>weights[b]-weights[a]);
 let oi=0;
 while(left>0&&order.length){
  assign[restIds[order[oi%order.length]]]++;
  left--;oi++;
 }
 let wi=0,mi=0,ri=0;
 const countries=NAMES.map((name,i)=>{
  if(i===HOME){return {id:i,name:homeName||NAMES[HOME],owner:"player",troops:4000,food:2800,gold:1800,slots:newSlots(),generals:[]};}
  const n=assign[i]||1;
  const generals=[];
  for(let j=0;j<n;j++){
   const w=(weakSet.has(i)?weakPool[wi++]:midSet.has(i)?midPool[mi++]:restPool[ri++])||["名もなき女","にじさんじ","C",null];
   const pt=POWER_TABLE[w[2]]||POWER_TABLE.C;
   const temper=randomTemper?rollTemper():(w[3]?fixedTemper(w[3]):rollTemper());
   const cm=modOf(temper,"combat");
   const nonVirgin=allVirgin?false:rollNonVirgin(w[0]);
   generals.push({name:w[0],affiliation:w[1],rank:w[2],power:Math.round(pt.troops*cm),temper,traits:traitsFor(w[0]),capCount:0,homeId:i,nonVirgin});
  }
  const RANK_ORDER2={S:0,A:1,B:2,C:3};
  const topRank=generals.reduce((m,g)=>(RANK_ORDER2[g.rank]<RANK_ORDER2[m]?g.rank:m),"C");
  const scale={S:{food:5000,gold:3000,center:2},A:{food:4000,gold:2400,center:2},B:{food:3000,gold:1800,center:1},C:{food:2000,gold:1200,center:1}}[topRank];
  const slots=newSlots();
  slots.center.lv=scale.center;
  if(scale.center>=2){slots.topLeft={type:"heisya",lv:1};slots.top={type:"hatake",lv:1};}
  let total=generals.reduce((s,g)=>s+g.power,0);
  if(midSet.has(i)&&total>=7000){
   const k=6900/total;
   generals.forEach(g=>{g.power=Math.max(1,Math.round(g.power*k));});
   total=generals.reduce((s,g)=>s+g.power,0);
  }
  const econ=decideEcon(generals);
  return {id:i,name,owner:"enemy",troops:total,food:scale.food,gold:scale.gold,slots,generals,econ,nextAct:1+Math.floor(Math.random()*2)};
 });
 return {turn:1,player:{troops:4000,food:2800,gold:1800,prestige:0,recruitCount:0},countries,captives:[],displayed:[],specials:{gokusha:{lv:0},kanshitou:{lv:0}},tree:{},battle:null,log:[{turn:1,text:"あなたは本拠を構え、女を奪う天下取りの第一歩を踏み出した。",type:"good"}],won:false,lastConquered:null,lastConqueredLord:null,lastInvaded:null};
}
function migrateState(){
 if(!state.player)state.player={troops:2800,food:2800,gold:1800,prestige:0};
 if(state.player.recruitCount==null)state.player.recruitCount=0;
 if(!("lastConquered" in state))state.lastConquered=null;
 if(!("lastInvaded" in state))state.lastInvaded=null;
}

/* ===== 接触 ===== */
function contactResult(t,kind){let sum=0;t.temper.forEach(x=>{const row=CONTACT[x.name]||{};const base=row[kind]||0;sum+=base*(x.stage||1);});return sum;}
function doContact(id,kind){
 const t=state.captives.find(x=>x.id===id);if(!t||t.status!=="resist")return;
 if(t.contactTurn===state.turn){toast("この女には既に接触済みです。");return;}
 const sum=contactResult(t,kind);let delta=0;
 let cap2=1;
 if(treeOwned("cap2"))cap2*=1.1;
 if(treeOwned("cap4"))cap2*=1.25;
 if(sum>0)delta=-sum*5*cap2;else if(sum<0)delta=Math.abs(sum)*4*cap2;else delta=-1;
 t.resist=Math.max(0,t.resist+delta);t.contactTurn=state.turn;t.contacted=true;
 const scene=kind==="shame"?"contactShame":kind==="pain"?"contactPain":"contactKind";const label=CONTACT_LABEL[kind];
 if(delta<0)log(`「${t.name}」に${label}。抵抗 −${Math.abs(delta)}。${pick(LINES[scene]).text}`,"ero");
 else if(delta>0)log(`「${t.name}」に${label}。逆効果で抵抗 +${delta}。${pick(LINES[scene]).text}`,"warn");
 else log(`「${t.name}」に${label}。抵抗はほとんど動かなかった。`,"");
 if(t.resist<=0){t.resist=0;t.status="ready";log(`捕虜「${t.name}」が屈服した。（気質：${temperLabel(t.temper)}）`,"ero");}
 render();
}

/* ===== 収入 ===== */
function buildingIncome(){
 let food=0,gold=0,troops=0,upkeep=0,prestige=0;
 state.countries.forEach(c=>{
  if(c.owner!=="player")return;
  const cl=c.slots.center.lv;
  food+=200*cl;gold+=150*cl;troops+=100*cl*(treeOwned("army5")?1.25:1);prestige+=10*cl;
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
 if(treeOwned("home4")){food*=1.15;gold*=1.15;troops*=1.15;}
 return {food,gold,troops,upkeep,prestige};
}
function kuraMod(){let k=1;state.countries.forEach(c=>{if(c.owner!=="player")return;SLOT_KEYS.forEach(key=>{const s=c.slots[key];if(s&&s.type==="kura")k-=0.04*s.lv;});});return Math.max(0.4,k);}
function housingCapacity(c,type){let n=0;SLOT_KEYS.forEach(k=>{const s=c.slots[k];if(s&&s.type===type)n+=s.lv;});return n;}
function housingUsed(c,type){return state.captives.filter(t=>t.assignedCountry===c.id&&t.role===HOUSING[type]).length;}

/* ===== ターン ===== */
function nextTurn(){
 if(state.won)return;
 const snap=collectTurnSnapshot();
 advanceTurn(snap);
 openNews(snap);
}
function collectTurnSnapshot(){
 const before={};
 state.captives.forEach(t=>{if(t.secret&&t.secret.tierCache)before[t.id]=Object.assign({},t.secret.tierCache);});
 return {before,conquered:state.lastConquered,conqueredLord:state.lastConqueredLord,invaded:state.lastInvaded};
}
function advanceTurn(snap){
 state.turn++;
 state.player.recruitCount=0;
 const dispByBuilding={};
 state.captives.forEach(t=>{
  if(!t.secret)return;
  let rate=0.30;
  if(t.role==="nikubenki")rate=0.90;
  else if(t.role==="milk"||t.role==="display")rate=0.60;
  if(Math.random()<rate)t.secret.climax=Math.min(999,t.secret.climax+1);
 });
 state.captives.forEach(t=>{
  if(t.status!=="display"||t.role!=="display")return;
  const key=(t.assignedCountry??"x")+"_"+(t.dispSlot??"x");
  (dispByBuilding[key]=dispByBuilding[key]||[]).push(t);
 });
 const dispBonus=(treeOwned("cap2")?1.2:1)*(treeOwned("cap4")?1.15:1);
 Object.values(dispByBuilding).forEach(group=>{
  const n=group.length;
  const mult=n>=3?2:n>=2?1.5:1;
  const gain=Math.round(10*n*mult*dispBonus);
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
   if(!t.secret.firstBy)t.secret.firstBy=rollFirstByName();
   log(`「${t.name}」は処女を失った。相手は${t.secret.firstBy}。`,"ero");
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
  if(!t.secret.tierCache)t.secret.tierCache={};
  for(const k in SECRET_STATS){
   if(!SECRET_STATS[k].tiers)continue;
   const tr=tierOf(k,t.secret[k]||0);
   t.secret.tierCache[k]=tr?tr.min:0;
  }
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
 if(state.battle)state.battle.playerTroops=Math.floor(state.battle.playerTroops+inc.troops);
 state.player.prestige=Math.floor(state.player.prestige*.98);
 snap.income={food:inc.food,gold:inc.gold,troops:inc.troops,prestige:inc.prestige,upkeep,foodCost,traitPrestige,traitGold,traitFood,traitTroops};
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
 const cap5=treeOwned("cap5")?0.5:1;
 [...state.captives].forEach(t=>{let ch=t.status==="resist"?.05*(t.resist/Math.max(1,t.resistMax)):.01;ch*=tower*starve*cap5;if(Math.random()<ch)defect(t);});
 if(state.battle){state.battle.round=0;state.battle.lastEnemyTactic=null;state.battle.lastPlayerTactic=null;state.battle.lastResult=null;}
 if(state.turn%5===0){
  const used=new Set();
  state.countries.forEach(c=>c.generals.forEach(g=>used.add(g.name)));
  state.captives.forEach(t=>used.add(t.name));
  const rest=CHARACTERS.filter(c=>!used.has(c.name));
  if(rest.length){
   const atkSet=new Set(attackable().map(c=>c.id));
   const cands=state.countries.filter(c=>c.owner==="enemy"&&!atkSet.has(c.id));
   const pool2=cands.length?cands:state.countries.filter(c=>c.owner==="enemy");
   if(pool2.length){
    const dst=pick(pool2);
    const w=pick(rest);
    const pt=POWER_TABLE[w.rank]||POWER_TABLE.C;
    const temper=rollTemper();
    const cm=modOf(temper,"combat");
    dst.generals.push({name:w.name,affiliation:w.aff,rank:w.rank,power:Math.round(pt.troops*cm),temper,traits:traitsFor(w.name),capCount:0,homeId:dst.id,nonVirgin:false});
    dst.troops+=Math.round(pt.troops*cm);
    log(`◇ ${dst.name}国に新たな領主「${w.name}」が現れた。`,"warn");
   }
  }
 }
 enemyTurn();
 state.lastConquered=null;state.lastInvaded=null;
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
  if(state.battle&&state.battle.targetId===c.id)state.battle.enemyTroops=Math.floor(state.battle.enemyTroops+inc.troops);
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
 dst.generals.push({name:t.name,affiliation:t.affiliation,rank:t.rank,power:t.power,temper:t.temper,traits:t.traits||[],capCount:t.capCount||0,homeId:t.homeId,nonVirgin:t.secret?t.secret.defloration===0:false,secret:t.secret||null});
 dst.troops+=Math.round(t.power*.3);log(`「${t.name}」は${dst.name}国へ亡命した。${dst.name}国の兵が増える。`,"bad");
}

function recruit(){
 if(state.player.recruitCount>=recruitLimit()){toast("募兵は1ターン"+recruitLimit()+"回までです。");return false;}
 if(state.player.gold<1000){toast("金が足りません。");return false;}
 if(state.player.food<300){toast("兵糧が足りません。");return false;}
 state.player.gold-=1000;state.player.food-=300;
 const gain=Math.round(500*recruitBonus());
 state.player.troops+=gain;state.countries[HOME].troops+=gain;
 state.player.recruitCount++;
 log(`金 1,000 と兵糧 300 を投じ、兵 ${gain} を募った。`,"good");
 render();toast(`兵力が${gain}増えました。`);
 return true;
}
function recruitTimes(n){
 const remain=recruitLimit()-state.player.recruitCount;
 n=Math.min(n,remain);
 let total=0,count=0;
 for(let i=0;i<n;i++){
  if(state.player.gold<1000||state.player.food<300)break;
  state.player.gold-=1000;state.player.food-=300;
  const gain=Math.round(500*recruitBonus());
  state.player.troops+=gain;state.countries[HOME].troops+=gain;
  total+=gain;count++;state.player.recruitCount++;
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
 state.lastInvaded=target.id;
 log(`⚔ ${target.name}国へ侵攻を開始した。${pick(LINES.battleStart).text}`,"warn");
 openBattle();
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
 let eMult=1;
 if(treeOwned("army2"))eMult*=1.10;
 if(treeOwned("army4"))eMult*=1.15;
 eMult*=kajibaDmgMult();
 eLoss=Math.round(eLoss*eMult);
 let pMult=1;
 if(treeOwned("army3"))pMult*=0.90;
 if(treeOwned("army5"))pMult*=0.85;
 pLoss=Math.round(pLoss*pMult);
 if(treeOwned("enemy4")){eLoss=Math.round(eLoss*0.90);pLoss=Math.round(pLoss*1.10);}
 if(treeOwned("enemy5")){eLoss=Math.round(eLoss*0.85);pLoss=Math.round(pLoss*1.15);}
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
  state.battle.round=0;
  state.battle.lastEnemyTactic=null;
  state.battle.lastPlayerTactic=null;
  state.battle.lastResult=null;
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
 state.lastConquered=t.id;
 state.lastConqueredLord=t.generals[0]?.name||"領主";
 const captured=[];
 t.generals.forEach(g=>{const c=captureGeneral(g,t,0);if(c)captured.push(c);});
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
 const pt=POWER_TABLE[g.rank]||POWER_TABLE.C;
 let resistMax=Math.round(pt.resist*modOf(g.temper,"resist"));
 if(treeOwned("cap5"))resistMax=Math.round(resistMax*0.75);
 const id="c"+Date.now()+"_"+Math.random().toString(36).slice(2,6);
 const cap={id,name:g.name,affiliation:g.affiliation,rank:g.rank,power:g.power,temper:g.temper,traits:g.traits||[],resist:resistMax,resistMax,status:"resist",capturedTurn:state.turn,homeId:country.id,capCount:g.capCount||0,contacted:false,assignedCountry:null,role:null,dispSlot:null,effect:"",secret:g.secret?g.secret:initSecret(g.name,g.nonVirgin),captor:rollUnit(),escort:pick(ESCORT_UNITS),bind:pick(BIND_STATES),report:{found:pick(LINES.report.found),flight:pick(LINES.report.flight),transit:pick(LINES.report.transit)}}; if(state.captives.length>=capLimit()+extra){
  const others=state.countries.filter(c=>c.owner==="enemy"&&c.id!==country.id);
  if(!others.length){
   log(`捕虜枠が満杯。${g.name}は行き場を失い、解放された。`,"warn");
   return null;
  }
  const dst=pick(others);
  dst.generals.push({name:g.name,affiliation:g.affiliation,rank:g.rank,power:g.power,temper:g.temper,traits:g.traits||[],capCount:g.capCount||0,homeId:g.homeId,nonVirgin:g.nonVirgin});
  dst.troops+=Math.round(g.power*.3);
  log(`捕虜枠が満杯。${g.name}は${dst.name}国へ亡命した。`,"warn");
  return null;
 }
 state.captives.push(cap);
 log(`◇ ${g.name}を捕らえた。抵抗 ${resistMax}。${sayGeneral(g,"lose")}`,"ero",{type:"capture",ids:[cap.id]});
 return cap;
}

/* ===== 割り当て ===== */
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
