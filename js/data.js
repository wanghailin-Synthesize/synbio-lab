/* ============================================================
   静态参考数据 —— 修改这里的表格/配方即可更新 App 内置内容
   注意：修改后需把 sw.js 里的缓存版本号 +1，用户重新打开即生效
   ============================================================ */

/* ---------- 记录类型模板 ----------
   t: text 文本 / number 数字 / select 单选 / textarea 多行 */
const TEMPLATES = {
  clone:{name:'质粒构建', ic:'dna',
    fields:[
      {k:'vector',l:'载体'},{k:'insert',l:'插入片段'},
      {k:'method',l:'组装方式',t:'select',o:['酶切连接','Gibson组装','Golden Gate','TA克隆','同源重组','其他']},
      {k:'host',l:'宿主菌株'},{k:'ab',l:'抗性'},
      {k:'verify',l:'验证方式',t:'select',o:['菌落PCR','酶切验证','Sanger测序','混合']},
      {k:'result',l:'验证结果',t:'textarea'}]},
  transform:{name:'转化', ic:'zap',
    fields:[
      {k:'strain',l:'菌株'},{k:'plasmid',l:'质粒'},{k:'ab',l:'抗性'},
      {k:'volume',l:'涂布量(µL)',t:'number'},{k:'colonies',l:'菌落数',t:'number'},
      {k:'result',l:'备注',t:'textarea'}]},
  pcr:{name:'PCR / 扩增', ic:'dna',
    fields:[
      {k:'template',l:'模板'},{k:'primer',l:'引物对'},{k:'polymerase',l:'聚合酶'},
      {k:'program',l:'程序',t:'textarea'},{k:'result',l:'结果',t:'textarea'}]},
  digest:{name:'酶切 / 验证', ic:'wrench',
    fields:[
      {k:'plasmid',l:'质粒'},{k:'enzymes',l:'限制酶'},{k:'system',l:'体系与时间'},
      {k:'expect',l:'预期条带'},{k:'result',l:'实际结果',t:'textarea'}]},
  culture:{name:'培养 / 发酵', ic:'flask',
    fields:[
      {k:'strain',l:'菌株'},{k:'medium',l:'培养基'},{k:'temp',l:'温度(℃)',t:'number'},
      {k:'rpm',l:'转速(rpm)',t:'number'},{k:'time',l:'时间'},{k:'od',l:'OD600',t:'number'},
      {k:'result',l:'现象 / 产物',t:'textarea'}]},
  plasmid:{name:'质粒提取', ic:'drop',
    fields:[
      {k:'strain',l:'菌株'},{k:'plasmid',l:'质粒'},{k:'conc',l:'浓度(ng/µL)',t:'number'},
      {k:'ratio',l:'A260/280',t:'number'},{k:'yield',l:'产量(µg)',t:'number'},{k:'result',l:'备注',t:'textarea'}]},
  protein:{name:'蛋白表达纯化', ic:'vial',
    fields:[
      {k:'strain',l:'表达菌株'},{k:'plasmid',l:'质粒'},
      {k:'induce',l:'诱导条件',ph:'如 0.5mM IPTG / 16℃ 过夜'},
      {k:'lysis',l:'裂解缓冲液'},{k:'purify',l:'纯化方式',ph:'如 Ni-NTA / HisTrap'},
      {k:'elute',l:'洗脱条件'},{k:'conc',l:'浓度(mg/mL)',t:'number'},
      {k:'purity',l:'纯度',ph:'如 SDS-PAGE >90%'},{k:'result',l:'保存与备注',t:'textarea'}]},
  ivt:{name:'IVT 体外转录', ic:'sparkle',
    fields:[
      {k:'template',l:'模板 DNA',ph:'类型 / 浓度 / 线性化方式'},
      {k:'system',l:'反应体系',ph:'如 20µL，NTP 各 4mM，Mg²⁺ 20mM'},
      {k:'cond',l:'反应条件',ph:'如 37℃ 3h'},
      {k:'dnase',l:'DNase 处理'},
      {k:'purify',l:'纯化方式',t:'select',o:['LiCl 沉淀','磁珠纯化','柱纯化','未纯化']},
      {k:'yield',l:'产量(µg)',t:'number'},
      {k:'result',l:'质检结果',t:'textarea',ph:'A260、凝胶电泳条带等'}]},
  anneal:{name:'dsRNA 退火', ic:'swap',
    fields:[
      {k:'sense',l:'Sense 链',t:'textarea',ph:'名称 / 浓度 / 序列'},
      {k:'antisense',l:'Antisense 链',t:'textarea'},
      {k:'system',l:'退火体系',ph:'摩尔比、终浓度'},
      {k:'program',l:'退火程序',ph:'如 95℃ 2min → 缓慢降温'},
      {k:'result',l:'检测结果',t:'textarea'}]},
  qpcr:{name:'qPCR 定量', ic:'target',
    fields:[
      {k:'target',l:'靶基因'},{k:'ref',l:'内参基因'},
      {k:'samples',l:'样品与处理'},
      {k:'primers',l:'引物 / 探针',ph:'序列或编号、终浓度'},
      {k:'mix',l:'体系与程序',ph:'如 20µL SYBR；95℃ 3min；40×(95℃5s/60℃30s)'},
      {k:'eff',l:'效率与 R²',ph:'如 E=98.5%，R²=0.998'},
      {k:'result',l:'定量结果',t:'textarea',ph:'Cq / ΔΔCq / 倍数变化'}]},
  general:{name:'自由记录', ic:'edit', fields:[]}
};

