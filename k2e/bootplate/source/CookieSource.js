/* global k2e, Cookies */
(function () {

enyo.kind({
  name: 'k2e.CookieSource',
  kind: 'enyo.Source',
  fetch(rec, opts) { opts.success(Cookies.get()); },
  commit,
  destroy
});

new k2e.CookieSource({ name: 'cookieSource' });

/////////////////////////////////////////////////////////////

function commit(rec, opts) {
  Object.keys(rec.attributes).forEach(function (key) {
    if (rec.attributes[key] !== undefined) {
      Cookies.set(key, rec.get(key));
    }
    else {
      Cookies.remove(key);
    }
  });
  opts.success();
}

function destroy(rec, opts) {
  Object.keys(Cookies.get()).forEach(function (key) {
    Cookies.remove(key);
  });
  opts.success();
}

})();
