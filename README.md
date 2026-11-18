<p align="center">
  <img src="logo.svg" alt="Loopwise logo" width="96" height="96" />
</p>

<h1 align="center">Loopwise</h1>

<p align="center">
  LeetCode-style practice for choosing the right <b>loop pattern</b> and <b>variables</b>, with no typing needed.<br />
  <a href="https://tl-tai-tang.github.io/loopwise/"><b>▶ Try it live</b></a>
</p>

## Run
Open `index.html` in a browser, or serve it:

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## How it works
1. Pick a problem from the sidebar.
2. Choose a loop pattern, such as indexed for, two pointers, sliding window or binary search.
3. Toggle the variables you need, such as counter, temp, max so far or hash map. A code skeleton builds as you choose.
4. Press **Check**. The result is Optimal, Works but not the best, Missing variables, or Wrong loop.
5. Step through the visualiser to see pointers and variables change.

The **Pattern Guide** tab shows which signal words point to which loop.

## Adding problems
Add an entry to `PROBLEMS` in `problems.js`. `solutions[0]` is the optimal one. Each solution sets a `loop`, the `required` vars (a nested array means "any of these"), optional `optional` vars, a `rating` (`optimal`/`works`) and an optional `trace()` for the visualiser.
