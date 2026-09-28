/* სწავლის რეჟიმი: ბილეთების ბრაუზერი ფილტრებით */
(function () {
  'use strict';

  var PAGE = 24;
  var state = { topic: 0, status: 'all', q: '', shown: PAGE, focusId: null, results: [], answered: {} };

  function topicName(id) {
    var t = (window.TOPICS || []).find(function (x) { return x.id === id; });
    return t ? t.name : ('#' + id);
  }

  function matchStatus(t) {
    switch (state.status) {
      case 'new': return !Store.isLearned(t.id) && !Store.isWrong(t.id);
      case 'learned': return Store.isLearned(t.id);
      case 'wrong': return Store.isWrong(t.id);
      case 'book': return Store.isBookmarked(t.id);
      default: return true;
    }
  }

  function matchQuery(t) {
    if (!state.q) return true;
    var q = state.q.toLowerCase();
    if (t.q.toLowerCase().indexOf(q) !== -1) return true;
    for (var i = 0; i < t.a.length; i++) if (t.a[i].toLowerCase().indexOf(q) !== -1) return true;
    return false;
  }

  function filtered() {
    return window.BANK.filter(function (t) {
      if (state.topic && (t.t || []).indexOf(state.topic) === -1) return false;
      if (!matchStatus(t)) return false;
      if (!matchQuery(t)) return false;
      return true;
    });
  }

  function cardHTML(t, idx) {
    var isAnswered = !!state.answered[t.id];
    var topics = (t.t || []).slice(0, 2).map(function (id) {
      return '<span class="topic-chip" data-topic="' + id + '">' + AI.esc(topicName(id)) + '</span>';
    }).join('');
    var badges = '';
    if (Store.isLearned(t.id)) badges += '<span class="badge badge-green">' + Icon('check') + 'ნასწავლი</span>';
    if (Store.isWrong(t.id)) badges += '<span class="badge badge-red">' + Icon('x') + 'შეცდომა</span>';
    var twins = AI.twinsOf(t.id);
    var hasTwinNote = twins.length ? '<span class="badge badge-blue">' + Icon('twin') + 'ტყუპი: ' + twins.length + '</span>' : '';

    var answers = t.a.map(function (a, i) {
      var cls = 'ans';
      if (isAnswered) {
        if (i === t.c) cls += ' correct pop';
        else if (state.answered[t.id] === i + 1) cls += ' wrong shake';
        else cls += ' dim';
      }
      var mark = isAnswered ? '<span class="mark">' + Icon(i === t.c ? 'checkCircle' : 'xCircle') + '</span>' : '';
      return '<button class="' + cls + '" data-ans="' + (i + 1) + '"' + (isAnswered ? ' disabled' : '') + '>' +
        '<span class="num">' + (i + 1) + '</span><span>' + AI.esc(a) + '</span>' + mark + '</button>';
    }).join('');

    var explain = '';
    if (isAnswered) {
      explain = '<div class="explain"><div class="explain-head">' + Icon('bulb') +
        (state.answered[t.id] === t.c + 1 ? 'სწორია! განმარტება:' : 'არასწორია. განმარტება:') +
        '</div><div class="explain-body">' + (t.e ? AI.esc(t.e) : 'ამ ბილეთს განმარტება არ აქვს.') +
        '<div class="row mt14"><button class="btn btn-sm" data-aiexplain="' + t.id + '">' + Icon('sparkle') + 'AI-ს მარტივი ახსნა</button>' +
        (twins.length ? '<button class="btn btn-sm" data-twins="' + t.id + '">' + Icon('twin') + 'ტყუპები (' + twins.length + ')</button>' : '') +
        '</div><div class="ai-extra" data-extra="' + t.id + '"></div></div></div>';
    }

    var img = t.img ? '<img class="ticket-img" src="' + t.img + '" alt="ბილეთის სურათი #' + t.id + '" loading="lazy" data-zoom="' + t.id + '">' : '';

    return '<article class="ticket reveal" id="ticket-' + t.id + '" data-id="' + t.id + '">' +
      '<div class="ticket-head"><div class="ticket-num"><b>#' + t.id + '</b>' + topics + hasTwinNote + badges + '</div>' +
      '<div class="row">' +
      '<button class="btn btn-icon" data-book="' + t.id + '" title="რჩეულებში" style="' + (Store.isBookmarked(t.id) ? 'color:var(--amber)' : '') + '">' + Icon('bookmark') + '</button>' +
      '<button class="btn btn-icon" data-learned="' + t.id + '" title="ნასწავლად მონიშვნა" style="' + (Store.isLearned(t.id) ? 'color:var(--green)' : '') + '">' + Icon('checkCircle') + '</button>' +
      '</div></div>' +
      '<div class="ticket-q">' + AI.esc(t.q) + '</div>' +
      img +
      '<div class="answers">' + answers + '</div>' + explain +
      '<div class="ticket-foot"><span class="small muted">ბილეთი ' + (idx + 1) + '</span>' +
      '<div class="tfoot-right">' +
      '<button class="btn btn-sm" data-neighbor="' + t.id + '" data-dir="-1">' + Icon('chevL') + 'წინა</button>' +
      '<button class="btn btn-sm" data-neighbor="' + t.id + '" data-dir="1">შემდეგი' + Icon('chevR') + '</button>' +
      '</div></div></article>';
  }

  function statusCounts() {
    var c = { all: window.BANK.length, new: 0, learned: 0, wrong: 0, book: 0 };
    window.BANK.forEach(function (t) {
      if (Store.isLearned(t.id)) c.learned++;
      else if (Store.isWrong(t.id)) c.wrong++;
      else c.new++;
      if (Store.isBookmarked(t.id)) c.book++;
    });
    return c;
  }

  function chipsHTML() {
    var c = statusCounts();
    var items = [
      ['all', 'ყველა', c.all],
      ['new', 'ახალი', c.new],
      ['wrong', 'შეცდომები', c.wrong],
      ['learned', 'ნასწავლი', c.learned],
      ['book', 'რჩეულები', c.book]
    ];
    return items.map(function (it) {
      return '<span class="chip' + (state.status === it[0] ? ' on' : '') + '" data-status="' + it[0] + '">' +
        it[1] + ' <b>' + it[2] + '</b></span>';
    }).join('');
  }

  function renderList(container) {
    state.results = filtered();
    var slice = state.results.slice(0, state.shown);
    var list = container.querySelector('#learn-list');
    list.innerHTML = slice.length
      ? slice.map(function (t, i) { return cardHTML(t, i); }).join('')
      : '<div class="empty">' + Icon('search') + '<p>ვერაფერი მოიძებნა. შეცვალე ფილტრი ან ძებნის სიტყვა.</p></div>';
    var more = container.querySelector('#load-more-wrap');
    if (state.results.length > state.shown) {
      more.innerHTML = '<button class="btn" id="load-more">' + Icon('plus') + 'კიდევ ' + Math.min(PAGE, state.results.length - state.shown) + ' ბილეთი <span class="muted small">(' + state.shown + '/' + state.results.length + ')</span></button>';
    } else {
      more.innerHTML = state.results.length ? '<span class="small muted">ყველა ნაჩვენებია — ' + state.results.length + ' ბილეთი</span>' : '';
    }
    container.querySelector('#learn-count').textContent = 'ნაჩვენებია ' + slice.length + ' / ' + state.results.length;
    Anim.observeReveals(list);
    if (state.focusId) scrollToTicket(state.focusId);
  }

  function scrollToTicket(id) {
    var el = document.getElementById('ticket-' + id);
    if (el) {
      el.classList.add('focus');
      setTimeout(function () { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60);
      setTimeout(function () { el.classList.remove('focus'); }, 3400);
      state.focusId = null;
    }
  }

  function render(container, params) {
    params = params || {};
    if (params.topic !== undefined) state.topic = Number(params.topic) || 0;
    if (params.status) state.status = params.status;
    if (params.id) {
      state.topic = 0; state.status = 'all'; state.q = '';
      state.focusId = Number(params.id);
    }
    state.shown = PAGE;

    var topicOpts = '<option value="0">ყველა თემა (921)</option>' +
      (window.TOPICS || []).map(function (t) {
        return '<option value="' + t.id + '"' + (state.topic === t.id ? ' selected' : '') + '>' + t.id + '. ' + t.name + ' (' + t.count + ')</option>';
      }).join('');

    container.innerHTML =
      '<div class="section-title"><span class="ic">' + Icon('bookOpen') + '</span><h2 style="font-size:inherit">სწავლის რეჟიმი</h2></div>' +
      '<p class="section-sub">ყველა 921 ბილეთი — აირჩიე პასუხი, მაშინვე ნახე განმარტება და AI-ს მარტივი ახსნა. კლავიატურითაც მუშაობს: <b>1-4</b> — პასუხი.</p>' +
      '<div class="card learn-filters">' +
      '<div class="filter-row">' +
      '<div class="search-wrap"><span class="si">' + Icon('search') + '</span>' +
      '<input class="input" id="learn-q" placeholder="ძებნა კითხვაში ან პასუხებში..." value="' + AI.esc(state.q) + '"></div>' +
      '<select class="input" id="learn-topic" style="max-width:320px">' + topicOpts + '</select>' +
      '</div>' +
      '<div class="filter-row" id="status-chips">' + chipsHTML() + '</div>' +
      '</div>' +
      '<div class="learn-meta"><span id="learn-count"></span><span class="small">სწორი პასუხი მწვანედ, შეცდომა წითლად — ერთი დაჭერით</span></div>' +
      '<div id="learn-list"></div>' +
      '<div class="load-more-wrap" id="load-more-wrap"></div>';

    renderList(container);
  }

  function onAction(e, container) {
    var tg = e.target.closest('[data-ans],[data-status],[data-topic],[data-book],[data-learned],[data-aiexplain],[data-twins],[data-neighbor],[data-zoom],[data-goto]');
    if (!tg) return;

    if (tg.hasAttribute('data-zoom')) {
      var img = tg.getAttribute('src');
      if (img && img.indexOf('http') === 0) { window.open(img, '_blank'); return; }
      var lb = document.createElement('div');
      lb.className = 'lightbox';
      lb.innerHTML = '<img src="' + img + '" alt="">';
      lb.addEventListener('click', function () { lb.remove(); });
      document.body.appendChild(lb);
      return;
    }

    if (tg.hasAttribute('data-ans')) {
      var card = tg.closest('.ticket');
      var id = Number(card.getAttribute('data-id'));
      var pick = Number(tg.getAttribute('data-ans'));
      if (state.answered[id]) return;
      var t = window.BANK.find(function (x) { return x.id === id; });
      if (!t) return;
      state.answered[id] = pick;
      Store.markSeen(id);
      if (pick === t.c + 1) {
        Store.markLearned(id);
        Store.clearWrong(id);
        Anim.sound.correct();
      } else {
        Store.markWrong(id);
        Anim.sound.wrong();
      }
      var idx = state.results.indexOf(t);
      var tmp = document.createElement('div');
      tmp.innerHTML = cardHTML(t, idx === -1 ? 0 : idx);
      card.replaceWith(tmp.firstChild);
      window.App.updateProgress();
      return;
    }

    if (tg.hasAttribute('data-book')) {
      var bid = Number(tg.getAttribute('data-book'));
      var on = Store.toggleBookmark(bid);
      tg.style.color = on ? 'var(--amber)' : '';
      window.App.toast(on ? 'დაემატა რჩეულებში' : 'ამოღებულია რჩეულებიდან', 'amber');
      if (state.status === 'book') { container.querySelector('#status-chips').innerHTML = chipsHTML(); renderList(container); }
      return;
    }

    if (tg.hasAttribute('data-learned')) {
      var lid = Number(tg.getAttribute('data-learned'));
      if (Store.isLearned(lid)) { Store.unmarkLearned(lid); tg.style.color = ''; }
      else { Store.markLearned(lid); tg.style.color = 'var(--green)'; Anim.confetti({ count: 20, burst: false }); Anim.sound.correct(); }
      window.App.updateProgress();
      if (state.status !== 'all') { container.querySelector('#status-chips').innerHTML = chipsHTML(); renderList(container); }
      return;
    }

    if (tg.hasAttribute('data-aiexplain')) {
      var aid = Number(tg.getAttribute('data-aiexplain'));
      var box = container.querySelector('[data-extra="' + aid + '"]');
      if (!box) return;
      if (box.innerHTML) { box.innerHTML = ''; return; }
      var at = window.BANK.find(function (x) { return x.id === aid; });
      box.innerHTML = AI.explainHTML(at, { noOfficial: true });
      Anim.observeReveals(box);
      return;
    }

    if (tg.hasAttribute('data-twins')) {
      var twid = Number(tg.getAttribute('data-twins'));
      var twins = AI.twinsOf(twid);
      var box2 = container.querySelector('[data-extra="' + twid + '"]');
      if (box2) {
        box2.innerHTML = '<div class="divider"></div><b>ტყუპი ბილეთები:</b><div class="twin-links mt8">' +
          twins.map(function (x) { return '<button class="twin-link" data-goto="' + x + '">#' + x + '</button>'; }).join('') + '</div>';
      }
      return;
    }

    if (tg.hasAttribute('data-goto')) {
      location.hash = '#/learn?id=' + tg.getAttribute('data-goto');
      return;
    }

    if (tg.hasAttribute('data-topic')) {
      state.topic = Number(tg.getAttribute('data-topic'));
      location.hash = '#/learn?topic=' + state.topic;
      return;
    }

    if (tg.hasAttribute('data-status')) {
      state.status = tg.getAttribute('data-status');
      state.shown = PAGE;
      container.querySelector('#status-chips').innerHTML = chipsHTML();
      renderList(container);
      return;
    }

    if (tg.hasAttribute('data-neighbor')) {
      var nid = Number(tg.getAttribute('data-neighbor'));
      var dir = Number(tg.getAttribute('data-dir'));
      var pos = state.results.map(function (x) { return x.id; }).indexOf(nid);
      var next = state.results[pos + dir];
      if (!next) { window.App.toast(dir > 0 ? 'ეს ბოლო ბილეთია სიაში' : 'ეს პირველი ბილეთია სიაში', 'amber'); return; }
      if (state.results.indexOf(next) >= state.shown) { state.shown = Math.min(state.results.length, state.shown + PAGE); renderList(container); }
      scrollToTicket(next.id);
      return;
    }
  }

  function bind(container) {
    container.addEventListener('click', function (e) { onAction(e, container); });
    var qEl = container.querySelector('#learn-q');
    var debounce = null;
    qEl.addEventListener('input', function () {
      clearTimeout(debounce);
      debounce = setTimeout(function () {
        state.q = qEl.value.trim();
        state.shown = PAGE;
        renderList(container);
      }, 220);
    });
    container.querySelector('#learn-topic').addEventListener('change', function () {
      state.topic = Number(this.value) || 0;
      state.shown = PAGE;
      renderList(container);
    });
    container.querySelector('#load-more-wrap').addEventListener('click', function (e) {
      if (e.target.closest('#load-more')) {
        state.shown = Math.min(state.results.length, state.shown + PAGE);
        renderList(container);
      }
    });
    container.addEventListener('keydown', function (e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      var card = e.target.closest('.ticket');
      if (!card || state.answered[Number(card.getAttribute('data-id'))]) return;
      var n = parseInt(e.key, 10);
      if (n >= 1 && n <= 4) {
        var btn = card.querySelector('[data-ans="' + n + '"]');
        if (btn) { btn.click(); }
      }
    });
    container.setAttribute('tabindex', '0');
  }

  window.Learn = { render: render, bind: bind, state: state };
})();
