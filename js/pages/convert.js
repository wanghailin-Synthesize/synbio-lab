/* 单位换算：通用换算 + 浓度(带MW) + 温度 + 离心力 + 核酸 + 菌体密度 */
PAGES.convert = {
  title:'单位换算',
  state:{cat:'conc'},

  CATS:[
    ['conc','浓度'],['mass','质量'],['vol','体积'],['mol','摩尔量'],['len','长度'],
    ['temp','温度'],['rcf','离心力'],['dna','核酸'],['od','菌体密度']
  ],

  LINEAR:{
    mass:{u:[['t',1e3],['kg',1],['g',1e-3],['mg',1e-6],['µg',1e-9],['ng',1e-12],['pg',1e-15]], base:'kg', d:'质量'},
    vol:{u:[['L',1],['mL',1e-3],['µL',1e-6],['nL',1e-9],['pL',1e-12],['滴(≈50µL)',5e-5]], base:'L', d:'体积'},
    mol:{u:[['mol',1],['mmol',1e-3],['µmol',1e-6],['nmol',1e-9],['pmol',1e-12]], base:'mol', d:'摩尔量'},
    len:{u:[['m',1],['cm',1e-2],['mm',1e-3],['µm',1e-6],['nm',1e-9]], base:'m', d:'长度'}
  },
  CONC_U:{ 'M':1, 'mM':1e-3, 'µM':1e-6, 'nM':1e-9,
           'g/L':1, 'mg/mL':1, 'µg/mL':1e-3, '% (w/v)':10 },
  isMol:u=>u in {M:1,'mM':1,'µM':1,'nM':1},

  render(el){
    const st=this.state;
    el.innerHTML = `
      <div class="page-head"><div><div class="ht">单位换算</div><div class="hs">输入即时换算 · 点结果可复制</div></div></div>
      <div class="chips">${this.CATS.map(c=>`<button class="chip ${st.cat===c[0]?'on':''}" data-cat="${c[0]}">${c[1]}</button>`).join('')}</div>
      <div class="content"><div id="cv-panel"></div></div>`;

    el.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{ st.cat=b.dataset.cat; this.render(el); });
    this.renderPanel(el.querySelector('#cv-panel'));
  },

  renderPanel(panel){
    const st=this.state;
    if(st.cat==='conc') return this.panelConc(panel);
    if(st.cat==='temp') return this.panelTemp(panel);
    if(st.cat==='rcf')  return this.panelRcf(panel);
    if(st.cat==='dna')  return this.panelDna(panel);
    if(st.cat==='od')   return this.panelOd(panel);
    return this.panelLinear(panel);
  },

  /* 通用线性换算 */
  panelLinear(panel){
    const cfg=this.LINEAR[this.state.cat];
    panel.innerHTML=`
      <div class="card">
        <div class="fld"><span>数值</span><div class="ctl"><input id="c-v" type="number" inputmode="decimal" placeholder="输入数值"><span class="u"></span></div></div>
        <div class="frow">
          <div class="fld"><span>从</span><div class="ctl"><select id="c-a">${cfg.u.map(u=>`<option value="${u[0]}">${u[0]}</option>`).join('')}</select></div></div>
          <div style="display:flex;align-items:center;padding-top:26px"><button class="icon-btn" id="c-swap">${icon('swap')}</button></div>
          <div class="fld"><span>到</span><div class="ctl"><select id="c-b">${cfg.u.map((u,i)=>`<option value="${u[0]}" ${i===1?'selected':''}>${u[0]}</option>`).join('')}</select></div></div>
        </div>
        <div id="c-out"></div>
      </div>
      <div class="info-note">${icon('info')}<span>${cfg.d}换算基于 10³ 进制。</span></div>`;
    const calc=()=>{
      const v=getNum('#c-v'), a=document.querySelector('#c-a').value, b=document.querySelector('#c-b').value;
      if(isNaN(v)){ panel.querySelector('#c-out').innerHTML=''; return; }
      const base = v*this.LINEAR[this.state.cat].u.find(x=>x[0]===a)[1];
      const r = base/this.LINEAR[this.state.cat].u.find(x=>x[0]===b)[1];
      panel.querySelector('#c-out').innerHTML=resultCard({label:'换算结果', value:fmtN(r), unit:b, copyText:String(r)});
    };
    this.bindCalc('#c-v,#c-a,#c-b', panel, calc);
    panel.querySelector('#c-swap').onclick=()=>{
      const a=document.querySelector('#c-a'),b=document.querySelector('#c-b');
      const t=a.value; a.value=b.value; b.value=t; calc();
    };
  },

  /* 浓度换算（跨摩尔/质量需分子量） */
  panelConc(panel){
    const units=Object.keys(this.CONC_U);
    panel.innerHTML=`
      <div class="card">
        <div class="fld"><span>数值</span><div class="ctl"><input id="c-v" type="number" inputmode="decimal" placeholder="如 100"></div></div>
        <div class="frow">
          <div class="fld"><span>从</span><div class="ctl"><select id="c-a">${units.map(u=>`<option ${u==='mM'?'selected':''}>${u}</option>`).join('')}</select></div></div>
          <div class="fld"><span>到</span><div class="ctl"><select id="c-b">${units.map(u=>`<option ${u==='mg/mL'?'selected':''}>${u}</option>`).join('')}</select></div></div>
        </div>
        <div class="fld" id="c-mw-f"><span>分子量 MW</span><div class="ctl"><input id="c-mw" type="number" inputmode="decimal" placeholder="如 氨苄青霉素钠 371.4"><span class="u">g/mol</span></div><div class="hint">在摩尔浓度（M/mM/µM）与质量浓度（mg/mL 等）之间换算时需要；同类型互转可不填</div></div>
        <div id="c-out"></div>
      </div>
      <div class="info-note">${icon('info')}<span>1% (w/v) = 10 mg/mL。例：100 mg/mL 氨苄青霉素钠（MW 371.4）≈ 269 mM。盐型/水合物不同 MW 有差异，以试剂瓶标为准。</span></div>`;
    const calc=()=>{
      const v=getNum('#c-v'), a=document.querySelector('#c-a').value, b=document.querySelector('#c-b').value;
      const mw=getNum('#c-mw');
      const box=panel.querySelector('#c-mw-f');
      const needMW = this.isMol(a)!==this.isMol(b);
      box.style.display = needMW?'':'none';
      if(isNaN(v)){ panel.querySelector('#c-out').innerHTML=''; return; }
      if(needMW && isNaN(mw)){ panel.querySelector('#c-out').innerHTML=`<div class="warn-note">${icon('alert')}<span>请在上方填写化合物的分子量 MW</span></div>`; return; }
      const gL = v*this.CONC_U[a] * (this.isMol(a)? mw : 1);
      const r = gL / this.CONC_U[b] / (this.isMol(b)? mw : 1);
      const extra = this.isMol(a)&&this.isMol(b) ? '' : `计算式：${fmtN(v)} ${a} × MW(${fmtN(mw)}) → ${fmtN(gL)} g/L`;
      panel.querySelector('#c-out').innerHTML=resultCard({label:'换算结果', value:fmtN(r), unit:b, extra, copyText:String(r)});
    };
    this.bindCalc('#c-v,#c-a,#c-b,#c-mw', panel, calc);
  },

  /* 温度 */
  panelTemp(panel){
    panel.innerHTML=`
      <div class="card">
        <div class="fld"><span>温度</span><div class="ctl"><input id="c-v" type="number" inputmode="decimal" placeholder="输入温度"><select id="c-a" style="padding-left:10px"><option>℃</option><option>℉</option><option>K</option></select></div></div>
        <div id="c-out"></div>
      </div>`;
    const calc=()=>{
      const v=getNum('#c-v'), a=document.querySelector('#c-a').value;
      if(isNaN(v)){ panel.querySelector('#c-out').innerHTML=''; return; }
      const C = a==='℃'? v : a==='K'? v-273.15 : (v-32)*5/9;
      const F=C*9/5+32, K=C+273.15;
      panel.querySelector('#c-out').innerHTML=resultCard({label:'换算结果',
        value:`${fmtN(C)} ℃ / ${fmtN(F)} ℉ / ${fmtN(K)} K`, copyText:`${C}℃`});
    };
    this.bindCalc('#c-v,#c-a', panel, calc);
  },

  /* 离心力 g ↔ RPM */
  panelRcf(panel){
    panel.innerHTML=`
      <div class="card">
        <div class="fld"><span>转子半径 r</span><div class="ctl"><input id="c-r" type="number" inputmode="decimal" value="8"><span class="u">cm</span></div><div class="hint">最大转速半径（转子标注 Rmax）</div></div>
        <div class="fld"><span>数值</span><div class="ctl"><input id="c-v" type="number" inputmode="decimal" placeholder="输入"><select id="c-a" style="padding-left:10px"><option>×g</option><option>RPM</option></select></div></div>
        <div id="c-out"></div>
      </div>
      <div class="info-note">${icon('info')}<span>RCF = 1.118×10⁻⁵ × r(cm) × RPM²。手册中的 g 值需按你的转子半径换算。</span></div>`;
    const calc=()=>{
      const r=getNum('#c-r'), v=getNum('#c-v'), a=document.querySelector('#c-a').value;
      const out=panel.querySelector('#c-out');
      if(isNaN(r)||isNaN(v)){ out.innerHTML=''; return; }
      let res;
      if(a==='×g'){ const rpm=Math.sqrt(v/(1.118e-5*r)); res=resultCard({label:'对应转速', value:fmtN(rpm), unit:'RPM', copyText:String(Math.round(rpm))}); }
      else{ const g=1.118e-5*r*v*v; res=resultCard({label:'对应相对离心力', value:fmtN(g), unit:'×g', extra:`≈ ${sciFmt(g)} g`, copyText:String(Math.round(g))}); }
      out.innerHTML=res;
    };
    this.bindCalc('#c-r,#c-v,#c-a', panel, calc);
  },

  /* 核酸 */
  panelDna(panel){
    panel.innerHTML=`
      <div class="card">
        <div class="card-t"><h3>${icon('dna')}长度 ↔ 分子量</h3></div>
        <div class="frow">
          <div class="fld"><span>长度</span><div class="ctl"><input id="d-bp" type="number" inputmode="decimal" placeholder="bp / nt"></div></div>
          <div class="fld"><span>类型</span><div class="ctl"><select id="d-type">
            <option value="ds">双链 DNA（660 Da/bp）</option>
            <option value="ss">单链 DNA（330 Da/nt）</option>
            <option value="rna">单链 RNA（340 Da/nt）</option>
            <option value="dsrna">双链 RNA（680 Da/bp）</option>
          </select></div></div>
        </div>
        <div id="d-out1"></div>
      </div>
      <div class="card">
        <div class="card-t"><h3>${icon('swap')}质量 ↔ 摩尔数</h3></div>
        <div class="frow">
          <div class="fld"><span>质量</span><div class="ctl"><input id="d-ug" type="number" inputmode="decimal" placeholder="µg"><span class="u">µg</span></div></div>
          <div class="fld"><span>长度</span><div class="ctl"><input id="d-bp2" type="number" inputmode="decimal" placeholder="bp / nt"></div></div>
          <div class="fld"><span>类型</span><div class="ctl"><select id="d-type2">
            <option value="660">dsDNA</option><option value="330">ssDNA</option>
            <option value="340">ssRNA</option><option value="680">dsRNA</option>
          </select></div></div>
        </div>
        <div id="d-out2"></div>
      </div>
      <div class="info-note">${icon('info')}<span>引物精确分子量请用「工具箱 → 序列分析」，那里会按碱基组成计算。</span></div>`;
    const calc1=()=>{
      const bp=getNum('#d-bp'), t=document.querySelector('#d-type').value;
      const f={ds:660,ss:330,rna:340,dsrna:680}[t];
      if(isNaN(bp)||bp<=0){ panel.querySelector('#d-out1').innerHTML=''; return; }
      const da=bp*f;
      panel.querySelector('#d-out1').innerHTML=resultCard({label:'分子量', value:fmtN(da), unit:'Da',
        extra:`≈ ${fmtN(da/1000)} kDa`, copyText:String(Math.round(da))});
    };
    const calc2=()=>{
      const ug=getNum('#d-ug'), bp=getNum('#d-bp2'), f=parseFloat(document.querySelector('#d-type2').value);
      const out=panel.querySelector('#d-out2');
      if(isNaN(ug)||isNaN(bp)||bp<=0){ out.innerHTML=''; return; }
      const pmol = ug*1e6/(bp*f);   /* pmol = µg*1e6 / (bp*f) */
      const nmol = pmol/1000;
      out.innerHTML=resultCard({label:`${fmtN(ug)} µg · ${fmtN(bp)} bp 的摩尔数`, value:fmtN(pmol), unit:'pmol',
        extra:`≈ ${fmtN(nmol)} nmol。反算：1 pmol ≈ ${fmtN(bp*f/1e6)} µg`, copyText:String(pmol.toFixed(1))});
    };
    this.bindCalc('#d-bp,#d-type,#d-ug,#d-bp2,#d-type2', panel, ()=>{calc1();calc2();});
  },

  /* 菌体密度 */
  panelOd(panel){
    const facs=OD_FACTORS.map((o,i)=>`<option value="${i}" ${i===0?'selected':''}>${o.n}</option>`).join('');
    panel.innerHTML=`
      <div class="card">
        <div class="card-t"><h3>${icon('flask')}OD600 → 细胞密度</h3></div>
        <div class="frow">
          <div class="fld"><span>OD600</span><div class="ctl"><input id="o-od" type="number" inputmode="decimal" placeholder="如 0.8"></div></div>
          <div class="fld"><span>菌种</span><div class="ctl"><select id="o-org">${facs}</select></div></div>
        </div>
        <div id="o-out1"></div>
      </div>
      <div class="card">
        <div class="card-t"><h3>${icon('drop')}稀释至目标 OD600</h3></div>
        <div class="frow">
          <div class="fld"><span>当前 OD</span><div class="ctl"><input id="o-odc" type="number" inputmode="decimal"></div></div>
          <div class="fld"><span>目标 OD</span><div class="ctl"><input id="o-odt" type="number" inputmode="decimal"></div></div>
          <div class="fld"><span>目标总体积</span><div class="ctl"><input id="o-v" type="number" inputmode="decimal"><span class="u">mL</span></div></div>
        </div>
        <div id="o-out2"></div>
      </div>
      <div class="info-note">${icon('info')}<span>系数为经验值（每 1 OD600 的 cells/mL），随菌株、生长阶段和仪器而异，建议用自己的计数结果校准。</span></div>`;
    const calc1=()=>{
      const od=getNum('#o-od'), i=+document.querySelector('#o-org').value;
      const out=panel.querySelector('#o-out1');
      if(isNaN(od)){ out.innerHTML=''; return; }
      const f=OD_FACTORS[i].f;
      out.innerHTML=resultCard({label:`${OD_FACTORS[i].n} · OD600 = ${fmtN(od)}`, value:sciFmt(od*f),
        unit:'cells/mL', copyText:sciFmt(od*f)});
    };
    const calc2=()=>{
      const c=getNum('#o-odc'), t=getNum('#o-odt'), v=getNum('#o-v');
      const out=panel.querySelector('#o-out2');
      if(isNaN(c)||isNaN(t)||isNaN(v)||c<=0||t<=0||v<=0){ out.innerHTML=''; return; }
      if(t>c){ out.innerHTML=`<div class="warn-note">${icon('alert')}<span>目标 OD 高于当前 OD，需要继续培养而不是稀释。</span></div>`; return; }
      const take=v*t/c;
      out.innerHTML=resultCard({label:'稀释方案', value:fmtN(take), unit:'mL 培养液',
        extra:`加新鲜培养基 ${fmtN(v-take)} mL 补至 ${fmtN(v)} mL。建议先用 1× 培养基做对照调零。`,
        copyText:`取 ${take.toFixed(2)} mL 培养液 + 培养基补至 ${v} mL`});
    };
    this.bindCalc('#o-od,#o-org,#o-odc,#o-odt,#o-v', panel, ()=>{calc1();calc2();});
  },

  bindCalc(sel, panel, fn){
    sel.split(',').forEach(s=>{
      panel.querySelectorAll(s).forEach(inp=>{
        inp.addEventListener('input', fn);
        inp.addEventListener('change', fn);
      });
    });
    fn();
  }
};
