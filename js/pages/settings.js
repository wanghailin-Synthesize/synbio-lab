/* 设置：外观 / 数据备份 / 云同步 / 安装引导 / 关于 */
PAGES.settings = {
  title:'数据与设置',

  render(el){
    const s=DB.data.settings;
    el.innerHTML=`
      <div class="page-head"><div><div class="ht">数据与设置</div><div class="hs">数据存本机 · 可选云同步</div></div></div>
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

        <div class="card" id="st-cloud"></div>

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

    /* 云同步 */
    this.drawCloud(el);
  },

  /* ============ 云同步（可选 Supabase） ============ */
  drawCloud(el){
    const box=el.querySelector('#st-cloud');
    const c=Cloud.cfg(), u=Cloud.user();
    const host=c?c.url.replace(/^https?:\/\//,'').split('.')[0]:'' ;

    if(!c){
      box.innerHTML=`
        <div class="card-t"><h3>${icon('cloud')}云同步 · 多设备互通</h3><span class="badge gray">未配置</span></div>
        <div class="info-note" style="margin-top:0">${icon('info')}<span>数据默认只存本机。配置免费的 <b>Supabase</b> 项目后，可注册账号在手机/电脑间同步，实现电脑端与手机端数据互通。数据存在你自己的 Supabase 项目里。</span></div>
        <div class="frow">
          <div class="fld" style="flex:2"><span>Supabase 项目 URL</span><div class="ctl"><input id="cl-url" placeholder="https://xxxx.supabase.co"></div></div>
          <div class="fld" style="flex:3"><span>anon public key</span><div class="ctl"><input id="cl-key" placeholder="eyJhbGciOi…"></div></div>
        </div>
        <div class="frow">
          <button class="btn primary" id="cl-save" style="flex:1">${icon('check')}保存并连接</button>
          <button class="btn plain" id="cl-sql" style="flex:1">${icon('copy')}复制配置 SQL</button>
        </div>
        <div class="hint" style="font-size:12px;color:var(--text-3);margin-top:8px">配置步骤见交付包《04-云端同步配置指南》：① 注册 supabase.com 建项目 → ② SQL Editor 执行配置 SQL → ③ 把 URL 和 anon key 粘贴到这里。</div>`;
      box.querySelector('#cl-sql').onclick=()=>UI.copy(CLOUD_SQL);
      box.querySelector('#cl-save').onclick=()=>{
        const url=box.querySelector('#cl-url').value.trim(), key=box.querySelector('#cl-key').value.trim();
        if(!/^https:\/\/.+\.supabase\.co/.test(url)){ UI.toast('URL 格式应如 https://xxxx.supabase.co','err'); return; }
        if(!key){ UI.toast('请填写 anon key','err'); return; }
        Cloud.setCfg(url,key); UI.toast('已保存服务器配置');
        this.drawCloud(el);
      };
      return;
    }

    if(!u){
      box.innerHTML=`
        <div class="card-t"><h3>${icon('cloud')}云同步 · 多设备互通</h3><span class="badge teal">已连接 ${esc(host)}</span></div>
        <div class="frow">
          <div class="fld"><span>邮箱</span><div class="ctl"><input id="cl-email" type="email" placeholder="you@lab.edu" style="font-size:16px"></div></div>
          <div class="fld"><span>密码（≥6 位）</span><div class="ctl"><input id="cl-pass" type="password" placeholder="••••••"></div></div>
        </div>
        <div class="frow">
          <button class="btn primary" id="cl-in" style="flex:1">${icon('check')}登录</button>
          <button class="btn ghost" id="cl-up" style="flex:1">${icon('plus')}注册新账号</button>
        </div>
        <div style="height:8px"></div>
        <button class="btn plain block" id="cl-reset">${icon('x')}更换 / 移除服务器配置</button>`;
      box.querySelector('#cl-reset').onclick=async ()=>{
        if(await UI.confirm('移除服务器配置','仅清除本机保存的服务器地址，不影响云端数据。',{okText:'移除'})){
          Cloud.clearCfg(); this.drawCloud(el);
        }
      };
      const auth=async signup=>{
        const email=box.querySelector('#cl-email').value.trim(), pass=box.querySelector('#cl-pass').value;
        if(!email||!pass){ UI.toast('请填写邮箱和密码','err'); return; }
        UI.toast(signup?'正在注册…':'正在登录…','info');
        try{
          if(signup){
            const r=await Cloud.signUp(email,pass);
            UI.toast(r.confirmed?'注册成功，已登录':'注册成功！请先到邮箱点击确认链接，再回来登录',r.confirmed?'ok':'info');
          }else{
            await Cloud.signIn(email,pass);
            UI.toast('登录成功');
          }
          this.drawCloud(el);
        }catch(e){ UI.toast(e.message,'err'); }
      };
      box.querySelector('#cl-in').onclick=()=>auth(false);
      box.querySelector('#cl-up').onclick=()=>auth(true);
      return;
    }

    /* 已登录 */
    box.innerHTML=`
      <div class="card-t"><h3>${icon('cloud')}云同步 · 多设备互通</h3><span class="badge green">已登录 ${esc(u.email||'')}</span></div>
      <div class="info-note" style="margin-top:0">${icon('info')}<span>手机和电脑打开同一网址并登录同一账号即可互通；电脑浏览器（Chrome/Edge）可在菜单里「安装应用」当桌面 App 用。<b>上传=先合并再上传</b>（两端数据按条目合并，同一记录取较新版本）。</span></div>
      <div class="frow">
        <button class="btn primary" id="cl-up2" style="flex:1">${icon('upload')}上传到云端</button>
        <button class="btn ghost" id="cl-down" style="flex:1">${icon('download')}从云端恢复</button>
      </div>
      <div style="height:8px"></div>
      <button class="btn plain block" id="cl-ov">${icon('upload')}覆盖云端（以本机为准，慎用）</button>
      <div style="height:8px"></div>
      <div id="cl-admin"></div>
      <button class="btn plain block" id="cl-out">${icon('x')}退出登录</button>`;
    box.querySelector('#cl-out').onclick=()=>{ Cloud.signOut(); UI.toast('已退出登录'); this.drawCloud(el); };
    box.querySelector('#cl-ov').onclick=async ()=>{
      if(await UI.confirm('覆盖云端','将用本机数据整包替换云端（云端旧数据丢失），继续？',{danger:true,okText:'覆盖'})){
        try{ UI.toast('正在上传…','info'); const r=await Cloud.syncUp(true); UI.toast(`已覆盖云端（${(r.bytes/1048576).toFixed(1)} MB）`); }
        catch(e){ UI.toast('失败：'+e.message,'err'); }
      }
    };
    box.querySelector('#cl-up2').onclick=async ()=>{
      try{ UI.toast('正在合并上传…','info'); const r=await Cloud.syncUp(false);
        UI.toast(`已上传（${(r.bytes/1048576).toFixed(1)} MB）${r.merged?'，云端数据已合并进本机':''}`);
        if(r.merged) setTimeout(()=>location.reload(),800);
      }catch(e){ UI.toast('失败：'+e.message,'err'); }
    };
    box.querySelector('#cl-down').onclick=async ()=>{
      if(!await UI.confirm('从云端恢复','将云端数据与本机合并（本机多出的数据保留，云端多出的会加入本机），继续？',{okText:'开始恢复'})) return;
      try{ UI.toast('正在恢复…','info'); const r=await Cloud.syncDown();
        UI.toast(`已恢复，新增 ${r.photoNew} 张照片`); setTimeout(()=>location.reload(),800);
      }catch(e){ UI.toast('失败：'+e.message,'err'); }
    };

    /* 角色与管理员区 */
    Cloud.myProfile().then(p=>{
      if(!p) return;
      if(p.role==='admin'){
        Cloud.listProfiles().then(list=>{
          const a=box.querySelector('#cl-admin');
          a.innerHTML=`
            <div class="card-t" style="margin:10px 0 4px"><h3 style="font-size:14.5px">${icon('users')}管理员 · 成员数据</h3></div>
            ${list.map(m=>`
              <div class="bp-li">
                <span class="bpt">${esc(m.email||m.id.slice(0,8))}${m.role==='admin'?' <span class="badge violet">管理员</span>':''}</span>
                <button class="btn plain small" data-mdl="${m.id}|${esc(m.email||'')}">${icon('download')}下载数据</button>
              </div>`).join('')}
            <div class="hint" style="font-size:12px;color:var(--text-3);margin:6px 0 8px">下载的是成员的备份 JSON（含照片），在「导入恢复」中即可查看。</div>`;
          a.querySelectorAll('[data-mdl]').forEach(b=>b.onclick=async ()=>{
            const [uid,email]=b.dataset.mdl.split('|');
            try{ UI.toast('正在下载成员数据…','info'); await Cloud.downloadMember(uid,email); }
            catch(e){ UI.toast('失败：'+e.message,'err'); }
          });
        }).catch(()=>{});
      }
    }).catch(()=>{});
  }
};
