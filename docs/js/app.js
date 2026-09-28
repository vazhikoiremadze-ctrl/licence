/* აპლიკაცია: ჰეშ-როუტერი, მთავარი გვერდი, AI გვერდი, პარამეტრები, შეტყობინებები */
(function () {
  'use strict';

  var modalRoot = document.getElementById('modal-root');
  var toastsEl = document.getElementById('toasts');
  var navLinks = document.getElementById('nav-links');

  var STATS = (function () {
    var bank = window.BANK || [];
    var imgs = 0;
    bank.forEach(function (t) { if (t.img) imgs++; });
    return { total: bank.length, topics: (window.TOPICS || []).length, images: imgs };
  })();

  function bankFind(id) {
    return (window.BANK || []).find(function (x) { return x.id === Number(id); });
  }
  function topicById(id) {
    return (window.TOPICS || []).find(function (x) { return x.id === Number(id); });
  }

  /* ================= შეტყობინებები ================= */
  function toast(msg, type) {
    type = type || 'ok';
    var ic = type === 'err' ? 'alert' : (type === 'amber' ? 'info' : 'checkCircle');
    var el = document.createElement('div');
    el.className = 'toast ' + type;
    el.innerHTML = Icon(ic) + '<span>' + AI.esc(msg) + '</span>';
    toastsEl.appendChild(el);
    setTimeout(function () {
      el.style.transition = 'opacity .3s, transform .3s';
      el.style.opacity = '0';
      el.style.transform = 'translateY(10px)';
    }, 2350);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 2700);
  }

  /* ================= პროგრესი ================= */
  function learnedPct() { return STATS.total ? Store.learnedCount() / STATS.total : 0; }

  function updateProgress() {
    var p = learnedPct();
    var ring = document.getElementById('nav-ring');
    if (ring) Anim.setRing(ring, p);
    var num = document.getElementById('nav-progress-num');
    if (num) num.textContent = Math.round(p * 100) + '%';
    var big = document.getElementById('home-ring');
    if (big) Anim.setRing(big, p);
    var pctEl = document.getElementById('home-ring-pct');
    if (pctEl) pctEl.textContent = Math.round(p * 100) + '%';
    var fill = document.getElementById('home-fill');
    if (fill) fill.style.width = (Math.round(p * 1000) / 10) + '%';
    var car = document.getElementById('home-car');
    if (car) Anim.placeCar(car, p);
  }

  /* ================= ჰეშ-როუტერი ================= */
  function parseHash() {
    var h = (location.hash || '').replace(/^#\/?/, '');
    var qi = h.indexOf('?');
    var name = (qi === -1 ? h : h.slice(0, qi)).replace(/\/+$/, '');
    var params = {};
    if (qi !== -1) {
      h.slice(qi + 1).split('&').forEach(function (kv) {
        if (!kv) return;
        var eq = kv.indexOf('=');
        var k = eq === -1 ? kv : kv.slice(0, eq);
        var v = eq === -1 ? '' : kv.slice(eq + 1);
        try { k = decodeURIComponent(k.replace(/\+/g, ' ')); v = decodeURIComponent(v.replace(/\+/g, ' ')); } catch (e) {}
        params[k] = v;
      });
    }
    return { name: name || 'home', params: params };
  }

  var ROUTES = {
    home: function (c) { renderHome(c); },
    learn: function (c, p) { Learn.render(c, p); Learn.bind(c); },
    exam: function (c, p) { Exam.render(c, p); Exam.bind(c); },
    tricks: function (c) { Tricks.render(c); Tricks.bind(c); },
    ai: function (c) { renderAI(c); }
  };

  function navigate() {
    var r = parseHash();
    var fn = ROUTES[r.name] || ROUTES.home;
    closeModal();
    if (navLinks) navLinks.classList.remove('open');
    document.querySelectorAll('.nav-links a[data-nav]').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('data-nav') === r.name);
    });
    var old = document.getElementById('view');
    var fresh = document.createElement('main');
    fresh.id = 'view';
    fresh.className = 'view view-enter';
    old.parentNode.replaceChild(fresh, old);
    fn(fresh, r.params);
    Anim.observeReveals(fresh);
    updateProgress();
    window.scrollTo(0, 0);
  }

  /* ================= მთავარი გვერდი ================= */
  function renderHome(container) {
    var bank = window.BANK || [];
    var total = STATS.total;
    var learned = Store.learnedCount();
    var wrongN = Store.wrongIds().length;
    var bookN = Store.bookmarkIds().length;
    var hist = Store.history();

    var nextT = null;
    for (var i = 0; i < bank.length; i++) { if (!Store.isLearned(bank[i].id)) { nextT = bank[i]; break; } }
    if (!nextT) nextT = bank[0];

    var bars = [
      { label: 'ნასწავლი', n: learned, color: 'var(--green)' },
      { label: 'შეცდომები', n: wrongN, color: 'var(--red)' },
      { label: 'რჩეულები', n: bookN, color: 'var(--amber)' },
      { label: 'ნანახი', n: Store.seenCount(), color: 'var(--blue)' }
    ];
    var barsHTML = bars.map(function (b) {
      var w = total ? Math.round(b.n / total * 100) : 0;
      return '<div class="psb-row"><span>' + b.label + '</span>' +
        '<div class="psb-bar"><i style="width:' + w + '%;background:' + b.color + '"></i></div>' +
        '<b>' + b.n + '</b></div>';
    }).join('');

    var histHTML = hist.length
      ? hist.slice(0, 3).map(function (h) {
          var d = new Date(h.ts);
          return '<div class="history-row"><span class="hr-date">' + d.toLocaleDateString('ka-GE') + '</span>' +
            '<span class="badge ' + (h.passed ? 'badge-green' : 'badge-red') + '">' + (h.passed ? 'ჩაბარებული' : 'ჩაჭრილი') + '</span>' +
            '<span>' + h.correct + '/' + h.total + ' სწორი</span></div>';
        }).join('')
      : '<p class="muted small">ჯერ მცდელობა არ გაქვს — გაიარე იმიტაცია და ნახე, სად ხარ.</p>';

    var doneByTopic = {};
    bank.forEach(function (t) {
      if (!Store.isLearned(t.id)) return;
      (t.t || []).forEach(function (id) { doneByTopic[id] = (doneByTopic[id] || 0) + 1; });
    });
    var topicChips = (window.TOPICS || []).map(function (t) {
      var d = doneByTopic[t.id] || 0;
      return '<button class="chip" data-topic-go="' + t.id + '" title="' + AI.esc(t.name) + '">' +
        t.id + '. ' + AI.esc(t.name) + ' <b>' + d + '/' + t.count + '</b></button>';
    }).join('');

    var steps = [
      ['1', 'გაიარე ბილეთები <b>სწავლის რეჟიმში</b> — თემა-თემა, პასუხზე დაჭერით და განმარტების კითხვით.'],
      ['2', 'გახსენი <b>ხრიკები</b> — დაიზეპირე რიცხვების ცხრილი, ნახე პატერნები და ივარჯიშე „გამოიცანი და შეამოწმე“-ში.'],
      ['3', 'გაიარე <b>გამოცდის იმიტაცია</b> ტაიმერით — ნახე რამდენს აკეთებ 30 კითხვაზე და სად ცდები.'],
      ['4', 'გაიმეორე <b>შეცდომები</b> (სწავლა → შეცდომები) და ოფიციალურ გამოცდაზე მიდი მშვიდად.']
    ].map(function (s) {
      return '<div class="rule-box"><b>' + s[0] + '</b><span>' + s[1] + '</span></div>';
    }).join('');

    container.innerHTML =
      '<section class="hero">' +
        '<div class="mascot">' + MascotSVG() + '</div>' +
        '<div class="hero-road"></div>' +
        '<div class="traffic-light"><i></i><i></i><i></i></div>' +
        '<div class="hero-car">' + CarSVG() + '</div>' +
        '<h1>მართვის მოწმობის <em>თეორია</em> — ისწავლე, ივარჯიშე, ჩააბარე</h1>' +
        '<p class="lead">სრული ბაზა: <b>' + total + ' ბილეთი</b> და ' + STATS.topics + ' თემა — ყველა ბილეთი, გამოტოვებების გარეშე. ყოველ კითხვას აქვს განმარტება, ხრიკების ანალიზი და AI-ს მარტივი ახსნა.</p>' +
        '<div class="hero-actions">' +
          '<a class="btn btn-primary btn-lg" href="#/learn">' + Icon('play') + 'სწავლის დაწყება</a>' +
          '<a class="btn btn-lg" href="#/exam">' + Icon('clipboard') + 'გამოცდის იმიტაცია</a>' +
          '<a class="btn btn-lg" href="#/tricks">' + Icon('wand') + 'ხრიკების გრაფა</a>' +
        '</div>' +
        '<div class="hero-stats">' +
          '<div class="hstat"><b data-count="' + total + '">0</b><span>ბილეთი ბაზაში</span></div>' +
          '<div class="hstat"><b data-count="' + STATS.topics + '">0</b><span>თემა</span></div>' +
          '<div class="hstat"><b data-count="' + STATS.images + '">0</b><span>ბილეთი სურათით</span></div>' +
          '<div class="hstat"><b>25/30</b><span>ჩასაბარებლად</span></div>' +
        '</div>' +
      '</section>' +

      '<div class="quick-grid">' +
        '<a class="quick-card reveal" href="#/learn"><span class="go">' + Icon('arrowR') + '</span><div class="qic qic-amber">' + Icon('book') + '</div><h3>სწავლა</h3><p>ყველა ' + total + ' ბილეთი ფილტრებით, განმარტებებითა და AI ახსნით.</p></a>' +
        '<a class="quick-card reveal" href="#/exam"><span class="go">' + Icon('arrowR') + '</span><div class="qic qic-green">' + Icon('clipboard') + '</div><h3>იმიტაცია</h3><p>30 კითხვა, 25 სწორი = ჩაბარება. ტაიმერით ან მის გარეშე.</p></a>' +
        '<a class="quick-card reveal" href="#/tricks"><span class="go">' + Icon('arrowR') + '</span><div class="qic qic-violet">' + Icon('wand') + '</div><h3>ხრიკები</h3><p>პატერნები, ციფრების ცხრილი და ინტერაქტიული ვარჯიში.</p></a>' +
        '<a class="quick-card reveal" href="#/ai"><span class="go">' + Icon('arrowR') + '</span><div class="qic qic-blue">' + Icon('bot') + '</div><h3>AI ასისტენტი</h3><p>მკითხე ან აკრიფე ბილეთის ნომერი — მარტივად აგიხსნის.</p></a>' +
      '</div>' +

      '<div class="grid g2 mt22">' +
        '<div class="card reveal">' +
          '<div class="row spread mb14"><b>' + Icon('chart') + ' შენი პროგრესი</b><span class="badge badge-amber">' + learned + ' / ' + total + '</span></div>' +
          '<div class="progress-hero">' +
            '<div class="ring-lg">' +
              '<svg viewBox="0 0 36 36" class="ring"><circle class="ring-bg" cx="18" cy="18" r="15.5"></circle><circle class="ring-fg" id="home-ring" cx="18" cy="18" r="15.5"></circle></svg>' +
              '<div class="ring-center"><div><b id="home-ring-pct">0%</b><span>ნასწავლი</span></div></div>' +
            '</div>' +
            '<div class="psb">' + barsHTML + '</div>' +
          '</div>' +
          '<div class="car-track"><div class="bar"></div><div class="fill" id="home-fill" style="width:0%"></div><div class="mini-car" id="home-car">' + CarSVG() + '</div></div>' +
          '<p class="small muted mt8">' + (learned >= total ? 'ფინიში! ყველა ბილეთი ნასწავლია — გადადი იმიტაციაზე.' : 'მიზანი: 100% — მიიყვანე მანქანა ფინიშამდე.') + '</p>' +
        '</div>' +
        '<div class="card reveal">' +
          '<div class="row spread mb14"><b>' + Icon('bookOpen') + ' გააგრძელე სწავლა</b><span class="small muted">შემდეგი უსწავლელი</span></div>' +
          (learned >= total
            ? '<p class="muted small">ყველა ბილეთი ნასწავლად გაქვს მონიშნული. გადადი იმიტაციაზე ან გაიმეორე შეცდომები.</p>'
            : '<div class="ticket-num mb8"><b>#' + nextT.id + '</b>' +
              (nextT.t || []).slice(0, 2).map(function (id) {
                var tt = topicById(id);
                return tt ? '<span class="topic-chip">' + AI.esc(tt.name) + '</span>' : '';
              }).join('') + '</div>' +
              '<p style="font-size:15.5px;line-height:1.5">' + AI.esc(nextT.q.slice(0, 170)) + (nextT.q.length > 170 ? '…' : '') + '</p>') +
          '<div class="row mt14">' +
            '<a class="btn btn-primary" href="#/learn?id=' + nextT.id + '">' + Icon('arrowR') + 'გახსენი ბილეთი</a>' +
            '<button class="btn" id="home-rand">' + Icon('refresh') + 'შემთხვევითი</button>' +
          '</div>' +
          '<div class="divider"></div>' +
          '<div class="row spread">' +
            '<div><b>შეცდომების გამეორება</b><div class="small muted">' + (wrongN ? wrongN + ' ბილეთი გელოდება' : 'შეცდომები ჯერ არ გაქვს') + '</div></div>' +
            (wrongN ? '<a class="btn btn-danger" href="#/learn?status=wrong">' + Icon('flame') + 'გამეორება</a>' : '<span class="badge badge-green">' + Icon('check') + 'სუფთაა</span>') +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="grid g2 mt22">' +
        '<div class="card reveal">' +
          '<div class="row spread mb14"><b>' + Icon('clipboard') + ' გამოცდის იმიტაცია</b><span class="badge badge-green">30 კითხვა · 25 სწორი</span></div>' +
          '<p class="muted small mb14">რეალური პირობები: 30 შემთხვევითი კითხვა, 5 შეცდომის უფლება. სურვილისამებრ ტაიმერი. ყოველი მცდელობა ინახება ისტორიაში.</p>' +
          '<div class="row">' +
            '<a class="btn btn-primary" href="#/exam?start=1">' + Icon('play') + 'სრული გამოცდა (30)</a>' +
            '<a class="btn" href="#/exam">' + Icon('target') + 'პარამეტრები / ვარჯიში</a>' +
          '</div>' +
        '</div>' +
        '<div class="card reveal">' +
          '<div class="row spread mb14"><b>' + Icon('clock') + ' ბოლო მცდელობები</b><a class="small" href="#/exam">ისტორია →</a></div>' +
          histHTML +
        '</div>' +
      '</div>' +

      '<div class="card mt22 reveal">' +
        '<div class="row spread mb14"><b>' + Icon('layers') + ' თემები — აირჩიე და ივარჯიშე</b><span class="small muted">' + STATS.topics + ' თემა · ფრჩხილებში ნასწავლი/სულ</span></div>' +
        '<div class="row" style="gap:8px">' + topicChips + '</div>' +
      '</div>' +

      '<div class="card mt22 reveal">' +
        '<b>' + Icon('route') + ' მომზადების გეგმა — 4 ნაბიჯი</b>' +
        '<div class="exam-rules">' + steps + '</div>' +
      '</div>';

    container.querySelectorAll('[data-count]').forEach(function (el) {
      Anim.countUp(el, Number(el.getAttribute('data-count')), 1100);
    });
    if (container.querySelector('#home-car')) {
      setTimeout(updateProgress, 60);
    }
    container.addEventListener('click', function (e) {
      var g = e.target.closest('[data-topic-go]');
      if (g) { location.hash = '#/learn?topic=' + g.getAttribute('data-topic-go'); return; }
      if (e.target.closest('#home-rand')) {
        var t = bank[(Math.random() * bank.length) | 0];
        if (t) location.hash = '#/learn?id=' + t.id;
      }
    });
  }

  /* ================= AI გვერდი ================= */
  var chat = { msgs: [], busy: false };
  var SUGGEST = [
    'სად აკრძალულია გასწრება?',
    'სიჩქარის ლიმიტები',
    'რას ნიშნავს ყვითელი მოციმციმე შუქნიშანი?',
    'ბუქსირების წესები',
    'რა არის ტყუპი ბილეთი?'
  ];

  function appendMsg(log, m) {
    if (!log) return;
    var el = document.createElement('div');
    el.className = 'msg msg-' + (m.who === 'user' ? 'user' : (m.who === 'sys' ? 'sys' : 'bot'));
    el.innerHTML = m.html;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
  }

  function chatPush(who, html) {
    chat.msgs.push({ who: who, html: html });
    if (chat.msgs.length > 80) chat.msgs.splice(0, chat.msgs.length - 80);
    appendMsg(document.getElementById('ai-log'), chat.msgs[chat.msgs.length - 1]);
  }

  function showExplain(id, scroll) {
    var box = document.getElementById('ai-explain-box');
    if (!box) return;
    var t = bankFind(id);
    if (!t) return;
    box.innerHTML = AI.explainHTML(t) +
      '<div class="row mt14">' +
      '<button class="btn btn-sm" data-goto="' + t.id + '">' + Icon('book') + 'სწავლის რეჟიმში გახსნა</button>' +
      '<span class="small muted">ბილეთი #' + t.id + '</span></div>';
    if (scroll) {
      setTimeout(function () { box.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 40);
    }
  }

  function findRowsHTML(t) {
    return '<button class="ex-row" data-aiticket="' + t.id + '"><span class="exid">#' + t.id + '</span>' +
      '<span class="exq">' + AI.esc(t.q.slice(0, 130)) + (t.q.length > 130 ? '…' : '') + '</span></button>';
  }

  function doFind() {
    var el = document.getElementById('ai-find');
    var resBox = document.getElementById('ai-find-res');
    if (!el || !resBox) return;
    var v = el.value.trim();
    if (!v) { resBox.innerHTML = ''; return; }
    var num = v.match(/^#?\s*(\d{1,4})$/);
    if (num) {
      var t = bankFind(Number(num[1]));
      if (t) { resBox.innerHTML = findRowsHTML(t); showExplain(t.id, true); return; }
    }
    var found = AI.searchBank(v, 6);
    resBox.innerHTML = found.length
      ? found.map(findRowsHTML).join('')
      : '<div class="small muted">ვერ მოიძებნა — სცადე სხვა სიტყვა ან ბილეთის ნომერი.</div>';
  }

  function ask(text) {
    if (chat.busy) return;
    chatPush('user', AI.esc(text));
    chat.busy = true;
    var log = document.getElementById('ai-log');
    var typing = document.createElement('div');
    typing.className = 'msg msg-bot';
    typing.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
    if (log) { log.appendChild(typing); log.scrollTop = log.scrollHeight; }

    function finish(html) {
      if (typing.parentNode) typing.parentNode.removeChild(typing);
      chat.busy = false;
      chatPush('bot', html);
    }

    var num = text.match(/^\s*#?\s*(\d{1,4})\s*$/);
    if (num) {
      var tid = bankFind(Number(num[1]));
      if (tid) {
        setTimeout(function () {
          finish('<div class="ai-ticket" style="background:transparent;border:none;padding:0"><b>ბილეთი #' + tid.id + ':</b> ' + AI.esc(tid.q) + '</div>' +
            AI.explainHTML(tid, { noOfficial: true }));
          showExplain(tid.id, true);
        }, 320);
        return;
      }
    }

    var key = Store.get('aiKey');
    if (key) {
      var ctx = AI.searchBank(text, 3);
      AI.cloudAsk(text, ctx).then(function (answer) {
        finish('<div class="small muted mb8">' + Icon('sparkle') + ' OpenAI · ' + AI.esc(Store.get('aiModel') || '') + '</div>' +
          AI.esc(answer).replace(/\n/g, '<br>'));
      }).catch(function () {
        var r = AI.askLocal(text);
        finish('<div class="small muted mb8">OpenAI მიუწვდომელია — ვპასუხობ ლოკალური ბაზიდან.</div>' + r.html);
      });
    } else {
      setTimeout(function () {
        var r = AI.askLocal(text);
        finish(r.html);
      }, 420);
    }
  }

  function renderAI(container) {
    var hasKey = !!Store.get('aiKey');
    container.innerHTML =
      '<div class="section-title"><span class="ic">' + Icon('bot') + '</span><h2 style="font-size:inherit">AI ასისტენტი</h2></div>' +
      '<p class="section-sub">მკითხე ნებისმიერი წესი ან უბრალოდ აკრიფე ბილეთის ნომერი — აგიხსნის მარტივი სიტყვებით: რომელი პასუხია სწორი, რატომ და როგორ დაიმახსოვრო. მუშაობს ოფლაინაც.</p>' +
      '<div class="ai-layout">' +
        '<div class="chat-card">' +
          '<div class="chat-head"><span class="aic">' + Icon('sparkle') + '</span>' +
            '<div><b>AI ჩატი</b><div class="small muted">' + (hasKey ? 'OpenAI · ' + AI.esc(Store.get('aiModel') || '') : 'ლოკალური რეჟიმი — უფასო, ოფლაინ') + '</div></div>' +
            '<span class="chat-status">' + (hasKey ? 'ღრუბლოვანი' : 'ლოკალური') + '</span></div>' +
          '<div class="chat-log" id="ai-log"></div>' +
          '<div class="chat-chips" id="ai-chips">' + SUGGEST.map(function (s) {
            return '<button class="chip" data-suggest="' + AI.esc(s) + '">' + AI.esc(s) + '</button>';
          }).join('') + '</div>' +
          '<form class="chat-input" id="ai-form">' +
            '<input class="input" id="ai-q" placeholder="დაწერე შეკითხვა... (მაგ. „სად აკრძალულია გასწრება?“)" autocomplete="off">' +
            '<button class="btn btn-primary" type="submit" aria-label="გაგზავნა">' + Icon('send') + '</button>' +
          '</form>' +
        '</div>' +
        '<div class="ai-ticket-panel">' +
          '<div class="row spread mb14"><b>' + Icon('bookOpen') + ' ბილეთის ახსნა</b><span class="small muted">სრული განმარტება</span></div>' +
          '<div class="ai-pick">' +
            '<input class="input" id="ai-find" placeholder="ბილეთის ნომერი ან სიტყვა (მაგ. 415, გასწრება)..." autocomplete="off">' +
            '<div class="row">' +
              '<button class="btn btn-sm btn-primary" id="ai-find-btn">' + Icon('search') + 'ძებნა</button>' +
              '<button class="btn btn-sm" id="ai-rand">' + Icon('refresh') + 'შემთხვევითი</button>' +
              '<button class="btn btn-sm" id="ai-lastwrong">' + Icon('xCircle') + 'ბოლო შეცდომა</button>' +
            '</div>' +
            '<div id="ai-find-res" class="examples"></div>' +
          '</div>' +
          '<div class="divider"></div>' +
          '<div id="ai-explain-box"></div>' +
        '</div>' +
      '</div>';

    if (!chat.msgs.length) {
      chat.msgs.push({
        who: 'bot',
        html: 'გამარჯობა! მე თეორიის ასისტენტი ვარ 🙂<br>შემიძლია: წესის მარტივად ახსნა, ბილეთის პოვნა ნომრით და სწორი პასუხის დასაბუთება.<br>სცადე, მაგალითად: <b>„სად აკრძალულია გასწრება?“</b> ან აკრიფე ნომერი — <b>415</b>.'
      });
    }
    var log = container.querySelector('#ai-log');
    chat.msgs.forEach(function (m) { appendMsg(log, m); });

    var wrongIds = Store.wrongIds();
    var start = wrongIds.length ? bankFind(wrongIds[0]) : null;
    if (!start) {
      var bank = window.BANK || [];
      for (var i = 0; i < bank.length; i++) { if (!Store.isLearned(bank[i].id)) { start = bank[i]; break; } }
      start = start || bank[0];
    }
    if (start) showExplain(start.id, false);

    container.querySelector('#ai-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var inp = container.querySelector('#ai-q');
      var text = inp.value.trim();
      if (!text) return;
      inp.value = '';
      ask(text);
    });
    container.querySelector('#ai-chips').addEventListener('click', function (e) {
      var c = e.target.closest('[data-suggest]');
      if (c) ask(c.getAttribute('data-suggest'));
    });
    var findEl = container.querySelector('#ai-find');
    findEl.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); doFind(); } });
    container.querySelector('#ai-find-btn').addEventListener('click', doFind);

    container.addEventListener('click', function (e) {
      var off = e.target.closest('[id^="off-"]');
      if (off) {
        var box = document.getElementById('offbox-' + off.id.slice(4));
        if (box) box.hidden = !box.hidden;
        return;
      }
      var twin = e.target.closest('[data-twin]');
      if (twin) { showExplain(Number(twin.getAttribute('data-twin')), true); return; }
      var go = e.target.closest('[data-goto]');
      if (go) { location.hash = '#/learn?id=' + go.getAttribute('data-goto'); return; }
      var rb = e.target.closest('#ai-rand');
      if (rb) {
        var bank2 = window.BANK || [];
        var t2 = bank2[(Math.random() * bank2.length) | 0];
        if (t2) showExplain(t2.id, true);
        return;
      }
      var wb = e.target.closest('#ai-lastwrong');
      if (wb) {
        var ids = Store.wrongIds();
        if (!ids.length) { toast('შეცდომები არ გაქვს — მშვენიერია!', 'ok'); return; }
        showExplain(ids[0], true);
        return;
      }
      var row = e.target.closest('[data-aiticket]');
      if (row) { showExplain(Number(row.getAttribute('data-aiticket')), true); return; }
      var atw = e.target.closest('[data-aitwin]');
      if (atw) { showExplain(Number(atw.getAttribute('data-aitwin')), true); return; }
    });
  }

  /* ================= პარამეტრები ================= */
  function closeModal() {
    modalRoot.hidden = true;
    modalRoot.innerHTML = '';
    modalRoot.onclick = null;
    modalRoot.onchange = null;
  }

  function openSettings() {
    var sound = !!Store.get('sound');
    var timerOn = !!Store.get('timerOn');
    modalRoot.hidden = false;
    modalRoot.innerHTML =
      '<div class="modal">' +
        '<div class="modal-head"><b>' + Icon('gear') + ' პარამეტრები</b>' +
          '<button class="btn btn-icon" data-close="1" aria-label="დახურვა">' + Icon('x') + '</button></div>' +
        '<div class="modal-body">' +
          '<div class="set-row"><div><div class="st">ხმოვანი ეფექტები</div><div class="sd">სწორი / არასწორი პასუხის ბგერები და ფანფარა</div></div>' +
            '<button class="switch' + (sound ? ' on' : '') + '" id="set-sound" aria-label="ხმა"></button></div>' +
          '<div class="set-row"><div><div class="st">ტაიმერი ნაგულისხმევად</div><div class="sd">იმიტაცია ავტომატურად დაიწყება ტაიმერით</div></div>' +
            '<button class="switch' + (timerOn ? ' on' : '') + '" id="set-timer" aria-label="ტაიმერი"></button></div>' +
          '<div class="set-row"><div><div class="st">ტაიმერის დრო</div><div class="sd">5-90 წუთი (ოფიციალურად დრო შეზღუდვა არ წერია — ეს სავარჯიშო რეჟიმია)</div></div>' +
            '<div style="width:110px"><input class="input" type="number" min="5" max="90" id="set-min" value="' + Store.get('timerMin') + '"></div></div>' +
          '<div class="divider"></div>' +
          '<div class="st mb8">' + Icon('key') + ' OpenAI (სურვილისამებრ)</div>' +
          '<div class="sd mb8">გასაღები ინახება მხოლოდ შენს ბრაუზერში (localStorage) და იგზავნება პირდაპირ api.openai.com-ზე. გარეშეც ყველაფერი მუშაობს — AI პასუხობს ლოკალური ბაზიდან.</div>' +
          '<input class="input mb8" type="password" id="set-key" placeholder="sk-..." value="' + AI.esc(Store.get('aiKey') || '') + '">' +
          '<div class="row"><span class="small muted">მოდელი:</span>' +
            '<select class="input" id="set-model" style="max-width:200px">' +
            ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-3.5-turbo'].map(function (m) {
              return '<option' + (Store.get('aiModel') === m ? ' selected' : '') + '>' + m + '</option>';
            }).join('') + '</select></div>' +
          '<div class="divider"></div>' +
          '<div class="st mb8">' + Icon('layers') + ' მონაცემები</div>' +
          '<div class="row">' +
            '<button class="btn btn-sm" id="set-export">' + Icon('book') + 'ექსპორტი</button>' +
            '<button class="btn btn-sm" id="set-import">' + Icon('plus') + 'იმპორტი</button>' +
            '<button class="btn btn-sm btn-danger" id="set-reset">' + Icon('trash') + 'პროგრესის განულება</button>' +
            '<input type="file" id="set-file" accept=".json,application/json" hidden>' +
          '</div>' +
        '</div>' +
        '<div class="modal-foot"><button class="btn btn-primary" data-close="1">მზადაა</button></div>' +
      '</div>';

    modalRoot.onclick = function (e) {
      if (e.target === modalRoot || e.target.closest('[data-close]')) { closeModal(); return; }
      var sw = e.target.closest('#set-sound');
      if (sw) {
        var on = !sw.classList.contains('on');
        sw.classList.toggle('on', on);
        Store.set('sound', on);
        if (on) Anim.sound.correct();
        return;
      }
      var tw = e.target.closest('#set-timer');
      if (tw) {
        var ton = !tw.classList.contains('on');
        tw.classList.toggle('on', ton);
        Store.set('timerOn', ton);
        return;
      }
      var ex = e.target.closest('#set-export');
      if (ex) {
        try {
          var blob = new Blob([Store.exportData()], { type: 'application/json' });
          var a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'spot-progresi.json';
          document.body.appendChild(a);
          a.click();
          a.remove();
          toast('პროგრესი ჩამოიტვირთა ფაილად', 'ok');
        } catch (err) { toast('ექსპორტი ვერ შესრულდა', 'err'); }
        return;
      }
      if (e.target.closest('#set-import')) {
        var f = document.getElementById('set-file');
        if (f) f.click();
        return;
      }
      if (e.target.closest('#set-reset')) {
        if (confirm('ნამდვილად გინდა პროგრესის განულება? ნასწავლი ბილეთები, შეცდომები და გამოცდის ისტორია წაიშლება.')) {
          Store.reset();
          closeModal();
          toast('პროგრესი განულდა', 'amber');
          navigate();
        }
        return;
      }
    };

    modalRoot.onchange = function (e) {
      var id = e.target.id;
      if (id === 'set-min') {
        var v = Math.max(5, Math.min(90, Number(e.target.value) || 30));
        e.target.value = v;
        Store.set('timerMin', v);
      } else if (id === 'set-key') {
        Store.set('aiKey', e.target.value.trim());
        toast(e.target.value.trim() ? 'OpenAI გასაღები შენახულია' : 'გასაღები წაიშალა', 'ok');
      } else if (id === 'set-model') {
        Store.set('aiModel', e.target.value);
      } else if (id === 'set-file') {
        var file = e.target.files && e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () {
          try {
            Store.importData(String(reader.result));
            closeModal();
            toast('პროგრესი აიტვირთა', 'ok');
            navigate();
          } catch (err) { toast('ფაილი არასწორია', 'err'); }
        };
        reader.readAsText(file);
      }
    };
  }

  /* ================= გაშვება ================= */
  function hydrate() {
    document.querySelectorAll('[data-icon]').forEach(function (el) {
      el.innerHTML = Icon(el.getAttribute('data-icon'));
    });
    var bw = document.getElementById('brand-wheel');
    if (bw) bw.innerHTML = MascotSVG();
  }

  hydrate();
  document.getElementById('btn-settings').addEventListener('click', openSettings);
  document.getElementById('btn-burger').addEventListener('click', function () {
    navLinks.classList.toggle('open');
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modalRoot.hidden) closeModal();
  });
  window.addEventListener('hashchange', navigate);

  window.App = { toast: toast, updateProgress: updateProgress, navigate: navigate, openSettings: openSettings, closeModal: closeModal };
  Store.onChange(function (reason) {
    if (reason !== 'cloud') return;
    updateProgress();
    if (modalRoot.hidden && parseHash().name === 'home') navigate();
  });
  if (window.Cloud) Cloud.init();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* ოფლაინ ქეში მიუწვდომელია */ });
    });
  }
  navigate();
})();
