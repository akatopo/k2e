/* global k2e, Typekit */

(function (Constants, typekitPromise) {

enyo.kind({
  name: 'k2e.settings.SettingsFontRadioGroup',
  kind: 'Control',
  published: {
    value: '',
    disabled: false
  },
  events: {
    onFontChanged: ''
  },
  bindings: [
    { from: 'value', to: '.$.group.value', oneWay: false },
    { from: '.disabled', to: '.$.group.disabled' }
  ],
  components: [
    {name: 'group', kind: 'k2e.settings.SettingsRadioGroup', items: Constants.FONT_INFO.map((font) => {
      return Array.isArray(font) ? font[0] : font;
    }).map(
      (font) => { return { content: font.name }; }
    )}
  ],
  valueChanged,
  rendered
});

/////////////////////////////////////////////////////////////

function valueChanged() {
  this.doFontChanged({ name: this.value });
}

function rendered() {
  this.inherited(arguments);
  let detector = createFontDetector();

  typekitPromise.then(() => {
    // potentially change font options here, since typekit loading suceeded
    this.$.group.items = Constants.FONT_INFO.map((font) => {
      let fonts = Array.isArray(font) ? font : [font];

      return fonts.filter((font) => { return detector.detect(font.family); });
    })
    .filter((fonts) => {
      return fonts.length;
    })
    .map((font) => {
      return { content: font[0].name };
    });
    this.log(this.$.group.items);
    this.$.group.build();
  }, () => {
    this.warn('potentially change font options here, since typekit loading failed');
  });
  this.doFontChanged({ name: this.value });
}

/**
 * Checks if a font is available to be used on a web page.
 *
 * @param {String} fontName The name of the font to check
 * @return {Boolean}
 * @license MIT
 * @copyright Sam Clarke 2013
 * @author Sam Clarke <sam@samclarke.com>
 */
function createFontDetector() {
  let calculateWidth;
  let monoWidth;
  let serifWidth;
  let sansWidth;
  let width;
  let body          = document.body;
  let container     = document.createElement('div');
  let containerCss  = [
      'position:absolute',
      'width:auto',
      'font-size:128px',
      'left:-99999px'
  ];

  // Create a span element to contain the test text.
  // Use innerHTML instead of createElement as it's smaller
  container.innerHTML = '<span style="' + containerCss.join(' !important;') + '">' +
      Array(100).join('wi') +
  '</span>';
  container = container.firstChild;

  calculateWidth = function (fontFamily) {
    container.style.fontFamily = fontFamily;

    body.appendChild(container);
    width = container.clientWidth;
    body.removeChild(container);

    return width;
  };

  // Pre calculate the widths of monospace, serif & sans-serif
  // to improve performance.
  monoWidth  = calculateWidth('monospace');
  serifWidth = calculateWidth('serif');
  sansWidth  = calculateWidth('sans-serif');

  return {
    detect(fontName) {
      return monoWidth !== calculateWidth(fontName + ',monospace') ||
        sansWidth !== calculateWidth(fontName + ',sans-serif') ||
        serifWidth !== calculateWidth(fontName + ',serif');
    }
  };
}

})(k2e.Constants, Typekit.promise);
