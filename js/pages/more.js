/* 更多：次级功能入口 */
PAGES.more = {
  title:'更多功能',
  render(el){
    el.innerHTML = `
      <div class="page-head"><div><div class="ht">更多功能</div><div class="hs">规划 · 工具 · 管理</div></div></div>
      <div class="content">
        <div class="grid4">
          ${[
            ['实验规划','calendar','c1','plan','任务与协议清单'],
            ['计时器','timer','c4','timers','多路并行计时'],
            ['工具箱','wrench','c6','tools','核酸 / 克隆 / RNA-IVT'],
            ['库存管理','box','c7','inventory','试剂与菌株台账'],
            ['数据与设置','sliders','c8','settings','备份 / 外观 / 关于'],
          ].map(q=>`
            <button class="quick" data-go="${q[3]}"><div class="qi ${q[2]}">${icon(q[1])}</div><span>${q[0]}</span></button>`).join('')}
        </div>

        <div class="sec-gap"></div>

        <div class="card">
          <div class="card-t"><h3>${icon('sparkle')}小贴士</h3></div>
          <div class="info-note" style="margin:0">${icon('info')}<span>
            所有数据仅保存在这台手机的浏览器里，不会上传。<b>建议每周在「数据与设置」中导出一次备份</b>，换手机或清缓存前务必先备份。
          </span></div>
        </div>

        <div class="card">
          <div class="card-t"><h3>${icon('book')}常用入口</h3></div>
          ${[
            ['配方库','flask','LB、PBS、TAE、DEPC 水等 24 种','solution'],
            ['抗生素浓度表','vial','工作浓度 / 母液浓度 / 溶剂','solution'],
            ['常用酶切位点','wrench','EcoRI、BamHI、BsaI 等 16 种','tools'],
            ['NTP 分子量参考','dna','IVT 配母液称量必备','tools'],
          ].map(r=>`
            <div class="row-item" style="padding:12px 2px" data-go="${r[3]}">
              <div class="avatar-ic" style="background:var(--primary-soft);color:var(--primary)">${icon(r[1])}</div>
              <div class="ri-main"><div class="ri-t">${r[0]}</div><div class="ri-s">${r[2]}</div></div>${icon('chevR')}
            </div>`).join('')}
        </div>
      </div>`;
  }
};
