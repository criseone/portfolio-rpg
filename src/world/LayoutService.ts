// src/world/LayoutService.ts
import * as THREE from 'three';
import { TERRAIN } from '../style/znastyle';

export class LayoutService {
    private layoutDoc: Document | null = null;

    constructor() {}

    public async loadLayout(): Promise<void> {
        try {
            const { default: svgText } = await import('../config/world-layout.svg?raw');
            const parser = new DOMParser();
            this.layoutDoc = parser.parseFromString(svgText, 'image/svg+xml');
        } catch (error) {
            console.error('Failed to load world layout SVG:', error);
        }
    }

    public getObjectLayouts(groupId: string): { id: string, position: THREE.Vector3 }[] {
        if (!this.layoutDoc) {
            console.warn('Layout not loaded yet.');
            return [];
        }

        const layouts: { id: string, position: THREE.Vector3 }[] = [];
        const group = this.layoutDoc.getElementById(groupId);
        const halfSize = TERRAIN.IslandSize / 2;

        if (group) {
            group.childNodes.forEach(node => {
                if (node instanceof Element) {
                    const id = node.getAttribute('data-id') || '';
                    let x = 0, y = 0;
                    if (node.tagName === 'circle') {
                        x = parseFloat(node.getAttribute('cx') || '0');
                        y = parseFloat(node.getAttribute('cy') || '0');
                    } else if (node.tagName === 'rect') {
                        x = parseFloat(node.getAttribute('x') || '0');
                        y = parseFloat(node.getAttribute('y') || '0');
                    }
                    // The SVG's y-axis is inverted relative to Three.js's z-axis, and we need to center the coordinates
                    const centeredX = x - halfSize;
                    const centeredZ = -(y - halfSize);
                    layouts.push({ id, position: new THREE.Vector3(centeredX, 0, centeredZ) });
                }
            });
        }

        return layouts;
    }
}
