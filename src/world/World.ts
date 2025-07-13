// src/world/World.ts
import { Chunk } from './Chunk';
// --- ¡MODIFICADO AQUÍ! Importa BlockType (valor) y BlockTypeValue (tipo) ---
import { BlockType, type BlockTypeValue } from './Block';
import { CHUNK_SIZE } from '../utils/constants';

export class World {
    private chunks = new Map<string, Chunk>();

    constructor() {
        // Inicializa un chunk de prueba en la posición (0,0,0)
        // Esto es solo para tener un chunk inicial para renderizar.
        // En un juego real, los chunks se cargarían/generarían dinámicamente.
        const initialChunkX = 0;
        const initialChunkY = 0;
        const initialChunkZ = 0;
        const initialChunk = new Chunk(initialChunkX, initialChunkY, initialChunkZ);

        // Llena el chunk inicial con bloques de GRASS para que sea visible
        for (let x = 0; x < CHUNK_SIZE; x++) {
            for (let y = 0; y < CHUNK_SIZE; y++) {
                for (let z = 0; z < CHUNK_SIZE; z++) {
                    // Llenar todo el chunk con GRASS para la prueba
                    initialChunk.setBlock(x, y, z, BlockType.GRASS); // <-- Usa BlockType.GRASS (el valor)
                }
            }
        }
        this.chunks.set(this.getChunkKey(initialChunkX, initialChunkY, initialChunkZ), initialChunk);
    }

    /**
     * Obtiene una clave de cadena para un chunk basada en sus coordenadas.
     * @param x Coordenada X del chunk.
     * @param y Coordenada Y del chunk.
     * @param z Coordenada Z del chunk.
     * @returns Una cadena única que identifica el chunk.
     */
    public getChunkKey(x: number, y: number, z: number): string {
        return `${x},${y},${z}`;
    }

    /**
     * Obtiene un chunk en las coordenadas dadas. Si no existe, lo crea.
     * @param chunkX Coordenada X del chunk.
     * @param chunkY Coordenada Y del chunk.
     * @param chunkZ Coordenada Z del chunk.
     * @returns La instancia del Chunk.
     */
    public getChunk(chunkX: number, chunkY: number, chunkZ: number): Chunk {
        const key = this.getChunkKey(chunkX, chunkY, chunkZ);
        if (!this.chunks.has(key)) {
            console.log(`Generating new chunk at ${chunkX},${chunkY},${chunkZ}`);
            const newChunk = new Chunk(chunkX, chunkY, chunkZ);
            // Llena el nuevo chunk con bloques de GRASS por defecto para la visualización
            for (let x = 0; x < CHUNK_SIZE; x++) {
                for (let y = 0; y < CHUNK_SIZE; y++) {
                    for (let z = 0; z < CHUNK_SIZE; z++) {
                        newChunk.setBlock(x, y, z, BlockType.GRASS); // <-- Usa BlockType.GRASS (el valor)
                    }
                }
            }
            this.chunks.set(key, newChunk);
        }
        return this.chunks.get(key)!;
    }

    /**
     * Obtiene el tipo de bloque en una coordenada de mundo específica.
     * @param wx Coordenada X del mundo.
     * @param wy Coordenada Y del mundo.
     * @param wz Coordenada Z del mundo.
     * @returns El BlockTypeValue del bloque en esa posición.
     */
    public getBlock(wx: number, wy: number, wz: number): BlockTypeValue { // <-- ¡MODIFICADO AQUÍ! Tipo de retorno
        const chunkX = Math.floor(wx / CHUNK_SIZE);
        const chunkY = Math.floor(wy / CHUNK_SIZE);
        const chunkZ = Math.floor(wz / CHUNK_SIZE);

        const localX = (wx % CHUNK_SIZE + CHUNK_SIZE) % CHUNK_SIZE;
        const localY = (wy % CHUNK_SIZE + CHUNK_SIZE) % CHUNK_SIZE;
        const localZ = (wz % CHUNK_SIZE + CHUNK_SIZE) % CHUNK_SIZE;

        const chunk = this.getChunk(chunkX, chunkY, chunkZ);
        return chunk.getBlock(localX, localY, localZ);
    }

    /**
     * Establece el tipo de bloque en una coordenada de mundo específica.
     * @param wx Coordenada X del mundo.
     * @param wy Coordenada Y del mundo.
     * @param wz Coordenada Z del mundo.
     * @param type El nuevo BlockTypeValue para el bloque.
     */
    public setBlock(wx: number, wy: number, wz: number, type: BlockTypeValue): void { // <-- ¡MODIFICADO AQUÍ! Tipo de parámetro
        const chunkX = Math.floor(wx / CHUNK_SIZE);
        const chunkY = Math.floor(wy / CHUNK_SIZE);
        const chunkZ = Math.floor(wz / CHUNK_SIZE);

        const localX = (wx % CHUNK_SIZE + CHUNK_SIZE) % CHUNK_SIZE;
        const localY = (wy % CHUNK_SIZE + CHUNK_SIZE) % CHUNK_SIZE;
        const localZ = (wz % CHUNK_SIZE + CHUNK_SIZE) % CHUNK_SIZE;

        const chunk = this.getChunk(chunkX, chunkY, chunkZ);
        chunk.setBlock(localX, localY, localZ, type);
    }
}
