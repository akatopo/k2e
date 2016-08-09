/* global k2e:false, Typekit:false */

(function (Constants, typekitPromise) {

enyo.kind({
  name: 'k2e.settings.SettingsFontRadioGroup',
  kind: 'Control',
  published: {
    value: '',
    disabled: false,
  },
  events: {
    onFontChanged: '',
  },
  bindings: [
    { from: 'value', to: '.$.group.value', oneWay: false },
    { from: '.disabled', to: '.$.group.disabled' },
  ],
  components: [
    { name: 'group', kind: 'k2e.settings.SettingsRadioGroup',
      items: Constants.FONT_INFO
        .map((font) => (Array.isArray(font) ? font[0] : font))
        .map((font) => ({ content: font.name })) },
  ],
  valueChanged,
  rendered,
});

/////////////////////////////////////////////////////////////

function valueChanged() {
  this.doFontChanged({ name: this.value });
}

function rendered() {
  this.inherited(arguments);
  const detector = createFontDetector();

  typekitPromise
    .then(
      rebuildFontGroup.bind(undefined, this),
      rebuildFontGroup.bind(undefined, this)
    );
  this.doFontChanged({ name: this.value });

  /////////////////////////////////////////////////////////////

  function rebuildFontGroup(component) {
    component.$.group.items = Constants.FONT_INFO
      .map((font) => {
        const fonts = Array.isArray(font) ? font : [font];

        return fonts.filter((f) => detector.detect(f.family));
      })
      .filter((fonts) => fonts.length)
      .map((font) => ({ content: font[0].name }));
    component.$.group.build();
  }
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
  let width;
  const body = document.body;
  let container = document.createElement('div');
  const containerCss = [
    'position:absolute',
    'width:auto',
    'font-size:128px',
    'left:-99999px',
  ];

  // Create a span element to contain the test text.
  // Use innerHTML instead of createElement as it's smaller
  container.innerHTML =
    `<span style="${containerCss.join(' !important;')}">${Array(100).join('wi')}</span>`;
  container = container.firstChild;

  const calculateWidth = (fontFamily) => {
    container.style.fontFamily = fontFamily;

    body.appendChild(container);
    width = container.clientWidth;
    body.removeChild(container);

    return width;
  };

  // Pre calculate the widths of monospace, serif & sans-serif
  // to improve performance.
  const monoWidth = calculateWidth('monospace');
  const serifWidth = calculateWidth('serif');
  const sansWidth = calculateWidth('sans-serif');

  return {
    detect(fontName) {
      return monoWidth !== calculateWidth(`${fontName},monospace`) ||
        sansWidth !== calculateWidth(`${fontName},sans-serif`) ||
        serifWidth !== calculateWidth(`${fontName},serif`);
    },
  };
}

})(k2e.Constants, Typekit.promise);
