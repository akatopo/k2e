/* global k2e */

(function () {

enyo.kind({
  name: 'k2e.annotations.DocumentCollection',
  kind: 'enyo.Component',
  published: {
    docMap: undefined,
    keyArray: undefined,
    length: 0
  },
  addClippingToDocument: function (title, author, clipping) {
    var key = title + author;

    if (!this.docMap[key]) {
      this.docMap[key] = new k2e.annotations.Document({
        title: title,
        author: author
      });
      this.length += 1;
      this.keyArray.push(key);
    }

    this.docMap[key].addClipping(clipping);
  },
  getDocumentByKey: function (key) {
    return this.docMap[key];
  },
  create: function () {
    this.inherited(arguments);
    this.docMap = {};
    this.keyArray = [];
  },
  exportObject: function (options) {
    var ignoredTitleSet = (options && options.ignoredTitleSet) || false;
    var selectedKeySet = (options && options.selectedKeySet) || false;
    var documentsExport = { documents: [] };
    var i;
    var doc;
    var docExport;
    var exportFunc;

    // selectedKeySet has priority over ignoredTitleSet
    if (selectedKeySet) {
      exportFunc = function (doc) {
        if (selectedKeySet.hasOwnProperty(doc.title + doc.author)) {
          docExport = doc.exportObject();
          documentsExport.documents.push(docExport);
        }
      };
    }
    else if (ignoredTitleSet) {
      exportFunc = function (doc) {
        if (!ignoredTitleSet.hasOwnProperty(doc.title)) {
          docExport = doc.exportObject();
          documentsExport.documents.push(docExport);
        }
      };
    }
    else {
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

})();