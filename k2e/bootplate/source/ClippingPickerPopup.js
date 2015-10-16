/*global enyo, FileReader */

enyo.kind({
    name: "ClippingPickerPopup",

    kind: "onyx.Popup",

    classes: "k2e-clipping-picker-popup",

    modal: true,
    floating: true,
    autoDismiss: false,
    centered: true,
    scrim: true,

    published: {
        clippingsText: ""
    },

    components: [
        {name: "error_message", classes: "k2e-color-error", showing: false,
            content: "Invalid clippings provided, try loading a correct 'My Clippings.txt' file"},
        {classes: "onyx-toolbar-inline", components: [
            {content: "Drag your kindle clippings here or "},
            {kind: "onyx.Button", content: "Load from File", ontap: "loadFile"},
            {tag: "span", style: "width: 0px; height: 0px; overflow: hidden;", components: [
                {name: "file_picker", kind: "enyo.Input", type: "file", onchange: "handleFiles"}
            ]}
        ]}

    ],

    events: {
        onClippingsTextChanged: ""
    },

    handlers: {
        onShow: "handleOnShow"
    },

    showErrorMessage: function () {
        this.$.error_message.setShowing(true);
        this.rendered();
    },

    loadFile: function () {
        var pickerNode = this.$.file_picker.hasNode();

        if (pickerNode) {
            pickerNode.click();
        }
    },

    clippingsTextChanged: function () {
        this.doClippingsTextChanged();
    },

    handleFiles: function (inSender, inEvent) {
        var reader = new FileReader(),
            files = inEvent.target.files,
            self = this;

        if (files.length > 0) {
            reader.onload = function (e) {
                self.setClippingsText(e.target.result);
            };

            reader.readAsText(files[0]);
        }
    },

    handleOnShow: function () {
        var self = this,
            popupNode = this.hasNode(),
            pickerNode = this.$.file_picker.hasNode(),
            handleDragleave,
            handleDragover,
            handleFiles,
            handleDrop,
            handleFilePick,
            sampleClippingsNode = document.querySelector("#sample-clippings");

        if (sampleClippingsNode) {
            self.setClippingsText(sampleClippingsNode.innerHTML);
            return;
        }

        if (popupNode && pickerNode) {
            handleDragleave = function (ev) {
                self.removeClass("onyx-blue");
            };

            handleDragover = function (ev) {
                self.addClass("onyx-blue");
                ev.stopPropagation();
                ev.preventDefault();
                ev.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
            };

            handleFiles = function (files) {
                self.handleFiles(null, {target: {files: files}});
            };

            handleDrop = function (ev) {
                ev.stopPropagation();
                ev.preventDefault();

                self.removeClass("onyx-blue");
                handleFiles(ev.dataTransfer.files); // FileList object.
            };

            popupNode.addEventListener('dragleave', handleDragleave, false);
            popupNode.addEventListener('dragover', handleDragover, false);
            popupNode.addEventListener('drop', handleDrop, false);
        }
    }


});