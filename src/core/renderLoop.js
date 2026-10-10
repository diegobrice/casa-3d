import * as THREE from 'three';

const IDLE_MS = 220;   // tiempo sin cambios antes de pintar el cuadro de calidad final

// Render bajo demanda con dos calidades:
//  · mientras algo cambia (cámara, animaciones, edición) se pinta en calidad "draft", rápida;
//  · al quedar en reposo se pinta un único cuadro "final" (resolución completa + oclusión
//    ambiental) y se deja de renderizar hasta el siguiente cambio.
// Así la GPU no trabaja con la escena quieta y la interacción es fluida en gráficas integradas.
//
// `update(dt)` avanza las animaciones y devuelve true si alguna sigue en curso.
export function createRenderLoop(stage, update) {
  const clock = new THREE.Clock();
  let dirty = true, refined = false, lastChange = 0;

  stage.renderer.setAnimationLoop((now) => {
    const dt = Math.min(clock.getDelta(), 0.25);   // tope alto: las transiciones duran lo mismo aunque el equipo vaya lento
    const animating = update(dt);

    if (animating || dirty) {
      dirty = false;
      refined = false;
      lastChange = now;
      stage.setQuality('draft');
      stage.render();
    } else if (!refined && now - lastChange > IDLE_MS) {
      refined = true;
      stage.setQuality('final');
      stage.render();
    }
  });

  return {
    // Pide un nuevo cuadro: llamar tras cualquier cambio visible que no sea una animación
    invalidate() { dirty = true; },
  };
}
