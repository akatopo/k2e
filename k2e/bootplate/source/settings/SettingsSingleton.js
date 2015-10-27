/* global k2e */

(function (settings) {

settings.SettingsSingleton = SettingsSingleton;

function SettingsSingleton() {
  if (arguments.callee.singletonInstance) {
    return arguments.callee.singletonInstance;
  }

  var storage = window.localStorage;
  var self = this;
  var settingExists = function (settingName) {
    return !!self.defaultSettings[settingName];
  };
  arguments.callee.singletonInstance = this;

  this.defaultSettings = enyo.clone(k2e.settings.DefaultSettings.settings);

  this.setSetting = function (settingName, settingValue) {
    if (settingExists(settingName)) {
      if (storage) {
        storage[settingName] = settingValue;
      }
    }
  };

  this.getSetting = function (settingName) {
    if (!settingExists(settingName)) {
      return null;
    }

    var settingValue = storage && storage[settingName] ?
      JSON.parse(storage[settingName]) :
      JSON.parse(this.defaultSettings[settingName]);
    return settingValue;
  };

  this.getDefaultSetting = function (settingName) {
    if (settingExists(settingName)) {
      var settingValue = JSON.parse(this.defaultSettings[settingName]);
      return settingValue;
    }
    return null;
  };
}

})(k2e.settings);
