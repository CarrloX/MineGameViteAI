// src/core/App.ts
import { GameLoop } from './GameLoop';
import type { IRenderer } from '../rendering/IRenderer';
import { ThreeRenderer } from '../rendering/ThreeRenderer';
import { World } from '../world/World';
import * as THREE from 'three';
import type { IMesher } from '../meshing/IMesher';
import { GreedyMesher } from '../meshing/GreedyMesher';
import { CHUNK_SIZE } from '../utils/constants';
import { Chunk } from '../world/Chunk';
import { CameraController } from '../player/CameraController'; // <-- ¡NUEVA IMPORTACIÓN!

export class App {
    private renderer: IRenderer;
    private gameLoop: GameLoop;
    private world: World;
    private scene!: THREE.Scene;
    private camera!: THREE.Camera; // THREE.Camera es el tipo base, pero ThreeRenderer devuelve PerspectiveCamera
    private mesher: IMesher;
    private loadedChunkMeshes!: Map<string, THREE.Mesh>;
    private cameraController!: CameraController; // <-- ¡NUEVA PROPIEDAD!

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
        this.camera = this.renderer.getCamera(); // Esta cámara es THREE.PerspectiveCamera

        // Asegurarse de que la cámara sea una PerspectiveCamera para el CameraController
        if (!(this.camera instanceof THREE.PerspectiveCamera)) {
            console.error("La cámara no es una THREE.PerspectiveCamera. Los controles de cámara pueden no funcionar.");
            return;
        }

        // --- INICIALIZAR EL CAMERA CONTROLLER ---
        // Pasa la cámara y el elemento DOM donde se adjuntarán los listeners.
        // Si 'container' es un canvas, úsalo. Si es un div, usa el document.body o el div mismo.
        // Para el bloqueo del puntero, es mejor usar el canvas directamente si es el elemento interactivo.
        this.cameraController = new CameraController(this.camera as THREE.PerspectiveCamera, container);
        // La posición inicial de la cámara se establece en CameraController para que sea el punto de partida.
        // Eliminamos el ajuste temporal de cámara aquí, ya que CameraController lo maneja.
        // this.camera.position.set(CHUNK_SIZE * 1.5, CHUNK_SIZE * 1.5, CHUNK_SIZE * 1.5);
        // this.camera.lookAt(new THREE.Vector3(CHUNK_SIZE / 2, CHUNK_SIZE / 2, CHUNK_SIZE / 2));
        // --- FIN DE INICIALIZACIÓN DEL CAMERA CONTROLLER ---


        // Opcional pero recomendado: configurar el fondo de la escena
        if (this.scene instanceof THREE.Scene) {
            this.scene.background = new THREE.Color(0x87ceeb);
        }

        // *** AÑADIR UN CHUNK DE PRUEBA Y RENDERIZARLO ***
        const chunkX = 0;
        const chunkY = 0;
        const chunkZ = 0;

        const testChunk = this.world.getChunk(chunkX, chunkY, chunkZ);

        console.log("DEBUG: Bloque en (0,0,0) del mundo:", this.world.getBlock(0,0,0));
        console.log("DEBUG: Bloque en (0,1,0) del mundo:", this.world.getBlock(0,1,0));
        console.log("DEBUG: Bloque en (0,0,1) del mundo:", this.world.getBlock(0,0,1));
        console.log("DEBUG: Bloque en (1,0,0) del mundo:", this.world.getBlock(1,0,0));

        const neighborChunksMap = new Map<string, Chunk>();

        const chunkGeometryData = this.mesher.generateMesh(testChunk, neighborChunksMap);

        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            vertexColors: false,
            side: THREE.DoubleSide
        });

        const chunkGeometry = new THREE.BufferGeometry();
        chunkGeometry.setAttribute('position', new THREE.Float32BufferAttribute(chunkGeometryData.positions, 3));
        chunkGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(chunkGeometryData.normals, 3));
        chunkGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(chunkGeometryData.uvs, 2));
        chunkGeometry.setIndex(chunkGeometryData.indices);
        chunkGeometry.computeVertexNormals();

        console.log("DEBUG: Geometría del chunk generada:", chunkGeometry);
        if (chunkGeometry.attributes.position) {
            console.log("DEBUG: Número de vértices en la geometría:", chunkGeometry.attributes.position.count);
        } else {
            console.log("DEBUG: La geometría no tiene atributo 'position' (probablemente vacía).");
        }

        const chunkMesh = new THREE.Mesh(chunkGeometry, material);

        chunkMesh.position.set(
            chunkX * CHUNK_SIZE,
            chunkY * CHUNK_SIZE,
            chunkZ * CHUNK_SIZE
        );

        this.scene.add(chunkMesh);
        this.loadedChunkMeshes.set(this.world.getChunkKey(chunkX, chunkY, chunkZ), chunkMesh);

        console.log("App initialized. Starting game loop...");
        this.gameLoop.start();
    }

    private update(deltaTime: number): void {
        // Lógica de actualización del mundo y jugador aquí
        // --- ACTUALIZAR EL CAMERA CONTROLLER ---
        if (this.cameraController) {
            // console.log("App.update - deltaTime:", deltaTime); // <-- Añadido para depuración
            this.cameraController.update(deltaTime);
        }
        // --- FIN ACTUALIZACIÓN CAMERA CONTROLLER ---
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
