const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const filename = path.resolve(__dirname, '../RemoveRedditTracking.js');
const source = fs.readFileSync(filename, 'utf8');

// Only the browser surface used by this userscript. Each test gets fresh globals.
function anchor(attributes = {}, innerText = '', id = '') {
  const attrs = { ...attributes };
  const listeners = new Map();
  return {
    innerText, id, href: 'https://example.com/original', style: {}, registrations: 0,
    hasAttribute: name => Object.hasOwn(attrs, name),
    removeAttribute: name => { delete attrs[name]; },
    addEventListener(type, callback) {
      this.registrations++;
      // Browsers deduplicate identical type/callback registrations.
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(callback);
    },
    click() { for (const callback of listeners.get('click') || []) callback(); }
  };
}

function fixture({ links = [], comments = false, front = false, trending, res = false } = {}) {
  let now = 0;
  let nextId = 0;
  const timers = new Map();
  const logs = [];
  function schedule(fn, ms, repeat) {
    const id = ++nextId;
    timers.set(id, { fn, at: now + ms, repeat });
    return id;
  }
  const context = vm.createContext({
    document: {
      links,
      getElementsByClassName(name) {
        if (name === 'front-page') return front ? [{}] : [];
        if (name === 'comments') return comments ? [{}] : [];
        if (name === 'trending-subreddits-content' && trending !== undefined)
          return [{ getElementsByTagName: () => trending }];
        return [];
      }
    },
    $: () => res ? [{}] : [],
    console: { log: message => logs.push(message) },
    setInterval: (fn, ms) => schedule(fn, ms, ms),
    clearInterval: id => timers.delete(id),
    setTimeout: (fn, ms) => schedule(fn, ms, 0)
  });
  vm.runInContext(source, context, { filename });
  return {
    context, links, logs, timers,
    setTrending(value) { trending = value; },
    tick(ms) {
      const end = now + ms;
      while (true) {
        const entry = [...timers].filter(([, timer]) => timer.at <= end)
          .sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
        if (!entry) break;
        const [id, timer] = entry;
        now = timer.at;
        if (timer.repeat) timer.at += timer.repeat;
        else timers.delete(id);
        timer.fn();
      }
      now = end;
    }
  };
}

const paths = [
  ['affiliate', ['data-affiliate-url', 'data-href-url']],
  ['outbound', ['data-outbound-url', 'data-outbound-expiration', 'data-href-url']],
  ['inbound', ['data-inbound-url', 'data-href-url']],
  ['event', ['data-event-action']]
];
for (const [name, attributes] of paths) {
  test(`${name}: removes tracking, preserves destination and unrelated attributes`, () => {
    const link = anchor(Object.fromEntries([...attributes.map(key => [key, 'tracking']), ['title', 'keep']]));
    const f = fixture({ links: [link] });
    f.context.RemoveAffiliate();
    for (const attribute of attributes) assert.equal(link.hasAttribute(attribute), false);
    assert.equal(link.hasAttribute('title'), true);
    assert.equal(link.href, 'https://example.com/original');
    assert.deepEqual(link.style, {});
    assert.deepEqual(f.logs, []);
  });
}

test('combined tracking paths and optional green highlighting', () => {
  const attributes = [...new Set(paths.flatMap(([, keys]) => keys))];
  const link = anchor(Object.fromEntries(attributes.map(key => [key, 'tracking'])));
  const f = fixture({ links: [link] });
  f.context.ChangeColorOnEdit = true;
  f.context.RemoveAffiliate();
  for (const attribute of attributes) assert.equal(link.hasAttribute(attribute), false);
  assert.equal(link.style.color, '#00FF00');
});

test('ordinary links and unpaired companion attributes remain untouched', () => {
  const link = anchor({ 'data-href-url': 'keep', 'data-outbound-expiration': 'keep' });
  const f = fixture({ links: [link] });
  f.context.RemoveAffiliate();
  f.context.RemoveAffiliate();
  assert.equal(link.hasAttribute('data-href-url'), true);
  assert.equal(link.hasAttribute('data-outbound-expiration'), true);
  assert.deepEqual(f.logs, []);
});

test('without RES: initial cleanup at two seconds; detection stops at five', () => {
  const link = anchor({ 'data-inbound-url': 'tracking' });
  const f = fixture({ links: [link] });
  f.tick(1999);
  assert.equal(link.hasAttribute('data-inbound-url'), true);
  f.tick(1);
  assert.equal(link.hasAttribute('data-inbound-url'), false);
  f.tick(3000);
  assert.equal(f.timers.size, 0);
});