/* ---------- 内置配方库（用量以 1L 为基准，App 内可按任意体积换算） ---------- */
const RECIPES = [
  {id:'lb', name:'LB 液体培养基', cat:'培养基', base:1000,
   items:[{n:'胰蛋白胨 Tryptone',a:10,u:'g'},{n:'酵母提取物 Yeast Extract',a:5,u:'g'},{n:'NaCl',a:10,u:'g'}],
   steps:'溶解后用 1M NaOH 调 pH 至 7.0，定容，121℃ 高压灭菌 20 min。',
   note:'大肠杆菌、枯草芽孢杆菌、贝莱斯芽孢杆菌通用。'},
  {id:'lba', name:'LB 固体培养基（平板）', cat:'培养基', base:1000,
   items:[{n:'胰蛋白胨 Tryptone',a:10,u:'g'},{n:'酵母提取物 Yeast Extract',a:5,u:'g'},{n:'NaCl',a:10,u:'g'},{n:'琼脂粉 Agar',a:15,u:'g'}],
   steps:'溶解、调 pH 7.0 后高压灭菌 20 min。冷却至约 55℃（手可持瓶）再加抗生素，倒板。',
   note:'每平板约 20–25 mL。含 Amp 的平板 4℃ 保存建议 2 周内用完。'},
  {id:'yt2', name:'2×YT 培养基', cat:'培养基', base:1000,
   items:[{n:'胰蛋白胨 Tryptone',a:16,u:'g'},{n:'酵母提取物 Yeast Extract',a:10,u:'g'},{n:'NaCl',a:5,u:'g'}],
   steps:'溶解后调 pH 7.0，121℃ 高压灭菌 20 min。', note:'营养更丰富，适合高密度培养与 M13/噬菌体。'},
  {id:'soc', name:'SOC 复苏培养基', cat:'培养基', base:1000,
   items:[{n:'胰蛋白胨 Tryptone',a:20,u:'g'},{n:'酵母提取物 Yeast Extract',a:5,u:'g'},{n:'NaCl',a:0.5,u:'g'},{n:'1M KCl',a:2.5,u:'mL'},{n:'1M MgCl₂（过滤除菌）',a:10,u:'mL'},{n:'1M 葡萄糖（过滤除菌）',a:20,u:'mL'}],
   steps:'前三种成分溶解后高压灭菌，冷却后加入过滤除菌的 MgCl₂ 与葡萄糖。',
   note:'用于感受态转化后复苏，37℃ 振荡 1 h 可显著提高转化效率。'},
  {id:'ypd', name:'YPD 培养基（酵母）', cat:'培养基', base:1000,
   items:[{n:'酵母提取物 Yeast Extract',a:10,u:'g'},{n:'蛋白胨 Peptone',a:20,u:'g'},{n:'葡萄糖 Glucose',a:20,u:'g'}],
   steps:'酵母提取物与蛋白胨溶解后 115℃ 灭菌 15 min；葡萄糖单独灭菌（115℃ 15 min）或过滤除菌后混合。',
   note:'酿酒酵母通用。固体培养基加琼脂 20 g/L。'},
  {id:'zyp5052', name:'ZYP-5052 自诱导培养基', cat:'培养基', base:1000,
   items:[{n:'胰蛋白胨 Tryptone',a:10,u:'g'},{n:'酵母提取物 Yeast Extract',a:5,u:'g'},{n:'Na₂HPO₄（无水）',a:3.55,u:'g'},{n:'KH₂PO₄',a:3.4,u:'g'},{n:'NH₄Cl',a:2.68,u:'g'},{n:'Na₂SO₄（无水）',a:0.71,u:'g'},{n:'50× 5052 碳源母液（过滤除菌）',a:20,u:'mL'},{n:'1M MgSO₄（过滤除菌）',a:1,u:'mL'}],
   steps:'蛋白胨、酵母提取物与各盐类溶于约 950 mL 水，121℃ 高压灭菌 20 min；冷却至室温后加入过滤除菌的 50× 5052 母液与 1M MgSO₄，混匀。',
   note:'自诱导：0.01% 葡萄糖先期阻遏，耗尽后由 0.2% α-乳糖自动诱导，无需 IPTG，37℃ 培养过夜。终浓度 25mM Na₂HPO₄ / 25mM KH₂PO₄ / 50mM NH₄Cl / 5mM Na₂SO₄ / 1mM MgSO₄ / 0.5% 甘油 / 0.2% α-乳糖。盐量按无水物计，用水合物请按分子量换算。'},
  {id:'st5052', name:'50× 5052 碳源母液', cat:'常用母液', base:1000,
   items:[{n:'甘油 Glycerol',a:250,u:'mL'},{n:'α-乳糖 α-Lactose',a:100,u:'g'},{n:'葡萄糖 Glucose',a:5,u:'g'}],
   steps:'α-乳糖与葡萄糖溶于约 650 mL 温水（50–60℃ 助溶），加入甘油混匀，定容至 1 L，过滤除菌，室温避光保存（勿冷冻）。',
   note:'按 1:50 稀释使用：配 1 L ZYP-5052 加 20 mL。终浓度 0.5% 甘油 / 0.2% α-乳糖 / 0.01% 葡萄糖。'},
  {id:'pbs', name:'PBS 磷酸盐缓冲液 pH 7.4', cat:'缓冲液', base:1000,
   items:[{n:'NaCl',a:8,u:'g'},{n:'KCl',a:0.2,u:'g'},{n:'Na₂HPO₄',a:1.42,u:'g'},{n:'KH₂PO₄',a:0.24,u:'g'}],
   steps:'依次溶解后定容，必要时调 pH 7.4，121℃ 高压灭菌 20 min。',
   note:'终浓度：137mM NaCl / 2.7mM KCl / 10mM Na₂HPO₄ / 1.8mM KH₂PO₄。'},
  {id:'tae50', name:'TAE 50× 电泳缓冲液', cat:'电泳', base:1000,
   items:[{n:'Tris Base',a:242,u:'g'},{n:'冰醋酸',a:57.1,u:'mL'},{n:'0.5M EDTA pH 8.0',a:100,u:'mL'}],
   steps:'Tris 溶于约 800 mL 水，加 EDTA，再加冰醋酸，定容至 1 L。使用时稀释 50 倍。',
   note:'大片段 DNA（>2 kb）迁移好、双链线性 DNA 分辨率高。'},
  {id:'tbe10', name:'TBE 10× 电泳缓冲液', cat:'电泳', base:1000,
   items:[{n:'Tris Base',a:108,u:'g'},{n:'硼酸 Boric Acid',a:55,u:'g'},{n:'0.5M EDTA pH 8.0',a:40,u:'mL'}],
   steps:'溶解后定容至 1 L。常用 0.5×（临用前稀释 20 倍）。',
   note:'小片段 DNA 与 RNA 电泳分辨好，缓冲能力强，长时间电泳不衰减。'},
  {id:'te', name:'TE 缓冲液 pH 8.0', cat:'缓冲液', base:1000,
   items:[{n:'1M Tris-HCl pH 8.0',a:10,u:'mL'},{n:'0.5M EDTA pH 8.0',a:2,u:'mL'}],
   steps:'混合后定容至 1 L，高压灭菌。', note:'终浓度 10mM Tris / 1mM EDTA，DNA 储存通用。'},
  {id:'tris1m', name:'1M Tris-HCl pH 8.0', cat:'常用母液', base:1000,
   items:[{n:'Tris Base',a:121.1,u:'g'}],
   steps:'溶于约 800 mL 水，用浓盐酸（约 42 mL）调 pH 至 8.0，定容后高压灭菌。',
   note:'pH 随温度变化明显，请在室温下调 pH。'},
  {id:'edta05', name:'0.5M EDTA pH 8.0', cat:'常用母液', base:1000,
   items:[{n:'EDTA·Na₂·2H₂O',a:186.1,u:'g'},{n:'NaOH（调 pH 用）',a:20,u:'g'}],
   steps:'EDTA 在水中不溶，加 NaOH 边加边搅拌至 pH 8.0 完全溶解，定容后高压灭菌。'},
  {id:'nacl5m', name:'5M NaCl', cat:'常用母液', base:1000, items:[{n:'NaCl',a:292.2,u:'g'}], steps:'溶解定容后高压灭菌。'},
  {id:'naac3m', name:'3M 乙酸钠 pH 5.2', cat:'常用母液', base:1000,
   items:[{n:'乙酸钠·3H₂O',a:408.1,u:'g'}],
   steps:'溶解后用冰醋酸调 pH 至 5.2，定容后高压灭菌。', note:'DNA/RNA 乙醇沉淀常用。'},
  {id:'sds10', name:'10% SDS', cat:'常用母液', base:1000,
   items:[{n:'SDS（十二烷基硫酸钠）',a:100,u:'g'}],
   steps:'小心加入水中搅拌溶解（可 68℃ 助溶），浓盐酸调 pH 7.2，定容。室温保存，低温易析出。',
   note:'称量时佩戴口罩与手套，避免吸入粉尘。'},
  {id:'cacl01', name:'0.1M CaCl₂（感受态制备）', cat:'常用母液', base:1000,
   items:[{n:'无水 CaCl₂',a:11.1,u:'g'}], steps:'溶解定容后高压灭菌或过滤除菌，4℃ 预冷后使用。'},
  {id:'glu1m', name:'1M 葡萄糖', cat:'常用母液', base:1000,
   items:[{n:'葡萄糖 Glucose',a:180.2,u:'g'}], steps:'溶解后过滤除菌（高压易焦糖化），4℃ 保存。'},
  {id:'mgcl1m', name:'1M MgCl₂', cat:'常用母液', base:1000,
   items:[{n:'MgCl₂·6H₂O',a:203.3,u:'g'}], steps:'溶解定容后过滤除菌或高压灭菌。'},
  {id:'licl8m', name:'8M LiCl（RNA 沉淀）', cat:'常用母液', base:1000,
   items:[{n:'LiCl',a:339.1,u:'g'}], steps:'溶解定容后过滤除菌或高压灭菌。',
   note:'IVT 产物纯化：加等体积 8M LiCl 至终浓度 2.5–3M，4℃ 放置 ≥2 h，>200 nt 的 RNA 优先沉淀，DNA/小分子留在上清。'},
  {id:'depc', name:'DEPC 处理水（无 RNase 水）', cat:'RNA 专用', base:1000,
   items:[{n:'DEPC（焦碳酸二乙酯）',a:1,u:'mL'}],
   steps:'加 DEPC 至超纯水中至 0.1%，磁力搅拌 ≥12 h，121℃ 高压 20 min 分解残留 DEPC。',
   note:'⚠ DEPC 有毒且疑似致癌，通风橱内操作、戴手套。含 Tris 等伯胺的溶液不能用 DEPC 处理（会反应）。'},
  {id:'annealbuf', name:'RNA 退火缓冲液 1×', cat:'RNA 专用', base:1000,
   items:[{n:'1M Tris-HCl pH 7.5',a:10,u:'mL'},{n:'5M NaCl',a:10,u:'mL'},{n:'0.5M EDTA pH 8.0',a:2,u:'mL'}],
   steps:'混合后定容至 1 L，过滤除菌分装，−20℃ 保存。',
   note:'终浓度 10mM Tris / 50mM NaCl / 1mM EDTA。也可直接用无 RNase 水退火。'},
  {id:'mops', name:'MOPS 电泳缓冲液 1×（RNA 变性胶）', cat:'RNA 专用', base:1000,
   items:[{n:'MOPS',a:4.19,u:'g'},{n:'乙酸钠·3H₂O',a:0.41,u:'g'},{n:'0.5M EDTA pH 8.0',a:2,u:'mL'}],
   steps:'溶解后调 pH 至 7.0，定容，避光保存（含 RNA 时勿高压，过滤除菌）。',
   note:'终浓度 20mM MOPS / 5mM NaOAc / 1mM EDTA。RNase 污染风险高，现用现配或 4℃ 避光存放。'},
  {id:'rnaload', name:'RNA 上样缓冲液 2×（甲酰胺型）', cat:'RNA 专用', base:1000,
   items:[{n:'去离子甲酰胺',a:950,u:'mL'},{n:'0.5M EDTA pH 8.0',a:20,u:'mL'},{n:'溴酚蓝',a:0.25,u:'g'},{n:'二甲苯青 FF',a:0.25,u:'g'}],
   steps:'混匀分装，−20℃ 避光保存。',
   note:'用于 RNA 变性电泳。甲酰胺有生殖毒性，通风橱操作。'},
  {id:'dnaload6x', name:'6× DNA 载样缓冲液', cat:'电泳', base:1000,
   items:[{n:'溴酚蓝',a:2.5,u:'g'},{n:'二甲苯青 FF',a:2.5,u:'g'},{n:'甘油',a:300,u:'mL'}],
   steps:'溶于水定容至 1 L，分装 4℃ 保存。'}
];

