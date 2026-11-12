/*
  Ukážkový rezervačný widget pre dizajnové návrhy.
  Nič sa nikam neodosiela. Ceny a obsadenosť sú vymyslené len na ukážku.
  Každý variant má vlastné HTML a CSS, logika je spoločná:
  - kontajner: [data-rezervacia]
  - polia: [data-bk="..."], počítadlá: [data-bk-stepper="..."]
*/
(function () {
  'use strict';

  var CENA_OSOBA_NOC = 14;   // ukážka – na Hauzi.sk je uvedené „od 14 €“
  var MIN_OSOB_DOM = 8;      // ukážka – celý dom sa účtuje min. za 8 osôb
  var ZALOHA = 0.3;          // ukážka – záloha 30 %
  var MAX_OSOB = 14;

  function startOfDay(d) { var x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function pad(n) { return String(n).padStart(2, '0'); }
  function key(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parse(s) {
    if (!s) return null;
    var p = s.split('-');
    if (p.length !== 3) return null;
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }
  function nightsBetween(a, b) { return Math.round((startOfDay(b) - startOfDay(a)) / 86400000); }

  var today = startOfDay(new Date());

  // Ukážková obsadenosť: noci (dátum = noc začínajúca v daný deň)
  var booked = {};
  [[4, 7], [11, 13], [19, 23], [33, 36], [44, 48], [58, 61]].forEach(function (r) {
    for (var i = r[0]; i < r[1]; i++) booked[key(addDays(today, i))] = true;
  });

  var fmtDay = new Intl.DateTimeFormat('sk-SK', { day: 'numeric', month: 'long' });
  var fmtMonth = new Intl.DateTimeFormat('sk-SK', { month: 'long', year: 'numeric' });
  var eur = new Intl.NumberFormat('sk-SK', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  var DOW = ['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne'];

  function nightsFree(start, end) {
    for (var d = new Date(start); d < end; d = addDays(d, 1)) {
      if (booked[key(d)]) return false;
    }
    return true;
  }

  function plural(n, one, few, many) {
    if (n === 1) return one;
    if (n >= 2 && n <= 4) return few;
    return many;
  }

  function init(root) {
    var q = function (n) { return root.querySelector('[data-bk="' + n + '"]'); };
    var qa = function (n) { return Array.prototype.slice.call(root.querySelectorAll('[data-bk="' + n + '"]')); };

    var state = {
      start: null,
      end: null,
      adults: 2,
      children: 0,
      unit: 'izby',
      month: new Date(today.getFullYear(), today.getMonth(), 1)
    };

    var arrival = q('arrival');
    var departure = q('departure');
    var calendar = q('calendar');
    var dateError = q('date-error');
    var form = q('form');
    var done = q('done');

    function setText(name, value) {
      qa(name).forEach(function (el) { el.textContent = value; });
    }

    function showDateError(msg) {
      if (!dateError) return;
      dateError.textContent = msg || '';
      dateError.hidden = !msg;
    }

    function persons() { return state.adults + state.children; }

    function update() {
      var n = state.start && state.end ? nightsBetween(state.start, state.end) : 0;
      var p = persons();
      var billed = state.unit === 'dom' ? Math.max(p, MIN_OSOB_DOM) : p;
      var total = n * billed * CENA_OSOBA_NOC;
      var rooms = Math.min(4, Math.max(1, Math.ceil(p / 3)));

      setText('adults', state.adults);
      setText('children', state.children);
      setText('persons', p + ' ' + plural(p, 'osoba', 'osoby', 'osôb'));
      setText('nights', n ? n + ' ' + plural(n, 'noc', 'noci', 'nocí') : 'vyberte termín');
      setText('nights-num', n || '–');
      setText('total', n ? eur.format(total) : '–');
      setText('total-num', n ? String(total) : '–');
      setText('deposit', n ? eur.format(Math.round(total * ZALOHA)) : '–');
      setText('per-night', eur.format(CENA_OSOBA_NOC));
      setText('unit-label', state.unit === 'dom' ? 'celý dom' : (rooms + ' ' + plural(rooms, 'izba', 'izby', 'izieb')));
      setText('range', state.start && state.end
        ? fmtDay.format(state.start) + ' – ' + fmtDay.format(state.end)
        : (state.start ? 'od ' + fmtDay.format(state.start) + ', vyberte odchod' : 'Termín zatiaľ nie je vybraný'));
      setText('price-note', state.unit === 'dom' && p < MIN_OSOB_DOM
        ? 'Celý dom účtujeme minimálne za ' + MIN_OSOB_DOM + ' osôb.'
        : 'Ukážkový výpočet. Skutočné ceny nastavíte v administrácii.');

      if (arrival) arrival.value = state.start ? key(state.start) : '';
      if (departure) {
        departure.value = state.end ? key(state.end) : '';
        departure.min = state.start ? key(addDays(state.start, 1)) : key(addDays(today, 1));
      }

      root.querySelectorAll('[data-bk-stepper]').forEach(function (s) {
        var name = s.getAttribute('data-bk-stepper');
        var min = +s.getAttribute('data-min');
        var minus = s.querySelector('[data-delta="-1"]');
        var plus = s.querySelector('[data-delta="1"]');
        if (minus) minus.setAttribute('aria-disabled', String(state[name] <= min));
        if (plus) plus.setAttribute('aria-disabled', String(persons() >= MAX_OSOB));
      });

      root.querySelectorAll('input[name="unit"]').forEach(function (r) { r.checked = r.value === state.unit; });
      renderCalendar();
    }

    function pick(d) {
      showDateError('');
      if (d < today) return;
      if (!state.start || state.end) {
        if (booked[key(d)]) { showDateError('Noc ' + fmtDay.format(d) + ' je už obsadená. Vyberte iný príchod.'); return; }
        state.start = d; state.end = null;
      } else if (d <= state.start) {
        if (booked[key(d)]) { showDateError('Noc ' + fmtDay.format(d) + ' je už obsadená. Vyberte iný príchod.'); return; }
        state.start = d;
      } else if (!nightsFree(state.start, d)) {
        showDateError('V tomto termíne je už časť nocí obsadená. Skúste kratší pobyt alebo iný termín.');
        return;
      } else {
        state.end = d;
      }
      update();
    }

    function renderCalendar() {
      if (!calendar) return;
      var m = state.month;
      var first = new Date(m.getFullYear(), m.getMonth(), 1);
      var offset = (first.getDay() + 6) % 7;
      var days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
      var canPrev = first > new Date(today.getFullYear(), today.getMonth(), 1);

      var html = '<div class="bk-cal__head">' +
        '<button type="button" class="bk-cal__nav" data-dir="-1" aria-label="Predchádzajúci mesiac"' + (canPrev ? '' : ' disabled') + '>' +
        '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
        '<span class="bk-cal__title" aria-live="polite">' + fmtMonth.format(first) + '</span>' +
        '<button type="button" class="bk-cal__nav" data-dir="1" aria-label="Nasledujúci mesiac">' +
        '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="m6 3 5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
        '</div><div class="bk-cal__dow" aria-hidden="true">' +
        DOW.map(function (d) { return '<span>' + d + '</span>'; }).join('') +
        '</div><div class="bk-cal__grid">';

      for (var i = 0; i < offset; i++) html += '<span class="bk-day bk-day--empty"></span>';
      for (var dnum = 1; dnum <= days; dnum++) {
        var d = new Date(m.getFullYear(), m.getMonth(), dnum);
        var k = key(d);
        var cls = ['bk-day'];
        var label = fmtDay.format(d);
        var disabled = false;
        if (d < today) { cls.push('is-past'); disabled = true; }
        if (booked[k]) { cls.push('is-booked'); label += ', obsadené'; }
        if (+d === +today) cls.push('is-today');
        if (state.start && +d === +state.start) { cls.push('is-start'); label += ', príchod'; }
        if (state.end && +d === +state.end) { cls.push('is-end'); label += ', odchod'; }
        if (state.start && state.end && d > state.start && d < state.end) cls.push('is-range');
        html += '<button type="button" class="' + cls.join(' ') + '" data-day="' + k + '" aria-label="' + label + '"' +
          (disabled ? ' disabled' : '') + (cls.indexOf('is-start') > -1 || cls.indexOf('is-end') > -1 ? ' aria-pressed="true"' : '') +
          '>' + dnum + '</button>';
      }
      html += '</div>';
      calendar.innerHTML = html;
    }

    if (calendar) {
      calendar.addEventListener('click', function (e) {
        var nav = e.target.closest('.bk-cal__nav');
        if (nav && !nav.disabled) {
          var dir = +nav.getAttribute('data-dir');
          state.month = new Date(state.month.getFullYear(), state.month.getMonth() + dir, 1);
          renderCalendar();
          var again = calendar.querySelector('.bk-cal__nav[data-dir="' + dir + '"]');
          if (again && !again.disabled) again.focus();
          return;
        }
        var day = e.target.closest('.bk-day[data-day]');
        if (day && !day.disabled) {
          var focusKey = day.getAttribute('data-day');
          pick(parse(focusKey));
          var again2 = calendar.querySelector('[data-day="' + focusKey + '"]');
          if (again2) again2.focus();
        }
      });
    }

    function fromInputs() {
      showDateError('');
      var a = parse(arrival && arrival.value);
      var b = parse(departure && departure.value);
      if (a && a < today) { showDateError('Príchod nemôže byť v minulosti.'); return; }
      if (a && booked[key(a)]) { showDateError('Noc ' + fmtDay.format(a) + ' je už obsadená. Vyberte iný príchod.'); return; }
      if (a && b && b <= a) { showDateError('Odchod musí byť aspoň deň po príchode.'); return; }
      if (a && b && !nightsFree(a, b)) { showDateError('V tomto termíne je už časť nocí obsadená. Skúste kratší pobyt alebo iný termín.'); return; }
      state.start = a; state.end = b;
      if (a) state.month = new Date(a.getFullYear(), a.getMonth(), 1);
      update();
    }
    if (arrival) {
      arrival.min = key(today);
      arrival.addEventListener('change', fromInputs);
    }
    if (departure) departure.addEventListener('change', fromInputs);

    root.querySelectorAll('[data-bk-stepper]').forEach(function (s) {
      var name = s.getAttribute('data-bk-stepper');
      var min = +s.getAttribute('data-min');
      s.addEventListener('click', function (e) {
        var b = e.target.closest('[data-delta]');
        if (!b) return;
        var delta = +b.getAttribute('data-delta');
        if (delta > 0 && persons() >= MAX_OSOB) return;
        state[name] = Math.max(min, state[name] + delta);
        update();
      });
    });

    root.querySelectorAll('input[name="unit"]').forEach(function (r) {
      r.addEventListener('change', function () { if (r.checked) { state.unit = r.value; update(); } });
    });

    if (form) {
      form.addEventListener('input', function (e) {
        var name = e.target.getAttribute('name');
        var errEl = name && root.querySelector('[data-bk-error="' + name + '"]');
        if (errEl) { errEl.textContent = ''; errEl.hidden = true; e.target.removeAttribute('aria-invalid'); }
      });
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var ok = true;
        function fail(name, msg) {
          var el = root.querySelector('[data-bk-error="' + name + '"]');
          var field = form.querySelector('[name="' + name + '"]');
          if (el) { el.textContent = msg; el.hidden = false; }
          if (field) field.setAttribute('aria-invalid', 'true');
          if (ok && field) field.focus();
          ok = false;
        }
        if (!state.start || !state.end) {
          showDateError('Vyberte príchod aj odchod v kalendári.');
          if (ok && calendar) calendar.scrollIntoView({ block: 'center' });
          ok = false;
        }
        var nameField = form.querySelector('[name="meno"]');
        var mailField = form.querySelector('[name="email"]');
        var consent = form.querySelector('[name="suhlas"]');
        if (nameField && !nameField.value.trim()) fail('meno', 'Napíšte svoje meno.');
        if (mailField && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mailField.value.trim())) fail('email', 'Zadajte e-mail v tvare meno@domena.sk.');
        if (consent && !consent.checked) fail('suhlas', 'Bez súhlasu vám nemôžeme odpovedať.');
        if (!ok) return;
        if (done) {
          done.hidden = false;
          done.setAttribute('tabindex', '-1');
          done.focus();
        }
      });
    }

    update();
  }

  // pomocné funkcie pre rýchle vyhľadávanie termínu (návrhy E a F)
  window.Rezervacia = {
    init: init,
    isBooked: function (d) { return !!booked[key(startOfDay(d))]; },
    key: key,
    nextFree: function (nights) {
      nights = nights || 2;
      for (var i = 1; i < 120; i++) {
        var s = addDays(today, i), ok = true;
        for (var j = 0; j < nights; j++) if (booked[key(addDays(s, j))]) { ok = false; break; }
        if (ok) return { start: s, end: addDays(s, nights) };
      }
      return null;
    },
    pick: function (root, start, end) {
      var a = root.querySelector('[data-bk="arrival"]'), b = root.querySelector('[data-bk="departure"]');
      if (!a || !b) return;
      a.value = key(start); b.value = key(end);
      b.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-rezervacia]').forEach(init);
  });
})();
