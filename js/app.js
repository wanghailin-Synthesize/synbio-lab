/* ============================================================
   应用外壳：路由 / 主题 / 底部导航 / PWA / 安装引导
   ============================================================ */
const APP_VERSION = '1.3.0';

const TAB_ITEMS = [
  {k:'home',     n:'首页', ic:'home'},
  {k:'solution', n:'配制', ic:'flask'},
  {k:'notebook', n:'记录', ic:'book'},
  {k:'convert',  n:'换算', ic:'calc'},
  {k:'more',     n:'更多', ic:'grid'}
];

/* ---------- 主题 ---------- */
function applyTheme(){
  const t = DB.data.settings.theme || 'auto';
  const dark = t==='dark' || (t==='auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ()=>{ if(DB.data.settings.theme==='auto') applyTheme(); });

/* ---------- 路由 ---------- */
function parseHash(){
  const h = location.hash.replace(/^#\/?/, '');
  const [name, ...rest] = h.split('/');
  return { name: name||'home', arg: rest.join('/') };
}
function go(path){ location.hash = '#/' + path; }

let currentPage = null;
function renderRoute(){
  const {name, arg} = parseHash();
  const pg = PAGES[name] || PAGES.home;
  const vp = document.getElementById('viewport');
  vp.innerHTML = '';
  document.title = (pg.title ? pg.title+' · ' : '') + '实验助手';
  try { pg.render(vp, arg); } catch(e){ console.error(e); vp.innerHTML = `<div class="empty">${icon('alert')}<p>页面出错了</p><span>${esc(e.message)}</span></div>`; }
  vp.scrollTop = 0;
  vp.classList.remove('page-enter'); void vp.offsetWidth; vp.classList.add('page-enter');
  updateTab(name);
  currentPage = name;
  window.scrollTo(0,0);
}
function updateTab(name){
  document.querySelectorAll('#tabbar .tab').forEach(t=>{
    t.classList.toggle('on', t.dataset.tab===name);
  });
}

/* 全局委托：data-go 跳转 / data-back 返回 */
document.addEventListener('click', e=>{
  const g = e.target.closest('[data-go]');
  if(g){ go(g.dataset.go); return; }
  const b = e.target.closest('[data-back]');
  if(b){ if(history.length>1) history.back(); else go(currentPage||'home'); }
});

/* ---------- 底部导航 ---------- */
function buildTabbar(){
  document.getElementById('tabbar').innerHTML = TAB_ITEMS.map(t=>`
    <button class="tab" data-tab="${t.k}" data-go="${t.k}">${icon(t.ic)}<span>${t.n}</span></button>`).join('');
}

/* ---------- iOS 安装引导 ---------- */
function isIOS(){
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
}
function isStandalone(){
  return matchMedia('(display-mode: standalone)').matches || navigator.standalone===true || window.navigator.standalone===true;
}
function showInstallGuide(){
  UI.sheet(`
    <div class="sh-head"><h3>安装到主屏幕</h3><button class="icon-btn" data-close>${icon('x')}</button></div>
    <div class="sh-body">
      ${isIOS()? `
      <div class="info-note">${icon('info')}<span>在 iPhone 上必须通过「添加到主屏幕」安装，数据才会长期保留，且可全屏离线使用。</span></div>
      <div class="step-li"><div class="sn">1</div><div class="sc"><b>用 Safari 打开本页</b><span>底部地址栏输入网址或扫码进入</span></div></div>
      <div class="step-li"><div class="sn">2</div><div class="sc"><b>点击底部「分享」按钮</b><span>方形带向上箭头的图标</span></div></div>
      <div class="step-li"><div class="sn">3</div><div class="sc"><b>选择「添加到主屏幕」</b><span>可能需要向下滑动找到它</span></div></div>
      <div class="step-li"><div class="sn">4</div><div class="sc"><b>点击「添加」</b><span>桌面出现「实验助手」图标，点开即全屏运行</span></div></div>
      ` : `
      <div class="info-note">${icon('info')}<span>安卓浏览器（Chrome / Edge 等）：菜单 → 「添加到主屏幕」/「安装应用」。</span></div>
      <div class="step-li"><div class="sn">1</div><div class="sc"><b>打开浏览器菜单（⋮）</b><span></span></div></div>
      <div class="step-li"><div class="sn">2</div><div class="sc"><b>点击「添加到主屏幕」或「安装应用」</b><span></span></div></div>
      `}
      <div class="info-note">${icon('info')}<span>安装后首次打开建议：设置 → 导出备份，养成定期备份习惯。</span></div>
    </div>`);
}

/* ---------- 计算器结果卡片段 ---------- */
function resultCard({label, value, unit='', extra='', copyText}){
  return `<div class="result-card">
    <button class="icon-btn copy" data-copy="${escAttr(copyText??`${value}${unit}`)}">${icon('copy')}</button>
    <div class="rl">${icon('zap')}<span>${esc(label)}</span></div>
    <div class="rv num">${value}${unit?`<small>${unit}</small>`:''}</div>
    ${extra?`<div class="rx">${extra}</div>`:''}
  </div>`;
}
document.addEventListener('click', e=>{
  const c=e.target.closest('[data-copy]');
  if(c){ UI.copy(c.dataset.copy); }
});

/* ---------- Service Worker / 更新 ---------- */
function setupSW(){
  if(!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('./sw.js').catch(()=>{});
}
async function checkUpdate(){
  try{
    const keys = await caches.keys();
    await Promise.all(keys.map(k=>caches.delete(k)));
    const regs = await navigator.serviceWorker.getRegistrations();
    regs.forEach(r=>r.unregister());
  }catch(e){}
  location.reload();
}

/* ---------- 启动 ---------- */
DB.load();
applyTheme();
buildTabbar();
renderRoute();
window.addEventListener('hashchange', renderRoute);
setupSW();

/* 预热音频（保证计时器闹铃可响） */
document.addEventListener('pointerdown', function warm(){
  try{ window.__audioCtx = window.__audioCtx || new (window.AudioContext||window.webkitAudioContext)(); }catch(e){}
  document.removeEventListener('pointerdown', warm);
}, {once:true});