test('RES polling cleans appended links on the next interval', () => {
  const f = fixture({ res: true });
  f.tick(2000);
  const link = anchor({ 'data-outbound-url': 'tracking' });
  f.links.push(link);
  f.tick(999);
  assert.equal(link.hasAttribute('data-outbound-url'), true);
  f.tick(1);
  assert.equal(link.hasAttribute('data-outbound-url'), false);
});

test('load-more click waits, polls, then cleans appended links and resets delay state', () => {
  const more = anchor({}, 'load more comments', 'more');
  const f = fixture({ links: [more], comments: true });
  f.tick(5000);
  more.click();
  f.tick(2000); // No new links yet: keep waiting.
  const link = anchor({ 'data-event-action': 'tracking' });
  f.links.push(link);
  f.tick(999);
  assert.equal(link.hasAttribute('data-event-action'), true);
  f.tick(1);
  assert.equal(link.hasAttribute('data-event-action'), false);
  assert.equal(f.context.DelayCheckCount, -1);
  assert.equal(f.context.DelayCheckTimeOut, 0);
  assert.equal(f.timers.size, 0);
});

test('load-more polling terminates after nine seconds without growth', () => {
  const more = anchor({}, 'load more comments', 'more');
  const f = fixture({ links: [more], comments: true });
  f.tick(5000);
  more.click();
  f.tick(9000);
  assert.equal(f.timers.size, 0);
  assert.equal(f.context.DelayCheckTimeOut, 0);
});

test('load-more text outside a comments page does not install a listener', () => {
  const more = anchor({}, 'load more comments', 'more');
  const f = fixture({ links: [more] });
  f.context.RemoveAffiliate();
  assert.equal(more.registrations, 0);
});

test('five trending links are rewritten once, with optional highlighting', () => {
  const trending = Array.from({ length: 5 }, (_, i) => anchor({}, `/r/test${i}`));
  const f = fixture({ links: trending, front: true, trending });
  f.context.ChangeColorOnEdit = true;
  f.context.RemoveAffiliate();
  trending.forEach((link, i) => {
    assert.equal(link.href, `https://www.reddit.com/r/test${i}`);
    assert.equal(link.style.color, '#00FF00');
  });
  trending[0].innerText = '/r/changed';
  f.context.RemoveAffiliate();
  assert.equal(trending[0].href, 'https://www.reddit.com/r/test0');
  assert.deepEqual(f.logs, []);
});

// Executed expected-behavior regressions: TODO failures document unfixed defects.
test('load-more listener bookkeeping stays unique after link growth', { todo: 'EventArray compares the wrong index to a literal string' }, () => {
  const more = anchor({}, 'load more comments', 'more');
  const f = fixture({ links: [anchor(), more], comments: true });
  f.context.RemoveAffiliate();
  f.links.push(anchor());
  f.context.RemoveAffiliate();
  assert.equal(more.registrations, 1);
  assert.equal(f.context.EventArray.length, 1);
});

test('RES cleans a replacement link when total link count stays constant', { todo: 'linksCount only permits scans after count growth' }, () => {
  const f = fixture({ links: [anchor()], res: true });
  f.tick(2000);
  const replacement = anchor({ 'data-inbound-url': 'tracking' });
  f.links.splice(0, 1, replacement);
  f.tick(1000);
  assert.equal(replacement.hasAttribute('data-inbound-url'), false);
});

test('front page tolerates fewer than five trending links', { todo: 'fixed five-link loop dereferences missing anchors' }, () => {
  const trending = [anchor({}, '/r/test')];
  const f = fixture({ links: trending, front: true, trending });
  f.context.RemoveAffiliate();
  assert.equal(trending[0].href, 'https://www.reddit.com/r/test');
  assert.deepEqual(f.logs, []);
});

test('front page can discover a trending container added later', { todo: 'bSetTrending is set before the container is found' }, () => {
  const f = fixture({ front: true });
  f.context.RemoveAffiliate();
  const trending = [anchor({}, '/r/late')];
  f.setTrending(trending);
  f.links.push(...trending);
  f.context.RemoveAffiliate();
  assert.equal(trending[0].href, 'https://www.reddit.com/r/late');
});
