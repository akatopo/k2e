/* global Velocity:false */

(function (velocity) {

const SQUAREISH_RATIO = 1.3;

enyo.kind({
  name: 'k2e.Button',
  kind: 'onyx.Button',
  classes: 'onyx-button k2e-button',
  handlers: {
    ontap: 'handleTap',
  },
  published: {
    animated: true,
  },
  handleTap,
  create,
});

function create() {
  // Not sure if this is the "enyo way"
  this.kindComponents = this.kindComponents ? Array.from(this.kindComponents) : [];
  this.kindComponents.unshift(
    { name: 'overlay', classes: 'k2e-button-activation-layer' }
  );
  this.inherited(arguments);
}

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

  velocity($overlay, { left: position.left, top: position.top, borderRadius: '50%' }, 0)
    .then(() => {
      velocity($overlay, { opacity: 1, scaleX: 1, scaleY: 1 }, 0);
    })
    .then(() => {
      velocity($overlay, { scaleX: minDim, scaleY: minDim, borderRadius: '50%' }, 50, 'linear');
    })
    .then(() => {
      const borderRadius = type === 'circle' ? '50%' : 0;
      const scaleFactor = type === 'circle' ? 1.8 : 1.3;

      velocity($overlay, {
        scaleX: minDim * scaleFactor,
        scaleY: minDim * scaleFactor,
        opacity: 0,
        borderRadius,
      }, 200, 'linear');
    });
}

})(Velocity);
