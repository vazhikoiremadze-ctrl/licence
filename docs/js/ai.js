/* AI ასისტენტი: ბილეთის განმარტება + ლოკალური ცოდნის ბაზა + სურვილისამებრ ღრუბლოვანი AI */
(function () {
  'use strict';

  var TOPIC_TIPS = {
    1: 'გახსოვდეს იერარქია: მძღოლი > მგზავრი > ქვეითი პასუხისმგებლობაში, მაგრამ უპირატესობაში — ქვეითი ყველაზე დაცულია. ქვეითს ზებრაზე გადასვლისას ყოველთვის გზა უთმობს მძღოლი.',
    2: 'უწესივრობის შემთხვევაში პასუხი ხშირად „ვალდებულია" ან „აკრძალულია" ფორმითაა — მოქმედება ყოველთვის კონკრეტული წესიდან გამომდინარეობს.',
    3: 'მაფრთხილებელი ნიშანი = სამკუთხედი წითელი ჩარჩოთი. „გაფრთხილება საფრთხის შესახებ" და „მოძრაობის მიმართულების შეცვლა" — ზუსტად დაიმახსოვრე ეს ორი ხშირად გამოყენებული ნიშანი.',
    4: 'პრიორიტეტის ნიშნები: „მთავარ გზაზე" (ყვითელი რომბი) და „გზა დაუთმე" (შებრუნებული სამკუთხედი) ხშირად ერთად მოდის. ყვითელი რომბი ყველაზე ძლიერი უპირატესობის ნიშანია.',
    5: 'ამკრძალავი ნიშანი = წითელი წრე (ან წითელი რგოლი). წითელი რგოლი = აკრძალვა, ლურჯი ფონი = ვალდებულება. ეს ერთი წესი ამ თემის ნახევარს ხსნის.',
    6: 'მიმთითებელი ნიშანი = ლურჯი წრე თეთრი ისრით. სავალდებულოა მხოლოდ ის, რაც ნიშანზეა დახატული.',
    7: 'საინფორმაციო-მაჩვენებელი ნიშნები ჩვეულებრივ მართკუთხედი/კვადრატია. „დასახლებული პუნქტის დასაწყისი" ნიშნიდან იწყება 60 კმ/სთ შეზღუდვა!',
    8: 'სერვისის ნიშნები კომფორტის შესახებაა (სასტუმრო, ბენზინგასამართი) — მოძრაობის წესს არ ცვლის.',
    9: 'დამატებითი ინფორმაციის ნიშნები ძირითადი ნიშნის ქვეშაა და მის მოქმედების ზონას/დროს აზუსტებს.',
    10: 'შუქნიშანი: მოციმციმე ყვითელი = გადაკვეთა დაურეგულირებელია (მარჯვენა ხელის წესი მოქმედებს). წითელი + დამატებითი ისარი მარცხნივ = მარცხნივ მოძრაობა დაშვებულია.',
    11: 'მარეგულირებელი: „მკერდით/ზურგით" — პასუხები ზეპირად უნდა იცოდე: ხელი აწეული = ყველა ჩერდება; მკერდი = ზურგიდან/მარჯვნიდან მოსულებს გზა ეძლევათ.',
    12: 'სპეციალური სიგნალის მქონე ავტომობილი ხმოვანი სიგნალით = უპირატესობა ყველასთან, მაგრამ მძღოლი მაინც ვალდებულია დარწმუნდეს უსაფრთხოებაში.',
    13: 'საავარიო სიგნალი: ავტომობილის გაჩერებისას (სადაც აკრძალულია) — ჩართე და გამოაშკარავე. ის პასუხისმგებლობას შენზე არ გადებს, მხოლოდ აფრთხილებს სხვებს.',
    14: 'სანათების წესი: დღისით — დაბალი ჩართული უნდა იყოს გზის ნებისმიერ შემთხვევაში; ღამით დასახლებულში — დაბალი, დაუსახლებელში — შორეული შეიძლება. წინა მოძრაობის მონაწილესთან ახლოს — დაბალი.',
    15: 'მანევრირების ოქროს წესი: მანევრამდე — სარკე, სიგნალი, დარწმუნება. ვინც მანევრს ასრულებს, ის უთმობს გზას ვინც პირდაპირ მოძრაობს.',
    16: 'გასწრება: აკრძალულია გზაჯვარედინზე, რკინიგზის გადასასვლელზე, ზებრაზე, „გასწრება აკრძალულია" ნიშნის ზონაში, ხიდზე. ამ 5 ადგილზე 90% შეკითხვაა.',
    17: 'სიჩქარის ცხრილი B კატეგორიისთვის: ავტომაგისტრალი 110, დაუსახლებელი 90, დასახლებული 60 (ეკოსიგნალით 40-60). ბუქსირება — 50!',
    18: 'დისტანცია წამებში: დასახლებულში — 2 წმ, დაუსახლებელში — 3 წმ, ყინულზე დასახლებულში — 6 წმ, ყინულზე დაუსახლებელში — 9 წმ. აითვალე „ორი ათას ერთი, ორი ათას ორი“ მეთოდით.',
    19: 'გაჩერება აკრძალულია: ზებრაზე, რკინიგზის გადასასვლელზე, გზაჯვარედინზე და გადასასვლელი გზის კიდიდან 5 მ-ზე ახლოს, ავტობუსის გაჩერებიდან 15 მ-ზე ახლოს, მთლიანი ყვითელი ხაზის (1.4) გასწვრივ.',
    20: 'გზაჯვარედინი: თანაბარმნიშვნელოვანზე — მარჯვნიდან მოსულს უთმობ; მთავარ გზაზე მყოფს — მეორეხარისხოვანს უთმობს; რკინიგზის შემთხვევაში — ლიანდაგს ყველა უთმობს.',
    21: 'რკინიგზის გადასასვლელი: შუქნიშანი/მორიგე/ბარიერი მოქმედებს — ყველა წესი მას ექვემდებარება. აკრძალულია შლაგბაუმისთვის მიუახლოება 5 მ-ზე ახლოს.',
    22: 'ავტომაგისტრალზე აკრძალულია: სწავლა, ბუქსირება, უკუსვლა, 50 კმ/სთ-ზე ნაკლები სიჩქარე, ჩერდება მხოლოდ გასასვლელებზე/მოედნებზე.',
    23: 'საცხოვრებელ ზონაში ქვეითს გზის გადაკვეთა ყველგან შეუძლია — სიჩქარე მაქს. 20 კმ/სთ.',
    24: 'ბუქსირება: მოქნილი გადაბმით მანძილი 4-6 მ; თვითნაკეთი მოწყობილობით (თოკით) ბუქსირებულს ავტომაგისტრალზე შესვლა და ბუქსირება აკრძალულია; გაუმართავი საჭის მექანიზმის მქონე ავტომობილის ხისტი/მოქნილი გადაბმით ბუქსირება აკრძალულია.',
    25: 'სასწავლო სვლა: ინსტრუქტორი + მოწაფე, ავტომაგისტრალზე და ცუდ გზაზე — აკრძალული.',
    26: 'ტვირთი: არ უნდა ფარავდეს სანომრე ნიშანს/სანათებს; უკან 1 მ-მდეა დასაშვები გამოწევა, წინ — 0.4 მ, გვერდებზე — 0.4 მ.',
    27: 'ველოსიპედის/მოპედის მძღოლი: იმავე წესების მონაწილეა, მაგრამ ზებრადან ქვეითივით გადადის (თუ ჩამოსულია). მოპედი — მინიმუმ 16 წლიდან.',
    28: 'საგზაო მონიშვნა თეთრი/ყვითელი ხაზები: ორმაგი მთლიანი = გადაკვეთა აკრძალულია, გატეხილი = დაშვებულია. ყვითელი = დროებითი ან აკრძალვა.',
    29: 'სამედიცინო დახმარება: პირველი ნაბიჯი — 112-ზე დარეკვა. თუ დაშავებული არ სუნთქავს, პულსი კი აქვს — პულსი მოწმდება ყოველ 2 წუთში.',
    30: 'უსაფრთხოება: უსაფრთხოების ქამარი — ყველა ადგილზე, ბავშვები — სპეც. სავარძელში. მობილურით საუბარი მხოლოდ hands-free.',
    31: 'ადმინისტრაციული კანონი: ჯარიმები, მოწმობის ჩამორთმევა, „დროებითი უფლების" ცნება — უპირატესად ზემოქმედებს ინტერპრეტაციაზე.',
    32: 'ეკო-მართვა: 2000-2500 ბრუნი ოპტიმალური; წინასწარ იფიქრე, მკვეთრი დამუხრუჭება/აჩქარება არ — ეკონომია 20%-მდე.'
  };

  function topicNames(ticket) {
    return (ticket.t || []).map(function (id) {
      var t = (window.TOPICS || []).find(function (x) { return x.id === id; });
      return t ? t.name : ('#' + id);
    });
  }

  function sentences(text) {
    return String(text || '')
      .split(/(?<=[.!?])\s+/)
      .map(function (s) { return s.trim(); })
      .filter(function (s) { return s.length > 1; });
  }

  function answerVerdict(ticket, idx) {
    var txt = ticket.a[idx] || '';
    var out = [];
    if (/მხოლოდ/i.test(txt)) out.push('შეიცავს სიტყვას „მხოლოდ" — ასეთი პასუხები მთელ ბაზაში მხოლოდ 21.9%-შია სწორი, რადგან თითქმის ყოველთვის ზედმეტად კატეგორიულია.');
    if (/ყველა|ნებისმიერ|არც ერთი|ორივე/i.test(txt)) out.push('ზოგადი განზოგადებაა („ყველა/ნებისმიერი/ორივე") — ასეთი პასუხები ხშირად ხაფანგია; შეამოწმე, ნამდვილად ფარავს თუ არა წესს სრულად.');
    if (ticket.a[idx].length > 90) out.push('ვარიანტი გრძელი და დეტალურია — ხშირად სწორედ დეტალური პასუხია მართებული, მაგრამ აქ ნახე, დეტალი წესს ერთგვაროვნად შეესაბამება თუ არა.');
    if (!out.length) out.push('ეს ვარიანტი ეწინააღმდეგება ზემოთ მოცემულ წესს — ყურადღებით შეადარე ოფიციალურ განმარტებას.');
    return out.join(' ');
  }

  function memoryTip(ticket) {
    var e = ticket.e || '';
    var q = ticket.q || '';
    var tips = [];
    var nums = q.match(/\d+\s?(კმ\/ს|კმ|მეტრ|მ|წუთ|საათ|%|‰)/g);
    if (nums && nums.length) tips.push('რიცხვებიანი კითხვაა (' + nums.join(', ') + ') — ციფრები ცხრილურად დაიმახსოვრე (იხ. ხრიკები > ციფრების ცხრილი).');
    var mainTopic = (ticket.t || [])[0];
    if (mainTopic && TOPIC_TIPS[mainTopic]) tips.push(TOPIC_TIPS[mainTopic]);
    if (/ეკრძალება|აკრძალული/i.test(e)) tips.push('განმარტებაში აკრძალვაზეა საუბარი — დაიმახსოვრე: „თუ საეჭვოა, ნაკლებად საშიში ქმედება აირჩიე".');
    if (/ვალდებულია/i.test(e)) tips.push('განმარტებაში „ვალდებულია" არის — ეს ნიშნავს, რომ კითხვას ერთი კანონმდებლობით განსაზღვრული პასუხი აქვს.');
    if (!tips.length) tips.push('დაიმახსოვრე მთავარი აზრი ერთი წინადადებით და გაიმეორე ტყუპ ბილეთებთან ერთად.');
    return tips;
  }

  function twinsOf(id) {
    var P = window.PATTERNS || {};
    var sim = (P.similar || {})[String(id)] || [];
    return sim.map(Number).slice(0, 6);
  }

  function explainHTML(ticket, opts) {
    opts = opts || {};
    if (!ticket) return '';
    var correct = ticket.a[ticket.c];
    var why = sentences(ticket.e).slice(0, 4);
    var twins = twinsOf(ticket.id);
    var html = '<div class="ai-explain">';
    html += '<div class="row"><span class="badge badge-amber">ბილეთი #' + ticket.id + '</span>' +
      topicNames(ticket).map(function (n) { return '<span class="badge badge-blue">' + n + '</span>'; }).join('') + '</div>';

    html += '<h4>' + Icon('checkCircle') + '<span class="t-why">სწორი პასუხი</span></h4>' +
      '<p><strong style="color:var(--green)">' + esc(correct) + '</strong></p>';

    html += '<h4>' + Icon('bookOpen') + 'რატომ არის სწორი (უბრალოდ)</h4><ul>';
    why.forEach(function (s) { html += '<li>' + esc(s) + '</li>'; });
    html += '</ul>';

    html += '<h4>' + Icon('xCircle') + '<span class="t-no">რატომ არაა დანარჩენი</span></h4><ul>';
    ticket.a.forEach(function (a, i) {
      if (i === ticket.c) return;
      html += '<li><em>' + esc(a) + '</em> — ' + esc(answerVerdict(ticket, i)) + '</li>';
    });
    html += '</ul>';

    var tips = memoryTip(ticket);
    html += '<h4>' + Icon('bulb') + '<span class="t-tip">დამახსოვრების ხრიკი</span></h4><ul>';
    tips.forEach(function (t) { html += '<li>' + esc(t) + '</li>'; });
    html += '</ul>';

    if (twins.length) {
      html += '<h4>' + Icon('twin') + '<span class="t-twin">ტყუპი ბილეთები (ივარჯიშე ერთად)</span></h4><div class="twin-links">' +
        twins.map(function (id) { return '<button class="twin-link" data-twin="' + id + '">#' + id + '</button>'; }).join('') +
        '</div>';
    }

    if (!opts.noOfficial && ticket.e) {
      html += '<h4>' + Icon('clipboard') + 'ოფიციალური განმარტება</h4>' +
        '<div class="badge" style="cursor:pointer;user-select:none" id="off-' + ticket.id + '">გახსნა/დახურვა</div>' +
        '<p class="small muted" id="offbox-' + ticket.id + '" hidden>' + esc(ticket.e) + '</p>';
    }
    html += '</div>';
    return html;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ---------- ლოკალური ძებნა ---------- */
  var STOP = ['რა', 'როგორ', 'როდის', 'სად', 'რომელი', 'არის', 'თუ', 'და', 'ან', 'მე', 'შენ', 'ვინ', 'რატომ',
    'რამდენი', 'მინდა', 'მითხარი', 'განმიმარტე', 'ახსნა', 'ნიშნავს', 'ეს', 'ის', 'რომ', 'მაქვს', 'უნდა'];

  function tokenize(text) {
    return String(text).toLowerCase()
      .replace(/[^\u10A0-\u10FF\w\s]/g, ' ')
      .split(/\s+/)
      .filter(function (w) { return w.length > 2 && STOP.indexOf(w) === -1; });
  }

  function searchBank(query, limit) {
    limit = limit || 3;
    var toks = tokenize(query);
    if (!toks.length) return [];
    var scored = [];
    var bank = window.BANK || [];
    for (var i = 0; i < bank.length; i++) {
      var t = bank[i];
      var ql = t.q.toLowerCase();
      var al = t.a.join(' ').toLowerCase();
      var el = (t.e || '').toLowerCase();
      var s = 0;
      for (var j = 0; j < toks.length; j++) {
        var w = toks[j];
        if (ql.indexOf(w) !== -1) s += 3;
        if (al.indexOf(w) !== -1) s += 1.4;
        if (el.indexOf(w) !== -1) s += 0.7;
      }
      if (s > 0) scored.push({ t: t, s: s / Math.sqrt(t.q.length / 60 + 1) });
    }
    scored.sort(function (a, b) { return b.s - a.s; });
    return scored.slice(0, limit).map(function (x) { return x.t; });
  }

  function metaAnswer(text) {
    var q = text.toLowerCase();
    var bank = window.BANK || [];
    if (/გამარჯობა|სალამი|ჰეი|hello|hi/.test(q)) {
      return { html: 'გამარჯობა! მე ვარ თქვენი თეორიის ასისტენტი. მკითხეთ ნებისმიერი წესი ან დამისვით შეკითხვა, მაგალითად: „სად აკრძალულია გასწრება?", „რა სიჩქარით შეიძლება ავტომაგისტრალზე?", „რას ნიშნავს ყვითელი მოციმციმე?".', tickets: [] };
    }
    if (/რამდენი|count|ბილეთების რაოდენობა|სტატისტიკა/.test(q)) {
      var passed = window.Store ? '' : '';
      return {
        html: 'ბაზაში არის <b>' + bank.length + ' ბილეთი</b> და 32 თემა. გამოცდაზე B კატეგორიისთვის გაძლევენ 30 კითხვას — 25 სწორი პასუხი საკმარისია (5 შეცდომა დასაშვებია). თქვენ უკვე ისწავლეთ <b>' + (window.Store ? window.Store.learnedCount() : 0) + '</b> ბილეთი.' + passed,
        tickets: []
      };
    }
    if (/დახმარება|help|როგორ გამოვიყენო/.test(q)) {
      return {
        html: 'მე შემიძლია: (1) ნებისმიერი კითხვის მოძებნა ბაზაში, (2) წესის მარტივი ახსნა, (3) ბილეთის სრული განმარტება მარჯვენა პანელში. სცადეთ: „გასწრება აკრძალულია სად?", „რა არის ტყუპი ბილეთი?", „სიჩქარე დასახლებულ პუნქტში".',
        tickets: []
      };
    }
    if (/ტყუპ|მსგავსი ბილეთი/.test(q)) {
      var P = window.PATTERNS || {};
      return {
        html: 'ტყუპი ბილეთი — ეს ისეთი კითხვებია, რომლებიც 60%-ზე მეტად ემთხვევა ერთმანეთს (სიტყვების მიხედვით). ბაზაში <b>' + (P.similarCount || 0) + '</b> ასეთი ბილეთია. თუ ერთს ისწავლი, მეორეც იცი! იხილეთ გვერდი „ხრიკები" — ტყუპების სექცია.',
        tickets: []
      };
    }
    return null;
  }

  function replyHTML(tickets, prefix) {
    var html = prefix || '';
    tickets.forEach(function (t) {
      html += '<div class="ai-ticket"><b>ბილეთი #' + t.id + ':</b> ' + esc(t.q) +
        '<div class="why">' + Icon('check') + ' სწორია: <b style="color:var(--green)">' + esc(t.a[t.c]) + '</b></div>' +
        (t.e ? '<div class="why">' + esc(sentences(t.e)[0] || '') + '</div>' : '') +
        '<div class="row mt8"><button class="twin-link" data-goto="' + t.id + '">გახსენი სწავლაში</button>' +
        '<button class="twin-link" data-aitwin="' + t.id + '">სრული განმარტება</button></div></div>';
    });
    if (!tickets.length) {
      html += 'ვერ ვიპოვე ზუსტი დამთხვევა. სცადეთ სხვა სიტყვებით — მაგალითად: „გასწრება", „სიჩქარე", „შუქნიშანი", „ბუქსირება", „პრიორიტეტი".';
    }
    return html;
  }

  function askLocal(text) {
    var meta = metaAnswer(text);
    if (meta) return { html: meta.html, tickets: meta.tickets };
    var found = searchBank(text, 3);
    var prefix = found.length ? 'მოძებნე ' + found.length + ' დაკავშირებული ბილეთი:' : '';
    return { html: replyHTML(found, prefix), tickets: found };
  }

  /* ---------- ღრუბლოვანი AI (სურვილისამებრ) ---------- */
  function cloudAsk(text, contextTickets) {
    var key = window.Store.get('aiKey');
    if (!key) return Promise.reject(new Error('no-key'));
    var model = window.Store.get('aiModel') || 'gpt-4o-mini';
    var ctx = (contextTickets || []).map(function (t) {
      return 'ბილეთი #' + t.id + ': ' + t.q + ' | პასუხები: ' + t.a.join(' / ') + ' | სწორი: ' + t.a[t.c] + ' | განმარტება: ' + (t.e || '');
    }).join('\n');
    var sys = 'შენ ხარ საქართველოს B კატეგორიის მართვის მოწმობის თეორიული გამოცდის ასისტენტი. უპასუხე ქართულად, მოკლედ და მარტივად, მაქსიმუმ 120 სიტყვა. ' +
      'თუ კონტექსტში მოცემული ბილეთები ეხმარება, დაეყრდენ მათ. კონტექსტი:\n' + (ctx || '—');
    return fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'system', content: sys }, { role: 'user', content: text }],
        max_tokens: 400,
        temperature: 0.4
      })
    }).then(function (r) {
      if (!r.ok) throw new Error('api-' + r.status);
      return r.json();
    }).then(function (d) {
      return (d.choices && d.choices[0] && d.choices[0].message.content) || '';
    });
  }

  window.AI = {
    explainHTML: explainHTML,
    askLocal: askLocal,
    cloudAsk: cloudAsk,
    searchBank: searchBank,
    topicNames: topicNames,
    twinsOf: twinsOf,
    esc: esc
  };
})();
