// =====================================================================
// Simulator: runs the learner's chosen loop + variables on the example
// input. Steps alternate between the loop moving (kind 'loop') and the
// chosen variables updating (kind 'var'). Missing variables are not
// filled in — the run just shows what happens without them.
// =====================================================================
const MAX_STEPS = 150;
const POINTER_VARS = ['lr', 'bounds', 'ij']; // shown by the loop drivers
const CODE_NAME = {
  counter: 'count', temp: 'temp', max: 'max', min: 'min', sum: 'sum', map: 'map', set: 'seen',
  slow: 'slow', winStart: 'left', prevCurr: 'prev / curr', result: 'result', flag: 'swapped',
  stack: 'stack', queue: 'queue', visited: 'visited', dp: 'dp', path: 'path',
};
const VAR_INIT = {
  counter: 0, temp: undefined, max: -Infinity, min: Infinity, sum: 0, slow: 0, winStart: 0, result: 0, flag: false,
  map: () => new Map(), set: () => new Set(), prevCurr: () => ({ prev: 0, curr: 1 }),
  stack: () => [], queue: () => [], visited: () => new Set(), dp: () => [], path: () => [],
};

const range = (a, b) => Array.from({ length: Math.max(0, b - a) }, (_, k) => a + k);
function fmtVal(v) {
  if (v instanceof Map) return '{' + [...v].map(([k, x]) => `${k}:${x}`).join(', ') + '}';
  if (v instanceof Set) return '{' + [...v].join(', ') + '}';
  if (Array.isArray(v)) return '[' + v.map(fmtVal).join(', ') + ']';
  if (v === Infinity) return '∞';
  if (v === -Infinity) return '-∞';
  if (v === undefined) return '–';
  if (v && typeof v === 'object') return Object.entries(v).map(([k, x]) => `${k} = ${fmtVal(x)}`).join(', ');
  return String(v);
}

function simulate(problem, loopId, chosen) {
  const s = SIMS[problem.id];
  const c = {
    s, loopId, chosen, arr: [...s.input], steps: [], val: {}, extra: {}, ptr: {}, fmt: { ...(s.fmt || {}) },
    done: false, brk: false, capped: false, touched: new Set(), warned: new Set(), flags: {}, pass: 1,
    noIndex: ['foreach', 'linkedList', 'prefix'].includes(loopId), start: s.start || 0,
    get n() { return this.arr.length; },
    has(v) { return chosen.has(v); },
    show(i) { const v = this.arr[i]; return v === null || v === undefined ? '·' : v; },
    push(kind, msg, hot) {
      const vars = {};
      for (const [k, v] of Object.entries(this.extra)) vars[k] = fmtVal(v);
      for (const [k, v] of Object.entries(this.val)) vars[CODE_NAME[k]] = this.fmt[k] ? this.fmt[k](v) : fmtVal(v);
      this.steps.push({ kind, msg, hot: hot || null, arr: this.arr.map((x) => (x === null ? '·' : x)), ptr: { ...this.ptr }, vars, cols: s.cols });
    },
    snap(kind, msg, hot) {
      if (this.steps.length >= MAX_STEPS) {
        if (!this.capped) { this.capped = true; this.done = true; this.push('end', `Stopped after ${MAX_STEPS} steps — this loop is doing a lot of work here.`); }
        return;
      }
      this.push(kind, msg, hot);
    },
    loop(msg) { this.snap('loop', msg); },
    note(msg) { this.snap('note', msg); },
    warn(msg, key = msg) { if (this.warned.has(key)) return; this.warned.add(key); this.snap('warn', msg); },
    upd(v, value, msg) {
      if (!this.has(v)) return false;
      this.val[v] = value; this.touched.add(v); this.snap('var', msg, CODE_NAME[v]); return true;
    },
    ptrVar(name, value, msg) { this.extra[name] = value; this.snap('var', msg, name); },
    touch(v) { this.touched.add(v); },
    answer(value, msg) {
      const ok = JSON.stringify(value) === JSON.stringify(s.expected);
      this.push('end', `${msg ? msg + ' → ' : ''}return ${fmtVal(value)}   ${ok ? '✓ matches the expected output' : '✗ expected ' + fmtVal(s.expected)}`);
      this.done = true;
    },
    stop(msg) { this.push('end', msg); this.done = true; },
    visit(i) { if (s.visit) s.visit(this, i); },
    pair(i, j) { if (s.pair) s.pair(this, i, j); else if (s.visit) { this.visit(i); if (!this.done) this.visit(j); } },
  };

  for (const v of chosen) {
    if (POINTER_VARS.includes(v)) continue;
    const init = s.init && v in s.init ? s.init[v] : VAR_INIT[v];
    c.val[v] = typeof init === 'function' ? init(c) : init;
  }
  const declared = [...chosen].map((v) => (POINTER_VARS.includes(v) ? VARS[v].decl.replace(/^let /, '').replace(/;.*/, '') : `${CODE_NAME[v]} = ${c.fmt[v] ? c.fmt[v](c.val[v]) : fmtVal(c.val[v])}`));
  c.push('note', declared.length ? `Declare: ${declared.join(';  ')}` : 'No variables declared — just the loop.');

  DRIVERS[loopId](c);

  if (!c.done) {
    const r = s.finish ? s.finish(c) : undefined;
    if (r === undefined) c.stop('Loop finished — no variable holds the answer.');
    else if (r && r.msg) c.stop(r.msg);
    else c.answer(r);
  }
  const unused = [...chosen].filter((v) => !c.touched.has(v));
  if (unused.length) c.push('note', `Declared but never used: ${unused.map((v) => VARS[v].name).join(', ')}`);
  return c.steps;
}

