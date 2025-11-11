import * as THREE from 'three';

export class Controller {
  public obj: THREE.Object3D = new THREE.Object3D();
  private vel = new THREE.Vector3();
  private dir = new THREE.Vector3();
  private keys: Record<string, boolean> = {};
  private speed = 6;
  private gravity = -20;
  private jumpStrength = 8;
  private onGround = false;
  private isEnabled = true;

  constructor() {
    window.addEventListener('keydown', e => (this.keys[e.code] = true));
    window.addEventListener('keyup',   e => (this.keys[e.code] = false));
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  attachToCamera(camera: THREE.Camera) {
    // Place the controller where the camera is (for simplicity)
    this.obj.position.copy((camera as THREE.PerspectiveCamera).position);
    this.obj.position.y = 0;
  }

  update(dt: number, camera: THREE.Camera) {
    if (!this.isEnabled) {
      // Still apply gravity when disabled
      this.vel.y += this.gravity * dt;
      if (this.obj.position.y <= 0) {
        this.obj.position.y = 0;
        this.vel.y = 0;
      }
      this.obj.position.addScaledVector(this.vel, dt);
      return;
    }

    // Apply gravity
    this.vel.y += this.gravity * dt;

    // Ground check
    if (this.obj.position.y <= 0) {
      this.obj.position.y = 0;
      this.vel.y = 0;
      this.onGround = true;
    }

    // Jumping
    if (this.keys['Space'] && this.onGround) {
      this.vel.y = this.jumpStrength;
      this.onGround = false;
    }
    
    this.dir.set(0, 0, 0);
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0; forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0,1,0));

    if (this.keys['KeyW']) this.dir.add(forward);
    if (this.keys['KeyS']) this.dir.addScaledVector(forward, -1);
    if (this.keys['KeyA']) this.dir.addScaledVector(right, -1);
    if (this.keys['KeyD']) this.dir.add(right);

    if (this.dir.lengthSq() > 0) this.dir.normalize();
    this.vel.x = this.dir.x * this.speed;
    this.vel.z = this.dir.z * this.speed;

    this.obj.position.addScaledVector(this.vel, dt);
  }
}