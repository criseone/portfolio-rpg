export type CharId = 'design' | 'art' | 'collab';

export interface GameState {
  currentCharacter: CharId | null;
  unlockedCharacters: CharId[];
  unlockedMonoliths: string[];
}

const DEFAULT_STATE: GameState = {
  currentCharacter: null,
  unlockedCharacters: [],
  unlockedMonoliths: [],
};

export const state: GameState = structuredClone(DEFAULT_STATE);

const KEY = 'rpg-portfolio-state-v1';

type Listener = (state: GameState) => void;
const listeners: Listener[] = [];

export function subscribe(listener: Listener) {
  listeners.push(listener);
  return function unsubscribe() {
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
}

function notify() {
  listeners.forEach(listener => listener(state));
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as GameState;
      Object.assign(state, saved);
      notify();
    }
  } catch {}
}

export function saveState() {
  localStorage.setItem(KEY, JSON.stringify(state));
  notify();
}

export function setStarter(charId: CharId) {
  state.currentCharacter = charId;
  state.unlockedCharacters = [charId];
  saveState();
}

export function switchCharacter(charId: CharId) {
  if (!state.unlockedCharacters.includes(charId)) return false;
  state.currentCharacter = charId;
  saveState();
  return true;
}

export function unlockCharacter(charId: CharId) {
  if (!state.unlockedCharacters.includes(charId)) {
    state.unlockedCharacters.push(charId);
    saveState();
  }
}

export function unlockMonolith(id: string) {
  if (!state.unlockedMonoliths.includes(id)) {
    state.unlockedMonoliths.push(id);
    saveState();
  }
}