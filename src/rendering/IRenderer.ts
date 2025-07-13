// src/rendering/IRenderer.ts
import * as THREE from 'three';

export interface IRenderer {
    initialize(container: HTMLElement | HTMLCanvasElement): void;
    render(scene: THREE.Scene, camera: THREE.Camera): void;
    resize(width: number, height: number): void;
    dispose(): void;
    getScene(): THREE.Scene;
    getCamera(): THREE.Camera;
}