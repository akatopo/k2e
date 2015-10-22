/* global CookieSource, CookieModel, Cookies, SettingsSingleton, Constants */

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
        {name: "settings_popup", kind: "ProgressPopup"},
        {kind: "Accordion", components: [
            {content: "Appearance", components: [
                {kind: "onyx.Groupbox", components: [
                    {name: "themeName", kind: "SettingsValueItem",
                            inputComponent: { kind: "SettingsThemeRadioGroup" }, label: "Theme"},
                    {name: "fullscreen", kind: "SettingsActionItem", label: "Fullscreen", buttonLabel: "Toggle", ontap: "doFullscreenRequest"},
                    {name: "fontSize", kind: "SettingsValueItem", inputComponent: {kind: "SettingsFontSizeSlider"}, label: "Font Size"},
                    {name: "textMargin", kind: "SettingsValueItem", inputComponent: {kind: "SettingsTextMarginSlider"}, label: "Text Margin"}
                ]}
            ]},
            // {content: "Export", components: [
            //     {kind: "onyx.Groupbox", components: [
            //         {name: "ignoredTitleList", kind: "SettingsValueItem", defaultInputKind: "SettingsTextInput", label: "Titles to Ignore"}
            //     ]}
            // ]},
            // {content: "Article Extraction", components: [
            //     {kind: "onyx.Groupbox", components: [
            //         {name: "articleExtraction", kind: "SettingsValueItem", defaultInputKind: "SettingsToggleButton", label: "Periodical Article Extraction",
            //                 onSettingChanged: "handleExtractionSettingChanged"},
            //         {name: "periodicalTitleList", kind: "SettingsValueItem", inputComponent: {kind: "SettingsTextInput"},
            //                 label: "Periodical titles",
            //                 disabled: !(new SettingsSingleton()).getSetting("articleExtraction")},
            //         {name: "googleSearchApiKey", kind: "SettingsValueItem", inputComponent: {kind: "SettingsTextInput", type: "password"},
            //                 label: "Google Search Api Key",
            //                 disabled: !(new SettingsSingleton()).getSetting("articleExtraction")},
            //         {name: "googleSearchApiCx", kind: "SettingsValueItem", defaultInputKind: "SettingsTextInput", label: "Google Search Api Cx",
            //                 disabled: !(new SettingsSingleton()).getSetting("articleExtraction")},
            //         {name: "googleSearchApiLoc", kind: "SettingsValueItem", defaultInputKind: "SettingsTextInput", label: "Google Search Api Url",
            //                 disabled: !(new SettingsSingleton()).getSetting("articleExtraction")}
            //     ]}
            // ]},
            {content: "Local Storage", components: [
                {kind: "onyx.Groupbox", components: [
                    {name: "clearSettings", kind: "SettingsActionItem", label: "Restore Default Settings", buttonLabel: "Restore", onActivated: "restoreDefaults"},
                    // {name: "clearCache", kind: "SettingsActionItem", label: "Clear Cache", buttonLabel: "Clear", onActivated: "clearCache" },
                    // {name: "exportSettings", kind: "SettingsActionItem", label: "Export Settings", buttonLabel: "Export", onActivated: "exportSettings"},
                    // {name: "importSettings", kind: "SettingsActionItem", label: "Import Settings", buttonLabel: "Import", onActivated: "importSettings"}
                ]}
            ]},
            {content: "Permissions", components: [
                {
                    kind: "onyx.Groupbox",
                    components: [
                        {
                            name: "revokeEvernotePermissions",
                            kind: "SettingsActionItem",
                            classes: "k2e-settings-item-caution",
                            label: "Revoke Evernote permissions",
                            buttonLabel: "Revoke",
                            buttonClasses: "k2e-caution-button",
                            onActivated: "revokeEvernotePermissions",
                            cookieModel: undefined,
                            computed: [
                                {
                                    method: "disabledComputed",
                                    path: [
                                        "cookieModel",
                                        "modelDep1",
                                        "modelDep2"
                                    ]
                                }
                            ],
                            disabledComputed: function () {
                                return !(
                                    !!this.get("cookieModel." + Constants.CONSUMER_PUBLIC_KEY_COOKIE_NAME) &&
                                    !!this.get("cookieModel." + Constants.ACCESS_TOKEN_COOKIE_NAME)
                                );
                            },
                            bindings: [
                                { from: ".disabledComputed", to: ".disabled"},
                                { from: ".cookieModel." + Constants.CONSUMER_PUBLIC_KEY_COOKIE_NAME, to: ".modelDep1" },
                                { from: ".cookieModel." + Constants.ACCESS_TOKEN_COOKIE_NAME, to: ".modelDep2" }
                            ]
                        }
                    ]
                }
            ]}
        ]}
    ],

    bindings: [
        { from: ".cookieModel", to: ".$.revokeEvernotePermissions.cookieModel" }
    ],

    cookieModel: undefined,

    handleSettingChanged: function (inSender, inEvent) {
        var settingsItem = inEvent.originator,
            value = JSON.stringify(inEvent.newValue || settingsItem.getValue()),
            name = settingsItem.getName();

        this.log(settingsItem.getValue());
        this.log(settingsItem.getName());


        new SettingsSingleton().setSetting(name, value);

        return true;
    },

    handleExtractionSettingChanged: function (inSender, inEvent) {
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
    },

    revokeEvernotePermissions: function (inSender, inEvent) {
        this.$.settings_popup.begin("Revoking permissions...");

        var loc = location.protocol + '//' + location.host + Constants.REVOKE_PATH,
            ajax = new enyo.Ajax({
                url: loc,
                contentType: "application/json",
                method: "POST"
            });
        ajax.go();

        ajax.response(this.$.settings_popup, processResponse);
        ajax.error(this.$.settings_popup, processError);

        var cookieModel = this.cookieModel;
        function processResponse(inSender, inEvent) {
            cookieModel.fetch();
            cookieModel.set(Constants.ACCESS_TOKEN_COOKIE_NAME, undefined);
            cookieModel.set(Constants.CONSUMER_PUBLIC_KEY_COOKIE_NAME, undefined);
            cookieModel.commit();
            this.done("Permissions revoked successfully");
        }

        function processError(inSender, inEvent) {
            this.failed("Revocation failed");
        }
    },

    restoreDefaults: function () {
        this.log("restore defaults");

        localStorage.clear();

        var settings = new SettingsSingleton(),
            defaultsArray = settings.defaultSettings.published,
            key;

        for (key in defaultsArray) {
            if (defaultsArray.hasOwnProperty(key) && this.$.hasOwnProperty(key)) {
                this.$[key].setValue(settings.getDefaultSetting(key));
                this.$[key].valueChanged();
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

    bindings: [
        { from: ".label", to: ".$.label.content" }
    ],

    disabledChanged: function () {
        this.$.label.addRemoveClass("k2e-settings-item-label-disabled", this.disabled);
    },

    create: function () {
        this.inherited(arguments);
        this.disabledChanged();
    }
});

enyo.kind({
    name: "SettingsActionItem",

    kind: "SettingsItem",

    published: {
        buttonLabel: "",
        buttonClasses: "",
        disabled: false
    },

    events: {
        "onActivated": ""
    },

    bindings: [
        {from: ".disabled", to: ".$.button.disabled"},
        {from: ".buttonLabel", to: ".$.button.content"}
    ],

    create: function () {
        this.inherited(arguments);
        this.createComponent({fit: true});
        this.createComponent({
            name: "button",

            kind: "onyx.Button",

            classes: "k2e-settings-action-item-button " + this.getButtonClasses(),

            ontap: "doActivated"
        });
    },

    rendered: function () {
        this.inherited(arguments);
    }
});

enyo.kind({
    name: "SettingsValueItem",

    kind: "SettingsItem",

    published: {
        // disabled: false,
        value: ""
    },

    events: {
        onSettingChanged: ""
    },

    handlers: {
        onInputValueChanged: "handleInputValueChanged"
    },

    bindings: [
        { from: ".disabled", to: ".$.input.disabled" }
    ],

    defaultInputKind: "onyx.Checkbox",

    inputComponent: null,

    getValue: function () {
        return this.$.input.getValue();
    },

    valueChanged: function () {
        this.log(this);
        this.$.input.setValue(this.value);
    },

    // disabledChanged: function () {
    //     this.inherited(arguments);
    //     this.$.input.setDisabled(this.disabled);
    // },

    handleInputValueChanged: function (inSender, inEvent) {
        this.doSettingChanged({ newValue: inEvent.newValue });
        return true;
    },

    create: function () {
        var settings = new SettingsSingleton();
        this.inherited(arguments);

        this.createComponent({fit: true});
        if (this.inputComponent) {
            this.inputComponent.name = "input";
            this.createComponent(this.inputComponent);
        } else {
            this.createComponent({name: "input", kind: this.defaultInputKind});
        }

        this.value = settings.getSetting(this.getName());
        this.valueChanged();
    },

    rendered: function () {
        this.inherited(arguments);
    }
});

enyo.kind({
    name: "SettingsTextInput",

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
        {kind: "onyx.InputDecorator", classes: "k2e-settings-text-input", alwaysLooksFocused: true, components: [
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
        onInputValueChanged: "",
        onThemeChanged: ""
    },

    components: [
        {name: "group", kind: "onyx.RadioGroup", ontap: "handleActivate", components: [
            {name: "dark", content: "Dark"},
            {name: "light", content: "Light"},
            {name: "ponies", content: "OMG ponies"}
        ]}
    ],

    handleActivate: function (inSender, inEvent) {
        if (inEvent.originator.getActive()) {
            this.log(inEvent.originator.getContent());
            this.value = inEvent.originator.getContent();
        }

        this.doInputValueChanged();
        this.doThemeChanged();

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
                this.doThemeChanged();
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

enyo.kind({
    name: "SettingsFontSizeSlider",

    kind: "Control",

    style: "width: 200px",

    published: {
        value: 100,
        disabled: false
    },

    events: {
        onInputValueChanged: "",
        onFontSizeChanged: ""
    },

    getValue: function () {
        return this.value;
    },

    valueChanged: function () {
        this.doInputValueChanged({ newValue: this.value });
        this.doFontSizeChanged({ sizePercent: this.value });
    },

    bindings: [
        { from: ".value", to: "$.slider.value", oneWay: false }
    ],

    components: [
        {name: "slider", kind: "onyx.Slider", min: 40, max: 160, value: 100, increment: 20}
    ]
});

enyo.kind({
    name: "SettingsTextMarginSlider",

    kind: "Control",

    style: "width: 200px",

    published: {
        value: 20,
        disabled: false
    },

    events: {
        onInputValueChanged: "",
        onTextMarginChanged: ""
    },

    valueChanged: function () {
        this.$.slider.setValue(this.value);
        this.doInputValueChanged();
        this.doTextMarginChanged();
    },

    getValue: function () {
        return this.value;
    },

    handleSliderValueChanged: function (inSender, inEvent) {
        var previous = this.value;
        this.value = this.$.slider.getValue();
        this.doInputValueChanged();
        this.doTextMarginChanged({ previous: previous, current: this.value });
    },

    components: [
        {name: "slider", kind: "onyx.Slider", min: 10, max: 40, value: 20, increment: 10, onChanging: "handleSliderValueChanged", onChange: "handleSliderValueChanged"}
    ]
});
