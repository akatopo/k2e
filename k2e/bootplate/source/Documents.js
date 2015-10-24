/* global Document, ClippingCollection, moment */

(function () {

enyo.kind({
  name: 'ClippingCollection',
  kind: 'enyo.Component',
  published: {
    title: '',
    author: '',
    isPeriodical: false,
    clippings: undefined,
    mostRecentDate: undefined
  },
  events: {
    onExportBegin: '',
    onExportEnd: '',
    onQueryBegin: '',
    onQueryEnd: ''
  },
  addClipping: function (clipping) {
    this.getClippings().push(clipping);
    this.mostRecentDate =
      this.mostRecentDate && this.mostRecentDate.isAfter(clipping.creationDate) ?
        this.mostRecentDate : clipping.creationDate;
  },
  create: function () {
    this.inherited(arguments);
    this.clippings = [];
  },
  exportObject: function () {
    var clipExportArray = [];
    var clipExport;
    var i;

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
  name: 'Clipping',
  kind: 'enyo.Component',
  published: {
    type: '',
    loc: '',
    timeStamp: '',
    creationDate: undefined,
    content: '',
    suggestedTitle: '',
    suggestedUrl: ''
  },
  create: function () {
    var DATE_FORMAT = 'dddd, MMMM DD, YYYY, hh:mm A';
    this.inherited(arguments);
    this.creationDate = moment(this.timeStamp, DATE_FORMAT);
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
  name: 'Documents',
  kind: 'enyo.Component',
  published: {
    docMap: undefined,
    keyArray: undefined,
    length: 0
  },
  addClippingToDocument: function (title, author, clipping) {
    var key = title + author;

    if (!this.docMap[key]) {
      this.docMap[key] = new ClippingCollection({
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
