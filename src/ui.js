const $ = (id) => document.getElementById(id);

function bindToggle(button, onChange) {
  button.addEventListener('click', () => {
    const on = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', on);
    onChange(on);
  });
}

// Grupo de botones excluyentes: el valor está en data-value
function bindChoice(container, onChange) {
  const buttons = [...container.querySelectorAll('button')];
  for (const button of buttons) {
    button.addEventListener('click', () => {
      for (const other of buttons) other.setAttribute('aria-pressed', other === button);
      onChange(button.dataset.value);
    });
  }
}

// Botón que repite su acción mientras se mantiene pulsado (también responde al teclado)
const HOLD_DELAY = 350, HOLD_INTERVAL = 90;
function bindHold(button, action) {
  let delay = null, interval = null;
  const stop = () => { clearTimeout(delay); clearInterval(interval); };
  button.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    action();
    stop();
    delay = setTimeout(() => { interval = setInterval(action, HOLD_INTERVAL); }, HOLD_DELAY);
  });
  for (const type of ['pointerup', 'pointerleave', 'pointercancel']) button.addEventListener(type, stop);
  button.addEventListener('click', (e) => { if (e.detail === 0) action(); });   // Enter / Espacio
}

const ZOOM_STEP = 1.2, ORBIT_STEP = Math.PI / 12, TILT_STEP = Math.PI / 24;

export function bindUI({ onIso, onTop, onDoors, onLabels, onFurniture, onLighting, onZoom, onOrbit, onFrame }) {
  $('btn-iso').addEventListener('click', onIso);
  $('btn-top').addEventListener('click', onTop);
  bindToggle($('btn-doors'), onDoors);
  bindToggle($('btn-labels'), onLabels);
  bindToggle($('btn-furniture'), onFurniture);
  bindChoice($('lighting'), onLighting);

  bindHold($('cam-zoom-in'), () => onZoom(ZOOM_STEP));
  bindHold($('cam-zoom-out'), () => onZoom(1 / ZOOM_STEP));
  bindHold($('cam-left'), () => onOrbit(-ORBIT_STEP, 0));
  bindHold($('cam-right'), () => onOrbit(ORBIT_STEP, 0));
  bindHold($('cam-up'), () => onOrbit(0, -TILT_STEP));
  bindHold($('cam-down'), () => onOrbit(0, TILT_STEP));
  $('cam-frame').addEventListener('click', onFrame);
}
