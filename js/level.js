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
        {name: 'level', path: 'models/level.fbx'},
        {name: 'carPolice', path: 'models/car_police.fbx'},
        {name: 'carRed', path: 'models/car_red.fbx'},
        {name: 'carBlue', path: 'models/car_blue.fbx'}
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
        this.textureLoader.load('img/tex_car_blue.jpg')
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
      this.cars[i].position.set(0.25, 0, 0.25);
      scene.scene3D.add(this.cars[i]);
    }

    // drag controls
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let draggedCar;
    let panel;
    let line;

    window.addEventListener('mousedown', (event) => {
      // prevent dragging
      if (draggedCar || this.gameOver) return;

      // check for mouse over car
      const intersects = raycaster.intersectObjects(this.cars, true);

      if (intersects[0] && intersects[0].object.name.indexOf("car") !== -1) {
        draggedCar = intersects[0].object.parent;

        // add drag guides to scene
        const material = new THREE.LineBasicMaterial({color: 0xffff00});
        const points = [];
        points.push(new THREE.Vector3(draggedCar.position.x, 0, draggedCar.position.z));
        points.push(new THREE.Vector3(draggedCar.position.x, 0, draggedCar.position.z));

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        line = new THREE.Line(geometry, material);
        scene.scene3D.add(line);

        panel = new THREE.Mesh(
          new THREE.PlaneGeometry(0.5, 0.5, 0.5),
          new THREE.MeshBasicMaterial({color: 0xffff00, side: THREE.DoubleSide})
        );
        panel.rotateX(-Math.PI / 2);
        panel.position.set(draggedCar.position.x, draggedCar.position.y, draggedCar.position.z);
        scene.scene3D.add(panel);
      }
    });

    window.addEventListener('mousemove', (event) => {
      // update mouse coords
      mouse.set( 
        (event.clientX / window.innerWidth) * 2 - 1, 
        -(event.clientY / window.innerHeight) * 2 + 1 
      );
      raycaster.setFromCamera(mouse, scene.camera);

      if (draggedCar) {
        const intersects = raycaster.intersectObjects(this.level.children);

        if (intersects[0]) {
          // update drag guides
          panel.position.set(
            Math.round(intersects[0].point.x / .5) * .5 - .25, 
            0, 
            Math.round(intersects[0].point.z / .5) * .5 - .25
          );

          // set boundaries
          panel.position.clamp(new THREE.Vector3(-4.75, 0, -4.75), new THREE.Vector3(5, 0, 5));
  
          const points = line.geometry.attributes.position.array;
          points[3] = panel.position.x;
          points[5] = panel.position.z;
          line.geometry.attributes.position.needsUpdate = true;
        }
      }
    });

    window.addEventListener('mouseup', (event) => {
      if (draggedCar) {
        draggedCar.lookAt(panel.position);
        draggedCar.rotateX(-.5);

        // move car to location  
        createjs.Tween.get(draggedCar.position).to(panel.position, 500).call(() => {
          draggedCar.rotation.set(0, 0, 0);

          // check for overlapping cars
          for (let i = 0; i < this.cars.length; i++) {
            const tempCar = this.cars[i];

            // ignore self but look for correct color
            if (tempCar !== draggedCar && (tempCar.name === draggedCar.name || this.cars.length === 2)) {
              const box1 = new THREE.Box3().setFromObject(tempCar);
              const box2 = new THREE.Box3().setFromObject(draggedCar);

              if (box1.intersectsBox(box2)) {
                // embiggen
                createjs.Tween.get(draggedCar.scale)
                  .to({x: .0025, y: .0025, z: .0025}, 100)
                  .to({x: .0015, y: .0015, z: .0015}, 200)
                  .to({x: .002, y: .002, z: .002}, 100);

                // destroy
                scene.scene3D.remove(tempCar);
                this.cars.splice(i, 1);

                // last car, so swap out for police
                if (this.cars.length === 1) {
                  this.gameOver = true;
                  this.carPolice.position.set(draggedCar.position.x, 0, draggedCar.position.z);

                  createjs.Tween.get(this.carPolice.scale)
                    .to({x: .0045, y: .0045, z: .0045}, 100)
                    .to({x: .0025, y: .0025, z: .0025}, 200)
                    .to({x: .004, y: .004, z: .004}, 100);

                  scene.scene3D.add(this.carPolice);
                  scene.scene3D.remove(draggedCar);
                }
              }

              break;
            }
          }
        
          draggedCar = null;
        });

        // remove guides
        scene.scene3D.remove(line);
        scene.scene3D.remove(panel);
      }
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
