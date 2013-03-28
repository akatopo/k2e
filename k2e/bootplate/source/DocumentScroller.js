enyo.kind({
    name: "DocumentScroller",
    kind: "enyo.Scroller",
    fit: true,
    classes: "k2e-document-scroller k2e-document-view-dark",
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

    }/*,
    components: [
        {name: "document_view", kind: "DocumentView", fit: true}
    ]*/
});