/* global k2e */

(function (Constants) {

enyo.kind({
  name: 'k2e.settings.SettingsThemeRadioGroup',
  kind: 'Control',
  published: {
    value: '',
    disabled: false
  },
  events: {
    onThemeChanged: ''
  },
  bindings: [
    { from: '.value', to: '$.group.value', oneWay: false },
    { from: '.disabled', to: '$.group.disabled' }
  ],
  components: [
    {name: 'group', kind: 'k2e.settings.SettingsRadioGroup', items: Constants.THEME_INFO.map(
      (theme) => { return { content: theme.name }; }
    )}
  ],
  valueChanged,
  rendered
});

/////////////////////////////////////////////////////////////

function valueChanged() {
  this.doThemeChanged({ name: this.value });
}

function rendered() {
  this.inherited(arguments);
  this.doThemeChanged({ name: this.value });
}

})(k2e.Constants);
