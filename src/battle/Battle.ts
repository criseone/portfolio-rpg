import * as THREE from 'three';
import type { CharId } from '../state';
import { DesignCharacterModel } from '../models/DesignCharacterModel';
import { ArtCharacterModel } from '../models/ArtCharacterModel';
import { CollabCharacterModel } from '../models/CollabCharacterModel';
import { CATEGORY_COLOR } from '../world/Monolith';
import { createLightTrianglesVFX, createBeamSweepVFX, createGraffitiSplashVFX } from '../vfx/Particles';

type BattleConfig = {
  player: CharId;
  enemy: CharId | 'monolith';
  onComplete: (result: 'win' | 'lose') => void;
};

type BattleState = 'START' | 'PLAYER_TURN' | 'ENEMY_TURN' | 'WIN' | 'LOSE' | 'IDLE';

const MAX_HEALTH = 100;

export class Battle {
  private config: BattleConfig | null = null;
  private isActive = false;
  private currentState: BattleState = 'IDLE';

  private playerStats = { hp: MAX_HEALTH };
  private enemyStats = { hp: MAX_HEALTH };

  private element: HTMLDivElement;
  public scene: THREE.Scene;
  private player: THREE.Group;
  private enemy: THREE.Group;
  private camera: THREE.PerspectiveCamera;
  private activeVFX: { effect: THREE.Group; target: THREE.Vector3; startTime: number; }[] = [];

  constructor(private uiRoot: HTMLElement, camera: THREE.PerspectiveCamera) {
    this.element = document.createElement('div');
    this.element.className = 'battle-ui-turnbased';
    this.element.style.display = 'none';
    this.uiRoot.appendChild(this.element);

    this.scene = new THREE.Scene();
    this.player = new THREE.Group();
    this.enemy = new THREE.Group();
    this.camera = camera;
  }

  public start(config: BattleConfig) {
    this.config = config;
    this.playerStats.hp = MAX_HEALTH;
    this.enemyStats.hp = MAX_HEALTH;
    this.isActive = true;
    this.element.style.display = 'flex';

    this.setupScene();
    this.createUI();
    this.setState('START');
  }

  private setState(state: BattleState) {
    this.currentState = state;
    this.updateState(); // Trigger state change immediately
  }

  private setupScene() {
    this.scene.background = new THREE.Color(0x110011);
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    const dir = new THREE.DirectionalLight(0xffffff, 0.5);
    dir.position.set(0, 10, 5);
    this.scene.add(ambient, dir);

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(10, 32),
      new THREE.MeshStandardMaterial({ color: 0x220022 })
    );
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    // Add models
    const playerModel = this.getModelForChar(this.config!.player);
    this.player.add(playerModel.group);
    this.player.position.set(0, 0, 5);
    this.scene.add(this.player);

    const enemyModel = this.getModelForChar(this.config!.enemy as CharId); // Assuming enemy is a CharId for now
    this.enemy.add(enemyModel.group);
    this.enemy.position.set(0, 0, -5);
    this.scene.add(this.enemy);

