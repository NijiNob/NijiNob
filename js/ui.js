"use strict";

function render(){
 document.getElementById("turn").textContent=state.turn;
 renderHud();renderSideTiles();renderMap();renderRight();renderLeft();
 document.querySelectorAll("[data-rtab]").forEach(b=>b.classList.toggle("active",b.dataset.rtab===rightTab));
 document.querySelectorAll("[data-ltab]").forEach(b=>b.classList.toggle("active",b.dataset.ltab===leftTab));
 const readyCount=state.captives.filter(t=>t.status==="ready").length;
 const capBtn=document.getElementById("capTabBtn");
 capBtn.innerHTML="捕虜"+(readyCount?`<span class="tabbadge">${readyCount}</span>`:"");
 capBtn.classList.toggle("alert",readyCount>0);
 capBtn.classList.toggle("active",rightTab==="captives");
 document.getElementById("nextTop").disabled=state.won;
 if(state.won)showVictory();
 save(true);
}
function renderHud(){
 const broke=isBroke();
 const dispTroops=state.battle?state.battle.playerTroops:state.player.troops;
 const data=[
  ["兵力",fmt(dispTroops),"クリックで募兵","clickable"],
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
  const dispTroops=inBattle?state.battle.enemyTroops:c.troops;
  btn.innerHTML=`${badge}<div class="cname">${c.name}</div><div class="cowner">${isOwn?"あなたの勢力":"領主 "+(c.generals[0]?.name||"")}</div>${isOwn?"":`<div class="cstats">兵 ${fmt(dispTroops)}</div>`}`;
  btn.addEventListener("click",()=>{
   if(state.battle&&state.battle.targetId===c.id){openBattle();return;}
   selected=c.id;
   if(c.owner==="player")rightTab="country";
   render();
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
 const filters=[["all","全捕虜"],["resist","抵抗中"],["ready","未割当"],["nikubenki","肉便器"],["milk","乳牛"],["display","陳列"]];
 let list=state.captives;
 if(capFilter==="resist")list=list.filter(t=>t.status==="resist");
 else if(capFilter==="ready")list=list.filter(t=>t.status==="ready");
 else if(capFilter==="nikubenki")list=list.filter(t=>t.role==="nikubenki");
 else if(capFilter==="milk")list=list.filter(t=>t.role==="milk");
 else if(capFilter==="display")list=list.filter(t=>t.role==="display");
 const fbar=`<div class="filterbar">${filters.map(f=>`<button data-filter="${f[0]}" class="${capFilter===f[0]?"active":""}">${f[1]}</button>`).join("")}</div>`;
 if(!state.captives.length){el.innerHTML=fbar+'<div class="empty">まだ捕虜はいません。領主を撃破・降伏させて捕らえよう。</div>';bindFilter(el);return;}
 if(!list.length){el.innerHTML=fbar+'<div class="empty">該当する捕虜がいません。</div>';bindFilter(el);return;}
 el.innerHTML=fbar+`<div class="captives tabcaptives">${list.map(t=>{const contactDone=t.contactTurn===state.turn;const mt=temperMinTurn(t.temper),co=temperContactOnly(t.temper);const turnLeft=Math.max(0,mt-(state.turn-(t.capturedTurn||0)));const assigned=t.assignedCountry!=null;const cls=assigned?HOUSING_CLASS[t.role]:"";const p=PROFILE[t.name]||{};const imgSrc=p.id?`images/${p.id}.png`:"";return `<div class="captive"><div class="cimg" data-prof="${escapeHtml(t.name)}">${imgSrc?`<img src="${imgSrc}" alt="${escapeHtml(t.name)}" onerror="this.style.display='none';this.parentNode.textContent='画像準備中';">`:"画像準備中"}${stampHtml(t)}</div><div class="cbody"><div class="cname-row"><h4>◇ <span class="namelink" data-prof="${escapeHtml(t.name)}">${escapeHtml(t.name)}</span></h4></div><div class="cmeta-row"><span class="pill aff">${escapeHtml(t.affiliation||"")}</span>${t.temper.map(x=>`<span class="temperpill">${x.name}</span>`).join("")}${(t.traits||[]).map(id=>traitPillHtml(id)).join("")}<span class="status ${t.status==="ready"?"ready":t.status==="display"?cls:"resist"}">${t.status==="resist"?"抵抗":t.status==="ready"?"屈服可":assigned?`${HOUSING_LABEL[t.role]} @${state.countries[t.assignedCountry].name}`:"未割当"}</span></div>${t.status==="resist"?`<p>抵抗 ${t.resist} / ${t.resistMax}${turnLeft>0?"（あと"+turnLeft+"ターンで減衰開始）":co&&!t.contacted?"（接触するまで減衰せず）":""}</p>`:(t.effect?`<p>${escapeHtml(t.effect)}</p>`:"")}${t.status==="resist"?`<div class="contactrow">${["shame","pain","kind"].map(k=>{const r=contactResult(t,k);const cls2=r>0?"hit":r<0?"miss":"";return `<button data-contact="${t.id}" data-kind="${k}" ${contactDone?"disabled":""} class="${cls2}">${CONTACT_LABEL[k]}${r>0?" ▲":r<0?" ▼":""}</button>`;}).join("")}</div>`:""}${t.status==="ready"?`<div class="actions"><button data-assign="${t.id}">国に割り当て</button></div>`:""}${assigned?`<div class="actions"><button data-unassign="${t.id}" class="danger">割当解除</button></div>`:""}</div></div>`;}).join("")}</div>`;
 bindFilter(el);
 el.querySelectorAll("[data-contact]").forEach(b=>b.addEventListener("click",()=>doContact(b.dataset.contact,b.dataset.kind)));
 el.querySelectorAll("[data-assign]").forEach(b=>b.addEventListener("click",()=>openAssign(b.dataset.assign)));
 el.querySelectorAll("[data-unassign]").forEach(b=>b.addEventListener("click",()=>unassignCaptive(b.dataset.unassign)));
 bindProf(el);
}
function bindFilter(el){el.querySelectorAll("[data-filter]").forEach(b=>b.addEventListener("click",()=>{capFilter=b.dataset.filter;render();}));}
function renderLeft(){
 const el=document.getElementById("leftbody");
 const fbar=`<div class="filterbar">${LOG_FILTERS.map(f=>`<button data-logfilter="${f[0]}" class="${logFilter===f[0]?"active":""}">${f[1]}</button>`).join("")}</div>`;
 const list=state.log.filter(l=>logFilter==="all"||(LOG_CAT[l.type]||"system")===logFilter);
 el.innerHTML=fbar+`<div class="log">${list.map(l=>{const i=state.log.indexOf(l);return `<div class="logitem ${l.type}"><span class="lt">T${l.turn}</span>${escapeHtml(l.text)}${l.data&&l.data.type==="capture"?`<button class="logreopen" data-logidx="${i}">再表示</button>`:""}</div>`;}).join("")}</div>`;
 el.querySelectorAll("[data-logfilter]").forEach(b=>b.addEventListener("click",()=>{logFilter=b.dataset.logfilter;render();}));
 el.querySelectorAll("[data-logidx]").forEach(b=>b.addEventListener("click",()=>{
  const l=state.log[parseInt(b.dataset.logidx)];
  if(!l||!l.data)return;
  const caps=l.data.ids.map(id=>state.captives.find(t=>t.id===id)).filter(Boolean);
  if(caps.length)openCaptureEvent(caps);
  else toast("この捕虜は既に逃げたか、解放されています。");
 }));
}
function bindProf(el){el.querySelectorAll("[data-prof]").forEach(n=>n.addEventListener("click",()=>openProfile(n.dataset.prof)));}

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
function secretValHtml(t,key){
 const st=SECRET_STATS[key];
 const s=t.secret||{};
 const raw=s[key]!=null?s[key]:st.init;
 const val=key==="milk"?fmtMilk(raw):(key==="defloration"?(raw?"処女":"非処女"):raw);
 if(!st.tiers)return `<span class="pv">${val}</span>`;
 return `<span class="pv secretval" data-secret="${key}" data-cap="${t.id}">${val}</span>`;
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
   body=`<div class="proftable">${Object.keys(SECRET_STATS).map(k=>{
    if(k==="defloration"){
     const raw=s.defloration!=null?s.defloration:SECRET_STATS.defloration.init;
     const second=raw?`<span class="eyebrow">初体験の相手 —</span>`:`<span class="eyebrow">初体験の相手 — ${escapeHtml(s.firstBy||"不明")}</span>`;
     return `<span class="pk">${SECRET_STATS[k].label}</span><span class="pv">${raw?"処女":"非処女"}<br>${second}</span>`;
    }
    return `<span class="pk">${SECRET_STATS[k].label}</span>${secretValHtml(t,k)}`;
   }).join("")}</div>`;
  }
 }
 root.innerHTML=`<div class="battleoverlay"><div class="modal"><div class="profwrap"><div class="profimg">${imgSrc?`<img src="${imgSrc}" alt="${escapeHtml(name)}" onerror="this.style.display='none';this.parentNode.textContent='画像準備中';">`:"画像準備中"}${stamp}</div><div><h2>${escapeHtml(name)}</h2><div class="eyebrow">${escapeHtml(aff||"-")}</div><div class="separator"></div>${tabs}${body}</div></div><div class="separator"></div><button id="closeProf">閉じる</button></div></div>`;
 root.querySelector("#closeProf").onclick=()=>root.innerHTML="";
 root.querySelectorAll("[data-ptab]").forEach(b=>b.onclick=()=>openProfile(name,b.dataset.ptab));
 root.querySelectorAll("[data-secret]").forEach(n=>n.onclick=()=>openSecretTier(n.dataset.cap,n.dataset.secret));
}
function openSecretTier(capId,key){
 const t=state.captives.find(x=>x.id===capId);
 if(!t)return;
 const st=SECRET_STATS[key];
 const raw=(t.secret&&t.secret[key]!=null)?t.secret[key]:st.init;
 const tier=tierOf(key,raw);
 const root=document.getElementById("modalroot");
 root.innerHTML=`<div class="battleoverlay"><div class="modal"><h2>${escapeHtml(st.label)}</h2><div class="eyebrow">${escapeHtml(t.name)}</div><div class="separator"></div><p class="secrettier">${escapeHtml(tier?tier.text:"—")}</p><p class="eyebrow">${escapeHtml(st.flavor)}</p><div class="separator"></div><button id="closeST">閉じる</button></div></div>`;
 root.querySelector("#closeST").onclick=()=>openProfile(t.name,"secret");
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

/* ===== 捕虜獲得イベント ===== */
function openCaptureEvent(caps){captureQueue=caps.slice();drawCaptureEvent();}
function drawCaptureEvent(){
 const root=document.getElementById("modalroot");
 if(!captureQueue.length){root.innerHTML="";return;}
 const rows=captureQueue.map(t=>{
  const p=PROFILE[t.name]||{};
  const imgSrc=p.id?`images/${p.id}.png`:"";
  const report=t.report?`${t.report.found}${t.report.flight}${t.report.transit}`:`${pick(LINES.report.found)}${pick(LINES.report.flight)}${pick(LINES.report.transit)}`;
  const country=state.countries[t.homeId];
  captureSeq++;
  const left=`
   <div class="repfield"><span class="repk">捕獲日</span><span class="repv">第 ${t.capturedTurn} ターン</span></div>
   <div class="repfield"><span class="repk">捕獲者</span><span class="repv">${escapeHtml(t.captor||"-")}</span></div>
   <div class="repfield"><span class="repk">捕獲地</span><span class="repv">${escapeHtml(country?country.name:"-")}国</span></div>
   <div class="repfield"><span class="repk">抵抗値</span><span class="repv">${t.resist} / ${t.resistMax}</span></div>
   <div class="repfield"><span class="repk">輸送部隊</span><span class="repv">${escapeHtml(t.escort||"-")}</span></div>
   <div class="repfield"><span class="repk">拘束状況</span><span class="repv">${escapeHtml(t.bind||"-")}</span></div>`;
  return `<div class="capEventRow"><div class="capEventImg">${imgSrc?`<img src="${imgSrc}" alt="${escapeHtml(t.name)}" onerror="this.style.display='none';this.parentNode.textContent='画像準備中';">`:"画像準備中"}</div><div class="capEventBody"><div class="capEventName">${escapeHtml(t.name)} <span class="pill aff">${escapeHtml(t.affiliation||"")}</span>${t.temper.map(x=>`<span class="temperpill">${x.name}</span>`).join("")}</div><div class="repcols"><div class="repleft">${left}</div><div class="repright"><div class="reph">所見</div><div class="reptext">${escapeHtml(report)}</div></div></div></div></div>`;
 }).join("");
 root.innerHTML=`<div class="battleoverlay"><div class="modal wide capEventModal"><div class="rephead"><div class="repno">第 ${captureSeq} 号</div><div class="reptitle">戦闘報告書</div><div class="repsub">${escapeHtml(state.countries[HOME].name)} 本拠</div></div><div class="reprule"></div><p class="repintro">下記の者を捕獲した。収容・取扱いについて上申する。</p><div class="capEventList">${rows}</div><div class="reprule"></div><button class="primary" id="closeCapEvent">確認した</button></div></div>`;
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
 const left=recruitLimit()-state.player.recruitCount;
 const canGold=state.player.gold>=gold;
 const canFood=state.player.food>=food;
 const can=canGold&&canFood&&!state.won&&!isBroke()&&left>0;
 const maxTimes=Math.max(0,Math.min(left,Math.floor(state.player.gold/gold),Math.floor(state.player.food/food)));
 root.innerHTML=`<div class="battleoverlay"><div class="modal"><h2>♟ 募兵</h2><p>金と兵糧を投じ、兵を募る。</p><div class="recruitcount">募兵 ${state.player.recruitCount} / ${recruitLimit()}</div><div class="detailgrid" style="grid-template-columns:1fr 1fr 1fr"><div class="mini"><span>消費 金</span><b style="color:var(--gold)">${fmt(gold)}</b></div><div class="mini"><span>消費 兵糧</span><b>${fmt(food)}</b></div><div class="mini"><span>獲得 兵力</span><b style="color:var(--green)">+${fmt(gain)}</b></div></div>${!canGold?`<p class="eyebrow" style="color:var(--red)">金が足りません。</p>`:""}${!canFood?`<p class="eyebrow" style="color:var(--red)">兵糧が足りません。</p>`:""}${left<=0?`<p class="eyebrow" style="color:var(--red)">このターンの募兵は上限（${recruitLimit()}回）に達しました。</p>`:""}${isBroke()?`<p class="eyebrow" style="color:var(--red)">破綻中は募兵できません。</p>`:""}<p class="eyebrow">鍛冶場や国家方針「慰安徴発令」で獲得兵が増える。</p><div class="separator"></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="primary" id="doRecruit" ${can?"":"disabled"}>募兵する（金 ${fmt(gold)} / 兵糧 ${fmt(food)} → 兵 +${fmt(gain)}）</button>${maxTimes>1?`<button id="doRecruitMax">最大 ${maxTimes} 回（金 ${fmt(gold*maxTimes)} / 兵糧 ${fmt(food*maxTimes)} → 兵 +${fmt(gain*maxTimes)}）</button>`:""}<button id="closeRecruit">閉じる</button></div></div></div>`;
 root.querySelector("#closeRecruit").onclick=()=>root.innerHTML="";
 root.querySelector("#doRecruit").onclick=()=>{recruit();openRecruit();};
 root.querySelector("#doRecruitMax")?.addEventListener("click",()=>{recruitTimes(maxTimes);openRecruit();});
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
  if(bvals.length)buff=`<span class="buffmark">◆隣接 ×${Math.max(...bvals).toFixed(2)}</span>`;
  return `<div class="slot ${cls}" data-slot="${key}"><span class="slotbadge">Lv${s.lv}</span>${buff}<div class="slotlabel">${B?B.names[s.lv-1]:s.type}</div><div class="sloteff">${B?B.note(s.lv,ctx):""}</div>${isHousing?`<button class="assignbtn" data-assignslot="${key}">割り当て (${housingUsed(c,s.type)}/${housingCapacity(c,s.type)})</button>`:""}</div>`;
 }).join("");
 g.querySelectorAll("[data-slot]").forEach(el=>el.addEventListener("click",(e)=>{if(e.target.dataset.assignslot)return;slotClick(c,el.dataset.slot);}));
 g.querySelectorAll("[data-assignslot]").forEach(el=>el.addEventListener("click",(e)=>{e.stopPropagation();openAssignToCountry(c.id,el.dataset.assignslot);}));}
