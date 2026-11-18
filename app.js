const $ = (s) => document.querySelector(s);
const PTR_COLORS = ['var(--accent-text)', 'var(--blue)', 'var(--green)', '#c026d3', 'var(--red)', '#0891b2'];

const state = {
  problem: null,
  loop: null,
  vars: new Set(),
  tries: {},
  solved: JSON.parse(localStorage.getItem('loopwise-solved') || '{}'),
};

// ---------- Evaluation ----------
function evaluate(problem, loop, vars) {
  const best = problem.solutions[0];
  if (!loop) return { status: 'none' };
  const sol = problem.solutions.find((s) => s.loop === loop);
  if (!sol) return { status: 'wrong', best };

  const has = (r) => (Array.isArray(r) ? r.some((v) => vars.has(v)) : vars.has(r));
  const missing = sol.required.filter((r) => !has(r));
  const allowed = new Set([...sol.required.flat(), ...(sol.optional || [])]);
  const extra = [...vars].filter((v) => !allowed.has(v));
  return { status: missing.length ? 'missing' : sol.rating, sol, best, missing, extra };
}

const varLabel = (r) => (Array.isArray(r) ? r.map((v) => VARS[v].name).join(' or ') : VARS[r].name);

// Mobile: the problem list collapses behind a toggle button.
function setSidebar(open) {
  document.body.classList.toggle('sidebar-open', open);
  $('#sidebar-toggle').setAttribute('aria-expanded', open);
  $('#sidebar-toggle').textContent = open ? '✕ Close problems' : '☰ Problems';
}
$('#sidebar-toggle').addEventListener('click', () => setSidebar(!document.body.classList.contains('sidebar-open')));

// Solid shuffle icon (two curved arrows swapping places); inherits the text colour so it follows the theme.
const SHUFFLE_ICON = `<svg class="icon" viewBox="0 0 512 512" width="18" height="18" aria-hidden="true">
  <g fill="currentColor" stroke="none"><path d="M405 30l105 95-105 100z"/><path d="M405 280l105 90-105 100z"/></g>
  <g fill="none" stroke="currentColor" stroke-width="64" stroke-linejoin="round">
    <path d="M10 392h95c120 0 100-267 225-267h80"/>
    <path d="M10 125h75c55 0 85 20 95 45"/>
    <path d="M262 305c15 35 45 50 85 50h58"/>
  </g></svg>`;

// ---------- Rendering ----------
function renderProblemList() {
  const left = PROBLEMS.filter((p) => !state.solved[p.id]).length;
  $('#problem-list').innerHTML = `
    <button type="button" id="random-challenge" class="random-btn"${left ? '' : ' disabled'}>${left ? `${SHUFFLE_ICON} Random challenge` : '🎉 All solved!'}</button>` + PROBLEMS.map((p, i) => `
    <div class="prob-item ${state.problem === p ? 'active' : ''} ${state.solved[p.id] ? 'done' : ''}" data-i="${i}"${state.solved[p.id] ? ' title="Solved"' : ''}>
      <span class="prob-title">${i + 1}. ${p.title}</span>
      <span class="diff ${p.difficulty}">${p.difficulty}</span>
    </div>`).join('');
  document.querySelectorAll('.prob-item').forEach((el) =>
    el.addEventListener('click', () => selectProblem(PROBLEMS[el.dataset.i])));
  $('#random-challenge').addEventListener('click', () => {
    const pool = PROBLEMS.filter((p) => !state.solved[p.id]);
    // Avoid re-picking the current problem when there's another unsolved one.
    const others = pool.filter((p) => p !== state.problem);
    const choices = others.length ? others : pool;
    if (choices.length) selectProblem(choices[Math.floor(Math.random() * choices.length)]);
  });
  const n = Object.keys(state.solved).length;
  $('#progress').textContent = `${n} / ${PROBLEMS.length} solved optimally`;
}

function renderProblem() {
  const p = state.problem;
  $('#problem').innerHTML = `
    <h2>${p.title} <span class="diff ${p.difficulty}">${p.difficulty}</span></h2>
    <p>${p.description}</p>
    <div class="example"><b>Input:</b> ${p.example.input}<br><b>Output:</b> ${p.example.output}</div>`;
}

// Medium-level loops/vars are hidden on Easy problems to keep them focused.
const visible = (obj) => Object.entries(obj).filter(([, v]) => !v.level || state.problem.difficulty !== 'Easy');

