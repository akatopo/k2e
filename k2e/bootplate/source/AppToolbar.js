(function () {

enyo.kind({
  name: 'k2e.AppToolbar',
  kind: 'onyx.Toolbar',
  published: {
    form: 'long',
    canExport: true,
    multiSelection: false,
  },
  bindings: [
    { from: '.form', to: '.$.exportButton.form' },
    { from: '.canExport', to: '.$.exportButton.disabled',
      transform: (canExport) => !canExport },
  ],
  events: {
    onExportRequested: '',
    onSettingsToggled: '',
  },
  layoutKind: 'FittableColumnsLayout',
  components: [
    { name: 'settingsButton', kind: 'onyx.Button',
      classes: 'k2e-icon-button', ontap: 'toggleSettings', components: [
        { tag: 'i', classes: 'icon-menu icon-large' },
      ] },
    { content: 'k2e', fit: true },
    { name: 'exportButton', kind: 'k2e.ExportButton', ontap: 'doExportRequested' },
  ],
  multiSelectionChanged,
  toggleSettings,
});

/////////////////////////////////////////////////////////////

function multiSelectionChanged(old, multiSelectionActive) {
  const exportButton = this.$.exportButton;

  this.set('canExport', !multiSelectionActive);
  exportButton.set('exportSelected', multiSelectionActive);
  this.reflow();
}

function toggleSettings() {
  const settingsButton = this.$.settingsButton;
  const active = !settingsButton.hasClass('active');
  settingsButton.addRemoveClass('active', active);
  this.doSettingsToggled({ active });
}

})();
