const $ = id => document.getElementById(id);
const STORAGE_KEY = 'mycycleV2Data';
let calendarCursor = new Date();
calendarCursor.setDate(1);
let selectedMood = null;
let selectedSymptoms = [];

const todayISO = () => {
  const d = new Date();
  const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,'0'); const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
};
const parseDate = s => s ? new Date(`${s}T12:00:00`) : null;
const isoDate = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const diffDays = (a,b) => Math.round((b-a)/(1000*60*60*24));
const formatDate = d => d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});

function getData(){
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"periods":[],"logs":{},"prefs":{"cycleLength":28,"periodLength":5}}');
}
function saveData(data){ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
function toast(msg){ const t=$('toast'); t.textContent=msg; t.classList.remove('hidden'); setTimeout(()=>t.classList.add('hidden'),1800); }
function normalizePeriod(p){ return {start:p.start,end:p.end||p.start}; }
function sortedPeriods(data){ return [...(data.periods||[])].map(normalizePeriod).sort((a,b)=>a.start.localeCompare(b.start)); }
function cycleLengths(periods){ const out=[]; for(let i=1;i<periods.length;i++) out.push(diffDays(parseDate(periods[i-1].start),parseDate(periods[i].start))); return out.filter(n=>n>0&&n<90); }
function periodLength(p){ return Math.max(1,diffDays(parseDate(p.start),parseDate(p.end))+1); }
function mean(arr){ return arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : null; }
function currentCycleInfo(data){
  const periods=sortedPeriods(data); const prefs=data.prefs||{cycleLength:28,periodLength:5};
  if(!periods.length) return null;
  const starts=cycleLengths(periods); const avgCycle=mean(starts)||Number(prefs.cycleLength||28);
  const today=parseDate(todayISO()); let last=periods[periods.length-1]; let lastStart=parseDate(last.start);
  while(lastStart>today && periods.length>1){periods.pop();last=periods[periods.length-1];lastStart=parseDate(last.start);}
  const daysSince=diffDays(lastStart,today); const cycleDay=daysSince+1; const next=new Date(lastStart); next.setDate(next.getDate()+avgCycle);
  return {cycleDay,next,daysLeft:diffDays(today,next),avgCycle,last};
}
function predictedDates(data, months=4){
  const periods=sortedPeriods(data); if(!periods.length) return [];
  const cycle=mean(cycleLengths(periods)) || Number(data.prefs?.cycleLength||28);
  const plen=mean(periods.map(periodLength)) || Number(data.prefs?.periodLength||5);
  let cursor=parseDate(periods[periods.length-1].start); const dates=[];
  for(let i=0;i<months;i++){ cursor=new Date(cursor); cursor.setDate(cursor.getDate()+cycle); for(let j=0;j<plen;j++){ const d=new Date(cursor); d.setDate(d.getDate()+j); dates.push(isoDate(d)); } }
  return dates;
}
function actualPeriodDates(data){ const s=new Set(); sortedPeriods(data).forEach(p=>{let d=parseDate(p.start),e=parseDate(p.end); while(d<=e){s.add(isoDate(d));d.setDate(d.getDate()+1);}}); return s; }

function showScreen(name){
  document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('active',s.dataset.screen===name));
  document.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===name));
  window.scrollTo({top:0,behavior:'smooth'});
  renderAll();
}

document.querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click',()=>showScreen(b.dataset.nav)));
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>showScreen(b.dataset.go)));

function renderHome(data){
  const info=currentCycleInfo(data); const periods=sortedPeriods(data);
  if(!info){ $('nextPeriodText').textContent='Add your last period'; $('countdownText').textContent='Start tracking to see estimates'; $('cycleDay').textContent='—'; }
  else { $('nextPeriodText').textContent=formatDate(info.next); $('countdownText').textContent=info.daysLeft<0?'Prediction passed — log your latest period':info.daysLeft===0?'Expected today':`${info.daysLeft} day${info.daysLeft===1?'':'s'} remaining`; $('cycleDay').textContent=info.cycleDay; }
  const cls=cycleLengths(periods); const avgC=mean(cls)||Number(data.prefs?.cycleLength||28); const avgP=mean(periods.map(periodLength))||Number(data.prefs?.periodLength||5);
  $('homeAvgCycle').textContent=`${avgC} days`; $('homeAvgPeriod').textContent=`${avgP} days`;
  const logs=Object.entries(data.logs||{}).sort((a,b)=>b[0].localeCompare(a[0])); const last=logs[0]?.[1]; $('homeLastMood').textContent=last?.mood||'—'; $('homeLastFlow').textContent=last?.flow||'—';
  const box=$('recentCycles'); if(!periods.length){box.className='timeline empty-state';box.textContent='No cycles logged yet.';} else {box.className='timeline'; box.innerHTML=periods.slice(-4).reverse().map(p=>`<div class="timeline-item"><div><strong>${formatDate(parseDate(p.start))}</strong><br><span>${periodLength(p)} day period</span></div><span>${p.end?formatDate(parseDate(p.end)):''}</span></div>`).join('');}
}

