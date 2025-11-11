import * as THREE from 'three';
import { CharacterModel } from './CharacterModel';
import { buildFromParts, CharacterSpec } from './VoxelCharacterBuilder';
import designSpec from '../../config/characters/design.json';

export class DesignCharacterModel extends CharacterModel {
  constructor() {
    super();

    const spec = designSpec as CharacterSpec;
    const voxelGroup = buildFromParts(spec.parts, spec.v);
    this.group.add(voxelGroup);
  }
}
