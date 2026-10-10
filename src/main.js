import './style.css';
import { createStage } from './core/stage.js';
import { createRenderLoop } from './core/renderLoop.js';
import { LIGHTING_PRESETS } from './core/lighting.js';
import { createView, VIEWS } from './core/view.js';
import { createDoorAnimator } from './core/doors.js';
import { createTextures } from './materials/textures.js';
import { createMaterials } from './materials/materials.js';
import { TextureLibrary } from './materials/TextureLibrary.js';
import { SurfaceRegistry } from './materials/SurfaceRegistry.js';
import { createHouse } from './builders/house.js';
import { createMaterialEditor } from './editor/index.js';
import { bindUI } from './ui.js';

const app = document.getElementById('app');
const stage = createStage(app, document.getElementById('labels'));

// El bucle se crea al final; hasta entonces `invalidate` no hace nada
let loop = null;
const invalidate = () => loop?.invalidate();

const textures = createTextures(stage.maxAnisotropy);
const surfaces = new SurfaceRegistry(new TextureLibrary(textures, stage.maxAnisotropy), invalidate);
const house = createHouse(createMaterials(textures), surfaces);
house.group.add(stage.lighting.lamps);
stage.scene.add(house.group);

const view = createView(stage.camera, stage.renderer.domElement, house.bounds, invalidate);
const doors = createDoorAnimator(house.doorPivots);
const editor = createMaterialEditor({ stage, house, surfaces, invalidate });

function resize() {
  stage.setSize(app.clientWidth, app.clientHeight);
  view.refit();
}
window.addEventListener('resize', resize);
resize();
view.setView(VIEWS.iso);

bindUI({
  onIso: () => view.setView(VIEWS.iso),
  onTop: () => view.setView(VIEWS.top),
  onDoors: (open) => doors.setOpen(open),
  onLabels: (visible) => { stage.labelsEl.style.display = visible ? '' : 'none'; },
  onFurniture: (visible) => {
    house.furniture.visible = visible;
    stage.updateShadows();
    invalidate();
  },
  onZoom: (factor) => view.zoomBy(factor),
  onOrbit: (theta, phi) => view.orbitBy(theta, phi),
  onFrame: () => view.frame(),
  onLighting: (preset) => {
    stage.lighting.setPreset(preset);
    document.body.classList.toggle('dark', Boolean(LIGHTING_PRESETS[preset].dark));
  },
});

// Avanza las animaciones; devuelve true si alguna sigue en curso (hay que seguir renderizando)
loop = createRenderLoop(stage, (dt) => {
  const doorsMoving = doors.update(dt);
  if (doorsMoving) stage.updateShadows();
  const lightChanging = stage.lighting.update(dt);
  const flashing = editor.update(dt);
  const cameraMoving = view.update(dt);
  textures.water.offset.x += dt * 0.012;   // ondulación del agua (visible mientras hay movimiento)
  textures.water.offset.y += dt * 0.02;
  return doorsMoving || lightChanging || flashing || cameraMoving;
});

if (import.meta.env.DEV) window.__casa = { stage, house };   // acceso desde la consola en desarrollo