// ---------------------------------------------------------------------
// Loop drivers — move through the input the way each loop shape does.
// ---------------------------------------------------------------------
function passes(c, fn) {
  const k = c.s.passes || 1;
  for (let p = 1; p <= k && !c.done; p++) { c.pass = p; fn(k > 1 ? `pass ${p}: ` : ''); }
}

function treeWalk(c, kind) {
  const s = c.s, store = kind === 'bfs' ? 'queue' : 'stack', NAME = kind.toUpperCase();
  const add = kind === 'bfs' ? 'enqueue' : 'push', take = kind === 'bfs' ? 'shift' : 'pop';
  if (!s.tree) {
    c.warn(`This input isn't a tree or graph — ${NAME} has no neighbours to follow, so it just visits elements in order.`);
    return DRIVERS.single(c);
  }
  if (!c.has(store)) return c.warn(`No ${store} declared — ${NAME} can't remember which nodes to visit next.`);
  const q = c.val[store];
  c.fmt[store] = (items) => '[' + items.map(([n, p]) => (p === undefined ? c.show(n) : `${c.show(n)}(${p})`)).join(', ') + ']';
  const kids = (n) => [2 * n + 1, 2 * n + 2].filter((k) => k < c.n && c.arr[k] !== null);
  const carry = (p, k) => (s.carry ? s.carry(c, p, k) : undefined);
  q.push([0, carry(null, 0)]);
  c.ptr = { node: 0 };
  c.upd(store, q, `${add} the root`);
  const visitNode = ([n, p]) => {
    c.ptr = { node: n };
    c.loop(`${take} node ${c.show(n)}${p !== undefined ? ` (carrying ${p})` : ''}`);
    if (s.visitNode) s.visitNode(c, n, p);
    if (c.done) return;
    const ks = kids(n);
    if (!ks.length) { if (s.leaf) s.leaf(c, n, p); return; }
    for (const k of kind === 'dfs' ? [...ks].reverse() : ks) q.push([k, carry(p, k)]);
    c.upd(store, q, `${add} children ${ks.map((k) => c.show(k)).join(', ')}`);
  };
  while (q.length && !c.done) {
    if (kind === 'bfs') {
      const size = q.length;
      for (let k = 0; k < size && !c.done; k++) visitNode(q.shift());
      if (!c.done && s.level) s.level(c);
    } else visitNode(q.pop());
  }
}

