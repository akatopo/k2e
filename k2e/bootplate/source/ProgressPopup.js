(function () {

enyo.kind({
  name: 'k2e.ProgressPopup',
  classes: 'k2e-progress-popup',
  kind: 'onyx.Popup',
  modal: true,
  floating: true,
  autoDismiss: false,
  centered: true,
  scrim: true,
  components: [
    {name: 'spinner', kind: 'onyx.Spinner'},
    {name: 'message', content: ''}
  ],
  done: function (message) {
    changeMessage.call(this, message);
    window.setTimeout(this.hide.bind(this), calculateTimeout(this.$.message.content));
  },
  begin: function (message) {
    changeMessage.call(this, message, true);
    this.show();
  },
  failed: function (caption, messages) {
    if (!Array.isArray(messages)) {
      messages = messages ? [messages] : [];
    }

    changeMessage.call(
      this,
      caption +
      (messages.length !== 0 ? ': ' : '') +
      messages.join('\n')
    );
    window.setTimeout(this.hide.bind(this), calculateTimeout(this.$.message.content));
  }
});

function changeMessage(message, spinnerToggle) {
  var spinnerFunc = spinnerToggle ? this.$.spinner.show : this.$.spinner.hide;
  spinnerFunc.call(this.$.spinner);
  this.$.message.setContent(message);
  this.rendered();
}

function calculateTimeout(s) {
  var MS_REACTION_TIME = 250;
  var MS_PER_CHARACTER = 60000 / (200 * 5); // 200 WPM -> 1000 CPM,
  var nonSpaceCharacters = Array.prototype.reduce.call(s, nonSpaceReducer, 0);

  return (nonSpaceCharacters * MS_PER_CHARACTER) + 2 * MS_REACTION_TIME;
}

function nonSpaceReducer(charCount, character) {
  if (/[^\s]/.test(character)) {
    ++charCount;
  }
  return charCount;
}

})();
