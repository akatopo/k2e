/* global Velocity:false */

(function (velocity) {

const SQUAREISH_RATIO = 1.3;

enyo.kind({
  name: 'k2e.IconButton',
  kind: 'onyx.Button',
  classes: 'onyx-button k2e-icon-button',
  handlers: {
    ontap: 'handleTap',
  },
  published: {
    iconClasses: undefined,
    animated: true,
  },
  bindings: [
    { from: '.iconClasses', to: '.$.icon.classes' },
  ],
  components: [
    { name: 'overlay', classes: 'k2e-icon-button-overlay' },
    { name: 'icon', tag: 'i' },
  ],
  handleTap,
});

function handleTap(inSender, inEvent) {
  const { width, height, top, left } = this.getAbsoluteBounds();
  const ratio = width / height;
  if (ratio > SQUAREISH_RATIO) {
    const { clientX, clientY } = inEvent;
    animateActivate({
      parentComponent: this,
      overlayComponent: this.$.overlay,
      position: { top: clientY - top, left: clientX - left },
      type: 'circle',
    });
  }
  else {
    animateActivate({
      parentComponent: this,
      overlayComponent: this.$.overlay,
      type: 'square',
    });
  }
}

function animateActivate({ parentComponent, overlayComponent, position, type }) {
  const $overlay = overlayComponent.hasNode();
  if (!$overlay || !parentComponent.get('animated')) {
    return;
  }

  position = position || { left: '50%', top: '50%' };
  type = type || 'circle';
  const { width, height } = parentComponent.getBounds();
  const minDim = Math.min(height, width);

  velocity($overlay, {
    opacity: 1,
    scaleX: 1,
    scaleY: 1,
    left: position.left,
    top: position.top,
    borderRadius: '50%',
  }, 0)
    .then(() => {
      velocity($overlay, { scaleX: minDim, scaleY: minDim, borderRadius: '50%' }, 50, 'linear');
    })
    .then(() => {
      velocity($overlay, {
        scaleX: minDim * 1.3,
        scaleY: minDim * 1.3,
        opacity: 0,
        borderRadius: type === 'circle' ? '50%' : 0,
      }, 200, 'linear');
    });
}

})(Velocity);
