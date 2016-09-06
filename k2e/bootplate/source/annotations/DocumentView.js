/* global k2e:false */

(function (Features) {

const TWITTER_BASE_URL = 'https://twitter.com/intent/tweet';
const HASHTAGS = ['k2e'];
const CLIPBOARD_SUPPORTED = Features.hasClipboard();

enyo.kind({
  name: 'k2e.annotations.DocumentView',
  classes: 'k2e-document-view',
  displayDocument,
  clearDocument() { this.destroyComponents(); },
  rendered,
});

/////////////////////////////////////////////////////////////

function displayDocument(doc) {
  this.clearDocument();

  this.createComponent({ tag: 'h1', content: doc.title });
  this.createComponent({ classes: 'k2e-document-view-subtitle', components: [
    { tag: 'i', content: 'by ' },
    { tag: null, content: doc.author },
  ] });

  const sortedClippings = doc.clippings.slice(0).sort(sortDescending);
  sortedClippings.forEach(appendClippingToDisplay.bind(undefined, this, doc));

  this.render();

  /////////////////////////////////////////////////////////////

  function sortDescending(a, b) {
    const aUnixTimestamp = a.creationDate.valueOf();
    const bUnixTimestamp = b.creationDate.valueOf();

    return bUnixTimestamp - aUnixTimestamp;
  }
}

function appendClippingToDisplay(component, doc, clipping, index) {
  const loc = clipping.loc;
  const type = clipping.type;
  const timestamp = clipping.timeStamp;
  const contentText = clipping.contentText;
  const contentComponents = [{ tag: null, content: ' ' }]
    .concat(clipping.contentComponents);
  const createTwitterUrlFromContent =
    createTwitterUrl.bind(undefined, HASHTAGS, window.location.href);
  const createMailUrlFromContent = createMailUrl.bind(undefined, doc.title, doc.author);

  if (index !== 0) {
    component.createComponent({ classes: 'k2e-document-view-clip-separator' });
  }

  component.createComponent(
    { tag: 'p', components: [
      { tag: 'i', classes: 'icon-quote-left icon-large' },
      { tag: null, components: contentComponents },
    ] }
  );

  const footerComponents = [
    { tag: 'i', content: `${type}, ${loc}` },
    { tag: null, content: ' • ' },
    { tag: 'i', content: `Added on ${timestamp}` },
    { tag: 'span', classes: 'k2e-hide-print', content: ' • ' },
    { tag: 'a', classes: 'onyx-button k2e-icon-button k2e-hide-print',
      attributes: { href: createTwitterUrlFromContent(contentText), target: '_blank' },
      components: [
        { tag: 'i', classes: 'icon-twitter' },
      ] },
    { tag: 'a', classes: 'onyx-button k2e-icon-button k2e-hide-print',
      attributes: { href: createMailUrlFromContent(contentText), target: '_blank' },
      components: [
        { tag: 'i', classes: 'icon-mail' },
      ] },
  ];
  if (CLIPBOARD_SUPPORTED) {
    footerComponents.push({
      kind: 'k2e.annotations.CopyToClipboardIconButton',
      clipping,
    });
  }

  component.createComponent({
    classes: 'k2e-document-view-clip-footer',
    components: footerComponents,
  });
}

function createTwitterUrl(hashtags, url, text) {
  return `${TWITTER_BASE_URL}?text=${text}&hashtags=${hashtags.join(',')}&url=${url}`;
}

function createMailUrl(title, author, text) {
  return `mailto:?subject=${title} by ${author}&body=${text}`;
}

function rendered() {
  this.inherited(arguments);

  Features.hasTouch().then(() => {
    this.addClass('has-touch');
  });
}

})(k2e.util.Features);
