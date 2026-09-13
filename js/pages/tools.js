/* 工具箱：序列分析 / 克隆与转化 / 培养计数 / 蛋白定量 / RNA·IVT / qPCR / 速查表 */
/* RT 逆转录默认组分（µL/孔，可改；rna:true 的组分不进预混、后加） */
const RT_DEFAULT = [
  {n:'5× RT Buffer', v:4},
  {n:'dNTP（各 10 mM）', v:1},
  {n:'逆转录酶', v:1},
  {n:'引物 oligo(dT) / 随机六聚体', v:1},
  {n:'RNase 抑制剂', v:0.5},
  {n:'RNA 模板', v:8, rna:true}
];
/* 布板基因配色（软底色/深文字，固定色值——打印时也能正常显示） */
const Q_COLORS = [['#EAF1FE','#2B6BF3'],['#E3F6ED','#0F9D63'],['#FCF1DF','#D97B06'],
  ['#EFEBFE','#7C5CFC'],['#E2F4F7','#0E8FA3'],['#FCE9EA','#DC3D43']];

PAGES.tools = {
  title:'工具箱',
  state:{cat:'seq', ivt:null, qtab:'setup', qctrl:null, rt:null},

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

  /* ---- 统计检验：t / F 分布 p 值（不完全贝塔函数） ---- */
  logGamma(x){
    const c=[76.18009172947146,-86.50532032941677,24.01409824083091,-1.231739572450155,0.1208650973866179e-2,-0.5395239384953e-5];
    let y=x, tmp=x+5.5;
    tmp-=(x+0.5)*Math.log(tmp);
    let ser=1.000000000190015;
    for(let j=0;j<6;j++) ser+=c[j]/++y;
    return -tmp+Math.log(2.5066282746310005*ser/x);
  },
  betacf(a,b,x){
    const MAXIT=200,EPS=3e-12,FPMIN=1e-300;
    const qab=a+b,qap=a+1,qam=a-1;
    let c=1,d=1-qab*x/qap;
    if(Math.abs(d)<FPMIN)d=FPMIN;
    d=1/d;let h=d;
    for(let m=1;m<=MAXIT;m++){
      const m2=2*m;
      let aa=m*(b-m)*x/((qam+m2)*(a+m2));
      d=1+aa*d;if(Math.abs(d)<FPMIN)d=FPMIN;
      c=1+aa/c;if(Math.abs(c)<FPMIN)c=FPMIN;
      d=1/d;h*=d*c;
      aa=-(a+m)*(qab+m)*x/((a+m2)*(qap+m2));
      d=1+aa*d;if(Math.abs(d)<FPMIN)d=FPMIN;
      c=1+aa/c;if(Math.abs(c)<FPMIN)c=FPMIN;
      d=1/d;const del=d*c;h*=del;
      if(Math.abs(del-1)<EPS)break;
    }
    return h;
  },
  betai(a,b,x){
    if(x<=0)return 0;
    if(x>=1)return 1;
    const bt=Math.exp(this.logGamma(a+b)-this.logGamma(a)-this.logGamma(b)+a*Math.log(x)+b*Math.log(1-x));
    return x<(a+1)/(a+b+2)? bt*this.betacf(a,b,x)/a : 1-bt*this.betacf(b,a,1-x)/b;
  },
  /* Welch t 检验（双侧 p 值） */
  tTestWelch(a,b){
    const n1=a.length,n2=b.length; if(n1<2||n2<2) return null;
    const m1=a.reduce((s,v)=>s+v,0)/n1, m2=b.reduce((s,v)=>s+v,0)/n2;
    const v1=a.reduce((s,v)=>s+(v-m1)**2,0)/(n1-1), v2=b.reduce((s,v)=>s+(v-m2)**2,0)/(n2-1);
    const se=v1/n1+v2/n2; if(se<=0) return null;
    const t=(m1-m2)/Math.sqrt(se);
    const df=se*se/(((v1/n1)**2)/(n1-1)+((v2/n2)**2)/(n2-1));
    if(!isFinite(df)||df<=0) return null;
    const p=this.betai(df/2,0.5,df/(df+t*t));
    return {t, df, p};
  },
  /* 单因素方差分析 */
  anova1w(groups){
    const all=groups.flat(), N=all.length, k=groups.length;
    if(k<2||N<=k) return null;
    const gm=all.reduce((s,v)=>s+v,0)/N;
    const ssb=groups.reduce((s,g)=>{ const m=g.reduce((x,y)=>x+y,0)/g.length; return s+g.length*(m-gm)**2; },0);
    const ssw=groups.reduce((s,g)=>{ const m=g.reduce((x,y)=>x+y,0)/g.length; return s+g.reduce((x,y)=>x+(y-m)**2,0); },0);
    const d1=k-1, d2=N-k;
    if(d2<=0||ssw<=0) return null;
    const F=(ssb/d1)/(ssw/d2);
    const p=this.betai(d2/2,d1/2,d2/(d2+d1*F));
    return {F, df1:d1, df2:d2, p};
  },
  sigStars(p){
    return p<0.0001?'****':p<0.001?'***':p<0.01?'**':p<0.05?'*':'ns';
  },

  /* ---- qPCR 结果柱状图：fold + 误差线 + 显著性星号 ---- */
  qBarChart(bars){
    const W=340,H=212,L=42,R=8,T=16,B=36;
    const ymax=Math.max(1e-9,...bars.map(b=>Math.max(b.hi||0,b.fold||0)))*1.3;
    const bw=(W-L-R)/bars.length, barW=Math.min(46,bw*0.6);
    const Y=v=>T+(1-Math.max(0,v)/ymax)*(H-T-B);
    let grid='',ytk='';
    for(let i=0;i<=4;i++){
      const yv=ymax*i/4, yy=Y(yv);
      grid+=`<line x1="${L}" y1="${yy}" x2="${W-R}" y2="${yy}" stroke="var(--border)" stroke-width="1"/>`;
      ytk+=`<text x="${L-5}" y="${yy+3.5}" text-anchor="end" font-size="9" fill="var(--text-3)" class="num">${yv>=10?yv.toFixed(0):yv.toFixed(1)}</text>`;
    }
    const els=bars.map((b,i)=>{
      const cx=L+bw*i+bw/2, x0=cx-barW/2;
      const y0=Y(b.fold), h=Y(0)-y0;
      const fill=b.ctrl?'var(--text-3)':'var(--primary)';
      let s=`<rect x="${x0.toFixed(1)}" y="${y0.toFixed(1)}" width="${barW.toFixed(1)}" height="${Math.max(1,h).toFixed(1)}" rx="3" fill="${fill}" ${b.ctrl?'opacity=".45"':''}/>`;
      s+=`<text x="${cx.toFixed(1)}" y="${(y0-4).toFixed(1)}" text-anchor="middle" font-size="9" font-weight="700" fill="var(--text-2)" class="num">${fmtN(b.fold,3)}</text>`;
      if(b.hi!=null&&b.lo!=null){
        s+=`<line x1="${cx.toFixed(1)}" y1="${Y(b.hi).toFixed(1)}" x2="${cx.toFixed(1)}" y2="${Y(b.lo).toFixed(1)}" stroke="var(--text-2)" stroke-width="1.4"/>`;
        s+=`<line x1="${(cx-4).toFixed(1)}" y1="${Y(b.hi).toFixed(1)}" x2="${(cx+4).toFixed(1)}" y2="${Y(b.hi).toFixed(1)}" stroke="var(--text-2)" stroke-width="1.4"/>`;
        s+=`<line x1="${(cx-4).toFixed(1)}" y1="${Y(b.lo).toFixed(1)}" x2="${(cx+4).toFixed(1)}" y2="${Y(b.lo).toFixed(1)}" stroke="var(--text-2)" stroke-width="1.4"/>`;
      }
      const starY=Y(b.hi!=null?b.hi:b.fold)-10;
      s+=`<text x="${cx.toFixed(1)}" y="${starY.toFixed(1)}" text-anchor="middle" font-size="11.5" font-weight="800" fill="${(b.star||'ns')==='ns'?'var(--text-3)':'var(--red)'}">${b.star||''}</text>`;
      const nm=b.name.length>5?b.name.slice(0,5)+'…':b.name;
      s+=`<text x="${cx.toFixed(1)}" y="${H-B+13}" text-anchor="middle" font-size="9" fill="var(--text-3)">${esc(nm)}</text>`;
      return s;
    }).join('');
    return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;margin:6px 0 2px">
      ${grid}<line x1="${L}" y1="${T}" x2="${L}" y2="${H-B}" stroke="var(--text-3)" stroke-width="1"/>
      <line x1="${L}" y1="${H-B}" x2="${W-R}" y2="${H-B}" stroke="var(--text-3)" stroke-width="1"/>
      ${ytk}${els}
      <text x="${(L+W-R)/2}" y="${H-2}" text-anchor="middle" font-size="9.5" fill="var(--text-3)">相对表达量（对照组 = 1）</text>
    </svg>`;
  },

  /* ---- 主入口：加样 / 布板 / 逆转录 / 结果分析 / 拷贝数 ---- */
  gQpcr(p){
    const st=this.state;
    if(!st.qtab) st.qtab='setup';
    p.innerHTML=`
      <div class="chips" style="padding:0 0 10px">
        ${[['setup','🧪 加样'],['plate','🔲 布板'],['rt','🔄 逆转录'],['ana','📊 结果分析'],['copy','🧮 拷贝数']].map(t=>`
          <button class="chip ${st.qtab===t[0]?'on':''}" data-qt="${t[0]}">${t[1]}</button>`).join('')}
      </div>
      <div id="q-panel"></div>`;
    p.querySelectorAll('[data-qt]').forEach(b=>b.onclick=()=>{ st.qtab=b.dataset.qt; this.gQpcr(p); });
    const box=p.querySelector('#q-panel');
    ({setup:()=>this.qSetup(box), plate:()=>this.qPlate(box), rt:()=>this.qRT(box),
      ana:()=>this.qAna(box), copy:()=>this.qCopy(box)})[st.qtab]();
  },

  /* ---- 加样：预混液计算（eq 管多配 · cDNA 后加）+ 标准品稀释 ---- */
  qSetup(box){
    box.innerHTML=`
      <div class="card">
        <div class="card-t"><h3>${icon('flask')}qPCR 加样 · 预混液计算</h3><span class="badge teal">eq 管多配 · cDNA 后加</span></div>
        <div class="frow">
          <div class="fld"><span>样品(cDNA)数</span><div class="ctl"><input id="qs-s" type="number" inputmode="numeric" value="4"></div></div>
          <div class="fld"><span>技术重复</span><div class="ctl"><input id="qs-r" type="number" inputmode="numeric" value="3"></div></div>
          <div class="fld"><span>NTC 孔/引物对</span><div class="ctl"><input id="qs-ntc" type="number" inputmode="numeric" value="1"></div></div>
        </div>
        <div class="frow">
          <div class="fld"><span>多配孔数</span><div class="ctl"><input id="qs-eq" type="number" inputmode="numeric" value="1"></div></div>
          <div class="fld"><span>引物对(基因)数</span><div class="ctl"><input id="qs-g" type="number" inputmode="numeric" value="2"></div></div>
          <div class="fld"><span>总体积/孔</span><div class="ctl"><input id="qs-v" type="number" inputmode="decimal" value="20"><span class="u">µL</span></div></div>
        </div>
        <div class="frow">
          <div class="fld"><span>2× Mix / 孔</span><div class="ctl"><input id="qs-mix" type="number" inputmode="decimal" value="10"><span class="u">µL</span></div></div>
          <div class="fld"><span>cDNA / 孔</span><div class="ctl"><input id="qs-tpl" type="number" inputmode="decimal" value="2"><span class="u">µL</span></div></div>
          <div class="fld"><span>引物终浓度</span><div class="ctl"><input id="qs-pf" type="number" inputmode="decimal" value="0.3"><span class="u">µM</span></div></div>
        </div>
        <div class="frow">
          <div class="fld"><span>引物母液</span><div class="ctl"><input id="qs-ps" type="number" inputmode="decimal" value="10"><span class="u">µM</span></div></div>
          <div class="fld"><span>探针终浓度(0=SYBR)</span><div class="ctl"><input id="qs-tf" type="number" inputmode="decimal" value="0"><span class="u">µM</span></div></div>
          <div class="fld"><span>探针母液</span><div class="ctl"><input id="qs-ts" type="number" inputmode="decimal" value="10"><span class="u">µM</span></div></div>
        </div>
        <div class="frow">
          <div class="fld"><span>染料终浓度(ROX)</span><div class="ctl"><input id="qs-df" type="number" inputmode="decimal" value="0"><span class="u">µM</span></div></div>
          <div class="fld"><span>染料母液</span><div class="ctl"><input id="qs-ds" type="number" inputmode="decimal" value="25"><span class="u">µM</span></div></div>
        </div>
        <div id="qs-out"></div>
      </div>
      <div class="info-note">${icon('info')}<span><b>省力做法</b>：同一引物对的所有孔共用一管预混（不含 cDNA），按「真实孔数 + NTC + 多配」配制；cDNA/标准品最后逐孔单独加，NTC 加水。每个引物对各配一管。</span></div>

      <div class="card">
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
      </div>`;

    /* --- 预混液 --- */
    const calcQS=()=>{
      const out=box.querySelector('#qs-out');
      const S=getNum('#qs-s'), R=getNum('#qs-r'), ntc=getNum('#qs-ntc')||0, eq=getNum('#qs-eq')||0;
      const G=getNum('#qs-g')||1, V=getNum('#qs-v'), tpl=getNum('#qs-tpl')||0, mix=getNum('#qs-mix');
      const pf=getNum('#qs-pf'), ps=getNum('#qs-ps');
      const tf=getNum('#qs-tf')||0, ts=getNum('#qs-ts')||10;
      const df=getNum('#qs-df')||0, ds=getNum('#qs-ds')||25;
      if([S,R,V,mix,pf,ps].some(isNaN)||S<1||R<1||V<=0||mix<=0||V>2000){ out.innerHTML=''; return; }
      const pfV=pf*V/ps, prV=pf*V/ps;
      const vt=(tf>0&&ts>0)? tf*V/ts : 0;
      const vd=(df>0&&ds>0)? df*V/ds : 0;
      const water=V-mix-pfV-prV-vt-vd-tpl;
      if(water<0){ out.innerHTML=`<div class="warn-note" style="margin:0">${icon('alert')}<span>各组分体积已超过每孔总体积 ${fmtN(V)} µL，请调整。</span></div>`; return; }
      const rxns=S*R+ntc, parts=rxns+eq, mm=V-tpl, mmWater=mm-mix-pfV-prV-vt-vd;
      const T2=x=>fmtN(x*parts,3), A2=x=>fmtN(x*parts*G,3);
      const row=(n,v,cls)=>`<tr><td style="white-space:nowrap">${n}</td><td class="num" style="text-align:right">${fmtN(v,3)}</td><td class="num" style="text-align:right">${T2(v)}</td><td class="num" style="text-align:right;font-weight:${cls?800:400};color:${cls?'var(--primary)':'inherit'}">${A2(v)}</td></tr>`;
      out.innerHTML=`
        <div class="result-card">
          <div class="rl">${icon('zap')}<span>每引物对预混液（不含 cDNA）</span></div>
          <div class="rv num">${fmtN(mm*parts,4)}<small>µL</small></div>
          <div class="rx">${parts} 份 × 每份 ${fmtN(mm,3)} µL（真实孔 ${S}×${R}=${S*R} + NTC ${ntc} + 多配 ${eq}）。分装 ${fmtN(mm,3)} µL/孔后，各孔加 cDNA ${fmtN(tpl,3)} µL；全部 ${G} 对引物共需 cDNA ${fmtN(tpl*S*R*G,3)} µL（NTC 加水，不加多配）。</div>
        </div>
        <div class="tbl-wrap"><table class="tbl">
          <tr><th>组分</th><th style="text-align:right">单孔 µL</th><th style="text-align:right">每引物对</th><th style="text-align:right">${fmtN(G)} 对合计</th></tr>
          ${row('2× Mix',mix)}
          ${row('F 引物',pfV)}${row('R 引物',prV)}
          ${vt?row('探针',vt):''}${vd?row('染料 ROX',vd):''}
          ${row('无酶水',mmWater)}
          <tr><td style="font-weight:800">预混合计</td><td class="num" style="text-align:right;font-weight:800">${fmtN(mm,3)}</td><td class="num" style="text-align:right;font-weight:800;color:var(--primary)">${T2(mm)}</td><td class="num" style="text-align:right;font-weight:800;color:var(--primary)">${A2(mm)}</td></tr>
          ${row('cDNA（后加）',tpl)}
        </table></div>
        <button class="btn plain small" id="qs-cp" style="margin-top:2px">${icon('copy')}复制加样方案</button>`;
      box.querySelector('#qs-cp').onclick=()=>UI.copy(
        `qPCR每孔(共${V}µL)：2×Mix ${fmtN(mix,3)} + F引物 ${fmtN(pfV,3)} + R引物 ${fmtN(prV,3)}${vt?` + 探针 ${fmtN(vt,3)}`:''}${vd?` + ROX ${fmtN(vd,3)}`:''} + cDNA ${fmtN(tpl,3)} + 水 ${fmtN(water,3)} µL；每引物对预混（不含cDNA）${parts}份×${fmtN(mm,3)}µL=${fmtN(mm*parts,4)}µL，cDNA后加`);
    };
    this.bind('#qs-s,#qs-r,#qs-ntc,#qs-eq,#qs-g,#qs-v,#qs-mix,#qs-tpl,#qs-pf,#qs-ps,#qs-tf,#qs-ts,#qs-df,#qs-ds', box, calcQS);

    /* --- 标准品 10ⁿ 系列稀释 --- */
    const calcSD=()=>{
      const out=box.querySelector('#sd-out');
      const c0=getNum('#sd-c0'), unit=box.querySelector('#sd-unit').value;
      const f=getNum('#sd-f'), n=getNum('#sd-n'), V=getNum('#sd-v'), bp=getNum('#sd-bp');
      box.querySelector('#sd-u0').textContent = unit==='ng'?'ng/µL':'copies/µL';
      box.querySelector('#sd-bp-f').style.display = unit==='ng'?'':'none';
      if(isNaN(c0)||c0<=0||isNaN(f)||f<=1||isNaN(n)||n<1||n>15||isNaN(V)||V<=0){ out.innerHTML=''; return; }
      let c0cp=c0, uNote='';
      if(unit==='ng'){
        if(isNaN(bp)||bp<=0){ out.innerHTML=`<div class="warn-note" style="margin:0">${icon('alert')}<span>母液单位为 ng/µL 时，请填写片段长度以换算拷贝数。</span></div>`; return; }
        c0cp=c0*1e-9*6.022e23/(bp*660);
        uNote=`<br>母液换算：${fmtN(c0)} ng/µL × ${fmtN(bp)} bp ≈ ${sciFmt(c0cp)} copies/µL`;
      }
      const useStock=box.querySelector('#sd-first').checked;
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
    this.bind('#sd-c0,#sd-unit,#sd-bp,#sd-f,#sd-n,#sd-v', box, calcSD);
    box.querySelector('#sd-first').addEventListener('change', calcSD);
    calcSD();
  },

  /* ---- 布板：96/384 孔自动排板（基因不跨板 · 重复不跨行 · 方案可保存） ---- */
  qPlate(box){
    const st=this.state;
    if(!st.bp) st.bp={ genes:[{n:'内参基因',ref:1},{n:'目的基因 1'},{n:'目的基因 2'}],
      samples:['对照 1','对照 2','对照 3','处理 1','处理 2','处理 3'].map(n=>({n,on:1})),
      R:3, ntc:1, eq:1, dir:'s', size:'96', vMix:10, vPrimer:0.6, vCdna:2, vWater:6.8, msg:'' };
    const b=st.bp;
    const SIZES={'96':{rows:8,cols:12,label:'96 孔 (8×12)'},'384':{rows:16,cols:24,label:'384 孔 (16×24)'}};
    const chunk=(arr,size)=>{ const o=[]; for(let i=0;i<arr.length;i+=size) o.push(arr.slice(i,i+size)); return o; };

    box.innerHTML=`
      <div class="card">
        <div class="card-t"><h3>${icon('dna')}基因 / 引物对</h3><span class="badge gray" id="bp-gcount"></span></div>
        <div class="bp-add"><div class="ctl" style="flex:1"><input id="bp-gin" placeholder="基因名，回车添加"></div><button class="btn primary small" id="bp-gadd">${icon('plus')}添加</button></div>
        <div id="bp-glist"></div>
        <div class="hint" style="font-size:12px;color:var(--text-3);margin-top:8px" id="bp-gwarn"></div>
      </div>

      <div class="card">
        <div class="card-t"><h3>${icon('vial')}样品 / cDNA 组别</h3>
          <div style="display:flex;gap:6px"><button class="btn plain small" id="bp-sall">全选</button><button class="btn plain small" id="bp-snone">全不选</button></div></div>
        <div class="bp-add"><div class="ctl" style="flex:1"><input id="bp-sin" placeholder="样品名，回车添加"></div><button class="btn primary small" id="bp-sadd">${icon('plus')}添加</button></div>
        <div id="bp-slist"></div>
        <div class="hint" style="font-size:12px;color:var(--text-3);margin-top:8px">取消勾选的组别不参与排板，但保留在名单里。</div>
      </div>

      <div class="card">
        <div class="card-t"><h3>${icon('sliders')}排板设置</h3></div>
        <div class="frow">
          <div class="fld"><span>技术重复</span><div class="ctl"><input id="bp-r" type="number" inputmode="numeric" value="${b.R}"></div></div>
          <div class="fld"><span>NTC / 基因</span><div class="ctl"><input id="bp-ntc" type="number" inputmode="numeric" value="${b.ntc}"></div></div>
          <div class="fld"><span>多配孔数</span><div class="ctl"><input id="bp-eq" type="number" inputmode="numeric" value="${b.eq}"></div></div>
        </div>
        <div class="frow">
          <div class="fld"><span>排布方向</span><div class="ctl"><select id="bp-dir">
            <option value="s" ${b.dir==='s'?'selected':''}>行=样品 列=基因</option>
            <option value="g" ${b.dir==='g'?'selected':''}>行=基因 列=样品</option></select></div></div>
          <div class="fld"><span>板规格</span><div class="ctl"><select id="bp-size">
            <option value="96" ${b.size==='96'?'selected':''}>96 孔 (8×12)</option>
            <option value="384" ${b.size==='384'?'selected':''}>384 孔 (16×24)</option></select></div></div>
        </div>
        <div class="frow">
          <div class="fld"><span>2× Mix µL/孔</span><div class="ctl"><input id="bp-vmix" type="number" inputmode="decimal" value="${b.vMix}"></div></div>
          <div class="fld"><span>总引物 µL/孔</span><div class="ctl"><input id="bp-vprimer" type="number" inputmode="decimal" value="${b.vPrimer}"></div></div>
        </div>
        <div class="frow">
          <div class="fld"><span>cDNA µL/孔</span><div class="ctl"><input id="bp-vcda" type="number" inputmode="decimal" value="${b.vCdna}"></div></div>
          <div class="fld"><span>H₂O µL/孔</span><div class="ctl"><input id="bp-vwater" type="number" inputmode="decimal" value="${b.vWater}"></div></div>
        </div>
        <div class="fld"><span>打印留言（显示在打印页右下角，选填）</span><div class="ctl"><input id="bp-msg" value="${escAttr(b.msg||'')}" placeholder="如 2026-09-13 qPCR 第 2 批"></div></div>
        <div class="hint" style="font-size:12px;color:var(--text-3)">排板规则：重复紧邻不跨行；基因装不下时整块移到下一块板（基因不跨板）。点孔位可查看内容。</div>
      </div>

      <div id="bp-out"></div>

      <div class="card">
        <div class="card-t"><h3>${icon('download')}方案保存</h3></div>
        <div class="bp-add"><div class="ctl" style="flex:1"><input id="bp-savein" placeholder="方案名称，如 T7 表达第3批"></div><button class="btn primary small" id="bp-save">${icon('check')}保存</button></div>
        <div id="bp-saves"></div>
      </div>`;

    /* --- 基因列表 --- */
    const drawGenes=()=>{
      box.querySelector('#bp-gcount').textContent=`${b.genes.length} 个`;
      const refGene=b.genes.find(g=>g.ref);
      box.querySelector('#bp-gwarn').innerHTML = !b.genes.length
        ? '请至少添加一个基因'
        : !refGene
        ? '⚠ <b style="color:var(--orange)">尚未设置内参基因</b>——相对定量必须有内参，点基因行的「设为内参」'
        : `内参基因：${esc(refGene.n)}`;
      box.querySelector('#bp-glist').innerHTML = b.genes.map((g,i)=>`
        <div class="bp-li">
          <span class="bp-dot" style="background:${Q_COLORS[i%Q_COLORS.length][0]};border:1.5px solid ${Q_COLORS[i%Q_COLORS.length][1]}"></span>
          <span class="bpt">${esc(g.n)}${g.ref?' <span class="badge blue">内参</span>':''}</span>
          ${g.ref?'':`<button class="btn plain small" data-gref="${i}">设为内参</button>`}
          <button class="icon-btn" style="width:30px;height:30px" data-gdel="${i}">${icon('x')}</button>
        </div>`).join('');
      box.querySelectorAll('[data-gref]').forEach(btn=>btn.onclick=()=>{
        b.genes.forEach(g=>g.ref=0); b.genes[+btn.dataset.gref].ref=1; drawGenes(); drawResult();
      });
      box.querySelectorAll('[data-gdel]').forEach(btn=>btn.onclick=()=>{
        b.genes.splice(+btn.dataset.gdel,1); drawGenes(); drawResult();
      });
    };
    const addGene=()=>{
      const inp=box.querySelector('#bp-gin'); const v=inp.value.trim();
      if(!v){ return; }
      b.genes.push({n:v,ref:b.genes.length?0:1}); inp.value=''; drawGenes(); drawResult();
    };
    box.querySelector('#bp-gadd').onclick=addGene;
    box.querySelector('#bp-gin').addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); addGene(); } });

    /* --- 样品列表 --- */
    const drawSamples=()=>{
      box.querySelector('#bp-slist').innerHTML = b.samples.map((s,i)=>`
        <div class="bp-li ${s.on?'':'off'}">
          <button class="ckx ${s.on?'on':''}" data-son="${i}">${icon('check')}</button>
          <span class="bpt">${esc(s.n)}</span>
          <button class="icon-btn" style="width:30px;height:30px" data-sdel="${i}">${icon('x')}</button>
        </div>`).join('');
      box.querySelectorAll('[data-son]').forEach(btn=>btn.onclick=()=>{
        const s=b.samples[+btn.dataset.son]; s.on=s.on?0:1; drawSamples(); drawResult();
      });
      box.querySelectorAll('[data-sdel]').forEach(btn=>btn.onclick=()=>{
        b.samples.splice(+btn.dataset.sdel,1); drawSamples(); drawResult();
      });
    };
    const addSample=()=>{
      const inp=box.querySelector('#bp-sin'); const v=inp.value.trim();
      if(!v){ return; }
      b.samples.push({n:v,on:1}); inp.value=''; drawSamples(); drawResult();
    };
    box.querySelector('#bp-sadd').onclick=addSample;
    box.querySelector('#bp-sin').addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); addSample(); } });
    box.querySelector('#bp-sall').onclick=()=>{ b.samples.forEach(s=>s.on=1); drawSamples(); drawResult(); };
    box.querySelector('#bp-snone').onclick=()=>{ b.samples.forEach(s=>s.on=0); drawSamples(); drawResult(); };

    /* --- 设置 --- */
    const readSet=()=>{
      b.R=Math.max(1,Math.round(getNum('#bp-r')||3));
      b.ntc=Math.max(0,Math.round(getNum('#bp-ntc')||0));
      b.eq=Math.max(0,Math.round(getNum('#bp-eq')||0));
      b.dir=box.querySelector('#bp-dir').value;
      b.size=box.querySelector('#bp-size').value;
      b.vMix=getNum('#bp-vmix')||0; b.vPrimer=getNum('#bp-vprimer')||0;
      b.vCdna=getNum('#bp-vcda')||0; b.vWater=getNum('#bp-vwater')||0;
      b.msg=box.querySelector('#bp-msg').value.trim();
    };

    /* --- 排板 --- */
    const layout=()=>{
      const dim=SIZES[b.size], span=b.R+b.ntc;
      const genes=b.genes.map(g=>g.n);
      const active=b.samples.filter(s=>s.on).map(s=>s.n);
      const perGenes = b.dir==='s'? Math.max(1,Math.floor(dim.cols/span)) : Math.max(1,Math.floor(dim.rows/span));
      const bandSize = b.dir==='s'? dim.rows : dim.cols;
      const plates=[];
      chunk(genes,perGenes).forEach(gc=>{
        chunk(active,bandSize).forEach(band=>{
          const pl={cells:{},chunk:gc,band};
          if(b.dir==='s'){
            let col=0;
            gc.forEach(g=>{ band.forEach((sm,si)=>{ for(let k=0;k<span;k++) pl.cells[si+'-'+(col+k)]={g,sm,gi:genes.indexOf(g),type:k>=b.R?'NTC':`重复${k+1}`,pos:si+'-'+(col+k)}; }); col+=span; });
          }else{
            let row=0;
            gc.forEach(g=>{ band.forEach((sm,si)=>{ for(let k=0;k<span;k++) pl.cells[(row+k)+'-'+si]={g,sm,gi:genes.indexOf(g),type:k>=b.R?'NTC':`重复${k+1}`,pos:(row+k)+'-'+si}; }); row+=span; });
          }
          plates.push(pl);
        });
      });
      return {plates, genes, active, dim, span};
    };
    const wellName=(r,c)=>String.fromCharCode(65+r)+(c+1);

    const drawResult=()=>{
      const out=box.querySelector('#bp-out');
      readSet();
      const dim=SIZES[b.size], span=b.R+b.ntc;
      if(!b.genes.length || !b.samples.some(s=>s.on)){
        out.innerHTML=`<div class="warn-note" style="margin:0">${icon('alert')}<span>请先添加基因，并至少勾选启用一个样品。</span></div>`; return;
      }
      if(span>(b.dir==='s'?dim.cols:dim.rows)){
        out.innerHTML=`<div class="warn-note" style="margin:0">${icon('alert')}<span>技术重复 + NTC = ${span}，超过该方向单板容量（${b.dir==='s'?dim.cols:dim.rows} 孔），请减少或换 ${b.size==='96'?'384':'96'} 孔板。</span></div>`; return;
      }
      const {plates}=layout();

      const grids=plates.map((pl,pi)=>{
        const maxRow=Math.max(...Object.keys(pl.cells).map(k=>+k.split('-')[0]))+1;
        const maxCol=b.dir==='s'?dim.cols:Math.max(...Object.keys(pl.cells).map(k=>+k.split('-')[1]))+1;
        let h=`<div class="card" style="box-shadow:none;margin-bottom:12px">
          <div class="card-t" style="margin-bottom:4px"><h3 style="font-size:14.5px">${icon('grid')}板 ${pi+1}</h3>
            <span style="font-size:11.5px;color:var(--text-3)">${esc(dim.label)} · ${esc(pl.chunk.join(' / '))} × ${esc(pl.band[0])}${pl.band.length>1?`–${esc(pl.band[pl.band.length-1])}`:''}</span></div>
          <div class="plate-wrap"><div class="plate" style="grid-template-columns:16px repeat(${maxCol},minmax(20px,1fr))">`;
        h+=`<div></div>${Array.from({length:maxCol},(_,c)=>`<div class="bx-collab num">${c+1}</div>`).join('')}`;
        for(let r=0;r<maxRow;r++){
          h+=`<div class="bx-rowlab">${String.fromCharCode(65+r)}</div>`;
          for(let c=0;c<maxCol;c++){
            const w=pl.cells[r+'-'+c];
            if(!w){ h+=`<div class="pl-well"></div>`; continue; }
            const [bg,fg]=Q_COLORS[w.gi%Q_COLORS.length];
            h+=`<button class="pl-well" data-bpw="${pi}|${r}-${c}" style="background:${bg};color:${fg}">${w.type==='NTC'?'N':w.type.slice(-1)}</button>`;
          }
        }
        h+=`</div></div></div>`;
        return h;
      }).join('');

      /* 明细 + CSV */
      const lines=[['板','孔','基因','样品','类型']];
      plates.forEach((pl,pi)=>{
        Object.values(pl.cells).forEach(w=>{
          const [r,c]=w.pos.split('-').map(Number);
          lines.push([pi+1,wellName(r,c),w.g,w.sm,w.type]);
        });
      });
      const csv=lines.map(r=>r.join(',')).join('\n');
      const totalWells=lines.length-1;

      /* 试剂汇总（loopseq 式：每基因 eq 管多配，cDNA 只按真实重复孔） */
      const perGeneWells=plates.reduce((s,pl)=>s+Object.values(pl.cells).filter(w=>w.g===plates[0].chunk[0]).length,0);
      const gStat=b.genes.map((g,gi)=>{
        const wells=plates.reduce((s,pl)=>s+Object.values(pl.cells).filter(w=>w.g===g.n).length,0);
        const parts=wells+b.eq;
        return { n:g.n, gi, wells, parts,
          mix:b.vMix*parts, primer:b.vPrimer*parts, water:b.vWater*parts,
          cdna:b.vCdna*activeRepWells(g.n) };
      });
      function activeRepWells(gn){
        let n=0; plates.forEach(pl=>Object.values(pl.cells).forEach(w=>{ if(w.g===gn&&w.type!=='NTC') n++; }));
        return n;
      }
      const sum=gStat.reduce((a,x)=>({mix:a.mix+x.mix,primer:a.primer+x.primer,water:a.water+x.water,cdna:a.cdna+x.cdna,wells:a.wells+x.wells}),{mix:0,primer:0,water:0,cdna:0,wells:0});
      const F3=x=>fmtN(x,3);
      const reagRows=gStat.map(x=>`<tr>
        <td style="white-space:nowrap"><span class="bp-dot" style="display:inline-block;vertical-align:-1px;background:${Q_COLORS[x.gi%Q_COLORS.length][0]};border:1.5px solid ${Q_COLORS[x.gi%Q_COLORS.length][1]}"></span> ${esc(x.n)}</td>
        <td class="num">${x.wells}</td><td class="num">${x.parts}</td>
        <td class="num">${F3(x.mix)}</td><td class="num">${F3(x.primer)}</td><td class="num">${F3(x.water)}</td>
        <td class="num">${F3(x.cdna)}</td><td class="num" style="color:var(--text-3)">${F3(x.mix+x.primer+x.water+x.cdna)}</td></tr>`).join('');
      const reagCsv=['基因,反应孔,预混份数,2×Mix(µL),总引物(µL),H2O(µL),cDNA(µL)',
        ...gStat.map(x=>`${x.n},${x.wells},${x.parts},${F3(x.mix)},${F3(x.primer)},${F3(x.water)},${F3(x.cdna)}`),
        `合计,${sum.wells},,${F3(sum.mix)},${F3(sum.primer)},${F3(sum.water)},${F3(sum.cdna)}`].join('\n');

      out.innerHTML=`
        <div class="result-card">
          <div class="rl">${icon('zap')}<span>共 ${plates.length} 块板 · ${totalWells} 个反应孔</span></div>
          <div class="rx">每基因 ${b.R} 个技术重复${b.ntc?` + ${b.ntc} 个 NTC（加水）`:''}，共 ${b.genes.length} 基因 × ${plates.reduce((s,pl)=>s+pl.band.length,0)?b.samples.filter(s=>s.on).length:0} 个启用样品。N = NTC。</div>
        </div>
        ${grids}
        <div class="card" style="box-shadow:none;margin-bottom:12px">
          <div class="card-t" style="margin-bottom:4px"><h3 style="font-size:14.5px">${icon('flask')}试剂汇总（每基因一管预混 · cDNA 只加真实孔）</h3></div>
          <div class="tbl-wrap"><table class="tbl">
            <tr><th>基因</th><th>孔数</th><th>预混份数</th><th>2×Mix</th><th>总引物</th><th>H₂O</th><th>cDNA</th><th>合计µL</th></tr>
            ${reagRows}
            <tr><td style="font-weight:800">合计</td><td class="num" style="font-weight:800">${sum.wells}</td><td></td>
              <td class="num" style="font-weight:800;color:var(--primary)">${F3(sum.mix)}</td>
              <td class="num" style="font-weight:800;color:var(--primary)">${F3(sum.primer)}</td>
              <td class="num" style="font-weight:800;color:var(--primary)">${F3(sum.water)}</td>
              <td class="num" style="font-weight:800;color:var(--primary)">${F3(sum.cdna)}</td><td></td></tr>
          </table></div>
          <div class="hint" style="font-size:12px;color:var(--text-3)">预混份数 = 反应孔 + 多配 ${b.eq}（酶/引物/水按多配计）；cDNA 只按真实重复孔计（NTC 加水）。</div>
        </div>
        <details class="bp-detail"><summary>排板明细表（${totalWells} 孔）</summary>
          <div class="tbl-wrap" style="max-height:340px;overflow-y:auto"><table class="tbl">
            <tr><th>板</th><th>孔</th><th>基因</th><th>样品</th><th>类型</th></tr>
            ${lines.slice(1).map(r=>`<tr><td class="num">${r[0]}</td><td class="num" style="font-weight:700">${r[1]}</td><td>${esc(r[2])}</td><td>${esc(r[3])}</td><td>${r[4]}</td></tr>`).join('')}
          </table></div>
        </details>
        <div class="frow" style="margin-top:10px">
          <button class="btn ghost small" id="bp-cp">${icon('copy')}排板 CSV</button>
          <button class="btn ghost small" id="bp-cpr">${icon('copy')}试剂清单</button>
          <button class="btn primary small" id="bp-print">${icon('print')}打印</button>
        </div>`;
      out.querySelector('#bp-cp').onclick=()=>UI.copy(csv);
      out.querySelector('#bp-cpr').onclick=()=>UI.copy(reagCsv);
      out.querySelectorAll('[data-bpw]').forEach(btn=>btn.onclick=()=>{
        const [pi,key]=btn.dataset.bpw.split('|');
        const w=plates[+pi].cells[key];
        if(!w) return;
        const [r,c]=key.split('-').map(Number);
        UI.sheet(`
          <div class="sh-head"><h3>${wellName(r,c)} · 板 ${+pi+1}</h3><button class="icon-btn" data-close>${icon('x')}</button></div>
          <div class="sh-body"><table class="tbl">
            <tr><td>基因</td><td style="font-weight:700">${esc(w.g)}</td></tr>
            <tr><td>样品 / cDNA</td><td style="font-weight:700">${esc(w.sm)}</td></tr>
            <tr><td>孔类型</td><td>${w.type}${w.type==='NTC'?'（加无酶水）':''}</td></tr>
            <tr><td>每孔体积</td><td class="num">${fmtN(b.vMix+b.vPrimer+b.vCdna+b.vWater,3)} µL</td></tr>
          </table></div>`);
      });
      out.querySelector('#bp-print').onclick=()=>{
        const old=document.getElementById('bp-printdoc'); if(old) old.remove();
        let h=`<div class="bp-printout" id="bp-printdoc"><h2>qPCR 排板单 · ${esc(DB.data.settings.labName)}</h2>`;
        plates.forEach((pl,pi)=>{
          const maxRow=Math.max(...Object.keys(pl.cells).map(k=>+k.split('-')[0]))+1;
          const maxCol=b.dir==='s'?dim.cols:Math.max(...Object.keys(pl.cells).map(k=>+k.split('-')[1]))+1;
          h+=`<h3>板 ${pi+1} · ${esc(dim.label)} · ${esc(pl.chunk.join(' / '))} × ${esc(pl.band.join(' / '))}</h3>`;
          h+=`<div class="plate" style="grid-template-columns:16px repeat(${maxCol},1fr)">`;
          h+=`<div></div>${Array.from({length:maxCol},(_,c)=>`<div class="bx-collab">${c+1}</div>`).join('')}`;
          for(let r=0;r<maxRow;r++){
            h+=`<div class="bx-rowlab">${String.fromCharCode(65+r)}</div>`;
            for(let c=0;c<maxCol;c++){
              const w=pl.cells[r+'-'+c];
              if(!w){ h+=`<div class="pl-well"></div>`; continue; }
              const [bg,fg]=Q_COLORS[w.gi%Q_COLORS.length];
              h+=`<div class="pl-well" style="background:${bg};color:${fg}">${w.type==='NTC'?'N':w.type.slice(-1)}</div>`;
            }
          }
          h+=`</div>`;
          h+=`<table><tr><th>孔</th><th>基因</th><th>样品</th><th>类型</th></tr>`;
          Object.values(pl.cells).forEach(w=>{
            const [r,c]=w.pos.split('-').map(Number);
            h+=`<tr><td>${wellName(r,c)}</td><td>${esc(w.g)}</td><td>${esc(w.sm)}</td><td>${w.type}</td></tr>`;
          });
          h+=`</table>`;
        });
        h+=`<div class="bp-msg">${esc(b.msg||'')}</div></div>`;
        document.body.insertAdjacentHTML('beforeend',h);
        window.print();
      };
    };
    this.bind('#bp-r,#bp-ntc,#bp-eq,#bp-dir,#bp-size,#bp-vmix,#bp-vprimer,#bp-vcda,#bp-vwater,#bp-msg', box, ()=>drawResult());

    /* --- 方案保存 / 读取 --- */
    const drawSaves=()=>{
      const list=DB.data.qplates||[];
      box.querySelector('#bp-saves').innerHTML = list.length? list.map(p=>`
        <div class="bp-li">
          <span class="bpt">${esc(p.name)} <span style="font-size:11px;color:var(--text-3);font-weight:400">${(p.savedAt||'').slice(0,10)}</span></span>
          <button class="btn plain small" data-pload="${p.id}">读取</button>
          <button class="icon-btn" style="width:30px;height:30px" data-pdel="${p.id}">${icon('trash')}</button>
        </div>`).join('')
        : `<div class="hint" style="font-size:12px;color:var(--text-3)">还没有保存的方案。排板设置会自动保留，保存方案可长期复用。</div>`;
      box.querySelectorAll('[data-pload]').forEach(btn=>btn.onclick=()=>{
        const p=(DB.data.qplates||[]).find(x=>x.id===btn.dataset.pload);
        if(!p) return;
        st.bp=JSON.parse(JSON.stringify(p.data));
        this.qPlate(box); UI.toast('已读取方案');
      });
      box.querySelectorAll('[data-pdel]').forEach(btn=>btn.onclick=async ()=>{
        if(await UI.confirm('删除方案','该保存方案将被删除，不可恢复。',{danger:true,okText:'删除'})){
          DB.data.qplates=(DB.data.qplates||[]).filter(x=>x.id!==btn.dataset.pdel);
          DB.save(); drawSaves(); UI.toast('已删除');
        }
      });
    };
    box.querySelector('#bp-save').onclick=()=>{
      const name=box.querySelector('#bp-savein').value.trim();
      if(!name){ UI.toast('请填写方案名称','err'); return; }
      DB.data.qplates=DB.data.qplates||[];
      DB.data.qplates.push({id:uid(),name,data:JSON.parse(JSON.stringify(b)),savedAt:new Date().toISOString()});
      DB.save(); box.querySelector('#bp-savein').value=''; drawSaves(); UI.toast('已保存方案');
    };
    drawSaves();
    drawGenes();
    drawSamples();
    drawResult();
  },

  /* ---- 逆转录：RT 上样（RNA 后加） ---- */
  qRT(box){
    if(!this.state.rt) this.state.rt=JSON.parse(JSON.stringify(RT_DEFAULT));
    box.innerHTML=`
      <div class="card">
        <div class="card-t"><h3>${icon('swap')}逆转录 RT · 上样计算</h3><span class="badge teal">RNA 后加</span></div>
        <div class="frow">
          <div class="fld"><span>样品数</span><div class="ctl"><input id="rt-n" type="number" inputmode="numeric" value="6"></div></div>
          <div class="fld"><span>多配份数</span><div class="ctl"><input id="rt-eq" type="number" inputmode="numeric" value="1"></div></div>
          <div class="fld"><span>总体积/孔</span><div class="ctl"><input id="rt-v" type="number" inputmode="decimal" value="20"><span class="u">µL</span></div></div>
        </div>
        <div class="fld"><span>各组分用量（µL/孔，可改）</span><div id="rt-rows"></div></div>
        <div id="rt-out"></div>
      </div>
      <div class="info-note">${icon('info')}<span>常用程序：<b>25℃ 10 min（随机引物）→ 42–55℃ 30–60 min → 70–85℃ 5–15 min 灭活</b>（以酶说明书为准）。RNA 与引物可先 65℃ 5 min 变性、冰上速冷再组装，产量更高；全程冰上操作、用无 RNase 耗材。RNA 体积不足的孔先用无 RNase 水补齐。</span></div>`;
    const rowsBox=box.querySelector('#rt-rows');
    const draw=()=>{
      const S=Math.max(0,getNum('#rt-n')||0), eq=Math.max(0,getNum('#rt-eq')||0), V=getNum('#rt-v')||0;
      const rows=this.state.rt;
      const parts=S+eq;
      const sum=rows.reduce((s,r)=>s+(r.v||0),0);
      const rna=rows.filter(r=>r.rna).reduce((s,r)=>s+(r.v||0),0);
      const water=V-sum;
      const mmV=V-rna;
      rowsBox.innerHTML=`<table class="ivt-table">
        <tr><th>组分</th><th>µL / 孔</th><th style="text-align:right">合计</th></tr>
        ${rows.map((r,i)=>`<tr>
          <td style="font-size:12.5px;font-weight:600">${r.n}${r.rna?' <span class="badge orange">后加</span>':''}</td>
          <td><input class="mini-in" type="number" inputmode="decimal" value="${r.v}" data-rtv="${i}"></td>
          <td style="text-align:right;font-weight:700;color:var(--primary)" class="num">${r.rna?fmtN(r.v*S,3):fmtN(r.v*parts,3)}</td>
        </tr>`).join('')}
        <tr><td style="font-weight:700">无 RNase 水</td>
          <td class="num" style="font-weight:800;color:var(--primary)">${water>=0?fmtN(water,3):'—'}</td>
          <td class="num" style="text-align:right;font-weight:700">${water>=0?fmtN(water*parts,3):'—'}</td></tr>
      </table>`;
      box.querySelector('#rt-out').innerHTML = !V||!S? '' : water<0
        ? `<div class="warn-note" style="margin-top:12px">${icon('alert')}<span>各组分体积已超过总体积 ${fmtN(V)} µL，请调整。</span></div>`
        : `<div class="result-card">
            <div class="rl">${icon('zap')}<span>预混液（不含 RNA）</span></div>
            <div class="rv num">${fmtN(mmV*parts,3)}<small>µL</small></div>
            <div class="rx">${parts} 份（样品 ${S} + 多配 ${eq}）× 每份 ${fmtN(mmV,3)} µL（= 总体积 − RNA）。每管分装 ${fmtN(mmV,3)} µL，再各加入 RNA ${fmtN(rna,3)} µL；RNA 共需 ${fmtN(rna*S,3)} µL（只按 ${S} 个真实样品计，不加多配）。</div>
          </div>`;
      rowsBox.querySelectorAll('[data-rtv]').forEach(i=>i.onchange=()=>{ rows[+i.dataset.rtv].v=parseFloat(i.value)||0; draw(); });
    };
    this.bind('#rt-n,#rt-eq,#rt-v', box, draw);
    draw();
  },

  /* ---- 结果分析：ΔΔCq 多组 + 显著性 + 标准曲线 ---- */
  qAna(box){
    box.innerHTML=`
      <div class="card">
        <div class="card-t"><h3>${icon('sigma')}ΔΔCq 多组分析</h3><span class="badge teal">ANOVA · t 检验</span></div>
        <div class="fld"><span>粘贴数据（每行一条：分组, 靶基因Cq, 内参Cq）</span>
          <div class="ctl"><textarea id="qa-in" rows="6" placeholder="对照, 24.1, 16.2&#10;对照, 24.3, 16.0&#10;对照, 23.9, 16.3&#10;处理, 22.4, 16.1&#10;处理, 22.6, 15.9&#10;处理, 22.2, 16.2" style="font-family:ui-monospace,Menlo,monospace"></textarea></div>
          <div class="hint">支持逗号 / Tab / 空格分隔，可直接从 Excel 粘贴；每行 = 一个生物学重复。每组 ≥2 个重复才能做显著性检验。</div>
        </div>
        <div class="frow">
          <div class="fld"><span>对照组</span><div class="ctl"><select id="qa-ctrl"></select></div></div>
          <div class="fld"><span>靶基因效率 E</span><div class="ctl"><input id="qa-et" type="number" inputmode="decimal" value="2"><span class="u">倍</span></div></div>
          <div class="fld"><span>内参效率 E</span><div class="ctl"><input id="qa-er" type="number" inputmode="decimal" value="2"><span class="u">倍</span></div></div>
        </div>
        <button class="btn plain small" id="qa-demo">${icon('edit')}填入示例</button>
        <div id="qa-out"></div>
      </div>
      <div class="info-note">${icon('info')}<span>统计在每孔 ΔCq（靶 − 内参）上进行：≥3 组用单因素 ANOVA，任意两组间用 Welch t 检验（Bonferroni 校正）；<b>*</b>p&lt;0.05、<b>**</b>p&lt;0.01、<b>***</b>p&lt;0.001、<b>****</b>p&lt;0.0001。效率填 2 = 标准 2^−ΔΔCq 法；填实测效率则按 Pfaffl 法校正。MIQE 建议：效率 90–110%、R²≥0.99。</span></div>

      <div class="card">
        <div class="card-t"><h3>${icon('target')}标准曲线 · 扩增效率</h3></div>
        <div class="fld"><span>粘贴数据（每行一条：相对浓度, Cq）</span>
          <div class="ctl"><textarea id="qc-sc" rows="4" placeholder="1, 15.32&#10;0.1, 18.65&#10;0.01, 21.98&#10;0.001, 25.30&#10;0.0001, 28.65" style="font-family:ui-monospace,Menlo,monospace"></textarea></div>
          <div class="hint">相对浓度＝相对最高浓度标准品的倍数（10× 梯度依次填 1 / 0.1 / 0.01 / 0.001 / 0.0001）；支持逗号、空格、Tab 分隔，可直接从 Excel 粘贴</div>
        </div>
        <button class="btn plain small" id="qc-demo">${icon('edit')}填入示例</button>
        <div id="qc-scout"></div>
      </div>`;

    /* --- ΔΔCq 多组分析 --- */
    const parseAna=txt=>{
      const rows=[];
      String(txt).split(/\n+/).forEach(line=>{
        if(!line.trim()) return;
        let f=line.split(/[,;\t]/).map(s=>s.trim());
        if(f.length<3){
          const tk=line.trim().split(/\s+/);
          if(tk.length>=3) f=[tk.slice(0,tk.length-2).join(' '),tk[tk.length-2],tk[tk.length-1]];
          else return;
        }
        const t=parseFloat(f[1]), r=parseFloat(f[2]);
        if(f[0]&&isFinite(t)&&isFinite(r)) rows.push({g:f[0],t,r});
      });
      return rows;
    };
    const runAna=()=>{
      const out=box.querySelector('#qa-out');
      const rows=parseAna(box.querySelector('#qa-in').value);
      if(rows.length<2){ out.innerHTML=''; return; }
      const groups=[];
      rows.forEach(x=>{
        let g=groups.find(y=>y.name===x.g);
        if(!g){ g={name:x.g,t:[],r:[],d:[]}; groups.push(g); }
        g.t.push(x.t); g.r.push(x.r); g.d.push(x.t-x.r);
      });
      /* 对照组下拉（保留已选项） */
      const sel=box.querySelector('#qa-ctrl');
      const cur=this.state.qctrl&&groups.some(g=>g.name===this.state.qctrl)? this.state.qctrl : groups[0].name;
      sel.innerHTML=groups.map(g=>`<option ${g.name===cur?'selected':''}>${esc(g.name)}</option>`).join('');
      const ctrl=groups.find(g=>g.name===sel.value)||groups[0];
      const Et=getNum('#qa-et')||2, Er=getNum('#qa-er')||2;
      if(Et<=1||Er<=1){ out.innerHTML=`<div class="warn-note" style="margin:0">${icon('alert')}<span>扩增效率应大于 1（如 1.9 / 2.0）。</span></div>`; return; }
      const mTc=ctrl.t.reduce((s,v)=>s+v,0)/ctrl.t.length;
      const mRc=ctrl.r.reduce((s,v)=>s+v,0)/ctrl.r.length;
      const stat=groups.map(g=>{
        const mD=this.meanSd(g.d);
        const fold=Math.pow(Et,mTc-g.t.reduce((s,v)=>s+v,0)/g.t.length)/Math.pow(Er,mRc-g.r.reduce((s,v)=>s+v,0)/g.r.length);
        const ratios=g.t.map((t,i)=>Math.pow(Et,mTc-t)/Math.pow(Er,mRc-g.r[i]));
        const sdR=this.meanSd(ratios);
        const tw=g===ctrl?null:this.tTestWelch(g.d,ctrl.d);
        return {name:g.name,n:g.d.length,d:g.d,mD,fold,sd:sdR?sdR.sd:null,tw,ctrl:g===ctrl};
      });
      const k=stat.length, comps=k-1;
      stat.forEach(s=>{ if(s.tw){ s.p=Math.min(1,s.tw.p*comps); s.star=this.sigStars(s.p); } });
      const av=this.anova1w(groups.map(g=>g.d));
      const bars=stat.map(s=>({name:s.name,fold:s.fold,hi:s.fold+(s.sd||0),lo:s.fold-(s.sd||0),star:s.star||(s.ctrl?'':(s.p<0.05?this.sigStars(s.p):'ns')),ctrl:s.ctrl}));
      const tbl=stat.map(s=>{
        const dd=s.mD.m-(stat.find(x=>x.ctrl).mD.m);
        const pTxt=s.ctrl?'—':(s.p<0.0001?'<0.0001':s.p.toFixed(4));
        return `<tr>
          <td style="font-weight:${s.ctrl?800:600};white-space:nowrap">${esc(s.name)}${s.ctrl?' <span class="badge blue">对照</span>':''}</td>
          <td class="num">${s.n}</td>
          <td class="num">${s.mD.m.toFixed(2)} ± ${s.mD.sd.toFixed(2)}</td>
          <td class="num">${s.ctrl?'0':(dd>=0?'+':'')+dd.toFixed(2)}</td>
          <td class="num" style="font-weight:800;color:var(--primary)">${fmtN(s.fold,3)}</td>
          <td class="num">${pTxt}</td>
          <td style="font-weight:800;color:${(s.star||'')==='ns'||s.ctrl?'var(--text-3)':'var(--red)'}">${s.ctrl?'':(s.star||'ns')}</td>
        </tr>`;
      }).join('');
      const anovaTxt = av? `单因素 ANOVA：F(${av.df1},${av.df2}) = ${av.F.toFixed(2)}，p ${av.p<0.0001?'<0.0001':'= '+av.p.toFixed(4)} ${av.p<0.05?`<span class="badge red">组间差异显著</span>`:`<span class="badge gray">组间无显著差异</span>`}`:'';
      const copyTxt=`ΔΔCq结果: `+stat.map(s=>`${s.name}: fold=${s.fold.toFixed(3)}${s.star?` (${s.star})`:''}`).join('; ')+(av?`; ANOVA p=${av.p<0.0001?'<0.0001':av.p.toFixed(4)}`:'');
      out.innerHTML=`
        ${this.qBarChart(bars)}
        <div class="tbl-wrap"><table class="tbl">
          <tr><th>组别</th><th>n</th><th>ΔCq</th><th>ΔΔCq</th><th>相对量</th><th>vs 对照 p*</th><th>显著性</th></tr>
          ${tbl}
        </table></div>
        <div class="info-note" style="margin:0">${icon('info')}<span>* vs 对照 p 为 Welch t 检验经 Bonferroni 校正（×${Math.max(1,comps)}）；柱上误差线 = ±SD。${anovaTxt}</span></div>
        <button class="btn plain small" id="qa-cp" style="margin-top:10px">${icon('copy')}复制结果</button>`;
      box.querySelector('#qa-cp').onclick=()=>UI.copy(copyTxt);
    };
    this.bind('#qa-in', box, runAna);
    box.querySelector('#qa-ctrl').addEventListener('change', ()=>{ this.state.qctrl=box.querySelector('#qa-ctrl').value; runAna(); });
    this.bind('#qa-et,#qa-er', box, runAna);
    box.querySelector('#qa-demo').onclick=()=>{
      box.querySelector('#qa-in').value='对照, 24.1, 16.2\n对照, 24.3, 16.0\n对照, 23.9, 16.3\n处理, 22.4, 16.1\n处理, 22.6, 15.9\n处理, 22.2, 16.2';
      runAna();
    };
    runAna();

    /* --- 标准曲线 --- */
    const calcSC=()=>{
      const out=box.querySelector('#qc-scout');
      const pts=[];
      box.querySelector('#qc-sc').value.split(/\n+/).forEach(line=>{
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
    this.bind('#qc-sc', box, calcSC);
    box.querySelector('#qc-demo').onclick=()=>{
      box.querySelector('#qc-sc').value='1, 15.32\n0.1, 18.65\n0.01, 21.98\n0.001, 25.30\n0.0001, 28.65';
      calcSC();
    };
  },

  /* ---- 拷贝数换算 ---- */
  qCopy(box){
    box.innerHTML=`
      <div class="card">
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
      </div>`;
    const calcCN=()=>{
      const ng=getNum('#cn-ng'), bp=getNum('#cn-bp'), f=parseFloat(box.querySelector('#cn-ty').value), v=getNum('#cn-v');
      const o1=box.querySelector('#cn-out1');
      if(!isNaN(ng)&&!isNaN(bp)&&bp>0&&ng>0){
        const copies=ng*1e-9*6.022e23/(bp*f);
        let extra=`拷贝数 = 质量 ÷ (${fmtN(bp)} bp × ${f} g/mol per ${/660/.test(String(f))?'bp':'nt'}) × 6.022×10²³`;
        if(!isNaN(v)&&v>0) extra+=`；即 ${sciFmt(copies/v)} copies/µL`;
        o1.innerHTML=resultCard({label:'拷贝数', value:sciFmt(copies), unit:'copies',
          extra, copyText:sciFmt(copies)});
      } else o1.innerHTML='';
      const m=getNum('#ca-m'), b=getNum('#ca-b'), cq=getNum('#ca-cq'), d=getNum('#ca-d')||1;
      const o2=box.querySelector('#cn-out2');
      if(!isNaN(m)&&!isNaN(b)&&m<0&&!isNaN(cq)){
        const copies=Math.pow(10,(cq-b)/m)*d;
        o2.innerHTML=resultCard({label:'样品拷贝数（由标准曲线反推）', value:sciFmt(copies), unit:'copies/µL',
          extra:`10^((Cq−b)/m)×稀释倍数 = 10^((${cq}−${b})/${m})×${d}。若标准品浓度单位不是 copies/µL，结果随标准品单位而定。`,
          copyText:sciFmt(copies)});
      } else o2.innerHTML='';
    };
    this.bind('#cn-ng,#cn-bp,#cn-ty,#cn-v,#ca-m,#ca-b,#ca-cq,#ca-d', box, calcCN);
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
