(function () {

enyo.kind({
  name: 'k2e.AccordionItem',
  published: {
    content: ''
  },
  childComponents: [
    {classes: 'onyx-toolbar-inline k2e-accordion-item-header', ontap: 'toggleOpen', components: [
      {name: 'expanderAnimator', kind: 'Animator', onStep: 'animatorStep', onEnd: 'animatorComplete'},
      {name: 'expander', classes: 'k2e-accordion-item-expander', components: [
        {tag: 'i', classes: 'icon-play'}
      ]},
      {classes: 'k2e-accordion-item-content', components: [
        {tag: null, name: 'headerText'}
      ]}
    ]},
    {name: 'client', kind: 'onyx.Drawer', open: false, orient: 'v', animated: true}
  ],
  bindings: [
    { from: '.content', to: '.$.headerText.content' }
  ],
  toggleOpen: toggleOpen,
  animatorStep: animatorStep,
  animatorComplete: function () { return true; },
  initComponents: initComponents
});

/////////////////////////////////////////////////////////////

function toggleOpen(inSender, inEvent) {
  this.$.client.setOpen(!this.$.client.getOpen());
  if (this.$.expanderAnimator.isAnimating()) {
    this.$.expanderAnimator.reverse();
  }
  else {
    if (this.$.client.getOpen()) {
      this.$.expanderAnimator.play({startValue: 0, endValue: 90, node: this.$.expander.hasNode()});
    }
    else {
      this.$.expanderAnimator.play({startValue: 90, endValue: 0, node: this.$.expander.hasNode()});
    }
  }
}

function animatorStep(inSender, inEvent) {
  this.$.expander.applyStyle('-webkit-transform', 'rotate(' + inSender.value + 'deg)');
  this.$.expander.applyStyle('-ms-transform', 'rotate(' + inSender.value + 'deg)');
  this.$.expander.applyStyle('-moz-transform', 'rotate(' + inSender.value + 'deg)');
  this.$.expander.applyStyle('-o-transform', 'rotate(' + inSender.value + 'deg)');
  this.$.expander.applyStyle('transform', 'rotate(' + inSender.value + 'deg)');

  return true;
}

function initComponents() {
  this.createComponents(this.childComponents, { isChrome: true });
  this.inherited(arguments);
}

})();
