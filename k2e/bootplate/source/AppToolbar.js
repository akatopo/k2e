/* global k2e:false */

(function () {

const THROTLE_INTERVAL = 200; // ms

const statics = {
  MAIN_TOOLBAR: 0,
  SEARCH_TOOLBAR: 1,
  MULTI_SELECT_TOOLBAR: 2,
  SELECTED_DOCUMENT_TOOLBAR: 3,
};

const validStateTransitions = {
  [statics.MAIN_TOOLBAR]: new Set([
    statics.SEARCH_TOOLBAR,
    statics.MULTI_SELECT_TOOLBAR,
    statics.SELECTED_DOCUMENT_TOOLBAR,
  ]),
  [statics.SEARCH_TOOLBAR]: new Set([
    statics.MULTI_SELECT_TOOLBAR,
    statics.SELECTED_DOCUMENT_TOOLBAR,
  ]),
  [statics.MULTI_SELECT_TOOLBAR]: new Set([
    statics.SELECTED_DOCUMENT_TOOLBAR,
  ]),
  [statics.SELECTED_DOCUMENT_TOOLBAR]: new Set(),
};

const popStateHandlers = {
  [statics.MAIN_TOOLBAR]() {},
  [statics.SEARCH_TOOLBAR]() {
    this.set('searchFilter', '');
  },
  [statics.MULTI_SELECT_TOOLBAR]() {
    const exportButton = this.$.multiSelectExportButton;

    this.set('canExport', true);
    this.set('selectedCount', 0);
    exportButton.set('exportSelected', false);
    this.$.multiSelectToolbar.reflow();
    this.doMultiSelectionToggled({ multiSelect: false });
  },
  [statics.SELECTED_DOCUMENT_TOOLBAR]() {},
};

const onStateHandlers = {
  [statics.MAIN_TOOLBAR]() {},
  [statics.SEARCH_TOOLBAR]() {
    window.setTimeout(() => this.$.input.focus());
  },
  [statics.MULTI_SELECT_TOOLBAR]() {
    const exportButton = this.$.multiSelectExportButton;

    this.set('canExport', false);
    this.set('selectedCount', 0);
    exportButton.set('exportSelected', true);
    this.$.multiSelectToolbar.reflow();
    this.doMultiSelectionToggled({ multiSelect: true });
  },
  [statics.SELECTED_DOCUMENT_TOOLBAR]() {},
};

enyo.kind({
  name: 'k2e.AppToolbar',
  kind: 'Panels',
  arrangerKind: 'CardArranger',
  classes: 'k2e-app-toolbar',
  statics,
  published: {
    form: 'long',
    canExport: true,
    selectedCount: 0,
    searchFilter: '',
    settingsButtonActive: false,
    selectedDocumentTitle: '',
  },
  currentState: statics.MAIN_TOOLBAR,
  stateStack: [],
  bindings: [
    { from: '.form', to: '.$.exportButton.form' },
    { from: '.form', to: '.$.multiSelectExportButton.form' },
    { from: '.canExport', to: '.$.exportButton.disabled',
      transform: (canExport) => !canExport },
    { from: '.canExport', to: '.$.multiSelectExportButton.disabled',
      transform: (canExport) => !canExport },
    { from: '.searchFilter', to: '.$.input.value' },
    { from: '.selectedCount', to: '.$.multiSelectLabel.content',
      transform: (selectedCount) => (
        (selectedCount > 0) ?
          `${selectedCount} document${selectedCount > 1 ? 's' : ''} selected` :
          'No documents selected'
      ) },
    { from: '.selectedDocumentTitle', to: '.$.documentLabel.content' },
  ],
  events: {
    onExportRequested: '',
    onSettingsToggled: '',
    onReloadClippingRequested: '',
    onMultiSelectionToggled: '',
  },
  handlers: {
    onTransitionStart: 'handleTransitionStart',
  },
  components: [
    { name: 'mainToolbar', kind: 'onyx.Toolbar', layoutKind: 'FittableColumnsLayout', components: [
      { name: 'settingsButton', kind: 'onyx.Button',
        classes: 'k2e-icon-button', ontap: 'toggleSettings', components: [
          { tag: 'i', classes: 'icon-menu icon-large' },
        ] },
      { content: 'Clippings', fit: true },
      { name: 'reloadClippingsButton', kind: 'onyx.Button', classes: 'k2e-icon-button',
        ontap: 'doReloadClippingRequested', components: [
          { tag: 'i', classes: 'icon-upload icon-large' },
        ] },
      { name: 'multiSelectButton', kind: 'onyx.Button', classes: 'k2e-icon-button',
        ontap: 'tryPushMultiSelectToolbar', components: [
          { tag: 'i', classes: 'icon-check icon-large' },
        ] },
      { name: 'searchButton', kind: 'onyx.Button',
        classes: 'k2e-icon-button', ontap: 'tryPushSearchToolbar', components: [
          { tag: 'i', classes: 'icon-search icon-large' },
        ] },
      { name: 'exportButton', kind: 'k2e.ExportButton', ontap: 'doExportRequested' },
    ] },
    { name: 'searchToolbar', kind: 'onyx.Toolbar',
      layoutKind: 'FittableColumnsLayout', components: [
        { kind: 'onyx.Button', classes: 'k2e-icon-button',
          ontap: 'popState', components: [
            { tag: 'i', classes: 'icon-left-big icon-large' },
          ] },
        { kind: 'onyx.InputDecorator', onkeydown: 'handleSearchKeydown',
          oninput: 'handleSearchInput', fit: true, components: [
            { name: 'input', kind: 'onyx.Input', style: 'width: 100%' },
          ] },
        { name: 'searchMultiSelectButton', kind: 'onyx.Button', classes: 'k2e-icon-button',
          ontap: 'tryPushMultiSelectToolbar', components: [
            { tag: 'i', classes: 'icon-check icon-large' },
          ] },
      ] },
    { name: 'multiSelectToolbar', kind: 'onyx.Toolbar',
      layoutKind: 'FittableColumnsLayout', components: [
        { kind: 'onyx.Button', classes: 'k2e-icon-button',
          ontap: 'popState', components: [
            { tag: 'i', classes: 'icon-left-big icon-large' },
          ] },
        { name: 'multiSelectLabel', content: '', fit: true },
        { name: 'multiSelectExportButton', kind: 'k2e.ExportButton', ontap: 'doExportRequested' },
      ] },
    { name: 'selectedDocumentToolbar', kind: 'onyx.Toolbar',
      layoutKind: 'FittableColumnsLayout', components: [
        { kind: 'onyx.Button', classes: 'k2e-icon-button',
          ontap: 'popState', components: [
            { tag: 'i', classes: 'icon-left-big icon-large' },
          ] },
        { name: 'documentLabel', content: '', classes: 'k2e-label-truncated', fit: true },
      ] },
  ],
  toggleSettings,
  tryPushState,
  tryPushMultiSelectToolbar() { return this.tryPushState(k2e.AppToolbar.MULTI_SELECT_TOOLBAR); },
  tryPushSearchToolbar() { return this.tryPushState(k2e.AppToolbar.SEARCH_TOOLBAR); },
  tryPushSelectedDocumentToolbar() {
    return this.tryPushState(k2e.AppToolbar.SELECTED_DOCUMENT_TOOLBAR);
  },
  popState,
  handleSearchInput,
  handleSearchKeydown,
  settingsButtonActiveChanged,
  rendered,
});

/////////////////////////////////////////////////////////////

function tryPushState(stateIndex) {
  if (
    validStateTransitions[this.currentState] &&
    validStateTransitions[this.currentState].has(stateIndex)
  ) {
    onStateHandlers[stateIndex].call(this);
    this.stateStack.push(this.currentState);
    this.set('index', stateIndex);
    this.currentState = stateIndex;
    return true;
  }
  return false;
}

function popState() {
  popStateHandlers[this.currentState].call(this);
  this.currentState = this.stateStack.pop();
  onStateHandlers[this.currentState].call(this);
  this.set('index', this.currentState);

  return this.currentState;
}

function handleSearchInput(inSender, inEvent) {
  enyo.job('k2e.AppToolbar.filterJob', () => {
    this.set('searchFilter', inEvent.originator.value);
  }, THROTLE_INTERVAL);

  return true;
}

function handleSearchKeydown(inSender, inEvent) {
  const modKeyPressed = inEvent.altKey ||
    inEvent.ctrlKey ||
    inEvent.shiftKey ||
    inEvent.altGraphKey ||
    inEvent.metaKey;

  if (modKeyPressed) {
    return undefined;
  }

  if (inEvent.keyCode === 27) { // esc
    if (this.currentState === k2e.AppToolbar.SEARCH_TOOLBAR) {
      this.popState();
    }
  }

  return true;
}

function toggleSettings(/*inSender, inEvent*/) {
  this.doSettingsToggled();
}

function settingsButtonActiveChanged(old, active) {
  const settingsButton = this.$.settingsButton;
  settingsButton.addRemoveClass('active', active);
}

function rendered() {
  this.inherited(arguments);
  const height = this.children[this.currentState].getComputedStyleValue('height', 0);
  this.applyStyle('height', height);
}

})();
