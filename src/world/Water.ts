// src/world/Water.ts
import * as THREE from 'three';
import { WATER, COLORS, TERRAIN } from '../style/znastyle';

export class Water extends THREE.Mesh {
    private time = 0;

    constructor() {
        const geometry = new THREE.PlaneGeometry(TERRAIN.IslandSize, TERRAIN.IslandSize, 100, 100); // Using TERRAIN.IslandSize
        geometry.rotateX(-Math.PI / 2);

        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                amplitude: { value: WATER.RippleAmplitude },
                speed: { value: WATER.RippleSpeed },
                waterColor: { value: new THREE.Color(COLORS.Water) },
                fresnelBias: { value: 0.1 },
                fresnelPower: { value: 2.0 },
                fresnelScale: { value: 1.0 },
            },
            vertexShader: `
                uniform float time;
                uniform float amplitude;
                uniform float speed;
                varying vec3 vWorldPosition;

                void main() {
                    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
                    vec3 newPosition = position;
                    newPosition.z += sin(newPosition.x * 0.5 + time * speed) * amplitude;
                    newPosition.z += cos(newPosition.y * 0.5 + time * speed) * amplitude;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 waterColor;
                uniform float fresnelBias;
                uniform float fresnelPower;
                uniform float fresnelScale;
                varying vec3 vWorldPosition;

                void main() {
                    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
                    float fresnel = fresnelBias + fresnelScale * pow(1.0 - dot(viewDirection, vec3(0.0, 1.0, 0.0)), fresnelPower);
                    gl_FragColor = vec4(waterColor * fresnel, 1.0);
                }
            `,
            transparent: true,
        });

        super(geometry, material);
        this.position.y = -0.5; // Position slightly below ground level
        this.receiveShadow = true;
    }

    update(dt: number) {
        this.time += dt;
        (this.material as THREE.ShaderMaterial).uniforms.time.value = this.time;
    }
}
