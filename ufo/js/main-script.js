import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { VRButton } from "three/addons/webxr/VRButton.js";
import * as Stats from "three/addons/libs/stats.module.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////
let renderer, scene, activeCamera, prevTimestamp = 0, globalGroup;
let skyDome, field, ufo, house;
let generateSkyTexture = false;
let generateFieldTexture = false;
let changeCurrentMaterial = false;
let updateSize = false;
let ufoMovements = {
  'positiveZ': false,
  'negativeZ': false,
  'positiveX': false,
  'negativeX': false,
};

const MOVEMENT_VECTORS = Object.freeze({
  positiveX: new THREE.Vector3(1, 0, 0),
  negativeX: new THREE.Vector3(-1, 0, 0),
  positiveZ: new THREE.Vector3(0, 0, 1),
  negativeZ: new THREE.Vector3(0, 0, -1),
});

let lightsCalculation = true;
let currentMaterial = "phong";
let directionalLight;
let ufoSpotlight;
let UFO_SPHERE_LIGHTS = [];

const DYNAMIC_MESHES = [];
const DOME_RADIUS = 128;
const MOON_RADIUS = 10;

const COLORS = {
  white: "#ffffff",
  yellow: "#ffff00",
  violet: "#dd00ff",
  lightBlue: "#00ccff",
  lightGreen: "#bbff00",
  darkBlue: "#000099",
  darkViolet: "#660066",
  moonColor: "#f6f1d5",
  lightGrey: "#ebebeb",
  darkGrey: "#575757",
  houseBlue: 0x4169e1,
  houseRoof: 0xff7840,
  houseWhite: 0xffffff,
  houseYellow: 0xffdd00,
  sobreiroTrunk: 0xcd853f,  
  sobreiroCrown: 0x228b22, 
}

const TEXTURE_PARAMS = {
  sky: {
    size: 2048, 
    backgroundColor: [COLORS.darkBlue, COLORS.darkViolet],
    gradient: true,
    numDots: 1024,
    dotsColors: [COLORS.white]
  },
  field: {
    size: 1024,
    backgroundColor: COLORS.lightGreen,
    numDots: 512,
    dotsColors: [COLORS.white, COLORS.yellow, COLORS.violet, COLORS.lightBlue]
  }
}

const MATERIAL_PARAMS = {
  moon: {
    color: COLORS.moonColor,
    emissive: COLORS.moonColor,
  },
  ufoBody: { color: COLORS.lightGrey },
  ufoCockpit: { 
    color: COLORS.lightBlue,
    opacity: 0.6,
    transparent: true
  },
  ufoBottom: {
    color: COLORS.darkGrey,
    emissive: COLORS.darkGrey
  },
  ufoSphereLight: {
    color: COLORS.yellow,
    emissive: COLORS.yellow
  },
   sobreiroTrunk: { 
    color: COLORS.sobreiroTrunk 
  },
  sobreiroCrown: { 
    color: COLORS.sobreiroCrown 
  },
  casaParedes: { 
    color: COLORS.houseWhite 
  },
  casaTelhado: { 
    color: COLORS.houseRoof 
  },
  casaJanelas: { 
    color: COLORS.houseBlue 
  },
  casaPorta: { 
    color: COLORS.houseBlue 
  },
  casaChamine: { 
    color: COLORS.houseWhite 
  },
  casaBordados: { 
    color: COLORS.houseYellow 
  },

}

const CASA_DIMS = {
  // Paredes
  LARGURA: 48,               // Largura total da casa
  PROFUNDIDADE: 18,         // Profundidade da casa  
  ALTURA_PAREDE: 10,        // Altura das paredes
  
  // Telhado
  ALTURA_TELHADO: 6,        // Altura adicional do telhado no pico
  SALIENCIA_TELHADO: 0,     // Quanto o telhado sai para além das paredes
  INCLINACAO_TELHADO: 3,    // Diferença de altura para criar inclinação
  
  // Janelas
  JANELA_LARGURA: 4,        // Largura das janelas
  JANELA_ALTURA: 4,         // Altura das janelas
  JANELA_Y_OFFSET: 4,       // Distância do chão até a base da janela
  JANELA_Z_OFFSET: 0.1,     // Pequeno offset para evitar z-fighting
  
  // Porta
  PORTA_LARGURA: 5,         // Largura da porta
  PORTA_ALTURA: 8,          // Altura da porta
  PORTA_X_CENTRO: -9,       // Posição X do centro da porta
  
  // Chaminé
  CHAMINE_LARGURA: 6,       // Largura da chaminé
  CHAMINE_PROFUNDIDADE: 3,  // Profundidade da chaminé
  CHAMINE_ALTURA: 6,        // Altura da chaminé
  CHAMINE_X_CENTRO: 18,     // Posição X do centro da chaminé
  
  // Bordados decorativos
  BORDADO_ALTURA: 1,        // Altura dos bordados
  BORDADO_Y_POS: 0,         // Posição Y dos bordados
  BORDADO_ESPESSURA: 1,     // Espessura dos bordados
};

