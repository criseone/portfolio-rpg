// src/models/VoxelCharacterBuilder.ts
import * as THREE from 'three';

export const VOX = {
  size: 0.04, // 4cm
  cubeGeo: new THREE.BoxGeometry(1, 1, 1)
};

export type Voxel = { x: number; y: number; z: number; color: string; emissive?: string; };
export type Part = { name: string; voxels: Voxel[]; anchor?: string };
export type CharacterSpec = {
  name: 'art' | 'design' | 'collab';
  scale: number; // 1.0
  parts: Part[];
  v: number; // voxel size
  anchors: Record<string, { x: number; y: number; z: number; }>;
  vfx?: Record<string, any>;
};

export function buildFromParts(parts: Part[], vScale = VOX.size): THREE.Group {
  // group voxels by color -> one InstancedMesh per color
  const byColor = new Map<string, Voxel[]>(); // color -> voxel array
  parts.forEach(p => p.voxels.forEach(v => {
    const key = `${v.emissive ? 'em:' : ''}${v.color}`;
    if (!byColor.has(key)) byColor.set(key, []);
    byColor.get(key)!.push(v);
  }));

  const group = new THREE.Group();
  byColor.forEach((voxels, key) => {
    const emissive = key.startsWith('em:');
    const hex = emissive ? key.slice(3) : key;
    const mat = new THREE.MeshStandardMaterial({
      color: hex,
      roughness: 0.9,
      metalness: 0.0,
      emissive: emissive ? new THREE.Color(hex) : new THREE.Color('#000000'),
      emissiveIntensity: emissive ? 0.8 : 0.0
    });
    const mesh = new THREE.InstancedMesh(VOX.cubeGeo, mat, voxels.length);
    const m = new THREE.Matrix4();
    voxels.forEach((v, i) => {
      m.makeTranslation(v.x * vScale, v.y * vScale, v.z * vScale);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    group.add(mesh);
  });
  return group;
}

export function addBox(voxArr: Voxel[], color: string, x0: number, y0: number, z0: number, w: number, d: number, h: number, emissive = false) {
  for (let x = 0; x < w; x++)
    for (let y = 0; y < h; y++)
      for (let z = 0; z < d; z++)
        voxArr.push({ x: x0 + x, y: y0 + y, z: z0 + z, color, ...(emissive ? { emissive: color } : {}) });
}

export function baseBody(colorSkin = '#DBF2DE', colorCloth = '#2B2F33'): Voxel[] {
  const v: Voxel[] = [];
  // Pelvis
  addBox(v, colorCloth, -5, 10, -3, 10, 6, 4);
  // Torso core
  addBox(v, colorCloth, -6, 14, -3, 12, 7, 12);
  // Neck
  addBox(v, colorSkin, -2, 26, -2, 4, 4, 2);
  // Head cube
  addBox(v, colorSkin, -5, 30, -5, 10, 10, 10);
  // Arms
  addBox(v, colorCloth, -10, 18, -2, 4, 4, 8);  // L upper
  addBox(v, colorCloth, 6, 18, -2, 4, 4, 8);  // R upper
  addBox(v, colorCloth, -10, 26, -2, 4, 4, 8); // L lower
  addBox(v, colorCloth, 6, 26, -2, 4, 4, 8);  // R lower
  // Hands
  addBox(v, colorSkin, -10, 34, -2, 4, 3, 2);
  addBox(v, colorSkin, 6, 34, -2, 4, 3, 2);
  // Legs
  addBox(v, colorCloth, -5, 6, -2, 5, 4, 10); // L upper
  addBox(v, colorCloth, 0, 6, -2, 5, 4, 10); // R upper
  addBox(v, colorCloth, -4, 0, -2, 4, 4, 10); // L lower
  addBox(v, colorCloth, 1, 0, -2, 4, 4, 10); // R lower
  // Feet core
  addBox(v, colorCloth, -5, -3, -3, 5, 7, 3);
  addBox(v, colorCloth, 0, -3, -3, 5, 7, 3);
  return v;
}
