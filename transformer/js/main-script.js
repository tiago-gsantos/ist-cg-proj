import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { VRButton } from "three/addons/webxr/VRButton.js";
import * as Stats from "three/addons/libs/stats.module.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { MOVEMENT_SPEED, MOVEMENT_TRAILER_SPEED, ROTATION_SPEED } from "./constants.js";
import { GEOMETRY, OFFSET, MOVEMENTS, ANIMATION, ANIMATION_POINTS } from "./constants.js";

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////
let renderer, scene, activeCamera, prevTimestamp;

let wireframe = false;
let wasCollidingLastFrame = false;

let FEET, LEGS, ARMS, HEAD, TRAILER, TRANSFORMER, UPPERBODY_AABB;
let LEGS_AABB; // same as LEGS but without legTrailerPiece to avoid false collisions

let collidingState = ANIMATION.NONE;

let trailerWheels = [];

const MATERIAL = {
  red: new THREE.MeshBasicMaterial({ color: 0xb4192c, wireframe: wireframe}),
  lightRed: new THREE.MeshBasicMaterial({ color: 0xd5343a, wireframe: wireframe}),
  lightLightRed: new THREE.MeshBasicMaterial({ color: 0xed494d, wireframe: wireframe}),
  blue: new THREE.MeshBasicMaterial({ color: 0x020c65, wireframe: wireframe}),
  lightBlue: new THREE.MeshBasicMaterial({ color: 0x54547f, wireframe: wireframe}),
  grey: new THREE.MeshBasicMaterial({ color: 0x8c8c8c, wireframe: wireframe}),
  lightGrey: new THREE.MeshBasicMaterial({ color: 0xbebebe, wireframe: wireframe}),
  yellow: new THREE.MeshBasicMaterial({ color: 0xc5c11d, wireframe: wireframe}),
  black: new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: wireframe}),
};

// AABB's
let upperBodyAABB = {
  min: [Infinity,Infinity,Infinity],
  max: [Infinity,Infinity,Infinity],
};
let lowerBodyAABB = {
  min: [Infinity,Infinity,Infinity],
  max: [Infinity,Infinity,Infinity],
};
let trailerAABB = {
  min: [Infinity,Infinity,Infinity],
  max: [Infinity,Infinity,Infinity],
};

const cameras = {
  front: null,
  side: null,
  top: null,
  perspective: null
};

const keys = {
  'Q': false,
  'A': false,
  'W': false,
  'S': false,
  'E': false,
  'D': false,
  'R': false,
  'F': false,
  'ArrowUp': false,
  'ArrowDown': false,
  'ArrowLeft': false,
  'ArrowRight': false,
}

