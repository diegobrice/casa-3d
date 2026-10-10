import * as THREE from 'three';

const CLICK_TOLERANCE = 5;   // px: más movimiento que esto es un arrastre de cámara, no un clic

// Detecta clics sobre el modelo y avisa con la superficie editable tocada (o null).
export function createPicker(domElement, camera, root, surfaces, onPick) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let down = null;

  domElement.addEventListener('pointerdown', (e) => {
    down = e.button === 0 ? { x: e.clientX, y: e.clientY } : null;
  });

  domElement.addEventListener('pointerup', (e) => {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    down = null;
    if (moved > CLICK_TOLERANCE) return;

    const rect = domElement.getBoundingClientRect();
    pointer.set((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);

    // Vidrio y agua se atraviesan; lo primero opaco decide la selección
    const hit = raycaster.intersectObject(root, true).find(h => !h.object.material.transparent);
    onPick(hit ? surfaces.find(hit.object.material) : null);
  });
}
