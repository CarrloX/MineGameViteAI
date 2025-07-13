// src/core/App.ts
import * as THREE from 'three';
import { GameLoop } from './GameLoop';
import type { IRenderer } from '../rendering/IRenderer';
import { ThreeRenderer } from '../rendering/ThreeRenderer';

export class App {
    private renderer: IRenderer;
    private gameLoop: GameLoop;
    private scene: THREE.Scene;
    private camera: THREE.Camera;
    private cube: THREE.Mesh | null = null; // Un cubo de prueba

    constructor() {
        this.renderer = new ThreeRenderer();
        // Los callbacks para el bucle de juego llamarán a los métodos de la propia App
        this.gameLoop = new GameLoop(this.update.bind(this), this.render.bind(this));
        // Las propiedades scene y camera se obtendrán del renderizador después de la inicialización
        this.scene = new THREE.Scene(); // Se sobrescribirá al inicializar el renderer
        this.camera = new THREE.Camera(); // Se sobrescribirá al inicializar el renderer
    }

    public async initialize(container: HTMLElement | HTMLCanvasElement): Promise<void> {
        this.renderer.initialize(container);
        this.scene = this.renderer.getScene();
        this.camera = this.renderer.getCamera();

        // *** ELEMENTOS DE PRUEBA ***
        // Añadir un cubo de prueba para verificar que el renderizado funciona
        const geometry = new THREE.BoxGeometry(10, 10, 10);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.cube = new THREE.Mesh(geometry, material);
        this.scene.add(this.cube);

        // Añadir una luz ambiental simple para que se vea el cubo
        const ambientLight = new THREE.AmbientLight(0x404040, 5); // soft white light
        this.scene.add(ambientLight);
        // *** FIN ELEMENTOS DE PRUEBA ***

        console.log("App initialized. Starting game loop...");
        this.gameLoop.start();
    }

    private update(deltaTime: number): void {
        // Lógica de actualización del juego: física, IA, movimiento del jugador, etc.
        // Por ahora, solo rotaremos el cubo de prueba
        if (this.cube) {
            this.cube.rotation.x += 0.5 * deltaTime;
            this.cube.rotation.y += 0.5 * deltaTime;
        }
    }

    private render(): void {
        // Lógica de renderizado: llamar al renderizador
        this.renderer.render(this.scene, this.camera);
    }

    public dispose(): void {
        this.gameLoop.stop();
        this.renderer.dispose();
        console.log("App disposed.");
    }
}