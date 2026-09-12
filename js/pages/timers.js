/* 计时器：多路倒计时 + 秒表，闹铃（声音+震动），刷新不丢 */
PAGES.timers = {
  title:'计时器',
  _tick:null,
  _stopwatch:{running:false, base:0, startedAt:0},

  PRESETS:[[0.5,'30秒'],[1,'1分钟'],[3,'3分钟'],[5,'5分钟'],[10,'10分钟'],[15,'15分钟'],[30,'30分钟'],[60,'1小时'],[240,'4小时'],[960,'过夜16h']],

  render(el){
    el.innerHTML=`
      <div class="page-head"><div><div class="ht">计时器</div><div class="hs">多路并行 · 离开页面继续计时</div></div></div>
      <div class="content">
        <div class="card">
          <div class="card-t"><h3>${icon('plus')}新建倒计时</h3></div>
          <div class="frow">
            <div class="fld" style="flex:2"><span>名称</span><div class="ctl"><input id="tm-name" placeholder="如 37℃ 孵育"></div></div>
            <div class="fld"><span>分钟</span><div class="ctl"><input id="tm-min" type="number" inputmode="numeric" placeholder="0"></div></div>
            <div class="fld"><span>秒</span><div class="ctl"><input id="tm-sec" type="number" inputmode="numeric" placeholder="0"></div></div>
          </div>
          <button class="btn primary block" id="tm-add">${icon('play')}开始计时</button>
          <div class="chips" style="padding:10px 0 0" id="tm-presets">
            ${this.PRESETS.map(p=>`<button class="chip" data-min="${p[0]}">${p[1]}</button>`).join('')}
          </div>
        </div>

        <div id="tm-list"></div>

        <div class="card" id="tm-sw">
          <div class="card-t"><h3>${icon('clock')}秒表</h3></div>
          <div style="text-align:center;font-size:42px;font-weight:800;letter-spacing:-.02em;font-variant-numeric:tabular-nums;padding:10px 0 14px" id="sw-disp">00:00</div>
          <div class="frow">
            <button class="btn primary" id="sw-tg">${icon('play')}开始</button>
            <button class="btn plain" id="sw-rs">${icon('refresh')}归零</button>
          </div>
        </div>
      </div>`;

    el.querySelector('#tm-add').onclick=()=>this.addFromForm(el);
    el.querySelectorAll('[data-min]').forEach(b=>b.onclick=()=>{
      const name=el.querySelector('#tm-name').value.trim();
      this.add(name, parseFloat(b.dataset.min)*60);
    });
    this.bindStopwatch(el);
    this.startLoop(el);
  },

  addFromForm(el){
    const m=parseFloat(el.querySelector('#tm-min').value)||0;
    const s=parseFloat(el.querySelector('#tm-sec').value)||0;
    const secs=m*60+s;
    if(secs<=0){ UI.toast('请输入时长','err'); return; }
    this.add(el.querySelector('#tm-name').value.trim(), secs);
    el.querySelector('#tm-min').value=''; el.querySelector('#tm-sec').value='';
  },

  add(name, secs){
    DB.data.timers.push({ id:uid(), name:name||'计时器', secs, remain:secs, running:true, endAt:Date.now()+secs*1000, alarm:false });
    DB.save();
    this.renderList();
    UI.toast('计时开始');
    if(navigator.vibrate) navigator.vibrate(30);
  },

  ensureTick(){
    if(this._tick) return;
    this._tick=setInterval(()=>{
      /* 后台兜底：即使不在计时页也推进状态 */
      let changed=false;
      DB.data.timers.forEach(t=>{
        if(t.running && !t.alarm && Date.now()>=t.endAt){ t.alarm=true; t.running=false; changed=true; this.beep(); }
      });
      if(changed) DB.save();
      /* 若当前正在计时页则刷新列表 */
      if(parseHash().name==='timers' && this._refresh){ this._refresh(); }
    }, 500);
  },

  beep(){
    try{
      const ctx = window.__audioCtx = window.__audioCtx||new (window.AudioContext||window.webkitAudioContext)();
      if(ctx.state==='suspended') ctx.resume();
      const times=[[0],[400],[800],[1400],[1800],[2200]];
      times.forEach(([t])=>{
        const o=ctx.createOscillator(), g=ctx.createGain();
        o.type='sine'; o.frequency.value=880;
        g.gain.setValueAtTime(0.0001, ctx.currentTime+0.001+t);
        g.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime+0.02+t);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime+0.3+t);
        o.connect(g).connect(ctx.destination);
        o.start(ctx.currentTime+t); o.stop(ctx.currentTime+0.35+t);
      });
    }catch(e){}
    if(navigator.vibrate) navigator.vibrate([600,200,600,200,600]);
  },

  renderList(){
    const list=document.getElementById('tm-list');
    if(!list) return;
    const timers=DB.data.timers;
    if(!timers.length){ list.innerHTML=`<div class="empty">${icon('timer')}<p>暂无计时任务</p><span>离心、孵育、酶切…都可以加一个</span></div>`; return; }
    list.innerHTML=timers.map(t=>{
      const left = t.running? Math.max(0,(t.endAt-Date.now())/1000) : (t.remain||0);
      const pct = t.alarm?100: Math.max(0, Math.min(100, (1-left/t.secs)*100));
      const C=2*Math.PI*76;
      return `<div class="timer-card ${t.alarm?'alarm':''}" data-tid="${t.id}">
        <div class="timer-ring">
          <svg viewBox="0 0 170 170">
            <circle cx="85" cy="85" r="76" stroke="var(--surface-3)" stroke-width="9" fill="none"/>
            <circle cx="85" cy="85" r="76" stroke="${t.alarm?'var(--red)':'var(--primary)'}" stroke-width="9" fill="none"
              stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-pct/100)}" style="transition:stroke-dashoffset .4s linear"/>
          </svg>
          <div class="t-time"><b>${t.alarm?'完成!':mmss(left)}</b><span>${esc(t.name)}</span></div>
        </div>
        <div class="timer-btns">
          ${t.alarm
            ? `<button class="tbtn done-btn" data-stop="${t.id}">${icon('check')}</button>`
            : `<button class="tbtn side" data-cancel="${t.id}">${icon('x')}</button>
               <button class="tbtn main" data-tg="${t.id}">${icon(t.running?'pause':'play')}</button>`}
        </div>
      </div>`;}).join('');

    list.querySelectorAll('[data-tg]').forEach(b=>b.onclick=()=>{
      const t=DB.data.timers.find(x=>x.id===b.dataset.tg);
      if(t.running){ t.remain=Math.max(0,(t.endAt-Date.now())/1000); t.running=false; }
      else { t.endAt=Date.now()+(t.remain||t.secs)*1000; t.running=true; }
      DB.save(); this.renderList();
    });
    list.querySelectorAll('[data-cancel]').forEach(b=>b.onclick=()=>{
      DB.data.timers=DB.data.timers.filter(x=>x.id!==b.dataset.cancel);
      DB.save(); this.renderList();
    });
    list.querySelectorAll('[data-stop]').forEach(b=>b.onclick=()=>{
      DB.data.timers=DB.data.timers.filter(x=>x.id!==b.dataset.stop);
      DB.save(); this.renderList();
    });
  },

  bindStopwatch(el){
    this._swEl=el;
    el.querySelector('#sw-tg').onclick=()=>{
      const sw=this._stopwatch;
      if(sw.running){ sw.base+= (Date.now()-sw.startedAt)/1000; sw.running=false; }
      else { sw.startedAt=Date.now(); sw.running=true; }
      el.querySelector('#sw-tg').innerHTML=icon(sw.running?'pause':'play')+(sw.running?'暂停':'开始');
    };
    el.querySelector('#sw-rs').onclick=()=>{
      this._stopwatch={running:false, base:0, startedAt:0};
      el.querySelector('#sw-tg').innerHTML=icon('play')+'开始';
      el.querySelector('#sw-disp').textContent='00:00';
    };
  },

  startLoop(el){
    this.ensureTick();
    this._refresh=()=>this.renderList();
    this.renderList();
    clearInterval(this._swTick);
    this._swTick=setInterval(()=>{
      const sw=this._stopwatch;
      const el2=this._swEl; if(!el2||!el2.isConnected) return;
      if(sw.running){
        const total=sw.base+(Date.now()-sw.startedAt)/1000;
        const d=el2.querySelector('#sw-disp'); if(d) d.textContent=mmss(total);
      }
      /* 倒计时卡片内文本也跟随刷新 */
      const pg=parseHash();
      if(pg.name==='timers'){
        DB.data.timers.forEach(t=>{
          if(!t.running) return;
          const left=Math.max(0,(t.endAt-Date.now())/1000);
          const card=document.querySelector(`[data-tid="${t.id}"] b`);
          if(card && !t.alarm) card.textContent=mmss(left);
        });
      }
    },250);
  }
};
