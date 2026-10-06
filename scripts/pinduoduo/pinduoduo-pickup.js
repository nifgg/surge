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

/*
https://t.me/ibilibili
2026-07-11 20:05:34
*/
let body = $response.body || "";

const oldChunk = "https://pfile.pddpic.com/mdkd/mdkd/_next/static/chunks/9410-b8806e870a26db7d.js";
const newChunk = "https://kelee.one/Resource/JavaScript/PinDuoDuo/9410-b8806e870a26db7d.js";

function replaceAllText(text, from, to) {
  let pos = text.indexOf(from);
  while (pos !== -1) {
    text = text.slice(0, pos) + to + text.slice(pos + from.length);
    pos = text.indexOf(from, pos + to.length);
  }
  return text;
}

function removeGifContainer(html) {
  const marker = "index_gif-container";
  let pos = html.indexOf(marker);

  while (pos !== -1) {
    const open = html.lastIndexOf("<div", pos);
    if (open === -1) break;

    let i = open;
    let depth = 0;
    let end = -1;

    while (i < html.length) {
      const nextOpen = html.indexOf("<div", i);
      const nextClose = html.indexOf("</div>", i);
      if (nextClose === -1) break;

      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++;
        i = nextOpen + 4;
      } else {
        depth--;
        i = nextClose + 6;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }

    if (end === -1) break;

    html = html.slice(0, open) + html.slice(end);
    pos = html.indexOf(marker, open);
  }

  return html;
}

function trimNextData(html) {
  const idNeedle = 'id="__NEXT_DATA__"';
  const idPos = html.indexOf(idNeedle);
  if (idPos === -1) return html;

  const tagStart = html.lastIndexOf("<script", idPos);
  if (tagStart === -1) return html;

  const contentStart = html.indexOf(">", tagStart);
  if (contentStart === -1) return html;

  const tagEnd = html.indexOf("</script>", contentStart);
  if (tagEnd === -1) return html;

  const jsonText = html.slice(contentStart + 1, tagEnd);

  try {
    const data = JSON.parse(jsonText);
    const serverData = data &&
      data.props &&
      data.props.pageProps &&
      data.props.pageProps.serverData;

    if (Array.isArray(serverData)) {
      data.props.pageProps.serverData = serverData.filter(item =>
        item &&
        (item.key === "fastBindCMobilePreCheck" ||
         item.key === "queryStationPackageInfo")
      );
    }

    return html.slice(0, contentStart + 1) +
      JSON.stringify(data) +
      html.slice(tagEnd);
  } catch (e) {
    return html;
  }
}

body = replaceAllText(body, oldChunk, newChunk);
body = removeGifContainer(body);
body = trimNextData(body);

$done({ body });
  } catch (__error) {
    console.log('[Surge adapter] Script failed; keeping original response: ' + __error.name);
    $done({});
  }
})(typeof $httpClient !== 'undefined' ? $httpClient : {}, $done, typeof $argument !== 'undefined' ? $argument : undefined);
