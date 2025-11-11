import { subscribe, state, CharId, GameState } from '../state';
import { MonolithConfig } from '../world/Monolith';

const CHARACTER_LABELS: Record<CharId, string> = {
  design: 'Design',
  art: 'Art',
  collab: 'Collaboration',
};

export class StatusDisplay {
  private element: HTMLDivElement;
  private totalMonoliths = 0;

  constructor(private uiRoot: HTMLElement) {
    this.element = document.createElement('div');
    this.element.className = 'status-display glass-ui';
    this.uiRoot.appendChild(this.element);

    this.fetchTotalMonoliths();

    subscribe((newState) => this.update(newState));
    this.update(state);
  }

  private async fetchTotalMonoliths() {
    try {
      const res = await fetch('/src/config/monoliths.json');
      const data: MonolithConfig[] = await res.json();
      this.totalMonoliths = data.length;
      this.update(state);
    } catch (error) {
      console.error('Failed to fetch monoliths config:', error);
    }
  }

  private update(currentState: GameState) {
    const { currentCharacter, unlockedCharacters, unlockedMonoliths } = currentState;

    if (!currentCharacter) {
      this.element.style.display = 'none';
      return;
    }

    this.element.style.display = 'block';

    const unlockedLabels = unlockedCharacters.map(id => CHARACTER_LABELS[id]).join(', ');

    this.element.innerHTML = `
      <p><strong>Current:</strong> ${CHARACTER_LABELS[currentCharacter]}</p>
      <p><strong>Unlocked:</strong> ${unlockedLabels}</p>
      <p><strong>Monoliths:</strong> ${unlockedMonoliths.length} / ${this.totalMonoliths}</p>
    `;
  }
}
