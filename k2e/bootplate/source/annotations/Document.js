(function () {

enyo.kind({
  name: 'k2e.annotations.Document',
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
  addClipping: addClipping,
  create: create,
  exportObject: exportObject
});

/////////////////////////////////////////////////////////////

function addClipping(clipping) {
  this.clippings.push(clipping);
  this.mostRecentDate =
    this.mostRecentDate && this.mostRecentDate.isAfter(clipping.creationDate) ?
      this.mostRecentDate : clipping.creationDate;
}

function create() {
  this.inherited(arguments);
  this.clippings = [];
}

function exportObject() {
  var clipExportArray = [];

  this.clippings.forEach(function (clipping) {
    var clipExport = clipping.exportObject();
    clipExportArray.push(clipExport);
  });

  return {
    title: this.title,
    author: this.author,
    isPeriodical: this.isPeriodical,
    clippings: clipExportArray
  };
}

})();
