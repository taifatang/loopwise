// =====================================================================
// More interview-pattern problems (loaded after problems.js and sim.js).
// Each problem needs: this entry (solutions + reference trace) and a matching
// entry in sims-more.js (how the learner's own loop behaves on the example).
// =====================================================================
PROBLEMS.push(
  {
    id: 'max-subarray', title: 'Maximum Subarray', difficulty: 'Medium',
    description: 'Return the largest sum of any <b>contiguous</b> subarray of <code>nums</code>. Numbers can be negative.',
    example: { input: 'nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]', output: '6  ([4, -1, 2, 1])' },
    hint: 'At each number you either extend the run you had, or start fresh. A run with a negative total is never worth extending.',
    solutions: [
      { loop: 'foreach', required: ['sum', 'max'], rating: 'optimal', complexity: 'O(n) time, O(1) space',
        why: 'Kadane: sum is the best subarray ending here (extend it or restart at x); max is the best seen anywhere.',
        code: 'let sum = 0, max = -Infinity;\nfor (const x of nums) {\n  sum = Math.max(x, sum + x);\n  max = Math.max(max, sum);\n}\nreturn max;',
        trace() {
          const a = [-2, 1, -3, 4, -1, 2, 1, -5, 4], s = []; let sum = 0, max = -Infinity;
          s.push(S(a, {}, { sum, max: '-∞' }, 'sum = 0, max = -Infinity'));
          a.forEach((x, i) => {
            const ext = sum + x; sum = Math.max(x, ext); max = Math.max(max, sum);
            s.push(S(a, { x: i }, { sum, max }, `sum = max(${x}, ${ext}) = ${sum}${ext < x ? ' (restart)' : ''} → max = ${max}`));
          });
          s.push(S(a, {}, { max }, `Return ${max}`)); return s;
        } },
      { loop: 'single', required: ['sum', 'max'], rating: 'optimal', complexity: 'O(n) time, O(1) space', why: 'Same Kadane idea; the index just isn\'t needed.' },
      { loop: 'nested', required: ['sum', 'max'], rating: 'works', complexity: 'O(n²) time', why: 'Trying every start with a running sum is correct, but quadratic.' },
    ],
  },
  {
    id: 'single-number', title: 'Single Number', difficulty: 'Easy',
    description: 'Every number in <code>nums</code> appears twice except one. Return the one that appears once, using O(1) extra space.',
    example: { input: 'nums = [4, 1, 2, 1, 2]', output: '4' },
    hint: 'Is there an operation where a value combined with itself disappears?',
    solutions: [
      { loop: 'foreach', required: ['result'], rating: 'optimal', complexity: 'O(n) time, O(1) space',
        why: 'XOR cancels equal pairs (x ^ x = 0) and 0 ^ y = y, so only the unpaired number survives.',
        code: 'let result = 0;\nfor (const x of nums) {\n  result ^= x;\n}\nreturn result;',
        trace() {
          const a = [4, 1, 2, 1, 2], s = []; let result = 0;
          s.push(S(a, {}, { result }, 'result = 0'));
          a.forEach((x, i) => { const old = result; result ^= x; s.push(S(a, { x: i }, { result }, `${old} ^ ${x} = ${result}`)); });
          s.push(S(a, {}, { result }, `Return ${result}`)); return s;
        } },
      { loop: 'single', required: ['set'], rating: 'works', complexity: 'O(n) time, O(n) space', why: 'Toggling values in a set works, but the problem asks for O(1) space.' },
    ],
  },
  {
    id: 'missing-number', title: 'Missing Number', difficulty: 'Easy',
    description: '<code>nums</code> holds <code>n</code> distinct numbers from <code>0..n</code>. Return the one number that is missing.',
    example: { input: 'nums = [9, 6, 4, 2, 3, 5, 7, 0, 1]', output: '8' },
    hint: 'Compare what the indices 0..n add up to against what the values add up to. You can do both in one pass.',
    solutions: [
      { loop: 'single', required: ['sum'], rating: 'optimal', complexity: 'O(n) time, O(1) space',
        why: 'Start sum at n, then add i - nums[i] each step. Every present number cancels its index, leaving the missing one.',
        code: 'let sum = nums.length;\nfor (let i = 0; i < nums.length; i++) {\n  sum += i - nums[i];\n}\nreturn sum;',
        trace() {
          const a = [9, 6, 4, 2, 3, 5, 7, 0, 1], s = []; let sum = a.length;
          s.push(S(a, {}, { sum }, `sum = n = ${sum}`));
          a.forEach((x, i) => { sum += i - x; s.push(S(a, { i }, { sum }, `sum += ${i} - ${x} → ${sum}`)); });
          s.push(S(a, {}, { sum }, `Return ${sum}`)); return s;
        } },
      { loop: 'foreach', required: ['set'], rating: 'works', complexity: 'O(n) time, O(n) space', why: 'Put everything in a set and look for the gap — correct, but uses extra memory.' },
    ],
  },
  {
    id: 'valid-parentheses', title: 'Valid Parentheses', difficulty: 'Easy',
    description: 'Given a string of <code>()[]{}</code>, return true if every bracket is closed by the same type, in the correct order.',
    example: { input: 's = "([{}])[]"', output: 'true' },
    hint: 'The most recent opening bracket must be the first one closed — last in, first out.',
    solutions: [
      { loop: 'foreach', required: ['stack'], optional: ['map'], rating: 'optimal', complexity: 'O(n) time, O(n) space',
        why: 'Push each opener. A closer must match the top of the stack; at the end the stack must be empty.',
        code: 'const stack = [];\nconst pairs = { ")": "(", "]": "[", "}": "{" };\nfor (const ch of s) {\n  if (!pairs[ch]) stack.push(ch);\n  else if (stack.pop() !== pairs[ch]) return false;\n}\nreturn stack.length === 0;',
        trace() {
          const a = [...'([{}])[]'], st = [], s = [], P = { ')': '(', ']': '[', '}': '{' };
          const V = () => ({ stack: `[${st.join(', ')}]` });
          a.forEach((ch, i) => {
            if (!P[ch]) { st.push(ch); s.push(S(a, { x: i }, V(), `'${ch}' opens → push`)); }
            else { const t = st.pop(); s.push(S(a, { x: i }, V(), `'${ch}' closes → top was '${t}' ✓ match`)); }
          });
          s.push(S(a, {}, V(), 'Stack is empty → return true')); return s;
        } },
      { loop: 'single', required: ['stack'], optional: ['map'], rating: 'optimal', complexity: 'O(n) time, O(n) space', why: 'Same idea with an index you never use.' },
    ],
  },
  {
    id: 'container-water', title: 'Container With Most Water', difficulty: 'Medium',
    description: '<code>heights[i]</code> is a vertical wall. Pick two walls so the container between them holds the most water, and return that area.',
    example: { input: 'heights = [1, 8, 6, 2, 5, 4, 8, 3, 7]', output: '49  (walls 8 and 7)' },
    hint: 'Start with the widest container. The shorter wall limits the area — which wall is pointless to keep?',
    solutions: [
      { loop: 'twoPointer', required: ['lr', 'max'], rating: 'optimal', complexity: 'O(n) time, O(1) space',
        why: 'Area = min(height) × width. Moving the taller wall can never help, so always move the shorter one inward.',
        code: 'let left = 0, right = heights.length - 1;\nlet max = 0;\nwhile (left < right) {\n  const area = Math.min(heights[left], heights[right]) * (right - left);\n  max = Math.max(max, area);\n  if (heights[left] < heights[right]) left++;\n  else right--;\n}\nreturn max;',
        trace() {
          const a = [1, 8, 6, 2, 5, 4, 8, 3, 7], s = []; let l = 0, r = a.length - 1, max = 0;
          while (l < r) {
            const area = Math.min(a[l], a[r]) * (r - l); max = Math.max(max, area);
            s.push(S(a, { left: l, right: r }, { area, max }, `min(${a[l]}, ${a[r]}) × ${r - l} = ${area} → max = ${max}; move the shorter wall`));
            if (a[l] < a[r]) l++; else r--;
          }
          s.push(S(a, {}, { max }, `Return ${max}`)); return s;
        } },
      { loop: 'nested', required: ['max'], rating: 'works', complexity: 'O(n²) time', why: 'Checking every pair of walls is correct but quadratic.' },
    ],
  },
  {
    id: 'longest-consecutive', title: 'Longest Consecutive Sequence', difficulty: 'Medium',
    description: 'Return the length of the longest run of consecutive integers (like 1, 2, 3, 4) that can be formed from <code>nums</code>, in O(n) time. The array is unsorted.',
    example: { input: 'nums = [100, 4, 200, 1, 3, 2]', output: '4  (1, 2, 3, 4)' },
    hint: 'Sorting costs O(n log n). If you can look numbers up instantly, you only need to start counting from the beginning of each run.',
    solutions: [
      { loop: 'foreach', required: ['set', 'max'], optional: ['counter'], rating: 'optimal', complexity: 'O(n) time, O(n) space',
        why: 'Put everything in a set. Only start counting at a number with no x - 1 neighbour, so each run is walked exactly once.',
        code: 'const set = new Set(nums);\nlet max = 0;\nfor (const x of set) {\n  if (set.has(x - 1)) continue; // not the start of a run\n  let len = 1;\n  while (set.has(x + len)) len++;\n  max = Math.max(max, len);\n}\nreturn max;',
        trace() {
          const a = [100, 4, 200, 1, 3, 2], set = new Set(a), s = []; let max = 0;
          s.push(S(a, {}, { set: fmtSet(set), max }, 'Put every number in a set'));
          a.forEach((x, i) => {
            if (set.has(x - 1)) { s.push(S(a, { x: i }, { set: fmtSet(set), max }, `${x - 1} exists → ${x} is not the start of a run`)); return; }
            let len = 1; while (set.has(x + len)) len++; max = Math.max(max, len);
            s.push(S(a, { x: i }, { set: fmtSet(set), len, max }, `${x} starts a run of length ${len} → max = ${max}`));
          });
          s.push(S(a, {}, { max }, `Return ${max}`)); return s;
        } },
      { loop: 'single', required: ['set', 'max'], optional: ['counter'], rating: 'optimal', complexity: 'O(n) time, O(n) space', why: 'Same approach; the index is unused.' },
      { loop: 'nested', required: ['max', 'counter'], rating: 'works', complexity: 'O(n²) time', why: 'Scanning the array again for x + 1, x + 2, … from every number works but is quadratic.' },
    ],
  },
  {
    id: 'jump-game', title: 'Jump Game', difficulty: 'Medium',
    description: 'You start at index 0. <code>nums[i]</code> is the farthest you can jump from <code>i</code>. Return true if you can reach the last index.',
    example: { input: 'nums = [2, 3, 1, 1, 4]', output: 'true' },
    hint: 'Don\'t try every jump. Just track the farthest index you could possibly reach so far.',
    solutions: [
      { loop: 'single', required: ['max'], rating: 'optimal', complexity: 'O(n) time, O(1) space',
        why: 'max is the farthest reachable index. If i ever passes it, you\'re stuck; otherwise extend it with i + nums[i].',
        code: 'let max = 0; // farthest reachable index\nfor (let i = 0; i < nums.length; i++) {\n  if (i > max) return false;\n  max = Math.max(max, i + nums[i]);\n}\nreturn true;',
        trace() {
          const a = [2, 3, 1, 1, 4], s = []; let max = 0;
          s.push(S(a, {}, { max }, 'max = 0'));
          for (let i = 0; i < a.length; i++) {
            max = Math.max(max, i + a[i]);
            s.push(S(a, { i }, { max }, `reach from here = ${i} + ${a[i]} → max = ${max}`));
            if (max >= a.length - 1) { s.push(S(a, {}, { max }, `max ≥ last index (${a.length - 1}) → return true`)); return s; }
          }
          return s;
        } },
    ],
  },
  {
    id: 'coin-change', title: 'Coin Change', difficulty: 'Medium',
    description: 'With coins <code>[1, 2, 5]</code> (unlimited of each), return the <b>fewest</b> coins that make <code>amount</code> (or -1 if it can\'t be made).',
    example: { input: 'coins = [1, 2, 5], amount = 11', output: '3  (5 + 5 + 1)' },
    hint: 'Greedy fails for some coin sets. Build the answer for every amount from 1 up, reusing the answers for smaller amounts.',
    solutions: [
      { loop: 'dp', required: ['dp'], rating: 'optimal', complexity: 'O(amount × coins) time, O(amount) space',
        why: 'dp[a] = 1 + the best of dp[a - coin] over every coin. Each amount reuses smaller, already-solved amounts.',
        code: 'const dp = new Array(amount + 1).fill(Infinity);\ndp[0] = 0;\nfor (let a = 1; a <= amount; a++) {\n  for (const coin of coins) {\n    if (a >= coin) dp[a] = Math.min(dp[a], dp[a - coin] + 1);\n  }\n}\nreturn dp[amount];',
        trace() {
          const coins = [1, 2, 5], dp = [0, ...Array(11).fill(Infinity)], a = dp.map((v, i) => (i ? '?' : 0)), s = [];
          const V = () => ({ dp: `[${dp.map((v) => (v === Infinity ? '∞' : v)).join(', ')}]` });
          s.push(S(a, {}, V(), 'dp[0] = 0 (zero coins make amount 0), everything else = ∞'));
          for (let i = 1; i <= 11; i++) {
            const opts = coins.filter((c) => i >= c).map((c) => dp[i - c] + 1); dp[i] = Math.min(...opts); a[i] = dp[i];
            s.push(S(a, { i }, V(), `dp[${i}] = min(${coins.filter((c) => i >= c).map((c) => `dp[${i - c}]+1`).join(', ')}) = ${dp[i]}`));
          }
          s.push(S(a, {}, V(), `Return dp[11] = ${dp[11]}`)); return s;
        } },
      { loop: 'single', required: ['dp'], rating: 'optimal', complexity: 'O(amount × coins) time, O(amount) space', why: 'Same table, filled by an ordinary indexed loop over the amounts.' },
    ],
  },
  {
    id: 'lis', title: 'Longest Increasing Subsequence', difficulty: 'Medium',
    description: 'Return the length of the longest <b>strictly increasing</b> subsequence of <code>nums</code> (elements need not be adjacent).',
    example: { input: 'nums = [10, 9, 2, 5, 3, 7, 101, 18]', output: '4  (2, 3, 7, 18)' },
    hint: 'Let dp[i] be the longest increasing subsequence that ends at i. Which earlier values could sit right before nums[i]?',
    solutions: [
      { loop: 'dp', required: ['dp'], rating: 'optimal', complexity: 'O(n²) time, O(n) space',
        why: 'dp[i] = 1 + the best dp[j] among earlier j with nums[j] < nums[i]. The answer is the largest dp value. (A binary-search version reaches O(n log n).)',
        code: 'const dp = new Array(nums.length).fill(1);\nfor (let i = 1; i < nums.length; i++) {\n  for (let j = 0; j < i; j++) {\n    if (nums[j] < nums[i]) dp[i] = Math.max(dp[i], dp[j] + 1);\n  }\n}\nreturn Math.max(...dp);',
        trace() {
          const a = [10, 9, 2, 5, 3, 7, 101, 18], dp = Array(a.length).fill(1), s = [];
          const V = () => ({ dp: `[${dp.join(', ')}]` });
          s.push(S(a, {}, V(), 'Every element alone is a subsequence of length 1'));
          for (let i = 1; i < a.length; i++) {
            for (let j = 0; j < i; j++) if (a[j] < a[i]) dp[i] = Math.max(dp[i], dp[j] + 1);
            s.push(S(a, { i }, V(), `dp[${i}] (${a[i]}) = ${dp[i]}`));
          }
          s.push(S(a, {}, V(), `Return max(dp) = ${Math.max(...dp)}`)); return s;
        } },
      { loop: 'single', required: ['dp'], rating: 'optimal', complexity: 'O(n²) time, O(n) space', why: 'Same table, filled by an indexed loop.' },
    ],
  },
);