/////////////////////
/* CREATE SCENE(S) */
/////////////////////
function createScene() {
  scene = new THREE.Scene();
  scene.add(new THREE.AxesHelper(5));
  scene.background = new THREE.Color(0xe3e3e3);

  createTransformer();
  createTrailer();
}

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////
function createCameras() {
  const aspect = window.innerWidth / window.innerHeight;
  const viewSize = 10;

  cameras.front = new THREE.OrthographicCamera(
    -viewSize * aspect,
    viewSize * aspect,
    viewSize,
    -viewSize,
    0.1,
    1000
  );
  cameras.front.position.set(0, 0, 20);
  cameras.front.lookAt(0, 0, 0);

  cameras.side = new THREE.OrthographicCamera(
    -viewSize * aspect,
    viewSize * aspect,
    viewSize,
    -viewSize,
    0.1,
    1000
  );
  cameras.side.position.set(50, 0, 0);
  cameras.side.lookAt(0, 0, 0);

  cameras.top = new THREE.OrthographicCamera(
    -viewSize * aspect,
    viewSize * aspect,
    viewSize,
    -viewSize,
    0.1,
    1000
  );
  cameras.top.position.set(0, 50, 0);
  cameras.top.lookAt(0, 0, 0);

  cameras.perspective = new THREE.PerspectiveCamera(
    25,
    aspect,
    0.1,
    1000
  );
  cameras.perspective.position.set(30, 30, 30);
  cameras.perspective.lookAt(0, 0, 0);
  cameras.perspective.updateProjectionMatrix();

  activeCamera = cameras.front;
}

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////
function createTransformer() {
  TRANSFORMER = new THREE.Group();
  scene.add(TRANSFORMER);

  // BODY
  UPPERBODY_AABB = new THREE.Group();
  TRANSFORMER.add(UPPERBODY_AABB);
  const chest = createCube('chest', 'red', UPPERBODY_AABB);
  const back = createCube('back', 'lightLightRed', chest);
  const abdomen = createCube('abdomen', 'lightRed', chest);
  const waist = createCube('waist', 'red', abdomen);
  const waistWheel = createCylinder('wheel', 'black', waist, 'waistWheel');
  waistWheel.rotation.z = Math.PI / 2;
  const waistWheelMirror = createSymmetricX(waistWheel);

  // LEGS
  LEGS = new THREE.Group();
  TRANSFORMER.add(LEGS);
  LEGS.position.set(OFFSET['legPivot'].x, OFFSET['legPivot'].y, OFFSET['legPivot'].z);

  LEGS_AABB = new THREE.Group();
  LEGS.add(LEGS_AABB);
  
  const thigh = createCube('thigh', 'grey', LEGS_AABB);
  const leg = createCube('leg', 'blue', thigh);
  const topLegWheel = createCylinder('wheel', 'black', leg, 'topLegWheel');
  topLegWheel.rotation.z = Math.PI / 2;
  const bottomLegWheel = createCylinder('wheel', 'black', leg, 'bottomLegWheel');
  bottomLegWheel.rotation.z = Math.PI / 2;
  const thighMirror = createSymmetricX(thigh);
  const legTrailerPiece = createCube('legTrailerPiece', 'lightBlue', LEGS); // not included in LEGS_AABB
  const legTrailerPieceMirror = createSymmetricX(legTrailerPiece);
  
  // FEET
  FEET = new THREE.Group();
  LEGS_AABB.add(FEET);
  FEET.position.set(OFFSET['footPivot'].x, OFFSET['footPivot'].y, OFFSET['footPivot'].z);

  const foot = createCube('foot', 'lightBlue', FEET);
  const footMirror = createSymmetricX(foot);

  // ARMS
  ARMS = new THREE.Group();
  UPPERBODY_AABB.add(ARMS);

  const arm = createCube('arm', 'lightRed', ARMS);
  const forearm = createCube('forearm', 'lightLightRed', arm);
  const bottomExhaust = createCylinder('bottomExhaust', 'grey', arm);
  const topExhaust = createCylinder('topExhaust', 'lightGrey', bottomExhaust);
  const armMirror = createSymmetricX(arm);

  // HEAD
  HEAD = new THREE.Group();
  UPPERBODY_AABB.add(HEAD);
  HEAD.position.set(OFFSET['headPivot'].x, OFFSET['headPivot'].y, OFFSET['headPivot'].z);

  const head = createCube('head', 'blue', HEAD);
  const headComponents = new THREE.Group();
  head.add(headComponents);
  const bottomAntenna = createCylinder('bottomAntenna', 'lightBlue', headComponents);
  bottomAntenna.rotation.z = Math.PI / 2;
  const topAntenna = createCone('topAntenna', 'lightBlue', headComponents);
  const eye = createCube('eye', 'yellow', headComponents);
  const headComponentsMirror = createSymmetricX(headComponents);
  head.add(headComponentsMirror);
}

function createTrailer() {
  TRAILER = new THREE.Group();
  TRANSFORMER.add(TRAILER);
  TRAILER.position.set(OFFSET['trailer'].x, OFFSET['trailer'].y, OFFSET['trailer'].z);

  const trailerBase = createCube('trailerBase', 'lightBlue', TRAILER);
  const trailerContainer = createCube('trailerContainer', 'grey', TRAILER);

  const trailerHitch = createCube('trailerHitch', 'blue', TRAILER);

  const frontLeftWheel = createCylinder('wheel', 'black', TRAILER, 'wheelTrailerFront');
  frontLeftWheel.rotation.z = Math.PI / 2;
  trailerWheels.push(frontLeftWheel);
  trailerWheels.push(createSymmetricX(frontLeftWheel));

  const backLeftWheel = createCylinder('wheel', 'black', TRAILER, 'wheelTrailerBack');
  backLeftWheel.rotation.z = Math.PI / 2;
  trailerWheels.push(backLeftWheel);
  trailerWheels.push(createSymmetricX(backLeftWheel));
}

