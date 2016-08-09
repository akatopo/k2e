(function () {

enyo.kind({
  name: 'k2e.settings.SettingsTextMarginSlider',
  kind: 'enyo.Control',
  classes: 'k2e-settings-item-slider',
  published: {
    value: 20,
    disabled: false,
  },
  events: {
    onInputValueChanged: '',
    onTextMarginChanged: '',
  },
  bindings: [
    { from: '.value', to: '$.slider.value', oneWay: false },
  ],
  components: [
    { name: 'slider', kind: 'onyx.Slider', min: 10, max: 40, increment: 10 },
  ],
  valueChanged(oldValue) { this.doTextMarginChanged({ previous: oldValue, current: this.value }); },
});

})();