function slotClick(c,key){if(key==="center"){openCenterUpgrade(c);return;}const s=c.slots[key];if(!s){openBuildMenu(c,key);}else{openSlotManage(c,key);}}

function adjBoxHtml(ctx,only){
 const b=ctx?.bonus||{};const wk=ctx?.workers||{};
 const lines=[];
 const mk=(key,label)=>{if((!only||only===key)&&b[key]){const w=wk[key];lines.push(`${label} ×${b[key].toFixed(2)}${w?`（${w}人）`:""}`);}};
 mk("heisya","兵力");mk("kozan","金");mk("hatake","兵糧");mk("ichi","金");
 if(!lines.length)return "";
 return `<div class="adjbox"><div class="adjhead">◆ 隣接ボーナス</div>${lines.map(l=>`<div class="adjline">${l}</div>`).join("")}</div>`;
}
const GIVES_LABEL={
 kura:"畑・市・鉱山・兵舎の産出を上げる（Lvで倍率上昇）",
 kajiba:"兵舎の効率を上げる（Lvで倍率上昇）",
 sanden:"隣接する兵舎の兵力・鉱山の金を大きく上げる（女の人数依存）",
 bokujou:"隣接する畑の兵糧・市の金を大きく上げる（女の人数依存）"
};
function givesAdjHtml(k){
 const txt=GIVES_LABEL[k];
 if(!txt)return "";
 return `<div class="givesbox"><div class="giveshead">◆ この建物が与える隣接</div><div class="givesline">${txt}</div></div>`;
}