const PAREDE = {
  X_MIN: -CASA_DIMS.LARGURA / 2,   
  X_MAX: CASA_DIMS.LARGURA / 2,    
  Z_MIN: -CASA_DIMS.PROFUNDIDADE / 2, 
  Z_MAX: CASA_DIMS.PROFUNDIDADE / 2, 
  Y_MIN: 0,
  Y_MAX: CASA_DIMS.ALTURA_PAREDE, 
};

const JANELA_POS = {
  J1_X: -18,  
  J2_X: 0,    
  J3_X: 9,    
  J4_X: 18,  
  Y_MIN: CASA_DIMS.JANELA_Y_OFFSET,
  Y_MAX: CASA_DIMS.JANELA_Y_OFFSET + CASA_DIMS.JANELA_ALTURA,
  Z_FRENTE: PAREDE.Z_MAX + CASA_DIMS.JANELA_Z_OFFSET,
};

const TELHADO = {
  X_MIN: PAREDE.X_MIN - CASA_DIMS.SALIENCIA_TELHADO,  
  X_MAX: PAREDE.X_MAX + CASA_DIMS.SALIENCIA_TELHADO,  
  Y_BASE: PAREDE.Y_MAX, 
  Y_PICO: PAREDE.Y_MAX + CASA_DIMS.ALTURA_TELHADO,    
  Z_FRENTE_BAIXO: CASA_DIMS.INCLINACAO_TELHADO,      
  Z_TRAS_BAIXO: -CASA_DIMS.INCLINACAO_TELHADO,       
};

const GEOMETRY = {
  skyDome: new THREE.SphereGeometry(DOME_RADIUS, 32, 32),
  field: new THREE.PlaneGeometry(DOME_RADIUS*2, DOME_RADIUS*2, 128, 128),
  moon: new THREE.SphereGeometry(MOON_RADIUS, 32, 32),
  
  ufoBody: new THREE.SphereGeometry(10, 32, 32),
  ufoCockpit: new THREE.SphereGeometry(4, 32, 32),
  ufoBottom: new THREE.CylinderGeometry(4, 4, 1, 32),
  ufoSphereLight: new THREE.SphereGeometry(0.5, 32, 32),

  sobreiroTrunk: new THREE.CylinderGeometry(1, 1.2, 14, 16),
  sobreiroCrown: new THREE.SphereGeometry(1, 16, 12),

  casaParedes: createCasaParedesGeometry(),
  casaTelhado: createCasaTelhadoGeometry(),
  casaJanelas: createCasaJanelasGeometry(),
  casaPorta: createCasaPortaGeometry(),
  casaChamine: createCasaChamineGeometry(),
  casaBordados: createCasaBordadosGeometry(),
}

// spherical coordinates to place moon on the dome
const phi = Math.PI / 3;
const theta = -Math.PI;
const MOON_POSITION = new THREE.Vector3(
  (DOME_RADIUS-MOON_RADIUS) * Math.sin(phi) * Math.cos(theta),
  (DOME_RADIUS-MOON_RADIUS) * Math.cos(phi),
  (DOME_RADIUS-MOON_RADIUS) * Math.sin(phi) * Math.sin(theta)
);

const UFO_ANGULAR_VELOCITY = Math.PI / 2; 
const UFO_LINEAR_VELOCITY = 20; 

const keysPressed = {
  Digit1: false,
  Digit2: false,
  KeyD: false,
  KeyQ: false,
  KeyW: false,
  KeyE: false,
  KeyR: false,
  KeyP: false,
  KeyS: false,
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
}

/////////////////////
/* CREATE SCENE(S) */
/////////////////////
function createScene() {
  scene = new THREE.Scene();
  globalGroup = new THREE.Group();
  globalGroup.position.y = -10;
  scene.add(globalGroup);

  createLights();
  createField();
  createSkyDome();
  createMoon();

  createUFO();
  createCasaAlentejana();
  createSobreiros();
}

function createSkyDome() {
  const skyTexture = generateTexture({...TEXTURE_PARAMS.sky});

  const material = new THREE.MeshBasicMaterial({
    map: skyTexture,
    side: THREE.BackSide
  });
  skyDome = new THREE.Mesh(GEOMETRY.skyDome, material);
  globalGroup.add(skyDome);
}

