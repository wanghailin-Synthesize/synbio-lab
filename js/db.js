/* ============================================================
   数据层：全部数据保存在设备本地（localStorage + IndexedDB 存照片）
   ============================================================ */
const DB = {
  KEY:'slab-db-v1',
  data:null,
  _idb:null,

  defaults(){
    return {
      v:1,
      settings:{ labName:'食品合成生物学小组', theme:'auto' },
      projects:[], entries:[], tasks:[], protocols:[], inventory:[], boxes:[], qplates:[],
      customRecipes:[], timers:[], flags:{}
    };
  },

  load(){
    let raw=null;
    try{ raw = JSON.parse(localStorage.getItem(this.KEY)); }catch(e){}
    const d = Object.assign(this.defaults(), raw||{});
    d.settings = Object.assign({labName:'食品合成生物学小组',theme:'auto'}, d.settings||{});
    this.data = d;
  },

  save(){
    try{ localStorage.setItem(this.KEY, JSON.stringify(this.data)); }
    catch(e){ UI.toast('存储空间不足，建议导出备份并清理旧照片','err'); }
  },

  /* ---- IndexedDB 照片仓 ---- */
  _idbGet(){
    if(this._idb) return Promise.resolve(this._idb);
    return new Promise((res,rej)=>{
      const rq = indexedDB.open('slab-photos',1);
      rq.onupgradeneeded = e => { e.target.result.createObjectStore('ph'); };
      rq.onsuccess = e => { this._idb = e.target.result; res(this._idb); };
      rq.onerror = () => rej(rq.error);
    });
  },
  _tx(mode){ return this._idbGet().then(db => db.transaction('ph',mode).objectStore('ph')); },
  putPhoto(id,dataurl){ return this._tx('readwrite').then(s => new Promise((res,rej)=>{ const r=s.put(dataurl,id); r.onsuccess=()=>res(); r.onerror=()=>rej(r.error); })); },
  getPhoto(id){ return this._tx('readonly').then(s => new Promise((res)=>{ const r=s.get(id); r.onsuccess=()=>res(r.result||null); })); },
  delPhoto(id){ return this._tx('readwrite').then(s => new Promise((res)=>{ const r=s.delete(id); r.onsuccess=()=>res(); })); },
  clearPhotos(){ return this._tx('readwrite').then(s => new Promise((res)=>{ const r=s.clear(); r.onsuccess=()=>res(); })); },

  /* ---- 备份 ---- */
  async exportAll(){
    const photos = {};
    const db = await this._idbGet();
    await new Promise((res)=>{
      const rq = db.transaction('ph','readonly').objectStore('ph').openCursor();
      rq.onsuccess = e => { const c=e.target.result; if(c){ photos[c.key]=c.value; c.continue(); } else res(); };
    });
    return JSON.stringify({ app:'synbio-lab', version:1, exportedAt:new Date().toISOString(), db:this.data, photos });
  },
  async importAll(jsonStr){
    const obj = JSON.parse(jsonStr);
    if(!obj || obj.app!=='synbio-lab' || !obj.db) throw new Error('不是本应用的备份文件');
    await this.clearPhotos();
    const ph = obj.photos||{};
    for(const k in ph){ if(typeof ph[k]==='string' && ph[k].startsWith('data:image')) await this.putPhoto(k, ph[k]); }
    this.data = Object.assign(this.defaults(), obj.db);
    this.save();
  },
  async wipe(){
    localStorage.removeItem(this.KEY);
    await this.clearPhotos();
    this.load();
  }
};

/* 工具函数 */
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function esc(s){ return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function escAttr(s){ return esc(s).replace(/\n/g,'&#10;'); }

/* 数字格式化：保留有效位、去尾零 */
function fmtN(n, sig=4){
  if(n===Infinity) return '∞';
  if(!isFinite(n) || isNaN(n)) return '—';
  if(n===0) return '0';
  const a = Math.abs(n);
  if(a>=1e6 || a<1e-4) return n.toExponential(2).replace('e','×10^');
  const v = Number(n.toPrecision(sig));
  return String(v);
}
/* 科学计数法展示：3.2×10⁸ */
function sciFmt(n, digits=1){
  if(!isFinite(n)||n===0) return '0';
  const e = Math.floor(Math.log10(Math.abs(n)));
  const m = n/Math.pow(10,e);
  const SUP='⁰¹²³⁴⁵⁶⁷⁸⁹';
  const sup = String(e).split('').map(c=>c==='-'?'⁻':SUP[+c]).join('');
  return `${m.toFixed(digits).replace(/\.0$/,'')}×10${sup}`;
}
/* 智能单位：以基准单位 g / L / mol 展示 */
function smartUnit(v, base){
  const table = base==='g'
    ? [[1e-9,'ng'],[1e-6,'µg'],[1e-3,'mg'],[1,'g'],[1000,'kg']]
    : base==='L'
    ? [[1e-9,'nL'],[1e-6,'µL'],[1e-3,'mL'],[1,'L']]
    : [[1e-9,'nmol'],[1e-6,'µmol'],[1e-3,'mmol'],[1,'mol']];
  let pick = table[0];
  for(const row of table){ if(Math.abs(v) >= row[0]) pick = row; }
  return { v: fmtN(v/pick[0],4), u: pick[1] };
}
function fmtAmt(v, u){
  /* 配方用量展示：数值太小时自动换单位 */
  if(u==='g' && v<1) return {v:fmtN(v*1000,3),u:'mg'};
  if(u==='g' && v<0.001) return {v:fmtN(v*1e6,3),u:'µg'};
  if(u==='mL' && v<1) return {v:fmtN(v*1000,3),u:'µL'};
  return {v:fmtN(v,3),u};
}
/* 日期 */
function todayStr(){ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function dateCN(s){
  if(!s) return '';
  const [y,m,d] = s.split('-').map(Number);
  const wd='日一二三四五六'[new Date(y,m-1,d).getDay()];
  return `${m}月${d}日 周${wd}`;
}
function friendlyDue(s){
  if(!s) return {txt:'无日期',cls:'gray'};
  const t=new Date(); t.setHours(0,0,0,0);
  const d=new Date(s+'T00:00:00'); d.setHours(0,0,0,0);
  const diff=Math.round((d-t)/86400000);
  if(diff===0) return {txt:'今天',cls:'blue'};
  if(diff===1) return {txt:'明天',cls:'orange'};
  if(diff<0) return {txt:`逾期${-diff}天`,cls:'red'};
  if(diff<=7) return {txt:`${diff}天后`,cls:'gray'};
  return {txt:`${d.getMonth()+1}/${d.getDate()}`,cls:'gray'};
}
function expiryState(s){
  if(!s) return {txt:'无期限',cls:'gray'};
  const t=new Date(); t.setHours(0,0,0,0);
  const d=new Date(s+'T00:00:00');
  const diff=Math.round((d-t)/86400000);
  if(diff<0) return {txt:`已过期${-diff}天`,cls:'red'};
  if(diff<=30) return {txt:`${diff}天后过期`,cls:'orange'};
  return {txt:'正常',cls:'green'};
}
function mmss(sec){
  sec = Math.max(0, Math.round(sec));
  const h=Math.floor(sec/3600), m=Math.floor(sec%3600/60), s=sec%60;
  const p=n=>String(n).padStart(2,'0');
  return h>0 ? `${h}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
}
