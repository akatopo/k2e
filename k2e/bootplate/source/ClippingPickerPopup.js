enyo.kind({
    name: "ClippingPickerPopup",

    kind: "onyx.Popup",

    classes: "k2e-clipping-picker-popup",

    content: "Drag your kindle clippings here",

    modal: true,
    floating: true,
    autoDismiss: false,
    centered: true,
    scrim: true,

    published: {
        clippingsText: ""
    },

    components: [
        // Components
    ],

    events: {
        onClippingsTextChanged: ""
    },

    handlers: {
        onShow: "handleOnShow"
    },

    clippingsTextChanged: function () {
        this.log('clippingsTextChanged');
        this.doClippingsTextChanged();
    },

    handleOnShow: function () {
        var self = this;
        var elem = document.getElementById(this.getId());

        var handleDragleave = function (ev) {
            self.log('handleDragleave');
            self.addRemoveClass("onyx-blue", false);
        };

        var handleDragover = function (ev) {
            self.log('handleDragover');
            self.addRemoveClass("onyx-blue", true);
            ev.stopPropagation();
            ev.preventDefault();
            ev.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
        };

        var handleDrop = function (ev) {
            self.log('handleDrop');
            ev.stopPropagation();
            ev.preventDefault();

            self.addRemoveClass("onyx-blue", false);
            var files = ev.dataTransfer.files; // FileList object.
            // self.log(files);

            var reader = new FileReader();

            if (files.length > 0) {
                reader.onload = function (e) {
                    self.setClippingsText(e.target.result);                    
                };

                reader.readAsText(files[0]);
            }
        };

        elem.addEventListener('dragleave', handleDragleave, false);
        elem.addEventListener('dragover', handleDragover, false);
        elem.addEventListener('drop', handleDrop, false);
    }


});