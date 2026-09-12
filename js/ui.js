/* ============================================================
   UI 组件库：Toast / 弹层 / 表单弹层 / 照片 / 剪贴板
   ============================================================ */
const UI = {
  /* ---------- Toast ---------- */
  toast(msg, type='ok'){
    const root = document.getElementById('toast-root');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = icon(type==='ok'?'check':type==='err'?'alert':'info') + `<span>${esc(msg)}</span>`;
    root.appendChild(el);
    setTimeout(()=>{ el.style.transition='opacity .25s,transform .25s'; el.style.opacity='0'; el.style.transform='translateY(-10px)'; setTimeout(()=>el.remove(),260); }, 2200);
  },

  /* ---------- 底部弹层 ---------- */
  sheet(html, {onClose}={}){
    const mask = document.createElement('div'); mask.className='mask';
    const sh = document.createElement('div'); sh.className='sheet';
    sh.innerHTML = `<div class="grab"></div>` + html;
    document.body.append(mask, sh);
    requestAnimationFrame(()=>{ mask.classList.add('show'); sh.classList.add('show'); });
    const close = () => {
      mask.classList.remove('show'); sh.classList.remove('show');
      setTimeout(()=>{ mask.remove(); sh.remove(); onClose&&onClose(); }, 290);
    };
    mask.addEventListener('click', close);
    sh.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click', close));
    return { close, root: sh };
  },

  /* ---------- 确认对话框 ---------- */
  confirm(title, text, {okText='确认', danger=false}={}){
    return new Promise(res=>{
      const mask=document.createElement('div'); mask.className='mask';
      const dg=document.createElement('div'); dg.className='dialog';
      dg.innerHTML = `<h3>${esc(title)}</h3><p>${esc(text)}</p>
        <div class="dg-btns">
          <button class="btn plain" data-no>取消</button>
          <button class="btn ${danger?'danger':'primary'}" data-yes>${esc(okText)}</button>
        </div>`;
      document.body.append(mask,dg);
      requestAnimationFrame(()=>{ mask.classList.add('show'); dg.classList.add('show'); });
      const end=v=>{ mask.classList.remove('show'); dg.classList.remove('show'); setTimeout(()=>{mask.remove();dg.remove();},210); res(v); };
      dg.querySelector('[data-yes]').onclick=()=>end(true);
      dg.querySelector('[data-no]').onclick=()=>end(false);
      mask.onclick=()=>end(false);
    });
  },

  /* ---------- 通用表单弹层 ----------
     fields: [{k,l,t:'text|number|textarea|date|select|color',o:[],value,ph,unit,req,hint}] */
  formSheet({title, fields, submit='保存', onSubmit, onClose}){
    const body = fields.map(f=>{
      const v = f.value!=null ? f.value : '';
      let ctl='';
      if(f.t==='select'){
        ctl = `<select data-k="${f.k}">${(f.o||[]).map(o=>`<option value="${escAttr(o)}" ${o===v?'selected':''}>${esc(o)}</option>`).join('')}</select>`;
      }else if(f.t==='textarea'){
        ctl = `<textarea data-k="${f.k}" rows="3" placeholder="${esc(f.ph||'')}">${esc(v)}</textarea>`;
      }else if(f.t==='color'){
        const palette=['#2B6BF3','#0FA37F','#7C5CFC','#E8830C','#DC3D43','#0E8FA3','#B85CDB','#5A6B85'];
        ctl = `<div class="chip-row" data-k="${f.k}" data-val="${esc(v||palette[0])}">${palette.map(c=>`
          <button type="button" class="swatch ${c===(v||palette[0])?'on':''}" style="background:${c}" data-c="${c}"></button>`).join('')}</div>`;
      }else if(f.t==='date'){
        ctl = `<input type="date" data-k="${f.k}" value="${escAttr(v)}">`;
      }else{
        ctl = `<input type="${f.t||'text'}" inputmode="${f.t==='number'?'decimal':'text'}" data-k="${f.k}" value="${escAttr(v)}" placeholder="${esc(f.ph||'')}">` + (f.unit?`<span class="u">${esc(f.unit)}</span>`:'');
      }
      return `<label class="fld"><span>${esc(f.l)}${f.req?' *':''}</span><div class="ctl">${ctl}</div>${f.hint?`<div class="hint">${esc(f.hint)}</div>`:''}</label>`;
    }).join('');

    const { close, root } = this.sheet(`
      <div class="sh-head"><h3>${esc(title)}</h3><button class="icon-btn" data-close>${icon('x')}</button></div>
      <div class="sh-body"><form id="sheet-form">${body}</form></div>
      <div class="sh-foot"><button class="btn primary block" data-submit>${esc(submit)}</button></div>`, {onClose});

    root.querySelectorAll('.swatch').forEach(b=>b.onclick=()=>{
      const row = b.parentElement;
      row.dataset.val = b.dataset.c;
      row.querySelectorAll('.swatch').forEach(x=>x.classList.remove('on'));
      b.classList.add('on');
    });

    const collect = () => {
      const out={};
      root.querySelectorAll('[data-k]').forEach(inp=>{
        if(inp.classList.contains('chip-row')) out[inp.dataset.k]=inp.dataset.val;
        else out[inp.dataset.k]=inp.value.trim();
      });
      return out;
    };
    root.querySelector('[data-submit]').onclick = () => {
      const vals = collect();
      close();
      onSubmit(vals);
    };
    return { close, root };
  },

  /* ---------- 剪贴板 ---------- */
  copy(text){
    const done=()=>this.toast('已复制到剪贴板');
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(done).catch(()=>this._copyFallback(text,done));
    } else this._copyFallback(text,done);
  },
  _copyFallback(text,done){
    const ta=document.createElement('textarea'); ta.value=text; ta.style.cssText='position:fixed;opacity:0';
    document.body.appendChild(ta); ta.select();
    try{ document.execCommand('copy'); done(); }catch(e){ this.toast('复制失败','err'); }
    ta.remove();
  },

  /* ---------- 照片选择与压缩 ---------- */
  pickPhotos(max=6){
    return new Promise(resolve=>{
      const inp=document.createElement('input');
      inp.type='file'; inp.accept='image/*'; inp.multiple=true;
      inp.onchange = async ()=>{
        const files=[...inp.files].slice(0,max);
        const out=[];
        for(const f of files){
          try{ out.push(await this.compress(f)); }catch(e){}
        }
        resolve(out);
      };
      inp.click();
    });
  },
  compress(file, maxDim=1280, quality=0.82){
    return new Promise((res,rej)=>{
      const img=new Image();
      const url=URL.createObjectURL(file);
      img.onload=()=>{
        const sc=Math.min(1, maxDim/Math.max(img.width,img.height));
        const cv=document.createElement('canvas');
        cv.width=Math.round(img.width*sc); cv.height=Math.round(img.height*sc);
        cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height);
        URL.revokeObjectURL(url);
        res(cv.toDataURL('image/jpeg',quality));
      };
      img.onerror=rej;
      img.src=url;
    });
  },

  /* ---------- 全屏看图 ---------- */
  viewer(dataurl){
    const v=document.createElement('div'); v.className='photo-viewer';
    v.innerHTML=`<img src="${dataurl}"><div class="pv-close">${icon('x')}</div>`;
    document.body.appendChild(v);
    requestAnimationFrame(()=>v.classList.add('show'));
    const close=()=>{ v.classList.remove('show'); setTimeout(()=>v.remove(),210); };
    v.onclick=close;
  }
};

/* 计算类页面通用：绑定数值输入实时重算 */
function liveCalc(rootSel, fn){
  const root=document.querySelector(rootSel);
  if(!root) return;
  root.addEventListener('input', fn);
  root.addEventListener('change', fn);
}
function getNum(sel){
  const el=document.querySelector(sel);
  if(!el) return NaN;
  const v=parseFloat(el.value);
  return isNaN(v)?NaN:v;
}
