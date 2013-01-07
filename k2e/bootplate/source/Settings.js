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

    if (arguments.callee._singletonInstance) {
        return arguments.callee._singletonInstance;
    }
    arguments.callee._singletonInstance = this;

    this.defaultSettings = new DefaultSettings();

    var self = this;
    var settingExists = function (settingName) {
        if (self.defaultSettings[settingName]) {
            return true;
        }
        else {
            return false;
        }
    };

    this.getSetting = function (settingName) {
        if (!settingExists(settingName)) {
            return null;
        }

        var settingValue = localStorage[settingName]?
                JSON.parse(localStorage[settingName]):
                JSON.parse(this.defaultSettings[settingName]);
        return settingValue;
    };

    this.getDefaultSetting = function (settingName) {
        if (!settingExists(settingName)) {
            return null;
        }

        var settingValue = JSON.parse(this.defaultSettings[settingName]);
        return settingValue;
    };
}

function SettingsSingletonInstance() {
    var instance = new SettingsSingleton();
    return instance;
}
