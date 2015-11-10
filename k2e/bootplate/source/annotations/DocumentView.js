(function () {

enyo.kind({
  name: 'k2e.annotations.DocumentView',
  classes: 'k2e-document-view',
  components: [],
  displayDocument,
  clearDocument() { this.destroyComponents(); }
});

/////////////////////////////////////////////////////////////

function displayDocument(doc) {
  this.clearDocument();

  this.createComponent({tag: 'h1', content: doc.title});
  this.createComponent({classes: 'k2e-document-view-subtitle', components: [
    {tag: 'i', content: 'by '},
    {tag: 'span', content: doc.author }
  ]});

  let sortedClippings = doc.clippings.slice(0).sort(sortDescending);
  sortedClippings.forEach(appendClippingToDisplay.bind(undefined, this));

  this.render();

  /////////////////////////////////////////////////////////////

  function sortDescending(a, b) {
    let aUnixTimestamp = a.creationDate.valueOf();
    let bUnixTimestamp = b.creationDate.valueOf();

    return bUnixTimestamp - aUnixTimestamp;
  }

  function appendClippingToDisplay(component, clipping, index, sortedClippings) {
    let loc = clipping.loc;
    let type = clipping.type;
    let timestamp = clipping.timeStamp;
    let content = clipping.content;

    if (index !== 0) {
      component.createComponent({classes: 'k2e-document-view-clip-separator'});
    }

    component.createComponent({classes: 'k2e-document-view-clip-header', components: [
      {tag: 'i', content: type + ', ' + loc},
      {tag: 'span', content: ' | '},
      {tag: 'i', content: 'Added on ' + timestamp }
    ]});

    component.createComponent(
      {tag: 'p', components: [
        {tag: 'i', classes: 'icon-quote-left icon-large'},
        {tag: null, allowHtml: true, content: ' ' + content}
      ]}
    );
  }
}

})();
