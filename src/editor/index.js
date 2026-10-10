import { createPicker } from './picker.js';
import { createHighlight } from './highlight.js';
import { createPanel } from './panel.js';

// Editor de materiales en tiempo real: clic sobre un muro, piso o superficie exterior
// para seleccionarlo y cambiar su acabado, color, brillo y escala desde el panel.
// `invalidate` pide un nuevo cuadro al bucle de render tras cada cambio.
export function createMaterialEditor({ stage, house, surfaces, invalidate }) {
  const highlight = createHighlight(house.group);
  let selected = null;

  const panel = createPanel({
    onChange(patch) {
      if (!selected) return;
      surfaces.update(selected, patch);
      panel.show(selected);
      invalidate();
    },
    onReset() {
      if (!selected) return;
      surfaces.reset(selected);
      panel.show(selected);
      invalidate();
    },
    onClose: () => select(null),
  });

  function select(surface) {
    selected = surface?.mesh ? surface : null;
    if (selected) {
      highlight.show(selected.mesh);
      panel.show(selected);
    } else {
      highlight.clear();
      panel.hide();
    }
    invalidate();
  }

  createPicker(stage.renderer.domElement, stage.camera, house.group, surfaces, select);
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') select(null); });

  return {
    update: (dt) => highlight.update(dt),
  };
}
