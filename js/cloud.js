/* ============================================================
   云同步（可选，Supabase 免费档）：账号注册/登录 + 数据上云/恢复
   + 管理员只读查看成员数据。纯 fetch 对接 Supabase REST，零依赖。
   使用前提：自行创建免费 Supabase 项目 → SQL Editor 执行 CLOUD_SQL
   → 在「设置 → 云同步」填入项目 URL 与 anon key（见交付包配置指南）
   ============================================================ */
const CLOUD_SQL = `-- 实验助手云同步初始化 SQL（在 Supabase SQL Editor 中整体执行，可重复执行）
-- 1. 成员档案表
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'member',
  created_at timestamptz default now()
);
alter table profiles enable row level security;

-- 2. 数据快照表（每人一行，管理员可读）
create table if not exists lab_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null,
  device text,
  updated_at timestamptz default now()
);
alter table lab_snapshots enable row level security;

-- 3. 管理员判定函数（必须先于策略创建，策略里会用到）
create or replace function public.is_admin() returns boolean
language sql security definer set search_path = public stable as $$
  select coalesce((select role = 'admin' from profiles where id = auth.uid()), false);
$$;

-- 4. profiles 表策略
drop policy if exists "profiles_select" on profiles;
create policy "profiles_select" on profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles_insert_self" on profiles;
create policy "profiles_insert_self" on profiles for insert to authenticated
  with check (id = auth.uid());
drop policy if exists "profiles_update_self" on profiles;
create policy "profiles_update_self" on profiles for update to authenticated
  using (id = auth.uid());

-- 5. 快照表策略（本人可读写，管理员可读）
drop policy if exists "snapshots_own" on lab_snapshots;
create policy "snapshots_own" on lab_snapshots for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "snapshots_admin_read" on lab_snapshots;
create policy "snapshots_admin_read" on lab_snapshots for select to authenticated
  using (public.is_admin());

-- 6. 注册后自动建立档案
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 7. 提升管理员（把邮箱换成实际管理员的，重新执行一次即可）
-- update profiles set role = 'admin' where email = 'admin@example.com';`;

