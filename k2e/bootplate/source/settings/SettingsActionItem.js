(function () {

enyo.kind({
  name: 'k2e.settings.SettingsActionItem',
  kind: 'k2e.settings.SettingsItem',
  published: {
    buttonLabel: '',
    buttonClasses: '',
    disabled: false
  },
  events: {
    'onActivated': ''
  },
  bindings: [
    {from: '.disabled', to: '.$.button.disabled'},
    {from: '.buttonLabel', to: '.$.button.content'}
  ],
  create: function () {
    this.inherited(arguments);
    this.createComponent({fit: true});
    this.createComponent({name: 'button', kind: 'onyx.Button',
      classes: 'k2e-settings-action-item-button ' + this.getButtonClasses(), ontap: 'doActivated'});
  },
  rendered: function () {
    this.inherited(arguments);
  }
});

})();
