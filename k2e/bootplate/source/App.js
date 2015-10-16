/*global AsyncSemaphore, SettingsSingleton, linkify, Clipping, Documents, Element, CookieModel, Constants */

enyo.kind(
    (function () {
        // Private data
        var exportPreparationSem,
            docsExport,
            arrayToSet = function (array) {
                var set = {},
                    i;
                for (i = 0; i < array.length; i += 1) {
                    set[array[i]] = true;
                }

                return set;
            },
            getThemeClassFromName = function (themeName) {
                var classNameMap = {
                    "Dark": "k2e-document-view-dark",
                    "Light": "k2e-document-view-light",
                    "OMG ponies": "k2e-document-view-omg-ponies"
                };

                return classNameMap[themeName];
            };


        // enyo kind definition
        return {
            name: "k2e.App",

            kind: "FittableRows",

            components: [
                {kind: "enyo.Signals", onkeydown: "handleKeydown", onFullscreenChange: "toggleDistractionFreeMode"},
                {name: "clipping_picker_popup", kind: "ClippingPickerPopup"},
                {name: "export_popup", kind: "ProgressPopup" },
                {name: "app_toolbar", kind: "onyx.Toolbar", layoutKind: "FittableColumnsLayout", components: [
                    {name: "settings_button", kind: "onyx.Button", ontap: "toggleSettings", components: [
                        {tag: "i", classes: "icon-menu icon-large"},
                        {name: "settings_button_label", tag: "span", content: "Settings" }
                    ]},
                    {content: "k2e", fit: true, style: "text-align: center;"},
                    {
                        name: "export_button",
                        kind: "onyx.Button",
                        classes: "k2e-export-button",
                        ontap: "prepareDocumentsAndExport",
                        components: [
                            {tag: "i", classes: "icon-share icon-large"},
                            {name: "export_button_label", tag: "span", content: "Export to Evernote" }
                        ]
                    },
                    {
                        name: "export_selected_button",
                        kind: "onyx.Button",
                        classes: "k2e-export-button",
                        showing: false,
                        disabled: true,
                        ontap: "prepareDocumentsAndExport",
                        components: [
                            {tag: "i", classes: "icon-share icon-large"},
                            {name: "export_selected_button_label", tag: "span", content: "Export Selected to Evernote" }
                        ]
                    }
                ]},
                {name: "settings", kind: "SettingsSlideable"},
                {kind: "FittableColumns", fit: true, components: [
                    {name: "main_panels", kind: "Panels", fit: true, arrangerKind: "CollapsingArranger", realtimeFit: true, wrap: false, components: [
                        {name: "sidebar", classes: "k2e-sidebar", layoutKind: "FittableRowsLayout", components: [
                            {fit: true, name: "document_selector_list", kind: "DocumentSelectorList"},
                            {name: "sidebar_toolbar", kind: "onyx.Toolbar", layoutKind: "FittableColumnsLayout", components: [
                                {name: "multi_select_button", kind: "onyx.Button", ontap: "toggleMultiSelection", components: [
                                    {tag: "i", classes: "icon-check icon-large"},
                                    {name: "multi_select_button_label", tag: "span", style: "padding-left: 5px;", content: " Select Documents" }
                                ]}
                            ]}
                        ]},
                        {kind: "FittableRows", classes: "k2e-main-panel", fit: true, components: [
                            {
                                name: "document_scroller",
                                kind: "DocumentScroller",
                                components: [
                                    {name: "document_view", kind: "DocumentView"},
                                    {
                                        name: "toggle_fullscreen_button",
                                        classes: "k2e-toggle-fullscreen-button",
                                        showing: false,
                                        ontap: "toggleFullscreen",
                                        kind: "onyx.Button",
                                        components: [
                                            {tag: "i", classes: "icon-resize-small icon-large"}
                                        ]
                                    },
                                ]
                            },
                            {
                                name: "to_top_button",
                                classes: "k2e-to-top-button",
                                kind: "ToTopAnimatedButton",
                                ontap: "scrollDocumentToTop",
                                components: [
                                    {tag: "i", classes: "icon-chevron-up icon-large"}
                                ]
                            },
                            {name: "back_toolbar", kind: "onyx.Toolbar", showing: false, components: [
                                {kind: "onyx.Button", content: "Back", ontap: "showDocumentSelectorList"}
                            ]}
                        ]}
                    ]}
                ]}
            ],

            published: {
                periodicalTitleSet: undefined,
                ignoredTitleSet: undefined,
                documents: undefined,
                currentThemeClass: "k2e-document-view-dark"
            },

            handlers: {
                onDocumentSelected: "handleDocumentSelected",
                onDocumentMultiSelected: "handleDocumentMultiSelected",
                onClippingsTextChanged: "handleClippingsTextChanged",
                onDocumentScrolled: "handleDocumentScrolled",
                onThemeChanged: "handleThemeChanged",
                onFontSizeChanged: "handleFontSizeChanged",
                onTextMarginChanged: "handleTextMarginChanged",
                onFullscreenRequest: "toggleFullscreen"
            },

            bindings: [
                { from: "cookieModel", to: "$.settings.cookieModel" }
            ],

            cookieModel: undefined,

            setTheme: function (themeName) {
                this.setCurrentThemeClass(getThemeClassFromName(themeName));
            },

            setCurrentThemeClass: function (themeClass) {
                var oldThemeClass = this.currentThemeClass;
                // hack to rectify onThemeChanged getting fired on init
                if (this.$.document_scroller) {
                    this.currentThemeClass = themeClass;
                    this.$.document_scroller.removeClass(oldThemeClass);
                    this.$.document_scroller.addClass(this.currentThemeClass);
                }
            },

            toggleDistractionFreeMode: function () {
                if (this.$.settings.isAtMax()) {
                    // this.$.settings.animateToMin();
                    this.toggleSettings();
                }
                this.$.app_toolbar.setShowing(!this.$.app_toolbar.showing);
                this.$.sidebar.setShowing(!this.$.sidebar.showing);

                this.$.main_panels.reflow();
                this.reflow();
            },

            toggleFullscreen: function () {
                var isFullscreen = this.isFullscreen();

                this.$.toggle_fullscreen_button.setShowing(!isFullscreen);

                return isFullscreen ?
                    this.cancelFullscreen() :
                    this.requestFullscreen();
            },

            showDocumentSelectorList: function () {
                this.$.main_panels.setIndex(0);
            },

            exportDocuments: function (inSender, inEvent) {
                this.log("Export processing done");
                var loc = location.protocol + '//' + location.host + Constants.EXPORT_PATH,
                    ajax = new enyo.Ajax({
                        url: loc,
                        contentType: "application/json",
                        method: "POST",
                        // postBody: '{"q":' + JSON.stringify(docsExport, null, 0) + '}'
                        postBody: {q: docsExport}
                    });

                console.log(loc);
                console.log(docsExport);

                // // comment out to enable exporting
                // var self = this;
                // window.setTimeout(function () { self.$.export_popup.done("Export done!"); }, 2000 /* ms */);
                // window.setTimeout(function () { self.$.export_popup.hide(); }, 4000 /* ms */);
                // return;
                ajax.go();

                ajax.response(this, "processExportResponse");
                ajax.error(this, "processExportError");
            },

            processExportResponse: function (inSender, inResponse) {
                var self = this;
                this.$.export_popup.done("Export done!");
                // window.setTimeout(function () { self.$.export_popup.hide(); }, POPUP_TIMEOUT_MS);
            },

            processExportError: function (inSender, inResponse) {
                var self = this;
                var response = JSON.parse(inSender.xhrResponse.body);
                response = response ? response.d : { errors: []};
                if (inResponse === 401) {
                    var cookieModel = self.$.settings.get("cookieModel");
                    cookieModel.fetch();
                    cookieModel.set(Constants.ACCESS_TOKEN_COOKIE_NAME, undefined);
                    cookieModel.set(Constants.CONSUMER_PUBLIC_KEY_COOKIE_NAME, undefined);
                    cookieModel.commit();
                    this.$.export_popup.failed("Export failed", "Try exporting again");
                }
                else {
                    this.$.export_popup.failed("Export failed", response.errors.map(function (error) {
                        return error.message;
                    }));
                }
            },

            evernoteAuthPopup: function (cb, err) {
                var popup = window.open(Constants.AUTH_PATH, Constants.AUTH_WINDOW_NAME, Constants.AUTH_WINDOW_FEATURES);

                var pollTimer = window.setInterval(function() {
                    try {
                        if (popup.closed) {
                            window.clearInterval(pollTimer);
                            (err || function(){})();
                        }
                        else if (popup.document.URL.indexOf(Constants.AUTH_DONE_QUERY_PARAM) !== -1) {
                            window.clearInterval(pollTimer);
                            popup.close();
                            if (document.cookie.indexOf(Constants.ACCESS_TOKEN_COOKIE_NAME) !== -1 &&
                                document.cookie.indexOf(Constants.CONSUMER_PUBLIC_KEY_COOKIE_NAME) !== -1
                            ) {
                                (cb || function(){})();
                            }
                            else {
                                (err || function(){})();
                            }
                        }
                    }
                    catch (ex) {}
                }, 100); // ms
            },

            prepareDocumentsAndExport: function (/*inSender, inEvent*/) {
                this.$.export_popup.begin("Exporting clippings...");

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

                function doExport(app) {
                    app.handleExportBegin();

                    var settings = new SettingsSingleton(),
                        ignoredTitleSet = {},
                        ignoredTitleList = settings.getSetting("ignoredTitleList"),
                        docExportArray,
                        periodicalTitleSet = {},
                        periodicalTitleList;

                    if (ignoredTitleList.length > 0) {
                        ignoredTitleSet = arrayToSet(ignoredTitleList.split(","));
                    }

                    if (app.$.document_selector_list.getMultiSelected()) {
                        docsExport = app.documents.exportObject({selectedKeySet: app.$.document_selector_list.getMultiSelectionKeys()});
                    } else {
                        docsExport = app.documents.exportObject({ignoredTitleSet: ignoredTitleSet});
                    }
                    docExportArray = docsExport.documents;

                    periodicalTitleList = settings.getSetting("periodicalTitleList");
                    if (periodicalTitleList.length > 0) {
                        periodicalTitleSet = arrayToSet(periodicalTitleList.split(","));
                    }

                    (function () {
                        var dEx,
                            cEx,
                            j,
                            i;

                        for (i = 0; i < docExportArray.length; i += 1) {
                            dEx = docExportArray[i];
                            if (settings.getSetting("articleExtraction") === true) {
                                app.log("Tagging documents as periodicals");
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
                    app.$.export_popup.failed("Authentication failed");
                }
            },

            setSuggestedDataToClipping: function (clippingExport, makeQuotedFlag, retryFlag) {
                var self = this,
                    settings = new SettingsSingleton(),
                    quoted = (makeQuotedFlag === undefined) ? true : makeQuotedFlag,
                    retry = (retryFlag === undefined) ? true : retryFlag,
                    loc = settings.getSetting("googleSearchApiLoc"),
                    key = settings.getSetting("googleSearchApiKey"),
                    cx = settings.getSetting("googleSearchApiCx"),
                    MAX_QUERY_LENGTH = 128,
                    s = "",
                    q = "",
                    index,
                    ajax,
                    processQueryResponse;

                if (clippingExport.content.length > MAX_QUERY_LENGTH) {
                    s = clippingExport.content.substring(0, MAX_QUERY_LENGTH);
                } else {
                    s = clippingExport.content;
                }

                index = s.lastIndexOf(" ");
                if (index !== -1) {
                    q = s.substring(0, index);
                } else {
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
                        self.log("Got title: " + inResponse.items[0].title);
                        self.handleQueryEnd();
                    } else {
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
                //         self.log("Got title: " + inResponse.items[0].title);
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

                ajax.error(this, "processQueryError");
            },

            processQueryError: function (inSender, inResponse) {
                this.error("Error in google search request");
                this.handleQueryEnd();
            },

            scrollDocumentToTop: function (inSender, inEvent) {
                this.$.document_scroller.scrollToTop();
            },

            handleDocumentSelected: function (inSender, inEvent) {
                var docSelector,
                    doc;

                if (enyo.Panels.isScreenNarrow()) {
                    this.$.main_panels.setIndex(1);
                }

                docSelector = inEvent.originator;
                this.log(docSelector.getTitle());
                this.log(docSelector.getIndex());
                doc = this.documents.getDocumentByKey(docSelector.getKey());
                this.log(doc);
                //this.$.document_view.setContent(doc.clippings[0].getContent());
                this.$.document_view.displayDocument(doc);
                this.$.document_scroller.setScrollTop(0);
                this.$.document_scroller.setScrollLeft(0);
            },

            handleDocumentMultiSelected: function (inSender, inEvent) {
                if (!this.$.document_selector_list.getMultiSelected()) {
                    this.warn("Document multiselected when multiple selection mode inactive");
                    return;
                }

                var selectionKeys = this.$.document_selector_list.getMultiSelectionKeys();
                this.$.export_selected_button.setDisabled(Object.keys(selectionKeys).length === 0);
            },

            handleDocumentScrolled: function (inSender, inEvent) {
                var bounds = inEvent.bounds,
                    scrollBounds = inEvent.scrollBounds;

                if (scrollBounds.top === 0) {
                    this.$.to_top_button.setShowing(false);
                } else {
                    this.$.to_top_button.setShowing(true);
                }
            },

            handleExportBegin: function (inSender, inEvent) {
                this.log("handleExportBegin");
                exportPreparationSem.v();
            },

            handleExportEnd: function (inSender, inEvent) {
                this.log("handleExportEnd");
                exportPreparationSem.p();
            },

            handleQueryBegin: function (inSender, inEvent) {
                this.log("handleQueryBegin");
                exportPreparationSem.v();
            },

            handleQueryEnd: function (inSender, inEvent) {
                this.log("handleQueryEnd");
                exportPreparationSem.p();
            },

            handleClippingsTextChanged: function (inSender, inEvent) {
                var clipText = this.$.clipping_picker_popup.getClippingsText();
                try {
                    this.documents = this.parseKindleClippings(clipText);
                    this.$.document_selector_list.populate(this.documents);
                    this.$.clipping_picker_popup.hide();
                    this.$.document_selector_list.selectNextDocument();
                }
                catch (e) {
                    this.$.clipping_picker_popup.showErrorMessage();
                    this.warn(e.message, e);
                }
            },

            handleKeydown: function (inSender, inEvent) {
                var modKeyPressed = inEvent.altKey ||
                    inEvent.ctrlKey ||
                    inEvent.shiftKey ||
                    inEvent.altGraphKey ||
                    inEvent.metaKey;

                if (!modKeyPressed && inEvent.keyCode === 70) { // 'f'
                    this.toggleFullscreen();
                } else if (!modKeyPressed && inEvent.keyCode === 74) { // 'j'
                    this.$.document_selector_list.selectNextDocument();
                } else if (!modKeyPressed && inEvent.keyCode === 75) { // 'k'
                    this.$.document_selector_list.selectPrevDocument();
                }
                return true;
            },

            toggleSettings: function (inSender, inEvent) {
                var settingsButton = this.$.settings_button;
                settingsButton.addRemoveClass("active", !settingsButton.hasClass("active"));
                this.$.settings.toggle();
            },

            toggleMultiSelection: function (inSender, inEvent) {
                var multiSelectButton = this.$.multi_select_button;
                multiSelectButton.addRemoveClass("active", !multiSelectButton.hasClass("active"));
                this.$.document_selector_list.toggleMultiSelection();
                this.$.export_button.setShowing(!this.$.export_button.getShowing());
                this.$.export_selected_button.setShowing(!this.$.export_selected_button.getShowing());

                this.$.app_toolbar.reflow();
            },

            handleThemeChanged: function (inSender, inEvent) {
                var settings = new SettingsSingleton();

                this.log(inEvent);
                this.setTheme(settings.getSetting("themeName"));
            },

            handleFontSizeChanged: function (inSender, inEvent) {
                var settings = new SettingsSingleton();

                this.log(inEvent);
                // if (inEvent.sizePercent) {
                //     this.$.document_scroller.applyStyle("font-size", inEvent.sizePercent + "%");
                // }
                if (this.$.document_scroller) {
                    this.$.document_scroller.applyStyle("font-size", settings.getSetting("fontSize") + "%");
                }
            },

            handleTextMarginChanged: function (inSender, inEvent) {
                var settings = new SettingsSingleton(),
                    padding = settings.getSetting("textMargin") + "%";
                if (this.$.document_view) {
                    this.$.document_view.applyStyle("padding-left", padding);
                    this.$.document_view.applyStyle("padding-right", padding);
                }
            },

            parseKindleClippings: function (kindleClippings) {
                var docs = new Documents(),
                    delimeterRegExp = /\r?\n==========\r?\n/;

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

                    if (clipping === "") {
                        return;
                    }
                    if (!clippingRegExp.test(clipping)) {
                        throw {
                            code: 1,
                            message: "Invalid clipping format in clippings file"
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
                    if (type !== "Bookmark" && type !== "Clipping") {
                        docs.addClippingToDocument(
                            title,
                            author,
                            new Clipping({type: type, loc: loc, timeStamp: timeStamp,
                                    content: content})
                        );
                    }
                }

                function splitTitleAndAuthor(s) {
                    var author = "";
                    var title = "";
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

                this.$.settings_button_label.setShowing(!isScreenNarrow);
                this.$.back_toolbar.setShowing(isScreenNarrow);
                if (!isScreenNarrow && !isFullscreen) {
                    this.$.main_panels.setIndex(0);
                }
                this.$.toggle_fullscreen_button.setShowing(isFullscreen);
            },

            // This is probably needed because of the hackery going on in SettingsPanel.js
            rendered: function () {
                var self = this;
                this.inherited(arguments);
                this.$.clipping_picker_popup.show();
            },

            create: function () {
                var self = this;
                self.inherited(arguments);

                self.handleThemeChanged();
                self.handleFontSizeChanged();
                self.handleTextMarginChanged();

                var cookieModel = new CookieModel();
                cookieModel.fetch();
                self.set("cookieModel", cookieModel);

                exportPreparationSem = new AsyncSemaphore({func: function () { self.exportDocuments(); } });

                // FIXME: Get data by dnd or file chooser
                // if (!window.XMLHttpRequest)
                //     return;

                // var req = new XMLHttpRequest();
                // req.open("GET", "assets/clippings.txt");
                // req.send(null);

                // req.onreadystatechange = function () {
                //     this.documents = parseKindleClippings(req.responseText);
                //     self.$.document_selector_list.populate(testDocs);
                // };
            }
        }; // enyo kind definition
    }()) // (function () {
); // enyo.kind(