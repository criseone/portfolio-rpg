import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { Controller } from '../player/Controller';
import { Monolith, MonolithConfig, CATEGORY_COLOR } from '../world/Monolith';
import { Water } from '../world/Water';
import { createLowPolyTree, createLowPolyGrass } from '../world/Vegetation';
import { createBench, createWayfindingTotem, createStreetlight } from '../world/Props';
import { createPollenParticles, createActivationEffect } from '../vfx/Particles';
import { gateAllows } from '../logic/gate';
import { state, unlockMonolith, switchCharacter, CharId } from '../state';
import { DesignCharacterModel } from '../models/DesignCharacterModel';
import { ArtCharacterModel } from '../models/ArtCharacterModel';
import { CollabCharacterModel } from '../models/CollabCharacterModel';
import { COLORS, LIGHTING, TERRAIN, CAMERA, MATERIAL_PROPERTIES } from '../style/znastyle';
import { PerlinNoise } from '../utils/PerlinNoise';
import { LayoutService } from '../world/LayoutService';

type OverworldHooks = {
  onGateBlocked: (msg: string) => void;
  onProgressChanged: () => void;
  onStartBattle: (enemy: CharId | 'monolith') => void;
  onMonolithBattleComplete: (monolithId: string, result: 'win' | 'lose') => void;
};

export class Overworld {
  public scene: THREE.Scene;
  public isReady = false;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private uiRoot: HTMLElement;

  private time = 0;
  private controller = new Controller();
  private monoliths: Monolith[] = [];
  private roamers: CharacterModel[] = [];
  private water: Water;
  private grassClusters: THREE.Mesh[] = [];
  private pollenParticles: THREE.Points;
  private activeActivationEffects: { effect: THREE.Group; startTime: number; monolithId: string }[] = [];
  private layoutService: LayoutService;

  private pointerLockControls: PointerLockControls;
  private proximityRadius = 2.2;
  private hintElement: HTMLDivElement;
  private hintSuppressed = false;
  private previouslyNearestInteractable: THREE.Object3D | null = null;

  private hooks: OverworldHooks;

  constructor(
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    uiRoot: HTMLElement,
    hooks: OverworldHooks
  ) {
    this.scene = new THREE.Scene();
    this.camera = camera;
    this.renderer = renderer;
    this.uiRoot = uiRoot;
    this.hooks = hooks;
    this.layoutService = new LayoutService();

    this.init();
  }

