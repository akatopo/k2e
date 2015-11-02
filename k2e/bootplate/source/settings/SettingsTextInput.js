(function () {

enyo.kind({
  name: 'k2e.settings.SettingsTextInput',
  published: {
    value: '',
    disabled: 'false',
    placeholder: '',
    type: ''
  },
  bindings: [
    { from: '.value', to: '.$.input.value', oneWay: false },
    { from: '.placeholder', to: '.$.input.placeholder' },
    { from: '.type', to: '.$.input.type' },
    { from: '.disabled', to: '.$.input.disabled' }
  ],
  components: [
    {kind: 'onyx.InputDecorator', classes: 'k2e-settings-text-input', alwaysLooksFocused: true, components: [
      {name: 'input', kind: 'onyx.Input', style: 'width: 100%'}
    ]}
  ]
});

})();
