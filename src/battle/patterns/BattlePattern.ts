import * as THREE from 'three';

export interface BattlePattern {
  start(player: THREE.Object3D): void;
  update(dt: number): void;
  stop(): void;
  onPlayerHit: (() => void) | null;
  get scene(): THREE.Scene;
}
