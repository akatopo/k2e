(function () {

enyo.kind({
  name: 'k2e.util.AsyncSemaphore',
  kind: 'enyo.Component',
  published: {
    lock: 0,
    func: undefined,
  },
  v() { ++this.lock; },
  p,
});

/////////////////////////////////////////////////////////////

function p() {
  --this.lock;
  if (this.lock === 0 && this.func) {
    this.func();
  }
}

})();
