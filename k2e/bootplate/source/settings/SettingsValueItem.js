/* global k2e */

(function () {

enyo.kind({
  name: 'k2e.settings.SettingsValueItem',
  kind: 'k2e.settings.SettingsItem',
  published: {
    value: ''
  },
  events: {
    onSettingChanged: ''
  },
  handlers: {
    onInputValueChanged: 'handleInputValueChanged'
  },
  bindings: [
    { from: '.disabled', to: '.$.input.disabled' }
  ],
  defaultInputKind: 'onyx.Checkbox',
  inputComponent: null,
  getValue: getValue,
  valueChanged: valueChanged,
  handleInputValueChanged: handleInputValueChanged,
  create: create
});

/////////////////////////////////////////////////////////////

function getValue() {
  return this.$.input.getValue();
}

function valueChanged() {
  this.log(this);
  this.$.input.setValue(this.value);
}

function handleInputValueChanged(inSender, inEvent) {
  this.doSettingChanged({ newValue: inEvent.newValue });
  return true;
}

function create() {
  var settings = new k2e.settings.SettingsSingleton();
  this.inherited(arguments);

  this.createComponent({fit: true});
  if (this.inputComponent) {
    this.inputComponent.name = 'input';
    this.createComponent(this.inputComponent);
  }
  else {
    this.createComponent({name: 'input', kind: this.defaultInputKind});
  }

  this.value = settings.getSetting(this.getName());
  this.valueChanged();
}

})();