const DRIVERS = {
  single(c) {
    passes(c, (p) => {
      for (let i = c.start; i < c.n && !c.done; i++) { c.ptr = { i }; c.loop(`${p}i = ${i} → arr[${i}] = ${c.show(i)}`); c.visit(i); }
    });
  },
  foreach(c) {
    passes(c, (p) => {
      for (let i = c.start; i < c.n && !c.done; i++) { c.ptr = { x: i }; c.loop(`${p}x = ${c.show(i)}`); c.visit(i); }
    });
  },
  reverse(c) {
    passes(c, (p) => {
      for (let i = c.n - 1; i >= c.start && !c.done; i--) { c.ptr = { i }; c.loop(`${p}i = ${i} → arr[${i}] = ${c.show(i)}`); c.visit(i); }
    });
  },
  whileCond(c) {
    if (c.s.number != null) {
      let n = c.s.number;
      while (n > 0 && !c.done) {
        c.arr = [...String(n)].map(Number); c.extra.n = n; c.ptr = { last: c.n - 1 };
        c.loop(`n = ${n} > 0 → keep going; last digit = ${n % 10}`);
        c.visit(c.n - 1);
        n = Math.floor(n / 10);
        if (!c.done) c.ptrVar('n', n, `shrink n → ⌊n / 10⌋ = ${n}`);
      }
      c.arr = []; c.ptr = {};
      if (!c.done) c.loop('n = 0 → loop ends');
      return;
    }
    passes(c, (p) => {
      let i = c.start;
      while (i < c.n && !c.done) { c.ptr = { i }; c.loop(`${p}while i < n: i = ${i} → ${c.show(i)}`); c.visit(i); i++; }
    });
  },
  twoPointer(c) {
    if (!c.has('lr')) return c.warn('No left/right pointers declared — `while (left < right)` has nothing to compare.');
    c.touch('lr');
    let l = 0, r = c.n - 1;
    while (l < r && !c.done) {
      c.extra.left = l; c.extra.right = r; c.ptr = { left: l, right: r };
      c.loop(`left = ${l}, right = ${r} → look at ${c.show(l)} and ${c.show(r)}`);
      c.pair(l, r);
      if (c.done) break;
      const m = c.s.move ? c.s.move(c, l, r) : 'both';
      if (m === 'left' || m === 'both') l++;
      if (m === 'right' || m === 'both') r--;
    }
    if (!c.done) { c.extra.left = l; c.extra.right = r; c.ptr = {}; c.loop(`left (${l}) ≥ right (${r}) → loop ends`); }
  },
  fastSlow(c) {
    const hs = c.has('slow');
    let slow = 0;
    if (!hs) c.warn('No slow pointer declared — kept values have nowhere to be written.');
    for (let f = 1; f < c.n && !c.done; f++) {
      c.ptr = hs ? { slow, fast: f } : { fast: f };
      c.loop(`fast = ${f} → ${c.show(f)}`);
      if (hs) {
        const keep = c.s.keep ? c.s.keep(c, slow, f) : c.arr[f] !== c.arr[slow];
        if (keep) { slow++; c.arr[slow] = c.arr[f]; c.ptr = { slow, fast: f }; c.upd('slow', slow, `keep ${c.show(f)} → slow = ${slow}, write it there`); }
        else c.note(`${c.show(f)} is not kept → slow stays at ${slow}`);
      }
      c.visit(f);
    }
  },
  sliding(c) {
    const s = c.s, hw = c.has('winStart');
    let left = 0;
    for (let r = 0; r < c.n && !c.done; r++) {
      c.ptr = { left, right: r };
      c.loop(`right = ${r} → window [${left}..${r}] = ${c.arr.slice(left, r + 1).join(' ')}`);
      if (s.enter) s.enter(c, r); else c.visit(r);
      while (!c.done && left <= r && (s.shrink ? s.shrink(c, left, r) : s.k && r - left + 1 > s.k)) {
        if (!hw && !s.k) { c.warn('The window should shrink here, but there is no window start to move.', 'nowin'); break; }
        if (s.leave) s.leave(c, left);
        left++; c.ptr = { left, right: r };
        if (hw) c.upd('winStart', left, `shrink → left = ${left}`); else c.note(`shrink → window starts at right - k + 1 = ${left}`);
      }
      if (!c.done && s.after) s.after(c, left, r);
    }
  },
  nested(c) {
    const s = c.s, cfg = s.nested || {};
    if (s.grid) return DRIVERS.grid(c);
    const outerEnd = cfg.outer ? cfg.outer(c) : c.n;
    for (let i = 0; i < outerEnd && !c.done; i++) {
      c.ptr = cfg.ptr ? {} : { i };
      c.loop(cfg.label ? cfg.label(c, i) : `outer i = ${i} → ${c.show(i)}`);
      if (cfg.start) cfg.start(c, i);
      for (const j of cfg.inner ? cfg.inner(c, i) : range(i + 1, c.n)) {
        if (c.done || c.brk) break;
        c.ptr = cfg.ptr ? cfg.ptr(i, j) : { i, j };
        c.loop(cfg.innerLabel ? cfg.innerLabel(c, i, j) : `  inner j = ${j} → ${c.show(j)}`);
        (cfg.pair || ((cc, a, b) => cc.pair(a, b)))(c, i, j);
      }
      c.brk = false;
      if (!c.done && cfg.end) cfg.end(c, i);
    }
  },
  binary(c) {
    if (!c.has('bounds')) return c.warn('No lo / hi bounds declared — there is no range to search.');
    const t = c.s.target;
    if (t == null) return c.warn("Binary search needs a single target value to compare with — this problem doesn't have one.");
    c.touch('bounds');
    let lo = 0, hi = c.n - 1;
    while (lo <= hi && !c.done) {
      const mid = (lo + hi) >> 1;
      Object.assign(c.extra, { lo, hi, mid }); c.ptr = { lo, mid, hi };
      c.loop(`lo = ${lo}, hi = ${hi} → mid = ${mid} (${c.show(mid)})`);
      const v = c.arr[mid];
      if (v === t) return c.answer(mid, `arr[mid] = ${t}`);
      if (v < t) { lo = mid + 1; c.ptrVar('lo', lo, `${v} < ${t} → search right: lo = ${lo}`); }
      else { hi = mid - 1; c.ptrVar('hi', hi, `${v} > ${t} → search left: hi = ${hi}`); }
    }
    c.note(`lo > hi → ${t} not found${c.s.sorted ? '' : " (the array isn't sorted, so halving can skip values)"}`);
  },
  linkedList(c) {
    for (let i = 0; i < c.n && !c.done; i++) {
      c.ptr = { curr: i };
      c.loop(i === 0 ? `curr = head → ${c.show(i)}` : `curr = curr.next → ${c.show(i)}`);
      c.visit(i);
    }
    if (!c.done) { c.ptr = {}; c.loop('curr = null → loop ends'); }
  },
  twoArrays(c) {
    const a = c.s.input, b = c.s.input2;
    if (!b) return c.warn('This problem has a single input — a merge walk needs two sorted sequences.');
    if (!c.has('ij')) return c.warn('No i & j pointers declared — nothing tracks your place in each array.');
    c.touch('ij');
    c.arr = [...a, '|', ...b];
    let i = 0, j = 0;
    const P = () => ({ ...(i < a.length ? { i } : {}), ...(j < b.length ? { j: a.length + 1 + j } : {}) });
    const take = (v) => (c.s.take ? c.s.take(c, v) : null);
    while (i < a.length && j < b.length && !c.done) {
      Object.assign(c.extra, { i, j }); c.ptr = P();
      c.loop(`compare a[${i}] = ${a[i]} with b[${j}] = ${b[j]}`);
      take(a[i] <= b[j] ? a[i++] : b[j++]);
    }
    while (i < a.length && !c.done) { c.extra.i = i; c.ptr = P(); c.loop(`b is used up → take a[${i}]`); take(a[i++]); }
    while (j < b.length && !c.done) { c.extra.j = j; c.ptr = P(); c.loop(`a is used up → take b[${j}]`); take(b[j++]); }
  },
  monoStack(c) {
    const hs = c.has('stack');
    if (!hs) c.warn('No stack declared — nothing remembers earlier elements that are still waiting for an answer.');
    else c.fmt.stack = (st) => '[' + st.map((k) => c.show(k)).join(', ') + ']';
    for (let i = 0; i < c.n && !c.done; i++) {
      c.ptr = { i };
      c.loop(`i = ${i} → ${c.show(i)}`);
      if (hs) {
        const st = c.val.stack;
        while (st.length && !c.done && (c.s.pops ? c.s.pops(c, st.at(-1), i) : c.arr[i] > c.arr[st.at(-1)])) {
          const top = st.pop();
          c.ptr = { i, top };
          c.upd('stack', st, `${c.show(i)} > ${c.show(top)} → pop index ${top}`);
          if (c.s.resolve) c.s.resolve(c, top, i);
        }
        st.push(i);
        c.ptr = { i };
        c.upd('stack', st, `push index ${i} (${c.show(i)}) — waiting for an answer`);
      }
      c.visit(i);
    }
  },
  bfs(c) { treeWalk(c, 'bfs'); },
  dfs(c) { treeWalk(c, 'dfs'); },
  grid(c) {
    const s = c.s;
    if (!s.grid) { c.warn('This input is 1-D — a grid scan here is just a single loop.'); return DRIVERS.single(c); }
    for (let r = 0; r < s.rows && !c.done; r++) {
      for (let col = 0; col < s.cols && !c.done; col++) {
        const idx = r * s.cols + col;
        c.ptr = { scan: idx };
        c.loop(`(r, c) = (${r}, ${col}) → ${c.show(idx)}`);
        s.cell(c, r, col, idx);
      }
    }
  },
  dp(c) {
    if (!c.has('dp')) c.warn('No dp array declared — answers to smaller subproblems are not stored anywhere.');
    for (let i = c.start; i < c.n && !c.done; i++) { c.ptr = { i }; c.loop(`i = ${i} → work out the answer up to ${c.show(i)}`); c.visit(i); }
  },
  prefix(c) {
    for (let i = c.start; i < c.n && !c.done; i++) { c.ptr = { x: i }; c.loop(`x = ${c.show(i)}`); c.visit(i); }
  },
  backtrack(c) {
    const hasPath = c.has('path');
    if (!hasPath) c.warn('No path declared — nothing records the choices made so far.');
    const path = hasPath ? c.val.path : [];
    const bt = (start) => {
      if (c.done) return;
      if (c.s.record) c.s.record(c, path);
      for (let i = start; i < c.n && !c.done; i++) {
        c.ptr = { i };
        c.loop(`choose ${c.show(i)}`);
        path.push(c.arr[i]);
        if (hasPath) c.upd('path', path, `path = ${fmtVal(path)}`);
        bt(i + 1);
        path.pop();
        if (hasPath && !c.done) c.upd('path', path, `undo ${c.show(i)} → path = ${fmtVal(path)}`);
      }
    };
    bt(0);
  },
};

