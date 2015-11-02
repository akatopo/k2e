(function () {

enyo.kind({
  name: 'k2e.settings.SettingsActionItem',
  kind: 'k2e.settings.SettingsItem',
  published: {
    buttonLabel: '',
    buttonClasses: '',
    disabled: false
  },
  events: {
    'onActivated': ''
  },
  bindings: [
    { from: '.disabled', to: '.$.button.disabled' },
    { from: '.buttonLabel', to: '.$.button.content' },
    { from: '.buttonClasses', to: '.$.button.classes', transform: function (classes) {
      return 'k2e-settings-action-item-button onyx-button ' + classes;
    }}
  ],
  handleTap: function () { this.doActivated(); },
  create: create
});

/////////////////////////////////////////////////////////////

function create() {
  this.inherited(arguments);

  this.createComponent({fit: true});
  this.createComponent({name: 'button', kind: 'onyx.Button', ontap: 'handleTap'});
}

})();