/* ---------- 抗生素工作浓度表 ---------- */
const ANTIBIOTICS = [
  {n:'氨苄青霉素 Ampicillin', w:'100 µg/mL', s:'100 mg/mL', v:'水', st:'−20℃ 分装避光', note:'半衰期短；Amp 平板 4℃ 约 2 周内用完；卫星菌落常见'},
  {n:'卡那霉素 Kanamycin', w:'50 µg/mL', s:'50 mg/mL', v:'水', st:'−20℃', note:'最稳定之一，平板可保存 1 个月'},
  {n:'氯霉素 Chloramphenicol', w:'25–34 µg/mL', s:'34 mg/mL', v:'无水乙醇', st:'−20℃ 避光', note:'质粒扩增（松散型质粒）可用 170 µg/mL'},
  {n:'四环素 Tetracycline', w:'10–20 µg/mL', s:'10 mg/mL', v:'乙醇', st:'−20℃ 避光', note:'Mg²⁺ 拮抗其活性，勿用 Mg²⁺ 培养基'},
  {n:'壮观霉素 Spectinomycin', w:'100 µg/mL', s:'100 mg/mL', v:'水', st:'−20℃', note:''},
  {n:'链霉素 Streptomycin', w:'50 µg/mL', s:'50 mg/mL', v:'水', st:'−20℃', note:''},
  {n:'庆大霉素 Gentamicin', w:'20 µg/mL', s:'20 mg/mL', v:'水', st:'−20℃', note:''},
  {n:'利福平 Rifampicin', w:'50–100 µg/mL', s:'50 mg/mL', v:'甲醇 / DMSO', st:'−20℃ 避光', note:'易光失活'},
  {n:'红霉素 Erythromycin', w:'0.5–5 µg/mL', s:'10 mg/mL', v:'乙醇', st:'−20℃', note:'枯草芽孢杆菌常用低浓度（1–2 µg/mL 起筛）'},
  {n:'新霉素 Neomycin', w:'5–10 µg/mL', s:'10 mg/mL', v:'水', st:'−20℃', note:'枯草芽孢杆菌常用；注意与卡那霉素交叉抗性'}
];

