(function () {

enyo.kind({
  name: 'k2e.annotations.DocumentScroller',
  kind: 'enyo.Scroller',
  classes: 'k2e-document-scroller',
  events: {
    onDocumentScrolled: ''
  },
  handlers: {
    onScroll: 'handleOnScroll'
  },
  strategyKind: 'ScrollStrategy',
  handleOnScroll: handleOnScroll
});

/////////////////////////////////////////////////////////////

function handleOnScroll(inSender, inEvent) {
  var bounds = this.getBounds();
  var scrollBounds = this.getScrollBounds();
  this.doDocumentScrolled({'bounds': bounds, 'scrollBounds': scrollBounds});
}

})();

