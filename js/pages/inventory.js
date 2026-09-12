/* 库存管理：试剂 / 母液 / 菌株 / 质粒 / 耗材台账，效期提醒 */
PAGES.inventory = {
  title:'库存管理',
  state:{cat:'全部', q:''},

  CATS:['全部','抗生素母液','化学品','培养基','酶与蛋白','菌株','质粒','耗材'],

  render(el){
    const st=this.state, d=DB.data;
    el.innerHTML=`
      <div class="page-head">
        <div><div class="ht">库存管理</div><div class="hs">${d.inventory.length} 项 · 效期自动提醒</div></div>
        <div class="hact"><button class="btn primary small" id="inv-add">${icon('plus')}入库</button></div>
      </div>
      <div class="content">
        <div class="search">${icon('search')}<input id="invq" placeholder="搜索名称 / 位置…" value="${escAttr(st.q)}"></div>
        <div class="chips" style="padding:0 0 10px">
          ${this.CATS.map(c=>`<button class="chip ${st.cat===c?'on':''}" data-cat="${c}">${c}</button>`).join('')}
        </div>
        <div id="inv-list"></div>
      </div>`;
    el.querySelector('#inv-add').onclick=()=>this.editItem();
    el.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{ st.cat=b.dataset.cat; this.render(el); });
    el.querySelector('#invq').oninput=e=>{ st.q=e.target.value; this.renderList(el.querySelector('#inv-list')); };
    this.renderList(el.querySelector('#inv-list'));
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
    const isStrain = x.cat==='菌株'||x.cat==='质粒';
    const fields=[
      {k:'name',l:'名称',value:x.name,req:1,ph:'如 卡那霉素母液 50mg/mL'},
      {k:'cat',l:'类别',t:'select',o:this.CATS.slice(1),value:x.cat},
      {k:'loc',l:'存放位置',value:x.loc,ph:'如 -20℃ 冰箱① 第2层'},
      {k:'qty',l:'数量',t:'number',value:x.qty},
      {k:'unit',l:'单位',value:x.unit,ph:'管 / 瓶 / mL'},
      {k:'expiry',l:'有效期',t:'date',value:x.expiry},
    ];
    /* 菌株/质粒字段按需显示：始终显示但标注适用范围 */
    fields.push(
      {k:'genotype',l:'基因型 / 大小（菌株·质粒）',value:x.genotype,ph:'如 DH5α / 2686 bp'},
      {k:'resist',l:'抗性（菌株·质粒）',value:x.resist,ph:'如 Kan'},
      {k:'note',l:'备注',value:x.note}
    );
    UI.formSheet({title:id?'编辑条目':'新入库', submit:'保存', fields, onSubmit:v=>{
      if(!v.name){ UI.toast('请填写名称','err'); return; }
      if(id) Object.assign(d.inventory.find(i=>i.id===id), v);
      else d.inventory.push({id:uid(), ...v, createdAt:Date.now()});
      DB.save(); UI.toast('已保存');
      this.render(document.getElementById('viewport'));
    }});
  }
};
