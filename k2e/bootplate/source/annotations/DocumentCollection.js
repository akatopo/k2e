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
  create,
  addClippingToDocument,
  getDocumentByKey(key) { return this.docMap[key]; },
  exportObject
});

/////////////////////////////////////////////////////////////

function create() {
  this.inherited(arguments);
  this.docMap = {};
  this.keyArray = [];
}

function addClippingToDocument(title, author, clipping) {
  let key = title + author;

  if (!this.docMap[key]) {
    this.docMap[key] = new k2e.annotations.Document({
      title,
      author
    });
    this.length += 1;
    this.keyArray.push(key);
  }

  this.docMap[key].addClipping(clipping);
}

function exportObject(options) {
  let self = this;
  let ignoredTitleSet = (options && options.ignoredTitleSet) || false;
  let selectedKeySet = (options && options.selectedKeySet) || false;
  let documentsExport = { documents: [] };
  let exportFunc;

  // selectedKeySet has priority over ignoredTitleSet
  if (selectedKeySet) {
    exportFunc = function (doc) {
      if (selectedKeySet.hasOwnProperty(doc.title + doc.author)) {
        let docExport = doc.exportObject();
        documentsExport.documents.push(docExport);
      }
    };
  }
  else if (ignoredTitleSet) {
    exportFunc = function (doc) {
      if (!ignoredTitleSet.hasOwnProperty(doc.title)) {
        let docExport = doc.exportObject();
        documentsExport.documents.push(docExport);
      }
    };
  }
  else {
    exportFunc = function (doc) {
      let docExport = doc.exportObject();
      documentsExport.documents.push(docExport);
    };
  }

  this.keyArray.forEach(function (key) {
    let doc = self.docMap[key];
    exportFunc(doc);
  });

  return documentsExport;
}

})();
