(function () {

enyo.kind({
  name: 'k2e.annotations.DocumentSelectorList',
  kind: 'enyo.Scroller',
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
  create: create,
  handleDocumentSelected: handleDocumentSelected,
  handleSetupItem: handleSetupItem,
  setMultiSelected: setMultiSelected,
  toggleMultiSelection: toggleMultiSelection,
  enableMultiSelection: enableMultiSelection,
  disableMultiSelection: disableMultiSelection,
  getMultiSelectionKeys: getMultiSelectionKeys,
  selectNextDocument: selectNextDocument,
  selectPrevDocument: selectPrevDocument,
  populate: populate
});

/////////////////////////////////////////////////////////////

function create() {
  this.inherited(arguments);
  this.items = [];
}

function handleDocumentSelected(inSender, inEvent) {
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
}

function handleSetupItem(inSender, inEvent) {
  var index = inEvent.index;
  var item = inEvent.item;
  var docMap = this.documentsRef.getDocMap();
  var key = this.sortedKeys[index];

  item.$.documentSelectorItem.setTitle(docMap[key].getTitle());
  item.$.documentSelectorItem.setIndex(index);
  item.$.documentSelectorItem.setKey(key);
  this.items.push(item.$.documentSelectorItem);

  return true;
}

function setMultiSelected(inValue) {
  if (inValue) {
    this.multiSelected = true;
    this.enableMultiSelection();
  }
  else {
    this.multiSelected = false;
    this.disableMultiSelection();
  }
}

function toggleMultiSelection() {
  if (this.multiSelected) {
    this.disableMultiSelection();
  }
  else {
    this.enableMultiSelection();
  }
}

function enableMultiSelection() {
  this.multiSelected = true;
  this.items.forEach(function (item) {
    item.setMultiSelected(true);
  });
}

function disableMultiSelection() {
  this.items.forEach(function (item) {
    item.setMultiSelected(false);
  });
  this.multiSelected = false;
}

function getMultiSelectionKeys() {
  var multiSelKeys = {};

  this.items.forEach(function (item) {
    if (item.getMultiSelected() && item.isMarked()) {
      multiSelKeys[item.getKey()] = true;
    }
  });

  return multiSelKeys;
}

function selectNextDocument() {
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
}

function selectPrevDocument() {
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
}

function populate(documents) {
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
}

})();
