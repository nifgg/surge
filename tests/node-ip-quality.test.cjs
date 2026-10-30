const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(__dirname + '/../scripts/node-ip-quality/node-ip-quality.js', 'utf8');
const IP = '8.8.8.8';

function run({ loon = false, target = '香港 A', handler, params, intent, argument, noContext = false, policies, apiHang = false } = {}) {
  let now = 0, sequence = 0;
  const queue = [], calls = [], done = [], notices = [];
  const timer = (fn, delay) => queue.push({ fn, at: now + delay, sequence: sequence++ });
  const context = {
    Date: { now: () => now }, setTimeout: timer,
    console: { log() {} },
    $done: x => done.push(JSON.parse(JSON.stringify(x))),
    $notification: { post: (...x) => notices.push(x) },
    $httpAPI(method, path, body, callback) {
      assert.equal(method, 'GET'); assert.equal(path, '/v1/policies');
      if (!apiHang) timer(() => callback(policies || { proxies: [intent || target], 'policy-groups': [] }), 10);
    },
    $httpClient: { get(options, callback) {
      calls.push(options);
      let reply = handler ? handler(options, calls) : null;
      if (!reply) reply = options.url === 'https://ident.me/json'
        ? { data: { ip: IP, type: 'isp', aso: 'Example', asn: 123 } }
        : { status: 503, data: {} };
      if (reply.hang) return;
      timer(() => callback(reply.error || null, { status: reply.status || 200 }, reply.raw !== undefined ? reply.raw : JSON.stringify(reply.data)), reply.delay === undefined ? 10 : reply.delay);
    } }
  };
  if (loon) {
    context.$loon = 'iPhone 18.0 3.2';
    if (!noContext) context.$environment = { params: params || { nodeInfo: { name: target } } };
  } else {
    context.$argument = argument === undefined ? target : argument;
    context.$input = { purpose: 'panel' };
    if (intent) context.$intent = { parameter: intent };
  }
  vm.runInNewContext(source, context, { timeout: 1000 });
  while (queue.length) {
    queue.sort((a, b) => a.at - b.at || a.sequence - b.sequence);
    const item = queue.shift(); now = item.at; item.fn();
    assert.ok(sequence < 150, 'timer storm');
  }
  assert.equal(done.length, 1, '$done must be called exactly once, including late callbacks');
  return { result: done[0], content: done[0].content || done[0].htmlMessage, calls, notices };
}
function onlySource(name, data, options = {}) {
  return run({ ...options, handler(o, calls) {
    if (o.url === 'https://ident.me/json' && calls.filter(c => c.url === o.url).length === 1) return { data: { ip: IP } };
    if (o.url.includes(name)) return { data };
    return { status: 503, data: {} };
  } });
}

