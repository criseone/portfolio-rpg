import type { CharacterId } from '../state';

export type BattleResult = 'player' | 'enemy';

interface BattleConfig {
  player: CharacterId;
  enemy: CharacterId;
  onComplete: (result: BattleResult) => void;
}

const CHARACTER_LABELS: Record<CharacterId, string> = {
  design: 'Design',
  art: 'Art',
  collaboration: 'Collaboration',
};

const CHARACTER_COLORS: Record<CharacterId, string> = {
  design: '#38bdf8',
  art: '#f472b6',
  collaboration: '#22d3ee',
};

const MAX_HEALTH = 3;

export class CharacterBattle {
  private element: HTMLDivElement;
  private playerLabel: HTMLDivElement;
  private enemyLabel: HTMLDivElement;
  private playerHearts: HTMLDivElement;
  private enemyHearts: HTMLDivElement;
  private instructions: HTMLDivElement;

  private playerHp = MAX_HEALTH;
  private enemyHp = MAX_HEALTH;
  private playerCooldown = 0;
  private enemyCooldown = 0;
  private active = false;
  private onComplete: ((result: BattleResult) => void) | null = null;
  private currentConfig: BattleConfig | null = null;

  constructor() {
    const { element, playerLabel, enemyLabel, playerHearts, enemyHearts, instructions } =
      this.mount();
    this.element = element;
    this.playerLabel = playerLabel;
    this.enemyLabel = enemyLabel;
    this.playerHearts = playerHearts;
    this.enemyHearts = enemyHearts;
    this.instructions = instructions;
  }

  start(config: BattleConfig) {
    this.playerHp = MAX_HEALTH;
    this.enemyHp = MAX_HEALTH;
    this.playerCooldown = 0.4;
    this.enemyCooldown = 1.2;
    this.active = true;
    this.onComplete = config.onComplete;
    this.currentConfig = config;

    this.playerLabel.textContent = `${CHARACTER_LABELS[config.player]} (You)`;
    this.enemyLabel.textContent = `${CHARACTER_LABELS[config.enemy]} Rival`;
    this.playerLabel.style.color = CHARACTER_COLORS[config.player];
    this.enemyLabel.style.color = CHARACTER_COLORS[config.enemy];
    this.instructions.textContent = 'Press SPACE to strike when charged.';
    this.instructions.dataset.ready = 'false';

    this.renderHearts();
    this.element.dataset.hidden = 'false';
  }

  update(delta: number) {
    if (!this.active) return;
    this.playerCooldown = Math.max(0, this.playerCooldown - delta);
    this.enemyCooldown = Math.max(0, this.enemyCooldown - delta);

    if (this.enemyCooldown <= 0) {
      this.enemyCooldown = 1 + Math.random() * 0.8;
      this.applyDamage('player');
    }

    if (this.playerCooldown <= 0 && this.instructions.dataset.ready !== 'true') {
      this.instructions.dataset.ready = 'true';
      this.instructions.textContent = 'Strike now! (SPACE)';
    } else if (this.playerCooldown > 0 && this.instructions.dataset.ready === 'true') {
      this.instructions.dataset.ready = 'false';
      this.instructions.textContent = 'Charging…';
    }
  }

  playerStrike() {
    if (!this.active || this.playerCooldown > 0) {
      return false;
    }

    this.playerCooldown = 0.9;
    this.applyDamage('enemy');
    this.instructions.dataset.ready = 'false';
    this.instructions.textContent = 'Charging…';
    return true;
  }

  isActive() {
    return this.active;
  }

  abort() {
    if (this.active) {
      this.finish('enemy');
    }
  }

  private applyDamage(target: BattleResult) {
    if (target === 'player') {
      this.playerHp = Math.max(0, this.playerHp - 1);
    } else {
      this.enemyHp = Math.max(0, this.enemyHp - 1);
    }

    this.renderHearts();

    if (this.playerHp === 0) {
      this.finish('enemy');
    } else if (this.enemyHp === 0) {
      this.finish('player');
    }
  }

  private finish(result: BattleResult) {
    this.active = false;
    this.element.dataset.hidden = 'true';
    this.instructions.dataset.ready = 'false';
    this.currentConfig = null;
    const callback = this.onComplete;
    this.onComplete = null;
    callback?.(result);
  }

  private renderHearts() {
    this.playerHearts.textContent = this.renderHeartString(this.playerHp);
    this.enemyHearts.textContent = this.renderHeartString(this.enemyHp);
  }

  private renderHeartString(value: number) {
    const filled = '♥'.repeat(value);
    const empty = '◦'.repeat(Math.max(0, MAX_HEALTH - value));
    return `${filled}${empty}`;
  }

  private mount() {
    const element = document.createElement('div');
    element.className = 'battle-overlay';
    element.dataset.hidden = 'true';
    element.innerHTML = `
      <div class="battle-overlay__panel">
        <div class="battle-overlay__label battle-overlay__label--player"></div>
        <div class="battle-overlay__hearts" data-role="player-hearts"></div>
        <div class="battle-overlay__instructions"></div>
        <div class="battle-overlay__label battle-overlay__label--enemy"></div>
        <div class="battle-overlay__hearts" data-role="enemy-hearts"></div>
      </div>
    `;
    document.body.appendChild(element);

    return {
      element,
      playerLabel: element.querySelector<HTMLDivElement>('.battle-overlay__label--player')!,
      enemyLabel: element.querySelector<HTMLDivElement>('.battle-overlay__label--enemy')!,
      playerHearts: element.querySelector<HTMLDivElement>('[data-role="player-hearts"]')!,
      enemyHearts: element.querySelector<HTMLDivElement>('[data-role="enemy-hearts"]')!,
      instructions: element.querySelector<HTMLDivElement>('.battle-overlay__instructions')!,
    };
  }
}
