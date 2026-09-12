/* 实验规划：任务清单 + 协议模板（勾选型 SOP） */
PAGES.plan = {
  title:'实验规划',
  state:{tab:'task', pj:'全部', showDone:false},

  render(el){
    const st=this.state, d=DB.data;
    el.innerHTML=`
      <div class="page-head"><div><div class="ht">实验规划</div><div class="hs">任务与协议清单</div></div>
        <div class="hact"><button class="btn primary small" id="pl-add">${icon('plus')}添加</button></div></div>
      <div class="chips">
        ${[['task','✅ 任务'],['proto','📖 协议模板']].map(t=>`<button class="chip ${st.tab===t[0]?'on':''}" data-tab="${t[0]}">${t[1]}</button>`).join('')}
      </div>
      <div class="content" id="pl-panel"></div>`;
    el.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{ st.tab=b.dataset.tab; this.render(el); });
    el.querySelector('#pl-add').onclick=()=> st.tab==='task'? this.editTask(): this.editProto();
    const p=el.querySelector('#pl-panel');
    if(st.tab==='task') this.panelTask(p); else this.panelProto(p);
  },

  /* ---------- 任务 ---------- */
  panelTask(p){
    const st=this.state, d=DB.data;
    const open=d.tasks.filter(t=>!t.done), done=d.tasks.filter(t=>t.done);

    const pjFilter = t=>{
      if(st.pj==='全部') return true;
      const pj=d.projects.find(x=>x.name===st.pj);
      return pj? t.projectId===pj.id : true;
    };
    const sorted=open.filter(pjFilter).sort((a,b)=> (a.due||'9999')<(b.due||'9999') ? -1:1);
    const doneList=done.filter(pjFilter).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));

    p.innerHTML=`
      <div class="chips" style="padding:0 0 10px">
        ${['全部',...d.projects.map(x=>x.name)].map(n=>`<button class="chip ${st.pj===n?'on':''}" data-pjf="${escAttr(n)}">${esc(n)}</button>`).join('')}
      </div>
      <div id="task-list">
      ${sorted.length? sorted.map(t=>{
        const pj=d.projects.find(x=>x.id===t.projectId);
        const fd=friendlyDue(t.due);
        return `<div class="rows" style="margin-bottom:10px">
          <div class="row-item">
            <button class="ckx" data-done="${t.id}">${icon('check')}</button>
            <div class="ri-main">
              <div class="ri-t">${esc(t.title)}</div>
              ${pj||t.notes?`<div class="ri-s">${pj?`<span class="dot" style="background:${pj.color}"></span><span>${esc(pj.name)}</span>`:''}<span>${esc(t.notes||'')}</span></div>`:''}
            </div>
            <span class="badge ${fd.cls}">${fd.txt}</span>
            <button class="icon-btn" style="width:32px;height:32px" data-edit="${t.id}">${icon('edit')}</button>
          </div>
        </div>`;}).join('')
      : `<div class="empty">${icon('calendar')}<p>没有进行中的任务</p><span>点右上角「添加」安排实验计划</span></div>`}

      ${doneList.length? `<div class="card-t" style="margin:14px 4px 8px">
        <button class="more" id="tg-done" style="font-size:13.5px">${st.showDone?'▾':'▸'} 已完成（${doneList.length}）</button></div>
        ${st.showDone? doneList.slice(0,20).map(t=>`
          <div class="rows" style="margin-bottom:8px"><div class="row-item done">
            <button class="ckx on" data-done="${t.id}">${icon('check')}</button>
            <div class="ri-main"><div class="ri-t">${esc(t.title)}</div></div>
            <button class="icon-btn" style="width:32px;height:32px" data-edit="${t.id}">${icon('edit')}</button>
          </div></div>`).join(''):''}`:''}
      </div>`;

    p.querySelectorAll('[data-pjf]').forEach(b=>b.onclick=()=>{ st.pj=b.dataset.pjf; this.panelTask(p); });
    const tg=p.querySelector('#tg-done'); if(tg) tg.onclick=()=>{ st.showDone=!st.showDone; this.panelTask(p); };
    p.querySelectorAll('[data-done]').forEach(b=>b.onclick=()=>{
      const t=d.tasks.find(x=>x.id===b.dataset.done);
      t.done=!t.done; DB.save(); this.panelTask(p);
      if(t.done) UI.toast('已完成 🎉');
    });
    p.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>this.editTask(b.dataset.edit));
  },

  editTask(id){
    const d=DB.data;
    const t=id? d.tasks.find(x=>x.id===id) : {title:'',projectId:'',due:'',notes:''};
    UI.formSheet({title:id?'编辑任务':'新任务', submit:'保存', fields:[
      {k:'title',l:'任务内容',value:t.title,req:1,ph:'如 转化 pUC19 到 DH5α'},
      {k:'projectId',l:'所属项目',t:'select',o:['',...d.projects.map(x=>x.name)],value:(d.projects.find(x=>x.id===t.projectId)||{}).name||''},
      {k:'due',l:'截止日期',t:'date',value:t.due},
      {k:'notes',l:'备注',value:t.notes},
    ], onSubmit:v=>{
      if(!v.title){ UI.toast('请填写任务内容','err'); return; }
      const pj=d.projects.find(x=>x.name===v.projectId);
      const obj={ title:v.title, projectId:pj?pj.id:null, due:v.due, notes:v.notes };
      if(id) Object.assign(d.tasks.find(x=>x.id===id), obj);
      else d.tasks.push({id:uid(), done:false, createdAt:Date.now(), ...obj});
      DB.save(); UI.toast('已保存');
      this.render(document.getElementById('viewport'));
    }});
  },

  /* ---------- 协议模板 ---------- */
  panelProto(p){
    const d=DB.data;
    p.innerHTML = d.protocols.length? d.protocols.map(pr=>{
      const doneN=(pr.checks||[]).filter(Boolean).length;
      const pct=pr.steps.length? Math.round(doneN/pr.steps.length*100):0;
      return `<div class="card">
        <div class="card-t">
          <h3>${icon('book')}${esc(pr.title)}</h3>
          <div style="display:flex;gap:6px">
            <button class="icon-btn" style="width:32px;height:32px" data-ped="${pr.id}">${icon('edit')}</button>
            <button class="icon-btn" style="width:32px;height:32px" data-pdel="${pr.id}">${icon('trash')}</button>
          </div>
        </div>
        <div class="pbar" style="margin-bottom:12px"><i style="width:${pct}%"></i></div>
        <div style="font-size:12.5px;color:var(--text-3);margin-bottom:8px">${doneN}/${pr.steps.length} 步 · ${pct}%</div>
        ${pr.steps.map((s,i)=>`
          <div class="row-item" style="padding:10px 2px;border-bottom:1px dashed var(--border)">
            <button class="ckx ${(pr.checks||[])[i]?'on':''}" data-ck="${pr.id}:${i}">${icon('check')}</button>
            <div class="ri-main"><div class="ri-t" style="font-weight:500;white-space:normal;font-size:14px">${esc(s)}</div></div>
          </div>`).join('')}
        <div class="frow" style="margin-top:12px">
          <button class="btn plain small" data-reset="${pr.id}">${icon('refresh')}重置勾选</button>
          <button class="btn ghost small" data-tonb="${pr.id}">${icon('book')}转为实验记录</button>
        </div>
      </div>`;}).join('')
    : `<div class="empty">${icon('book')}<p>还没有协议模板</p><span>把常用 SOP 存成步骤清单，实验时逐项打勾</span></div>`;

    p.querySelectorAll('[data-ck]').forEach(b=>b.onclick=()=>{
      const [id,i]=b.dataset.ck.split(':');
      const pr=d.protocols.find(x=>x.id===id);
      pr.checks=pr.checks||[]; pr.checks[+i]=!pr.checks[+i];
      DB.save(); this.panelProto(p);
    });
    p.querySelectorAll('[data-reset]').forEach(b=>b.onclick=()=>{
      const pr=d.protocols.find(x=>x.id===b.dataset.reset);
      pr.checks=[]; DB.save(); this.panelProto(p);
    });
    p.querySelectorAll('[data-ped]').forEach(b=>b.onclick=()=>this.editProto(b.dataset.ped));
    p.querySelectorAll('[data-pdel]').forEach(b=>b.onclick=async ()=>{
      if(await UI.confirm('删除协议','该协议模板将被删除。',{danger:true,okText:'删除'})){
        d.protocols=d.protocols.filter(x=>x.id!==b.dataset.pdel);
        DB.save(); this.panelProto(p); UI.toast('已删除');
      }
    });
    p.querySelectorAll('[data-tonb]').forEach(b=>b.onclick=()=>{
      const pr=d.protocols.find(x=>x.id===b.dataset.tonb);
      const stepsText=pr.steps.map((s,i)=>`${i+1}. ${s}`).join('\n');
      const en={ id:uid(), type:'general', title:pr.title, date:todayStr(), projectId:null,
        notes:`【协议步骤】\n${stepsText}\n\n【实验记录】\n`, fields:{}, photos:[], createdAt:Date.now(), updatedAt:Date.now() };
      d.entries.push(en); DB.save();
      UI.toast('已创建记录（未勾选状态）'); go(`nbform/${en.id}`);
    });
  },

  editProto(id){
    const d=DB.data;
    const pr=id? d.protocols.find(x=>x.id===id) : {title:'',steps:[]};
    const { close, root }=UI.sheet(`
      <div class="sh-head"><h3>${id?'编辑协议':'新协议模板'}</h3><button class="icon-btn" data-close>${icon('x')}</button></div>
      <div class="sh-body">
        <div class="fld"><span>协议名称</span><div class="ctl"><input id="pf-t" value="${escAttr(pr.title)}" placeholder="如 大肠杆菌化学转化"></div></div>
        <div class="fld"><span>步骤</span><div id="pf-steps"></div>
          <button class="btn plain small" id="pf-add" style="margin-top:8px">${icon('plus')}添加步骤</button></div>
      </div>
      <div class="sh-foot"><button class="btn primary block" id="pf-save">保存</button></div>`);
    const box=root.querySelector('#pf-steps');
    const addStep=v=>{
      const div=document.createElement('div');
      div.className='frow'; div.style.marginBottom='8px';
      div.innerHTML=`<div class="ctl"><input placeholder="步骤内容" value="${escAttr(v||'')}"></div>
        <button class="icon-btn" style="width:34px;height:34px">${icon('trash')}</button>`;
      div.querySelector('.icon-btn').onclick=()=>div.remove();
      box.appendChild(div);
    };
    (pr.steps||[]).forEach(addStep);
    if(!(pr.steps||[]).length) addStep('');
    root.querySelector('#pf-add').onclick=()=>addStep('');
    root.querySelector('#pf-save').onclick=()=>{
      const title=root.querySelector('#pf-t').value.trim();
      const steps=[...box.querySelectorAll('input')].map(i=>i.value.trim()).filter(Boolean);
      if(!title||!steps.length){ UI.toast('请填写名称和至少一个步骤','err'); return; }
      if(id){ const pr2=d.protocols.find(x=>x.id===id); pr2.title=title; pr2.steps=steps; pr2.checks=[]; }
      else d.protocols.push({id:uid(), title, steps, checks:[], createdAt:Date.now()});
      DB.save(); close(); UI.toast('已保存');
      this.render(document.getElementById('viewport'));
    };
  }
};
