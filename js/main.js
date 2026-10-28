"use strict";

let startOpts={diff:"normal",randomTemper:true,virgin:false};
document.getElementById("nextTop").onclick=nextTurn;
document.getElementById("saveBtn").onclick=()=>save(false);
document.getElementById("loadBtn").onclick=load;
document.getElementById("manualBtn").onclick=openManual;
document.getElementById("resetBtn").onclick=reset;
document.getElementById("capTabBtn").onclick=()=>{rightTab="captives";capFilter="all";render();};
document.querySelectorAll("[data-rtab]").forEach(b=>b.addEventListener("click",()=>{rightTab=b.dataset.rtab;render();}));
document.querySelectorAll("[data-ltab]").forEach(b=>b.addEventListener("click",()=>{leftTab=b.dataset.ltab;render();}));

function load(){try{const raw=localStorage.getItem(SAVE_KEY);if(!raw){toast("セーブデータがありません。");return;}const d=JSON.parse(raw);if(!d.state||!Array.isArray(d.state.countries))throw Error();state=d.state;if(!state.specials)state.specials={gokusha:{lv:0},kanshitou:{lv:0}};if(!state.tree)state.tree={};if(!("battle" in state))state.battle=null;migrateState();state.countries.forEach(c=>{if(!c.slots)c.slots=newSlots();if(c.owner==="enemy"){if(!c.econ)c.econ=decideEcon(c.generals||[]);if(!c.nextAct)c.nextAct=state.turn+enemyActionInterval(c);}});migrateCaptives();selected=clamp(d.selected||HOME,0,15);rightTab=d.rightTab||"country";leftTab=d.leftTab||"log";render();toast("ロードしました。");}catch(e){toast("セーブデータを読み込めませんでした。");}}
function reset(){const root=document.getElementById("modalroot");root.innerHTML=`<div class="battleoverlay"><div class="modal"><h2>新規開始</h2><p>現在の進行を破棄して、最初から始めます。</p><div class="eyebrow">本拠の名</div><input id="homeInput" value="${NAMES[HOME]}" maxlength="12"><div class="separator"></div><div style="display:flex;gap:8px"><button class="primary" id="goReset">開始する</button><button id="cancelReset">戻る</button></div></div></div>`;root.querySelector("#cancelReset").onclick=()=>root.innerHTML="";root.querySelector("#goReset").onclick=()=>{const v=root.querySelector("#homeInput").value.trim()||NAMES[HOME];root.innerHTML="";state=initialState(v);selected=HOME;rightTab="country";leftTab="log";render();save(true);toast("新たな略奪が始まりました。");};}
function titleScreen(){
 const root=document.getElementById("modalroot");
 root.innerHTML=`<div class="battleoverlay titleoverlay"><div class="modal titlemodal"><div class="titlemark">NijiNob v0.31</div><h2 class="titlename">女を奪い、天下を取れ</h2><p class="titlelead">16国を制し、女を捕らえ、屈服させ、陳列せよ。</p><div class="separator"></div><div class="titlerow"><button class="primary" id="titleNew">新規開始</button><button id="titleLoad">ロード</button></div></div></div>`;
 root.querySelector("#titleNew").onclick=()=>startOptions();
 root.querySelector("#titleLoad").onclick=()=>{root.innerHTML="";load();};
}
function startOptions(){
 const root=document.getElementById("modalroot");
 const diffRow=(v,l,d)=>`<button class="optbtn ${startOpts.diff===v?"active":""}" data-diff="${v}"><b>${l}</b><small>${d}</small></button>`;
 root.innerHTML=`<div class="battleoverlay titleoverlay"><div class="modal titlemodal"><div class="titlemark">開始オプション</div><h2 class="titlename">条件を選ぶ</h2><div class="separator"></div><div class="optlabel">難易度</div><div class="optgrid">${diffRow("easy","簡単","弱小国を必ず周辺に2国配置")}${diffRow("normal","普通","弱小国を必ず1国配置")}${diffRow("hard","難しい","完全ランダム配置")}</div><div class="optlabel">気質</div><div class="optgrid two"><button class="optbtn ${startOpts.randomTemper?"active":""}" data-temper="1"><b>ランダム</b><small>気質を毎回振る</small></button><button class="optbtn ${!startOpts.randomTemper?"active":""}" data-temper="0"><b>固定</b><small>設定された気質を使う</small></button></div><div class="optlabel">処女性</div><div class="optgrid two"><button class="optbtn ${startOpts.virgin?"active":""}" data-virgin="1"><b>全員処女</b><small>全員が処女で始まる</small></button><button class="optbtn ${!startOpts.virgin?"active":""}" data-virgin="0"><b>設定どおり</b><small>規定の設定を使う</small></button></div><div class="separator"></div><div class="titlerow"><button class="primary" id="optGo">次へ</button><button id="optBack">戻る</button></div></div></div>`;
 root.querySelectorAll("[data-diff]").forEach(b=>b.onclick=()=>{startOpts.diff=b.dataset.diff;startOptions();});
 root.querySelectorAll("[data-temper]").forEach(b=>b.onclick=()=>{startOpts.randomTemper=b.dataset.temper==="1";startOptions();});
 root.querySelectorAll("[data-virgin]").forEach(b=>b.onclick=()=>{startOpts.virgin=b.dataset.virgin==="1";startOptions();});
 root.querySelector("#optBack").onclick=()=>titleScreen();
 root.querySelector("#optGo").onclick=()=>startModal();
}
function startModal(){
 const root=document.getElementById("modalroot");
 root.innerHTML=`<div class="battleoverlay titleoverlay"><div class="modal titlemodal"><div class="titlemark">NEW GAME</div><h2 class="titlename">本拠の名</h2><p class="titlelead">本拠を構え、女を奪う天下取りを始める。国名は変えられる。</p><input id="homeInput" value="${NAMES[HOME]}" maxlength="12"><div class="separator"></div><div class="titlerow"><button class="primary" id="startGo">開始</button><button id="startBack">戻る</button></div></div></div>`;
 root.querySelector("#startBack").onclick=()=>startOptions();
 root.querySelector("#startGo").onclick=()=>{const v=root.querySelector("#homeInput").value.trim()||NAMES[HOME];root.innerHTML="";state=initialState(v,startOpts);selected=HOME;rightTab="country";leftTab="log";render();save(true);};
}

try{const raw=localStorage.getItem(SAVE_KEY);if(raw){const d=JSON.parse(raw);if(d.state&&Array.isArray(d.state.countries)){state=d.state;if(!state.specials)state.specials={gokusha:{lv:0},kanshitou:{lv:0}};if(!state.tree)state.tree={};if(!("battle" in state))state.battle=null;migrateState();state.countries.forEach(c=>{if(!c.slots)c.slots=newSlots();if(c.owner==="enemy"){if(!c.econ)c.econ=decideEcon(c.generals||[]);if(!c.nextAct)c.nextAct=state.turn+enemyActionInterval(c);}});migrateCaptives();selected=clamp(d.selected??HOME,0,15);rightTab=d.rightTab||"country";leftTab=d.leftTab||"log";}else{state=initialState();selected=HOME;}}else{state=initialState();selected=HOME;}}catch(e){state=initialState();selected=HOME;}
render();titleScreen();