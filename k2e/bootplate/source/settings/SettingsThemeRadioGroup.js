/* global k2e */

(function (Constants) {

enyo.kind({
  name: 'k2e.settings.SettingsThemeRadioGroup',
  kind: 'Control',
  published: {
    value: '',
    disabled: false
  },
  events: {
    onThemeChanged: ''
  },
  components: [
    {name: 'group', kind: 'onyx.RadioGroup', onActivate: 'handleActivate', components: Constants.THEME_INFO.map(
      function (theme) { return { content: theme.name }; }
    )}
  ],
  handleActivate,
  valueChanged,
  disabledChanged,
  create
});

/////////////////////////////////////////////////////////////

function handleActivate(inSender, inEvent) {
  if (!inEvent.originator.getActive()) {
    return;
  }

  let themeName = inEvent.originator.getContent();
  this.log(inEvent.originator.getContent());
  this.set('value', themeName);
  this.doThemeChanged({ name: themeName });

  return true;
}

function valueChanged() {
  let self = this;
  this.log(this.getComponents());

  let components = this.getComponents().slice(1);
  let found = components.some(function (component) {
    if (component.getContent() === self.value) {
      component.setActive(true);
      self.doThemeChanged({ name: self.value });

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
    this.warn('no active group element');
  }

  this.log(this.value);
}

function disabledChanged() {
  let self = this;
  let components = this.getComponents().slice(1);

  components.forEach(function (component) {
    component.setDisabled(self.disabled);
  });
}

function create() {
  this.inherited(arguments);

  this.disabledChanged();
}

})(k2e.Constants);
