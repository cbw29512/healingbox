'use strict';

const SLOTS={1:[2],2:[3],3:[4,2],4:[4,3],5:[4,3,2],6:[4,3,3],7:[4,3,3,1],8:[4,3,3,2],9:[4,3,3,3,1],10:[4,3,3,3,2],11:[4,3,3,3,2,1],12:[4,3,3,3,2,1],13:[4,3,3,3,2,1,1],14:[4,3,3,3,2,1,1],15:[4,3,3,3,2,1,1,1],16:[4,3,3,3,2,1,1,1],17:[4,3,3,3,2,1,1,1,1],18:[4,3,3,3,3,1,1,1,1],19:[4,3,3,3,3,2,1,1,1],20:[4,3,3,3,3,2,2,1,1]};

const POTIONS={healing:{name:'Potion of Healing',formula:'2d4+2'},greater:{name:'Greater Healing Potion',formula:'4d4+4'},superior:{name:'Superior Healing Potion',formula:'8d4+8'},supreme:{name:'Supreme Healing Potion',formula:'10d4+20'}};

const SPELLS={
1:['Bane','Bless','Command','Create or Destroy Water','Cure Wounds','Detect Evil and Good','Detect Magic','Detect Poison and Disease','Guiding Bolt','Healing Word','Inflict Wounds','Protection from Evil and Good','Purify Food and Drink','Sanctuary','Shield of Faith'],
2:['Aid','Augury','Blindness/Deafness','Calm Emotions','Continual Flame','Enhance Ability','Find Traps','Gentle Repose','Hold Person','Lesser Restoration','Locate Object','Prayer of Healing','Protection from Poison','Silence','Spiritual Weapon','Warding Bond','Zone of Truth'],
3:['Animate Dead','Beacon of Hope','Bestow Curse','Clairvoyance','Create Food and Water','Daylight','Dispel Magic','Glyph of Warding','Magic Circle','Mass Healing Word','Meld into Stone','Protection from Energy','Remove Curse','Revivify','Sending','Speak with Dead','Spirit Guardians','Tongues','Water Walk'],
4:['Aura of Life','Banishment','Control Water','Death Ward','Divination','Freedom of Movement','Guardian of Faith','Locate Creature','Stone Shape'],
5:['Commune','Contagion','Dispel Evil and Good','Flame Strike','Geas','Greater Restoration','Hallow','Insect Plague','Legend Lore','Mass Cure Wounds','Planar Binding','Raise Dead','Scrying'],
6:['Blade Barrier','Create Undead','Find the Path','Forbiddance','Harm','Heal','Heroes’ Feast','Planar Ally','Sunbeam','True Seeing','Word of Recall'],
7:['Conjure Celestial','Divine Word','Etherealness','Fire Storm','Plane Shift','Regenerate','Resurrection','Symbol'],
8:['Antimagic Field','Control Weather','Earthquake','Holy Aura','Sunburst'],
9:['Astral Projection','Gate','Mass Heal','True Resurrection']};

