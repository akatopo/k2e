enyo.kind({
    name: "SettingsPanel",
    
    classes: "k2e-settings-panel",

    handlers: {
        onSettingChanged: "handleSettingChanged"
    },

    components: [
        {kind: "onyx.Groupbox", components: [
            {kind: "onyx.GroupboxHeader", content: "Appearance"},
            {name: "themeName", kind: "SettingsValueItem", inputComponent: 
                    { kind: "SettingsThemeRadioGroup" },
            label: "Theme"}

        ]},
        {kind: "onyx.Groupbox", components: [
            {kind: "onyx.GroupboxHeader", content: "Export"},
            {name: "ignoredTitleList", kind: "SettingsValueItem", defaultInputKind: "SettingsTextInput", label: "Titles to Ignore"},
        ]},
        {kind: "onyx.Groupbox", components: [
            {kind: "onyx.GroupboxHeader", content: "Article extraction"},
            {name: "articleExtraction", kind: "SettingsValueItem", defaultInputKind: "SettingsToggleButton", label: "Periodical Article Extraction",
                    onSettingChanged: "handleExtractionSettingChanged"},
            {name: "periodicalTitleList", kind: "SettingsValueItem", inputComponent: 
                    {kind: "SettingsTextInput"},
                    label: "Periodical tiles",
                    disabled: localStorage["articleExtraction"]?
                            !JSON.parse(localStorage["articleExtraction"]):!JSON.parse(new DefaultSettings().getArticleExtraction())},
            {name: "googleSearchApiKey", kind: "SettingsValueItem", defaultInputKind: "SettingsTextInput", label: "Google Search Api Key",
                    disabled: localStorage["articleExtraction"]?
                            !JSON.parse(localStorage["articleExtraction"]):!JSON.parse(new DefaultSettings().getArticleExtraction())},
            {name: "googleSearchApiCx", kind: "SettingsValueItem", defaultInputKind: "SettingsTextInput", label: "Google Search Api Cx",
                    disabled: localStorage["articleExtraction"]?
                            !JSON.parse(localStorage["articleExtraction"]):!JSON.parse(new DefaultSettings().getArticleExtraction())},
            {name: "googleSearchApiLoc", kind: "SettingsValueItem", defaultInputKind: "SettingsTextInput", label: "Google Search Api Url",
                    disabled: localStorage["articleExtraction"]?
                            !JSON.parse(localStorage["articleExtraction"]):!JSON.parse(new DefaultSettings().getArticleExtraction())}
        ]},
        {kind: "onyx.Groupbox", components: [
            {kind: "onyx.GroupboxHeader", content: "Local Storage"},
            {name: "clearSettings", kind: "SettingsActionItem", label: "Restore defaults", buttonLabel: "Restore" },
            {name: "clearCache", kind: "SettingsActionItem", label: "Clear Cache", buttonLabel: "Clear" }
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
        if (this.$.periodicalTitleList &&
                this.$.googleSearchApiKey &&
                this.$.googleSearchApiCx &&
                this.$.googleSearchApiLoc)
        {
            this.$.periodicalTitleList.setDisabled(!inEvent.originator.getValue());
            this.$.googleSearchApiKey.setDisabled(!inEvent.originator.getValue());
            this.$.googleSearchApiCx.setDisabled(!inEvent.originator.getValue());
            this.$.googleSearchApiLoc.setDisabled(!inEvent.originator.getValue());
        }
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
        label: "",
        disabled: false
    },

    components: [
        {name: "label", kind: "Control"}
    ],

    labelChanged: function() {
        this.$.label.setContent(this.label);
    },

    disabledChanged: function () {
        this.$.label.addRemoveClass("k2e-settings-item-label-disabled", this.disabled);
        //this.$.input.setDisabled(this.disabled);
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

    create: function() {
        this.inherited(arguments);
        this.createComponent({fit: true});
        this.createComponent({kind:"onyx.Button", classes: "onyx-red k2e-settings-action-item-button", content: this.buttonLabel});
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

    getValue: function() {
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
        }
        else {
            this.createComponent({name: "input", kind: this.defaultInputKind});    
        }
        
        if (localStorage[this.getName()]) {
            this.log(JSON.parse(localStorage[this.getName()]));
            this.value = JSON.parse(localStorage[this.getName()]);
        }
        else {
            var unparsed = new DefaultSettings()[this.getName()];
            this.value = JSON.parse(unparsed);
        }

        this.valueChanged();
    },

    rendered: function () {
        this.inherited(arguments);
        this.resized(); // hack to correct layout
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