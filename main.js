import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import { TeapotGeometry } from "three/addons/geometries/TeapotGeometry.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GUI } from "lil-gui";

import { InfiniteGridHelper } from "./InfiniteGridHelper";

const textureLoader = new THREE.TextureLoader();
const textures = [
  "textures/grakovski.jpg",
  "textures/teapot.png",
  "textures/earth.png",
  "textures/spot.png",
  "textures/tsi.png",
  "textures/bird_diffuse.jpg",
  "textures/bird_normal.jpg",
  "textures/statue_diffuse.jpg",
].map((name) => {
  const texture = textureLoader.load(name);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
});

// Setup the scene.
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x3f3f3f);

// Setup the camera.
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000.0
);
camera.position.set(-1, 3, 12);

// Setup the renderer.
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Setup the graphical user interface.
const gui = new GUI();
gui.addColor(scene, "background").name("Background");

const cameraFolder = gui.addFolder("Camera");
cameraFolder.add(camera.position, "x").name("Position, X").listen();
cameraFolder.add(camera.position, "y").name("Position, Y").listen();
cameraFolder.add(camera.position, "z").name("Position, Z").listen();

// Setup the Blender-like camera controls.
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.screenSpacePanning = false;
orbitControls.minDistance = 2;
orbitControls.maxDistance = 50;

// Setup object transformation controls (translation, scaling, rotation).
const transformControls = new TransformControls(camera, renderer.domElement);
transformControls.addEventListener("dragging-changed", (event) => {
  orbitControls.enabled = !event.value;
});

// Setup the gizmo for visualization of the transform controls.
const transformControlsGizmo = new THREE.Group();
transformControlsGizmo.add(transformControls.getHelper());
scene.add(transformControlsGizmo);

// Setup scene objects.
const selectableObjects = [];
let selectedObject = null;
let selectedObjectFolder = null;

const geometry = new TeapotGeometry(1, 4);
const material = new THREE.MeshPhongMaterial({
  map: textures[1],
  shininess: 50,
  specular: 0xc9c9c9,
});

const object = new THREE.Mesh(geometry, material);
object.scale.set(1.5, 1.5, 1.5);
object.position.set(0, 0, 0);
object.rotation.set(0, -0.7, 0);

selectableObjects.push(object);
scene.add(object);

const glftLoader = new GLTFLoader();
glftLoader.load("models/suzanne.glb", (gltf) => {
  const object = gltf.scene.children[0];
  object.position.set(-4, 3, 0.5);
  object.rotation.set(0.07, 0.63, -0.12);
  object.material = new THREE.MeshPhongMaterial({ map: textures[2] });
  selectableObjects.push(object);
  scene.add(object);
});

const objLoader = new OBJLoader();
objLoader.load("models/spot.obj", (obj) => {
  const object = obj.children[0];
  object.material = new THREE.MeshPhongMaterial({ map: textures[3] });
  object.scale.set(2, 2, 2);
  object.position.set(4.5, 1, 1);
  object.rotation.set(-3.05, 0.74, -3.12);
  selectableObjects.push(object);
  scene.add(object);
});

objLoader.load("models/rat.obj", (obj) => {
  const object = obj.children[0];
  object.material = new THREE.MeshPhongMaterial({ map: textures[4] });
  object.scale.set(0.05, 0.05, 0.05);
  object.position.set(-5, -1, 3);
  object.rotation.set(-0.1, -0.57, 0.03);
  selectableObjects.push(object);
  scene.add(object);
});

objLoader.load("models/bird.obj", (obj) => {
  const object = obj.children[0];
  object.material = new THREE.MeshPhongMaterial({
    map: textures[5],
    normalMap: textures[6],
  });
  object.scale.set(0.15, 0.15, 0.15);
  object.position.set(5.4, 1.96, 3.73);
  object.rotation.set(-1.66, 0.04, 0.59);
  selectableObjects.push(object);
  scene.add(object);
});

objLoader.load("models/statue.obj", (obj) => {
  const object = obj.children[0];
  object.material = new THREE.MeshPhongMaterial({
    map: textures[0],
  });
  object.scale.set(0.01, 0.01, 0.01);
  object.position.set(5.18, -0.95, 3.99);
  object.rotation.set(-1.66, 0.05, -0.75);
  object.material.map.offset.set(0.2, 0.11);
  selectableObjects.push(object);
  scene.add(object);
});

// Add a grid to the scene for reference.
scene.add(new InfiniteGridHelper(1, 1, 0xaaaaaa));

// Setup the light sources.
const lights = [];

function createPointLightSource({ x, y, z, color, intensity }) {
  // Create the light source object itself.
  const light = new THREE.PointLight(color, intensity);
  light.position.set(x, y, z);
  scene.add(light);

  // Setup geometry and material for the light's mesh.
  const meshGeometry = new THREE.SphereGeometry(0.2, 16, 16);
  const meshMaterial = new THREE.MeshBasicMaterial({ color });

  // Create a sphere mesh to represent the light's source.
  const sourceMesh = new THREE.Mesh(meshGeometry, meshMaterial);
  sourceMesh.position.set(x, y, z);
  sourceMesh.userData.light = light;
  scene.add(sourceMesh);

  // Make the light source mesh selectable.
  selectableObjects.push(sourceMesh);

  // Register the light source.
  lights.push({ light, mesh: sourceMesh });
}

