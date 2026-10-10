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

export function bindUI({ onIso, onTop, onDoors, onLabels, onFurniture, onLighting }) {
  $('btn-iso').addEventListener('click', onIso);
  $('btn-top').addEventListener('click', onTop);
  bindToggle($('btn-doors'), onDoors);
  bindToggle($('btn-labels'), onLabels);
  bindToggle($('btn-furniture'), onFurniture);
  bindChoice($('lighting'), onLighting);
}
