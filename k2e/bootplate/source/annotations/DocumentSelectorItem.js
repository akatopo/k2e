(function () {

enyo.kind({
  name: 'k2e.annotations.DocumentSelectorItem',
  classes: 'k2e-document-selector-item enyo-border-box',
  published: {
    index: -1,
    multiSelected: false,
    selected: false,
    key: undefined
  },
  components: [
    {classes: 'k2e-document-selector-item-separator'},
    {classes: 'k2e-document-selector-item-container', components: [
      {name: 'checkbox', kind: 'onyx.Checkbox', showing: false,
        events: {
          onDocumentMultiSelected: ''
        },
        handlers: {
          onActivate: 'doDocumentMultiSelected'
        }
      },
      {name: 'label', classes: 'enyo-inline k2e-document-selector-item-label'}
    ]}
  ],
  events: {
    onDocumentSelected: ''
  },
  handlers: {
    ontap: 'handleTap'
  },
  handleTap: function () { this.doDocumentSelected(); },
  setTitle: function (titleString) { this.$.label.setContent(titleString); },
  getTitle: function () { return this.$.label.getContent(); },
  isMarked: function () { return this.$.checkbox.getChecked(); },
  setMultiSelected: setMultiSelected,
  setSelected: setSelected
});

/////////////////////////////////////////////////////////////

function setSelected(bool) {
  this.selected = bool;
  this.addRemoveClass('onyx-selected', this.selected);
}

function setMultiSelected(bool) {
  if (bool) {
    this.multiSelected = true;
    this.$.checkbox.setChecked(false);
    this.$.checkbox.show();
  }
  else {
    this.multiSelected = false;
    this.$.checkbox.hide();
    this.$.checkbox.setChecked(false);
  }
}

})();