/* ---------- 常用限制酶（速查） ---------- */
const ENZYMES = [
  {n:'EcoRI', s:'G↓AATTC', t:'II 型', o:'黏性末端 AATT'},
  {n:'BamHI', s:'G↓GATCC', t:'II 型', o:'黏性末端 GATC'},
  {n:'HindIII', s:'A↓AGCTT', t:'II 型', o:'黏性末端 AGCT'},
  {n:'XhoI', s:'C↓TCGAG', t:'II 型', o:'与 SalI 同尾'},
  {n:'SalI', s:'G↓TCGAC', t:'II 型', o:'与 XhoI 同尾'},
  {n:'PstI', s:'CTGCA↓G', t:'II 型', o:'3′ 端黏性'},
  {n:'SmaI', s:'CCC↓GGG', t:'II 型', o:'平末端'},
  {n:'KpnI', s:'GGTAC↓C', t:'II 型', o:'3′ 端黏性'},
  {n:'NcoI', s:'C↓CATGG', t:'II 型', o:'含 ATG，适合 ORF 起始'},
  {n:'NdeI', s:'CA↓TATG', t:'II 型', o:'含 ATG，pET 系列常用'},
  {n:'XbaI', s:'T↓CTAGA', t:'II 型', o:''},
  {n:'SpeI', s:'A↓CTAGT', t:'II 型', o:'与 XbaI 连接后不可再切（BioBrick 标准）'},
  {n:'SacI', s:'GAGCT↓C', t:'II 型', o:'3′ 端黏性'},
  {n:'NotI', s:'GC↓GGCCGC', t:'II 型', o:'8 碱基稀有位点，多克隆位点边缘'},
  {n:'BsaI', s:'GGTCTC(1/5)', t:'IIS 型', o:'切割位点在识别序列外，Golden Gate 常用'},
  {n:'BsmBI', s:'CGTCTC(1/5)', t:'IIS 型', o:'切割位点在外侧，Gibson/Golden Gate 常用'}
];

