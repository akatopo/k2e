(function () {

enyo.kind({
  name: 'k2e.settings.SettingsSlideable',
  kind: 'enyo.Slideable',
  classes: 'k2e-settings',
  min: -100,
  max: 0,
  value: -100,
  unit: '%',
  draggable: true,
  overMoving: false,
  cookieModel: undefined,
  components: [
    { name: 'scroller', kind: 'enyo.Scroller', strategyKind: 'ScrollStrategy',
      style: 'height: 100%', components: [
        { name: 'panel', kind: 'k2e.settings.SettingsPanel' },
      ] },
  ],
  bindings: [
    { from: '.cookieModel', to: '.$.panel.cookieModel' },
    { from: '.value', to: '.slidedToMin', transform: (value) => value === -100 },
  ],
  handlers: {
    onAnimateFinish: 'handleAnimateFinish',
  },
  toggle,
  handleAnimateFinish,
});

/////////////////////////////////////////////////////////////

function toggle() {
  this.addClass('transition');

  if (this.isAtMin()) {
    this.animateToMax();
  }
  else {
    this.animateToMin();
  }
}

function handleAnimateFinish(/*inSender, inEvent*/) {
  this.removeClass('transition');
  if (this.isAtMin()) {
    this.removeClass('active');
    this.$.scroller.scrollToTop();
  }
  else {
    this.addClass('active');
  }
}

})();
