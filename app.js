/* Rozcestník (menu), postup čítania, trasa v súhrne rezervácie a dátum na pečiatke. */
(function () {
  'use strict';
  var top = document.querySelector('.top');

  // Postup čítania: červená značka pod hlavičkou
  var bar = document.querySelector('.progress span');
  if (bar) {
    var ticking = false;
    var update = function () {
      var max = document.documentElement.scrollHeight - innerHeight;
      bar.style.setProperty('--p', max > 0 ? Math.min(1, scrollY / max).toFixed(4) : 0);
      ticking = false;
    };
    addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    addEventListener('resize', update);
    update();
  }

  // Rozcestník na mobile
  var btn = document.querySelector('.menu-btn');
  var menu = document.getElementById('rozcestnik');
  if (btn && menu) {
    var setTop = function () { menu.style.setProperty('--top-h', top.getBoundingClientRect().height + 'px'); };
    var close = function (focusBtn) {
      menu.hidden = true; btn.setAttribute('aria-expanded', 'false');
      if (focusBtn) btn.focus();
    };
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      if (open) { close(false); return; }
      setTop(); menu.hidden = false; btn.setAttribute('aria-expanded', 'true');
      var first = menu.querySelector('a'); if (first) first.focus();
    });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) close(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) close(true); });
    addEventListener('resize', function () { if (!menu.hidden) setTop(); });
  }

  // Súhrn rezervácie ako trasa: príchod a odchod s dňom v týždni
  var root = document.querySelector('[data-rezervacia]');
  if (root) {
    var range = root.querySelector('[data-bk="range"]');
    var from = root.querySelector('[data-route-from]');
    var to = root.querySelector('[data-route-to]');
    var arrival = root.querySelector('[data-bk="arrival"]');
    var departure = root.querySelector('[data-bk="departure"]');
    var fmt = new Intl.DateTimeFormat('sk-SK', { weekday: 'short', day: 'numeric', month: 'long' });
    var show = function (v) { return v ? fmt.format(new Date(v + 'T00:00')) : ''; };
    var sync = function () {
      from.textContent = arrival.value ? show(arrival.value) : 'vyberte v kalendári';
      to.textContent = departure.value ? show(departure.value) : '–';
    };
    if (range && window.MutationObserver) new MutationObserver(sync).observe(range, { childList: true, characterData: true, subtree: true });
    sync();

    // Pečiatka s dnešným dátumom
    var d = new Date();
    var stampDate = root.querySelector('[data-stamp-date]');
    if (stampDate) stampDate.textContent = d.getDate() + '. ' + (d.getMonth() + 1) + '. ' + d.getFullYear();
  }
})();
