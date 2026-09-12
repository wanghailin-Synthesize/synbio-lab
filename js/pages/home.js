/* 首页：概览 + 快捷入口 + 今日任务 + 计时器 + 过期提醒 */
PAGES.home = {
  title:'',
  render(el){
    const d = DB.data;
    const t = new Date();
    const dateStr = dateCN(todayStr());

    const openTasks = d.tasks.filter(x=>!x.done);
    const dueToday = openTasks.filter(x=>x.due && friendlyDue(x.due).cls!=='gray' && x.due<=todayStr());
    const activeTimers = d.timers.filter(x=>x.running || x.alarm);
    const warnItems = d.inventory.filter(x=>{
      const st=expiryState(x.expiry); return st.cls==='red'||st.cls==='orange';
    }).sort((a,b)=>(a.expiry||'9999')<(b.expiry||'9999')?'-1':1).slice(0,3);
    const recent = [...d.entries].sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)).slice(0,3);

    const needGuide = isIOS() && !isStandalone() && !d.flags.iosGuide;

    el.innerHTML = `
      <div class="page-head"><div>
        <div class="ht">${esc(d.settings.labName)}</div>
        <div class="hs">实验助手 · 记录好每一步</div>
      </div></div>
      <div class="content">

        ${needGuide?`
        <div class="guide-banner">
          <div class="gi">${icon('phone')}</div>
          <div class="gt"><b>添加到主屏幕</b><span>像 App 一样全屏使用，数据更安全</span></div>
          <button class="gb" data-guide>去安装</button>
        </div>`:''}

        <div class="hero">
          <div class="date-chip">${dateStr}</div>
          <div class="lab">${t.getHours()<6?'夜深了，注意休息':t.getHours()<12?'早上好':t.getHours()<18?'下午好':'晚上好'} 👋</div>
          <div class="sub">今天也要顺利出结果</div>
          <div class="deco">${icon('flask')}</div>
          <div class="stat-row">
            <div class="stat" data-go="plan"><b class="num">${openTasks.length}</b><span>进行中任务</span></div>
            <div class="stat" data-go="notebook"><b class="num">${d.entries.length}</b><span>实验记录</span></div>
            <div class="stat" data-go="inventory"><b class="num">${warnItems.length?warnItems.length:'0'}</b><span>试剂提醒</span></div>
          </div>
        </div>

        <div class="grid4">
          ${[
            ['新建记录','book','c1','nbform'],
            ['配制计算','flask','c2','solution'],
            ['单位换算','calc','c3','convert'],
            ['计时器','timer','c4','timers'],
            ['实验规划','calendar','c5','plan'],
            ['工具箱','wrench','c6','tools'],
            ['库存管理','box','c7','inventory'],
            ['设置','sliders','c8','settings'],
          ].map(q=>`
            <button class="quick" data-go="${q[3]}"><div class="qi ${q[2]}">${icon(q[1])}</div><span>${q[0]}</span></button>`).join('')}
        </div>

        <div class="sec-gap"></div>

        ${dueToday.length?`
        <div class="card anim-1">
          <div class="card-t"><h3>${icon('calendar')}今日 / 待办</h3><button class="more" data-go="plan">全部 ${icon('chevR')}</button></div>
          ${dueToday.slice(0,4).map(tk=>{
            const fd=friendlyDue(tk.due);
            return `<div class="row-item" style="padding:11px 4px" data-go="plan">
              <button class="ckx" data-task="${tk.id}">${icon('check')}</button>
              <div class="ri-main"><div class="ri-t">${esc(tk.title)}</div></div>
              <span class="badge ${fd.cls}">${fd.txt}</span>
            </div>`;}).join('')}
        </div>`:''}

        ${activeTimers.length?`
        <div class="card anim-2">
          <div class="card-t"><h3>${icon('timer')}运行中的计时器</h3><button class="more" data-go="timers">管理 ${icon('chevR')}</button></div>
          ${activeTimers.slice(0,3).map(tm=>{
            const left = tm.running ? Math.max(0,(tm.endAt-Date.now())/1000) : tm.remain||0;
            return `<div class="row-item" style="padding:11px 4px" data-go="timers">
              <div class="avatar-ic" style="background:var(--primary-soft);color:var(--primary)">${icon('timer')}</div>
              <div class="ri-main"><div class="ri-t">${esc(tm.name||'计时器')}</div></div>
              <b class="num" style="color:${tm.alarm?'var(--red)':'var(--primary)'}">${tm.alarm?'完成!':mmss(left)}</b>
            </div>`;}).join('')}
        </div>`:''}

        ${warnItems.length?`
        <div class="card anim-2">
          <div class="card-t"><h3>${icon('alert')}试剂效期提醒</h3><button class="more" data-go="inventory">全部 ${icon('chevR')}</button></div>
          ${warnItems.map(it=>{
            const st=expiryState(it.expiry);
            return `<div class="row-item" style="padding:11px 4px" data-go="inventory">
              <div class="avatar-ic" style="background:var(--${st.cls==='red'?'red':'orange'}-soft);color:var(--${st.cls==='red'?'red':'orange'})">${icon('box')}</div>
              <div class="ri-main"><div class="ri-t">${esc(it.name)}</div><div class="ri-s">${esc(it.loc||'未填位置')}</div></div>
              <span class="badge ${st.cls}">${st.txt}</span>
            </div>`;}).join('')}
        </div>`:''}

        <div class="card anim-3">
          <div class="card-t"><h3>${icon('book')}最近记录</h3><button class="more" data-go="notebook">全部 ${icon('chevR')}</button></div>
          ${recent.length? recent.map(en=>{
            const tp=TEMPLATES[en.type]||TEMPLATES.general;
            const pj=d.projects.find(p=>p.id===en.projectId);
            return `<div class="row-item" style="padding:11px 4px" data-go="nbview/${en.id}">
              <div class="avatar-ic" style="background:var(--surface-2);color:var(--text-2)">${icon(tp.ic||'edit')}</div>
              <div class="ri-main">
                <div class="ri-t">${esc(en.title||tp.name)}</div>
                <div class="ri-s">${pj?`<span class="dot" style="background:${pj.color}"></span>${esc(pj.name)}`:''}<span>${esc(en.date||'')}</span></div>
              </div>${icon('chevR')}</div>`;}).join('')
          : `<div class="empty" style="padding:26px">${icon('book')}<p>还没有实验记录</p><span>点上方「新建记录」开始吧</span></div>`}
        </div>
      </div>`;

    /* 绑定 */
    const gb=el.querySelector('[data-guide]'); if(gb) gb.onclick=showInstallGuide;
    el.querySelectorAll('[data-task]').forEach(b=>{
      b.onclick=e=>{
        e.stopPropagation();
        const tk=DB.data.tasks.find(x=>x.id===b.dataset.task);
        if(tk){ tk.done=true; DB.save(); UI.toast('已完成，可到「实验规划」查看'); b.classList.add('on'); }
      };
    });
  }
};
