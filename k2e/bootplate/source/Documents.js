enyo.kind({
	name: "Document",
	kind: "enyo.Component",
	published: {
		index: -1,
		title: "",
		author: "",
		isPeriodical: false,
		clippings: undefined
	},
	events: {
		onExportBegin: "",
		onExportEnd: "",
		onQueryBegin: "",
		onQueryEnd: ""
	},
	addClipping: function (clipping) {
		this.getClippings().push(clipping);
	},
	create: function () {
		this.inherited(arguments);
		this.clippings = [];
	},
	exportObject: function () {
		clipExportArray = [];
		for (var i = 0; i < this.clippings.length; ++i) {
			var clipExport = this.clippings[i].exportObject();
			clipExportArray.push(clipExport);
		}
		return {
			title: this.title,
			author: this.author,
			isPeriodical: this.isPeriodical,
			clippings: clipExportArray
		};
	}
});

enyo.kind({
	name: "Clipping",
	kind: "enyo.Component",
	published: {
		type: "",
		loc: "",
		timeStamp: "",
		content: "",
		suggestedTitle: "",
		suggestedUrl: ""
	},
	exportObject: function () {
		return { 
			type: this.type,
			loc: this.loc,
			timeStamp: this.timeStamp,
			content: this.content,
			suggestedTitle: this.suggestedTitle,
			suggestedUrl: this.suggestedUrl
		};
	}
})

enyo.kind({
	name: "Documents",
	kind: "enyo.Component",
	published: {
		docMap: undefined,
		keyArray: undefined,
		length: 0
	},
	addClippingToDocument: function (title, author, clipping) {
		var key = title + author;
		
		if (!this.docMap[key]) {			
			this.docMap[key] =
					new Document({
							title: title, 
							author: author});
			++this.length;
			this.keyArray.push(key);
		}

		this.docMap[key].addClipping(clipping);
	},
	getDocumentByIndex: function (index) {
		return this.docMap[this.keyArray[index]];
	},
	create: function() {
		this.inherited(arguments);
		this.docMap = {};
		this.keyArray = [];
	},
	exportObject: function () {
		var documentsExport = { documents: [] };
		for (var i = 0; i < this.keyArray.length; ++i) {
			var docExport = this.docMap[this.keyArray[i]].exportObject();
			documentsExport.documents.push(docExport);
		}

		return documentsExport;
	}
})