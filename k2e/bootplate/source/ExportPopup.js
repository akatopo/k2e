enyo.kind({
    name: "ExportPopup",

    classes: "k2e-export-popup",

    kind: "onyx.Popup",

    modal: true,
    floating: true,
    autoDismiss: false,
    centered: true,
    scrim: true,

    components: [
        {name: "spinner", kind: "onyx.Spinner"},
        {name: "message", content: "Exporting clippings..."}
    ],

    exportDone: function () {
        this.$.spinner.hide();
        this.$.message.setContent("Export Done!");
    },

    exportBegin: function () {
        this.$.spinner.show();
        this.$.message.setContent("Exporting clippings...");  
    }
});