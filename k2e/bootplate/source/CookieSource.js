/* global CookieSource, CookieModel, Cookies */
(function () {

enyo.kind({
  name: 'CookieSource',
  kind: 'enyo.Source',
  fetch: function (rec, opts) {
    opts.success(Cookies.get());
  },
  commit: function (rec, opts) {
    Object.keys(rec.attributes).forEach(function (key) {
      if (rec.attributes[key] !== undefined) {
        Cookies.set(key, rec.get(key));
      }
      else {
        Cookies.remove(key);
      }
    });
    opts.success();
  },
  destroy: function (rec, opts) {
    Object.keys(Cookies.get()).forEach(function (key) {
      Cookies.remove(key);
    });
    opts.success();
  }
});

new CookieSource({ name: 'cookieSource' });

})();