function createDirectionalLightSource({
  x,
  y,
  z,
  tx,
  ty,
  tz,
  color,
  intensity,
}) {
  // Create the light source object itself.
  const light = new THREE.DirectionalLight(color, intensity);
  light.position.set(x, y, z);
  scene.add(light);

  // Setup geometry and material for the light's mesh.
  const meshGeometry = new THREE.SphereGeometry(0.2, 16, 16);
  const meshMaterial = new THREE.MeshBasicMaterial({ color });

  // Create a sphere mesh to represent the light's source.
  const sourceMesh = new THREE.Mesh(meshGeometry, meshMaterial);
  sourceMesh.position.set(x, y, z);
  sourceMesh.userData.light = light;
  scene.add(sourceMesh);

  // Create a sphere mesh to represent the light's target.
  const targetMesh = new THREE.Mesh(meshGeometry, meshMaterial);
  targetMesh.position.set(tx || 0, ty || 0, tz || 0);
  targetMesh.userData.light = light;
  scene.add(targetMesh);

  // Set the light's target to a custom object.
  light.target = targetMesh;

  selectableObjects.push(sourceMesh);
  selectableObjects.push(targetMesh);

  // Add a visualization of the light source's direction.
  const helper = new THREE.DirectionalLightHelper(light);
  scene.add(helper);

  // Register the light source.
  lights.push({ light, mesh: sourceMesh, helper });
}

function createSpotLightSource({ x, y, z, tx, ty, tz, color, intensity }) {
  // Create the light source object itself.
  const light = new THREE.SpotLight(color, intensity);
  light.angle = Math.PI / 16;
  light.position.set(x, y, z);
  scene.add(light);

  // Setup geometry and material for the light's mesh.
  const meshGeometry = new THREE.SphereGeometry(0.2, 16, 16);
  const meshMaterial = new THREE.MeshBasicMaterial({ color });

  // Create a sphere mesh to represent the light's source.
  const sourceMesh = new THREE.Mesh(meshGeometry, meshMaterial);
  sourceMesh.position.set(x, y, z);
  sourceMesh.userData.light = light;
  scene.add(sourceMesh);

  // Create a sphere mesh to represent the light's target.
  const targetMesh = new THREE.Mesh(meshGeometry, meshMaterial);
  targetMesh.position.set(tx || 0, ty || 0, tz || 0);
  targetMesh.userData.light = light;
  scene.add(targetMesh);

  // Set the light's target to a custom object.
  light.target = targetMesh;

  selectableObjects.push(sourceMesh);
  selectableObjects.push(targetMesh);

  // Add a visualization of the light source's direction.
  const helper = new THREE.SpotLightHelper(light);
  scene.add(helper);

  // Register the light source.
  lights.push({ light, mesh: sourceMesh, helper });
}

// Add ambient lighting to the scene.
const ambientLight = new THREE.AmbientLight(0x3f3f3f, 5);
scene.add(ambientLight);

const ambientLightFolder = gui.addFolder("Ambient Light");
ambientLightFolder.addColor(ambientLight, "color").name("Color");
ambientLightFolder.add(ambientLight, "intensity", 0, 100).name("Intensity");

// Add point lighting to the scene.
createPointLightSource({ x: +5, y: +5, z: 0, color: 0xff0000, intensity: 100 });
createPointLightSource({ x: -5, y: +5, z: 0, color: 0x00ff00, intensity: 100 });
createPointLightSource({ x: -5, y: -5, z: 0, color: 0x0000ff, intensity: 100 });

// Add directional lighting to the scene.
createDirectionalLightSource({
  x: 5,
  y: 6,
  z: 5.5,
  tx: 2,
  ty: 0,
  tz: 2,
  color: 0xffffff,
});

// Add spot lighting to the scene.
createSpotLightSource({
  x: -1,
  y: 3,
  z: -6,
  color: 0xffff80,
  intensity: 100,
});

// Adjust size and aspect ratio settings on window resize.
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// Handle keypress controls.
window.addEventListener("keydown", (event) => {
  switch (event.key) {
    case "h":
      transformControls.showX = !transformControls.showX;
      transformControls.showY = !transformControls.showY;
      transformControls.showZ = !transformControls.showZ;
      break;
    case "q":
      transformControls.setSpace(
        transformControls.space == "world" ? "local" : "world"
      );
      break;
    case "t":
      transformControls.setMode("translate");
      break;
    case "r":
      if (!selectedObject.userData.light) {
        transformControls.setMode("rotate");
      }
      break;
    case "s":
      if (!selectedObject.userData.light) {
        transformControls.setMode("scale");
      }
      break;
    case "Escape":
      transformControls.reset();
      break;
    case "w":
      selectableObjects
        .filter((object) => !object.userData.light)
        .forEach(({ material }) => (material.wireframe = !material.wireframe));
      break;
  }
});

