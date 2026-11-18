// ---------- Loop patterns ----------
const LOOPS = {
  single: {
    name: 'Indexed for loop',
    sig: 'for (let i = 0; i < n; i++)',
    when: 'Single pass where you need the index (position) of each element.',
    signals: ['"return the indices"', 'look at each element once', 'build answer while scanning'],
    code: 'for (let i = 0; i < arr.length; i++) {\n  // use arr[i] and i\n}',
  },
  foreach: {
    name: 'For-each loop',
    sig: 'for (const x of arr)',
    when: 'Single pass where you only need the value, never the index.',
    signals: ['count / sum / check every element', 'index is irrelevant'],
    code: 'for (const x of arr) {\n  // use x\n}',
  },
  reverse: {
    name: 'Reverse for loop',
    sig: 'for (let i = n - 1; i >= 0; i--)',
    when: 'Process from the end — e.g. build output right-to-left, or remove while iterating.',
    signals: ['"from the right"', 'deleting while iterating', 'suffix values'],
    code: 'for (let i = arr.length - 1; i >= 0; i--) {\n  // use arr[i]\n}',
  },
  twoPointer: {
    name: 'Two pointers (opposite ends)',
    sig: 'while (left < right)',
    when: 'Sorted array or symmetric check; move pointers inward from both ends.',
    signals: ['sorted array + pair/target', 'palindrome', 'reverse in place', 'container / area'],
    code: 'while (left < right) {\n  // compare arr[left] and arr[right]\n  // then left++ and/or right--\n}',
  },
  fastSlow: {
    name: 'Fast & slow pointers (same direction)',
    sig: 'for (fast...) { if (...) slow++ }',
    when: 'In-place filtering/compaction: fast reads, slow writes.',
    signals: ['"in place"', 'remove duplicates / zeros', 'O(1) extra space', 'linked-list cycle'],
    code: 'for (let fast = 1; fast < arr.length; fast++) {\n  if (/* keep arr[fast]? */) {\n    slow++;\n    arr[slow] = arr[fast];\n  }\n}',
  },
  sliding: {
    name: 'Sliding window',
    sig: 'for (right...) { while (invalid) left++ }',
    when: 'Contiguous subarray/substring; grow on the right, shrink from the left.',
    signals: ['"contiguous"', '"subarray" / "substring"', 'size k', 'longest / shortest window'],
    code: 'for (let right = 0; right < arr.length; right++) {\n  // add arr[right] to the window\n  while (/* window invalid */) {\n    // remove arr[left] from the window\n    left++;\n  }\n  // update the answer\n}',
  },
  nested: {
    name: 'Nested loops',
    sig: 'for (i) { for (j = i + 1) }',
    when: 'Compare every pair. Usually the brute-force O(n²) answer.',
    signals: ['every pair', 'simple sorts', 'n is tiny', 'brute force first draft'],
    code: 'for (let i = 0; i < arr.length; i++) {\n  for (let j = i + 1; j < arr.length; j++) {\n    // compare arr[i] and arr[j]\n  }\n}',
  },
  binary: {
    name: 'Binary search loop',
    sig: 'while (lo <= hi) { mid = ... }',
    when: 'Sorted data; halve the search space each step → O(log n).',
    signals: ['sorted', '"find target"', 'O(log n) required', 'smallest/largest value that satisfies'],
    code: 'while (lo <= hi) {\n  const mid = Math.floor((lo + hi) / 2);\n  // target smaller → hi = mid - 1\n  // target larger  → lo = mid + 1\n}',
  },
  whileCond: {
    name: 'While (condition) loop',
    sig: 'while (n > 0)',
    when: 'Unknown number of iterations; loop until a condition changes (e.g. digits of a number).',
    signals: ['digits of a number', 'repeat until stable', 'no array to index'],
    code: 'while (n > 0) {\n  // process, then shrink n\n}',
  },
};

// ---------- Variables ----------
const VARS = {
  counter:  { name: 'Counter',            decl: 'let count = 0;',                          desc: 'Counts how many times something happens.' },
  temp:     { name: 'Temp value',         decl: 'let temp;',                               desc: 'Holds a value briefly, e.g. during a swap.' },
  max:      { name: 'Max so far',         decl: 'let max = -Infinity;',                    desc: 'Best/largest answer seen so far.' },
  min:      { name: 'Min so far',         decl: 'let min = Infinity;',                     desc: 'Smallest value seen so far.' },
  sum:      { name: 'Running sum',        decl: 'let sum = 0;',                            desc: 'Accumulates a total (or window total).' },
  map:      { name: 'Hash map',           decl: 'const map = new Map();',                  desc: 'value → index / count lookups in O(1).' },
  set:      { name: 'Hash set',           decl: 'const seen = new Set();',                 desc: '"Have I seen this?" in O(1).' },
  lr:       { name: 'Left & right ptrs',  decl: 'let left = 0, right = arr.length - 1;',   desc: 'Two pointers starting at both ends.' },
  slow:     { name: 'Slow (write) ptr',   decl: 'let slow = 0;',                           desc: 'Where to write the next kept element.' },
  bounds:   { name: 'lo / hi bounds',     decl: 'let lo = 0, hi = arr.length - 1;',        desc: 'Search range for binary search.' },
  winStart: { name: 'Window start',       decl: 'let left = 0; // window start',           desc: 'Left edge of a sliding window.' },
  prevCurr: { name: 'prev & curr',        decl: 'let prev = 0, curr = 1; // or null, head', desc: 'Previous and current values (sequence or linked-list nodes).' },
  result:   { name: 'Result accumulator', decl: 'let result = 0; // or []',                desc: 'Builds up the final answer.' },
  flag:     { name: 'Boolean flag',       decl: 'let swapped = false;',                    desc: 'Remembers if something happened this pass.' },
};

// ---------- Trace helpers ----------
const S = (arr, ptr, vars, msg) => ({ arr: [...arr], ptr: { ...ptr }, vars: { ...vars }, msg });
const fmtObj = (m) => '{' + Object.entries(m).map(([k, v]) => `${k}:${v}`).join(', ') + '}';
const fmtSet = (s) => '{' + [...s].join(', ') + '}';

