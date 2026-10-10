import * as THREE from 'three';

// Materiales fijos de la carpintería y los remates. Los acabados de muros, pisos y
// exteriores son editables y viven en SurfaceRegistry.

// Los materiales difusos reciben poco entorno; vidrio, agua y metal lo usan para reflejar.
const pbr = (options) => new THREE.MeshStandardMaterial({ envMapIntensity: .3, ...options });

export function createMaterials(T) {
  return {
    cap:    pbr({ color: 0x4d4a46, roughness: .9 }),                    // corte de muro
    base:   pbr({ color: 0xd8d2c7, roughness: .5 }),                    // zócalo
    sill:   pbr({ color: 0xc9c3b6, roughness: .45 }),                   // alféizar de piedra
    frame:  pbr({ color: 0x2c2f31, roughness: .38, metalness: .7 }),    // aluminio antracita
    door:   pbr({ map: T.door, roughness: .5 }),
    metal:  pbr({ color: 0xd0d0d0, roughness: .25, metalness: 1, envMapIntensity: 1 }),
    plinth: pbr({ color: 0x8f8a82, roughness: .95 }),

    glass: new THREE.MeshPhysicalMaterial({
      color: 0xd9eef2, roughness: .03, metalness: 0, transparent: true, opacity: .2,
      envMapIntensity: 1.6, clearcoat: 1, depthWrite: false,
    }),
    water: new THREE.MeshPhysicalMaterial({
      color: 0x6fd3e6, roughness: .04, metalness: 0, transparent: true, opacity: .55,
      normalMap: T.water, normalScale: new THREE.Vector2(.4, .4),
      envMapIntensity: 1.0, clearcoat: 1, depthWrite: false,
    }),
  };
}
