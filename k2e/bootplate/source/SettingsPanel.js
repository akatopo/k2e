enyo.kind({
    name: "SettingsPanel",
    
    classes: "k2e-settings-panel",

    handlers: {
        onSettingChanged: "handleSettingChanged"
    },

    components: [
        {kind: "onyx.Groupbox", components: [
            {kind: "onyx.GroupboxHeader", content: "Appearance"},
            {name: "themeName", kind: "SettingsItem", defaultInputKind: "SettingsThemeRadioGroup", label: "Theme"}

        ]},
        {kind: "onyx.Groupbox", components: [
            {kind: "onyx.GroupboxHeader", content: "Export"},
            {name: "ignoredTitleList", kind: "SettingsItem", defaultInputKind: "SettingsTextInput", label: "Titles to ignore"},
        ]},
        {kind: "onyx.Groupbox", components: [
            {kind: "onyx.GroupboxHeader", content: "Article extraction"},
            {name: "articleExtraction", kind: "SettingsItem", defaultInputKind: "SettingsToggleButton", label: "Periodical article extraction"/*, onSettingChanged: "handleExtractionSettingChanged"*/},
            {name: "periodicalTitleList", kind: "SettingsItem", defaultInputKind: "SettingsTextInput", label: "Periodical tiles", disabled: localStorage["articleExtraction"]?!JSON.parse(localStorage["articleExtraction"]):true},
            {name: "googleSearchApiKey", kind: "SettingsItem", defaultInputKind: "SettingsTextInput", label: "Google Search Api Key", disabled: localStorage["articleExtraction"]?!JSON.parse(localStorage["articleExtraction"]):true},
            {name: "googleSearchApiCx", kind: "SettingsItem", defaultInputKind: "SettingsTextInput", label: "Google Search Api Cx", disabled: localStorage["articleExtraction"]?!JSON.parse(localStorage["articleExtraction"]):true},
            {name: "googleSearchApiLoc", kind: "SettingsItem", defaultInputKind: "SettingsTextInput", label: "Google Search Api Url", disabled: localStorage["articleExtraction"]?!JSON.parse(localStorage["articleExtraction"]):true}
        ]}
    ],

    defaultSettings: {
        themeName: "Dark",
        ignoredTitleList: "",
        articleExtraction: "false",
        periodicalTitleList: "",
        googleSearchApiKey: "",
        googleSearchApiCx: "",
        googleSearchApiLoc: ""
    },

    handleSettingChanged: function (inSender, inEvent) {
        var settingsItem = inEvent.originator;

        this.log(settingsItem.getValue());
        this.log(settingsItem.getName());
        localStorage[settingsItem.getName()] = JSON.stringify(settingsItem.getValue());
        return true;
    },

    handleExtractionSettingChanged: function (inSender, inEvent) {
        this.$.periodicalTitleList.setDisabled(!inEvent.originator.getValue());
        this.$.googleSearchApiKey.setDisabled(!inEvent.originator.getValue());
        this.$.googleSearchApiCx.setDisabled(!inEvent.originator.getValue());
        this.$.googleSearchApiLoc.setDisabled(!inEvent.originator.getValue());
    },

    create: function () {
        this.inherited(arguments);
        this.log("init now");
    }
});

enyo.kind({
    name: "SettingsItem",

    kind: "FittableColumns",

    classes: "onyx-toolbar-inline k2e-settings-item",


    published: {
        value: "",
        label: "",
        disabled: false
    },

    events: {
        onSettingChanged: ""
    },

    handlers: {
        onInputValueChanged: "handleInputValueChanged"
    },

    components: [
        {name: "label", kind: "Control"},
        {fit: true},
    ],

    defaultInputKind: "onyx.Checkbox",

    labelChanged: function() {
        this.$.label.setContent(this.label);
    },

    getValue: function() {
        return this.$.input.getValue();
    },

    valueChanged: function () {
        this.$.input.setValue(this.value);
    },

    disabledChanged: function () {
        this.$.label.addRemoveClass("k2e-settings-item-label-disabled", this.disabled);
        this.$.input.setDisabled(this.disabled);
    },

    handleInputValueChanged: function (inSender, inEvent) {
        this.doSettingChanged();
        return true;
    },

    create: function () {
        this.inherited(arguments);
        //this.createComponent({fit: true});
        this.createComponent({name: "input", kind: this.defaultInputKind});
        this.labelChanged();
        if (localStorage[this.getName()]) {
            this.log(JSON.parse(localStorage[this.getName()]));
            this.value = JSON.parse(localStorage[this.getName()]);
            this.valueChanged();
        }
        this.disabledChanged();
    }
});

enyo.kind({
    name: "SettingsTextInput",

    kind: "onyx.InputDecorator",

    style: "display: inline-block; margin: 0; width: 140px;",

    alwaysLooksFocused: true,

    published: {
        value: "",
        disabled: "false"
    },

    events: {
        onInputValueChanged: ""
    },

    handlers: {
        onkeyup: "handleKeyUp"
    },

    components: [
        {name: "text", kind: "onyx.Input", placeholder: "Enter text here"}
    ],

    valueChanged: function () {
        this.$.text.setValue(this.value);
    },

    disabledChanged: function () {
        this.$.text.setDisabled(this.disabled);
    },

    getValue: function () {
        return this.$.text.getValue();
    },

    handleKeyUp: function () {
        this.value = this.getValue();
        this.doInputValueChanged();
    }
});

enyo.kind({
    name: "SettingsToggleButton",

    kind: "onyx.ToggleButton",

    style: "float:right",

    events: {
        onInputValueChanged: ""
    },

    handlers: {
        onChange: "doInputValueChanged"
    }
});

enyo.kind({
    name: "SettingsThemeRadioGroup",
    
    kind: "Control",
    
    published: {
        value: "Dark",
        disabled: "false"
    },

    events: {
        onInputValueChanged: ""
    },

    components: [
        {name: "group", kind: "onyx.RadioGroup", onActivate: "handleActivate", components: [
            {name: "dark", content: "Dark", active: true},
            {name: "light", content: "Light"}
        ]}
    ],
    
    // Two events will be fired during initialization
    handleActivate: function (inSender, inEvent) {
        if (inEvent.originator.getActive()) {
            this.log(inEvent.originator.getContent());
            this.value = inEvent.originator.getContent();
        }

        this.doInputValueChanged();

        return true;
    },

    valueChanged: function () {
        this.log(this.getComponents());
        
        var comps = this.getComponents();
        for (var i = 1; i < comps.length; ++i) {
            if (comps[i].getContent() == this.value) {
                comps[i].setActive(true);
                this.doInputValueChanged();
                return true;
            }
        }

        // value not found
        if (this.$.group.getActive()) {
            this.value = this.$.group.getActive().getContent();
        }
        else {
            this.value = "";
        }

        this.log(this.value);
    },

    disabledChanged: function () {
        var comps = this.getComponents();
        for (var i = 1; i < comps.length; ++i) {
             comps[i].setDisabled(this.disabled);        
        }
    }


});