function createField() {
  const fieldTexture = generateTexture({...TEXTURE_PARAMS.field});
  
  const heightMap = new THREE.TextureLoader().load("assets/heightmap.png");

  const material = new THREE.MeshPhongMaterial({
    map: fieldTexture,
    side: THREE.DoubleSide,
    displacementMap: heightMap,
    displacementScale: 20,
    bumpMap: heightMap,
    bumpScale: 15
  });
  field = new THREE.Mesh(GEOMETRY.field, material);
  field.rotation.x = -Math.PI / 2;
  globalGroup.add(field);
}

function generateTexture({
  size,
  backgroundColor,
  gradient = false,
  numDots,
  dotsColors
}) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d");

  // set background color/gradient
  if(gradient) {
    const gradient = context.createLinearGradient(0, 0, 0, size);
    
    gradient.addColorStop(0.3, backgroundColor[0]);
    gradient.addColorStop(0.8, backgroundColor[1]);

    context.fillStyle = gradient;
  } else {
    context.fillStyle = backgroundColor;
  }

  context.fillRect(0, 0, size, size);

  // generate dots randomly
  for (let i = 0; i < numDots; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 1 + Math.random(); // random radius between 1 and 2 pixels
    
    context.beginPath();
    context.fillStyle = dotsColors[Math.floor(Math.random() * dotsColors.length)];
    context.arc(x, y, r, 0, Math.PI * 2);
    context.fill();
  }

  return new THREE.CanvasTexture(canvas);
}

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////
function createCameras() {
  const perspective = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  perspective.position.set(0, 70, 150);
  perspective.lookAt(0,0,-10);

  activeCamera = perspective;
}

/////////////////////
/* CREATE LIGHT(S) */
/////////////////////
function createLights() {
  const ambientLight = new THREE.AmbientLight(COLORS.moonColor, 0.05);
  globalGroup.add(ambientLight);

  directionalLight = new THREE.DirectionalLight(COLORS.moonColor, 1);
  directionalLight.position.copy(MOON_POSITION);
  globalGroup.add(directionalLight);
}

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////
function createMoon() {
  const moon = createDynamicMesh("moon", globalGroup);
  moon.position.copy(MOON_POSITION);
}

function createUFO() {
  ufo = new THREE.Group();
  ufo.position.set(0, 50, 0);
  globalGroup.add(ufo);

  const ufoBody = createDynamicMesh("ufoBody", ufo);
  ufoBody.scale.y = 0.2;
  
  const ufoCockpit = createDynamicMesh("ufoCockpit", ufo);
  ufoCockpit.position.y = 2;

  const ufoBottom = createDynamicMesh("ufoBottom", ufo);
  ufoBottom.position.y = -2;

  // Spotlight
  const spotlightTarget = new THREE.Object3D();
  spotlightTarget.position.set(0, -10, 0);
  ufoBottom.add(spotlightTarget);

  ufoSpotlight = new THREE.SpotLight(
    COLORS.yellow,
    750,
    100,
    Math.PI / 8,
    0.2
  );
  ufoSpotlight.target = spotlightTarget;
  ufoBottom.add(ufoSpotlight);

  // Point Lights
  for(let i = 0; i < 8; i++) {
    const lightGroup = new THREE.Group();  
    const ufoSphereLight = createDynamicMesh("ufoSphereLight", lightGroup);
    ufoSphereLight.position.x = 4 + 0.5;

    const sphereLight = new THREE.PointLight(COLORS.yellow, 10, 20);
    sphereLight.position.copy(ufoSphereLight.position);
    lightGroup.add(sphereLight);

    lightGroup.rotateY(i * 2 * (Math.PI / 8));
    
    ufoBottom.add(lightGroup);
    UFO_SPHERE_LIGHTS.push(sphereLight);
  }
}

function createCasaParedesGeometry() {
    const geometry = new THREE.BufferGeometry();
    
    const vertices = [
        // Parede frontal
        PAREDE.X_MIN, PAREDE.Y_MIN, PAREDE.Z_MAX,  // v0
        PAREDE.X_MAX, PAREDE.Y_MIN, PAREDE.Z_MAX,  // v1 
        PAREDE.X_MAX, PAREDE.Y_MAX, PAREDE.Z_MAX,  // v2 
        PAREDE.X_MIN, PAREDE.Y_MAX, PAREDE.Z_MAX,  // v3 
        
        // Parede lateral direita
        PAREDE.X_MAX, PAREDE.Y_MIN, PAREDE.Z_MAX,  // v4
        PAREDE.X_MAX, PAREDE.Y_MAX, PAREDE.Z_MAX,  // v5
        PAREDE.X_MAX, PAREDE.Y_MAX, PAREDE.Z_MIN,  // v6
        PAREDE.X_MAX, PAREDE.Y_MIN, PAREDE.Z_MIN,  // v7
    ];
    
    const indices = [
        // Parede frontal
        0, 1, 2, 0, 2, 3,
        
        // Parede traseira
        5, 4, 7, 5, 7, 6,
    ];
    
    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.computeVertexNormals();
    
    return geometry;
}

