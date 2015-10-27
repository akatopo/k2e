(function () {

enyo.kind({
  name: 'k2e.settings.SettingsTextMarginSlider',
  kind: 'Control',
  style: 'width: 200px',
  published: {
    value: 20,
    disabled: false
  },
  events: {
    onInputValueChanged: '',
    onTextMarginChanged: ''
  },
  components: [
    {name: 'slider', kind: 'onyx.Slider', min: 10, max: 40, value: 20, increment: 10,
      onChanging: 'handleSliderValueChanged', onChange: 'handleSliderValueChanged'}
  ],
  valueChanged: function () {
    this.$.slider.setValue(this.value);
    this.doInputValueChanged();
    this.doTextMarginChanged();
  },
  getValue: function () {
    return this.value;
  },
  handleSliderValueChanged: function (inSender, inEvent) {
    var previous = this.value;
    this.value = this.$.slider.getValue();
    this.doInputValueChanged();
    this.doTextMarginChanged({ previous: previous, current: this.value });
  }
});

})();
