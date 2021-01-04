class Hud extends PIXI.Container {
  constructor() {
    super();
    this.loadImages();
    this.buildHud();
  }
  loadImages(){
    this.logo = new PIXI.Sprite(PIXI.Texture.from('img/logo.png'));
  }
  buildHud() {
  }
  onRotate() {
  }
}
