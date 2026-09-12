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

## The clock

The suite runs at a **pinned instant** — 10:00 Europe/London today — rather than at whatever
time you happen to start it. See `fixed-clock.mjs`, which is imported first by `tick.test.mjs`.

This is not tidiness. The logic under test refuses to send outside 06:00-23:00 London and
files the logs reminder in a 21:00 slot hardcoded to UK time, so an unpinned clock made the
suite report different things at different hours: twelve tests went red in the late evening,
asserting against a hold the code had correctly applied, and two more quietly returned without
asserting anything during the day. The false alarm cost an hour once; the silent pass was
worse, because the logs reminder went untested and still printed PASS.

The two tests that are about the 21:00 slot pin themselves to the evening with
`atLondonTime('21:30', ...)` and assert properly.

```
node tick.test.mjs                    # 10:00 London, the default
TICK_CLOCK=21:45 node tick.test.mjs   # some other London time
TICK_CLOCK=real  node tick.test.mjs   # the wall clock, the old behaviour
```

Pinning past 21:00 turns five other tests red, and none is a bug — their fixtures leave the
daily logs unfilled, which adds a logs reminder to the bundle once that slot opens. Those
fixtures would need the logs filled in before they could run in the evening.

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