function openCenterUpgrade(c){const s=c.slots.center;const root=document.getElementById("modalroot");const max=s.lv>=CENTER.max;const rawCost=max?0:CENTER.cost[s.lv];const cost=Math.round(rawCost*buildCostMult());root.innerHTML=`<div class="battleoverlay"><div class="modal"><h2>${CENTER.names[s.lv-1]}</h2><p>現在 Lv${s.lv} / ${CENTER.max}</p><div class="effect" style="font-size:14px;font-weight:700;color:var(--gold);background:#1c1c1c;border:1px solid #3a3a3a;border-radius:8px;padding:8px 11px;margin:8px 0">${centerNote(s.lv)}</div><p class="flavor" style="font-size:13.5px;color:#b8b8b8;line-height:1.8">${CENTER.desc[s.lv-1]}</p>${max?`<p class="eyebrow">最大レベルです。</p>`:`<p class="eyebrow">Lv${s.lv+1} にアップグレードすると「${SLOT_LABEL[CENTER.unlockAt[s.lv+1]]}」の枠が解放されます。</p>`}<div class="separator"></div><div style="display:flex;gap:8px"><button class="primary" id="upCenter" ${max||state.player.gold<cost?"disabled":""}>${max?"最大":`Lv${s.lv+1} に上げる（金 ${fmt(cost)}）`}</button><button id="closeC">閉じる</button></div></div></div>`;
 root.querySelector("#closeC").onclick=()=>openBuild();
 root.querySelector("#upCenter")?.addEventListener("click",()=>{if(max||state.player.gold<cost)return;state.player.gold-=cost;s.lv++;log(`${c.name}国の${CENTER.names[s.lv-1]}に発展させた。`,"good");if(CENTER.unlockAt[s.lv])log(`「${SLOT_LABEL[CENTER.unlockAt[s.lv]]}」の枠が解放された。`,"good");openBuild();render();});}

