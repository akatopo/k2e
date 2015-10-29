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
  disabledChanged: disabledChanged,
  create: create
});

/////////////////////////////////////////////////////////////

function disabledChanged() {
  this.$.label.addRemoveClass('k2e-settings-item-label-disabled', this.disabled);
}

function create() {
  this.inherited(arguments);
  this.disabledChanged();
}

})();
