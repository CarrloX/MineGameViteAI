// src/core/App.ts (solo las partes relevantes)
import { GameLoop } from './GameLoop';
import type { IRenderer } from '../rendering/IRenderer';
import { ThreeRenderer } from '../rendering/ThreeRenderer';
import { World } from '../world/World';
import * as THREE from 'three';
import type { IMesher } from '../meshing/IMesher'; // <-- Nueva importación
import { GreedyMesher } from '../meshing/GreedyMesher'; // <-- Nueva importación
import { CHUNK_SIZE } from '../utils/constants'; // <-- Nueva importación

export class App {
    private renderer: IRenderer;
    private gameLoop: GameLoop;
    private world: World;
    private scene!: THREE.Scene;
    private camera!: THREE.Camera; // Nota: ThreeRenderer maneja la creación de la cámara, pero la declaramos aquí
    private mesher: IMesher; // <-- Nueva propiedad
    private loadedChunkMeshes!: Map<string, THREE.Mesh>; // Para guardar las mallas de los chunks

    constructor() {
    this.renderer = new ThreeRenderer();
    this.world = new World();
    this.gameLoop = new GameLoop(this.update.bind(this), this.render.bind(this));
    // this.scene = new THREE.Scene(); // THREE.Scene es creado por ThreeRenderer, lo obtendremos de ahí
    // this.camera = new THREE.Camera(); // THREE.Camera es creado por ThreeRenderer, lo obtendremos de ahí

    this.mesher = new GreedyMesher(); // <-- Inicializar el mesher
    this.loadedChunkMeshes = new Map(); // <-- Inicializar el mapa de mallas
    }

    public async initialize(container: HTMLElement | HTMLCanvasElement): Promise<void> {
        this.renderer.initialize(container);
        this.scene = this.renderer.getScene(); // Obtener la escena del renderer
        this.camera = this.renderer.getCamera(); // Obtener la cámara del renderer

        // Opcional pero recomendado: configurar el fondo de la escena
        if (this.scene instanceof THREE.Scene) { // Asegurarse de que es una instancia de THREE.Scene
            this.scene.background = new THREE.Color(0x87ceeb); // Un color de cielo azul claro
        }

        // ... (código existente del cubo de prueba, etc., lo puedes dejar comentado) ...

        // *** AÑADIR UN CHUNK DE PRUEBA Y RENDERIZARLO ***
        const chunkX = 0;
        const chunkY = 0;
        const chunkZ = 0;

        const testChunk = this.world.getChunk(chunkX, chunkY, chunkZ);
        console.log("Bloque en 0,0,0 (dentro del chunk 0,0,0):", this.world.getBlock(0,0,0));
        console.log("Bloque en 0,1,0 (dentro del chunk 0,0,0):", this.world.getBlock(0,1,0));

        // Generar la geometría del chunk con el mesher
        // Por ahora, pasamos 'undefined' como chunks vecinos ya que estamos probando un solo chunk.
        const chunkGeometry = this.mesher.generateMesh(testChunk, undefined);

        // Crear un material para el chunk. MeshBasicMaterial no necesita luces.
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00, // Color verde brillante, fácil de ver
            vertexColors: false, // Por ahora, no usamos colores por vértice
            side: THREE.DoubleSide // Renderiza ambos lados de la cara (útil para depuración)
        });

        // Crear la malla de Three.js con la geometría y el material
        const chunkMesh = new THREE.Mesh(chunkGeometry, material);

        // Posicionar la malla del chunk en el mundo.
        // ¡Aquí es donde podrías tener el error tipográfico CHK_SIZE si lo habías deshecho!
        chunkMesh.position.set(
            chunkX * CHUNK_SIZE,
            chunkY * CHUNK_SIZE, // <-- ¡ASEGÚRATE de que dice CHUNK_SIZE aquí!
            chunkZ * CHUNK_SIZE
        );

        // Añadir el chunk a la escena
        this.scene.add(chunkMesh); // <-- ¡Esta línea es CRUCIAL!
        this.loadedChunkMeshes.set(this.world.getChunkKey(chunkX, chunkY, chunkZ), chunkMesh);

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