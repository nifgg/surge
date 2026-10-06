// Surge compatibility wrapper 1.3.0; original source follows unchanged.
(function (__nativeHTTP, __nativeDone, __nativeArgument) {
  let __completed = false;
  function $done(result) {
    if (__completed) return;
    __completed = true;
    return __nativeDone(result === undefined ? {} : result);
  }
  try {
  const __argumentText = typeof __nativeArgument === 'string' ? __nativeArgument.trim() : '';
  let __args = {};
  if (__argumentText.startsWith('{')) {
    try { __args = JSON.parse(__argumentText); } catch { return $done({}); }
    if (__args === null || typeof __args !== 'object' || Array.isArray(__args)) return $done({});
  } else if (__argumentText) {
    // A policy name is free text, so it is always serialized last.
    const __policyKey = '__proxy_policy=';
    const __policyAt = __argumentText.startsWith(__policyKey) ? 0 : __argumentText.indexOf('&' + __policyKey);
    const __pairs = __policyAt < 0 ? __argumentText : __argumentText.slice(0, __policyAt);
    for (const __pair of __pairs ? __pairs.split('&') : []) {
      const __at = __pair.indexOf('='), __key = __pair.slice(0, __at), __value = __pair.slice(__at + 1);
      if (__at < 1 || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(__key) || Object.prototype.hasOwnProperty.call(__args, __key)) return $done({});
      __args[__key] = __value === 'true' ? true : __value === 'false' ? false : __value;
    }
    if (__policyAt >= 0) __args.__proxy_policy = __argumentText.slice(__policyAt + (__policyAt ? 1 : 0) + __policyKey.length);
  }
  const $argument = __argumentText
    ? JSON.stringify(Object.fromEntries(Object.entries(__args).filter(([key]) => !key.startsWith('__'))))
    : __nativeArgument;
  if (__args.__enabled === false) return $done({});
  if ([].some(([pattern, flags]) => new RegExp(pattern, flags).test($request.url))) return $done({});

let obj=JSON.parse($response.body);
delete obj.data.bannerInfoConfig ;
$done({body: JSON.stringify(obj)});
  } catch (__error) {
    console.log('[Surge adapter] Script failed; keeping original response: ' + __error.name);
    $done({});
  }
})(typeof $httpClient !== 'undefined' ? $httpClient : {}, $done, typeof $argument !== 'undefined' ? $argument : undefined);
