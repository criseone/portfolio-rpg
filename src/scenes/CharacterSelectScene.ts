import * as THREE from 'three';
import { CharId } from '../state';
import { DesignCharacterModel } from '../models/DesignCharacterModel';
import { ArtCharacterModel } from '../models/ArtCharacterModel';
import { CollabCharacterModel } from '../models/CollabCharacterModel';

export class CharacterSelectScene {
  public scene: THREE.Scene;
  private characters: THREE.Group[] = [];
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private intersected: THREE.Object3D | null = null;
  private boundHandleMouseMove = this.handleMouseMove.bind(this);
  private boundHandleMouseClick = this.handleMouseClick.bind(this);

  constructor(
    private camera: THREE.PerspectiveCamera,
    private onCharacterSelected: (charId: CharId) => void
  ) {
    this.scene = new THREE.Scene();
    this.camera.position.set(0, 1.6, 8);

    this.setupScene();

    window.addEventListener('mousemove', this.boundHandleMouseMove);
    window.addEventListener('click', this.boundHandleMouseClick);
  }

  private setupScene() {
    this.scene.background = new THREE.Color(0x05070a);
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    const dir = new THREE.DirectionalLight(0xffffff, 0.5);
    dir.position.set(0, 10, 5);
    this.scene.add(ambient, dir);

    const designChar = new DesignCharacterModel();
    designChar.group.position.x = -4;
    designChar.group.userData.charId = 'design' as CharId;

    const artChar = new ArtCharacterModel();
    artChar.group.userData.charId = 'art' as CharId;

    const collabChar = new CollabCharacterModel();
    collabChar.group.position.x = 4;
    collabChar.group.userData.charId = 'collab' as CharId;

    this.characters.push(designChar.group, artChar.group, collabChar.group);
    this.scene.add(designChar.group, artChar.group, collabChar.group);
  }

  private handleMouseMove(event: MouseEvent) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
  }

  private handleMouseClick() {
    if (this.intersected) {
      this.onCharacterSelected(this.intersected.userData.charId);
    }
  }

  public update(dt: number) {
    this.characters.forEach(char => {
      char.rotation.y += dt * 0.3;
    });

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.characters, true);

    if (intersects.length > 0) {
      const intersectedGroup = intersects[0].object.parent;
      if (this.intersected !== intersectedGroup) {
        if (this.intersected) {
          this.intersected.scale.set(1, 1, 1);
        }
        this.intersected = intersectedGroup;
        if (this.intersected) {
          this.intersected.scale.set(1.2, 1.2, 1.2);
        }
      }
    } else {
      if (this.intersected) {
        this.intersected.scale.set(1, 1, 1);
      }
      this.intersected = null;
    }
  }

  public dispose() {
    window.removeEventListener('mousemove', this.boundHandleMouseMove);
    window.removeEventListener('click', this.boundHandleMouseClick);
  }
}