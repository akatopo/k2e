/* global k2e:false */
/* eslint prefer-rest-params:0, no-caller: 0*/

(function (settings) {

settings.SettingsSingleton = SettingsSingleton;

// FIXME: this looks like a really bad idea/pattern
function SettingsSingleton() {
  if (arguments.callee.singletonInstance) {
    return arguments.callee.singletonInstance;
  }

  const storage = window.localStorage;
  const settingExists = (settingName) => !!this.defaultSettings[settingName];
  arguments.callee.singletonInstance = this;

  this.defaultSettings = enyo.clone(k2e.settings.DefaultSettings.settings);
  this.setSetting = setSetting;
  this.getSetting = getSetting;
  this.getDefaultSetting = getDefaultSetting;

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
}

})(k2e.settings);
