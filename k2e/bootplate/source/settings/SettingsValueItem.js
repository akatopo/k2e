/* global k2e */

(function () {

enyo.kind({
  name: 'k2e.settings.SettingsValueItem',
  kind: 'k2e.settings.SettingsItem',
  published: {
    value: '',
    defaultInputKind: 'onyx.Checkbox',
    inputComponent: null
  },
  events: {
    onSettingChanged: ''
  },
  bindings: [
    { from: '.disabled', to: '.$.input.disabled' },
    { from: '.value', to: '.$.input.value', oneWay: false }
  ],
  valueChanged,
  create
});

/////////////////////////////////////////////////////////////


function valueChanged() {
  this.log(this);
  this.doSettingChanged({ newValue: this.value });
}

function create() {
  let settings = new k2e.settings.SettingsSingleton();
  this.inherited(arguments);

  this.createComponent({fit: true});
  if (this.inputComponent) {
    this.inputComponent.name = 'input';
    this.createComponent(this.inputComponent);
  }
  else {
    this.createComponent({name: 'input', kind: this.defaultInputKind});
  }

  this.set('value', settings.getSetting(this.name));
}

})();
