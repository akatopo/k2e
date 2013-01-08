enyo.kind(
(function () {

// Private data

var _arrayToSet = function (array) {
	var set = {};
	for (var i in array) {
		set[array[i]] = true;
	}

	return set;
};

var _exportPreparationSem;
var _docsExport;

// enyo kind definition

return {
	name: "k2e.App",

	kind: "FittableRows",

	components:[
		{kind: enyo.Signals, onkeydown: "handleKeydown"},
		{name: "clipping_picker_popup", kind: "ClippingPickerPopup"},
		{kind: "onyx.Toolbar", layoutKind: "FittableColumnsLayout", components: [
			{kind: "onyx.Button", content: "Settings", ontap: "toggleSettings"},
			{content: "k2e", fit: true, style: "text-align: center;"},
			{kind: "onyx.Button", content: "Export to Evernote", ontap: "prepareDocumentsAndExport"}
		]},
		{kind: "SettingsSlideable", name: "settings"},
		{kind: "FittableColumns", fit: true, components: [
			{kind: "Panels", fit: true, arrangerKind: "CollapsingArranger", realtimeFit: true, wrap: false, components: [
				{classes: "k2e-sidebar", style: "width: 20%", components:[
					{fit: true, name: "document_selector_list", kind: "DocumentSelectorList"}
				]},
				{kind: "FittableRows", classes: "k2e-main-panel", fit: true, components: [
					{name: "document_scroller", kind: "enyo.Scroller", /*style:"position:relative",*/ fit: true, classes: "k2e-document-scroller k2e-document-view-dark", components: [
						{name: "document_view", kind: "DocumentView", fit: true}//,
						//{kind: "onyx.Button", content: "to top", style:"position: absolute; bottom: 10px; right: 10px;"}
					]},
					{kind: "onyx.Toolbar", components: [
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
		onClippingsTextChanged: "handleClippingsTextChanged"
	},

	exportDocuments: function (inSender, inEvent) {
		this.log("Export proccessing done");
		
		var loc = location.protocol + '//' + location.host + location.pathname;

		console.log(loc);
		console.log(_docsExport);

		// return; // comment out to enable exporting

		var ajax = new enyo.Ajax({
			url: loc + "/Export",
			contentType: "application/json; charset=utf-8",
			method: "POST",
			postBody: '{"q":' + JSON.stringify(_docsExport, null, 0) + '}'
		}).go();

		ajax.response(this, "processExportResponse");
		ajax.error(this, "processExportError");
	},

	processExportResponse: function(inSender, inResponse) {
		// do something with it
		alert(JSON.stringify(inResponse, null, 2));
	},

	processExportError: function(inSender, inResponse) {
		this.error("Error in exporting");
	},

	prepareDocumentsAndExport: function () {
		this.handleExportBegin();

		var settings = SettingsSingletonInstance();

		var ignoredTitleSet = {};
		var ignoredTitleList = settings.getSetting("ignoredTitleList");
		if (ignoredTitleList.length > 0) {
			ignoredTitleSet = _arrayToSet(ignoredTitleList.split(","));
		}

		_docsExport = this.documents.exportObject(ignoredTitleSet);
		var docExportArray = _docsExport.documents;
		

		var periodicalTitleSet = {};
		var periodicalTitleList = settings.getSetting("periodicalTitleList");
		if (periodicalTitleList.length > 0) {
			periodicalTitleSet = _arrayToSet(periodicalTitleList.split(","));
		}

		for (var i = 0; i < docExportArray.length; ++i) {
			var dEx = docExportArray[i];

			// comment out to enable periodical article url and title search.
			if (settings.getSetting("articleExtraction") === true) {
				this.log("Tagging documents as periodicals");
				if (dEx.title in periodicalTitleSet) {
					dEx.isPeriodical = true;
					for (var j = 0; j < dEx.clippings.length; ++j) {
						var cEx = dEx.clippings[j];
						this.setSuggestedDataToClipping(cEx);
					}
				}
			}
		}

		this.handleExportEnd();

	},

	setSuggestedDataToClipping: function (clippingExport, makeQuotedFlag, retryFlag) {
		var settings = SettingsSingletonInstance();

		var quoted = (makeQuotedFlag === undefined)?true:makeQuotedFlag;
		var retry = (retryFlag === undefined)?true:retryFlag;

		var loc = settings.getSetting("googleSearchApiLoc"); // "https://www.googleapis.com/customsearch/v1?";
		var key = settings.getSetting("googleSearchApiKey"); // "AIzaSyCOmQoeVtIKV5xyAVIe3BnFFejQgHEjv0I";
		var cx = settings.getSetting("googleSearchApiCx"); // "010892405042999130320:lrtm0dyni30";

		var MAX_QUERY_LENGTH = 128;
		
		var s = "";
		
		if (clippingExport.content.length > MAX_QUERY_LENGTH) {
			s = clippingExport.content.substring(0, MAX_QUERY_LENGTH);
		}
		else {
			s = clippingExport.content;
		}

		var q = "";
		var index = s.lastIndexOf(" ");
		if (index != -1) {
			q = s.substring(0, index);
		}
		else {
			q = s;
		}


		q = quoted?('"' + q + '"'):q;

		var ajax = new enyo.Ajax({
			url: loc
		});

		this.handleQueryBegin();
		ajax.go({
			key: key,
			cx: cx,
			q: q
		});

		var self = this;
		var processQueryResponse = (function (inSender, inResponse) {
			var cEx = clippingExport;
			if (inResponse.items && inResponse.items.length) {
				cEx.suggestedTitle = inResponse.items[0].title;
				cEx.suggestedUrl = inResponse.items[0].link;
				self.log("Got title: " + inResponse.items[0].title);
				self.handleQueryEnd();
			}
			else {
				//send one additional query without quotes
				self.handleQueryEnd();
				if (retry) {
					self.setSuggestedDataToClipping(cEx, false, false);
				}
			}
		});
		ajax.response(processQueryResponse);

		// var processQueryErrorTmp = (function (inSender, inResponse) {
		// 	inResponse = {  };
		// 	var cEx = clippingExport;
		// 	if (inResponse.items && inResponse.items.length) {
		// 		cEx.suggestedTitle = inResponse.items[0].title;
		// 		cEx.suggestedUrl = inResponse.items[0].link;
		// 		self.log("Got title: " + inResponse.items[0].title);
		// 		self.handleQueryEnd();
		// 	}
		// 	else {
		// 		//send one additional query without quotes
		// 		self.handleQueryEnd();
		// 		if (retry) {
		// 			self.setSuggestedDataToClipping(cEx, false, false);
		// 		}
		// 	}
		// });
		// ajax.error(processQueryErrorTmp);

        ajax.error(this, "processQueryError");
	},

	processQueryError: function (inSender, inResponse) {
		this.error("Error in google search request");
		this.handleQueryEnd();
	},

	handleDocumentSelected: function (inSender, inEvent) {
		var docSelector = inEvent.originator;
		console.log(docSelector.getTitle());
		console.log(docSelector.getIndex());
		var doc = this.documents.getDocumentByIndex(docSelector.getIndex());
		console.log(doc);
		//this.$.document_view.setContent(doc.clippings[0].getContent());
		this.$.document_view.displayDocument(doc);
		this.$.document_scroller.scrollToTop();

	},

	handleExportBegin: function (inSender, inEvent) {
		this.log("handleExportBegin");
		_exportPreparationSem.v();
	},

	handleExportEnd: function (inSender, inEvent) {
		this.log("handleExportEnd");
		_exportPreparationSem.p();
	},

	handleQueryBegin: function (inSender, inEvent) {
		this.log("handleQueryBegin");
		_exportPreparationSem.v();
	},

	handleQueryEnd: function (inSender, inEvent) {
		this.log("handleQueryEnd");
		_exportPreparationSem.p();
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
		return true;
	},

	toggleSettings: function (inSender, inEvent) {
		this.$.settings.toggle();
	},

	parseKinldeClippings: function (kindleClippings) {
		var docs = new Documents();
		var clippingRegExp = new RegExp(/^\s*(.+)\s\((.+)\)\s+-\s+(.+)\s+(.*)/);
		var delimeter = "==========";
		kindleClippings = kindleClippings.split("\n" + delimeter);

		//assert(clippingRegExp.test(kindleClippings[73]));

		for (var i = 0; i < kindleClippings.length; ++i) {
			if (!clippingRegExp.test(kindleClippings[i])) {
				//console.log("***failed on " + kindleClippings[i] + "\n");
				continue;
			}

			var res = clippingRegExp.exec(kindleClippings[i]);
			var title = res[1];
			var author = res[2];
			var subtitle = res[3].split(/\s+\|\s+/);
			var type = subtitle[0].substring(0, subtitle[0].indexOf(' '));
			var loc = subtitle[0].substring(subtitle[0].indexOf(' ') + 1);
			var timeStamp = subtitle[subtitle.length - 1];
			var content = res[4];

			// Skip kindle bookmarks and clippings (not to be confused with the Clipping class)
			if (type === "Bookmark" || type === "Clipping") {
				continue;
			}


			docs.addClippingToDocument(
					title, author,
					new Clipping({type: type, loc: loc, timeStamp: timeStamp,
							content: content}));

		}

		return docs;
	},

	enableKeyboardEvents: function () {
		this.createComponent({kind: enyo.Signals, onkeydown: "handleKeyDown"});
	},

	reflow: function() {
		this.inherited(arguments);
		if (enyo.Panels.isScreenNarrow()) {
			this.$.document_view.setContent("isScreenNarrow");
		}
		else {
			this.$.document_view.setContent("notScreenNarrow");
		}
	},

	// This is probably needed because of the hackery going on in SettingsPanel.js
	rendered: function () {
		this.inherited(arguments);
		this.$.clipping_picker_popup.show();
	},

	create: function() {
		this.inherited(arguments);
		var self = this;

		_exportPreparationSem = new AsyncSemaphore({func: function () { self.exportDocuments(); } });
		
		// FIXME: Get data by dnd or file chooser
		// if (!window.XMLHttpRequest)
		// 	return;

		// var req = new XMLHttpRequest();
		// req.open("GET", "assets/clippings.txt");
		// req.send(null);

		// req.onreadystatechange = function () {
		// 	this.documents = parseKinldeClippings(req.responseText);
		// 	self.$.document_selector_list.populate(testDocs);
		// };
	}
}; // enyo kind definition
})() // (function () {
); // enyo.kind(