enyo.kind({
    name: "ClippingPickerPopup",

    kind: "onyx.Popup",

    classes: "k2e-clipping-picker-popup onyx-toolbar-inline",

    modal: true,
    floating: true,
    autoDismiss: false,
    centered: true,
    scrim: true,

    published: {
        clippingsText: ""
    },

    components: [
        {content: "Drag your kindle clippings here or "},
        {kind: "onyx.Button", content: "Load from File", ontap: "loadFile"},
        {name: "file_picker", kind: "enyo.Input", type: "file", style: "display:none"}
    ],

    events: {
        onClippingsTextChanged: ""
    },

    handlers: {
        onShow: "handleOnShow"
    },

    loadFile: function() {
        var pickerNode = this.$.file_picker.hasNode();
        
        if (pickerNode) {
            pickerNode.click();
        }
    },

    clippingsTextChanged: function () {
        this.doClippingsTextChanged();
    },

    handleOnShow: function () {
        var self = this;
        var popupNode = this.hasNode();
        var pickerNode = this.$.file_picker.hasNode();

        if (popupNode && pickerNode) {
            var handleDragleave = function (ev) {
                self.addRemoveClass("onyx-blue", false);
            };

            var handleDragover = function (ev) {
                self.addRemoveClass("onyx-blue", true);
                ev.stopPropagation();
                ev.preventDefault();
                ev.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
            };

            var handleFiles = function (files) {
                var reader = new FileReader();

                if (files.length > 0) {
                    reader.onload = function (e) {
                        self.setClippingsText(e.target.result);                    
                    };

                    reader.readAsText(files[0]);
                }
            };

            var handleDrop = function (ev) {
                ev.stopPropagation();
                ev.preventDefault();

                self.addRemoveClass("onyx-blue", false);
                handleFiles(ev.dataTransfer.files); // FileList object.
            };

            var handleFilePick = function () {
                handleFiles(this.files); // FileList object.
            };

            pickerNode.addEventListener('change', handleFilePick, false);
            popupNode.addEventListener('dragleave', handleDragleave, false);
            popupNode.addEventListener('dragover', handleDragover, false);
            popupNode.addEventListener('drop', handleDrop, false);
        }
    }


});