(function () {

enyo.kind({
  name: 'k2e.settings.SettingsFontSizeSlider',
  kind: 'enyo.Control',
  classes: 'k2e-settings-item-slider',
  published: {
    value: 100,
    disabled: false,
  },
  events: {
    onInputValueChanged: '',
    onFontSizeChanged: '',
  },
  bindings: [
    { from: '.value', to: '$.slider.value', oneWay: false },
  ],
  components: [
    { name: 'slider', kind: 'onyx.Slider', min: 40, max: 160, increment: 20 },
  ],
  valueChanged() { this.doFontSizeChanged({ sizePercent: this.value }); },
});

})();
