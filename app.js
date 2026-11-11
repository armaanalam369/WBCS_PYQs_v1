/* =====================================================================
   WBCS Prelims Mock Test Series — app.js
   Needs: data/manifest.js (window.RULES, window.PAPER_LIST)
          data/<year>.js   (window.PAPERS[year])  — loaded on demand
   ===================================================================== */
(function () {
'use strict';
var $ = function (s) { return document.querySelector(s); };
window.PAPERS = window.PAPERS || {};

/* ---------- config (falls back to a tiny demo if manifest.js is missing) ---------- */
var R = window.RULES, PL = window.PAPER_LIST, demo = !(R && PL && PL.length);
if (demo) {
  R = { examName: 'WBCS Prelims', fullMinutes: 120, negative: 0.25,
        topics: [{ n: 'English', i: '🔤' }, { n: 'Indian Polity', i: '🏛️' }, { n: 'General Mental Ability', i: '🧠' }] };
  PL = [{ year: 'Demo', file: '' }];
  window.PAPERS.Demo = { year: 'Demo', questions: [
    { s: 'English', c: 'Synonyms', q: 'Synonym of "RAPID"?', o: ['Slow', 'Quick', 'Late', 'Weak'], a: 1, e: 'Rapid means quick.' },
    { s: 'Indian Polity', c: 'Constitution', q: 'Who chaired the Drafting Committee of the Constituent Assembly?', o: ['Nehru', 'Gandhi', 'B. R. Ambedkar', 'Patel'], a: 2, e: 'Dr B. R. Ambedkar chaired the Drafting Committee.' },
    { s: 'General Mental Ability', c: 'Number Series', q: 'Next term: 2, 6, 12, 20, ?', o: ['28', '30', '32', '36'], a: 1, e: 'Differences are 4, 6, 8, 10 → 30.' }] };
}
var TOPICS = R.topics.map(function (t) { return t.n; }), ICON = {};
R.topics.forEach(function (t) { ICON[t.n] = t.i; });
var ti = function (s) { var i = TOPICS.indexOf(s); return i < 0 ? 999 : i; };
var app = $('#app'), root = document.documentElement;

/* ---------- storage ---------- */
function put(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
function get(k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }
var SET = Object.assign({ font: 1, motion: true, showTimer: true, autoNext: false, shuffleQ: false, shuffleO: false,
  confirmSubmit: true, autoWrong: true, haptic: true, wake: false, defMins: 30, defNeg: true }, get('wb_set', {}));
var ATT = get('wb_att', []), SAV = get('wb_sav', {});
root.dataset.theme = get('wb_t', 'dark'); root.dataset.pal = get('wb_p', 'violet');
var S = { kind: 'test', run: 'test', el: 0, view: 'home', year: null, mode: 'full', secs: {}, neg: SET.defNeg, mins: SET.defMins,
  qs: [], ans: [], qt: [], mk: {}, cur: 0, left: 0, total: 0, t: null, grid: false, tab: 'last', sf: 'all', wl: null, src: '' };
TOPICS.forEach(function (t) { S.secs[t] = false; });
function prefs() { root.style.setProperty('--fs', ['14.5px', '16px', '18px'][SET.font]); root.dataset.motion = SET.motion ? 'on' : 'off'; }
function saveSet() { put('wb_set', SET); prefs(); }
prefs();

/* ---------- helpers ---------- */
var pad = function (n) { return String(n).padStart(2, '0'); };
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
function fabs(t) { $('#bGrid').style.display = t ? 'block' : 'none'; $('#bExit').style.display = t ? 'block' : 'none'; }
function buzz() { if (SET.haptic && navigator.vibrate) try { navigator.vibrate(10); } catch (e) {} }
function ask(m) { return SET.confirmSubmit ? confirm(m) : true; }
function getWake() { if (SET.wake && navigator.wakeLock) navigator.wakeLock.request('screen').then(function (l) { S.wl = l; }).catch(function () {}); }
function relWake() { try { if (S.wl) S.wl.release(); } catch (e) {} S.wl = null; }
function shuf(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function label(q) { return (ICON[q.s] || '') + ' ' + esc(q.s) + (q.c ? ' · ' + esc(q.c) : ''); }
/* saved questions */
function keep(q, f) {
  var e = SAV[q._k] || (SAV[q._k] = { k: q._k, s: q.s, c: q.c || '', q: q.q, o: q.o, a: q.a, e: q.e || '', src: q._src || '' });
  e[f] = true;
}
function persist() { Object.keys(SAV).forEach(function (k) { if (!SAV[k].b && !SAV[k].w) delete SAV[k]; }); put('wb_sav', SAV); }

/* ---------- home ---------- */
function home(keepScroll) {
  if (S.mode === 'saved') S.mode = 'full';
  if (S.mode === 'full' && S.year === 'all') S.year = null;
  S.view = 'home'; clearInterval(S.t); relWake(); fabs(false); closeGrid();
  var q = S.kind === 'quiz', ys = PL.slice().sort(function (a, b) { return (b.year - a.year) || 0; });
  var years = '<div class="chips">' + ys.map(function (p) {
    return '<button class="chip ' + (String(S.year) === String(p.year) ? 'on' : '') + '" data-act="year" data-v="' + esc(p.year) + '">' + esc(p.year) + '</button>';
  }).join('') + (S.mode === 'sec' && ys.length > 1 ? '<button class="chip ' + (S.year === 'all' ? 'on' : '') + '" data-act="year" data-v="all">📚 All years</button>' : '') + '</div>';
  var card = '';
  if (!q && S.mode === 'full') {
    card = '<b>Standard exam pattern</b><p class="mu" style="margin-top:4px">Fixed ' + R.fullMinutes + ' minutes · all topics · negative marking of ' + R.negative.toFixed(2) + ' per wrong answer.</p>';
  } else {
    if (q) card += '<b>Instant-feedback quiz</b><p class="mu" style="margin:4px 0 8px">See the right answer and explanation right after each question. No timer.</p>';
    if (S.mode === 'sec') {
      var n = TOPICS.filter(function (t) { return S.secs[t]; }).length;
      card += '<div class="line" style="padding-top:0"><b>Choose topics</b><span class="row"><button class="btn g s" data-act="topall">All</button><button class="btn g s" data-act="topnone">None</button></span></div>' +
        '<p class="mu">' + n + ' of ' + TOPICS.length + ' selected</p><div class="tgrid">' +
        TOPICS.map(function (t) { return '<button class="chip ' + (S.secs[t] ? 'on' : '') + '" data-act="sec" data-v="' + esc(t) + '">' + ICON[t] + ' ' + esc(t) + '</button>'; }).join('') + '</div>';
    }
    card += '<div class="line"><span>Negative marking</span>' + sw(S.neg, 'neg') + '</div>';
    if (!q) card += '<div class="line"><span>Time (minutes)</span><input type="number" id="mins" min="1" max="180" value="' + S.mins + '"></div>';
  }
  render('<h1>Practice smarter 🚀</h1><p class="mu">West Bengal Civil Service (WBCS) Prelims · Previous Year Questions</p>' +
    '<h2>1 · Year</h2>' + years +
    '<h2>2 · Mode</h2><div class="chips"><button class="chip ' + (!q ? 'on' : '') + '" data-act="kind" data-v="test">📝 Exam Test</button><button class="chip ' + (q ? 'on' : '') + '" data-act="kind" data-v="quiz">💡 Quiz (instant answers)</button></div>' +
    '<h2>3 · Scope</h2><div class="chips"><button class="chip ' + (S.mode === 'full' ? 'on' : '') + '" data-act="mode" data-v="full">Full paper</button><button class="chip ' + (S.mode === 'sec' ? 'on' : '') + '" data-act="mode" data-v="sec">Topic-wise (Custom)</button></div>' +
    '<div class="card" style="margin-top:12px">' + card + '</div>' +
    '<button class="btn" data-act="start" style="width:100%;padding:16px">' + (q ? 'Start Quiz →' : 'Start Test →') + '</button>' +
    (demo ? '<p class="note">Demo mode: <b>data/manifest.js</b> was not found, so a built-in sample is shown. Keep index.html next to the data folder to use your own papers.</p>' : ''),
    keepScroll);
}
document.addEventListener('input', function (e) {
  if (e.target.id === 'mins') S.mins = +e.target.value || 1;
  if (e.target.id === 'dm') { SET.defMins = Math.max(1, Math.min(180, +e.target.value || 30)); S.mins = SET.defMins; saveSet(); }
});

/* ---------- start a test ---------- */
function load(p) {
  return new Promise(function (res, rej) {
    var k = String(p.year);
    if (window.PAPERS[k]) return res(window.PAPERS[k]);
    var s = document.createElement('script'); s.src = p.file;
    s.onload = function () { window.PAPERS[k] ? res(window.PAPERS[k]) : rej(); };
    s.onerror = rej; document.body.appendChild(s);
  });
}
async function start() {
  var secs = TOPICS.filter(function (t) { return S.secs[t]; });
  if (S.mode === 'sec' && !secs.length) return alert('Select at least one topic.');
  var list = S.year === 'all' ? PL : PL.filter(function (p) { return String(p.year) === String(S.year); });
  if (!list.length) return alert('Please choose a year.');
  var papers;
  try { papers = await Promise.all(list.map(load)); } catch (e) { return alert('Could not load a paper file. Check the paths in data/manifest.js.'); }
  var qs = [];
  papers.forEach(function (p, pi) {
    p.questions.forEach(function (q, i) {
      if (S.mode === 'full' || secs.indexOf(q.s) > -1) qs.push(Object.assign({}, q, { _k: list[pi].year + '#' + i, _src: R.examName + ' ' + list[pi].year }));
    });
  });
  if (!qs.length) return alert('No questions found for this selection.');
  if (list.length > 1) qs.sort(function (a, b) { return ti(a.s) - ti(b.s); });
  S.src = list.length > 1 ? R.examName + ' · All years' : R.examName + ' ' + list[0].year;
  begin(qs, S.kind === 'quiz' ? 0 : (S.mode === 'full' ? R.fullMinutes : Math.max(1, S.mins)) * 60);
}
function begin(qs, total, kind) {
  S.run = kind || S.kind;
  if (SET.shuffleQ) { var g = {}, o = []; qs.forEach(function (q) { if (!g[q.s]) { g[q.s] = []; o.push(q.s); } g[q.s].push(q); }); qs = []; o.forEach(function (s) { qs = qs.concat(shuf(g[s])); }); }
  if (SET.shuffleO) qs = qs.map(function (q) { var ord = shuf(q.o.map(function (_, i) { return i; })); return Object.assign({}, q, { o: ord.map(function (i) { return q.o[i]; }), a: ord.indexOf(q.a) }); });
  S.qs = qs; S.ans = qs.map(function () { return null; }); S.qt = qs.map(function () { return 0; }); S.mk = {};
  S.cur = 0; S.total = total; S.left = total; S.el = 0;
  clearInterval(S.t); S.t = setInterval(tick, 1000); getWake(); fabs(true); test();
}
function tick() {
  S.el++; if (S.view === 'test') S.qt[S.cur]++;
  if (S.run === 'quiz') return;
  S.left--;
  var el = $('#tm'); if (el) { el.textContent = SET.showTimer ? fmt(S.left) : '⏱ ••'; el.classList.toggle('low', S.left < 300); }
  if (S.left <= 0) { alert('Time is up!'); submit(); }
}

/* ---------- question screens ---------- */
function tchips(q) {
  var secs = []; S.qs.forEach(function (x) { if (secs.indexOf(x.s) < 0) secs.push(x.s); });
  return '<div class="chips sm tscroll">' + secs.map(function (s) {
    return '<button class="chip ' + (s === q.s ? 'on' : '') + '" data-act="secjump" data-v="' + esc(s) + '">' + (ICON[s] || '') + ' ' + esc(s) + '</button>';
  }).join('') + '</div>';
}
function centerChip() { var c = $('.tscroll .on'); if (c) { var p = c.parentNode; p.scrollLeft = c.offsetLeft - p.clientWidth / 2 + c.clientWidth / 2; } }
function quizView() {
  var q = S.qs[S.cur], a = S.ans[S.cur], done = a !== null, c = 0, w = 0, sv = SAV[q._k] && SAV[q._k].b;
  S.ans.forEach(function (x, i) { if (x !== null) { x === S.qs[i].a ? c++ : w++; } });
  render('<div class="top"><span class="mu">Q ' + (S.cur + 1) + ' / ' + S.qs.length + '</span><span class="timer">✅ ' + c + ' · ❌ ' + w + '</span></div>' +
    '<div class="bar"><i style="width:' + ((S.cur + 1) / S.qs.length * 100) + '%"></i></div>' + tchips(q) +
    '<div class="card"><span class="tag">' + label(q) + '</span><div style="height:8px"></div><b class="qt">' + q.q + '</b>' +
    q.o.map(function (o, i) { return '<button class="opt ' + (done ? (i === q.a ? 'ok' : i === a ? 'bad' : '') : '') + '" data-act="opt" data-v="' + i + '">' + 'ABCD'.charAt(i) + '. ' + o + '</button>'; }).join('') +
    (done ? '<div class="expl"><b>' + (a === q.a ? '✅ Correct!' : '❌ Incorrect') + '</b> · Answer: ' + 'ABCD'.charAt(q.a) + '<br>💡 ' + (q.e || 'No explanation added for this question yet.') + '</div>' : '') + '</div>' +
    '<div class="row"><button class="btn g" data-act="prev">←</button><button class="btn g" data-act="save">' + (sv ? '🔖 Saved' : '🔖 Save') + '</button><button class="btn" data-act="next" style="margin-left:auto">' + (S.cur === S.qs.length - 1 ? 'Finish ✓' : 'Next →') + '</button></div>');
  centerChip(); if (S.grid) fillGrid();
}
function qcls(i) {
  if (S.run === 'quiz') return S.ans[i] === null ? '' : (S.ans[i] === S.qs[i].a ? 'ok' : 'bad');
  return (S.ans[i] !== null ? 'ans' : '') + ' ' + (S.mk[i] ? 'mk' : '');
}
function test() {
  S.view = 'test'; if (S.run === 'quiz') return quizView();
  var q = S.qs[S.cur], done = S.ans.filter(function (a) { return a !== null; }).length, sv = SAV[q._k] && SAV[q._k].b;
  render('<div class="top"><span class="mu">Q ' + (S.cur + 1) + ' / ' + S.qs.length + ' · ' + done + ' answered</span><span class="timer ' + (S.left < 300 ? 'low' : '') + '" id="tm">' + (SET.showTimer ? fmt(S.left) : '⏱ ••') + '</span></div>' +
    '<div class="bar"><i style="width:' + ((S.cur + 1) / S.qs.length * 100) + '%"></i></div>' + tchips(q) +
    '<div class="card"><span class="tag">' + label(q) + '</span><div style="height:8px"></div><b class="qt">' + q.q + '</b>' +
    q.o.map(function (o, i) { return '<button class="opt ' + (S.ans[S.cur] === i ? 'sel' : '') + '" data-act="opt" data-v="' + i + '">' + 'ABCD'.charAt(i) + '. ' + o + '</button>'; }).join('') + '</div>' +
    '<div class="row"><button class="btn g" data-act="prev">←</button><button class="btn g" data-act="mark">' + (S.mk[S.cur] ? '★ Marked' : '☆ Mark') + '</button><button class="btn g" data-act="save">' + (sv ? '🔖 Saved' : '🔖 Save') + '</button><button class="btn g" data-act="clear">Clear</button><button class="btn" data-act="next" style="margin-left:auto">' + (S.cur === S.qs.length - 1 ? 'Submit ✓' : 'Next →') + '</button></div>');
  centerChip(); if (S.grid) fillGrid();
}
function fillGrid() {
  var a = S.ans.filter(function (x) { return x !== null; }).length, m = Object.keys(S.mk).length;
  $('#drawer').innerHTML = '<b>Questions</b><p class="mu" style="margin-top:4px">🟩 ' + a + ' answered · 🟧 ' + m + ' marked · ' + (S.qs.length - a) + ' left</p><div class="grid">' +
    S.qs.map(function (_, i) { return '<button class="qn ' + qcls(i) + ' ' + (i === S.cur ? 'cur' : '') + '" data-act="jump" data-v="' + i + '">' + (i + 1) + '</button>'; }).join('') +
    '</div><button class="btn" data-act="submit" style="width:100%">' + (S.run === 'quiz' ? 'Finish Quiz' : 'Submit Test') + '</button>';
}
function openGrid() { S.grid = true; fillGrid(); $('#drawer').classList.add('show'); $('#shade').classList.add('show'); }
function closeGrid() { S.grid = false; $('#drawer').classList.remove('show'); $('#shade').classList.remove('show'); }

/* ---------- submit + result ---------- */
function submit() {
  clearInterval(S.t); relWake(); fabs(false); closeGrid(); S.view = 'result';
  var neg = (S.run === 'test' && S.mode === 'full') ? R.negative : (S.neg ? R.negative : 0), st = {}, det = [], sc = 0;
  S.qs.forEach(function (q, i) {
    var r = S.ans[i] === null ? 'n' : S.ans[i] === q.a ? 'c' : 'w';
    var x = st[q.s] = st[q.s] || { c: 0, w: 0, n: 0, t: 0 };
    x.t++; x[r]++; if (r === 'c') sc++; if (r === 'w') sc -= neg;
    det.push({ s: q.s, r: r, t: S.qt[i] || 0 });
    if (r === 'w' && (SET.autoWrong || S.mode === 'saved')) keep(q, 'w');
    if (r === 'c' && S.mode === 'saved' && SAV[q._k]) SAV[q._k].w = false;
  });
  persist();
  ATT.push({ ts: Date.now(), src: S.mode === 'saved' ? 'Saved-question practice' : S.src + (S.run === 'quiz' ? ' · Quiz' : ''), mode: S.mode, sc: sc, max: S.qs.length, neg: neg, used: S.el, total: S.total, secs: st, det: det });
  if (ATT.length > 40) ATT.shift(); put('wb_att', ATT);
  render('<div class="card" style="text-align:center"><p class="mu">Your Score</p><div class="big">' + sc.toFixed(2) + ' / ' + S.qs.length + '</div><p class="mu">Time taken: ' + fmt(ATT[ATT.length - 1].used) + '</p></div>' +
    Object.keys(st).sort(function (a, b) { return ti(a) - ti(b); }).map(function (k) { var v = st[k]; return '<div class="card"><b>' + (ICON[k] || '') + ' ' + esc(k) + '</b> <span class="mu">✅ ' + v.c + ' · ❌ ' + v.w + ' · ⏭ ' + v.n + '</span><div class="bar" style="margin-bottom:0"><i style="width:' + pct(v.c, v.t) + '%"></i></div></div>'; }).join('') +
    '<div class="row" style="margin:6px 0"><button class="btn" data-act="sheet" data-v="last">📊 Full analysis</button><button class="btn g" data-act="home">← Home</button></div>' +
    (S.mode !== 'saved' && SET.autoWrong ? '<p class="mu">Wrong answers were added to your 🔖 Saved notebook.</p>' : '') +
    '<h2>Review</h2>' + S.qs.map(function (q, i) {
      return '<div class="card"><div class="line" style="padding-top:0"><span class="mu">' + label(q) + ' · Q' + (i + 1) + '</span><button class="btn g s" data-act="rsave" data-v="' + i + '">' + (SAV[q._k] && SAV[q._k].b ? '🔖 Saved' : '🔖 Save') + '</button></div><b class="qt">' + q.q + '</b>' +
        q.o.map(function (o, j) { return '<div class="opt ' + (j === q.a ? 'ok' : S.ans[i] === j ? 'bad' : '') + '">' + o + '</div>'; }).join('') + (q.e ? '<div class="expl">💡 ' + q.e + '</div>' : '') + '</div>';
    }).join(''));
}

/* ---------- analytics sheet ---------- */
function stat(l, v) { return '<div class="stat"><span class="mu">' + l + '</span><b>' + v + '</b></div>'; }
function empty(i, t, d) { return '<div class="empty"><b>' + i + '</b><div style="color:var(--tx);font-weight:700">' + t + '</div><div>' + d + '</div></div>'; }
function trow(k, v, btn) {
  var p = pct(v.c, v.t);
  return '<div class="card"><div class="line" style="padding:0"><b>' + (ICON[k] || '') + ' ' + esc(k) + '</b><b style="color:' + tone(p) + '">' + p + '% · ' + lab(p) + '</b></div>' +
    '<div class="line" style="padding:4px 0 0"><span class="mu">' + v.c + '/' + v.t + ' correct · ' + v.w + ' wrong · ' + v.n + ' skipped</span>' +
    (btn ? '<button class="btn g s" data-act="ptopic" data-v="' + esc(k) + '">Practise</button>' : '') + '</div>' + bar(p) + '</div>';
}
function agg() {
  var s = {};
  ATT.forEach(function (a) { Object.keys(a.secs).forEach(function (k) { var v = a.secs[k], x = s[k] || (s[k] = { c: 0, w: 0, n: 0, t: 0 }); x.c += v.c; x.w += v.w; x.n += v.n; x.t += v.t; }); });
  return s;
}
function weakFirst(g) { return Object.keys(g).sort(function (a, b) { return pct(g[a].c, g[a].t) - pct(g[b].c, g[b].t) || ti(a) - ti(b); }); }
function tLast() {
  var a = ATT[ATT.length - 1]; if (!a) return empty('📊', 'No test yet', 'Finish a test and its full analysis shows up here.');
  var c = 0, w = 0;
  Object.keys(a.secs).forEach(function (k) { c += a.secs[k].c; w += a.secs[k].w; });
  var slow = a.det.map(function (d, i) { return { i: i, t: d.t, s: d.s }; }).sort(function (x, y) { return y.t - x.t; }).slice(0, 3);
  return '<p class="mu" style="margin-bottom:10px">' + esc(a.src) + ' · ' + new Date(a.ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + '</p>' +
    '<div class="stats">' + stat('Score', a.sc.toFixed(2) + ' / ' + a.max) + stat('Accuracy', pct(c, c + w) + '%') + stat('Attempted', (c + w) + ' / ' + a.max) +
    stat('Negative marks', '−' + (w * (a.neg || 0)).toFixed(2)) + stat('Avg time / Q', Math.round(a.used / a.max) + 's') + stat('Time taken', fmt(a.used)) + '</div>' +
    '<div class="sec">Question map</div><div class="strip">' + a.det.map(function (d, i) { return '<span style="background:' + (d.r === 'c' ? '#10b981' : d.r === 'w' ? '#ef4444' : '#6b7280') + '">' + (i + 1) + '</span>'; }).join('') + '</div>' +
    '<div class="sec">Topic-wise (this test)</div>' + Object.keys(a.secs).sort(function (x, y) { return ti(x) - ti(y); }).map(function (k) { return trow(k, a.secs[k]); }).join('') +
    '<div class="sec">Slowest questions</div>' + slow.map(function (x) { return '<div class="line"><span>Q' + (x.i + 1) + ' <span class="tag">' + esc(x.s) + '</span></span><b>' + x.t + 's</b></div>'; }).join('');
}
function streak() {
  var d = {}; ATT.forEach(function (a) { d[new Date(a.ts).toDateString()] = 1; });
  var n = 0, x = new Date(); if (!d[x.toDateString()]) x.setDate(x.getDate() - 1);
  while (d[x.toDateString()]) { n++; x.setDate(x.getDate() - 1); } return n;
}
function spark() {
  var p = ATT.slice(-12).map(function (a) { return Math.max(0, Math.min(100, a.sc / a.max * 100)); });
  if (p.length < 2) return '<p class="mu">Take 2+ tests to see your trend.</p>';
  return '<svg viewBox="0 0 200 50" preserveAspectRatio="none" style="width:100%;height:70px"><polyline points="' + p.map(function (v, i) { return (i * 200 / (p.length - 1)).toFixed(1) + ',' + (48 - v * .46).toFixed(1); }).join(' ') + '" fill="none" style="stroke:var(--a)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>';
}
function tAll() {
  if (!ATT.length) return empty('📈', 'No data yet', 'Your overall performance appears after your first test.');
  var g = agg(), c = 0, w = 0, t = 0, q = 0, best = 0, sum = 0;
  Object.keys(g).forEach(function (k) { c += g[k].c; w += g[k].w; });
  ATT.forEach(function (a) { var p = a.sc / a.max * 100; sum += p; if (p > best) best = p; t += a.used; q += a.max; });
  var weak = weakFirst(g).slice(0, 3);
  return '<div class="stats">' + stat('Tests taken', ATT.length) + stat('Avg score', Math.round(sum / ATT.length) + '%') + stat('Best score', Math.round(best) + '%') + stat('Accuracy', pct(c, c + w) + '%') + stat('Questions solved', q) + stat('Study streak', '🔥 ' + streak() + ' day' + (streak() === 1 ? '' : 's')) + '</div>' +
    '<div class="card"><span class="mu">Score trend (last 12 tests)</span>' + spark() + '</div>' +
    '<div class="sec">Focus on these topics</div>' + weak.map(function (k) { return trow(k, g[k], true); }).join('') +
    '<div class="sec">Recent tests</div>' + ATT.slice(-5).reverse().map(function (a) { return '<div class="line"><span>' + esc(a.src) + '<small>' + new Date(a.ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + '</small></span><b>' + a.sc.toFixed(1) + '/' + a.max + '</b></div>'; }).join('') +
    '<div class="mu" style="margin-top:6px">Total practice time: ' + Math.round(t / 60) + ' min</div>';
}
function tTopics() {
  if (!ATT.length) return empty('📚', 'No topic data', 'Take a test and all 18 topics will be ranked here, weakest first.');
  var g = agg(), done = weakFirst(g), un = TOPICS.filter(function (k) { return !g[k]; });
  return '<p class="mu" style="margin-bottom:10px">Weakest topics first — tap Practise to drill one.</p>' + done.map(function (k) { return trow(k, g[k], true); }).join('') +
    (un.length ? '<div class="sec">Not attempted yet (' + un.length + ')</div><div class="tgrid">' + un.map(function (k) { return '<button class="chip" data-act="ptopic" data-v="' + esc(k) + '">' + ICON[k] + ' ' + esc(k) + '</button>'; }).join('') + '</div>' : '');
}
function savedList() { return Object.keys(SAV).map(function (k) { return SAV[k]; }).filter(function (e) { return S.sf === 'all' || (S.sf === 'b' && e.b) || (S.sf === 'w' && e.w); }); }
function tSav() {
  var all = Object.keys(SAV).length, l = savedList();
  var h = '<div class="chips sm">' + [['all', 'All (' + all + ')'], ['b', '🔖 Bookmarked'], ['w', '❌ Wrong notebook']].map(function (x) { return '<button class="chip ' + (S.sf === x[0] ? 'on' : '') + '" data-act="sfil" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>';
  if (!l.length) return h + empty('🔖', 'Nothing saved here', 'Tap 🔖 Save during a test. Wrong answers are saved automatically.');
  return h + '<button class="btn" data-act="practice" style="width:100%;margin-bottom:12px">▶ Practise these (' + l.length + ')</button>' + l.map(function (e) {
    return '<div class="card"><div class="line" style="padding:0 0 6px"><span><span class="tag">' + esc(e.s) + (e.c ? ' · ' + esc(e.c) : '') + '</span> ' + (e.w ? '<span class="tag" style="color:#ef4444">wrong</span>' : '') + '</span><button class="btn g s" data-act="delsav" data-v="' + esc(e.k) + '">🗑</button></div><b class="qt">' + e.q + '</b><div class="opt ok" style="margin-top:10px">✅ ' + 'ABCD'.charAt(e.a) + '. ' + e.o[e.a] + '</div>' + (e.e ? '<div class="expl">💡 ' + e.e + '</div>' : '') + '<span class="mu">' + esc(e.src) + '</span></div>';
  }).join('');
}
function setRow(l, d, c) { return '<div class="line"><span>' + l + (d ? '<small>' + d + '</small>' : '') + '</span>' + c + '</div>'; }
function tSet() {
  var kb = Math.round((JSON.stringify(ATT).length + JSON.stringify(SAV).length) / 1024 * 10) / 10;
  var cols = { violet: '#8b5cf6', ocean: '#06b6d4', sunset: '#f97316', forest: '#10b981', rose: '#f43f5e' };
  return '<div class="sec">Appearance</div><div class="card">' +
    setRow('Dark mode', '', sw(root.dataset.theme === 'dark', 'theme')) +
    '<div class="line"><span>Colour palette</span><span class="row">' + Object.keys(cols).map(function (k) { return '<button class="dot ' + (root.dataset.pal === k ? 'on' : '') + '" data-act="pick" data-v="' + k + '" style="background:' + cols[k] + '" aria-label="' + k + '"></button>'; }).join('') + '</span></div>' +
    '<div class="line"><span>Text size</span><span class="row">' + ['A−', 'A', 'A+'].map(function (l, i) { return '<button class="chip ' + (SET.font === i ? 'on' : '') + '" style="padding:6px 14px" data-act="font" data-v="' + i + '">' + l + '</button>'; }).join('') + '</span></div>' +
    setRow('Motion graphics', 'Turn off to save battery', sw(SET.motion, 'tg', 'motion')) + '</div>' +
    '<div class="sec">Test experience</div><div class="card">' +
    setRow('Show timer', 'Hide it to reduce pressure', sw(SET.showTimer, 'tg', 'showTimer')) +
    setRow('Auto-next on answer', 'Jump ahead after choosing', sw(SET.autoNext, 'tg', 'autoNext')) +
    setRow('Shuffle questions', 'Within each topic', sw(SET.shuffleQ, 'tg', 'shuffleQ')) +
    setRow('Shuffle options', 'Stops memorising positions', sw(SET.shuffleO, 'tg', 'shuffleO')) +
    setRow('Confirm before submit', '', sw(SET.confirmSubmit, 'tg', 'confirmSubmit')) +
    setRow('Auto-save wrong answers', 'Builds your revision notebook', sw(SET.autoWrong, 'tg', 'autoWrong')) +
    setRow('Haptic feedback', 'Light vibration on taps', sw(SET.haptic, 'tg', 'haptic')) +
    setRow('Keep screen awake', 'During tests', sw(SET.wake, 'tg', 'wake')) +
    setRow('Default topic-test time', 'Minutes', '<input type="number" id="dm" min="1" max="180" value="' + SET.defMins + '">') +
    setRow('Negative marking by default', 'For topic-wise tests', sw(SET.defNeg, 'tg', 'defNeg')) + '</div>' +
    '<div class="sec">Data</div><div class="card"><p class="mu" style="margin-bottom:10px">Stored on this device: ' + ATT.length + ' tests · ' + Object.keys(SAV).length + ' saved questions · ' + kb + ' KB</p>' +
    '<div class="row"><button class="btn g s" data-act="export">⬇ Backup</button><button class="btn g s" data-act="import">⬆ Restore</button><button class="btn g s" data-act="wipe" style="color:#ef4444">🗑 Clear data</button></div></div>' +
    '<p class="mu" style="text-align:center;margin-top:14px">WBCS Prelims Mock Test Series</p>';
}
function sheet() {
  var tabs = [['last', '📊 Last test'], ['all', '📈 Overall'], ['chap', '📚 Topics'], ['sav', '🔖 Saved'], ['set', '⚙️ Settings']];
  $('#stabs').innerHTML = tabs.map(function (t) { return '<button class="chip ' + (S.tab === t[0] ? 'on' : '') + '" data-act="tab" data-v="' + t[0] + '">' + t[1] + '</button>'; }).join('');
  var b = $('#sbody'), y = b.scrollTop; b.innerHTML = ({ last: tLast, all: tAll, chap: tTopics, sav: tSav, set: tSet })[S.tab](); b.scrollTop = y;
}
function openSheet(tab) { if (tab) S.tab = tab; sheet(); $('#sheet').classList.add('show'); $('#shade2').classList.add('show'); }
function closeSheet() { $('#sheet').classList.remove('show'); $('#shade2').classList.remove('show'); }
var sheetOpen = function () { return $('#sheet').classList.contains('show'); };

/* ---------- actions ---------- */
function download(name, txt) { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'application/json' })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
$('#imp').addEventListener('change', function (e) {
  var f = e.target.files[0]; if (!f) return; var r = new FileReader();
  r.onload = function () {
    try { var d = JSON.parse(r.result); if (d.att) ATT = d.att; if (d.sav) SAV = d.sav; if (d.set) Object.assign(SET, d.set); put('wb_att', ATT); put('wb_sav', SAV); saveSet(); sheet(); alert('Backup restored.'); }
    catch (x) { alert('That file is not a valid backup.'); }
  };
  r.readAsText(f); e.target.value = '';
});
var A = {
  theme: function () { root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark'; put('wb_t', root.dataset.theme); if (sheetOpen()) sheet(); },
  pick: function (v) { root.dataset.pal = v; put('wb_p', v); if (sheetOpen()) sheet(); },
  year: function (v) { S.year = v; home(true); },
  mode: function (v) { S.mode = v; home(true); },
  kind: function (v) { S.kind = v; home(true); },
  sec: function (v) { S.secs[v] = !S.secs[v]; home(true); },
  topall: function () { TOPICS.forEach(function (t) { S.secs[t] = true; }); home(true); },
  topnone: function () { TOPICS.forEach(function (t) { S.secs[t] = false; }); home(true); },
  neg: function () { S.neg = !S.neg; home(true); },
  start: start, home: function () { home(); },
  opt: function (v) {
    if (S.run === 'quiz') { if (S.ans[S.cur] !== null) return; buzz(); S.ans[S.cur] = +v; test(); return; }
    buzz(); S.ans[S.cur] = +v; var c = S.cur; test();
    if (SET.autoNext && c < S.qs.length - 1) setTimeout(function () { if (S.view === 'test' && S.cur === c) { S.cur++; test(); } }, 280);
  },
  prev: function () { if (S.cur > 0) { S.cur--; test(); } },
  next: function () {
    if (S.cur < S.qs.length - 1) { S.cur++; test(); return; }
    if (S.run === 'quiz') { var u = S.ans.filter(function (x) { return x === null; }).length; if (u && !confirm(u + ' question(s) unanswered. Finish the quiz?')) return; submit(); }
    else if (ask('Submit the test?')) submit();
  },
  mark: function () { if (S.mk[S.cur]) delete S.mk[S.cur]; else S.mk[S.cur] = 1; test(); },
  clear: function () { S.ans[S.cur] = null; test(); },
  save: function () { var q = S.qs[S.cur], e = SAV[q._k]; if (e && e.b) e.b = false; else keep(q, 'b'); persist(); test(); },
  rsave: function (v, el) { var q = S.qs[+v], e = SAV[q._k]; if (e && e.b) e.b = false; else keep(q, 'b'); persist(); el.textContent = SAV[q._k] && SAV[q._k].b ? '🔖 Saved' : '🔖 Save'; },
  jump: function (v) { S.cur = +v; closeGrid(); test(); },
  secjump: function (v) { for (var i = 0; i < S.qs.length; i++) if (S.qs[i].s === v) { S.cur = i; break; } test(); },
  grid: function () { S.grid ? closeGrid() : openGrid(); }, closegrid: closeGrid,
  submit: function () { if (ask('Submit the test?')) submit(); },
  exit: function () { if (confirm('Exit this test? Your progress will be lost.')) home(); },
  sheet: function (v) { openSheet(v); }, closesheet: closeSheet,
  tab: function (v) { S.tab = v; sheet(); $('#sbody').scrollTop = 0; },
  sfil: function (v) { S.sf = v; sheet(); },
  delsav: function (v) { delete SAV[v]; persist(); sheet(); },
  practice: function () {
    if (S.view === 'test') return alert('Finish or exit the current test first.');
    var l = savedList(); if (!l.length) return; closeSheet(); S.mode = 'saved';
    begin(l.map(function (e) { return { s: e.s, c: e.c, q: e.q, o: e.o.slice(), a: e.a, e: e.e, _k: e.k, _src: e.src }; }), 0, 'quiz');
  },
  ptopic: function (v) {  /* jump to the home screen with one topic pre-selected, across all years */
    if (S.view === 'test') return alert('Finish or exit the current test first.');
    closeSheet(); TOPICS.forEach(function (t) { S.secs[t] = (t === v); });
    S.mode = 'sec'; S.kind = 'quiz'; S.year = PL.length > 1 ? 'all' : String(PL[0].year); home();
  },
  tg: function (v) { SET[v] = !SET[v]; if (v === 'defNeg') S.neg = SET.defNeg; saveSet(); sheet(); },
  font: function (v) { SET.font = +v; saveSet(); sheet(); },
  'export': function () { download('wbcs-backup.json', JSON.stringify({ att: ATT, sav: SAV, set: SET })); },
  'import': function () { $('#imp').click(); },
  wipe: function () { if (confirm('Delete all analytics and saved questions from this device?')) { ATT = []; SAV = {}; put('wb_att', ATT); put('wb_sav', SAV); sheet(); } }
};
document.addEventListener('click', function (e) {
  var t = e.target.closest('[data-act]'); if (!t || t.disabled) return;
  var f = A[t.dataset.act]; if (f) { if (t.dataset.act !== 'opt') buzz(); f(t.dataset.v, t); }
});
/* keyboard: 1-4 choose option · N / → next · P / ← previous · M mark */
document.addEventListener('keydown', function (e) {
  if (S.view !== 'test' || sheetOpen() || e.ctrlKey || e.metaKey || e.altKey || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  var k = e.key.toLowerCase();
  if (k >= '1' && k <= '4') { if (S.qs[S.cur].o[+k - 1] !== undefined) A.opt(+k - 1); }
  else if (k === 'n' || k === 'arrowright') { if (S.cur < S.qs.length - 1) A.next(); }
  else if (k === 'p' || k === 'arrowleft') A.prev();
  else if (k === 'm' && S.run !== 'quiz') A.mark();
});
home();
})();
