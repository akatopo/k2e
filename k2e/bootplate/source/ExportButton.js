(function () {

const LABELS = {
  exportAll: { short: 'Export', long: 'Export Clippings' },
  exportSelected: { short: 'Export Selected', long: 'Export Selected Clippings' },
};

enyo.kind({
  name: 'k2e.ExportButton',
  kind: 'k2e.Button',
  classes: 'k2e-export-button',
  form: 'long',
  exportSelected: false,
  components: [
    { tag: 'i', classes: 'icon-evernote icon-large' },
    { name: 'label', tag: 'span' },
  ],
  bindings: [
    { from: '.content', to: '$.label.content' },
  ],
  computed: {
    content: ['form', 'exportSelected'],
  },
  content,
});

/////////////////////////////////////////////////////////////

function content() {
  const form = this.form === 'long' ? 'long' : 'short';
  const labelType = this.exportSelected ? 'exportSelected' : 'exportAll';

  return LABELS[labelType][form];
}

})();
