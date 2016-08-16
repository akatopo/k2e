(function () {

enyo.kind({
  name: 'k2e.annotations.DocumentSelectorItem',
  classes: 'k2e-document-selector-item enyo-border-box',
  published: {
    index: -1,
    multiSelected: false,
    selected: false,
    key: undefined,
  },
  components: [
    { classes: 'k2e-document-selector-item-separator' },
    { classes: 'k2e-document-selector-item-container', components: [
      { name: 'checkbox', kind: 'onyx.Checkbox', showing: false,
        events: {
          onDocumentMultiSelected: '',
        },
        handlers: {
          onActivate: 'doDocumentMultiSelected',
        },
      },
      { name: 'label', classes: 'enyo-inline k2e-document-selector-item-label' },
    ] },
  ],
  events: {
    onDocumentSelected: '',
  },
  handlers: {
    ontap: 'handleTap',
  },
  handleTap() { this.doDocumentSelected(); },
  isMarked() { return this.$.checkbox.getChecked(); },
  setTitleComponents,
  multiSelectedChanged,
  selectedChanged,
});

/////////////////////////////////////////////////////////////

function selectedChanged() {
  this.addRemoveClass('onyx-selected', this.selected);
}

function multiSelectedChanged() {
  if (this.multiSelected) {
    this.$.checkbox.set('checked', false);
    this.$.checkbox.show();
  }
  else {
    // No need to emit doDocumentMultiSelected event, so don't set checked to false
    this.$.checkbox.hide();
  }
}

function setTitleComponents(components) {
  this.$.label.destroyComponents();
  if (enyo.isString(components)) {
    this.$.label.createComponent({ tag: null, content: components });
  }
  else if (enyo.isArray(components)) {
    components.forEach((c) => {
      this.$.label.createComponent(c);
    });
  }

  this.$.label.render();
}

})();
