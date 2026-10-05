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
  if ([["^https:\\/\\/acs\\.m\\.taobao\\.com\\/gw\\/mtop\\.fliggy\\.crm\\.screen\\.(allresource|predict)","i"],["^https:\\/\\/acs\\.m\\.taobao\\.com\\/gw\\/mtop\\.alibaba\\.advertisementservice\\.getadv","i"],["^https:\\/\\/acs\\.m\\.taobao\\.com\\/gw\\/mtop\\.alimama\\.etao\\.config\\.query\\/.+?etao_advertise","i"],["^https:\\/\\/acs\\.m\\.taobao\\.com\\/gw\\/mtop\\.alimusic\\.common\\.mobileservice\\.startinit","i"],["^https:\\/\\/acs\\.m\\.taobao\\.com\\/gw\\/mtop\\.etao\\.noah\\.query\\/.+tao_splash","i"],["^https:\\/\\/acs\\.m\\.taobao\\.com\\/gw\\/mtop\\.film\\.mtopadvertiseapi\\.queryadvertise","i"],["^https:\\/\\/acs\\.m\\.taobao\\.com\\/gw\\/mtop\\.o2o\\.ad\\.gateway\\.get","i"],["^https:\\/\\/acs\\.m\\.taobao\\.com\\/gw\\/mtop\\.taobao\\.idle\\.home\\.welcome","i"],["^https:\\/\\/acs\\.m\\.taobao\\.com\\/gw\\/mtop\\.trip\\.activity\\.querytmsresources","i"],["^https:\\/\\/(?:gw|heic)\\.alicdn\\.com\\/imgextra\\/i\\d\\/\\d*\\/?[\\w!]+-\\d-(?:octopus|tps)-(?:1080|1125)-\\d{4}\\.(?:jpg|png)_(?:1\\d{3}|9\\d{2})x(?:\\d|1\\d{3}|9\\d{2})q[59]0","i"],["^https:\\/\\/guide-acs\\.m\\.taobao\\.com\\/gw\\/mtop\\.taobao\\.(volvo\\.secondfloor\\.getconfig|wireless\\.home\\.newface\\.awesome\\.get)","i"]].some(([pattern, flags]) => new RegExp(pattern, flags).test($request.url))) return $done({});

/*
脚本引用https://raw.githubusercontent.com/RuCu6/QuanX/main/Scripts/myBlockAds.js
*/
// 2024-01-12 09:10

const url = $request.url;
const isResp = typeof $response !== "undefined";
let body = $response.body;

switch (isResp) {
  // 淘宝-开屏视频广告
  case /^https:\/\/guide-acs\.m\.taobao\.com\/gw\/mtop\.taobao\.cloudvideo\.video\.query/.test(url):
    try {
      let obj = JSON.parse(body);
      if (obj?.data?.duration) {
        obj.data.duration = "0";
      }
      if (obj?.data?.resources?.length > 0) {
        obj.data.resources = [];
      }
      if (obj?.data?.caches?.length > 0) {
        obj.data.caches = [];
      }
      if (obj?.data?.respTimeInMs) {
        obj.data.respTimeInMs = "3818332800000";
      }
      body = JSON.stringify(obj);
    } catch (err) {
      console.log(`淘宝-开屏视频广告, 出现异常: ` + err);
    }
    break;
  // 淘宝-开屏图片广告
  case /^https:\/\/guide-acs\.m\.taobao\.com\/gw\/mtop\.taobao\.wireless\.home\.splash\.awesome\.get/.test(url):
    try {
      let obj = JSON.parse(body);
      if (obj?.data?.containers?.splash_home_base) {
        let splash = obj.data.containers.splash_home_base;
        if (splash?.base?.sections?.length > 0) {
          for (let items of splash.base.sections) {
            if ("taobao-splash" in items.bizData) {
              if (items?.bizData?.["taobao-splash"]?.data?.length > 0) {
                for (let item of items.bizData["taobao-splash"].data) {
                  item.waitTime = "0";
                  item.times = "0";
                  item.hotStart = "false";
                  item.haveVoice = "false";
                  item.hideTBLogo = "false";
                  item.enable4G = "false";
                  item.coldStart = "false";
                  item.waitTime = "0";
                  item.startTime = "3818332800000";
                  item.endTime = "3818419199000";
                  item.gmtStart = "2090-12-31 00:00:00";
                  item.gmtEnd = "2090-12-31 23:59:59";
                  item.gmtStartMs = "3818332800000";
                  item.gmtEndMs = "3818419199000";
                  if (item?.imgUrl) {
                    item.imgUrl = "";
                  }
                  if (item?.videoUrl) {
                    item.videoUrl = "";
                  }
                }
              }
            }
          }
        }
      }
      body = JSON.stringify(obj);
    } catch (err) {
      console.log(`淘宝-开屏图片广告, 出现异常: ` + err);
    }
    break;
  // 淘宝-开屏活动
  case /^https:\/\/poplayer\.template\.alibaba\.com\/\w+\.json/.test(url):
    try {
      let obj = JSON.parse(body);
      if (obj?.res?.images?.length > 0) {
        obj.res.images = [];
      }
      if (obj?.res?.videos?.length > 0) {
        obj.res.videos = [];
      }
      if (obj?.enable) {
        obj.enable = false;
      }
      if (obj?.mainRes?.images?.length > 0) {
        obj.mainRes.images = [];
      }
      body = JSON.stringify(obj);
    } catch (err) {
      console.log(`淘宝-开屏活动, 出现异常: ` + err);
    }
    break;
  default:
    $done({});
}

$done({ body });
  } catch (__error) {
    console.log('[Surge adapter] Script failed; keeping original response: ' + __error.name);
    $done({});
  }
})(typeof $httpClient !== 'undefined' ? $httpClient : {}, $done);
