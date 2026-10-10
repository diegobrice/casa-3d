const SWING = 1.35;   // apertura máxima en radianes
const EASING = 0.12;

// Anima la apertura y cierre de todas las hojas a la vez
export function createDoorAnimator(pivots) {
  let target = 1, amount = 1;

  const apply = () => {
    for (const p of pivots) p.rotation.y = p.userData.base + p.userData.dir * amount * SWING;
  };
  apply();

  return {
    setOpen(open) { target = open ? 1 : 0; },
    // Devuelve true mientras las hojas se mueven (hay que recalcular sombras)
    update() {
      if (amount === target) return false;
      amount += (target - amount) * EASING;
      if (Math.abs(target - amount) < 1e-3) amount = target;
      apply();
      return true;
    },
  };
}
