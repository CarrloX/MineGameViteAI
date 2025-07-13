// src/rendering/ThreeRenderer.ts
import * as THREE from 'three';
import type { IRenderer } from './IRenderer';

export class ThreeRenderer implements IRenderer {
    private renderer!: THREE.WebGLRenderer; // ! indica que se inicializará en initialize
    private scene!: THREE.Scene;
    private camera!: THREE.PerspectiveCamera; // Usaremos PerspectiveCamera para el jugador

    public initialize(container: HTMLElement | HTMLCanvasElement): void {
        this.scene = new THREE.Scene();
        // Por ahora, una cámara de perspectiva básica. Luego será manejada por PlayerController.
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 50, 0); // Posición inicial de la cámara

        // Intentamos usar el canvas pasado si es un HTMLCanvasElement
        if (container instanceof HTMLCanvasElement) {
            this.renderer = new THREE.WebGLRenderer({ canvas: container, antialias: true });
        } else {
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            container.appendChild(this.renderer.domElement);
        }

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x87CEEB); // Un color de cielo azul
        this.renderer.shadowMap.enabled = false; // Deshabilitamos sombras dinámicas por ahora

        // Manejo de redimensionamiento de ventana
        window.addEventListener('resize', this.onWindowResize);
        console.log("ThreeRenderer initialized.");
    }

    private onWindowResize = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.resize(width, height);
    };

    public render(scene: THREE.Scene, camera: THREE.Camera): void {
        this.renderer.render(scene, camera);
    }

    public resize(width: number, height: number): void {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    public dispose(): void {
        if (this.renderer) {
            this.renderer.dispose();
        }
        window.removeEventListener('resize', this.onWindowResize);
    }

    public getScene(): THREE.Scene {
        return this.scene;
    }

    public getCamera(): THREE.Camera {
        return this.camera;
    }
}