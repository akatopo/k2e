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
        {allowHtml: true,
                content: '<input type="file" id="k2e_file_picker" style="display:none"/>'}
    ],

    events: {
        onClippingsTextChanged: ""
    },

    handlers: {
        onShow: "handleOnShow"
    },

    loadFile: function() {
        var fp = document.getElementById("k2e_file_picker");
        fp.click();
    },

    clippingsTextChanged: function () {
        this.doClippingsTextChanged();
    },

    handleOnShow: function () {
        var self = this;
        var elem = document.getElementById(this.getId());
        var fp = document.getElementById("k2e_file_picker");

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

        fp.addEventListener('change', handleFilePick, false);
        elem.addEventListener('dragleave', handleDragleave, false);
        elem.addEventListener('dragover', handleDragover, false);
        elem.addEventListener('drop', handleDrop, false);
    }


});