const EFFECTS={
'Cure Wounds':{kind:'healing',f2014:'1d8+WIS',f2024:'2d8+WIS',note:'healing'},
'Healing Word':{kind:'healing',f2014:'1d4+WIS',f2024:'2d4+WIS',note:'healing'},
'Guiding Bolt':{kind:'damage',formula:'4d6',note:'radiant damage'},
'Inflict Wounds':{kind:'damage',formula:'3d10',note:'necrotic damage'},
'Aid':{kind:'fixed',amount:5,note:'HP increase for each affected creature'},
'Prayer of Healing':{kind:'healing',f2014:'2d8+WIS',f2024:'2d8+WIS',note:'healing to each eligible target'},
'Spiritual Weapon':{kind:'damage',formula:'1d8+WIS',note:'force damage on the attack'},
'Glyph of Warding':{kind:'damage',formula:'5d8',note:'damage for an explosive rune'},
'Mass Healing Word':{kind:'healing',f2014:'1d4+WIS',f2024:'2d4+WIS',note:'healing to each eligible target'},
'Revivify':{kind:'fixed',amount:1,note:'HP restored'},
'Spirit Guardians':{kind:'damage',formula:'3d8',note:'damage per failed save when a creature is affected'},
'Guardian of Faith':{kind:'fixed',amount:20,note:'radiant damage per failed save'},
'Flame Strike':{kind:'damage',formula:'8d6',note:'combined fire and radiant damage'},
'Insect Plague':{kind:'damage',formula:'4d10',note:'piercing damage per failed save'},
'Mass Cure Wounds':{kind:'healing',f2014:'3d8+WIS',f2024:'5d8+WIS',note:'healing to each eligible target'},
'Raise Dead':{kind:'fixed',amount:1,note:'HP restored'},
'Blade Barrier':{kind:'damage',formula:'6d10',note:'slashing damage per failed save'},
'Harm':{kind:'damage',formula:'14d6',note:'necrotic damage; apply the spell’s normal limits'},
'Heal':{kind:'fixed',amount:70,note:'HP restored'},
'Sunbeam':{kind:'damage',formula:'6d8',note:'radiant damage per failed save'},
'Fire Storm':{kind:'damage',formula:'7d10',note:'fire damage per failed save'},
'Regenerate':{kind:'healing',formula:'4d8+15',note:'initial healing; ongoing healing follows the spell'},
'Resurrection':{kind:'full',note:'target returns with full HP'},
'Sunburst':{kind:'damage',formula:'12d6',note:'radiant damage per failed save'},
'Mass Heal':{kind:'fixed',amount:700,note:'HP distributed among eligible creatures'},
'True Resurrection':{kind:'full',note:'target returns with full HP'}};

let peer=null,hostConn=null,connections=[],isHost=false,state=null,roomCode='',displayName='Player',activeChargeId=null;
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];

