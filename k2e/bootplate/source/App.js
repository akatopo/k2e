/*global AsyncSemaphore, SettingsSingleton, linkify, Clipping, Documents, Element, CookieModel, Constants */

(function () {

var exportPreparationSem;
var docsExport;
var arrayToSet = function (array) {
  var set = {};
  var i;
  for (i = 0; i < array.length; i += 1) {
    set[array[i]] = true;
  }

  return set;
};
var getThemeClassFromName = function (themeName) {
  var classNameMap = {
    'Dark': 'k2e-document-view-dark',
    'Light': 'k2e-document-view-light',
    'OMG ponies': 'k2e-document-view-omg-ponies'
  };

  return classNameMap[themeName];
};

enyo.kind({
  name: 'k2e.App',

  kind: 'FittableRows',

  components: [
    {kind: 'enyo.Signals', onkeydown: 'handleKeydown', onFullscreenChange: 'toggleDistractionFreeMode'},
    {name: 'clippingPickerPopup', kind: 'ClippingPickerPopup'},
    {name: 'exportPopup', kind: 'ProgressPopup' },
    {name: 'appToolbar', kind: 'onyx.Toolbar', layoutKind: 'FittableColumnsLayout', components: [
      {name: 'settingsButton', kind: 'onyx.Button', classes: 'k2e-icon-button', ontap: 'toggleSettings', components: [
        {tag: 'i', classes: 'icon-menu icon-large'}
      ]},
      {content: 'k2e', fit: true},
      {name: 'exportButton', kind: 'ExportButton', ontap: 'prepareDocumentsAndExport'}
    ]},
    {name: 'settings', kind: 'SettingsSlideable'},
    {kind: 'FittableColumns', fit: true, components: [
      {name: 'mainPanels', kind: 'Panels', fit: true, arrangerKind: 'CollapsingArranger', realtimeFit: true, wrap: false, components: [
        {name: 'sidebar', classes: 'k2e-sidebar', layoutKind: 'FittableRowsLayout', components: [
          {name: 'documentSelectorList', fit: true, kind: 'DocumentSelectorList'},
          {name: 'sidebarToolbar', kind: 'onyx.Toolbar', layoutKind: 'FittableColumnsLayout', components: [
            {name: 'multiSelectButton', kind: 'onyx.Button', classes: 'k2e-icon-button', ontap: 'toggleMultiSelection', components: [
              {tag: 'i', classes: 'icon-check icon-large'}
            ]}
          ]}
        ]},
        {kind: 'FittableRows', classes: 'k2e-main-panel', fit: true, components: [
          {name: 'documentScroller', kind: 'DocumentScroller', components: [
            {name: 'documentView', kind: 'DocumentView'},
            {name: 'toggleFullscreenButton', classes: 'k2e-toggle-fullscreen-button k2e-icon-button k2e-hidden',
              ontap: 'toggleFullscreen', kind: 'onyx.Button', components: [
                {tag: 'i', classes: 'icon-resize-small icon-large'}
            ]},
            {name: 'toTopButton', kind: 'onyx.Button', classes: 'k2e-to-top-button k2e-icon-button k2e-hidden',
              ontap: 'scrollDocumentToTop', components: [
                {tag: 'i', classes: 'icon-chevron-up icon-large'}
            ]}
          ]},
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

  handlers: {
    onDocumentSelected: 'handleDocumentSelected',
    onDocumentMultiSelected: 'handleDocumentMultiSelected',
    onClippingsTextChanged: 'handleClippingsTextChanged',
    onDocumentScrolled: 'handleDocumentScrolled',
    onThemeChanged: 'handleThemeChanged',
    onFontSizeChanged: 'handleFontSizeChanged',
    onTextMarginChanged: 'handleTextMarginChanged',
    onFullscreenRequest: 'toggleFullscreen'
  },

  bindings: [
    { from: '.cookieModel', to: '.$.settings.cookieModel' }
  ],

  cookieModel: undefined,

  setTheme: function (themeName) {
    this.setCurrentThemeClass(getThemeClassFromName(themeName));
  },

  setCurrentThemeClass: function (themeClass) {
    var oldThemeClass = this.currentThemeClass;
    // hack to rectify onThemeChanged getting fired on init
    if (this.$.documentScroller) {
      this.currentThemeClass = themeClass;
      this.$.documentScroller.removeClass(oldThemeClass);
      this.$.documentScroller.addClass(this.currentThemeClass);
    }
  },

  toggleDistractionFreeMode: function () {
    if (this.$.settings.isAtMax()) {
      // this.$.settings.animateToMin();
      this.toggleSettings();
    }
    this.$.appToolbar.setShowing(!this.$.appToolbar.showing);
    this.$.sidebar.setShowing(!this.$.sidebar.showing);

    this.$.mainPanels.reflow();
    this.reflow();
  },

  toggleFullscreen: function () {
    var isFullscreen = this.isFullscreen();

    this.$.toggleFullscreenButton.addRemoveClass('visible', !isFullscreen);
    this.$.documentScroller.addRemoveClass('k2e-fullscreen', !isFullscreen);

    return isFullscreen ?
        this.cancelFullscreen() :
        this.requestFullscreen();
  },

  showDocumentSelectorList: function () {
    this.$.mainPanels.setIndex(0);
  },

  exportDocuments: function (inSender, inEvent) {
    this.log('Export processing done');
    var loc = location.protocol + '//' + location.host + Constants.EXPORT_PATH;
    var ajax = new enyo.Ajax({
      url: loc,
      contentType: 'application/json',
      method: 'POST',
      // postBody: '{'q':' + JSON.stringify(docsExport, null, 0) + '}'
      postBody: {q: docsExport}
    });

    console.log(loc);
    console.log(docsExport);

    // // comment out to enable exporting
    // var self = this;
    // window.setTimeout(function () { self.$.exportPopup.done('Export done!'); }, 2000 /* ms */);
    // window.setTimeout(function () { self.$.exportPopup.hide(); }, 4000 /* ms */);
    // return;
    ajax.go();

    ajax.response(this, 'processExportResponse');
    ajax.error(this, 'processExportError');
  },

  processExportResponse: function (inSender, inResponse) {
    this.$.exportPopup.done('Export done!');
  },

  processExportError: function (inSender, inResponse) {
    var self = this;
    var response = JSON.parse(inSender.xhrResponse.body);
    response = response ? response.d : { errors: []};
    if (inResponse === 401) {
      var cookieModel = self.$.settings.get('cookieModel');
      cookieModel.fetch();
      cookieModel.set(Constants.ACCESS_TOKEN_COOKIE_NAME, undefined);
      cookieModel.set(Constants.CONSUMER_PUBLIC_KEY_COOKIE_NAME, undefined);
      cookieModel.commit();
      this.$.exportPopup.failed('Export failed', 'Try exporting again');
    }
    else {
      this.$.exportPopup.failed('Export failed', response.errors.map(function (error) {
        return error.message;
      }));
    }
  },

  evernoteAuthPopup: function (cb, err) {
    var popup = window.open(Constants.AUTH_PATH, Constants.AUTH_WINDOW_NAME, Constants.AUTH_WINDOW_FEATURES);

    var pollTimer = window.setInterval(function () {
      try {
        if (popup.closed) {
          window.clearInterval(pollTimer);
          (err || function () {})();
        }
        else if (popup.document.URL.indexOf(Constants.AUTH_DONE_QUERY_PARAM) !== -1) {
          window.clearInterval(pollTimer);
          popup.close();
          if (document.cookie.indexOf(Constants.ACCESS_TOKEN_COOKIE_NAME) !== -1 &&
              document.cookie.indexOf(Constants.CONSUMER_PUBLIC_KEY_COOKIE_NAME) !== -1
          ) {
            (cb || function () {})();
          }
          else {
            (err || function () {})();
          }
        }
      }
      catch (ex) {}
    }, 100); // ms
  },

  prepareDocumentsAndExport: function (/*inSender, inEvent*/) {
    this.$.exportPopup.begin('Exporting clippings...');

    if (document.cookie.indexOf(Constants.ACCESS_TOKEN_COOKIE_NAME) !== -1 &&
        document.cookie.indexOf(Constants.CONSUMER_PUBLIC_KEY_COOKIE_NAME) !== -1
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

      var settings = new SettingsSingleton();
      var ignoredTitleSet = {};
      var ignoredTitleList = settings.getSetting('ignoredTitleList');
      var docExportArray;
      var periodicalTitleSet = {};
      var periodicalTitleList;

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

      (function () {
        var dEx;
        var cEx;
        var j;
        var i;

        for (i = 0; i < docExportArray.length; i += 1) {
          dEx = docExportArray[i];
          if (settings.getSetting('articleExtraction') === true) {
            app.log('Tagging documents as periodicals');
            if (periodicalTitleSet.hasOwnProperty(dEx.title)) {
              dEx.isPeriodical = true;
              for (j = 0; j < dEx.clippings.length; j += 1) {
                cEx = dEx.clippings[j];
                app.setSuggestedDataToClipping(cEx);
              }
            }
          }
        }
      }());

      app.handleExportEnd();
    }

    function stopExport(app) {
      app.$.exportPopup.failed('Authentication failed');
    }
  },

  setSuggestedDataToClipping: function (clippingExport, makeQuotedFlag, retryFlag) {
    var self = this;
    var settings = new SettingsSingleton();
    var quoted = (makeQuotedFlag === undefined) ? true : makeQuotedFlag;
    var retry = (retryFlag === undefined) ? true : retryFlag;
    var loc = settings.getSetting('googleSearchApiLoc');
    var key = settings.getSetting('googleSearchApiKey');
    var cx = settings.getSetting('googleSearchApiCx');
    var MAX_QUERY_LENGTH = 128;
    var s = '';
    var q = '';
    var index;
    var ajax;
    var processQueryResponse;

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
      key: key,
      cx: cx,
      q: q
    });

    processQueryResponse = function (inSender, inResponse) {
      var cEx = clippingExport;
      if (inResponse.items && inResponse.items.length) {
        cEx.suggestedTitle = inResponse.items[0].title;
        cEx.suggestedUrl = inResponse.items[0].link;
        self.log('Got title: ' + inResponse.items[0].title);
        self.handleQueryEnd();
      }
      else {
        //send one additional query without quotes
        self.handleQueryEnd();
        if (retry) {
          self.setSuggestedDataToClipping(cEx, false, false);
        }
      }
    };
    ajax.response(processQueryResponse);

    // var processQueryErrorTmp = (function (inSender, inResponse) {
    //     inResponse = {  };
    //     var cEx = clippingExport;
    //     if (inResponse.items && inResponse.items.length) {
    //         cEx.suggestedTitle = inResponse.items[0].title;
    //         cEx.suggestedUrl = inResponse.items[0].link;
    //         self.log('Got title: ' + inResponse.items[0].title);
    //         self.handleQueryEnd();
    //     }
    //     else {
    //         //send one additional query without quotes
    //         self.handleQueryEnd();
    //         if (retry) {
    //             self.setSuggestedDataToClipping(cEx, false, false);
    //         }
    //     }
    // });
    // ajax.error(processQueryErrorTmp);

    ajax.error(this, 'processQueryError');
  },

  processQueryError: function (inSender, inResponse) {
    this.error('Error in google search request');
    this.handleQueryEnd();
  },

  scrollDocumentToTop: function (inSender, inEvent) {
    this.$.documentScroller.scrollTo(0, 0);
  },

  handleDocumentSelected: function (inSender, inEvent) {
    var docSelector;
    var doc;

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
    this.$.documentView.displayDocument(doc);
    this.$.documentScroller.setScrollTop(0);
    this.$.documentScroller.setScrollLeft(0);
  },

  handleDocumentMultiSelected: function (inSender, inEvent) {
    if (!this.$.documentSelectorList.getMultiSelected()) {
      this.warn('Document multiselected when multiple selection mode inactive');
      return;
    }

    var selectionKeys = this.$.documentSelectorList.getMultiSelectionKeys();
    this.$.exportButton.setDisabled(Object.keys(selectionKeys).length === 0);
  },

  handleDocumentScrolled: function (inSender, inEvent) {
    var isNotAtTop = inEvent.scrollBounds.top !== 0;

    this.$.toTopButton.addRemoveClass('visible', isNotAtTop);
  },

  handleExportBegin: function (inSender, inEvent) {
    this.log('handleExportBegin');
    exportPreparationSem.v();
  },

  handleExportEnd: function (inSender, inEvent) {
    this.log('handleExportEnd');
    exportPreparationSem.p();
  },

  handleQueryBegin: function (inSender, inEvent) {
    this.log('handleQueryBegin');
    exportPreparationSem.v();
  },

  handleQueryEnd: function (inSender, inEvent) {
    this.log('handleQueryEnd');
    exportPreparationSem.p();
  },

  handleClippingsTextChanged: function (inSender, inEvent) {
    var clipText = this.$.clippingPickerPopup.getClippingsText();
    try {
      this.documents = this.parseKindleClippings(clipText);
      this.$.documentSelectorList.populate(this.documents);
      this.$.clippingPickerPopup.hide();
      this.$.documentSelectorList.selectNextDocument();
    }
    catch (e) {
      this.$.clippingPickerPopup.showErrorMessage();
      this.warn(e.message, e);
    }
  },

  handleKeydown: function (inSender, inEvent) {
    var modKeyPressed = inEvent.altKey ||
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
  },

  toggleSettings: function (inSender, inEvent) {
    var settingsButton = this.$.settingsButton;
    settingsButton.addRemoveClass('active', !settingsButton.hasClass('active'));
    this.$.settings.toggle();
  },

  toggleMultiSelection: function (inSender, inEvent) {
    var exportButton = this.$.exportButton;
    var multiSelectButton = this.$.multiSelectButton;
    this.$.documentSelectorList.toggleMultiSelection();
    exportButton.setDisabled(!exportButton.exportSelected);
    exportButton.set('exportSelected', !exportButton.exportSelected);
    multiSelectButton.addRemoveClass('active', !multiSelectButton.hasClass('active'));
    this.$.appToolbar.reflow();
  },

  handleThemeChanged: function (inSender, inEvent) {
    var settings = new SettingsSingleton();

    this.log(inEvent);
    this.setTheme(settings.getSetting('themeName'));
  },

  handleFontSizeChanged: function (inSender, inEvent) {
    this.log(inEvent);
    if (this.$.documentScroller) {
      this.$.documentScroller.applyStyle('font-size', inEvent.sizePercent + '%');
    }
  },

  handleTextMarginChanged: function (inSender, inEvent) {
    if (this.$.documentView) {
      this.$.documentView.removeClass('k2e-document-view-padding-' + inEvent.previous);
      this.$.documentView.addClass('k2e-document-view-padding-' + inEvent.current);
    }
  },

  parseKindleClippings: function (kindleClippings) {
    var docs = new Documents();
    var delimeterRegExp = /\r?\n==========\r?\n/;

    kindleClippings = kindleClippings.split(delimeterRegExp);
    kindleClippings.forEach(addClippingToDocuments);

    return docs;

    /////////////////////////////////////////////////////////////

    function addClippingToDocuments(clipping) {
      var clippingRegExp = /^(.+)\r?\n- (.+)\r?\n?\r?\n?(.*)$/;
      var res;
      var title;
      var author;
      var titleAndAuthor;
      var subtitle;
      var type;
      var loc;
      var timeStamp;
      var content;
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
      content = linkify(enyo.dom.escape(res[3]), { targetBlank: true });

      // Skip kindle bookmarks and clippings (not to be confused with the Clipping class)
      if (type !== 'Bookmark' && type !== 'Clipping') {
        docs.addClippingToDocument(
          title,
          author,
          new Clipping({type: type, loc: loc, timeStamp: timeStamp,
            content: content})
          );
      }
    }

    function splitTitleAndAuthor(s) {
      var author = '';
      var title = '';
      var splitIndex;

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

        var rightOpenParens = 1;

        for (var i = s.length - 2; i > -1; --i) {
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
  },

  reflow: function () {
    var isScreenNarrow = enyo.Panels.isScreenNarrow();
    var isFullscreen = this.isFullscreen();

    this.inherited(arguments);

    this.$.backToolbar.setShowing(isScreenNarrow);
    if (!isScreenNarrow && !isFullscreen) {
      this.$.mainPanels.setIndex(0);
    }
    this.$.toggleFullscreenButton.addRemoveClass('visible', isFullscreen);
    this.$.exportButton.set('form', (isScreenNarrow && 'short') || 'long');
  },

  // This is probably needed because of the hackery going on in SettingsPanel.js
  rendered: function () {
    var self = this;
    this.inherited(arguments);
    this.$.clippingPickerPopup.show();
  },

  create: function () {
    var self = this;
    self.inherited(arguments);
    var settings = new SettingsSingleton();
    var padding = settings.getSetting('textMargin');
    var sizePercent = settings.getSetting('fontSize');

    self.handleThemeChanged();
    self.handleFontSizeChanged(undefined, { sizePercent:  sizePercent });
    self.handleTextMarginChanged(undefined, { current: padding });

    var cookieModel = new CookieModel();
    cookieModel.fetch();
    self.set('cookieModel', cookieModel);

    exportPreparationSem = new AsyncSemaphore({func: function () { self.exportDocuments(); } });

    // FIXME: Get data by dnd or file chooser
    // if (!window.XMLHttpRequest)
    //     return;

    // var req = new XMLHttpRequest();
    // req.open('GET', 'assets/clippings.txt');
    // req.send(null);

    // req.onreadystatechange = function () {
    //     this.documents = parseKindleClippings(req.responseText);
    //     self.$.documentSelectorList.populate(testDocs);
    // };
  }
}); // enyo.kind(

})();
