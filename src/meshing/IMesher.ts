import { Chunk } from '../world/Chunk'; // Asumiendo que Chunk existe

export interface IMesher {
    /**
     * Genera la geometría de la malla para un chunk dado, considerando los chunks vecinos.
     * @param chunk El chunk actual para el que se generará la malla.
     * @param neighborChunks Un mapa de chunks vecinos, indexados por una clave de cadena (ej. "x,y,z").
     * @returns Un objeto que contiene arrays de posiciones, normales, UVs e índices.
     */
    generateMesh(chunk: Chunk, neighborChunks: Map<string, Chunk>): { positions: number[], normals: number[], uvs: number[], indices: number[] };
}