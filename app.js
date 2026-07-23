import { supabase } from './supabase-client.js';
import { SEED_REQUESTS } from './seed-data.js';

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':'&quot;',"'":"&#039;"}[c]));
const QUALITY = ['Готово','Нужно уточнить','Недостаточно контекста','Требует разделения','Не обработано'];
let requests = [], categories = [], selected = '', categoryFilter = '', saveTimer = null;

function setStatus(text, error=false){ const el=$('#syncStatus'); el.textContent=text; el.style.color=error?'#b42318':'#70788b'; }
function cls(q){return q==='Готово'?'ready':q==='Нужно уточнить'?'clarify':q==='Недостаточно контекста'?'unclear':q==='Требует разделения'?'split':''}
function categoryName(id){return categories.find(c=>c.id===id)?.name || 'Без категории'}
function filtered(){const q=$('#q').value.toLowerCase(),qu=$('#quality').value;return requests.filter(x=>!x.deleted&&(!categoryFilter||String(x.category_id)===categoryFilter)&&(!qu||x.quality===qu)&&(!q||Object.values(x).join(' ').toLowerCase().includes(q)))}

async function loadData(){
  setStatus('Загрузка…');
  const [{data:c,error:ce},{data:r,error:re}] = await Promise.all([
    supabase.from('categories').select('*').order('name'),
    supabase.from('requests').select('*').eq('deleted',false).order('source_id')
  ]);
  if(ce||re) throw ce||re;
  categories=c||[]; requests=r||[];
  renderAll(); setStatus('Данные загружены');
}

