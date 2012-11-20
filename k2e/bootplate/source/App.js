enyo.kind({
	name: "App",
	kind: "FittableRows",
	components:[
		{kind: "onyx.Toolbar", components: [
			{content: "k2e toolbar"},
			{fit: true},
			{kind: "onyx.Button", content: "Export", ontap: "export"}
		]},
		{kind: "Panels", name: "fixme_panels", fit: true, arrangerKind: "CollapsingArranger", realtimeFit: true, wrap: false, components: [
			{name: "fixme_sidebar", classes: "fixme-sidebar", style: "width: 20%", components:[
				{fit:true, name: "fixmeSelList", kind: "DocumentSelectorList"}
			]},
			{name: "fixme_clip_panel", kind: "FittableRows", fit: true, components: [
				{style:"position:relative", fit: true, components: [
					{name: "fixme_clip_body", style: "height: 100%", classes: "fixme-clip-body", },
					{kind: "onyx.Button", content: "to top", style:"position: absolute; bottom: 10px; right: 10px;"}
				]},
				
				{kind: "onyx.Toolbar", components: [
					{content: "clip toolbar"}
				]}
			]}
		]}
	],
	export: function (inSender, inEvent) {
		var loc = location.protocol + '//' + location.host + location.pathname;

		console.log(loc);

		var ajax = new enyo.Ajax({
			url: loc + "/Export",
			contentType: "application/json; charset=utf-8",
			method: "POST",
			postBody: '{"q":' + JSON.stringify(testDocs.exportObject(), null, 0) + '}'
		}).go();

		ajax.response(this, "processResponse");
		// handle error
		ajax.error(this, "processError");
	},
	processResponse: function(inSender, inResponse) {
		// do something with it
		alert(JSON.stringify(inResponse, null, 2));
	},
	processError: function(inSender, inResponse) {
		this.error("Error in exporting");
	},
	handlers: {
		onDocumentSelected: "handleDocumentSelected"
	},
	handleDocumentSelected: function(inSender, inEvent) {
		var docSelector = inEvent.originator;
		console.log(docSelector.getTitle());
		console.log(docSelector.getIndex());
		console.log(testDocs.getDocumentByIndex(docSelector.getIndex()));
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
		testDocs = new Documents();
		//testDocs.getDocArray().push(new Document({title: "sadsad"}));
		
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

		            testDocs.addClippingToDocument(title, author, new Clipping({type: type, loc: loc, timeStamp: timeStamp, content: content}));

	            }

	            app.$.fixmeSelList.populate(testDocs);

	        }
	    }

	}
});