function renderLoops() {
  $('#loops').innerHTML = visible(LOOPS).map(([k, l]) => `
    <div class="loop-card ${state.loop === k ? 'selected' : ''}" data-k="${k}">
      <div class="name">${l.name}</div>
      <code>${l.sig}</code>
      <button type="button" class="info" aria-label="About ${l.name}">i</button>
      <div class="tooltip">
        <div class="tt-title">Use when</div>
        <div>${l.when}</div>
        <div class="tt-title">Look for</div>
        <ul>${l.signals.map((s) => `<li>${s}</li>`).join('')}</ul>
      </div>
    </div>`).join('');
  document.querySelectorAll('.loop-card .info').forEach((el) =>
    el.addEventListener('click', (e) => e.stopPropagation()));
  document.querySelectorAll('.loop-card').forEach((el) =>
    el.addEventListener('click', () => { state.loop = el.dataset.k; renderLoops(); renderSkeleton(); updateVisualiser(); }));
}

function renderVars() {
  const shown = new Set(visible(VARS).map(([k]) => k));
  $('#vars').innerHTML = VAR_GROUPS.map((g) => {
    const chips = g.vars.filter((k) => shown.has(k)).map((k) => `
      <span class="chip ${state.vars.has(k) ? 'selected' : ''}" data-k="${k}" title="${VARS[k].desc}">${VARS[k].name}</span>`).join('');
    return chips ? `
    <div class="var-group">
      <div class="var-group-title">${g.name} <span class="muted">— ${g.hint}</span></div>
      <div class="chips">${chips}</div>
    </div>` : '';
  }).join('');
  document.querySelectorAll('.chip').forEach((el) =>
    el.addEventListener('click', () => {
      const k = el.dataset.k;
      state.vars.has(k) ? state.vars.delete(k) : state.vars.add(k);
      renderVars(); renderSkeleton(); updateVisualiser();
    }));
}

function renderSkeleton() {
  const decls = [...state.vars].map((v) => VARS[v].decl);
  const loop = state.loop ? LOOPS[state.loop].code : '// ← pick a loop';
  $('#skeleton').textContent = [...decls, decls.length ? '' : null, loop].filter((x) => x !== null).join('\n');
}

// Feedback escalates each time the same kind of mistake is checked again:
// try 1 = nudge, try 2 = clue, try 3+ = reveal.
function renderFeedback() {
  const p = state.problem;
  const r = evaluate(p, state.loop, state.vars);
  const fb = $('#feedback');
  fb.classList.remove('hidden');

  if (r.status === 'none') {
    fb.innerHTML = '<div class="verdict wrong">Pick a loop first.</div>';
    return;
  }

  const key = r.status === 'missing' ? 'missing' : r.status === 'wrong' ? 'wrong' : r.status === 'works' ? 'works' : 'extra';
  const tries = (state.tries[key] = (state.tries[key] || 0) + 1);
  const again = (n) => (tries < n ? `<p class="muted">Check again for a bigger clue (${tries}/${n - 1}).</p>` : '');
  const reveal = (b) => `<details><summary>Show the answer</summary>
      <p><b>${LOOPS[b.loop].name}</b> with ${b.required.map(varLabel).join(', ') || 'no extra variables'} <span class="tag">${b.complexity}</span></p>
      <p class="muted">${b.why}</p><pre class="code">${esc(b.code)}</pre>${refBtn}</details>`;
  const refBtn = '<button class="ref-btn" data-ref="1">▶ Watch the reference solution</button>';
  const codeBtn = hasCodePanel(p) ? '<button class="ref-btn" data-code="1">💻 Try it in code</button>' : '';
  let codeShown = false;
  const clue = (r2) => VARS[Array.isArray(r2) ? r2[0] : r2].clue;
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

  let html = '';
  if (r.status === 'wrong') {
    const l = LOOPS[state.loop];
    html = `<div class="verdict wrong">✗ That loop isn't a good fit</div>
      <p>A <b>${l.name}</b> suits: ${l.when}<br>Does this problem have those signals?</p>`;
    if (tries >= 2) html += `<p>💡 ${p.hint}</p>`;
    if (tries >= 3) html += `<p>🔎 Look for: ${LOOPS[r.best.loop].signals.join(', ')}</p>` + reveal(r.best);
    html += again(3);
  } else if (r.status === 'missing') {
    const total = r.sol.required.length, have = total - r.missing.length;
    html = `<div class="verdict missing">✓ Right loop — but something's missing</div>
      <p>${have} of ${total} required variables in place. You're missing <b>${plural(r.missing.length, 'variable')}</b>.</p>`;
    if (tries === 1) html += `<p class="muted">Walk through the example by hand: what do you need to remember between iterations?</p>`;
    if (tries === 2) html += `<ul>${r.missing.map((m) => `<li>${clue(m)}</li>`).join('')}</ul>`;
    if (tries >= 3) html += `<ul>${r.missing.map((m) => `<li>${clue(m)} → <b>${varLabel(m)}</b></li>`).join('')}</ul>`;
    html += again(3);
  } else {
    const opt = r.status === 'optimal';
    if (opt) {
      html = `<div class="verdict optimal">✓ Optimal choice!</div><p><span class="tag">${r.sol.complexity}</span> ${r.sol.why}</p>`;
      if (r.extra.length) {
        html += `<p class="muted">…but ${plural(r.extra.length, 'variable')} you picked ${r.extra.length === 1 ? "isn't" : "aren't"} needed.`;
        html += tries >= 2 ? ` Not needed: <b>${r.extra.map((v) => VARS[v].name).join(', ')}</b></p>` : ' Can you spot which? Check again to see.</p>';
      }
      html += `<pre class="code">${esc(r.best.code)}</pre>${refBtn} ${codeBtn}`;
      codeShown = true;
      state.solved[p.id] = true;
      localStorage.setItem('loopwise-solved', JSON.stringify(state.solved));
      renderProblemList();
    } else {
      html = `<div class="verdict works">~ That works — but there's a better loop</div>
        <p>Yours: <span class="tag">${r.sol.complexity}</span> Target: <span class="tag">${r.best.complexity}</span></p>`;
      if (tries >= 2) html += `<p>${r.sol.why}</p>`;
      if (tries >= 3) html += reveal(r.best);
      html += again(3);
    }
  }
  if (codeBtn && !codeShown) html += `<p>${codeBtn}</p>`;
  fb.innerHTML = html;
}

