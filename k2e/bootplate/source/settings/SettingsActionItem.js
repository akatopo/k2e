(function () {

enyo.kind({
  name: 'k2e.settings.SettingsActionItem',
  kind: 'k2e.settings.SettingsItem',
  published: {
    buttonLabel: '',
    buttonClasses: '',
    disabled: false,
  },
  events: {
    onActivated: '',
  },
  bindings: [
    { from: '.disabled', to: '.$.button.disabled' },
    { from: '.buttonLabel', to: '.$.buttonLabel.content' },
    { from: '.buttonClasses', to: '.$.button.classes', transform(classes) {
      return `k2e-settings-action-item-button onyx-button k2e-button ${classes}`;
    } },
  ],
  handleTap() { this.doActivated(); },
  create,
});

/////////////////////////////////////////////////////////////

function create() {
  this.inherited(arguments);

  this.createComponent({ fit: true });
  this.createComponent({
    name: 'button', kind: 'k2e.Button',
    ontap: 'handleTap', components: [
      { name: 'buttonLabel' },
    ] });
}

})();
