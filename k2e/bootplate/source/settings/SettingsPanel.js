/* global k2e:false */

(function () {

enyo.kind({
  name: 'k2e.settings.SettingsPanel',
  kind: 'enyo.Control',
  classes: 'k2e-settings-panel',
  handlers: {
    onSettingChanged: 'handleSettingChanged',
  },
  events: {
    onFullscreenRequest: '',
  },
  cookieModel: undefined,
  components: [
    { name: 'settingsPopup', kind: 'k2e.ProgressPopup' },
    { kind: 'k2e.Accordion', components: [
      { content: 'Appearance', components: [
        { kind: 'onyx.Groupbox', components: [
          { name: 'themeName', kind: 'k2e.settings.SettingsValueItem',
            inputComponent: { kind: 'k2e.settings.SettingsThemeRadioGroup' }, label: 'Theme' },
          { name: 'font', kind: 'k2e.settings.SettingsValueItem',
            inputComponent: { kind: 'k2e.settings.SettingsFontRadioGroup' }, label: 'Font' },
          { name: 'fontSize', kind: 'k2e.settings.SettingsValueItem',
            inputComponent: { kind: 'k2e.settings.SettingsFontSizeSlider' }, label: 'Font Size' },
          { name: 'textMargin', kind: 'k2e.settings.SettingsValueItem',
            inputComponent: { kind: 'k2e.settings.SettingsTextMarginSlider' },
            label: 'Text Margin' },
          { name: 'fullscreen', kind: 'k2e.settings.SettingsActionItem', label: 'Fullscreen',
            buttonLabel: 'Toggle', onActivated: 'handleToggleFullscreenActivated' },
        ] },
      ] },
      // {content: 'Export', components: [
      //   {kind: 'onyx.Groupbox', components: [
      //     {name: 'ignoredTitleList', kind: 'k2e.settings.SettingsValueItem',
      //       defaultInputKind: 'k2e.settings.SettingsTextInput', label: 'Titles to Ignore'}
      //   ]}
      // ]},
      // {content: 'Article Extraction', components: [
      //   {kind: 'onyx.Groupbox', components: [
      //     {name: 'articleExtraction', kind: 'k2e.settings.SettingsValueItem', defaultInputKind: 'onyx.ToggleButton',
      //       label: 'Periodical Article Extraction', onSettingChanged: 'handleExtractionSettingChanged'},
      //     {name: 'periodicalTitleList', kind: 'k2e.settings.SettingsValueItem', inputComponent: {kind: 'k2e.settings.SettingsTextInput'},
      //       label: 'Periodical titles', disabled: !(new k2e.settings.SettingsSingleton()).getSetting('articleExtraction')},
      //     {name: 'googleSearchApiKey', kind: 'k2e.settings.SettingsValueItem',
      //       inputComponent: {kind: 'k2e.settings.SettingsTextInput', type: 'password'},
      //       label: 'Google Search Api Key', disabled: !(new k2e.settings.SettingsSingleton()).getSetting('articleExtraction')},
      //     {name: 'googleSearchApiCx', kind: 'k2e.settings.SettingsValueItem', defaultInputKind: 'k2e.settings.SettingsTextInput',
      //       label: 'Google Search Api Cx', disabled: !(new k2e.settings.SettingsSingleton()).getSetting('articleExtraction')},
      //     {name: 'googleSearchApiLoc', kind: 'k2e.settings.SettingsValueItem', defaultInputKind: 'k2e.settings.SettingsTextInput',
      //       label: 'Google Search Api Url', disabled: !(new k2e.settings.SettingsSingleton()).getSetting('articleExtraction')}
      //   ]}
      // ]},
      { content: 'Local Storage', components: [
        { kind: 'onyx.Groupbox', components: [
          { name: 'clearSettings', kind: 'k2e.settings.SettingsActionItem',
            label: 'Restore Default Settings', buttonLabel: 'Restore',
            onActivated: 'restoreDefaults' }, //,
          // {name: 'clearCache', kind: 'k2e.settings.SettingsActionItem', label: 'Clear Cache',
          //   buttonLabel: 'Clear', onActivated: 'clearCache' },
          // {name: 'exportSettings', kind: 'k2e.settings.SettingsActionItem', label: 'Export Settings',
          //   buttonLabel: 'Export', onActivated: 'exportSettings'},
          // {name: 'importSettings', kind: 'k2e.settings.SettingsActionItem', label: 'Import Settings',
          //   buttonLabel: 'Import', onActivated: 'importSettings'}
        ] },
      ] },
      { content: 'Permissions', components: [
        { kind: 'onyx.Groupbox', components: [
          { name: 'revokeEvernotePermissions',
            kind: 'k2e.settings.RevokeEvernotePermissionsActionItem',
            onActivated: 'revokeEvernotePermissions' },
        ] },
      ] },
    ] },
  ],
  bindings: [
    { from: '.cookieModel', to: '.$.revokeEvernotePermissions.cookieModel' },
  ],
  handleSettingChanged,
  handleExtractionSettingChanged,
  handleToggleFullscreenActivated() { this.doFullscreenRequest(); },
  revokeEvernotePermissions,
  restoreDefaults,
  importSettings() { this.log('Import settings'); },
  exportSettings() { this.log('Export settings'); },
  clearCache() { this.log('clear cache'); },
});

/////////////////////////////////////////////////////////////

function handleSettingChanged(inSender, inEvent) {
  const settingsItem = inEvent.originator;
  const value = inEvent.newValue || settingsItem.getValue();
  const name = settingsItem.getName();

  this.log(settingsItem.getValue());
  this.log(settingsItem.getName());


  new k2e.settings.SettingsSingleton().setSetting(name, value);

  return true;
}

function handleExtractionSettingChanged(inSender, inEvent) {
  if (this.$.periodicalTitleList &&
      this.$.googleSearchApiKey &&
      this.$.googleSearchApiCx &&
      this.$.googleSearchApiLoc
  ) {
    this.$.periodicalTitleList.setDisabled(!inEvent.originator.getValue());
    this.$.googleSearchApiKey.setDisabled(!inEvent.originator.getValue());
    this.$.googleSearchApiCx.setDisabled(!inEvent.originator.getValue());
    this.$.googleSearchApiLoc.setDisabled(!inEvent.originator.getValue());
  }
}

function revokeEvernotePermissions(/*inSender, inEvent*/) {
  this.$.settingsPopup.begin('Revoking permissions...');

  const loc = `${location.protocol}//${location.host}${k2e.Constants.REVOKE_PATH}`;
  const ajax = new enyo.Ajax({
    url: loc,
    contentType: 'application/json',
    method: 'POST',
  });
  ajax.go();

  ajax.response(this.$.settingsPopup, processResponse);
  ajax.error(this.$.settingsPopup, processError);

  const cookieModel = this.cookieModel;
  function processResponse(/*inSender, inEvent*/) {
    cookieModel.fetch();
    cookieModel.set(k2e.Constants.ACCESS_TOKEN_COOKIE_NAME, undefined);
    cookieModel.set(k2e.Constants.CONSUMER_PUBLIC_KEY_COOKIE_NAME, undefined);
    cookieModel.commit();
    this.done('Permissions revoked successfully');
  }

  function processError(/*inSender, inEvent*/) {
    this.failed('Revocation failed');
  }
}

function restoreDefaults() {
  this.log('restore defaults');

  localStorage.clear();

  const settings = new k2e.settings.SettingsSingleton();
  const defaultsMap = settings.defaultSettings;

  Object.keys(defaultsMap)
    .filter((key) => ({}.hasOwnProperty.call(this.$, key)))
    .forEach((key) => {
      this.$[key].setValue(settings.getDefaultSetting(key));
      this.$[key].valueChanged();
    });

}

})();
