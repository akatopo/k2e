/* globals Navigo */

((Navigo) => {

const root = `${location.protocol}//${location.host}`;
const useHash = false;
const router = new Navigo(root, useHash);
const onClipListRouteChangedCallbacks = [];
const onClipRouteChangedCallbacks = [];
let isNavigating = false;
let isHandlingRouteChange = false;

const Api = {
  router,
  onClipListRouteChanged,
  onClipRouteChanged,
  tryClipListChanged: tryResourceChanged('clipList'),
  tryClipChanged: tryResourceChanged('clip'),
  settingsToggled,
  appToolbarChanged,
  resolve() { router.resolve(); },
  get isNavigating() { return isNavigating; },
  get isHandlingRouteChange() { return isHandlingRouteChange; },
};

router
  .on('/', keyQueryHandler(onClipListRouteChangedCallbacks))
  .on('/clipList/:key', keyQueryHandler(onClipListRouteChangedCallbacks))
  .on('/clip/:key', keyQueryHandler(onClipRouteChangedCallbacks));

enyo.kind({
  name: 'k2e.util.Router',
  statics: Api,
  constructor() {
    Object.keys(Api).forEach((key) => {
      this[key] = Api[key];
    });

    this.inherited(arguments);
  },
});

function keyQueryHandler(callbacks) {
  return ({ key }, query) => {
    if (isNavigating) {
      return;
    }
    isHandlingRouteChange = true;
    const params = getParamObject(query);
    callbacks.forEach((cb) => cb(key, params));
    isHandlingRouteChange = false;
  };
}

function getParamObject(queryString) {
  const params = new URLSearchParams(queryString);
  const o = {};
  for (const [key, value] of params) {
    o[key] = value;
  }

  return o;
}

function getParamString(paramObject = {}) {
  const keys = Object.keys(paramObject);
  if (keys.length === 0) {
    return '';
  }

  return `?${Object.keys(paramObject)
    .map(k => `${k}=${paramObject[k]}`)
    .join('&')
  }`;
}

function onRouteChanged(callbacks, cb) {
  callbacks.push(cb);
  return () => {
    const index = callbacks.indexOf(cb);
    if (index === -1) {
      return;
    }

    callbacks.splice(index, 1);
  };
}

function onClipRouteChanged(cb) {
  return onRouteChanged(onClipRouteChangedCallbacks, cb);
}

function onClipListRouteChanged(cb) {
  return onRouteChanged(onClipListRouteChangedCallbacks, cb);
}

function tryResourceChanged(resource) {
  return (key, params) => {
    if (Api.isHandlingRouteChange) {
      return;
    }
    const search = getParamString(params);
    navigateWithoutEventHandling(`/${resource}/${encodeURIComponent(key)}${search}`);
  }
}

// function tryClipListChanged(key, params) {
//   if (Api.isHandlingRouteChange) {
//     return;
//   }
//   const search = getParamString(params);
//   navigateWithoutEventHandling(`/clipList/${encodeURIComponent(key)}${search}`);
// }

// function tryClipChanged(key) {
//   if (Api.isHandlingRouteChange) {
//     return;
//   }
//   navigateWithoutEventHandling(`/clip/${encodeURIComponent(key)}`);
// }

function settingsToggled(settings) {
  if (Api.isHandlingRouteChange) {
    return;
  }
  const { url: lastUrl } = router.lastRouteResolved();
  const search = getParamString({ settings });
  navigateWithoutEventHandling(`${lastUrl}${search}`);
}

function appToolbarChanged(toolbarId) {
  if (Api.isHandlingRouteChange) {
    return;
  }
  const { url: lastUrl, query: lastQuery } = router.lastRouteResolved();
  const search = getParamString(
    Object.assign({}, getParamObject(lastQuery), { toolbar: toolbarId })
  );
  navigateWithoutEventHandling(`${lastUrl}${search}`);
}

function navigateWithoutEventHandling(path) {
  isNavigating = true;
  router.navigate(path);
  isNavigating = false;
}

})(Navigo);
