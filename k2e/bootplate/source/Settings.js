enyo.kind({
    name: "DefaultSettings",
    kind: enyo.Object,
    published: {
        themeName: '"Dark"',
        ignoredTitleList: '""',
        articleExtraction: "false",
        periodicalTitleList: '""',
        googleSearchApiKey: '""',
        googleSearchApiCx: '""',
        googleSearchApiLoc: '"https://www.googleapis.com/customsearch/v1?"'
    }
});

function SettingsSingleton() {

    if (arguments.callee.singletonInstance) {
        return arguments.callee.singletonInstance;
    }
    arguments.callee.singletonInstance = this;

    this.defaultSettings = new DefaultSettings();

    var self = this,
        settingExists = function (settingName) {
            if (self.defaultSettings[settingName]) {
                return true;
            }
            return false;
        };

    this.getSetting = function (settingName) {
        if (!settingExists(settingName)) {
            return null;
        }

        var settingValue = localStorage[settingName] ?
                JSON.parse(localStorage[settingName]) :
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

function SettingsSingletonInstance() {
    var instance = new SettingsSingleton();
    return instance;
}
