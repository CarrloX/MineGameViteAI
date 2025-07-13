// src/rendering/ThreeRenderer.ts
import * as THREE from 'three';
import type { IRenderer } from './IRenderer';

export class ThreeRenderer implements IRenderer {
    private renderer!: THREE.WebGLRenderer; // ! indica que se inicializará en initialize
    private scene!: THREE.Scene;
    private camera!: THREE.PerspectiveCamera; // Usaremos PerspectiveCamera para el jugador

    public initialize(container: HTMLElement | HTMLCanvasElement): void {
        this.scene = new THREE.Scene();
        // Cámara de perspectiva básica, colocada en Z positivo mirando al origen
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 0, 50); // Alejada en Z
        this.camera.lookAt(0, 0, 0); // Apunta al cubo

        // *** ESTE BLOQUE ES CRÍTICO ***
        // Intenta usar el canvas directamente si es un HTMLCanvasElement
        if (container instanceof HTMLCanvasElement) {
            // Si el contenedor es el canvas directamente, Three.js lo usará.
            this.renderer = new THREE.WebGLRenderer({ canvas: container, antialias: true });
        } else {
            // Esto es un fallback, si se pasara un div o body, añadiría un canvas.
            // Para tu caso, debería ser el primer 'if'.
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            container.appendChild(this.renderer.domElement);
        }
        // *** FIN BLOQUE CRÍTICO ***
        // Redimensionar el renderer al tamaño de la ventana y añadir el listener
        this.resize(window.innerWidth, window.innerHeight);
        window.addEventListener('resize', this.onWindowResize);
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