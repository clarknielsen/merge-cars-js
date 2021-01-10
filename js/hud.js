class Hud extends PIXI.Container {
  constructor() {
    super();
    this.loadImages();
    this.buildHud();
  }
  loadImages(){
    this.logo = new PIXI.Sprite(PIXI.Texture.from('img/logo.png'));
    this.logo.x = 10;
    this.logo.y = 10;
  }
  buildHud() {
    document.body.appendChild(app.view);

    app.stage.addChild(this.logo);
  }
  onRotate() {
  }
}
