enyo.kind({
    name: "DocumentView",

    classes: "k2e-document-view",

    components: [],

    displayDocument: function (doc) {
        var self = this,
            i;

        function appendClippingToDisplay(doc, i) {
            var loc = doc.clippings[i].loc,
                type = doc.clippings[i].type,
                timestamp = doc.clippings[i].timeStamp,
                content = doc.clippings[i].content;

            self.createComponent({classes: "k2e-document-view-clip-header", components: [
                {tag: "i", content: type + ", " + loc},
                {tag: "span", content: " | "},
                {tag: "i", content: timestamp }
            ]});
            self.createComponent({tag: "p", content: content});
        }

        this.clearDocument();

        this.createComponent({tag: "h1", content: doc.title});
        this.createComponent({classes: "k2e-document-view-subtitle", components: [
            {tag: "i", content: "by "},
            {tag: "span", content: doc.author }
        ]});

        if (doc.clippings.length !== 0) {
            appendClippingToDisplay(doc, 0);
            for (i = 1; i < doc.clippings.length; i += 1) {
                this.createComponent({classes: "k2e-document-view-clip-separator"});
                appendClippingToDisplay(doc, i);
            }
        }

        this.render();
    },

    clearDocument: function () {
        this.destroyComponents();
    }
});