function renderAll(){renderNav();renderList();renderQuality();if(selected)show(selected)}
function renderQuality(){const current=$('#quality').value;$('#quality').innerHTML='<option value="">Все уровни качества</option>'+QUALITY.map(x=>`<option ${x===current?'selected':''}>${x}</option>`).join('')}
function renderNav(){
  const counts=Object.fromEntries(categories.map(c=>[c.id,0])); requests.filter(x=>!x.deleted).forEach(x=>{if(x.category_id)counts[x.category_id]=(counts[x.category_id]||0)+1});
  $('#nav').innerHTML=`<button class="nav ${!categoryFilter?'active':''}" data-id="">Все <span class="cnt">${requests.filter(x=>!x.deleted).length}</span></button>`+
    categories.map(c=>`<button class="nav ${categoryFilter===String(c.id)?'active':''}" data-id="${c.id}">${esc(c.name)} <span class="cnt">${counts[c.id]||0}</span></button>`).join('');
  document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>{categoryFilter=b.dataset.id;renderNav();renderList()});
}
function renderList(){
  const arr=filtered(); $('#head').textContent=`${categoryFilter?categoryName(Number(categoryFilter)):'Все реквесты'} · ${arr.length}`;
  $('#list').innerHTML=arr.map(x=>`<div class="item ${selected===x.id?'active':''}" data-id="${x.id}"><div class="id">${esc(x.source_id||x.id)}</div><div><div class="ttl">${esc(x.normalized_title||x.title)}</div><div class="meta">${esc(categoryName(x.category_id))}</div></div><span class="badge ${cls(x.quality)}">${esc(x.quality||'Не обработано')}</span></div>`).join('');
  document.querySelectorAll('.item').forEach(i=>i.onclick=()=>show(i.dataset.id));
}
function show(id){
  selected=String(id); const x=requests.find(v=>String(v.id)===String(id)); if(!x)return;
  $('#details').innerHTML=`<div class="k">${esc(x.source_id||x.id)} · ${esc(x.type||'Feature request')}</div><h2>${esc(x.normalized_title||x.title)}</h2><form id="requestForm">
  <label>Категория<select name="category_id"><option value="">Без категории</option>${categories.map(c=>`<option value="${c.id}" ${x.category_id===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select></label>
  <label>Нормализованное название<input name="normalized_title" value="${esc(x.normalized_title)}"></label>
  <label>Продуктовое требование<textarea name="requirement">${esc(x.requirement)}</textarea></label>
  <label>Проблема<textarea name="problem">${esc(x.problem)}</textarea></label>
  <label>Бизнес-ценность<textarea name="business_value">${esc(x.business_value)}</textarea></label>
  <label>Критерии приёмки<textarea name="acceptance">${esc(x.acceptance)}</textarea></label>
  <label>Неясности<textarea name="uncertainty">${esc(x.uncertainty)}</textarea></label>
  <label>Качество<select name="quality">${QUALITY.map(v=>`<option ${x.quality===v?'selected':''}>${v}</option>`).join('')}</select></label>
  <label>Ссылка YouTrack<input name="youtrack_url" value="${esc(x.youtrack_url||'')}" placeholder="https://.../issue/OBDSP-123"></label>
  <div class="actions"><button class="primary" type="submit">Сохранить сейчас</button>${x.youtrack_url?'<button type="button" id="openyt">Открыть YT</button>':''}<button class="danger" type="button" id="deleteRequest">Удалить реквест</button></div></form>
  <div class="section"><label>Исходная формулировка</label><div class="box">${esc(x.description)}</div></div>`;
  const form=$('#requestForm');
  form.oninput=()=>scheduleSave(x.id,form); form.onsubmit=e=>{e.preventDefault();saveForm(x.id,form)};
  $('#openyt')?.addEventListener('click',()=>window.open(x.youtrack_url,'_blank'));
  $('#deleteRequest').onclick=()=>deleteRequest(x.id);
  renderList();
}
function formPayload(form){const f=Object.fromEntries(new FormData(form).entries());f.category_id=f.category_id?Number(f.category_id):null;return f}
function scheduleSave(id,form){clearTimeout(saveTimer);setStatus('Есть несохранённые изменения…');saveTimer=setTimeout(()=>saveForm(id,form),650)}
async function saveForm(id,form){
  clearTimeout(saveTimer); const payload=formPayload(form); setStatus('Сохранение…');
  const {data,error}=await supabase.from('requests').update(payload).eq('id',id).select().single();
  if(error){setStatus('Ошибка сохранения: '+error.message,true);return}
  Object.assign(requests.find(x=>String(x.id)===String(id)),data); renderNav();renderList();setStatus('Сохранено');
}
async function deleteRequest(id){
  const x=requests.find(v=>String(v.id)===String(id)); if(!confirm(`Удалить реквест ${x.source_id||id}? Его можно будет восстановить напрямую в базе.`))return;
  const {error}=await supabase.from('requests').update({deleted:true}).eq('id',id);
  if(error){setStatus('Ошибка удаления: '+error.message,true);return}
  x.deleted=true;selected='';$('#details').innerHTML='<div class="empty">Реквест удалён</div>';renderNav();renderList();setStatus('Реквест удалён');
}
async function addCategory(){
  const input=$('#newCategory'),name=input.value.trim();if(!name)return;
  const {data,error}=await supabase.from('categories').insert({name}).select().single();
  if(error){alert(error.code==='23505'?'Такая категория уже существует':error.message);return}
  categories.push(data);categories.sort((a,b)=>a.name.localeCompare(b.name,'ru'));input.value='';renderNav();if(selected)show(selected);setStatus('Категория добавлена');
}
async function importSeed(){
  if(!confirm('Импортировать исходные реквесты в базу? Повторный импорт не создаст дубликаты по source_id.'))return;
  setStatus('Импорт категорий…');
  const names=[...new Set(SEED_REQUESTS.map(x=>x.epic).filter(Boolean))];
  const {error:ce}=await supabase.from('categories').upsert(names.map(name=>({name})),{onConflict:'name'}); if(ce){setStatus(ce.message,true);return}
  const {data:cats,error:cl}=await supabase.from('categories').select('*');if(cl){setStatus(cl.message,true);return}
  const cmap=Object.fromEntries(cats.map(c=>[c.name,c.id]));
  const rows=SEED_REQUESTS.map(x=>({source_id:x.id,external_key:x.id,type:x.type,title:x.title,description:x.description,status:x.status,priority:x.priority,normalized_title:x.normalized_title,requirement:x.requirement,problem:x.problem,business_value:x.value,acceptance:x.acceptance,uncertainty:x.uncertainty,quality:x.quality,youtrack_url:x.yt_url||null,category_id:cmap[x.epic]||null,deleted:false}));
  setStatus(`Импорт ${rows.length} реквестов…`);
  const chunk=50;for(let i=0;i<rows.length;i+=chunk){const {error}=await supabase.from('requests').upsert(rows.slice(i,i+chunk),{onConflict:'source_id'});if(error){setStatus(error.message,true);return}}
  await loadData();setStatus('Исходные реквесты импортированы');
}
function exportJson(){const blob=new Blob([JSON.stringify(requests.filter(x=>!x.deleted),null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='omni360_product_brain.json';a.click();URL.revokeObjectURL(a.href)}

$('#loginForm').onsubmit=async e=>{e.preventDefault();$('#authMessage').textContent='Вход…';const {error}=await supabase.auth.signInWithPassword({email:$('#email').value,password:$('#password').value});$('#authMessage').textContent=error?error.message:''};
$('#logout').onclick=()=>supabase.auth.signOut();
$('#addCategory').onclick=addCategory;$('#newCategory').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();addCategory()}};
$('#importSeed').onclick=importSeed;$('#export').onclick=exportJson;$('#q').oninput=renderList;$('#quality').onchange=renderList;$('#reset').onclick=()=>{$('#q').value='';$('#quality').value='';categoryFilter='';renderNav();renderList()};

async function applySession(session){
  const logged=!!session;$('#auth').hidden=logged;$('#app').hidden=!logged;
  if(logged){$('#userEmail').textContent=session.user.email;try{await loadData()}catch(e){setStatus(e.message,true)}}
}
const {data:{session}}=await supabase.auth.getSession();await applySession(session);
supabase.auth.onAuthStateChange((_event,newSession)=>applySession(newSession));