/* ---------- 常见菌株 / 基因组大小 ---------- */
const GENOMES = [
  {o:'大肠杆菌 E. coli K-12', g:'4.64 Mb', c:'37℃ LB'},
  {o:'大肠杆菌 BL21(DE3)', g:'4.64 Mb', c:'37℃ LB；T7 蛋白表达常用宿主'},
  {o:'枯草芽孢杆菌 B. subtilis 168', g:'4.21 Mb', c:'37℃ LB'},
  {o:'贝莱斯芽孢杆菌 B. velezensis', g:'≈4.0 Mb', c:'30–37℃ LB'},
  {o:'酿酒酵母 S. cerevisiae', g:'12.1 Mb', c:'30℃ YPD'},
  {o:'T7 噬菌体基因组', g:'39.9 kb', c:'编码 T7 RNA 聚合酶（883 aa）'}
];

/* ---------- 常用质粒速查 ---------- */
const PLASMIDS = [
  {n:'pUC19', s:'2686 bp', r:'Amp', o:'高拷贝，LacZα 蓝白斑筛选'},
  {n:'pBR322', s:'4361 bp', r:'Amp / Tet', o:'经典低拷贝参照'},
  {n:'pET-28a(+)', s:'5369 bp', r:'Kan', o:'T7 启动子，His·Tag，蛋白表达常用'},
  {n:'pET-22b(+)', s:'≈5.4 kb', r:'Amp', o:'pelB 信号肽，周质表达可选'}
];