function renderCalendar(data){
  const title=calendarCursor.toLocaleDateString(undefined,{month:'long',year:'numeric'}); $('calendarTitle').textContent=title;
  const y=calendarCursor.getFullYear(),m=calendarCursor.getMonth(); const first=new Date(y,m,1); const start=new Date(y,m,1-first.getDay()); const actual=actualPeriodDates(data); const predicted=new Set(predictedDates(data)); const today=todayISO();
  let html=''; for(let i=0;i<42;i++){ const d=new Date(start); d.setDate(start.getDate()+i); const iso=isoDate(d); const classes=['day']; if(d.getMonth()!==m)classes.push('muted-day'); if(iso===today)classes.push('today'); if(actual.has(iso))classes.push('period'); else if(predicted.has(iso))classes.push('predicted'); html+=`<div class="${classes.join(' ')}">${d.getDate()}</div>`; }
  $('calendarGrid').innerHTML=html;
  const periods=sortedPeriods(data).reverse(); const h=$('cycleHistory'); if(!periods.length){h.className='timeline empty-state';h.textContent='No saved periods yet.';} else {h.className='timeline';h.innerHTML=periods.map((p,i)=>{const prev=periods[i+1];const clen=prev?diffDays(parseDate(prev.start),parseDate(p.start)):null;return `<div class="timeline-item"><div><strong>${formatDate(parseDate(p.start))} – ${formatDate(parseDate(p.end))}</strong><br><span>${periodLength(p)} day period</span></div><span>${clen?`${clen} day cycle`:''}</span></div>`}).join('');}
}

function renderInsights(data){
  const periods=sortedPeriods(data), cls=cycleLengths(periods), pls=periods.map(periodLength); $('avgCycle').textContent=mean(cls)||data.prefs?.cycleLength||'—'; $('avgPeriod').textContent=mean(pls)||data.prefs?.periodLength||'—'; $('shortCycle').textContent=cls.length?Math.min(...cls):'—'; $('longCycle').textContent=cls.length?Math.max(...cls):'—';
  const symptomCounts={}, moodCounts={}; Object.values(data.logs||{}).forEach(l=>{(l.symptoms||[]).forEach(s=>symptomCounts[s]=(symptomCounts[s]||0)+1);if(l.mood)moodCounts[l.mood]=(moodCounts[l.mood]||0)+1;}); renderBars('symptomInsights',symptomCounts,'Add daily logs to see patterns.'); renderBars('moodInsights',moodCounts,'Add mood logs to see patterns.');
}
function renderBars(id,counts,empty){ const el=$(id); const entries=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,6); if(!entries.length){el.className='bar-list empty-state';el.textContent=empty;return;} const max=entries[0][1];el.className='bar-list';el.innerHTML=entries.map(([k,v])=>`<div class="bar-row"><span>${k}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.round(v/max*100)}%"></div></div><strong>${v}</strong></div>`).join(''); }

function renderProfile(data){ $('cycleLength').value=data.prefs?.cycleLength||28; $('periodLength').value=data.prefs?.periodLength||5; }
function renderToday(data){ $('todayLabel').textContent=new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'}); const l=data.logs?.[todayISO()]; selectedMood=l?.mood||null; selectedSymptoms=[...(l?.symptoms||[])]; document.querySelectorAll('#moodButtons button').forEach(b=>b.classList.toggle('selected',b.dataset.mood===selectedMood)); document.querySelectorAll('#symptomChips button').forEach(b=>b.classList.toggle('selected',selectedSymptoms.includes(b.dataset.symptom))); $('flow').value=l?.flow||'None'; $('pain').value=String(l?.pain??0); $('dailyNote').value=l?.note||''; }
function renderAll(){ const data=getData(); renderHome(data); renderCalendar(data); renderInsights(data); renderProfile(data); renderToday(data); }

$('prevMonth').addEventListener('click',()=>{calendarCursor.setMonth(calendarCursor.getMonth()-1);renderCalendar(getData())}); $('nextMonth').addEventListener('click',()=>{calendarCursor.setMonth(calendarCursor.getMonth()+1);renderCalendar(getData())});

document.querySelectorAll('#moodButtons button').forEach(btn=>btn.addEventListener('click',()=>{selectedMood=btn.dataset.mood;document.querySelectorAll('#moodButtons button').forEach(b=>b.classList.toggle('selected',b===btn));}));
document.querySelectorAll('#symptomChips button').forEach(btn=>btn.addEventListener('click',()=>{const s=btn.dataset.symptom;if(selectedSymptoms.includes(s))selectedSymptoms=selectedSymptoms.filter(x=>x!==s);else selectedSymptoms.push(s);btn.classList.toggle('selected');}));

$('savePeriod').addEventListener('click',()=>{ const start=$('periodStart').value,end=$('periodEnd').value||start; if(!start){toast('Choose a period start date.');return;} if(end<start){toast('End date cannot be before start date.');return;} const data=getData(); const idx=(data.periods||[]).findIndex(p=>p.start===start); const p={start,end}; if(idx>=0)data.periods[idx]=p;else data.periods.push(p); data.periods=sortedPeriods(data); saveData(data); renderAll(); toast('Period saved.'); });
$('saveToday').addEventListener('click',()=>{ const data=getData(); data.logs=data.logs||{}; data.logs[todayISO()]={mood:selectedMood,symptoms:selectedSymptoms,flow:$('flow').value,pain:Number($('pain').value),note:$('dailyNote').value.trim()}; saveData(data);renderAll();toast("Today's log saved."); });
$('savePrefs').addEventListener('click',()=>{ const data=getData(); data.prefs={cycleLength:Number($('cycleLength').value||28),periodLength:Number($('periodLength').value||5)};saveData(data);renderAll();toast('Preferences saved.'); });
$('clearData').addEventListener('click',()=>{ if(confirm('Delete all MyCycle data stored in this browser?')){localStorage.removeItem(STORAGE_KEY);renderAll();toast('All local data deleted.');} });
$('exportData').addEventListener('click',()=>{ const blob=new Blob([JSON.stringify(getData(),null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`mycycle-export-${todayISO()}.json`;a.click();URL.revokeObjectURL(a.href); });
$('privacyBtn').addEventListener('click',()=>$('privacyModal').classList.remove('hidden')); $('closePrivacy').addEventListener('click',()=>$('privacyModal').classList.add('hidden'));

if('serviceWorker' in navigator){ window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{})); }
renderAll();
