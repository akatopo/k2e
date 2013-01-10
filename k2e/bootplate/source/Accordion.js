enyo.kind({
    name: "Accordion",

    published: {
    },

    components: [
    ]
});

enyo.kind({
    name: "AccordionItem",

    published: {
    },

    components: [
        {name: "header", classes: "onyx-toolbar-inline k2e-accordion-item-header", style:"height:36px", ontap: "toggleOpen", components:[
            {name: "animation", kind: "Animator", onStep: "animatorStep", onEnd: "animatorComplete"},
            {name: "expander", style: "background-color: inherit; width: 36px; height: 100%; margin: 0;", components: [
                {tag: "img", src: "assets/placeholder.png"}
            ]},
            {classes: "k2e-accordion-item-content", style: "height: 100%; margin: 0;", components: [
                {content: "Heading", style: "display: table-cell; vertical-align: middle; height: 36px"}
            ]}
        ]},
        {name: "drawer", kind: "onyx.Drawer", open: false, orient: "v", animated: true, components:[
            {kind: "onyx.Groupbox", components: [
                {kind: "onyx.InputDecorator", components: [
                    {kind: "onyx.Input", style: "width: 100%", placeholder: "Enter text here"}
                ]},
                {kind: "onyx.InputDecorator", components: [
                    {kind: "onyx.Input", style: "width: 100%", value: "Middle"}
                ]},
                {kind: "onyx.InputDecorator", style: "background: lightblue;", components: [
                    {kind: "onyx.Input", style: "width: 100%;", value: "Last"}
                ]}
            ]}
        ]}
    ],

    toggleOpen: function (inSender, inEvent) {
        this.$.drawer.setOpen(!this.$.drawer.getOpen());
        if (this.$.animation.isAnimating()) {
            this.$.animation.reverse();
        }
        else {
            if (this.$.drawer.getOpen()) {
                this.$.animation.play({startValue: 0, endValue: 90, /*duration: 2000,*/ node: this.$.expander.hasNode()});
            }
            else {
                this.$.animation.play({startValue: 90, endValue: 0, /*duration: 2000,*/ node: this.$.expander.hasNode()});
            }
        }
    },

    animatorStep: function (inSender, inEvent) {
        this.$.expander.applyStyle("-webkit-transform", "rotate(" + inSender.value + "deg)");
        this.$.expander.applyStyle("-ms-transform", "rotate(" + inSender.value + "deg)");
        this.$.expander.applyStyle("-moz-transform", "rotate(" + inSender.value + "deg)");
        this.$.expander.applyStyle("-o-transform", "rotate(" + inSender.value + "deg)");
        this.$.expander.applyStyle("transform", "rotate(" + inSender.value + "deg)");

        return true;
    },

    animatorComplete: function (inSender, inEvent) {
        return true;
    }
});