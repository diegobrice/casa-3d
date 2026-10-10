import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export const VIEWS = {
  iso: new THREE.Vector3(1, 1, 1).normalize(),
  top: new THREE.Vector3(0, 1, 0.0001).normalize(),
};

const CAMERA_DISTANCE = 80;
const FIT_MARGIN = 0.86;
const EASE_RATE = 12;        // rapidez con que se aplican los pasos de los botones de cámara
const MIN_POLAR = 1e-4;      // evita la singularidad de la vista cenital

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

  // Movimiento pendiente pedido desde los botones (giro en radianes, zoom en escala logarítmica).
  // Se reparte en varios cuadros para que el paso sea suave.
  const pending = { theta: 0, phi: 0, zoom: 0 };
  const offset = new THREE.Vector3(), spherical = new THREE.Spherical();

  function applyPending(dt) {
    const k = 1 - Math.exp(-dt * EASE_RATE);
    const take = (key) => {
      const step = Math.abs(pending[key]) < 1e-4 ? pending[key] : pending[key] * k;
      pending[key] -= step;
      return step;
    };

    if (pending.theta || pending.phi) {
      offset.copy(camera.position).sub(controls.target);
      spherical.setFromVector3(offset);
      spherical.theta += take('theta');
      spherical.phi = THREE.MathUtils.clamp(spherical.phi + take('phi'), MIN_POLAR, controls.maxPolarAngle);
      camera.position.copy(controls.target).add(offset.setFromSpherical(spherical));
    }
    if (pending.zoom) {
      const zoom = THREE.MathUtils.clamp(camera.zoom * Math.exp(take('zoom')), controls.minZoom, controls.maxZoom);
      if (zoom === camera.zoom) pending.zoom = 0;   // tope alcanzado
      camera.zoom = zoom;
      camera.updateProjectionMatrix();
    }
  }

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
      pending.theta = pending.phi = pending.zoom = 0;
      controls.target.set(0, 0, 0);
      camera.position.copy(direction).multiplyScalar(CAMERA_DISTANCE);
      camera.lookAt(0, 0, 0);
      controls.update();
      fit();
      onChange();
    },
    // Tras un cambio de tamaño solo se reencuadra si el usuario no ha movido la cámara
    refit() { if (!userMoved) fit(); onChange(); },
    // Gira alrededor del modelo: `theta` horizontal, `phi` inclinación (radianes)
    orbitBy(theta, phi = 0) {
      userMoved = true;
      pending.theta += theta;
      pending.phi += phi;
    },
    // Multiplica el zoom actual (>1 acerca, <1 aleja)
    zoomBy(factor) {
      userMoved = true;
      pending.zoom += Math.log(factor);
    },
    // Centra y encuadra el modelo sin cambiar el ángulo de la cámara
    frame() {
      pending.theta = pending.phi = pending.zoom = 0;
      camera.position.sub(controls.target);
      controls.target.set(0, 0, 0);
      controls.update();
      fit();
      onChange();
    },
    // Aplica los pasos pendientes y la inercia; devuelve true si la cámara se movió en este cuadro
    update(dt) {
      applyPending(dt);
      controls.update();
      return cameraMoved();
    },
  };
}
