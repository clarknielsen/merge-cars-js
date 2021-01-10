class Level {
  constructor() {
    this.textureLoader = new THREE.TextureLoader();
    this.modelLoader = new THREE.FBXLoader();
    this.clock = new THREE.Clock();
    this.deltaTime = this.clock.getDelta();

    this.cars = [];
    this.gameOver = false;

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
        {name: 'level', path: 'models/level.FBX'},
        {name: 'carPolice', path: 'models/car_police.FBX'},
        {name: 'carRed', path: 'models/car_red.FBX'},
        {name: 'carBlue', path: 'models/car_blue.FBX'}
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
        this.textureLoader.load('img/tex_car_police.jpg'),
        this.textureLoader.load('img/tex_car_red.jpg'),
        this.textureLoader.load('img/tex_car_blue.jpg'),
        this.textureLoader.load('img/circle.png')
        ], (resolve, reject) => {
      resolve(promise);
    }).then(result => {
      this.textures = result;
    });
  }
  buildScene() {
    this.buildWater();
    this.buildCars();
    this.buildParticleGroup();

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
  buildCar(fbx, texture) {
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const model = fbx.clone();

    // mirror car side
    model.children[0].material = material;
    model.add(model.children[0].clone());
    model.children[1].applyMatrix4(new THREE.Matrix4().makeScale(-1, 1, 1));

    model.scale.set(0.001, 0.001, 0.001);
    model.name = model.children[0].name;

    return model;
  }
  buildCars() {
    // build police car
    this.carPolice = this.buildCar(this.carPolice, this.textures[1]);
    this.carPolice.scale.set(0.002, 0.002, 0.002);

    // build movable cars
    this.cars.push(this.buildCar(this.carRed, this.textures[2]));
    this.cars.push(this.buildCar(this.carRed, this.textures[2]));
    this.cars.push(this.buildCar(this.carBlue, this.textures[3]));
    this.cars.push(this.buildCar(this.carBlue, this.textures[3]));

    // position around level
    for (let i = 0; i < this.cars.length; i++) {
      this.cars[i].position.set(
        Math.floor(Math.random() * 10) - 5 + .25, 
        0, 
        Math.floor(Math.random() * 10) - 5 + .25
      );

      scene.scene3D.add(this.cars[i]);
    }

    // drag controls
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(.4, .45, 32),
      new THREE.MeshBasicMaterial({color: 0xffff00, side: THREE.DoubleSide})
    );
    ring.name = "ring";
    ring.rotateX(-Math.PI / 2);
    
    let draggedCar;

    window.addEventListener('mousedown', (event) => {
      // prevent dragging
      if (draggedCar || this.gameOver) return;

      // check for mouse over car
      const intersects = raycaster.intersectObjects(this.cars, true);

      if (intersects[0] && intersects[0].object.name.indexOf("car") !== -1) {
        draggedCar = intersects[0].object.parent;

        // start engine
        createjs.Tween.get(draggedCar.position, {loop: true}).to(new THREE.Vector3(draggedCar.position.x, .05, draggedCar.position.z), 100);

        // add drag guide to scene
        ring.position.set(draggedCar.position.x, .1, draggedCar.position.z);
        scene.scene3D.add(ring);
      }
    });

    window.addEventListener('mousemove', (event) => {
      // update mouse coords
      mouse.set( 
        (event.clientX / window.innerWidth) * 2 - 1, 
        -(event.clientY / window.innerHeight) * 2 + 1 
      );
      raycaster.setFromCamera(mouse, scene.camera);

      if (draggedCar && scene.scene3D.getObjectByName('ring')) {
        // find location on level
        const intersects = raycaster.intersectObjects(this.level.children);

        if (intersects[0]) {
          // update drag guide
          ring.position.set(
            Math.round(intersects[0].point.x / .5) * .5 - .25, 
            0.1, 
            Math.round(intersects[0].point.z / .5) * .5 - .25
          );

          // set boundaries
          ring.position.clamp(new THREE.Vector3(-4.75, .1, -4.75), new THREE.Vector3(5, .1, 5));
          
          // rotate car towards end point
          if (draggedCar.position.distanceTo(ring.position) >= .2) {
            draggedCar.lookAt(ring.position);
          }
        }
      }
    });

    window.addEventListener('mouseup', (event) => {
      if (draggedCar) {
        document.body.style.cursor = 'not-allowed';

        draggedCar.rotateX(-.5);
        createjs.Tween.removeTweens(draggedCar.position);

        // poof
        this.makeParticles(this.smokeEmitter, draggedCar.position);

        // move car to location
        const time = Math.ceil(draggedCar.position.distanceTo(ring.position)) * 150;
        createjs.Tween.get(draggedCar.position).to(ring.position, time).call(() => {
          draggedCar.rotation.set(0, 0, 0);

          // check for overlapping cars
          for (let i = 0; i < this.cars.length; i++) {
            const tempCar = this.cars[i];

            // ignore self but look for correct color
            if (tempCar !== draggedCar && (tempCar.name === draggedCar.name || this.cars.length === 2)) {
              const box1 = new THREE.Box3().setFromObject(tempCar);
              const box2 = new THREE.Box3().setFromObject(draggedCar);

              if (box1.intersectsBox(box2)) {
                // poof
                this.makeParticles(this.winEmitter, draggedCar.position);

                // last two cars, so swap out for police
                if (this.cars.length === 2) {
                  this.gameOver = true;
                  this.carPolice.position.set(draggedCar.position.x, 0, draggedCar.position.z);

                  scene.scene3D.add(this.carPolice);
                  scene.scene3D.remove(draggedCar);
                  scene.scene3D.remove(tempCar);

                  createjs.Tween.get(this.carPolice.scale)
                    .to({x: .0045, y: .0045, z: .0045}, 100)
                    .to({x: .0025, y: .0025, z: .0025}, 200)
                    .to({x: .004, y: .004, z: .004}, 100);
                }
                else {
                  // embiggen one
                  createjs.Tween.get(draggedCar.scale)
                    .to({x: .0025, y: .0025, z: .0025}, 100)
                    .to({x: .0015, y: .0015, z: .0015}, 200)
                    .to({x: .002, y: .002, z: .002}, 100);
  
                  // destroy other
                  scene.scene3D.remove(tempCar);
                  this.cars.splice(i, 1);
                }
              }

              break;
            }
          }
        
          // return to normal
          draggedCar = null;
          document.body.style.cursor = 'default';
        });

        // remove guide
        scene.scene3D.remove(ring);
      }
    });
  }
  buildParticleGroup() {
    // parent emitter holder
    this.particleGroup = new SPE.Group({
      texture: {
        value: this.textures[4]
      },
      blending: THREE.NormalBlending,
      hasPerspective: true,
      transparent: true,
      maxParticleCount: 1000
    });
    
    // smoke effect
    this.smokeEmitter = new SPE.Emitter({
      particleCount: 20,
      activeMultiplier: 3,
      type: SPE.distributions.SPHERE,
      position: {
        radius: .1
      },
      maxAge: { value: 1 },
      duration: 0.8,
      velocity: {
        value: new THREE.Vector3( 0.25 )
      },
      size: { value: [.25, .75] },
      color: {
        value: new THREE.Color(0xfafafa)
      },
      opacity: { value: [.25, 0] }
    });
    
    // merge effect
    this.winEmitter = new SPE.Emitter({
      particleCount: 100,
      activeMultiplier: 100,
      type: SPE.distributions.DISC,
      position: {
        radius: .1
      },
      maxAge: { value: 1 },
      duration: 0.8,
      velocity: {
        value: new THREE.Vector3( 2 )
      },
      size: { value: [0, .5, 0] },
      color: {
        value: new THREE.Color(0x00FF00)
      },
      opacity: { value: 1 }
    });

    this.smokeEmitter.disable();
    this.winEmitter.disable();

    this.particleGroup.addEmitter(this.smokeEmitter);
    this.particleGroup.addEmitter(this.winEmitter);

    scene.scene3D.add(this.particleGroup.mesh);
  }
  makeParticles(emitter, position) {
    emitter.position.value = position;
    emitter.reset(true);
    emitter.enable();
  }
  setCamera() {
    scene.camera.position.set(0, 10, 10);
    scene.camera.lookAt(new THREE.Vector3(0, 0, 0)); // set the correct camera angle
  }
  update() {
    requestAnimationFrame(this.update.bind(this));
    this.deltaTime = this.clock.getDelta();
    this.particleGroup.tick(this.deltaTime);
  }
}
