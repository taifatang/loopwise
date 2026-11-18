// Small looping animations for the Pattern Guide — one per loop type.
// Each demo is a list of frames: { cells, ptr, hl, soft, dim, text, rows, cols, link }.
const DEMO_TREE_ROWS = [[0], [1, 2], [3, 4, 5, 6]];

const DEMOS = {
  single() {
    const v = [3, 1, 4, 1, 5, 9];
    return v.map((x, i) => ({ cells: v, ptr: { i }, hl: [i], text: `arr[${i}] = ${x}` }));
  },
  foreach() {
    const v = [3, 1, 4, 1, 5, 9];
    return v.map((x, i) => ({ cells: v, ptr: { x: i }, hl: [i], text: `x = ${x}` }));
  },
  reverse() {
    const v = [3, 1, 4, 1, 5, 9];
    return v.map((_, k) => v.length - 1 - k).map((i) => ({ cells: v, ptr: { i }, hl: [i], text: `i = ${i}` }));
  },
  twoPointer() {
    const v = [1, 2, 3, 4, 5, 6, 7], f = [];
    for (let l = 0, r = v.length - 1; l < r; l++, r--) f.push({ cells: v, ptr: { L: l, R: r }, hl: [l, r], text: `compare ${v[l]} and ${v[r]}` });
    f.push({ cells: v, ptr: { L: 3, R: 3 }, hl: [3], text: 'pointers meet → stop' });
    return f;
  },
  fastSlow() {
    const a = [1, 1, 2, 2, 3, 3], f = [{ cells: [...a], ptr: { slow: 0 }, soft: [0], text: 'slow = 0 (write position)' }];
    let slow = 0;
    for (let fast = 1; fast < a.length; fast++) {
      const keep = a[fast] !== a[slow];
      if (keep) { slow++; a[slow] = a[fast]; }
      f.push({ cells: [...a], ptr: { slow, fast }, hl: [fast], soft: [slow], text: keep ? `new value → write at slow = ${slow}` : 'duplicate → skip' });
    }
    f.push({ cells: [...a], ptr: {}, soft: range(0, slow + 1), dim: range(slow + 1, a.length), text: `kept the first ${slow + 1}` });
    return f;
  },
  sliding() {
    const v = [2, 1, 5, 1, 3, 2, 4], k = 3;
    return v.map((_, r) => {
      const l = Math.max(0, r - k + 1);
      return { cells: v, ptr: { L: l, R: r }, hl: range(l, r + 1), text: `window [${l}..${r}]` };
    });
  },
  nested() {
    const v = [4, 2, 7, 1], f = [];
    for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) f.push({ cells: v, ptr: { i, j }, hl: [i, j], text: `pair (${v[i]}, ${v[j]})` });
    return f;
  },
  binary() {
    const v = [1, 3, 5, 7, 9, 11, 13, 15, 17], t = 11, f = [];
    let lo = 0, hi = v.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const dim = v.map((_, k) => k).filter((k) => k < lo || k > hi);
      f.push({ cells: v, ptr: { lo, mid, hi }, hl: [mid], dim, text: v[mid] === t ? `${v[mid]} = ${t} → found` : `${v[mid]} ${v[mid] < t ? '<' : '>'} ${t} → go ${v[mid] < t ? 'right' : 'left'}` });
      if (v[mid] === t) break;
      if (v[mid] < t) lo = mid + 1; else hi = mid - 1;
    }
    return f;
  },
  whileCond() {
    const f = [];
    for (let n = 1234; n > 0; n = Math.floor(n / 10)) {
      const d = [...String(n)];
      f.push({ cells: d, ptr: { last: d.length - 1 }, hl: [d.length - 1], text: `n = ${n} > 0 → take ${n % 10}` });
    }
    f.push({ cells: [], text: 'n = 0 → stop' });
    return f;
  },
  twoArrays() {
    const a = [1, 4, 7], b = [2, 5, 8], cells = [...a, '|', ...b], out = [], f = [];
    let i = 0, j = 0;
    while (i < a.length || j < b.length) {
      const P = { ...(i < a.length ? { i } : {}), ...(j < b.length ? { j: a.length + 1 + j } : {}) };
      const takeA = j >= b.length || (i < a.length && a[i] <= b[j]);
      const at = takeA ? i : a.length + 1 + j;
      out.push(takeA ? a[i++] : b[j++]);
      f.push({ cells, ptr: P, hl: [at], text: `out: ${out.join(' ')}` });
    }
    return f;
  },
  linkedList() {
    const v = [1, 2, 3, 4];
    return [...v.map((x, i) => ({ cells: v, link: true, ptr: { curr: i }, hl: [i], text: i ? `curr = curr.next → ${x}` : 'curr = head' })),
      { cells: v, link: true, text: 'curr = null → stop' }];
  },
  monoStack() {
    const v = [3, 1, 2, 5, 4], st = [], f = [];
    for (let i = 0; i < v.length; i++) {
      while (st.length && v[i] > v[st.at(-1)]) {
        const top = st.pop();
        f.push({ cells: v, ptr: { i, top }, hl: [i], soft: [top], text: `${v[i]} > ${v[top]} → pop · stack [${st.map((k) => v[k]).join(', ')}]` });
      }
      st.push(i);
      f.push({ cells: v, ptr: { i }, hl: [i], text: `push ${v[i]} · stack [${st.map((k) => v[k]).join(', ')}]` });
    }
    return f;
  },
  bfs() {
    const t = [...'ABCDEFG'], f = [], q = [0], seen = [];
    while (q.length) {
      const n = q.shift(); seen.push(n);
      for (const c of [2 * n + 1, 2 * n + 2]) if (c < t.length) q.push(c);
      f.push({ cells: t, rows: DEMO_TREE_ROWS, hl: [n], soft: seen.slice(0, -1), text: `visit ${t[n]} · queue [${q.map((k) => t[k]).join(', ')}]` });
    }
    return f;
  },
  dfs() {
    const t = [...'ABCDEFG'], f = [], st = [0], seen = [];
    while (st.length) {
      const n = st.pop(); seen.push(n);
      for (const c of [2 * n + 2, 2 * n + 1]) if (c < t.length) st.push(c);
      f.push({ cells: t, rows: DEMO_TREE_ROWS, hl: [n], soft: seen.slice(0, -1), text: `visit ${t[n]} · stack [${st.map((k) => t[k]).join(', ')}]` });
    }
    return f;
  },
  grid() {
    const g = [...'110001010011'], cols = 4;
    return g.map((_, k) => ({ cells: g.map((x) => (x === '1' ? '■' : '')), cols, hl: [k], soft: range(0, k), text: `(r, c) = (${Math.floor(k / cols)}, ${k % cols})` }));
  },
  dp() {
    const dp = [0, 1, 1, 2, 3, 5, 8], f = [];
    for (let i = 2; i < dp.length; i++) {
      f.push({ cells: dp.map((x, k) => (k <= i ? x : '')), ptr: { i }, hl: [i], soft: [i - 1, i - 2], text: `dp[${i}] = ${dp[i - 1]} + ${dp[i - 2]} = ${dp[i]}` });
    }
    return f;
  },
  prefix() {
    const v = [3, 1, 4, 1, 5];
    let sum = 0;
    return v.map((x, i) => ({ cells: v, ptr: { x: i }, hl: [i], soft: range(0, i), text: `sum = ${(sum += x)}` }));
  },
  backtrack() {
    const v = [1, 2, 3];
    return [[], [0], [0, 1], [0, 1, 2], [0, 2], [1], [1, 2], [2]].map((p) => ({ cells: v, hl: p, text: `path = [${p.map((k) => v[k]).join(', ')}]` }));
  },
};

