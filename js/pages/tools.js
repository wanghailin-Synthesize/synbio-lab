/* 工具箱：序列分析 / 克隆与转化 / 培养计数 / 蛋白定量 / RNA·IVT / 速查表 */
PAGES.tools = {
  title:'工具箱',
  state:{cat:'seq', ivt:null},

  CATS:[['seq','序列分析'],['lig','克隆与转化'],['culture','培养与计数'],['protein','蛋白与定量'],['rna','RNA · IVT'],['qpcr','qPCR 定量'],['ref','速查表']],

  render(el){
    const st=this.state;
    el.innerHTML=`
      <div class="page-head"><div><div class="ht">工具箱</div><div class="hs">序列 · 克隆 · RNA · 速查</div></div></div>
      <div class="chips">${this.CATS.map(c=>`<button class="chip ${st.cat===c[0]?'on':''}" data-cat="${c[0]}">${c[1]}</button>`).join('')}</div>
      <div class="content" id="tl-panel"></div>`;
    el.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{ st.cat=b.dataset.cat; this.render(el); });
    const p=el.querySelector('#tl-panel');
    ({seq:()=>this.gSeq(p), lig:()=>this.gLig(p), culture:()=>this.gCulture(p),
      protein:()=>this.gProtein(p), rna:()=>this.gRna(p), qpcr:()=>this.gQpcr(p), ref:()=>this.gRef(p)})[st.cat]();
  },

  bind(sel, p, fn){
    sel.split(',').forEach(s=>p.querySelectorAll(s).forEach(i=>{ i.addEventListener('input',fn); i.addEventListener('change',fn); }));
    fn();
  },

  /* ============ 序列分析 ============ */
  gSeq(p){
    p.innerHTML=`
      <div class="card">
        <div class="fld"><span>序列（DNA 或 RNA，自动识别 U/T）</span><div class="ctl"><textarea id="sq-in" rows="3" placeholder="粘贴引物或基因片段…" style="font-family:ui-monospace,Menlo,Consolas,monospace;letter-spacing:.06em"></textarea></div></div>
        <div id="sq-out"></div>
      </div>
      <div class="info-note">${icon('info')}<span>Tm 为简易公式估算（Tm<14℃ 区间用 Wallace 法则，其余用盐校正公式），引物设计请以专业软件为准。</span></div>`;
    const RC={A:'T',T:'A',C:'G',G:'C',U:'A',N:'N'};
    const calc=()=>{
      const raw=p.querySelector('#sq-in').value.toUpperCase().replace(/[^ACGTUN]/g,'');
      const out=p.querySelector('#sq-out');
      if(!raw){ out.innerHTML=''; return; }
      const isRNA=raw.includes('U');
      const n={}; for(const ch of raw) n[ch]=(n[ch]||0)+1;
      const N=raw.length;
      const gc=((n.C||0)+(n.G||0))/N*100;
      const at=(n.A||0)+(n.T||0)+(n.U||0);
      const tmWallace=2*at+4*((n.C||0)+(n.G||0));
      const tmSalt = 64.9 + 41*( (n.G||0)+(n.C||0) - 16.4 )/N;
      const tm = N<14? tmWallace : tmSalt;
      /* 分子量 */
      let mw=0;
      if(isRNA){ mw=(n.A||0)*329.21+(n.U||0)*306.17+(n.C||0)*305.18+(n.G||0)*345.22+(n.T||0)*304.2-61.96; }
      else{ mw=(n.A||0)*313.21+(n.T||0)*304.2+(n.C||0)*289.18+(n.G||0)*329.21+(n.U||0)*320.2-61.96; }
      /* 反向互补 */
      const comp=[...raw].map(c=>RC[c]||'N').join('');
      const revc=[...comp].reverse().join('');
      out.innerHTML=`
        <div class="result-card">
          <div class="rl">${icon('dna')}<span>序列信息${isRNA?'（RNA）':'（DNA）'}</span></div>
          <div class="rv num" style="font-size:24px">${N} <small>nt</small></div>
          <div class="rx">GC 含量 <b>${gc.toFixed(1)}%</b> · Tm ≈ <b>${tm.toFixed(1)}℃</b> · MW ≈ <b>${fmtN(mw)} Da</b></div>
          <div class="rx" style="margin-top:8px">互补链（5'→3'）<br><span class="num" style="font-family:ui-monospace,Menlo,monospace;color:var(--primary);font-weight:600;word-break:break-all">${comp}</span></div>
          <div class="rx" style="margin-top:6px">反向互补（5'→3'）<br><span class="num" style="font-family:ui-monospace,Menlo,monospace;color:var(--primary);font-weight:600;word-break:break-all">${revc}</span></div>
        </div>
        <div class="frow">
          <button class="btn plain small" data-cp="revc">${icon('copy')}复制反向互补</button>
          <button class="btn plain small" data-cp="info">${icon('copy')}复制摘要</button>
        </div>`;
      out.querySelector('[data-cp=revc]').onclick=()=>UI.copy(revc);
      out.querySelector('[data-cp=info]').onclick=()=>UI.copy(`长度 ${N} nt | GC ${gc.toFixed(1)}% | Tm≈${tm.toFixed(1)}℃ | MW ${Math.round(mw)} Da | 反向互补: ${revc}`);
    };
    this.bind('#sq-in', p, calc);
  },

  /* ============ 克隆与转化 ============ */
  gLig(p){
    p.innerHTML=`
      <div class="card">
        <div class="card-t"><h3>${icon('dna')}连接体系 · 插入片段用量</h3></div>
        <div class="frow">
          <div class="fld"><span>载体用量</span><div class="ctl"><input id="lg-vc" type="number" inputmode="decimal" placeholder="如 50"><span class="u">ng</span></div></div>
          <div class="fld"><span>载体长度</span><div class="ctl"><input id="lg-vb" type="number" inputmode="decimal" placeholder="bp"><span class="u">bp</span></div></div>
        </div>
        <div class="frow">
          <div class="fld"><span>插入片段长度</span><div class="ctl"><input id="lg-ib" type="number" inputmode="decimal" placeholder="bp"><span class="u">bp</span></div></div>
          <div class="fld"><span>摩尔比</span><div class="ctl"><input id="lg-r" type="number" inputmode="decimal" value="3"><span class="u">: 1</span></div></div>
        </div>
        <div id="lg-out"></div>
      </div>
      <div class="card">
        <div class="card-t"><h3>${icon('zap')}转化效率</h3></div>
        <div class="frow">
          <div class="fld"><span>菌落数</span><div class="ctl"><input id="tr-cf" type="number" inputmode="decimal"></div></div>
          <div class="fld"><span>涂布 DNA 量</span><div class="ctl"><input id="tr-ng" type="number" inputmode="decimal"><span class="u">ng</span></div></div>
        </div>
        <div id="tr-out"></div>
      </div>
      <div class="card">
        <div class="card-t"><h3>${icon('wrench')}酶切体系助手（20 µL 标准）</h3></div>
        <div class="fld"><span>DNA 溶液体积</span><div class="ctl"><input id="dn-v" type="number" inputmode="decimal" placeholder="如 10"><span class="u">µL</span></div></div>
        <div class="frow">
          <div class="fld"><span>10× Buffer</span><div class="ctl"><input id="dn-b" type="number" inputmode="decimal" value="2"><span class="u">µL</span></div></div>
          <div class="fld"><span>酶</span><div class="ctl"><input id="dn-e" type="number" inputmode="decimal" value="1"><span class="u">µL</span></div></div>
        </div>
        <div id="dn-out"></div>
      </div>
      <div class="info-note">${icon('info')}<span>连接摩尔比一般 3:1（片段:载体），平末端可用 5–10:1；酶切体系酶体积勿超过总体积 10%（甘油抑制）。</span></div>`;
    const calc1=()=>{
      const vc=getNum('#lg-vc'), vb=getNum('#lg-vb'), ib=getNum('#lg-ib'), r=getNum('#lg-r')||3;
      const out=p.querySelector('#lg-out');
      if(isNaN(vc)||isNaN(vb)||vb<=0||isNaN(ib)||ib<=0){ out.innerHTML=''; return; }
      const ins=vc*(ib/vb)*r;
      out.innerHTML=resultCard({label:'需插入片段', value:fmtN(ins), unit:'ng',
        extra:`载体 ${fmtN(vc)} ng × (${fmtN(ib)}/${fmtN(vb)}) × ${fmtN(r)}`,
        copyText:`插入片段 ${fmtN(ins)} ng`});
    };
    const calc2=()=>{
      const cf=getNum('#tr-cf'), ng=getNum('#tr-ng');
      const out=p.querySelector('#tr-out');
      if(isNaN(cf)||isNaN(ng)||ng<=0){ out.innerHTML=''; return; }
      const eff=cf*1000/ng;
      out.innerHTML=resultCard({label:'转化效率', value:sciFmt(eff), unit:'CFU/µg DNA',
        extra: eff>1e8?'优秀（≥10⁸）':eff>1e7?'良好（10⁷–10⁸）':eff>1e6?'一般（10⁶–10⁷）':'偏低（<10⁶），检查感受态与操作',
        copyText:`${sciFmt(eff)} CFU/µg`});
    };
    const calc3=()=>{
      const v=getNum('#dn-v'), b=getNum('#dn-b')||0, e=getNum('#dn-e')||0;
      const out=p.querySelector('#dn-out');
      if(isNaN(v)){ out.innerHTML=''; return; }
      const w=20-v-b-e;
      out.innerHTML = w<0
        ? `<div class="warn-note" style="margin:0">${icon('alert')}<span>已超 20 µL，请缩小各组分量。</span></div>`
        : resultCard({label:'补 ddH₂O', value:fmtN(w), unit:'µL',
            extra:`总体积 20 µL = DNA ${fmtN(v)} + Buffer ${fmtN(b)} + 酶 ${fmtN(e)} + 水 ${fmtN(w)}`,
            copyText:`加水 ${fmtN(w)} µL`});
    };
    this.bind('#lg-vc,#lg-vb,#lg-ib,#lg-r,#tr-cf,#tr-ng,#dn-v,#dn-b,#dn-e', p, ()=>{calc1();calc2();calc3();});
  },

  /* ============ 培养与计数 ============ */
  gCulture(p){
    p.innerHTML=`
      <div class="card">
        <div class="card-t"><h3>${icon('list')}涂布计数 → 原液浓度</h3></div>
        <div class="frow">
          <div class="fld"><span>平皿菌落数</span><div class="ctl"><input id="pc-c" type="number" inputmode="decimal" placeholder="30–300 为佳"></div></div>
          <div class="fld"><span>稀释倍数</span><div class="ctl"><input id="pc-d" type="number" inputmode="decimal" placeholder="总稀释倍数，如 10000"></div></div>
          <div class="fld"><span>涂布体积</span><div class="ctl"><input id="pc-v" type="number" inputmode="decimal" value="100"><span class="u">µL</span></div></div>
        </div>
        <div id="pc-out"></div>
      </div>
      <div class="info-note">${icon('info')}<span>CFU/mL = 菌落数 × 稀释倍数 ÷ 涂布体积(mL)。选 30–300 菌落的平皿计数最可靠。</span></div>`;
    const calc=()=>{
      const c=getNum('#pc-c'), d=getNum('#pc-d'), v=getNum('#pc-v');
      const out=p.querySelector('#pc-out');
      if(isNaN(c)||isNaN(d)||isNaN(v)||v<=0){ out.innerHTML=''; return; }
      const cfu=c*d/(v/1000);
      out.innerHTML=resultCard({label:'原液浓度', value:sciFmt(cfu), unit:'CFU/mL',
        copyText:sciFmt(cfu)});
    };
    this.bind('#pc-c,#pc-d,#pc-v', p, calc);
  },

  /* ============ 蛋白与定量 ============ */
  gProtein(p){
    p.innerHTML=`
      <div class="card">
        <div class="card-t"><h3>${icon('vial')}质量浓度 ↔ 摩尔浓度</h3></div>
        <div class="frow">
          <div class="fld"><span>质量浓度</span><div class="ctl"><input id="pt-mg" type="number" inputmode="decimal" placeholder="如 2"><span class="u">mg/mL</span></div></div>
          <div class="fld"><span>分子量</span><div class="ctl"><input id="pt-kd" type="number" inputmode="decimal" placeholder="如 88.9"><span class="u">kDa</span></div></div>
        </div>
        <div id="pt-out"></div>
      </div>
      <div class="card">
        <div class="card-t"><h3>${icon('drop')}A260 核酸定量</h3></div>
        <div class="frow">
          <div class="fld"><span>A260 读数</span><div class="ctl"><input id="a-a" type="number" inputmode="decimal" placeholder="如 0.45"></div></div>
          <div class="fld"><span>稀释倍数</span><div class="ctl"><input id="a-d" type="number" inputmode="decimal" value="1"></div></div>
        </div>
        <div class="fld"><span>样品类型</span><div class="ctl"><select id="a-t">
          ${A260_FACTORS.map((f,i)=>`<option value="${i}" ${i===0?'selected':''}>${f.n}（${f.f} µg/mL per A260）</option>`).join('')}
        </select></div></div>
        <div id="a-out"></div>
      </div>
      <div class="card">
        <div class="card-t"><h3>${icon('sun')}A280 蛋白定量（Beer–Lambert）</h3></div>
        <div class="frow">
          <div class="fld"><span>A280</span><div class="ctl"><input id="b-a" type="number" inputmode="decimal"></div></div>
          <div class="fld"><span>消光系数 ε</span><div class="ctl"><input id="b-e" type="number" inputmode="decimal" placeholder="M⁻¹cm⁻¹"></div></div>
          <div class="fld"><span>光径</span><div class="ctl"><input id="b-l" type="number" inputmode="decimal" value="1"><span class="u">cm</span></div></div>
        </div>
        <div class="fld"><span>蛋白分子量</span><div class="ctl"><input id="b-kd" type="number" inputmode="decimal" placeholder="选填，用于换算 mg/mL"><span class="u">kDa</span></div></div>
        <div id="b-out"></div>
      </div>
      <div class="info-note">${icon('info')}<span>T7 RNAP ≈ 99 kDa。消光系数可用 ProtParam 按序列计算（如 T7 RNAP ε280 ≈ 140460 M⁻¹cm⁻¹）。</span></div>`;
    const calc1=()=>{
      const mg=getNum('#pt-mg'), kd=getNum('#pt-kd');
      const out=p.querySelector('#pt-out');
      if(isNaN(mg)||isNaN(kd)||kd<=0){ out.innerHTML=''; return; }
      const uM=mg/kd*1000; /* mg/mL ÷ g/mol: (mg/mL)/(kDa) = mmol/L → ×1000 = µM */
      out.innerHTML=resultCard({label:'摩尔浓度', value:fmtN(uM), unit:'µM',
        extra:`计算：c(µM) = mg/mL ÷ kDa × 1000`, copyText:String(uM.toFixed(1))});
    };
    const calc2=()=>{
      const a=getNum('#a-a'), d=getNum('#a-d')||1, t=+document.querySelector('#a-t').value;
      const out=p.querySelector('#a-out');
      if(isNaN(a)){ out.innerHTML=''; return; }
      const f=A260_FACTORS[t].f;
      const c=a*f*d;
      out.innerHTML=resultCard({label:`${A260_FACTORS[t].n} 浓度`, value:fmtN(c), unit:'µg/mL',
        extra:`A260=${fmtN(a)} × ${f} × 稀释${fmtN(d)}`, copyText:`${c.toFixed(1)} µg/mL`});
    };
    const calc3=()=>{
      const a=getNum('#b-a'), e=getNum('#b-e'), l=getNum('#b-l')||1, kd=getNum('#b-kd');
      const out=p.querySelector('#b-out');
      if(isNaN(a)||isNaN(e)||e<=0){ out.innerHTML=''; return; }
      const M=a/(e*l);
      let extra=`c = A/(ε×l) = ${fmtN(a)}/(${fmtN(e)}×${fmtN(l)})`;
      if(!isNaN(kd)&&kd>0){ const mg=M*kd*1000; extra+=`；≈ ${fmtN(mg)} mg/mL`; }
      out.innerHTML=resultCard({label:'摩尔浓度', value:fmtN(M*1e6), unit:'µM', extra, copyText:`${(M*1e6).toFixed(2)} µM`});
    };
    this.bind('#pt-mg,#pt-kd,#a-a,#a-d,#a-t,#b-a,#b-e,#b-l,#b-kd', p, ()=>{calc1();calc2();calc3();});
  },

  /* ============ RNA · IVT ============ */
  gRna(p){
    p.innerHTML=`
      <div class="card">
        <div class="card-t"><h3>${icon('sparkle')}IVT 反应体系计算器</h3><span class="badge teal">T7</span></div>
        <div class="fld" style="max-width:180px"><span>总体积</span><div class="ctl"><input id="iv-v" type="number" inputmode="decimal" value="20"><span class="u">µL</span></div></div>
        <div id="iv-rows"></div>
        <div class="ivt-sum" id="iv-sum"></div>
        <div id="iv-out"></div>
      </div>
      <div class="card">
        <div class="card-t"><h3>${icon('swap')}dsRNA 等摩尔退火配比</h3></div>
        <div class="frow">
          <div class="fld"><span>Sense 浓度</span><div class="ctl"><input id="an-cs" type="number" inputmode="decimal" placeholder="如 100"><span class="u">µM</span></div></div>
          <div class="fld"><span>Antisense 浓度</span><div class="ctl"><input id="an-ca" type="number" inputmode="decimal" placeholder="如 100"><span class="u">µM</span></div></div>
        </div>
        <div class="frow">
          <div class="fld"><span>退火终浓度</span><div class="ctl"><input id="an-cf" type="number" inputmode="decimal" placeholder="双链终浓度，如 20"><span class="u">µM</span></div></div>
          <div class="fld"><span>退火总体积</span><div class="ctl"><input id="an-vf" type="number" inputmode="decimal" placeholder="如 50"><span class="u">µL</span></div></div>
        </div>
        <div id="an-out"></div>
      </div>
      <div class="card">
        <div class="card-t"><h3>${icon('vial')}NTP 母液称量</h3></div>
        <div class="frow">
          <div class="fld" style="flex:2"><span>核苷酸</span><div class="ctl"><select id="nt-sel">
            ${NTP_MW.map((n,i)=>`<option value="${i}">${n.n}</option>`).join('')}<option value="c">自定义 MW</option>
          </select></div></div>
          <div class="fld"><span>自定义 MW</span><div class="ctl"><input id="nt-mw" type="number" inputmode="decimal" placeholder="g/mol"></div></div>
        </div>
        <div class="frow">
          <div class="fld"><span>目标浓度</span><div class="ctl"><input id="nt-c" type="number" inputmode="decimal" value="100"><span class="u">mM</span></div></div>
          <div class="fld"><span>体积</span><div class="ctl"><input id="nt-v" type="number" inputmode="decimal" value="1"><span class="u">mL</span></div></div>
        </div>
        <div id="nt-out"></div>
      </div>`;

    /* --- IVT --- */
    if(!this.state.ivt) this.state.ivt = JSON.parse(JSON.stringify(IVT_DEFAULT));
    const rowsBox=p.querySelector('#iv-rows');
    const drawIvt=()=>{
      const V=getNum('#iv-v')||0;
      const rows=this.state.ivt;
      rowsBox.innerHTML=`<table class="ivt-table">
        <tr><th style="width:30px"></th><th>组分</th><th>终浓度</th><th>母液</th><th style="text-align:right">体积</th></tr>
        ${rows.map((r,i)=>{
          const fb={'mM':1e-3,'M':1,'µM':1e-6,'ng/µL':1,'µg/mL':1e-3,'mg/mL':1,'U/µL':1}[r.fu]||1;
          const sb={'mM':1e-3,'M':1,'µM':1e-6,'ng/µL':1,'µg/mL':1e-3,'mg/mL':1,'U/µL':1}[r.su]||1;
          const vol=(r.on&&V>0)? (r.fin*fb*V)/(r.st*sb) : 0;
          r._vol=vol;
          return `<tr>
            <td><button class="ckx ${r.on?'on':''}" data-ivon="${i}">${icon('check')}</button></td>
            <td style="font-size:12.5px;font-weight:600">${r.n}</td>
            <td><input class="mini-in" type="number" inputmode="decimal" value="${r.fin}" data-ivfin="${i}"><span style="font-size:10.5px;color:var(--text-3)"> ${r.fu}</span></td>
            <td><input class="mini-in" type="number" inputmode="decimal" value="${r.st}" data-ivst="${i}"><span style="font-size:10.5px;color:var(--text-3)"> ${r.su}</span></td>
            <td style="text-align:right;font-weight:800;color:var(--primary);font-variant-numeric:tabular-nums">${vol?fmtN(vol,3):'—'}</td>
          </tr>`;}).join('')}
      </table>`;
      const sum=rows.reduce((s,r)=>s+(r.on?(r._vol||0):0),0);
      const water=V-sum;
      p.querySelector('#iv-sum').innerHTML=`<span>已用 / 总体积</span><span class="num">${fmtN(sum,3)} / ${fmtN(V)} µL</span>`;
      p.querySelector('#iv-out').innerHTML = !V? '' : water<0
        ? `<div class="warn-note" style="margin:0">${icon('alert')}<span>组分体积超过总体积 ${fmtN(V)} µL，请降低浓度或减小体系。</span></div>`
        : resultCard({label:'补无 RNase 水', value:fmtN(water,3), unit:'µL',
            extra:`37℃ 反应 2–4 h → DNase I 37℃ 15–30 min → LiCl/磁珠纯化。全程戴手套、用无 RNase 耗材。`,
            copyText:`加水 ${fmtN(water,3)} µL`});
      rowsBox.querySelectorAll('[data-ivon]').forEach(b=>b.onclick=()=>{ const i=+b.dataset.ivon; rows[i].on=!rows[i].on; drawIvt(); });
      rowsBox.querySelectorAll('[data-ivfin]').forEach(i=>i.onchange=()=>{ rows[+i.dataset.ivfin].fin=parseFloat(i.value)||0; drawIvt(); });
      rowsBox.querySelectorAll('[data-ivst]').forEach(i=>i.onchange=()=>{ rows[+i.dataset.ivst].st=parseFloat(i.value)||1; drawIvt(); });
    };
    this.bind('#iv-v', p, drawIvt);
    drawIvt();

    /* --- 退火 --- */
    const calcAn=()=>{
      const cs=getNum('#an-cs'), ca=getNum('#an-ca'), cf=getNum('#an-cf'), vf=getNum('#an-vf');
      const out=p.querySelector('#an-out');
      if(isNaN(cs)||isNaN(ca)||isNaN(cf)||isNaN(vf)||cs<=0||ca<=0||vf<=0){ out.innerHTML=''; return; }
      const pmol=cf*vf;
      const vs=pmol/cs, va=pmol/ca, water=vf-vs-va;
      out.innerHTML = water<0
        ? `<div class="warn-note" style="margin:0">${icon('alert')}<span>两条链体积已超过退火总体积，请提高终浓度或增大体系。</span></div>`
        : resultCard({label:'等摩尔退火方案', value:fmtN(vs,3), unit:'µL sense',
            extra:`antisense ${fmtN(va,3)} µL + 补水/退火缓冲液 ${fmtN(water,3)} µL。<br>程序：<b>95℃ 2–5 min → 缓慢降温至室温</b>（PCR 仪 0.1℃/s 或放金属浴自然冷却）→ 置冰上。`,
            copyText:`sense ${vs.toFixed(2)} µL + antisense ${va.toFixed(2)} µL + 水/缓冲液 ${water.toFixed(2)} µL`});
    };
    this.bind('#an-cs,#an-ca,#an-cf,#an-vf', p, calcAn);

    /* --- NTP --- */
    const calcNt=()=>{
      const sel=document.querySelector('#nt-sel').value;
      const mwC=getNum('#nt-mw');
      const mw = sel==='c'? mwC : NTP_MW[+sel].mw;
      const c=getNum('#nt-c'), v=getNum('#nt-v');
      const out=p.querySelector('#nt-out');
      const nameEl = sel==='c'? '自定义' : NTP_MW[+sel].n;
      if(isNaN(mw)||isNaN(c)||isNaN(v)){ out.innerHTML=''; return; }
      const g=c*1e-3*v*1e-3*mw; /* mol = mM*1e-3 × mL*1e-3 L */
      const m=smartUnit(g,'g');
      out.innerHTML=resultCard({label:`称量 ${nameEl}`, value:m.v, unit:m.u,
        extra: sel!=='c'? `游离酸 MW ${mw}；${NTP_MW[+sel].nm}。务必按试剂瓶标称量！`:'按所填 MW 计算。以瓶标为准！',
        copyText:`称取 ${m.v} ${m.u}`});
    };
    this.bind('#nt-sel,#nt-mw,#nt-c,#nt-v', p, calcNt);
  },

  /* ============ qPCR 定量 ============
     小工具：数字列表解析 / 均值±SD / 一元线性回归 / 标准曲线 SVG 图 */
  parseNums(str){
    return (String(str).match(/-?\d*\.?\d+(?:e-?\d+)?/gi)||[]).map(Number);
  },
  meanSd(arr){
    const a=arr.filter(v=>isFinite(v));
    const n=a.length; if(!n) return null;
    const m=a.reduce((s,v)=>s+v,0)/n;
    const sd=n>1? Math.sqrt(a.reduce((s,v)=>s+(v-m)*(v-m),0)/(n-1)) : 0;
    return {m, sd, n};
  },
  linreg(pts){
    const n=pts.length; if(n<2) return null;
    let sx=0,sy=0,sxx=0,sxy=0;
    for(const q of pts){ sx+=q.x; sy+=q.y; sxx+=q.x*q.x; sxy+=q.x*q.y; }
    const den=n*sxx-sx*sx; if(Math.abs(den)<1e-12) return null;
    const m=(n*sxy-sx*sy)/den, b=(sy-m*sx)/n;
    const my=sy/n; let ssr=0,sst=0;
    for(const q of pts){ ssr+=(q.y-(m*q.x+b))**2; sst+=(q.y-my)**2; }
    return {m, b, r2: sst>0 ? 1-ssr/sst : 1};
  },
  qcChart(pts, fit){
    const W=340,H=200,L=46,R=12,T=12,B=32;
    const xs=pts.map(q=>q.x), ys=pts.map(q=>q.y);
    let x0=Math.min(...xs), x1=Math.max(...xs), y0=Math.min(...ys), y1=Math.max(...ys);
    const px=(x1-x0)||1, py=(y1-y0)||1;
    x0-=px*0.06; x1+=px*0.06; y0-=py*0.10; y1+=py*0.10;
    const X=v=>L+(v-x0)/(x1-x0)*(W-L-R);
    const Y=v=>T+(v-y0)/(y1-y0)*(H-T-B);
    let grid='', ytk='';
    for(let i=0;i<=3;i++){
      const yv=y0+(y1-y0)*i/3, yy=Y(yv);
      grid+=`<line x1="${L}" y1="${yy}" x2="${W-R}" y2="${yy}" stroke="var(--border)" stroke-width="1"/>`;
      ytk+=`<text x="${L-6}" y="${yy+3.5}" text-anchor="end" font-size="9" fill="var(--text-3)">${yv.toFixed(1)}</text>`;
    }
    let xtk='';
    for(const q of pts){ xtk+=`<text x="${X(q.x)}" y="${H-B+13}" text-anchor="middle" font-size="9" fill="var(--text-3)">10${String(Math.round(q.x)).replace('-','⁻').replace(/\d/g,d=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[+d])}</text>`; }
    const line = fit? `<line x1="${X(x0)}" y1="${Y(fit.m*x0+fit.b)}" x2="${X(x1)}" y2="${Y(fit.m*x1+fit.b)}" stroke="var(--primary)" stroke-width="2" stroke-dasharray="1 0"/>`:'';
    const dots = pts.map(q=>`<circle cx="${X(q.x).toFixed(1)}" cy="${Y(q.y).toFixed(1)}" r="3.6" fill="var(--primary)" stroke="var(--surface)" stroke-width="1.5"/>`).join('');
    return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;margin:6px 0 2px">
      ${grid}<line x1="${L}" y1="${T}" x2="${L}" y2="${H-B}" stroke="var(--text-3)" stroke-width="1"/>
      <line x1="${L}" y1="${H-B}" x2="${W-R}" y2="${H-B}" stroke="var(--text-3)" stroke-width="1"/>
      ${ytk}${xtk}${line}${dots}
      <text x="${(L+W-R)/2}" y="${H-2}" text-anchor="middle" font-size="9.5" fill="var(--text-3)">log₁₀(相对浓度)</text>
      <text x="12" y="${(T+H-B)/2}" text-anchor="middle" font-size="9.5" fill="var(--text-3)" transform="rotate(-90 12 ${(T+H-B)/2})">Cq</text>
    </svg>`;
  },

  gQpcr(p){
    p.innerHTML=`
      <div class="chips" style="padding:0 0 10px" id="qg-chips">
        ${[['all','全部'],['abs','绝对定量'],['rel','相对定量'],['mix','反应体系']].map(t=>`<button class="chip ${t[0]==='all'?'on':''}" data-qg2="${t[0]}">${t[1]}</button>`).join('')}
      </div>
      <div class="info-note">${icon('info')}<span><b>绝对定量</b>：① 配标准品 10ⁿ 梯度 → ② 标准曲线验证效率 → ③ 由样品 Cq 反推拷贝数。<b>相对定量</b>：用 ΔΔCq 或 Pfaffl 直接算倍数变化。</span></div>
      <div class="card" data-qg="abs">
        <div class="card-t"><h3>${icon('target')}标准曲线 · 扩增效率</h3></div>
        <div class="fld"><span>粘贴数据（每行一条：相对浓度, Cq）</span>
          <div class="ctl"><textarea id="qc-sc" rows="4" placeholder="1, 15.32&#10;0.1, 18.65&#10;0.01, 21.98&#10;0.001, 25.30&#10;0.0001, 28.65" style="font-family:ui-monospace,Menlo,monospace"></textarea></div>
          <div class="hint">相对浓度＝相对最高浓度标准品的倍数（10× 梯度依次填 1 / 0.1 / 0.01 / 0.001 / 0.0001）；支持逗号、空格、Tab 分隔，可直接从 Excel 粘贴</div>
        </div>
        <button class="btn plain small" id="qc-demo">${icon('edit')}填入示例</button>
        <div id="qc-scout"></div>
      </div>

      <div class="card" data-qg="rel">
        <div class="card-t"><h3>${icon('sigma')}ΔΔCq 相对定量</h3></div>
        <div class="frow">
          <div class="fld"><span>靶基因 Cq · 处理组</span><div class="ctl"><input id="qc-tt" placeholder="18.2, 18.4, 18.1"></div></div>
          <div class="fld"><span>靶基因 Cq · 对照组</span><div class="ctl"><input id="qc-tc" placeholder="20.1, 20.0"></div></div>
        </div>
        <div class="frow">
          <div class="fld"><span>内参基因 Cq · 处理组</span><div class="ctl"><input id="qc-rt" placeholder="15.3, 15.4"></div></div>
          <div class="fld"><span>内参基因 Cq · 对照组</span><div class="ctl"><input id="qc-rc" placeholder="15.5"></div></div>
        </div>
        <div id="qc-ddout"></div>
      </div>

      <div class="card" data-qg="rel">
        <div class="card-t"><h3>${icon('sigma')}Pfaffl 效率校正相对定量</h3></div>
        <div class="frow">
          <div class="fld"><span>靶 Cq · 处理组</span><div class="ctl"><input id="qf-tt"></div></div>
          <div class="fld"><span>靶 Cq · 对照组</span><div class="ctl"><input id="qf-tc"></div></div>
        </div>
        <div class="frow">
          <div class="fld"><span>内参 Cq · 处理组</span><div class="ctl"><input id="qf-rt"></div></div>
          <div class="fld"><span>内参 Cq · 对照组</span><div class="ctl"><input id="qf-rc"></div></div>
        </div>
        <div class="frow">
          <div class="fld"><span>靶基因扩增系数</span><div class="ctl"><input id="qf-et" type="number" inputmode="decimal" value="2.0"><span class="u">倍/循环</span></div></div>
          <div class="fld"><span>内参扩增系数</span><div class="ctl"><input id="qf-er" type="number" inputmode="decimal" value="2.0"><span class="u">倍/循环</span></div></div>
        </div>
        <div id="qf-out"></div>
      </div>

      <div class="card" data-qg="abs">
        <div class="card-t"><h3>${icon('list')}标准品 10ⁿ 系列稀释方案</h3><span class="badge teal">梯度制备</span></div>
        <div class="frow">
          <div class="fld"><span>母液浓度</span><div class="ctl"><input id="sd-c0" type="number" inputmode="decimal" placeholder="如 1"><span class="u" id="sd-u0">copies/µL</span></div></div>
          <div class="fld"><span>母液单位</span><div class="ctl"><select id="sd-unit"><option value="copies">copies/µL</option><option value="ng">ng/µL</option></select></div></div>
        </div>
        <div class="fld" id="sd-bp-f" style="display:none"><span>片段长度（换算拷贝数用）</span><div class="ctl"><input id="sd-bp" type="number" inputmode="decimal" placeholder="如 300"><span class="u">bp</span></div></div>
        <div class="frow">
          <div class="fld"><span>梯度倍数</span><div class="ctl"><input id="sd-f" type="number" inputmode="decimal" value="10"><span class="u">倍</span></div></div>
          <div class="fld"><span>管数</span><div class="ctl"><input id="sd-n" type="number" inputmode="numeric" value="8"></div></div>
          <div class="fld"><span>每管体积</span><div class="ctl"><input id="sd-v" type="number" inputmode="decimal" value="100"><span class="u">µL</span></div></div>
        </div>
        <label class="fld" style="display:flex;align-items:center;gap:9px;font-size:14px;font-weight:600;color:var(--text)"><input type="checkbox" id="sd-first" checked style="width:18px;height:18px;accent-color:var(--primary)">最高浓度管直接用母液</label>
        <div id="sd-out"></div>
      </div>

      <div class="card" data-qg="abs">
        <div class="card-t"><h3>${icon('dna')}拷贝数换算</h3></div>
        <div class="frow">
          <div class="fld"><span>质量</span><div class="ctl"><input id="cn-ng" type="number" inputmode="decimal" placeholder="如 1"><span class="u">ng</span></div></div>
          <div class="fld"><span>片段长度</span><div class="ctl"><input id="cn-bp" type="number" inputmode="decimal" placeholder="bp"><span class="u">bp</span></div></div>
          <div class="fld"><span>类型</span><div class="ctl"><select id="cn-ty"><option value="660">dsDNA</option><option value="330">ssDNA</option><option value="340">ssRNA</option></select></div></div>
        </div>
        <div class="fld"><span>稀释总体积（选填）</span><div class="ctl"><input id="cn-v" type="number" inputmode="decimal" placeholder="如 100"><span class="u">µL</span></div></div>
        <div id="cn-out1"></div>
        <div class="sec-gap"></div>
        <div class="frow">
          <div class="fld"><span>标准曲线斜率 m</span><div class="ctl"><input id="ca-m" type="number" inputmode="decimal" placeholder="如 -3.32"></div></div>
          <div class="fld"><span>截距 b</span><div class="ctl"><input id="ca-b" type="number" inputmode="decimal" placeholder="如 36.8"></div></div>
        </div>
        <div class="frow">
          <div class="fld"><span>样品 Cq</span><div class="ctl"><input id="ca-cq" type="number" inputmode="decimal"></div></div>
          <div class="fld"><span>上样前稀释倍数</span><div class="ctl"><input id="ca-d" type="number" inputmode="decimal" value="1"></div></div>
        </div>
        <div id="cn-out2"></div>
      </div>

      <div class="card" data-qg="mix">
        <div class="card-t"><h3>${icon('flask')}qPCR 反应体系</h3><span class="badge teal">SYBR / 探针 / 染料</span></div>
        <div class="frow">
          <div class="fld"><span>总体积</span><div class="ctl"><input id="qm-v" type="number" inputmode="decimal" value="20"><span class="u">µL</span></div></div>
          <div class="fld"><span>引物终浓度</span><div class="ctl"><input id="qm-pf" type="number" inputmode="decimal" value="0.3"><span class="u">µM</span></div></div>
          <div class="fld"><span>引物母液</span><div class="ctl"><input id="qm-ps" type="number" inputmode="decimal" value="10"><span class="u">µM</span></div></div>
        </div>
        <div class="frow">
          <div class="fld"><span>探针终浓度</span><div class="ctl"><input id="qm-tf" type="number" inputmode="decimal" value="0.25"><span class="u">µM</span></div></div>
          <div class="fld"><span>探针母液</span><div class="ctl"><input id="qm-ts" type="number" inputmode="decimal" value="10"><span class="u">µM</span></div></div>
          <div class="fld"><span>cDNA 模板</span><div class="ctl"><input id="qm-tpl" type="number" inputmode="decimal" value="2"><span class="u">µL</span></div></div>
        </div>
        <div class="frow">
          <div class="fld"><span>染料终浓度（ROX 等）</span><div class="ctl"><input id="qm-df" type="number" inputmode="decimal" value="0"><span class="u">µM</span></div></div>
          <div class="fld"><span>染料母液</span><div class="ctl"><input id="qm-ds" type="number" inputmode="decimal" value="25"><span class="u">µM</span></div></div>
          <div class="fld"><span>模板预稀释</span><div class="ctl"><input id="qm-dil" type="number" inputmode="decimal" value="1"><span class="u">倍</span></div></div>
        </div>
        <div id="qm-out"></div>
      </div>
      <div class="info-note">${icon('info')}<span>MIQE 指南建议：扩增效率 90–110%、R²≥0.99、熔解曲线单峰；SYBR 体系引物终浓度常用 0.2–0.4 µM，探针 0.1–0.25 µM。</span></div>`;

    /* --- 标准曲线 --- */
    const calcSC=()=>{
      const out=p.querySelector('#qc-scout');
      const pts=[];
      p.querySelector('#qc-sc').value.split(/\n+/).forEach(line=>{
        const nums=(line.match(/-?\d*\.?\d+(?:e[+-]?\d+)?/gi)||[]).map(Number);
        if(nums.length>=2 && nums[0]>0 && isFinite(nums[1])) pts.push({x:Math.log10(nums[0]), y:nums[1]});
      });
      if(pts.length<2){ out.innerHTML=''; return; }
      const fit=this.linreg(pts);
      if(!fit || fit.m>=0){ out.innerHTML=`<div class="warn-note" style="margin:0">${icon('alert')}<span>至少需要 2 行有效数据，且斜率应为负值（浓度越高 Cq 越小）。请检查输入。</span></div>`; return; }
      const E=Math.pow(10,-1/fit.m)-1, pct=E*100;
      const verdict = (pct>=90&&pct<=110&&fit.r2>=0.99)? '<span class="badge green">优秀，可用于定量</span>'
        : (pct>=80&&pct<=120&&fit.r2>=0.98)? '<span class="badge orange">基本合格，建议优化</span>'
        : '<span class="badge red">不合格，需重新设计/优化</span>';
      const amp = Math.pow(10,-1/fit.m);
      const rows=pts.map(q=>`<tr><td class="num">${fmtN(Math.pow(10,q.x),3)}</td><td class="num">${q.y.toFixed(2)}</td><td class="num">${(fit.m*q.x+fit.b).toFixed(2)}</td><td class="num" style="color:var(--text-3)">${(q.y-(fit.m*q.x+fit.b)>=0?'+':'')+(q.y-(fit.m*q.x+fit.b)).toFixed(2)}</td></tr>`).join('');
      out.innerHTML=`
        <div class="result-card">
          <div class="rl">${icon('zap')}<span>扩增效率 E</span></div>
          <div class="rv num">${pct.toFixed(1)}<small>%</small></div>
          <div class="rx">斜率 <b>${fit.m.toFixed(3)}</b> · 截距 <b>${fit.b.toFixed(2)}</b> · R² <b>${fit.r2.toFixed(4)}</b> · 每循环扩增 ${amp.toFixed(2)} 倍 ${verdict}</div>
        </div>
        ${this.qcChart(pts,fit)}
        <div class="tbl-wrap"><table class="tbl"><tr><th>相对浓度</th><th>实测 Cq</th><th>拟合 Cq</th><th>残差</th></tr>${rows}</table></div>`;
    };
    this.bind('#qc-sc', p, calcSC);
    p.querySelector('#qc-demo').onclick=()=>{
      p.querySelector('#qc-sc').value='1, 15.32\n0.1, 18.65\n0.01, 21.98\n0.001, 25.30\n0.0001, 28.65';
      calcSC();
    };

    /* --- 标准品 10ⁿ 系列稀释方案 --- */
    const calcSD=()=>{
      const out=p.querySelector('#sd-out');
      const c0=getNum('#sd-c0'), unit=p.querySelector('#sd-unit').value;
      const f=getNum('#sd-f'), n=getNum('#sd-n'), V=getNum('#sd-v'), bp=getNum('#sd-bp');
      p.querySelector('#sd-u0').textContent = unit==='ng'?'ng/µL':'copies/µL';
      p.querySelector('#sd-bp-f').style.display = unit==='ng'?'':'none';
      if(isNaN(c0)||c0<=0||isNaN(f)||f<=1||isNaN(n)||n<1||n>15||isNaN(V)||V<=0){ out.innerHTML=''; return; }
      let c0cp=c0, uNote='';
      if(unit==='ng'){
        if(isNaN(bp)||bp<=0){ out.innerHTML=`<div class="warn-note" style="margin:0">${icon('alert')}<span>母液单位为 ng/µL 时，请填写片段长度以换算拷贝数。</span></div>`; return; }
        c0cp=c0*1e-9*6.022e23/(bp*660);
        uNote=`<br>母液换算：${fmtN(c0)} ng/µL × ${fmtN(bp)} bp ≈ ${sciFmt(c0cp)} copies/µL`;
      }
      const useStock=p.querySelector('#sd-first').checked;
      const c1=useStock? c0cp : c0cp/f;
      const take=V/f;
      const SUP='⁰¹²³⁴⁵⁶⁷⁸⁹';
      const supN=k=>'10'+String(k).replace('-','⁻').replace(/\d/g,d=>SUP[+d]);
      const lg=Math.log10(c1);
      const rows=[];
      for(let i=0;i<n;i++){
        const C=c1/Math.pow(f,i);
        const tag=(Math.abs(f-10)<1e-9)? ` <span class="badge blue">${supN(Math.round(lg)-i)}</span>`:'';
        const op=(i===0&&useStock)? '母液直接作为 1 号标准品' : `取${i===0?'母液':'上一管'} ${fmtN(take,3)} + 稀释液 ${fmtN(V-take,3)}`;
        rows.push(`<tr><td class="num">${i+1} 号管${tag}</td><td class="num" style="font-weight:700;color:var(--primary)">${sciFmt(C)}</td><td class="num" style="font-size:12px">${op}</td></tr>`);
      }
      const needStock=(useStock?0:take)+(n-1)*take;
      const tinyWarn = take<2 ? `<div class="warn-note" style="margin:0;margin-top:12px">${icon('alert')}<span>单次转移仅 ${fmtN(take,3)} µL，移液误差偏大；建议增大每管体积，或先做一次 100× 中间稀释再逐管 ${fmtN(f)}×。</span></div>` : '';
      out.innerHTML=`
        <div class="result-card">
          <div class="rl">${icon('zap')}<span>共 ${n} 管 · 每管 ${fmtN(V)} µL · 1 号管 ${sciFmt(c1)} copies/µL${uNote}</span></div>
          <div class="rx">共需母液约 ${fmtN(needStock,3)} µL，建议按 2 倍量准备；稀释液建议 TE 或 10mM Tris-HCl + 50µg/mL 载体 DNA（防低浓度标准品吸附管壁），每管混匀后再转移。</div>
        </div>
        <div class="tbl-wrap"><table class="tbl"><tr><th>管号</th><th>浓度 copies/µL</th><th>操作</th></tr>${rows.join('')}</table></div>${tinyWarn}`;
    };
    this.bind('#sd-c0,#sd-unit,#sd-bp,#sd-f,#sd-n,#sd-v', p, calcSD);
    p.querySelector('#sd-first').addEventListener('change', calcSD);
    calcSD();

    /* --- ΔΔCq --- */
    const calcDD=()=>{
      const out=p.querySelector('#qc-ddout');
      const tt=this.meanSd(this.parseNums(p.querySelector('#qc-tt').value));
      const tc=this.meanSd(this.parseNums(p.querySelector('#qc-tc').value));
      const rt=this.meanSd(this.parseNums(p.querySelector('#qc-rt').value));
      const rc=this.meanSd(this.parseNums(p.querySelector('#qc-rc').value));
      if(!tt||!tc||!rt||!rc){ out.innerHTML=''; return; }
      const dCqT=tt.m-rt.m, dCqC=tc.m-rc.m, dd=dCqT-dCqC;
      const fold=Math.pow(2,-dd);
      const dir=dd<-0.05?'上调 ⬆':dd>0.05?'下调 ⬇':'无显著变化 →';
      out.innerHTML=resultCard({label:'相对表达量（2^−ΔΔCq）', value:fmtN(fold), unit:'倍',
        extra:`ΔCq 处理组 ${dCqT.toFixed(2)} · 对照组 ${dCqC.toFixed(2)} · ΔΔCq ${dd>=0?'+':''}${dd.toFixed(2)} → ${dir}<br>
          重复数：靶 ${tt.n}/${tc.n}，内参 ${rt.n}/${rc.n}${tt.sd?`；SD ${tt.sd.toFixed(2)}/${tc.sd.toFixed(2)}`:''}`,
        copyText:`ΔΔCq=${dd.toFixed(2)}, fold change=${fold.toFixed(2)}`});
    };
    this.bind('#qc-tt,#qc-tc,#qc-rt,#qc-rc', p, calcDD);

    /* --- Pfaffl --- */
    const calcPF=()=>{
      const out=p.querySelector('#qf-out');
      const tt=getNum('#qf-tt'), tc=getNum('#qf-tc'), rt=getNum('#qf-rt'), rc=getNum('#qf-rc');
      const et=getNum('#qf-et'), er=getNum('#qf-er');
      if([tt,tc,rt,rc,et,er].some(isNaN) || et<=1 || er<=1){ out.innerHTML=''; return; }
      const ratio=Math.pow(et, tc-tt)/Math.pow(er, rc-rt);
      const dir=ratio>1.2?'上调 ⬆':ratio<0.83?'下调 ⬇':'≈无变化 →';
      out.innerHTML=resultCard({label:'效率校正相对表达量（Pfaffl）', value:fmtN(ratio), unit:'倍',
        extra:`(${et.toFixed(2)})^(${tc.toFixed(2)}−${tt.toFixed(2)}) ÷ (${er.toFixed(2)})^(${rc.toFixed(2)}−${rt.toFixed(2)}) → ${dir}`,
        copyText:`Pfaffl ratio=${ratio.toFixed(3)}`});
    };
    this.bind('#qf-tt,#qf-tc,#qf-rt,#qf-rc,#qf-et,#qf-er', p, calcPF);

    /* --- 拷贝数 --- */
    const calcCN=()=>{
      const ng=getNum('#cn-ng'), bp=getNum('#cn-bp'), f=parseFloat(p.querySelector('#cn-ty').value), v=getNum('#cn-v');
      const o1=p.querySelector('#cn-out1');
      if(!isNaN(ng)&&!isNaN(bp)&&bp>0&&ng>0){
        const copies=ng*1e-9*6.022e23/(bp*f);
        let extra=`拷贝数 = 质量 ÷ (${fmtN(bp)} bp × ${f} g/mol per ${/660/.test(String(f))?'bp':'nt'}) × 6.022×10²³`;
        if(!isNaN(v)&&v>0) extra+=`；即 ${sciFmt(copies/v)} copies/µL`;
        o1.innerHTML=resultCard({label:'拷贝数', value:sciFmt(copies), unit:'copies',
          extra, copyText:sciFmt(copies)});
      } else o1.innerHTML='';
      const m=getNum('#ca-m'), b=getNum('#ca-b'), cq=getNum('#ca-cq'), d=getNum('#ca-d')||1;
      const o2=p.querySelector('#cn-out2');
      if(!isNaN(m)&&!isNaN(b)&&m<0&&!isNaN(cq)){
        const copies=Math.pow(10,(cq-b)/m)*d;
        o2.innerHTML=resultCard({label:'样品拷贝数（由标准曲线反推）', value:sciFmt(copies), unit:'copies/µL',
          extra:`10^((Cq−b)/m)×稀释倍数 = 10^((${cq}−${b})/${m})×${d}。若标准品浓度单位不是 copies/µL，结果随标准品单位而定。`,
          copyText:sciFmt(copies)});
      } else o2.innerHTML='';
    };
    this.bind('#cn-ng,#cn-bp,#cn-ty,#cn-v,#ca-m,#ca-b,#ca-cq,#ca-d', p, calcCN);

    /* --- 反应体系 --- */
    const calcQM=()=>{
      const V=getNum('#qm-v'), pf=getNum('#qm-pf'), ps=getNum('#qm-ps'),
            tf=getNum('#qm-tf'), ts=getNum('#qm-ts'), tpl=getNum('#qm-tpl')||0,
            df=getNum('#qm-df')||0, ds=getNum('#qm-ds')||25, dil=getNum('#qm-dil')||1;
      const out=p.querySelector('#qm-out');
      if([V,pf,ps,tf,ts].some(isNaN) || V<=0){ out.innerHTML=''; return; }
      const mix=V/2, vt=(tf*V/ts)||0, vd=(df>0&&ds>0)? df*V/ds : 0;
      const pfV=pf*V/ps, prV=pf*V/ps;
      const water=V-mix-pfV-prV-vt-vd-tpl;
      if(water<0){ out.innerHTML=`<div class="warn-note" style="margin:0">${icon('alert')}<span>各组分体积已超过总体积 ${fmtN(V)} µL，请调整。</span></div>`; return; }
      const tplNote = dil>1 ? `<br>模板：cDNA 先按 1:${fmtN(dil)} 预稀释，取稀释液 ${fmtN(tpl,3)} µL（相当于原液 ${fmtN(tpl/dil,3)} µL）` : '';
      out.innerHTML=resultCard({label:'补无 RNase 水（ddH₂O）', value:fmtN(water,3), unit:'µL',
        extra:`2× Mix ${fmtN(mix,3)} + 上游引物 ${fmtN(pfV,3)} + 下游引物 ${fmtN(prV,3)} + 探针 ${fmtN(vt,3)}${vd>0?` + 染料 ${fmtN(vd,3)}`:''} + cDNA ${fmtN(tpl,3)} + 水 ${fmtN(water,3)} = ${fmtN(V)} µL${tplNote}<br>仅 SYBR 法：把探针终浓度填 0；多数 2× Mix 已含染料，ROX 按仪器要求填（ABI 常为 0.5×）`,
        copyText:`2×Mix ${mix}µL, 引物各 ${pfV.toFixed(2)}µL, 探针 ${vt.toFixed(2)}µL${vd>0?`, 染料 ${vd.toFixed(2)}µL`:''}, cDNA ${tpl}µL, 水 ${water.toFixed(2)}µL`});
    };
    this.bind('#qm-v,#qm-pf,#qm-ps,#qm-tf,#qm-ts,#qm-tpl,#qm-df,#qm-ds,#qm-dil', p, calcQM);

    /* --- 分组筛选：绝对定量 / 相对定量 / 反应体系 --- */
    const applyQG=()=>{
      const on=p.querySelector('#qg-chips .chip.on');
      const g=on?on.dataset.qg2:'all';
      p.querySelectorAll('[data-qg]').forEach(c=>{ c.style.display=(g==='all'||c.dataset.qg===g)?'':'none'; });
    };
    p.querySelectorAll('[data-qg2]').forEach(b=>b.onclick=()=>{
      p.querySelectorAll('[data-qg2]').forEach(x=>x.classList.toggle('on',x===b));
      applyQG();
    });
    applyQG();
  },

  /* ============ 速查表 ============ */
  gRef(p){
    p.innerHTML=`
      <div class="card-t" style="padding:0 4px"><h3>${icon('wrench')}常用限制酶</h3></div>
      <div class="tbl-wrap"><table class="tbl">
        <tr><th>酶</th><th>识别序列</th><th>类型</th><th>备注</th></tr>
        ${ENZYMES.map(e=>`<tr><td style="font-weight:700">${e.n}</td><td class="mono">${e.s}</td><td><span class="badge ${e.t.includes('IIS')?'violet':'gray'}">${e.t}</span></td><td style="font-size:12px;color:var(--text-2)">${e.o}</td></tr>`).join('')}
      </table></div>
      <div class="card-t" style="padding:0 4px;margin-top:6px"><h3>${icon('flask')}培养条件速查</h3></div>
      <div class="tbl-wrap"><table class="tbl">
        <tr><th>对象</th><th>培养基</th><th>温度</th><th>常用抗性</th></tr>
        ${CULTURE.map(c=>`<tr><td style="font-weight:700">${c.o}${c.n?`<div style="font-size:11.5px;color:var(--text-3);font-weight:400">${c.n}</div>`:''}</td><td>${c.m}</td><td class="num">${c.t}</td><td style="font-size:12.5px">${c.ab}</td></tr>`).join('')}
      </table></div>
      <div class="card-t" style="padding:0 4px;margin-top:6px"><h3>${icon('dna')}基因组 / 质粒大小</h3></div>
      <div class="tbl-wrap"><table class="tbl">
        <tr><th>基因组</th><th>大小</th><th>备注</th></tr>
        ${GENOMES.map(g=>`<tr><td style="font-weight:700">${g.o}</td><td class="num" style="font-weight:700;color:var(--primary)">${g.g}</td><td style="font-size:12px;color:var(--text-2)">${g.c}</td></tr>`).join('')}
      </table></div>
      <div class="tbl-wrap"><table class="tbl">
        <tr><th>常用质粒</th><th>大小</th><th>抗性</th><th>备注</th></tr>
        ${PLASMIDS.map(pl=>`<tr><td style="font-weight:700">${pl.n}</td><td class="num">${pl.s}</td><td>${pl.r}</td><td style="font-size:12px;color:var(--text-2)">${pl.o}</td></tr>`).join('')}
      </table></div>
      <div style="height:4px"></div>`;
  }
};