test('Surge pins every request and uses seconds', () => {
  const r = run();
  assert.match(r.result.title, /优 · 住宅/);
  assert.ok(r.calls.every(c => c.policy === '香港 A' && !('node' in c)));
  assert.equal(r.calls[0].timeout, 6);
  assert.match(r.content, /Tor=未提供/);
  assert.equal(r.notices.length, 0);
});
test('Loon uses nodeInfo and milliseconds, returns escaped HTML', () => {
  const r = run({ loon: true, target: '<script>alert(1)</script>&测试' });
  assert.ok(r.calls.every(c => c.node === '<script>alert(1)</script>&测试' && !('policy' in c)));
  assert.equal(r.calls[0].timeout, 6000);
  assert.match(r.content, /&lt;script&gt;/);
  assert.ok(!r.content.includes('<script>'));
});
test('Loon legacy node and group contexts work', () => {
  assert.equal(run({ loon: true, params: { node: '旧节点' } }).calls[0].node, '旧节点');
  assert.equal(run({ loon: true, params: { policyGroup: '组' } }).calls[0].node, '组');
});
test('missing target must never silently test DIRECT', () => {
  assert.equal(run({ target: '' }).calls.length, 0);
  assert.equal(run({ target: '请填写节点或策略组名称' }).calls.length, 0);
  assert.equal(run({ loon: true, noContext: true }).calls.length, 0);
});
test('Shortcuts parameter takes precedence', () => {
  assert.equal(run({ intent: '美国 B' }).calls[0].policy, '美国 B');
});
test('ip-api hosting produces normal and proxy does not downgrade', () => {
  const r = onlySource('ip-api.com', { status: 'success', query: IP, hosting: true, mobile: false, proxy: true });
  assert.match(r.result.title, /普通 · 机房/);
});
test('inferred residential is clearly labeled', () => {
  const r = onlySource('ip-api.com', { status: 'success', hosting: false, mobile: false, proxy: true });
  assert.match(r.result.title, /优 · 住宅/);
  assert.match(r.content, /住宅（推断）/);
  assert.match(r.content, /代理=命中/);
});
test('missing flags are not inferred as residential', () => {
  assert.match(onlySource('ip-api.com', { status: 'success' }).result.title, /查询失败/);
  assert.match(onlySource('api.ipquery.io', { ip: IP, risk: {} }).result.title, /查询失败/);
});
test('IPQuery mobile + VPN remains good; Tor overrides', () => {
  const data = { ip: IP, risk: { is_datacenter: false, is_mobile: true, is_vpn: true, is_tor: false } };
  assert.match(onlySource('api.ipquery.io', data).result.title, /优 · 移动网络/);
  data.risk.is_tor = true;
  assert.match(onlySource('api.ipquery.io', data).result.title, /风险/);
});
test('IPLocate maps education to business, abuser overrides', () => {
  const data = { ip: IP, company: { type: 'education', name: '<img src=x>' }, privacy: { is_abuser: true } };
  const r = onlySource('iplocate.io', data, { loon: true });
  assert.match(r.result.title, /风险 · 商业/);
  assert.match(r.content, /&lt;img src=x&gt;/);
});
test('ipapi.is handles full and reduced anonymous responses', () => {
  const full = { ip: IP, company: { type: 'business' }, is_vpn: true };
  assert.match(onlySource('api.ipapi.is', full).result.title, /优 · 商业/);
  assert.match(onlySource('api.ipapi.is', { ip: IP, company: 'Only a name', asn: 'AS123' }).result.title, /查询失败/);
});
test('ProxyCheck v3 handles wireless and hosting priority', () => {
  const data = { status: 'ok', [IP]: { network: { type: 'Wireless' }, detections: { vpn: true } } };
  assert.match(onlySource('proxycheck.io', data).result.title, /优 · 移动网络/);
  data[IP].detections.hosting = true;
  assert.match(onlySource('proxycheck.io', data).result.title, /普通 · 机房/);
});
test('explicit later source beats early inferred residential', () => {
  const r = run({ handler(o) {
    if (o.url.includes('ident.me')) return { data: { ip: IP } };
    if (o.url.includes('ip-api.com')) return { data: { status: 'success', hosting: false, mobile: false } };
    if (o.url.includes('iplocate.io')) return { data: { ip: IP, company: { type: 'hosting' } } };
    return { status: 503, data: {} };
  } });
  assert.match(r.result.title, /普通 · 机房/);
  assert.match(r.content, /采用来源：IPLocate/);
});
test('first explicit source wins without merging another source risk', () => {
  const r = run({ handler(o) {
    if (o.url.includes('ident.me')) return { data: { ip: IP, type: 'isp' }, delay: 30 };
    if (o.url.includes('ipquery')) return { data: { ip: IP, risk: { is_datacenter: true, is_tor: true } }, delay: 500 };
    return { status: 503, data: {} };
  } });
  assert.match(r.result.title, /优 · 住宅/);
  assert.ok(!r.calls.some(c => c.url.includes('proxycheck')));
});
test('mismatching IP is never accepted', () => {
  assert.match(onlySource('ip-api.com', { status: 'success', query: '1.1.1.1', hosting: true }).content, /IP 不一致/);
});
test('bad JSON and rate limiting produce actionable failures', () => {
  const r = run({ handler(o, calls) {
    if (calls.length === 1) return { data: { ip: IP } };
    return o.url.includes('ip-api.com') ? { status: 429, data: {} } : { raw: '<html>captcha</html>' };
  } });
  assert.match(r.result.title, /查询失败/);
  assert.match(r.content, /HTTP 429/);
  assert.match(r.content, /无效 JSON/);
});
test('hung providers settle with bounded timeout', () => {
  const r = run({ handler(o, calls) { return calls.length === 1 ? { data: { ip: IP } } : { hang: true }; } });
  assert.match(r.result.title, /查询失败/);
  assert.match(r.content, /请求超时/);
});
test('failed first exit probe falls back to ipify on the SAME node', () => {
  const r = run({ handler(o) {
    if (o.url.includes('ident.me')) return { status: 503, data: {} };
    if (o.url.includes('ipify')) return { data: { ip: IP } };
    if (o.url.includes('ip-api.com')) return { data: { status: 'success', hosting: true } };
    return { status: 503, data: {} };
  } });
  assert.match(r.content, /出口查询：ipify/);
  assert.ok(r.calls.every(c => c.policy === '香港 A'));
});
test('IPv6 equivalent spellings compare equal', () => {
  const r = run({ handler(o, calls) {
    if (o.url.includes('ident.me')) return { data: { ip: calls.length === 1 ? '2001:4860::8888' : '2001:4860:0:0:0:0:0:8888', type: 'isp' } };
    return { status: 503, data: {} };
  } });
  assert.match(r.result.title, /优 · 住宅/);
});
test('invalid IP in both probes fails without querying reputation APIs', () => {
  const r = run({ handler() { return { data: { ip: '999.999.1.1' } }; } });
  assert.match(r.result.title, /查询失败/);
  assert.equal(r.calls.length, 2);
});
test('Surge unknown target is rejected before any outbound HTTP request', () => {
  const r = run({ policies: { proxies: ['其他节点'], 'policy-groups': [] } });
  assert.equal(r.calls.length, 0);
  assert.match(r.content, /找不到这个节点或策略组/);
});
test('Surge unresponsive policy API does not test the default route', () => {
  const r = run({ apiHang: true });
  assert.equal(r.calls.length, 0);
  assert.match(r.content, /策略列表超时/);
});
test('published module and plugin reference the shipped script with sufficient timeout', () => {
  const root = __dirname + '/..';
  const scriptUrl = 'https://raw.githubusercontent.com/nifgg/surge/main/scripts/node-ip-quality/node-ip-quality.js';
  for (const file of ['modules/node-ip-quality.sgmodule', 'plugins/node-ip-quality.plugin']) {
    const config = fs.readFileSync(root + '/' + file, 'utf8');
    assert.ok(config.includes('script-path=' + scriptUrl));
    assert.match(config, /timeout=25/);
    assert.ok(!config.includes('[MITM]'));
    assert.ok(!config.includes('script-path=node-ip-quality.js'));
  }
  const manifest = JSON.parse(fs.readFileSync(root + '/manifest.json', 'utf8'));
  const entry = manifest.modules['node-ip-quality'];
  const hash = file => require('node:crypto').createHash('sha256').update(fs.readFileSync(root + '/' + file)).digest('hex');
  assert.equal(entry.module_sha256, hash(entry.file));
  assert.equal(entry.dependencies[0].sha256, hash(entry.dependencies[0].path));
  assert.equal(entry.loon_plugin.sha256, hash(entry.loon_plugin.file));
});