// ---------- Problems ----------
const PROBLEMS = [
  {
    id: 'count-vowels', title: 'Count Vowels', difficulty: 'Easy',
    description: 'Given a string <code>s</code>, return how many vowels (a, e, i, o, u) it contains.',
    example: { input: 's = "algorithm"', output: '3' },
    hint: 'You only care about each character\'s value, and you need to tally something.',
    solutions: [
      { loop: 'foreach', required: ['counter'], rating: 'optimal', complexity: 'O(n) time, O(1) space',
        why: 'Index is never needed — just look at each char and bump a counter.',
        code: 'let count = 0;\nfor (const ch of s) {\n  if ("aeiou".includes(ch)) count++;\n}\nreturn count;',
        trace() {
          const a = [...'algorithm'], s = []; let count = 0;
          s.push(S(a, {}, { count }, 'count = 0'));
          a.forEach((ch, i) => {
            const v = 'aeiou'.includes(ch); if (v) count++;
            s.push(S(a, { x: i }, { ch, count }, v ? `'${ch}' is a vowel → count = ${count}` : `'${ch}' not a vowel`));
          });
          s.push(S(a, {}, { count }, `Return ${count}`)); return s;
        } },
      { loop: 'single', required: ['counter'], rating: 'works', complexity: 'O(n) time, O(1) space',
        why: 'Correct, but the index i is unused — a for-each loop is cleaner.' },
    ],
  },
  {
    id: 'find-max', title: 'Find Maximum', difficulty: 'Easy',
    description: 'Return the largest number in the array <code>nums</code>.',
    example: { input: 'nums = [3, 7, 2, 9, 4]', output: '9' },
    hint: 'Keep track of the best value seen so far while scanning once.',
    solutions: [
      { loop: 'foreach', required: ['max'], rating: 'optimal', complexity: 'O(n) time, O(1) space',
        why: 'One pass, compare each value to the best so far.',
        code: 'let max = -Infinity;\nfor (const x of nums) {\n  if (x > max) max = x;\n}\nreturn max;',
        trace() {
          const a = [3, 7, 2, 9, 4], s = []; let max = -Infinity;
          s.push(S(a, {}, { max: '-∞' }, 'max = -Infinity'));
          a.forEach((x, i) => {
            const up = x > max; if (up) max = x;
            s.push(S(a, { x: i }, { x, max }, up ? `${x} > old max → max = ${max}` : `${x} ≤ max, keep ${max}`));
          });
          s.push(S(a, {}, { max }, `Return ${max}`)); return s;
        } },
      { loop: 'single', required: ['max'], rating: 'optimal', complexity: 'O(n) time, O(1) space',
        why: 'Fine too — useful if you also need the index of the max.' },
    ],
  },
  {
    id: 'reverse-array', title: 'Reverse Array In Place', difficulty: 'Easy',
    description: 'Reverse the array <code>nums</code> <b>in place</b> (no new array).',
    example: { input: 'nums = [1, 2, 3, 4, 5, 6]', output: '[6, 5, 4, 3, 2, 1]' },
    hint: 'The first and last elements swap, then the second and second-last…',
    solutions: [
      { loop: 'twoPointer', required: ['lr', 'temp'], rating: 'optimal', complexity: 'O(n) time, O(1) space',
        why: 'Swap the ends and walk inward until the pointers meet. A temp holds one value during the swap.',
        code: 'let left = 0, right = nums.length - 1;\nwhile (left < right) {\n  const temp = nums[left];\n  nums[left] = nums[right];\n  nums[right] = temp;\n  left++; right--;\n}',
        trace() {
          const a = [1, 2, 3, 4, 5, 6], s = []; let l = 0, r = a.length - 1;
          s.push(S(a, { left: l, right: r }, { left: l, right: r, temp: '-' }, 'Pointers start at both ends'));
          while (l < r) {
            const t = a[l]; a[l] = a[r]; a[r] = t;
            s.push(S(a, { left: l, right: r }, { left: l, right: r, temp: t }, `temp = ${t}; swap a[${l}] ↔ a[${r}]`));
            l++; r--;
          }
          s.push(S(a, {}, {}, 'left ≥ right → done')); return s;
        } },
      { loop: 'single', required: ['temp'], rating: 'works', complexity: 'O(n) time, O(1) space',
        why: 'Works if you loop i < n/2 and swap with n-1-i, but two pointers states the intent more clearly.' },
    ],
  },
  {
    id: 'two-sum', title: 'Two Sum', difficulty: 'Easy',
    description: 'Given an <b>unsorted</b> array <code>nums</code> and <code>target</code>, return the indices of the two numbers that add up to target.',
    example: { input: 'nums = [3, 4, 2, 6, 9], target = 8', output: '[2, 3]' },
    hint: 'For each number, the partner you need is target - num. How can you check "have I seen it?" instantly — and remember where?',
    solutions: [
      { loop: 'single', required: ['map'], rating: 'optimal', complexity: 'O(n) time, O(n) space',
        why: 'Store value → index in a map. For each number check if target - num was seen. You need the index, so a for-each isn\'t enough.',
        code: 'const map = new Map();\nfor (let i = 0; i < nums.length; i++) {\n  const need = target - nums[i];\n  if (map.has(need)) return [map.get(need), i];\n  map.set(nums[i], i);\n}',
        trace() {
          const a = [3, 4, 2, 6, 9], target = 8, m = {}, s = [];
          for (let i = 0; i < a.length; i++) {
            const need = target - a[i];
            if (need in m) { s.push(S(a, { i, match: m[need] }, { need, map: fmtObj(m) }, `${need} is in map at ${m[need]} → return [${m[need]}, ${i}]`)); return s; }
            m[a[i]] = i;
            s.push(S(a, { i }, { need, map: fmtObj(m) }, `need ${need} not seen; store ${a[i]} → ${i}`));
          }
          return s;
        } },
      { loop: 'nested', required: [], rating: 'works', complexity: 'O(n²) time, O(1) space',
        why: 'Checking every pair is correct but slow. A hash map removes the inner loop.',
        trace() {
          const a = [3, 4, 2, 6, 9], target = 8, s = [];
          for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) {
            const hit = a[i] + a[j] === target;
            s.push(S(a, { i, j }, { sum: a[i] + a[j], target }, hit ? `${a[i]} + ${a[j]} = ${target} → return [${i}, ${j}]` : `${a[i]} + ${a[j]} ≠ ${target}`));
            if (hit) return s;
          }
          return s;
        } },
    ],
  },
  {
    id: 'contains-duplicate', title: 'Contains Duplicate', difficulty: 'Easy',
    description: 'Return <code>true</code> if any value appears at least twice in <code>nums</code>.',
    example: { input: 'nums = [4, 1, 3, 1, 5]', output: 'true' },
    hint: 'You need a fast "have I seen this before?" check. Values only, no indices.',
    solutions: [
      { loop: 'foreach', required: ['set'], rating: 'optimal', complexity: 'O(n) time, O(n) space',
        why: 'A set answers "seen before?" in O(1). Indices aren\'t needed.',
        code: 'const seen = new Set();\nfor (const x of nums) {\n  if (seen.has(x)) return true;\n  seen.add(x);\n}\nreturn false;',
        trace() {
          const a = [4, 1, 3, 1, 5], seen = new Set(), s = [];
          for (let i = 0; i < a.length; i++) {
            if (seen.has(a[i])) { s.push(S(a, { x: i }, { x: a[i], seen: fmtSet(seen) }, `${a[i]} already in set → return true`)); return s; }
            seen.add(a[i]); s.push(S(a, { x: i }, { x: a[i], seen: fmtSet(seen) }, `add ${a[i]} to set`));
          }
          return s;
        } },
      { loop: 'single', required: ['set'], rating: 'optimal', complexity: 'O(n) time, O(n) space', why: 'Also fine; index is unused though.' },
      { loop: 'nested', required: [], rating: 'works', complexity: 'O(n²) time', why: 'Comparing all pairs works but a set is much faster.' },
    ],
  },
  {
    id: 'stock', title: 'Best Time to Buy and Sell Stock', difficulty: 'Easy',
    description: '<code>prices[i]</code> is the price on day i. Buy once, sell later once. Return the max profit (0 if none).',
    example: { input: 'prices = [7, 1, 5, 3, 6, 4]', output: '5' },
    hint: 'At each day, the best you could do is sell today having bought at the cheapest day before.',
    solutions: [
      { loop: 'foreach', required: ['min', 'max'], rating: 'optimal', complexity: 'O(n) time, O(1) space',
        why: 'Track cheapest price so far (min) and best profit so far (max) in a single pass.',
        code: 'let min = Infinity, max = 0;\nfor (const p of prices) {\n  min = Math.min(min, p);\n  max = Math.max(max, p - min);\n}\nreturn max;',
        trace() {
          const a = [7, 1, 5, 3, 6, 4], s = []; let min = Infinity, max = 0;
          a.forEach((p, i) => {
            min = Math.min(min, p); const prof = p - min; max = Math.max(max, prof);
            s.push(S(a, { x: i }, { price: p, min, profitToday: prof, max }, `cheapest so far ${min}, sell today = ${prof}, best = ${max}`));
          });
          s.push(S(a, {}, { max }, `Return ${max}`)); return s;
        } },
      { loop: 'single', required: ['min', 'max'], rating: 'optimal', complexity: 'O(n) time, O(1) space', why: 'Same idea with an index.' },
      { loop: 'nested', required: ['max'], rating: 'works', complexity: 'O(n²) time', why: 'Trying every buy/sell pair works but is slow.' },
    ],
  },
  {
    id: 'valid-palindrome', title: 'Valid Palindrome', difficulty: 'Easy',
    description: 'Return <code>true</code> if string <code>s</code> reads the same forwards and backwards.',
    example: { input: 's = "racecar"', output: 'true' },
    hint: 'Compare the outermost characters, then move inward.',
    solutions: [
      { loop: 'twoPointer', required: ['lr'], rating: 'optimal', complexity: 'O(n) time, O(1) space',
        why: 'Symmetry check → pointers from both ends moving inward.',
        code: 'let left = 0, right = s.length - 1;\nwhile (left < right) {\n  if (s[left] !== s[right]) return false;\n  left++; right--;\n}\nreturn true;',
        trace() {
          const a = [...'racecar'], s = []; let l = 0, r = a.length - 1;
          while (l < r) {
            const ok = a[l] === a[r];
            s.push(S(a, { left: l, right: r }, { left: l, right: r }, ok ? `'${a[l]}' == '${a[r]}' → move inward` : `'${a[l]}' ≠ '${a[r]}' → false`));
            if (!ok) return s; l++; r--;
          }
          s.push(S(a, {}, {}, 'Pointers met → true')); return s;
        } },
      { loop: 'single', required: [], rating: 'works', complexity: 'O(n) time', why: 'Comparing s[i] with s[n-1-i] works; two pointers is the idiomatic pattern.' },
    ],
  },
  {
    id: 'remove-duplicates', title: 'Remove Duplicates from Sorted Array', difficulty: 'Easy',
    description: '<code>nums</code> is <b>sorted</b>. Remove duplicates <b>in place</b> and return the count of unique elements.',
    example: { input: 'nums = [1, 1, 2, 3, 3, 3, 4]', output: '4  (nums starts with [1, 2, 3, 4])' },
    hint: 'One pointer reads every element; another marks where the next unique value should be written.',
    solutions: [
      { loop: 'fastSlow', required: ['slow'], rating: 'optimal', complexity: 'O(n) time, O(1) space',
        why: 'fast scans, slow writes. Sorted means duplicates are adjacent, so compare with nums[slow].',
        code: 'let slow = 0;\nfor (let fast = 1; fast < nums.length; fast++) {\n  if (nums[fast] !== nums[slow]) {\n    slow++;\n    nums[slow] = nums[fast];\n  }\n}\nreturn slow + 1;',
        trace() {
          const a = [1, 1, 2, 3, 3, 3, 4], s = []; let slow = 0;
          s.push(S(a, { slow }, { slow }, 'slow = 0 (first element always kept)'));
          for (let fast = 1; fast < a.length; fast++) {
            if (a[fast] !== a[slow]) { slow++; a[slow] = a[fast]; s.push(S(a, { slow, fast }, { slow, fast }, `new value ${a[fast]} → slow++ and write it`)); }
            else s.push(S(a, { slow, fast }, { slow, fast }, `${a[fast]} duplicate → skip`));
          }
          s.push(S(a, { slow }, { unique: slow + 1 }, `Return ${slow + 1}`)); return s;
        } },
    ],
  },
  {
    id: 'reverse-integer', title: 'Reverse Integer', difficulty: 'Easy',
    description: 'Given a positive integer <code>n</code>, return its digits reversed. Don\'t convert to a string.',
    example: { input: 'n = 1234', output: '4321' },
    hint: 'There is no array to index. Peel off the last digit with % 10 until nothing is left.',
    solutions: [
      { loop: 'whileCond', required: ['result'], optional: ['temp'], rating: 'optimal', complexity: 'O(digits) time, O(1) space',
        why: 'You don\'t know how many digits in advance → loop while n > 0.',
        code: 'let result = 0;\nwhile (n > 0) {\n  const temp = n % 10;\n  result = result * 10 + temp;\n  n = Math.floor(n / 10);\n}\nreturn result;',
        trace() {
          let n = 1234, result = 0; const s = [];
          s.push(S([...String(n)], {}, { n, result }, 'result = 0'));
          while (n > 0) {
            const d = n % 10; result = result * 10 + d; n = Math.floor(n / 10);
            s.push(S(n ? [...String(n)] : [], {}, { digit: d, result, n }, `take ${d}, result = ${result}, n = ${n}`));
          }
          s.push(S([], {}, { result }, `n is 0 → return ${result}`)); return s;
        } },
    ],
  },
  {
    id: 'fibonacci', title: 'Fibonacci Number', difficulty: 'Easy',
    description: 'Return F(n) where F(0)=0, F(1)=1, F(n)=F(n-1)+F(n-2).',
    example: { input: 'n = 7', output: '13' },
    hint: 'Each value only depends on the previous two. Keep just those.',
    solutions: [
      { loop: 'single', required: ['prevCurr'], optional: ['temp'], rating: 'optimal', complexity: 'O(n) time, O(1) space',
        why: 'Fixed count of steps (2..n) → for loop. Only prev & curr are needed; temp holds the new value.',
        code: 'let prev = 0, curr = 1;\nfor (let i = 2; i <= n; i++) {\n  const temp = prev + curr;\n  prev = curr;\n  curr = temp;\n}\nreturn n === 0 ? 0 : curr;',
        trace() {
          let prev = 0, curr = 1; const seq = [0, 1], s = [];
          s.push(S(seq, { prev: 0, curr: 1 }, { prev, curr }, 'prev = 0, curr = 1'));
          for (let i = 2; i <= 7; i++) {
            const t = prev + curr; prev = curr; curr = t; seq.push(t);
            s.push(S(seq, { prev: i - 1, curr: i }, { i, temp: t, prev, curr }, `temp = ${t}; shift prev → ${prev}, curr → ${curr}`));
          }
          s.push(S(seq, { curr: 7 }, { curr }, `Return ${curr}`)); return s;
        } },
      { loop: 'whileCond', required: ['prevCurr', 'counter'], optional: ['temp'], rating: 'works', complexity: 'O(n) time',
        why: 'Works, but the number of steps is known → a for loop fits better.' },
    ],
  },
  {
    id: 'first-unique', title: 'First Unique Character', difficulty: 'Easy',
    description: 'Return the index of the first non-repeating character in <code>s</code>, or -1.',
    example: { input: 's = "loveleet"', output: '1  (\'o\')' },
    hint: 'First count every character, then scan again to find the first with count 1.',
    solutions: [
      { loop: 'single', required: ['map'], rating: 'optimal', complexity: 'O(n) time, O(1) space (26 letters)',
        why: 'Two indexed passes: build counts, then find the first index whose count is 1.',
        code: 'const map = new Map();\nfor (const ch of s) map.set(ch, (map.get(ch) || 0) + 1);\nfor (let i = 0; i < s.length; i++) {\n  if (map.get(s[i]) === 1) return i;\n}\nreturn -1;',
        trace() {
          const a = [...'loveleet'], m = {}, s = [];
          a.forEach((c, i) => { m[c] = (m[c] || 0) + 1; s.push(S(a, { i }, { map: fmtObj(m) }, `pass 1: count '${c}' = ${m[c]}`)); });
          for (let i = 0; i < a.length; i++) {
            const u = m[a[i]] === 1;
            s.push(S(a, { i }, { map: fmtObj(m) }, u ? `pass 2: '${a[i]}' count 1 → return ${i}` : `pass 2: '${a[i]}' count ${m[a[i]]}, skip`));
            if (u) return s;
          }
          return s;
        } },
      { loop: 'nested', required: ['counter'], rating: 'works', complexity: 'O(n²) time', why: 'Counting each char by rescanning works but is slow.' },
    ],
  },
  {
    id: 'binary-search', title: 'Binary Search', difficulty: 'Easy',
    description: 'Given a <b>sorted</b> array <code>nums</code>, return the index of <code>target</code> or -1. Must be O(log n).',
    example: { input: 'nums = [1, 3, 5, 7, 9, 11, 13], target = 9', output: '4' },
    hint: '"Sorted" + "O(log n)" → cut the search space in half every step.',
    solutions: [
      { loop: 'binary', required: ['bounds'], rating: 'optimal', complexity: 'O(log n) time, O(1) space',
        why: 'Check the middle; discard the half that can\'t contain target.',
        code: 'let lo = 0, hi = nums.length - 1;\nwhile (lo <= hi) {\n  const mid = Math.floor((lo + hi) / 2);\n  if (nums[mid] === target) return mid;\n  if (nums[mid] < target) lo = mid + 1;\n  else hi = mid - 1;\n}\nreturn -1;',
        trace() {
          const a = [1, 3, 5, 7, 9, 11, 13], target = 9, s = []; let lo = 0, hi = a.length - 1;
          while (lo <= hi) {
            const mid = Math.floor((lo + hi) / 2);
            if (a[mid] === target) { s.push(S(a, { lo, mid, hi }, { lo, mid, hi, target }, `a[${mid}] = ${target} → found!`)); return s; }
            const right = a[mid] < target;
            s.push(S(a, { lo, mid, hi }, { lo, mid, hi, target }, right ? `${a[mid]} < ${target} → lo = ${mid + 1}` : `${a[mid]} > ${target} → hi = ${mid - 1}`));
            if (right) lo = mid + 1; else hi = mid - 1;
          }
          return s;
        } },
      { loop: 'single', required: [], rating: 'works', complexity: 'O(n) time',
        why: 'Linear scan finds it, but ignores that the array is sorted and fails the O(log n) requirement.' },
    ],
  },
  {
    id: 'two-sum-sorted', title: 'Two Sum II (Sorted)', difficulty: 'Medium',
    description: '<code>nums</code> is <b>sorted</b>. Return the indices of two numbers that add to <code>target</code>, using O(1) extra space.',
    example: { input: 'nums = [1, 3, 4, 6, 8, 11], target = 10', output: '[2, 3]' },
    hint: 'Sorted! If the sum is too big, which end should move? Too small?',
    solutions: [
      { loop: 'twoPointer', required: ['lr'], optional: ['sum'], rating: 'optimal', complexity: 'O(n) time, O(1) space',
        why: 'Sum too big → right--, too small → left++. Sorted order guarantees you never skip the answer.',
        code: 'let left = 0, right = nums.length - 1;\nwhile (left < right) {\n  const sum = nums[left] + nums[right];\n  if (sum === target) return [left, right];\n  if (sum < target) left++;\n  else right--;\n}',
        trace() {
          const a = [1, 3, 4, 6, 8, 11], target = 10, s = []; let l = 0, r = a.length - 1;
          while (l < r) {
            const sum = a[l] + a[r];
            if (sum === target) { s.push(S(a, { left: l, right: r }, { sum, target }, `${a[l]} + ${a[r]} = ${target} → return [${l}, ${r}]`)); return s; }
            s.push(S(a, { left: l, right: r }, { sum, target }, sum < target ? `${sum} < ${target} → left++` : `${sum} > ${target} → right--`));
            if (sum < target) l++; else r--;
          }
          return s;
        } },
      { loop: 'single', required: ['map'], rating: 'works', complexity: 'O(n) time, O(n) space', why: 'Hash map works but uses O(n) space — the problem asks for O(1).' },
      { loop: 'nested', required: [], rating: 'works', complexity: 'O(n²) time', why: 'Brute force; ignores that the array is sorted.' },
    ],
  },
  {
    id: 'max-sum-k', title: 'Maximum Sum Subarray of Size K', difficulty: 'Medium',
    description: 'Return the maximum sum of any <b>contiguous</b> subarray of size <code>k</code>.',
    example: { input: 'nums = [2, 1, 5, 1, 3, 2], k = 3', output: '9  ([5, 1, 3])' },
    hint: '"Contiguous" + fixed size. Moving the window by one: add the new element, subtract the one that fell out.',
    solutions: [
      { loop: 'sliding', required: ['sum', 'max'], optional: ['winStart'], rating: 'optimal', complexity: 'O(n) time, O(1) space',
        why: 'Keep a running window sum; slide by adding nums[right] and removing nums[right - k].',
        code: 'let sum = 0, max = -Infinity;\nfor (let right = 0; right < nums.length; right++) {\n  sum += nums[right];\n  if (right >= k) sum -= nums[right - k];\n  if (right >= k - 1) max = Math.max(max, sum);\n}\nreturn max;',
        trace() {
          const a = [2, 1, 5, 1, 3, 2], k = 3, s = []; let sum = 0, max = -Infinity;
          for (let r = 0; r < a.length; r++) {
            sum += a[r]; let note = `add ${a[r]}`;
            if (r >= k) { sum -= a[r - k]; note += `, remove ${a[r - k]}`; }
            if (r >= k - 1) { max = Math.max(max, sum); note += ` → window sum ${sum}, max ${max}`; } else note += ' (window not full yet)';
            s.push(S(a, { left: Math.max(0, r - k + 1), right: r }, { sum, max: max === -Infinity ? '-∞' : max }, note));
          }
          s.push(S(a, {}, { max }, `Return ${max}`)); return s;
        } },
      { loop: 'nested', required: ['sum', 'max'], rating: 'works', complexity: 'O(n·k) time', why: 'Re-summing every window works but repeats work the sliding window avoids.' },
    ],
  },
  {
    id: 'longest-substring', title: 'Longest Substring Without Repeating Characters', difficulty: 'Medium',
    description: 'Return the length of the longest <b>substring</b> of <code>s</code> with no repeated characters.',
    example: { input: 's = "abcabcbb"', output: '3  ("abc")' },
    hint: 'Substring = contiguous → window. When a repeat enters, shrink from the left until it\'s gone.',
    solutions: [
      { loop: 'sliding', required: ['winStart', 'max', ['set', 'map']], rating: 'optimal', complexity: 'O(n) time, O(k) space',
        why: 'Variable-size window: a set tracks chars in the window, window start moves when a duplicate appears, max tracks the best length.',
        code: 'const seen = new Set();\nlet left = 0, max = 0;\nfor (let right = 0; right < s.length; right++) {\n  while (seen.has(s[right])) {\n    seen.delete(s[left]);\n    left++;\n  }\n  seen.add(s[right]);\n  max = Math.max(max, right - left + 1);\n}\nreturn max;',
        trace() {
          const a = [...'abcabcbb'], seen = new Set(), s = []; let l = 0, max = 0;
          for (let r = 0; r < a.length; r++) {
            while (seen.has(a[r])) { seen.delete(a[l]); s.push(S(a, { left: l, right: r }, { seen: fmtSet(seen), max }, `'${a[r]}' repeats → drop '${a[l]}', left++`)); l++; }
            seen.add(a[r]); max = Math.max(max, r - l + 1);
            s.push(S(a, { left: l, right: r }, { seen: fmtSet(seen), max }, `add '${a[r]}', window length ${r - l + 1}, max ${max}`));
          }
          s.push(S(a, {}, { max }, `Return ${max}`)); return s;
        } },
      { loop: 'nested', required: ['set', 'max'], rating: 'works', complexity: 'O(n²) time', why: 'Trying every start index works but rescans characters many times.' },
    ],
  },
  {
    id: 'bubble-sort', title: 'Bubble Sort', difficulty: 'Medium',
    description: 'Sort <code>nums</code> ascending by repeatedly swapping adjacent out-of-order elements. Stop early if a pass makes no swaps.',
    example: { input: 'nums = [5, 3, 8, 1, 4]', output: '[1, 3, 4, 5, 8]' },
    hint: 'Outer loop = passes, inner loop = adjacent comparisons. Track whether a pass did anything.',
    solutions: [
      { loop: 'nested', required: ['temp', 'flag'], rating: 'optimal', complexity: 'O(n²) time, O(1) space',
        why: 'The algorithm is inherently pass-within-pass. temp swaps; the flag enables early exit when already sorted.',
        code: 'for (let i = 0; i < nums.length - 1; i++) {\n  let swapped = false;\n  for (let j = 0; j < nums.length - 1 - i; j++) {\n    if (nums[j] > nums[j + 1]) {\n      const temp = nums[j];\n      nums[j] = nums[j + 1];\n      nums[j + 1] = temp;\n      swapped = true;\n    }\n  }\n  if (!swapped) break;\n}',
        trace() {
          const a = [5, 3, 8, 1, 4], s = [];
          for (let i = 0; i < a.length - 1; i++) {
            let swapped = false;
            for (let j = 0; j < a.length - 1 - i; j++) {
              if (a[j] > a[j + 1]) {
                const t = a[j]; a[j] = a[j + 1]; a[j + 1] = t; swapped = true;
                s.push(S(a, { j, 'j+1': j + 1 }, { pass: i, temp: t, swapped }, `${t} > ${a[j]} → swap`));
              } else s.push(S(a, { j, 'j+1': j + 1 }, { pass: i, swapped }, `${a[j]} ≤ ${a[j + 1]} → ok`));
            }
            if (!swapped) { s.push(S(a, {}, { pass: i, swapped }, 'No swaps this pass → sorted, break')); return s; }
          }
          s.push(S(a, {}, {}, 'Sorted')); return s;
        } },
    ],
  },
];

