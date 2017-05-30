/* global moment:false */

(function () {

const DATE_FORMAT = 'dddd, MMMM DD, YYYY, hh:mm A';

enyo.kind({
  name: 'k2e.annotations.Clipping',
  kind: 'enyo.Component',
  published: {
    type: '',
    loc: '',
    timestamp: '',
    creationDate: undefined,
    content: '',
    contentText: '',
    contentComponents: '',
    suggestedTitle: '',
    suggestedUrl: '',
  },
  create,
  exportObject,
});

/////////////////////////////////////////////////////////////

function create() {
  this.inherited(arguments);
  this.creationDate = moment(this.timestamp, DATE_FORMAT);
}

function exportObject() {
  return {
    type: this.type,
    loc: this.loc,
    timestamp: this.timestamp,
    content: this.content,
    suggestedTitle: this.suggestedTitle,
    suggestedUrl: this.suggestedUrl,
  };
}

})();
