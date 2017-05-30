/* global Velocity:false */

(function (velocity) {

const SQUAREISH_RATIO = 1.3;

(window.k2e = window.k2e || {}).ButtonActivationMixin = {
  name: 'k2e.ButtonActivationMixin',
  animationDispatcher,
  create: enyo.inherit((sup) => function () {
    create.call(this, sup);
  }),
};

/////////////////////////////////////////////////////////////

function create(sup) {
  this.kindComponents = this.kindComponents ? Array.from(this.kindComponents) : [];
  this.kindComponents.unshift(
    { tag: 'span', name: 'overlay', classes: 'k2e-button-activation-layer' }
  );
  sup.apply(this, arguments);
}

function animationDispatcher({ parentComponent, activationLayerComponent, inEvent }) {
  const { width, height, top, left } = parentComponent.getAbsoluteBounds();
  const ratio = width / height;
  if (ratio > SQUAREISH_RATIO) {
    const { clientX, clientY } = inEvent;
    animateActivate({
      parentComponent,
      activationLayerComponent,
      position: { top: clientY - top, left: clientX - left },
      type: 'circle',
    });
  }
  else {
    animateActivate({
      parentComponent,
      activationLayerComponent,
      type: 'square',
    });
  }
}

function animateActivate({ parentComponent, activationLayerComponent, position, type }) {
  const $activationLayer = activationLayerComponent.hasNode();
  if (!$activationLayer || !parentComponent.get('animated')) {
    return;
  }

  position = position || { left: '50%', top: '50%' };
  type = type || 'circle';
  const { width, height } = parentComponent.getBounds();
  const minDim = Math.min(height, width);

  velocity($activationLayer, { left: position.left, top: position.top, borderRadius: '50%' }, 0)
    .then(() => {
      velocity($activationLayer, { opacity: 1, scaleX: 1, scaleY: 1 }, 0);
    })
    .then(() => {
      velocity($activationLayer, {
        scaleX: minDim,
        scaleY: minDim,
        borderRadius: '50%',
      }, 50, 'linear');
    })
    .then(() => {
      const borderRadius = type === 'circle' ? '50%' : 0;
      const scaleFactor = type === 'circle' ? 1.8 : 1.3;

      velocity($activationLayer, {
        scaleX: minDim * scaleFactor,
        scaleY: minDim * scaleFactor,
        opacity: 0,
        borderRadius,
      }, 200, 'linear');
    });
}

})(Velocity);
