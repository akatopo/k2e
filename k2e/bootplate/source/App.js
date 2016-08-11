/* global k2e:false */

(function () {

let exportPreparationSem;
let docsExport;

enyo.kind({
  name: 'k2e.App',
  kind: 'FittableRows',
  components: [
    { kind: 'enyo.Signals', onkeydown: 'handleKeydown',
      onFullscreenChange: 'toggleDistractionFreeMode' },
    { name: 'clippingPickerPopup', kind: 'k2e.ClippingPickerPopup' },
    { name: 'exportPopup', kind: 'k2e.ProgressPopup' },
    { name: 'appToolbar', kind: 'onyx.Toolbar', layoutKind: 'FittableColumnsLayout', components: [
      { name: 'settingsButton', kind: 'onyx.Button',
        classes: 'k2e-icon-button', ontap: 'toggleSettings', components: [
          { tag: 'i', classes: 'icon-menu icon-large' },
        ] },
      { content: 'k2e', fit: true },
      { name: 'exportButton', kind: 'k2e.ExportButton', ontap: 'prepareDocumentsAndExport' },
    ] },
    { name: 'settings', kind: 'k2e.settings.SettingsSlideable' },
    { kind: 'FittableColumns', fit: true, components: [
      { name: 'mainPanels', kind: 'Panels', fit: true, arrangerKind: 'CollapsingArranger',
        realtimeFit: true, wrap: false, components: [
          { name: 'sidebar', classes: 'k2e-sidebar', layoutKind: 'FittableRowsLayout', components: [
            { name: 'documentSelectorList', fit: true,
              kind: 'k2e.annotations.DocumentSelectorList' },
            { name: 'sidebarToolbar', kind: 'onyx.Toolbar',
              layoutKind: 'FittableColumnsLayout', components: [
                { name: 'multiSelectButton', kind: 'onyx.Button', classes: 'k2e-icon-button',
                  ontap: 'toggleMultiSelection', components: [
                    { tag: 'i', classes: 'icon-check icon-large' },
                  ] },
                { name: 'reloadClippingsButton', kind: 'onyx.Button', classes: 'k2e-icon-button',
                  ontap: 'reloadClippings', components: [
                    { tag: 'i', classes: 'icon-upload icon-large' },
                  ] },
              ] },
          ] },
          { kind: 'FittableRows', classes: 'k2e-main-panel', fit: true, components: [
            { name: 'documentControl', kind: 'k2e.annotations.DocumentControl', fit: true },
            { name: 'backToolbar', kind: 'onyx.Toolbar', showing: false, components: [
              { kind: 'onyx.Button', classes: 'k2e-icon-button',
                ontap: 'showDocumentSelectorList', components: [
                  { tag: 'i', classes: 'icon-left-big icon-large' },
                ] },
            ] },
          ] },
        ] },
    ] },
  ],
  published: {
    periodicalTitleSet: undefined,
    ignoredTitleSet: undefined,
    documents: undefined,
    currentThemeClass: 'k2e-document-view-dark',
  },
  cookieModel: undefined,
  handlers: {
    onDocumentSelected: 'handleDocumentSelected',
    onDocumentMultiSelected: 'handleDocumentMultiSelected',
    onClippingsTextChanged: 'handleClippingsTextChanged',
    onThemeChanged: 'handleThemeChanged',
    onFontSizeChanged: 'handleFontSizeChanged',
    onFontChanged: 'handleFontChanged',
    onTextMarginChanged: 'handleTextMarginChanged',
    onFullscreenRequest: 'toggleFullscreen',
    onClippingsCleared: 'handleClippingsCleared',
  },
  bindings: [
    { from: '.cookieModel', to: '.$.settings.cookieModel' },
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
  handleFontChanged,
  handleTextMarginChanged,
  handleClippingsCleared,
  parseKindleClippings,
  reloadClippings,
  loadClippings,
  reflow,
  rendered,
  create,
});

/////////////////////////////////////////////////////////////

function arrayToSet(array) {
  const set = {};

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
  const isFullscreen = this.isFullscreen();

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
  const loc = `${location.protocol}//${location.host}${k2e.Constants.EXPORT_PATH}`;
  const ajax = new enyo.Ajax({
    url: loc,
    contentType: 'application/json',
    method: 'POST',
    postBody: { q: docsExport },
  });

  console.log(loc);
  console.log(docsExport);

  ajax.go();

  ajax.response(this, 'processExportResponse');
  ajax.error(this, 'processExportError');
}

function processExportResponse(/*inSender, inResponse*/) {
  this.$.exportPopup.done('Export done!');
}

function processExportError(inSender, inResponse) {
  let response = JSON.parse(inSender.xhrResponse.body);
  response = response ? response.d : { errors: [] };
  if (inResponse === 401) {
    const cookieModel = this.$.settings.get('cookieModel');
    cookieModel.fetch();
    cookieModel.set(k2e.Constants.ACCESS_TOKEN_COOKIE_NAME, undefined);
    cookieModel.set(k2e.Constants.CONSUMER_PUBLIC_KEY_COOKIE_NAME, undefined);
    cookieModel.commit();
    this.$.exportPopup.failed('Export failed', 'Try exporting again');
  }
  else {
    this.$.exportPopup.failed('Export failed', response.errors.map((error) =>
      error.message
    ));
  }
}

function evernoteAuthPopup(cb, err) {
  const popup = window.open(
    k2e.Constants.AUTH_PATH,
    k2e.Constants.AUTH_WINDOW_NAME,
    k2e.Constants.AUTH_WINDOW_FEATURES
  );
  const noop = () => {};
  cb = cb || noop;
  err = err || noop;

  const pollTimer = window.setInterval(() => {
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
    catch (ex) { this.warn(ex); }
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

    const settings = k2e.settings.SettingsStorage;
    let ignoredTitleSet = {};
    const ignoredTitleList = settings.getSetting('ignoredTitleList');
    let periodicalTitleSet = {};

    if (ignoredTitleList.length > 0) {
      ignoredTitleSet = arrayToSet(ignoredTitleList.split(','));
    }

    if (app.$.documentSelectorList.getMultiSelected()) {
      docsExport = app.documents.exportObject({
        selectedKeySet: app.$.documentSelectorList.getMultiSelectionKeys(),
      });
    }
    else {
      docsExport = app.documents.exportObject({ ignoredTitleSet });
    }
    const docExportArray = docsExport.documents;

    const periodicalTitleList = settings.getSetting('periodicalTitleList');
    if (periodicalTitleList.length > 0) {
      periodicalTitleSet = arrayToSet(periodicalTitleList.split(','));
    }

    docExportArray.forEach((documentExportObject) => {
      if (settings.getSetting('articleExtraction') === true) {
        app.log('Tagging documents as periodicals');
        if ({}.hasOwnProperty.call(periodicalTitleSet, documentExportObject.title)) {
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
  const settings = k2e.settings.SettingsStorage;
  const quoted = (makeQuotedFlag === undefined) ? true : makeQuotedFlag;
  const retry = (retryFlag === undefined) ? true : retryFlag;
  const loc = settings.getSetting('googleSearchApiLoc');
  const key = settings.getSetting('googleSearchApiKey');
  const cx = settings.getSetting('googleSearchApiCx');
  const MAX_QUERY_LENGTH = 128;
  let s = '';
  let q = '';

  if (clippingExport.content.length > MAX_QUERY_LENGTH) {
    s = clippingExport.content.substring(0, MAX_QUERY_LENGTH);
  }
  else {
    s = clippingExport.content;
  }

  const index = s.lastIndexOf(' ');
  if (index !== -1) {
    q = s.substring(0, index);
  }
  else {
    q = s;
  }

  q = quoted ? (`"${q}"`) : q;

  const ajax = new enyo.Ajax({
    url: loc,
  });

  this.handleQueryBegin();
  ajax.go({
    key,
    cx,
    q,
  });

  const processQueryResponse = (inSender, inResponse) => {
    const cEx = clippingExport;
    if (inResponse.items && inResponse.items.length) {
      cEx.suggestedTitle = inResponse.items[0].title;
      cEx.suggestedUrl = inResponse.items[0].link;
      this.log(`Got title: ${inResponse.items[0].title}`);
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

function processQueryError(/*inSender, inResponse*/) {
  this.error('Error in google search request');
  this.handleQueryEnd();
}

function handleDocumentSelected(inSender, inEvent) {
  if (enyo.Panels.isScreenNarrow()) {
    this.$.mainPanels.setIndex(1);
  }
  if (inEvent.reSelected) {
    return;
  }

  const docSelector = inEvent.originator;
  const doc = this.documents.getDocumentByKey(docSelector.getKey());
  this.log(docSelector.getTitle());
  this.log(docSelector.getIndex());
  this.log(doc);
  this.$.documentControl.set('document', doc);
}

function handleDocumentMultiSelected(/*inSender, inEvent*/) {
  if (!this.$.documentSelectorList.getMultiSelected()) {
    this.warn('Document multiselected when multiple selection mode inactive');
    return;
  }

  const selectionKeys = this.$.documentSelectorList.getMultiSelectionKeys();
  this.$.exportButton.set('disabled', Object.keys(selectionKeys).length === 0);
}

function handleExportBegin(/*inSender, inEvent*/) {
  this.log('handleExportBegin');
  exportPreparationSem.v();
}

function handleExportEnd(/*inSender, inEvent*/) {
  this.log('handleExportEnd');
  exportPreparationSem.p();
}

function handleQueryBegin(/*inSender, inEvent*/) {
  this.log('handleQueryBegin');
  exportPreparationSem.v();
}

function handleQueryEnd(/*inSender, inEvent*/) {
  this.log('handleQueryEnd');
  exportPreparationSem.p();
}

function handleClippingsTextChanged(inSender, inEvent) {
  const clipText = inEvent.originator.getClippingsText();

  try {
    this.loadClippings(clipText);
    this.$.clippingPickerPopup.hide();
  }
  catch (e) {
    this.$.clippingPickerPopup.showErrorMessage();
    this.warn(e.message, e);
  }
}

function loadClippings(clippingsText) {
  try {
    this.documents = this.parseKindleClippings(clippingsText);
  }
  catch (ex) {
    throw ex;
  }

  const settings = k2e.settings.SettingsStorage;
  settings.setSetting('clippingsText', clippingsText);
  this.$.documentSelectorList.set('documentsRef', this.documents);
  this.$.documentSelectorList.selectNextDocument();
}

function handleKeydown(inSender, inEvent) {
  const modKeyPressed = inEvent.altKey ||
    inEvent.ctrlKey ||
    inEvent.shiftKey ||
    inEvent.altGraphKey ||
    inEvent.metaKey;

  if (modKeyPressed) {
    return undefined;
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

function toggleSettings(/*inSender, inEvent*/) {
  const settingsButton = this.$.settingsButton;
  settingsButton.addRemoveClass('active', !settingsButton.hasClass('active'));
  this.$.settings.toggle();
}

function toggleMultiSelection(/*inSender, inEvent*/) {
  const exportButton = this.$.exportButton;
  const multiSelectButton = this.$.multiSelectButton;
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

function handleFontChanged(inSender, inEvent) {
  if (!this.$.documentControl) {
    return;
  }

  this.$.documentControl.set('font', inEvent.name);
}

function handleTextMarginChanged(inSender, inEvent) {
  if (!this.$.documentControl) {
    return;
  }

  this.$.documentControl.set('margin', +inEvent.current);
}

function parseKindleClippings(kindleClippings) {
  const docs = new k2e.annotations.DocumentCollection();
  const delimeterRegExp = /\r?\n==========\r?\n/;

  kindleClippings = kindleClippings.split(delimeterRegExp);
  kindleClippings.forEach(addClippingToDocumentCollection);

  return docs;

  /////////////////////////////////////////////////////////////

  function addClippingToDocumentCollection(clipping) {
    const clippingRegExp = /^(.+)\r?\n- (.+)\r?\n?\r?\n?(.*)$/;
    clipping = clipping.trim();

    if (clipping === '') {
      return;
    }
    if (!clippingRegExp.test(clipping)) {
      throw {
        code: 1,
        message: 'Invalid clipping format in clippings file',
      };
    }

    const res = clippingRegExp.exec(clipping);
    const titleAndAuthor = splitTitleAndAuthor(res[1]);
    const title = titleAndAuthor[0];
    const author = titleAndAuthor[1];
    const subtitle = res[2].split(/\s+\|\s+/);
    const type = subtitle[0].substring(0, subtitle[0].indexOf(' '));
    const loc = subtitle[0].substring(subtitle[0].indexOf(' ') + 1);
    const timeStamp = /^Added on (.*)$/.exec(subtitle[subtitle.length - 1])[1];
    const content = k2e.util.linkify(enyo.dom.escape(res[3]), { targetBlank: true });
    const contentText = res[3];

    // Skip kindle bookmarks and clippings (not to be confused with the Clipping class)
    if (type !== 'Bookmark' && type !== 'Clipping') {
      docs.addClippingToDocument(
        title,
        author,
        new k2e.annotations.Clipping({
          type,
          loc,
          timeStamp,
          content,
          contentText,
        })
      );
    }
  }

  function splitTitleAndAuthor(s) {
    let author = '';
    let title = '';
    const splitIndex = getAuthorOpenParenIndex(s);

    if (splitIndex !== undefined) {
      title = s.substring(0, splitIndex);
      author = s.substring(splitIndex + 1, s.length - 1);
    }
    else {
      title = s;
    }

    return [
      title.trim() || 'Unknown Title',
      author.trim() || 'Unknown Author',
    ];

    /////////////////////////////////////////////////////////////

    // Best effort function to get an author name by finding the opening parenthesis
    // matching the rightmost closing parenthesis

    function getAuthorOpenParenIndex(_s) {
      if (_s[_s.length - 1] !== ')') {
        return undefined;
      }

      let rightOpenParens = 1;

      for (let i = _s.length - 2; i > -1; --i) {
        if (_s[i] === '(') {
          --rightOpenParens;
        }
        if (_s[i] === ')') {
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

function reloadClippings() {
  this.$.clippingPickerPopup.show({ autoDismiss: !!this.documents });
}

function handleClippingsCleared() {
  if (this.$.settings.isAtMax()) {
    this.toggleSettings();
  }

  this.$.clippingPickerPopup.show({ autoDismiss: false });
}

function reflow() {
  const isScreenNarrow = enyo.Panels.isScreenNarrow();
  const isFullscreen = this.isFullscreen();

  this.inherited(arguments);

  this.$.backToolbar.setShowing(isScreenNarrow && !isFullscreen);
  if (!isScreenNarrow && !isFullscreen) {
    this.$.mainPanels.setIndex(0);
  }
  this.$.documentControl.set('fullscreen', isFullscreen);
  this.$.exportButton.set('form', (isScreenNarrow && 'short') || 'long');
}

function rendered() {
  this.inherited(arguments);
  if (!this.documents) {
    this.$.clippingPickerPopup.show({ autoDismiss: false });
  }
}

function create() {
  this.inherited(arguments);
  const settings = k2e.settings.SettingsStorage;

  const cookieModel = new k2e.CookieModel();
  cookieModel.fetch();
  this.set('cookieModel', cookieModel);

  const sampleClippingsNode = document.querySelector('#sample-clippings');
  let clippingsText = settings.getSetting('clippingsText');
  if (
    !clippingsText &&
    sampleClippingsNode &&
    window.location.search.indexOf('sample-clippings') !== -1
  ) {
    clippingsText = sampleClippingsNode.innerHTML;
  }

  if (clippingsText) {
    this.loadClippings(clippingsText);
  }

  exportPreparationSem = new k2e.util.AsyncSemaphore({ func: this.exportDocuments.bind(this) });
}

})();
