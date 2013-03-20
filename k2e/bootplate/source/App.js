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
            };


        // enyo kind definition
        return {
            name: "k2e.App",

            kind: "FittableRows",

            components: [
                {kind: enyo.Signals, onkeydown: "handleKeydown"},
                {name: "clipping_picker_popup", kind: "ClippingPickerPopup"},
                {name: "export_popup", kind: "ExportPopup" },
                {name: "app_toolbar", kind: "onyx.Toolbar", layoutKind: "FittableColumnsLayout", components: [
                    {kind: "onyx.Button", content: "Settings", ontap: "toggleSettings"},
                    {content: "k2e", fit: true, style: "text-align: center;"},
                    {name: "export_button", kind: "onyx.Button", classes: "k2e-export-button", content: "Export to Evernote", ontap: "prepareDocumentsAndExport"}
                ]},
                {name: "settings", kind: "SettingsSlideable"},
                {kind: "FittableColumns", fit: true, components: [
                    {kind: "Panels", fit: true, arrangerKind: "CollapsingArranger", realtimeFit: true, wrap: false, components: [
                        {name: "sidebar", classes: "k2e-sidebar", style: "width: 20%", components: [
                            {fit: true, name: "document_selector_list", kind: "DocumentSelectorList"}
                        ]},
                        {kind: "FittableRows", classes: "k2e-main-panel", fit: true, components: [
                            {name: "document_scroller", kind: "enyo.Scroller", /*style:"position:relative",*/ fit: true, classes: "k2e-document-scroller k2e-document-view-dark", components: [
                                {name: "document_view", kind: "DocumentView", fit: true}//,
                                //{kind: "onyx.Button", content: "to top", style:"position: absolute; bottom: 10px; right: 10px;"}
                            ]},
                            {name: "document_toolbar", kind: "onyx.Toolbar", components: [
                                {kind: "onyx.Grabber"},
                                {content: "clip toolbar"}
                            ]}
                        ]}
                    ]}
                ]}
            ],

            published: {
                periodicalTitleSet: undefined,
                ignoredTitleSet: undefined,
                documents: undefined
            },

            handlers: {
                onDocumentSelected: "handleDocumentSelected",
                onClippingsTextChanged: "handleClippingsTextChanged",
                onFullscreenRequest: "handleFullscreenRequest"
            },

            toggleDistractionFreeMode: function () {
                if (this.$.settings.isAtMax()) {
                    this.$.settings.animateToMin();
                }
                this.$.sidebar.setShowing(!this.$.sidebar.showing);
                this.$.app_toolbar.setShowing(
                    !this.$.app_toolbar.showing
                );
                this.$.document_toolbar.setShowing(
                    !this.$.document_toolbar.showing
                );
                this.resized();
            },

            toggleFullscreen: function () {
                var node = this.hasNode(),
                    isFullscreen = document.webkitIsFullScreen || document.mozFullscreen || document.fullscreen;
                if (node) {
                    if (!isFullscreen) {
                        if (node.webkitRequestFullscreen) {
                            node.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
                        } else if (node.mozRequestFullScreen) {
                            node.mozRequestFullScreen();
                        } else {
                            node.requestFullscreen();
                        }
                    } else {
                        if (document.webkitExitFullscreen) {
                            document.webkitExitFullscreen();
                        } else if (document.mozCancelFullScreen) {
                            document.mozCancelFullScreen();
                        } else {
                            document.exitFullscreen();
                        }
                    }
                }
            },

            exportDocuments: function (inSender, inEvent) {
                this.log("Export processing done");
                var loc = location.protocol + '//' + location.host + location.pathname,
                    ajax = new enyo.Ajax({
                        url: loc + "/Export",
                        contentType: "application/json; charset=utf-8",
                        method: "POST",
                        postBody: '{"q":' + JSON.stringify(docsExport, null, 0) + '}'
                    });

                console.log(loc);
                console.log(docsExport);

                // // comment out to enable exporting
                // var self = this;
                // window.setTimeout(function () { self.$.export_popup.exportDone(); }, 2000 /* ms */);
                // window.setTimeout(function () { self.$.export_popup.hide(); }, 4000 /* ms */);
                // return;
                ajax.go();

                ajax.response(this, "processExportResponse");
                ajax.error(this, "processExportError");
            },

            processExportResponse: function (inSender, inResponse) {
                var self = this;
                alert(JSON.stringify(inResponse, null, 2));
                this.$.export_popup.exportDone();
                window.setTimeout(function () { self.$.export_popup.hide(); }, 2000); // ms
            },

            processExportError: function (inSender, inResponse) {
                this.error("Error in exporting");
            },

            prepareDocumentsAndExport: function () {
                this.$.export_popup.exportBegin();
                this.$.export_popup.show();
                this.handleExportBegin();

                var settings = SettingsSingletonInstance(),
                    ignoredTitleSet = {},
                    ignoredTitleList = settings.getSetting("ignoredTitleList"),
                    docExportArray,
                    periodicalTitleSet = {},
                    periodicalTitleList,
                    self = this;

                if (ignoredTitleList.length > 0) {
                    ignoredTitleSet = arrayToSet(ignoredTitleList.split(","));
                }

                docsExport = this.documents.exportObject(ignoredTitleSet);
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
                            self.log("Tagging documents as periodicals");
                            if (periodicalTitleSet.hasOwnProperty(dEx.title)) {
                                dEx.isPeriodical = true;
                                for (j = 0; j < dEx.clippings.length; j += 1) {
                                    cEx = dEx.clippings[j];
                                    self.setSuggestedDataToClipping(cEx);
                                }
                            }
                        }
                    }
                }());

                this.handleExportEnd();

            },

            setSuggestedDataToClipping: function (clippingExport, makeQuotedFlag, retryFlag) {
                var self = this,
                    settings = SettingsSingletonInstance(),
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

            handleDocumentSelected: function (inSender, inEvent) {
                var docSelector,
                    doc;

                docSelector = inEvent.originator;
                console.log(docSelector.getTitle());
                console.log(docSelector.getIndex());
                doc = this.documents.getDocumentByIndex(docSelector.getIndex());
                console.log(doc);
                //this.$.document_view.setContent(doc.clippings[0].getContent());
                this.$.document_view.displayDocument(doc);
                this.$.document_scroller.scrollToTop();

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
                this.log("handleClippingsTextChanged");
                var clipText = this.$.clipping_picker_popup.getClippingsText();
                this.documents = this.parseKinldeClippings(clipText);
                this.$.document_selector_list.populate(this.documents);
                this.$.clipping_picker_popup.hide();
            },

            handleKeydown: function (inSender, inEvent) {
                this.log(inSender);
                this.log(inEvent);
                if (inEvent.keyCode === 70) {
                    this.toggleFullscreen();
                } /*else if (inEvent.keyCode === 13) {
                    return false;
                }*/
                return true;
            },

            handleFullscreenRequest: function (inSender, inEvent) {
                this.toggleFullscreen();
            },

            toggleSettings: function (inSender, inEvent) {
                this.$.settings.toggle();
            },

            parseKinldeClippings: function (kindleClippings) {
                var docs = new Documents(),
                    clippingRegExp = new RegExp(/^\s*(.+)\s\((.+)\)\s+-\s+(.+)\s+(.*)/),
                    delimeter = "==========";

                kindleClippings = kindleClippings.split("\n" + delimeter);

                //assert(clippingRegExp.test(kindleClippings[73]));
                (function () {
                    var i,
                        res,
                        title,
                        author,
                        subtitle,
                        type,
                        loc,
                        timeStamp,
                        content;

                    for (i = 0; i < kindleClippings.length; i += 1) {
                        if (clippingRegExp.test(kindleClippings[i])) {
                            res = clippingRegExp.exec(kindleClippings[i]);
                            title = res[1];
                            author = res[2];
                            subtitle = res[3].split(/\s+\|\s+/);
                            type = subtitle[0].substring(0, subtitle[0].indexOf(' '));
                            loc = subtitle[0].substring(subtitle[0].indexOf(' ') + 1);
                            timeStamp = subtitle[subtitle.length - 1];
                            content = res[4];

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

                    }
                }());

                return docs;
            },

            reflow: function () {
                this.inherited(arguments);
                if (enyo.Panels.isScreenNarrow()) {
                    this.$.document_view.setContent("isScreenNarrow");
                } else {
                    this.$.document_view.setContent("notScreenNarrow");
                }
            },

            // This is probably needed because of the hackery going on in SettingsPanel.js
            rendered: function () {
                this.inherited(arguments);
                this.$.clipping_picker_popup.show();
            },

            create: function () {
                this.inherited(arguments);
                var self = this;

                exportPreparationSem = new AsyncSemaphore({func: function () { self.exportDocuments(); } });

                document.onwebkitfullscreenchange =
                    document.onmozfullscreenchange =
                    document.onfullscreenchange = function () { self.toggleDistractionFreeMode(); };

                // FIXME: Get data by dnd or file chooser
                // if (!window.XMLHttpRequest)
                //     return;

                // var req = new XMLHttpRequest();
                // req.open("GET", "assets/clippings.txt");
                // req.send(null);

                // req.onreadystatechange = function () {
                //     this.documents = parseKinldeClippings(req.responseText);
                //     self.$.document_selector_list.populate(testDocs);
                // };
            }
        }; // enyo kind definition
    }()) // (function () {
); // enyo.kind(