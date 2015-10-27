(function () {

enyo.kind({
  name: 'k2e.annotations.DocumentSelectorList',
  kind: 'enyo.Scroller',
  style: 'height: 100%',
  strategyKind: 'ScrollStrategy',
  components: [
    {name: 'documentSelectorRepeater', kind: 'enyo.Repeater', onSetupItem: 'handleSetupItem',
      count: 0, components: [
        {kind: 'k2e.annotations.DocumentSelectorItem'}
    ]}
  ],
  published: {
    documentsRef: undefined,
    selDocumentSelectorItem: null,
    multiSelected: false
  },
  items: undefined,
  handlers: {
    onDocumentSelected: 'handleDocumentSelected'
  },
  handleDocumentSelected: function (inSender, inEvent) {
    var docSelectorItem = inEvent.originator;
    if (this.selDocumentSelectorItem === docSelectorItem) {
      inEvent.reSelected = true;
      return;
    }

    if (this.selDocumentSelectorItem) {
      this.selDocumentSelectorItem.setSelected(false);
    }
    docSelectorItem.setSelected(true);
    this.selDocumentSelectorItem = docSelectorItem;
    // TODO: isInView is protected. Is there a better way to find whether a node/control is in view?
    if (!this.getStrategy().isInView(this.selDocumentSelectorItem.hasNode())) {
      this.scrollIntoView(this.selDocumentSelectorItem, false);
    }
  },
  handleSetupItem: function (inSender, inEvent) {
    var index = inEvent.index;
    var item = inEvent.item;
    var docMap = this.documentsRef.getDocMap();
    var key = this.sortedKeys[index];

    item.$.documentSelectorItem.setTitle(docMap[key].getTitle());
    item.$.documentSelectorItem.setIndex(index);
    item.$.documentSelectorItem.setKey(key);
    this.items.push(item.$.documentSelectorItem);

    return true;
  },
  setMultiSelected: function (inValue) {
    if (inValue) {
      this.multiSelected = true;
      this.enableMultiSelection();
    }
    else {
      this.multiSelected = false;
      this.disableMultiSelection();
    }
  },
  toggleMultiSelection: function () {
    if (this.multiSelected) {
      this.disableMultiSelection();
    }
    else {
      this.enableMultiSelection();
    }
  },
  enableMultiSelection: function () {
    var i;

    this.multiSelected = true;

    for (i = 0; i < this.items.length; i += 1) {
      this.items[i].setMultiSelected(true);
    }
  },
  disableMultiSelection: function () {
    this.items.forEach(function (item) {
      item.setMultiSelected(false);
    });
    this.multiSelected = false;
  },
  getMultiSelectionKeys: function () {
    var i;
    var multiSelKeys = {};

    for (i = 0; i < this.items.length; i += 1) {
      if (this.items[i].getMultiSelected() &&
          this.items[i].isMarked()
      ) {
        multiSelKeys[this.items[i].getKey()] = true;
      }
    }

    return multiSelKeys;
  },
  selectNextDocument: function () {
    var curIndex;
    var selDocument;

    if (this.items.length !== 0) {
      if (!this.selDocumentSelectorItem) {
        selDocument = this.items[0];
        selDocument.doDocumentSelected();
      }
      else {
        curIndex = this.selDocumentSelectorItem.getIndex();
        if (curIndex >= 0 && curIndex < this.items.length - 1) {
          curIndex += 1;

          selDocument = this.items[curIndex];
          selDocument.doDocumentSelected();
        }

        this.log(this.selDocumentSelectorItem.getIndex());
      }
    }
  },
  selectPrevDocument: function () {
    var curIndex;
    var selDocument;

    if (this.items.length !== 0) {
      if (!this.selDocumentSelectorItem) {
        selDocument = this.items[this.items.length - 1];
        selDocument.doDocumentSelected();
      }
      else {
        curIndex = this.selDocumentSelectorItem.getIndex();
        if (curIndex >= 1 && curIndex < this.items.length) {
          curIndex -= 1;

          selDocument = this.items[curIndex];
          selDocument.doDocumentSelected();
        }

        this.log(this.selDocumentSelectorItem.getIndex());
      }
    }
  },
  populate: function (documents) {
    this.documentsRef = documents;
    var docMap = this.documentsRef.getDocMap();
    var keys = this.documentsRef.getKeyArray();

    // descending (newest to oldest most recent clipping date) key sort
    this.sortedKeys = keys.slice(0).sort(function (a, b) {
      var aUnixTimestamp = docMap[a].mostRecentDate.valueOf();
      var bUnixTimestamp = docMap[b].mostRecentDate.valueOf();

      return bUnixTimestamp - aUnixTimestamp;
    });

    this.$.documentSelectorRepeater.setCount(this.documentsRef.length);
  },
  create: function () {
    this.inherited(arguments);
    this.items = [];
  }
});

})();