function createCasaTelhadoGeometry() {
    const geometry = new THREE.BufferGeometry();
    
    const vertices = [
        // Face principal do telhado
        // Base na frente 
        TELHADO.X_MIN, TELHADO.Y_BASE, PAREDE.Z_MAX,             // v0 
        TELHADO.X_MAX, TELHADO.Y_BASE, PAREDE.Z_MAX,             // v1 
        
        // Pico no meio da casa
        TELHADO.X_MIN, TELHADO.Y_PICO, 0,                        // v2 
        TELHADO.X_MAX, TELHADO.Y_PICO, 0,                        // v3 
        
        // Triângulo lateral direito
        PAREDE.X_MAX, TELHADO.Y_BASE, PAREDE.Z_MAX,              // v4
        PAREDE.X_MAX, TELHADO.Y_BASE, PAREDE.Z_MIN,              // v5
        PAREDE.X_MAX, TELHADO.Y_PICO, 0,                         // v6
    ];
    
    const indices = [
        // Face frontal do telhado 
        0, 1, 3, 0, 3, 2,
        
        // Triângulo lateral 
        4, 5, 6,
    ];
    
    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.computeVertexNormals();
    
    return geometry;
}

function createCasaJanelasGeometry() {
    const geometry = new THREE.BufferGeometry();
    
    const vertices = [
        // Janela 1 (esquerda)
        JANELA_POS.J1_X - CASA_DIMS.JANELA_LARGURA/2, JANELA_POS.Y_MIN, JANELA_POS.Z_FRENTE,   // v0
        JANELA_POS.J1_X + CASA_DIMS.JANELA_LARGURA/2, JANELA_POS.Y_MIN, JANELA_POS.Z_FRENTE,   // v1
        JANELA_POS.J1_X + CASA_DIMS.JANELA_LARGURA/2, JANELA_POS.Y_MAX, JANELA_POS.Z_FRENTE,   // v2
        JANELA_POS.J1_X - CASA_DIMS.JANELA_LARGURA/2, JANELA_POS.Y_MAX, JANELA_POS.Z_FRENTE,   // v3
        
        // Janela 2 (centro-esquerda)
        JANELA_POS.J2_X - CASA_DIMS.JANELA_LARGURA/2, JANELA_POS.Y_MIN, JANELA_POS.Z_FRENTE,   // v4
        JANELA_POS.J2_X + CASA_DIMS.JANELA_LARGURA/2, JANELA_POS.Y_MIN, JANELA_POS.Z_FRENTE,   // v5
        JANELA_POS.J2_X + CASA_DIMS.JANELA_LARGURA/2, JANELA_POS.Y_MAX, JANELA_POS.Z_FRENTE,   // v6
        JANELA_POS.J2_X - CASA_DIMS.JANELA_LARGURA/2, JANELA_POS.Y_MAX, JANELA_POS.Z_FRENTE,   // v7
        
        // Janela 3 (centro-direita)
        JANELA_POS.J3_X - CASA_DIMS.JANELA_LARGURA/2, JANELA_POS.Y_MIN, JANELA_POS.Z_FRENTE,   // v8
        JANELA_POS.J3_X + CASA_DIMS.JANELA_LARGURA/2, JANELA_POS.Y_MIN, JANELA_POS.Z_FRENTE,   // v9
        JANELA_POS.J3_X + CASA_DIMS.JANELA_LARGURA/2, JANELA_POS.Y_MAX, JANELA_POS.Z_FRENTE,   // v10
        JANELA_POS.J3_X - CASA_DIMS.JANELA_LARGURA/2, JANELA_POS.Y_MAX, JANELA_POS.Z_FRENTE,   // v11
        
        // Janela 4 (direita)
        JANELA_POS.J4_X - CASA_DIMS.JANELA_LARGURA/2, JANELA_POS.Y_MIN, JANELA_POS.Z_FRENTE,   // v12
        JANELA_POS.J4_X + CASA_DIMS.JANELA_LARGURA/2, JANELA_POS.Y_MIN, JANELA_POS.Z_FRENTE,   // v13
        JANELA_POS.J4_X + CASA_DIMS.JANELA_LARGURA/2, JANELA_POS.Y_MAX, JANELA_POS.Z_FRENTE,   // v14
        JANELA_POS.J4_X - CASA_DIMS.JANELA_LARGURA/2, JANELA_POS.Y_MAX, JANELA_POS.Z_FRENTE,   // v15
        
        // Janela lateral (na parede direita)
        PAREDE.X_MAX + CASA_DIMS.JANELA_Z_OFFSET, JANELA_POS.Y_MAX, -CASA_DIMS.JANELA_LARGURA/2,   // v16
        PAREDE.X_MAX + CASA_DIMS.JANELA_Z_OFFSET, JANELA_POS.Y_MAX, CASA_DIMS.JANELA_LARGURA/2,    // v17
        PAREDE.X_MAX + CASA_DIMS.JANELA_Z_OFFSET, JANELA_POS.Y_MIN, CASA_DIMS.JANELA_LARGURA/2,    // v18
        PAREDE.X_MAX + CASA_DIMS.JANELA_Z_OFFSET, JANELA_POS.Y_MIN, -CASA_DIMS.JANELA_LARGURA/2,   // v19
        
    ];
    
    const indices = [
        // Janela 1
        0, 1, 2, 0, 2, 3,
        
        // Janela 2
        4, 5, 6, 4, 6, 7,
        
        // Janela 3
        8, 9, 10, 8, 10, 11,
        
        // Janela 4
        12, 13, 14, 12, 14, 15,
        
        // Janela lateral
        16, 17, 18, 16, 18, 19,
    ];
    
    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.computeVertexNormals();
    
    return geometry;
}

