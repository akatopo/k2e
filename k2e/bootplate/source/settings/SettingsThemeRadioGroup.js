(function () {

enyo.kind({
  name: 'k2e.settings.SettingsThemeRadioGroup',
  kind: 'Control',
  published: {
    value: '',
    disabled: 'false'
  },
  events: {
    onInputValueChanged: '',
    onThemeChanged: ''
  },
  components: [
    {name: 'group', kind: 'onyx.RadioGroup', ontap: 'handleActivate', components: [
      {name: 'dark', content: 'Dark'},
      {name: 'light', content: 'Light'},
      {name: 'ponies', content: 'OMG ponies'}
    ]}
  ],
  handleActivate: handleActivate,
  valueChanged: valueChanged,
  disabledChanged: disabledChanged

});

/////////////////////////////////////////////////////////////

function handleActivate(inSender, inEvent) {
  if (inEvent.originator.getActive()) {
    this.log(inEvent.originator.getContent());
    this.value = inEvent.originator.getContent();
  }

  this.doInputValueChanged();
  this.doThemeChanged();

  return true;
}

function valueChanged() {
  var self = this;
  this.log(this.getComponents());

  var components = this.getComponents().slice(1);
  var found = components.some(function (component) {
    if (component.getContent() === self.value) {
      component.setActive(true);
      self.doInputValueChanged();
      self.doThemeChanged();

      return true;
    }
  });

  if (found) {
    return true;
  }
  else if (this.$.group.getActive()) {
    this.value = this.$.group.getActive().getContent();
  }
  else {
    this.value = '';
  }

  this.log(this.value);
}

function disabledChanged() {
  var self = this;
  var components = this.getComponents().slice(1);

  components.forEach(function (component) {
    component.setDisabled(self.disabled);
  });
}

})();
