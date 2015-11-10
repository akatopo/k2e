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
  done,
  begin,
  failed
});

/////////////////////////////////////////////////////////////

function done(message) {
  changeMessage.call(this, message);
  window.setTimeout(this.hide.bind(this), calculateTimeout(this.$.message.content));
}

function begin(message) {
  changeMessage.call(this, message, true);
  this.show();
}

function failed(caption, messages) {
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

function changeMessage(message, spinnerToggle) {
  let spinnerFunc = spinnerToggle ? this.$.spinner.show : this.$.spinner.hide;
  spinnerFunc.call(this.$.spinner);
  this.$.message.setContent(message);
  this.rendered();
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
