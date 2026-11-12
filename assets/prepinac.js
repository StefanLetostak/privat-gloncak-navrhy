/* Prepínač návrhov: plávajúca lišta na každej stránke, aby sa dalo prekliknúť medzi návrhmi. */
(function () {
  'use strict';
  var script = document.currentScript;
  var root = (script && script.getAttribute('data-root')) || './';
  var items = [
    { id: '', short: '☰', label: 'Prehľad' },
    { id: 'a-album', short: 'A', label: 'Album' },
    { id: 'b-chodnik', short: 'B', label: 'Chodník' },
    { id: 'c-pohladnica', short: 'C', label: 'Pohľadnica' },
    { id: 'd-fakty', short: 'D', label: 'Fakty' },
    { id: 'e-panorama', short: 'E', label: 'Panoráma' },
    { id: 'f-dlazdice', short: 'F', label: 'Dlaždice' }
  ];
  var parts = location.pathname.replace(/index\.html$/, '').split('/').filter(Boolean);
  var here = parts.length ? parts[parts.length - 1] : '';
  var known = items.some(function (it) { return it.id === here; });
  if (!known) here = '';

  var css = [
    '.np{position:fixed;left:50%;bottom:14px;z-index:9999;transform:translateX(-50%);display:flex;gap:4px;padding:5px;',
    'background:#1d2022;border-radius:999px;box-shadow:0 10px 30px -8px rgba(0,0,0,.55),0 0 0 1px rgba(255,255,255,.08);',
    'font:600 14px/1 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;max-width:calc(100vw - 16px)}',
    '.np a{display:flex;align-items:center;gap:6px;min-height:38px;padding:0 14px;border-radius:999px;color:#e9ecee;text-decoration:none;white-space:nowrap}',
    '.np a:hover{background:rgba(255,255,255,.12)}',
    '.np a[aria-current="page"]{background:#fff;color:#1d2022}',
    '.np a:focus-visible{outline:3px solid #ffd23f;outline-offset:2px}',
    '.np b{font-weight:800}',
    '.np-pad{height:76px}',
    '@media (max-width:1100px){.np a{padding:0 11px}.np .np-l{display:none}}',
    '@media print{.np,.np-pad{display:none}}'
  ].join('');
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var nav = document.createElement('nav');
  nav.className = 'np';
  nav.setAttribute('aria-label', 'Prepínač návrhov');
  items.forEach(function (it) {
    var a = document.createElement('a');
    a.href = root + (it.id ? it.id + '/' : '');
    a.title = it.id ? 'Návrh ' + it.short + ': ' + it.label : 'Prehľad všetkých návrhov';
    if (it.id === here) a.setAttribute('aria-current', 'page');
    a.innerHTML = '<b>' + it.short + '</b><span class="np-l">' + it.label + '</span>';
    nav.appendChild(a);
  });
  var pad = document.createElement('div');
  pad.className = 'np-pad';
  pad.setAttribute('aria-hidden', 'true');
  function mount() { document.body.appendChild(pad); document.body.appendChild(nav); }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);

  // klávesy ← a → prepínajú návrhy (mimo formulárových polí)
  document.addEventListener('keydown', function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(t.tagName))) return;
    if (t && t.closest && t.closest('.strip, .minis, .bk-cal')) return;
    var i = items.findIndex(function (it) { return it.id === here; });
    if (e.key === 'ArrowRight' && i < items.length - 1) location.href = root + items[i + 1].id + '/';
    if (e.key === 'ArrowLeft' && i > 0) location.href = root + (items[i - 1].id ? items[i - 1].id + '/' : '');
  });
})();
