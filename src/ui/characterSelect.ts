import type { CharId } from '../state';

export function mountCharacterSelect(root: HTMLElement, onPick: (c: CharId) => void) {
  root.innerHTML = '';
  const panel = document.createElement('div');
  panel.className = 'panel glass-ui';
  panel.innerHTML = `
    <h2>Choose your starter</h2>
    <div class="char-grid">
      <button class="btn glass-ui" data-id="design">
        <strong>Design</strong><div class="tag">UI/UX, brand, structure</div>
      </button>
      <button class="btn glass-ui" data-id="art">
        <strong>Art</strong><div class="tag">light, beams, graffiti</div>
      </button>
      <button class="btn glass-ui" data-id="collab">
        <strong>Collab</strong><div class="tag">boards, post-its, strategy</div>
      </button>
    </div>
    <div class="hint">Tip: you can unlock the others by finding them in the overworld.</div>
  `;
  panel.querySelectorAll<HTMLButtonElement>('button[data-id]').forEach(btn => {
    btn.addEventListener('click', () => onPick(btn.dataset.id as CharId));
  });
  root.appendChild(panel);
}
