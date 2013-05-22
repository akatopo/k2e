/*global enyo, Document */

enyo.kind({
    name: "Document",
    kind: "enyo.Component",
    published: {
        index: -1,
        title: "",
        author: "",
        isPeriodical: false,
        clippings: undefined
    },
    events: {
        onExportBegin: "",
        onExportEnd: "",
        onQueryBegin: "",
        onQueryEnd: ""
    },
    addClipping: function (clipping) {
        this.getClippings().push(clipping);
    },
    create: function () {
        this.inherited(arguments);
        this.clippings = [];
    },
    exportObject: function () {
        var clipExportArray = [],
            clipExport,
            i;

        for (i = 0; i < this.clippings.length; i += 1) {
            clipExport = this.clippings[i].exportObject();
            clipExportArray.push(clipExport);
        }

        return {
            title: this.title,
            author: this.author,
            isPeriodical: this.isPeriodical,
            clippings: clipExportArray
        };
    }
});

enyo.kind({
    name: "Clipping",
    kind: "enyo.Component",
    published: {
        type: "",
        loc: "",
        timeStamp: "",
        content: "",
        suggestedTitle: "",
        suggestedUrl: ""
    },
    exportObject: function () {
        return {
            type: this.type,
            loc: this.loc,
            timeStamp: this.timeStamp,
            content: this.content,
            suggestedTitle: this.suggestedTitle,
            suggestedUrl: this.suggestedUrl
        };
    }
});

enyo.kind({
    name: "Documents",
    kind: "enyo.Component",
    published: {
        docMap: undefined,
        keyArray: undefined,
        length: 0
    },
    addClippingToDocument: function (title, author, clipping) {
        var key = title + author;

        if (!this.docMap[key]) {
            this.docMap[key] = new Document({
                title: title,
                author: author
            });
            this.length += 1;
            this.keyArray.push(key);
        }

        this.docMap[key].addClipping(clipping);
    },
    getDocumentByIndex: function (index) {
        return this.docMap[this.keyArray[index]];
    },
    create: function () {
        this.inherited(arguments);
        this.docMap = {};
        this.keyArray = [];
    },
    exportObject: function (options) {
        var ignoredTitleSet = (options && options.ignoredTitleSet) || false,
            selectedKeySet = (options && options.selectedKeySet) || false,
            documentsExport = { documents: [] },
            i,
            doc,
            docExport,
            exportFunc;

        // selectedKeySet has priority over ignoredTitleSet
        if (selectedKeySet) {
            exportFunc = function (doc) {
                if (selectedKeySet.hasOwnProperty(doc.title + doc.author)) {
                    docExport = doc.exportObject();
                    documentsExport.documents.push(docExport);
                }
            };
        } else if (ignoredTitleSet) {
            exportFunc = function (doc) {
                if (!ignoredTitleSet.hasOwnProperty(doc.title)) {
                    docExport = doc.exportObject();
                    documentsExport.documents.push(docExport);
                }
            };
        } else {
            exportFunc = function (doc) {
                docExport = doc.exportObject();
                documentsExport.documents.push(docExport);
            };
        }

        for (i = 0; i < this.keyArray.length; i += 1) {
            doc = this.docMap[this.keyArray[i]];

            exportFunc(doc);
        }

        return documentsExport;
    }
});