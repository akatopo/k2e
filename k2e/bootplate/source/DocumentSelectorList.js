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
        selDocumentSelectorItem: null,
        multiSelected: false
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
            // TODO: isInView is protected. Is there a better way to find whether a node/control is in view?
            if (!this.getStrategy().isInView(this.selDocumentSelectorItem.hasNode())) {
                this.scrollToControl(this.selDocumentSelectorItem);
            }
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
    setMultiSelected: function (inValue) {
        if (inValue) {
            this.multiSelected = true;
            this.enableMultiSelection();
        } else {
            this.multiSelected = false;
            this.disableMultiSelection();
        }
    },
    toggleMultiSelection: function () {
        if (this.multiSelected) {
            this.disableMultiSelection();
        } else {
            this.enableMultiSelection();
        }
    },
    enableMultiSelection: function () {
        var i;

        this.multiSelected = true;

        for (i = 0; i < this.items.length; i += 1) {
            this.items[i].setMultiSelected(true);
        }
    },
    disableMultiSelection: function () {
        var i;

        this.multiSelected = false;

        for (i = 0; i < this.items.length; i += 1) {
            this.items[i].setMultiSelected(false);
        }
    },
    getMultiSelectionKeys: function () {
        var i,
            keyArray = this.documentsRef.getKeyArray(),
            multiSelKeys = {};

        for (i = 0; i < this.items.length; i += 1) {
            if (this.items[i].getMultiSelected()
                    && this.items[i].isMarked()) {
                multiSelKeys[keyArray[i]] = true;
            }
        }

        return multiSelKeys;
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
        ontap: "handleTap"
    },
    handleTap: function () {
        var self = this;
        this.doDocumentSelected(self);
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
        if (bool) {
            this.multiSelected = true;
            this.$.checkbox.setChecked(false);
            this.$.checkbox.show();
        } else {
            this.multiSelected = false;
            this.$.checkbox.hide();
            this.$.checkbox.setChecked(false);
        }
    },
    isMarked: function () {
        return this.$.checkbox.getChecked();
    }

});