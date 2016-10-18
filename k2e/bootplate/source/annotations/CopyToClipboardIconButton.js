/* global k2e:false */

(function () {

let POPUP_TIMEOUT;

enyo.kind({
  name: 'k2e.annotations.CopyToClipboardIconButton',
  kind: 'enyo.Control',
  classes: 'display-inline-block',
  published: {
    clipping: undefined,
  },
  components: [
    { name: 'iconButton', kind: 'k2e.IconButton',
      iconClasses: 'icon-docs', ontap: 'handleClipboardTap',
      clasess: 'onyx-button k2e-icon-button k2e-clipboard-icon-position-hack' },
    { name: 'popup', kind: 'k2e.AnimatedPopup', modal: false, floating: true,
      content: 'Clipping copied to clipboard' },
  ],
  handleClipboardTap,
  rendered,
});

function handleClipboardTap(inSender, inEvent) {
  this.$.popup.showAtEvent(inEvent);
  copyText(this.clipping.contentText);
  this.startJob('hideCopiedPopup', () => {
    this.$.popup.hide();
  }, POPUP_TIMEOUT);
}

function rendered() {
  this.inherited(arguments);

  POPUP_TIMEOUT = k2e.AnimatedPopup.calculateTimeout(this.$.popup.content);
}

// Copy arbitrary text by placing it in a textarea, and copying it;
// http://blog.etufe.com/javascript/clipboard/2015/08/25/javascript-only-clipboard-copy/

function copyText(text) {
  // Create a textarea for the text to reside
  const ta = document.createElement('textarea');
  // Hide it from display
  ta.style.position = 'fixed';
  ta.style.top = ta.style.left = 0;
  ta.style.opacity = 0;
  // Set the text
  ta.value = text;
  // Add it to the document
  document.body.appendChild(ta);
  // Make a user selection on it's contents
  ta.select();
  // Preform the copy
  document.execCommand('copy');
  // Remove the element
  ta.remove();
}

})();
