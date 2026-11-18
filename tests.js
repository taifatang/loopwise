// =====================================================================
// Test cases for the code panel.
//   fn / params : the function the learner writes
//   cases       : { args, expected } — plain JSON, except
//                   { __list: [...] } → a ListNode chain, { __tree: [...] } → a TreeNode tree
//   pick        : what to compare with `expected` (default: the return value)
//                   'arg0'       → the first argument after the call (in-place problems)
//                   'retOrArg0'  → the return value if it is an array, else the first argument
//                   'kprefix'    → [return value, first `return value` items of the first argument]
//   cmp         : 'sorted' → sort the answer first; 'sets' → ignore the order of subsets
// =====================================================================
const TESTS = {
  'count-vowels': { fn: 'countVowels', params: ['s'], cases: [
    { args: ['algorithm'], expected: 3 }, { args: [''], expected: 0 }, { args: ['rhythm'], expected: 0 }, { args: ['education'], expected: 5 }] },
  'find-max': { fn: 'findMax', params: ['nums'], cases: [
    { args: [[3, 7, 2, 9, 4]], expected: 9 }, { args: [[-5, -2, -9]], expected: -2 }, { args: [[42]], expected: 42 }] },
  'reverse-array': { fn: 'reverseArray', params: ['nums'], pick: 'arg0', note: 'Change <code>nums</code> in place — the tests read the array after your function runs.', cases: [
    { args: [[1, 2, 3, 4, 5, 6]], expected: [6, 5, 4, 3, 2, 1] }, { args: [[1, 2, 3]], expected: [3, 2, 1] }, { args: [[1]], expected: [1] }, { args: [[]], expected: [] }] },
  'two-sum': { fn: 'twoSum', params: ['nums', 'target'], cmp: 'sorted', cases: [
    { args: [[3, 4, 2, 6, 9], 8], expected: [2, 3] }, { args: [[2, 7, 11, 15], 9], expected: [0, 1] }, { args: [[3, 3], 6], expected: [0, 1] }] },
  'contains-duplicate': { fn: 'containsDuplicate', params: ['nums'], cases: [
    { args: [[4, 1, 3, 1, 5]], expected: true }, { args: [[1, 2, 3]], expected: false }, { args: [[]], expected: false }] },
  stock: { fn: 'maxProfit', params: ['prices'], cases: [
    { args: [[7, 1, 5, 3, 6, 4]], expected: 5 }, { args: [[7, 6, 4, 3, 1]], expected: 0 }, { args: [[2, 4, 1]], expected: 2 }] },
  'valid-palindrome': { fn: 'isPalindrome', params: ['s'], cases: [
    { args: ['racecar'], expected: true }, { args: ['abca'], expected: false }, { args: [''], expected: true }, { args: ['abba'], expected: true }] },
  'remove-duplicates': { fn: 'removeDuplicates', params: ['nums'], pick: 'kprefix', note: 'Return the count <code>k</code> and leave the unique values in the first <code>k</code> slots of <code>nums</code>.', cases: [
    { args: [[1, 1, 2, 3, 3, 3, 4]], expected: [4, [1, 2, 3, 4]] }, { args: [[1, 2, 3]], expected: [3, [1, 2, 3]] }, { args: [[5, 5, 5]], expected: [1, [5]] }, { args: [[]], expected: [0, []] }] },
  'reverse-integer': { fn: 'reverseInteger', params: ['n'], cases: [
    { args: [1234], expected: 4321 }, { args: [1200], expected: 21 }, { args: [5], expected: 5 }] },
  fibonacci: { fn: 'fib', params: ['n'], cases: [
    { args: [7], expected: 13 }, { args: [0], expected: 0 }, { args: [1], expected: 1 }, { args: [10], expected: 55 }] },
  'first-unique': { fn: 'firstUnique', params: ['s'], cases: [
    { args: ['loveleet'], expected: 1 }, { args: ['leetcode'], expected: 0 }, { args: ['aabb'], expected: -1 }, { args: ['z'], expected: 0 }] },
  'binary-search': { fn: 'search', params: ['nums', 'target'], cases: [
    { args: [[1, 3, 5, 7, 9, 11, 13], 9], expected: 4 }, { args: [[1, 3, 5, 7, 9, 11, 13], 2], expected: -1 }, { args: [[5], 5], expected: 0 }, { args: [[], 1], expected: -1 }] },
  'two-sum-sorted': { fn: 'twoSumSorted', params: ['nums', 'target'], cmp: 'sorted', cases: [
    { args: [[1, 3, 4, 6, 8, 11], 10], expected: [2, 3] }, { args: [[2, 7, 11, 15], 9], expected: [0, 1] }, { args: [[1, 2, 3, 4], 7], expected: [2, 3] }] },
  'max-sum-k': { fn: 'maxSumK', params: ['nums', 'k'], cases: [
    { args: [[2, 1, 5, 1, 3, 2], 3], expected: 9 }, { args: [[1, 2, 3], 3], expected: 6 }, { args: [[4, 2, 1, 7, 8, 1, 2, 8, 1, 0], 3], expected: 16 }] },
  'longest-substring': { fn: 'lengthOfLongestSubstring', params: ['s'], cases: [
    { args: ['abcabcbb'], expected: 3 }, { args: ['bbbbb'], expected: 1 }, { args: ['pwwkew'], expected: 3 }, { args: [''], expected: 0 }] },
  'bubble-sort': { fn: 'bubbleSort', params: ['nums'], pick: 'retOrArg0', note: 'Sort in place (or return the sorted array) — either is accepted.', cases: [
    { args: [[5, 3, 8, 1, 4]], expected: [1, 3, 4, 5, 8] }, { args: [[3, 2, 1]], expected: [1, 2, 3] }, { args: [[2, 2, 1]], expected: [1, 2, 2] }, { args: [[]], expected: [] }] },
  'merge-sorted': { fn: 'mergeSorted', params: ['a', 'b'], cases: [
    { args: [[1, 3, 5, 7], [2, 4, 6]], expected: [1, 2, 3, 4, 5, 6, 7] }, { args: [[], [1]], expected: [1] }, { args: [[1, 2], []], expected: [1, 2] }, { args: [[1, 1], [1, 2]], expected: [1, 1, 1, 2] }] },
  'reverse-linked-list': { fn: 'reverseList', params: ['head'], note: 'Nodes are <code>{ val, next }</code>. The tests turn your returned list back into an array to compare.', cases: [
    { args: [{ __list: [1, 2, 3, 4] }], expected: [4, 3, 2, 1] }, { args: [{ __list: [7] }], expected: [7] }, { args: [{ __list: [] }], expected: [] }] },
  'daily-temperatures': { fn: 'dailyTemperatures', params: ['temps'], cases: [
    { args: [[73, 74, 75, 71, 69, 72, 76, 73]], expected: [1, 1, 4, 2, 1, 1, 0, 0] }, { args: [[30, 40, 50, 60]], expected: [1, 1, 1, 0] }, { args: [[90, 80]], expected: [0, 0] }] },
  'max-depth-tree': { fn: 'maxDepth', params: ['root'], note: 'Nodes are <code>{ val, left, right }</code>, or <code>null</code> for an empty tree.', cases: [
    { args: [{ __tree: [3, 9, 20, null, null, 15, 7] }], expected: 3 }, { args: [{ __tree: [1, null, 2] }], expected: 2 }, { args: [{ __tree: [] }], expected: 0 }] },
  'path-sum': { fn: 'hasPathSum', params: ['root', 'target'], note: 'Nodes are <code>{ val, left, right }</code>. The path must end at a <b>leaf</b>.', cases: [
    { args: [{ __tree: [5, 4, 8, 11, null, 13, 4, 7, 2] }, 22], expected: true }, { args: [{ __tree: [5, 4, 8, 11, null, 13, 4, 7, 2] }, 5], expected: false }, { args: [{ __tree: [1, 2] }, 1], expected: false }, { args: [{ __tree: [] }, 0], expected: false }] },
  islands: { fn: 'numIslands', params: ['grid'], cases: [
    { args: [[[1, 1, 0, 0, 0], [1, 1, 0, 0, 1], [0, 0, 1, 0, 1], [0, 0, 0, 1, 1]]], expected: 3 }, { args: [[[1, 1], [1, 1]]], expected: 1 }, { args: [[[0]]], expected: 0 }, { args: [[[1, 0, 1], [0, 1, 0], [1, 0, 1]]], expected: 5 }] },
  'house-robber': { fn: 'rob', params: ['nums'], cases: [
    { args: [[2, 7, 9, 3, 1]], expected: 12 }, { args: [[1, 2, 3, 1]], expected: 4 }, { args: [[5]], expected: 5 }, { args: [[]], expected: 0 }] },
  'subarray-sum-k': { fn: 'subarraySum', params: ['nums', 'k'], cases: [
    { args: [[1, 2, 3, -2, 2], 3], expected: 4 }, { args: [[1, 1, 1], 2], expected: 2 }, { args: [[1], 0], expected: 0 }] },
  subsets: { fn: 'subsets', params: ['nums'], cmp: 'sets', note: 'Order doesn\'t matter — only that every subset appears once.', cases: [
    { args: [[1, 2, 3]], expected: [[], [1], [2], [3], [1, 2], [1, 3], [2, 3], [1, 2, 3]] }, { args: [[0]], expected: [[], [0]] }, { args: [[]], expected: [[]] }] },

  'max-subarray': { fn: 'maxSubArray', params: ['nums'], cases: [
    { args: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6 }, { args: [[1]], expected: 1 }, { args: [[5, 4, -1, 7, 8]], expected: 23 }, { args: [[-3, -1, -2]], expected: -1 }] },
  'single-number': { fn: 'singleNumber', params: ['nums'], cases: [
    { args: [[4, 1, 2, 1, 2]], expected: 4 }, { args: [[2, 2, 1]], expected: 1 }, { args: [[7]], expected: 7 }] },
  'missing-number': { fn: 'missingNumber', params: ['nums'], cases: [
    { args: [[9, 6, 4, 2, 3, 5, 7, 0, 1]], expected: 8 }, { args: [[3, 0, 1]], expected: 2 }, { args: [[0, 1]], expected: 2 }] },
  'valid-parentheses': { fn: 'isValid', params: ['s'], cases: [
    { args: ['([{}])[]'], expected: true }, { args: ['(]'], expected: false }, { args: ['(('], expected: false }, { args: [''], expected: true }, { args: [')('], expected: false }] },
  'container-water': { fn: 'maxArea', params: ['heights'], cases: [
    { args: [[1, 8, 6, 2, 5, 4, 8, 3, 7]], expected: 49 }, { args: [[1, 1]], expected: 1 }, { args: [[4, 3, 2, 1, 4]], expected: 16 }] },
  'longest-consecutive': { fn: 'longestConsecutive', params: ['nums'], cases: [
    { args: [[100, 4, 200, 1, 3, 2]], expected: 4 }, { args: [[0, 3, 7, 2, 5, 8, 4, 6, 0, 1]], expected: 9 }, { args: [[]], expected: 0 }] },
  'jump-game': { fn: 'canJump', params: ['nums'], cases: [
    { args: [[2, 3, 1, 1, 4]], expected: true }, { args: [[3, 2, 1, 0, 4]], expected: false }, { args: [[0]], expected: true }] },
  'coin-change': { fn: 'coinChange', params: ['coins', 'amount'], note: 'Return <code>-1</code> if the amount can\'t be made.', cases: [
    { args: [[1, 2, 5], 11], expected: 3 }, { args: [[2], 3], expected: -1 }, { args: [[1], 0], expected: 0 }, { args: [[1, 3, 4], 6], expected: 2 }] },
  lis: { fn: 'lengthOfLIS', params: ['nums'], cases: [
    { args: [[10, 9, 2, 5, 3, 7, 101, 18]], expected: 4 }, { args: [[0, 1, 0, 3, 2, 3]], expected: 4 }, { args: [[7, 7, 7]], expected: 1 }] },
};