function createCube(name, color, parent, offsetName = name) {
  const { w, h, d } = GEOMETRY[name];
  const { x, y, z } = OFFSET[offsetName];

  const geometry = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geometry, MATERIAL[color]);
  
  parent.add(mesh);
  mesh.position.set(x, y, z);

  return mesh;
}

function createCylinder(name, color, parent, offsetName = name) {
  const { r, h } = GEOMETRY[name];
  const { x, y, z } = OFFSET[offsetName];

  const geometry = new THREE.CylinderGeometry(r, r, h, 16);
  const mesh = new THREE.Mesh(geometry, MATERIAL[color]);
  parent.add(mesh);
  mesh.position.set(x, y, z);

  return mesh;
}

function createCone(name, color, parent, offsetName = name) {
  const { r, h } = GEOMETRY[name];
  const { x, y, z } = OFFSET[offsetName];

  const geometry = new THREE.ConeGeometry(r, h);
  const mesh = new THREE.Mesh(geometry, MATERIAL[color]);
  
  parent.add(mesh);
  mesh.position.set(x, y, z);

  return mesh;
}

function createSymmetricX(object) {
  const mirrorObject = object.clone(true);
  mirrorObject.position.x = -object.position.x;
  mirrorObject.scale.x = -1;
  object.parent.add(mirrorObject);

  return mirrorObject;
}

//////////////////////
/* CHECK COLLISIONS */
//////////////////////
function checkCollisions() { 
  const currentlyColliding = hasCollision();

  if (collidingState == ANIMATION.NONE && currentlyColliding && !wasCollidingLastFrame) {
    collidingState = ANIMATION.STARTING_POINT;
  }

  wasCollidingLastFrame = currentlyColliding;
}


function hasCollision() {
  return checkAABBCollision(trailerAABB, upperBodyAABB) || checkAABBCollision(trailerAABB, lowerBodyAABB);
}


function checkAABBCollision(box1, box2) {
  return (box1.min[0] < box2.max[0] && box1.max[0] > box2.min[0]) &&
         (box1.min[1] < box2.max[1] && box1.max[1] > box2.min[1]) &&
         (box1.min[2] < box2.max[2] && box1.max[2] > box2.min[2]);
}

///////////////////////
/* HANDLE COLLISIONS */
///////////////////////
function handleCollisions(timeDelta) {
  const threshold = 0.01;
  
  if(collidingState === ANIMATION.NONE || collidingState === ANIMATION.DONE) return;

  // Animation for TruckMode
  if(!isInTruckMode()) {
    rotate(false, 'head', HEAD, timeDelta);
    rotate(true, 'feet', FEET, timeDelta);
    rotate(true, 'lowBody', LEGS, timeDelta);
    moveArms(true, timeDelta);
    updateAABB('upperBody');
    updateAABB('lowerBody');
  }
  
  // Animation for Trailer
  if(collidingState != ANIMATION.STARTING_POINT && TRAILER.position.distanceToSquared(ANIMATION_POINTS[collidingState]) >= threshold) {
    const direction = calculateDirectionToPoint(TRAILER, ANIMATION_POINTS[collidingState]);
    move(direction.x, direction.y, direction.z, timeDelta, TRAILER);

    return;
  }
  
  // snap to point and recalculate trailer's AABB
  TRAILER.position.copy(ANIMATION_POINTS[collidingState++]);
  updateAABB('trailer');
}

////////////
/* UPDATE */
////////////
function update(timeDelta) {
  for (const key in keys) {
    if (keys[key] === true) {
      updateMovement(key, timeDelta);
    }
  }

  checkCollisions();
  handleCollisions(timeDelta);
}

/////////////
/* DISPLAY */
/////////////
function render() {
  renderer.render(scene, activeCamera);
}

