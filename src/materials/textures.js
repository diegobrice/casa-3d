import * as THREE from 'three';

// Texturas procedurales generadas en canvas (sin archivos externos).
// Cada textura cubre `meters` metros; las UV de la geometría están en metros de mundo,
// así los despieces continúan entre piezas contiguas.

// PRNG determinista (mulberry32): las texturas salen iguales en cada carga
function createRandom(seed) {
  return () => {
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function createTextures(anisotropy) {
  const rnd = createRandom(7);

  function tex(meters, draw, { size = 512, srgb = true } = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    draw(canvas.getContext('2d'), size);
    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1 / meters, 1 / meters);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = anisotropy;
    t.userData.meters = meters;   // tamaño real que cubre una repetición
    return t;
  }

  function speckle(g, s, n, alpha) {
    for (let i = 0; i < n; i++) {
      const d = rnd() < .5 ? 0 : 255;
      g.fillStyle = `rgba(${d},${d},${d},${rnd() * alpha})`;
      g.fillRect(rnd() * s, rnd() * s, 1 + rnd() * 2, 1 + rnd() * 2);
    }
  }

  function planks(g, s, { rows, hue, sat, light, vary, gap, gapW }) {
    const rh = s / rows;
    for (let r = 0; r < rows; r++) {
      const o = rnd() * s / 2, tones = [rnd(), rnd()];
      for (let k = -1; k <= 1; k++) {            // dos tablas por hilera, juntas alternadas
        const tn = tones[Math.abs(k) % 2] - .5;
        g.fillStyle = `hsl(${hue + tn * 6},${sat}%,${light + tn * vary}%)`;
        g.fillRect(o + k * s / 2, r * rh, s / 2, rh);
      }
      for (let i = 0; i < 26; i++) {             // veta
        g.fillStyle = `rgba(45,25,10,${.03 + rnd() * .09})`;
        g.fillRect(0, r * rh + rnd() * rh, s, 1);
      }
      g.fillStyle = gap;
      g.fillRect(0, (r + 1) * rh - gapW, s, gapW);
      g.fillRect(o - gapW / 2, r * rh, gapW, rh);
      g.fillRect(o + s / 2 - gapW / 2, r * rh, gapW, rh);
    }
  }

  function tiles(g, s, n, { base: [r, gr, b], vary, grout, groutW, grain }) {
    const cs = s / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const v = (rnd() - .5) * vary;
      g.fillStyle = `rgb(${r + v},${gr + v},${b + v})`;
      g.fillRect(i * cs, j * cs, cs, cs);
    }
    speckle(g, s, grain, .07);
    g.fillStyle = grout;
    for (let i = 0; i <= n; i++) {
      g.fillRect(i * cs - groutW / 2, 0, groutW, s);
      g.fillRect(0, i * cs - groutW / 2, s, groutW);
    }
  }

  // Losas de mármol: vetas recortadas a cada losa para que la textura repita sin costuras
  function marble(g, s) {
    const n = 2, cs = s / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      g.save();
      g.beginPath(); g.rect(i * cs, j * cs, cs, cs); g.clip();
      const v = (rnd() - .5) * 6;
      g.fillStyle = `rgb(${240 + v},${238 + v},${234 + v})`;
      g.fillRect(i * cs, j * cs, cs, cs);
      for (let k = 0; k < 7; k++) {
        let x = i * cs + rnd() * cs, y = j * cs + rnd() * cs, a = rnd() * Math.PI * 2;
        g.beginPath(); g.moveTo(x, y);
        for (let t = 0; t < 14; t++) {
          a += (rnd() - .5) * .9;
          x += Math.cos(a) * cs / 9; y += Math.sin(a) * cs / 9;
          g.lineTo(x, y);
        }
        g.strokeStyle = `rgba(105,108,115,${.08 + rnd() * .25})`;
        g.lineWidth = .6 + rnd() * 2.4;
        g.stroke();
      }
      g.restore();
    }
    speckle(g, s, 3000, .04);
    g.fillStyle = '#c9c6c0';
    for (let i = 0; i <= n; i++) { g.fillRect(i * cs - .75, 0, 1.5, s); g.fillRect(0, i * cs - .75, s, 1.5); }
  }

  function grass(g, s) {
    g.fillStyle = '#6a9446';
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 16000; i++) {
      g.fillStyle = `hsla(${82 + rnd() * 30},${35 + rnd() * 25}%,${24 + rnd() * 28}%,.55)`;
      g.fillRect(rnd() * s, rnd() * s, 1.5, 3);
    }
  }

  function doorGrain(g, s) {
    g.fillStyle = '#9a6b42';
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 260; i++) {
      g.fillStyle = `rgba(50,28,10,${.04 + rnd() * .12})`;
      g.fillRect(rnd() * s, 0, 1 + rnd() * 2, s);
    }
  }

  function plaster(g, s) {
    g.fillStyle = '#808080';
    g.fillRect(0, 0, s, s);
    speckle(g, s, 30000, .16);
  }

  // Mapa de normales del agua: suma de ondas con frecuencias enteras (repetible sin costuras)
  function waterNormals(g, s) {
    const waves = [[1, 2, .5, 0], [3, -1, .35, 1.3], [-2, 3, .3, 2.1], [5, 2, .15, .7], [4, -5, .12, 4], [7, 3, .08, 5.2]];
    const img = g.createImageData(s, s), k = 2 * Math.PI / s;
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      let dx = 0, dy = 0;
      for (const [fx, fy, a, p] of waves) {
        const c = Math.cos(k * (fx * x + fy * y) + p) * a * k * 14;
        dx += c * fx; dy += c * fy;
      }
      const l = Math.hypot(dx, dy, 1), i = (y * s + x) * 4;
      img.data[i]     = (-dx / l * .5 + .5) * 255;
      img.data[i + 1] = (-dy / l * .5 + .5) * 255;
      img.data[i + 2] = (1 / l * .5 + .5) * 255;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }

  return {
    wood:      tex(2.0, (g, s) => planks(g, s, { rows: 16, hue: 30, sat: 42, light: 54, vary: 9, gap: 'rgba(60,35,15,.55)', gapW: 1.5 })),
    deck:      tex(1.2, (g, s) => planks(g, s, { rows: 8, hue: 24, sat: 40, light: 36, vary: 8, gap: '#22160c', gapW: 4 })),
    porcelain: tex(1.2, (g, s) => tiles(g, s, 2, { base: [233, 228, 219], vary: 5, grout: '#b9b2a5', groutW: 2, grain: 5000 })),
    ceramic:   tex(1.2, (g, s) => tiles(g, s, 4, { base: [216, 221, 222], vary: 7, grout: '#a3a8a8', groutW: 3, grain: 3000 })),
    stone:     tex(1.0, (g, s) => tiles(g, s, 2, { base: [208, 198, 181], vary: 12, grout: '#958c7b', groutW: 3, grain: 14000 })),
    concrete:  tex(3.0, (g, s) => tiles(g, s, 1, { base: [176, 174, 169], vary: 0, grout: '#8a8883', groutW: 3, grain: 26000 })),
    mosaic:    tex(2.0, (g, s) => tiles(g, s, 8, { base: [70, 172, 204], vary: 34, grout: '#d5eef3', groutW: 3, grain: 2000 })),
    marble:    tex(1.6, marble),
    grass:     tex(4.0, grass),
    door:      tex(1.0, doorGrain),
    plaster:   tex(1.5, plaster, { srgb: false }),
    water:     tex(2.5, waterNormals, { size: 256, srgb: false }),
  };
}
