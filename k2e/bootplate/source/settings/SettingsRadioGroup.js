(function () {

enyo.kind({
  name: 'k2e.settings.SettingsRadioGroup',
  kind: 'enyo.Control',
  published: {
    value: undefined,
    disabled: false,
  },
  handleActivate,
  valueChanged,
  disabledChanged,
  build,
  create,
  rendered,
});

/////////////////////////////////////////////////////////////

function handleActivate(inSender, inEvent) {
  if (!inEvent.originator.getActive()) {
    return true;
  }

  this.set('value', inEvent.originator.get('key'));
  return true;
}

function valueChanged() {
  const found = this.getComponents()
    .filter((c) => c.kind === 'k2e.KeyedRadioButton')
    .some((component) => {
      if (component.get('key') === this.value) {
        component.setActive(true);
        return true;
      }
      return false;
    });

  if (found) {
    return true;
  }
  else if (this.$.group.getActive()) {
    this.value = this.$.group.getActive().get('key');
  }
  else {
    this.value = '';
    this.warn('no active group element');
  }

  this.log(this.value);
  return undefined;
}

function disabledChanged() {
  this.getComponents()
    .filter((c) => c.kind === 'k2e.KeyedRadioButton')
    .forEach((component) => { component.setDisabled(this.disabled); });
}

function build() {
  this.destroyComponents();
  this.createComponent({ name: 'group', kind: 'onyx.RadioGroup',
    onActivate: 'handleActivate', components: this.items });
  this.render();
  this.valueChanged();
}

function create() {
  this.inherited(arguments);
  this.createComponent({ name: 'group', kind: 'onyx.RadioGroup',
    onActivate: 'handleActivate', components: this.items });
}

function rendered() {
  this.inherited(arguments);
  this.valueChanged();
}

})();
