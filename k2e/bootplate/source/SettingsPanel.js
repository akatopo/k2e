enyo.kind({
    name: "SettingsPanel",

    kind: "enyo.Control",

    classes: "k2e-settings-panel",

    handlers: {
        onSettingChanged: "handleSettingChanged"
    },

    events: {
        onFullscreenRequest: ""
    },

    components: [
        {kind: "Accordion", components: [
            {content: "Appearance", components: [
                {kind: "onyx.Groupbox", components: [
                    {name: "themeName", kind: "SettingsValueItem",
                            inputComponent: { kind: "SettingsThemeRadioGroup" }, label: "Theme"},
                    {name: "fullscreen", kind: "SettingsActionItem", label: "Fullscreen", buttonLabel: "Toggle", ontap: "doFullscreenRequest"}
                ]}
            ]},
            {content: "Export", components: [
                {kind: "onyx.Groupbox", components: [
                    {name: "ignoredTitleList", kind: "SettingsValueItem", defaultInputKind: "SettingsTextInput", label: "Titles to Ignore"}
                ]}
            ]},
            {content: "Article Extraction", components: [
                {kind: "onyx.Groupbox", components: [
                    {name: "articleExtraction", kind: "SettingsValueItem", defaultInputKind: "SettingsToggleButton", label: "Periodical Article Extraction",
                            onSettingChanged: "handleExtractionSettingChanged"},
                    {name: "periodicalTitleList", kind: "SettingsValueItem", inputComponent: {kind: "SettingsTextInput"},
                            label: "Periodical tiles",
                            disabled: !SettingsSingletonInstance().getSetting("articleExtraction")},
                    {name: "googleSearchApiKey", kind: "SettingsValueItem", inputComponent: {kind: "SettingsTextInput", type: "password"},
                            label: "Google Search Api Key",
                            disabled: !SettingsSingletonInstance().getSetting("articleExtraction")},
                    {name: "googleSearchApiCx", kind: "SettingsValueItem", defaultInputKind: "SettingsTextInput", label: "Google Search Api Cx",
                            disabled: !SettingsSingletonInstance().getSetting("articleExtraction")},
                    {name: "googleSearchApiLoc", kind: "SettingsValueItem", defaultInputKind: "SettingsTextInput", label: "Google Search Api Url",
                            disabled: !SettingsSingletonInstance().getSetting("articleExtraction")}
                ]}
            ]},
            {content: "Local Storage", components: [
                {kind: "onyx.Groupbox", components: [
                    {name: "clearSettings", kind: "SettingsActionItem", label: "Restore defaults", buttonLabel: "Restore", ontap: "restoreDefaults"},
                    {name: "clearCache", kind: "SettingsActionItem", label: "Clear Cache", buttonLabel: "Clear", ontap: "clearCache" },
                    {name: "exportSettings", kind: "SettingsActionItem", label: "Export Settings", buttonLabel: "Export", ontap: "exportSettings"},
                    {name: "importSettings", kind: "SettingsActionItem", label: "import Settings", buttonLabel: "Import", ontap: "importSettings"}
                ]}
            ]}
        ]}
    ],

    handleSettingChanged: function (inSender, inEvent) {
        var settingsItem = inEvent.originator;

        this.log(settingsItem.getValue());
        this.log(settingsItem.getName());
        localStorage[settingsItem.getName()] = JSON.stringify(settingsItem.getValue());
        return true;
    },

    handleExtractionSettingChanged: function (inSender, inEvent) {
        if (this.$.periodicalTitleList
                && this.$.googleSearchApiKey
                && this.$.googleSearchApiCx
                && this.$.googleSearchApiLoc) {
            this.$.periodicalTitleList.setDisabled(!inEvent.originator.getValue());
            this.$.googleSearchApiKey.setDisabled(!inEvent.originator.getValue());
            this.$.googleSearchApiCx.setDisabled(!inEvent.originator.getValue());
            this.$.googleSearchApiLoc.setDisabled(!inEvent.originator.getValue());
        }
    },

    restoreDefaults: function () {
        this.log("restore defaults");

        localStorage.clear();

        var settings = SettingsSingletonInstance(),
            defaultsArray = settings.defaultSettings.published,
            key;

        for (key in defaultsArray) {
            if (defaultsArray.hasOwnProperty(key)) {
                this.$[key].setValue(settings.getDefaultSetting(key));
            }
        }
    },

    importSettings: function () {
        this.log("Import settings");
    },

    exportSettings: function () {
        this.log("Export settings");
    },

    clearCache: function () {
        this.log("clear cache");
    }
});