// =====================================================================
// Medium-only loops & variables (hidden on Easy problems)
// =====================================================================
Object.assign(LOOPS, {
  twoArrays: {
    level: 'medium', name: 'Two arrays (merge walk)', sig: 'while (i < n && j < m)',
    when: 'Walk two sorted sequences at the same time, advancing whichever is smaller.',
    signals: ['two sorted arrays/lists', '"merge"', 'intersection / union'],
    code: 'while (i < a.length && j < b.length) {\n  // take the smaller of a[i], b[j], advance that pointer\n}\n// then copy leftovers from a or b',
  },
  linkedList: {
    level: 'medium', name: 'Linked-list walk', sig: 'while (curr) { curr = curr.next }',
    when: 'Traverse nodes one by one; there is no index, only .next.',
    signals: ['"linked list"', 'head node', 'reverse / re-link nodes'],
    code: 'while (curr) {\n  // work with curr (and prev)\n  curr = curr.next;\n}',
  },
  monoStack: {
    level: 'medium', name: 'Monotonic stack', sig: 'for (i) { while (top < x) pop }',
    when: 'For each element, find the next greater/smaller element. Stack keeps unresolved items.',
    signals: ['"next greater / warmer / smaller"', '"how many days until"', 'span problems'],
    code: 'for (let i = 0; i < arr.length; i++) {\n  while (stack.length && arr[i] > arr[stack.at(-1)]) {\n    const j = stack.pop();\n    // arr[i] is the answer for j\n  }\n  stack.push(i);\n}',
  },
  bfs: {
    level: 'medium', name: 'Queue loop (BFS)', sig: 'while (queue.length) { shift; push }',
    when: 'Explore level by level. Gives shortest path in unweighted graphs and level counts in trees.',
    signals: ['"level order"', '"minimum steps"', 'shortest path', 'depth / levels'],
    code: 'while (queue.length) {\n  const size = queue.length;      // one level\n  for (let k = 0; k < size; k++) {\n    const node = queue.shift();\n    // push node\'s neighbours/children\n  }\n}',
  },
  dfs: {
    level: 'medium', name: 'Stack loop (iterative DFS)', sig: 'while (stack.length) { pop; push }',
    when: 'Explore one path fully before backtracking, without recursion.',
    signals: ['"root-to-leaf path"', 'any path exists', 'connected components', 'explore everything'],
    code: 'while (stack.length) {\n  const node = stack.pop();\n  // visit node, push its children/neighbours\n}',
  },
  grid: {
    level: 'medium', name: 'Grid traversal', sig: 'for (r) for (c) + 4 directions',
    when: '2D matrix: scan every cell, then spread up/down/left/right from interesting ones.',
    signals: ['matrix / grid / board', '"islands"', 'flood fill', 'neighbours up/down/left/right'],
    code: 'for (let r = 0; r < grid.length; r++) {\n  for (let c = 0; c < grid[0].length; c++) {\n    // check grid[r][c]; explore [r±1, c] and [r, c±1]\n  }\n}',
  },
  dp: {
    level: 'medium', name: 'DP table fill', sig: 'for (i) dp[i] = f(dp[i-1], dp[i-2])',
    when: 'Answer for i is built from answers to smaller subproblems you already stored.',
    signals: ['"maximum / minimum / number of ways"', 'choices at each step', 'overlapping subproblems'],
    code: 'dp[0] = /* base case */;\nfor (let i = 1; i < n; i++) {\n  dp[i] = /* combine dp[i - 1], dp[i - 2], ... */;\n}',
  },
  prefix: {
    level: 'medium', name: 'Prefix sum pass', sig: 'sum += x; look up sum - k',
    when: 'Range/subarray sums, especially with negatives. sum(i..j) = prefix[j] - prefix[i-1].',
    signals: ['"subarray sum equals k"', 'range sum queries', 'negative numbers (window fails)'],
    code: 'for (const x of arr) {\n  sum += x;               // prefix sum so far\n  // how many earlier prefixes equal sum - k?\n  // record this prefix\n}',
  },
  backtrack: {
    level: 'medium', name: 'Backtracking', sig: 'for (choice) { choose; recurse; undo }',
    when: 'Generate all combinations/permutations: choose, explore, un-choose.',
    signals: ['"all subsets / permutations / combinations"', 'generate every', 'N-Queens, Sudoku'],
    code: 'function backtrack(start) {\n  // record / check path\n  for (let i = start; i < arr.length; i++) {\n    path.push(arr[i]);     // choose\n    backtrack(i + 1);      // explore\n    path.pop();            // undo\n  }\n}',
  },
});

