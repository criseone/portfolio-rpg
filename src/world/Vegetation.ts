// src/world/Vegetation.ts
import * as THREE from 'three';
import { COLORS, MATERIAL_PROPERTIES, VEGETATION } from '../style/znastyle';

export function createLowPolyTree(type: 'cone' | 'capsule' | 'stackedDisks'): THREE.Group {
    const treeGroup = new THREE.Group();

    // Trunk
    const trunkHeight = Math.random() * 1.5 + 2; // 2 to 3.5 units
    const trunkRadius = Math.random() * 0.1 + 0.1; // 0.1 to 0.2 units
    const trunkGeometry = new THREE.CylinderGeometry(trunkRadius, trunkRadius * 1.5, trunkHeight, 4);
    const trunkMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(COLORS.Graphite), // Using Graphite for trunk
        roughness: MATERIAL_PROPERTIES.Roughness,
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = trunkHeight / 2;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    treeGroup.add(trunk);

    // Crown
    let crownMesh: THREE.Mesh;
    const crownMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(COLORS.Forest), // Using Forest for crown
        roughness: MATERIAL_PROPERTIES.Roughness,
    });

    switch (type) {
        case 'cone':
            const coneRadius = Math.random() * 1 + 1; // 1 to 2 units
            const coneHeight = Math.random() * 1.5 + 2; // 2 to 3.5 units
            const coneGeometry = new THREE.ConeGeometry(coneRadius, coneHeight, 6); // 6 faces for low poly
            crownMesh = new THREE.Mesh(coneGeometry, crownMaterial);
            crownMesh.position.y = trunkHeight + coneHeight / 2 - 0.2; // Adjust position to sit on trunk
            break;
        case 'capsule':
            const capsuleRadius = Math.random() * 0.8 + 0.8; // 0.8 to 1.6 units
            const capsuleHeight = Math.random() * 1.5 + 1.5; // 1.5 to 3 units
            const capsuleGeometry = new THREE.CapsuleGeometry(capsuleRadius, capsuleHeight, 1, 6); // Low poly capsule
            crownMesh = new THREE.Mesh(capsuleGeometry, crownMaterial);
            crownMesh.position.y = trunkHeight + capsuleHeight / 2 - 0.2;
            break;
        case 'stackedDisks':
            const diskCount = Math.floor(Math.random() * 2) + 3; // 3 to 4 disks
            const diskBaseRadius = Math.random() * 0.8 + 0.8;
            const diskHeight = 0.5;
            const diskGroup = new THREE.Group();
            for (let i = 0; i < diskCount; i++) {
                const currentRadius = diskBaseRadius * (1 - i * 0.2);
                const diskGeometry = new THREE.CylinderGeometry(currentRadius, currentRadius, diskHeight, 6);
                const disk = new THREE.Mesh(diskGeometry, crownMaterial);
                disk.position.y = i * (diskHeight * 0.8); // Stack them with slight overlap
                diskGroup.add(disk);
            }
            diskGroup.position.y = trunkHeight + (diskCount * diskHeight * 0.8) / 2 - 0.2;
            crownMesh = diskGroup;
            break;
    }
    crownMesh.castShadow = true;
    crownMesh.receiveShadow = true;
    treeGroup.add(crownMesh);

    return treeGroup;
}

export function createLowPolyGrass(): THREE.Group {
    const grassGroup = new THREE.Group();
    const numQuads = Math.floor(Math.random() * 3) + 3; // 3-5 quads

    const grassMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            amplitude: { value: VEGETATION.GrassWindAmplitude },
            period: { value: VEGETATION.GrassWindPeriod },
            grassColor: { value: new THREE.Color(COLORS.Sage) }, // Using Sage for grass
        },
        vertexShader: `
            uniform float time;
            uniform float amplitude;
            uniform float period;
            varying vec3 vNormal;
            varying vec3 vPosition;

            void main() {
                vNormal = normal;
                vPosition = position;

                vec3 newPosition = position;
                // Simple wind sway based on x position and height
                newPosition.x += sin(time * period + position.y * 2.0) * amplitude * (position.y / 1.0); // Assuming grass height is around 1 unit

                gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 grassColor;
            varying vec3 vNormal;
            varying vec3 vPosition;

            void main() {
                // Basic lighting
                vec3 lightDirection = normalize(vec3(0.5, 1.0, 0.5));
                float diffuse = max(dot(vNormal, lightDirection), 0.0);
                gl_FragColor = vec4(grassColor * (0.5 + diffuse * 0.5), 1.0);
            }
        `,
        side: THREE.DoubleSide,
        transparent: true,
    });

    for (let i = 0; i < numQuads; i++) {
        const quadWidth = Math.random() * 0.3 + 0.2; // 0.2 to 0.5 units
        const quadHeight = Math.random() * 0.6 + 0.4; // 0.4 to 1.0 units
        const geometry = new THREE.PlaneGeometry(quadWidth, quadHeight);
        geometry.translate(0, quadHeight / 2, 0); // Pivot at the bottom

        const quad = new THREE.Mesh(geometry, grassMaterial);
        quad.rotation.y = Math.random() * Math.PI * 2; // Random rotation
        quad.position.x = (Math.random() - 0.5) * 0.5; // Slight offset within cluster
        quad.position.z = (Math.random() - 0.5) * 0.5;
        quad.castShadow = true;
        quad.receiveShadow = true;
        grassGroup.add(quad);
    }

    return grassGroup;
}