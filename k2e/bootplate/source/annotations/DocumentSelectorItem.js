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
      { name: 'infoContainer', classes: 'enyo-inline k2e-document-selector-item-info-container',
        components: [
          { name: 'title', classes: 'k2e-document-selector-item-info-label' },
          { classes: `k2e-document-selector-item-info-label
              k2e-document-selector-item-info-label-author`,
            components: [
              { tag: null, content: 'by ' },
              { name: 'author', tag: null },
            ] },
        ] },
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
  setDocumentInfoComponents,
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

function setDocumentInfoComponents({ titleComponents, authorComponents }) {
  setComponents(this.$.title, titleComponents);
  setComponents(this.$.author, authorComponents);
  this.$.infoContainer.render();
}

function setComponents(component, components) {
  component.destroyComponents();
  if (enyo.isString(components)) {
    component.createComponent({ tag: null, content: components });
  }
  else if (enyo.isArray(components)) {
    components.forEach((c) => {
      component.createComponent(c);
    });
  }
}

})();
