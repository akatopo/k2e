/* FileReader */

(function () {

enyo.kind({
  name: 'k2e.ClippingPickerPopup',
  kind: 'k2e.AnimatedPopup',
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
  showErrorMessage,
  loadFile,
  clippingsTextChanged() { this.doClippingsTextChanged(); },
  handleFiles,
  handleShow
});

/////////////////////////////////////////////////////////////

function showErrorMessage() {
  this.$.errorMessage.setShowing(true);
  this.rendered();
}

function loadFile() {
  let pickerNode = this.$.filePicker.hasNode();

  if (pickerNode) {
    pickerNode.click();
  }
}

function handleFiles(inSender, inEvent) {
  let reader = new FileReader();
  let files = inEvent.target.files;

  if (files.length > 0) {
    reader.onload = (e) => {
      this.setClippingsText(e.target.result);
    };

    reader.readAsText(files[0]);
  }
}

function handleShow() {
  let popupNode = this.hasNode();
  let pickerNode = this.$.filePicker.hasNode();
  let handleDragleave;
  let handleDragover;
  let handleFiles;
  let handleDrop;
  let handleFilePick;
  let sampleClippingsNode = document.querySelector('#sample-clippings');

  if (sampleClippingsNode) {
    this.setClippingsText(sampleClippingsNode.innerHTML);
    return;
  }

  if (popupNode && pickerNode) {
    handleDragleave = (ev) => {
      this.removeClass('onyx-blue'); // TODO: use semantic class name
    };

    handleDragover = (ev) => {
      this.addClass('onyx-blue');
      ev.stopPropagation();
      ev.preventDefault();
      ev.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
    };

    handleFiles = (files) => {
      this.handleFiles(null, {target: {files: files}});
    };

    handleDrop = (ev) => {
      ev.stopPropagation();
      ev.preventDefault();

      this.removeClass('onyx-blue');
      handleFiles(ev.dataTransfer.files); // FileList object.
    };

    popupNode.addEventListener('dragleave', handleDragleave, false);
    popupNode.addEventListener('dragover', handleDragover, false);
    popupNode.addEventListener('drop', handleDrop, false);
  }
}

})();
