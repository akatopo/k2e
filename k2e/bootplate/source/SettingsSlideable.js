/*global enyo */

enyo.kind({
    name: "SettingsSlideable",

    kind: "Slideable",

    classes: "k2e-settings",

    min: -100,
    max: 0,
    value: -100,
    unit: "%",
    draggable: false,
    cookieModel: undefined,

    components: [
        {name: "scroller", kind: "enyo.Scroller", fit: true, style: "height: 100%", components: [
            { name: "panel", kind: "SettingsPanel"}
        ]}
    ],

    bindings: [
        { from: "cookieModel", to: "$.panel.cookieModel" }
    ],

    toggle: function () {
        this.addRemoveClass("k2e-settings-active", this.isAtMin());

        if (this.isAtMin()) {
            this.animateToMax();
        } else {
            this.animateToMin();
            this.$.scroller.scrollToTop();
        }
    }
});