function esc(value){return String(value??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function ordinal(n){n=Number(n);return n+(n===1?'st':n===2?'nd':n===3?'rd':'th')}
function tier(level){return level===1?'healing':level<=3?'greater':level<=6?'superior':'supreme'}
function wisdomMod(){return state.level<4?3:state.level<8?4:5}

function makeCharges(level){const charges=[];(SLOTS[level]||SLOTS[1]).forEach((qty,index)=>{const spellLevel=index+1;for(let i=1;i<=qty;i++)charges.push({id:`L${spellLevel}-${i}`,level:spellLevel,number:i,potion:tier(spellLevel),spent:false,usedAs:null,result:null,actor:null,time:null})});return charges}
function newState(data){const level=Number(data.level)||1;return{version:2,campaign:data.campaign||'My Campaign',deity:data.deity||'The DM’s Deity',ruleset:Number(data.ruleset)||2014,level,charges:makeCharges(level),log:[],createdAt:Date.now()}}
function save(){if(isHost&&roomCode&&state)localStorage.setItem(`cleric-box-${roomCode}`,JSON.stringify(state))}
function load(code){try{return JSON.parse(localStorage.getItem(`cleric-box-${code}`)||'null')}catch(error){console.error(error);return null}}
function randomCode(){const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',values=new Uint32Array(6);crypto.getRandomValues(values);return[...values].map(v=>alphabet[v%alphabet.length]).join('')}
function hostId(code){return`cleric-in-a-box-${code.toLowerCase()}`}
function setConnection(text,online=false){$('#connectionText').textContent=text;$('#dot').className=`dot ${online?'online':''}`}
function toast(message){const el=document.createElement('div');el.textContent=message;el.style='position:fixed;z-index:100;left:50%;bottom:20px;transform:translateX(-50%);background:#281713;color:#fff4ce;padding:12px 18px;border:1px solid #d4a64c;border-radius:8px;max-width:90vw;box-shadow:0 8px 30px #0008';document.body.append(el);setTimeout(()=>el.remove(),3200)}
function log(text){state.log.push({time:Date.now(),text})}

function rollFormula(raw){const formula=String(raw).replace('WIS',String(wisdomMod())),match=formula.match(/^(\d+)d(\d+)(?:\+(\d+))?$/);if(!match)throw new Error(`Unsupported dice formula: ${formula}`);const count=Number(match[1]),sides=Number(match[2]),bonus=Number(match[3]||0),rolls=[];for(let i=0;i<count;i++){const value=new Uint32Array(1);crypto.getRandomValues(value);rolls.push(value[0]%sides+1)}return{formula,rolls,bonus,total:rolls.reduce((a,b)=>a+b,0)+bonus}}

function setupView(){return`<section class="card setup"><div class="tabs"><button class="btn" id="newTab">Create Party</button><button class="btn blue" id="joinTab">Join Party</button></div><div id="newPane"><h2>Bind the Artifact to a Party</h2><div class="form-grid"><label>Campaign<input id="campaign" value="My Campaign"></label><label>Rules<select id="ruleset"><option>2014</option><option>2024</option></select></label><label>Average party level<select id="level">${Array.from({length:20},(_,i)=>`<option>${i+1}</option>`).join('')}</select></label><label>Granting deity<input id="deity" placeholder="DM-controlled deity"></label></div><button class="btn gold" id="create" style="width:100%;margin-top:14px">Create the Unique Artifact</button></div><div id="joinPane" class="hidden"><h2>Join the Party Box</h2><div class="form-grid"><label>Your name<input id="joinName" placeholder="Player name"></label><label>Room code<input id="joinCode" maxlength="6" autocomplete="off"></label></div><button class="btn blue" id="join" style="width:100%;margin-top:14px">Connect to the Box</button></div><div class="notice">The DM’s browser hosts the shared tracker and must remain open during play.</div></section>`}
function inventory(){const counts={healing:0,greater:0,superior:0,supreme:0};state.charges.filter(c=>!c.spent).forEach(c=>counts[c.potion]++);return counts}

function trackerView(){const counts=inventory(),grouped={};state.charges.forEach(charge=>(grouped[charge.level]??=[]).push(charge));return`<div class="topbar"><div><h2 style="margin-bottom:.2rem">${esc(state.campaign)}</h2><div>${state.ruleset} rules · Average party level ${state.level}</div></div><div class="room no-print"><span class="room-code">${roomCode}</span><button class="btn ghost" data-copy>Copy player link</button>${isHost?'<button class="btn gold" data-rest>Long Rest Reset</button>':''}</div></div><section class="summary-grid">${Object.entries(POTIONS).map(([key,potion])=>`<div class="summary"><span>${potion.name}</span><strong>${counts[key]}</strong><small>${potion.formula}</small></div>`).join('')}</section>${Object.entries(grouped).map(([level,charges])=>`<section class="level-group"><div class="level-title"><h2>${ordinal(level)}-Level Divine Charges</h2><span>${charges.filter(c=>!c.spent).length} remaining</span></div><div class="charge-grid">${charges.map(chargeCard).join('')}</div></section>`).join('')}<section class="card history"><h2>Adventuring-Day History</h2><ul class="log">${state.log.length?state.log.slice().reverse().map(item=>`<li><time>${new Date(item.time).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}</time><br>${esc(item.text)}</li>`).join(''):'<li class="empty">Nothing has been used yet.</li>'}</ul>${isHost&&state.log.length?'<button class="btn ghost no-print" data-undo>Undo Last Use</button>':''}</section><div class="artifact-law"><b>Unique Artifact.</b> The box is semi-sentient and reads its own scrolls as a free action. It cannot be stolen, destroyed, suppressed, banished, or separated from the party. Only the specific deity that granted it—controlled by the DM—can affect it.</div>`}

function chargeCard(charge){const potion=POTIONS[charge.potion];return`<article class="charge-card ${charge.spent?'used':''}"><h3>${ordinal(charge.level)}-Level Charge ${charge.number}</h3><div class="charge-meta"><span class="badge">${potion.name}</span><span class="badge">${potion.formula}</span></div>${charge.spent?`<div class="charge-result">USED<br>${esc(charge.result||'Charge spent')}</div>`:`<div class="actions no-print"><button class="btn" data-heal="${charge.id}">Roll Healing</button><button class="btn blue" data-scroll="${charge.id}">Choose Scroll</button></div>`}</article>`}

function render(){$('#app').innerHTML=state?trackerView():setupView();bind();setConnection(state?(isHost?`Hosting ${roomCode}`:'Connected to the party'):'Not connected',Boolean(state))}
function bind(){if(!state){$('#newTab').onclick=()=>{$('#newPane').classList.remove('hidden');$('#joinPane').classList.add('hidden')};$('#joinTab').onclick=()=>{$('#joinPane').classList.remove('hidden');$('#newPane').classList.add('hidden')};$('#create').onclick=createParty;$('#join').onclick=joinParty;return}$$('[data-copy]').forEach(b=>b.onclick=copyLink);$$('[data-rest]').forEach(b=>b.onclick=()=>sendAction({type:'rest'}));$$('[data-heal]').forEach(b=>b.onclick=e=>sendAction({type:'heal',chargeId:e.currentTarget.dataset.heal}));$$('[data-scroll]').forEach(b=>b.onclick=e=>openScroll(e.currentTarget.dataset.scroll));$$('[data-undo]').forEach(b=>b.onclick=()=>sendAction({type:'undo'}))}

function createParty(){roomCode=randomCode();displayName='DM';state=newState({campaign:$('#campaign').value.trim(),deity:$('#deity').value.trim(),ruleset:$('#ruleset').value,level:$('#level').value});isHost=true;save();startHost()}
function startHost(){setConnection('Opening the box…');peer=new Peer(hostId(roomCode));peer.on('open',()=>{history.replaceState({},'',`${location.pathname}?host=${roomCode}`);setConnection(`Hosting ${roomCode}`,true);render()});peer.on('connection',connection=>{connections.push(connection);connection.on('open',()=>connection.send({type:'state',state,roomCode}));connection.on('data',data=>handleRemote(data,connection));connection.on('close',()=>connections=connections.filter(c=>c!==connection))});peer.on('error',error=>{console.error(error);if(error.type==='unavailable-id'){roomCode=randomCode();save();peer.destroy();startHost()}else setConnection(`Connection error: ${error.type}`,false)})}
function joinParty(){displayName=$('#joinName').value.trim()||'Player';roomCode=$('#joinCode').value.trim().toUpperCase();if(roomCode.length!==6){toast('Enter the six-character room code.');return}setConnection('Connecting…');peer=new Peer();peer.on('open',()=>{hostConn=peer.connect(hostId(roomCode),{reliable:true});hostConn.on('open',()=>{hostConn.send({type:'hello',name:displayName});setConnection('Connected',true)});hostConn.on('data',data=>{if(data.type==='state'){state=data.state;render()}if(data.type==='error')toast(data.message)});hostConn.on('close',()=>setConnection('Host disconnected',false))});peer.on('error',error=>setConnection(`Connection error: ${error.type}`,false))}
function handleRemote(data,connection){if(data?.type==='hello'){connection.metadata={name:data.name};connection.send({type:'state',state,roomCode});return}if(data?.type==='action')applyAction(data.action,data.name||'Player',connection)}
function sendAction(action){if(isHost)applyAction(action,'DM');else if(hostConn?.open)hostConn.send({type:'action',action,name:displayName});else toast('The DM host is not connected.')}

function applyAction(action,actor,connection){try{if(action.type==='heal')useHealingCharge(action.chargeId,actor);if(action.type==='scroll')useScrollCharge(action,actor);if(action.type==='rest'){if(actor!=='DM')throw new Error('Only the DM can reset the box.');state.charges=makeCharges(state.level);state.log=[];log('The party completed a long rest. Every divine charge returned.')}if(action.type==='undo'){if(actor!=='DM')throw new Error('Only the DM can undo a use.');undoLast()}broadcast()}catch(error){console.error(error);if(connection?.open)connection.send({type:'error',message:error.message});else toast(error.message)}}
function broadcast(){save();render();connections.filter(c=>c.open).forEach(c=>c.send({type:'state',state,roomCode}))}

function useHealingCharge(chargeId,actor){const charge=state.charges.find(c=>c.id===chargeId);if(!charge||charge.spent)throw new Error('That charge has already been used.');const potion=POTIONS[charge.potion],roll=rollFormula(potion.formula);charge.spent=true;charge.usedAs='healing';charge.actor=actor;charge.time=Date.now();charge.result=`${potion.name}: ${roll.rolls.join(' + ')}${roll.bonus?` + ${roll.bonus}`:''} = ${roll.total} HP healed`;log(`${actor} used ${potion.name}. The box rolled ${roll.rolls.join(' + ')}${roll.bonus?` + ${roll.bonus}`:''} = ${roll.total} HP healed.`)}
function spellEffect(spell){const effect=EFFECTS[spell];if(!effect)return{kind:'utility',note:'No damage or healing roll. Resolve the spell normally.'};const formula=effect.formula||(state.ruleset===2024?effect.f2024:effect.f2014);return{...effect,formula}}
function spellPreviewText(spell){if(spell==='Other Cleric Spell…')return'Enter the spell name. The box will record it, but no automatic damage or healing roll is available for a custom spell.';const effect=spellEffect(spell);if(effect.kind==='damage')return`The box will roll ${effect.formula} ${effect.note}.`;if(effect.kind==='healing')return`The box will roll ${effect.formula} ${effect.note}.`;if(effect.kind==='fixed')return`The box will report ${effect.amount} ${effect.note}.`;if(effect.kind==='full')return`The box will report: ${effect.note}.`;return effect.note}

function openScroll(chargeId){activeChargeId=chargeId;const charge=state.charges.find(c=>c.id===chargeId);if(!charge||charge.spent){toast('That charge has already been used.');return}$('#scrollTitle').textContent=`Use ${ordinal(charge.level)}-Level Scroll`;const spells=[...(SPELLS[charge.level]||[]),'Other Cleric Spell…'];$('#scrollSpell').innerHTML=spells.map(spell=>`<option>${esc(spell)}</option>`).join('');$('#customSpellWrap').classList.add('hidden');$('#customSpell').value='';$('#scrollNote').value='';updateSpellPreview();$('#scrollSpell').onchange=updateSpellPreview;$('#castScroll').onclick=castSelectedScroll;$('#scrollDialog').showModal()}
function updateSpellPreview(){const spell=$('#scrollSpell').value;$('#customSpellWrap').classList.toggle('hidden',spell!=='Other Cleric Spell…');$('#spellPreview').textContent=spellPreviewText(spell)}
function castSelectedScroll(){const selected=$('#scrollSpell').value,spell=selected==='Other Cleric Spell…'?($('#customSpell').value.trim()||'Custom cleric spell'):selected;sendAction({type:'scroll',chargeId:activeChargeId,spell,known:selected!=='Other Cleric Spell…',note:$('#scrollNote').value.trim()});$('#scrollDialog').close()}

function useScrollCharge(action,actor){const charge=state.charges.find(c=>c.id===action.chargeId);if(!charge||charge.spent)throw new Error('That exact-level charge has already been used.');const exactList=SPELLS[charge.level]||[];if(action.known&&!exactList.includes(action.spell))throw new Error('That spell is not available at this exact spell level.');const effect=action.known?spellEffect(action.spell):{kind:'utility',note:'Custom spell recorded; resolve normally.'};let result='';if(effect.kind==='damage'||effect.kind==='healing'){const roll=rollFormula(effect.formula),label=effect.kind==='damage'?'damage':'HP healed';result=`${action.spell}: ${roll.rolls.join(' + ')}${roll.bonus?` + ${roll.bonus}`:''} = ${roll.total} ${label}`;if(effect.note)result+=` (${effect.note})`}else if(effect.kind==='fixed')result=`${action.spell}: ${effect.amount} ${effect.note}`;else if(effect.kind==='full')result=`${action.spell}: ${effect.note}`;else result=`${action.spell}: ${effect.note||'No damage or healing roll; resolve normally.'}`;if(action.note)result+=` — ${action.note}`;charge.spent=true;charge.usedAs='scroll';charge.actor=actor;charge.time=Date.now();charge.result=result;log(`${actor} used a ${ordinal(charge.level)}-level scroll. ${result}`)}
function undoLast(){const spent=state.charges.filter(c=>c.spent&&c.time).sort((a,b)=>b.time-a.time)[0];if(!spent){toast('Nothing to undo.');return}const description=spent.result;spent.spent=false;spent.usedAs=null;spent.result=null;spent.actor=null;spent.time=null;log(`DM restored the last-used charge: ${description}`)}
function copyLink(){const url=`${location.origin}${location.pathname}?join=${roomCode}`;navigator.clipboard?.writeText(url).then(()=>toast('Player link copied.')).catch(()=>prompt('Copy this player link:',url))}

window.addEventListener('beforeunload',()=>{try{peer?.destroy()}catch(error){console.error(error)}});
(function boot(){const params=new URLSearchParams(location.search),host=params.get('host'),join=params.get('join');if(host){roomCode=host.toUpperCase();state=load(roomCode);if(state){isHost=true;displayName='DM';startHost();render();return}}render();if(join){$('#joinTab').click();$('#joinCode').value=join.toUpperCase()}})();
