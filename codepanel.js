// =====================================================================
// Code panel: write JavaScript, run it against the problem's tests.
// Your code runs in a Web Worker (no DOM access, killed if it hangs).
// =====================================================================
const WORKER_SRC = `
class ListNode { constructor(val, next = null) { this.val = val; this.next = next; } }
class TreeNode { constructor(val, left = null, right = null) { this.val = val; this.left = left; this.right = right; } }
const build = (v) => {
  if (v && v.__list) { let h = null; for (let i = v.__list.length - 1; i >= 0; i--) h = new ListNode(v.__list[i], h); return h; }
  if (v && v.__tree) { const a = v.__tree, mk = (i) => (i >= a.length || a[i] == null ? null : new TreeNode(a[i], mk(2 * i + 1), mk(2 * i + 2))); return mk(0); }
  return v;
};
const plain = (v) => {
  if (v instanceof ListNode) { const o = []; let n = 0; while (v && n++ < 1000) { o.push(v.val); v = v.next; } return o; }
  return v;
};
const show = (v) => { try { return typeof v === 'string' ? v : JSON.stringify(v) ?? String(v); } catch (e) { return String(v); } };
const json = (v) => { try { return JSON.stringify(v); } catch (e) { return undefined; } };
onmessage = (e) => {
  const { code, fn, cases } = e.data, logs = [];
  const fakeConsole = { log: (...a) => { if (logs.length < 40) logs.push(a.map(show).join(' ')); } };
  let f;
  try { f = new Function('console', 'ListNode', 'TreeNode', code + '\\n;return typeof ' + fn + ' === "function" ? ' + fn + ' : undefined;')(fakeConsole, ListNode, TreeNode); }
  catch (err) { postMessage({ fatal: String(err) }); return; }
  if (!f) { postMessage({ fatal: 'Could not find a function named ' + fn + '. Keep the function name from the starter code.' }); return; }
  cases.forEach((c, i) => {
    logs.length = 0;
    const args = c.args.map(build), r = { i };
    try { const ret = f(...args); r.ret = json(ret === null && c.args.some((a) => a && a.__list) ? [] : plain(ret)); r.retType = typeof ret; r.arg0 = json(plain(args[0])); }
    catch (err) { r.error = String(err); }
    r.logs = logs.slice();
    postMessage(r);
  });
  postMessage({ done: true });
};`;

const codePanel = { cm: null, problem: null, worker: null, timer: null };
const cp = (sel) => document.querySelector(sel);

function starterCode(t) {
  const hints = [];
  if (t.cases[0].args.some((a) => a && a.__list)) hints.push('// Linked-list nodes look like { val, next }.');
  if (t.cases[0].args.some((a) => a && a.__tree)) hints.push('// Tree nodes look like { val, left, right }.');
  return [...hints, `function ${t.fn}(${t.params.join(', ')}) {`, '  ', '}'].join('\n');
}

function editorValue() { return codePanel.cm ? codePanel.cm.getValue() : cp('#code-editor').value; }
function setEditorValue(v) { if (codePanel.cm) codePanel.cm.setValue(v); else cp('#code-editor').value = v; }

function initCodePanel() {
  const ta = cp('#code-editor');
  if (window.CodeMirror) {
    codePanel.cm = CodeMirror.fromTextArea(ta, {
      mode: 'javascript', lineNumbers: true, indentUnit: 2, tabSize: 2, indentWithTabs: false, lineWrapping: false,
      matchBrackets: true, autoCloseBrackets: true,
      extraKeys: {
        'Ctrl-Enter': runTests, 'Cmd-Enter': runTests,
        Tab: (cm) => (cm.somethingSelected() ? cm.indentSelection('add') : cm.replaceSelection('  ', 'end')),
      },
    });
    codePanel.cm.on('change', () => {
      const p = codePanel.problem;
      if (p) try { localStorage.setItem('loopwise-code-' + p.id, codePanel.cm.getValue()); } catch (e) { /* storage unavailable */ }
    });
  } else {
    ta.addEventListener('input', () => {
      const p = codePanel.problem;
      if (p) try { localStorage.setItem('loopwise-code-' + p.id, ta.value); } catch (e) { /* storage unavailable */ }
    });
    ta.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') runTests(); });
  }
  cp('#run-tests').addEventListener('click', runTests);
  cp('#reset-code').addEventListener('click', () => {
    const t = TESTS[codePanel.problem.id];
    if (t && confirm('Replace your code with the starter template?')) setEditorValue(starterCode(t));
  });
}

function loadCodePanel(problem) {
  stopWorker();
  codePanel.problem = problem;
  const t = TESTS[problem.id], card = cp('#code-card');
  card.classList.add('hidden'); // opt-in: revealed from the feedback after "Check my choice"
  cp('#test-results').innerHTML = '';
  if (!t) return;
  cp('#code-note').innerHTML = `Write <code>${t.fn}(${t.params.join(', ')})</code>. ${t.note || ''} Use <code>console.log</code> to debug.`;
  let saved = null;
  try { saved = localStorage.getItem('loopwise-code-' + problem.id); } catch (e) { /* storage unavailable */ }
  setEditorValue(saved ?? starterCode(t));
  if (codePanel.cm) { codePanel.cm.clearHistory(); setTimeout(() => codePanel.cm.refresh(), 0); }
}

