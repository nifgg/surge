// Surge compatibility wrapper 1.2.0; original source follows unchanged.
(function (__nativeHTTP, __nativeDone) {
  let __completed = false;
  function $done(result) {
    if (__completed) return;
    __completed = true;
    return __nativeDone(result === undefined ? {} : result);
  }
  try {
  let __args = {}; try { if (typeof $argument === 'string') __args = JSON.parse($argument); } catch { return $done({}); }
  if (__args.__enabled === false) return $done({});
  if ([].some(([pattern, flags]) => new RegExp(pattern, flags).test($request.url))) return $done({});

// 2024-07-11 01:56:32
var json = JSON.parse($response.body);

// 删除底栏视频标签
if (json.data && Array.isArray(json.data) && json.data.length > 1) {
    json.data[1] = {};
}

$done({ body: JSON.stringify(json) });
  } catch (__error) {
    console.log('[Surge adapter] Script failed; keeping original response: ' + __error.name);
    $done({});
  }
})(typeof $httpClient !== 'undefined' ? $httpClient : {}, $done);
