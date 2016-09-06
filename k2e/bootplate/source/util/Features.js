(function () {

const touchPromise = new Promise((resolve/*, reject*/) => {
  const handleTouchStart = () => {
    window.removeEventListener('touchstart', handleTouchStart);
    resolve(true);
  };
  // Detect the use of touch, not 100% reliable (http://www.stucox.com/blog/you-cant-detect-a-touchscreen/)
  // Should use feature detection for the 3rd param, but don't really care in this case
  // Details: https://github.com/WICG/EventListenerOptions/blob/7b2cb3031a93da604404fdf76de688094f6a7c65/explainer.md#feature-detection
  window.addEventListener('touchstart', handleTouchStart, { passive: true });
});

const API = {
  hasTouch,
  hasClipboard,
};

enyo.kind({
  name: 'k2e.util.Features',
  statics: API,
  constructor() {
    Object.keys(API).forEach((key) => {
      this[key] = API[key];
    });

    this.inherited(arguments);
  },
});

/////////////////////////////////////////////////////////////

function hasTouch() {
  return touchPromise;
}

function hasClipboard() {
  // document.queryCommandSupported return value fixed in Chrome 48
  let supported = document.queryCommandSupported('copy');
  if (supported) {
    // Check that the browser isn't Firefox pre-41
    try {
      document.execCommand('copy');
    } catch (e) {
      supported = false;
    }
  }

  return supported;
}

})();
