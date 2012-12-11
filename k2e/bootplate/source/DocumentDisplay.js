enyo.kind({
    name: "DocumentDisplay",
    classes: "k2e-document-display",
    components: [],
    displayDocument: function (doc) {
        this.clearDocument();

        this.createComponent({tag: "h1", content: doc.title});
        this.createComponent({classes: "k2e-document-display-subtitle", components: [
                {tag: "i", content: "by "},
                {tag: "span", content: doc.author }
                ]});

        for (var i = 0; i < doc.clippings.length; ++i) {
            var loc = doc.clippings[i].loc;
            var type = doc.clippings[i].type;
            var timestamp = doc.clippings[i].timeStamp;
            var content = doc.clippings[i].content;
            this.createComponent({tag: "h2", content: type + " " + timestamp});
            this.createComponent({tag: "p", content: content});
        }

        this.render();
    },
    clearDocument: function () {
        this.destroyComponents();
    }
});