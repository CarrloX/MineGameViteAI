// src/world/Chunk.ts
import * as THREE from 'three'; // Asegúrate de importar THREE
import { CHUNK_SIZE } from '../utils/constants';
import type { BlockType } from './Block'; // Importa BlockType como type (si te da el error de verbatimModuleSyntax)
import { BlockType as BlockTypeValues } from './Block'; // Importa el objeto BlockType como BlockTypeValues

export class Chunk {
    public position: THREE.Vector3;
    public blockData: Uint8Array; // Almacenará los IDs de los bloques
    public lightData: Uint8Array; // Para los niveles de luz

    constructor(chunkX: number, chunkY: number, chunkZ: number) {
        this.position = new THREE.Vector3(chunkX, chunkY, chunkZ);
        this.blockData = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_SIZE);
        // Usar el valor de BlockType.AIR para inicializar
        this.blockData.fill(BlockTypeValues.AIR); // <--- Usamos BlockTypeValues aquí

        this.lightData = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_SIZE);
        this.lightData.fill(0);
    }

    // Helper para convertir coordenadas locales a índice 1D (YA DEBERÍAS TENER ESTO)
    private getIndex(x: number, y: number, z: number): number {
        return y * CHUNK_SIZE * CHUNK_SIZE + z * CHUNK_SIZE + x;
    }

    public getBlock(x: number, y: number, z: number): BlockType {
        if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) {
            return BlockTypeValues.AIR; // Usamos el valor
        }
        const index = this.getIndex(x, y, z);
        return this.blockData[index] as BlockType; // Castear al tipo
    }

    public setBlock(x: number, y: number, z: number, type: BlockType): void {
        if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) {
            return;
        }
        const index = this.getIndex(x, y, z);
        this.blockData[index] = type;
    }

    // ... Tus métodos getSkyLight, setSkyLight, getBlockLight, setBlockLight, getCombinedLight ...
    // Asegúrate de usar 'BlockTypeValues.AIR' en cualquier lugar donde necesites el valor numérico de AIR.
    // Y 'BlockType' donde necesites la verificación de tipo.
}