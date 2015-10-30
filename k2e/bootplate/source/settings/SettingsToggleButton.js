(function () {

enyo.kind({
  name: 'k2e.settings.SettingsToggleButton',
  kind: 'onyx.ToggleButton',
  style: 'float:right',
  events: {
    onInputValueChanged: ''
  },
  handlers: {
    onChange: 'handleChange'
  },
  handleChange: function () { this.doInputValueChanged(); }
});

})();
