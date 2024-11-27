import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GUI } from "lil-gui";

import { InfiniteGridHelper } from "./InfiniteGridHelper";

const textureLoader = new THREE.TextureLoader();
const textures = [
  "crate.jpg",
  "benedict.png",
  "grakovski.jpg",
  "pavlyuk.jpg",
  "savrasovs.jpg",
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
camera.position.set(5, 5, 10);

// Setup the renderer.
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Setup the graphical user interface.
const gui = new GUI();
gui.addColor(scene, "background");

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

const objectGeometries = [
  new THREE.CapsuleGeometry(),
  new THREE.BoxGeometry(),
  new THREE.SphereGeometry(),
  new THREE.DodecahedronGeometry(),
  new THREE.TorusGeometry(),
];

// For now, populate the scene with some cubes.
for (let i = 0; i < 5; i++) {
  const geometry = objectGeometries[i];
  const material = new THREE.MeshStandardMaterial({ map: textures[i] });

  const cube = new THREE.Mesh(geometry, material);
  cube.position.set(i * 3 - 6, 0, 0);

  selectableObjects.push(cube);
  scene.add(cube);
}

const objectLoader = new GLTFLoader();
objectLoader.load("suzanne.glb", (gltf) => {
  const object = gltf.scene.children[0];
  object.position.set(-7, 3, 4);
  object.rotation.set(2.5, 0.8, -2.7);
  object.material = new THREE.MeshStandardMaterial({ map: textures[1] });
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
ambientLightFolder.addColor(ambientLight, "color");
ambientLightFolder.add(ambientLight, "intensity", 0, 100);

// Add point lighting to the scene.
createPointLightSource({ x: +5, y: +5, z: 0, color: 0xff0000, intensity: 100 });
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
  x: -1.5,
  y: 2,
  z: -3,
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
    positionFolder.add(selectedObject.position, "x").listen();
    positionFolder.add(selectedObject.position, "y").listen();
    positionFolder.add(selectedObject.position, "z").listen();

    const selectedLight = selectedObject.userData.light;
    if (selectedLight) {
      // Light sources may only be moved.
      transformControls.setMode("translate");

      // Add light source controls.
      const lightFolder = selectedObjectFolder.addFolder("Light");
      lightFolder.addColor(selectedLight, "color");
      if (selectedLight.type == "PointLight") {
        lightFolder.add(selectedLight, "intensity", 0, 200);
        lightFolder.add(selectedLight, "distance", 0, 100);
        lightFolder.add(selectedLight, "decay", 0, 5);
      } else if (selectedLight.type == "SpotLight") {
        lightFolder.add(selectedLight, "intensity", 0, 200);
        lightFolder.add(selectedLight, "penumbra", 0, 1);
        lightFolder.add(selectedLight, "angle", 0, Math.PI / 2);
      } else if (selectedLight.type == "DirectionalLight") {
        lightFolder.add(selectedLight, "intensity", 0, 10);
      }
    } else {
      // Add object scale controls.
      const scaleFolder = selectedObjectFolder.addFolder("Scale");
      scaleFolder.add(selectedObject.scale, "x").listen();
      scaleFolder.add(selectedObject.scale, "y").listen();
      scaleFolder.add(selectedObject.scale, "z").listen();

      // Add object rotation controls.
      const rotationFolder = selectedObjectFolder.addFolder("Rotation");
      rotationFolder.add(selectedObject.rotation, "x").listen();
      rotationFolder.add(selectedObject.rotation, "y").listen();
      rotationFolder.add(selectedObject.rotation, "z").listen();

      // Add object texture controls.
      const textureFolder = selectedObjectFolder.addFolder("Texture");
      textureFolder.add(selectedObject.material.map.offset, "x", 0, 1);
      textureFolder.add(selectedObject.material.map.offset, "y", 0, 1);
      textureFolder.add(
        selectedObject.material.map,
        "rotation",
        0,
        2 * Math.PI
      );
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