/* ---------- 培养条件速查 ---------- */
const CULTURE = [
  {o:'大肠杆菌', m:'LB / TB', t:'37℃', ab:'Amp 100 / Kan 50 / Cm 25–34', n:'感受态制备与转化效率高'},
  {o:'枯草芽孢杆菌', m:'LB', t:'37℃', ab:'Kan 5–10 / Ery 1–5', n:'感受态需在特定生长时期（对数中后期）摄取 DNA'},
  {o:'贝莱斯芽孢杆菌', m:'LB / 土豆培养基', t:'30–37℃', ab:'视菌株而定', n:'生防/促生相关，产脂肽类抗生素'},
  {o:'酿酒酵母', m:'YPD / SC 缺陷培养基', t:'30℃', ab:'G418 200–500 µg/mL 等', n:'转化常用 LiAc/PEG 方法'},
  {o:'蛋白表达（T7 系统）', m:'LB + Kan', t:'16–20℃ 诱导过夜', ab:'Kan 50', n:'BL21(DE3)；低度诱导利于可溶性表达'}
];

/* ---------- 核苷酸参考分子量（游离酸，g/mol） ----------
   注意：实验室常用的是钠盐，分子量更高且因水合物而异 —— 称量以瓶标为准！ */
const NTP_MW = [
  {n:'ATP（三磷酸腺苷）', mw:507.18, nm:'ATP·Na₂ 约 605.2（无水）'},
  {n:'CTP（三磷酸胞苷）', mw:483.16, nm:'CTP·Na₂ 约 567.1（无水）'},
  {n:'GTP（三磷酸鸟苷）', mw:523.18, nm:'GTP·Na₂ 约 623.2（无水）'},
  {n:'UTP（三磷酸尿苷）', mw:484.15, nm:'UTP·Na₂ 约 578.1（无水）'},
  {n:'dATP', mw:475.2, nm:'dATP·Na₂ 约 573.2（无水）'},
  {n:'dCTP', mw:467.2, nm:'dCTP·Na₂ 约 567.3（无水）'},
  {n:'dGTP', mw:507.2, nm:'dGTP·Na₂ 约 607.2（无水）'},
  {n:'dTTP', mw:482.2, nm:'dTTP·Na₂ 约 582.2（无水）'}
];

