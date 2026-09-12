/* 设置：外观 / 数据备份 / 安装引导 / 关于 */
PAGES.settings = {
  title:'数据与设置',

  render(el){
    const s=DB.data.settings;
    el.innerHTML=`
      <div class="page-head"><div><div class="ht">数据与设置</div><div class="hs">数据 100% 存在本机</div></div></div>
      <div class="content">

        <div class="card">
          <div class="card-t"><h3>${icon('sliders')}通用</h3></div>
          <div class="set-row" style="padding-left:0;padding-right:0">
            <div><div class="st">实验室名称</div><div class="ss">显示在首页顶部</div></div>
          </div>
          <div class="ctl" style="margin:-4px 0 14px"><input id="st-lab" value="${escAttr(s.labName)}"></div>
          <div class="set-row" style="padding-left:0;padding-right:0">
            <div><div class="st">外观</div><div class="ss">跟随系统或手动指定</div></div>
            <div class="seg" id="st-theme">
              ${[['auto','自动'],['light','浅色'],['dark','深色']].map(t=>`<button data-th="${t[0]}" class="${s.theme===t[0]?'on':''}">${t[1]}</button>`).join('')}
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-t"><h3>${icon('box')}数据备份</h3></div>
          <div class="info-note" style="margin-top:0">${icon('alert')}<span>所有数据仅保存在本手机浏览器中。<b>清除浏览器数据、重装系统会导致丢失</b>，建议每周导出一次备份文件（含照片）。</span></div>
          <div class="frow">
            <button class="btn primary" id="st-export">${icon('download')}导出备份</button>
            <button class="btn ghost" id="st-import">${icon('upload')}导入恢复</button>
          </div>
          <div style="height:10px"></div>
          <button class="btn danger block" id="st-wipe">${icon('trash')}清空全部数据</button>
        </div>

        <div class="card">
          <div class="card-t"><h3>${icon('phone')}安装到主屏幕</h3></div>
          <button class="btn ghost block" id="st-guide">${icon('share')}查看安装步骤</button>
        </div>

        <div class="card">
          <div class="card-t"><h3>${icon('refresh')}维护</h3></div>
          <button class="btn plain block" id="st-update">${icon('refresh')}检查更新（重新加载最新版本）</button>
        </div>

        <div class="card" style="text-align:center;padding:22px">
          <div style="font-size:15px;font-weight:800">合成生物学实验助手</div>
          <div style="font-size:12.5px;color:var(--text-3);margin-top:4px">版本 ${APP_VERSION} · 为${esc(DB.data.settings.labName)}定制</div>
          <div style="font-size:12px;color:var(--text-3);margin-top:10px;line-height:1.7">
            配方与参考数据仅供科研参考，请以试剂说明书与实验室 SOP 为准<br>
            数据不出设备 · 离线可用 · PWA 构建
          </div>
        </div>
      </div>`;

    /* 实验室名称 */
    el.querySelector('#st-lab').onchange=e=>{
      DB.data.settings.labName=e.target.value.trim()||'食品合成生物学小组';
      DB.save(); UI.toast('已保存');
    };
    /* 主题 */
    el.querySelectorAll('[data-th]').forEach(b=>b.onclick=()=>{
      DB.data.settings.theme=b.dataset.th; DB.save(); applyTheme();
      el.querySelectorAll('[data-th]').forEach(x=>x.classList.toggle('on',x===b));
    });
    /* 安装引导 */
    el.querySelector('#st-guide').onclick=showInstallGuide;
    /* 更新 */
    el.querySelector('#st-update').onclick=async ()=>{
      UI.toast('正在刷新…','info'); await checkUpdate();
    };
    /* 导出 */
    el.querySelector('#st-export').onclick=async ()=>{
      try{
        const json=await DB.exportAll();
        const blob=new Blob([json],{type:'application/json'});
        const a=document.createElement('a');
        a.href=URL.createObjectURL(blob);
        a.download=`实验助手备份-${todayStr()}.json`;
        a.click();
        setTimeout(()=>URL.revokeObjectURL(a.href),3000);
        UI.toast('备份已导出');
      }catch(e){ UI.toast('导出失败：'+e.message,'err'); }
    };
    /* 导入 */
    el.querySelector('#st-import').onclick=()=>{
      const inp=document.createElement('input');
      inp.type='file'; inp.accept='.json,application/json';
      inp.onchange=async ()=>{
        try{
          const text=await inp.files[0].text();
          if(await UI.confirm('导入备份','导入将覆盖当前全部数据（含照片），确定继续？',{danger:true,okText:'覆盖导入'})){
            await DB.importAll(text);
            UI.toast('导入成功'); setTimeout(()=>location.reload(),600);
          }
        }catch(e){ UI.toast('导入失败：'+e.message,'err'); }
      };
      inp.click();
    };
    /* 清空 */
    el.querySelector('#st-wipe').onclick=async ()=>{
      if(await UI.confirm('清空全部数据','记录、任务、库存、照片将被永久删除且无法恢复！',{danger:true,okText:'继续'})){
        if(await UI.confirm('再次确认','真的要清空吗？建议先导出备份。',{danger:true,okText:'清空'})){
          await DB.wipe(); location.reload();
        }
      }
    };
  }
};
