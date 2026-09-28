/* მონაცემების შენახვა localStorage-ში */
(function () {
  'use strict';
  var KEY = 'teoriaB.v1';

  var defaults = {
    learned: {},     // id -> timestamp (სწორად პასუხგაცემული ერთხელ მაინც)
    wrong: {},       // id -> {n: შეცდომების რაოდენობა, ts: ბოლო}
    bookmarks: {},   // id -> true
    seen: {},        // id -> true (ნანახი ბილეთი)
    examHistory: [], // {ts, total, correct, passed, wrongIds, seconds}
    settings: {
      sound: false,
      timerOn: false,
      timerMin: 30,
      aiKey: '',
      aiModel: 'gpt-4o-mini'
    }
  };

  var state;
  try {
    state = JSON.parse(localStorage.getItem(KEY)) || {};
  } catch (e) { state = {}; }
  state = Object.assign({}, defaults, state);
  state.settings = Object.assign({}, defaults.settings, state.settings || {});

  var listeners = [];
  function notify(reason) {
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](reason); } catch (e) {}
    }
  }

  var saveTimer = null;
  function save(reason) {
    notify(reason || 'local');
    if (saveTimer) return;
    saveTimer = setTimeout(function () {
      saveTimer = null;
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    }, 150);
  }

  var Store = {
    raw: function () { return state; },

    isLearned: function (id) { return !!state.learned[id]; },
    markLearned: function (id) {
      if (!state.learned[id]) { state.learned[id] = Date.now(); save(); }
    },
    unmarkLearned: function (id) {
      if (state.learned[id]) { delete state.learned[id]; save(); }
    },
    learnedCount: function () { return Object.keys(state.learned).length; },

    isWrong: function (id) { return !!state.wrong[id]; },
    markWrong: function (id) {
      var w = state.wrong[id] || { n: 0 };
      w.n++; w.ts = Date.now();
      state.wrong[id] = w; save();
    },
    clearWrong: function (id) {
      if (state.wrong[id]) { delete state.wrong[id]; save(); }
    },
    wrongIds: function () { return Object.keys(state.wrong).map(Number); },

    isBookmarked: function (id) { return !!state.bookmarks[id]; },
    toggleBookmark: function (id) {
      if (state.bookmarks[id]) delete state.bookmarks[id];
      else state.bookmarks[id] = true;
      save();
      return !!state.bookmarks[id];
    },
    bookmarkIds: function () { return Object.keys(state.bookmarks).map(Number); },

    markSeen: function (id) {
      if (!state.seen[id]) { state.seen[id] = true; save(); }
    },
    seenCount: function () { return Object.keys(state.seen).length; },

    addExam: function (rec) {
      state.examHistory.unshift(rec);
      if (state.examHistory.length > 40) state.examHistory.length = 40;
      save();
    },
    history: function () { return state.examHistory; },

    get: function (k) { return state.settings[k]; },
    set: function (k, v) { state.settings[k] = v; save('settings'); },

    onChange: function (fn) {
      if (typeof fn === 'function') listeners.push(fn);
    },

    applyCloud: function (progress) {
      if (!progress || typeof progress !== 'object') return;
      state.learned = progress.learned || {};
      state.wrong = progress.wrong || {};
      state.bookmarks = progress.bookmarks || {};
      state.seen = progress.seen || {};
      state.examHistory = progress.examHistory || [];
      save('cloud');
    },

    reset: function () {
      state.learned = {}; state.wrong = {}; state.bookmarks = {};
      state.seen = {}; state.examHistory = [];
      save('reset');
    },

    exportData: function () {
      return JSON.stringify({
        learned: state.learned, wrong: state.wrong, bookmarks: state.bookmarks,
        seen: state.seen, examHistory: state.examHistory, ts: Date.now()
      });
    },
    importData: function (txt) {
      var d = JSON.parse(txt);
      if (d.learned) state.learned = d.learned;
      if (d.wrong) state.wrong = d.wrong;
      if (d.bookmarks) state.bookmarks = d.bookmarks;
      if (d.seen) state.seen = d.seen;
      if (d.examHistory) state.examHistory = d.examHistory;
      save();
    }
  };
  window.Store = Store;
})();
