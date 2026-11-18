const $ = (s) => document.querySelector(s);
const PTR_COLORS = ['var(--accent-text)', 'var(--blue)', 'var(--green)', '#c026d3', 'var(--red)', '#0891b2'];

const state = {
  problem: null,
  loop: null,
  vars: new Set(),
  steps: [],
  stepIdx: 0,
  timer: null,
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

// ---------- Rendering ----------
function renderProblemList() {
  $('#problem-list').innerHTML = PROBLEMS.map((p, i) => `
    <div class="prob-item ${state.problem === p ? 'active' : ''} ${state.solved[p.id] ? 'done' : ''}" data-i="${i}"${state.solved[p.id] ? ' title="Solved"' : ''}>
      <span class="prob-title">${i + 1}. ${p.title}</span>
      <span class="diff ${p.difficulty}">${p.difficulty}</span>
    </div>`).join('');
  document.querySelectorAll('.prob-item').forEach((el) =>
    el.addEventListener('click', () => selectProblem(PROBLEMS[el.dataset.i])));
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
      <div class="tooltip">
        <div class="tt-title">Use when</div>
        <div>${l.when}</div>
        <div class="tt-title">Look for</div>
        <ul>${l.signals.map((s) => `<li>${s}</li>`).join('')}</ul>
      </div>
    </div>`).join('');
  document.querySelectorAll('.loop-card').forEach((el) =>
    el.addEventListener('click', () => { state.loop = el.dataset.k; renderLoops(); renderSkeleton(); updateVisualiser(); }));
}

function renderVars() {
  $('#vars').innerHTML = visible(VARS).map(([k, v]) => `
    <span class="chip ${state.vars.has(k) ? 'selected' : ''}" data-k="${k}" title="${v.desc}">${v.name}</span>`).join('');
  document.querySelectorAll('.chip').forEach((el) =>
    el.addEventListener('click', () => {
      const k = el.dataset.k;
      state.vars.has(k) ? state.vars.delete(k) : state.vars.add(k);
      renderVars(); renderSkeleton();
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
      <p class="muted">${b.why}</p><pre class="code">${esc(b.code)}</pre></details>`;
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
      html += `<pre class="code">${esc(r.best.code)}</pre>`;
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
  fb.innerHTML = html;
}

// ---------- Visualiser ----------
// Driven by the selected loop, so it can be played before checking.
function updateVisualiser() {
  stopPlay();
  const body = $('#vis-body');
  if (!state.loop) {
    $('#vis-note').textContent = 'Pick a loop to watch it run on the example input.';
    body.classList.add('hidden');
    return;
  }
  const sol = state.problem.solutions.find((s) => s.loop === state.loop && s.trace);
  if (!sol) {
    $('#vis-note').textContent = `No walkthrough for "${LOOPS[state.loop].name}" on this problem. Think through how it would run, then check your choice.`;
    body.classList.add('hidden');
    return;
  }
  state.steps = sol.trace();
  state.stepIdx = 0;
  $('#vis-note').textContent = `Running "${LOOPS[state.loop].name}" on the example input.`;
  body.classList.remove('hidden');
  renderStep();
}

function renderStep() {
  const st = state.steps[state.stepIdx];
  const names = Object.keys(st.ptr);
  const cells = $('#cells');
  cells.classList.toggle('as-grid', !!st.cols);
  cells.style.gridTemplateColumns = st.cols ? `repeat(${st.cols}, 52px)` : '';
  cells.innerHTML = st.arr.length ? st.arr.map((v, i) => {
    const here = names.filter((n) => st.ptr[n] === i);
    return `<div class="cell">
      <div class="box ${here.length ? 'hl' : ''}">${v}</div>
      <div class="idx">${i}</div>
      <div class="ptrs">${here.map((n) => `<div style="color:${PTR_COLORS[names.indexOf(n) % PTR_COLORS.length]}">↑${n}</div>`).join('')}</div>
    </div>`;
  }).join('') : '<span class="muted">(empty)</span>';
  $('#vis-msg').textContent = st.msg;
  $('#vis-vars').innerHTML = Object.entries(st.vars).map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('');
  $('#step-count').textContent = `Step ${state.stepIdx + 1} / ${state.steps.length}`;
}

const go = (i) => { state.stepIdx = Math.max(0, Math.min(state.steps.length - 1, i)); renderStep(); };
function stopPlay() { clearInterval(state.timer); state.timer = null; $('#play').textContent = 'Play'; }
function togglePlay() {
  if (state.timer) return stopPlay();
  if (state.stepIdx >= state.steps.length - 1) go(0);
  $('#play').textContent = 'Pause';
  state.timer = setInterval(() => {
    if (state.stepIdx >= state.steps.length - 1) return stopPlay();
    go(state.stepIdx + 1);
  }, 900);
}

// ---------- Guide ----------
function renderGuide() {
  $('#guide-table').innerHTML = `<tr><th>Loop</th><th>Shape</th><th>Use when</th><th>Signals</th></tr>` +
    Object.values(LOOPS).map((l) => `<tr><td><b>${l.name}</b>${l.level ? ' <span class="diff Medium">Medium</span>' : ''}</td><td><code>${l.sig}</code></td><td>${l.when}</td><td>${l.signals.join('<br>')}</td></tr>`).join('');
  $('#vars-table').innerHTML = `<tr><th>Variable</th><th>Declaration</th><th>Purpose</th></tr>` +
    Object.values(VARS).map((v) => `<tr><td><b>${v.name}</b>${v.level ? ' <span class="diff Medium">Medium</span>' : ''}</td><td><code>${esc(v.decl)}</code></td><td>${v.desc}</td></tr>`).join('');
}

// ---------- Misc ----------
function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function selectProblem(p) {
  state.problem = p;
  resetChoice();
  renderProblemList();
  renderProblem();
}

function resetChoice() {
  stopPlay();
  state.loop = null;
  state.vars = new Set();
  state.tries = {};
  $('#feedback').classList.add('hidden');
  $('#hint-box').classList.add('hidden');
  renderLoops(); renderVars(); renderSkeleton(); updateVisualiser();
}

$('#check').addEventListener('click', renderFeedback);
$('#reset').addEventListener('click', resetChoice);
$('#hint').addEventListener('click', () => {
  const b = $('#hint-box');
  b.textContent = '💡 ' + state.problem.hint;
  b.classList.toggle('hidden');
});
$('#first').addEventListener('click', () => { stopPlay(); go(0); });
$('#prev').addEventListener('click', () => { stopPlay(); go(state.stepIdx - 1); });
$('#next').addEventListener('click', () => { stopPlay(); go(state.stepIdx + 1); });
$('#last').addEventListener('click', () => { stopPlay(); go(state.steps.length - 1); });
$('#play').addEventListener('click', togglePlay);
document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('active', x === t));
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('hidden', v.id !== t.dataset.view));
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
selectProblem(PROBLEMS[0]);
