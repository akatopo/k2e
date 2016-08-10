(function () {

enyo.kind({
  name: 'k2e.annotations.DocumentSelectorList',
  kind: 'enyo.Scroller',
  strategyKind: 'ScrollStrategy',
  components: [
    { name: 'documentSelectorRepeater', kind: 'enyo.Repeater', onSetupItem: 'handleSetupItem',
      count: 0, components: [
        { kind: 'k2e.annotations.DocumentSelectorItem' },
      ] },
  ],
  published: {
    documentsRef: undefined,
    selDocumentSelectorItem: null,
    multiSelected: false,
  },
  items: undefined,
  handlers: {
    onDocumentSelected: 'handleDocumentSelected',
  },
  create,
  handleDocumentSelected,
  handleSetupItem,
  multiSelectedChanged,
  getMultiSelectionKeys,
  selectNextDocument,
  selectPrevDocument,
  documentsRefChanged,
});

/////////////////////////////////////////////////////////////

function create() {
  this.inherited(arguments);
  this.items = [];
}

function handleDocumentSelected(inSender, inEvent) {
  const docSelectorItem = inEvent.originator;

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
    const curItemIndex = this.selDocumentSelectorItem.index;
    const prevItem = this.items[Math.max(curItemIndex - 1, 0)];
    const alignWithTop = !this.getStrategy().isInView(prevItem.hasNode());

    this.scrollIntoView(this.selDocumentSelectorItem, alignWithTop);
  }
}

function handleSetupItem(inSender, inEvent) {
  const index = inEvent.index;
  const item = inEvent.item;
  const docMap = this.documentsRef.getDocMap();
  const key = this.sortedKeys[index];

  item.$.documentSelectorItem.set('title', docMap[key].title);
  item.$.documentSelectorItem.set('index', index);
  item.$.documentSelectorItem.set('key', key);
  this.items.push(item.$.documentSelectorItem);

  return true;
}

function multiSelectedChanged() {
  const multiSelected = !!this.multiSelected;
  this.items.forEach((item) => {
    item.set('multiSelected', multiSelected);
  });
}

function getMultiSelectionKeys() {
  const multiSelKeys = {};

  this.items.forEach((item) => {
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
  const docMap = this.documentsRef.getDocMap();
  const keys = this.documentsRef.getKeyArray();

  this.items = [];
  this.selDocumentSelectorItem = undefined;

  // descending (newest to oldest most recent clipping date) key sort
  this.sortedKeys = keys.slice(0).sort((a, b) => {
    const aUnixTimestamp = docMap[a].mostRecentDate.valueOf();
    const bUnixTimestamp = docMap[b].mostRecentDate.valueOf();

    return bUnixTimestamp - aUnixTimestamp;
  });

  this.$.documentSelectorRepeater.setCount(this.documentsRef.length);
}

})();
