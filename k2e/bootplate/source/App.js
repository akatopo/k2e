/* global k2e */

(function () {

let exportPreparationSem;
let docsExport;

enyo.kind({
  name: 'k2e.App',
  kind: 'FittableRows',
  components: [
    {kind: 'enyo.Signals', onkeydown: 'handleKeydown', onFullscreenChange: 'toggleDistractionFreeMode'},
    {name: 'clippingPickerPopup', kind: 'k2e.ClippingPickerPopup'},
    {name: 'exportPopup', kind: 'k2e.ProgressPopup' },
    {name: 'appToolbar', kind: 'onyx.Toolbar', layoutKind: 'FittableColumnsLayout', components: [
      {name: 'settingsButton', kind: 'onyx.Button', classes: 'k2e-icon-button', ontap: 'toggleSettings', components: [
        {tag: 'i', classes: 'icon-menu icon-large'}
      ]},
      {content: 'k2e', fit: true},
      {name: 'exportButton', kind: 'k2e.ExportButton', ontap: 'prepareDocumentsAndExport'}
    ]},
    {name: 'settings', kind: 'k2e.settings.SettingsSlideable'},
    {kind: 'FittableColumns', fit: true, components: [
      {name: 'mainPanels', kind: 'Panels', fit: true, arrangerKind: 'CollapsingArranger', realtimeFit: true, wrap: false, components: [
        {name: 'sidebar', classes: 'k2e-sidebar', layoutKind: 'FittableRowsLayout', components: [
          {name: 'documentSelectorList', fit: true, kind: 'k2e.annotations.DocumentSelectorList'},
          {name: 'sidebarToolbar', kind: 'onyx.Toolbar', layoutKind: 'FittableColumnsLayout', components: [
            {name: 'multiSelectButton', kind: 'onyx.Button', classes: 'k2e-icon-button', ontap: 'toggleMultiSelection', components: [
              {tag: 'i', classes: 'icon-check icon-large'}
            ]}
          ]}
        ]},
        {kind: 'FittableRows', classes: 'k2e-main-panel', fit: true, components: [
          {name: 'documentControl', kind: 'k2e.annotations.DocumentControl', fit: true},
          {name: 'backToolbar', kind: 'onyx.Toolbar', showing: false, components: [
            {kind: 'onyx.Button', classes: 'k2e-icon-button', ontap: 'showDocumentSelectorList', components: [
              {tag: 'i', classes: 'icon-left-big icon-large'}
            ]}
          ]}
        ]}
      ]}
    ]}
  ],
  published: {
    periodicalTitleSet: undefined,
    ignoredTitleSet: undefined,
    documents: undefined,
    currentThemeClass: 'k2e-document-view-dark'
  },
  cookieModel: undefined,
  handlers: {
    onDocumentSelected: 'handleDocumentSelected',
    onDocumentMultiSelected: 'handleDocumentMultiSelected',
    onClippingsTextChanged: 'handleClippingsTextChanged',
    onThemeChanged: 'handleThemeChanged',
    onFontSizeChanged: 'handleFontSizeChanged',
    onTextMarginChanged: 'handleTextMarginChanged',
    onFullscreenRequest: 'toggleFullscreen'
  },
  bindings: [
    { from: '.cookieModel', to: '.$.settings.cookieModel' }
  ],

  toggleDistractionFreeMode,
  toggleFullscreen,
  showDocumentSelectorList,
  exportDocuments,
  processExportResponse,
  processExportError,
  evernoteAuthPopup,
  prepareDocumentsAndExport,
  setSuggestedDataToClipping,
  processQueryError,
  handleDocumentSelected,
  handleDocumentMultiSelected,
  handleExportBegin,
  handleExportEnd,
  handleQueryBegin,
  handleQueryEnd,
  handleClippingsTextChanged,
  handleKeydown,
  toggleSettings,
  toggleMultiSelection,
  handleThemeChanged,
  handleFontSizeChanged,
  handleTextMarginChanged,
  parseKindleClippings,
  reflow,
  rendered,
  create
});

/////////////////////////////////////////////////////////////

function arrayToSet(array) {
  let set = {};

  array.forEach((elem) => {
    set[elem] = true;
  });

  return set;
}

function toggleDistractionFreeMode() {
  if (this.$.settings.isAtMax()) {
    this.toggleSettings();
  }
  this.$.appToolbar.setShowing(!this.$.appToolbar.showing);
  this.$.sidebar.setShowing(!this.$.sidebar.showing);

  this.$.mainPanels.reflow();
  this.reflow();
}

function toggleFullscreen() {
  let isFullscreen = this.isFullscreen();

  this.$.documentControl.set('fullscreen', !isFullscreen);

  return isFullscreen ?
      this.cancelFullscreen() :
      this.requestFullscreen();
}

function showDocumentSelectorList() {
  this.$.mainPanels.setIndex(0);
}

function exportDocuments() {
  this.log('Export processing done');
  let loc = location.protocol + '//' + location.host + k2e.Constants.EXPORT_PATH;
  let ajax = new enyo.Ajax({
    url: loc,
    contentType: 'application/json',
    method: 'POST',
    postBody: {q: docsExport}
  });

  console.log(loc);
  console.log(docsExport);

  ajax.go();

  ajax.response(this, 'processExportResponse');
  ajax.error(this, 'processExportError');
}

function processExportResponse(inSender, inResponse) {
  this.$.exportPopup.done('Export done!');
}

function processExportError(inSender, inResponse) {
  let response = JSON.parse(inSender.xhrResponse.body);
  response = response ? response.d : { errors: []};
  if (inResponse === 401) {
    let cookieModel = this.$.settings.get('cookieModel');
    cookieModel.fetch();
    cookieModel.set(k2e.Constants.ACCESS_TOKEN_COOKIE_NAME, undefined);
    cookieModel.set(k2e.Constants.CONSUMER_PUBLIC_KEY_COOKIE_NAME, undefined);
    cookieModel.commit();
    this.$.exportPopup.failed('Export failed', 'Try exporting again');
  }
  else {
    this.$.exportPopup.failed('Export failed', response.errors.map((error) => {
      return error.message;
    }));
  }
}

function evernoteAuthPopup(cb, err) {
  let popup = window.open(k2e.Constants.AUTH_PATH, k2e.Constants.AUTH_WINDOW_NAME, k2e.Constants.AUTH_WINDOW_FEATURES);
  let noop = () => {};
  cb = cb || noop;
  err = err || noop;

  let pollTimer = window.setInterval(() => {
    try {
      if (popup.closed) {
        window.clearInterval(pollTimer);
        err();
      }
      else if (popup.document.URL.indexOf(k2e.Constants.AUTH_DONE_QUERY_PARAM) !== -1) {
        window.clearInterval(pollTimer);
        popup.close();
        if (document.cookie.indexOf(k2e.Constants.ACCESS_TOKEN_COOKIE_NAME) !== -1 &&
            document.cookie.indexOf(k2e.Constants.CONSUMER_PUBLIC_KEY_COOKIE_NAME) !== -1
        ) {
          cb();
        }
        else {
          err();
        }
      }
    }
    catch (ex) {}
  }, 100); // ms
}

function prepareDocumentsAndExport(/*inSender, inEvent*/) {
  this.$.exportPopup.begin('Exporting clippings...');

  if (document.cookie.indexOf(k2e.Constants.ACCESS_TOKEN_COOKIE_NAME) !== -1 &&
      document.cookie.indexOf(k2e.Constants.CONSUMER_PUBLIC_KEY_COOKIE_NAME) !== -1
  ) {
    this.cookieModel.fetch();
    doExport(this);
  }
  else {
    this.evernoteAuthPopup(
        this.prepareDocumentsAndExport.bind(this),
        stopExport.bind(undefined, this)
    );
  }

  /////////////////////////////////////////////////////////////

  function doExport(app) {
    app.handleExportBegin();

    let settings = new k2e.settings.SettingsSingleton();
    let ignoredTitleSet = {};
    let ignoredTitleList = settings.getSetting('ignoredTitleList');
    let docExportArray;
    let periodicalTitleSet = {};
    let periodicalTitleList;

    if (ignoredTitleList.length > 0) {
      ignoredTitleSet = arrayToSet(ignoredTitleList.split(','));
    }

    if (app.$.documentSelectorList.getMultiSelected()) {
      docsExport = app.documents.exportObject({selectedKeySet: app.$.documentSelectorList.getMultiSelectionKeys()});
    }
    else {
      docsExport = app.documents.exportObject({ignoredTitleSet: ignoredTitleSet});
    }
    docExportArray = docsExport.documents;

    periodicalTitleList = settings.getSetting('periodicalTitleList');
    if (periodicalTitleList.length > 0) {
      periodicalTitleSet = arrayToSet(periodicalTitleList.split(','));
    }

    docExportArray.forEach((documentExportObject) => {
      if (settings.getSetting('articleExtraction') === true) {
        app.log('Tagging documents as periodicals');
        if (periodicalTitleSet.hasOwnProperty(documentExportObject.title)) {
          documentExportObject.isPeriodical = true;
          documentExportObject.clippings.forEach((clippingExportObject) => {
            app.setSuggestedDataToClipping(clippingExportObject);
          });
        }
      }
    });

    app.handleExportEnd();
  }

  function stopExport(app) {
    app.$.exportPopup.failed('Authentication failed');
  }
}

function setSuggestedDataToClipping(clippingExport, makeQuotedFlag, retryFlag) {
  let settings = new k2e.settings.SettingsSingleton();
  let quoted = (makeQuotedFlag === undefined) ? true : makeQuotedFlag;
  let retry = (retryFlag === undefined) ? true : retryFlag;
  let loc = settings.getSetting('googleSearchApiLoc');
  let key = settings.getSetting('googleSearchApiKey');
  let cx = settings.getSetting('googleSearchApiCx');
  let MAX_QUERY_LENGTH = 128;
  let s = '';
  let q = '';
  let index;
  let ajax;
  let processQueryResponse;

  if (clippingExport.content.length > MAX_QUERY_LENGTH) {
    s = clippingExport.content.substring(0, MAX_QUERY_LENGTH);
  }
  else {
    s = clippingExport.content;
  }

  index = s.lastIndexOf(' ');
  if (index !== -1) {
    q = s.substring(0, index);
  }
  else {
    q = s;
  }

  q = quoted ? ('"' + q + '"') : q;

  ajax = new enyo.Ajax({
    url: loc
  });

  this.handleQueryBegin();
  ajax.go({
    key,
    cx,
    q
  });

  processQueryResponse = (inSender, inResponse) => {
    let cEx = clippingExport;
    if (inResponse.items && inResponse.items.length) {
      cEx.suggestedTitle = inResponse.items[0].title;
      cEx.suggestedUrl = inResponse.items[0].link;
      this.log('Got title: ' + inResponse.items[0].title);
      this.handleQueryEnd();
    }
    else {
      //send one additional query without quotes
      this.handleQueryEnd();
      if (retry) {
        this.setSuggestedDataToClipping(cEx, false, false);
      }
    }
  };
  ajax.response(processQueryResponse);
  ajax.error(this, 'processQueryError');
}

function processQueryError(inSender, inResponse) {
  this.error('Error in google search request');
  this.handleQueryEnd();
}

function handleDocumentSelected(inSender, inEvent) {
  let docSelector;
  let doc;

  if (enyo.Panels.isScreenNarrow()) {
    this.$.mainPanels.setIndex(1);
  }
  if (inEvent.reSelected) {
    return;
  }

  docSelector = inEvent.originator;
  doc = this.documents.getDocumentByKey(docSelector.getKey());
  this.log(docSelector.getTitle());
  this.log(docSelector.getIndex());
  this.log(doc);
  this.$.documentControl.set('document', doc);
}

function handleDocumentMultiSelected(inSender, inEvent) {
  if (!this.$.documentSelectorList.getMultiSelected()) {
    this.warn('Document multiselected when multiple selection mode inactive');
    return;
  }

  let selectionKeys = this.$.documentSelectorList.getMultiSelectionKeys();
  this.$.exportButton.set('disabled', Object.keys(selectionKeys).length === 0);
}

function handleExportBegin(inSender, inEvent) {
  this.log('handleExportBegin');
  exportPreparationSem.v();
}

function handleExportEnd(inSender, inEvent) {
  this.log('handleExportEnd');
  exportPreparationSem.p();
}

function handleQueryBegin(inSender, inEvent) {
  this.log('handleQueryBegin');
  exportPreparationSem.v();
}

function handleQueryEnd(inSender, inEvent) {
  this.log('handleQueryEnd');
  exportPreparationSem.p();
}

function handleClippingsTextChanged(inSender, inEvent) {
  let clipText = this.$.clippingPickerPopup.getClippingsText();
  try {
    this.documents = this.parseKindleClippings(clipText);
    this.$.documentSelectorList.set('documentsRef', this.documents);
    this.$.clippingPickerPopup.hide();
    this.$.documentSelectorList.selectNextDocument();
  }
  catch (e) {
    this.$.clippingPickerPopup.showErrorMessage();
    this.warn(e.message, e);
  }
}

function handleKeydown(inSender, inEvent) {
  let modKeyPressed = inEvent.altKey ||
    inEvent.ctrlKey ||
    inEvent.shiftKey ||
    inEvent.altGraphKey ||
    inEvent.metaKey;

  if (modKeyPressed) {
    return;
  }

  if (inEvent.keyCode === 70) { // 'f'
    this.toggleFullscreen();
  }
  else if (inEvent.keyCode === 74) { // 'j'
    this.$.documentSelectorList.selectNextDocument();
  }
  else if (inEvent.keyCode === 75) { // 'k'
    this.$.documentSelectorList.selectPrevDocument();
  }
  else if (inEvent.keyCode === 27) { // esc
    this.$.mainPanels.setIndex(0);
  }
  return true;
}

function toggleSettings(inSender, inEvent) {
  let settingsButton = this.$.settingsButton;
  settingsButton.addRemoveClass('active', !settingsButton.hasClass('active'));
  this.$.settings.toggle();
}

function toggleMultiSelection(inSender, inEvent) {
  let exportButton = this.$.exportButton;
  let multiSelectButton = this.$.multiSelectButton;
  this.$.documentSelectorList.set('multiSelected', !this.$.documentSelectorList.multiSelected);
  exportButton.set('disabled', !exportButton.exportSelected);
  exportButton.set('exportSelected', !exportButton.exportSelected);
  multiSelectButton.addRemoveClass('active', !multiSelectButton.hasClass('active'));
  this.$.appToolbar.reflow();
}

function handleThemeChanged(inSender, inEvent) {
  if (!this.$.documentControl) {
    return;
  }

  this.$.documentControl.set('theme', inEvent.name);
}

function handleFontSizeChanged(inSender, inEvent) {
  if (!this.$.documentControl) {
    return;
  }

  this.$.documentControl.set('fontSize', +inEvent.sizePercent);
}

function handleTextMarginChanged(inSender, inEvent) {
  if (!this.$.documentControl) {
    return;
  }

  this.$.documentControl.set('margin', +inEvent.current);
}

function parseKindleClippings(kindleClippings) {
  let docs = new k2e.annotations.DocumentCollection();
  let delimeterRegExp = /\r?\n==========\r?\n/;

  kindleClippings = kindleClippings.split(delimeterRegExp);
  kindleClippings.forEach(addClippingToDocumentCollection);

  return docs;

  /////////////////////////////////////////////////////////////

  function addClippingToDocumentCollection(clipping) {
    let clippingRegExp = /^(.+)\r?\n- (.+)\r?\n?\r?\n?(.*)$/;
    let res;
    let title;
    let author;
    let titleAndAuthor;
    let subtitle;
    let type;
    let loc;
    let timeStamp;
    let content;
    clipping = clipping.trim();

    if (clipping === '') {
      return;
    }
    if (!clippingRegExp.test(clipping)) {
      throw {
        code: 1,
        message: 'Invalid clipping format in clippings file'
      };
    }

    res = clippingRegExp.exec(clipping);
    titleAndAuthor = splitTitleAndAuthor(res[1]);
    title = titleAndAuthor[0];
    author = titleAndAuthor[1];
    subtitle = res[2].split(/\s+\|\s+/);
    type = subtitle[0].substring(0, subtitle[0].indexOf(' '));
    loc = subtitle[0].substring(subtitle[0].indexOf(' ') + 1);
    timeStamp = /^Added on (.*)$/.exec(subtitle[subtitle.length - 1])[1];
    content = k2e.util.linkify(enyo.dom.escape(res[3]), { targetBlank: true });

    // Skip kindle bookmarks and clippings (not to be confused with the Clipping class)
    if (type !== 'Bookmark' && type !== 'Clipping') {
      docs.addClippingToDocument(
        title,
        author,
        new k2e.annotations.Clipping({type: type, loc: loc, timeStamp: timeStamp,
          content: content})
        );
    }
  }

  function splitTitleAndAuthor(s) {
    let author = '';
    let title = '';
    let splitIndex;

    splitIndex = getAuthorOpenParenIndex(s);

    if (splitIndex !== undefined) {
      title = s.substring(0, splitIndex);
      author = s.substring(splitIndex + 1, s.length - 1);
    }
    else {
      title = s;
    }

    return [
      title.trim() || 'Unknown Title',
      author.trim() || 'Unknown Author'
    ];

    /////////////////////////////////////////////////////////////

    // Best effort function to get an author name by finding the opening parenthesis
    // matching the rightmost closing parenthesis

    function getAuthorOpenParenIndex(s) {
      if (s[s.length - 1] !== ')') {
        return undefined;
      }

      let rightOpenParens = 1;

      for (let i = s.length - 2; i > -1; --i) {
        if (s[i] === '(') {
          --rightOpenParens;
        }
        if (s[i] === ')') {
          ++rightOpenParens;
        }
        if (rightOpenParens === 0) {
          return i;
        }
      }
      return undefined;
    }
  }
}

function reflow() {
  let isScreenNarrow = enyo.Panels.isScreenNarrow();
  let isFullscreen = this.isFullscreen();

  this.inherited(arguments);

  this.$.backToolbar.setShowing(isScreenNarrow);
  if (!isScreenNarrow && !isFullscreen) {
    this.$.mainPanels.setIndex(0);
  }
  this.$.documentControl.set('fullscreen', isFullscreen);
  this.$.exportButton.set('form', (isScreenNarrow && 'short') || 'long');
}

function rendered() {
  this.inherited(arguments);
  this.$.clippingPickerPopup.show();
}

function create() {
  this.inherited(arguments);

  let cookieModel = new k2e.CookieModel();
  cookieModel.fetch();
  this.set('cookieModel', cookieModel);

  exportPreparationSem = new k2e.util.AsyncSemaphore({ func: this.exportDocuments.bind(this) });
}

})();
