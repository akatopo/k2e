(function () {

const TWITTER_BASE_URL = 'https://twitter.com/intent/tweet';
const HASHTAGS = ['k2e'];
const CLIPBOARD_SUPPORTED = detectClipboardSupport();

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
    { tag: 'span', content: doc.author },
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
  const content = clipping.content;
  const createTwitterUrlFromContent =
    createTwitterUrl.bind(undefined, HASHTAGS, window.location.href);
  const createMailUrlFromContent = createMailUrl.bind(undefined, doc.title, doc.author);

  if (index !== 0) {
    component.createComponent({ classes: 'k2e-document-view-clip-separator' });
  }

  component.createComponent(
    { tag: 'p', components: [
      { tag: 'i', classes: 'icon-quote-left icon-large' },
      { tag: null, allowHtml: true, content: ` ${content}` },
    ] }
  );

  const footerComponents = [
    { tag: 'i', content: `${type}, ${loc}` },
    { tag: null, content: ' • ' },
    { tag: 'i', content: `Added on ${timestamp}` },
    { tag: 'span', classes: 'k2e-hide-print', content: ' • ' },
    { tag: 'a', classes: 'onyx-button k2e-icon-button k2e-hide-print',
      attributes: { href: createTwitterUrlFromContent(clipping.content), target: '_blank' },
      components: [
        { tag: 'i', classes: 'icon-twitter' },
      ] },
    { tag: 'a', classes: 'onyx-button k2e-icon-button k2e-hide-print',
      attributes: { href: createMailUrlFromContent(clipping.content), target: '_blank' },
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

function detectClipboardSupport() {
  // document.queryCommandSupported return value fixed in Chrome 48
  let supported = document.queryCommandSupported('copy');
  if (supported) {
    // Check that the browser isn't Firefox pre-41
    try {
      document.execCommand('copy');
    } catch (e) {
      supported = false;
    }
  }

  return supported;
}

})();
