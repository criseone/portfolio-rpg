import * as THREE from 'three';
import { CharacterModel } from './CharacterModel';
import { buildFromParts, CharacterSpec } from './VoxelCharacterBuilder';
import artSpec from '../../config/characters/art.json';

export class ArtCharacterModel extends CharacterModel {
  constructor() {
    super();

    const spec = artSpec as CharacterSpec;
    const voxelGroup = buildFromParts(spec.parts, spec.v);
    this.group.add(voxelGroup);
  }
}