function createCasaPortaGeometry() {
    const geometry = new THREE.BufferGeometry();
    
    const vertices = [
        // Porta principal
        CASA_DIMS.PORTA_X_CENTRO - CASA_DIMS.PORTA_LARGURA/2, PAREDE.Y_MIN, JANELA_POS.Z_FRENTE, // v0
        CASA_DIMS.PORTA_X_CENTRO + CASA_DIMS.PORTA_LARGURA/2, PAREDE.Y_MIN, JANELA_POS.Z_FRENTE, // v1
        CASA_DIMS.PORTA_X_CENTRO + CASA_DIMS.PORTA_LARGURA/2, CASA_DIMS.PORTA_ALTURA, JANELA_POS.Z_FRENTE, // v2
        CASA_DIMS.PORTA_X_CENTRO - CASA_DIMS.PORTA_LARGURA/2, CASA_DIMS.PORTA_ALTURA, JANELA_POS.Z_FRENTE, // v3
    ];
    
    const indices = [
        0, 1, 2, 0, 2, 3,
    ];
    
    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.computeVertexNormals();
    
    return geometry;
}

function createCasaChamineGeometry() {
    const geometry = new THREE.BufferGeometry();
    
    const chamineX1 = CASA_DIMS.CHAMINE_X_CENTRO - CASA_DIMS.CHAMINE_LARGURA/2;  
    const chamineX2 = CASA_DIMS.CHAMINE_X_CENTRO + CASA_DIMS.CHAMINE_LARGURA/2;  
    const chamineZ1 = PAREDE.Z_MAX - CASA_DIMS.CHAMINE_PROFUNDIDADE;            
    const chamineZ2 = PAREDE.Z_MAX - CASA_DIMS.CHAMINE_PROFUNDIDADE/2;           
    const chamineY1 = PAREDE.Y_MAX;                                              
    const chamineY2 = PAREDE.Y_MAX + CASA_DIMS.CHAMINE_ALTURA;                   
    
    const vertices = [
        // Face frontal 
        chamineX1, chamineY1, chamineZ2,  // v0
        chamineX2, chamineY1, chamineZ2,  // v1 
        chamineX2, chamineY2, chamineZ2,  // v2 
        chamineX1, chamineY2, chamineZ2,  // v3
        
        // Face direita 
        chamineX2, chamineY1, chamineZ2,  // v4 
        chamineX2, chamineY1, chamineZ1,  // v5 
        chamineX2, chamineY2, chamineZ1,  // v6
        chamineX2, chamineY2, chamineZ2,  // v7
        
        // Face superior 
        chamineX1, chamineY2, chamineZ2,  // v8
        chamineX2, chamineY2, chamineZ2,  // v9
        chamineX2, chamineY2, chamineZ1,  // v10
        chamineX1, chamineY2, chamineZ1,  // v11
        
    ];
    
    const indices = [
        // Face frontal
        0, 1, 2, 0, 2, 3,
        
        // Face direita
        4, 5, 6, 4, 6, 7,
        
        // Face superior
        8, 9, 10, 8, 10, 11,
        
    ];
    
    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.computeVertexNormals();
    
    return geometry;
}

