import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { S, ROOMS } from '../config/plan.js';
import { GeometryBatch } from './GeometryBatch.js';
import { buildWalls } from './walls.js';
import { buildFloors, buildOutdoor, buildPool } from './site.js';
import { buildFurniture } from './furniture.js';

function buildLabels(group) {
  for (const [name, x, y] of ROOMS) {
    const el = document.createElement('div');
    el.className = 'lbl';
    el.textContent = name;
    const label = new CSS2DObject(el);
    label.position.set(x * S, 0.02, y * S);
    group.add(label);
  }
}

// Mobiliario en un grupo aparte para poder mostrarlo u ocultarlo. No participa en la
// selección de superficies: un clic sobre un mueble llega al piso o al muro de detrás.
function createFurniture(M) {
  const furniture = new THREE.Group();
  const batch = new GeometryBatch();
  buildFurniture(batch, M);
  batch.build(furniture);
  furniture.traverse(object => { object.raycast = () => {}; });
  return furniture;
}

// Construye el modelo completo, centrado en el origen.
// Devuelve el grupo, los pivotes de las puertas, el mobiliario y la caja usada para encuadrar la cámara.
export function createHouse(M, surfaces) {
  const group = new THREE.Group();
  const batch = new GeometryBatch();

  const doorPivots = buildWalls(batch, group, M, surfaces);
  buildFloors(batch, M, surfaces);
  buildOutdoor(batch, M, surfaces);
  buildPool(batch, M, surfaces);
  batch.build(group);
  surfaces.attachMeshes(group);
  buildLabels(group);

  const furniture = createFurniture(M);
  group.add(furniture);

  const bounds = new THREE.Box3().setFromObject(group);
  const center = bounds.getCenter(new THREE.Vector3());
  group.position.set(-center.x, 0, -center.z);
  bounds.translate(group.position);
  bounds.min.y = -0.3;   // el encuadre ignora la profundidad del terreno

  return { group, doorPivots, furniture, bounds };
}
