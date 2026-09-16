/* 实验记录：项目 → 记录（结构化模板 + 照片）→ 打印导出 */
PAGES.notebook = {
  title:'实验记录',
  state:{pj:'全部', q:''},

  render(el){
    const st=this.state, d=DB.data;
    el.innerHTML=`
      <div class="page-head">
        <div><div class="ht">实验记录</div><div class="hs">${d.entries.length} 条记录 · ${d.projects.length} 个项目</div></div>
        <div class="hact">
          <button class="icon-btn" data-go="export" title="导出 Word/图片">${icon('download')}</button>
          <button class="icon-btn" data-pjmg title="项目管理">${icon('sliders')}</button>
          <button class="btn primary small" data-go="nbform">${icon('plus')}新记录</button>
        </div>
      </div>
      <div class="chips">
        ${['全部',...d.projects.map(p=>p.name)].map(n=>`<button class="chip ${st.pj===n?'on':''}" data-pj="${escAttr(n)}">${esc(n)}</button>`).join('')}
      </div>
      <div class="content">
        <div class="search">${icon('search')}<input id="nbq" placeholder="搜索标题 / 内容…" value="${escAttr(st.q)}"></div>
        <div id="nb-list"></div>
      </div>`;

    el.querySelectorAll('[data-pj]').forEach(b=>b.onclick=()=>{ st.pj=b.dataset.pj; this.render(el); });
    el.querySelector('[data-pjmg]').onclick=()=>this.manageProjects();
    el.querySelector('#nbq').oninput=e=>{ st.q=e.target.value; this.renderList(el.querySelector('#nb-list')); };
    this.renderList(el.querySelector('#nb-list'));
  },

  renderList(list){
    const st=this.state, d=DB.data;
    let items=[...d.entries].sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
    if(st.pj!=='全部'){ const pj=d.projects.find(p=>p.name===st.pj); if(pj) items=items.filter(e=>e.projectId===pj.id); }
    if(st.q){ const q=st.q.toLowerCase(); items=items.filter(e=>{
      const tp=TEMPLATES[e.type]||TEMPLATES.general;
      const body=(e.title||'')+tp.name+Object.values(e.fields||{}).join(' ')+(e.notes||'');
      return body.toLowerCase().includes(q); }); }

    if(!items.length){ list.innerHTML=`<div class="empty">${icon('book')}<p>${st.q||st.pj!=='全部'?'没有匹配的记录':'还没有实验记录'}</p><span>点右上角「新记录」开始，或换个筛选条件</span></div>`; return; }

    /* 按日期分组 */
    const groups={};
    items.forEach(e=>{ const g=e.date||'未标注日期'; (groups[g]=groups[g]||[]).push(e); });
    const keys=Object.keys(groups).sort().reverse();
    list.innerHTML=keys.map(g=>`
      <div class="card-t" style="margin:6px 4px 8px"><span style="font-size:13px;font-weight:700;color:var(--text-3)">${dateCN(g)||g}</span></div>
      ${groups[g].map(e=>{
        const tp=TEMPLATES[e.type]||TEMPLATES.general;
        const pj=d.projects.find(p=>p.id===e.projectId);
        return `<div class="rows" data-open="nbview/${e.id}" style="margin-bottom:10px">
          <div class="row-item">
            <div class="avatar-ic" style="background:var(--primary-soft);color:var(--primary)">${icon(tp.ic||'edit')}</div>
            <div class="ri-main">
              <div class="ri-t">${esc(e.title||tp.name)}</div>
              <div class="ri-s">
                <span class="badge violet">${esc(tp.name)}</span>
                ${pj?`<span class="dot" style="background:${pj.color}"></span><span>${esc(pj.name)}</span>`:''}
                ${(e.photos||[]).length?`<span>${icon('camera')}</span>`:''}
              </div>
            </div>${icon('chevR')}
          </div>
        </div>`;}).join('')}`).join('');

    list.querySelectorAll('[data-open]').forEach(r=>r.onclick=()=>go(r.dataset.open));
  },

  /* ---------- 项目管理 ---------- */
  manageProjects(){
    const d=DB.data;
    const draw=({root})=>{
      root.querySelector('#pj-list').innerHTML = d.projects.length? d.projects.map(p=>`
        <div class="row-item" style="padding:11px 4px">
          <span class="dot" style="background:${p.color};width:12px;height:12px"></span>
          <div class="ri-main"><div class="ri-t">${esc(p.name)}</div><div class="ri-s">${esc(p.desc||'')}</div></div>
          <button class="icon-btn" style="width:32px;height:32px" data-ed="${p.id}">${icon('edit')}</button>
        </div>`).join('')
        : `<div class="empty" style="padding:24px">${icon('list')}<p>还没有项目</p><span>按课题建立项目，记录会归类管理</span></div>`;
      root.querySelectorAll('[data-ed]').forEach(b=>b.onclick=()=>{ editProject(b.dataset.ed, ()=>{ DB.save(); draw({root}); this.render(document.getElementById('viewport')); }); });
    };
    const { root } = UI.sheet(`
      <div class="sh-head"><h3>项目管理</h3><button class="icon-btn" data-close>${icon('x')}</button></div>
      <div class="sh-body"><div id="pj-list"></div></div>
      <div class="sh-foot"><button class="btn ghost block" id="pj-add">${icon('plus')}新建项目</button></div>`);
    const editProject=(id, after)=>{
      const p = id? d.projects.find(x=>x.id===id) : {name:'',color:'#2B6BF3',desc:''};
      UI.formSheet({title:id?'编辑项目':'新建项目', submit:'保存', fields:[
        {k:'name',l:'项目名称',value:p.name,req:1},
        {k:'color',l:'颜色',t:'color',value:p.color},
        {k:'desc',l:'说明（选填）',value:p.desc},
      ], onSubmit:v=>{
        if(!v.name){ UI.toast('请填写名称','err'); return; }
        if(id){ Object.assign(d.projects.find(x=>x.id===id), v); }
        else d.projects.push({id:uid(), ...v, createdAt:Date.now()});
        DB.save(); after&&after();
      }});
    };
    draw({root});
    root.querySelector('#pj-add').onclick=()=>editProject(null, ()=>{ DB.save(); draw({root}); this.render(document.getElementById('viewport')); });
  }
};

