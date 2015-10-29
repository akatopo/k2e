/* FileReader */

(function () {

enyo.kind({
  name: 'k2e.ClippingPickerPopup',
  kind: 'onyx.Popup',
  classes: 'k2e-clipping-picker-popup',
  modal: true,
  floating: true,
  autoDismiss: false,
  centered: true,
  scrim: true,
  published: {
    clippingsText: ''
  },
  components: [
    {name: 'errorMessage', classes: 'k2e-color-error', showing: false,
      content: 'Invalid clippings provided, try loading a correct "My Clippings.txt" file'},
    {classes: 'onyx-toolbar-inline', components: [
      {content: 'Drag your kindle clippings here or '},
      {kind: 'onyx.Button', classes: 'onyx-blue', ontap: 'loadFile', components: [
        {tag: 'i', classes: 'icon-upload icon-large'},
        {tag: 'span', content: 'Load from File' }
      ]},
      {tag: 'span', showing: false, components: [
        {name: 'filePicker', kind: 'enyo.Input', type: 'file', onchange: 'handleFiles'}
      ]}
    ]},
    {classes: 'k2e-clipping-picker-popup-info', components: [
      {tag: null, content: 'The clippings file is in the '},
      {tag: 'b', content: 'documents'},
      {tag: null, content: ' folder of your kindle as '},
      {tag: 'b', content: 'My clippings.txt'}
    ]}
  ],
  events: {
    onClippingsTextChanged: ''
  },
  handlers: {
    onShow: 'handleShow'
  },
  showErrorMessage: showErrorMessage,
  loadFile: loadFile,
  clippingsTextChanged: function clippingsTextChanged() { this.doClippingsTextChanged(); },
  handleFiles: handleFiles,
  handleShow: handleShow
});

/////////////////////////////////////////////////////////////

function showErrorMessage() {
  this.$.errorMessage.setShowing(true);
  this.rendered();
}

function loadFile() {
  var pickerNode = this.$.filePicker.hasNode();

  if (pickerNode) {
    pickerNode.click();
  }
}

function handleFiles(inSender, inEvent) {
  var self = this;
  var reader = new FileReader();
  var files = inEvent.target.files;

  if (files.length > 0) {
    reader.onload = function (e) {
      self.setClippingsText(e.target.result);
    };

    reader.readAsText(files[0]);
  }
}

function handleShow() {
  var self = this;
  var popupNode = this.hasNode();
  var pickerNode = this.$.filePicker.hasNode();
  var handleDragleave;
  var handleDragover;
  var handleFiles;
  var handleDrop;
  var handleFilePick;
  var sampleClippingsNode = document.querySelector('#sample-clippings');

  if (sampleClippingsNode) {
    self.setClippingsText(sampleClippingsNode.innerHTML);
    return;
  }

  if (popupNode && pickerNode) {
    handleDragleave = function (ev) {
      self.removeClass('onyx-blue'); // TODO: use semantic class name
    };

    handleDragover = function (ev) {
      self.addClass('onyx-blue');
      ev.stopPropagation();
      ev.preventDefault();
      ev.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
    };

    handleFiles = function (files) {
      self.handleFiles(null, {target: {files: files}});
    };

    handleDrop = function (ev) {
      ev.stopPropagation();
      ev.preventDefault();

      self.removeClass('onyx-blue');
      handleFiles(ev.dataTransfer.files); // FileList object.
    };

    popupNode.addEventListener('dragleave', handleDragleave, false);
    popupNode.addEventListener('dragover', handleDragover, false);
    popupNode.addEventListener('drop', handleDrop, false);
  }
}

})();
