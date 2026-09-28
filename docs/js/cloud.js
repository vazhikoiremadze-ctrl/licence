/* ანგარიში და ღრუბლოვანი სინქრონიზაცია: Qoder იდენტობა + პროგრესი (Storage).
   მუშაობს მხოლოდ Qoder-ის ჰოსტინგზე; სხვაგან ფუნქცია ჩუმად გამოირთვება. */
(function () {
  'use strict';

  var ENDPOINT = '/functions/v1/app';
  var CACHE_KEY = 'teoriaB.cloud.cache';
  var SIGN_IN = '/__qoder_auth/start?return_path=%2F';
  var DEBOUNCE_MS = 6000;

  var MSG = {
    network: 'ქსელი მიუწვდომელია — სცადე მოგვიანებით.',
    server: 'სერვისი დროებით მიუწვდომელია — სცადე მოგვიანებით.',
    unavailable: 'ღრუბლოვანი სინქრონიზაცია ამ გვერდზე მიუწვდომელია.',
    rate_limited: 'ძალიან ბევრი მოთხოვნა — ცოტა ხანში სცადე.',
    invalid_response: 'სერვისმა უცნობი პასუხი დააბრუნა.',
    write_unknown: 'ჩანაწერი ვერ დადასტურდა — შემდეგ სინქრონიზაციაზე ხელახლა შემოწმდება.',
    rejected: 'მონაცემები უარყოფილია — განაახლე გვერდი და სცადე თავიდან.',
    access_denied: 'წვდომა ვერ დადასტურდა — გამოდი და ხელახლა შედი ანგარიშით.',
    login_required: 'სესია დასრულდა — ხელახლა შედი ანგარიშით.'
  };

  function CloudError(code, status, serverCode) {
    this.name = 'CloudError';
    this.code = code;
    this.status = status || 0;
    this.serverCode = serverCode || '';
    this.message = MSG[code] || 'შეცდომა';
  }
  CloudError.prototype = Object.create(Error.prototype);
  CloudError.prototype.constructor = CloudError;

  var state = {
    phase: 'idle',      // idle | checking | unavailable | signedOut | signedIn | error
    user: null,         // {id, name, picture}
    syncing: false,
    lastSyncAt: 0,
    lastError: ''
  };

  var inFlight = null;
  var debounceTimer = null;
  var revision = 0;        // იზრდება ყოველ ლოკალურ ცვლილებაზე
  var syncedRev = -1;      // ბოლო წარმატებული სინქრონიზაციის რევიზია
  var queuedReset = false;

  /* ---------- HTTP ---------- */
  function readJson(res) {
    var ct = (res.headers.get('content-type') || '').toLowerCase();
    if (ct.indexOf('application/json') === -1) return Promise.resolve(null);
    return res.json().then(function (body) {
      return body && typeof body === 'object' ? body : null;
    }, function () { return null; });
  }

  function mapHttpError(res, body, isWrite) {
    var serverCode = body && typeof body.error === 'string' ? body.error : '';
    if (res.status === 401) return new CloudError('login_required', 401, serverCode);
    if (res.status === 403) return new CloudError('access_denied', 403, serverCode);
    if (res.status === 404) return new CloudError('unavailable', 404, serverCode);
    if (res.status === 429) return new CloudError('rate_limited', 429, serverCode);
    if (isWrite && (res.status === 400 || res.status === 413 || res.status === 415)) {
      return new CloudError('rejected', res.status, serverCode);
    }
    if (isWrite) return new CloudError('write_unknown', res.status, serverCode);
    return new CloudError('server', res.status, serverCode);
  }

  function fetchJson(method, action, body) {
    var init = {
      method: method,
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { accept: 'application/json' }
    };
    if (body !== undefined) {
      init.headers['content-type'] = 'application/json';
      init.body = JSON.stringify(body);
    }
    var isWrite = method === 'POST';
    return fetch(ENDPOINT + '?action=' + action, init).then(function (res) {
      if (res.redirected) throw new CloudError('login_required', res.status);
      return readJson(res).then(function (parsed) {
        if (res.ok) return { status: res.status, body: parsed };
        throw mapHttpError(res, parsed, isWrite);
      });
    }, function () {
      // POST-ის შედეგი უცნობია; GET უსაფრთხოდ შეიძლება გამეორდეს
      throw new CloudError(isWrite ? 'write_unknown' : 'network', 0);
    });
  }

  /* ---------- მომხმარებელი ---------- */
  function normalizeUser(raw) {
    if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string') return null;
    var picture = typeof raw.picture === 'string' && /^https:\/\//.test(raw.picture) ? raw.picture : '';
    return { id: raw.id, name: typeof raw.name === 'string' ? raw.name : '', picture: picture };
  }

  function initials(user) {
    var name = ((user && user.name) || '').trim();
    if (!name) return '·';
    return name.split(/\s+/).slice(0, 2).map(function (part) {
      return part.charAt(0).toUpperCase();
    }).join('');
  }

  function readCache() {
    try {
      var d = JSON.parse(localStorage.getItem(CACHE_KEY));
      var user = d && normalizeUser(d.user);
      if (!user) return null;
      return { user: user, lastSyncAt: Number(d.lastSyncAt) || 0 };
    } catch (e) { return null; }
  }
  function writeCache() {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ user: state.user, lastSyncAt: state.lastSyncAt }));
    } catch (e) {}
  }
  function clearCache() {
    try { localStorage.removeItem(CACHE_KEY); } catch (e) {}
  }

  /* ---------- ფაზები ---------- */
  function setPhase(phase, error) {
    state.phase = phase;
    if (phase === 'signedOut' || phase === 'unavailable') {
      state.user = null;
      state.lastError = '';
      clearCache();
    } else if (error) {
      state.lastError = error.message || MSG.network;
    }
    renderStatus();
    return phase;
  }

  function check() {
    if (location.protocol === 'file:') return Promise.resolve(setPhase('unavailable'));
    state.phase = 'checking';
    return fetchJson('GET', 'me').then(function (res) {
      var user = res.body && normalizeUser(res.body.user);
      if (!user) throw new CloudError('invalid_response', res.status);
      state.user = user;
      state.lastError = '';
      state.phase = 'signedIn';
      writeCache();
      renderStatus();
      return 'signedIn';
    }).catch(function (err) {
      if (err.code === 'login_required') return setPhase('signedOut');
      if (err.code === 'unavailable' || err.code === 'invalid_response') return setPhase('unavailable');
      return setPhase('error', err);
    });
  }

  /* ---------- სინქრონიზაცია ---------- */
  function localProgress() {
    var raw = Store.raw();
    return {
      learned: raw.learned || {},
      wrong: raw.wrong || {},
      bookmarks: raw.bookmarks || {},
      seen: raw.seen || {},
      examHistory: raw.examHistory || []
    };
  }

  function sync(options) {
    if (state.phase !== 'signedIn') return Promise.resolve(false);
    var opts = options || {};
    if (!opts.force && !opts.reset && !queuedReset && syncedRev === revision) return Promise.resolve(true);
    if (inFlight) return inFlight;
    var sendReset = queuedReset || !!opts.reset;
    if (sendReset) queuedReset = false;
    var captured = revision;
    var body = { progress: localProgress() };
    if (sendReset) body.reset = true;
    state.syncing = true;
    renderStatus();
    inFlight = fetchJson('POST', 'sync', body).then(function (res) {
      var out = res.body;
      if (!out || out.ok !== true || !out.progress || typeof out.progress !== 'object') {
        throw new CloudError('invalid_response', res.status);
      }
      Store.applyCloud(out.progress);
      state.lastSyncAt = typeof out.updatedAt === 'number' ? out.updatedAt : Date.now();
      state.lastError = '';
      writeCache();
      syncedRev = captured;
      if (queuedReset) scheduleSync(0);
      else if (revision !== captured) scheduleSync(1500);
      return true;
    }).catch(function (err) {
      if (err.code === 'login_required') {
        state.user = null;
        state.lastError = '';
        state.phase = 'signedOut';
        clearCache();
      } else if (err.code === 'unavailable') {
        state.phase = 'unavailable';
        state.lastError = '';
        state.user = null;
        clearCache();
      } else {
        state.lastError = err.message || MSG.network;
      }
      return false;
    }).then(function (ok) {
      inFlight = null;
      state.syncing = false;
      renderStatus();
      return ok;
    });
    return inFlight;
  }

  function scheduleSync(delay) {
    if (state.phase !== 'signedIn') return;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      debounceTimer = null;
      sync();
    }, delay == null ? DEBOUNCE_MS : delay);
  }

  function flushSync() {
    if (!debounceTimer) return;
    clearTimeout(debounceTimer);
    debounceTimer = null;
    sync();
  }

  function manualSync() {
    sync({ force: true }).then(function (ok) {
      if (ok) App.toast('პროგრესი სინქრონიზდა', 'ok');
      else App.toast(state.lastError || MSG.network, 'err');
    });
  }

  /* ---------- UI ---------- */
  function renderStatus() {
    var btn = document.getElementById('btn-account');
    if (btn) {
      var user = state.user;
      var inner;
      if (user && user.picture) {
        inner = '<img class="acc-avatar" src="' + AI.esc(user.picture) + '" alt="" referrerpolicy="no-referrer">';
      } else if (user) {
        inner = '<span class="acc-initials">' + AI.esc(initials(user)) + '</span>';
      } else {
        inner = Icon('user');
      }
      var dotCls = state.syncing ? ' busy' : (state.lastError ? ' err' : '');
      btn.innerHTML = inner + '<span class="acc-dot' + dotCls + '"' + (state.phase === 'signedIn' ? '' : ' hidden') + '></span>';
      btn.title = state.phase === 'signedIn'
        ? 'ანგარიში: ' + (user && user.name ? user.name : 'Qoder') + ' — ' + syncLine()
        : 'ანგარიში და სინქრონიზაცია';
    }
    renderPanel();
  }

  function syncLine() {
    if (state.syncing) return 'სინქრონიზაცია მიმდინარეობს…';
    if (state.lastError) return state.lastError;
    if (state.lastSyncAt) {
      return 'სინქრონიზებულია · ' + new Date(state.lastSyncAt).toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' });
    }
    return 'ჯერ არ სინქრონიზებულა';
  }

  function statsHTML() {
    var total = (window.BANK || []).length;
    var learned = Store.learnedCount();
    var history = Store.history();
    var passed = history.filter(function (r) { return r.passed; }).length;
    var cells = [
      [total ? Math.round(learned / total * 100) + '%' : '0%', 'ნასწავლი'],
      [String(learned), 'ბილეთი'],
      [String(Store.seenCount()), 'ნანახი'],
      [String(Store.wrongIds().length), 'შეცდომა'],
      [String(Store.bookmarkIds().length), 'რჩეული'],
      [history.length ? passed + ' / ' + history.length : '—', 'იმიტაცია']
    ];
    return '<div class="stat-strip">' + cells.map(function (cell) {
      return '<div class="stat-cell"><b>' + cell[0] + '</b><span>' + cell[1] + '</span></div>';
    }).join('') + '</div>';
  }

  function panelBody() {
    var out = '';
    if (state.phase === 'checking') {
      out += '<p class="small muted">მოწმდება ანგარიში…</p>';
    } else if (state.phase === 'unavailable') {
      out += '<div class="cloud-note">' + Icon('cloudOff') +
        '<div><b>ღრუბლოვანი სინქრონიზაცია მიუწვდომელია</b>' +
        '<div class="small muted mt8">ის მუშაობს მხოლოდ Qoder-ის ჰოსტინგზე გამოქვეყნებულ ვერსიაზე. ' +
        'აქ პროგრესი ინახება მხოლოდ ამ ბრაუზერში — ყველა ფუნქცია მაინც მუშაობს.</div></div></div>';
    } else if (state.phase === 'error') {
      out += '<div class="cloud-note">' + Icon('alert') +
        '<div><b>ანგარიშის შემოწმება ვერ მოხერხდა</b>' +
        '<div class="small muted mt8">' + AI.esc(state.lastError || MSG.network) + '</div></div></div>' +
        '<div class="row mt14"><button class="btn btn-primary" id="cloud-retry">' + Icon('refresh') + 'თავიდან ცდა</button></div>';
    } else if (state.phase === 'signedOut') {
      out += '<div class="cloud-note">' + Icon('user') +
        '<div><b>შედი ანგარიშით</b>' +
        '<div class="small muted mt8">Qoder ანგარიშით შესვლისას პროგრესი — ნასწავლი ბილეთები, შეცდომები, გამოცდის ისტორია — ' +
        'შეინახება ღრუბელში და ავტომატურად გაგყვება ნებისმიერ მოწყობილობაზე. ' +
        'საიტი დახურულია: მონაცემები მხოლოდ შენს ანგარიშს ეკუთვნის.</div></div></div>' +
        '<div class="row mt14"><a class="btn btn-primary" href="' + SIGN_IN + '">' + Icon('key') + 'Qoder ანგარიშით შესვლა</a></div>';
    } else if (state.phase === 'signedIn') {
      var user = state.user || { name: '', picture: '' };
      var avatar = user.picture
        ? '<img class="cloud-avatar" src="' + AI.esc(user.picture) + '" alt="" referrerpolicy="no-referrer">'
        : '<span class="cloud-avatar-fallback">' + AI.esc(initials(user)) + '</span>';
      out += '<div class="cloud-user">' + avatar +
        '<div style="min-width:0"><b>' + AI.esc(user.name || 'Qoder ანგარიში') + '</b>' +
        '<div class="small ' + (state.lastError ? 'cloud-err' : 'muted') + '">' + AI.esc(syncLine()) + '</div></div>' +
        '<span class="badge badge-' + (state.syncing ? 'amber' : (state.lastError ? 'red' : 'green')) + '" style="margin-left:auto">' +
        (state.syncing ? 'სინქრონდება' : (state.lastError ? 'შეცდომა' : 'აქტიური')) + '</span></div>' +
        '<div class="row mt14">' +
        '<button class="btn btn-primary"' + (state.syncing ? ' disabled' : '') + ' id="cloud-sync">' + Icon('refresh') + 'სინქრონიზაცია ახლა</button>' +
        '<span class="small muted">ცვლილებები ავტომატურად იგზავნება რამდენიმე წამში</span></div>';
    }

    out += '<div class="divider"></div>' +
      '<div class="row spread mb8"><b>' + Icon('chart') + ' შენი პროგრესი</b>' +
      '<span class="small muted">' + (state.phase === 'signedIn' ? 'იმოქმედებს ამ მოწყობილობაზეც' : 'ინახება ამ ბრაუზერში') + '</span></div>' +
      statsHTML() +
      '<div class="divider"></div>' +
      '<div class="row">' +
      '<button class="btn btn-sm" id="cloud-export">' + Icon('download') + 'ბექაპის ჩამოტვირთვა</button>' +
      '<button class="btn btn-sm" id="cloud-import">' + Icon('upload') + 'ბექაპის აღდგენა</button>' +
      '<input type="file" id="cloud-file" accept=".json,application/json" hidden>' +
      '</div>';
    return out;
  }

  function renderPanel() {
    var root = document.getElementById('modal-root');
    if (!root || root.hidden || !panelOpen) return;
    root.innerHTML =
      '<div class="modal">' +
        '<div class="modal-head"><b>' + Icon('cloud') + ' ანგარიში და სინქრონიზაცია</b>' +
          '<button class="btn btn-icon" data-close="1" aria-label="დახურვა">' + Icon('x') + '</button></div>' +
        '<div class="modal-body">' + panelBody() + '</div>' +
        '<div class="modal-foot"><button class="btn" data-close="1">დახურვა</button></div>' +
      '</div>';
  }

  var panelOpen = false;

  function openPanel() {
    var root = document.getElementById('modal-root');
    if (!root) return;
    panelOpen = true;
    root.hidden = false;
    renderPanel();
    root.onclick = function (e) {
      if (e.target === root || e.target.closest('[data-close]')) { closePanel(); return; }
      if (e.target.closest('#cloud-sync')) { manualSync(); return; }
      if (e.target.closest('#cloud-retry')) {
        check().then(function (phase) { if (phase === 'signedIn') sync({ force: true }); });
        return;
      }
      if (e.target.closest('#cloud-export')) { exportLocal(); return; }
      if (e.target.closest('#cloud-import')) {
        var fileEl = document.getElementById('cloud-file');
        if (fileEl) fileEl.click();
        return;
      }
    };
    root.onchange = function (e) {
      if (e.target.id === 'cloud-file') importLocal(e.target);
    };
    if (state.phase === 'signedIn') sync({ force: true });
    else if (state.phase !== 'checking') check().then(function (phase) { if (phase === 'signedIn') sync({ force: true }); });
  }

  function closePanel() {
    panelOpen = false;
    App.closeModal();
  }

  function exportLocal() {
    try {
      var blob = new Blob([Store.exportData()], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'spot-backup.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      App.toast('ბექაპი ჩამოიტვირთა', 'ok');
    } catch (e) { App.toast('ბექაპი ვერ შეიქმნა', 'err'); }
  }

  function importLocal(input) {
    var file = input.files && input.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        Store.importData(String(reader.result));
        closePanel();
        App.toast('პროგრესი აიტვირთა', 'ok');
        App.navigate();
      } catch (err) { App.toast('ფაილი არასწორია', 'err'); }
    };
    reader.readAsText(file);
  }

  /* ---------- გაშვება ---------- */
  function init() {
    Store.onChange(function (reason) {
      if (reason === 'cloud' || reason === 'settings') return;
      revision++;
      if (reason === 'reset') queuedReset = true;
      scheduleSync(reason === 'reset' ? 0 : undefined);
    });
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') flushSync();
    });
    var btn = document.getElementById('btn-account');
    if (btn) btn.addEventListener('click', openPanel);

    var cached = readCache();
    if (cached) {
      state.user = cached.user;
      state.lastSyncAt = cached.lastSyncAt;
      state.phase = 'signedIn';
    }
    renderStatus();
    if (location.protocol === 'file:') {
      setPhase('unavailable');
      return;
    }
    check().then(function (phase) {
      if (phase === 'signedIn') scheduleSync(1200);
    });
  }

  window.Cloud = {
    init: init,
    openPanel: openPanel,
    sync: sync,
    check: check,
    state: function () { return { phase: state.phase, user: state.user, syncing: state.syncing, lastSyncAt: state.lastSyncAt, lastError: state.lastError, revision: revision, syncedRev: syncedRev }; }
  };
})();
