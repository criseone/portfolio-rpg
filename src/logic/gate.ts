import type { CharId } from '../state';

export type GateRule = { all?: CharId[]; any?: CharId[] };

export function gateAllows(gate: GateRule | undefined, party: CharId[]) {
  if (!gate) return true;
  if (gate.all && !gate.all.every(req => party.includes(req))) return false;
  if (gate.any && !gate.any.some(req => party.includes(req))) return false;
  return true;
}