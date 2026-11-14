/* =====================================================================
   Wise Choice Chapter-wise Test Portal — app.js
   Replaced year-wise PAPERS with individual chapter set files (`CHAPTER_LIST`)
   ===================================================================== */
(function () {
'use strict';
var $ = function (s) { return document.querySelector(s); };
window.CHAPTERS = window.CHAPTERS || {};

/* ---------- config & fallbacks ---------- */
var R = window.RULES, CL = window.CHAPTER_LIST, demo = !(R && CL && CL.length);
if (demo) {
  R = { examName: 'WBCS Prelims', fullMinutes: 120, negative: 0.25 };
  CL = [
    { name: 'English', icon: '🔤', code: 'ENG', file: 'data/english.js' },
    { name: 'Indian Polity', icon: '🏛️', code: 'POL', file: 'data/indian_polity.js' },
    { name: 'General Mental Ability', icon: '🧠', code: 'GMA', file: 'data/gma.js' }
  ];
  window.CHAPTERS.English = { topic: 'English', questions: [{ c: 'Synonyms', q: 'Synonym of "RAPID"?', o: ['Slow', 'Quick', 'Late', 'Weak'], a: 1, e: 'Rapid means quick.' }] };
  window.CHAPTERS['Indian Polity'] = { topic: 'Indian Polity', questions: [{ c: 'Constitution', q: 'Who chaired the Drafting Committee?', o: ['Nehru', 'Gandhi', 'B. R. Ambedkar', 'Patel'], a: 2, e: 'Dr B. R. Ambedkar chaired.' }] };
}

var TOPICS = CL.map(function (c) { return c.name; });
var ICON = {}, CODE = {};
CL.forEach(function (c) { ICON[c.name] = c.icon; CODE[c.name] = c.code || c.name.slice(0, 3).toUpperCase(); });

var QUOTES = (window.QUOTES && window.QUOTES.length) ? window.QUOTES : ['Small steps every day beat big plans someday.'];
var ti = function (s) { var i = TOPICS.indexOf(s); return i < 0 ? 999 : i; };
var app = $('#app'), root = document.documentElement;
var DAY = 86400000, INT = [1, 3, 7, 14];

/* ---------- storage ---------- */
function put(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
function get(k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }
function del(k) { try { localStorage.removeItem(k); } catch (e) {} }

var SET = Object.assign({ font: 1, motion: true, showTimer: true, autoNext: false, shuffleQ: false, shuffleO: false,
  confirmSubmit: true, autoWrong: true, haptic: true, wake: false, defMins: 30, defNeg: true, tools: true, fullscreen: true }, get('wc_set', {}));
var ATT = get('wc_att', []), SAV = get('wc_sav', {}), DAYM = get('wc_days', {});
root.dataset.theme = get('wc_t', 'dark'); root.dataset.pal = get('wc_p', 'violet');
var pad = function (n) { return String(n).padStart(2, '0'); };
var dkey = function (d) { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
var today0 = function () { var d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };

if (!Object.keys(DAYM).length && ATT.length) {
  ATT.forEach(function (a) { var k = dkey(new Date(a.ts)), n = 0; Object.keys(a.secs).forEach(function (t) { n += a.secs[t].c + a.secs[t].w; }); var x = DAYM[k] || (DAYM[k] = { q: 0, t: 0 }); x.q += n; x.t++; });
  put('wc_days', DAYM);
}

/* State */
var S = { kind: 'test', run: 'test', el: 0, view: 'home', target: 'all', mode: 'full', pool: 'all', secs: {}, neg: SET.defNeg, tneg: true, mins: SET.defMins, cnt: 20,
  qs: [], ans: [], qt: [], mk: [], fl: [], cur: 0, left: 0, total: 0, t: null, grid: false, tab: 'last', sf: 'all', wl: null, src: '',
  paused: false, fs: false, fsx: 0, tabx: 0, tabNote: false };
TOPICS.forEach(function (t) { S.secs[t] = false; });

function prefs() { root.style.setProperty('--fs', ['14.5px', '16px', '18px'][SET.font]); root.dataset.motion = SET.motion ? 'on' : 'off'; }
function saveSet() { put('wc_set', SET); prefs(); }
prefs();

/* ---------- helpers ---------- */
var fmt = function (s) { s = Math.max(0, s); return pad(Math.floor(s / 60)) + ':' + pad(s % 60); };
var pct = function (a, b) { return b ? Math.round(a / b * 100) : 0; };
var tone = function (p) { return p >= 75 ? '#10b981' : p >= 50 ? '#f59e0b' : '#ef4444'; };
var lab = function (p) { return p >= 75 ? 'Strong' : p >= 50 ? 'Average' : 'Weak'; };
var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
function bar(p) { return '<div class="bar"><i style="width:' + p + '%;background:' + tone(p) + '"></i></div>'; }
function render(h, keep) {
  var y = window.scrollY;
  app.innerHTML = h;
  if (keep) { window.scrollTo(0, y); return; }
  app.classList.remove('in'); void app.offsetWidth; app.classList.add('in'); window.scrollTo(0, 0);
}
function sw(on, act, v) { return '<button class="sw ' + (on ? 'on' : '') + '" role="switch" aria-checked="' + !!on + '" data-act="' + act + '" data-v="' + esc(v || '') + '"><i></i></button>'; }
function fabs(t) {
  $('#bGrid').style.display = t ? 'block' : 'none'; $('#bExit').style.display = t ? 'block' : 'none';
  $('#bPad').style.display = $('#bCalc').style.display = (t && SET.tools) ? 'block' : 'none';
}
function buzz() { if (SET.haptic && navigator.vibrate) try { navigator.vibrate(10); } catch (e) {} }
function ask(m) { return SET.confirmSubmit ? confirm(m) : true; }
function getWake() { if (SET.wake && navigator.wakeLock) navigator.wakeLock.request('screen').then(function (l) { S.wl = l; }).catch(function () {}); }
function relWake() { try { if (S.wl) S.wl.release(); } catch (e) {} S.wl = null; }
function shuf(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function label(q) { return (ICON[q.s] || '') + ' ' + esc(q.s) + (q.c ? ' · ' + esc(q.c) : ''); }
function toast(m) { var t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast.h); toast.h = setTimeout(function () { t.classList.remove('show'); }, 2600); }
function download(name, txt, mime) { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: mime || 'application/json' })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
var FL = { s: '🟢 Sure', g: '🟡 Guess', c: '🔴 Confused', u: '⚪ Not flagged' };

/* ---------- saved questions + Leitner boxes ---------- */
function keep(q, f) {
  var e = SAV[q._k] || (SAV[q._k] = { k: q._k, s: q.s, c: q.c || '', q: q.q, o: q.o, a: q.a, e: q.e || '', src: q._src || '' });
  e[f] = true;
}
function persist() { Object.keys(SAV).forEach(function (k) { if (!SAV[k].b && !SAV[k].w) delete SAV[k]; }); put('wc_sav', SAV); }
function dueList() { return Object.keys(SAV).map(function (k) { return SAV[k]; }).filter(function (e) { return e.w && (e.due || 0) <= today0(); }); }
function dueText(e) { var d = Math.round(((e.due || 0) - today0()) / DAY); return d <= 0 ? 'Due today' : 'Review in ' + d + 'd'; }

/* ---------- streaks ---------- */
function streak() {
  var n = 0, x = new Date(); if (!DAYM[dkey(x)]) x.setDate(x.getDate() - 1);
  while (DAYM[dkey(x)]) { n++; x.setDate(x.getDate() - 1); } return n;
}
function bestStreak() {
  var b = 0, c = 0, prev = null;
  Object.keys(DAYM).sort().forEach(function (k) { var d = new Date(k + 'T00:00'); c = (prev && Math.round((d - prev) / DAY) === 1) ? c + 1 : 1; if (c > b) b = c; prev = d; });
  return b;
}

/* ---------- in-progress run: autosave / resume ---------- */
function saveRun() {
  if (S.view !== 'test') return;
  put('wc_run', { run: S.run, mode: S.mode, tneg: S.tneg, src: S.src, ans: S.ans, qt: S.qt, mk: S.mk, fl: S.fl, cur: S.cur, left: S.left, total: S.total, el: S.el, fsx: S.fsx, tabx: S.tabx });
}
function clearRun() { del('wc_run'); del('wc_run_q'); }
function resume() {
  var r = get('wc_run', null), q = get('wc_run_q', null); if (!r || !q) return;
  Object.assign(S, { run: r.run, mode: r.mode, tneg: r.tneg, src: r.src, qs: q, ans: r.ans, qt: r.qt, mk: r.mk, fl: r.fl || q.map(function () { return null; }),
    cur: r.cur, left: r.left, total: r.total, el: r.el, fsx: r.fsx || 0, tabx: r.tabx || 0, paused: false });
  clearInterval(S.t); S.t = setInterval(tick, 1000); getWake(); reqFS(S.run, S.mode); fabs(true); test();
}

function reqFS(kind, mode) {
  var el = document.documentElement;
  if (kind === 'test' && mode === 'full' && SET.fullscreen && el.requestFullscreen) { S.fs = true; el.requestFullscreen().catch(function () { S.fs = false; }); }
  else S.fs = false;
}
function exitFS() { S.fs = false; if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(function () {}); }
document.addEventListener('fullscreenchange', function () {
  if (document.fullscreenElement) { $('#warn').classList.remove('show'); return; }
  if (S.fs && S.view === 'test' && !S.paused) { S.fsx++; saveRun(); $('#warn').classList.add('show'); }
});
document.addEventListener('visibilitychange', function () {
  if (document.hidden) { if (S.view === 'test' && S.run === 'test' && S.mode === 'full' && !S.paused) { S.tabx++; S.tabNote = true; saveRun(); } }
  else if (S.tabNote) { S.tabNote = false; toast('⚠️ Tab switch recorded (' + S.tabx + ')'); }
});

function pause() {
  if (S.view !== 'test' || S.run !== 'test' || S.paused) return;
  S.paused = true; closeGrid(); closeTools(); saveRun();
  $('#pLeft').textContent = fmt(S.left); $('#pause').classList.add('show');
}
function unpause() {
  S.paused = false; $('#pause').classList.remove('show');
  if (S.fs && !document.fullscreenElement) reqFS(S.run, S.mode);
}

/* ---------- question pool & counts per chapter ---------- */
var SEEN = get('wc_seen', {}), LOADED = false;
function poolQs() {
  var out = [];
  CL.forEach(function (c) {
    var ch = window.CHAPTERS[c.name];
    if (ch && ch.questions) {
      ch.questions.forEach(function (q, i) {
        out.push({ s: c.name, k: c.name + '#' + i });
      });
    }
  });
  return out;
}
function chapterCount(chName, unseen) {
  var ch = window.CHAPTERS[chName];
  if (!ch || !ch.questions) return 0;
  if (!unseen) return ch.questions.length;
  var cnt = 0;
  ch.questions.forEach(function (q, i) {
    if (!SEEN[chName + '#' + i]) cnt++;
  });
  return cnt;
}
function totalCount() {
  var n = 0;
  CL.forEach(function (c) {
    var ch = window.CHAPTERS[c.name];
    if (ch && ch.questions) n += ch.questions.length;
  });
  return n;
}

function preloadChapters() {
  return Promise.all(CL.map(function (c) {
    return loadChapter(c).then(function () { return c; }, function () { return null; });
  })).then(function (r) {
    LOADED = true;
    if (S.view === 'home') home(true);
  });
}
function loadChapter(c) {
  return new Promise(function (res, rej) {
    if (window.CHAPTERS[c.name] && window.CHAPTERS[c.name].questions) return res(window.CHAPTERS[c.name]);
    var s = document.createElement('script'); s.src = c.file;
    s.onload = function () { window.CHAPTERS[c.name] ? res(window.CHAPTERS[c.name]) : rej(); };
    s.onerror = rej; document.body.appendChild(s);
  });
}

/* ---------- Home Screen ---------- */
function quoteCard() { return '<div class="card quote"><span class="mu">💬 Today's motivation</span><p>' + esc(QUOTES[Math.floor(today0() / DAY) % QUOTES.length]) + '</p></div>'; }
function coachInfo() {
  var g = agg(), ks = Object.keys(g).filter(function (k) { return g[k].t >= 3; });
  if (!ks.length) return null; ks = weakFirst(g).filter(function (k) { return g[k].t >= 3; });
  return { k: ks[0], p: pct(g[ks[0]].c, g[ks[0]].t) };
}
function homeCards() {
  var h = '', run = get('wc_run', null), s = streak();
  h += quoteCard();
  h += '<div class="row" style="margin:-4px 0 12px"><span class="pill">🔥 ' + s + '-day streak</span><span class="pill">📝 ' + ATT.length + ' tests</span></div>';
  if (run && get('wc_run_q', null)) {
    var done = run.ans.filter(function (x) { return x !== null; }).length;
    h += '<div class="card" style="border-color:var(--a)"><b>⏯ Unfinished ' + (run.run === 'quiz' ? 'quiz' : 'test') + '</b><p class="mu" style="margin:4px 0 10px">' + esc(run.src) + ' · Q' + (run.cur + 1) + ' · ' + done + ' answered' + (run.run === 'test' ? ' · ' + fmt(run.left) + ' left' : '') + '</p><div class="row"><button class="btn s" data-act="resume">▶ Resume</button><button class="btn g s" data-act="discard">Discard</button></div></div>';
  }
  var due = dueList().length;
  if (due) h += '<div class="card hint"><span><b>🔁 Revision due: ' + due + '</b><br><span class="mu">Wrong answers ready for review</span></span><button class="btn s" data-act="revdue">Revise</button></div>';
  var c = coachInfo();
  h += c ? '<div class="card hint"><span><b>🎯 Weak-area coach</b><br><span class="mu">Weakest topic: <b style="color:' + tone(c.p) + '">' + esc(c.k) + ' (' + c.p + '%)</b>. Try 10 questions?</span></span><button class="btn s" data-act="coach" data-v="' + esc(c.k) + '">Practise</button></div>'
           : '<div class="card"><b>🎯 Weak-area coach</b><p class="mu" style="margin-top:4px">Take a few tests and I'll pick the chapter that needs you most.</p></div>';
  return h;
}

function home(keepScroll) {
  S.view = 'home'; clearInterval(S.t); relWake(); fabs(false); closeGrid(); closeTools();
  var q = S.kind === 'quiz', full = S.mode === 'full';
  var un = S.pool === 'unseen';
  var g = agg();

  var stats = '<div class="stats" style="grid-template-columns:repeat(3,1fr)">' +
    stat('Chapters', CL.length) + stat('Questions', LOADED ? totalCount() : '…') + stat('Tests taken', ATT.length) + '</div>';

  var card = '';
  if (full) {
    card = '<b>Full Mock Test (All 18 Chapters)</b><p class="mu" style="margin-top:4px">Fixed ' + R.fullMinutes + ' minutes · all 18 chapters combined · negative marking ' + R.negative.toFixed(2) + ' per wrong answer.</p>' +
      '<div class="tgrid" style="margin-top:12px">' + CL.map(function (c) {
        var cnt = chapterCount(c.name, false);
        return '<span class="tag">' + c.icon + ' ' + esc(c.name) + ' <b>' + (LOADED ? cnt : '…') + '</b></span>';
      }).join('') + '</div>';
  } else {
    var sel = TOPICS.filter(function (t) { return S.secs[t]; });
    var selSet = {}; sel.forEach(function (t) { selSet[t] = 1; });
    var avail = 0;
    CL.forEach(function (c) { if (selSet[c.name]) avail += chapterCount(c.name, un); });

    if (q) card += '<b>Instant-feedback Chapter Quiz</b><p class="mu" style="margin:4px 0 8px">See right answers and explanations immediately after each question. No timer.</p>';

    card += '<div class="line" style="padding-top:0"><b>Select Chapters</b><span class="row"><button class="btn g s" data-act="topall">All</button><button class="btn g s" data-act="topweak">🎯 Weakest 3</button><button class="btn g s" data-act="topnone">None</button></span></div>' +
      '<p class="mu"><b style="color:var(--tx)">' + sel.length + '</b> of ' + CL.length + ' chapters selected · <b style="color:var(--tx)">' + (LOADED ? avail : '…') + '</b> questions ready</p>' +
      '<div class="tgrid">' +
      CL.map(function (c) {
        var t = c.name, n = chapterCount(t, un), gp = g[t] && g[t].t ? pct(g[t].c, g[t].t) : null;
        return '<button class="chip ' + (S.secs[t] ? 'on' : '') + '" data-act="sec" data-v="' + esc(t) + '">' + c.icon + ' ' + esc(t) + ' <span class="cn">' + (LOADED ? n : '…') + '</span>' + (gp === null ? '' : '<i class="mdot" style="background:' + tone(gp) + '" title="Accuracy: ' + gp + '%"></i>') + '</button>';
      }).join('') + '</div>' +
      '<div class="line" style="margin-top:14px"><span>Question pool</span><span class="row"><button class="chip ' + (!un ? 'on' : '') + '" style="padding:6px 12px" data-act="pool" data-v="all">All</button><button class="chip ' + (un ? 'on' : '') + '" style="padding:6px 12px" data-act="pool" data-v="unseen">🆕 Unseen only</button></span></div>' +
      '<div class="line"><span>Number of questions</span><span class="row">' + [10, 20, 30, 0].map(function (cnt) { return '<button class="chip ' + (S.cnt === cnt ? 'on' : '') + '" style="padding:6px 12px" data-act="cnt" data-v="' + cnt + '">' + (cnt || 'All' + (LOADED ? ' (' + avail + ')' : '')) + '</button>'; }).join('') + '</span></div>';
  }

  if (!full) card += '<div class="line"><span>Negative marking</span>' + sw(S.neg, 'neg') + '</div>';
  if (!full && !q) card += '<div class="line"><span>Time (minutes)</span><input type="number" id="mins" min="1" max="180" value="' + S.mins + '"></div>';
  card += '<div class="line"><span>Rough pad &amp; calculator<small>Show ✏️ and 🧮 buttons</small></span>' + sw(SET.tools, 'tg', 'tools') + '</div>';
  if (!q && full) card += '<div class="line"><span>Full-screen exam mode<small>Warns if you leave full-screen</small></span>' + sw(SET.fullscreen, 'tg', 'fullscreen') + '</div>';

  var nStart = full ? totalCount() : Math.min(S.cnt || 1e9, (function () {
    var sum = 0; CL.forEach(function (c) { if (S.secs[c.name]) sum += chapterCount(c.name, un); }); return sum;
  })());

  render('<section class="hero"><h1>Wise Choice Chapter-Wise Question Bank &amp; Test Portal</h1><p class="mu">Master all 18 WBCS syllabus chapters with individual set files, timed tests, instant quizzes, and detailed analytics.</p></section>' + stats + homeCards() +
    '<h2>1 · Mode</h2><div class="chips"><button class="chip ' + (!q ? 'on' : '') + '" data-act="kind" data-v="test">📝 Exam Test</button><button class="chip ' + (q ? 'on' : '') + '" data-act="kind" data-v="quiz">💡 Quiz (instant answers)</button></div>' +
    '<h2>2 · Format</h2><div class="chips"><button class="chip ' + (full ? 'on' : '') + '" data-act="mode" data-v="full">Full Mock Test (All 18 Chapters)</button><button class="chip ' + (!full ? 'on' : '') + '" data-act="mode" data-v="sec">Chapter-wise Practice</button></div>' +
    '<div class="card" style="margin-top:12px">' + card + '</div>' +
    '<button class="btn" data-act="start" style="width:100%;padding:16px">' + (q ? 'Start Quiz' : 'Start Test') + (LOADED && nStart ? ' · ' + nStart + ' questions' : '') + ' →</button>',
    keepScroll);
}

document.addEventListener('input', function (e) {
  if (e.target.id === 'mins') S.mins = +e.target.value || 1;
  if (e.target.id === 'dm') { SET.defMins = Math.max(1, Math.min(180, +e.target.value || 30)); S.mins = SET.defMins; saveSet(); }
});

/* ---------- start test / quiz ---------- */
async function start(opt) {
  if (S.view === 'test') return;
  var sec = S.mode === 'sec', secs = TOPICS.filter(function (t) { return S.secs[t]; });
  if (sec && !secs.length) return alert('Select at least one chapter.');
  if (get('wc_run', null) && !confirm('You have an unfinished test. Discard it and start a new one?')) return;

  reqFS(S.kind, S.mode);
  var qs = [], cnt = (opt && opt.cnt != null) ? opt.cnt : S.cnt;
  var un = S.pool === 'unseen';

  CL.forEach(function (c) {
    if (!sec || secs.indexOf(c.name) > -1) {
      var ch = window.CHAPTERS[c.name];
      if (ch && ch.questions) {
        ch.questions.forEach(function (q, i) {
          var k = c.name + '#' + i;
          if (!un || !SEEN[k]) {
            qs.push(Object.assign({}, q, { s: c.name, _k: k, _src: R.examName + ' · ' + c.name }));
          }
        });
      }
    }
  });

  if (!qs.length) {
    exitFS();
    return alert(sec && un ? 'You have already seen every question in this selection. Switch pool to "All".' : 'No questions found for this selection. Check if chapter set files are loaded.');
  }

  if (sec) {
    if (cnt > 0 && qs.length > cnt) qs = shuf(qs).slice(0, cnt);
    qs.sort(function (a, b) { return ti(a.s) - ti(b.s); });
    S.src = R.examName + ' · Chapter practice (' + secs.length + ' chapters)';
  } else {
    S.src = R.examName + ' · Full Mock Test (All 18 Chapters)';
  }

  begin(qs, S.kind === 'quiz' ? 0 : (S.mode === 'full' ? R.fullMinutes : Math.max(1, S.mins)) * 60);
}

function begin(qs, total, kind) {
  S.run = kind || S.kind; S.tneg = S.neg; S.paused = false; S.fsx = 0; S.tabx = 0; S.tabNote = false;
  if (SET.shuffleQ) { var g = {}, o = []; qs.forEach(function (q) { if (!g[q.s]) { g[q.s] = []; o.push(q.s); } g[q.s].push(q); }); qs = []; o.forEach(function (s) { qs = qs.concat(shuf(g[s])); }); }
  if (SET.shuffleO) qs = qs.map(function (q) { var ord = shuf(q.o.map(function (_, i) { return i; })); return Object.assign({}, q, { o: ord.map(function (i) { return q.o[i]; }), a: ord.indexOf(q.a) }); });
  S.qs = qs; S.ans = qs.map(function () { return null; }); S.qt = qs.map(function () { return 0; }); S.fl = qs.map(function () { return null; }); S.mk = {};
  S.cur = 0; S.total = total; S.left = total; S.el = 0;
  PAD.strokes = []; CALC = calcNew(); calcUI();
  put('wc_run_q', qs);
  clearInterval(S.t); S.t = setInterval(tick, 1000); getWake(); fabs(true); test();
}

function tick() {
  if (S.paused) return;
  S.el++; if (S.view === 'test') S.qt[S.cur]++;
  if (S.el % 5 === 0) saveRun();
  if (S.run === 'quiz') return;
  S.left--;
  var el = $('#tm'); if (el) { el.textContent = SET.showTimer ? fmt(S.left) : '⏱ ••'; el.classList.toggle('low', S.left < 300); }
  if (S.left <= 0) { toast('⏰ Time is up!'); submit(); }
}

/* ---------- test screens ---------- */
function tchips(q) {
  var secs = []; S.qs.forEach(function (x) { if (secs.indexOf(x.s) < 0) secs.push(x.s); });
  return '<div class="chips sm tscroll">' + secs.map(function (s) {
    return '<button class="chip ' + (s === q.s ? 'on' : '') + '" data-act="secjump" data-v="' + esc(s) + '">' + (ICON[s] || '') + ' ' + esc(s) + '</button>';
  }).join('') + '</div>';
}
function centerChip() { var c = $('.tscroll .on'); if (c) { var p = c.parentNode; p.scrollLeft = c.offsetLeft - p.clientWidth / 2 + c.clientWidth / 2; } }
function flagsRow(locked) {
  var f = S.fl[S.cur];
  return '<div class="flags"><span class="mu">Confidence:</span>' + [['s', '🟢 Sure'], ['g', '🟡 Guess'], ['c', '🔴 Confused']].map(function (x) {
    return '<button class="chip ' + (f === x[0] ? 'on' : '') + '" ' + (locked ? 'disabled' : '') + ' data-act="flag" data-v="' + x[0] + '">' + x[1] + '</button>';
  }).join('') + '</div>';
}
function quizView(keep) {
  var q = S.qs[S.cur], a = S.ans[S.cur], done = a !== null, c = 0, w = 0, sv = SAV[q._k] && SAV[q._k].b;
  S.ans.forEach(function (x, i) { if (x !== null) { x === S.qs[i].a ? c++ : w++; } });
  render('<div class="top"><span class="mu">Q ' + (S.cur + 1) + ' / ' + S.qs.length + '</span><span class="timer">✅ ' + c + ' · ❌ ' + w + '</span></div>' +
    '<div class="bar"><i style="width:' + ((S.cur + 1) / S.qs.length * 100) + '%"></i></div>' + tchips(q) +
    '<div class="card"><span class="tag">' + label(q) + '</span><div style="height:8px"></div><b class="qt">' + q.q + '</b>' +
    q.o.map(function (o, i) { return '<button class="opt ' + (done ? (i === q.a ? 'ok' : i === a ? 'bad' : '') : '') + '" data-act="opt" data-v="' + i + '">' + 'ABCD'.charAt(i) + '. ' + o + '</button>'; }).join('') +
    flagsRow(done) +
    (done ? '<div class="expl"><b>' + (a === q.a ? '✅ Correct!' : '❌ Incorrect') + '</b> · Answer: ' + 'ABCD'.charAt(q.a) + '<br>💡 ' + (q.e || 'No explanation added yet.') + '</div>' : '') + '</div>' +
    '<div class="row"><button class="btn g" data-act="prev">←</button><button class="btn g" data-act="save">' + (sv ? '🔖 Saved' : '🔖 Save') + '</button><button class="btn" data-act="next" style="margin-left:auto">' + (S.cur === S.qs.length - 1 ? 'Finish ✓' : 'Next →') + '</button></div>', keep);
  centerChip(); if (S.grid) fillGrid(); saveRun();
}
function qcls(i) {
  if (S.run === 'quiz') return S.ans[i] === null ? '' : (S.ans[i] === S.qs[i].a ? 'ok' : 'bad');
  return (S.ans[i] !== null ? 'ans' : '') + ' ' + (S.mk[i] ? 'mk' : '');
}
function test(keep) {
  S.view = 'test'; if (S.run === 'quiz') return quizView(keep);
  var q = S.qs[S.cur], done = S.ans.filter(function (a) { return a !== null; }).length, sv = SAV[q._k] && SAV[q._k].b;
  render('<div class="top"><span class="mu">Q ' + (S.cur + 1) + ' / ' + S.qs.length + ' · ' + done + ' answered</span><span class="row"><button class="btn g s" data-act="pause">⏸ Pause</button><span class="timer ' + (S.left < 300 ? 'low' : '') + '" id="tm">' + (SET.showTimer ? fmt(S.left) : '⏱ ••') + '</span></span></div>' +
    '<div class="bar"><i style="width:' + ((S.cur + 1) / S.qs.length * 100) + '%"></i></div>' + tchips(q) +
    '<div class="card"><span class="tag">' + label(q) + '</span><div style="height:8px"></div><b class="qt">' + q.q + '</b>' +
    q.o.map(function (o, i) { return '<button class="opt ' + (S.ans[S.cur] === i ? 'sel' : '') + '" data-act="opt" data-v="' + i + '">' + 'ABCD'.charAt(i) + '. ' + o + '</button>'; }).join('') + flagsRow(false) + '</div>' +
    '<div class="row"><button class="btn g" data-act="prev">←</button><button class="btn g" data-act="mark">' + (S.mk[S.cur] ? '★ Marked' : '☆ Mark') + '</button><button class="btn g" data-act="save">' + (sv ? '🔖 Saved' : '🔖 Save') + '</button><button class="btn g" data-act="clear">Clear</button><button class="btn" data-act="next" style="margin-left:auto">' + (S.cur === S.qs.length - 1 ? 'Submit ✓' : 'Next →') + '</button></div>', keep);
  centerChip(); if (S.grid) fillGrid(); saveRun();
}
function fillGrid() {
  var a = S.ans.filter(function (x) { return x !== null; }).length, m = Object.keys(S.mk).length;
  $('#drawer').innerHTML = '<b>Questions</b><p class="mu" style="margin-top:4px">🟩 ' + a + ' answered · 🟧 ' + m + ' marked · ' + (S.qs.length - a) + ' left</p><div class="grid">' +
    S.qs.map(function (_, i) { return '<button class="qn ' + qcls(i) + ' ' + (i === S.cur ? 'cur' : '') + '" data-act="jump" data-v="' + i + '">' + (i + 1) + '</button>'; }).join('') +
    '</div><button class="btn" data-act="submit" style="width:100%">' + (S.run === 'quiz' ? 'Finish Quiz' : 'Submit Test') + '</button>';
}
function openGrid() { S.grid = true; fillGrid(); $('#drawer').classList.add('show'); $('#shade').classList.add('show'); }
function closeGrid() { S.grid = false; $('#drawer').classList.remove('show'); $('#shade').classList.remove('show'); }

/* ---------- submit + results ---------- */
function submit() {
  clearInterval(S.t); relWake(); fabs(false); closeGrid(); closeTools(); exitFS(); clearRun();
  S.paused = false; $('#pause').classList.remove('show'); $('#warn').classList.remove('show'); S.view = 'result';
  var neg = (S.run === 'test' && S.mode === 'full') ? R.negative : (S.tneg ? R.negative : 0);
  var st = {}, det = [], full = [], conf = {}, sc = 0, att = 0, mastered = 0, tomorrow = today0() + DAY;
  S.qs.forEach(function (q, i) {
    var r = S.ans[i] === null ? 'n' : S.ans[i] === q.a ? 'c' : 'w', f = S.fl[i] || 'u';
    var x = st[q.s] = st[q.s] || { c: 0, w: 0, n: 0, t: 0 }, cf = conf[f] = conf[f] || { c: 0, w: 0, n: 0 };
    x.t++; x[r]++; if (r === 'c') sc++; if (r === 'w') sc -= neg; if (r !== 'n') att++;
    if (r !== 'n' && q._k) SEEN[q._k] = 1;
    det.push({ s: q.s, r: r, t: S.qt[i] || 0, f: f });
    full.push({ s: q.s, c: q.c || '', q: q.q, o: q.o, a: q.a, y: S.ans[i], t: S.qt[i] || 0, f: f, e: q.e || '' });
    var e = SAV[q._k];
    if (r === 'w' && (SET.autoWrong || S.mode === 'saved')) { keep(q, 'w'); e = SAV[q._k]; e.box = 1; e.due = tomorrow; }
    else if (r === 'c' && S.mode === 'saved' && e && e.w) {
      e.box = (e.box || 1) + 1;
      if (e.box > 4) { e.w = false; e.box = 0; delete e.due; mastered++; } else e.due = today0() + INT[e.box - 1] * DAY;
    }
  });
  persist(); put('wc_seen', SEEN);
  var dk = dkey(), dd = DAYM[dk] || (DAYM[dk] = { q: 0, t: 0 }); dd.q += att; dd.t++; put('wc_days', DAYM);
  ATT.push({ ts: Date.now(), src: S.mode === 'saved' ? 'Revision practice' : S.src + (S.run === 'quiz' ? ' · Quiz' : ''), mode: S.mode, run: S.run, sc: sc, max: S.qs.length, neg: neg, used: S.el, total: S.total, secs: st, det: det, conf: conf, fsx: S.fsx, tabx: S.tabx, full: full });
  if (ATT.length > 40) ATT.shift();
  ATT.forEach(function (a, i) { if (i < ATT.length - 5) delete a.full; });
  put('wc_att', ATT);
  render('<div class="card res">' + ring(sc, S.qs.length) + '<p class="mu">Time taken: ' + fmt(ATT[ATT.length - 1].used) + (S.fsx + S.tabx ? ' · ⚠️ ' + (S.fsx + S.tabx) + ' focus lapse(s)' : '') + '</p></div>' +
    Object.keys(st).sort(function (a, b) { return ti(a) - ti(b); }).map(function (k) { var v = st[k]; return '<div class="card"><b>' + (ICON[k] || '') + ' ' + esc(k) + '</b> <span class="mu">✅ ' + v.c + ' · ❌ ' + v.w + ' · ⏭ ' + v.n + '</span><div class="bar" style="margin-bottom:0"><i style="width:' + pct(v.c, v.t) + '%"></i></div></div>'; }).join('') +
    '<div class="row" style="margin:6px 0"><button class="btn" data-act="sheet" data-v="last">📊 Full analysis</button><button class="btn g" data-act="exportq">⬇ Export attempted (CSV)</button><button class="btn g" data-act="home">← Home</button></div>' +
    (mastered ? '<p class="mu">🎉 ' + mastered + ' question(s) mastered and removed from your revision notebook.</p>' : '') +
    (S.mode !== 'saved' && SET.autoWrong ? '<p class="mu">Wrong answers were added to your 🔖 Saved notebook for spaced revision.</p>' : '') +
    '<h2>Review</h2>' + S.qs.map(function (q, i) {
      return '<div class="card"><div class="line" style="padding-top:0"><span class="mu">' + label(q) + ' · Q' + (i + 1) + ' · ⏱ ' + (S.qt[i] || 0) + 's' + (S.fl[i] ? ' · ' + FL[S.fl[i]] : '') + '</span><button class="btn g s" data-act="rsave" data-v="' + i + '">' + (SAV[q._k] && SAV[q._k].b ? '🔖 Saved' : '🔖 Save') + '</button></div><b class="qt">' + q.q + '</b>' +
        q.o.map(function (o, j) { return '<div class="opt ' + (j === q.a ? 'ok' : S.ans[i] === j ? 'bad' : '') + '">' + o + '</div>'; }).join('') + (q.e ? '<div class="expl">💡 ' + q.e + '</div>' : '') + '</div>';
    }).join(''));
  celebrate(sc / S.qs.length, sc);
}

function ring(sc, max) {
  var c = 0, w = 0, n = 0, p = Math.max(0, Math.min(1, sc / max));
  S.ans.forEach(function (a, i) { if (a === null) n++; else if (a === S.qs[i].a) c++; else w++; });
  var msg = p >= .75 ? 'Outstanding result!' : p >= .5 ? 'Good going — keep climbing' : p >= .25 ? 'Solid start — review and retry' : 'Every mistake here is a mark saved later';
  return '<div class="ringw"><svg viewBox="0 0 120 120" aria-hidden="true"><defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--a)"/><stop offset="1" style="stop-color:var(--b)"/></linearGradient></defs>' +
    '<circle class="t" cx="60" cy="60" r="52"/><circle class="f" cx="60" cy="60" r="52" style="--o:' + (326.7 * (1 - p)).toFixed(1) + '"/></svg>' +
    '<div class="ringc"><b id="rnum">' + sc.toFixed(2) + '</b><small>out of ' + max + ' · ' + Math.round(p * 100) + '%</small></div></div>' +
    '<h3>' + msg + '</h3><div class="rp"><span style="color:#10b981">✅ ' + c + '</span><span style="color:#ef4444">❌ ' + w + '</span><span>⏭ ' + n + '</span></div>';
}

function celebrate(p, sc) {
  var el = $('#rnum'), t0 = performance.now();
  if (el && SET.motion) (function f(t) { var k = Math.min(1, (t - t0) / 1500); el.textContent = (sc * (1 - Math.pow(1 - k, 3))).toFixed(2); if (k < 1) requestAnimationFrame(f); })(t0);
  if (p < .25 || !SET.motion || (window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches)) return;
  var cv = $('#cf'), c = cv.getContext('2d'), W = cv.width = innerWidth, H = cv.height = innerHeight, ps = [], i,
      cols = ['#7b6cff', '#f2b84b', '#22b8cf', '#f0567a', '#2fbf8f', '#ff8a3d'], N = Math.round(70 + p * 150), st = performance.now();
  for (i = 0; i < N; i++) ps.push({ x: W / 2 + (Math.random() - .5) * 120, y: H * .3, vx: (Math.random() - .5) * 15, vy: -Math.random() * 15 - 4, w: 6 + Math.random() * 6, h: 4 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: cols[i % cols.length] });
  (function loop(t) {
    c.clearRect(0, 0, W, H);
    ps.forEach(function (q) { q.vy += .3; q.vx *= .992; q.x += q.vx; q.y += q.vy; q.r += q.vr; c.save(); c.translate(q.x, q.y); c.rotate(q.r); c.fillStyle = q.c; c.fillRect(-q.w / 2, -q.h / 2, q.w, q.h); c.restore(); });
    if (t - st < 4200) requestAnimationFrame(loop); else c.clearRect(0, 0, W, H);
  })(st);
}

function exportQ() {
  var a = ATT[ATT.length - 1]; if (!a || !a.full) return alert('Nothing to export yet. Finish a test first.');
  var rows = [['#', 'Chapter', 'Sub-topic', 'Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Your answer', 'Correct answer', 'Result', 'Time (s)', 'Confidence', 'Explanation']];
  a.full.forEach(function (x, i) {
    if (x.y === null || x.y === undefined) return;
    rows.push([i + 1, x.s, x.c, x.q, x.o[0] || '', x.o[1] || '', x.o[2] || '', x.o[3] || '', 'ABCD'.charAt(x.y) + '. ' + x.o[x.y], 'ABCD'.charAt(x.a) + '. ' + x.o[x.a], x.y === x.a ? 'Correct' : 'Wrong', x.t, FL[x.f] ? FL[x.f].replace(/^\S+\s/, '') : '', x.e]);
  });
  if (rows.length === 1) return alert('You did not attempt any question in the last test.');
  var csv = '﻿' + rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/<[^>]*>/g, ' ').replace(/"/g, '""') + '"'; }).join(','); }).join('
');
  download('wisechoice-attempted-' + dkey(new Date(a.ts)) + '.csv', csv, 'text/csv;charset=utf-8');
}

/* ---------- charts & analytics ---------- */
function radar(map) {
  var N = TOPICS.length, cx = 170, cy = 160, r = 96, f1 = function (n) { return n.toFixed(1); };
  var pt = function (i, v) { var a = -Math.PI / 2 + 2 * Math.PI * i / N; return [cx + Math.cos(a) * r * v, cy + Math.sin(a) * r * v]; };
  var s = '<svg viewBox="0 0 340 320" style="width:100%;height:auto" role="img" aria-label="Radar chart">';
  [.25, .5, .75, 1].forEach(function (l) { s += '<polygon points="' + TOPICS.map(function (_, i) { return pt(i, l).map(f1).join(','); }).join(' ') + '" fill="none" stroke="var(--bd)" stroke-width="1"/>'; });
  TOPICS.forEach(function (t, i) {
    var e = pt(i, 1), l = pt(i, 1.17), c = Math.cos(-Math.PI / 2 + 2 * Math.PI * i / N), has = !!(map[t] && map[t].t);
    s += '<line x1="' + cx + '" y1="' + cy + '" x2="' + f1(e[0]) + '" y2="' + f1(e[1]) + '" stroke="var(--bd)"/><text x="' + f1(l[0]) + '" y="' + f1(l[1] + 3) + '" text-anchor="' + (c > .3 ? 'start' : c < -.3 ? 'end' : 'middle') + '" font-size="8.5" font-weight="700" style="fill:var(--mu)" opacity="' + (has ? 1 : .4) + '">' + esc(CODE[t]) + '</text>';
  });
  var vals = TOPICS.map(function (t, i) { var m = map[t]; return pt(i, m && m.t ? pct(m.c, m.t) / 100 : 0); });
  s += '<polygon points="' + vals.map(function (p) { return p.map(f1).join(','); }).join(' ') + '" style="fill:var(--a);stroke:var(--a)" fill-opacity=".28" stroke-width="2" stroke-linejoin="round"/>';
  vals.forEach(function (p, i) { var m = map[TOPICS[i]]; if (m && m.t) s += '<circle cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" r="3" fill="' + tone(pct(m.c, m.t)) + '"/>'; });
  return s + '</svg><div class="codes">' + TOPICS.map(function (t) { return '<span><b>' + esc(CODE[t]) + '</b> ' + esc(t) + '</span>'; }).join('') + '</div>';
}
function bars(map) {
  var rh = 19, s = '<svg viewBox="0 0 340 ' + (TOPICS.length * rh + 6) + '" style="width:100%;height:auto" role="img" aria-label="Accuracy by chapter">';
  TOPICS.forEach(function (t, i) {
    var y = i * rh + 3, has = map[t] && map[t].t, p = has ? pct(map[t].c, map[t].t) : 0;
    s += '<text x="0" y="' + (y + 11) + '" font-size="9.5" style="fill:var(--tx)" opacity="' + (has ? 1 : .45) + '">' + esc(t) + '</text><rect x="132" y="' + (y + 2) + '" width="170" height="10" rx="5" style="fill:var(--bd)"/>' +
      (has ? '<rect x="132" y="' + (y + 2) + '" width="' + Math.max(4, p * 1.7) + '" height="10" rx="5" fill="' + tone(p) + '"/>' : '') +
      '<text x="340" y="' + (y + 11) + '" text-anchor="end" font-size="9.5" font-weight="700" style="fill:var(--mu)">' + (has ? p + '%' : '–') + '</text>';
  });
  return s + '</svg>';
}
function heat() {
  var W = 17, cell = 14, gap = 3, today = new Date(); today.setHours(0, 0, 0, 0);
  var start = new Date(today); start.setDate(today.getDate() - ((W - 1) * 7 + today.getDay()));
  var op = [0, .3, .55, .8, 1], mn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], lastM = -1, act = 0;
  var s = '<svg viewBox="0 0 ' + (W * (cell + gap)) + ' ' + (7 * (cell + gap) + 14) + '" style="width:100%;height:auto" role="img" aria-label="Heatmap">';
  for (var w = 0; w < W; w++) for (var d = 0; d < 7; d++) {
    var dt = new Date(start); dt.setDate(start.getDate() + w * 7 + d); if (dt > today) continue;
    var rec = DAYM[dkey(dt)], q = rec ? rec.q : 0, lv = !q ? 0 : q < 10 ? 1 : q < 25 ? 2 : q < 50 ? 3 : 4;
    if (q) act++;
    if (d === 0 && dt.getMonth() !== lastM) { lastM = dt.getMonth(); s += '<text x="' + (w * (cell + gap)) + '" y="9" font-size="8.5" style="fill:var(--mu)">' + mn[lastM] + '</text>'; }
    s += '<rect x="' + (w * (cell + gap)) + '" y="' + (14 + d * (cell + gap)) + '" width="' + cell + '" height="' + cell + '" rx="3" style="fill:' + (lv ? 'var(--a)' : 'var(--bd)') + '" fill-opacity="' + (lv ? op[lv] : 1) + '"><title>' + dkey(dt) + ': ' + q + ' Qs</title></rect>';
  }
  return s + '</svg><div class="legend"><span style="margin-right:auto">' + act + ' active day' + (act === 1 ? '' : 's') + '</span>Less ' + op.map(function (o, i) { return '<i style="' + (i ? 'opacity:' + o : 'background:var(--bd)') + '"></i>'; }).join('') + ' More</div>';
}

function stat(l, v) { return '<div class="stat"><span class="mu">' + l + '</span><b>' + v + '</b></div>'; }
function empty(i, t, d) { return '<div class="empty"><b>' + i + '</b><div style="color:var(--tx);font-weight:700">' + t + '</div><div>' + d + '</div></div>'; }
function trow(k, v, btn) {
  var p = pct(v.c, v.t);
  return '<div class="card"><div class="line" style="padding:0"><b>' + (ICON[k] || '') + ' ' + esc(k) + '</b><b style="color:' + tone(p) + '">' + p + '% · ' + lab(p) + '</b></div>' +
    '<div class="line" style="padding:4px 0 0"><span class="mu">' + v.c + '/' + v.t + ' correct · ' + v.w + ' wrong</span>' +
    (btn ? '<button class="btn g s" data-act="ptopic" data-v="' + esc(k) + '">Practise</button>' : '') + '</div>' + bar(p) + '</div>';
}
function agg() {
  var s = {};
  ATT.forEach(function (a) { Object.keys(a.secs).forEach(function (k) { var v = a.secs[k], x = s[k] || (s[k] = { c: 0, w: 0, n: 0, t: 0 }); x.c += v.c; x.w += v.w; x.n += v.n; x.t += v.t; }); });
  return s;
}
function aggConf() {
  var s = {};
  ATT.forEach(function (a) { Object.keys(a.conf || {}).forEach(function (k) { var v = a.conf[k], x = s[k] || (s[k] = { c: 0, w: 0, n: 0 }); x.c += v.c; x.w += v.w; x.n += v.n; }); });
  return s;
}
function weakFirst(g) { return Object.keys(g).sort(function (a, b) { return pct(g[a].c, g[a].t) - pct(g[b].c, g[b].t) || ti(a) - ti(b); }); }
function nums(list, col, max) {
  if (!list.length) return '<span class="mu">None 🎉</span>';
  return '<div class="cnum">' + list.slice(0, max || 15).map(function (n) { return '<span style="background:' + col + '">' + n + '</span>'; }).join('') + '</div>';
}
function timeBlock(a) {
  var n = a.det.length, avg = a.det.reduce(function (s, d) { return s + d.t; }, 0) / n || 1;
  var ids = function (fn) { return a.det.map(function (d, i) { return fn(d) ? i + 1 : 0; }).filter(Boolean); };
  var sw_ = ids(function (d) { return d.r === 'w' && d.t >= 1.5 * avg; }), fw = ids(function (d) { return d.r === 'w' && d.t <= .5 * avg; }), sr = ids(function (d) { return d.r === 'c' && d.t >= 1.5 * avg; });
  return '<div class="sec">Time per question</div><div class="card"><p class="mu">Average: <b style="color:var(--tx)">' + avg.toFixed(0) + 's</b> per question</p>' +
    '<div class="line" style="padding-bottom:0"><b>🐢 Slow &amp; wrong</b></div>' + nums(sw_, '#ef4444') +
    '<div class="line" style="padding-bottom:0"><b>⚡ Fast &amp; wrong</b></div>' + nums(fw, '#f59e0b') +
    '<div class="line" style="padding-bottom:0"><b>🐌 Slow but right</b></div>' + nums(sr, '#3b82f6') + '</div>';
}
function confBlock(cf) {
  var keys = ['s', 'g', 'c', 'u'].filter(function (k) { return cf[k]; });
  if (!keys.length) return '';
  return '<div class="sec">Confidence calibration</div><div class="card"><div class="mtx"><b></b><b>Right</b><b>Wrong</b><b>Skipped</b>' + keys.map(function (k) { var v = cf[k]; return '<span class="l">' + FL[k] + '</span><span style="color:#10b981">' + v.c + '</span><span style="color:#ef4444">' + v.w + '</span><span>' + v.n + '</span>'; }).join('') + '</div></div>';
}
function tLast() {
  var a = ATT[ATT.length - 1]; if (!a) return empty('📊', 'No test yet', 'Finish a test and its full analysis shows up here.');
  var c = 0, w = 0; Object.keys(a.secs).forEach(function (k) { c += a.secs[k].c; w += a.secs[k].w; });
  return '<p class="mu" style="margin-bottom:10px">' + esc(a.src) + ' · ' + new Date(a.ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + '</p>' +
    '<div class="stats">' + stat('Score', a.sc.toFixed(2) + ' / ' + a.max) + stat('Accuracy', pct(c, c + w) + '%') + stat('Attempted', (c + w) + ' / ' + a.max) + stat('Time taken', fmt(a.used)) + '</div>' +
    (a.full ? '<button class="btn" data-act="exportq" style="width:100%;margin-bottom:12px">⬇ Export attempted questions (CSV)</button>' : '') +
    '<div class="sec">Strength radar</div><div class="card">' + radar(a.secs) + '</div>' +
    timeBlock(a) + confBlock(a.conf || {}) +
    '<div class="sec">Chapters in this test</div>' + Object.keys(a.secs).sort(function (x, y) { return ti(x) - ti(y); }).map(function (k) { return trow(k, a.secs[k]); }).join('');
}
function spark() {
  var p = ATT.slice(-12).map(function (a) { return Math.max(0, Math.min(100, a.sc / a.max * 100)); });
  if (p.length < 2) return '<p class="mu">Take 2+ tests to see your trend.</p>';
  return '<svg viewBox="0 0 200 50" preserveAspectRatio="none" style="width:100%;height:70px"><polyline points="' + p.map(function (v, i) { return (i * 200 / (p.length - 1)).toFixed(1) + ',' + (48 - v * .46).toFixed(1); }).join(' ') + '" fill="none" style="stroke:var(--a)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>';
}
function tAll() {
  var g = agg(), c = 0, w = 0, t = 0, sum = 0, s = streak();
  Object.keys(g).forEach(function (k) { c += g[k].c; w += g[k].w; });
  ATT.forEach(function (a) { sum += (a.sc / a.max * 100); t += a.used; });
  var h = '<div class="stats">' + stat('Tests', ATT.length) + stat('Avg score', ATT.length ? Math.round(sum / ATT.length) + '%' : '–') + stat('Streak', '🔥 ' + s + 'd') + stat('Accuracy', ATT.length ? pct(c, c + w) + '%' : '–') + '</div>' +
    '<div class="sec">Daily practice calendar</div><div class="card">' + heat() + '</div>';
  if (!ATT.length) return h + empty('📈', 'No test data yet', 'Radar and trends appear after your first test.');
  var weak = weakFirst(g).slice(0, 3);
  return h + '<div class="card"><span class="mu">Score trend</span>' + spark() + '</div>' +
    '<div class="sec">Strength radar</div><div class="card">' + radar(g) + '</div>' +
    '<div class="sec">Accuracy by chapter</div><div class="card">' + bars(g) + '</div>' +
    '<div class="sec">Focus on these chapters</div>' + weak.map(function (k) { return trow(k, g[k], true); }).join('');
}
function tTopics() {
  var g = agg(), done = weakFirst(g), un = TOPICS.filter(function (k) { return !g[k]; });
  return '<div class="card">' + bars(g) + '</div><p class="mu" style="margin-bottom:10px">All 18 chapters ranked by weakness — tap Practise to drill one.</p>' + done.map(function (k) { return trow(k, g[k], true); }).join('') +
    (un.length ? '<div class="sec">Not attempted yet (' + un.length + ')</div><div class="tgrid">' + un.map(function (k) { return '<button class="chip" data-act="ptopic" data-v="' + esc(k) + '">' + ICON[k] + ' ' + esc(k) + '</button>'; }).join('') + '</div>' : '');
}
function savedList() {
  return Object.keys(SAV).map(function (k) { return SAV[k]; }).filter(function (e) { return S.sf === 'all' || (S.sf === 'b' && e.b) || (S.sf === 'w' && e.w) || (S.sf === 'd' && e.w && (e.due || 0) <= today0()); })
    .sort(function (a, b) { return (a.due || 0) - (b.due || 0); });
}
function tSav() {
  var all = Object.keys(SAV).length, l = savedList(), due = dueList().length;
  var h = '<div class="chips sm">' + [['all', 'All (' + all + ')'], ['d', '🔁 Due (' + due + ')'], ['w', '❌ Wrong'], ['b', '🔖 Saved']].map(function (x) { return '<button class="chip ' + (S.sf === x[0] ? 'on' : '') + '" data-act="sfil" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>';
  if (!l.length) return h + empty('🔖', 'Nothing here', 'Save questions or get wrong answers during tests.');
  return h + '<button class="btn" data-act="practice" style="width:100%;margin-bottom:12px">▶ Practise these (' + l.length + ')</button>' + l.map(function (e) {
    return '<div class="card"><div class="line" style="padding:0 0 6px"><span><span class="tag">' + esc(e.s) + (e.c ? ' · ' + esc(e.c) : '') + '</span></span><button class="btn g s" data-act="delsav" data-v="' + esc(e.k) + '">🗑</button></div><b class="qt">' + e.q + '</b><div class="opt ok" style="margin-top:10px">✅ ' + 'ABCD'.charAt(e.a) + '. ' + e.o[e.a] + '</div>' + (e.e ? '<div class="expl">💡 ' + e.e + '</div>' : '') + '</div>';
  }).join('');
}
function setRow(l, d, c) { return '<div class="line"><span>' + l + (d ? '<small>' + d + '</small>' : '') + '</span>' + c + '</div>'; }
function tSet() {
  var kb = Math.round((JSON.stringify(ATT).length + JSON.stringify(SAV).length) / 1024 * 10) / 10;
  var cols = { violet: '#7b6cff', ocean: '#22b8cf', sunset: '#ff8a3d', forest: '#2fbf8f', rose: '#f0567a' };
  return '<div class="sec">Appearance</div><div class="card">' +
    setRow('Dark mode', '', sw(root.dataset.theme === 'dark', 'theme')) +
    '<div class="line"><span>Palette</span><span class="row">' + Object.keys(cols).map(function (k) { return '<button class="dot ' + (root.dataset.pal === k ? 'on' : '') + '" data-act="pick" data-v="' + k + '" style="background:' + cols[k] + '"></button>'; }).join('') + '</span></div>' +
    '<div class="line"><span>Text size</span><span class="row">' + ['A−', 'A', 'A+'].map(function (l, i) { return '<button class="chip ' + (SET.font === i ? 'on' : '') + '" style="padding:6px 14px" data-act="font" data-v="' + i + '">' + l + '</button>'; }).join('') + '</span></div>' +
    setRow('Motion graphics', '', sw(SET.motion, 'tg', 'motion')) + '</div>' +
    '<div class="sec">Test experience</div><div class="card">' +
    setRow('Rough pad &amp; calculator', '', sw(SET.tools, 'tg', 'tools')) +
    setRow('Full-screen exam mode', '', sw(SET.fullscreen, 'tg', 'fullscreen')) +
    setRow('Show timer', '', sw(SET.showTimer, 'tg', 'showTimer')) +
    setRow('Auto-next on answer', '', sw(SET.autoNext, 'tg', 'autoNext')) +
    setRow('Shuffle questions', '', sw(SET.shuffleQ, 'tg', 'shuffleQ')) +
    setRow('Shuffle options', '', sw(SET.shuffleO, 'tg', 'shuffleO')) +
    setRow('Haptic feedback', '', sw(SET.haptic, 'tg', 'haptic')) +
    setRow('Keep screen awake', '', sw(SET.wake, 'tg', 'wake')) + '</div>' +
    '<div class="sec">Data</div><div class="card"><p class="mu" style="margin-bottom:10px">Stored: ' + ATT.length + ' tests · ' + Object.keys(SAV).length + ' saved · ' + kb + ' KB</p>' +
    '<div class="row"><button class="btn g s" data-act="export">⬇ Backup</button><button class="btn g s" data-act="import">⬆ Restore</button><button class="btn g s" data-act="wipe" style="color:#ef4444">🗑 Clear data</button></div></div>';
}
function sheet() {
  var tabs = [['last', '📊 Last test'], ['all', '📈 Overall'], ['chap', '📚 Chapters'], ['sav', '🔖 Revision'], ['set', '⚙️ Settings']];
  $('#stabs').innerHTML = tabs.map(function (t) { return '<button class="chip ' + (S.tab === t[0] ? 'on' : '') + '" data-act="tab" data-v="' + t[0] + '">' + t[1] + '</button>'; }).join('');
  var b = $('#sbody'), y = b.scrollTop; b.innerHTML = ({ last: tLast, all: tAll, chap: tTopics, sav: tSav, set: tSet })[S.tab](); b.scrollTop = y;
}
function openSheet(tab) { if (tab) S.tab = tab; sheet(); $('#sheet').classList.add('show'); $('#shade2').classList.add('show'); }
function closeSheet() { $('#sheet').classList.remove('show'); $('#shade2').classList.remove('show'); }
var sheetOpen = function () { return $('#sheet').classList.contains('show'); };

/* ---------- rough pad & calculator ---------- */
var PAD = { strokes: [], col: 'auto', erase: false, cur: null, cv: null, cx: null };
function inkColor(c) { return c === 'auto' ? getComputedStyle(root).getPropertyValue('--tx').trim() || '#fff' : c; }
function strokeSeg(s, pts) {
  var c = PAD.cx; c.save(); c.globalCompositeOperation = s.e ? 'destination-out' : 'source-over';
  c.strokeStyle = inkColor(s.c); c.lineWidth = s.e ? 18 : 2.6; c.lineCap = c.lineJoin = 'round'; c.beginPath();
  pts.forEach(function (p, i) { i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); });
  if (pts.length === 1) c.lineTo(pts[0][0] + .1, pts[0][1]); c.stroke(); c.restore();
}
function padDraw() { PAD.cx.clearRect(0, 0, PAD.cv.width, PAD.cv.height); PAD.strokes.forEach(function (s) { strokeSeg(s, s.p); }); }
function padResize() {
  var r = PAD.cv.getBoundingClientRect(), d = window.devicePixelRatio || 1; if (!r.width) return;
  PAD.cv.width = Math.round(r.width * d); PAD.cv.height = Math.round(r.height * d); PAD.cx.setTransform(d, 0, 0, d, 0, 0); padDraw();
}
function padUI() {
  document.querySelectorAll('[data-pc]').forEach(function (b) { b.classList.toggle('on', !PAD.erase && b.dataset.pc === PAD.col); });
  $('#bErase').classList.toggle('on', PAD.erase);
}
function padInit() {
  PAD.cv = $('#pad'); PAD.cx = PAD.cv.getContext('2d');
  var pt = function (e) { var r = PAD.cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  PAD.cv.addEventListener('pointerdown', function (e) {
    e.preventDefault(); try { PAD.cv.setPointerCapture(e.pointerId); } catch (x) {}
    PAD.cur = { c: PAD.col, e: PAD.erase, p: [pt(e)] }; PAD.strokes.push(PAD.cur); strokeSeg(PAD.cur, PAD.cur.p);
  });
  PAD.cv.addEventListener('pointermove', function (e) {
    if (!PAD.cur) return; var p = pt(e), l = PAD.cur.p[PAD.cur.p.length - 1]; PAD.cur.p.push(p); strokeSeg(PAD.cur, [l, p]);
  });
  var up = function () { PAD.cur = null; };
  PAD.cv.addEventListener('pointerup', up); PAD.cv.addEventListener('pointercancel', up);
  window.addEventListener('resize', function () { if (toolsOpen()) padResize(); });
}

var CALC = calcNew(), SYM = { '+': '+', '-': '−', '*': '×', '/': '÷' };
function calcNew() { return { cur: '0', acc: null, op: null, fresh: true }; }
function fmtn(n) { if (!isFinite(n)) return 'Error'; var s = String(parseFloat(n.toPrecision(12))); return s.length > 14 ? n.toExponential(6) : s; }
function calcEval() {
  var a = CALC.acc, b = parseFloat(CALC.cur), r = 0;
  if (CALC.op === '+') r = a + b; else if (CALC.op === '-') r = a - b; else if (CALC.op === '*') r = a * b; else r = b === 0 ? NaN : a / b;
  CALC.cur = fmtn(r); CALC.acc = isFinite(r) ? r : null;
}
function calcUI() { $('#cval').textContent = CALC.cur; $('#cexp').textContent = (CALC.op && CALC.acc !== null) ? fmtn(CALC.acc) + ' ' + SYM[CALC.op] : ''; }
function calcPress(k) {
  var C = CALC;
  if (C.cur === 'Error' && k !== 'C') return;
  if (/^[0-9]$/.test(k)) { if (C.fresh) { C.cur = k; C.fresh = false; } else if (C.cur.replace(/[-.]/g, '').length < 14) C.cur = C.cur === '0' ? k : C.cur + k; }
  else if (k === '.') { if (C.fresh) { C.cur = '0.'; C.fresh = false; } else if (C.cur.indexOf('.') < 0) C.cur += '.'; }
  else if ('+-*/'.indexOf(k) > -1) { if (C.op && !C.fresh) calcEval(); else C.acc = parseFloat(C.cur); if (C.cur !== 'Error') { C.op = k; C.fresh = true; } }
  else if (k === '=') { if (C.op) { calcEval(); C.op = null; C.fresh = true; } }
  else if (k === 'C') CALC = calcNew();
  else if (k === 'B') { if (!C.fresh && C.cur.length > 1) C.cur = C.cur.slice(0, -1); else { C.cur = '0'; C.fresh = true; } }
  else if (k === '%') { C.cur = fmtn(parseFloat(C.cur) / 100); C.fresh = true; }
  else if (k === 'R') { var n = parseFloat(C.cur); C.cur = n < 0 ? 'Error' : fmtn(Math.sqrt(n)); C.fresh = true; }
  calcUI();
}
function calcInit() {
  var keys = [['C', 'C', 'op'], ['B', '⌫', 'op'], ['%', '%', 'op'], ['/', '÷', 'op'], ['7'], ['8'], ['9'], ['*', '×', 'op'], ['4'], ['5'], ['6'], ['-', '−', 'op'], ['1'], ['2'], ['3'], ['+', '+', 'op'], ['0'], ['.'], ['R', '√', 'op'], ['=', '=', 'eq']];
  $('#ckeys').innerHTML = keys.map(function (k) { return '<button class="' + (k[2] || '') + '" data-act="ck" data-v="' + k[0] + '">' + (k[1] || k[0]) + '</button>'; }).join(''); calcUI();
}

var toolsOpen = function () { return $('#tools').classList.contains('show'); };
function openTools(tab) { if (!SET.tools) return; $('#tools').classList.add('show'); toolTab(tab || 'pad'); }
function closeTools() { $('#tools').classList.remove('show'); }
function toolTab(t) {
  S.ttab = t; $('#padWrap').style.display = t === 'pad' ? 'flex' : 'none'; $('#calcWrap').style.display = t === 'calc' ? 'flex' : 'none';
  $('#tabPad').classList.toggle('on', t === 'pad'); $('#tabCalc').classList.toggle('on', t === 'calc');
  if (t === 'pad') { padResize(); padUI(); }
}

/* ---------- actions mapping ---------- */
$('#imp').addEventListener('change', function (e) {
  var f = e.target.files[0]; if (!f) return; var r = new FileReader();
  r.onload = function () {
    try { var d = JSON.parse(r.result); if (d.att) ATT = d.att; if (d.sav) SAV = d.sav; if (d.days) DAYM = d.days; if (d.set) Object.assign(SET, d.set); if (d.seen) SEEN = d.seen; put('wc_att', ATT); put('wc_sav', SAV); put('wc_days', DAYM); put('wc_seen', SEEN); saveSet(); sheet(); alert('Backup restored.'); }
    catch (x) { alert('Invalid backup file.'); }
  };
  r.readAsText(f); e.target.value = '';
});

function setTopicOnly(v) { TOPICS.forEach(function (t) { S.secs[t] = (t === v); }); S.mode = 'sec'; S.kind = 'quiz'; S.pool = 'all'; }

var A = {
  theme: function () { root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark'; put('wc_t', root.dataset.theme); if (sheetOpen()) sheet(); },
  pick: function (v) { root.dataset.pal = v; put('wc_p', v); if (sheetOpen()) sheet(); },
  mode: function (v) { S.mode = v; home(true); },
  kind: function (v) { S.kind = v; home(true); },
  sec: function (v) { S.secs[v] = !S.secs[v]; home(true); },
  cnt: function (v) { S.cnt = +v; home(true); },
  topall: function () { TOPICS.forEach(function (t) { S.secs[t] = true; }); home(true); },
  topweak: function () {
    var g = agg(), ks = weakFirst(g).slice(0, 3);
    if (!ks.length) return toast('Take a test first to find weak chapters.');
    TOPICS.forEach(function (t) { S.secs[t] = ks.indexOf(t) > -1; }); home(true);
  },
  pool: function (v) { S.pool = v; home(true); },
  topnone: function () { TOPICS.forEach(function (t) { S.secs[t] = false; }); home(true); },
  neg: function () { S.neg = !S.neg; home(true); },
  start: function () { start(); }, home: function () { home(); },
  resume: resume,
  discard: function () { if (confirm('Discard unfinished test?')) { clearRun(); home(true); } },
  revdue: function () { S.sf = 'd'; A.practice(); },
  coach: function (v) { if (S.view === 'test') return; closeSheet(); setTopicOnly(v); start({ cnt: 10 }); },
  opt: function (v) {
    if (S.run === 'quiz') { if (S.ans[S.cur] !== null) return; buzz(); S.ans[S.cur] = +v; test(true); return; }
    buzz(); S.ans[S.cur] = +v; var c = S.cur; test(true);
    if (SET.autoNext && c < S.qs.length - 1) setTimeout(function () { if (S.view === 'test' && S.cur === c && !S.paused) { S.cur++; test(); } }, 280);
  },
  flag: function (v) { if (S.run === 'quiz' && S.ans[S.cur] !== null) return; S.fl[S.cur] = S.fl[S.cur] === v ? null : v; test(true); },
  prev: function () { if (S.cur > 0) { S.cur--; test(); } },
  next: function () {
    if (S.cur < S.qs.length - 1) { S.cur++; test(); return; }
    if (S.run === 'quiz') { var u = S.ans.filter(function (x) { return x === null; }).length; if (u && !confirm(u + ' unanswered. Finish quiz?')) return; submit(); }
    else if (ask('Submit test?')) submit();
  },
  mark: function () { if (S.mk[S.cur]) delete S.mk[S.cur]; else S.mk[S.cur] = 1; test(true); },
  clear: function () { S.ans[S.cur] = null; test(true); },
  save: function () { var q = S.qs[S.cur], e = SAV[q._k]; if (e && e.b) e.b = false; else keep(q, 'b'); persist(); test(true); },
  rsave: function (v, el) { var q = S.qs[+v], e = SAV[q._k]; if (e && e.b) e.b = false; else keep(q, 'b'); persist(); el.textContent = SAV[q._k] && SAV[q._k].b ? '🔖 Saved' : '🔖 Save'; },
  jump: function (v) { S.cur = +v; closeGrid(); test(); },
  secjump: function (v) { for (var i = 0; i < S.qs.length; i++) if (S.qs[i].s === v) { S.cur = i; break; } test(); },
  grid: function () { S.grid ? closeGrid() : openGrid(); }, closegrid: closeGrid,
  submit: function () { if (ask('Submit test?')) submit(); },
  exit: function () { if (confirm('Exit test? Progress will be lost.')) { clearRun(); exitFS(); S.paused = false; $('#warn').classList.remove('show'); home(); } },
  pause: pause, unpause: unpause,
  pauseexit: function () { $('#pause').classList.remove('show'); exitFS(); S.paused = false; home(); },
  fsback: function () { $('#warn').classList.remove('show'); reqFS(S.run, S.mode); },
  fsskip: function () { $('#warn').classList.remove('show'); S.fs = false; },
  tools: function (v) { if (S.view === 'test' && !S.paused) openTools(v); }, toolsclose: closeTools, ttab: function (v) { toolTab(v); },
  padcol: function (v) { PAD.col = v; PAD.erase = false; padUI(); },
  paderase: function () { PAD.erase = !PAD.erase; padUI(); },
  padundo: function () { PAD.strokes.pop(); padDraw(); },
  padclear: function () { PAD.strokes = []; padDraw(); },
  ck: function (v) { calcPress(v); },
  sheet: function (v) { openSheet(v); }, closesheet: closeSheet,
  tab: function (v) { S.tab = v; sheet(); $('#sbody').scrollTop = 0; },
  sfil: function (v) { S.sf = v; sheet(); },
  delsav: function (v) { delete SAV[v]; persist(); sheet(); },
  practice: function () {
    if (S.view === 'test') return alert('Finish current test first.');
    var l = savedList(); if (!l.length) { openSheet('sav'); return; }
    closeSheet(); S.mode = 'saved';
    begin(l.map(function (e) { return { s: e.s, c: e.c, q: e.q, o: e.o.slice(), a: e.a, e: e.e, _k: e.k, _src: e.src }; }), 0, 'quiz');
  },
  ptopic: function (v) { if (S.view === 'test') return alert('Finish current test first.'); closeSheet(); setTopicOnly(v); home(); },
  exportq: exportQ,
  tg: function (v) { SET[v] = !SET[v]; if (v === 'defNeg') S.neg = SET.defNeg; saveSet(); if (sheetOpen()) sheet(); if (S.view === 'home') home(true); },
  font: function (v) { SET.font = +v; saveSet(); sheet(); },
  'export': function () { download('wisechoice-backup.json', JSON.stringify({ att: ATT, sav: SAV, set: SET, days: DAYM, seen: SEEN })); },
  'import': function () { $('#imp').click(); },
  wipe: function () { if (confirm('Delete all analytics and saved questions?')) { ATT = []; SAV = {}; DAYM = {}; SEEN = {}; put('wc_seen', SEEN); put('wc_att', ATT); put('wc_sav', SAV); put('wc_days', DAYM); sheet(); } }
};

document.addEventListener('click', function (e) {
  var t = e.target.closest('[data-act]'); if (!t || t.disabled) return;
  var f = A[t.dataset.act]; if (f) { if (t.dataset.act !== 'opt') buzz(); f(t.dataset.v, t); }
});

padInit(); calcInit();
home(); preloadChapters();
})();
