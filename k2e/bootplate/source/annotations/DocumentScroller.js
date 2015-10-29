(function () {

enyo.kind({
  name: 'k2e.annotations.DocumentScroller',
  kind: 'enyo.Scroller',
  classes: 'k2e-document-scroller',
  events: {
    onDocumentScrolled: ''
  },
  handlers: {
    onScroll: 'handleScroll'
  },
  strategyKind: 'ScrollStrategy',
  handleScroll: handleScroll
});

/////////////////////////////////////////////////////////////

function handleScroll(inSender, inEvent) {
  var bounds = this.getBounds();
  var scrollBounds = this.getScrollBounds();
  this.doDocumentScrolled({'bounds': bounds, 'scrollBounds': scrollBounds});
}

})();

