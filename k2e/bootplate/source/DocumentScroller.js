(function () {

enyo.kind({
  name: 'DocumentScroller',
  kind: 'enyo.Scroller',
  fit: true,
  classes: 'k2e-document-scroller',
  events: {
    onDocumentScrolled: ''
  },
  handlers: {
    onScroll: 'handleOnScroll'
  },
  strategyKind: 'ScrollStrategy',
  handleOnScroll: function (inSender, inEvent) {
    var bounds = this.getBounds();
    var scrollBounds = this.getScrollBounds();
    this.doDocumentScrolled({'bounds': bounds, 'scrollBounds': scrollBounds});
  }
});

})();

