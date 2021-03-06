/* global k2e:false, Velocity:false */

(function (Constants, Features, velocity) {

const THEME_CLASS_NAME_MAP = Constants.THEME_INFO
  .reduce((map, currentTheme) => {
    map[currentTheme.name] = currentTheme.class;
    return map;
  }, {});

const FONT_MAP = Constants.FONT_INFO
  .reduce((array, font) => {
    if (Array.isArray(font)) {
      array.push(...font);
    }
    else {
      array.push(font);
    }

    return array;
  }, [])
  .reduce((map, currentFont) => {
    map[currentFont.name] = currentFont;
    return map;
  }, {});

const DEFAULT_THEME_CLASS = Constants.THEME_INFO[0].class;
const DEFAULT_FONT_FAMILY = Constants.FONT_INFO[0].family;

enyo.kind({
  name: 'k2e.annotations.DocumentControl',
  kind: 'enyo.Control',
  isScrollingToTop: false,
  published: {
    fullscreen: false,
    document: undefined,
    fontSize: undefined,
    margin: undefined,
    theme: undefined,
    scrollingToTop: false,
  },
  events: {
    onFullscreenRequest: '',
    onDocumentScrolled: '',
  },
  handlers: {
    onScroll: 'handleScroll',
  },
  components: [
    { name: 'scroller', kind: 'enyo.Scroller',
      strategyKind: 'ScrollStrategy', classes: 'k2e-document-scroller full-height',
      components: [
        { name: 'documentView', kind: 'k2e.annotations.DocumentView' },
        { name: 'toggleFullscreenButton', kind: 'k2e.IconButton',
          classes: 'k2e-toggle-fullscreen-button k2e-hidden',
          ontap: 'handleFullscreenButtonTap', iconClasses: 'icon-resize-small icon-large' },
      ] },
  ],
  handleScroll,
  handleFullscreenButtonTap() { this.doFullscreenRequest(); },
  fullscreenChanged,
  documentChanged,
  fontSizeChanged,
  marginChanged,
  themeChanged,
  fontChanged,
  scrollingToTopChanged,
  create,
  rendered,
});

/////////////////////////////////////////////////////////////

function handleScroll(inSender, { scrollBounds }) {
  const isNotAtTop = scrollBounds.top !== 0;
  const isAtBottom = scrollBounds.top === scrollBounds.maxTop;

  this.doDocumentScrolled({
    isNotAtTop,
    isAtBottom,
    scrollBounds: Object.assign({}, scrollBounds) }
  );
}

function scrollingToTopChanged(oldValue, newValue) {
  const container = this.$.scroller.hasNode();
  const target = this.$.documentView.hasNode();
  if (!container || !target) {
    this.warn('DOM Node for container and/or scroll target does not exist');
    return;
  }
  if (!newValue) {
    return;
  }

  velocity(target, 'scroll', { container, duration: 1000 })
    .then(() => {
      const scrollBounds = this.$.scroller.getScrollBounds();
      this.doDocumentScrolled({ scrollBounds });
    })
    .catch(() => {})
    .then(() => {
      this.scrollingToTop = false;
    });
}

function fullscreenChanged() {
  this.$.scroller.addRemoveClass('k2e-fullscreen', this.fullscreen);
  this.$.toggleFullscreenButton.addRemoveClass('visible', this.fullscreen);
}

function documentChanged() {
  if (!this.document) {
    return;
  }

  const target = this.$.documentView.hasNode();
  if (target && this.isScrollingToTop) {
    velocity(target, 'stop');
  }

  this.$.documentView.displayDocument(this.document);
  this.$.scroller.setScrollTop(0);
  this.$.scroller.setScrollLeft(0);
}

function fontSizeChanged() {
  this.$.documentView.applyStyle('font-size', `${this.fontSize}%`);
}

function marginChanged(oldMargin) {
  this.$.documentView.removeClass(`k2e-document-view-padding-${oldMargin}`);
  this.$.documentView.addClass(`k2e-document-view-padding-${this.margin}`);
}

function themeChanged(oldTheme) {
  const oldThemeClass = THEME_CLASS_NAME_MAP[oldTheme] || DEFAULT_THEME_CLASS;
  const newThemeClass = THEME_CLASS_NAME_MAP[this.theme] || DEFAULT_THEME_CLASS;
  this.$.scroller.removeClass(oldThemeClass);
  this.$.scroller.addClass(newThemeClass);
}

function fontChanged(/*oldFont*/) {
  const fontFamily = FONT_MAP[this.font].family || DEFAULT_FONT_FAMILY;
  const fallback = FONT_MAP[this.font].fallback || 'serif';

  this.$.documentView.applyStyle('font-family', `'${fontFamily}', '${fallback}'`);
}

function create() {
  this.inherited(arguments);
  this.fullscreenChanged();
  this.documentChanged();
}

function rendered() {
  this.inherited(arguments);

  const settings = k2e.settings.SettingsStorage;
  const sizePercent = settings.getSetting('fontSize');
  const margin = settings.getSetting('textMargin');
  const theme = settings.getSetting('themeName');

  this.set('fontSize', sizePercent);
  this.set('margin', margin);
  this.set('theme', theme);

  Features.hasTouch().then(() => {
    this.$.scroller.addClass('has-touch');
  });
}

})(k2e.Constants, k2e.util.Features, Velocity);