  private async init() {
    await this.layoutService.loadLayout();

    this.hintElement = document.createElement('div');
    this.hintElement.className = 'hint';
    this.uiRoot.appendChild(this.hintElement);

    this.buildWorld();
    this.buildScenery();
    this.spawnMonoliths();
    this.spawnRoamers();
    this.spawnTrees();
    this.spawnGrass();
    this.spawnProps();
    this.spawnPollen();
    this.controller.attachToCamera(this.camera);

    this.pointerLockControls = new PointerLockControls(this.camera, this.renderer.domElement);
    this.pointerLockControls.minPolarAngle = Math.PI / 4; // Limit looking up
    this.pointerLockControls.maxPolarAngle = Math.PI * 3 / 4; // Limit looking down
    this.renderer.domElement.addEventListener('click', () => {
      this.pointerLockControls.lock();
    });

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Tab') {
        e.preventDefault();
        // Quick cycle between unlocked characters
        const list = state.unlockedCharacters;
        const idx = list.indexOf(state.currentCharacter as CharId);
        const next = list[(idx + 1) % list.length];
        switchCharacter(next);
      }
      if (e.code === 'KeyE') {
        this.tryInteract();
      }
    });

    this.isReady = true;
  }

  private buildWorld() {
    this.scene.background = new THREE.Color(COLORS.SkyboxHazeStart);

    // Key light: sun at 35° elevation, azimuth 130°; warm #FFD9B0.
    const sunLight = new THREE.DirectionalLight(new THREE.Color(COLORS.SunWarm), 1.0);
    const sunElevationRad = THREE.MathUtils.degToRad(LIGHTING.SunElevation);
    const sunAzimuthRad = THREE.MathUtils.degToRad(LIGHTING.SunAzimuth);
    sunLight.position.setFromSphericalCoords(100, sunElevationRad, sunAzimuthRad); // Arbitrary distance 100

    // Shadows: crisp, 1–2% softness.
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.camera.left = -50;
    sunLight.shadow.camera.right = 50;
    sunLight.shadow.camera.top = 50;
    sunLight.shadow.camera.bottom = -50;
    sunLight.shadow.bias = -0.0001; // Helps with shadow acne
    sunLight.shadow.radius = LIGHTING.ShadowSoftness * 100; // Convert percentage to radius

    this.scene.add(sunLight);

    // Fill: skybox haze #B9E4D7 → #F2FFF8. (Using AmbientLight for general fill)
    const ambientLight = new THREE.AmbientLight(new THREE.Color(COLORS.SkyboxHazeStart), 0.5); // Adjust intensity as needed
    this.scene.add(ambientLight);

    // Enable shadows for the renderer
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows

    const perlin = new PerlinNoise();
    const terrainSize = TERRAIN.IslandSize;
    const segments = 200; // More segments for smoother terrain
    const terrainGeometry = new THREE.PlaneGeometry(terrainSize, terrainSize, segments, segments);

    const position = terrainGeometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const y = position.getY(i);

      const noiseVal = perlin.noise2D(
        x * TERRAIN.PerlinFrequency,
        y * TERRAIN.PerlinFrequency
      );
      // Scale noise to amplitude range
      const z = noiseVal * (TERRAIN.PerlinAmplitude.Max - TERRAIN.PerlinAmplitude.Min) + TERRAIN.PerlinAmplitude.Min;
      position.setZ(i, z); // Set Z for height, as the plane is rotated later
    }
    terrainGeometry.computeVertexNormals(); // Recalculate normals for lighting

    const groundMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(COLORS.DeepGreen), // Using DeepGreen for terrain base
      metalness: 0.05,
      roughness: MATERIAL_PROPERTIES.Roughness,
    });

    const ground = new THREE.Mesh(terrainGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    ground.receiveShadow = true;
    ground.castShadow = true; // Terrain can also cast shadows
    this.scene.add(ground);

    // Water plane
    this.water = new Water();
    this.scene.add(this.water);

    // Skydome
    const skyGeo = new THREE.SphereGeometry(180, 32, 16);
    const skyMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(COLORS.SkyboxHazeStart), side: THREE.BackSide });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(sky);
  }

  private buildScenery() {
    const pillarGeo = new THREE.CylinderGeometry(0.5, 0.5, 10, 16);
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x1a2530,
      metalness: 0.2,
      roughness: 0.8,
    });

    for (let i = 0; i < 30; i++) {
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      const x = (Math.random() - 0.5) * 150;
      const z = (Math.random() - 0.5) * 150;
      pillar.position.set(x, 5, z);
      this.scene.add(pillar);
    }
  }

  private spawnMonoliths() {
    const monolithLayouts = this.layoutService.getObjectLayouts('monoliths');

    // Import the monoliths config directly
    import('../config/monoliths.json').then(({ default: data }) => {
      for (const layout of monolithLayouts) {
        const cfg = (data as MonolithConfig[]).find(c => c.id === layout.id);
        if (cfg) {
          cfg.position = [layout.position.x, layout.position.y, layout.position.z];
          const m = new Monolith(cfg);
          m.group.userData.isMonolith = true;
          this.monoliths.push(m);
          this.scene.add(m.group);
        }
      }
    });
  }

  private spawnRoamers() {
    const otherChars: CharId[] = (['design', 'art', 'collab'] as CharId[])
      .filter(c => c !== state.currentCharacter);

    otherChars.forEach((cid, i) => {
      const model = this.getModelForChar(cid);
      const x = -6 + i * 12;
      const z = -8 - i * 6;
      model.group.position.set(x, 0, z);
      model.group.userData.roamerChar = cid;
      model.group.userData.originalX = x;
      model.group.userData.originalZ = z;
      this.scene.add(model.group);
      this.roamers.push(model); // Push the model, not the group
    });
  }

  private spawnTrees() {
    const treeLayouts = this.layoutService.getObjectLayouts('trees');
    const treeTypes = ['cone', 'capsule', 'stackedDisks'] as const;

    treeLayouts.forEach(layout => {
      const type = treeTypes[Math.floor(Math.random() * treeTypes.length)];
      const tree = createLowPolyTree(type);
      tree.position.copy(layout.position);
      this.scene.add(tree);
    });
  }

  private spawnGrass() {
    const numGrassClusters = 500; // Arbitrary number of grass clusters
    const terrainHalfSize = TERRAIN.IslandSize / 2;

    for (let i = 0; i < numGrassClusters; i++) {
      const grass = createLowPolyGrass();

      let x, z;
      do {
        x = (Math.random() * terrainHalfSize * 2) - terrainHalfSize;
        z = (Math.random() * terrainHalfSize * 2) - terrainHalfSize;
      } while (Math.abs(x) < 10 && Math.abs(z) < 10); // Avoid center 20x20 area

      grass.position.set(x, 0, z);
      this.scene.add(grass);
      // Store the grass meshes to update their uniforms
      grass.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          this.grassClusters.push(child);
        }
      });
    }
  }

  private spawnProps() {
    const benchLayouts = this.layoutService.getObjectLayouts('benches');
    benchLayouts.forEach(layout => {
      const bench = createBench();
      bench.position.copy(layout.position);
      bench.rotation.y = Math.random() * Math.PI * 2;
      this.scene.add(bench);
    });

    const totemLayouts = this.layoutService.getObjectLayouts('totems');
    totemLayouts.forEach(layout => {
      const totem = createWayfindingTotem();
      totem.position.copy(layout.position);
      totem.rotation.y = Math.random() * Math.PI * 2;
      this.scene.add(totem);
    });

    const streetlightLayouts = this.layoutService.getObjectLayouts('streetlights');
    streetlightLayouts.forEach(layout => {
      const streetlight = createStreetlight();
      streetlight.position.copy(layout.position);
      streetlight.rotation.y = Math.random() * Math.PI * 2;
      this.scene.add(streetlight);
    });
  }

  private spawnPollen() {
    this.pollenParticles = createPollenParticles(500, TERRAIN.IslandSize);
    this.scene.add(this.pollenParticles);
  }

  private getModelForChar(charId: CharId) {
    switch (charId) {
      case 'design':
        return new DesignCharacterModel();
      case 'art':
        return new ArtCharacterModel();
      case 'collab':
        return new CollabCharacterModel();
    }
  }

  private getNearestInteractable(): THREE.Object3D | null {
    let nearest: THREE.Object3D | null = null;
    let nearestDist = Infinity;

    const playerPos = this.controller.obj.position;

    for (const m of this.monoliths) {
      const d = m.group.position.distanceTo(playerPos);
      if (d < this.proximityRadius && d < nearestDist) {
        nearest = m.group;
        nearestDist = d;
      }
    }
    this.roamers.forEach(roamer => {
      const d = roamer.group.position.distanceTo(playerPos);
      if (d < this.proximityRadius && d < nearestDist) {
        nearest = roamer.group;
        nearestDist = d;
      }
    });

    return nearest;
  }

  private tryInteract() {
    const nearest = this.getNearestInteractable();
    if (!nearest) return;

    if (nearest.userData.roamerChar) {
      const charId = nearest.userData.roamerChar as CharId;
      this.hooks.onStartBattle(charId);
      return;
    }

    const monolith = this.monoliths.find(m => m.group === nearest)!;
    const party = Array.from(new Set([...(state.unlockedCharacters || [])]));
    if (!party.length || !gateAllows(monolith.gate, party)) {
      this.showToastAndSuppressHint('A different skill is required to interface with this monolith.');
      return;
    }
    
    if (monolith.battlePatternId) {
      this.hooks.onStartBattle('monolith');
      this.hooks.onMonolithBattleComplete(monolith.id, 'win'); // Placeholder for now, actual result from battle
      return;
    }

    import('../state').then(({ unlockMonolith }) => {
      unlockMonolith(monolith.id);
      this.hooks.onProgressChanged();

      // Trigger activation effect
      const accentColor = new THREE.Color(CATEGORY_COLOR[monolith.category]);
      const effect = createActivationEffect(accentColor);
      effect.position.copy(monolith.group.position);
      effect.position.y = 0.05; // Slightly above ground
      this.scene.add(effect);
      this.activeActivationEffects.push({ effect, startTime: this.time, monolithId: monolith.id });
    });
    this.showToastAndSuppressHint(`Unlocked project: ${monolith.id}`);
  }

  public removeRoamer(charId: CharId) {
    const roamer = this.roamers.find(r => r.group.userData.roamerChar === charId);
    if (roamer) {
      roamer.group.parent?.remove(roamer.group);
      this.roamers = this.roamers.filter(r => r !== roamer);
    }
  }

  private showToastAndSuppressHint(message: string) {
    this.hooks.onGateBlocked(message);
    this.hintSuppressed = true;
    setTimeout(() => {
      this.hintSuppressed = false;
    }, 2000);
  }

  private updateHint() {
    if (this.hintSuppressed) {
      this.hintElement.textContent = '';
      return;
    }

    if (!this.pointerLockControls.isLocked) {
      this.hintElement.textContent = 'Click to look around';
      return;
    }

    const nearest = this.getNearestInteractable();

    // Toggle hologram visibility
    if (nearest !== this.previouslyNearestInteractable) {
      // Hide previous hologram
      if (this.previouslyNearestInteractable) {
        if (this.previouslyNearestInteractable.userData.isMonolith) {
          const monolith = this.monoliths.find(m => m.group === this.previouslyNearestInteractable);
          monolith?.toggleHologram(false);
        } else if (this.previouslyNearestInteractable.userData.roamerChar) {
          const roamer = this.roamers.find(r => r.group === this.previouslyNearestInteractable);
          roamer?.toggleHologram(false);
        }
      }

      // Show new hologram
      if (nearest) {
        if (nearest.userData.isMonolith) {
          const monolith = this.monoliths.find(m => m.group === nearest);
          monolith?.toggleHologram(true);
        } else if (nearest.userData.roamerChar) {
          const roamer = this.roamers.find(r => r.group === nearest);
          roamer?.toggleHologram(true);
        }
      }
      this.previouslyNearestInteractable = nearest;
    }

    if (nearest) {
      this.hintElement.textContent = nearest.userData.roamerChar ? 'Press E to challenge' : 'Press E to interact';
    } else {
      this.hintElement.textContent = 'WASD to move, Space to jump';
    }
  }

  public update(dt: number) {
    if (!this.isReady) return;

    this.time += dt;
    this.controller.update(dt, this.camera);

    // Calculate desired camera position for third-person view
    const playerPosition = this.controller.obj.position;
    const cameraDirection = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDirection); // Get the direction the camera is looking
    cameraDirection.y = 0; // Keep it horizontal
    cameraDirection.normalize();

    const desiredCameraPosition = playerPosition.clone()
        .addScaledVector(cameraDirection, -CAMERA.Distance) // Move backward by CAMERA.Distance
        .add(new THREE.Vector3(0, CAMERA.Height, 0)); // Add the height

    this.camera.position.copy(desiredCameraPosition);

    this.updateHint();

    for (const m of this.monoliths) m.update(dt, this.time);
    this.water.update(dt);
    this.grassClusters.forEach(grass => {
      if (grass.material instanceof THREE.ShaderMaterial) {
        grass.material.uniforms.time.value = this.time;
      }
    });

    if (this.pollenParticles) {
      (this.pollenParticles.material as THREE.ShaderMaterial).uniforms.time.value = this.time;
    }

    // Update activation effects
    this.activeActivationEffects = this.activeActivationEffects.filter(effectData => {
      const elapsed = this.time - effectData.startTime;
      const progress = elapsed / VFX.ActivationDuration;

      if (progress >= 1.0) {
        this.scene.remove(effectData.effect);
        return false; // Remove effect
      }

      // Animate scale and opacity
      effectData.effect.scale.setScalar(1.0 + progress * 2.0); // Grow
      effectData.effect.children.forEach(line => {
        (line as THREE.Line).material.opacity = 1.0 - progress; // Fade out
      });

      return true; // Keep effect
    });

    this.roamers.forEach((roamer, i) => {
      const speed = 0.5;
      const amplitude = 5;
      roamer.group.position.x = roamer.group.userData.originalX + Math.sin(this.time * speed + i * 2) * amplitude;
      roamer.group.position.z = roamer.group.userData.originalZ + Math.cos(this.time * speed + i * 2) * amplitude;
      roamer.update(dt, this.time);
    });
  }

  public setEnabled(enabled: boolean) {
    this.controller.setEnabled(enabled);
    if (enabled) {
      this.pointerLockControls.lock();
    } else {
      this.pointerLockControls.unlock();
    }
  }
}
