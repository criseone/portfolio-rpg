import * as THREE from 'three';
import { Overworld } from './overworld/Overworld';
import { Battle } from './battle/Battle';
import { CharacterSelectScene } from './scenes/CharacterSelectScene';
import { state, loadState, saveState, setStarter, unlockCharacter, switchCharacter, CharId, unlockMonolith } from './state';
import { mountToast } from './ui/toast';
import { StatusDisplay } from './ui/StatusDisplay';
import { ProjectPanel } from './ui/ProjectPanel';
import { createBattleStagingCircle } from './vfx/Particles';
import { COLORS } from './style/znastyle';
import { CATEGORY_COLOR } from './world/Monolith';

const appEl = document.getElementById('app')!;
const uiRoot = document.getElementById('ui-root')!;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
appEl.appendChild(renderer.domElement);

const clock = new THREE.Clock();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);

let overworld: Overworld | null = null;
let battle: Battle | null = null;
let characterSelectScene: CharacterSelectScene | null = null;
let projectPanel: ProjectPanel | null = null;
let gameMode: 'overworld' | 'battle' | 'character-select' = 'overworld';
let battleStagingCircle: THREE.Mesh | null = null;

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', resize);

function startOverworld() {
  overworld = new Overworld(camera, renderer, uiRoot, {
    onGateBlocked: (msg) => mountToast(uiRoot, msg),
    onProgressChanged: () => saveState(),
    onStartBattle: (enemy) => {
      gameMode = 'battle';
      overworld?.setEnabled(false);

      // Create battle staging circle
      const playerPosition = overworld?.controller.obj.position.clone() || new THREE.Vector3();
      const playerArchetype = state.currentCharacter || 'design'; // Default to design if not set
      const circleColor = new THREE.Color(CATEGORY_COLOR[playerArchetype]);
      battleStagingCircle = createBattleStagingCircle(circleColor);
      battleStagingCircle.position.copy(playerPosition);
      overworld?.scene.add(battleStagingCircle);

      battle?.start({
        player: state.currentCharacter!,
        enemy,
        onComplete: (result) => {
          gameMode = 'overworld';
          overworld?.setEnabled(true);
          if (battleStagingCircle) {
            overworld?.scene.remove(battleStagingCircle);
            battleStagingCircle = null;
          }
          if (result === 'win') {
            if (enemy !== 'monolith') { // It's a character battle
              unlockCharacter(enemy as CharId);
              switchCharacter(enemy as CharId);
              overworld?.removeRoamer(enemy as CharId);
            }
            saveState();
          }
        },
      });
    },
    onMonolithBattleComplete: (monolithId, result) => {
      if (result === 'win') {
        unlockMonolith(monolithId);
        saveState();
        projectPanel?.show(monolithId);
      }
    }
  });

  gameMode = 'overworld';
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 1 / 30);

  if (gameMode === 'character-select' && characterSelectScene) {
    characterSelectScene.update(dt);
    renderer.render(characterSelectScene.scene, camera);
  } else if (gameMode === 'overworld' && overworld) {
    overworld.update(dt);
    renderer.render(overworld.scene, camera);
  } else if (gameMode === 'battle' && battle) {
    battle.update(dt);
    renderer.render(battle.scene, camera);
  }
}

function boot() {
  // For development, always start with a fresh state
  localStorage.clear(); 
  
  loadState();
  new StatusDisplay(uiRoot);
  battle = new Battle(uiRoot, camera);
  projectPanel = new ProjectPanel(uiRoot);
  characterSelectScene = new CharacterSelectScene(camera, (charId) => {
    setStarter(charId);
    startOverworld();
    gameMode = 'overworld';
    characterSelectScene?.dispose();
    characterSelectScene = null;
  });

  if (!state.currentCharacter) {
    gameMode = 'character-select';
  } else {
    startOverworld();
  }

  animate();
}

boot();
