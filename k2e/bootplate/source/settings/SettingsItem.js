(function () {

enyo.kind({
  name: 'k2e.settings.SettingsItem',
  kind: 'FittableColumns',
  classes: 'onyx-toolbar-inline k2e-settings-item',
  published: {
    label: '',
    disabled: false
  },
  components: [
    {name: 'label', kind: 'Control'}
  ],
  bindings: [
    { from: '.label', to: '.$.label.content' }
  ],
  disabledChanged: function () {
    this.$.label.addRemoveClass('k2e-settings-item-label-disabled', this.disabled);
  },
  create: function () {
    this.inherited(arguments);
    this.disabledChanged();
  }
});

})();
