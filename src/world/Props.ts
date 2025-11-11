// src/world/Props.ts
import * as THREE from 'three';
import { COLORS, MATERIAL_PROPERTIES, PROPS } from '../style/znastyle';

export function createBench(): THREE.Group {
    const benchGroup = new THREE.Group();
    const concreteMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(COLORS.Concrete),
        roughness: MATERIAL_PROPERTIES.Roughness,
    });

    // Seat
    const seatWidth = 2.0;
    const seatHeight = 0.1;
    const seatDepth = 0.4;
    const seatGeometry = new THREE.BoxGeometry(seatWidth, seatHeight, seatDepth);
    const seat = new THREE.Mesh(seatGeometry, concreteMaterial);
    seat.position.y = 0.4;
    seat.castShadow = true;
    seat.receiveShadow = true;
    benchGroup.add(seat);

    // Legs
    const legWidth = 0.1;
    const legHeight = 0.4;
    const legDepth = 0.3;
    const legGeometry = new THREE.BoxGeometry(legWidth, legHeight, legDepth);

    const leftLeg = new THREE.Mesh(legGeometry, concreteMaterial);
    leftLeg.position.set(-(seatWidth / 2 - legWidth / 2), legHeight / 2, 0);
    leftLeg.castShadow = true;
    leftLeg.receiveShadow = true;
    benchGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, concreteMaterial);
    rightLeg.position.set(seatWidth / 2 - legWidth / 2, legHeight / 2, 0);
    rightLeg.castShadow = true;
    rightLeg.receiveShadow = true;
    benchGroup.add(rightLeg);

    return benchGroup;
}

export function createWayfindingTotem(): THREE.Group {
    const totemGroup = new THREE.Group();
    const concreteMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(COLORS.Concrete),
        roughness: MATERIAL_PROPERTIES.Roughness,
    });

    const emissiveMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(COLORS.AccentOrange),
        emissive: new THREE.Color(COLORS.AccentOrange),
        emissiveIntensity: MATERIAL_PROPERTIES.EmissiveIntensity.Min,
        roughness: MATERIAL_PROPERTIES.Roughness,
    });

    const mainPlaneHeight = 2.5;
    const mainPlaneWidth = 0.8;
    const mainPlaneDepth = 0.1;
    const mainPlaneGeometry = new THREE.BoxGeometry(mainPlaneWidth, mainPlaneHeight, mainPlaneDepth);
    const mainPlane = new THREE.Mesh(mainPlaneGeometry, concreteMaterial);
    mainPlane.position.y = mainPlaneHeight / 2;
    mainPlane.castShadow = true;
    mainPlane.receiveShadow = true;
    totemGroup.add(mainPlane);

    const sidePlaneHeight = 1.5;
    const sidePlaneWidth = 0.1;
    const sidePlaneDepth = 0.6;
    const sidePlaneGeometry = new THREE.BoxGeometry(sidePlaneWidth, sidePlaneHeight, sidePlaneDepth);
    const sidePlane = new THREE.Mesh(sidePlaneGeometry, concreteMaterial);
    sidePlane.position.set(mainPlaneWidth / 2 + sidePlaneWidth / 2, mainPlaneHeight * 0.6, 0);
    sidePlane.castShadow = true;
    sidePlane.receiveShadow = true;
    totemGroup.add(sidePlane);

    // Emissive edge
    const edgeHeight = sidePlaneHeight;
    const edgeWidth = 0.05;
    const edgeDepth = sidePlaneDepth;
    const edgeGeometry = new THREE.BoxGeometry(edgeWidth, edgeHeight, edgeDepth);
    const edge = new THREE.Mesh(edgeGeometry, emissiveMaterial);
    edge.position.copy(sidePlane.position);
    edge.position.x += sidePlaneWidth / 2 + edgeWidth / 2;
    totemGroup.add(edge);

    return totemGroup;
}

export function createStreetlight(): THREE.Group {
    const streetlightGroup = new THREE.Group();
    const graphiteMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(COLORS.Graphite),
        roughness: MATERIAL_PROPERTIES.Roughness,
    });

    const emissiveMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(COLORS.Hover),
        emissive: new THREE.Color(COLORS.Hover),
        emissiveIntensity: MATERIAL_PROPERTIES.EmissiveIntensity.Min,
        roughness: MATERIAL_PROPERTIES.Roughness,
    });

    // Post
    const postHeight = PROPS.StreetlightHeight;
    const postRadius = 0.05;
    const postGeometry = new THREE.CylinderGeometry(postRadius, postRadius, postHeight, 6);
    const post = new THREE.Mesh(postGeometry, graphiteMaterial);
    post.position.y = postHeight / 2;
    post.castShadow = true;
    post.receiveShadow = true;
    streetlightGroup.add(post);

    // Head (T-shape)
    const headWidth = 1.0;
    const headHeight = 0.1;
    const headDepth = 0.1;
    const headGeometry = new THREE.BoxGeometry(headWidth, headHeight, headDepth);
    const head = new THREE.Mesh(headGeometry, graphiteMaterial);
    head.position.y = postHeight;
    head.castShadow = true;
    head.receiveShadow = true;
    streetlightGroup.add(head);

    // Light source
    const lightSize = 0.1;
    const lightGeometry = new THREE.SphereGeometry(lightSize, 8, 8);
    const light = new THREE.Mesh(lightGeometry, emissiveMaterial);
    light.position.y = postHeight - headHeight / 2 - lightSize / 2;
    streetlightGroup.add(light);

    return streetlightGroup;
}