function openBuildMenu(c,key){const root=document.getElementById("modalroot");root.innerHTML=`<div class="battleoverlay"><div class="modal wide"><h2>${SLOT_LABEL[key]} に建設</h2><p>建てる施設を選んでください。同じ施設は1国に1つまで。</p><div class="bldtabs"><button data-btab="general" class="${bldTab==="general"?"active":""}">一般</button><button data-btab="special" class="${bldTab==="special"?"active":""}">捕虜建造物</button></div><div class="bldgrid" id="bldlist"></div><div class="separator"></div><button id="closeBM">閉じる</button></div></div>`;
 root.querySelector("#closeBM").onclick=()=>openBuild();
 root.querySelectorAll("[data-btab]").forEach(b=>b.onclick=()=>{bldTab=b.dataset.btab;openBuildMenu(c,key);});
 drawBuildMenu(c,key,root);}
function drawBuildMenu(c,key,root){
 const el=root.querySelector("#bldlist");
 const keys=Object.keys(BUILDINGS).filter(k=>BUILDINGS[k].tab===bldTab);
 const existing=SLOT_KEYS.map(k=>c.slots[k]?.type).filter(Boolean);
 el.innerHTML=keys.map(k=>{
  const B=BUILDINGS[k];const cost=Math.round(B.cost*buildCostMult());
  const dup=existing.includes(k);const cls=HOUSING_CLASS[HOUSING[k]]||"";
  const ctx=slotCtx(c,key,k);
  return `<div class="bldcard ${cls}"><span class="bldbadge ${dup?"built":""}">${dup?"建設済":"未建設"}</span><h4 class="bldname">${B.label}</h4><div class="bldeff">${B.note(1,ctx)}</div>${givesAdjHtml(k)}${adjBoxHtml(ctx,k)}<div class="bldcost">費用 <b>金 ${fmt(cost)}</b></div><button class="bldbtn" data-build="${k}" ${state.player.gold<cost||dup?"disabled":""}>${dup?"この国に建設済":`建てる（金 ${fmt(cost)}）`}</button></div>`;
 }).join("");
 el.querySelectorAll("[data-build]").forEach(b=>b.onclick=()=>{const k=b.dataset.build,B=BUILDINGS[k],cost=Math.round(B.cost*buildCostMult());if(state.player.gold<cost)return;state.player.gold-=cost;c.slots[key]={type:k,lv:1};log(`${c.name}国の${SLOT_LABEL[key]}に${B.names[0]}を建てた。`,"good");openBuild();render();toast(`${B.label}を建てました。`);});
}
function openSlotManage(c,key){
 const s=c.slots[key];const B=BUILDINGS[s.type];const max=s.lv>=B.max;
 const rawCost=max?0:B.cost*(s.lv+1);const cost=Math.round(rawCost*buildCostMult());
 const isHousing=!!HOUSING[s.type];const ctx=slotCtx(c,key);
 const root=document.getElementById("modalroot");
 root.innerHTML=`<div class="battleoverlay"><div class="modal"><h2>${B.names[s.lv-1]} Lv${s.lv}</h2><p>${B.note(s.lv,ctx)}</p><p class="flavor">${descOf(B,s.lv)}</p>${adjBoxHtml(ctx)}${max?"":`<div class="nextlvl">次：${B.names[s.lv]} — ${descOf(B,s.lv+1)}</div>`}${isHousing?`<div class="separator"></div><div class="eyebrow">割り当て：${housingUsed(c,s.type)} / ${housingCapacity(c,s.type)}</div><button id="assignHere">この国に女を割り当てる</button>`:""}<div class="separator"></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="primary" id="upSlot" ${max||state.player.gold<cost?"disabled":""}>${max?"最大":`Lv${s.lv+1} に上げる（金 ${fmt(cost)}）`}</button><button class="danger" id="demolish">解体</button><button id="closeSM">閉じる</button></div></div></div>`;
 root.querySelector("#closeSM").onclick=()=>openBuild();
 root.querySelector("#assignHere")?.addEventListener("click",()=>openAssignToCountry(c.id,key));
 root.querySelector("#upSlot")?.addEventListener("click",()=>{if(max||state.player.gold<cost)return;state.player.gold-=cost;s.lv++;log(`${c.name}国の${B.label}を Lv${s.lv} に上げた。`,"good");openBuild();render();});
 root.querySelector("#demolish")?.addEventListener("click",()=>{c.slots[key]=null;log(`${c.name}国の${B.label}を解体した。（返金なし）`,"warn");openBuild();render();toast(`${B.label}を解体しました。`);});
}
function openSpecial(){const root=document.getElementById("modalroot");root.innerHTML=`<div class="battleoverlay"><div class="modal"><h2>◆ 勢力建造物</h2><p>勢力全体で1つずつ。国とは別に保有し、レベルアップで強化します。</p><div class="specialrow" id="sprow"></div><div class="separator"></div><button id="closeSp">閉じる</button></div></div>`;
 root.querySelector("#closeSp").onclick=()=>root.innerHTML="";
 drawSpecials(root);}
