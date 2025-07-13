import * as THREE from 'three';
import { Chunk } from '../world/Chunk';

/**
 * Define la interfaz para un generador de mallas (mesher)
 * que convierte los datos de un chunk en una geometría de Three.js.
 */
export interface IMesher {
    /**
     * Genera la geometría 3D para un chunk dado.
     * @param chunk El chunk para el que se generará la malla.
     * @param neighborChunks Un objeto opcional con chunks vecinos para culling de caras.
     * @returns Una THREE.BufferGeometry que representa la malla del chunk.
     */
    generateMesh(chunk: Chunk, neighborChunks?: {
        nx?: Chunk; px?: Chunk; ny?: Chunk; py?: Chunk; nz?: Chunk; pz?: Chunk;
    }): THREE.BufferGeometry;
}