////////////////////////////////
/* INITIALIZE ANIMATION CYCLE */
////////////////////////////////
function init() {
  renderer = new THREE.WebGLRenderer({
      antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  createScene();
  createCameras();

  updateAABB();

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////
function animate(timestamp) {
  const timeDelta = timestamp - prevTimestamp;

  update(timeDelta);

  render();

  prevTimestamp = timestamp;
  requestAnimationFrame(animate);
}

///////////////////////
/* KEY DOWN CALLBACK */
///////////////////////
function onKeyDown(event) {
  const key = event.code;
  
  if (keyHandlers[key]) keyHandlers[key](false);
}

///////////////////////
/* KEY UP CALLBACK */
///////////////////////
function onKeyUp(event) {
  const key = event.code;

  if (keyHandlers[key]) keyHandlers[key](true);
}

//////////////////////
/* UTILITIES - KEYS */
//////////////////////
const keyHandlers = {
  Digit1: (isKeyUp) => changeActiveCamera(cameras.front, isKeyUp),
  Digit2: (isKeyUp) => changeActiveCamera(cameras.side, isKeyUp),
  Digit3: (isKeyUp) => changeActiveCamera(cameras.top, isKeyUp),
  Digit4: (isKeyUp) => changeActiveCamera(cameras.perspective, isKeyUp),
  Digit7: (isKeyUp) => toggleWireframe(isKeyUp),
  KeyQ: (isKeyUp) => {keys['Q'] = !isKeyUp},
  KeyA: (isKeyUp) => {keys['A'] = !isKeyUp},
  KeyW: (isKeyUp) => {keys['W'] = !isKeyUp},
  KeyS: (isKeyUp) => {keys['S'] = !isKeyUp},
  KeyE: (isKeyUp) => {keys['E'] = !isKeyUp},
  KeyD: (isKeyUp) => {keys['D'] = !isKeyUp},
  KeyR: (isKeyUp) => {keys['R'] = !isKeyUp},
  KeyF: (isKeyUp) => {keys['F'] = !isKeyUp},
  ArrowUp:    (isKeyUp) => {keys['ArrowUp'] = !isKeyUp},
  ArrowDown:  (isKeyUp) => {keys['ArrowDown'] = !isKeyUp},
  ArrowLeft:  (isKeyUp) => {keys['ArrowLeft'] = !isKeyUp},
  ArrowRight: (isKeyUp) => {keys['ArrowRight'] = !isKeyUp},
};

function toggleWireframe(isKeyUp) {
  if(!isKeyUp) {
    wireframe = !wireframe;
    for (const key in MATERIAL) {
      MATERIAL[key].wireframe = wireframe;
    }
  }
}

function changeActiveCamera(camera, isKeyUp) {
  if(isKeyUp) return;

  activeCamera = camera;
}

///////////////////////////
/* UTILITIES - MOVEMENTS */
///////////////////////////
function updateMovement(key, timeDelta) {
  if(collidingState !== ANIMATION.NONE && collidingState !== ANIMATION.DONE) return;

  switch (key) {
    case 'Q':
      if(wasCollidingLastFrame) break;
      rotate(true, 'feet', FEET, timeDelta);
      updateAABB('lowerBody');
      break;

    case 'A':
      if(wasCollidingLastFrame) break;
      rotate(false, 'feet', FEET, timeDelta);
      updateAABB('lowerBody');
      break;
    
    case 'W':
      if(wasCollidingLastFrame) break;
      rotate(true, 'lowBody', LEGS, timeDelta);
      updateAABB('lowerBody');
      break;

    case 'S':
      rotate(false, 'lowBody', LEGS, timeDelta);
      updateAABB('lowerBody');
      collidingState = ANIMATION.NONE;
      break;

    case 'E':
      if(wasCollidingLastFrame) break;
      moveArms(true, timeDelta);
      updateAABB('upperBody');
      break;

    case 'D':
      if(wasCollidingLastFrame) break;
      moveArms(false, timeDelta);
      updateAABB('upperBody');
      break;

    case 'R':
      if(wasCollidingLastFrame) break;
      rotate(false, 'head', HEAD, timeDelta);
      updateAABB('upperBody');
      break;

    case 'F':
      if(wasCollidingLastFrame) break;
      rotate(true, 'head', HEAD, timeDelta);
      updateAABB('upperBody');
      break;
  
    case 'ArrowUp':
      if(collidingState === ANIMATION.DONE)
        move(0, 0, MOVEMENT_SPEED, timeDelta, TRANSFORMER);
      else
        move(0, 0, MOVEMENT_SPEED, timeDelta, TRAILER);
      break;

    case 'ArrowDown':
      if(collidingState === ANIMATION.DONE) 
        move(0, 0, -MOVEMENT_SPEED, timeDelta, TRANSFORMER);
      else
        move(0, 0, -MOVEMENT_SPEED, timeDelta, TRAILER);
      break;

    case 'ArrowLeft':
      if(collidingState === ANIMATION.DONE)
        move(-MOVEMENT_SPEED, 0, 0, timeDelta, TRANSFORMER);
      else
        move(-MOVEMENT_SPEED, 0, 0, timeDelta, TRAILER);
      break;

    case 'ArrowRight':
      if(collidingState === ANIMATION.DONE)
        move(MOVEMENT_SPEED, 0, 0, timeDelta, TRANSFORMER);
      else
        move(MOVEMENT_SPEED, 0, 0, timeDelta, TRAILER);
      break;

    default:
      break;
  }
}

function rotate(direction, partName, group, timeDelta) {
  const step = ROTATION_SPEED * (timeDelta / 1000);
  
  if (direction) { 
    if (group.rotation.x < MOVEMENTS[partName].max) {
      group.rotation.x = Math.min(group.rotation.x + step, MOVEMENTS[partName].max);
    }
  } else {
    if (group.rotation.x > MOVEMENTS[partName].min) {
      group.rotation.x = Math.max(group.rotation.x - step, MOVEMENTS[partName].min);
    }
  }
}

function moveArms(direction, timeDelta) {
  const step = MOVEMENT_SPEED * (timeDelta / 1000);

  if (direction) {
    if (ARMS.children[1].position.x < MOVEMENTS['arms'].max) {
      ARMS.children[1].position.x = Math.min(ARMS.children[1].position.x + step, MOVEMENTS['arms'].max);
      ARMS.children[0].position.x = -ARMS.children[1].position.x;
    }
  } else {
    if (ARMS.children[1].position.x > MOVEMENTS['arms'].min) {
      ARMS.children[1].position.x = Math.max(ARMS.children[1].position.x - step, MOVEMENTS['arms'].min);
      ARMS.children[0].position.x = -ARMS.children[1].position.x;
    }
  }
}

function move(deltaX, deltaY, deltaZ, timeDelta, object) {
  const step = MOVEMENT_TRAILER_SPEED * (timeDelta / 1000);

  object.position.x += deltaX * step;
  object.position.y += deltaY * step;
  object.position.z += deltaZ * step;

  if (deltaZ !== 0) {
    trailerWheels.forEach(wheel => {
      if (deltaZ > 0) {
        wheel.rotation.x += step;
      } else {
        wheel.rotation.x -= step;
      }
    });
  }

  updateAABB();
} 

//////////////////////
/* UTILITIES - AABB */
//////////////////////
/**
 * Calculates AABB's - traverses through the object3D and calculates the min and max points of that object
 * 
 * @param object3D
 * @return dictionary with min and max
 */
function calculateAABB(object3D) {
  const min = new THREE.Vector3(Infinity, Infinity, Infinity);
  const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
  
  object3D.updateMatrixWorld(true);
  
  object3D.traverse((child) => {
    if (child.isMesh && child.geometry) {

      if (!child.geometry.boundingBox) {
        child.geometry.computeBoundingBox();
      }
      
      const box = child.geometry.boundingBox.clone();
      box.applyMatrix4(child.matrixWorld);
      
      min.min(box.min);
      max.max(box.max);
    }
  });
  
  return {
    min: [min.x, min.y, min.z],
    max: [max.x, max.y, max.z]
  };
}

/**
 * Updates AABB's
 * 
 * @param aabb - possible values: 'upperBody', 'lowerBody', 'trailer' or nothing to update all AABB
 */
function updateAABB(aabb = null) {
  if(aabb === 'upperBody' || aabb === null)
    upperBodyAABB = calculateAABB(UPPERBODY_AABB);

  if(aabb === 'lowerBody' || aabb === null)
    lowerBodyAABB = calculateAABB(LEGS_AABB);

  if(aabb === 'trailer' || aabb === null) {
    trailerAABB = calculateAABB(TRAILER);
    trailerAABB.min[1] += GEOMETRY.wheel.r*2;
  }
}


///////////////
/* UTILITIES */
///////////////
function calculateDirectionToPoint(object, target) {
  return new THREE.Vector3()
    .subVectors(target, object.position)
    .normalize();
}

function isInTruckMode() {
  return (
    FEET.rotation.x === MOVEMENTS.feet.max &&
    HEAD.rotation.x === MOVEMENTS.head.min &&
    LEGS.rotation.x === MOVEMENTS.lowBody.max &&
    ARMS.children[1].position.x === MOVEMENTS.arms.max
  );
}

//////////
/* MAIN */
//////////
init();
animate();