function drawSpecials(root){const el=root.querySelector("#sprow");const order=["gokusha","kanshitou"];el.innerHTML=order.map(k=>{const S=SPECIALS[k];const s=state.specials[k];const max=s.lv>=S.max;const rawCost=max?0:S.cost[s.lv];const cost=Math.round(rawCost*buildCostMult());const nm=s.lv>0?S.names[s.lv-1]:S.label;const fl=s.lv>0?S.desc[s.lv-1]:S.desc[0];const previewLv=Math.min(s.lv+1,S.max);return `<div class="spcard"><h4>${nm}</h4><div class="effect">${S.note(previewLv)}</div><p class="flavor">${fl}</p><p class="flavor eyebrow">現在 Lv${s.lv} / ${S.max}</p><div style="display:flex;gap:6px"><button class="primary" data-sp="${k}" ${max||state.player.gold<cost?"disabled":""}>${max?"最大":s.lv===0?`建てる（金 ${fmt(cost)}）`:`Lv${s.lv+1} に強化（金 ${fmt(cost)}）`}</button></div></div>`;}).join("");
 el.querySelectorAll("[data-sp]").forEach(b=>b.onclick=()=>{const k=b.dataset.sp,S=SPECIALS[k],s=state.specials[k];const max=s.lv>=S.max;const rawCost=max?0:S.cost[s.lv];const cost=Math.round(rawCost*buildCostMult());if(max||state.player.gold<cost)return;state.player.gold-=cost;s.lv++;log(`勢力建造物「${S.names[s.lv-1]}」を Lv${s.lv} に強化した。`,"good");drawSpecials(root);render();});}

