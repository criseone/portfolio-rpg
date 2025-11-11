import * as THREE from 'three';
import {
  CHARACTER_IDS,
  CharacterId,
  GameState,
  getState,
  subscribe,
} from '../state';

interface RoamerInstance {
  id: CharacterId;
  group: THREE.Group;
  radius: number;
  speed: number;
  height: number;
  offset: number;
}

export interface RoamerInfo {
  id: CharacterId;
  position: THREE.Vector3;
}

const CHARACTER_COLORS: Record<CharacterId, string> = {
  design: '#38bdf8',
  art: '#f472b6',
  collaboration: '#22d3ee',
};

export class Roamers {
  private roamers = new Map<CharacterId, RoamerInstance>();
  private unsubscribe: (() => void) | null = null;

  constructor(private scene: THREE.Scene) {
    this.unsubscribe = subscribe((next) => this.sync(next));
    this.sync(getState());
  }

  private sync(state: GameState) {
    const active = state.currentCharacter;
    const needed =
      active && state.unlockedCharacters.length > 0
        ? new Set(
            CHARACTER_IDS.filter(
              (id) =>
                id !== active && !state.unlockedCharacters.includes(id),
            ),
          )
        : new Set<CharacterId>();

    needed.forEach((id, index) => {
      if (!this.roamers.has(id)) {
        const instance = this.createRoamer(id, index);
        this.roamers.set(id, instance);
        this.scene.add(instance.group);
      }
    });

    Array.from(this.roamers.keys()).forEach((id) => {
      if (!needed.has(id)) {
        const instance = this.roamers.get(id);
        if (instance) {
          this.scene.remove(instance.group);
        }
        this.roamers.delete(id);
      }
    });
  }

  private createRoamer(id: CharacterId, index: number): RoamerInstance {
    const group = new THREE.Group();
    const color = CHARACTER_COLORS[id];

    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.35, 1, 16, 24),
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.4,
        metalness: 0.2,
        roughness: 0.35,
      }),
    );
    body.position.y = 1;
    group.add(body);

    const visor = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({
        color: '#0f172a',
        emissive: '#020617',
        roughness: 0.8,
        metalness: 0.05,
      }),
    );
    visor.position.y = 1.4;
    group.add(visor);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 0.1, 12),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.4 }),
    );
    base.rotation.x = Math.PI / 2;
    group.add(base);

    return {
      id,
      group,
      radius: 9 + index * 2.5,
      speed: 0.3 + index * 0.1,
      height: 1.1,
      offset: Math.random() * Math.PI * 2,
    };
  }

  update(elapsed: number) {
    this.roamers.forEach((roamer) => {
      const angle = elapsed * roamer.speed + roamer.offset;
      const x = Math.cos(angle) * roamer.radius;
      const z = Math.sin(angle) * roamer.radius;
      roamer.group.position.set(x, roamer.height, z);
      roamer.group.rotation.y = angle + Math.PI / 2;
      const bob = Math.sin(elapsed * 2 + roamer.offset) * 0.08;
      roamer.group.position.y = roamer.height + bob;
    });
  }

  getInfos(): RoamerInfo[] {
    return Array.from(this.roamers.values()).map((roamer) => ({
      id: roamer.id,
      position: roamer.group.position,
    }));
  }

  dispose() {
    this.roamers.forEach((roamer) => this.scene.remove(roamer.group));
    this.roamers.clear();
    this.unsubscribe?.();
  }
}
