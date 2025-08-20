import * as THREE from "three";

export const MOVEMENT_SPEED = 2;
export const MOVEMENT_TRAILER_SPEED = 5;
export const ROTATION_SPEED = Math.PI;

export const GEOMETRY = {
  //robot
  chest:            { w: 4, h: 2, d: 2 },
  back:             { w: 2, h: 1, d: 1 },
  abdomen:          { w: 2, h: 1, d: 3 },
  waist:            { w: 3, h: 1, d: 1.5 },
  wheel:            { r: 0.6, h: 0.5 },
  thigh:            { w: 0.5, h: 1.5, d: 0.6 },
  leg:              { w: 1, h: 4, d: 1 },
  legTrailerPiece:  { w: 0.5, h: 0.5, d: 0.5 },
  foot:             { w: 1, h: 1, d: 1 },
  arm:              { w: 1, h: 2, d: 1 },
  forearm:          { w: 1, h: 1, d: 3 },
  bottomExhaust:    { r: 0.2, h: 1.5 },
  topExhaust:       { r: 0.1, h: 1 },
  head:             { w: 1, h: 1, d: 1 },
  eye:              { w: 0.3, h: 0.1, d: 0.05},
  bottomAntenna:    { r: 0.3, h: 0.2 },
  topAntenna:       { r: 0.1, h: 0.6 },
  
  //trailer
  trailerContainer: { w: 4, h: 5, d: 12 },
  trailerBase:      { w: 3, h: 0.5, d: 12 },
  trailerHitch:     { w: 3, h: 1, d: 4 },
};


