import * as THREE from 'three';
import { CHARACTER } from '../style/znastyle';

export abstract class CharacterModel {
  public group: THREE.Group;
  protected aura: THREE.Mesh;
  public hologramRing: THREE.Mesh;

  constructor() {
    this.group = new THREE.Group();
  }

  protected createAura(color: THREE.Color): THREE.Mesh {
    const auraMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: color },
        opacity: { value: CHARACTER.ArchetypeAuraOpacity },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float opacity;
        varying vec2 vUv;
        void main() {
          float dist = distance(vUv, vec2(0.5));
          float strength = smoothstep(0.5, 0.0, dist);
          gl_FragColor = vec4(color, strength * opacity);
        }
      `,
      transparent: true,
      depthWrite: false,
    });

    const auraGeometry = new THREE.PlaneGeometry(2, 2);
    const aura = new THREE.Mesh(auraGeometry, auraMaterial);
    aura.rotation.x = -Math.PI / 2;
    aura.position.y = 0.01; // Slightly above the ground
    return aura;
  }

  public toggleHologram(visible: boolean) {
    (this.hologramRing.material as THREE.MeshBasicMaterial).opacity = visible ? 0.5 : 0.0;
  }

  public update(dt: number, t: number) {
    if (this.aura) {
      const pulse = (Math.sin(t * 2.0) * 0.5 + 0.5); // 0 to 1
      (this.aura.material as THREE.ShaderMaterial).uniforms.opacity.value = CHARACTER.ArchetypeAuraOpacity * (0.5 + pulse * 0.5); // Pulse between 50% and 100% of base opacity
    }
  }
}
