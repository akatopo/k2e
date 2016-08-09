/* global k2e:false, Cookies:false */
/* eslint no-new:0 */

(function () {

enyo.kind({
  name: 'k2e.CookieSource',
  kind: 'enyo.Source',
  fetch(rec, opts) { opts.success(Cookies.get()); },
  commit,
  destroy,
});

new k2e.CookieSource({ name: 'cookieSource' });

/////////////////////////////////////////////////////////////

function commit(rec, opts) {
  Object.keys(rec.attributes).forEach((key) => {
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
  Object.keys(Cookies.get()).forEach((key) => {
    Cookies.remove(key);
  });
  opts.success();
}

})();
