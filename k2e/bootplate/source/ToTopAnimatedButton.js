/*global enyo */

enyo.kind({
    name: "ToTopAnimatedButton",

    kind: "onyx.Button",

    published: {
        showing: false,
        opacityMin: 0.01, // hack to fix flicker when opacity is zero
        opacityMax: 0.7
    },

    components: [
        {name: "hideAnimation", kind: "Animator", onStep: "animatorStep"},
        {name: "showAnimation", kind: "Animator", onStep: "animatorStep"}
    ],

    animatorStep: function (inSender, inEvent) {
        this.applyStyle("opacity", inSender.value);

        return true;
    },

    hideAnimatorComplete: function (inSender, inEvent) {
        this.setShowing(false);
        return true;
    },

    setShowing: function (bool) {
        var self = this,
            args = arguments;
        if (bool) {
            if (this.$.hideAnimation.isAnimating()) {
                this.$.hideAnimation.stop();
            }
            if (!this.showing) { // to avoid multiple animations when scrolling down
                this.inherited(arguments);
                this.$.showAnimation.play({startValue: this.opacityMin, endValue: this.opacityMax});
            }
        } else {
            if (this.$.showAnimation.isAnimating()) {
                this.$.showAnimation.stop();
            }
            this.$.hideAnimation.onEnd = function () { self.inherited(args); };
            this.$.hideAnimation.play({startValue: this.opacityMax, endValue: this.opacityMin});
        }
    },

    tmp_show: function () {
        this.setShowing(true);
    },

    tmp_hide: function () {
        this.setShowing(false);
    },

    create: function () {
        this.inherited(arguments);
    }

});