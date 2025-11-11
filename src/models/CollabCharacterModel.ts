import * as THREE from 'three';
import { CharacterModel } from './CharacterModel';
import { buildFromParts, CharacterSpec } from './VoxelCharacterBuilder';
import collabSpec from '../../config/characters/collab.json';

export class CollabCharacterModel extends CharacterModel {
  constructor() {
    super();

    const spec = collabSpec as CharacterSpec;
    const voxelGroup = buildFromParts(spec.parts, spec.v);
    this.group.add(voxelGroup);
  }
}