/* ===== 方針ツリー ===== */
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
 const flav=(n.flavor||"").split("\n\n").map(p=>`<p class="flavor">${p.replace(/\*\*(.+?)\*\*/g,"<b>$1</b>")}</p>`).join("");
 root.innerHTML=`<div class="battleoverlay"><div class="modal"><h2 style="color:${S.color||"var(--gold)"}">${nodeName(sys,idx)}</h2><div class="eyebrow">${S.label}</div><div class="effect" style="border-color:${S.color||"#3a3a3a"};color:${S.color||"var(--gold)"}">${n.effect||""}</div>${flav}<p class="eyebrow">コスト：威信 ${fmt(n.cost)}</p>${!prevOk?'<p class="eyebrow">前のノードが未解放です。</p>':""}<div class="separator"></div><div style="display:flex;gap:8px"><button class="primary" id="buyNode" ${canBuy?"":"disabled"} style="${canBuy?`border-color:${S.color};color:${S.color}`:""}">${owned?"解放済":`解放する（威信 ${fmt(n.cost)}）`}</button><button id="backTree">戻る</button></div></div></div>`;
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

function showVictory(){if(document.getElementById("victoryOverlay"))return;const root=document.getElementById("modalroot");root.innerHTML=`<div class="battleoverlay" id="victoryOverlay"><div class="modal victory"><div class="eyebrow">THE LAND IS UNITED</div><h2>天下統一</h2><p>全16国を統べ、女たちはあなたのものになった。</p><div class="detailgrid"><div class="mini"><span>統一ターン</span><b>${state.turn}</b></div><div class="mini"><span>威信</span><b>${state.player.prestige}</b></div><div class="mini"><span>捕虜</span><b>${state.captives.length}</b></div></div><div class="separator"></div><button class="primary" id="closeVictory">軍記録を振り返る</button></div></div>`;root.querySelector("#closeVictory").onclick=()=>root.innerHTML="";}
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
 const roundLeft=Math.max(0,3-state.battle.round);
 const roundDone=state.battle.round>=3;
 root.innerHTML=`<div class="battleoverlay"><div class="modal wide battlemodal"><h2>⚔ ${t.name}国 攻略戦</h2><div class="battlelayout"><div class="battleside">${genImgs}</div><div class="battlemain"><div class="battlebars"><div><div class="eyebrow">自軍 ${fmt(state.battle.playerTroops)}</div><div class="barwrap"><div class="bar" style="width:${pRatio*100}%"></div></div></div><div><div class="eyebrow">敵軍 ${fmt(state.battle.enemyTroops)}</div><div class="barwrap"><div class="bar enemy" style="width:${(1-pRatio)*100}%"></div></div></div></div>${lastTactic}<div class="roundinfo">${roundDone?"このターンの交戦は終了。翌ターンで再開。":`残り ${roundLeft} ラウンド（このターン）`}</div><div class="battleactions">${TACTIC_KEYS.map(k=>`<button data-ba="${k}" ${roundDone?"disabled":""}><b>${TACTICS[k].label}</b><small>${TACTICS[TACTICS[k].beats].label}に強い</small></button>`).join("")}</div><button class="retreatbtn" data-ba="retreat">撤退</button></div></div></div></div>`;
 root.querySelectorAll("[data-ba]").forEach(b=>b.onclick=()=>battleAction(b.dataset.ba));
}
/* ===== 新聞 ===== */
function openNews(snap){
 const root=document.getElementById("modalroot");
 const inc=snap.income||{food:0,gold:0,troops:0,prestige:0,upkeep:0,foodCost:0};
 let lead="";
 if(snap.conquered!=null){
  const c=state.countries[snap.conquered];
  const lord=snap.conqueredLord||"領主";
  const body=pick(LINES.newsConquer).replace(/\{country\}/g,c.name).replace(/\{lord\}/g,lord);
  lead=`<div class="newslead"><div class="newsflag">凱旋</div><h3>${escapeHtml(pick(LINES.newsConquerTitle))}</h3><p>${escapeHtml(body)}</p></div>`;
 }else if(state.battle){
  const c=state.countries[state.battle.targetId];
  const body=pick(LINES.newsWar).replace(/\{country\}/g,c.name);
  lead=`<div class="newslead"><div class="newsflag">戦争中</div><h3>${escapeHtml(pick(LINES.newsWarTitle))}</h3><p>${escapeHtml(body)}</p></div>`;
 }else{
  lead=`<div class="newslead peace"><div class="newsflag">平和</div><h3>${escapeHtml(pick(LINES.newsPeaceTitle))}</h3><p>${escapeHtml(pick(LINES.newsPeace))}</p></div>`;
 }
 const changed=[];
 state.captives.forEach(t=>{
  const before=snap.before[t.id];
  if(!before||!t.secret)return;
  let hit=false;
  for(const k in SECRET_STATS){
   const st=SECRET_STATS[k];
   if(!st.tiers)continue;
   const tr=tierOf(k,t.secret[k]||0);
   if(!tr)continue;
   if((before[k]??-1)!==tr.min){hit=true;break;}
  }
  if(hit)changed.push(t);
 });
 const changeHtml=changed.map(t=>{
  const p=PROFILE[t.name]||{};
  const src=p.id?`images/${p.id}.png`:"";
  return `<div class="newschange"><div class="newsimg">${src?`<img src="${src}" alt="${escapeHtml(t.name)}" onerror="this.style.display='none';this.parentNode.textContent='—';">`:"—"}</div><div class="newstext">${escapeHtml(t.name)}に変化がありました。</div></div>`;
 }).join("");
 root.innerHTML=`<div class="battleoverlay"><div class="modal wide newsmodal"><div class="newshead"><div class="newspaper">${escapeHtml(state.countries[HOME].name)} 日報</div><div class="newsturn">第 ${state.turn} ターン</div></div><div class="newsrule double"></div><div class="newsfront">${lead}</div><div class="newsrule"></div><div class="newsbody"><div class="newsincome"><div class="newsincomehead">収入</div><div>設備収入：兵糧 +${fmt(inc.food)} / 金 +${fmt(inc.gold)} / 兵 +${fmt(inc.troops)} / 威信 +${fmt(inc.prestige)}</div><div>軍勢の兵糧消費 −${fmt(inc.upkeep)}　捕虜の糧 −${fmt(inc.foodCost)}</div>${(inc.traitPrestige||inc.traitGold||inc.traitFood||inc.traitTroops)?`<div>特性収入：威信 +${fmt(inc.traitPrestige)} / 金 +${fmt(inc.traitGold)} / 兵糧 +${fmt(inc.traitFood)} / 兵 +${fmt(inc.traitTroops)}</div>`:""}</div>${changed.length?`<div class="newsrule"></div><div class="newschanges"><div class="newsincomehead">捕虜の変化</div>${changeHtml}</div>`:""}</div><div class="newsrule double"></div><button class="primary" id="closeNews">確認した</button></div></div>`;
 root.querySelector("#closeNews").onclick=()=>{root.innerHTML="";};
}


/* ===== 説明書 ===== */
function openManual(){const root=document.getElementById("modalroot");root.innerHTML=`<div class="battleoverlay"><div class="modal wide manual"><h2>説明書</h2><p>このゲームの内政・特殊・収容システムの仕組み。</p>${MANUAL_HTML}<div class="separator"></div><button id="closeMan">閉じる</button></div></div>`;
 root.querySelector("#closeMan").onclick=()=>root.innerHTML="";}