function createCasaBordadosGeometry() {
  const geometry = new THREE.BufferGeometry();
  
  const bordadoYmin = PAREDE.Y_MIN;                             
  const bordadoYmax = bordadoYmin + CASA_DIMS.BORDADO_ALTURA;             
  const bordadoZTras = PAREDE.Z_MAX;      
  const bordadoZFrente = bordadoZTras + CASA_DIMS.BORDADO_ESPESSURA;    
  
  const vertices = [

    // ===== BORDADO ESQUERDO =====
    // Face frontal 
    PAREDE.X_MIN, bordadoYmin, bordadoZFrente,                                           // v0
    CASA_DIMS.PORTA_X_CENTRO - CASA_DIMS.PORTA_LARGURA/2, bordadoYmin, bordadoZFrente, // v1
    CASA_DIMS.PORTA_X_CENTRO - CASA_DIMS.PORTA_LARGURA/2, bordadoYmax, bordadoZFrente, // v2
    PAREDE.X_MIN, bordadoYmax, bordadoZFrente,                                           // v3

    // Face superior
    PAREDE.X_MIN, bordadoYmax, bordadoZFrente,                                           // v4
    CASA_DIMS.PORTA_X_CENTRO - CASA_DIMS.PORTA_LARGURA/2, bordadoYmax, bordadoZFrente, // v5 
    CASA_DIMS.PORTA_X_CENTRO - CASA_DIMS.PORTA_LARGURA/2, bordadoYmax, bordadoZTras,  // v6 
    PAREDE.X_MIN, bordadoYmax, bordadoZTras,                                           // v7
    
    // Face lateral direita
    CASA_DIMS.PORTA_X_CENTRO - CASA_DIMS.PORTA_LARGURA/2, bordadoYmin, bordadoZFrente, // v8 
    CASA_DIMS.PORTA_X_CENTRO - CASA_DIMS.PORTA_LARGURA/2, bordadoYmin, bordadoZTras,  // v9 
    CASA_DIMS.PORTA_X_CENTRO - CASA_DIMS.PORTA_LARGURA/2, bordadoYmax, bordadoZTras,  // v10
    CASA_DIMS.PORTA_X_CENTRO - CASA_DIMS.PORTA_LARGURA/2, bordadoYmax, bordadoZFrente, // v11
    
    // ===== BORDADO DIREITO =====
    // Face frontal
    CASA_DIMS.PORTA_X_CENTRO + CASA_DIMS.PORTA_LARGURA/2, bordadoYmin, bordadoZFrente, // v12
    PAREDE.X_MAX + CASA_DIMS.BORDADO_ESPESSURA, bordadoYmin, bordadoZFrente,           // v13
    PAREDE.X_MAX + CASA_DIMS.BORDADO_ESPESSURA, bordadoYmax, bordadoZFrente,           // v14
    CASA_DIMS.PORTA_X_CENTRO + CASA_DIMS.PORTA_LARGURA/2, bordadoYmax, bordadoZFrente, // v15
    
    // Face superior
    CASA_DIMS.PORTA_X_CENTRO + CASA_DIMS.PORTA_LARGURA/2, bordadoYmax, bordadoZFrente, // v16
    PAREDE.X_MAX + CASA_DIMS.BORDADO_ESPESSURA, bordadoYmax, bordadoZFrente,           // v17
    PAREDE.X_MAX + CASA_DIMS.BORDADO_ESPESSURA, bordadoYmax, bordadoZTras,             // v18
    CASA_DIMS.PORTA_X_CENTRO + CASA_DIMS.PORTA_LARGURA/2, bordadoYmax, bordadoZTras,   // v19
    
    // ===== BORDADO LATERAL =====
    
    // Face Superior
    PAREDE.X_MAX, bordadoYmax, PAREDE.Z_MIN,                          // v20
    PAREDE.X_MAX, bordadoYmax, PAREDE.Z_MAX,                          // v21
    PAREDE.X_MAX + CASA_DIMS.BORDADO_ESPESSURA, bordadoYmax, PAREDE.Z_MAX, // v22
    PAREDE.X_MAX + CASA_DIMS.BORDADO_ESPESSURA, bordadoYmax, PAREDE.Z_MIN, // v23 
    
    // Lateral direita
    PAREDE.X_MAX + CASA_DIMS.BORDADO_ESPESSURA, bordadoYmin, PAREDE.Z_MIN, // v24
    PAREDE.X_MAX + CASA_DIMS.BORDADO_ESPESSURA, bordadoYmax, PAREDE.Z_MIN, // v25
    PAREDE.X_MAX + CASA_DIMS.BORDADO_ESPESSURA, bordadoYmax, PAREDE.Z_MAX + CASA_DIMS.BORDADO_ESPESSURA, // v26
    PAREDE.X_MAX + CASA_DIMS.BORDADO_ESPESSURA, bordadoYmin, PAREDE.Z_MAX + CASA_DIMS.BORDADO_ESPESSURA, // v27 
    
  ];
  
  const indices = [
    // ===== BORDADO ESQUERDO =====
    0, 1, 2, 0, 2, 3,     // Face frontal 
    4, 5, 6, 4, 6, 7,     // Face superior
    8, 9, 10, 8, 10, 11,  // Face lateral direita 
    
    // ===== BORDADO DIREITO =====
    12, 13, 14, 12, 14, 15,  // Face frontal
    16, 17, 18, 16, 18, 19,  // Face superior

    // ===== BORDADO LATERAL =====
    20, 21, 22, 20, 22, 23,  // Face frontal
    24, 25, 26, 24, 26, 27,  // Face superior
  ];
  
  geometry.setIndex(indices);
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
  geometry.computeVertexNormals();
  
  return geometry;
}