    this.camera.position.set(10, 10, 10);
    this.camera.lookAt(0, 0, 0);
  }

  public stop() {
    this.isActive = false;
    this.element.style.display = 'none';
    this.scene.clear();
    this.player.clear();
    this.enemy.clear();
    if (this.config) {
      this.config.onComplete(this.playerStats.hp > 0 ? 'win' : 'lose');
    }
  }

  public updateState() {
    if (!this.isActive) return;

    switch (this.currentState) {
      case 'START':
        this.logMessage(`Battle starts! ${this.config?.player} vs ${this.config?.enemy}`);
        setTimeout(() => this.setState('PLAYER_TURN'), 1000);
        this.setState('IDLE');
        break;
      case 'PLAYER_TURN':
        this.showCommandMenu(true);
        this.logMessage("Your turn!");
        break;
      case 'ENEMY_TURN':
        this.logMessage("Enemy's turn!");
        setTimeout(() => {
          this.handleEnemyAttack();
        }, 1000);
        this.setState('IDLE');
        break;
      case 'WIN':
        this.logMessage("You win!");
        setTimeout(() => this.stop(), 2000);
        this.setState('IDLE');
        break;
      case 'LOSE':
        this.logMessage("You lose!");
        setTimeout(() => this.stop(), 2000);
        this.setState('IDLE');
        break;
    }
  }

  private handlePlayerAttack() {
    this.showCommandMenu(false);
    this.logMessage("You attack!");

    const attackerCharId = this.config!.player;
    const targetPosition = this.enemy.position.clone();

    if (attackerCharId === 'art') {
      const vfx = createLightTrianglesVFX(new THREE.Color(CATEGORY_COLOR[attackerCharId]));
      vfx.position.copy(this.player.position);
      this.scene.add(vfx);
      this.activeVFX.push({ effect: vfx, target: targetPosition, startTime: performance.now() });

      const beam = createBeamSweepVFX(new THREE.Color(CATEGORY_COLOR[attackerCharId]));
      beam.position.copy(targetPosition);
      beam.position.y += 1.0; // Position it slightly above the target
      beam.scale.set(0, 1, 1); // Start with zero width
      this.scene.add(beam);
      this.activeVFX.push({ effect: beam, target: targetPosition, startTime: performance.now() });

      const splash = createGraffitiSplashVFX(new THREE.Color(CATEGORY_COLOR[attackerCharId]));
      splash.position.copy(targetPosition);
      splash.position.y += 1.0;
      splash.lookAt(this.player.position);
      this.scene.add(splash);
      this.activeVFX.push({ effect: splash, target: targetPosition, startTime: performance.now() });
    }

    this.enemyStats.hp -= 20; // Simple damage for now
    this.updateHealthBars();
    setTimeout(() => {
      if (this.enemyStats.hp <= 0) {
        this.setState('WIN');
      } else {
        this.setState('ENEMY_TURN');
      }
    }, 1000);
  }

  private handleEnemyAttack() {
    this.logMessage("Enemy attacks!");

    const attackerCharId = this.config!.enemy as CharId; // Assuming enemy is a CharId
    const targetPosition = this.player.position.clone();

    if (attackerCharId === 'art') {
      const vfx = createLightTrianglesVFX(new THREE.Color(CATEGORY_COLOR[attackerCharId]));
      vfx.position.copy(this.enemy.position);
      this.scene.add(vfx);
      this.activeVFX.push({ effect: vfx, target: targetPosition, startTime: performance.now() });

      const beam = createBeamSweepVFX(new THREE.Color(CATEGORY_COLOR[attackerCharId]));
      beam.position.copy(targetPosition);
      beam.position.y += 1.0; // Position it slightly above the target
      beam.scale.set(0, 1, 1); // Start with zero width
      this.scene.add(beam);
      this.activeVFX.push({ effect: beam, target: targetPosition, startTime: performance.now() });

      const splash = createGraffitiSplashVFX(new THREE.Color(CATEGORY_COLOR[attackerCharId]));
      splash.position.copy(targetPosition);
      splash.position.y += 1.0;
      splash.lookAt(this.enemy.position);
      this.scene.add(splash);
      this.activeVFX.push({ effect: splash, target: targetPosition, startTime: performance.now() });
    }

    this.playerStats.hp -= 15; // Simple damage for now
    this.updateHealthBars();
    setTimeout(() => {
      if (this.playerStats.hp <= 0) {
        this.setState('LOSE');
      } else {
        this.setState('PLAYER_TURN');
      }
    }, 1000);
  }

  public isBattleActive(): boolean {
    return this.isActive;
  }

  public update(dt: number) {
    // Animate active VFX
    this.activeVFX = this.activeVFX.filter(vfxData => {
      const elapsed = (performance.now() - vfxData.startTime) / 1000; // in seconds
      const duration = 0.5; // VFX animation duration

      if (elapsed > duration) {
        this.scene.remove(vfxData.effect);
        return false; // Remove VFX
      }

      const progress = elapsed / duration;

      if (vfxData.effect.children.length > 0 && vfxData.effect.children[0] instanceof THREE.Mesh) { // Light Triangles
        // Move VFX towards target
        vfxData.effect.position.lerpVectors(this.player.position, vfxData.target, progress);
        vfxData.effect.lookAt(vfxData.target); // Make VFX face the target

        // Fade out
        vfxData.effect.children.forEach(child => {
          if (child instanceof THREE.Mesh) {
            (child.material as THREE.MeshStandardMaterial).opacity = 1.0 - progress;
          }
        });
      } else if (vfxData.effect instanceof THREE.Mesh && vfxData.effect.geometry.type === 'BoxGeometry') { // Beam Sweep
        // Animate scale and opacity
        vfxData.effect.scale.x = progress;
        (vfxData.effect.material as THREE.MeshStandardMaterial).opacity = 1.0 - progress;
      } else if (vfxData.effect instanceof THREE.Mesh && vfxData.effect.geometry.type === 'PlaneGeometry') { // Graffiti Splash
        // Animate opacity
        (vfxData.effect.material as THREE.MeshStandardMaterial).opacity = 1.0 - progress;
      }

      return true; // Keep VFX
    });
  }

  private getModelForChar(charId: CharId) {
    switch (charId) {
      case 'design':
        return new DesignCharacterModel();
      case 'art':
        return new ArtCharacterModel();
      case 'collab':
        return new CollabCharacterModel();
      default:
        return new DesignCharacterModel(); // Fallback
    }
  }

  private createUI() {
    this.element.innerHTML = `
      <div class="health-bars">
        <div class="health-bar player-health">
          <div class="bar"></div>
          <div class="text">Player HP</div>
        </div>
        <div class="health-bar enemy-health">
          <div class="bar"></div>
          <div class="text">Enemy HP</div>
        </div>
      </div>
      <div class="message-log"></div>
      <div class="command-menu">
        <button data-command="attack">Attack</button>
        <button disabled>Skills</button>
        <button disabled>Defend</button>
      </div>
    `;
    this.updateHealthBars();
    this.showCommandMenu(false);

    this.element.querySelector('[data-command="attack"]')?.addEventListener('click', () => {
      if (this.currentState === 'PLAYER_TURN') {
        this.handlePlayerAttack();
      }
    });
  }

  private updateHealthBars() {
    const playerHealthBar = this.element.querySelector('.player-health .bar') as HTMLDivElement;
    const enemyHealthBar = this.element.querySelector('.enemy-health .bar') as HTMLDivElement;
    if (playerHealthBar) {
      playerHealthBar.style.width = `${(this.playerStats.hp / MAX_HEALTH) * 100}%`;
    }
    if (enemyHealthBar) {
      enemyHealthBar.style.width = `${(this.enemyStats.hp / MAX_HEALTH) * 100}%`;
    }
  }

  private logMessage(message: string) {
    const log = this.element.querySelector('.message-log') as HTMLDivElement;
    if (log) {
      log.textContent = message;
    }
  }

  private showCommandMenu(show: boolean) {
    const menu = this.element.querySelector('.command-menu') as HTMLDivElement;
    if (menu) {
      menu.style.display = show ? 'flex' : 'none';
    }
  }
}