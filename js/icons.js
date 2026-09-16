/* 图标库：24×24 描边风格，统一 linecap/linejoin */
/* 页面注册表：所有 js/pages/*.js 向此对象注册（本文件最先加载） */
window.PAGES = window.PAGES || {};
(function(){
  const P = {
    home:'<path d="M3 11.2 12 3.5l9 7.7"/><path d="M5.5 9.8V20a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9.8"/><path d="M10 21v-5.5h4V21"/>',
    flask:'<path d="M9.5 3h5"/><path d="M10 3.5v5.2L4.7 17.6A2 2 0 0 0 6.5 20.5h11a2 2 0 0 0 1.8-2.9L14 8.7V3.5"/><path d="M7.2 14.5h9.6"/>',
    book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    calc:'<rect x="4.5" y="2.5" width="15" height="19" rx="2.5"/><path d="M8.5 7h7"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 15.5h.01M12 15.5h.01M15.5 15.5h.01M8.5 19h.01M12 19h.01M15.5 19h.01"/>',
    grid:'<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>',
    calendar:'<rect x="3" y="4.5" width="18" height="17" rx="2.5"/><path d="M16 2.5v4M8 2.5v4M3 10h18"/>',
    timer:'<path d="M9.5 2h5"/><circle cx="12" cy="13.5" r="8"/><path d="M12 13.5l3-3"/>',
    wrench:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    box:'<path d="M21 15.5V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.73z"/><path d="M3.3 7 12 12l8.7-5"/><path d="M12 22V12"/>',
    sliders:'<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3"/><path d="M1.5 14h5M9.5 8h5M17.5 16h5"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    chevR:'<path d="m9 6 6 6-6 6"/>',
    chevL:'<path d="m15 18-6-6 6-6"/>',
    chevD:'<path d="m6 9 6 6 6-6"/>',
    x:'<path d="M18 6 6 18M6 6l12 12"/>',
    camera:'<rect x="2.5" y="7" width="19" height="14" rx="2.5"/><path d="m8.5 7 1.3-2.5h4.4L15.5 7"/><circle cx="12" cy="13.5" r="3.5"/>',
    image:'<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="m21 15.5-5-5L5.5 21"/>',
    trash:'<path d="M4 7h16"/><path d="M9.5 7V4.5A1.5 1.5 0 0 1 11 3h2a1.5 1.5 0 0 1 1.5 1.5V7"/><path d="M6 7v13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7"/><path d="M10 11v6M14 11v6"/>',
    edit:'<path d="M17 3.5a2.6 2.6 0 1 1 3.7 3.7L7.5 20.4 2.5 21.5l1.1-5z"/>',
    copy:'<rect x="9" y="9" width="12" height="12" rx="2.5"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    check:'<path d="m4 12.5 5.2 5L20 6.5"/>',
    alert:'<path d="M10.3 3.9 2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4.5"/><path d="M12 17h.01"/>',
    download:'<path d="M12 4v11"/><path d="m6.5 10.5 5.5 5.5 5.5-5.5"/><path d="M4.5 20.5h15"/>',
    upload:'<path d="M12 20V9"/><path d="m6.5 13.5 5.5-5.5 5.5 5.5"/><path d="M4.5 4h15"/>',
    moon:'<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    sun:'<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M4.9 4.9l1.5 1.5M17.6 17.6l1.5 1.5M19.1 4.9l-1.5 1.5M6.4 17.6l-1.5 1.5"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 3.2"/>',
    list:'<path d="M8.5 6H21M8.5 12H21M8.5 18H21"/><path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    dna:'<path d="M7.5 2.5c0 6.5 9 6.5 9 13"/><path d="M16.5 2.5c0 6.5-9 6.5-9 13"/><path d="M9.3 5h5.4M9 10.8h6M9.8 16.6h4.4"/><path d="M7.5 21.5c3-1 6-1 9 0"/>',
    drop:'<path d="M12 3.2s6.2 6.6 6.2 11a6.2 6.2 0 0 1-12.4 0c0-4.4 6.2-11 6.2-11z"/>',
    refresh:'<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3.5V9h-5.5"/>',
    swap:'<path d="M8 20V7"/><path d="m4.5 10.5 3.5-3.5 3.5 3.5"/><path d="M16 4v13"/><path d="m12.5 13.5 3.5 3.5 3.5-3.5"/>',
    print:'<path d="M6.5 9V3h11v6"/><path d="M6.5 17.5h-2a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h15a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><rect x="6.5" y="14.5" width="11" height="6.5" rx="1"/>',
    play:'<path d="M8 5.3v13.4L19 12z" fill="currentColor" stroke="none"/>',
    pause:'<path d="M9 5v14M15 5v14" stroke-width="2.6"/>',
    stop:'<rect x="7" y="7" width="10" height="10" rx="1.5" fill="currentColor" stroke="none"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 8h.01"/><path d="M12 11.5V16"/>',
    share:'<path d="M12 3v12"/><path d="m8 6.5 4-4 4 4"/><path d="M5.5 11v8a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-8"/>',
    thermo:'<path d="M14.5 14.6V5a2.5 2.5 0 0 0-5 0v9.6a4.3 4.3 0 1 0 5 0z"/>',
    zap:'<path d="M13 2 4.5 13.5H11L9.5 22 19.5 10H13z"/>',
    phone:'<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 18.5h3"/>',
    vial:'<path d="M8.5 2.5h7"/><path d="M9.5 2.5v14a2.5 2.5 0 0 0 5 0v-14"/><path d="M9.5 11h5"/>',
    sparkle:'<path d="M12 3l1.9 5.6L19.5 10.5l-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9z"/><path d="M19 16.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
    target:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.6"/><circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none"/>',
    sigma:'<path d="M17 5H7l5.5 7L7 19h10"/>',
    cloud:'<path d="M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 0 1 0 9z"/>',
    users:'<circle cx="9" cy="8" r="3.5"/><path d="M3.5 20c.5-4 3-6 5.5-6s5 2 5.5 6"/><path d="M16 5.2a3.5 3.5 0 0 1 0 5.6"/><path d="M17.5 14.6c1.7.8 2.7 2.7 3 5.4"/>'
  };
  window.icon = function(name, cls){
    const p = P[name] || P.info;
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" ${cls?`class="${cls}"`:''}>${p}</svg>`;
  };
})();
