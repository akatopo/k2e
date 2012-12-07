enyo.kind({
	name: "App",
	kind: "FittableRows",
	components:[
		{kind: "Signals",
			onExportBegin: "handleExportBegin",
			onExportEnd: "handleExportEnd",
			onQueryBegin: "handleQueryBegin",
			onQueryEnd: "handleQueryEnd"
		},
		{kind: "onyx.Toolbar", components: [
			{content: "k2e toolbar"},
			{fit: true},
			{kind: "onyx.Button", content: "Export", ontap: "prepareDocumentsForExport"}
		]},
		{kind: "Panels", name: "fixme_panels", fit: true, arrangerKind: "CollapsingArranger", realtimeFit: true, wrap: false, components: [
			{name: "fixme_sidebar", classes: "fixme-sidebar", style: "width: 20%", components:[
				{fit:true, name: "fixmeSelList", kind: "DocumentSelectorList"}
			]},
			{name: "fixme_clip_panel", kind: "FittableRows", fit: true, components: [
				{kind: "enyo.Scroller", /*style:"position:relative",*/ fit: true, classes: "fixme-clip-scroller", components: [
					{name: "fixme_clip_body", fit: true}//,
					//{kind: "onyx.Button", content: "to top", style:"position: absolute; bottom: 10px; right: 10px;"}
				]},
				{kind: "onyx.Toolbar", components: [
					{content: "clip toolbar"}
				]}
			]}
		]}
	],
	published: {
		asyncSem: undefined,
		periodicalTitleSet: { Instapaper: true }, // FIXME: initialize from local storage
												  // and/or set from options
		docsExport: undefined
	},
	handlers: {
		onDocumentSelected: "handleDocumentSelected"
	},
	export: function (inSender, inEvent) {
		this.log("Export proccessing done");
		
		var loc = location.protocol + '//' + location.host + location.pathname;

		console.log(loc);

		var ajax = new enyo.Ajax({
			url: loc + "/Export",
			contentType: "application/json; charset=utf-8",
			method: "POST",
			//postBody: '{"q":' + JSON.stringify(testDocs.exportObject(), null, 0) + '}'
			postBody: '{"q":' + JSON.stringify(this.docsExport, null, 0) + '}'
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
	prepareDocumentsForExport: function () {
		this.handleExportBegin();

		var docs = testDocs; // FIXME
		this.docsExport = testDocs.exportObject();
		var docExArray = this.docsExport.documents;

		for (var i = 0; i < docExArray.length; ++i) {
			var dEx = docExArray[i];			
			if (dEx.title in this.periodicalTitleSet) {
				dEx.isPeriodical = true;
				for (var j = 0; j < dEx.clippings.length; ++j) {
					var cEx = dEx.clippings[j];
					this.setSuggestedDataToClipping(cEx);
				}
			}
		}

		this.handleExportEnd()

	},
	setSuggestedDataToClipping: function (clippingExport, makeQuotedFlag, retryFlag) {
		var quoted = (makeQuotedFlag === undefined)?true:makeQuotedFlag;
		var retry = (retryFlag === undefined)?true:retryFlag;

		var loc = "https://www.googleapis.com/customsearch/v1?"
		var key = "AIzaSyCOmQoeVtIKV5xyAVIe3BnFFejQgHEjv0I"; // FIXME: init from local storage
		var cx = "010892405042999130320:lrtm0dyni30";        // and/or options
		//q =  '"' + q + '"';

		var MAX_QUERY_LENGTH = 128;
		
		var s = "";
		
		if (clippingExport.content.length > MAX_QUERY_LENGTH) {
			s = clippingExport.content.substring(0, MAX_QUERY_LENGTH)
		}
		else {
			s = clippingExport.content;
		}

		var q = ""
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

		//enyo.Signals.send("onQueryBegin");
		this.handleQueryBegin();
		ajax.go({
			key: key,
			cx: cx,
			q: q
		});

		var originator = this;
		var processQueryResponse = (function (inSender, inResponse) {
			var cEx = clippingExport;
			if (inResponse.items && inResponse.items.length) {
				cEx.suggestedTitle = inResponse.items[0].title;
				cEx.suggestedUrl = inResponse.items[0].link;
				originator.log("Got title: " + inResponse.items[0].title);
				originator.handleQueryEnd();
			}
			else {
				//send one additional query without quotes
				originator.handleQueryEnd();
				if (retry) {
					originator.setSuggestedDataToClipping(cEx, false, false);
				}
			}
		});
		ajax.response(processQueryResponse);
		// 	var processQueryErrorTmp = (function (inSender, inResponse) {
		// 	var inResponse = {  }
		// 	var cEx = clippingExport;
		// 	if (inResponse.items && inResponse.items.length) {
		// 		cEx.suggestedTitle = inResponse.items[0].title;
		// 		cEx.suggestedUrl = inResponse.items[0].link;
		// 		originator.log("Got title: " + inResponse.items[0].title);
		// 		originator.handleQueryEnd();
		// 	}
		// 	else {
		// 		//send one additional query without quotes
		// 		originator.handleQueryEnd();
		// 		if (retry) {
		// 			originator.setSuggestedDataToClipping(cEx, false, false);
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
		var doc = testDocs.getDocumentByIndex(docSelector.getIndex())
		console.log(doc);
		this.$.fixme_clip_body.setContent(doc.clippings[0].getContent());

	},
	handleExportBegin: function (inSender, inEvent) {
		this.log("handleExportBegin");
		this.asyncSem.v();
	},
	handleExportEnd: function (inSender, inEvent) {
		this.log("handleExportEnd");
		this.asyncSem.p();
	},
	handleQueryBegin: function (inSender, inEvent) {
		this.log("handleQueryBegin");
		this.asyncSem.v();
	},
	handleQueryEnd: function (inSender, inEvent) {
		this.log("handleQueryEnd");
		this.asyncSem.p();
	},
	reflow: function() {
		this.inherited(arguments);
		if (enyo.Panels.isScreenNarrow()) {
			this.$.fixme_clip_body.setContent("isScreenNarrow");
		}
		else {
			this.$.fixme_clip_body.setContent("notScreenNarrow");
		}
	},
	create: function() {
		this.inherited(arguments);
		var originator = this;
		this.asyncSem = new AsyncSemaphore({func: function () { originator.export(); } });
		testDocs = new Documents();
		
		// FIXME: Get data by dnd or file chooser
		if (!window.XMLHttpRequest)
			return;

     	var req = new XMLHttpRequest();
    	req.open("GET", "assets/clippings.txt");
    	req.send(null);                        

		// Before returning, register an event handler function that will be called
	    // at some later time when the HTTP server's response arrives. This kind of 
	    // asynchronous programming is very common in client-side JavaScript.
	    var app = this;
	    req.onreadystatechange = function() {
	    	//var app = this;
	        if (req.readyState == 4 && req.status == 200) {
	            // If we get here, we got a complete valid HTTP response
	            var clippingRegExp = new RegExp(/^\s*(.+)\s\((.+)\)\s+-\s+(.+)\s+(.*)/);
	            var response = req.responseText;
				testClippings = response;
	            testClippings = testClippings.split("\n==========");

	            //assert(clippingRegExp.test(testClippings[73]));
		        
		        for (var i = 0; i < testClippings.length; ++i) {
		        	if (!clippingRegExp.test(testClippings[i])) {
		        		//console.log("***failed on " + testClippings[i] + "\n");
		        		continue;
		        	}
		        	
		            var res = clippingRegExp.exec(testClippings[i]);
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


		            testDocs.addClippingToDocument(
		            		title, author, 
		            		new Clipping({type: type, loc: loc, timeStamp: timeStamp,
		            				content: content}));

	            }

	            app.$.fixmeSelList.populate(testDocs);

	        }
	    }

	}
});
