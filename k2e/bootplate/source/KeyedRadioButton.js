(function () {

enyo.kind({
  name: 'k2e.KeyedRadioButton',
  kind: 'k2e.RadioButton',
  published: {
    key: '',
  },
  bindings: [
    { from: '.key', to: '.$.label.content' },
  ],
  components: [
    { name: 'label' },
  ],
});

/////////////////////////////////////////////////////////////

})();
