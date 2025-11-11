import { MonolithConfig } from '../world/Monolith';

export class ProjectPanel {
  private element: HTMLDivElement;
  private monoliths: MonolithConfig[] = [];

  constructor(private uiRoot: HTMLElement) {
    this.element = document.createElement('div');
    this.element.className = 'project-panel';
    this.element.style.display = 'none';
    this.uiRoot.appendChild(this.element);

    this.fetchMonoliths();

    this.element.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).classList.contains('close-btn')) {
        this.hide();
      }
    });
  }

  private async fetchMonoliths() {
    try {
      const res = await fetch('/src/config/monoliths.json');
      this.monoliths = await res.json();
    } catch (error) {
      console.error('Failed to fetch monoliths config:', error);
    }
  }

  public show(monolithId: string) {
    const monolith = this.monoliths.find(m => m.id === monolithId);
    if (!monolith || !monolith.project) return;

    this.element.innerHTML = `
      <div class="panel glass-ui">
        <button class="close-btn">X</button>
        <h2>${monolith.title}</h2>
        <p>${monolith.project.summary}</p>
        <a href="${monolith.project.url}" target="_blank" rel="noopener noreferrer">View Project</a>
      </div>
    `;
    this.element.style.display = 'flex';
  }

  public hide() {
    this.element.style.display = 'none';
  }
}
