/* 库存管理：试剂 / 母液 / 菌株 / 质粒 / 耗材台账（效期提醒）+ 冰箱盒子总览 */
PAGES.inventory = {
  title:'库存管理',
  state:{view:'list', cat:'全部', q:''},

  CATS:['全部','抗生素母液','化学品','培养基','酶与蛋白','菌株','质粒','耗材'],
  /* 盒子规格：r=行数（A,B,C…），c=列数（1,2,3…） */
  BOX_TYPES:[
    {k:'keep',  n:'保菌盒', r:9, c:9},
    {k:'big',   n:'大盒子', r:8, c:8},
    {k:'mid',   n:'中盒子', r:5, c:8},
    {k:'small', n:'小盒子', r:4, c:6}
  ],

  render(el){
    const st=this.state, d=DB.data;
    const hs = st.view==='list'
      ? `${d.inventory.length} 项 · 效期自动提醒`
      : `${d.boxes.length} 个盒子 · 点格子记录内容`;
    el.innerHTML=`
      <div class="page-head">
        <div><div class="ht">库存管理</div><div class="hs">${hs}</div></div>
        <div class="hact">${st.view==='list'
          ? `<button class="btn primary small" id="inv-add">${icon('plus')}入库</button>`
          : `<button class="btn primary small" id="box-add">${icon('plus')}新盒子</button>`}</div>
      </div>
      <div class="chips">
        <button class="chip ${st.view==='list'?'on':''}" data-view="list">📋 台账</button>
        <button class="chip ${st.view==='box'?'on':''}" data-view="box">🧊 冰箱盒子</button>
      </div>
      <div class="content" id="inv-panel"></div>`;
    el.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{ st.view=b.dataset.view; this.render(el); });
    const addBtn=el.querySelector('#inv-add');
    if(addBtn) addBtn.onclick=()=>this.editItem();
    const boxBtn=el.querySelector('#box-add');
    if(boxBtn) boxBtn.onclick=()=>this.editBox(null, ()=>this.render(el));
    const p=el.querySelector('#inv-panel');
    if(st.view==='list') this.panelList(p);
    else this.panelBox(p);
  },

  /* ============ 台账（试剂/菌株/质粒…） ============ */
  panelList(p){
    const st=this.state;
    p.innerHTML=`
      <div class="search">${icon('search')}<input id="invq" placeholder="搜索名称 / 位置…" value="${escAttr(st.q)}"></div>
      <div class="chips" style="padding:0 0 10px">
        ${this.CATS.map(c=>`<button class="chip ${st.cat===c?'on':''}" data-cat="${c}">${c}</button>`).join('')}
      </div>
      <div id="inv-list"></div>`;
    p.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{ st.cat=b.dataset.cat; this.panelList(p); });
    p.querySelector('#invq').oninput=e=>{ st.q=e.target.value; this.renderList(p.querySelector('#inv-list')); };
    this.renderList(p.querySelector('#inv-list'));
  },

  renderList(list){
    const st=this.state, d=DB.data;
    let items=[...d.inventory];
    if(st.cat!=='全部') items=items.filter(x=>x.cat===st.cat);
    if(st.q) items=items.filter(x=>((x.name||'')+(x.loc||'')+(x.note||'')).toLowerCase().includes(st.q.toLowerCase()));
    items.sort((a,b)=>(a.expiry||'9999-99-99')<(b.expiry||'9999-99-99')?-1:1);

    if(!items.length){ list.innerHTML=`<div class="empty">${icon('box')}<p>还没有库存条目</p><span>把抗生素母液、菌株、质粒登记进来，到期自动提醒</span></div>`; return; }

    list.innerHTML=items.map(x=>{
      const ex=expiryState(x.expiry);
      const isStrain=x.cat==='菌株'||x.cat==='质粒';
      const sub=isStrain
        ? [x.genotype, x.resist?`抗性 ${x.resist}`:''].filter(Boolean).join(' · ')
        : [x.loc, x.qty?`${x.qty} ${x.unit||''}`:''].filter(Boolean).join(' · ');
      return `<div class="rows" style="margin-bottom:10px">
        <div class="row-item">
          <div class="avatar-ic" style="background:${ex.cls==='red'?'var(--red-soft)':ex.cls==='orange'?'var(--orange-soft)':'var(--primary-soft)'};color:${ex.cls==='red'?'var(--red)':ex.cls==='orange'?'var(--orange)':'var(--primary)'}">
            ${icon(isStrain?'dna':'vial')}</div>
          <div class="ri-main">
            <div class="ri-t">${esc(x.name)}</div>
            ${sub?`<div class="ri-s">${esc(sub)}</div>`:''}
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
            <span class="badge ${ex.cls}">${ex.txt}</span>
            <span class="badge gray">${esc(x.cat)}</span>
          </div>
          <button class="icon-btn" style="width:32px;height:32px" data-edit="${x.id}">${icon('edit')}</button>
        </div>
      </div>`;}).join('');

    list.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>this.editItem(b.dataset.edit));
  },

  editItem(id){
    const d=DB.data;
    const x=id? d.inventory.find(i=>i.id===id) : {name:'',cat:'抗生素母液',loc:'',qty:'',unit:'',expiry:'',genotype:'',resist:'',note:''};
    const fields=[
      {k:'name',l:'名称',value:x.name,req:1,ph:'如 卡那霉素母液 50mg/mL'},
      {k:'cat',l:'类别',t:'select',o:this.CATS.slice(1),value:x.cat},
      {k:'loc',l:'存放位置',value:x.loc,ph:'如 -20℃ 冰箱① 第2层'},
      {k:'qty',l:'数量',t:'number',value:x.qty},
      {k:'unit',l:'单位',value:x.unit,ph:'管 / 瓶 / mL'},
      {k:'expiry',l:'有效期',t:'date',value:x.expiry},
      {k:'genotype',l:'基因型 / 大小（菌株·质粒）',value:x.genotype,ph:'如 DH5α / 2686 bp'},
      {k:'resist',l:'抗性（菌株·质粒）',value:x.resist,ph:'如 Kan'},
      {k:'note',l:'备注',value:x.note}
    ];
    UI.formSheet({title:id?'编辑条目':'新入库', submit:'保存', fields, onSubmit:v=>{
      if(!v.name){ UI.toast('请填写名称','err'); return; }
      if(id) Object.assign(d.inventory.find(i=>i.id===id), v);
      else d.inventory.push({id:uid(), ...v, createdAt:Date.now()});
      DB.save(); UI.toast('已保存');
      this.render(document.getElementById('viewport'));
    }});
  },

  /* ============ 冰箱盒子总览 ============ */
  panelBox(p){
    p.innerHTML=`
      <div class="info-note">${icon('info')}<span>点任意格子记录内容（菌株名 / 质粒编号等），格子坐标 = 行字母 + 列数字，如 C5；留空保存即清除。编辑编号 / 规格 / 位置请用卡片右上角按钮。</span></div>
      <div id="box-list"></div>`;
    this.drawBoxes(p.querySelector('#box-list'));
  },

  drawBoxes(list){
    const d=DB.data;
    if(!d.boxes.length){
      list.innerHTML=`<div class="empty">${icon('box')}<p>还没有登记盒子</p><span>点右上角「新盒子」登记保菌盒 / 冻存盒，编号后放哪、装什么一目了然</span></div>`;
      return;
    }
    list.innerHTML=d.boxes.map(b=>{
      const t=this.BOX_TYPES.find(x=>x.k===b.type)||this.BOX_TYPES[0];
      const used=Object.keys(b.cells||{}).length, total=t.r*t.c;
      return `<div class="card">
        <div class="card-t" style="margin-bottom:6px">
          <h3 style="flex-wrap:wrap">${icon('box')}${esc(b.no||'未编号')}<span class="badge blue">${esc(t.n)} ${t.r}×${t.c}</span></h3>
          <div style="display:flex;gap:6px;flex-shrink:0">
            <button class="icon-btn" style="width:32px;height:32px" data-boxed="${b.id}" title="编辑">${icon('edit')}</button>
            <button class="icon-btn" style="width:32px;height:32px" data-boxdel="${b.id}" title="删除">${icon('trash')}</button>
          </div>
        </div>
        <div class="bx-meta">
          ${b.loc?`<span>📍 ${esc(b.loc)}</span>`:''}
          <span>已用 <b class="num">${used}</b> / ${total} 格</span>
        </div>
        ${this.gridHTML(b)}
        ${b.note?`<div style="margin-top:10px;font-size:12.5px;color:var(--text-2);background:var(--surface-2);border-radius:10px;padding:9px 12px;line-height:1.6">${esc(b.note)}</div>`:''}
      </div>`;}).join('');

    list.querySelectorAll('[data-bxc]').forEach(b=>b.onclick=()=>this.editCell(b.dataset.bxc, b.dataset.key));
    list.querySelectorAll('[data-boxed]').forEach(b=>b.onclick=()=>this.editBox(b.dataset.boxed, ()=>this.render(document.getElementById('viewport'))));
    list.querySelectorAll('[data-boxdel]').forEach(b=>b.onclick=()=>this.delBox(b.dataset.boxdel));
  },

  /* 盒子网格：行字母 A–I + 列数字 1–9 */
  gridHTML(b){
    const t=this.BOX_TYPES.find(x=>x.k===b.type)||this.BOX_TYPES[0];
    const cells=b.cells||{};
    let html=`<div class="bx-grid" style="grid-template-columns:18px repeat(${t.c},1fr)">
      <div></div>${Array.from({length:t.c},(_,i)=>`<div class="bx-collab num">${i+1}</div>`).join('')}`;
    for(let r=0;r<t.r;r++){
      html+=`<div class="bx-rowlab">${String.fromCharCode(65+r)}</div>`;
      for(let c=0;c<t.c;c++){
        const key=r+'-'+c, v=cells[key];
        html+=`<button class="bx-cell ${v?'on':''}" data-bxc="${b.id}" data-key="${key}" aria-label="${String.fromCharCode(65+r)}${c+1}">${v?esc(String(v).slice(0,3)):''}</button>`;
      }
    }
    return html+'</div>';
  },

  /* 点格子：记录 / 清除内容 */
  editCell(boxId, key){
    const d=DB.data;
    const b=d.boxes.find(x=>x.id===boxId); if(!b) return;
    const t=this.BOX_TYPES.find(x=>x.k===b.type)||this.BOX_TYPES[0];
    const [r,c]=key.split('-').map(Number);
    const pos=`${String.fromCharCode(65+r)}${c+1}`;
    const { root, close } = UI.sheet(`
      <div class="sh-head"><h3>${esc(b.no||'盒子')} · 格子 ${pos}</h3><button class="icon-btn" data-close>${icon('x')}</button></div>
      <div class="sh-body">
        <div class="fld"><span>内容（菌株名 / 质粒编号 / 短备注）</span><div class="ctl"><input id="bxc-in" value="${escAttr((b.cells||{})[key]||'')}" placeholder="留空保存即清除该格"></div></div>
        <div class="hint" style="font-size:12px;color:var(--text-3)">保存在台账里的菌株可在台账搜索；这里只记简短内容方便定位。</div>
      </div>
      <div class="sh-foot"><button class="btn primary block" id="bxc-save">保存</button></div>`);
    const inp=root.querySelector('#bxc-in');
    setTimeout(()=>{ try{ inp.focus(); }catch(e){} }, 320);
    inp.addEventListener('keydown', e=>{ if(e.key==='Enter') root.querySelector('#bxc-save').click(); });
    root.querySelector('#bxc-save').onclick=()=>{
      const v=inp.value.trim();
      b.cells=b.cells||{};
      if(v) b.cells[key]=v; else delete b.cells[key];
      DB.save(); close(); UI.toast(v?`已记录 ${pos}`:`已清除 ${pos}`);
      this.render(document.getElementById('viewport'));
    };
  },

  /* 新建 / 编辑盒子 */
  editBox(id, done){
    const d=DB.data;
    const cur = id? d.boxes.find(x=>x.id===id) : {no:'', type:'keep', loc:'', note:'', cells:{}};
    if(!cur) return;
    const labels=this.BOX_TYPES.map(t=>`${t.n} ${t.r}×${t.c}`);
    const curIdx=Math.max(0, this.BOX_TYPES.findIndex(t=>t.k===cur.type));
    UI.formSheet({title:id?'编辑盒子':'新盒子', submit:'保存', fields:[
      {k:'no', l:'盒子编号', value:cur.no, req:1, ph:'如 ① / A-01 / 冷冻柜上层'},
      {k:'type', l:'盒子规格', t:'select', o:labels, value:labels[curIdx]},
      {k:'loc', l:'存放位置', value:cur.loc, ph:'如 -80℃ 冰箱② 第3层'},
      {k:'note', l:'备注（选填）', value:cur.note}
    ], onSubmit:v=>{
      const t=this.BOX_TYPES[labels.indexOf(v.type)]||this.BOX_TYPES[0];
      /* 规格改小时裁掉超出范围的格子 */
      const cells={};
      for(const key in (cur.cells||{})){
        const [r,c]=key.split('-').map(Number);
        if(r<t.r && c<t.c) cells[key]=cur.cells[key];
      }
      const obj={no:v.no, type:t.k, loc:v.loc, note:v.note, cells};
      if(id) Object.assign(cur, obj);
      else d.boxes.push({id:uid(), ...obj, createdAt:Date.now()});
      DB.save(); UI.toast('已保存盒子');
      done&&done();
    }});
  },

  async delBox(id){
    const d=DB.data;
    const b=d.boxes.find(x=>x.id===id); if(!b) return;
    if(await UI.confirm('删除盒子', `盒子「${b.no||'未编号'}」及其格子内容将被删除，不可恢复。`, {danger:true, okText:'删除'})){
      d.boxes=d.boxes.filter(x=>x.id!==id);
      DB.save(); UI.toast('已删除');
      this.render(document.getElementById('viewport'));
    }
  }
};
