/* ხრიკები: მონაცემებზე დაფუძნებული პატერნები + გრაფიკები + ვარჯიში */
(function () {
  'use strict';

  var trainer = { cur: null, right: 0, total: 0, answered: false };

  function P() { return window.PATTERNS || {}; }

  function hBars(rows, opts) {
    opts = opts || {};
    var W = 580, LH = opts.labelW || 190, RH = 64, BH = 24, GAP = 12;
    var H = rows.length * (BH + GAP) + 10;
    var max = opts.max || 100;
    var inner = W - LH - RH;
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img">';
    if (opts.baseline != null) {
      var bx = LH + inner * (opts.baseline / max);
      svg += '<line x1="' + bx + '" y1="0" x2="' + bx + '" y2="' + H + '" stroke="rgba(255,255,255,.25)" stroke-dasharray="4 4"/>' +
        '<text x="' + bx + '" y="' + (H - 1) + '" class="bar-lbl" text-anchor="middle">' + (opts.baselineLabel || opts.baseline + '%') + '</text>';
    }
    rows.forEach(function (r, i) {
      var y = i * (BH + GAP) + 4;
      var w = Math.max(2, inner * (r.pct / max));
      var color = r.color || 'var(--amber)';
      svg += '<text x="4" y="' + (y + 17) + '" class="bar-lbl">' + AI.esc(r.label) + '</text>' +
        '<rect x="' + LH + '" y="' + y + '" width="' + inner + '" height="' + BH + '" rx="7" fill="rgba(255,255,255,.05)"/>' +
        '<rect x="' + LH + '" y="' + y + '" width="' + w + '" height="' + BH + '" rx="7" fill="' + color + '" opacity=".88"/>' +
        '<text x="' + (LH + inner + 6) + '" y="' + (y + 17) + '" class="bar-val">' + r.pct + '%' + (r.n != null ? '  (' + r.n + ')' : '') + '</text>';
    });
    svg += '</svg>';
    return '<div class="chart">' + svg + '</div>';
  }

  function positionChart() {
    var pbc = P().positionByCount || {};
    var counts = ['2', '3', '4'].filter(function (k) { return pbc[k]; });
    if (!counts.length) return '';
    var W = 580, BH = 20, GAP2 = 26, GROUP = 12;
    var LH = 96, RH = 20;
    var inner = W - LH - RH;
    var H = counts.length * (BH * 4 + GAP2) + 16;
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img">';
    counts.forEach(function (k, gi) {
      var g = pbc[k];
      var y0 = gi * (BH * 4 + GAP2) + 8;
      svg += '<text x="4" y="' + (y0 + 24) + '" class="bar-lbl">' + k + '-პასუხიანი (' + g.n + ')</text>';
      g.pos.forEach(function (p, pi) {
        var y = y0 + pi * BH;
        var w = Math.max(3, inner * (p.pct / 60));
        var col = p.pct < 25 ? 'var(--red)' : (p.pct > 37 ? 'var(--green)' : 'var(--amber)');
        svg += '<rect x="' + LH + '" y="' + y + '" width="' + inner + '" height="' + (BH - 5) + '" rx="6" fill="rgba(255,255,255,.05)"/>' +
          '<rect x="' + LH + '" y="' + y + '" width="' + w + '" height="' + (BH - 5) + '" rx="6" fill="' + col + '" opacity=".85"/>' +
          '<text x="' + (LH - 8) + '" y="' + (y + 12) + '" class="bar-lbl" text-anchor="end">ვარ. ' + p.pos + '</text>' +
          '<text x="' + (LH + w + 7) + '" y="' + (y + 12) + '" class="bar-val">' + p.pct + '%</text>';
      });
    });
    svg += '</svg>';
    return '<div class="chart">' + svg + '</div>';
  }

  function kwRows() {
    var labels = {
      'მხოლოდ': ['მხოლოდ', 'var(--red)'],
      'ორივე': ['ორივე', 'var(--red)'],
      'უნდა': ['უნდა', 'var(--amber)'],
      'აკრძალულ': ['აკრძალულია', 'var(--amber)'],
      'სიჩქარე': ['სიჩქარე', 'var(--amber)'],
      'ქვეით': ['ქვეითი', 'var(--blue)'],
      'შეიძლება': ['შეიძლება', 'var(--blue)'],
      'უპირატესობ': ['უპირატესობა', 'var(--blue)'],
      'სამედიცინო': ['სამედიცინო', 'var(--red)']
    };
    return (P().keywords || []).filter(function (k) { return labels[k.key]; }).map(function (k) {
      return { label: labels[k.key][0], pct: k.pct, n: k.support, color: labels[k.key][1], key: k.key, examples: k.examples };
    });
  }

  function exampleRow(id) {
    var t = window.BANK.find(function (x) { return x.id === id; });
    if (!t) return '';
    return '<button class="ex-row" data-goto="' + t.id + '">' +
      '<span class="exid">#' + t.id + '</span>' +
      '<span><span class="exq">' + AI.esc(t.q.length > 120 ? t.q.slice(0, 120) + '…' : t.q) + '</span>' +
      '<br><span class="exa">' + Icon('check') + ' ' + AI.esc(t.a[t.c]) + '</span></span></button>';
  }

  function tripleStats(stats) {
    return '<div class="stat-strip">' + stats.map(function (s) {
      return '<div class="stat-cell"><b style="color:' + (s.color || 'var(--amber)') + '">' + s.value + '</b><span>' + s.label + '</span></div>';
    }).join('') + '</div>';
  }

  /* ტოპ სწორი პასუხები — დინამიკურად */
  function topCorrectAnswers() {
    var freq = {};
    window.BANK.forEach(function (t) {
      var txt = t.a[t.c];
      if (!freq[txt]) freq[txt] = { n: 0, ids: [] };
      freq[txt].n++;
      if (freq[txt].ids.length < 3) freq[txt].ids.push(t.id);
    });
    return Object.keys(freq).map(function (k) { return { text: k, n: freq[k].n, ids: freq[k].ids }; })
      .filter(function (x) { return x.n >= 8 && x.text.length < 60; })
      .sort(function (a, b) { return b.n - a.n; }).slice(0, 8);
  }

  /* ტყუპების ჯგუფები (union-find) */
  function twinGroups() {
    var sim = P().similar || {};
    var parent = {};
    function find(x) { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; }
    function union(a, b) { a = find(a); b = find(b); if (a !== b) parent[a] = b; }
    Object.keys(sim).forEach(function (k) {
      if (!parent[k]) parent[k] = k;
      sim[k].forEach(function (v) {
        var vs = String(v);
        if (!parent[vs]) parent[vs] = vs;
        union(k, vs);
      });
    });
    var groups = {};
    Object.keys(parent).forEach(function (k) {
      var r = find(k);
      (groups[r] = groups[r] || []).push(Number(k));
    });
    return Object.keys(groups).map(function (k) { return groups[k].sort(function (a, b) { return a - b; }); })
      .filter(function (g) { return g.length >= 4; })
      .sort(function (a, b) { return b.length - a.length; }).slice(0, 3);
  }

  function cheatSpeedTable() {
    var rows = [
      ['ავტომაგისტრალი (B, უმისაბმელოდ)', '110 კმ/სთ', '226, 257, 1273'],
      ['დაუსახლებელი პუნქტი (ასფალტი)', '90 კმ/სთ', '228, 250'],
      ['B1 კატეგორია / მისაბმელიანი B', '80 კმ/სთ', '229, 231, 1271'],
      ['BE / მისაბმელიანი დაუსახლებელში', '70 კმ/სთ', '232, 233'],
      ['დასახლებული პუნქტი', '60 კმ/სთ', '224'],
      ['ბუქსირებისას', '50 კმ/სთ', '248, 540'],
      ['საცხოვრებელი ზონა', '20 კმ/სთ', '515'],
      ['ეკონიშნის ზოლში (დასახლებულში)', '40–60 კმ/სთ', '224, 1273']
    ];
    return '<div class="table-scroll"><table class="cheat-table"><thead><tr><th>სიტუაცია</th><th>მაქს. სიჩქარე</th><th>ბილეთები</th></tr></thead><tbody>' +
      rows.map(function (r) {
        var links = r[2].split(', ').map(function (id) { return '<button class="twin-link" data-goto="' + id + '">#' + id + '</button>'; }).join(' ');
        return '<tr><td>' + r[0] + '</td><td><b>' + r[1] + '</b></td><td>' + links + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  function cheatDistTable() {
    var rows = [
      ['დისტანცია — დასახლებული (ნორმა)', '2 წმ', '860'],
      ['დისტანცია — დაუსახლებელი (ნორმა)', '3 წმ', '861'],
      ['დისტანცია — ყინულზე (დასახლებული)', '6 წმ', '862'],
      ['დისტანცია — ყინულზე (დაუსახლებელი)', '9 წმ', '863'],
      ['„არასაკმარისი ხილვადობა“', '300 მ-ზე ნაკლები', '883'],
      ['ბუქსირება მოქნილი გადაბმით', '4–6 მ', '560'],
      ['სატრანსპორტო საშუალების გაჩერება ავტობუსის გაჩერებამდე', 'არაახლოს 15 მ-ზე', '499'],
      ['შლაგბაუმამდე გაჩერება', '5 მ-ზე ახლოს — აკრძალულია', '415'],
      ['ტვირთის გამოწევა უკან', '1,0 მ-ზე მეტად — მოინიშნე', '585'],
      ['ტვირთის გამოწევა გვერდზე', '0,4 მ-ზე მეტად — მოინიშნე', '586'],
      ['პულსის შემოწმება დაშავებულს', 'ყოველ 2 წუთში', '1071']
    ];
    return '<div class="table-scroll"><table class="cheat-table"><thead><tr><th>წესი</th><th>მნიშვნელობა</th><th>ბილეთი</th></tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr><td>' + r[0] + '</td><td><b>' + r[1] + '</b></td><td><button class="twin-link" data-goto="' + r[2] + '">#' + r[2] + '</button></td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  function templateRow(tpl) {
    return '<div class="ex-row" style="align-items:center"><span class="exid">x' + tpl.count + '</span>' +
      '<span class="exq" style="flex:1">' + AI.esc(tpl.tpl) + '</span>' +
      '<button class="twin-link" data-goto="' + tpl.ids[0] + '">#' + tpl.ids[0] + '</button></div>';
  }

  /* ---------- ვარჯიშის მოდული ---------- */
  function newTrainerQ() {
    var t = window.BANK[(Math.random() * window.BANK.length) | 0];
    trainer = { cur: t, right: trainer.right, total: trainer.total, answered: false };
  }

  function trainerHTML() {
    var t = trainer.cur;
    return '<div id="trainer-q">' +
      '<div class="row spread mb8"><span class="badge badge-amber">#' + t.id + '</span>' +
      '<span class="small muted">ქულა: <b style="color:var(--green)">' + trainer.right + '</b> / ' + trainer.total + '</span></div>' +
      '<div class="ticket-q" style="font-size:16px">' + AI.esc(t.q) + '</div>' +
      '<div class="row mt8" style="gap:8px">' +
      t.a.map(function (a, i) {
        return '<button class="btn btn-sm" data-tans="' + (i + 1) + '">' + (i + 1) + '. ' + AI.esc(a.length > 46 ? a.slice(0, 46) + '…' : a) + '</button>';
      }).join('') +
      '</div>' +
      '<div id="trainer-res" class="mt14"></div>' +
      '</div>';
  }

  function renderTrainerAns(pick, container) {
    var t = trainer.cur;
    if (trainer.answered) return;
    trainer.answered = true;
    trainer.total++;
    var ok = pick === t.c + 1;
    if (ok) trainer.right++;
    ok ? Anim.sound.correct() : Anim.sound.wrong();
    var res = container.querySelector('#trainer-res');
    res.innerHTML = '<div class="row"><span class="badge ' + (ok ? 'badge-green' : 'badge-red') + '">' +
      (ok ? 'სწორია' : 'არასწორია — სწორია: ' + AI.esc(t.a[t.c])) + '</span>' +
      '<button class="btn btn-sm btn-primary" id="trainer-next">შემდეგი კითხვა' + Icon('arrowR') + '</button>' +
      '<button class="btn btn-sm" data-goto="' + t.id + '">სრული განმარტება</button></div>' +
      '<p class="small muted mt8">' + AI.esc((t.e || '').slice(0, 200)) + (t.e && t.e.length > 200 ? '…' : '') + '</p>';
    var nb = res.querySelector('#trainer-next');
    nb.addEventListener('click', function () { newTrainerQ(); container.querySelector('#trainer-body').innerHTML = trainerHTML(); });
  }

  /* ---------- მთავარი რენდერი ---------- */
  function render(container) {
    var p = P();
    var pos = p.positionByCount || {};
    var posRows = [];
    ['2', '3', '4'].forEach(function (k) {
      if (pos[k]) pos[k].pos.forEach(function (x) {
        posRows.push({ label: k + '-პასუხიანი · ვარიანტი ' + x.pos + ')', pct: x.pct, n: x.count, color: x.pct < 25 ? 'var(--red)' : 'var(--amber)' });
      });
    });
    var longestS = p.longestStrict || {};
    var perm = p.permissionStats || {};
    var aoa = p.allOfAbove || [];
    var kw = kwRows();
    var negKw = kw.filter(function (k) { return k.key === 'მხოლოდ' || k.key === 'ორივე'; });
    var posKw = kw.filter(function (k) { return k.key === 'შეიძლება' || k.key === 'ქვეით'; });
    var topAns = topCorrectAnswers();
    var groups = twinGroups();
    var tpls = (p.templates || []).slice(0, 8);

    newTrainerQ();

    container.innerHTML =
      '<div class="section-title"><span class="ic">' + Icon('wand') + '</span><h2 style="font-size:inherit">ხრიკების გრაფა</h2></div>' +
      '<p class="section-sub">ყველა ხრიკი გამოთვლილია რეალურად — 921 ბილეთის ანალიზით. ეს არის დაკვირვებული პატერნები, რომლებიც გამოცნობისას გეხმარება. 100%-იანი გარანტია არაფერია — ხრიკი გამოიყენე როგორც „ჩალიჩი“, ცოდნის შემდეგ.</p>' +

      '<div class="honest-note mb14">' + Icon('info') + ' <b>პატიოსანი გაფრთხილება:</b> სუფთა გამოცნობის ალბათობა ~33%-ია (პასუხების საშუალო რაოდენობა 3). ხრიკები ამას ზრდიან 45-55%-მდე ცალკეულ შემთხვევებში, მაგრამ ვერ ჩაანაცვლებს წესების ცოდნას. ჯერ ისწავლე — მერე გამოიყენე ხრიკი ეჭვისას.</div>' +

      '<div class="grid g2">' +

      /* T1 — პოზიცია */
      '<div class="trick-card reveal"><div class="trick-head"><div class="trick-ic">' + Icon('chart') + '</div>' +
      '<div><h3>ხრიკი #1 — პოზიციის წესი</h3><span class="badge badge-amber">ყველაზე მტკიცე პატერნი</span></div></div>' +
      '<div class="trick-body">თუ ეჭვობ და არ იცი, რომელი პასუხია სწორი — პირველი ვარიანტი თითქმის არასდროსაა სწორი 4-ვარიანტიან კითხვებში (მხოლოდ ' + (pos['4'] ? pos['4'].pos[0].pct : 13.5) + '%).<ul>' +
      '<li>4-ვარიანტიანი: ყველაზე სუსტია ვარიანტი #1 — გამოტოვე.</li>' +
      '<li>სამიზნე: ვარიანტები #3 და #4 (ერთად ~63%).</li>' +
      '<li>3-ვარიანტიანში #1 მხოლოდ 28.4% — სჯობს #2 ან #3.</li>' +
      '<li>2-ვარიანტიანში პოზიცია არაფერს ცვლის (50/50).</li></ul></div>' +
      positionChart() + '</div>' +

      /* T2 — მხოლოდ */
      '<div class="trick-card t-violet reveal"><div class="trick-head"><div class="trick-ic">' + Icon('alert') + '</div>' +
      '<div><h3>ხრიკი #2 — „მხოლოდ“ ხაფანგი</h3><span class="badge badge-violet">ელიმინაცია</span></div></div>' +
      '<div class="trick-body">პასუხში სიტყვა <b>„მხოლოდ“</b> თუა — დიდი ალბათობით ხაფანგია: ' +
      (p.keywords && p.keywords[0] ? p.keywords[0].pct : 21.9) + '%-ია სწორი (~33%-ის ნაცვლად). წესი ჩვეულებრივ უფრო ფართოა, ვიდრე „მხოლოდ X“.</div>' +
      tripleStats([
        { value: '21.9%', label: '„მხოლოდ-ის“ სიზუსტე', color: 'var(--red)' },
        { value: '617', label: 'ასეთი პასუხი ბაზაში', color: 'var(--amber)' },
        { value: '~33%', label: 'ჩვეულებრივი შანსი', color: 'var(--blue)' }
      ]) +
      hBars(negKw, { baseline: 33.3, baselineLabel: 'შანსი 33%', max: 60 }) +
      '<div class="examples"><b class="small">მაგალითები — დააჭირე და ნახე:</b>' + ((p.keywords[0] || {}).examples || []).slice(0, 3).map(exampleRow).join('') + '</div>' +
      '</div>' +

      /* T3 — გრძელი პასუხი */
      '<div class="trick-card t-blue reveal"><div class="trick-head"><div class="trick-ic">' + Icon('ruler') + '</div>' +
      '<div><h3>ხრიკი #3 — ყველაზე გრძელი პასუხი</h3><span class="badge badge-blue">სიზუსტე ' + (longestS.pct || 45.6) + '%</span></div></div>' +
      '<div class="trick-body">როდესაც პასუხები ერთმანეთისგან მხოლოდ სიგრძით განსხვავდება — ყველაზე გრძელი, დეტალური პასუხი სწორია <b>' + (longestS.pct || 45.6) + '%-ში</b> (' + (longestS.n || 810) + ' შემთხვევიდან ' + (longestS.hit || 369) + '). მიზეზი: კანონმდებლობა ზუსტი და დეტალურია, ერთი სიტყვიანი „მოკლე“ პასუხები ხშირად არასრულია.</div>' +
      tripleStats([
        { value: (longestS.pct || 45.6) + '%', label: 'სიზუსტე', color: 'var(--green)' },
        { value: longestS.n || 810, label: 'შედარებული კითხვა', color: 'var(--amber)' },
        { value: '~33%', label: 'ჩვეულებრივი შანსი', color: 'var(--blue)' }
      ]) +
      '</div>' +

      /* T4 — განზოგადებები */
      '<div class="trick-card reveal"><div class="trick-head"><div class="trick-ic">' + Icon('layers') + '</div>' +
      '<div><h3>ხრიკი #4 — ზოგადი სიტყვები</h3><span class="badge badge-amber">ფრთხილად!</span></div></div>' +
      '<div class="trick-body">ზოგადი განზოგადებები ხშირად ხაფანგია, მაგრამ არა ყოველთვის:</div>' +
      hBars(aoa.map(function (a) {
        return { label: a.label, pct: a.pct, n: a.support, color: a.pct >= 50 ? 'var(--green)' : 'var(--red)' };
      }), { max: 100, labelW: 230 }) +
      '<div class="trick-body"><b>დასკვნა:</b> „ორივე“ — თითქმის სულ ცდება (28.6%), „ნებისმიერი“ — სუსტია (36.5%), მაგრამ „ამ ბილეთში ჩამოთვლილი“ (55.8%) და „არც ერთი“ (100%, თუმცა მხოლოდ 5 შემთხვევა) — ხშირად სწორია. „ყველა“ — ზუსტად 50/50.</div></div>' +
      '</div>' +

      /* T5 — ნებართვის კითხვები */
      '<div class="trick-card t-green reveal"><div class="trick-head"><div class="trick-ic">' + Icon('sign') + '</div>' +
      '<div><h3>ხრიკი #5 — „აქვს თუ არა უფლება?“ კითხვები</h3><span class="badge badge-green">მემკვიდრეობითი დაკვირვება</span></div></div>' +
      '<div class="trick-body">შეკითხვებში, რომლებიც იწყება „აქვს თუ არა უფლება“, „ეკრძალება თუ არა“, „უნდა თუ არა“ — უარყოფითი პასუხი („არ აქვს“, „ეკრძალება“) სწორია <b>' + (perm.pct || 54) + '%-ში</b> (' + (perm.total || 161) + '-დან ' + (perm.negativeOrAffirm || 87) + ').</div>' +
      tripleStats([
        { value: (perm.pct || 54) + '%', label: 'უარყოფითი პასუხი', color: 'var(--red)' },
        { value: perm.total || 161, label: 'ასეთი კითხვა', color: 'var(--amber)' },
        { value: '~33%', label: 'ჩვეულებრივი შანსი', color: 'var(--blue)' }
      ]) +
      '<div class="trick-body small muted">ფსიქოლოგიურად ლოგიკურია: გამოცდა ამოწმებს, იცი თუ არა შეზღუდვები. სადაც შეკითხვა რაიმე ქმედების ნებართვას ეხება, უფრო ხშირად პასუხი „არა“-ა. ეჭვისას — უარყოფითი ვარიანტი აირჩიე.</div></div>' +

      /* T6 — ყველაზე ხშირი სწორი პასუხები */
      '<div class="trick-card t-violet reveal"><div class="trick-head"><div class="trick-ic">' + Icon('target') + '</div>' +
      '<div><h3>ხრიკი #6 — ხშირად მეორეა სწორი</h3><span class="badge badge-violet">სტანდარტული პასუხები</span></div></div>' +
      '<div class="trick-body">ზოგი პასუხი მთელ ბაზაში ათჯერ მეორდება და თითქმის ყოველთვის სწორია — აირჩიე დაუფიქრებლად, თუ სიტყვა-სიტყვით ემთხვევა:</div>' +
      '<div class="examples">' + topAns.map(function (x) {
        return '<div class="ex-row" style="cursor:default"><span class="exid">x' + x.n + '</span><span class="exa">' + AI.esc(x.text) + '</span></div>';
      }).join('') + '</div></div>' +

      '</div>' +

      /* T7 — ტყუპები */
      '<div class="trick-card t-blue reveal mt22"><div class="trick-head"><div class="trick-ic">' + Icon('twin') + '</div>' +
      '<div><h3>ხრიკი #7 — ტყუპი ბილეთები: ისწავლე ერთი — იცი ორი</h3><span class="badge badge-blue">' + (p.similarCount || 422) + ' ბილეთს ჰყავს ტყუპი</span></div></div>' +
      '<div class="trick-body">ბაზაში ბილეთების <b>45%</b>-ს ჰყავს მინიმუმ ერთი „ტყუპი“ — კითხვა, რომელიც 60%-ზე მეტად ემთხვევა. თუ ტყუპების ჯგუფს ერთად ისწავლი, დროის ნახევარს დაზოგავ. ქვემოთ უდიდესი ჯგუფები:</div>' +
      groups.map(function (g) {
        return '<div class="ex-row" style="cursor:default;flex-wrap:wrap"><span class="exid">' + g.length + ' ბილეთი</span>' +
          '<span class="twin-links">' + g.slice(0, 8).map(function (id) { return '<button class="twin-link" data-goto="' + id + '">#' + id + '</button>'; }).join('') + (g.length > 8 ? ' …' : '') + '</span></div>';
      }).join('') +
      '</div>' +

      /* T8 — შაბლონები */
      '<div class="trick-card t-green reveal mt22"><div class="trick-head"><div class="trick-ic">' + Icon('route') + '</div>' +
      '<div><h3>ხრიკი #8 — ერთი შაბლონი, ბევრი ბილეთი</h3><span class="badge badge-green">ისწავლე შაბლონი</span></div></div>' +
      '<div class="trick-body">ზოგი კითხვის ტექსტი 10-19 ბილეთში იმეორება — იგივე ლოგიკა, სხვა სურათი. ერთხელ გაიაზრე პრინციპი და მთელი ჯგუფი ჩაბარებულია:</div>' +
      '<div class="examples">' + tpls.map(templateRow).join('') + '</div></div>' +

      /* ციფრები */
      '<div class="section-title mt22"><span class="ic">' + Icon('gauge') + '</span><h3 style="font-size:inherit">ციფრების ცხრილი — ზეპირად</h3></div>' +
      '<p class="section-sub">გამოცდაზე რიცხვებიანი კითხვები ბევრია. ეს ცხრილები ერთად დაიზეპირე და მინიმუმ 10 ბილეთს უპასუხებ ავტომატურად.</p>' +
      '<div class="card mb14"><b class="mb8" style="display:block">სიჩქარის ლიმიტები</b>' + cheatSpeedTable() + '</div>' +
      '<div class="card mb14"><b class="mb8" style="display:block">დისტანციები, მანძილები, დროები</b>' + cheatDistTable() + '</div>' +

      /* ვარჯიში */
      '<div class="section-title mt22"><span class="ic">' + Icon('play') + '</span><h3 style="font-size:inherit">ხრიკის ვარჯიში — გამოიცანი და შეამოწმე</h3></div>' +
      '<p class="section-sub">შემთხვევითი ბილეთი. სცადე ხრიკებით გამოცნობა, შემდეგ შეამოწმე სწორი პასუხი. ასე ამოწმებ, ნამდვილად მუშაობს თუ არა ხრიკი შენზე.</p>' +
      '<div class="card" id="trick-trainer"><div id="trainer-body">' + trainerHTML() + '</div></div>';

    container.querySelector('#trick-trainer').addEventListener('click', function (e) {
      var tb = e.target.closest('[data-tans]');
      if (tb) { renderTrainerAns(Number(tb.getAttribute('data-tans')), container); return; }
      var g = e.target.closest('[data-goto]');
      if (g) location.hash = '#/learn?id=' + g.getAttribute('data-goto');
    });

    Anim.observeReveals(container);
  }

  function bind(container) {
    container.addEventListener('click', function (e) {
      var g = e.target.closest('[data-goto]');
      if (g && !e.target.closest('#trick-trainer')) {
        location.hash = '#/learn?id=' + g.getAttribute('data-goto');
      }
      var tr = e.target.closest('[data-trick-trainer-start]');
      if (tr) { newTrainerQ(); container.querySelector('#trainer-body').innerHTML = trainerHTML(); }
    });
  }

  window.Tricks = { render: render, bind: bind };
})();
