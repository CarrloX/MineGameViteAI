// src/world/World.ts
import * as THREE from 'three';
import { Chunk } from './Chunk';
import { BlockType, getBlockDefinition } from './Block';
import { CHUNK_SIZE, WORLD_HEIGHT_CHUNKS, WORLD_HEIGHT_BLOCKS } from '../utils/constants';

/**
 * La clase World gestiona la colección de chunks y proporciona métodos
 * para interactuar con los bloques en coordenadas globales.
 */
export class World {
    // Un mapa para almacenar los chunks. La clave será una cadena "x,y,z"
    private chunks: Map<string, Chunk>;

    constructor() {
        this.chunks = new Map<string, Chunk>();
        console.log("World initialized.");
    }

    /**
     * Genera una clave única para un chunk a partir de sus coordenadas.
     * @param chunkX Coordenada X del chunk.
     * @param chunkY Coordenada Y del chunk.
     * @param chunkZ Coordenada Z del chunk.
     * @returns Una cadena que representa la clave del chunk.
     */
    public getChunkKey(chunkX: number, chunkY: number, chunkZ: number): string {
        return `${chunkX},${chunkY},${chunkZ}`;
    }

    /**
     * Obtiene un chunk por sus coordenadas de chunk.
     * Si el chunk no existe, lo crea, genera su terreno y lo añade al mundo.
     * @param chunkX Coordenada X del chunk.
     * @param chunkY Coordenada Y del chunk.
     * @param chunkZ Coordenada Z del chunk.
     * @returns El Chunk solicitado.
     */
    public getChunk(chunkX: number, chunkY: number, chunkZ: number): Chunk {
        const key = this.getChunkKey(chunkX, chunkY, chunkZ);
        if (!this.chunks.has(key)) {
            const newChunk = new Chunk(chunkX, chunkY, chunkZ);
            this.generateTestChunk(newChunk); // <-- Llama a una función para poblarlo
            this.chunks.set(key, newChunk);
            console.log(`Chunk ${chunkX},${chunkY},${chunkZ} generated.`);
        }
        return this.chunks.get(key)!;
    }

        // NUEVO MÉTODO PARA GENERAR UN CHUNK DE PRUEBA SIMPLE
    private generateTestChunk(chunk: Chunk): void {
        for (let x = 0; x < CHUNK_SIZE; x++) {
            for (let z = 0; z < CHUNK_SIZE; z++) {
                // Rellenar la capa inferior del chunk con bloques de tierra (o piedra)
                // Asegúrate de que BlockType.GRASS o BlockType.STONE sea un bloque opaco
                chunk.setBlock(x, 0, z, BlockType.GRASS); // Asume GRASS es BlockType.1 o similar

                // Rellenar las capas superiores con aire
                for (let y = 1; y < CHUNK_SIZE; y++) {
                    chunk.setBlock(x, y, z, BlockType.AIR); // Asume AIR es BlockType.0
                }
            }
        }
    }

    /**
     * Obtiene el tipo de bloque en coordenadas globales del mundo.
     * @param worldX Coordenada X global.
     * @param worldY Coordenada Y global.
     * @param worldZ Coordenada Z global.
     * @returns El BlockType en las coordenadas dadas, o AIR si está fuera de los límites del mundo o chunk no encontrado.
     */
    public getBlock(worldX: number, worldY: number, worldZ: number): BlockType {
        // Manejar límites del mundo
        if (worldY < 0 || worldY >= WORLD_HEIGHT_BLOCKS) {
            return BlockType.AIR;
        }

        // Convertir coordenadas globales a coordenadas de chunk y locales
        const chunkX = Math.floor(worldX / CHUNK_SIZE);
        const chunkY = Math.floor(worldY / CHUNK_SIZE);
        const chunkZ = Math.floor(worldZ / CHUNK_SIZE);

        const localX = worldX - chunkX * CHUNK_SIZE;
        const localY = worldY - chunkY * CHUNK_SIZE;
        const localZ = worldZ - chunkZ * CHUNK_SIZE;

        const chunk = this.getChunk(chunkX, chunkY, chunkZ);
        return chunk.getBlock(localX, localY, localZ);
    }

    /**
     * Establece el tipo de bloque en coordenadas globales del mundo.
     * @param worldX Coordenada X global.
     * @param worldY Coordenada Y global.
     * @param worldZ Coordenada Z global.
     * @param type El BlockType a establecer.
     */
    public setBlock(worldX: number, worldY: number, worldZ: number, type: BlockType): void {
        if (worldY < 0 || worldY >= WORLD_HEIGHT_BLOCKS) {
            return; // Fuera de los límites verticales del mundo
        }

        const chunkX = Math.floor(worldX / CHUNK_SIZE);
        const chunkY = Math.floor(worldY / CHUNK_SIZE);
        const chunkZ = Math.floor(worldZ / CHUNK_SIZE);

        const localX = worldX - chunkX * CHUNK_SIZE;
        const localY = worldY - chunkY * CHUNK_SIZE;
        const localZ = worldZ - chunkZ * CHUNK_SIZE;

        const chunk = this.getChunk(chunkX, chunkY, chunkZ); // Obtener (o crear) el chunk
        chunk.setBlock(localX, localY, localZ, type);

        // TODO: Más adelante, al cambiar un bloque, se necesitará:
        // 1. Marcar el chunk como "dirty" para regenerar su malla.
        // 2. Recalcular la luz en el área afectada.
    }

    /**
     * *** GENERACIÓN DE TERRENO SIMPLE (TEMPORAL) ***
     * Más adelante, esto se moverá a una clase TerrainGenerator.
     * Por ahora, crea un suelo plano para empezar.
     * @param chunk El chunk al que se le generará el terreno.
     */
    private generateChunkTerrain(chunk: Chunk): void {
        // Este es un generador de terreno muy, muy simple.
        // Simplemente llena la parte inferior del chunk con DIRTy GRASS.
        // Y luego bloques de AIr arriba
        for (let x = 0; x < CHUNK_SIZE; x++) {
            for (let z = 0; z < CHUNK_SIZE; z++) {
                const surfaceY = Math.floor(CHUNK_SIZE / 2); // Ejemplo: superficie a la mitad del chunk

                for (let y = 0; y < CHUNK_SIZE; y++) {
                    if (y < surfaceY) {
                        chunk.setBlock(x, y, z, BlockType.DIRT); // Tierra debajo de la superficie
                    } else if (y === surfaceY) {
                        chunk.setBlock(x, y, z, BlockType.GRASS); // Superficie de césped
                    } else {
                        chunk.setBlock(x, y, z, BlockType.AIR); // Aire encima
                    }
                }
            }
        }
    }

    /**
     * Obtiene todos los chunks cargados actualmente.
     * Útil para el renderizador o la lógica de actualización.
     * @returns Un array de todos los chunks activos.
     */
    public getAllChunks(): Chunk[] {
        return Array.from(this.chunks.values());
    }

    // TODO: Implementar lógica para cargar/descargar chunks basados en la posición del jugador.
    // TODO: Implementar persistencia (guardar/cargar chunks de archivo/IndexedDB).
}