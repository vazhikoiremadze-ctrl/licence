/* გამოცდის იმიტაცია: 30 კითხვა, 25 სწორი პასუხი = ჩაბარება */
(function () {
  'use strict';

  var TOTAL = 30, PASS = 25, MAX_WRONG = 5;

  var session = null;

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function fmt(sec) {
    var m = Math.floor(sec / 60), s = sec % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function startSession(count, timerOn, timerMin) {
    var bank = window.BANK;
    var picked = [];
    var seenIds = {};
    while (picked.length < count) {
      var t = bank[(Math.random() * bank.length) | 0];
      if (seenIds[t.id]) continue;
      seenIds[t.id] = true;
      picked.push(t);
    }
    session = {
      questions: picked,
      idx: 0,
      answers: [],
      selected: null,
      mistakes: 0,
      startedAt: Date.now(),
      timerOn: timerOn,
      limitSec: timerOn ? timerMin * 60 : 0,
      timerHandle: null,
      done: false
    };
  }

  function elapsed() { return Math.floor((Date.now() - session.startedAt) / 1000); }

  function stopTimer() {
    if (session && session.timerHandle) { clearInterval(session.timerHandle); session.timerHandle = null; }
  }

  function pickCount() { return session.questions.length; }
  function passMark() { return Math.ceil(pickCount() * (PASS / TOTAL)); }
  function maxWrong() { return pickCount() - passMark(); }

  /* ---------- setup ---------- */
  function renderSetup(container) {
    var hist = Store.history();
    var histHTML = '';
    if (hist.length) {
      histHTML = '<div class="card mt22"><div class="row spread"><b>ბოლო მცდელობები</b></div>' +
        hist.slice(0, 6).map(function (h) {
          var d = new Date(h.ts);
          var dt = d.toLocaleDateString('ka-GE') + ' ' + d.toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' });
          return '<div class="history-row"><span class="hr-date">' + dt + '</span>' +
            '<span class="badge ' + (h.passed ? 'badge-green' : 'badge-red') + '">' + (h.passed ? 'ჩაბარებული' : 'ჩაჭრილი') + '</span>' +
            '<span>' + h.correct + '/' + h.total + ' სწორი</span>' +
            '<span class="muted small">' + fmt(h.seconds) + '</span></div>';
        }).join('') + '</div>';
    }

    container.innerHTML =
      '<div class="section-title"><span class="ic">' + Icon('clipboard') + '</span><h2 style="font-size:inherit">გამოცდის იმიტაცია</h2></div>' +
      '<p class="section-sub">რეალური გამოცდის პირობები: B კატეგორია — 30 კითხვა, ჩასაბარებლად საჭიროა 25 სწორი პასუხი (დასაშვებია 5 შეცდომა).</p>' +
      '<div class="card">' +
      '<div class="exam-rules">' +
      '<div class="rule-box"><b>30</b><span>კითხვა გამოცდაზე</span></div>' +
      '<div class="rule-box"><b>25</b><span>სწორი პასუხი ჩასაბარებლად</span></div>' +
      '<div class="rule-box"><b>5</b><span>დასაშვები შეცდომა</span></div>' +
      '</div>' +
      '<div class="set-row"><div><div class="st">შეზღუდვის ტაიმერი</div><div class="sd">ჩართვისას გამოცდა შემოიფარგლება დროით</div></div>' +
      '<button class="switch' + (Store.get('timerOn') ? ' on' : '') + '" id="ex-timer"></button></div>' +
      '<div class="set-row" id="ex-minrow" style="' + (Store.get('timerOn') ? '' : 'display:none') + '"><div><div class="st">დრო (წუთი)</div></div>' +
      '<div style="width:130px"><input class="input" type="number" min="5" max="90" id="ex-min" value="' + Store.get('timerMin') + '"></div></div>' +
      '<div class="row mt14">' +
      '<button class="btn btn-primary btn-lg" id="ex-start">' + Icon('play') + 'სრული გამოცდის დაწყება (30)</button>' +
      '<button class="btn btn-lg" id="ex-quick">' + Icon('target') + 'სწრაფი ვარჯიში (10)</button>' +
      '</div></div>' + histHTML;

    var timerSw = container.querySelector('#ex-timer');
    timerSw.addEventListener('click', function () {
      var on = !this.classList.contains('on');
      this.classList.toggle('on', on);
      Store.set('timerOn', on);
      container.querySelector('#ex-minrow').style.display = on ? '' : 'none';
    });
    container.querySelector('#ex-min').addEventListener('change', function () {
      var v = Math.max(5, Math.min(90, Number(this.value) || 30));
      this.value = v;
      Store.set('timerMin', v);
    });
    container.querySelector('#ex-start').addEventListener('click', function () {
      Anim.sound.click();
      startSession(TOTAL, Store.get('timerOn'), Store.get('timerMin'));
      renderRun(container);
    });
    container.querySelector('#ex-quick').addEventListener('click', function () {
      Anim.sound.click();
      startSession(10, false, 0);
      renderRun(container);
    });
  }

  /* ---------- გამოცდის მიმდინარეობა ---------- */
  function dotsHTML() {
    var h = '';
    for (var i = 0; i < session.questions.length; i++) {
      var cls = '';
      if (i < session.idx) cls = 'done';
      if (i === session.idx && !session.done) cls = 'cur';
      h += '<i class="' + cls + '"></i>';
    }
    return h;
  }

  function renderRun(container) {
    var t = session.questions[session.idx];
    Store.markSeen(t.id);
    var total = session.questions.length;
    var img = t.img ? '<img class="ticket-img" src="' + t.img + '" alt="" loading="lazy">' : '';
    container.innerHTML =
      '<div class="exam-top"><div class="exam-top-row">' +
      '<span class="exam-timer" id="ex-clock">' + Icon('clock') + (session.timerOn ? fmt(session.limitSec) : '00:00') + '</span>' +
      '<span class="badge">კითხვა <b style="color:var(--amber);margin:0 3px">' + (session.idx + 1) + '</b> / ' + total + '</span>' +
      '<span class="badge' + (session.mistakes ? ' badge-red' : '') + '">შეცდომა ' + session.mistakes + ' / ' + maxWrong() + '</span>' +
      '<span style="flex:1"></span>' +
      '<button class="btn btn-sm btn-danger" id="ex-abort">დასრულება</button>' +
      '</div><div class="dots">' + dotsHTML() + '</div></div>' +
      '<div class="exam-card">' +
      '<div class="ticket-num"><b>#' + t.id + '</b>' + (t.t || []).slice(0, 2).map(function (id) {
        var tt = (window.TOPICS || []).find(function (x) { return x.id === id; });
        return tt ? '<span class="topic-chip">' + AI.esc(tt.name) + '</span>' : '';
      }).join('') + '</div>' +
      '<div class="exam-q">' + AI.esc(t.q) + '</div>' + img +
      '<div class="answers" id="ex-answers">' +
      t.a.map(function (a, i) {
        return '<button class="ans" data-pick="' + (i + 1) + '"><span class="num">' + (i + 1) + '</span><span>' + AI.esc(a) + '</span></button>';
      }).join('') +
      '</div>' +
      '<div class="row mt22"><button class="btn btn-primary btn-lg" id="ex-next" disabled>' +
      (session.idx === total - 1 ? 'დასრულება' : 'შემდეგი') + Icon('arrowR') + '</button>' +
      '<span class="small muted">აირჩიე პასუხი (კლავიშები 1-4), შემდეგ დაადასტურე</span></div>' +
      '</div>';

    var answersEl = container.querySelector('#ex-answers');
    answersEl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-pick]');
      if (!b) return;
      answersEl.querySelectorAll('.ans').forEach(function (x) { x.classList.remove('correct'); });
      b.classList.add('correct');
      session.selected = Number(b.getAttribute('data-pick'));
      container.querySelector('#ex-next').disabled = false;
      Anim.sound.click();
    });
    container.querySelector('#ex-next').addEventListener('click', nextQuestion);
    container.querySelector('#ex-abort').addEventListener('click', function () {
      if (confirm('გინდა გამოცდის ვადაზე ადრე დასრულება? შედეგი ჩაითვლება.')) finish(container);
    });

    if (session.timerOn) {
      stopTimer();
      session.timerHandle = setInterval(function () {
        var left = session.limitSec - elapsed();
        var clock = document.getElementById('ex-clock');
        if (!clock) { stopTimer(); return; }
        clock.innerHTML = Icon('clock') + fmt(Math.max(0, left));
        if (left <= 60) clock.classList.add('low');
        if (left <= 0) { stopTimer(); window.App.toast('დრო ამოიწურა!', 'err'); finish(container); }
      }, 500);
    } else {
      stopTimer();
      session.timerHandle = setInterval(function () {
        var clock = document.getElementById('ex-clock');
        if (!clock) { stopTimer(); return; }
        clock.innerHTML = Icon('clock') + fmt(elapsed());
      }, 500);
    }
    container.focus();
  }

  function nextQuestion() {
    if (session.selected == null) return;
    var t = session.questions[session.idx];
    var isCorrect = session.selected === t.c + 1;
    session.answers.push({ id: t.id, pick: session.selected, correct: isCorrect });
    if (!isCorrect) session.mistakes++;
    session.selected = null;
    session.idx++;
    var container = document.getElementById('view');
    if (session.mistakes > maxWrong()) {
      Anim.sound.fail();
      finish(container);
      return;
    }
    if (session.idx >= session.questions.length) { finish(container); return; }
    renderRun(container);
  }

  function weakTopics(wrongTickets) {
    var counts = {};
    wrongTickets.forEach(function (t) {
      (t.t || []).forEach(function (id) { counts[id] = (counts[id] || 0) + 1; });
    });
    return Object.keys(counts)
      .map(function (id) { return { id: Number(id), n: counts[id] }; })
      .sort(function (a, b) { return b.n - a.n; })
      .slice(0, 5);
  }

  function finish(container) {
    stopTimer();
    session.done = true;
    var total = session.questions.length;
    var correct = session.answers.filter(function (a) { return a.correct; }).length;
    var passed = correct >= passMark();
    var secs = elapsed();

    Store.addExam({
      ts: Date.now(), total: total, correct: correct,
      passed: passed, seconds: secs,
      wrongIds: session.answers.filter(function (a) { return !a.correct; }).map(function (a) { return a.id; })
    });

    var wrong = session.answers.filter(function (a) { return !a.correct; });
    var wrongTickets = wrong.map(function (a) { return window.BANK.find(function (x) { return x.id === a.id; }); }).filter(Boolean);
    var topics = weakTopics(wrongTickets);

    var reviewHTML = wrongTickets.map(function (t) {
      var a = wrong.find(function (x) { return x.id === t.id; });
      return '<div class="review-item">' +
        '<div class="row spread"><span class="badge badge-amber">#' + t.id + '</span>' +
        '<button class="btn btn-sm" data-aiexplain="' + t.id + '">' + Icon('sparkle') + 'AI ახსნა</button></div>' +
        '<div class="rq">' + AI.esc(t.q) + '</div>' +
        '<div class="ra ra-bad">' + Icon('xCircle') + '<span>შენი პასუხი: ' + AI.esc(t.a[a.pick - 1]) + '</span></div>' +
        '<div class="ra ra-ok">' + Icon('checkCircle') + '<span>სწორი: ' + AI.esc(t.a[t.c]) + '</span></div>' +
        '<div class="ra ra-miss">' + Icon('info') + '<span>' + AI.esc((t.e || '').slice(0, 260)) + (t.e && t.e.length > 260 ? '…' : '') + '</span></div>' +
        '<div class="ai-extra" data-extra="' + t.id + '"></div></div>';
    }).join('');

    container.innerHTML =
      '<div class="result-hero ' + (passed ? 'result-pass' : 'result-fail') + '">' +
      '<div class="ric">' + (passed ? Icon('trophy') : Icon('alert')) + '</div>' +
      '<h2>' + (passed ? 'გილოცავთ — ჩააბარეთ!' : (session.mistakes > maxWrong() ? 'სამწუხაროდ — ვერ ჩააბარეთ' : 'სამწუხაროდ — ვერ ჩააბარეთ')) + '</h2>' +
      '<div class="score">სწორი პასუხები: <b>' + correct + '</b> / ' + total + ' &nbsp;·&nbsp; საჭირო იყო <b>' + passMark() + '</b> &nbsp;·&nbsp; დრო: <b>' + fmt(secs) + '</b></div>' +
      '<div class="row mt14" style="justify-content:center">' +
      '<button class="btn btn-primary btn-lg" id="ex-again">' + Icon('refresh') + 'ხელახლა ცდა</button>' +
      '<button class="btn btn-lg" id="ex-wrongs">' + Icon('book') + 'შეცდომების ვარჯიში (' + wrongTickets.length + ')</button>' +
      '</div></div>' +
      (topics.length ? '<div class="card mt14"><b>სუსტი თემები — გაიმეორე პირველ რიგში:</b><div class="blunder-topics">' +
        topics.map(function (x) {
          var tt = (window.TOPICS || []).find(function (y) { return y.id === x.id; });
          return '<button class="chip" data-topic-practice="' + x.id + '">' + (tt ? AI.esc(tt.name) : '#' + x.id) + ' <b>' + x.n + '</b></button>';
        }).join('') + '</div></div>' : '') +
      (wrongTickets.length ? '<div class="section-title mt22"><span class="ic">' + Icon('xCircle') + '</span><h3 style="font-size:inherit">შეცდომების გადახედვა</h3></div>' + reviewHTML : '') +
      (passed && !wrongTickets.length ? '<div class="card mt14 center"><b>0 შეცდომა — იდეალური შედეგი!</b><p class="muted small mt8">ასე გააგრძელე და გამოცდაზე აუცილებლად ჩააბარებ.</p></div>' : '');

    if (passed) {
      Anim.confetti({ count: 220 });
      Anim.sound.pass();
      setTimeout(function () { Anim.confetti({ count: 120, burst: false }); }, 900);
    } else {
      Anim.sound.fail();
    }

    container.querySelector('#ex-again').addEventListener('click', function () { renderSetup(container); });
    container.querySelector('#ex-wrongs').addEventListener('click', function () {
      if (wrongTickets.length) location.hash = '#/learn?status=wrong';
      else window.App.toast('შეცდომები არ გაქვს — მშვენიერია!', 'ok');
    });
    container.addEventListener('click', function (e) {
      var tb = e.target.closest('[data-topic-practice]');
      if (tb) { location.hash = '#/learn?topic=' + tb.getAttribute('data-topic-practice'); return; }
      var ab = e.target.closest('[data-aiexplain]');
      if (ab) {
        var id = Number(ab.getAttribute('data-aiexplain'));
        var box = container.querySelector('[data-extra="' + id + '"]');
        if (!box) return;
        if (box.innerHTML) { box.innerHTML = ''; return; }
        var t = window.BANK.find(function (x) { return x.id === id; });
        box.innerHTML = AI.explainHTML(t, { noOfficial: true });
        return;
      }
    });
    window.App.updateProgress();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function render(container, params) {
    if (params && params.start === '1') {
      startSession(TOTAL, Store.get('timerOn'), Store.get('timerMin'));
      renderRun(container);
      return;
    }
    renderSetup(container);
  }

  function bind(container) {
    container.addEventListener('keydown', function (e) {
      if (!session || session.done) return;
      if (e.key === 'Enter' && session.selected != null) { nextQuestion(); return; }
      var n = parseInt(e.key, 10);
      if (n >= 1 && n <= 4) {
        var b = container.querySelector('[data-pick="' + n + '"]');
        if (b) b.click();
      }
    });
    container.setAttribute('tabindex', '0');
  }

  window.Exam = { render: render, bind: bind };
})();
