class Level {
  constructor() {
    this.textureLoader = new THREE.TextureLoader();
    this.modelLoader = new THREE.FBXLoader();
    this.clock = new THREE.Clock();
    this.deltaTime = this.clock.getDelta();

    this.init();
  }
  init() {
    this.loadTextures();
    this.loadModels();
  }
  loadModel(modelName, path){
    this.modelLoader.load( path, ( fbx ) =>{
      this[`${modelName}`] = fbx;
      this.loadedModels.push(fbx);
    });
  }
  loadModels(){
    this.loadedModels = [];
    this.models = [
        {name: 'level', path: 'models/level.fbx'},
        {name: 'carPolice', path: 'models/car_police.fbx'}
      ];
    this.loadedModels.push = (model) => {
      this.loadedModels[this.loadedModels.length] = model;
      if(this.loadedModels.length === this.models.length){
        this.buildScene();
      }
    };
    for(let i = 0; i < this.models.length; i += 1){
      this.loadModel(this.models[i].name, this.models[i].path);
    }
  }
  loadTextures(){
    this.textureLoader = new THREE.TextureLoader();
    const promise = Promise.all([
        this.textureLoader.load('img/tex_water.jpg'),
        this.textureLoader.load('img/tex_car_police.jpg')
        ], (resolve, reject) => {
      resolve(promise);
    }).then(result => {
      this.textures = result;
    });
  }
  buildScene() {
    this.buildWater();
    this.buildCars();
    this.addLevel();
    this.setCamera();
    this.update();
  }
  addLevel(){
    scene.scene3D.add(this.level);
    this.level.scale.set(0.005,0.005,0.005);
  }
  buildWater() {
    this.waterTexture = this.textures[0]
    this.waterTexture.wrapS = THREE.RepeatWrapping;
    this.waterTexture.wrapT = THREE.RepeatWrapping;
    this.waterTexture.repeat.set(30, 30);

    const geometry = new THREE.PlaneBufferGeometry(150, 150,1,1);
    const material = new THREE.MeshBasicMaterial({ map: this.waterTexture  });
    this.floor = new THREE.Mesh(geometry, material);
    this.floor.rotation.set(THREE.Math.degToRad(-90), 0, 0);
    this.floor.position.set(0, -10, 0);
    scene.scene3D.add(this.floor);

    geometry.dispose();
    material.dispose();
  }
  buildCars() {
    // build police car
    const material = new THREE.MeshBasicMaterial({ map: this.textures[1] });
    this.carPolice.children[0].material = material;
    this.carPolice.add(this.carPolice.children[0].clone());
    this.carPolice.children[1].applyMatrix4(new THREE.Matrix4().makeScale(-1, 1, 1));
    this.carPolice.scale.set(0.001,0.001,0.001);
    
    scene.scene3D.add(this.carPolice);

    this.controls = new THREE.DragControls([this.carPolice], scene.camera, document.getElementById('canvas'));
    this.controls.transformGroup = true;

    this.controls.addEventListener('drag', (event) => {
      // restrict movement
      event.object.position.divideScalar(1).floor().multiplyScalar(1).addScalar(1);

      event.object.position.clamp(new THREE.Vector3(-5, 0, -5), new THREE.Vector3(5, 0, 5));
    });

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    window.addEventListener('mousemove', (event) => {
      mouse.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1 );
      raycaster.setFromCamera( mouse, scene.camera );

      const intersects = raycaster.intersectObjects( this.carPolice.children, true );
      console.log(intersects.length);
    });
  }
  setCamera() {
    scene.camera.position.set(0, 10, 10);
    scene.camera.lookAt(new THREE.Vector3(0, 0, 0)); // set the correct camera angle
  }
  update() {
    requestAnimationFrame(this.update.bind(this));
    this.deltaTime = this.clock.getDelta();
  }
}
