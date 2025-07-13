// src/core/App.ts
import { GameLoop } from './GameLoop';
import type { IRenderer } from '../rendering/IRenderer';
import { ThreeRenderer } from '../rendering/ThreeRenderer';
import { World } from '../world/World';
import * as THREE from 'three';
import type { IMesher } from '../meshing/IMesher';
import { GreedyMesher } from '../meshing/GreedyMesher';
import { CHUNK_SIZE } from '../utils/constants';
import { Chunk } from '../world/Chunk'; // Asegúrate de importar Chunk para el tipo Map

export class App {
    private renderer: IRenderer;
    private gameLoop: GameLoop;
    private world: World;
    private scene!: THREE.Scene;
    private camera!: THREE.Camera;
    private mesher: IMesher;
    private loadedChunkMeshes!: Map<string, THREE.Mesh>;

    constructor() {
        this.renderer = new ThreeRenderer();
        this.world = new World();
        this.gameLoop = new GameLoop(this.update.bind(this), this.render.bind(this));

        this.mesher = new GreedyMesher();
        this.loadedChunkMeshes = new Map();
    }

    public async initialize(container: HTMLElement | HTMLCanvasElement): Promise<void> {
        this.renderer.initialize(container);
        this.scene = this.renderer.getScene();
        this.camera = this.renderer.getCamera();

        // --- TEMPORARY CAMERA ADJUSTMENT ---
        // Posiciona la cámara un poco hacia atrás, arriba y mirando hacia el origen del chunk.
        // Esto es para que puedas ver el chunk de prueba.
        this.camera.position.set(CHUNK_SIZE * 1.5, CHUNK_SIZE * 1.5, CHUNK_SIZE * 1.5);
        this.camera.lookAt(new THREE.Vector3(CHUNK_SIZE / 2, CHUNK_SIZE / 2, CHUNK_SIZE / 2));
        // --- FIN DE TEMPORARY CAMERA ADJUSTMENT ---

        // Opcional pero recomendado: configurar el fondo de la escena
        if (this.scene instanceof THREE.Scene) {
            this.scene.background = new THREE.Color(0x87ceeb); // Un color de cielo azul claro
        }

        // *** AÑADIR UN CHUNK DE PRUEBA Y RENDERIZARLO ***
        const chunkX = 0;
        const chunkY = 0;
        const chunkZ = 0;

        // Obtener el chunk de prueba del mundo
        const testChunk = this.world.getChunk(chunkX, chunkY, chunkZ);

        // --- INICIO DE NUEVAS LÍNEAS DE DEPURACIÓN ---
        console.log("DEBUG: Bloque en (0,0,0) del mundo:", this.world.getBlock(0,0,0));
        console.log("DEBUG: Bloque en (0,1,0) del mundo:", this.world.getBlock(0,1,0));
        console.log("DEBUG: Bloque en (0,0,1) del mundo:", this.world.getBlock(0,0,1));
        console.log("DEBUG: Bloque en (1,0,0) del mundo:", this.world.getBlock(1,0,0));
        // --- FIN DE NUEVAS LÍNEAS DE DEPURACIÓN ---

        // Crear un mapa vacío para los chunks vecinos por ahora.
        // Esto evita el error "Cannot read properties of undefined (reading 'get')"
        // porque `getBlockFromWorld` espera un Map, no `undefined`.
        const neighborChunksMap = new Map<string, Chunk>();

        // Generar la geometría del chunk con el mesher
        // Pasa el mapa vacío de chunks vecinos.
        const chunkGeometryData = this.mesher.generateMesh(testChunk, neighborChunksMap); // <-- ¡CORREGIDO AQUÍ!

        // Crear un material para el chunk. MeshBasicMaterial no necesita luces.
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00, // Color verde brillante, fácil de ver
            vertexColors: false, // Por ahora, no usamos colores por vértice
            side: THREE.DoubleSide // Renderiza ambos lados de la cara (útil para depuración)
        });

        // Crear la BufferGeometry de Three.js a partir de los datos generados por el mesher
        const chunkGeometry = new THREE.BufferGeometry();
        chunkGeometry.setAttribute('position', new THREE.Float32BufferAttribute(chunkGeometryData.positions, 3));
        chunkGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(chunkGeometryData.normals, 3));
        chunkGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(chunkGeometryData.uvs, 2));
        chunkGeometry.setIndex(chunkGeometryData.indices);
        chunkGeometry.computeVertexNormals(); // Calcular las normales de los vértices (puede ser útil para iluminación)


        // --- INICIO DE NUEVAS LÍNEAS DE DEPURACIÓN ---
        console.log("DEBUG: Geometría del chunk generada:", chunkGeometry);
        if (chunkGeometry.attributes.position) {
            console.log("DEBUG: Número de vértices en la geometría:", chunkGeometry.attributes.position.count);
        } else {
            console.log("DEBUG: La geometría no tiene atributo 'position' (probablemente vacía).");
        }
        // --- FIN DE NUEVAS LÍNEAS DE DEPURACIÓN ---

        // Crear la malla de Three.js con la geometría y el material
        const chunkMesh = new THREE.Mesh(chunkGeometry, material);

        // Posicionar la malla del chunk en el mundo.
        // La posición del chunk en el mundo se basa en sus coordenadas de chunk * CHUNK_SIZE.
        chunkMesh.position.set(
            chunkX * CHUNK_SIZE,
            chunkY * CHUNK_SIZE,
            chunkZ * CHUNK_SIZE
        );

        // Añadir el chunk a la escena
        this.scene.add(chunkMesh);
        this.loadedChunkMeshes.set(this.world.getChunkKey(chunkX, chunkY, chunkZ), chunkMesh);

        console.log("App initialized. Starting game loop...");
        this.gameLoop.start();
    }

    private update(_deltaTime: number): void {
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
