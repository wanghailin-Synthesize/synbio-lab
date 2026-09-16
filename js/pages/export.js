/* ============================================================
   实验记录导出：
   ① Word 文档（.doc）——MHTML 单文件格式（Word 原生支持，照片内嵌且紧凑排版可打印）
      每条记录按「实验目的 / 实验材料 / 实验方法 / 实验结果(照片)」四节输出
   ② 图片包（.zip）——范围内全部实验照片，内置 ZIP 打包（仅存储不压缩）
   ============================================================ */
PAGES.export = {
  title:'导出实验记录',

  render(el){
    const dates=DB.data.entries.map(e=>e.date).filter(Boolean).sort();
    el.innerHTML=`
      <div class="sub-head">
        <button class="icon-btn" data-back>${icon('chevL')}</button>
        <div class="title">导出实验记录</div>
        <div style="width:38px"></div>
      </div>
      <div class="content">
        <div class="info-note">${icon('info')}<span>按日期范围导出：Word 文档按「日期 → 实验」分组，每条记录分为<b>实验目的 / 实验材料 / 实验方法 / 实验结果</b>四节，照片多张并排紧凑排版，可直接打印归档；也可只打包范围内的全部照片。</span></div>
        <div class="card">
          <div class="frow">
            <div class="fld"><span>开始日期</span><div class="ctl"><input id="ex-from" type="date" value="${dates[0]||todayStr()}"></div></div>
            <div class="fld"><span>结束日期</span><div class="ctl"><input id="ex-to" type="date" value="${todayStr()}"></div></div>
          </div>
          <div class="hint" id="ex-stat" style="font-size:12.5px;color:var(--text-2);margin:4px 0 12px"></div>
          <button class="btn primary block" id="ex-word">${icon('print')}导出 Word 文档</button>
          <div style="height:8px"></div>
          <button class="btn ghost block" id="ex-zip">${icon('image')}导出图片包（ZIP）</button>
        </div>
        <div class="info-note" style="margin-bottom:0">${icon('phone')}<span>推荐在电脑浏览器上使用本功能（文件直接下载）；iPhone 导出的文件在「文件」App 或 Safari 下载列表里，可分享给微信/邮箱传到电脑。Word 文档用 Microsoft Word / WPS 打开。</span></div>
      </div>`;

    const stat=()=>{
      const from=el.querySelector('#ex-from').value, to=el.querySelector('#ex-to').value;
      const recs=this.filterRecs(from,to);
      const ph=recs.reduce((s,e)=>s+(e.photos||[]).length,0);
      el.querySelector('#ex-stat').textContent=`范围内共 ${recs.length} 条记录 · ${ph} 张照片`;
      return {from,to,recs};
    };
    el.querySelector('#ex-from').oninput=stat;
    el.querySelector('#ex-to').oninput=stat;
    stat();

    el.querySelector('#ex-word').onclick=async ()=>{
      const {from,to}=stat();
      UI.toast('正在生成 Word 文档…','info');
      try{
        const r=await this.makeWord(from,to);
        UI.toast(`已导出：${r.records} 条记录 · ${r.photos} 张照片`);
      }catch(e){ UI.toast('导出失败：'+e.message,'err'); }
    };
    el.querySelector('#ex-zip').onclick=async ()=>{
      const {from,to}=stat();
      UI.toast('正在打包照片…','info');
      try{
        const r=await this.makeZip(from,to);
        UI.toast(`已导出 ${r.photos} 张照片（${(r.size/1048576).toFixed(1)} MB）`);
      }catch(e){ UI.toast('导出失败：'+e.message,'err'); }
    };
  },

  filterRecs(from,to){
    return DB.data.entries
      .filter(e=>(!from||(e.date&&e.date>=from))&&(!to||(e.date&&e.date<=to)))
      .sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999')||(a.createdAt||0)-(b.createdAt||0));
  },

  /* 收集范围内记录 + 载入照片 dataURL */
  async collect(from,to){
    const d=DB.data;
    const items=[];
    for(const rec of this.filterRecs(from,to)){
      const photos=[];
      for(const pid of (rec.photos||[])){
        const u=await DB.getPhoto(pid);
        if(u) photos.push(u);
      }
      items.push({rec, tp:TEMPLATES[rec.type]||TEMPLATES.general,
        pj:d.projects.find(p=>p.id===rec.projectId), photos});
    }
    return items;
  },

  /* 字段分类：结果字段(k=result 或标签含结果词) → 结果；含方法词 → 方法；含材料词 → 材料；其余 → 方法 */
  classifyField(f){
    const l=f.l||'';
    const has=arr=>arr.some(k=>l.includes(k));
    if(f.k==='result'||has(EXPORT_KEYWORDS.result)) return 'result';
    if(has(EXPORT_KEYWORDS.method)) return 'method';
    if(has(EXPORT_KEYWORDS.material)) return 'material';
    return 'method';
  },

  /* ---- 生成 Word ---- */
  async makeWord(from,to){
    const items=await this.collect(from,to);
    if(!items.length) throw new Error('该日期范围内没有实验记录');
    const lab=esc(DB.data.settings.labName);
    let body='';
    /* 按日期分组 */
    const days={};
    items.forEach(it=>{ const k=it.rec.date||'未标注日期'; (days[k]=days[k]||[]).push(it); });
    let imgIdx=0;
    const images=[];
    for(const day of Object.keys(days).sort()){
      body+=`<h2>${esc(dateCN(day)||day)}<span class="d2">${esc(day)}</span></h2>`;
      for(const it of days[day]){
        const title=it.rec.title||it.tp.name;
        body+=`<h3>${esc(title)}<span class="tp">${esc(it.tp.name)}</span></h3>`;
        /* 实验目的 */
        body+=`<h4>实验目的</h4><p>本次实验为「${esc(title)}」（${esc(it.tp.name)}）${it.pj?`，属项目「${esc(it.pj.name)}」`:''}。</p>`;
        /* 字段按 材料方法结果 分类 */
        const groups={material:[],method:[],result:[]};
        (it.tp.fields||[]).forEach(f=>{
          const v=(it.rec.fields||{})[f.k];
          if(v) groups[this.classifyField(f)].push({l:f.l,v});
        });
        const fline=a=>a.map(x=>`<p><b>${esc(x.l)}：</b>${esc(x.v)}</p>`).join('');
        body+=`<h4>实验材料</h4>${fline(groups.material)||'<p class="dim">（无）</p>'}`;
        body+=`<h4>实验方法</h4>${fline(groups.method)||'<p class="dim">（无）</p>'}`;
        /* 实验结果：结果字段 + 详细记录 + 照片 */
        body+=`<h4>实验结果</h4>${fline(groups.result)}`;
        if(it.rec.notes) body+=`<p class="notes">${esc(it.rec.notes).replace(/\n/g,'<br>')}</p>`;
        if(it.photos.length){
          const cap=esc((it.rec.title||it.tp.name).slice(0,14));
          let rows='';
          for(let i=0;i<it.photos.length;i++){
            imgIdx++;
            const name=`img${String(imgIdx).padStart(3,'0')}.jpg`;
            images.push({name, dataUrl:it.photos[i]});
            if(i%3===0) rows+=(i?'</tr><tr>':'<tr>');
            rows+=`<td><img src="file:///C:/slab_export/${name}" width="200"><br><span class="cap">${cap} · 图${i+1}</span></td>`;
          }
          const rest=it.photos.length%3;
          if(rest) rows+='<td></td>'.repeat(3-rest);
          body+=`<table class="ph"><tr>${rows}</tr></table>`;
        }
      }
    }
    const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${lab} 实验记录</title>
<style>
body{font-family:"微软雅黑","Microsoft YaHei",SimSun,sans-serif;font-size:11pt;color:#111;line-height:1.6}
h1{font-size:17pt;margin:0 0 4pt}
.sub{font-size:9pt;color:#666;margin:0 0 14pt}
h2{font-size:14pt;margin:16pt 0 6pt;border-bottom:1.5pt solid #444;padding-bottom:2pt}
h2 .d2{font-size:9pt;color:#888;font-weight:normal;margin-left:8pt}
h3{font-size:12.5pt;margin:12pt 0 4pt}
h3 .tp{font-size:9pt;color:#2B6BF3;border:1pt solid #2B6BF3;border-radius:8pt;padding:1pt 7pt;margin-left:6pt;font-weight:normal;vertical-align:2pt}
h4{font-size:11pt;margin:8pt 0 2pt;color:#555}
p{margin:2pt 0}
p.dim{color:#999}
p.notes{background:#F5F7FA;padding:6pt 8pt;white-space:pre-wrap}
.meta, .cap{font-size:8pt;color:#888}
table.ph{border-collapse:collapse}
table.ph td{text-align:center;padding:4pt 6pt;vertical-align:top}
img{display:inline-block}
@page{size:A4;margin:2cm}
</style></head><body>
<h1>${lab} · 实验记录</h1>
<p class="sub">导出范围：${esc(from||'最早')+' 至 '+esc(to||todayStr())} · 共 ${items.length} 条记录 ${images.length?`· ${images.length} 张照片`:''} · 导出时间 ${todayStr()}</p>
${body}
</body></html>`;

    let fileStr;
    if(images.length){
      fileStr=this.toMhtml(html,images);
    }else{
      fileStr='\ufeff'+html;
    }
    const blob=new Blob([fileStr],{type:'application/msword'});
    this.download(blob,`实验记录_${from||'全部'}_${to||todayStr()}.doc`);
    return {records:items.length, photos:images.length, size:blob.size};
  },

  /* HTML + dataURL 图片 → MHTML（Word 单文件网页格式，图片以 MIME 部分内嵌） */
  toMhtml(html,images){
    const b64utf8=s=>btoa(unescape(encodeURIComponent(s)));
    const B='----=_NextPart_slab_export';
    const parts=[];
    const docUrl='file:///C:/slab_export/doc.htm';
    parts.push(`--${B}\r\nContent-Location: ${docUrl}\r\nContent-Transfer-Encoding: base64\r\nContent-Type: text/html; charset="utf-8"\r\n\r\n${b64utf8(html)}`);
    images.forEach(im=>{
      const mime=im.dataUrl.startsWith('data:image/png')?'image/png':'image/jpeg';
      parts.push(`\r\n--${B}\r\nContent-Location: file:///C:/slab_export/${im.name}\r\nContent-Transfer-Encoding: base64\r\nContent-Type: ${mime}\r\n\r\n${im.dataUrl.split(',')[1]}`);
    });
    parts.push(`\r\n--${B}--\r\n`);
    return `MIME-Version: 1.0\r\nContent-Type: multipart/related; boundary="${B}"; type="text/html"\r\n\r\n${parts.join('\r\n')}`;
  },

  /* ---- 生成图片包 ZIP ---- */
  async makeZip(from,to){
    const items=await this.collect(from,to);
    const files=[];
    for(const it of items){
      const day=it.rec.date||'未标注日期';
      const base=(day+'_'+(it.rec.title||it.tp.name)).replace(/[\\/:*?"<>|]/g,'_').slice(0,50);
      it.photos.forEach((u,i)=>{
        files.push({name:`${base}_${i+1}.jpg`, u8:this.dataUrlToU8(u)});
      });
    }
    if(!files.length) throw new Error('该日期范围内没有照片');
    const u8=this.makeZipFile(files);
    const blob=new Blob([u8],{type:'application/zip'});
    this.download(blob,`实验照片_${from||'全部'}_${to||todayStr()}.zip`);
    return {photos:files.length, size:blob.size};
  },

  dataUrlToU8(dataUrl){
    const bin=atob(dataUrl.split(',')[1]);
    const u8=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) u8[i]=bin.charCodeAt(i);
    return u8;
  },

  /* 最小 ZIP 打包（存储模式，不压缩） */
  _crcTable:null,
  crc32(u8){
    if(!this._crcTable){
      const t=[]; for(let n=0;n<256;n++){ let c=n; for(let k=0;k<8;k++) c=c&1?0xEDB88320^(c>>>1):c>>>1; t[n]=c>>>0; }
      this._crcTable=t;
    }
    let c=0xFFFFFFFF;
    for(let i=0;i<u8.length;i++) c=this._crcTable[(c^u8[i])&0xFF]^(c>>>8);
    return (c^0xFFFFFFFF)>>>0;
  },
  makeZipFile(files){
    const enc=new TextEncoder();
    const now=new Date();
    const dosTime=((now.getHours()<<11)|(now.getMinutes()<<5)|(now.getSeconds()>>1))&0xFFFF;
    const dosDate=(((now.getFullYear()-1980)<<9)|((now.getMonth()+1)<<5)|now.getDate())&0xFFFF;
    const chunks=[], central=[];
    let offset=0;
    for(const f of files){
      const nameU8=enc.encode(f.name), crc=this.crc32(f.u8), sz=f.u8.length;
      const lh=new DataView(new ArrayBuffer(30));
      lh.setUint32(0,0x04034b50,true); lh.setUint16(4,20,true); lh.setUint16(6,0x0800,true);
      lh.setUint16(8,0,true); lh.setUint16(10,dosTime,true); lh.setUint16(12,dosDate,true);
      lh.setUint32(14,crc,true); lh.setUint32(18,sz,true); lh.setUint32(22,sz,true);
      lh.setUint16(26,nameU8.length,true); lh.setUint16(28,0,true);
      chunks.push(new Uint8Array(lh.buffer),nameU8,f.u8);
      const ch=new DataView(new ArrayBuffer(46));
      ch.setUint32(0,0x02014b50,true); ch.setUint16(4,20,true); ch.setUint16(6,20,true);
      ch.setUint16(8,0x0800,true); ch.setUint16(10,0,true); ch.setUint16(12,dosTime,true);
      ch.setUint16(14,dosDate,true); ch.setUint32(16,crc,true); ch.setUint32(20,sz,true);
      ch.setUint32(24,sz,true); ch.setUint16(28,nameU8.length,true); ch.setUint16(30,0,true);
      ch.setUint16(32,0,true); ch.setUint16(34,0,true); ch.setUint16(36,0,true); ch.setUint32(38,offset,true);
      central.push(new Uint8Array(ch.buffer),nameU8);
      offset+=30+nameU8.length+sz;
    }
    const cdSize=central.reduce((s,c)=>s+c.length,0);
    const eocd=new DataView(new ArrayBuffer(22));
    eocd.setUint32(0,0x06054b50,true); eocd.setUint16(8,files.length,true); eocd.setUint16(10,files.length,true);
    eocd.setUint32(12,cdSize,true); eocd.setUint32(16,offset,true);
    const all=[...chunks,...central,new Uint8Array(eocd.buffer)];
    const out=new Uint8Array(all.reduce((s,c)=>s+c.length,0));
    let p=0; for(const c of all){ out.set(c,p); p+=c.length; }
    return out;
  },

  download(blob,name){
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=name;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),4000);
  }
};