Object.assign(VARS, {
  ij:      { level: 'medium', name: 'i & j (two arrays)', decl: 'let i = 0, j = 0;',              desc: 'One pointer per input array.' },
  stack:   { level: 'medium', name: 'Stack',              decl: 'const stack = [];',              desc: 'Last-in first-out: push / pop.' },
  queue:   { level: 'medium', name: 'Queue',              decl: 'const queue = [start];',         desc: 'First-in first-out: push / shift.' },
  visited: { level: 'medium', name: 'Visited set',        decl: 'const visited = new Set();',     desc: 'Cells/nodes already explored.' },
  dp:      { level: 'medium', name: 'DP array',           decl: 'const dp = new Array(n).fill(0);', desc: 'dp[i] = best answer for the first i items.' },
  path:    { level: 'medium', name: 'Current path',       decl: 'const path = [];',               desc: 'Choices made so far in backtracking.' },
});

const SG = (arr, cols, ptr, vars, msg) => ({ ...S(arr, ptr, vars, msg), cols });
const show = (v) => (v === null ? '·' : v);

PROBLEMS.push(
  {
    id: 'merge-sorted', title: 'Merge Two Sorted Arrays', difficulty: 'Medium',
    description: 'Given sorted arrays <code>a</code> and <code>b</code>, return one sorted array containing all elements, in O(n + m).',
    example: { input: 'a = [1, 3, 5, 7], b = [2, 4, 6]', output: '[1, 2, 3, 4, 5, 6, 7]' },
    hint: 'Both are already sorted: the next smallest is always at the front of a or the front of b.',
    solutions: [
      { loop: 'twoArrays', required: ['ij', 'result'], rating: 'optimal', complexity: 'O(n + m) time',
        why: 'One pointer per array; always take the smaller front element, then copy leftovers.',
        code: 'const result = [];\nlet i = 0, j = 0;\nwhile (i < a.length && j < b.length) {\n  if (a[i] <= b[j]) result.push(a[i++]);\n  else result.push(b[j++]);\n}\nwhile (i < a.length) result.push(a[i++]);\nwhile (j < b.length) result.push(b[j++]);\nreturn result;',
        trace() {
          const a = [1, 3, 5, 7], b = [2, 4, 6], disp = [...a, '|', ...b], s = [], res = []; let i = 0, j = 0;
          const P = () => ({ ...(i < a.length ? { i } : {}), ...(j < b.length ? { j: a.length + 1 + j } : {}) });
          while (i < a.length && j < b.length) {
            const takeA = a[i] <= b[j]; const v = takeA ? a[i] : b[j];
            s.push(S(disp, P(), { result: `[${[...res, v].join(', ')}]` }, `a[${i}]=${a[i]} vs b[${j}]=${b[j]} → take ${v}`));
            res.push(v); takeA ? i++ : j++;
          }
          while (i < a.length) { res.push(a[i]); s.push(S(disp, P(), { result: `[${res.join(', ')}]` }, `b done → copy ${a[i]}`)); i++; }
          while (j < b.length) { res.push(b[j]); s.push(S(disp, P(), { result: `[${res.join(', ')}]` }, `a done → copy ${b[j]}`)); j++; }
          s.push(S(disp, {}, { result: `[${res.join(', ')}]` }, 'Both exhausted → return result')); return s;
        } },
    ],
  },
  {
    id: 'reverse-linked-list', title: 'Reverse Linked List', difficulty: 'Medium',
    description: 'Reverse a singly linked list and return the new head.',
    example: { input: 'head = 1 → 2 → 3 → 4', output: '4 → 3 → 2 → 1' },
    hint: 'Walk the list. At each node, point it backwards — but save .next first or you lose the rest of the list.',
    solutions: [
      { loop: 'linkedList', required: ['prevCurr', 'temp'], rating: 'optimal', complexity: 'O(n) time, O(1) space',
        why: 'prev = already-reversed part, curr = node being flipped, temp saves curr.next before you overwrite it.',
        code: 'let prev = null, curr = head;\nwhile (curr) {\n  const temp = curr.next;\n  curr.next = prev;\n  prev = curr;\n  curr = temp;\n}\nreturn prev;',
        trace() {
          const a = [1, 2, 3, 4], s = []; let p = -1, c = 0;
          const st = () => ({ reversed: p < 0 ? 'null' : a.slice(0, p + 1).reverse().join(' → '), remaining: c < a.length ? a.slice(c).join(' → ') : 'null' });
          s.push(S(a, { curr: c }, { prev: 'null', curr: a[c], ...st() }, 'prev = null, curr = head'));
          while (c < a.length) {
            const t = c + 1 < a.length ? a[c + 1] : 'null';
            p = c; c++;
            s.push(S(a, { prev: p, ...(c < a.length ? { curr: c } : {}) }, { temp: t, ...st() }, `temp = ${t}; point ${a[p]}.next back; move prev & curr forward`));
          }
          s.push(S(a, { prev: p }, { newHead: a[p] }, `curr is null → return prev (${a[p]})`)); return s;
        } },
    ],
  },
  {
    id: 'daily-temperatures', title: 'Daily Temperatures', difficulty: 'Medium',
    description: 'For each day in <code>temps</code>, return how many days until a warmer temperature (0 if never).',
    example: { input: 'temps = [73, 74, 75, 71, 69, 72, 76, 73]', output: '[1, 1, 4, 2, 1, 1, 0, 0]' },
    hint: '"Next warmer" = next greater element. Keep days that are still waiting for an answer; a warm day resolves several at once.',
    solutions: [
      { loop: 'monoStack', required: ['stack', 'result'], rating: 'optimal', complexity: 'O(n) time, O(n) space',
        why: 'Stack holds indices of days still waiting. Each index is pushed and popped once.',
        code: 'const result = new Array(temps.length).fill(0);\nconst stack = []; // indices\nfor (let i = 0; i < temps.length; i++) {\n  while (stack.length && temps[i] > temps[stack.at(-1)]) {\n    const j = stack.pop();\n    result[j] = i - j;\n  }\n  stack.push(i);\n}\nreturn result;',
        trace() {
          const t = [73, 74, 75, 71, 69, 72, 76, 73], res = Array(t.length).fill(0), st = [], s = [];
          const V = () => ({ stack: `[${st.map((k) => t[k]).join(', ')}]`, result: `[${res.join(', ')}]` });
          for (let i = 0; i < t.length; i++) {
            while (st.length && t[i] > t[st.at(-1)]) {
              const j = st.pop(); res[j] = i - j;
              s.push(S(t, { i, pop: j }, V(), `${t[i]} > ${t[j]} → pop day ${j}, answer ${i - j}`));
            }
            st.push(i); s.push(S(t, { i }, V(), `push day ${i} (${t[i]}) — waiting for warmer`));
          }
          s.push(S(t, {}, V(), 'Days left on stack never warm up → 0')); return s;
        } },
      { loop: 'nested', required: ['result'], rating: 'works', complexity: 'O(n²) time', why: 'Scanning forward from each day works but repeats a lot of comparisons.' },
    ],
  },
  {
    id: 'max-depth-tree', title: 'Maximum Depth of Binary Tree', difficulty: 'Medium',
    description: 'Return the number of levels in a binary tree. Tree is shown in level order: node <code>i</code> has children at <code>2i+1</code> and <code>2i+2</code> (· = empty).',
    example: { input: 'root = [3, 9, 20, ·, ·, 15, 7]', output: '3' },
    hint: 'Depth = number of levels. Which traversal naturally processes a tree one level at a time?',
    solutions: [
      { loop: 'bfs', required: ['queue', 'counter'], rating: 'optimal', complexity: 'O(n) time, O(width) space',
        why: 'Process the queue one level at a time; count how many levels you process.',
        code: 'const queue = [root];\nlet count = 0;\nwhile (queue.length) {\n  const size = queue.length;\n  for (let k = 0; k < size; k++) {\n    const node = queue.shift();\n    if (node.left) queue.push(node.left);\n    if (node.right) queue.push(node.right);\n  }\n  count++;\n}\nreturn count;',
        trace() {
          const a = [3, 9, 20, null, null, 15, 7], d = a.map(show), s = []; let q = [0], count = 0;
          const Q = () => `[${q.map((k) => a[k]).join(', ')}]`;
          s.push(S(d, { node: 0 }, { queue: Q(), depth: count }, 'queue = [root]'));
          while (q.length) {
            const size = q.length;
            for (let k = 0; k < size; k++) {
              const n = q.shift();
              for (const ch of [2 * n + 1, 2 * n + 2]) if (ch < a.length && a[ch] !== null) q.push(ch);
              s.push(S(d, { node: n }, { queue: Q(), depth: count }, `shift ${a[n]}, enqueue its children`));
            }
            count++; s.push(S(d, {}, { queue: Q(), depth: count }, `level finished → depth = ${count}`));
          }
          s.push(S(d, {}, { depth: count }, `Queue empty → return ${count}`)); return s;
        } },
      { loop: 'dfs', required: ['stack', 'max'], rating: 'works', complexity: 'O(n) time',
        why: 'DFS works if you store depth with each node and track the max, but BFS counts levels directly.' },
    ],
  },
  {
    id: 'path-sum', title: 'Path Sum', difficulty: 'Medium',
    description: 'Return <code>true</code> if some <b>root-to-leaf</b> path adds up to <code>target</code>. Tree in level order (children of i at 2i+1, 2i+2).',
    example: { input: 'root = [5, 4, 8, 11, ·, 13, 4, 7, 2], target = 22', output: 'true  (5 → 4 → 11 → 2)' },
    hint: 'You must follow one path all the way down to a leaf before trying another. Carry the running sum with each node.',
    solutions: [
      { loop: 'dfs', required: ['stack'], optional: ['sum'], rating: 'optimal', complexity: 'O(n) time, O(height) space',
        why: 'Root-to-leaf paths → go deep first. Push [node, sumSoFar] pairs on a stack.',
        code: 'const stack = [[root, root.val]];\nwhile (stack.length) {\n  const [node, sum] = stack.pop();\n  if (!node.left && !node.right && sum === target) return true;\n  if (node.right) stack.push([node.right, sum + node.right.val]);\n  if (node.left)  stack.push([node.left,  sum + node.left.val]);\n}\nreturn false;',
        trace() {
          const a = [5, 4, 8, 11, null, 13, 4, 7, 2], target = 22, d = a.map(show), s = [];
          const ok = (k) => k < a.length && a[k] !== null;
          const st = [[0, a[0]]]; const V = () => `[${st.map(([k, sm]) => `${a[k]}:${sm}`).join(', ')}]`;
          s.push(S(d, { node: 0 }, { stack: V() }, 'push [root, 5]'));
          while (st.length) {
            const [n, sum] = st.pop(); const L = 2 * n + 1, R = 2 * n + 2;
            if (!ok(L) && !ok(R)) {
              const hit = sum === target;
              s.push(S(d, { node: n }, { sum, stack: V() }, hit ? `leaf ${a[n]}, sum ${sum} = ${target} → true` : `leaf ${a[n]}, sum ${sum} ≠ ${target}, backtrack`));
              if (hit) return s; continue;
            }
            if (ok(R)) st.push([R, sum + a[R]]);
            if (ok(L)) st.push([L, sum + a[L]]);
            s.push(S(d, { node: n }, { sum, stack: V() }, `pop ${a[n]} (sum ${sum}), push children`));
          }
          s.push(S(d, {}, {}, 'Stack empty → false')); return s;
        } },
      { loop: 'bfs', required: ['queue'], optional: ['sum'], rating: 'works', complexity: 'O(n) time, O(width) space',
        why: 'BFS with [node, sum] pairs also works; DFS matches the "follow a path" shape and uses less memory on wide trees.' },
    ],
  },
  {
    id: 'islands', title: 'Number of Islands', difficulty: 'Medium',
    description: 'Grid of 1 (land) and 0 (water). Count islands — groups of land connected up/down/left/right.',
    example: { input: 'grid = [[1,1,0,0,0],[1,1,0,0,1],[0,0,1,0,1],[0,0,0,1,1]]', output: '3' },
    hint: 'Scan every cell. When you hit new land, count it and sink/mark its whole island so you don\'t count it again.',
    solutions: [
      { loop: 'grid', required: ['counter', 'visited'], optional: ['stack', 'queue'], rating: 'optimal', complexity: 'O(rows × cols) time',
        why: 'Scan the grid; on unvisited land, count++ and flood-fill its neighbours (with a stack or queue) into visited.',
        code: 'let count = 0;\nconst visited = new Set();\nfor (let r = 0; r < grid.length; r++) {\n  for (let c = 0; c < grid[0].length; c++) {\n    if (grid[r][c] === 1 && !visited.has(r + \',\' + c)) {\n      count++;\n      const stack = [[r, c]];           // flood-fill this island\n      while (stack.length) {\n        const [x, y] = stack.pop();\n        if (x < 0 || y < 0 || x >= grid.length || y >= grid[0].length) continue;\n        if (grid[x][y] !== 1 || visited.has(x + \',\' + y)) continue;\n        visited.add(x + \',\' + y);\n        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);\n      }\n    }\n  }\n}\nreturn count;',
        trace() {
          const g = [[1, 1, 0, 0, 0], [1, 1, 0, 0, 1], [0, 0, 1, 0, 1], [0, 0, 0, 1, 1]], R = 4, C = 5, s = [];
          const disp = g.flat().map(String), seen = new Set(); let count = 0;
          for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
            const at = r * C + c;
            if (g[r][c] !== 1 || seen.has(at)) {
              s.push(SG(disp, C, { scan: at }, { count }, g[r][c] ? `(${r},${c}) already visited` : `(${r},${c}) water`)); continue;
            }
            count++; s.push(SG(disp, C, { scan: at }, { count }, `(${r},${c}) new land → island #${count}, flood fill`));
            const st = [[r, c]];
            while (st.length) {
              const [x, y] = st.pop();
              if (x < 0 || y < 0 || x >= R || y >= C || g[x][y] !== 1 || seen.has(x * C + y)) continue;
              seen.add(x * C + y); disp[x * C + y] = '#' + count;
              s.push(SG(disp, C, { scan: at, fill: x * C + y }, { count, visited: seen.size }, `mark (${x},${y}) as island #${count}`));
              st.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
            }
          }
          s.push(SG(disp, C, {}, { count }, `Scan done → ${count} islands`)); return s;
        } },
      { loop: 'nested', required: ['counter', 'visited'], optional: ['stack', 'queue'], rating: 'works', complexity: 'O(rows × cols) time',
        why: 'That\'s the grid scan — the "Grid traversal" pattern names it: nested scan + spread to 4 neighbours.' },
    ],
  },
  {
    id: 'house-robber', title: 'House Robber', difficulty: 'Medium',
    description: 'Each house has <code>nums[i]</code> money. You can\'t rob two adjacent houses. Return the max you can rob.',
    example: { input: 'nums = [2, 7, 9, 3, 1]', output: '12  (2 + 9 + 1)' },
    hint: 'At house i you either skip it (best up to i-1) or rob it (best up to i-2 plus nums[i]).',
    solutions: [
      { loop: 'dp', required: ['dp'], rating: 'optimal', complexity: 'O(n) time, O(n) space',
        why: 'dp[i] = max(dp[i-1], dp[i-2] + nums[i]). Each answer reuses two earlier answers.',
        code: 'const dp = new Array(nums.length).fill(0);\ndp[0] = nums[0];\ndp[1] = Math.max(nums[0], nums[1]);\nfor (let i = 2; i < nums.length; i++) {\n  dp[i] = Math.max(dp[i - 1], dp[i - 2] + nums[i]);\n}\nreturn dp[nums.length - 1];',
        trace() {
          const a = [2, 7, 9, 3, 1], dp = [], s = [];
          dp[0] = a[0]; s.push(S(a, { i: 0 }, { dp: `[${dp.join(', ')}]` }, `dp[0] = ${a[0]}`));
          dp[1] = Math.max(a[0], a[1]); s.push(S(a, { i: 1 }, { dp: `[${dp.join(', ')}]` }, `dp[1] = max(${a[0]}, ${a[1]}) = ${dp[1]}`));
          for (let i = 2; i < a.length; i++) {
            const skip = dp[i - 1], rob = dp[i - 2] + a[i]; dp[i] = Math.max(skip, rob);
            s.push(S(a, { i }, { skip, rob, dp: `[${dp.join(', ')}]` }, `skip = ${skip}, rob = ${dp[i - 2]} + ${a[i]} = ${rob} → dp[${i}] = ${dp[i]}`));
          }
          s.push(S(a, {}, { dp: `[${dp.join(', ')}]` }, `Return ${dp.at(-1)}`)); return s;
        } },
      { loop: 'single', required: ['prevCurr'], optional: ['temp'], rating: 'optimal', complexity: 'O(n) time, O(1) space',
        why: 'Space-optimised DP: you only ever need the last two dp values, so keep prev & curr.' },
    ],
  },
  {
    id: 'subarray-sum-k', title: 'Subarray Sum Equals K', difficulty: 'Medium',
    description: 'Return how many <b>contiguous</b> subarrays sum to <code>k</code>. Numbers can be <b>negative</b>.',
    example: { input: 'nums = [1, 2, 3, -2, 2], k = 3', output: '4' },
    hint: 'Negatives break the sliding window (shrinking doesn\'t always lower the sum). If prefix(j) - prefix(i) = k, then subarray i+1..j sums to k.',
    solutions: [
      { loop: 'prefix', required: ['sum', 'map', 'counter'], rating: 'optimal', complexity: 'O(n) time, O(n) space',
        why: 'Running prefix sum + map of how often each prefix appeared. Every earlier prefix equal to sum - k ends a valid subarray here.',
        code: 'const map = new Map([[0, 1]]); // prefix sum → times seen\nlet sum = 0, count = 0;\nfor (const x of nums) {\n  sum += x;\n  count += map.get(sum - k) || 0;\n  map.set(sum, (map.get(sum) || 0) + 1);\n}\nreturn count;',
        trace() {
          const a = [1, 2, 3, -2, 2], k = 3, m = { 0: 1 }, s = []; let sum = 0, count = 0;
          s.push(S(a, {}, { sum, count, map: fmtObj(m) }, 'map = {0:1} (empty prefix)'));
          a.forEach((x, i) => {
            sum += x; const f = m[sum - k] || 0; count += f; m[sum] = (m[sum] || 0) + 1;
            s.push(S(a, { x: i }, { sum, need: sum - k, count, map: fmtObj(m) }, `sum = ${sum}; prefix ${sum - k} seen ${f}× → count = ${count}`));
          });
          s.push(S(a, {}, { count }, `Return ${count}`)); return s;
        } },
      { loop: 'nested', required: ['sum', 'counter'], rating: 'works', complexity: 'O(n²) time', why: 'Trying every start with a running sum works but is quadratic.' },
    ],
  },
  {
    id: 'subsets', title: 'Subsets', difficulty: 'Medium',
    description: 'Return all possible subsets of distinct integers <code>nums</code>.',
    example: { input: 'nums = [1, 2, 3]', output: '[[], [1], [1,2], [1,2,3], [1,3], [2], [2,3], [3]]' },
    hint: '"All" subsets → generate every choice. Add a number, explore further, then remove it and try the next.',
    solutions: [
      { loop: 'backtrack', required: ['path', 'result'], rating: 'optimal', complexity: 'O(n · 2ⁿ) time',
        why: 'Choose → recurse → undo explores every combination exactly once.',
        code: 'const result = [];\nconst path = [];\nfunction backtrack(start) {\n  result.push([...path]);\n  for (let i = start; i < nums.length; i++) {\n    path.push(nums[i]);\n    backtrack(i + 1);\n    path.pop();\n  }\n}\nbacktrack(0);\nreturn result;',
        trace() {
          const a = [1, 2, 3], path = [], res = [], s = [];
          const V = () => ({ path: `[${path.join(',')}]`, found: res.length });
          (function bt(start) {
            res.push([...path]); s.push(S(a, {}, V(), `record [${path.join(',')}]`));
            for (let i = start; i < a.length; i++) {
              path.push(a[i]); s.push(S(a, { i }, V(), `choose ${a[i]}`));
              bt(i + 1);
              path.pop(); s.push(S(a, { i }, V(), `undo ${a[i]}`));
            }
          })(0);
          s.push(S(a, {}, V(), `Done → ${res.length} subsets`)); return s;
        } },
    ],
  },
);

