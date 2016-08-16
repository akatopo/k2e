(function () {

const MAIN_TOOLBAR_INDEX = 0;
const SEARCH_TOOLBAR_INDEX = 1;

const THROTLE_INTERVAL = 200; // ms

enyo.kind({
  name: 'k2e.AppToolbar',
  kind: 'Panels',
  arrangerKind: 'CardArranger',
  classes: 'k2e-app-toolbar',
  published: {
    form: 'long',
    canExport: true,
    multiSelection: false,
    searchFilter: '',
    settingsButtonActive: false,
  },
  bindings: [
    { from: '.form', to: '.$.exportButton.form' },
    { from: '.canExport', to: '.$.exportButton.disabled',
      transform: (canExport) => !canExport },
    { from: '.searchFilter', to: '.$.input.value' },
  ],
  events: {
    onExportRequested: '',
    onSettingsToggled: '',
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
      { content: 'k2e', fit: true },
      { name: 'searchButton', kind: 'onyx.Button',
        classes: 'k2e-icon-button', ontap: 'goToSearchToolbar', components: [
          { tag: 'i', classes: 'icon-search icon-large' },
        ] },
      { name: 'exportButton', kind: 'k2e.ExportButton', ontap: 'doExportRequested' },
    ] },
    { name: 'searchToolbar', kind: 'onyx.Toolbar',
      layoutKind: 'FittableColumnsLayout', components: [
        { kind: 'onyx.Button', classes: 'k2e-icon-button',
          ontap: 'dismissSearchToolbar', components: [
            { tag: 'i', classes: 'icon-left-big icon-large' },
          ] },
        { kind: 'onyx.InputDecorator', onkeydown: 'handleSearchKeydown',
          oninput: 'handleSearchInput', fit: true, components: [
            { name: 'input', kind: 'onyx.Input', style: 'width: 100%' },
          ] },
      ] },
  ],
  toggleSettings,
  dismissSearchToolbar,
  handleTransitionStart,
  handleSearchInput,
  handleSearchKeydown,
  goToMainToolbar,
  goToSearchToolbar,
  multiSelectionChanged,
  settingsButtonActiveChanged,
  rendered,
});

/////////////////////////////////////////////////////////////

function dismissSearchToolbar() {
  this.set('searchFilter', '');
  this.goToMainToolbar();
}

function goToMainToolbar() {
  this.set('index', MAIN_TOOLBAR_INDEX);
}

function goToSearchToolbar() {
  this.set('index', SEARCH_TOOLBAR_INDEX);
}

function handleTransitionStart(inSender, inEvent) {
  if (inEvent.toIndex === SEARCH_TOOLBAR_INDEX) {
    this.$.input.focus();
  }
  return true;
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
    this.dismissSearchToolbar();
  }

  return true;
}

function multiSelectionChanged(old, multiSelectionActive) {
  const exportButton = this.$.exportButton;

  this.set('canExport', !multiSelectionActive);
  exportButton.set('exportSelected', multiSelectionActive);
  this.$.mainToolbar.reflow();
}

function toggleSettings(/*inSender, inEvent*/) {
  const settingsButton = this.$.settingsButton;
  const active = !settingsButton.hasClass('active');
  this.set('settingsButtonActive', active);
}

function settingsButtonActiveChanged(old, active) {
  const settingsButton = this.$.settingsButton;
  settingsButton.addRemoveClass('active', active);
}

function rendered() {
  this.inherited(arguments);
  const height = this.children[0].getComputedStyleValue('height', 0);
  this.applyStyle('height', height);
}

})();
