// =====================================================================
// Simulation rules for the problems in problems-more.js.
// =====================================================================
Object.assign(SIMS, {
  'max-subarray': {
    input: [-2, 1, -3, 4, -1, 2, 1, -5, 4], expected: 6, init: { sum: 0 },
    visit(c, i) {
      const x = c.arr[i];
      if (c.has('sum')) {
        const ext = c.val.sum + x, next = Math.max(x, ext);
        c.upd('sum', next, `sum = max(${x}, ${c.val.sum} + ${x}) = ${next}${ext < x ? ' (restart)' : ''}`);
        if (c.has('max')) { if (next > c.val.max) c.upd('max', next, `${next} > max → max = ${next}`); else c.note(`${next} ≤ max (${c.val.max})`); }
        else c.note('nothing remembers the best sum seen');
      } else if (c.has('max')) {
        if (x > c.val.max) c.upd('max', x, `max = ${x} (single elements only — no running sum)`); else c.note(`${x} ≤ max`);
      } else c.note(`see ${x} — nothing keeps a running sum`);
    },
    nested: {
      inner: (c, i) => range(i, c.n),
      start(c, i) { c.upd('sum', 0, `start at ${i} → sum = 0`); },
      pair(c, i, j) {
        if (!c.upd('sum', c.val.sum + c.arr[j], `sum += ${c.arr[j]} → ${c.val.sum + c.arr[j]}`)) return c.note(`add ${c.arr[j]} — nothing keeps the total`);
        if (c.has('max') && c.val.sum > c.val.max) c.upd('max', c.val.sum, `[${i}..${j}] = ${c.val.sum} → max = ${c.val.sum}`);
      },
    },
    finish: (c) => (c.has('max') ? c.val.max : undefined),
  },

  'single-number': {
    input: [4, 1, 2, 1, 2], expected: 4, init: { result: 0 },
    visit(c, i) {
      const x = c.arr[i];
      if (c.has('result')) { const nx = c.val.result ^ x; return c.upd('result', nx, `${c.val.result} ^ ${x} = ${nx}${nx === 0 ? ' (a pair cancelled out)' : ''}`); }
      if (c.has('set')) {
        const st = c.val.set;
        if (st.has(x)) { st.delete(x); return c.upd('set', st, `${x} seen again → remove it`); }
        st.add(x); return c.upd('set', st, `${x} is new → add it`);
      }
      c.note(`see ${x} — nothing tracks which numbers are unpaired`);
    },
    finish: (c) => (c.has('result') ? c.val.result : c.has('set') ? [...c.val.set][0] : undefined),
  },

  'missing-number': {
    input: [9, 6, 4, 2, 3, 5, 7, 0, 1], expected: 8, init: { sum: (c) => c.n },
    visit(c, i) {
      const x = c.arr[i];
      if (c.noIndex && c.has('sum') && !c.has('set')) return c.note(`x = ${x} — for-each has no index i to cancel it against`);
      if (c.has('sum') && !c.noIndex) return c.upd('sum', c.val.sum + i - x, `sum += ${i} - ${x} → ${c.val.sum + i - x}`);
      if (c.has('set')) { c.val.set.add(x); return c.upd('set', c.val.set, `add ${x}`); }
      c.note(`see ${x} — nothing remembers which numbers are present`);
    },
    finish(c) {
      if (c.has('sum') && !c.noIndex && !c.has('set')) return c.val.sum;
      if (c.has('set')) { for (let v = 0; v <= c.n; v++) if (!c.val.set.has(v)) return v; }
      return undefined;
    },
  },

  'valid-parentheses': {
    input: [...'([{}])[]'], expected: true,
    visit(c, i) {
      const ch = c.arr[i], close = { ')': '(', ']': '[', '}': '{' };
      if (!c.has('stack')) return c.note(`'${ch}' — nothing remembers which brackets are still open`);
      const st = c.val.stack;
      if (!close[ch]) { st.push(ch); return c.upd('stack', st, `'${ch}' opens → push`); }
      if (!st.length) return c.answer(false, `'${ch}' closes nothing`);
      const top = st.pop();
      if (top !== close[ch]) return c.answer(false, `'${ch}' doesn't match top '${top}'`);
      c.upd('stack', st, `'${ch}' matches '${top}' → pop`);
    },
    finish: (c) => (c.has('stack') ? c.val.stack.length === 0 : undefined),
  },

  'container-water': {
    input: [1, 8, 6, 2, 5, 4, 8, 3, 7], expected: 49,
    pair(c, l, r) {
      const area = Math.min(c.arr[l], c.arr[r]) * (r - l);
      if (!c.has('max')) return c.note(`area = min(${c.arr[l]}, ${c.arr[r]}) × ${r - l} = ${area} — nothing remembers the best`);
      if (area > c.val.max) c.upd('max', area, `area = min(${c.arr[l]}, ${c.arr[r]}) × ${r - l} = ${area} → max = ${area}`);
      else c.note(`area = ${area} ≤ max (${c.val.max})`);
    },
    move: (c, l, r) => (c.arr[l] < c.arr[r] ? 'left' : 'right'),
    visit(c) { c.warn('One wall at a time is not enough — the area depends on a pair of walls.'); },
    finish: (c) => (c.has('max') && c.flags.paired !== false && c.val.max > -Infinity ? c.val.max : undefined),
  },

  'longest-consecutive': {
    input: [100, 4, 200, 1, 3, 2], passes: 2, expected: 4, init: { max: 0 },
    visit(c, i) {
      const x = c.arr[i];
      if (!c.has('set')) return c.note(`see ${x} — nothing lets you ask "is ${x - 1} in the array?" instantly`);
      if (c.pass === 1) { c.val.set.add(x); return c.upd('set', c.val.set, `add ${x}`); }
      if (c.val.set.has(x - 1)) return c.note(`${x - 1} exists → ${x} is not the start of a run`);
      let len = 1; while (c.val.set.has(x + len)) len++;
      c.upd('counter', len, `${x} starts a run → length ${len}`);
      if (!c.has('max')) return c.note(`run of ${len} — nothing remembers the longest`);
      if (len > c.val.max) c.upd('max', len, `${len} > max → max = ${len}`); else c.note(`${len} ≤ max (${c.val.max})`);
    },
    nested: {
      inner: () => [],
      start(c, i) {
        const x = c.arr[i]; let len = 1; while (c.arr.includes(x + len)) len++;
        c.upd('counter', len, `scan the array for ${x + 1}, ${x + 2}, … → run of ${len} from ${x}`);
        if (c.has('max') && len > c.val.max) c.upd('max', len, `${len} > max → max = ${len}`);
        else if (!c.has('max')) c.note('nothing remembers the longest run');
      },
    },
    finish: (c) => (c.has('max') && (c.has('set') || c.loopId === 'nested') ? c.val.max : undefined),
  },

  'jump-game': {
    input: [2, 3, 1, 1, 4], expected: true, init: { max: 0 },
    visit(c, i) {
      if (c.noIndex) return c.note(`x = ${c.arr[i]} — you need the index i to compare with the farthest reach`);
      if (!c.has('max')) return c.note(`nums[${i}] = ${c.arr[i]} — nothing remembers how far you can reach`);
      if (i > c.val.max) return c.answer(false, `index ${i} is beyond the farthest reach (${c.val.max})`);
      const reach = Math.max(c.val.max, i + c.arr[i]);
      c.upd('max', reach, `reach from ${i} = ${i} + ${c.arr[i]} → max = ${reach}`);
      if (reach >= c.n - 1) c.answer(true, `max (${reach}) ≥ last index (${c.n - 1})`);
    },
    finish: (c) => (c.has('max') && !c.noIndex ? true : undefined),
  },

  'coin-change': {
    input: [0, ...Array(11).fill('?')], start: 1, expected: 3, coins: [1, 2, 5],
    init: { dp: () => [0, ...Array(11).fill(Infinity)] },
    visit(c, i) {
      if (!c.has('dp')) return c.note(`amount ${i} — nothing stores the answers for smaller amounts`);
      const usable = c.s.coins.filter((k) => i >= k), best = Math.min(...usable.map((k) => c.val.dp[i - k] + 1));
      c.val.dp[i] = best; c.arr[i] = best;
      c.upd('dp', c.val.dp, `dp[${i}] = min(${usable.map((k) => `dp[${i - k}]+1`).join(', ')}) = ${best}`);
    },
    finish: (c) => (c.has('dp') ? c.val.dp[11] : undefined),
  },

  lis: {
    input: [10, 9, 2, 5, 3, 7, 101, 18], expected: 4, start: 1,
    init: { dp: (c) => Array(c.n).fill(1) },
    visit(c, i) {
      if (!c.has('dp')) return c.note(`${c.arr[i]} — nothing stores the best subsequence ending at each position`);
      let best = 1;
      for (let j = 0; j < i; j++) if (c.arr[j] < c.arr[i]) best = Math.max(best, c.val.dp[j] + 1);
      c.val.dp[i] = best;
      c.upd('dp', c.val.dp, `dp[${i}] = 1 + best earlier dp with a smaller value → ${best}`);
    },
    finish: (c) => (c.has('dp') ? Math.max(...c.val.dp) : undefined),
  },
});
