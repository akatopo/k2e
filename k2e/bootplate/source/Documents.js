enyo.kind({
	name: "Document",
	kind: "enyo.Component",
	published: {
		index: -1,
		title: "",
		author: "",
		clippings: undefined
	},
	addClipping: function(clipping) {
		this.getClippings().push(clipping);
	},
	create: function() {
		this.inherited(arguments);
		this.clippings = [];
	}
});

enyo.kind({
	name: "Clipping",
	kind: "enyo.Component",
	published: {
		type: "",
		loc: "",
		timeStamp: "",
		content: ""
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
	addClippingToDocument: function(title, author, clipping) {
		var key = title + author;
		
		if (!this.docMap[key]) {
			this.docMap[key] = new Document({title: title, author: author});
			++this.length;
			this.keyArray.push(key);
		}

		this.docMap[key].addClipping(clipping);
	},
	getDocumentByIndex: function(index) {
		return this.docMap[this.keyArray[index]];
	},
	create: function() {
		this.inherited(arguments);
		this.docMap = {};
		this.keyArray = [];
	}
})