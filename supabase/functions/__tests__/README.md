# Edge-function tests

`digest-template.test.mjs` (repo root) needs nothing at all — plain Node, like the rest of
this project.

These tests are different: they execute the **real** `reminder-tick/index.ts` by
transpiling it and swapping its three imports for local stubs, so the collect-then-send
logic is exercised rather than eyeballed. That needs a TypeScript compiler, which this
repo otherwise does not use:

```
npm install typescript          # once, anywhere on the path
node buildtick.mjs              # transpiles index.ts -> tick.built.mjs
node tick.test.mjs
```

`tick.built.mjs` is generated and should not be committed.

What they cover, all of which are things that previously failed silently in production:

- several outstanding concerns produce exactly **one** email, not one per concern
- a rejected send does **not** mark anything as sent, so an outage cannot permanently
  suppress a reminder — and the retry afterwards works
- a successful send is not repeated while nothing has changed
- a `high`/`critical` item forces the digest out immediately instead of waiting for the
  4-hour cadence and arriving after the deadline it was warning about
- push still fires when email is switched off
- an HTML part is included by default, and withheld when the user has set their own
  template
