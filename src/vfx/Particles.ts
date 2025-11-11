// src/vfx/Particles.ts
import * as THREE from 'three';
import { COLORS, VFX, MATERIAL_PROPERTIES } from '../style/znastyle';

export function createPollenParticles(count: number, areaSize: number): THREE.Points {
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const randoms = new Float32Array(count);

    for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * areaSize;
        positions[i * 3 + 1] = Math.random() * 5; // Start at random height
        positions[i * 3 + 2] = (Math.random() - 0.5) * areaSize;
        randoms[i] = Math.random();
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));

    const particlesMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            pointColor: { value: new THREE.Color(COLORS.Hover) },
        },
        vertexShader: `
            uniform float time;
            attribute float aRandom;
            varying float vRandom;

            void main() {
                vRandom = aRandom;
                vec3 newPosition = position;
                newPosition.y = mod(position.y - time * 0.2 * (aRandom + 0.1), 5.0); // Fall down and loop
                newPosition.x += sin(time * 0.5 * (aRandom + 0.1)) * 0.2; // Gentle sway
                gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
                gl_PointSize = 3.0 * (1.0 - newPosition.y / 5.0); // Smaller as they fall
            }
        `,
        fragmentShader: `
            uniform vec3 pointColor;
            varying float vRandom;

            void main() {
                gl_FragColor = vec4(pointColor, 0.5 + vRandom * 0.5);
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    return particles;
}

export function createActivationEffect(color: THREE.Color): THREE.Group {
    const effectGroup = new THREE.Group();
    const numLines = 12;
    const lineLength = 2.0;
    const lineThickness = 0.05;

    const material = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 1.0,
    });

    for (let i = 0; i < numLines; i++) {
        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(lineLength, 0, 0),
        ]);
        const line = new THREE.Line(geometry, material);

        line.rotation.z = (i / numLines) * Math.PI * 2; // Radial distribution
        effectGroup.add(line);
    }

    return effectGroup;
}

export function createBattleStagingCircle(color: THREE.Color): THREE.Mesh {
    const radius = (VFX.BattleCircleDiameter.Min + VFX.BattleCircleDiameter.Max) / 2; // Average diameter
    const geometry = new THREE.RingGeometry(radius * 0.9, radius, 32);
    const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
    });
    const circle = new THREE.Mesh(geometry, material);
    circle.rotation.x = -Math.PI / 2;
    circle.position.y = 0.01; // Slightly above ground
    return circle;
}

export function createLightTrianglesVFX(color: THREE.Color, count: number = 20): THREE.Group {
    const vfxGroup = new THREE.Group();
    const triangleGeometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
        0.0,  0.5,  0.0,
       -0.5, -0.5,  0.0,
        0.5, -0.5,  0.0,
    ]);
    triangleGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

    const material = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: MATERIAL_PROPERTIES.EmissiveIntensity.Max,
        transparent: true,
        opacity: 1.0,
        side: THREE.DoubleSide,
    });

    for (let i = 0; i < count; i++) {
        const triangle = new THREE.Mesh(triangleGeometry, material);
        triangle.scale.setScalar(Math.random() * 0.2 + 0.1); // Random size
        triangle.rotation.z = Math.random() * Math.PI * 2; // Random rotation
        triangle.position.set(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        ); // Random initial position
        vfxGroup.add(triangle);
    }

    return vfxGroup;
}

export function createBeamSweepVFX(color: THREE.Color): THREE.Mesh {
    const beamWidth = 15;
    const beamHeight = 0.1;
    const beamDepth = 0.5;
    const geometry = new THREE.BoxGeometry(beamWidth, beamHeight, beamDepth);
    const material = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: MATERIAL_PROPERTIES.EmissiveIntensity.Max,
        transparent: true,
        opacity: 0.7,
    });
    const beam = new THREE.Mesh(geometry, material);
    return beam;
}

export function createGraffitiSplashVFX(color: THREE.Color): THREE.Mesh {
    const splashSize = 2.0;
    const geometry = new THREE.PlaneGeometry(splashSize, splashSize);
    const material = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: MATERIAL_PROPERTIES.EmissiveIntensity.Min,
        transparent: true,
        opacity: 0.8,
    });
    const splash = new THREE.Mesh(geometry, material);
    return splash;
}
