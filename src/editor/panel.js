import { FINISH_GROUPS } from '../materials/finishes.js';

const $ = (id) => document.getElementById(id);

// Panel del editor: acabado, color, brillo y escala de textura.
// Emite cambios parciales del estado de la superficie mediante `onChange`.
export function createPanel({ onChange, onReset, onClose }) {
  const root = $('editor'), title = $('ed-title');
  const color = $('ed-color'), gloss = $('ed-gloss'), scale = $('ed-scale');
  const glossOut = $('ed-gloss-out'), scaleOut = $('ed-scale-out');

  // Un bloque por grupo de acabados (Madera, Piedra…), con un botón por opción
  const finishButtons = FINISH_GROUPS.flatMap(({ group, items }) => {
    const heading = document.createElement('small');
    heading.textContent = group;
    const row = document.createElement('div');
    row.className = 'ed-chips';
    $('ed-finishes').append(heading, row);

    return items.map(({ key, label }) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.dataset.finish = key;
      button.addEventListener('click', () => onChange({ finish: key }));
      row.append(button);
      return button;
    });
  });

  color.addEventListener('input', () => onChange({ color: color.value }));
  gloss.addEventListener('input', () => onChange({ gloss: gloss.value / 100 }));
  scale.addEventListener('input', () => onChange({ scale: scale.value / 100 }));
  $('ed-reset').addEventListener('click', onReset);
  $('ed-close').addEventListener('click', onClose);

  return {
    // Refleja en los controles el estado actual de la superficie
    show(surface) {
      const { state } = surface;
      title.textContent = surface.label;
      for (const button of finishButtons) button.setAttribute('aria-pressed', button.dataset.finish === state.finish);
      color.value = state.color;
      gloss.value = Math.round(state.gloss * 100);
      scale.value = Math.round(state.scale * 100);
      glossOut.textContent = `${gloss.value}%`;
      scaleOut.textContent = `${(state.scale).toFixed(2)}×`;
      root.hidden = false;
    },
    hide() { root.hidden = true; },
  };
}