/* ============ 新建 / 编辑记录 ============ */
PAGES.nbform = {
  title:'实验记录',
  pendingPhotos:[],

  render(el, arg){
    const d=DB.data;
    const editing = arg? d.entries.find(e=>e.id===arg) : null;
    const type = editing? editing.type : (this._lastType||'general');
    this._curType = type;
    const tp = TEMPLATES[type]||TEMPLATES.general;
    this.pendingPhotos = [];

    const photoThumbs = (editing&&editing.photos||[]).length? '载入中…' : '';

    el.innerHTML=`
      <div class="sub-head">
        <button class="icon-btn" data-back>${icon('chevL')}</button>
        <div class="title">${editing?'编辑记录':'新记录'}</div>
        <div style="width:38px"></div>
      </div>
      <div class="content">
        <div class="chips" style="padding:0 0 4px" id="tp-chips">
          ${Object.entries(TEMPLATES).map(([k,t])=>`<button class="chip ${k===type?'on':''}" data-tp="${k}">${esc(t.name)}</button>`).join('')}
        </div>
        <div class="card" style="margin-top:10px">
          <div class="fld"><span>标题（选填，默认用类型名）</span><div class="ctl"><input id="ef-title" value="${escAttr(editing?editing.title:'')}" placeholder="${esc(tp.name)}"></div></div>
          <div class="frow">
            <div class="fld"><span>日期</span><div class="ctl"><input id="ef-date" type="date" value="${editing?editing.date||todayStr():todayStr()}"></div></div>
            <div class="fld"><span>所属项目</span><div class="ctl"><select id="ef-pj">
              <option value="">不归属</option>
              ${d.projects.map(p=>`<option value="${p.id}" ${editing&&editing.projectId===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}
            </select></div></div>
          </div>
          <div id="ef-fields">${this.fieldsHTML(tp, editing)}</div>
          <div class="fld"><span>详细记录</span><div class="ctl"><textarea id="ef-notes" rows="5" placeholder="现象、参数、思路、结果分析…">${esc(editing?editing.notes||'':'')}</textarea></div></div>
          <div class="fld"><span>照片（凝胶图 / 生长情况 / 仪器读数）</span>
            <div class="photo-grid" id="ef-photos">${photoThumbs}
              <button class="add-ph" id="ef-addph">${icon('camera')}添加照片</button>
            </div>
          </div>
        </div>
        <button class="btn primary block" id="ef-save">${editing?'保存修改':'保存记录'}</button>
        <div style="height:8px"></div>
      </div>`;

    /* 已有照片预览 */
    if(editing){
      const grid=el.querySelector('#ef-photos');
      Promise.all((editing.photos||[]).map(id=>DB.getPhoto(id).then(u=>({id,u}))))
        .then(list=>{ list.filter(x=>x.u).forEach(x=>{
          const div=document.createElement('div'); div.className='ph existing'; div.dataset.pid=x.id;
          div.innerHTML=`<img src="${x.u}"><button class="del">${icon('x')}</button>`;
          div.querySelector('img').onclick=()=>UI.viewer(x.u);
          div.querySelector('.del').onclick=ev=>{
            ev.stopPropagation();
            DB.delPhoto(x.id);
            DB.data.entries.forEach(en=>{ if(en.id===editing.id) en.photos=en.photos.filter(p=>p!==x.id); });
            DB.save(); div.remove(); UI.toast('已删除照片');
          };
          grid.insertBefore(div, grid.querySelector('.add-ph'));
        }); });
    }

    el.querySelectorAll('[data-tp]').forEach(b=>b.onclick=()=>{
      this._lastType=b.dataset.tp;
      this._curType=b.dataset.tp;
      const tp2=TEMPLATES[b.dataset.tp]||TEMPLATES.general;
      el.querySelector('#ef-fields').innerHTML=this.fieldsHTML(tp2, null);
      el.querySelector('#ef-title').placeholder=tp2.name;
      el.querySelectorAll('#tp-chips .chip').forEach(x=>x.classList.toggle('on',x===b));
    });

    el.querySelector('#ef-addph').onclick=async ()=>{
      const list=await UI.pickPhotos();
      this.pendingPhotos.push(...list);
      const grid=el.querySelector('#ef-photos');
      list.forEach(u=>{
        const div=document.createElement('div'); div.className='ph pending';
        div.innerHTML=`<img src="${u}"><button class="del">${icon('x')}</button>`;
        div.querySelector('img').onclick=()=>UI.viewer(u);
        div.querySelector('.del').onclick=ev=>{
          ev.stopPropagation();
          this.pendingPhotos=this.pendingPhotos.filter(p=>p!==u); div.remove();
        };
        grid.insertBefore(div, grid.querySelector('.add-ph'));
      });
    };

    el.querySelector('#ef-save').onclick=async ()=>{
      const title=el.querySelector('#ef-title').value.trim();
      const date=el.querySelector('#ef-date').value||todayStr();
      const projectId=el.querySelector('#ef-pj').value||null;
      const notes=el.querySelector('#ef-notes').value.trim();
      const fields={};
      el.querySelectorAll('#ef-fields [data-fk]').forEach(inp=>{ fields[inp.dataset.fk]=inp.value.trim(); });

      let entry;
      const finalType=this._curType||'general';
      if(editing){
        entry=editing; entry.title=title; entry.date=date; entry.projectId=projectId;
        entry.notes=notes; entry.type=finalType; entry.fields=fields; entry.updatedAt=Date.now();
      }else{
        entry={ id:uid(), type:finalType, title, date, projectId, notes, fields, photos:[], createdAt:Date.now(), updatedAt:Date.now() };
        d.entries.push(entry);
      }
      /* 存照片 */
      for(const u of this.pendingPhotos){
        const pid=uid();
        await DB.putPhoto(pid,u);
        entry.photos.push(pid);
      }
      this.pendingPhotos=[];
      DB.save();
      UI.toast('已保存记录');
      go(`nbview/${entry.id}`);
    };
  },

  fieldsHTML(tp, entry){
    if(!tp.fields.length) return `<div class="info-note" style="margin-bottom:0">${icon('info')}<span>自由记录类型：请使用下方「详细记录」书写，可配合照片。</span></div>`;
    return tp.fields.map(f=>{
      const v = entry? (entry.fields||{})[f.k]||'' : '';
      if(f.t==='select'){
        return `<div class="fld"><span>${esc(f.l)}</span><div class="ctl"><select data-fk="${f.k}">
          ${f.o.map(o=>`<option ${o===v?'selected':''}>${esc(o)}</option>`).join('')}</select></div></div>`;
      }
      if(f.t==='textarea'){
        return `<div class="fld"><span>${esc(f.l)}</span><div class="ctl"><textarea data-fk="${f.k}" rows="2" placeholder="${esc(f.ph||'')}">${esc(v)}</textarea></div></div>`;
      }
      return `<div class="fld"><span>${esc(f.l)}</span><div class="ctl"><input data-fk="${f.k}" type="${f.t||'text'}" inputmode="${f.t==='number'?'decimal':'text'}" value="${escAttr(v)}" placeholder="${esc(f.ph||'')}"></div></div>`;
    }).join('');
  }
};

/* ============ 记录详情 ============ */
PAGES.nbview = {
  title:'记录详情',
  render(el, id){
    const d=DB.data;
    const e=d.entries.find(x=>x.id===id);
    if(!e){ el.innerHTML=`<div class="empty">${icon('alert')}<p>记录不存在</p></div>`; return; }
    const tp=TEMPLATES[e.type]||TEMPLATES.general;
    const pj=d.projects.find(p=>p.id===e.projectId);
    el.innerHTML=`
      <div class="sub-head">
        <button class="icon-btn" data-back>${icon('chevL')}</button>
        <div class="title">记录详情</div>
        <button class="icon-btn" data-print title="打印/存为PDF">${icon('print')}</button>
      </div>
      <div class="content">
        <div class="card">
          <div class="card-t"><h3>${icon(tp.ic||'edit')}${esc(e.title||tp.name)}</h3><span class="badge violet">${esc(tp.name)}</span></div>
          <div class="ri-s" style="display:flex;gap:8px;align-items:center;margin-top:-4px">
            ${pj?`<span class="dot" style="background:${pj.color}"></span><span style="font-size:13px">${esc(pj.name)}</span>`:''}
            <span style="font-size:13px;color:var(--text-3)">${dateCN(e.date)||e.date}</span>
          </div>
          ${tp.fields.map(f=>{
            const v=(e.fields||{})[f.k];
            if(!v) return '';
            return `<div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px dashed var(--border);font-size:14px">
              <span style="color:var(--text-3);flex-shrink:0;min-width:88px">${esc(f.l)}</span>
              <span style="font-weight:600;word-break:break-all">${esc(v)}</span></div>`;
          }).join('')}
          ${e.notes?`<div style="margin-top:12px;font-size:14px;line-height:1.75;white-space:pre-wrap;word-break:break-word">${esc(e.notes)}</div>`:''}
        </div>
        <div class="photo-grid" id="vp-photos"></div>
        <div style="height:8px"></div>
        <div class="frow">
          <button class="btn ghost" id="vp-edit">${icon('edit')}编辑</button>
          <button class="btn danger" id="vp-del">${icon('trash')}删除</button>
        </div>
      </div>`;

    const grid=el.querySelector('#vp-photos');
    (e.photos||[]).forEach(pid=>{
      DB.getPhoto(pid).then(u=>{
        if(!u) return;
        const div=document.createElement('div'); div.className='ph';
        div.innerHTML=`<img src="${u}">`;
        div.onclick=()=>UI.viewer(u);
        grid.appendChild(div);
      });
    });
    el.querySelector('[data-print]').onclick=()=>go(`print/${e.id}`);
    el.querySelector('#vp-edit').onclick=()=>go(`nbform/${e.id}`);
    el.querySelector('#vp-del').onclick=async ()=>{
      if(await UI.confirm('删除记录','记录及其照片将被永久删除。',{danger:true,okText:'删除'})){
        (e.photos||[]).forEach(pid=>DB.delPhoto(pid));
        DB.data.entries=DB.data.entries.filter(x=>x.id!==e.id);
        DB.save(); UI.toast('已删除'); go('notebook');
      }
    };
  }
};

/* ============ 打印视图（系统分享/打印 → 存为PDF） ============ */
PAGES.print = {
  title:'导出',
  render(el, id){
    const d=DB.data;
    const e=d.entries.find(x=>x.id===id);
    if(!e){ el.innerHTML=`<div class="empty">${icon('alert')}<p>记录不存在</p></div>`; return; }
    const tp=TEMPLATES[e.type]||TEMPLATES.general;
    const pj=d.projects.find(p=>p.id===e.projectId);
    el.innerHTML=`
      <div class="sub-head no-print">
        <button class="icon-btn" data-back>${icon('chevL')}</button>
        <div class="title">导出 / 打印</div>
        <button class="btn primary small" id="pr-go">${icon('print')}打印</button>
      </div>
      <div class="content no-print">
        <div class="info-note">${icon('share')}<span>点击「打印」后：iPhone 选择 <b>分享 → 存储/导出为 PDF</b>；电脑浏览器在打印对话框选「另存为 PDF」。</span></div>
      </div>
      <div class="print-doc" id="pr-doc">
        <h1>${esc(e.title||tp.name)}</h1>
        <div class="pmeta">${esc(DB.data.settings.labName)} · ${esc(tp.name)} · ${e.date||''}${pj?' · 项目：'+esc(pj.name):''} · 导出于 ${todayStr()}</div>
        ${tp.fields.map(f=>{
          const v=(e.fields||{})[f.k];
          return v?`<table><tr><td>${esc(f.l)}</td><td>${esc(v)}</td></tr></table>`:'';
        }).join('')}
        ${e.notes?`<div class="pnotes">${esc(e.notes)}</div>`:''}
        <div class="photos" id="pr-photos"></div>
      </div>`;

    const box=el.querySelector('#pr-photos');
    (e.photos||[]).forEach(pid=>DB.getPhoto(pid).then(u=>{ if(u){ const img=new Image(); img.src=u; box.appendChild(img); } }));
    el.querySelector('#pr-go').onclick=()=>window.print();
  }
};
