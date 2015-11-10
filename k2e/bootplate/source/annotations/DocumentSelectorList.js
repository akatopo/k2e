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
  create,
  handleDocumentSelected,
  handleSetupItem,
  multiSelectedChanged,
  getMultiSelectionKeys,
  selectNextDocument,
  selectPrevDocument,
  documentsRefChanged
});

/////////////////////////////////////////////////////////////

function create() {
  this.inherited(arguments);
  this.items = [];
}

function handleDocumentSelected(inSender, inEvent) {
  let docSelectorItem = inEvent.originator;

  if (this.selDocumentSelectorItem === docSelectorItem) {
    inEvent.reSelected = true;
    return;
  }

  if (this.selDocumentSelectorItem) {
    this.selDocumentSelectorItem.set('selected', false);
  }
  docSelectorItem.set('selected', true);
  this.selDocumentSelectorItem = docSelectorItem;

  // TODO: isInView is protected. Is there a better way to find whether a node/control is in view?
  if (!this.getStrategy().isInView(this.selDocumentSelectorItem.hasNode())) {
    let curItemIndex = this.selDocumentSelectorItem.index;
    let prevItem = this.items[Math.max(curItemIndex - 1, 0)];
    let alignWithTop = !this.getStrategy().isInView(prevItem.hasNode());

    this.scrollIntoView(this.selDocumentSelectorItem, alignWithTop);
  }
}

function handleSetupItem(inSender, inEvent) {
  let index = inEvent.index;
  let item = inEvent.item;
  let docMap = this.documentsRef.getDocMap();
  let key = this.sortedKeys[index];

  item.$.documentSelectorItem.set('title', docMap[key].title);
  item.$.documentSelectorItem.set('index', index);
  item.$.documentSelectorItem.set('key', key);
  this.items.push(item.$.documentSelectorItem);

  return true;
}

function multiSelectedChanged() {
  let multiSelected = !!this.multiSelected;
  this.items.forEach(function (item) {
    item.set('multiSelected', multiSelected);
  });
}

function getMultiSelectionKeys() {
  let multiSelKeys = {};

  this.items.forEach(function (item) {
    if (item.getMultiSelected() && item.isMarked()) {
      multiSelKeys[item.getKey()] = true;
    }
  });

  return multiSelKeys;
}

function selectNextDocument() {
  let curIndex;
  let selDocument;

  if (this.items.length === 0) {
    return;
  }

  if (!this.selDocumentSelectorItem) {
    selDocument = this.items[0];
    selDocument.doDocumentSelected();
  }
  else {
    curIndex = this.selDocumentSelectorItem.index;
    if (curIndex > -1 && curIndex < this.items.length - 1) {
      ++curIndex;

      selDocument = this.items[curIndex];
      selDocument.doDocumentSelected();
    }
  }
}

function selectPrevDocument() {
  let curIndex;
  let selDocument;

  if (this.items.length === 0) {
    return;
  }

  if (!this.selDocumentSelectorItem) {
    selDocument = this.items[this.items.length - 1];
    selDocument.doDocumentSelected();
  }
  else {
    curIndex = this.selDocumentSelectorItem.getIndex();
    if (curIndex > 0 && curIndex < this.items.length) {
      --curIndex;

      selDocument = this.items[curIndex];
      selDocument.doDocumentSelected();
    }
  }
}

function documentsRefChanged() {
  let docMap = this.documentsRef.getDocMap();
  let keys = this.documentsRef.getKeyArray();

  // descending (newest to oldest most recent clipping date) key sort
  this.sortedKeys = keys.slice(0).sort(function (a, b) {
    let aUnixTimestamp = docMap[a].mostRecentDate.valueOf();
    let bUnixTimestamp = docMap[b].mostRecentDate.valueOf();

    return bUnixTimestamp - aUnixTimestamp;
  });

  this.$.documentSelectorRepeater.setCount(this.documentsRef.length);
}

})();