const Cloud = {
  KEY:'slab-cloud',

  cfg(){ try{ return JSON.parse(localStorage.getItem(this.KEY))||null; }catch(e){ return null; } },
  saveCfg(c){ localStorage.setItem(this.KEY, JSON.stringify(c)); },
  setCfg(url,key){ this.saveCfg({ url:url.replace(/\/+$/,''), key:key.trim(), session:null }); },
  clearCfg(){ localStorage.removeItem(this.KEY); },

  user(){ const c=this.cfg(); return (c&&c.session)||null; },

  /* ---- 认证 ---- */
  async signUp(email,pass){
    const c=this.cfg(); if(!c) throw new Error('请先配置服务器');
    const r=await fetch(c.url+'/auth/v1/signup',{method:'POST',
      headers:{apikey:c.key,'Content-Type':'application/json'},
      body:JSON.stringify({email,password:pass})});
    const d=await r.json().catch(()=>({}));
    if(!r.ok) throw new Error(d.msg||d.error_description||d.message||'注册失败');
    if(d.access_token){ this._saveSession(d,email); return {confirmed:true}; }
    return {confirmed:false}; /* 项目开启了邮箱确认 */
  },
  async signIn(email,pass){
    const c=this.cfg(); if(!c) throw new Error('请先配置服务器');
    const r=await fetch(c.url+'/auth/v1/token?grant_type=password',{method:'POST',
      headers:{apikey:c.key,'Content-Type':'application/json'},
      body:JSON.stringify({email,password:pass})});
    const d=await r.json().catch(()=>({}));
    if(!r.ok||!d.access_token) throw new Error(d.error_description||d.msg||d.message||'登录失败，检查邮箱密码');
    this._saveSession(d,email);
    return true;
  },
  _saveSession(d,email){
    const c=this.cfg();
    c.session={ access_token:d.access_token, refresh_token:d.refresh_token,
      expiresAt:Date.now()+(d.expires_in||3600)*1000-60000,
      email:email||(d.user&&d.user.email)||'' };
    this.saveCfg(c);
  },
  signOut(){ const c=this.cfg(); if(c){ c.session=null; this.saveCfg(c); } },

  uid(){
    const s=this.user(); if(!s) return null;
    try{
      const p=JSON.parse(atob(s.access_token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
      return p.sub||null;
    }catch(e){ return null; }
  },
  async ensureToken(){
    const c=this.cfg(); if(!c||!c.session) throw new Error('未登录');
    if(Date.now()<c.session.expiresAt) return c.session.access_token;
    const r=await fetch(c.url+'/auth/v1/token?grant_type=refresh_token',{method:'POST',
      headers:{apikey:c.key,'Content-Type':'application/json'},
      body:JSON.stringify({refresh_token:c.session.refresh_token})});
    const d=await r.json().catch(()=>({}));
    if(!r.ok||!d.access_token){ this.signOut(); throw new Error('登录已过期，请重新登录'); }
    this._saveSession(d,c.session.email);
    return d.access_token;
  },

  /* ---- REST 基础请求 ---- */
  async req(path,{method='GET',body,prefer}={}){
    const c=this.cfg(); if(!c) throw new Error('尚未配置云服务器');
    const token=await this.ensureToken();
    const headers={ apikey:c.key, Authorization:'Bearer '+token, 'Content-Type':'application/json' };
    if(prefer) headers.Prefer=prefer;
    const r=await fetch(c.url+path,{method,headers,body:body!==undefined?JSON.stringify(body):undefined});
    const text=await r.text();
    let data=null; try{ data=text?JSON.parse(text):null; }catch(e){}
    if(!r.ok){
      const msg=data?(data.message||data.msg||data.error_description||data.error):('HTTP '+r.status);
      throw new Error(typeof msg==='string'?msg:JSON.stringify(msg));
    }
    return data;
  },

  async getSnapshot(uid){
    const rows=await this.req(`/rest/v1/lab_snapshots?select=user_id,payload,device,updated_at&user_id=eq.${uid}`);
    return (rows&&rows[0])||null;
  },
  async putSnapshot(uid,payload){
    await this.req('/rest/v1/lab_snapshots?on_conflict=user_id',{method:'POST',
      prefer:'resolution=merge-duplicates,return=minimal',
      body:[{user_id:uid,payload,device:navigator.userAgent.slice(0,120),updated_at:new Date().toISOString()}]});
  },
  async myProfile(){
    const uid=this.uid(); if(!uid) return null;
    const rows=await this.req(`/rest/v1/profiles?select=id,email,display_name,role&id=eq.${uid}`);
    return (rows&&rows[0])||null;
  },
  async listProfiles(){
    return await this.req('/rest/v1/profiles?select=id,email,display_name,role,created_at&order=created_at.asc')||[];
  },

  /* ---- 数据合并（按 id 并集；同 id 冲突取 updatedAt 较新；照片并集本机优先；设置本机优先） ---- */
  mergePayload(local,remote){
    const L=JSON.parse(JSON.stringify(local.db||{}));
    const R=(remote&&remote.db)||{};
    const mergeArr=(a,b,tsKey)=>{
      const map={};
      (a||[]).forEach(x=>{ if(x&&x.id) map[x.id]=x; });
      (b||[]).forEach(x=>{
        if(!x||!x.id) return;
        const old=map[x.id];
        if(!old) map[x.id]=x;
        else if(tsKey&&((x[tsKey]||0)>(old[tsKey]||0))) map[x.id]=x;
      });
      return Object.values(map);
    };
    const db={ ...L,
      projects:      mergeArr(L.projects,R.projects),
      entries:       mergeArr(L.entries,R.entries,'updatedAt'),
      tasks:         mergeArr(L.tasks,R.tasks),
      protocols:     mergeArr(L.protocols,R.protocols),
      inventory:     mergeArr(L.inventory,R.inventory,'updatedAt'),
      boxes:         mergeArr(L.boxes,R.boxes),
      customRecipes: mergeArr(L.customRecipes,R.customRecipes),
      qplates:       mergeArr(L.qplates,R.qplates),
      timers:        L.timers||[],
      flags:         L.flags||{}
    };
    const photos={ ...((remote&&remote.photos)||{}), ...(local.photos||{}) };
    return {db,photos};
  },

  /* 上传：默认先与云端合并再上传（override=true 则整包覆盖） */
  async syncUp(override){
    const uid=this.uid(); if(!uid) throw new Error('未登录');
    const local=JSON.parse(await DB.exportAll());
    let payload=local, mergedIntoLocal=false;
    if(!override){
      const remote=await this.getSnapshot(uid);
      if(remote&&remote.payload){
        payload=this.mergePayload(local,remote.payload);
        /* 合并出的新照片写回本机相册仓 */
        for(const pid in payload.photos){
          if(!local.photos[pid]) await DB.putPhoto(pid,payload.photos[pid]);
        }
        DB.data=payload.db; DB.save();
        mergedIntoLocal=true;
      }
    }
    await this.putSnapshot(uid,payload);
    return {bytes:JSON.stringify(payload).length, merged:mergedIntoLocal};
  },

  /* 恢复：拉取云端并与本机合并 */
  async syncDown(){
    const uid=this.uid(); if(!uid) throw new Error('未登录');
    const remote=await this.getSnapshot(uid);
    if(!remote||!remote.payload) throw new Error('云端还没有数据，先在手机上「上传到云端」');
    const local=JSON.parse(await DB.exportAll());
    const merged=this.mergePayload(local,remote.payload);
    let photoNew=0;
    for(const pid in merged.photos){
      if(!local.photos[pid]&&typeof merged.photos[pid]==='string'){
        await DB.putPhoto(pid,merged.photos[pid]); photoNew++;
      }
    }
    DB.data=merged.db; DB.save();
    return {photoNew};
  },

  /* 管理员：下载某成员的云端数据（备份 JSON，可用「导入恢复」查看） */
  async downloadMember(uid,email){
    const snap=await this.getSnapshot(uid);
    if(!snap) throw new Error('该成员还没有云端数据');
    const obj={app:'synbio-lab',version:1,exportedAt:new Date().toISOString(),
      db:snap.payload.db||{}, photos:snap.payload.photos||{}};
    const blob=new Blob([JSON.stringify(obj)],{type:'application/json'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=`成员备份_${(email||uid).replace(/[^A-Za-z0-9@._-]/g,'_')}_${todayStr()}.json`;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),4000);
    return true;
  }
};
