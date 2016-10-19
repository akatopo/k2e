(function () {

enyo.kind({
  name: 'k2e.IconButton',
  kind: 'k2e.Button',
  classes: 'k2e-icon-button',
  published: {
    iconClasses: undefined,
  },
  bindings: [
    { from: '.iconClasses', to: '.$.icon.classes' },
  ],
  components: [
    { name: 'icon', tag: 'i' },
  ],
});

})();