/* ---------- A260 定量系数（µg/mL 对应 1 OD260，光径 1cm） ---------- */
const A260_FACTORS = [
  {n:'双链 DNA（dsDNA）', f:50},
  {n:'单链 DNA / 寡核苷酸', f:33},
  {n:'单链 RNA（ssRNA）', f:40},
  {n:'双链 RNA（dsRNA）', f:40}
];

/* ---------- OD600 细胞密度经验系数（cells/mL 每 1 OD600，随菌种/仪器而异） ---------- */
const OD_FACTORS = [
  {n:'大肠杆菌', f:8e8},
  {n:'枯草芽孢杆菌', f:5e8},
  {n:'贝莱斯芽孢杆菌', f:5e8},
  {n:'酿酒酵母', f:2e7}
];

/* ---------- IVT 反应默认组分（T7 RNA 聚合酶体系，可调） ---------- */
const IVT_DEFAULT = [
  {k:'tris',  n:'Tris-HCl pH 8.0',  fin:40,  fu:'mM',  st:1,   su:'M',   on:1},
  {k:'mg',    n:'MgCl₂',            fin:20,  fu:'mM',  st:1,   su:'M',   on:1},
  {k:'dtt',   n:'DTT',              fin:5,   fu:'mM',  st:1,   su:'M',   on:1},
  {k:'spd',   n:'亚精胺 Spermidine',fin:2,   fu:'mM',  st:100, su:'mM',  on:1},
  {k:'ntp',   n:'NTP（各）',        fin:4,   fu:'mM',  st:100, su:'mM',  on:1},
  {k:'tpl',   n:'模板 DNA',         fin:30,  fu:'ng/µL', st:200, su:'ng/µL', on:1},
  {k:'rnap',  n:'T7 RNAP',          fin:50,  fu:'µg/mL', st:2,   su:'mg/mL', on:1},
  {k:'ri',    n:'RNase 抑制剂',     fin:0.5, fu:'U/µL', st:40,  su:'U/µL', on:0},
  {k:'ppase', n:'无机焦磷酸酶（可选）',fin:0.01, fu:'U/µL', st:1, su:'U/µL', on:0}
];