function createCasaAlentejana() {
    house = new THREE.Group();
    house.position.set(0, 10, 0);
    globalGroup.add(house);

    house.rotateY(- Math.PI / 4);
    
    createDynamicMesh('casaParedes', house);
    createDynamicMesh('casaTelhado', house);
    createDynamicMesh('casaJanelas', house);
    createDynamicMesh('casaPorta', house);
    createDynamicMesh('casaChamine', house);
    createDynamicMesh('casaBordados', house);
}

function createSobreiros() {
  const sobreiroPositions = [
    { x: -60, y: 15, z: -40, height: 1.2, rotation: 0.3 },
    { x: 80, y: 15, z: 30, height: 0.9, rotation: -0.7 },
    { x: -30, y: 12, z: 70, height: 1.5, rotation: 1.2 },
    { x: 90, y: 7, z: -60, height: 1.0, rotation: -0.4 },
    { x: -80, y: 15, z: 20, height: 0.8, rotation: 0.8 },
    { x: 40, y: 10, z: -80, height: 1.3, rotation: -1.1 },
    { x: 50, y: 20, z: 50, height: 1.4, rotation: 2.1 }
  ];
  
  sobreiroPositions.forEach(pos => {
    createSingleSobreiro(pos.x, pos.y, pos.z, pos.height, pos.rotation);
  });
}

function createSingleSobreiro(x, y, z, height, rotation) {
  const sobreiro = new THREE.Group();

  // Tronco principal (ligeiramente inclinado)
  const trunkMain = createDynamicMesh("sobreiroTrunk", sobreiro);
  trunkMain.position.y = 0;
  trunkMain.rotation.z = 0.2;

  // Ramo secundário (inclinação oposta)
  const branch = createDynamicMesh("sobreiroTrunk", sobreiro);
  branch.position.set(3, 2, 0);
  branch.rotation.z = -0.6;
  branch.scale.set(0.5, 0.5, 0.5);

  // Copa 1 - mais alta
  const crown1 = createDynamicMesh("sobreiroCrown", sobreiro);
  crown1.position.set(-1, 7, 0);
  crown1.scale.set(5, 2.5, 5);

  // Copa 2 - mais baixa
  const crown2 = createDynamicMesh("sobreiroCrown", sobreiro);
  crown2.position.set(4, 4, -0.5);
  crown2.scale.set(3.5, 2, 3.5);

  sobreiro.scale.setScalar(height);
  sobreiro.position.set(x, y, z);
  sobreiro.rotation.y = rotation;
  globalGroup.add(sobreiro);
}

function createDynamicMesh(name, parent) {
  const params = MATERIAL_PARAMS[name];
  const materials = {
    basic: new THREE.MeshBasicMaterial({ ...params }),
    gouraud: new THREE.MeshLambertMaterial({ ...params }),
    phong: new THREE.MeshPhongMaterial({ ...params }),
    cartoon: new THREE.MeshToonMaterial({ ...params }),
  };
  const mesh = new THREE.Mesh(GEOMETRY[name], materials[currentMaterial]);
  DYNAMIC_MESHES.push({mesh: mesh, materials: materials});
  parent.add(mesh);
  return mesh;
}

//////////////////////
/* CHECK COLLISIONS */
//////////////////////
function checkCollisions() {}

///////////////////////
/* HANDLE COLLISIONS */
///////////////////////
function handleCollisions() {}

