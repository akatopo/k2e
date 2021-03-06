(function () {

enyo.kind({
  name: 'k2e.Button',
  kind: 'onyx.Button',
  mixins: ['k2e.ButtonActivationMixin'],
  classes: 'onyx-button k2e-button',
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
}

})();
