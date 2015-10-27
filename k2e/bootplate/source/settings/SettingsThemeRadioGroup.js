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
  handleActivate: function (inSender, inEvent) {
    if (inEvent.originator.getActive()) {
      this.log(inEvent.originator.getContent());
      this.value = inEvent.originator.getContent();
    }

    this.doInputValueChanged();
    this.doThemeChanged();

    return true;
  },
  valueChanged: function () {
    this.log(this.getComponents());

    var comps = this.getComponents();
    var i;
    for (i = 1; i < comps.length; i += 1) {
      if (comps[i].getContent() === this.value) {
        comps[i].setActive(true);
        this.doInputValueChanged();
        this.doThemeChanged();
        return true;
      }
    }

    // value not found
    if (this.$.group.getActive()) {
      this.value = this.$.group.getActive().getContent();
    }
    else {
      this.value = '';
    }


    this.log(this.value);
  },
  disabledChanged: function () {
    var comps = this.getComponents();
    var i;
    for (i = 1; i < comps.length; i += 1) {
      comps[i].setDisabled(this.disabled);
    }
  }
});

})();