// Role-based clues used by progressive feedback (doesn't name the variable)
VARS.counter.clue = "Something that tallies how many times a thing happens.";
VARS.temp.clue = "Somewhere to park a value for a moment so it isn't overwritten.";
VARS.max.clue = "Something that remembers the biggest / best answer so far.";
VARS.min.clue = "Something that remembers the smallest value seen so far.";
VARS.sum.clue = "A running total that grows (or shrinks) as you go.";
VARS.map.clue = "An instant lookup from a value to extra info \u2014 like its index or how often it appeared.";
VARS.set.clue = "An instant \"have I seen this before?\" check.";
VARS.lr.clue = "Two markers starting at opposite ends.";
VARS.slow.clue = "A marker for where the next kept element should be written.";
VARS.bounds.clue = "The edges of the range you are still searching.";
VARS.winStart.clue = "A marker for where the current window begins.";
VARS.prevCurr.clue = "The previous and the current item, so you can step forward or re-link.";
VARS.result.clue = "Something to build the final answer into.";
VARS.flag.clue = "A yes/no that records whether something happened during a pass.";
VARS.ij.clue = "One position marker per input.";
VARS.stack.clue = "A pile where the last thing added is the first taken out.";
VARS.queue.clue = "A line where the first thing added is the first taken out.";
VARS.visited.clue = "A record of the places you've already explored.";
VARS.dp.clue = "A table storing the answer to each smaller subproblem.";
VARS.path.clue = "The list of choices you've made so far.";
