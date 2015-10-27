/* global moment */

(function () {

enyo.kind({
  name: 'k2e.annotations.Clipping',
  kind: 'enyo.Component',
  published: {
    type: '',
    loc: '',
    timeStamp: '',
    creationDate: undefined,
    content: '',
    suggestedTitle: '',
    suggestedUrl: ''
  },
  create: function () {
    var DATE_FORMAT = 'dddd, MMMM DD, YYYY, hh:mm A';
    this.inherited(arguments);
    this.creationDate = moment(this.timeStamp, DATE_FORMAT);
  },
  exportObject: function () {
    return {
      type: this.type,
      loc: this.loc,
      timeStamp: this.timeStamp,
      content: this.content,
      suggestedTitle: this.suggestedTitle,
      suggestedUrl: this.suggestedUrl
    };
  }
});

})();
