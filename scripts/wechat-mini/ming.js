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

let obj=JSON.parse($response.body);
obj.data=[];
$done({body: JSON.stringify(obj)});
  } catch (__error) {
    console.log('[Surge adapter] Script failed; keeping original response: ' + __error.name);
    $done({});
  }
})(typeof $httpClient !== 'undefined' ? $httpClient : {}, $done);
