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
import { CameraController } from '../player/CameraController';

// --- ¡NUEVA IMPORTACIÓN DEL ATLAS DE TEXTURAS! ---
import blockAtlasTextureUrl from '../assets/textures/block_atlas.png'; // Vite procesará esto
// -------------------------------------------------

export class App {
    private renderer: IRenderer;
    private gameLoop: GameLoop;
    private world: World;
    private scene!: THREE.Scene;
    private camera!: THREE.Camera;
    private mesher: IMesher;
    private loadedChunkMeshes!: Map<string, THREE.Mesh>;
    private cameraController!: CameraController;

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

        if (!(this.camera instanceof THREE.PerspectiveCamera)) {
            console.error("La cámara no es una THREE.PerspectiveCamera. Los controles de cámara pueden no funcionar.");
            return;
        }

        this.cameraController = new CameraController(this.camera as THREE.PerspectiveCamera, container);

        if (this.scene instanceof THREE.Scene) {
            this.scene.background = new THREE.Color(0x87ceeb);
        }

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

        // --- INICIO DE CÓDIGO PARA CARGAR EL ATLAS DE TEXTURAS ---
        const textureLoader = new THREE.TextureLoader();
        let atlasTexture: THREE.Texture;

        try {
            // Carga el atlas de texturas
            atlasTexture = await textureLoader.loadAsync(blockAtlasTextureUrl);
            atlasTexture.wrapS = THREE.RepeatWrapping; // Asegura que la textura se repita en U
            atlasTexture.wrapT = THREE.RepeatWrapping; // Asegura que la textura se repita en V
            // No necesitamos texture.repeat.set(width, height) aquí, ya que el mesher calcula las UVs.

            console.log("Atlas de texturas 'block_atlas.png' cargado con éxito.");
        } catch (error) {
            console.error("Error al cargar el atlas de texturas 'block_atlas.png':", error);
            // Fallback a una textura de error magenta
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#FF00FF';
                ctx.fillRect(0, 0, 1, 1);
            }
            atlasTexture = new THREE.CanvasTexture(canvas);
        }

        // Crear un material usando el atlas de texturas
        const material = new THREE.MeshBasicMaterial({
            map: atlasTexture, // <-- ¡Asigna el atlas aquí!
            vertexColors: false,
            side: THREE.DoubleSide
        });
        // --- FIN DE CÓDIGO PARA CARGAR EL ATLAS DE TEXTURAS ---


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
            chunkY * CHUNK_SIZE, // <-- ¡Corregido! Asegúrate de que sea CHUNK_SIZE
            chunkZ * CHUNK_SIZE
        );

        this.scene.add(chunkMesh);
        this.loadedChunkMeshes.set(this.world.getChunkKey(chunkX, chunkY, chunkZ), chunkMesh);

        console.log("App initialized. Starting game loop...");
        this.gameLoop.start();
    }

    private update(deltaTime: number): void {
        if (this.cameraController) {
            this.cameraController.update(deltaTime);
        }
    }

    private render(): void {
        this.renderer.render(this.scene, this.camera);
    }

    public dispose(): void {
        this.gameLoop.stop();
        this.renderer.dispose();
        console.log("App disposed.");
    }
}
