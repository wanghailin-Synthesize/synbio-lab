/* 溶液配制：计算器（摩尔/质量/稀释/系列稀释/母液X倍）+ 配方库 + 抗生素表 */
PAGES.solution = {
  title:'溶液配制',
  state:{tab:'calc', tool:'molar', cat:'全部', q:'', vol:{}, recipeQ:''},

  CATS:['全部','培养基','缓冲液','电泳','常用母液','RNA 专用'],

  render(el){
    const st=this.state;
    el.innerHTML=`
      <div class="page-head"><div><div class="ht">溶液配制</div><div class="hs">称多少、加多少，一算便知</div></div></div>
      <div class="chips">
        ${[['calc','🧮 计算器'],['recipe','📋 配方库'],['ab','💊 抗生素表']].map(t=>`
          <button class="chip ${st.tab===t[0]?'on':''}" data-tab="${t[0]}">${t[1]}</button>`).join('')}
      </div>
      <div class="content" id="sol-panel"></div>`;
    el.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{ st.tab=b.dataset.tab; this.render(el); });
    const p=el.querySelector('#sol-panel');
    if(st.tab==='calc') this.panelCalc(p);
    else if(st.tab==='recipe') this.panelRecipe(p);
    else this.panelAB(p);
  },

  /* ============ 计算器 ============ */
  panelCalc(p){
    const st=this.state;
    p.innerHTML=`
      <div class="chips" style="padding:0 0 10px">
        ${[['molar','摩尔配制'],['mass','质量浓度'],['dil','溶液稀释'],['serial','系列稀释'],['stock','母液 X 倍']].map(t=>`
          <button class="chip ${st.tool===t[0]?'on':''}" data-tool="${t[0]}">${t[1]}</button>`).join('')}
      </div>
      <div id="sol-tool"></div>`;
    p.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{ st.tool=b.dataset.tool; this.panelCalc(p); });
    const box=p.querySelector('#sol-tool');
    ({molar:()=>this.tMolar(box), mass:()=>this.tMass(box), dil:()=>this.tDil(box),
      serial:()=>this.tSerial(box), stock:()=>this.tStock(box)})[st.tool]();
  },

  bind(sel, box, fn){
    sel.split(',').forEach(s=>box.querySelectorAll(s).forEach(inp=>{
      inp.addEventListener('input',fn); inp.addEventListener('change',fn);
    }));
    fn();
  },

  /* 摩尔浓度配制 */
  tMolar(box){
    box.innerHTML=`
      <div class="card">
        <div class="fld"><span>试剂名称（选填）</span><div class="ctl"><input id="m-name" placeholder="如 Tris-HCl"></div></div>
        <div class="frow">
          <div class="fld"><span>目标浓度</span><div class="ctl"><input id="m-c" type="number" inputmode="decimal" placeholder="如 100"><select id="m-cu" style="padding-left:8px"><option>mM</option><option value="M">M</option><option>µM</option></select></div></div>
          <div class="fld"><span>配制体积</span><div class="ctl"><input id="m-v" type="number" inputmode="decimal" placeholder="如 500"><select id="m-vu" style="padding-left:8px"><option>mL</option><option value="L">L</option><option>µL</option></select></div></div>
        </div>
        <div class="fld"><span>分子量 MW</span><div class="ctl"><input id="m-mw" type="number" inputmode="decimal" placeholder="查试剂瓶标，如 121.14"><span class="u">g/mol</span></div></div>
        <div id="m-out"></div>
      </div>
      <div class="info-note">${icon('info')}<span>常用 MW：Tris base 121.14 · NaCl 58.44 · 葡萄糖 180.16 · EDTA·2Na 372.24 · NaOH 40.00</span></div>`;
    const calc=()=>{
      const c=getNum('#m-c'), cu=document.querySelector('#m-cu').value;
      const v=getNum('#m-v'), vu=document.querySelector('#m-vu').value;
      const mw=getNum('#m-mw');
      const out=box.querySelector('#m-out');
      if(isNaN(c)||isNaN(v)||isNaN(mw)||mw<=0){ out.innerHTML=''; return; }
      const molL = c*{ 'mM':1e-3, 'M':1, 'µM':1e-6 }[cu];
      const L = v*{ 'mL':1e-3, 'L':1, 'µL':1e-6 }[vu];
      const mol = molL*L, g = mol*mw;
      const m = smartUnit(g,'g');
      const name=box.querySelector('#m-name').value.trim()||'试剂';
      out.innerHTML=resultCard({label:`需称量 ${esc(name)}`, value:m.v, unit:m.u,
        extra:`即 ${fmtN(mol,4)} mol 溶于 ${fmtN(L*1000)} mL。先加约 2/3 体积水溶解，调 pH 后定容至刻度。`,
        copyText:`称取 ${m.v} ${m.u} ${name}，定容至 ${fmtN(L*1000)} mL`});
    };
    this.bind('#m-c,#m-cu,#m-v,#m-vu,#m-mw,#m-name', box, calc);
  },

  /* 质量浓度配制 */
  tMass(box){
    box.innerHTML=`
      <div class="card">
        <div class="frow">
          <div class="fld"><span>目标浓度</span><div class="ctl"><input id="q-c" type="number" inputmode="decimal" placeholder="如 10"><select id="q-cu" style="padding-left:8px"><option>% (w/v)</option><option>mg/mL</option><option>g/L</option></select></div></div>
          <div class="fld"><span>体积</span><div class="ctl"><input id="q-v" type="number" inputmode="decimal" placeholder="如 500"><select id="q-vu" style="padding-left:8px"><option>mL</option><option value="L">L</option><option>µL</option></select></div></div>
        </div>
        <div id="q-out"></div>
      </div>
      <div class="info-note">${icon('info')}<span>% (w/v) = g/100mL：10% SDS 即 100 mL 水中溶 10 g。</span></div>`;
    const calc=()=>{
      const c=getNum('#q-c'), cu=document.querySelector('#q-cu').value;
      const v=getNum('#q-v'), vu=document.querySelector('#q-vu').value;
      const out=box.querySelector('#q-out');
      if(isNaN(c)||isNaN(v)){ out.innerHTML=''; return; }
      const gL = c*{ '% (w/v)':10, 'mg/mL':1, 'g/L':1 }[cu];
      const L = v*{ 'mL':1e-3, 'L':1, 'µL':1e-6 }[vu];
      const g = gL*L, m=smartUnit(g,'g');
      out.innerHTML=resultCard({label:'需称量', value:m.v, unit:m.u,
        extra:`终浓度 ${fmtN(gL)} g/L。定容至 ${fmtN(L*1000)} mL。`,
        copyText:`称取 ${m.v} ${m.u}，定容至 ${fmtN(L*1000)} mL`});
    };
    this.bind('#q-c,#q-cu,#q-v,#q-vu', box, calc);
  },

  /* 稀释 C1V1=C2V2 —— 留空一项求该项 */
  tDil(box){
    box.innerHTML=`
      <div class="card">
        <div class="frow">
          <div class="fld"><span>母液浓度 C1</span><div class="ctl"><input id="x-c1" type="number" inputmode="decimal" placeholder="留空求此"><select id="x-c1u" style="padding-left:8px"></select></div></div>
          <div class="fld"><span>母液体积 V1</span><div class="ctl"><input id="x-v1" type="number" inputmode="decimal" placeholder="留空求此"><select id="x-v1u" style="padding-left:8px"></select></div></div>
        </div>
        <div class="frow">
          <div class="fld"><span>目标浓度 C2</span><div class="ctl"><input id="x-c2" type="number" inputmode="decimal" placeholder="如 1"></div></div>
          <div class="fld"><span>目标体积 V2</span><div class="ctl"><input id="x-v2" type="number" inputmode="decimal" placeholder="如 1000"></div></div>
        </div>
        <div id="x-out"></div>
      </div>
      <div class="info-note">${icon('info')}<span>浓度单位须 C1/C2 一致，体积单位 V1/V2 一致。任意填三项，留空一项求解。</span></div>`;
    const cu=document.querySelector('#x-c1u'), vu=document.querySelector('#x-v1u');
    cu.innerHTML=['mM','M','µM','mg/mL','% (w/v)','×(倍)'].map(u=>`<option>${u}</option>`).join('');
    vu.innerHTML=['mL','L','µL'].map(u=>`<option>${u}</option>`).join('');
    const calc=()=>{
      const c1=getNum('#x-c1'), v1=getNum('#x-v1'), c2=getNum('#x-c2'), v2=getNum('#x-v2');
      const miss=[['#x-c1',c1],['#x-v1',v1],['#x-c2',c2],['#x-v2',v2]].filter(x=>isNaN(x[1]));
      const out=box.querySelector('#x-out');
      if(miss.length!==1){ out.innerHTML = miss.length? `<div class="info-note" style="margin:0">${icon('info')}<span>填任意三项，留空一项自动求解（当前空了 ${miss.length} 项）。</span></div>`:''; return; }
      const [sel]=miss[0]; let r, label;
      if(sel==='#x-c1'){ r=(v1*v2)/c2; label='所需母液浓度 C1'; }
      else if(sel==='#x-v1'){ r=c2*v2/c1; label='所需母液体积 V1'; }
      else if(sel==='#x-c2'){ r=c1*v1/v2; label='得到的目标浓度 C2'; }
      else { r=c1*v1/c2; label='可配制体积 V2'; }
      const u = (sel==='#x-c1'||sel==='#x-c2') ? cu.value : vu.value;
      out.innerHTML=resultCard({label, value:fmtN(r), unit:u,
        extra: sel==='#x-v1' ? `取母液 ${fmtN(r)} ${u}，加稀释液 ${fmtN(v2-r)} ${u} 补足。`:'',
        copyText:`${label} = ${fmtN(r)} ${u}`});
    };
    this.bind('#x-c1,#x-v1,#x-c2,#x-v2,#x-c1u,#x-v1u', box, calc);
  },

  /* 系列稀释 */
  tSerial(box){
    box.innerHTML=`
      <div class="card">
        <div class="frow">
          <div class="fld"><span>起始浓度 C0</span><div class="ctl"><input id="s-c0" type="number" inputmode="decimal" placeholder="如 1000"><select id="s-cu" style="padding-left:8px"><option>µM</option><option>mM</option><option>ng/µL</option><option>×(倍)</option></select></div></div>
          <div class="fld"><span>每级稀释倍数 f</span><div class="ctl"><input id="s-f" type="number" inputmode="decimal" value="10"></div></div>
        </div>
        <div class="frow">
          <div class="fld"><span>梯度管数</span><div class="ctl"><input id="s-n" type="number" inputmode="numeric" value="6"></div></div>
          <div class="fld"><span>每管终体积</span><div class="ctl"><input id="s-v" type="number" inputmode="decimal" value="1000"><select id="s-vu" style="padding-left:8px"><option>µL</option><option>mL</option></select></div></div>
        </div>
        <div id="s-out"></div>
      </div>`;
    const calc=()=>{
      const c0=getNum('#s-c0'), f=getNum('#s-f'), n=getNum('#s-n'), v=getNum('#s-v'), vu=document.querySelector('#s-vu').value, cu=document.querySelector('#s-cu').value;
      const out=box.querySelector('#s-out');
      if(isNaN(c0)||isNaN(f)||f<=1||isNaN(n)||n<1||n>24||isNaN(v)){ out.innerHTML=''; return; }
      const x=v/f; /* 每管从上一管取 v/f，补稀释液 v−v/f */
      const rows=[];
      for(let i=0;i<n;i++){
        const c=c0/Math.pow(f,i);
        rows.push(`<tr><td class="num">${i+1} 号管</td><td class="num" style="font-weight:700;color:var(--primary)">${i===0?fmtN(c):fmtN(c,3)} ${cu}</td><td class="num">${i===0?'—（起始浓度）':`取上一管 ${fmtN(x,3)} + 稀释液 ${fmtN(v-x,3)}`}</td></tr>`);
      }
      out.innerHTML=`<div class="result-card"><div class="rl">${icon('list')}<span>系列稀释方案（每管终体积 ${fmtN(v)} ${vu}）</span></div></div>
        <div class="tbl-wrap"><table class="tbl"><tr><th>管号</th><th>终浓度</th><th>操作</th></tr>${rows.join('')}</table></div>
        <div class="info-note">${icon('info')}<span>1 号管可先由母液配制：取母液 ${fmtN(v/f,3)} ${vu} + 稀释液 ${fmtN(v-v/f,3)} ${vu}。</span></div>`;
    };
    this.bind('#s-c0,#s-f,#s-n,#s-v,#s-vu,#s-cu', box, calc);
  },

  /* 母液 X 倍稀释 */
  tStock(box){
    box.innerHTML=`
      <div class="card">
        <div class="frow">
          <div class="fld"><span>母液倍数</span><div class="ctl"><input id="k-s" type="number" inputmode="decimal" value="50"><span class="u">×</span></div></div>
          <div class="fld"><span>目标倍数</span><div class="ctl"><input id="k-t" type="number" inputmode="decimal" value="1"><span class="u">×</span></div></div>
        </div>
        <div class="fld"><span>目标体积</span><div class="ctl"><input id="k-v" type="number" inputmode="decimal" value="1000"><select id="k-vu" style="padding-left:8px"><option>mL</option><option value="L">L</option><option>µL</option></select></div></div>
        <div id="k-out"></div>
      </div>
      <div class="info-note">${icon('info')}<span>如 50× TAE 配 1× 工作液、10× 载样缓冲液配 1×。</span></div>`;
    const calc=()=>{
      const s=getNum('#k-s'), t=getNum('#k-t'), v=getNum('#k-v'), vu=document.querySelector('#k-vu').value;
      const out=box.querySelector('#k-out');
      if(isNaN(s)||isNaN(t)||isNaN(v)||s<=0||t<=0||t>s){ out.innerHTML = (t>s)? `<div class="warn-note">${icon('alert')}<span>目标倍数应低于母液倍数（稀释）。</span></div>`:''; return; }
      const take=v*t/s;
      out.innerHTML=resultCard({label:'取母液', value:fmtN(take), unit:vu,
        extra:`加稀释液 ${fmtN(v-take)} ${vu} 补至 ${fmtN(v)} ${vu}，混匀。`,
        copyText:`取母液 ${fmtN(take)} ${vu} + 稀释液补至 ${fmtN(v)} ${vu}`});
    };
    this.bind('#k-s,#k-t,#k-v,#k-vu', box, calc);
  },

  /* ============ 配方库 ============ */
  allRecipes(){ return [...RECIPES, ...DB.data.customRecipes]; },

  panelRecipe(p){
    const st=this.state;
    const cats=['全部',...this.CATS.slice(1)];
    p.innerHTML=`
      <div class="search">${icon('search')}<input id="rq" placeholder="搜索配方…" value="${escAttr(st.recipeQ)}"></div>
      <div class="chips" style="padding:0 0 10px">
        ${cats.map(c=>`<button class="chip ${st.cat===c?'on':''}" data-rc="${c}">${c}</button>`).join('')}
        <button class="chip" style="color:var(--primary)" data-addrec>＋ 自定义</button>
      </div>
      <div id="rc-list"></div>`;
    p.querySelectorAll('[data-rc]').forEach(b=>b.onclick=()=>{ st.cat=b.dataset.rc; this.panelRecipe(p); });
    p.querySelector('[data-addrec]').onclick=()=>this.editRecipe(null, ()=>this.panelRecipe(p));
    p.querySelector('#rq').oninput=e=>{ st.recipeQ=e.target.value; this.renderList(p.querySelector('#rc-list')); };
    this.renderList(p.querySelector('#rc-list'));
  },

  renderList(list){
    const st=this.state;
    let items=this.allRecipes();
    if(st.cat!=='全部') items=items.filter(r=>r.cat===st.cat);
    if(st.recipeQ) items=items.filter(r=>(r.name+r.cat+(r.items||[]).map(i=>i.n).join('')).toLowerCase().includes(st.recipeQ.toLowerCase()));
    if(!items.length){ list.innerHTML=`<div class="empty">${icon('flask')}<p>没有找到配方</p><span>换个关键词，或点「＋ 自定义」添加</span></div>`; return; }
    list.innerHTML=items.map(r=>{
      const vol = st.vol[r.id] || 1000;
      const sc = vol/(r.base||1000);
      const isCustom = !!DB.data.customRecipes.find(x=>x.id===r.id);
      return `<div class="recipe" data-rid="${r.id}">
        <div class="rc-head"><div><h4>${esc(r.name)}</h4><div class="rc-cat"><span class="badge blue">${esc(r.cat)}</span> ${isCustom?'<span class="badge teal">自定义</span>':''}</div></div></div>
        <div class="rc-body">
          <div class="rc-vol"><span class="lb">配制体积</span>
            <select data-vol="${r.id}">${[100,250,500,1000].map(v=>`<option value="${v}" ${v===vol?'selected':''}>${v} mL</option>`).join('')}</select>
          </div>
          <ul class="ing">${(r.items||[]).map(i=>{ const a=fmtAmt((i.a||0)*sc, i.u); return `<li><span>${esc(i.n)}</span><span class="amt">${a.v} ${a.u}</span></li>`; }).join('')}</ul>
          ${r.steps?`<div class="rc-steps"><b>步骤</b>　${esc(r.steps)}</div>`:''}
          ${r.note?`<div class="rc-note">${esc(r.note)}</div>`:''}
          ${isCustom?`<div class="frow" style="margin-top:10px">
            <button class="btn ghost small" data-editrec="${r.id}">${icon('edit')}编辑</button>
            <button class="btn danger small" data-delrec="${r.id}">${icon('trash')}删除</button></div>`:''}
        </div>
      </div>`;
    }).join('');

    list.querySelectorAll('[data-vol]').forEach(s=>{
      s.onchange=()=>{ st.vol[s.dataset.vol]=+s.value; this.renderList(list); };
    });
    list.querySelectorAll('[data-editrec]').forEach(b=>b.onclick=()=>{
      this.editRecipe(b.dataset.editrec, ()=>this.renderList(list));
    });
    list.querySelectorAll('[data-delrec]').forEach(b=>b.onclick=async ()=>{
      if(await UI.confirm('删除配方','该自定义配方将被删除，不可恢复。',{danger:true,okText:'删除'})){
        DB.data.customRecipes = DB.data.customRecipes.filter(x=>x.id!==b.dataset.delrec);
        DB.save(); this.renderList(list); UI.toast('已删除');
      }
    });
  },

  /* 自定义配方编辑（含动态用量行） */
  editRecipe(id, done){
    const r = id? DB.data.customRecipes.find(x=>x.id===id) : {name:'',cat:'培养基',base:1000,items:[{n:'',a:'',u:'g'}],steps:'',note:''};
    const { close, root } = UI.sheet(`
      <div class="sh-head"><h3>${id?'编辑配方':'自定义配方'}</h3><button class="icon-btn" data-close>${icon('x')}</button></div>
      <div class="sh-body">
        <div class="fld"><span>名称</span><div class="ctl"><input id="rf-n" value="${escAttr(r.name)}" placeholder="配方名称"></div></div>
        <div class="frow">
          <div class="fld"><span>分类</span><div class="ctl"><select id="rf-c">${this.CATS.slice(1).map(c=>`<option ${c===r.cat?'selected':''}>${c}</option>`).join('')}</select></div></div>
          <div class="fld"><span>基准体积</span><div class="ctl"><input id="rf-b" type="number" inputmode="decimal" value="${r.base||1000}"><span class="u">mL</span></div></div>
        </div>
        <div class="fld"><span>组分（按基准体积计）</span><div id="rf-items"></div>
          <button class="btn plain small" id="rf-add" style="margin-top:8px">${icon('plus')}添加组分</button></div>
        <div class="fld"><span>步骤</span><div class="ctl"><textarea id="rf-st" rows="3" placeholder="溶解、调 pH、灭菌…">${esc(r.steps||'')}</textarea></div></div>
        <div class="fld"><span>备注</span><div class="ctl"><textarea id="rf-no" rows="2">${esc(r.note||'')}</textarea></div></div>
      </div>
      <div class="sh-foot"><button class="btn primary block" id="rf-save">保存</button></div>`);

    const itemsBox = root.querySelector('#rf-items');
    const addItem = it=>{
      const div=document.createElement('div');
      div.className='frow'; div.style.marginBottom='8px';
      div.innerHTML=`<div class="ctl" style="flex:2"><input placeholder="组分名" value="${escAttr(it.n||'')}"></div>
        <div class="ctl"><input type="number" inputmode="decimal" placeholder="量" value="${it.a??''}"></div>
        <div class="ctl" style="flex:.8"><select>${['g','mg','mL','µL'].map(u=>`<option ${u===(it.u||'g')?'selected':''}>${u}</option>`).join('')}</select></div>
        <button class="icon-btn" style="width:34px;height:34px">${icon('trash')}</button>`;
      div.querySelector('.icon-btn').onclick=()=>div.remove();
      itemsBox.appendChild(div);
    };
    (r.items||[]).forEach(addItem);
    if(!(r.items||[]).length) addItem({n:'',a:'',u:'g'});
    root.querySelector('#rf-add').onclick=()=>addItem({n:'',a:'',u:'g'});

    root.querySelector('#rf-save').onclick=()=>{
      const name=root.querySelector('#rf-n').value.trim();
      if(!name){ UI.toast('请填写配方名称','err'); return; }
      const items=[...itemsBox.querySelectorAll('.frow')].map(div=>{
        const [n,a,,u]=div.querySelectorAll('input,select');
        return {n:n.value.trim(), a:parseFloat(a.value)||0, u:u.value};
      }).filter(i=>i.n);
      const obj={
        id: id||uid(), name, cat:root.querySelector('#rf-c').value,
        base: parseFloat(root.querySelector('#rf-b').value)||1000,
        items, steps:root.querySelector('#rf-st').value.trim(), note:root.querySelector('#rf-no').value.trim()
      };
      if(id){ DB.data.customRecipes=DB.data.customRecipes.map(x=>x.id===id?obj:x); }
      else DB.data.customRecipes.push(obj);
      DB.save(); close(); UI.toast('已保存'); done&&done();
    };
  },

  /* ============ 抗生素表 ============ */
  panelAB(p){
    p.innerHTML=`
      <div class="search">${icon('search')}<input id="abq" placeholder="搜索抗生素…"></div>
      <div id="ab-list"></div>
      <div class="info-note">${icon('info')}<span>母液建议分装冻存、避免反复冻融；工作浓度因菌株与质粒而异，此表为常用参考值。</span></div>`;
    const render=q=>{
      const items=ANTIBIOTICS.filter(a=>!q || (a.n+a.w+a.note).toLowerCase().includes(q.toLowerCase()));
      document.getElementById('ab-list').innerHTML = items.length? `
        <div class="tbl-wrap"><table class="tbl">
          <tr><th>抗生素</th><th>工作浓度</th><th>母液</th><th>溶剂 / 保存</th></tr>
          ${items.map(a=>`<tr>
            <td style="font-weight:650">${esc(a.n)}${a.note?`<div style="font-size:11.5px;color:var(--text-3);margin-top:2px">${esc(a.note)}</div>`:''}</td>
            <td style="font-weight:700;color:var(--primary);white-space:nowrap">${esc(a.w)}</td>
            <td style="white-space:nowrap">${esc(a.s)}</td>
            <td style="font-size:12.5px">${esc(a.v)} · ${esc(a.st)}</td>
          </tr>`).join('')}
        </table></div>`
        : `<div class="empty">${icon('search')}<p>未找到</p></div>`;
    };
    p.querySelector('#abq').oninput=e=>render(e.target.value);
    render('');
  }
};