let isDragging = false;
renderer.domElement.addEventListener("mousedown", () => (isDragging = false));
renderer.domElement.addEventListener("mousemove", () => (isDragging = true));
renderer.domElement.addEventListener("mouseup", (event) => {
  // Ignore selections while dragging the mouse.
  if (isDragging) return;

  // Convert the mouse position to normalized device coordinates.
  const mouse = new THREE.Vector2();
  mouse.x = +(event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Setup the raycaster to shoot from the camera.
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  // Remove visual indicators of the previous selection.
  transformControls.detach();
  selectedObject?.material?.emissive?.set(0);

  // Remove the GUI section for the previous selection
  selectedObjectFolder?.destroy();
  selectedObjectFolder = null;

  // Select the first intersecting object, if any.
  selectedObject = raycaster
    .intersectObjects(selectableObjects, true)
    .at(0)?.object;

  // Handle object selection logic, if anything was selected.
  if (selectedObject) {
    // Add visual indicators of the selection.
    selectedObject.material.emissive?.set(0x505050);
    transformControls.attach(selectedObject);

    // Add the GUI section for the selection.
    selectedObjectFolder = gui.addFolder("Selection");

    // Add object position controls.
    const positionFolder = selectedObjectFolder.addFolder("Position");
    positionFolder
      .add(selectedObject.position, "x")
      .name("Position, X")
      .listen();
    positionFolder
      .add(selectedObject.position, "y")
      .name("Position, Y")
      .listen();
    positionFolder
      .add(selectedObject.position, "z")
      .name("Position, Z")
      .listen();

    const selectedLight = selectedObject.userData.light;
    if (selectedLight) {
      // Light sources may only be moved.
      transformControls.setMode("translate");

      // Add light source controls.
      const lightFolder = selectedObjectFolder.addFolder("Light");
      lightFolder.addColor(selectedLight, "color").name("Color");
      if (selectedLight.type == "PointLight") {
        lightFolder.add(selectedLight, "intensity", 0, 200).name("Intensity");
        lightFolder.add(selectedLight, "distance", 0, 100).name("Distance");
        lightFolder.add(selectedLight, "decay", 0, 5).name("Decay");
      } else if (selectedLight.type == "SpotLight") {
        lightFolder.add(selectedLight, "intensity", 0, 200).name("Intensity");
        lightFolder.add(selectedLight, "penumbra", 0, 1).name("Penumbra");
        lightFolder.add(selectedLight, "angle", 0, Math.PI / 2).name("Angle");
      } else if (selectedLight.type == "DirectionalLight") {
        lightFolder.add(selectedLight, "intensity", 0, 10).name("Intensity");
      }
    } else {
      // Add object scale controls.
      const scaleFolder = selectedObjectFolder.addFolder("Scale");
      scaleFolder.add(selectedObject.scale, "x").name("Scale, X").listen();
      scaleFolder.add(selectedObject.scale, "y").name("Scale, Y").listen();
      scaleFolder.add(selectedObject.scale, "z").name("Scale, Z").listen();

      // Add object rotation controls.
      const rotationFolder = selectedObjectFolder.addFolder("Rotation");
      rotationFolder
        .add(selectedObject.rotation, "x")
        .name("Rotation, X")
        .listen();
      rotationFolder
        .add(selectedObject.rotation, "y")
        .name("Rotation, Y")
        .listen();
      rotationFolder
        .add(selectedObject.rotation, "z")
        .name("Rotation, Z")
        .listen();

      // Add object texture controls.
      const textureFolder = selectedObjectFolder.addFolder("Texture");
      if (selectedObject.material.normalMap) {
        textureFolder
          .add(selectedObject.material.normalScale, "x", 0, 10)
          .name("Normal, X");
        textureFolder
          .add(selectedObject.material.normalScale, "y", 0, 10)
          .name("Normal, Y");
      } else {
        textureFolder
          .add(selectedObject.material.map.offset, "x", 0, 1)
          .name("Offset, X");
        textureFolder
          .add(selectedObject.material.map.offset, "y", 0, 1)
          .name("Offset, Y");
      }

      textureFolder
        .add(selectedObject.material.map, "rotation", 0, 2 * Math.PI)
        .name("Rotation");
    }
  }
});

// Define the main loop of the application.
renderer.setAnimationLoop(() => {
  // Update the controls.
  orbitControls.update();

  // Update the light sources.
  for (const { light, mesh, helper } of lights) {
    // Ensure that the light source is in sync with its mesh.
    light.position.copy(mesh.position);
    mesh.material.color.copy(light.color);

    if (light.type == "SpotLight") {
      light.distance = light.target.position.distanceTo(light.position);
    }

    // Ensure that the helper is in sync with its light source.
    helper?.update();
  }

  // Ensure that the transform gizmo is smaller for objects which are far away.
  if (selectedObject) {
    const distance = camera.position.distanceTo(selectedObject.position);
    transformControls.size = Math.max(1 / (distance * 0.1), 0.2);
  }

  // Render the scene.
  renderer.render(scene, camera);
});
