# RemoveRedditTracking
This is a userscript for removing reddit tracking links


Requires a addon that can use userscripts

[GreaseMonkey for Firefox](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/ "GreaseMonkey for Firefox")


[TamperMonkey for Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en "TamperMonkey for Chrome")

This forces links to remove the tracking that reddit places inside them

* Removes reddits affiliate links (Reddit removed affiliate links but its still in there)
* Removes reddits outbound url tracker
* Removes reddits inbound url tracker


OPTIONAL:

Change ChangeColorOnEdit to true for this

When ever a link is replaced with this script the link is changed to the color Green (#00FF00)








## Regression tests

Use Node.js 22 or newer. No dependencies or install step are needed:

```sh
npm test
npm run test:coverage
```

The tests execute the unchanged userscript in isolated Node VM contexts with a
small DOM fixture and deterministic timers. They cover all four tracking-removal
paths (affiliate, outbound, inbound, event), companion-attribute removal,
preservation of destinations and unrelated attributes, combined trackers,
optional coloring, initial detection, RES polling, delayed load-more cleanup,
polling termination, comment-page gating, and five-link trending rewriting.

Four expected-behavior tests are marked TODO and **execute and fail** on master:

- Repeated scans register the load-more listener again and append duplicate IDs.
  `EventArray[i] == 'links[i].id'` uses `i` rather than `j` and compares against a
  literal string. Native browsers deduplicate identical listener callbacks, so
  this demonstrates broken bookkeeping, not multiple click callback executions.
- Replacing a link without increasing the total count leaves its tracker intact;
  scans require `links.length > linksCount`. Count decreases and attribute-only
  changes have the same limitation, but are not separate test cases.
- A trending container with one link logs an error because the loop assumes five.
- An absent trending container logs an error and sets `bSetTrending` too early;
  adding it later never triggers rewriting.

TODO failures do not make Node exit unsuccessfully. Remove each TODO annotation
when fixing its defect; the expected-behavior assertion is already present.
No production fixes are included in this test-only change.

Measured on Node 24.19.0: **16 tests, 12 passing, 4 failing TODOs, 0 skipped**.
V8 coverage for `RemoveRedditTracking.js` alone is **97.69% lines, 97.22%
branches, 100% functions**, including execution by the failing TODO tests. Lines
85–87 (the unreachable-in-normal-use `found = true` branch) remain uncovered.
Coverage is a measure of executed code, not browser compatibility: these fixtures
do not test a live Reddit page, a userscript manager, real jQuery integration,
native DOM behavior, navigation, or rendering. The timeout test records the
actual nine-second polling termination despite the source comment saying eight.
