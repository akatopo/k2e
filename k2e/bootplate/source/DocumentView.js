enyo.kind({
    name: "DocumentView",

    classes: "k2e-document-view",

    components: [],
    
    displayDocument: function (doc) {
        var documentDisplay = this;
        function appendClippingToDisplay(doc, i) {
            var loc = doc.clippings[i].loc;
            var type = doc.clippings[i].type;
            var timestamp = doc.clippings[i].timeStamp;
            var content = doc.clippings[i].content;

            documentDisplay.createComponent({classes: "k2e-document-view-clip-header", components: [
                    {tag: "i", content: type + ", " + loc},
                    {tag: "span", content: " | "},
                    {tag: "i", content: timestamp }
                    ]});
            documentDisplay.createComponent({tag: "p", content: content});
        };

        this.clearDocument();

        this.createComponent({tag: "h1", content: doc.title});
        this.createComponent({classes: "k2e-document-view-subtitle", components: [
                {tag: "i", content: "by "},
                {tag: "span", content: doc.author }
                ]});

        if (doc.clippings.length != 0) {
            appendClippingToDisplay(doc, 0);
            for (var i = 1; i < doc.clippings.length; ++i) {
                this.createComponent({classes:"k2e-document-view-clip-separator"});
                appendClippingToDisplay(doc, i);
            }
        }

        this.render();
    },

    clearDocument: function () {
        this.destroyComponents();
    }
});