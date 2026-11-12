/* Návrh F: galéria, najbližší voľný termín a „teraz v Zuberci“ (čas, východ a západ slnka). */
(function () {
  'use strict';
  var TZ = 'Europe/Bratislava';
  var LAT = 49.263417, LON = 19.61069;

  // Galéria: šípky a počítadlo
  var car = document.querySelector('[data-car]');
  var count = document.querySelector('[data-car-count]');
  if (car) {
    var slides = [].slice.call(car.querySelectorAll('.slide'));
    var current = 0;
    function go(i) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      car.scrollTo({ left: slides[i].offsetLeft - car.offsetLeft, behavior: 'smooth' });
    }
    document.querySelectorAll('[data-car-dir]').forEach(function (b) {
      b.addEventListener('click', function () { go(current + (+b.getAttribute('data-car-dir'))); });
    });
    car.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(current + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(current - 1); }
    });
    if (window.IntersectionObserver) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting && en.intersectionRatio > 0.6) {
            current = slides.indexOf(en.target);
            if (count) count.textContent = (current + 1) + ' / ' + slides.length;
          }
        });
      }, { root: car, threshold: [0.6] });
      slides.forEach(function (s) { io.observe(s); });
    }
  }

  // Najbližší voľný termín z kalendára
  var root = document.querySelector('[data-rezervacia]');
  var nextBox = document.querySelector('[data-next]');
  if (nextBox && window.Rezervacia && Rezervacia.nextFree) {
    var free = Rezervacia.nextFree(2);
    var dEl = nextBox.querySelector('[data-next-date]');
    var pick = nextBox.querySelector('[data-next-pick]');
    if (free) {
      var day = new Intl.DateTimeFormat('sk-SK', { day: 'numeric' });
      var full = new Intl.DateTimeFormat('sk-SK', { day: 'numeric', month: 'long' });
      var sameMonth = free.start.getMonth() === free.end.getMonth();
      dEl.textContent = (sameMonth ? day.format(free.start) : full.format(free.start)) + ' – ' + full.format(free.end);
      pick.addEventListener('click', function () {
        Rezervacia.pick(root, free.start, free.end);
        document.getElementById('terminy').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } else {
      dEl.textContent = 'Napíšte nám, nájdeme termín';
      pick.hidden = true;
    }
  }

  // Najbližších 14 dní: voľné a obsadené noci
  var strip = document.querySelector('[data-mini14]');
  if (strip && window.Rezervacia && Rezervacia.isBooked) {
    var t0 = new Date(); t0.setHours(0, 0, 0, 0);
    var dw = new Intl.DateTimeFormat('sk-SK', { weekday: 'short' });
    var html = '';
    for (var k = 0; k < 14; k++) {
      var d = new Date(t0); d.setDate(t0.getDate() + k);
      var busy = Rezervacia.isBooked(d);
      html += '<li class="' + (busy ? 'is-busy' : 'is-free') + '" title="' + d.toLocaleDateString('sk-SK') + (busy ? ', obsadené' : ', voľné') + '"><span>' + dw.format(d).replace('.', '') + '</span><b>' + d.getDate() + '</b></li>';
    }
    strip.innerHTML = html;
  }

  // Teraz v Zuberci: čas a slnko (algoritmus SunCalc, presnosť pár minút)
  var now = document.querySelector('[data-now]');
  if (now) {
    var rad = Math.PI / 180, dayMs = 86400000, J1970 = 2440588, J2000 = 2451545, e = rad * 23.4397, J0 = 0.0009;
    function toDays(d) { return d.valueOf() / dayMs - 0.5 + J1970 - J2000; }
    function fromJulian(j) { return new Date((j + 0.5 - J1970) * dayMs); }
    function sunTimes(date) {
      var lw = rad * -LON, phi = rad * LAT, d = toDays(date);
      var n = Math.round(d - J0 - lw / (2 * Math.PI));
      var ds = J0 + lw / (2 * Math.PI) + n;
      var M = rad * (357.5291 + 0.98560028 * ds);
      var C = rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
      var L = M + C + rad * 102.9372 + Math.PI;
      var dec = Math.asin(Math.sin(e) * Math.sin(L));
      var Jnoon = J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
      var w = Math.acos((Math.sin(rad * -0.833) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec)));
      var a = J0 + (w + lw) / (2 * Math.PI) + n;
      var Jset = J2000 + a + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
      return { rise: fromJulian(Jnoon - (Jset - Jnoon)), set: fromJulian(Jset) };
    }
    var hm = new Intl.DateTimeFormat('sk-SK', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
    var wd = new Intl.DateTimeFormat('sk-SK', { weekday: 'long', timeZone: TZ });
    function tick() {
      var t = new Date();
      now.querySelector('[data-now-time]').textContent = wd.format(t) + ', ' + hm.format(t);
      var s = sunTimes(t);
      now.querySelector('[data-now-rise]').textContent = hm.format(s.rise);
      now.querySelector('[data-now-set]').textContent = hm.format(s.set);
    }
    tick();
    setInterval(tick, 30000);
  }
})();
