/* global k2e */

(function (Constants) {

var THEME_CLASS_NAME_MAP = Constants.THEME_INFO.reduce(function (map, current) {
  map[current.name] = current.class;
  return map;
}, {});

var DEFAULT_THEME_CLASS = Constants.THEME_INFO[0].name;

enyo.kind({
  name: 'k2e.annotations.DocumentControl',
  kind: 'enyo.Control',
  published: {
    fullscreen: false,
    document: undefined,
    fontSize: undefined,
    margin: undefined,
    theme: undefined
  },
  events: {
    onFullscreenRequest: ''
  },
  handlers: {
    onScroll: 'handleScroll'
  },
  components: [
    {name: 'scroller', kind: 'enyo.Scroller', style: 'height: 100%', classes: 'k2e-document-scroller', components: [
      {name: 'documentView', kind: 'k2e.annotations.DocumentView'},
      {name: 'toggleFullscreenButton', classes: 'k2e-toggle-fullscreen-button k2e-icon-button k2e-hidden',
        ontap: 'handleFullscreenButtonTap', kind: 'onyx.Button', components: [
          {tag: 'i', classes: 'icon-resize-small icon-large'}
      ]},
      {name: 'toTopButton', kind: 'onyx.Button', classes: 'k2e-to-top-button k2e-icon-button k2e-hidden',
        ontap: 'scrollDocumentToTop', components: [
          {tag: 'i', classes: 'icon-chevron-up icon-large'}
      ]}
    ]}
  ],
  strategyKind: 'ScrollStrategy',
  handleScroll: handleScroll,
  handleFullscreenButtonTap: function () { this.doFullscreenRequest(); },
  scrollDocumentToTop: function () { this.$.scroller.scrollTo(0, 0); },
  fullscreenChanged: fullscreenChanged,
  documentChanged: documentChanged,
  fontSizeChanged: fontSizeChanged,
  marginChanged: marginChanged,
  themeChanged: themeChanged,
  create: create,
  rendered: rendered
});

/////////////////////////////////////////////////////////////

function handleScroll(inSender, inEvent) {
  var scrollBounds = this.$.scroller.getScrollBounds();
  var isNotAtTop = scrollBounds.top !== 0;

  this.$.toTopButton.addRemoveClass('visible', isNotAtTop);
}

function fullscreenChanged() {
  this.addRemoveClass('k2e-fullscreen', this.fullscreen);
  this.$.toggleFullscreenButton.addRemoveClass('visible', this.fullscreen);
}

function documentChanged() {
  if (!this.document) {
    return;
  }

  this.$.documentView.displayDocument(this.document);
  this.$.scroller.setScrollTop(0);
  this.$.scroller.setScrollLeft(0);
}

function fontSizeChanged() {
  this.$.scroller.applyStyle('font-size', this.fontSize + '%');
}

function marginChanged(oldMargin) {
  this.$.documentView.removeClass('k2e-document-view-padding-' + oldMargin);
  this.$.documentView.addClass('k2e-document-view-padding-' + this.margin);
}

function themeChanged(oldTheme) {
  var oldThemeClass = THEME_CLASS_NAME_MAP[oldTheme] || DEFAULT_THEME_CLASS;
  var newThemeClass = THEME_CLASS_NAME_MAP[this.theme] || DEFAULT_THEME_CLASS;
  this.$.scroller.removeClass(oldThemeClass);
  this.$.scroller.addClass(newThemeClass);
}

function create() {
  this.inherited(arguments);
  this.fullscreenChanged();
  this.documentChanged();
}

function rendered() {
  this.inherited(arguments);

  var settings = new k2e.settings.SettingsSingleton();
  var sizePercent = settings.getSetting('fontSize');
  var margin = settings.getSetting('textMargin');
  var theme = settings.getSetting('themeName');

  this.set('fontSize', sizePercent);
  this.set('margin', margin);
  this.set('theme', theme);
}

})(k2e.Constants);