// ---------- Visualiser ----------
// Driven by the selected loop, so it can be played before checking.
function updateVisualiser() {
  if (!state.loop) {
    mainPlayer.stop();
    $('#vis-note').textContent = 'Pick a loop to watch it run on the example input.';
    $('#player-main').classList.add('hidden');
    return;
  }
  const names = [...state.vars].map((v) => VARS[v].name);
  $('#vis-note').textContent = `Your ${LOOPS[state.loop].name} with ${names.length ? names.join(', ') : 'no variables'} — run as-is on the example input.`;
  $('#player-main').classList.remove('hidden');
  mainPlayer.load(simulate(state.problem, state.loop, state.vars));
}

function showReference() {
  const best = state.problem.solutions[0];
  $('#ref-note').textContent = `${LOOPS[best.loop].name} with ${best.required.map(varLabel).join(', ') || 'no extra variables'}.`;
  $('#reference').classList.remove('hidden');
  refPlayer.load(best.trace());
  $('#reference').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function hideReference() {
  refPlayer.stop();
  $('#reference').classList.add('hidden');
}

const KIND_ICON = { loop: '🔁 loop', var: '✏️ variable', note: '💭', warn: '⚠️', end: '🏁' };

// A self-contained step player; one for the learner's run, one for the reference.
function createPlayer(root) {
  root.innerHTML = `
    <div class="cells"></div>
    <div class="vis-msg"></div>
    <table class="vars-table"></table>
    <div class="actions">
      <button data-a="first">⏮</button>
      <button data-a="prev">◀</button>
      <button data-a="play" class="primary">Play</button>
      <button data-a="next">▶</button>
      <button data-a="last">⏭</button>
      <span class="muted step-count"></span>
    </div>`;
  const q = (sel) => root.querySelector(sel);
  const p = {
    steps: [], idx: 0, timer: null,
    load(steps) { p.stop(); p.steps = steps; p.idx = 0; p.render(); },
    go(i) { p.idx = Math.max(0, Math.min(p.steps.length - 1, i)); p.render(); },
    stop() { clearInterval(p.timer); p.timer = null; q('[data-a="play"]').textContent = 'Play'; },
    toggle() {
      if (p.timer) return p.stop();
      if (p.idx >= p.steps.length - 1) p.go(0);
      q('[data-a="play"]').textContent = 'Pause';
      p.timer = setInterval(() => (p.idx >= p.steps.length - 1 ? p.stop() : p.go(p.idx + 1)), 900);
    },
    render() {
      const st = p.steps[p.idx];
      if (!st) return;
      const kind = st.kind || 'note';
      const names = Object.keys(st.ptr);
      const cells = q('.cells');
      cells.classList.toggle('as-grid', !!st.cols);
      cells.style.gridTemplateColumns = st.cols ? `repeat(${st.cols}, 52px)` : '';
      cells.innerHTML = st.arr.length ? st.arr.map((v, i) => {
        const here = names.filter((n) => st.ptr[n] === i);
        const hl = here.length ? (kind === 'loop' || !st.kind ? 'hl' : 'hl-soft') : '';
        return `<div class="cell">
          <div class="box ${hl}">${v}</div>
          <div class="idx">${i}</div>
          <div class="ptrs">${here.map((n) => `<div style="color:${PTR_COLORS[names.indexOf(n) % PTR_COLORS.length]}">↑${n}</div>`).join('')}</div>
        </div>`;
      }).join('') : '<span class="muted">(empty)</span>';
      const msg = q('.vis-msg');
      msg.className = `vis-msg kind-${kind}`;
      msg.innerHTML = `${st.kind ? `<span class="kind">${KIND_ICON[kind]}</span>` : ''}${esc(st.msg)}`;
      const rows = Object.entries(st.vars);
      q('.vars-table').innerHTML = rows.length
        ? rows.map(([k, v]) => `<tr class="${st.hot === k ? 'hot' : ''}"><td>${esc(k)}</td><td>${esc(String(v))}</td></tr>`).join('')
        : '<tr><td class="muted">no variables</td></tr>';
      q('.step-count').textContent = `Step ${p.idx + 1} / ${p.steps.length}`;
    },
  };
  root.addEventListener('click', (e) => {
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (!a) return;
    if (a === 'play') return p.toggle();
    p.stop();
    p.go({ first: 0, prev: p.idx - 1, next: p.idx + 1, last: p.steps.length - 1 }[a]);
  });
  return p;
}

const mainPlayer = createPlayer($('#player-main'));
const refPlayer = createPlayer($('#player-ref'));

// ---------- Guide ----------
function renderGuide() {
  $('#guide-table').innerHTML = `<tr><th>Loop</th><th>Shape</th><th>How it moves</th><th>Use when</th><th>Signals</th></tr>` +
    Object.entries(LOOPS).map(([k, l]) => `<tr><td><b>${l.name}</b>${l.level ? ' <span class="diff Medium">Medium</span>' : ''}</td><td><code>${l.sig}</code></td><td><div class="demo" data-loop="${k}"></div></td><td>${l.when}</td><td>${l.signals.join('<br>')}</td></tr>`).join('');
  $('#vars-table').innerHTML = `<tr><th>Variable</th><th>Declaration</th><th>Purpose</th></tr>` +
    Object.values(VARS).map((v) => `<tr><td><b>${v.name}</b>${v.level ? ' <span class="diff Medium">Medium</span>' : ''}</td><td><code>${esc(v.decl)}</code></td><td>${v.desc}</td></tr>`).join('');
}

// ---------- Misc ----------
function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function selectProblem(p) {
  state.problem = p;
  setSidebar(false);
  loadCodePanel(p);
  resetChoice();
  renderProblemList();
  renderProblem();
}

function resetChoice() {
  hideReference();
  state.loop = null;
  state.vars = new Set();
  state.tries = {};
  $('#feedback').classList.add('hidden');
  $('#hint-box').classList.add('hidden');
  renderLoops(); renderVars(); renderSkeleton(); updateVisualiser();
}

$('#check').addEventListener('click', renderFeedback);
$('#feedback').addEventListener('click', (e) => {
  if (e.target.closest('[data-ref]')) showReference();
  if (e.target.closest('[data-code]')) showCodePanel();
});
$('#reset').addEventListener('click', resetChoice);
$('#hint').addEventListener('click', () => {
  const b = $('#hint-box');
  b.textContent = '💡 ' + state.problem.hint;
  b.classList.toggle('hidden');
});
document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('active', x === t));
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('hidden', v.id !== t.dataset.view));
  if (codePanel.cm) codePanel.cm.refresh();
}));

// ---------- Theme ----------
function renderThemeToggle() {
  $('#theme-toggle').textContent = document.documentElement.dataset.theme === 'light' ? '🌙' : '☀️';
}
$('#theme-toggle').addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('loopwise-theme', next);
  renderThemeToggle();
});

renderThemeToggle();
renderGuide();
startDemos();
selectProblem(PROBLEMS[0]);
