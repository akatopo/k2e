(function () {

enyo.kind({
  name: 'k2e.settings.SettingsRadioGroup',
  kind: 'enyo.Control',
  published: {
    value: undefined,
    disabled: false
  },
  handleActivate,
  valueChanged,
  disabledChanged,
  build,
  create,
  rendered
});

/////////////////////////////////////////////////////////////

function handleActivate(inSender, inEvent) {
  if (!inEvent.originator.getActive()) {
    return true;
  }

  this.set('value', inEvent.originator.getContent());
  return true;
}

function valueChanged() {
  let found = this.getComponents().filter((c) => {
    return c.kind === 'onyx.RadioButton';
  })
  .some((component) => {
    if (component.getContent() === this.value) {
      component.setActive(true);
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
  this.getComponents().filter((c) => {
    return c.kind === 'onyx.RadioButton';
  })
  .forEach((component) => {
    component.setDisabled(this.disabled);
  });
}

function build() {
  this.destroyComponents();
  this.createComponent({name: 'group', kind: 'onyx.RadioGroup',
    onActivate: 'handleActivate', components: this.items});
  this.render();
  this.valueChanged();
}

function create() {
  this.inherited(arguments);
  this.createComponent({name: 'group', kind: 'onyx.RadioGroup',
    onActivate: 'handleActivate', components: this.items});
}

function rendered() {
  this.inherited(arguments);
  this.valueChanged();
}

})();