enyo.kind({
    name: "SettingsItem",

    kind: "FittableColumns",

    classes: "onyx-toolbar-inline k2e-settings-item",

    published: {
        label: "",
        disabled: false
    },

    components: [
        {name: "label", kind: "Control"}
    ],

    labelChanged: function () {
        this.$.label.setContent(this.label);
    },

    disabledChanged: function () {
        this.$.label.addRemoveClass("k2e-settings-item-label-disabled", this.disabled);
    },

    create: function () {
        this.inherited(arguments);
    },

    rendered: function () {
        this.inherited(arguments);
        this.labelChanged();
        this.disabledChanged();
    }
});

enyo.kind({
    name: "SettingsActionItem",

    kind: "SettingsItem",

    published: {
        buttonLabel: ""
    },

    buttonLabelChanged: function () {
        this.$.button.setContent(this.buttonLabel);
    },

    create: function () {
        this.inherited(arguments);
        this.createComponent({fit: true});
        this.createComponent({name: "button", kind: "onyx.Button", classes: "k2e-settings-action-item-button", content: this.buttonLabel});
    },

    rendered: function () {
        this.inherited(arguments);
        this.resized(); // hack to correct layout
    }
});

enyo.kind({
    name: "SettingsValueItem",

    kind: "SettingsItem",

    published: {
        value: ""
    },

    events: {
        onSettingChanged: ""
    },

    handlers: {
        onInputValueChanged: "handleInputValueChanged"
    },

    defaultInputKind: "onyx.Checkbox",

    inputComponent: null,

    getValue: function () {
        return this.$.input.getValue();
    },

    valueChanged: function () {
        this.log(this);
        this.$.input.setValue(this.value);
    },

    disabledChanged: function () {
        this.inherited(arguments);
        this.$.input.setDisabled(this.disabled);
    },

    handleInputValueChanged: function (inSender, inEvent) {
        this.doSettingChanged();
        return true;
    },

    create: function () {
        this.inherited(arguments);

        this.createComponent({fit: true});
        if (this.inputComponent) {
            this.inputComponent.name = "input";
            this.createComponent(this.inputComponent);
        } else {
            this.createComponent({name: "input", kind: this.defaultInputKind});
        }

        this.value = SettingsSingletonInstance().getSetting(this.getName());
        this.valueChanged();
    },

    rendered: function () {
        this.inherited(arguments);
        this.resized(); // hack to correct layout
    }
});

enyo.kind({
    name: "SettingsTextInput",

    //kind: "onyx.InputDecorator",

    //classes: "k2e-settings-text-input",

    //style: "display: inline-block; width: 140px;",

    published: {
        value: "",
        disabled: "false",
        placeholder: "",
        type: ""
    },

    events: {
        onInputValueChanged: ""
    },

    handlers: {
        onchange: "handleKeyUp",
        onkeyup: "handleKeyUp",
        onkeypress: "handleKeyPress",
        onkeydown: "handleKeyDown"
    },

    components: [
        {kind: "onyx.InputDecorator", style: "width: 140px", alwaysLooksFocused: true, components: [
            {name: "text", kind: "onyx.Input", style: "width: 100%"}
        ]}
    ],

    valueChanged: function () {
        this.$.text.setValue(this.value);
    },

    disabledChanged: function () {
        this.$.text.setDisabled(this.disabled);
    },

    placeholderChanged: function () {
        this.$.text.setPlaceholder(this.placeholder);
    },

    typeChanged: function () {
        this.$.text.setType(this.type);
    },

    getValue: function () {
        return this.$.text.getValue();
    },

    handleKeyUp: function (inSender, inEvent) {
        this.value = this.getValue();
        this.doInputValueChanged();
        return true;
    },

    handleKeyPress: function (inSender, inEvent) {
        return true;
    },

    handleKeyDown: function (inSender, inEvent) {
        return true;
    },

    create: function () {
        this.inherited(arguments);

        this.typeChanged();
        this.placeholderChanged();
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
        value: "",
        disabled: "false"
    },

    events: {
        onInputValueChanged: ""
    },

    components: [
        {name: "group", kind: "onyx.RadioGroup", ontap: "handleActivate", components: [
            {name: "dark", content: "Dark"},
            {name: "light", content: "Light"}
        ]}
    ],

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

        var comps = this.getComponents(),
            i;
        for (i = 1; i < comps.length; i += 1) {
            if (comps[i].getContent() === this.value) {
                comps[i].setActive(true);
                this.doInputValueChanged();
                return true;
            }
        }

        // value not found
        if (this.$.group.getActive()) {
            this.value = this.$.group.getActive().getContent();
        } else {
            this.value = "";
        }

        this.log(this.value);
    },

    disabledChanged: function () {
        var comps = this.getComponents(),
            i;
        for (i = 1; i < comps.length; i += 1) {
            comps[i].setDisabled(this.disabled);
        }
    }
});