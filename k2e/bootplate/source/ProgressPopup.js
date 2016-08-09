/* global k2e:false */

(function () {

enyo.kind({
  name: 'k2e.ProgressPopup',
  classes: 'k2e-progress-popup',
  kind: 'k2e.AnimatedPopup',
  modal: true,
  floating: true,
  autoDismiss: false,
  centered: true,
  scrim: true,
  components: [
    { name: 'spinner', kind: 'onyx.Spinner' },
    { name: 'message', content: '' },
  ],
  done,
  begin,
  failed,
});

/////////////////////////////////////////////////////////////

function done(message) {
  changeMessage.call(this, message);
  this.startJob(
    'hideAfterDone',
    'hide',
    k2e.AnimatedPopup.calculateTimeout(this.$.message.content)
  );
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
  this.startJob(
    'hideAfterFailure',
    'hide',
    k2e.AnimatedPopup.calculateTimeout(this.$.message.content)
  );
}

function changeMessage(message, spinnerToggle) {
  const spinnerFunc = spinnerToggle ? this.$.spinner.show : this.$.spinner.hide;
  spinnerFunc.call(this.$.spinner);
  this.$.message.setContent(message);
  this.rendered();
}

})();
