(function () {

enyo.kind({
  name: 'k2e.settings.SettingsTextInput',
  published: {
    value: '',
    disabled: 'false',
    placeholder: '',
    type: ''
  },
  events: {
    onInputValueChanged: ''
  },
  handlers: {
    onchange: 'handleKeyUp',
    onkeyup: 'handleKeyUp',
    onkeypress: 'handleKeyPress',
    onkeydown: 'handleKeyDown'
  },
  components: [
    {kind: 'onyx.InputDecorator', classes: 'k2e-settings-text-input', alwaysLooksFocused: true, components: [
      {name: 'text', kind: 'onyx.Input', style: 'width: 100%'}
    ]}
  ],
  valueChanged: function () { this.$.text.setValue(this.value); },
  disabledChanged: function () { this.$.text.setDisabled(this.disabled); },
  placeholderChanged: function () { this.$.text.setPlaceholder(this.placeholder); },
  typeChanged: function () { this.$.text.setType(this.type); },
  getValue: function () { return this.$.text.getValue(); },
  handleKeyPress: function () { return true; },
  handleKeyDown: function () { return true; },
  handleKeyUp: handleKeyUp,
  create: create

});

/////////////////////////////////////////////////////////////

function handleKeyUp(inSender, inEvent) {
  this.value = this.getValue();
  this.doInputValueChanged();

  return true;
}

function create() {
  this.inherited(arguments);

  this.typeChanged();
  this.placeholderChanged();
}

})();