function renderDemo(el, f) {
  const at = (i) => Object.entries(f.ptr || {}).filter(([, v]) => v === i).map(([k]) => k);
  const cls = (i) => [f.hl?.includes(i) && 'on', f.soft?.includes(i) && 'soft', f.dim?.includes(i) && 'dim'].filter(Boolean).join(' ');
  const cell = (v, i) => v === '|'
    ? '<div class="d-sep"></div>'
    : `<div class="d-cell ${cls(i)}"><div class="d-ptr">${at(i).join(' ')}</div><div class="d-box">${v}</div></div>`;
  let body;
  if (!f.cells.length) body = '<div class="d-row"><span class="muted">(empty)</span></div>';
  else if (f.rows) body = f.rows.map((r) => `<div class="d-row tree">${r.map((i) => cell(f.cells[i], i)).join('')}</div>`).join('');
  else if (f.cols) body = `<div class="d-grid" style="grid-template-columns:repeat(${f.cols}, 24px)">${f.cells.map(cell).join('')}</div>`;
  else body = `<div class="d-row">${f.cells.map((v, i) => cell(v, i) + (f.link && i < f.cells.length - 1 ? '<span class="d-link">→</span>' : '')).join('')}</div>`;
  el.innerHTML = `${body}<div class="d-text">${f.text || ''}</div>`;
}

// Drives every demo in the guide; only ticks while the guide is visible.
function startDemos() {
  const items = [...document.querySelectorAll('.demo')].map((el) => {
    const frames = DEMOS[el.dataset.loop]();
    frames.push(frames.at(-1)); // linger on the last frame
    return { el, frames, k: 0 };
  });
  items.forEach((d) => renderDemo(d.el, d.frames[0]));
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  setInterval(() => {
    if ($('#guide').classList.contains('hidden')) return;
    for (const d of items) { d.k = (d.k + 1) % d.frames.length; renderDemo(d.el, d.frames[d.k]); }
  }, 900);
}
