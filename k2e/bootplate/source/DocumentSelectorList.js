enyo.kind({
	name: "DocumentSelectorList",
	kind: "enyo.Scroller",
	style: "height: 100%",
	components: [
		{fit:true, name: "DocumentSelectorRepeater", kind: "enyo.Repeater",
		onSetupItem: "setDocumentSelectorItem", count: 0,
		components: [
			{kind: "DocumentSelectorItem"}
		]}
	],
	published: {
		documentsRef: undefined
	},
	items: undefined,
	setDocumentSelectorItem: function(inSender, inEvent) {
	    var index = inEvent.index;
	    var item = inEvent.item;
	    var docMap = this.documentsRef.getDocMap();
	    var key = this.documentsRef.getKeyArray()[index];
	    item.$.documentSelectorItem.setTitle(docMap[key].getTitle());
	    item.$.documentSelectorItem.setIndex(index);
	    this.items.push(item.$.documentSelectorItem);
	    return true;
	},
	enableMultiSelection: function() {
		for(var i = 0; i < this.items.length; ++i) {
			this.items[i].setMultiSelected(true);
		}
	},
	disableMultiSelection: function() {
		for(var i = 0; i < this.items.length; ++i) {
			this.items[i].setMultiSelected(false);
		}
	},
	populate: function(documents) {
		this.documentsRef = documents;
		this.$.DocumentSelectorRepeater.setCount(this.documentsRef.length);
	},
	create: function() {
		this.inherited(arguments);
		this.items = [];
	}
})

enyo.kind({
	name: "DocumentSelectorItem",
	classes: "k2e-document-selector-item enyo-border-box",
	published: {
		index: -1,
		multiSelected: false
	},
	components: [
		{name: "checkbox", kind: "onyx.Checkbox", showing: false},
		{name: "label", classes: "enyo-inline k2e-document-selector-item-label"}
	],
	events: {
		onDocumentSelected: "",
	},
	handlers: {
		ontap: "doDocumentSelected"
	},
	setTitle: function (titleString) {
		this.$.label.setContent(titleString);
	},
	getTitle: function() {
		return this.$.label.getContent();
	},
	setMultiSelected: function(bool) {
		if (bool === true) {
			multiSelected = true;
			this.$.checkbox.setChecked(false);
			this.$.checkbox.show();		
		}
		else if (bool === false) {
			multiSelected = false;
			this.$.checkbox.hide();
			this.$.checkbox.setChecked(false);
		}
	}

})