/*
 * Node IP Quality 1.0.0 — Surge generic/panel + Loon generic.
 * Independently implemented from the documented behavior of FlClash
 * 7fd417fb9a9a277c6a9339a8ac87f907df7c25f7 (see docs/node-ip-quality.md).
 * No MITM, configuration writes, subscription reads or background scheduling.
 */
(function () {
  'use strict';
  var isLoon = typeof $loon !== 'undefined';
  var finished = false;
  var started = Date.now();
  var target = '';
  var ip = '';
  var probeSource = '';
  var attempts = [];
  var wave = 0;
  var inFlight = 0;
  var fallback = null;
  var waves = [['ident.me', 'ip-api.com', 'IPQuery'], ['IPLocate'], ['ipapi.is'], ['ProxyCheck']];
  var typeLabels = { residential: '住宅', mobile: '移动网络', business: '商业', hosting: '机房' };

  function object(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }
  function text(value) { return typeof value === 'string' ? value : ''; }
  function flag(value) { return typeof value === 'boolean' ? value : null; }
  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // Canonical form for comparison; also rejects HTML, hostnames and malformed IPs.
  function normalizedIP(value) {
    if (typeof value !== 'string') return '';
    var s = value.trim().toLowerCase();
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(s)) {
      var octets = s.split('.');
      if (octets.some(function (x) { return Number(x) > 255; })) return '';
      return octets.map(Number).join('.');
    }
    if (s.indexOf(':') < 0 || /[^0-9a-f:.]/.test(s)) return '';
    if (s.indexOf('.') >= 0) {
      var cut = s.lastIndexOf(':');
      var v4 = normalizedIP(s.slice(cut + 1));
      if (!v4 || v4.indexOf(':') >= 0) return '';
      var parts4 = v4.split('.').map(Number);
      s = s.slice(0, cut + 1) + (parts4[0] * 256 + parts4[1]).toString(16) + ':' + (parts4[2] * 256 + parts4[3]).toString(16);
    }
    var halves = s.split('::');
    if (halves.length > 2) return '';
    var left = halves[0] ? halves[0].split(':') : [];
    var right = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
    var groups = left.concat(right);
    if (groups.some(function (x) { return !/^[0-9a-f]{1,4}$/.test(x); })) return '';
    if (halves.length === 1 && groups.length !== 8) return '';
    if (halves.length === 2 && groups.length >= 8) return '';
    while (left.length + right.length < 8) left.push('0');
    return left.concat(right).map(function (x) { return parseInt(x, 16).toString(16); }).join(':');
  }
  function declared(value) {
    if (value === 'isp') return 'residential';
    if (['business', 'education', 'government', 'banking'].indexOf(value) >= 0) return 'business';
    return value === 'hosting' ? 'hosting' : null;
  }
  function pick(hosting, mobile, declaredType) {
    if (hosting === true || declaredType === 'hosting') return 'hosting';
    return mobile === true ? 'mobile' : declaredType;
  }
  function parse(source, json, address) {
    var j = object(json);
    var returnedIP = j.ip || j.query;
    if (returnedIP && normalizedIP(returnedIP) !== normalizedIP(address)) throw new Error('IP 不一致');
    var q = { source: source, type: null, inferred: false, org: '', asn: '', flags: { proxy: null, vpn: null, tor: null, abuser: null } };
    var company = object(j.company), asn = object(j.asn), risk, privacy, network, detections;
    if (source === 'ident.me') {
      if (normalizedIP(j.ip) !== normalizedIP(address)) throw new Error('出口 IP 不一致');
      q.type = declared(j.type); q.org = text(j.aso); q.asn = j.asn;
    } else if (source === 'ip-api.com' || source === 'IPQuery') {
      if (source === 'ip-api.com' && j.status !== 'success') throw new Error('服务查询失败');
      risk = source === 'ip-api.com' ? j : object(j.risk);
      var hosting = flag(source === 'ip-api.com' ? risk.hosting : risk.is_datacenter);
      var mobile = flag(source === 'ip-api.com' ? risk.mobile : risk.is_mobile);
      q.type = pick(hosting, mobile, null);
      // Unlike blind defaulting, an incomplete payload must not become "住宅 / 优".
      if (!q.type && hosting === false && mobile === false) { q.type = 'residential'; q.inferred = true; }
      q.org = source === 'ip-api.com' ? text(j.org) || text(j.isp) : text(object(j.isp).org) || text(object(j.isp).isp);
      q.asn = source === 'ip-api.com' ? j.as : object(j.isp).asn;
      q.flags.proxy = flag(source === 'ip-api.com' ? risk.proxy : risk.is_proxy);
      if (source === 'IPQuery') { q.flags.vpn = flag(risk.is_vpn); q.flags.tor = flag(risk.is_tor); }
    } else if (source === 'IPLocate' || source === 'ipapi.is') {
      privacy = source === 'IPLocate' ? object(j.privacy) : j;
      q.type = pick(flag(source === 'IPLocate' ? privacy.is_hosting : j.is_datacenter), source === 'ipapi.is' ? flag(j.is_mobile) : false, declared(company.type) || declared(asn.type));
      q.org = text(company.name) || text(asn.name) || text(asn.org); q.asn = asn.asn;
      q.flags = { proxy: flag(privacy.is_proxy), vpn: flag(privacy.is_vpn), tor: flag(privacy.is_tor), abuser: flag(privacy.is_abuser) };
    } else if (source === 'ProxyCheck') {
      if (j.status === 'denied') throw new Error('限流或拒绝访问');
      if (j.status !== 'ok' && j.status !== 'warning') throw new Error('服务查询失败');
      var key = Object.keys(j).filter(function (k) { return normalizedIP(k) === normalizedIP(address); })[0];
      var result = object(j[key]); network = object(result.network); detections = object(result.detections);
      q.type = pick(detections.hosting === true || network.type === 'Hosting', network.type === 'Wireless', network.type === 'Residential' ? 'residential' : network.type === 'Business' ? 'business' : null);
      q.org = text(network.organisation); q.asn = network.asn;
      q.flags = { proxy: flag(detections.proxy), vpn: flag(detections.vpn), tor: flag(detections.tor), abuser: null };
    }
    if (!q.type) throw new Error('未提供可识别类型（可能需密钥或接口已变更）');
    q.asn = q.asn == null ? '' : String(q.asn);
    return q;
  }
  function grade(q) {
    if (q.flags.tor === true || q.flags.abuser === true) return '风险';
    return q.type === 'hosting' ? '普通' : '优';
  }
  function urls(source) {
    var encoded = encodeURIComponent(ip);
    var list = {
      'ident.me': 'https://ident.me/json',
      'ip-api.com': 'http://ip-api.com/json/' + encoded + '?fields=status,query,isp,org,as,mobile,proxy,hosting',
      'IPQuery': 'https://api.ipquery.io/' + encoded + '?format=json',
      'IPLocate': 'https://iplocate.io/api/lookup/' + encoded,
      'ipapi.is': 'https://api.ipapi.is/?q=' + encoded,
      'ProxyCheck': 'https://proxycheck.io/v3/' + encoded
    };
    return list[source];
  }
  function request(url, callback, timeoutMs) {
    var answered = false;
    function complete(error, data) {
      if (answered || finished) return;
      answered = true; callback(error, data);
    }
    // The two apps use DIFFERENT units for HTTP timeouts.
    var options = { url: url, timeout: isLoon ? timeoutMs : timeoutMs / 1000, headers: { Accept: 'application/json' } };
    options[isLoon ? 'node' : 'policy'] = target;
    setTimeout(function () { complete(new Error('请求超时')); }, timeoutMs + 100);
    try {
      $httpClient.get(options, function (error, response, body) {
        if (answered || finished) return;
        if (error) return complete(new Error('连接失败或超时'));
        var status = Number(response && (response.status || response.statusCode));
        if (status !== 200) return complete(new Error(status === 429 ? '限流（HTTP 429）' : 'HTTP ' + status));
        try { complete(null, JSON.parse(body)); } catch (e) { complete(new Error('无效 JSON 响应')); }
      });
    } catch (e) { complete(new Error('请求无法发起')); }
  }
  function finish(quality, error) {
    if (finished) return;
    finished = true;
    var level = quality ? grade(quality) : '查询失败';
    var title = quality ? 'IP 质量 · ' + level + ' · ' + typeLabels[quality.type] : 'IP 质量 · 查询失败';
    var lines = ['节点 / 策略：' + (target || '未指定')];
    if (ip) lines.push('出口 IP：' + ip, '出口查询：' + probeSource);
    if (quality) {
      lines.push('类型：' + typeLabels[quality.type] + (quality.inferred ? '（推断）' : ''), '等级：' + level, '采用来源：' + quality.source);
      if (quality.org) lines.push('组织：' + quality.org);
      if (quality.asn) lines.push('ASN：' + quality.asn);
      var names = { proxy: '代理', vpn: 'VPN', tor: 'Tor', abuser: '滥用' };
      lines.push('标记：' + Object.keys(names).map(function (key) {
        var val = quality.flags[key]; return names[key] + '=' + (val === true ? '命中' : val === false ? '未命中' : '未提供');
      }).join('；'));
      if (quality.inferred) lines.push('住宅仅为排除机房 / 移动网络后的兜底推断。');
      lines.push('等级按该来源已提供的字段计算；未提供不等于没有风险。');
    } else lines.push(error || '所有来源均无法判断类型，请稍后重试。');
    lines.push('耗时：' + ((Date.now() - started) / 1000).toFixed(1) + ' 秒');
    if (attempts.length) lines.push('来源记录：' + attempts.join('；'));
    lines.push('本次仅评估这个出口 IP；双栈、轮换出口或动态策略组可能产生不同结果。', '“优”不代表网速快，也不保证特定网站不触发风控。');
    var content = lines.join('\n');
    console.log(content);
    if (isLoon) {
      var html = '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font:16px -apple-system,sans-serif;padding:20px;line-height:1.65;overflow-wrap:anywhere;color:#182334;background:#f4f6fa}h2{font-size:22px}p{margin:10px 0}.card{background:white;padding:20px;border-radius:16px}@media(prefers-color-scheme:dark){body{background:#10151d;color:#e7edf7}.card{background:#1d2632}}</style></head><body><div class="card"><h2>' + escapeHTML(title) + '</h2>' + lines.map(function (s) { return '<p>' + escapeHTML(s) + '</p>'; }).join('') + '</div></body></html>';
      $done({ title: title, htmlMessage: html });
    } else {
      if (!(typeof $input !== 'undefined' && $input.purpose === 'panel') && typeof $notification !== 'undefined') {
        $notification.post(title, target, content);
      }
      $done({ title: title, content: content, icon: 'network', 'icon-color': level === '风险' ? '#D94B4B' : level === '优' ? '#24A675' : '#6B7B91' });
    }
  }
  function launchWave() {
    if (finished) return;
    if (wave >= waves.length) {
      if (inFlight === 0) finish(fallback, '所有来源均无法判断类型，请查看来源记录。');
      return;
    }
    var sources = waves[wave++];
    var generation = wave;
    inFlight += sources.length;
    sources.forEach(function (source) {
      if (finished) return;
      request(urls(source), function (error, json) {
        inFlight--;
        var q;
        if (!error) { try { q = parse(source, json, ip); } catch (e) { error = e; } }
        if (error) attempts.push(source + '：' + error.message);
        else if (q.inferred) { if (!fallback) fallback = q; attempts.push(source + '：住宅推断候选'); }
        else { attempts.push(source + '：已采用'); return finish(q); }
        if (inFlight === 0) launchWave();
      }, 8000);
    });
    // Generation check replaces clearTimeout, unavailable in some native engines.
    if (wave < waves.length) setTimeout(function () { if (!finished && wave === generation) launchWave(); }, 1000);
  }
  function discoverIP() {
    var settled = false, pending = 0, next = 0;
    var probes = [
      { name: 'ident.me', url: 'https://ident.me/json' },
      { name: 'ipify', url: 'https://api64.ipify.org?format=json' }
    ];
    function launch() {
      if (settled || finished) return;
      if (next >= probes.length) { if (!pending) finish(null, '无法通过指定节点取得出口 IP，请检查节点连通性和名称。'); return; }
      var p = probes[next++]; pending++;
      request(p.url, function (error, json) {
        pending--;
        if (settled) return;
        if (!error && normalizedIP(object(json).ip)) {
          settled = true; ip = String(json.ip).trim(); probeSource = p.name;
          launchWave();
        } else {
          attempts.push('出口 ' + p.name + '：' + (error ? error.message : '未返回有效 IP'));
          launch();
        }
      }, 6000);
    }
    launch();
    setTimeout(launch, 800);
  }
  function begin() {
    if (isLoon || target === 'DIRECT') { discoverIP(); return; }
    // Check the configured name before sending traffic: a typo must not become
    // a report for an unintended default route. Only policy names are read.
    if (typeof $httpAPI !== 'function') {
      finish(null, '无法验证 Surge 策略名称，请使用支持 $httpAPI 的 Surge 版本。'); return;
    }
    var checked = false;
    setTimeout(function () {
      if (!checked && !finished) { checked = true; finish(null, '读取 Surge 策略列表超时，请重试。'); }
    }, 2000);
    $httpAPI('GET', '/v1/policies', {}, function (value) {
      if (checked || finished) return;
      checked = true;
      var data = object(value);
      if (!Array.isArray(data.proxies) || !Array.isArray(data['policy-groups'])) {
        finish(null, '无法读取 Surge 策略列表，请检查客户端版本和脚本日志。'); return;
      }
      if (data.proxies.concat(data['policy-groups']).indexOf(target) < 0) {
        finish(null, '找不到这个节点或策略组，请检查完整名称。外部订阅节点请填写所属策略组，并在组中选中待测节点。'); return;
      }
      discoverIP();
    });
  }
  try {
    if (isLoon) {
      var params = typeof $environment === 'undefined' ? {} : object($environment.params);
      target = text(object(params.nodeInfo).name) || text(params.node) || text(params.policyGroup);
    } else {
      target = typeof $intent !== 'undefined' ? text($intent.parameter) : '';
      if (!target) target = typeof $argument === 'undefined' ? '' : text($argument);
    }
    target = target.trim();
    if (!target || target === '请填写节点或策略组名称') {
      finish(null, isLoon ? '请从节点列表长按一个节点，再选择“IP 类型与质量”。' : '请在模块参数 policy 中填写现有节点或策略组的完整名称，再点面板刷新。');
      return;
    }
    if (typeof $httpClient === 'undefined') { finish(null, '此脚本需要在 Surge 或 Loon 中运行。'); return; }
    setTimeout(function () { finish(null, '整体检测超时，请稍后重试。'); }, 23000);
    begin();
  } catch (error) { finish(null, '运行失败：' + error.message); }
}());
