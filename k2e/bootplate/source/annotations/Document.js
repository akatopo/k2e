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
  addClipping: function (clipping) {
    this.clippings.push(clipping);
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

})();
