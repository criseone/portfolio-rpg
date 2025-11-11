import * as THREE from 'three';
import type { GateRule } from '../logic/gate';
import { COLORS, MATERIAL_PROPERTIES, MONOLITH } from '../style/znastyle';

export type MonolithConfig = {
  id: string;
  title: string;
  category: 'design' | 'art' | 'collab';
  position: [number, number, number];
  gate?: GateRule;
  battlePatternId?: 'light-triangle';
  project?: { summary?: string; url?: string };
};

export const CATEGORY_COLOR: Record<MonolithConfig['category'], string> = {
  design: COLORS.DesignNeonMint,
  art:    COLORS.ArtMagenta,
  collab: COLORS.CollabSunYellow
};

export class Monolith {
  public group = new THREE.Group();
  public id: string;
  public category: MonolithConfig['category'];
  public gate?: GateRule;
  public hologramRing: THREE.Mesh;

  constructor(cfg: MonolithConfig) {
    this.id = cfg.id;
    this.category = cfg.category;
    this.gate = cfg.gate;

    const accentColor = new THREE.Color(CATEGORY_COLOR[cfg.category]);

    // Common material for the concrete parts
    const concreteMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(COLORS.Concrete),
      metalness: 0.0,
      roughness: MATERIAL_PROPERTIES.Roughness,
    });

    // Plinth (common rule)
    const plinthHeight = 0.5;
    const plinthGeometry = new THREE.BoxGeometry(MONOLITH.Footprint.Max * 0.8, plinthHeight, MONOLITH.Footprint.Max * 0.8);
    const plinth = new THREE.Mesh(plinthGeometry, concreteMaterial);
    plinth.position.y = plinthHeight / 2;
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    this.group.add(plinth);

    switch (cfg.category) {
      case 'design':
        this.createDesignMonolith(accentColor, concreteMaterial);
        break;
      case 'art':
        this.createArtMonolith(accentColor, concreteMaterial);
        break;
      case 'collab':
        this.createCollabMonolith(accentColor, concreteMaterial);
        break;
    }

    // Hologram Ring (common to all monoliths)
    const ringGeometry = new THREE.RingGeometry(MONOLITH.Footprint.Max * 0.5, MONOLITH.Footprint.Max * 0.6, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: accentColor,
      transparent: true,
      opacity: 0.0, // Initially invisible
      side: THREE.DoubleSide,
    });
    this.hologramRing = new THREE.Mesh(ringGeometry, ringMaterial);
    this.hologramRing.rotation.x = -Math.PI / 2;
    this.hologramRing.position.y = plinthHeight + 0.02; // Slightly above the plinth
    this.group.add(this.hologramRing);

    this.group.position.set(...cfg.position);
    this.group.position.y += plinthHeight; // Adjust group position to sit on the ground
  }

  public toggleHologram(visible: boolean) {
    (this.hologramRing.material as THREE.MeshBasicMaterial).opacity = visible ? 0.5 : 0.0;
  }

  private createCollabMonolith(accentColor: THREE.Color, concreteMaterial: THREE.MeshStandardMaterial) {
    const plinthHeight = 0.5;
    const numSlabs = 8;
    const slabHeight = (MONOLITH.Height.Max - plinthHeight) / numSlabs;
    const slabRadius = MONOLITH.Footprint.Min / 2;
    const emissiveMaterial = new THREE.MeshStandardMaterial({
      color: accentColor,
      emissive: accentColor,
      emissiveIntensity: MATERIAL_PROPERTIES.EmissiveIntensity.Min,
      roughness: MATERIAL_PROPERTIES.Roughness,
    });

    for (let i = 0; i < numSlabs; i++) {
      const slabGeometry = new THREE.CylinderGeometry(slabRadius, slabRadius, slabHeight, 6); // Hexagonal slab
      const slab = new THREE.Mesh(slabGeometry, concreteMaterial);

      // Interlocking slabs (like sticky-note stacks)
      slab.position.x = (Math.random() - 0.5) * (slabRadius * 0.2);
      slab.position.z = (Math.random() - 0.5) * (slabRadius * 0.2);
      slab.rotation.y = (Math.random() - 0.5) * 0.2;

      slab.position.y = plinthHeight + (i * slabHeight) + (slabHeight / 2);
      slab.castShadow = true;
      slab.receiveShadow = true;
      this.group.add(slab);

      // Emissive yellow/teal rings pulsing in 3s cycles
      if (i % 2 === 0) { // Add a ring every other slab
        const ringGeometry = new THREE.RingGeometry(slabRadius * 0.8, slabRadius * 0.9, 6);
        const ring = new THREE.Mesh(ringGeometry, emissiveMaterial);
        ring.position.copy(slab.position);
        ring.position.y += slabHeight / 2 + 0.01; // Slightly above the slab
        ring.rotation.x = -Math.PI / 2;
        this.group.add(ring);
      }
    }
  }

  private createArtMonolith(accentColor: THREE.Color, concreteMaterial: THREE.MeshStandardMaterial) {
    const numShards = 7;
    const plinthHeight = 0.5;

    const emissiveMaterial = new THREE.MeshStandardMaterial({
      color: accentColor,
      emissive: accentColor,
      emissiveIntensity: MATERIAL_PROPERTIES.EmissiveIntensity.Min,
      roughness: MATERIAL_PROPERTIES.Roughness,
    });

    for (let i = 0; i < numShards; i++) {
      const shardHeight = (Math.random() * (MONOLITH.Height.Max - plinthHeight)) + plinthHeight;
      const shardRadius = (Math.random() * (MONOLITH.Footprint.Max / 4)) + (MONOLITH.Footprint.Min / 4);
      const shardGeometry = new THREE.CylinderGeometry(shardRadius, shardRadius * 0.8, shardHeight, 3); // Triangular prism

      // Alternate between concrete and emissive shards for the "internal emissive seams" effect
      const shardMaterial = i % 2 === 0 ? concreteMaterial : emissiveMaterial;
      const shard = new THREE.Mesh(shardGeometry, shardMaterial);

      // Asymmetrical positioning
      const angle = (i / numShards) * Math.PI * 2;
      const radius = (Math.random() * (MONOLITH.Footprint.Max / 3));
      shard.position.x = Math.cos(angle) * radius;
      shard.position.z = Math.sin(angle) * radius;
      shard.position.y = plinthHeight + shardHeight / 2;

      shard.rotation.y = Math.random() * Math.PI * 2;
      shard.rotation.x = (Math.random() - 0.5) * 0.5;
      shard.rotation.z = (Math.random() - 0.5) * 0.5;

      shard.castShadow = true;
      shard.receiveShadow = true;
      this.group.add(shard);
    }
  }

  private createDesignMonolith(accentColor: THREE.Color, concreteMaterial: THREE.MeshStandardMaterial) {
    const plinthHeight = 0.5; // Should be consistent with constructor
    const numBlocks = 5;
    const blockHeight = (MONOLITH.Height.Max - plinthHeight) / numBlocks;
    const baseBlockWidth = MONOLITH.Footprint.Min;

    for (let i = 0; i < numBlocks; i++) {
      const blockWidth = baseBlockWidth - (i * 0.5); // Slightly smaller blocks higher up
      const blockGeometry = new THREE.BoxGeometry(blockWidth, blockHeight, blockWidth);
      const block = new THREE.Mesh(blockGeometry, concreteMaterial);

      // Offset and twist
      const offset = (i % 2 === 0 ? 1 : -1) * (blockWidth * 0.1);
      block.position.x = offset;
      block.position.z = offset;
      block.rotation.y = THREE.MathUtils.degToRad(MONOLITH.DesignTwist * i);

      block.position.y = plinthHeight + (i * blockHeight) + (blockHeight / 2);
      block.castShadow = true;
      block.receiveShadow = true;
      this.group.add(block);

      // Thin neon mint inlays (emissive strips)
      const inlayThickness = 0.05;
      const inlayLength = blockWidth - inlayThickness * 2;

      const inlayMaterial = new THREE.MeshStandardMaterial({
        color: accentColor,
        emissive: accentColor,
        emissiveIntensity: MATERIAL_PROPERTIES.EmissiveIntensity.Min,
        roughness: MATERIAL_PROPERTIES.Roughness,
      });

      // Top inlay
      const topInlay = new THREE.Mesh(new THREE.BoxGeometry(inlayLength, inlayThickness, inlayLength), inlayMaterial);
      topInlay.position.copy(block.position);
      topInlay.position.y += blockHeight / 2 - inlayThickness / 2;
      topInlay.rotation.copy(block.rotation);
      this.group.add(topInlay);

      // Side inlays (simplified for now, just a band)
      const sideInlay = new THREE.Mesh(new THREE.BoxGeometry(inlayLength, blockHeight * 0.8, inlayThickness), inlayMaterial);
      sideInlay.position.copy(block.position);
      sideInlay.position.z += blockWidth / 2 - inlayThickness / 2;
      sideInlay.rotation.copy(block.rotation);
      this.group.add(sideInlay);
    }
  }

  update(dt: number, t: number) {
    this.group.rotation.y += dt * 0.05; // Slower rotation for the entire monolith

    if (this.category === 'collab') {
      const pulseCycle = MONOLITH.CollabPulseCycle;
      const pulse = (Math.sin((t / pulseCycle) * Math.PI * 2) * 0.5 + 0.5); // 0 to 1 over pulseCycle seconds
      const intensity = MATERIAL_PROPERTIES.EmissiveIntensity.Min + pulse * (MATERIAL_PROPERTIES.EmissiveIntensity.Max - MATERIAL_PROPERTIES.EmissiveIntensity.Min);

      this.group.children.forEach(child => {
        if (child instanceof THREE.Mesh && child.geometry instanceof THREE.RingGeometry) {
          (child.material as THREE.MeshBasicMaterial).emissiveIntensity = intensity;
        }
      });
    }
  }
}