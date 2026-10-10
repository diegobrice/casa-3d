import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export const VIEWS = {
  iso: new THREE.Vector3(1, 1, 1).normalize(),
  top: new THREE.Vector3(0, 1, 0.0001).normalize(),
};

const CAMERA_DISTANCE = 80;
const FIT_MARGIN = 0.86;

// OrbitControls + vistas predefinidas con encuadre automático del modelo
// `onChange` se llama cuando una vista o un reencuadre cambian la cámara de golpe.
export function createView(camera, domElement, bounds, onChange) {
  const controls = new OrbitControls(camera, domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.12;
  controls.screenSpacePanning = true;
  controls.maxPolarAngle = Math.PI / 2 - 0.02;
  controls.minZoom = 0.2;
  controls.maxZoom = 12;

  let userMoved = false;
  controls.addEventListener('start', () => { userMoved = true; });

  const corner = new THREE.Vector3();

  // Última pose vista de la cámara. Se compara con tolerancia en vez de usar el evento 'change'
  // de OrbitControls, que con inercia sigue disparándose con la cámara ya quieta. Los umbrales
  // equivalen a menos de un píxel, para que la cola de la inercia no retrase el cuadro final.
  const last = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), zoom: 0 };
  function cameraMoved() {
    const moved = last.position.distanceToSquared(camera.position) > 2.5e-4
      || 1 - Math.abs(last.quaternion.dot(camera.quaternion)) > 1e-7
      || Math.abs(last.zoom - camera.zoom) > 1e-4 * camera.zoom;
    if (moved) {
      last.position.copy(camera.position);
      last.quaternion.copy(camera.quaternion);
      last.zoom = camera.zoom;
    }
    return moved;
  }

  // Ajusta el zoom para que la caja del modelo quepa en pantalla
  function fit() {
    camera.zoom = 1;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    let mx = 0, my = 0;
    for (const x of [bounds.min.x, bounds.max.x])
      for (const y of [bounds.min.y, bounds.max.y])
        for (const z of [bounds.min.z, bounds.max.z]) {
          corner.set(x, y, z).applyMatrix4(camera.matrixWorldInverse);
          mx = Math.max(mx, Math.abs(corner.x));
          my = Math.max(my, Math.abs(corner.y));
        }
    camera.zoom = FIT_MARGIN * Math.min(camera.right / mx, camera.top / my);
    camera.updateProjectionMatrix();
  }

  return {
    setView(direction) {
      userMoved = false;
      controls.target.set(0, 0, 0);
      camera.position.copy(direction).multiplyScalar(CAMERA_DISTANCE);
      camera.lookAt(0, 0, 0);
      controls.update();
      fit();
      onChange();
    },
    // Tras un cambio de tamaño solo se reencuadra si el usuario no ha movido la cámara
    refit() { if (!userMoved) fit(); onChange(); },
    // Aplica la inercia de los controles; devuelve true si la cámara se movió en este cuadro
    update() {
      controls.update();
      return cameraMoved();
    },
  };
}
