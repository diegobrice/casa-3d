import * as THREE from 'three';

const FLASH_OPACITY = 0.5;
const FLASH_SECONDS = 0.7;
const ignoreRaycast = () => {};

// Marca la superficie seleccionada: un destello azul que se desvanece (para no teñir el
// material mientras se edita) y un contorno de aristas que permanece.
export function createHighlight(parent) {
  const fill = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({
    color: 0x2f7cff, transparent: true, opacity: 0, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
  }));
  const edges = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({
    color: new THREE.Color().setRGB(.1, .45, 1.6), transparent: true, opacity: .9, depthTest: false,
  }));
  for (const object of [fill, edges]) {
    object.visible = false;
    object.renderOrder = 10;
    object.raycast = ignoreRaycast;
    parent.add(object);
  }

  return {
    show(mesh) {
      fill.geometry = mesh.geometry;
      fill.material.opacity = FLASH_OPACITY;
      edges.geometry.dispose();
      edges.geometry = new THREE.EdgesGeometry(mesh.geometry, 30);
      fill.visible = edges.visible = true;
    },
    clear() {
      fill.visible = edges.visible = false;
    },
    // Devuelve true mientras dura el destello
    update(dt) {
      if (!fill.visible) return false;
      fill.material.opacity -= dt / FLASH_SECONDS * FLASH_OPACITY;
      if (fill.material.opacity <= 0) fill.visible = false;
      return true;
    },
  };
}
