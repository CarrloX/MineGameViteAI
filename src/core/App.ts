// src/core/App.ts
import { GameLoop } from './GameLoop';
import type { IRenderer } from '../rendering/IRenderer'; // <- Asegúrate del 'type' aquí
import { ThreeRenderer } from '../rendering/ThreeRenderer';
import * as THREE from 'three'; // Importar THREE

export class App {
    private renderer: IRenderer;
    private gameLoop: GameLoop;
    private scene: THREE.Scene;
    private camera: THREE.Camera;
    private cube: THREE.Mesh | null = null; // Un cubo de prueba

    constructor() {
        this.renderer = new ThreeRenderer();
        this.gameLoop = new GameLoop(this.update.bind(this), this.render.bind(this));
        // Es importante que scene y camera se obtengan del renderer INICIALIZADO
        // Por eso las dejamos sin inicializar aquí o con valores por defecto.
        this.scene = new THREE.Scene(); // Temporal, se sobrescribirá
        this.camera = new THREE.Camera(); // Temporal, se sobrescribirá
    }

    public async initialize(container: HTMLElement | HTMLCanvasElement): Promise<void> {
        this.renderer.initialize(container); // Aquí se inicializan renderer, scene y camera
        this.scene = this.renderer.getScene(); // Obtener la escena del renderizador
        this.camera = this.renderer.getCamera(); // Obtener la cámara del renderizador

        // *** ELEMENTOS DE PRUEBA ***
        const geometry = new THREE.BoxGeometry(10, 10, 10);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Material básico sin necesidad de luz
        this.cube = new THREE.Mesh(geometry, material);
        this.scene.add(this.cube); // Añadir el cubo a LA ESCENA DEL RENDERIZADOR

        const ambientLight = new THREE.AmbientLight(0x404040, 5);
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