// ---------------------------------------------------------------------
// Per-problem behaviour: what each variable does when the loop reaches
// an element. Only variables the learner chose are ever updated.
// ---------------------------------------------------------------------
function swap(c, a, b) {
  const A = c.arr[a];
  if (c.has('temp')) {
    c.upd('temp', A, `temp = arr[${a}] = ${A}`);
    c.arr[a] = c.arr[b]; c.arr[b] = c.val.temp;
    c.note(`arr[${a}] = arr[${b}], arr[${b}] = temp → swapped ${A} ↔ ${c.arr[a]}`);
  } else {
    c.arr[a] = c.arr[b]; c.arr[b] = c.arr[a];
    c.note(`arr[${a}] = arr[${b}] overwrites ${A} before it is saved → both are now ${c.arr[a]}`);
  }
}

const TWO_SUM = {
  visit(c, i) {
    const x = c.arr[i], t = c.s.target, need = t - x, idx = c.noIndex ? '?' : i;
    if (c.has('map')) {
      const m = c.val.map;
      if (m.has(need)) return c.answer([m.get(need), idx], `${need} was stored at index ${m.get(need)}`);
      m.set(x, idx);
      return c.upd('map', m, `need ${need} not seen yet → store ${x} → ${c.noIndex ? '? (for-each has no index)' : i}`);
    }
    if (c.has('set')) {
      const st = c.val.set;
      if (st.has(need)) c.note(`${need} was seen before — but a set doesn't remember its index`);
      st.add(x);
      return c.upd('set', st, `add ${x}`);
    }
    c.note(`x = ${x}, need ${need} — nothing remembers earlier numbers to check against`);
  },
  pair(c, i, j) {
    const sum = c.arr[i] + c.arr[j], t = c.s.target;
    if (!c.upd('sum', sum, `sum = ${c.arr[i]} + ${c.arr[j]} = ${sum}`)) c.note(`${c.arr[i]} + ${c.arr[j]} = ${sum}`);
    if (sum === t) c.answer([i, j], `${sum} = target`);
  },
  move: (c, l, r) => (c.arr[l] + c.arr[r] < c.s.target ? 'left' : 'right'),
  finish: () => ({ msg: 'Loop finished without finding a pair ✗' }),
};

const vowel = (ch) => 'aeiou'.includes(ch);

