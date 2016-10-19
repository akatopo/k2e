(function () {

enyo.kind({
  name: 'k2e.RadioButton',
  kind: 'onyx.RadioButton',
  mixins: ['k2e.ButtonActivationMixin'],
  classes: 'k2e-button',
  handlers: {
    ontap: 'handleTap',
  },
  published: {
    animated: true,
  },
  handleTap,
});

function handleTap(inSender, inEvent) {
  this.animationDispatcher({
    parentComponent: this,
    activationLayerComponent: this.$.overlay,
    inEvent,
  });

  if (!this.get('disabled')) {
    this.set('active', true);
  }
}

})();
