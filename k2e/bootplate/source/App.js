/* global k2e:false */

(function () {

let exportPreparationSem;
let docsExport;

const SIDEBAR_PANEL = 0;
const DOCUMENT_PANEL = 1;

enyo.kind({
  name: 'k2e.App',
  kind: 'FittableRows',
  cookieModel: undefined,
  published: {
    periodicalTitleSet: undefined,
    ignoredTitleSet: undefined,
    documents: undefined,
    currentThemeClass: 'k2e-document-view-dark',
    settingsActive: false,
    currentMainPanel: undefined,
    currentAppToolbar: undefined,
  },
  bindings: [
    { from: '.$.appToolbar.searchFilter', to: '.$.documentSelectorList.filter' },
    { from: '.$.settings.slidedToMin', to: '.$.appToolbar.settingsButtonActive',
      transform: (slidedToMin) => !slidedToMin },
    { from: '.cookieModel', to: '.$.settings.cookieModel' },
    { from: '.$.mainPanels.index', to: '.currentMainPanel' },
    { from: '.$.appToolbar.index', to: '.currentAppToolbar' },
    { from: '.$.appToolbarSlideable.value', to: '.appToolbarSlidePercentage' },
  ],
  observers: [
    { method: 'appToolbarSearchFilterChanged', path: ['$.appToolbar.searchFilter'] },
  ],
  handlers: {
    onDocumentSelected: 'handleDocumentSelected',
    onDocumentMultiSelected: 'handleDocumentMultiSelected',
    onDocumentScrolled: 'handleDocumentScrolled',
    onSettingsToggled: 'handleSettingsToggled',
    onClippingsTextChanged: 'handleClippingsTextChanged',
    onThemeChanged: 'handleThemeChanged',
    onFontSizeChanged: 'handleFontSizeChanged',
    onFontChanged: 'handleFontChanged',
    onTextMarginChanged: 'handleTextMarginChanged',
    onFullscreenRequest: 'toggleFullscreen',
    onClippingsCleared: 'handleClippingsCleared',
  },
  components: [
    { kind: 'enyo.Signals', onkeydown: 'handleKeydown' },
    { name: 'clippingPickerPopup', kind: 'k2e.ClippingPickerPopup' },
    { name: 'exportPopup', kind: 'k2e.ProgressPopup' },
    { kind: 'Slideable', min: -100, max: 0, value: 0,
      unit: '%', axis: 'v', draggable: false, name: 'appToolbarSlideable', components: [
        { name: 'appToolbar', kind: 'k2e.AppToolbar',
          onExportRequested: 'prepareDocumentsAndExport',
          onReloadClippingRequested: 'reloadClippings',
          onMultiSelectionToggled: 'handleMultiSelectionToggled' },
      ] },
    { name: 'settings', kind: 'k2e.settings.SettingsSlideable' },
    { kind: 'FittableColumns', fit: true, components: [
      { name: 'mainPanels', kind: 'Panels', fit: true, arrangerKind: 'CollapsingArranger',
        realtimeFit: true, wrap: false, components: [
          { name: 'sidebar', classes: 'k2e-sidebar', layoutKind: 'FittableRowsLayout', components: [
            { name: 'documentSelectorList', classes: 'full-height',
              kind: 'k2e.annotations.DocumentSelectorList' },
          ] },
          { kind: 'FittableRows', classes: 'k2e-main-panel', fit: true, components: [
            { name: 'documentControl', kind: 'k2e.annotations.DocumentControl',
              classes: 'full-height' },
          ] },
        ] },
    ] },
  ],

  appToolbarSearchFilterChanged,
  appToolbarSlidePercentageChanged,
  handleMultiSelectionToggled,
  toggleFullscreen,
  exportDocuments,
  processExportResponse,
  processExportError,
  evernoteAuthPopup,
  prepareDocumentsAndExport,
  setSuggestedDataToClipping,
  processQueryError,
  handleDocumentSelected,
  handleDocumentMultiSelected,
  handleDocumentScrolled,
  handleExportBegin,
  handleExportEnd,
  handleQueryBegin,
  handleQueryEnd,
  handleClippingsTextChanged,
  handleKeydown,
  handleSettingsToggled,
  handleThemeChanged,
  handleFontSizeChanged,
  handleFontChanged,
  handleTextMarginChanged,
  handleClippingsCleared,
  parseKindleClippings,
  reloadClippings,
  loadClippings,
  settingsActiveChanged,
  currentMainPanelChanged,
  currentAppToolbarChanged,
  reflow,
  rendered,
  create,
});

/////////////////////////////////////////////////////////////

function appToolbarSearchFilterChanged(/*previous, current, property*/) {
  this.$.documentSelectorList.scrollToTop();
}

function appToolbarSlidePercentageChanged(oldValue, newValue) {
  if (!this.$.fittableColumns) {
    return;
  }

  const appToolbarHeight = this.$.appToolbar.hasNode().scrollHeight;
  const currentFittableColumnsHeight = this.$.fittableColumns.hasNode().scrollHeight;
  const pixelsFromPercentage = (percentage) => Math.round((percentage / 100) * appToolbarHeight);

  const oldPixels = pixelsFromPercentage(oldValue);
  const newPixels = pixelsFromPercentage(newValue);
  const offset = newPixels - oldPixels;


  enyo.requestAnimationFrame(() => {
    this.$.fittableColumns.applyStyle('margin-top', `${newPixels}px`);
    this.$.fittableColumns.applyStyle('height', `${currentFittableColumnsHeight - offset}px`);
  });
}

function arrayToSet(array) {
  const set = {};

  array.forEach((elem) => {
    set[elem] = true;
  });

  return set;
}

function handleMultiSelectionToggled(inSender, inEvent) {
  const active = inEvent.multiSelect;
  this.$.documentSelectorList.set('multiSelected', active);
}

function settingsActiveChanged(/*old, active*/) {
  this.$.settings.toggle();
}

function toggleFullscreen() {
  const isFullscreen = this.isFullscreen();

  this.$.documentControl.set('fullscreen', !isFullscreen);

  return isFullscreen ?
      this.cancelFullscreen() :
      this.requestFullscreen();
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
  const isScreenNarrow = enyo.Panels.isScreenNarrow();
  if (isScreenNarrow) {
    this.$.mainPanels.set('index', DOCUMENT_PANEL);
  }
  if (inEvent.reSelected) {
    return;
  }

  const docSelector = inEvent.originator;
  const doc = this.documents.getDocumentByKey(docSelector.getKey());
  this.log(docSelector.get('key'));
  this.log(docSelector.get('index'));
  this.log(doc);
  this.$.documentControl.set('document', doc);
  this.$.appToolbar.set('selectedDocumentTitle', doc.title);
  this.$.appToolbarSlideable.animateToMax();
}

function handleDocumentMultiSelected(/*inSender, inEvent*/) {
  if (!this.$.documentSelectorList.getMultiSelected()) {
    this.warn('Document multiselected when multiple selection mode inactive');
    return;
  }

  const selectionKeys = this.$.documentSelectorList.getMultiSelectionKeys();
  this.$.appToolbar.set('canExport', Object.keys(selectionKeys).length !== 0);
  this.$.appToolbar.set('selectedCount', Object.keys(selectionKeys).length);
}

function handleDocumentScrolled(inSender, inEvent) {
  const [TO_TOP, TO_BOTTOM, NEUTRAL] = [-1, 1, 0];
  const verticalDirection = inEvent.scrollBounds.yDir;
  const appToolbarHeight = this.$.appToolbar.hasNode().scrollHeight;
  const top = inEvent.scrollBounds.top;

  if (
    verticalDirection === NEUTRAL ||
    this.$.appToolbar.currentState !== k2e.AppToolbar.SELECTED_DOCUMENT_TOOLBAR
  ) {
    return;
  }

  if (verticalDirection === TO_TOP && this.$.appToolbarSlideable.isAtMin()) {
    this.$.appToolbarSlideable.animateToMax();
  }
  else if (
    verticalDirection === TO_BOTTOM &&
    this.$.appToolbarSlideable.isAtMax() &&
    top > appToolbarHeight
  ) {
    this.$.appToolbarSlideable.animateToMin();
  }


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

  const isScreenNarrow = enyo.Panels.isScreenNarrow();
  const settings = k2e.settings.SettingsStorage;
  settings.setSetting('clippingsText', clippingsText);
  this.$.documentSelectorList.set('documentsRef', this.documents);
  if (this.$.mainPanels.index === SIDEBAR_PANEL && !isScreenNarrow) {
    this.$.documentSelectorList.selectNextDocument();
  }
}

function handleKeydown(inSender, inEvent) {
  const modKeyPressed = inEvent.altKey ||
    inEvent.ctrlKey ||
    inEvent.shiftKey ||
    inEvent.altGraphKey ||
    inEvent.metaKey;

  // values taken from jquery.hotkeys
  // https://github.com/jeresig/jquery.hotkeys/blob/1ec07a6a1900104ba56d049551acaaa83e8417d6/jquery.hotkeys.js#L149
  // excludes: button, checkbox, file, hidden, image, password, radio, reset, search, submit, url
  const textAcceptingInputTypes = [
    'text', 'password', 'number', 'email', 'url', 'range',
    'date', 'month', 'week', 'time', 'datetime',
    'datetime-local', 'search', 'color', 'tel',
  ];

  // default input types not to bind to unless bound directly
  const textInputTypes = /textarea|input|select/i;

  if (
    modKeyPressed ||
    (textInputTypes.test(inEvent.target.nodeName) &&
      inEvent.keyCode !== 27 /* esc */) ||
    (textAcceptingInputTypes.find((type) => inEvent.target.type === type) &&
      inEvent.keyCode !== 27 /* esc */)
  ) {
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
  else if (inEvent.keyCode === 83) { // 's'
    window.setTimeout(() => this.$.appToolbar.tryPushState(k2e.AppToolbar.SEARCH_TOOLBAR));
  }
  else if (inEvent.keyCode === 27) { // esc
    // this.$.mainPanels.set('index', SIDEBAR_PANEL);
    this.$.appToolbar.popState();
  }
  return true;
}

function handleSettingsToggled(/*inSender, inEvent*/) {
  this.$.settings.toggle();
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
    const timestamp = /^Added on (.*)$/.exec(subtitle[subtitle.length - 1])[1];
    const content =
      k2e.util.Linkify.toHtml(enyo.dom.escape(res[3]), { targetBlank: true });
    const contentComponents =
      k2e.util.Linkify.toComponents(res[3], { targetBlank: true });
    const contentText = res[3];

    // Skip kindle bookmarks and clippings (not to be confused with the Clipping class)
    if (type !== 'Bookmark' && type !== 'Clipping') {
      docs.addClippingToDocument(
        title,
        author,
        new k2e.annotations.Clipping({
          type,
          loc,
          timestamp,
          content,
          contentText,
          contentComponents,
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
    this.set('settingsActive', false);
  }

  this.$.clippingPickerPopup.show({ autoDismiss: false });
}

function currentMainPanelChanged(old, newIndex) {
  if (newIndex === DOCUMENT_PANEL) {
    this.$.appToolbar.tryPushSelectedDocumentToolbar();
  }
  else if (
    newIndex === SIDEBAR_PANEL &&
    this.$.appToolbar.currentState === k2e.AppToolbar.SELECTED_DOCUMENT_TOOLBAR
  ) {
    this.$.appToolbar.popState();
  }
}

function currentAppToolbarChanged(oldToolbar) {
  if (oldToolbar === k2e.AppToolbar.SELECTED_DOCUMENT_TOOLBAR) {
    this.$.mainPanels.set('index', SIDEBAR_PANEL);
    this.$.appToolbarSlideable.animateToMax();
  }
}

function reflow() {
  const isScreenNarrow = enyo.Panels.isScreenNarrow();
  const isFullscreen = this.isFullscreen();

  this.inherited(arguments);

  if (this.$.mainPanels.index === DOCUMENT_PANEL && isScreenNarrow) {
    this.$.appToolbar.tryPushSelectedDocumentToolbar();
  }
  else if (this.$.appToolbar.currentState === k2e.AppToolbar.SELECTED_DOCUMENT_TOOLBAR) {
    this.$.appToolbar.popState();
  }
  this.$.documentControl.set('fullscreen', isFullscreen);
  this.$.appToolbar.set('form', (isScreenNarrow && 'short') || 'long');
}

function rendered() {
  this.inherited(arguments);
  if (!this.documents) {
    this.$.clippingPickerPopup.show({ autoDismiss: false });
  }
  this.reflow();
  this.$.sidebar.resize();
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
