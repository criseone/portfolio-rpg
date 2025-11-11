import * as THREE from 'three';
import { BattlePattern } from './BattlePattern';

const CONE_COUNT = 4;
const HIT_COOLDOWN = 1; // 1 second

export class LightTriangle implements BattlePattern {
  public onPlayerHit: (() => void) | null = null;
  private _scene = new THREE.Scene();
  private player: THREE.Object3D | null = null;
  private cones: THREE.Mesh[] = [];
  private hitCooldown = 0;

  get scene() {
    return this._scene;
  }

  start(player: THREE.Object3D) {
    this.player = player;

    const coneGeo = new THREE.ConeGeometry(2, 15, 3); // A sharp cone looks like a triangle
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });

    for (let i = 0; i < CONE_COUNT; i++) {
      const cone = new THREE.Mesh(coneGeo, coneMat);
      const angle = (i / CONE_COUNT) * Math.PI * 2;
      cone.position.set(Math.cos(angle) * 7, 0, Math.sin(angle) * 7);
      cone.lookAt(0, 0, 0);
      cone.rotateX(Math.PI / 2);
      this.cones.push(cone);
      this._scene.add(cone);
    }
  }

  update(dt: number) {
    if (this.hitCooldown > 0) {
      this.hitCooldown -= dt;
    }

    // Rotate the whole scene for a simple sweeping effect
    this._scene.rotation.y += dt * 0.1;

    if (this.player && this.hitCooldown <= 0) {
      const playerBox = new THREE.Box3().setFromObject(this.player);

      for (const cone of this.cones) {
        // We need to check collision in world space
        const coneWorld = new THREE.Box3().setFromObject(cone, true);

        if (playerBox.intersectsBox(coneWorld)) {
          this.onPlayerHit?.();
          this.hitCooldown = HIT_COOLDOWN;
          break; // Only one hit per frame
        }
      }
    }
  }

  stop() {
    this.cones.forEach(c => {
      c.geometry.dispose();
      if (Array.isArray(c.material)) {
        c.material.forEach(m => m.dispose());
      } else {
        c.material.dispose();
      }
      this._scene.remove(c);
    });
    this.cones = [];
    this.player = null;
  }
}