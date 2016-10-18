(function () {

enyo.kind({
  name: 'k2e.LinkIconButton',
  kind: 'k2e.IconButton',
  classes: 'onyx-button k2e-icon-button',
  tag: 'a',
  attributes: {
    type: null,
  },
  published: {
    href: undefined,
    targetBlank: false,
  },
  hrefChanged,
  targetBlankChanged,
  create,
});

function hrefChanged(newHref) {
  this.setAttribute('href', newHref);
}

function targetBlankChanged(isTargetBlank) {
  this.setAttribute('target', isTargetBlank ? '_blank' : null);
  this.setAttribute('rel', isTargetBlank ? 'noopener noreferrer' : null);
}

function create() {
  this.inherited(arguments);
  this.hrefChanged(this.href);
  this.targetBlankChanged(this.targetBlank);
}

})();
