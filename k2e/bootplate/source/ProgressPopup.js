/*global enyo */

(function () {

enyo.kind({
    name: "ProgressPopup",

    classes: "k2e-progress-popup",

    kind: "onyx.Popup",

    modal: true,
    floating: true,
    autoDismiss: false,
    centered: true,
    scrim: true,

    components: [
        {name: "spinner", kind: "onyx.Spinner"},
        {name: "message", content: ""}
    ],

    done: function (message) {
        changeMessage.call(this, message);
        window.setTimeout(this.hide.bind(this), 4000);
    },

    begin: function (message) {
        changeMessage.call(this, message, true);
        this.show();
    },

    failed: function (caption, messages) {
        if (!Array.isArray(messages)) {
            messages = messages ? [messages] : [];
        }

        changeMessage.call(
            this,
            caption +
            (messages.length !== 0 ? ": " : "") +
            messages.join("\n")
        );
        window.setTimeout(this.hide.bind(this), 4000);
    }
});

function changeMessage(message, spinnerToggle) {
    var spinnerFunc = spinnerToggle ? this.$.spinner.show : this.$.spinner.hide;
    spinnerFunc.call(this.$.spinner);
    this.$.message.setContent(message);
    this.rendered();
}

})();
