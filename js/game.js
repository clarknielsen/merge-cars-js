const canvas = document.getElementById('canvas');
const app = new PIXI.Application({ view: canvas });
const stage = app.stage;

const scene = new Scene();
stage.addChild(scene);
scene.init();
scene.onRotate();

window.addEventListener('resize', () => {
  scene.onRotate();
});
