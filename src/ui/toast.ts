let timeout: number | null = null;

export function mountToast(root: HTMLElement, text: string, ms = 1800) {
  let el = root.querySelector('.toast') as HTMLDivElement | null;
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast glass-ui';
    root.appendChild(el);
  }
  el.textContent = text;
  el.style.opacity = '0.95';
  if (timeout) window.clearTimeout(timeout);
  timeout = window.setTimeout(() => {
    el && (el.style.opacity = '0');
  }, ms);
}
