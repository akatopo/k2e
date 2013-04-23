/*global enyo */

enyo.kind({
    name: "DocumentSelectorList",
    kind: "enyo.Scroller",
    style: "height: 100%",
    components: [
        {fit: true, name: "DocumentSelectorRepeater", kind: "enyo.Repeater",
            onSetupItem: "handleSetupItem", count: 0,
            components: [
                {kind: "DocumentSelectorItem"}
            ]}
    ],
    published: {
        documentsRef: undefined,
        selDocumentSelectorItem: null
    },
    items: undefined,
    handlers: {
        onDocumentSelected: "handleDocumentSelected"
    },
    handleDocumentSelected: function (inSender, inEvent) {
        var docSelectorItem = inEvent.originator;

        if (this.selDocumentSelectorItem !== docSelectorItem) {
            docSelectorItem.setSelected(true);
            if (this.selDocumentSelectorItem) {
                this.selDocumentSelectorItem.setSelected(false);
            }
            this.selDocumentSelectorItem = docSelectorItem;
            this.scrollIntoView(this.selDocumentSelectorItem);
        } else {
            inEvent.reSelected = true;
        }
    },
    handleSetupItem: function (inSender, inEvent) {
        var index = inEvent.index,
            item = inEvent.item,
            docMap = this.documentsRef.getDocMap(),
            key = this.documentsRef.getKeyArray()[index];

        item.$.documentSelectorItem.setTitle(docMap[key].getTitle());
        item.$.documentSelectorItem.setIndex(index);
        this.items.push(item.$.documentSelectorItem);
        return true;
    },
    enableMultiSelection: function () {
        var i;
        for (i = 0; i < this.items.length; i += 1) {
            this.items[i].setMultiSelected(true);
        }
    },
    disableMultiSelection: function () {
        var i;
        for (i = 0; i < this.items.length; i += 1) {
            this.items[i].setMultiSelected(false);
        }
    },
    selectNextDocument: function () {
        var curIndex,
            selDocument;

        if (this.items.length !== 0) {
            if (!this.selDocumentSelectorItem) {
                selDocument = this.items[0];
                selDocument.doDocumentSelected();
            } else {
                curIndex = this.selDocumentSelectorItem.getIndex();
                if (curIndex >= 0 && curIndex < this.items.length - 1) {
                    curIndex += 1;

                    selDocument = this.items[curIndex];
                    selDocument.doDocumentSelected();
                }

                this.log(this.selDocumentSelectorItem.getIndex());
            }
        }
    },
    selectPrevDocument: function () {
        var curIndex,
            selDocument;

        if (this.items.length !== 0) {
            if (!this.selDocumentSelectorItem) {
                selDocument = this.items[this.items.length - 1];
                selDocument.doDocumentSelected();
            } else {
                curIndex = this.selDocumentSelectorItem.getIndex();
                if (curIndex >= 1 && curIndex < this.items.length) {
                    curIndex -= 1;

                    selDocument = this.items[curIndex];
                    selDocument.doDocumentSelected();
                }

                this.log(this.selDocumentSelectorItem.getIndex());
            }
        }
    },
    populate: function (documents) {
        this.documentsRef = documents;
        this.$.DocumentSelectorRepeater.setCount(this.documentsRef.length);
    },
    create: function () {
        this.inherited(arguments);
        this.items = [];
    }
});

enyo.kind({
    name: "DocumentSelectorItem",
    classes: "k2e-document-selector-item enyo-border-box",
    published: {
        index: -1,
        multiSelected: false,
        selected: false
    },
    components: [
        {name: "checkbox", kind: "onyx.Checkbox", showing: false},
        {name: "label", classes: "enyo-inline k2e-document-selector-item-label"}
    ],
    events: {
        onDocumentSelected: ""
    },
    handlers: {
        ontap: "doDocumentSelected"
    },
    setSelected: function (bool) {
        this.selected = bool;
        this.addRemoveClass("onyx-selected", this.selected);
        this.addRemoveClass("onyx-blue", this.selected);
    },
    setTitle: function (titleString) {
        this.$.label.setContent(titleString);
    },
    getTitle: function () {
        return this.$.label.getContent();
    },
    setMultiSelected: function (bool) {
        if (bool === true) {
            this.multiSelected = true;
            this.$.checkbox.setChecked(false);
            this.$.checkbox.show();
        } else if (bool === false) {
            this.multiSelected = false;
            this.$.checkbox.hide();
            this.$.checkbox.setChecked(false);
        }
    }

});