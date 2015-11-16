(function () {

enyo.kind({
  name: 'k2e.AnimatedPopup',
  kind: 'onyx.Popup',
  classes: 'k2e-animated-popup k2e-hidden',
  handlers: {
    ontransitionend: 'handleTransitionend',
    onWebkitTransitionend: 'handleTransitionend'
  },
  statics: {
    calculateTimeout
  },
  handleTransitionend,
  showingChanged
});

function handleTransitionend(inSender, inEvent) {
  if (inEvent.propertyName !== 'opacity' || this.hasClass('visible')) {
    return;
  }

  // move to top corner for accurate sizing
  if (this.centered || this.targetPosition) {
    this.addStyles('top: 0px; left: 0px; right: initial; bottom: initial;');
  }
}

function showingChanged(was) {
  // auto render when shown.
  if (this.floating && this.showing && !this.hasNode()) {
    this.render();
  }
  // hide while sizing
  if (this.centered || this.targetPosition) {
    if (!this.showTransitions) {
      this.applyStyle('visibility', 'hidden');
    }
  }

  if (!was && this.showing) {
    this.addClass('visible');
  }

  else if (was && !this.showing) {
    this.removeClass('visible');
  }

  this.sendShowingChangedEvent(was);

  if (this.showing) {
    this.resize();
    enyo.Popup.count++;
    this.applyZIndex();
    if (this.captureEvents) {
      this.capture();
    }
  }
  else {
    if (enyo.Popup.count > 0) {
      enyo.Popup.count--;
    }
    if (this.captureEvents) {
      this.release();
    }
  }
  this.showHideScrim(this.showing);
  // show after sizing
  if (this.centered || this.targetPosition && !this.showTransitions) {
    this.applyStyle('visibility', null);
  }
  // events desired due to programmatic show/hide
  if (this.hasNode()) {
    this[this.showing ? 'doShow' : 'doHide']();
  }
}

function calculateTimeout(s) {
  const MS_REACTION_TIME = 250;
  const MS_PER_CHARACTER = 60000 / (200 * 5); // 200 WPM -> 1000 CPM,
  let nonSpaceCharacters = Array.prototype.reduce.call(s, nonSpaceReducer, 0);

  return (nonSpaceCharacters * MS_PER_CHARACTER) + 2 * MS_REACTION_TIME;
}

function nonSpaceReducer(charCount, character) {
  if (/[^\s]/.test(character)) {
    ++charCount;
  }
  return charCount;
}

})();