////////////
/* UPDATE */
////////////
function update(timeDelta) {
  if(changeCurrentMaterial) {
    changeCurrentMaterial = false;

    if(lightsCalculation) 
      DYNAMIC_MESHES.forEach((obj) => obj.mesh.material = obj.materials[currentMaterial]);
    else
      DYNAMIC_MESHES.forEach((obj) => obj.mesh.material = obj.materials["basic"]);
  }
  if(generateFieldTexture) {
    generateFieldTexture = false;
    
    const newFieldTexture = generateTexture({...TEXTURE_PARAMS.field});
    field.material.map.dispose();
    field.material.map = newFieldTexture;
  }
  if (updateSize) {
    const presentingXr = renderer.xr.isPresenting;
    renderer.xr.isPresenting = false;
    updateSize = false;
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (window.innerHeight > 0 && window.innerWidth > 0) {
      refreshCamera(presentingXr ? renderer.xr.getCamera() : activeCamera);
    }
    renderer.xr.isPresenting = presentingXr;
  }
  if(generateSkyTexture) {
    generateSkyTexture = false;
    
    const newSkyTexture = generateTexture({...TEXTURE_PARAMS.sky});
    skyDome.material.map.dispose();
    skyDome.material.map = newSkyTexture;
  }
  moveUfo(timeDelta);
}

function refreshCamera(camera) {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

function moveUfo(timeDelta) {
  const timeDeltaSeconds = timeDelta / 1000;
  
  const activeVectors = Object.entries(ufoMovements)
    .filter(([_key, toggled]) => toggled)
    .map(([key, _toggled]) => MOVEMENT_VECTORS[key]);

  const movementVector = new THREE.Vector3();
  activeVectors.forEach(v => movementVector.add(v));

  
  if (movementVector.lengthSq() > 0) {
    movementVector
      .normalize()
      .multiplyScalar(timeDeltaSeconds * UFO_LINEAR_VELOCITY);

    ufo.position.add(movementVector);
  }
  if (!isNaN(timeDeltaSeconds)) {
    ufo.rotation.y = (ufo.rotation.y + timeDeltaSeconds * UFO_ANGULAR_VELOCITY) % (2 * Math.PI);
  }
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
  
  renderer.xr.enabled = true;
  document.body.appendChild( VRButton.createButton( renderer ) );

  createScene();
  createCameras();

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('resize', onResize);
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

////////////////////////////
/* RESIZE WINDOW CALLBACK */
////////////////////////////
function onResize() {
  updateSize = true;
}

///////////////////////
/* KEY DOWN CALLBACK */
///////////////////////
function onKeyDown(e) {
  const key = e.code;

  if(!keysPressed[key]) {
    keysPressed[key] = true;
    if (keyHandlers[key]) keyHandlers[key](false);
  }
}

///////////////////////
/* KEY UP CALLBACK */
///////////////////////
function onKeyUp(e) {
  const key = e.code;

  keysPressed[key] = false;

  if(key == 'ArrowUp' || key == 'ArrowDown' || key == 'ArrowLeft' || key == 'ArrowRight') {
    keyHandlers[key](true);
  }
}

//////////////////////
/* UTILITIES - KEYS */
//////////////////////
const keyHandlers = {
  Digit1: () => generateFieldTexture = true,
  Digit2: () => generateSkyTexture = true,

  KeyQ: () => {
    if(lightsCalculation) {
      changeCurrentMaterial = true;
      currentMaterial = "gouraud";
    }
  },
  KeyW: () => {
    if(lightsCalculation) {
      changeCurrentMaterial = true;
      currentMaterial = "phong";
    }
  },
  KeyE: () => {
    if(lightsCalculation) {
      changeCurrentMaterial = true;
      currentMaterial = "cartoon";
    }
  },
  KeyR: () => {
    lightsCalculation = !lightsCalculation;
    changeCurrentMaterial = true;
  },
  
  KeyD: () => directionalLight.visible = !directionalLight.visible,

  KeyP: () => UFO_SPHERE_LIGHTS.forEach((light) => light.visible = !light.visible),
  KeyS: () => ufoSpotlight.visible = !ufoSpotlight.visible,

  ArrowUp:    (isKeyUp) => {changeUfoMovementFlags(isKeyUp, 'negativeZ')},
  ArrowDown:  (isKeyUp) => {changeUfoMovementFlags(isKeyUp, 'positiveZ')},
  ArrowLeft:  (isKeyUp) => {changeUfoMovementFlags(isKeyUp, 'negativeX')},
  ArrowRight: (isKeyUp) => {changeUfoMovementFlags(isKeyUp, 'positiveX')},
};

function changeUfoMovementFlags(isKeyUp, direction) {
  ufoMovements[direction] = !isKeyUp; 
}

init();
animate();