const SIMS = {
  'count-vowels': {
    input: [...'algorithm'], expected: 3,
    visit(c, i) {
      const ch = c.arr[i];
      if (!vowel(ch)) return c.note(`'${ch}' is not a vowel`);
      if (!c.upd('counter', c.val.counter + 1, `'${ch}' is a vowel → count = ${c.val.counter + 1}`)) c.note(`'${ch}' is a vowel — but nothing is tallying it`);
    },
    finish: (c) => (c.has('counter') ? c.val.counter : undefined),
  },

  'find-max': {
    input: [3, 7, 2, 9, 4], expected: 9,
    visit(c, i) {
      const x = c.arr[i];
      if (!c.has('max')) return c.note(`see ${x} — nothing remembers the biggest so far`);
      if (x > c.val.max) c.upd('max', x, `${x} > max → max = ${x}`);
      else c.note(`${x} ≤ max (${c.val.max}) → keep`);
    },
    finish: (c) => (c.has('max') ? c.val.max : undefined),
  },

  'reverse-array': {
    input: [1, 2, 3, 4, 5, 6], expected: [6, 5, 4, 3, 2, 1],
    visit(c, i) {
      if (c.noIndex) return c.note(`x = ${c.arr[i]} — without an index you can't tell where to swap it`);
      const j = c.n - 1 - i;
      if (i === j) return c.note('middle element stays put');
      if (i > j) return c.answer([...c.arr], 'i passed the middle — stop here (loop while i < n / 2), otherwise every swap would undo an earlier one');
      swap(c, i, j);
    },
    pair: (c, l, r) => swap(c, l, r),
    finish: (c) => [...c.arr],
  },

  'two-sum': { input: [3, 4, 2, 6, 9], target: 8, expected: [2, 3], ...TWO_SUM },

  'contains-duplicate': {
    input: [4, 1, 3, 1, 5], expected: true,
    visit(c, i) {
      const x = c.arr[i], store = c.has('set') ? 'set' : c.has('map') ? 'map' : null;
      if (!store) return c.note(`see ${x} — nothing remembers earlier values`);
      const S = c.val[store];
      if (S.has(x)) return c.answer(true, `${x} was already seen`);
      store === 'set' ? S.add(x) : S.set(x, 1);
      c.upd(store, S, `remember ${x}`);
    },
    pair(c, i, j) { if (c.arr[i] === c.arr[j]) c.answer(true, `${c.arr[i]} == ${c.arr[j]}`); else c.note(`${c.arr[i]} ≠ ${c.arr[j]}`); },
    finish: (c) => (c.has('set') || c.has('map') ? false : undefined),
  },

  stock: {
    input: [7, 1, 5, 3, 6, 4], expected: 5, init: { max: 0 },
    visit(c, i) {
      const p = c.arr[i];
      if (!c.has('min') && !c.has('max')) return c.note(`price ${p} — nothing remembers anything between days`);
      if (c.has('min')) { if (p < c.val.min) c.upd('min', p, `${p} is the cheapest so far → min = ${p}`); else c.note(`${p} ≥ cheapest (${c.val.min})`); }
      if (!c.has('max')) return;
      if (!c.has('min')) return c.note("can't work out today's profit — nothing remembers the cheapest price so far");
      const prof = p - c.val.min;
      if (prof > c.val.max) c.upd('max', prof, `sell today: ${p} - ${c.val.min} = ${prof} → max = ${prof}`);
      else c.note(`sell today: profit ${prof} ≤ best (${c.val.max})`);
    },
    pair(c, i, j) {
      const prof = c.arr[j] - c.arr[i];
      if (!c.has('max')) return c.note(`buy ${c.arr[i]}, sell ${c.arr[j]} → ${prof} — nothing remembers the best`);
      if (prof > c.val.max) c.upd('max', prof, `buy ${c.arr[i]}, sell ${c.arr[j]} → profit ${prof} → max = ${prof}`);
    },
    finish: (c) => (c.has('max') ? c.val.max : undefined),
  },

  'valid-palindrome': {
    input: [...'racecar'], expected: true,
    pair(c, l, r) {
      c.flags.compared = true;
      if (c.arr[l] === c.arr[r]) c.note(`'${c.arr[l]}' == '${c.arr[r]}'`);
      else c.answer(false, `'${c.arr[l]}' ≠ '${c.arr[r]}'`);
    },
    visit(c, i) {
      if (c.noIndex) return c.note(`'${c.arr[i]}' — without an index you can't find its mirror character`);
      c.s.pair(c, i, c.n - 1 - i);
    },
    finish: (c) => (c.flags.compared ? true : undefined),
  },

  'remove-duplicates': {
    input: [1, 1, 2, 3, 3, 3, 4], expected: 4,
    visit(c, i) {
      if (c.loopId === 'fastSlow') return;
      const dup = i > 0 && c.arr[i] === c.arr[i - 1];
      if (dup) return c.note(`${c.arr[i]} is a duplicate`);
      if (!c.upd('counter', c.val.counter + 1, `${c.arr[i]} is new → count = ${c.val.counter + 1}`)) c.note(`${c.arr[i]} is new — but nothing records it`);
    },
    finish(c) {
      if (c.loopId === 'fastSlow' && c.has('slow')) return c.val.slow + 1;
      if (c.has('counter')) { c.note('Counted the unique values, but the array itself was never compacted in place.'); return c.val.counter; }
      return undefined;
    },
  },

  'reverse-integer': {
    input: [1, 2, 3, 4], number: 1234, expected: 4321,
    visit(c, i) {
      const d = Number(c.arr[i]);
      c.upd('temp', d, `temp = digit ${d}`);
      if (c.has('result')) c.upd('result', c.val.result * 10 + d, `result = ${c.val.result} × 10 + ${d} = ${c.val.result * 10 + d}`);
      else c.note(`digit ${d} — nothing is building up the reversed number`);
    },
    finish: (c) => (c.has('result') ? c.val.result : undefined),
  },

  fibonacci: {
    input: [0, 1, '?', '?', '?', '?', '?', '?'], start: 2, expected: 13,
    visit(c, i) {
      if (!c.has('prevCurr')) return c.note(`F(${i}) = F(${i - 1}) + F(${i - 2}) — but nothing remembers the last two values`);
      const { prev, curr } = c.val.prevCurr, next = prev + curr;
      c.upd('temp', next, `temp = prev + curr = ${prev} + ${curr} = ${next}`);
      c.arr[i] = next;
      c.upd('prevCurr', { prev: curr, curr: next }, `shift: prev = ${curr}, curr = ${next}`);
    },
    finish: (c) => (c.has('prevCurr') ? c.val.prevCurr.curr : undefined),
  },

  'first-unique': {
    input: [...'loveleet'], passes: 2, expected: 1,
    visit(c, i) {
      const ch = c.arr[i];
      if (!c.has('map')) return c.note(`'${ch}' — nothing is counting characters`);
      const m = c.val.map;
      if (c.pass === 1) { m.set(ch, (m.get(ch) || 0) + 1); return c.upd('map', m, `count '${ch}' → ${m.get(ch)}`); }
      if (m.get(ch) !== 1) return c.note(`'${ch}' appears ${m.get(ch)}× → skip`);
      if (c.noIndex) return c.stop(`'${ch}' is unique — but for-each has no index to return ✗`);
      c.answer(i, `'${ch}' appears once`);
    },
    nested: {
      inner: (c) => range(0, c.n),
      start(c) { c.flags.dup = false; },
      pair(c, i, j) {
        if (i === j || c.arr[i] !== c.arr[j]) return;
        c.flags.dup = true; c.brk = true;
        if (!c.upd('counter', 2, `'${c.arr[i]}' also at index ${j} → count = 2`)) c.note(`'${c.arr[i]}' also appears at index ${j}`);
      },
      end(c, i) { if (!c.flags.dup) c.answer(i, `'${c.arr[i]}' never repeats`); },
    },
    finish: () => ({ msg: 'Loop finished — no unique character found ✗' }),
  },

  'binary-search': {
    input: [1, 3, 5, 7, 9, 11, 13], target: 9, sorted: true, expected: 4,
    visit(c, i) {
      if (c.arr[i] === 9) return c.noIndex ? c.stop('found 9 — but for-each has no index to return ✗') : c.answer(i, 'found 9');
      c.note(`${c.arr[i]} ≠ 9`);
    },
    finish: () => ({ msg: 'Loop finished — 9 not found ✗' }),
  },

  'two-sum-sorted': { input: [1, 3, 4, 6, 8, 11], target: 10, sorted: true, expected: [2, 3], ...TWO_SUM },

  'max-sum-k': {
    input: [2, 1, 5, 1, 3, 2], k: 3, expected: 9,
    enter(c, r) {
      const x = c.arr[r];
      if (!c.upd('sum', c.val.sum + x, `${x} enters → sum = ${c.val.sum + x}`)) c.note(`${x} enters the window — nothing keeps a running total`);
    },
    leave(c, l) { const x = c.arr[l]; c.upd('sum', c.val.sum - x, `${x} leaves → sum = ${c.val.sum - x}`); },
    after(c, l, r) {
      if (r - l + 1 < c.s.k) return c.note('window not full yet');
      if (!c.has('max')) return c.note('window is full — nothing remembers the best sum');
      if (!c.has('sum')) return c.note("window is full — but there's no sum to compare");
      if (c.val.sum > c.val.max) c.upd('max', c.val.sum, `window sum ${c.val.sum} > max → max = ${c.val.sum}`);
      else c.note(`window sum ${c.val.sum} ≤ max (${c.val.max})`);
    },
    visit(c, i) {
      const x = c.arr[i];
      if (!c.upd('sum', c.val.sum + x, `sum += ${x} → ${c.val.sum + x} (every element so far, not a window)`)) return c.note(`see ${x}`);
      if (c.has('max') && c.val.sum > c.val.max) c.upd('max', c.val.sum, `max = ${c.val.sum}`);
    },
    nested: {
      outer: (c) => c.n - c.s.k + 1,
      inner: (c, i) => range(i, i + c.s.k),
      start(c, i) { c.upd('sum', 0, `new window at ${i} → sum = 0`); },
      pair(c, i, j) { if (!c.upd('sum', c.val.sum + c.arr[j], `sum += ${c.arr[j]} → ${c.val.sum + c.arr[j]}`)) c.note(`add ${c.arr[j]} — nothing keeps the total`); },
      end(c) {
        if (c.has('max') && c.has('sum') && c.val.sum > c.val.max) c.upd('max', c.val.sum, `window sum ${c.val.sum} → max = ${c.val.sum}`);
        else if (!c.has('max')) c.note('window done — nothing remembers the best sum');
      },
    },
    finish: (c) => (c.has('max') ? c.val.max : undefined),
  },

  'longest-substring': {
    input: [...'abcabcbb'], expected: 3, init: { max: 0 },
    store: (c) => (c.has('set') ? 'set' : c.has('map') ? 'map' : null),
    enter(c, r) { if (!c.s.store(c)) c.note(`'${c.arr[r]}' enters — nothing remembers which characters are in the window`); },
    shrink(c, l, r) { const st = c.s.store(c); return !!st && c.val[st].has(c.arr[r]); },
    leave(c, l) { const st = c.s.store(c); c.val[st].delete(c.arr[l]); c.upd(st, c.val[st], `'${c.arr[l]}' leaves the window`); },
    after(c, l, r) {
      const st = c.s.store(c), ch = c.arr[r];
      if (st) { st === 'set' ? c.val.set.add(ch) : c.val.map.set(ch, r); c.upd(st, c.val[st], `add '${ch}'`); }
      const len = r - l + 1;
      if (!c.has('max')) return c.note(`window length ${len} — nothing remembers the longest`);
      if (len > c.val.max) c.upd('max', len, `window length ${len} → max = ${len}`);
      else c.note(`window length ${len} ≤ max (${c.val.max})`);
    },
    visit(c, i) {
      const st = c.s.store(c), ch = c.arr[i];
      if (!st) return c.note(`'${ch}' — nothing remembers earlier characters`);
      if (c.val[st].has(ch)) return c.note(`'${ch}' repeats — but a single pass can't drop characters from the front`);
      st === 'set' ? c.val.set.add(ch) : c.val.map.set(ch, i);
      c.upd(st, c.val[st], `add '${ch}'`);
    },
    nested: {
      inner: (c, i) => range(i, c.n),
      start(c) { const st = c.s.store(c); if (st) { c.val[st].clear(); c.upd(st, c.val[st], 'new start → clear'); } },
      pair(c, i, j) {
        const st = c.s.store(c), ch = c.arr[j];
        if (!st) return c.note(`'${ch}' — nothing remembers the characters in this substring`);
        if (c.val[st].has(ch)) { c.brk = true; return c.note(`'${ch}' repeats → stop this start`); }
        st === 'set' ? c.val.set.add(ch) : c.val.map.set(ch, j);
        c.upd(st, c.val[st], `add '${ch}'`);
        if (c.has('max') && j - i + 1 > c.val.max) c.upd('max', j - i + 1, `length ${j - i + 1} → max = ${j - i + 1}`);
      },
    },
    finish: (c) => (c.has('max') ? c.val.max : undefined),
  },

  'bubble-sort': {
    input: [5, 3, 8, 1, 4], expected: [1, 3, 4, 5, 8],
    visit(c, i) {
      if (c.noIndex || i >= c.n - 1) return;
      if (c.arr[i] > c.arr[i + 1]) swap(c, i, i + 1); else c.note(`${c.arr[i]} ≤ ${c.arr[i + 1]} → ok`);
    },
    nested: {
      outer: (c) => c.n - 1,
      inner: (c, i) => range(0, c.n - 1 - i),
      ptr: (i, j) => ({ j, 'j+1': j + 1 }),
      label: (c, i) => `pass ${i + 1}`,
      innerLabel: (c, i, j) => `  compare arr[${j}] = ${c.show(j)} and arr[${j + 1}] = ${c.show(j + 1)}`,
      start(c, i) { if (c.has('flag')) c.upd('flag', false, `pass ${i + 1}: swapped = false`); },
      pair(c, i, j) {
        if (c.arr[j] <= c.arr[j + 1]) return c.note('in order → ok');
        swap(c, j, j + 1);
        c.upd('flag', true, 'swapped = true');
      },
      end(c, i) { if (c.has('flag') && !c.val.flag) c.answer([...c.arr], `no swaps in pass ${i + 1} → already sorted, break early`); },
    },
    finish: (c) => [...c.arr],
  },

  'merge-sorted': {
    input: [1, 3, 5, 7], input2: [2, 4, 6], expected: [1, 2, 3, 4, 5, 6, 7], init: { result: () => [] },
    take(c, v) {
      if (!c.has('result')) return c.note(`take ${v} — but there's nowhere to put it`);
      c.val.result.push(v);
      c.upd('result', c.val.result, `result.push(${v})`);
    },
    visit(c, i) { c.s.take(c, c.arr[i]); },
    finish: (c) => (c.has('result') ? [...c.val.result] : undefined),
  },

  'reverse-linked-list': {
    input: [1, 2, 3, 4], expected: [4, 3, 2, 1], init: { prevCurr: () => ({ prev: 'null', curr: 1 }) },
    visit(c, i) {
      const x = c.arr[i], nx = i + 1 < c.n ? c.arr[i + 1] : 'null';
      if (!c.has('prevCurr')) return c.note(`at node ${x} — nothing remembers the previous node to point back to`);
      if (!c.has('temp') && nx !== 'null') return c.stop(`curr.next = prev overwrites the link to ${nx} before it's saved → the rest of the list is lost ✗`);
      c.upd('temp', nx, `temp = curr.next = ${nx}`);
      c.note(`curr.next = prev → ${x} now points to ${c.val.prevCurr.prev}`);
      c.flags.rev = [x, ...(c.flags.rev || [])];
      c.upd('prevCurr', { prev: x, curr: nx }, `move forward: prev = ${x}, curr = ${nx}`);
    },
    finish: (c) => c.flags.rev,
  },

  'daily-temperatures': {
    input: [73, 74, 75, 71, 69, 72, 76, 73], expected: [1, 1, 4, 2, 1, 1, 0, 0],
    init: { result: (c) => Array(c.n).fill(0) },
    resolve(c, top, i) {
      if (!c.has('result')) return c.note(`day ${top} waited ${i - top} day(s) — but nowhere to store it`);
      c.val.result[top] = i - top;
      c.upd('result', c.val.result, `result[${top}] = ${i} - ${top} = ${i - top}`);
    },
    nested: {
      pair(c, i, j) { if (c.arr[j] > c.arr[i]) { c.s.resolve(c, i, j); c.brk = true; } },
    },
    finish: (c) => (c.has('result') ? [...c.val.result] : undefined),
  },

  'max-depth-tree': {
    input: [3, 9, 20, null, null, 15, 7], tree: true, expected: 3, init: { max: 0 },
    carry: (c, p) => (p == null ? 1 : p + 1),
    visitNode(c, n, d) { if (c.has('max') && d > c.val.max) c.upd('max', d, `depth ${d} > max → max = ${d}`); },
    level(c) { if (!c.upd('counter', c.val.counter + 1, `level finished → count = ${c.val.counter + 1}`)) c.note('level finished — but nothing counts levels'); },
    visit(c) { c.warn('Scanning the array visits every node, but nothing here tells you which level a node is on.'); },
    finish: (c) => (c.has('counter') ? c.val.counter : c.has('max') ? c.val.max : undefined),
  },

  'path-sum': {
    input: [5, 4, 8, 11, null, 13, 4, 7, 2], tree: true, target: 22, expected: true,
    carry: (c, p, k) => (p ?? 0) + c.arr[k],
    visitNode(c, n, p) { c.upd('sum', p, `sum along this path = ${p}`); },
    leaf(c, n, p) {
      c.flags.leaf = true;
      if (p === 22) c.answer(true, `leaf ${c.show(n)}: path sum ${p} = 22`);
      else c.note(`leaf ${c.show(n)}: path sum ${p} ≠ 22 → back up`);
    },
    visit(c) { c.warn("Scanning the array doesn't follow root-to-leaf paths, so path sums are never formed."); },
    finish: (c) => (c.flags.leaf ? false : undefined),
  },

  islands: {
    input: [...'11000110010010100011'], grid: true, rows: 4, cols: 5, expected: 3,
    fmt: { visited: (v) => `${v.size} cells` },
    cell(c, r, col, idx) {
      const s = c.s;
      if (c.arr[idx] === '0') return;
      if (c.has('visited') && c.val.visited.has(idx)) return c.note(`(${r}, ${col}) already belongs to island ${c.arr[idx]}`);
      if (!c.has('visited')) {
        c.warn('Nothing records which land was already explored, so every land cell looks like a new island.');
        if (!c.upd('counter', c.val.counter + 1, `land → count = ${c.val.counter + 1}`)) c.note('land — but nothing counts islands');
        return;
      }
      const k = c.has('counter') ? c.val.counter + 1 : '?';
      if (!c.upd('counter', k, `new land → count = ${k}, now explore its neighbours`)) c.note('new land — but nothing counts islands');
      const st = [[r, col]], V = c.val.visited;
      while (st.length) {
        const [x, y] = st.pop();
        if (x < 0 || y < 0 || x >= s.rows || y >= s.cols) continue;
        const id = x * s.cols + y;
        if (s.input[id] !== '1' || V.has(id)) continue;
        V.add(id); c.arr[id] = '#' + k; c.ptr = { scan: idx, fill: id };
        c.upd('visited', V, `mark (${x}, ${y}) as visited`);
        st.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }
    },
    visit(c, i) { c.s.cell(c, Math.floor(i / c.s.cols), i % c.s.cols, i); },
    finish: (c) => (c.has('counter') ? c.val.counter : undefined),
  },

  'house-robber': {
    input: [2, 7, 9, 3, 1], expected: 12, init: { prevCurr: () => ({ prev: 0, curr: 0 }) },
    visit(c, i) {
      const x = c.arr[i];
      if (c.has('dp')) {
        const dp = c.val.dp;
        const skip = dp[i - 1] ?? 0, rob = (dp[i - 2] ?? 0) + x;
        dp[i] = Math.max(skip, rob);
        return c.upd('dp', dp, `dp[${i}] = max(skip = ${skip}, rob = ${rob}) = ${dp[i]}`);
      }
      if (c.has('prevCurr')) {
        const { prev, curr } = c.val.prevCurr, next = Math.max(curr, prev + x);
        return c.upd('prevCurr', { prev: curr, curr: next }, `best = max(skip ${curr}, rob ${prev} + ${x}) = ${next}`);
      }
      if (c.has('sum')) return c.upd('sum', c.val.sum + x, `sum += ${x} → ${c.val.sum + x} (robs every house, even neighbours)`);
      c.note(`house with ${x} — nothing remembers the best totals so far`);
    },
    finish: (c) => (c.has('dp') ? c.val.dp.at(-1) : c.has('prevCurr') ? c.val.prevCurr.curr : c.has('sum') ? c.val.sum : undefined),
  },

  'subarray-sum-k': {
    input: [1, 2, 3, -2, 2], goal: 3, expected: 4, init: { map: () => new Map([[0, 1]]) },
    visit(c, i) {
      const x = c.arr[i], k = c.s.goal;
      if (!c.upd('sum', c.val.sum + x, `sum += ${x} → prefix sum ${c.val.sum + x}`)) return c.note(`see ${x} — nothing keeps a running (prefix) sum`);
      if (c.has('map')) {
        const m = c.val.map, f = m.get(c.val.sum - k) || 0;
        if (!c.upd('counter', c.val.counter + f, `prefix ${c.val.sum - k} seen ${f}× → count = ${c.val.counter + f}`)) c.note(`prefix ${c.val.sum - k} seen ${f}× — but nothing counts matches`);
        m.set(c.val.sum, (m.get(c.val.sum) || 0) + 1);
        return c.upd('map', m, `remember prefix ${c.val.sum}`);
      }
      if (c.val.sum === k) c.upd('counter', c.val.counter + 1, `prefix sum = ${k} → count = ${c.val.counter + 1}`);
      else c.note(`prefix ${c.val.sum} ≠ ${k} (only subarrays starting at 0 are checked)`);
    },
    enter(c, r) { if (!c.upd('sum', c.val.sum + c.arr[r], `${c.arr[r]} enters → sum = ${c.val.sum + c.arr[r]}`)) c.note(`${c.arr[r]} enters — nothing keeps the window total`); },
    shrink: (c) => c.has('sum') && c.val.sum > c.s.goal,
    leave(c, l) { c.upd('sum', c.val.sum - c.arr[l], `${c.arr[l]} leaves → sum = ${c.val.sum - c.arr[l]}`); },
    after(c) { if (c.has('sum') && c.val.sum === c.s.goal) { if (!c.upd('counter', c.val.counter + 1, `window sums to ${c.s.goal} → count = ${c.val.counter + 1}`)) c.note('window matches — but nothing counts it'); } },
    nested: {
      inner: (c, i) => range(i, c.n),
      start(c, i) { c.upd('sum', 0, `start at ${i} → sum = 0`); },
      pair(c, i, j) {
        if (!c.upd('sum', c.val.sum + c.arr[j], `sum += ${c.arr[j]} → ${c.val.sum + c.arr[j]}`)) return c.note(`add ${c.arr[j]} — nothing keeps the total`);
        if (c.val.sum === c.s.goal && !c.upd('counter', c.val.counter + 1, `[${i}..${j}] sums to ${c.s.goal} → count = ${c.val.counter + 1}`)) c.note(`[${i}..${j}] matches — but nothing counts it`);
      },
    },
    finish: (c) => (c.has('counter') ? c.val.counter : undefined),
  },

  subsets: {
    input: [1, 2, 3], expected: [[], [1], [1, 2], [1, 2, 3], [1, 3], [2], [2, 3], [3]], init: { result: () => [] },
    record(c, path) {
      if (!c.has('result')) return c.note(`reached ${fmtVal(path)} — nowhere to collect it`);
      c.val.result.push([...path]);
      c.upd('result', c.val.result, `record ${fmtVal(path)}`);
    },
    visit(c) { c.warn('A straight pass sees each number once — it never builds combinations of them.'); },
    pair(c, i, j) {
      if (!c.has('result')) return c.note(`pair {${c.arr[i]}, ${c.arr[j]}}`);
      c.val.result.push([c.arr[i], c.arr[j]]);
      c.upd('result', c.val.result, `record [${c.arr[i]}, ${c.arr[j]}] (pairs only)`);
    },
    finish: (c) => (c.has('result') ? c.val.result.map((r) => [...r]) : undefined),
  },
};
