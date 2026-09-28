/* ანიმაციები: კონფეტი, ხმები, მთვლელები, სქროლ-გამოჩენა */
(function () {
  'use strict';
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- კონფეტი ---- */
  var canvas, ctx, parts = [], rafId = null;
  function initCanvas() {
    if (canvas) return;
    canvas = document.getElementById('fx-canvas');
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx = canvas.getContext('2d');
    window.addEventListener('resize', function () {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });
  }
  var COLORS = ['#ffc83d', '#f5a623', '#38d17a', '#4da3ff', '#a988ff', '#ff8b5e', '#ffffff'];
  function Confetti(opts) {
    if (reduced) return;
    initCanvas();
    if (!ctx) return;
    opts = opts || {};
    var n = opts.count || 160;
    var burst = opts.burst !== false;
    for (var i = 0; i < n; i++) {
      parts.push({
        x: burst ? canvas.width / 2 + (Math.random() - .5) * canvas.width * .5 : Math.random() * canvas.width,
        y: burst ? canvas.height * .34 + (Math.random() - .5) * 90 : -20 - Math.random() * 80,
        vx: (Math.random() - .5) * 11,
        vy: -4 - Math.random() * 9,
        w: 5 + Math.random() * 7,
        h: 7 + Math.random() * 9,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - .5) * .3,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        life: 130 + Math.random() * 90
      });
    }
    if (!rafId) rafId = requestAnimationFrame(tick);
  }
  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.vy += 0.24;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life--;
      if (p.life <= 0 || p.y > canvas.height + 40) { parts.splice(i, 1); continue; }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.min(1, p.life / 60);
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (parts.length) { rafId = requestAnimationFrame(tick); }
    else { rafId = null; ctx.clearRect(0, 0, canvas.width, canvas.height); }
  }

  /* ---- ხმები (WebAudio) ---- */
  var actx = null;
  function beep(freq, dur, type, vol, when) {
    if (!Store.get('sound')) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var t = actx.currentTime + (when || 0);
      var o = actx.createOscillator();
      var g = actx.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol || .12, t + .015);
      g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(g).connect(actx.destination);
      o.start(t); o.stop(t + dur + .05);
    } catch (e) {}
  }
  var Sound = {
    click: function () { beep(560, .07, 'triangle', .07); },
    correct: function () { beep(660, .1, 'sine', .12); beep(990, .16, 'sine', .12, .09); },
    wrong: function () { beep(220, .16, 'sawtooth', .09); beep(150, .22, 'sawtooth', .08, .1); },
    pass: function () {
      [523, 659, 784, 1047].forEach(function (f, i) { beep(f, .22, 'triangle', .13, i * .13); });
    },
    fail: function () { [392, 330, 262].forEach(function (f, i) { beep(f, .26, 'sine', .1, i * .16); }); }
  };

  /* ---- რიცხვის ანიმაცია ---- */
  function CountUp(el, to, dur) {
    if (reduced) { el.textContent = to; return; }
    dur = dur || 900;
    var from = parseInt(el.textContent, 10) || 0;
    var done = false;
    function finish() { if (done) return; done = true; el.textContent = to; }
    var t0 = performance.now();
    function step(t) {
      if (done) return;
      var k = Math.min(1, (t - t0) / dur);
      var e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(from + (to - from) * e);
      if (k < 1) requestAnimationFrame(step); else finish();
    }
    requestAnimationFrame(step);
    setTimeout(finish, dur + 300);
  }

  /* ---- სქროლზე გამოჩენა ---- */
  var io = null;
  function observeReveals(root) {
    if (!('IntersectionObserver' in window)) {
      (root || document).querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
      return;
    }
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -40px 0px', threshold: .05 });
    }
    (root || document).querySelectorAll('.reveal:not(.in)').forEach(function (el) { io.observe(el); });
  }

  /* ---- რგოლის პროგრესი ---- */
  function setRing(circleEl, pct) {
    if (!circleEl) return;
    var r = parseFloat(circleEl.getAttribute('r'));
    var c = 2 * Math.PI * r;
    circleEl.style.strokeDasharray = c;
    circleEl.style.strokeDashoffset = c * (1 - Math.max(0, Math.min(1, pct)));
  }

  /* ---- ციფრული ეფექტი: პატარა ავტომობილი პროგრესზე ---- */
  function placeCar(el, pct) {
    if (!el) return;
    var track = el.parentElement;
    var w = track.clientWidth - 40;
    el.style.left = Math.max(0, Math.min(w, w * pct)) + 'px';
  }

  window.Anim = {
    confetti: Confetti,
    sound: Sound,
    countUp: CountUp,
    observeReveals: observeReveals,
    setRing: setRing,
    placeCar: placeCar,
    reduced: reduced
  };
})();
