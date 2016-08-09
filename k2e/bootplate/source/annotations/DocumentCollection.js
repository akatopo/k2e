/* global k2e:false */

(function () {

enyo.kind({
  name: 'k2e.annotations.DocumentCollection',
  kind: 'enyo.Component',
  published: {
    docMap: undefined,
    keyArray: undefined,
    length: 0,
  },
  create,
  addClippingToDocument,
  getDocumentByKey(key) { return this.docMap[key]; },
  exportObject,
});

/////////////////////////////////////////////////////////////

function create() {
  this.inherited(arguments);
  this.docMap = {};
  this.keyArray = [];
}

function addClippingToDocument(title, author, clipping) {
  const key = title + author;

  if (!this.docMap[key]) {
    this.docMap[key] = new k2e.annotations.Document({
      title,
      author,
    });
    this.length += 1;
    this.keyArray.push(key);
  }

  this.docMap[key].addClipping(clipping);
}

function exportObject(options) {
  const ignoredTitleSet = (options && options.ignoredTitleSet) || false;
  const selectedKeySet = (options && options.selectedKeySet) || false;
  const documentsExport = { documents: [] };
  let exportFunc;

  // selectedKeySet has priority over ignoredTitleSet
  if (selectedKeySet) {
    exportFunc = (doc) => {
      if ({}.hasOwnProperty.call(selectedKeySet, `${doc.title}${doc.author}`)) {
        const docExport = doc.exportObject();
        documentsExport.documents.push(docExport);
      }
    };
  }
  else if (ignoredTitleSet) {
    exportFunc = (doc) => {
      if (!{}.hasOwnProperty.call(ignoredTitleSet, doc.title)) {
        const docExport = doc.exportObject();
        documentsExport.documents.push(docExport);
      }
    };
  }
  else {
    exportFunc = (doc) => {
      const docExport = doc.exportObject();
      documentsExport.documents.push(docExport);
    };
  }

  this.keyArray.forEach((key) => {
    const doc = this.docMap[key];
    exportFunc(doc);
  });

  return documentsExport;
}

})();