export const OFFSET = {
  chest:            { x: 0, 
                      y: 0, 
                      z: 0 
                    },
  back:             { x: 0, 
                      y: -GEOMETRY['chest'].h/2+GEOMETRY['back'].h/2,
                      z: -GEOMETRY['chest'].d/2-GEOMETRY['back'].d/2
                    },
  abdomen:          { x: 0, 
                      y: -GEOMETRY['chest'].h/2-GEOMETRY['abdomen'].h/2,
                      z: GEOMETRY['chest'].d/2-GEOMETRY['abdomen'].d/2
                    },
  waist:            { x: 0, 
                      y: -GEOMETRY['abdomen'].h/2-GEOMETRY['waist'].h/2 ,
                      z: GEOMETRY['waist'].d/2
                    },
  waistWheel:       { x: GEOMETRY['waist'].w/2+GEOMETRY['wheel'].h/2,
                      y: GEOMETRY['waist'].h/2-GEOMETRY['wheel'].r,
                      z: -GEOMETRY['waist'].d/2+GEOMETRY['wheel'].r
                    },
  legPivot:         { x: 0,
                      y: -GEOMETRY['chest'].h/2-GEOMETRY['abdomen'].h-GEOMETRY['waist'].h/2,
                      z: GEOMETRY['chest'].d/2-GEOMETRY['waist'].d+GEOMETRY['leg'].d/2
                    },
  thigh:            { x: GEOMETRY['abdomen'].w/2-GEOMETRY['thigh'].w/2,
                      y: -GEOMETRY['waist'].h/2-GEOMETRY['thigh'].h/2,
                      z: 0
                    },
  leg:              { x: GEOMETRY['thigh'].w/2,
                      y: -GEOMETRY['thigh'].h/2-GEOMETRY['leg'].h/2,
                      z: 0
                    },
  footPivot:        { x: 0,
                      y: -GEOMETRY['waist'].h/2-GEOMETRY['thigh'].h-GEOMETRY['leg'].h,
                      z: GEOMETRY['leg'].d/2
                    },
  foot:             { x: GEOMETRY['abdomen'].w/2,
                      y: GEOMETRY['foot'].h/2,
                      z: GEOMETRY['foot'].d/2
                    },
  topLegWheel:      { x: GEOMETRY['leg'].w/2+GEOMETRY['wheel'].h/2,
                      y: 0,
                      z: -GEOMETRY['leg'].d/2+GEOMETRY['wheel'].r
                    },
  bottomLegWheel:   { x: GEOMETRY['leg'].w/2+GEOMETRY['wheel'].h/2,
                      y: -GEOMETRY['leg'].h/2+GEOMETRY['wheel'].r,
                      z: -GEOMETRY['leg'].d/2+GEOMETRY['wheel'].r
                    },
  legTrailerPiece:  { x: GEOMETRY['abdomen'].w/2-GEOMETRY['thigh'].w/2,
                      y: -GEOMETRY['waist'].h/2-GEOMETRY['thigh'].h-GEOMETRY['leg'].h+3*GEOMETRY['legTrailerPiece'].h/2,
                      z: -GEOMETRY['leg'].d/2-GEOMETRY['legTrailerPiece'].d/2
                    },
  arm:              { x: GEOMETRY['chest'].w/2+GEOMETRY['arm'].w/2,
                      y: 0,
                      z: -GEOMETRY['chest'].d/2-GEOMETRY['arm'].d/2
                    },
  forearm:          { x: 0,
                      y: -GEOMETRY['arm'].h/2-GEOMETRY['forearm'].h/2,
                      z: -GEOMETRY['arm'].d/2+GEOMETRY['forearm'].d/2
                    },
  bottomExhaust:    { x: GEOMETRY['arm'].w/2+GEOMETRY['bottomExhaust'].r,
                      y: -GEOMETRY['arm'].h/2+GEOMETRY['bottomExhaust'].h/2,
                      z: 0
                    },
  topExhaust:       { x: 0,
                      y: GEOMETRY['bottomExhaust'].h/2+GEOMETRY['topExhaust'].h/2,
                      z: 0
                    },
  headPivot:        { x: 0,
                      y: GEOMETRY['chest'].h/2-GEOMETRY['head'].h/2,
                      z: -GEOMETRY['chest'].d/2+GEOMETRY['head'].d/2
                    },
  head:             { x: 0,
                      y: GEOMETRY['head'].h,
                      z: 0
                    },
  bottomAntenna:    { x: GEOMETRY['head'].w/2+GEOMETRY['bottomAntenna'].h/2,
                      y: 0,
                      z: 0
                    },
  topAntenna:       { x: GEOMETRY['head'].w/2+GEOMETRY['topAntenna'].r,
                      y: GEOMETRY['bottomAntenna'].r+GEOMETRY['topAntenna'].h/2,
                      z: 0
                    },
  eye:              { x: GEOMETRY['head'].w/4,
                      y: 0,
                      z: GEOMETRY['head'].d/2+GEOMETRY['eye'].d/2 
                    },
  trailer:          { x: 0, 
                      y: -GEOMETRY.chest.h/2-GEOMETRY.waist.h/2-GEOMETRY.abdomen.h, 
                      z: -GEOMETRY.chest.d/2-GEOMETRY.back.d-GEOMETRY.leg.h/2-GEOMETRY.trailerContainer.d+GEOMETRY.trailerHitch.d/2
                    },
  trailerBase:      { x: 0, 
                      y: GEOMETRY.trailerHitch.h/2 + GEOMETRY.trailerBase.h/2, 
                      z: GEOMETRY.trailerBase.d/2 - GEOMETRY.trailerHitch.d/2
                    },
  trailerContainer: { x: 0, 
                      y: GEOMETRY.trailerContainer.h/2 + GEOMETRY.trailerHitch.h/2 + GEOMETRY.trailerBase.h,
                      z: GEOMETRY.trailerContainer.d/2 - GEOMETRY.trailerHitch.d/2
                    },
  trailerHitch:     { x: 0, 
                      y: 0,
                      z: 0,
                    },
  wheelTrailerFront:{ x: -GEOMETRY.trailerHitch.d/2 + GEOMETRY.wheel.h/2,
                      y: GEOMETRY.trailerHitch.h/2 - GEOMETRY.wheel.r, 
                      z: 0
                    },
  wheelTrailerBack: { x: -GEOMETRY.trailerHitch.d/2 + GEOMETRY.wheel.h/2,
                      y: GEOMETRY.trailerHitch.h/2 - GEOMETRY.wheel.r, 
                      z: -GEOMETRY.trailerHitch.d/2 + GEOMETRY.wheel.r
                    },
}

export const MOVEMENTS = {
  feet: {
    min: 0,
    max: Math.PI,
  },
  head: {
    min: -Math.PI/2,
    max: 0,
  },
  lowBody: {
    min: 0,
    max: Math.PI / 2,
  },
  arms: {
    min: -OFFSET['arm'].x,
    max: -OFFSET['arm'].x + GEOMETRY['arm'].w,
  },
}

export const ANIMATION = {
  NONE: -1,
  STARTING_POINT: 0,
  UP: 1,
  DOWN: 2,
  DONE: 3
}

export const ANIMATION_POINTS = [
  new THREE.Vector3(0, OFFSET.trailer.y, OFFSET.trailer.z-GEOMETRY.leg.h/2-GEOMETRY.foot.h),
  new THREE.Vector3(0, 0, OFFSET.trailer.z),
  new THREE.Vector3(0, OFFSET.trailer.y, OFFSET.trailer.z)
]