/* global fuzzy:false */

(function (fuzzy) {

const PRE = '\u{E000}';
const POST = '\u{E001}';
const MATCH_REGEX = new RegExp(`${PRE}([^${POST}])${POST}`, 'g');

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
    filter: '',
  },
  viewKeys: undefined,
  matches: undefined,
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
  filterChanged,
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
  const matches = this.matches || {};
  const docMap = this.documentsRef.getDocMap();
  const key = this.viewKeys[index];

  item.$.documentSelectorItem.setTitleComponents(
    matches[key] && matches[key].title ? matches[key].title : docMap[key].title
  );
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
  this.items = [];
  this.filter = '';
  this.selDocumentSelectorItem = undefined;

  this.viewKeys = getDescendingDocKeys(this.documentsRef);

  this.$.documentSelectorRepeater.setCount(this.viewKeys.length);
}

function filterChanged(oldFilter, newFilter) {
  if (!this.documentsRef) {
    return;
  }
  const filter = newFilter.trim().toLowerCase();
  const docMap = this.documentsRef.getDocMap();
  const outMatches = {};

  this.items = [];
  this.selDocumentSelectorItem = undefined;

  this.viewKeys = (!filter && getDescendingDocKeys(this.documentsRef)) ||
    this.documentsRef.getKeyArray()
      .slice(0)
      .filter(filterMatched.bind(undefined, docMap, outMatches, filter))
      .sort((aDocKey, bDocKey) =>
        outMatches[bDocKey].score - outMatches[aDocKey].score
      );
  this.matches = outMatches;

  this.$.documentSelectorRepeater.setCount(this.viewKeys.length);
}

function filterMatched(docMap, outMatches, filter, docKey) {
  const title = [docMap[docKey].title];
  const author = [docMap[docKey].author];

  const [titleRes, authorRes] = [title, author]
    .map((arr) => fuzzy
      .filter(filter, arr, { pre: PRE, post: POST })
      .map((match) => ({ string: match.string, score: match.score }))
    );

  const res = {
    title: titleRes.length ?
      createHighlightedComponents(titleRes[0].string, MATCH_REGEX) : undefined,
    author: authorRes.length ?
      createHighlightedComponents(authorRes[0].string, MATCH_REGEX) : undefined,
    score: Math.max(
      titleRes.length ? titleRes[0].score : 0,
      authorRes.length ? authorRes[0].score : 0
    ),
  };

  const matched = res.title || res.author;
  if (matched) {
    outMatches[docKey] = res;
  }
  return matched;
}

function createHighlightedComponents(s, re) {
  const newRe = new RegExp(re);
  const iterable = {
    [Symbol.iterator]() {
      return {
        next() {
          const value = newRe.exec(s);
          return { value: value || undefined, done: !value };
        },
      };
    },
  };
  const components = [];
  let oldEnd = 0;
  for (const res of iterable) {
    const start = res.index;
    const end = newRe.lastIndex;
    const source = res.input;

    const prevNonMatch = source.slice(oldEnd, start);
    const match = res[1] || res[0];

    if (prevNonMatch) {
      components.push({ tag: null, content: prevNonMatch });
    }
    components.push({ tag: 'span', classes: 'k2e-fuzzy-highlight', content: match });
    oldEnd = end;
  }

  if (oldEnd < s.length) {
    components.push({ tag: null, content: s.slice(oldEnd) });
  }

  return components;
}

// descending (newest to oldest most recent clipping date) key sort
function getDescendingDocKeys(docRef) {
  const docMap = docRef.getDocMap();
  const keys = docRef.getKeyArray();

  // descending (newest to oldest most recent clipping date) key sort
  const sortedKeys = keys.slice(0).sort((a, b) => {
    const aUnixTimestamp = docMap[a].mostRecentDate.valueOf();
    const bUnixTimestamp = docMap[b].mostRecentDate.valueOf();

    return bUnixTimestamp - aUnixTimestamp;
  });

  return sortedKeys;
}

})(fuzzy);
