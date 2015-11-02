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
  handleActivate: handleActivate,
  valueChanged: valueChanged,
  disabledChanged: disabledChanged,
  create: create
});

/////////////////////////////////////////////////////////////

function handleActivate(inSender, inEvent) {
  if (inEvent.originator.getActive()) {
    this.log(inEvent.originator.getContent());
    this.set('value', inEvent.originator.getContent());
  }

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
    this.warn('no active group element');
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

function create() {
  this.inherited(arguments);

  this.disabledChanged();
}

})(k2e.Constants);
