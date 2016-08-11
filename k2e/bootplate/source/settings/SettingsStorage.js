/* global k2e:false */

(function () {

const storage = window.localStorage;
const defaultSettings = Object.freeze(
  enyo.clone(k2e.settings.DefaultSettings.settings)
);
const settingExists = (settingName) =>
  !!k2e.settings.SettingsStorage.defaultSettings[settingName];
const API = {
  setSetting,
  getSetting,
  getDefaultSetting,
  defaultSettings,
};

enyo.kind({
  name: 'k2e.settings.SettingsStorage',
  statics: API,
  constructor() {
    Object.keys(API).forEach((key) => {
      this[key] = API[key];
    });

    this.inherited(arguments);
  },
});

/////////////////////////////////////////////////////////////

function setSetting(settingName, settingValue) {
  if (settingExists(settingName) && storage) {
    storage[settingName] = JSON.stringify(settingValue);
  }
}

function getSetting(settingName) {
  if (!settingExists(settingName)) {
    return null;
  }

  const settingValue = storage && storage[settingName] ?
    JSON.parse(storage[settingName]) :
    JSON.parse(this.defaultSettings[settingName]);
  return settingValue;
}

function getDefaultSetting(settingName) {
  if (settingExists(settingName)) {
    const settingValue = JSON.parse(this.defaultSettings[settingName]);
    return settingValue;
  }
  return null;
}

})();
