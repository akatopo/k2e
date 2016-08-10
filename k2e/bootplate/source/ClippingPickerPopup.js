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
    clippingsText: '',
  },
  components: [
    { name: 'errorMessage', classes: 'k2e-color-error', showing: false,
      content: 'Invalid clippings provided, try loading a correct "My Clippings.txt" file' },
    { classes: 'onyx-toolbar-inline', components: [
      { content: 'Drag your kindle clippings here or ' },
      { kind: 'onyx.Button', classes: 'onyx-blue', ontap: 'loadFile', components: [
        { tag: 'i', classes: 'icon-upload icon-large' },
        { tag: 'span', content: 'Load from File' },
      ] },
      { tag: 'span', showing: false, components: [
        { name: 'filePicker', kind: 'enyo.Input', type: 'file', onchange: 'handleFiles' },
      ] },
    ] },
    { classes: 'k2e-clipping-picker-popup-info', components: [
      { tag: null, content: 'The clippings file is in the ' },
      { tag: 'b', content: 'documents' },
      { tag: null, content: ' folder of your kindle as ' },
      { tag: 'b', content: 'My clippings.txt' },
    ] },
    { name: 'cancelButton', kind: 'onyx.Button',
      classes: 'onyx-dark bottom-fullwidth-button cancel-button',
      ontap: 'hide', content: 'Cancel' },
  ],
  events: {
    onClippingsTextChanged: '',
  },
  handlers: {
    onHide: 'handleHide',
    onShow: 'handleShow',
  },
  showErrorMessage,
  loadFile,
  handleFiles,
  handleHide,
  handleShow,
  autoDismissChanged,
  show,
});

/////////////////////////////////////////////////////////////

function handleHide() {
  reset.bind(this)();
}

function showErrorMessage() {
  this.$.errorMessage.setShowing(true);
  this.rendered();
}

function loadFile() {
  const pickerNode = this.$.filePicker.hasNode();

  if (pickerNode) {
    pickerNode.click();
  }
}

function handleFiles(inSender, inEvent) {
  const reader = new FileReader();
  const files = inEvent.target.files;

  if (files.length > 0) {
    reader.onload = (e) => {
      this.set('clippingsText', e.target.result);
      this.doClippingsTextChanged();
    };

    reader.readAsText(files[0]);
  }
}

function show(options) {
  const baseOptions = {
    autoDismiss: false,
  };

  const opts = extend(baseOptions, options, true);

  Object.keys(opts).forEach((key) => {
    this.set(key, opts[key]);
  });

  const popupNode = this.hasNode();
  const pickerNode = this.$.filePicker.hasNode();

  if (popupNode && pickerNode) {
    popupNode.addEventListener('dragleave', handleDragleave.bind(this), false);
    popupNode.addEventListener('dragover', handleDragover.bind(this), false);
    popupNode.addEventListener('drop', handleDrop.bind(this), false);
  }

  this.inherited(arguments);
}

function handleShow() {
  const popupNode = this.hasNode();
  const pickerNode = this.$.filePicker.hasNode();

  if (popupNode && pickerNode) {
    popupNode.addEventListener('dragleave', handleDragleave.bind(this), false);
    popupNode.addEventListener('dragover', handleDragover.bind(this), false);
    popupNode.addEventListener('drop', handleDrop.bind(this), false);
  }
}

function reset() {
  this.$.filePicker.hasNode().value = '';
  this.$.errorMessage.set('showing', false);
}

function autoDismissChanged(oldValue, newValue) {
  this.addRemoveClass('can-dismiss', !!newValue);
}

function handleDragleave(/*ev*/) {
  this.removeClass('onyx-blue'); // TODO: use semantic class name
}

function handleDragover(ev) {
  this.addClass('onyx-blue');
  ev.stopPropagation();
  ev.preventDefault();
  ev.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}

function handleDrop(ev) {
  ev.stopPropagation();
  ev.preventDefault();

  this.removeClass('onyx-blue');
  this.handleFiles(null, { target: { files: ev.dataTransfer.files } }); // FileList object.
}

function extend(base, obj, onlyBaseOpts) {
  const newBase = enyo.isObject(base) ? base : {};
  const newObj = enyo.isObject(obj) ? obj : {};
  const ret = enyo.clone(newBase);

  Object.keys(newObj).forEach((key) => {
    const value = newObj[key];
    const validKey = onlyBaseOpts ? newBase[key] !== undefined : true;
    if (value !== undefined && validKey) {
      ret[key] = value;
    }
  });

  return ret;
}

})();
