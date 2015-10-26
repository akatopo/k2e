/* global k2e */

(function () {

enyo.kind({
  name: 'k2e.settings.DefaultSettings',
  kind: enyo.Object,
  published: {
    themeName: '"Dark"',
    fontSize: '100',
    textMargin: '"20"',
    ignoredTitleList: '""',
    articleExtraction: 'false',
    periodicalTitleList: '""',
    googleSearchApiKey: '""',
    googleSearchApiCx: '""',
    googleSearchApiLoc: '"https://www.googleapis.com/customsearch/v1?"'
  }
});

k2e.settings.SettingsSingleton = SettingsSingleton;

function SettingsSingleton() {
  if (arguments.callee.singletonInstance) {
    return arguments.callee.singletonInstance;
  }

  var storage = window.localStorage;
  var self = this;
  var settingExists = function (settingName) {
    if (self.defaultSettings[settingName]) {
      return true;
    }
    return false;
  };
  arguments.callee.singletonInstance = this;

  this.defaultSettings = new k2e.settings.DefaultSettings();

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

})();
