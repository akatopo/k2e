(function () {

const LABELS = {
  exportAll: { short: 'Export', 'long': 'Export Clippings' },
  exportSelected: { short: 'Export Selected', 'long': 'Export Selected Clippings' }
};

enyo.kind({
  name: 'k2e.ExportButton',
  kind: 'onyx.Button',
  classes: 'k2e-export-button',
  form: 'long',
  exportSelected: false,
  components: [
      {tag: 'i', classes: 'icon-evernote icon-large'},
      {name: 'label', tag: 'span' }
  ],
  bindings: [
      { from: '.content', to: '$.label.content' }
  ],
  computed: {
    content: ['form', 'exportSelected']
  },
  content
});

/////////////////////////////////////////////////////////////

function content() {
  let form = this.form === 'long' ? 'long' : 'short';
  let labelType = this.exportSelected ? 'exportSelected' : 'exportAll';

  return LABELS[labelType][form];
}

})();
