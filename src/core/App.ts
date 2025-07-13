// src/core/App.ts (solo las partes relevantes)
import { GameLoop } from './GameLoop';
import type { IRenderer } from '../rendering/IRenderer';
import { ThreeRenderer } from '../rendering/ThreeRenderer';
import { World } from '../world/World'; // <-- Importar World
import * as THREE from 'three';

export class App {
    private renderer: IRenderer;
    private gameLoop: GameLoop;
    private world: World; // <-- Nueva propiedad para el mundo
    private scene: THREE.Scene;
    private camera: THREE.Camera;
    private cube: THREE.Mesh | null = null; // Cubo de prueba, lo quitaremos después

    constructor() {
        this.renderer = new ThreeRenderer();
        this.world = new World(); // <-- Inicializar el mundo
        this.gameLoop = new GameLoop(this.update.bind(this), this.render.bind(this));
        this.scene = new THREE.Scene();
        this.camera = new THREE.Camera();
    }

    public async initialize(container: HTMLElement | HTMLCanvasElement): Promise<void> {
        this.renderer.initialize(container);
        this.scene = this.renderer.getScene();
        this.camera = this.renderer.getCamera();

        // Eliminar o comentar el cubo de prueba y la luz ambiental,
        // ya que ahora tendremos el mundo de vóxeles y su propia iluminación.
        // this.scene.add(this.cube); // Ya no es necesario
        // const ambientLight = new THREE.AmbientLight(0x404040, 5);
        // this.scene.add(ambientLight);

        // *** AÑADIR UN CHUNK DE PRUEBA ***
        // Para ver algo, crearemos un chunk en 0,0,0
        const testChunk = this.world.getChunk(0, 0, 0);
        console.log("Bloque en 0,0,0 (dentro del chunk 0,0,0):", this.world.getBlock(0,0,0)); // Debería ser GRASS
        console.log("Bloque en 0,1,0 (dentro del chunk 0,0,0):", this.world.getBlock(0,1,0)); // Debería ser DIRT

        // Aún no verás los bloques, solo hemos configurado los datos.
        // El renderizado de los chunks viene en el siguiente paso con el mesher.

        console.log("App initialized. Starting game loop...");
        this.gameLoop.start();
    }

    private update(deltaTime: number): void {
        // No hay rotación del cubo ahora
        // Lógica de actualización del mundo y jugador aquí
    }

    private render(): void {
        this.renderer.render(this.scene, this.camera);
    }

    public dispose(): void {
        this.gameLoop.stop();
        this.renderer.dispose();
        // TODO: Dispose de los chunks si es necesario
        console.log("App disposed.");
    }
}