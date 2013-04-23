/*global enyo */

enyo.kind({
    name: "DocumentScroller",
    kind: "enyo.Scroller",
    fit: true,
    classes: "k2e-document-scroller",
    events: {
        onDocumentScrolled: ""
    },
    handlers: {
        onScroll: "onScrollHandler"
    },
    onScrollHandler: function (inSender, inEvent) {
        var bounds = this.getBounds(),
            scrollBounds = this.getScrollBounds();
        this.doDocumentScrolled({"bounds": bounds, "scrollBounds": scrollBounds});

    }
});