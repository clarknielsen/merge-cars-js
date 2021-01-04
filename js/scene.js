class Scene extends PIXI.Container {
  init() {
    this.buildScene();
    this.buildLevel();
    this.buildHud();
  }
  buildScene() {
    this.scene3D = new THREE.Scene();
    this.scene3D.background = new THREE.Color(0x888888);
    this.ambientLight = new THREE.AmbientLight(0xffffff, 5);
    this.scene3D.add(this.ambientLight);

    this.camera = new THREE.PerspectiveCamera(0, 0, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.update();
  }
  buildLevel(){
    this.level = new Level();
  }
  buildHud(){
    this.hud = new Hud();
    this.addChild(this.hud);
  }
  destroyThreeTexture() {
    if (this.ThreeSprite) {
      this.removeChild(this.ThreeSprite);
      this.ThreeSprite.destroy();
      this.ThreeTexture.destroy();
      this.ThreeSprite = null;
      this.ThreeTexture = null;
    }
  }
  buildThreeTexture() {
    const res = { x: window.innerWidth, y: window.innerHeight };
    const canvasWidth = document.getElementById('canvas').width;
    const widthRatio = canvasWidth / res.x;
    const scaleFactor = 1 / widthRatio;

    this.ThreeTexture = PIXI.BaseTexture.from(this.renderer.domElement);
    this.ThreeSprite = PIXI.Sprite.from(new PIXI.Texture(this.ThreeTexture));
    this.ThreeSprite.scale.x *= scaleFactor;
    this.ThreeSprite.scale.y *= scaleFactor;
    this.addChildAt(this.ThreeSprite, 0);
  }
  update() {
    requestAnimationFrame(this.update.bind(this));
    this.renderer.render(this.scene3D, this.camera);
    if (this.ThreeTexture) {
      this.ThreeTexture.update();
    }
  }
  deviceRotated(screenSize) {
    this.camera.fov = 45;
    this.camera.aspect = screenSize.width / screenSize.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setPixelRatio(screenSize.devicePixelRatio);
    this.renderer.setSize(screenSize.width, screenSize.height);

    this.destroyThreeTexture();
    this.buildThreeTexture();
  }
  onRotate() {
    canvas.width = document.documentElement.clientWidth;
    canvas.height = document.documentElement.clientHeight;
    this.deviceRotated(canvas);
    this.hud.onRotate();
  }
}