const hasCodePanel = (problem) => !!TESTS[problem.id];

function showCodePanel() {
  const card = cp('#code-card');
  card.classList.remove('hidden');
  if (codePanel.cm) { codePanel.cm.refresh(); codePanel.cm.focus(); }
  card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function stopWorker() {
  clearTimeout(codePanel.timer);
  if (codePanel.worker) { codePanel.worker.terminate(); codePanel.worker = null; }
  const b = cp('#run-tests');
  if (b) { b.disabled = false; b.textContent = '▶ Run tests'; }
}

const fmtArg = (a) => (a && a.__list ? `list ${JSON.stringify(a.__list)}` : a && a.__tree ? `tree ${JSON.stringify(a.__tree)}` : JSON.stringify(a));
const canon = (v) => (Array.isArray(v) ? v.map(canon) : v);

// What the learner's run produced, in the shape `expected` is written in.
function observed(t, c, r) {
  let v;
  const ret = r.ret === undefined ? undefined : JSON.parse(r.ret);
  const arg0 = r.arg0 === undefined ? undefined : JSON.parse(r.arg0);
  if (t.pick === 'arg0') v = arg0;
  else if (t.pick === 'retOrArg0') v = Array.isArray(ret) ? ret : arg0;
  else if (t.pick === 'kprefix') v = typeof ret === 'number' && Array.isArray(arg0) ? [ret, arg0.slice(0, ret)] : ret;
  else v = ret;
  if (t.cmp === 'sorted' && Array.isArray(v)) v = [...v].sort((a, b) => a - b);
  if (t.cmp === 'sets' && Array.isArray(v)) v = v.map((s) => (Array.isArray(s) ? [...s].sort((a, b) => a - b) : s)).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  return v;
}

function expectedFor(t, c) {
  let v = canon(c.expected);
  if (t.cmp === 'sorted' && Array.isArray(v)) v = [...v].sort((a, b) => a - b);
  if (t.cmp === 'sets' && Array.isArray(v)) v = v.map((s) => [...s].sort((a, b) => a - b)).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  return v;
}

function runTests() {
  const problem = codePanel.problem, t = problem && TESTS[problem.id];
  if (!t) return;
  stopWorker();
  const results = new Array(t.cases.length).fill(null);
  const btn = cp('#run-tests');
  btn.disabled = true; btn.textContent = 'Running…';
  let fatal = null, current = 0;

  const finish = (timedOut) => {
    stopWorker();
    renderResults(t, results, fatal, timedOut ? current : -1);
  };

  const blob = new Blob([WORKER_SRC], { type: 'text/javascript' });
  const url = URL.createObjectURL(blob);
  const w = new Worker(url);
  URL.revokeObjectURL(url);
  codePanel.worker = w;
  const arm = () => { clearTimeout(codePanel.timer); codePanel.timer = setTimeout(() => finish(true), 2500); };

  w.onmessage = (e) => {
    const m = e.data;
    if (m.fatal) { fatal = m.fatal; return finish(false); }
    if (m.done) return finish(false);
    results[m.i] = m; current = m.i + 1; arm();
  };
  w.onerror = (e) => { fatal = e.message || 'The worker crashed.'; finish(false); };
  arm();
  w.postMessage({ code: editorValue(), fn: t.fn, cases: t.cases });
}

function renderResults(t, results, fatal, hungAt) {
  const el = cp('#test-results');
  if (fatal) { el.innerHTML = `<div class="test-summary fail">✗ ${esc(fatal)}</div>`; return; }
  let passed = 0;
  const rows = t.cases.map((c, i) => {
    const r = results[i], args = c.args.map(fmtArg).join(', ');
    if (!r) {
      const hung = i === hungAt;
      return `<div class="test-row fail"><b>${hung ? '⏱' : '–'} Test ${i + 1}</b> <code>${esc(t.fn)}(${esc(args)})</code><div class="muted">${hung ? 'Timed out after 2.5 s — is there an infinite loop?' : 'Not run (an earlier test timed out).'}</div></div>`;
    }
    const logs = r.logs && r.logs.length ? `<pre class="test-logs">${esc(r.logs.join('\n'))}</pre>` : '';
    if (r.error) return `<div class="test-row fail"><b>✗ Test ${i + 1}</b> <code>${esc(t.fn)}(${esc(args)})</code><div class="muted">Threw: ${esc(r.error)}</div>${logs}</div>`;
    const got = observed(t, c, r), want = expectedFor(t, c);
    const ok = JSON.stringify(got) === JSON.stringify(want);
    if (ok) passed++;
    const gotText = got === undefined ? 'undefined (did you forget to return?)' : JSON.stringify(got);
    return `<div class="test-row ${ok ? 'pass' : 'fail'}"><b>${ok ? '✓' : '✗'} Test ${i + 1}</b> <code>${esc(t.fn)}(${esc(args)})</code>
      ${ok ? '' : `<div class="muted">Expected <code>${esc(JSON.stringify(c.expected))}</code> but got <code>${esc(gotText)}</code></div>`}${logs}</div>`;
  }).join('');
  const all = passed === t.cases.length;
  el.innerHTML = `<div class="test-summary ${all ? 'pass' : 'fail'}">${all ? '🎉 All tests passed' : `✗ ${passed} / ${t.cases.length} tests passed`}</div>${rows}`;
}

initCodePanel();
