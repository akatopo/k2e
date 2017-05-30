/* global k2e:false, window:false */

(function (Features, encodeURIComponent) {

const TWITTER_BASE_URL = 'https://twitter.com/intent/tweet';
const HASHTAGS = ['k2e'];
const CLIPBOARD_SUPPORTED = Features.hasClipboard();
const MAX_NON_BREAKING_CONTENT_LENGTH = 70;

enyo.kind({
  name: 'k2e.annotations.DocumentView',
  classes: 'k2e-document-view',
  displayDocument,
  clearDocument() { this.destroyComponents(); },
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
  const {
    loc,
    type,
    timestamp,
    contentText
  } = clipping;
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

  const actionComponents = [
    { kind: 'k2e.LinkIconButton', iconClasses: 'icon-twitter',
      href: createTwitterUrlFromContent(createShareText(clipping, doc)), targetBlank: true },
    { kind: 'k2e.LinkIconButton', iconClasses: 'icon-mail',
      href: createMailUrlFromContent(createShareText(clipping, doc)), targetBlank: true },
  ];

  if (CLIPBOARD_SUPPORTED) {
    actionComponents.push({
      kind: 'k2e.annotations.CopyToClipboardIconButton',
      shareText: createShareText(clipping, doc),
    });
  }

  const footerComponents = [
    { tag: 'i', content: `${type}, ${loc}` },
    { tag: null, content: ' • ' },
    { tag: 'i', content: `Added on ${timestamp}` },
    { tag: 'span', classes: 'k2e-hide-print', content: ' • ' },
    { classes: 'display-inline-block k2e-hide-print k2e-document-view-clip-footer-action-container',
      components: actionComponents },
  ];

  component.createComponent({
    classes: 'k2e-document-view-clip-footer',
    components: footerComponents,
  });
}

function createTwitterUrl(hashtags, url, text) {
  const hashtagsEncoded = encodeLinkText(hashtags.join(','));
  const urlEncoded = encodeLinkText(url);
  const textEncoded = encodeLinkText(text);

  return `${TWITTER_BASE_URL}?text=${textEncoded}&hashtags=${hashtagsEncoded}&url=${urlEncoded}`;
}

function createMailUrl(...args) {
  const [
    titleEncoded,
    authorEncoded,
    textEncoded,
  ] = args.map(encodeLinkText);

  return `mailto:?subject=${titleEncoded}%20by%20${authorEncoded}&body=${textEncoded}`;
}

function createShareText(clipping, doc) {
  const attributionSeparator =
    clipping.contentText.length > MAX_NON_BREAKING_CONTENT_LENGTH ?
      '\n\n' : ' ';
  return `“${clipping.contentText}”${attributionSeparator}– ${doc.title} by ${doc.author}`;
}

function encodeLinkText(text) {
  return encodeURIComponent(text.replace(/\n/g, '\r\n'));
}

})(k2e.util.Features, window.encodeURIComponent);
