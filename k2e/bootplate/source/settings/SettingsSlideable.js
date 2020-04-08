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
  pendingToggle: undefined,
  events: {
    onToggleAnimateFinish: '',
  },
  components: [
    { name: 'scroller', kind: 'enyo.Scroller', strategyKind: 'ScrollStrategy',
      classes: 'full-height', components: [
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

function toggle(emitAnimateEvent = false) {
  this.addClass('transition');

  if (this.isAtMin()) {
    this.animateToMax();
    if (emitAnimateEvent) {
      this.pendingToggle = { active: true };
    }
    return true;
  }
  this.animateToMin();
  if (emitAnimateEvent) {
    this.pendingToggle = { active: false };
  }
  return false;
}

function handleAnimateFinish(/*inSender, inEvent*/) {
  this.removeClass('transition');
  if (this.isAtMin()) {
    this.removeClass('active');
    this.$.scroller.scrollToTop();
    if (this.pendingToggle && this.pendingToggle.active === false) {
      this.pendingToggle = undefined;
      this.doToggleAnimateFinish();
    }
  }
  else {
    this.addClass('active');
    if (this.pendingToggle && this.pendingToggle.active) {
      this.pendingToggle = undefined;
      this.doToggleAnimateFinish();
    }
  }
}

})();
