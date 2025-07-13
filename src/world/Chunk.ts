// src/world/Chunk.ts
import * as THREE from 'three';
import { CHUNK_SIZE } from '../utils/constants';
// --- ¡MODIFICADO AQUÍ! Importa BlockType y BlockTypeValue como tipos, y BlockType como valor ---
import { BlockType, type BlockTypeValue } from './Block'; // Importa BlockType como valor (el objeto) y BlockTypeValue como tipo

export class Chunk {
    public x: number; // Coordenada X del chunk en el mundo
    public y: number; // Coordenada Y del chunk en el mundo
    public z: number; // Coordenada Z del chunk en el mundo

    public position: THREE.Vector3;
    public blockData: Uint8Array; // Almacenará los IDs de los bloques
    public lightData: Uint8Array; // Para los niveles de luz

    constructor(chunkX: number, chunkY: number, chunkZ: number) {
        this.x = chunkX; // Asegúrate de inicializar estas propiedades
        this.y = chunkY;
        this.z = chunkZ;

        this.position = new THREE.Vector3(chunkX, chunkY, chunkZ);
        this.blockData = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_SIZE);
        // Usar el valor de BlockType.AIR para inicializar
        this.blockData.fill(BlockType.AIR); // <--- Usamos BlockType (el valor) aquí

        this.lightData = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_SIZE);
        this.lightData.fill(0);
    }

    // Helper para convertir coordenadas locales a índice 1D
    private getIndex(x: number, y: number, z: number): number {
        return y * CHUNK_SIZE * CHUNK_SIZE + z * CHUNK_SIZE + x;
    }

    // --- ¡MODIFICADO AQUÍ! Tipo de retorno BlockTypeValue ---
    public getBlock(x: number, y: number, z: number): BlockTypeValue {
        if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) {
            return BlockType.AIR; // <--- Usamos BlockType (el valor) aquí
        }
        const index = this.getIndex(x, y, z);
        return this.blockData[index] as BlockTypeValue; // <--- Castear al tipo BlockTypeValue
    }

    // --- ¡MODIFICADO AQUÍ! Tipo de parámetro 'type' es BlockTypeValue ---
    public setBlock(x: number, y: number, z: number, type: BlockTypeValue): void {
        if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) {
            return;
        }
        const index = this.getIndex(x, y, z);
        this.blockData[index] = type;
    }

    // Puedes añadir un método para obtener todos los bloques si es necesario
    getBlocksData(): Uint8Array {
        return this.blockData;
    }
}
