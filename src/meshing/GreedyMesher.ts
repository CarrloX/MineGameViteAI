// src/meshing/GreedyMesher.ts

import { Chunk } from '../world/Chunk';
import { BlockType, getBlockDefinition } from '../world/Block';
import { CHUNK_SIZE } from '../utils/constants';
import type { IMesher } from './IMesher'; // Importa la interfaz IMesher
 // Importa la interfaz IMesher

// =========================================================================
// CONSTANTES GLOBALES O DE MÓDULO PARA EL MESHER
// =========================================================================

// DIMS define el mapeo de los ejes U y V para cada dimensión principal (X, Y, Z).
// DIMS[dim] = [u_axis_index, v_axis_index]
const DIMS = [
    [1, 2], // Para el eje X (dim 0), U es el eje Y (1), V es el eje Z (2)
    [0, 2], // Para el eje Y (dim 1), U es el eje X (0), V es el eje Z (2)
    [0, 1]  // Para el eje Z (dim 2), U es el eje X (0), V es el eje Y (1)
];

// Definiciones de las caras de un cubo estándar (en el orden: -X, +X, -Y, +Y, -Z, +Z)
// Contiene las posiciones relativas de los vértices, UVs y normales para construir quads.
const faces = [
    // Cara Negativa X (-X, Left Face)
    {
        positions: [
            0, 0, 0, // 0
            0, 0, 1, // 1
            0, 1, 0, // 2
            0, 1, 1, // 3
        ],
        uv: [
            0, 0,
            1, 0,
            0, 1,
            1, 1,
        ],
        normal: [-1, 0, 0], // Normal apuntando a la izquierda
        indices: [0, 1, 2, 2, 1, 3], // Índices para 2 triángulos (triangulación de un quad)
    },
    // Cara Positiva X (+X, Right Face)
    {
        positions: [
            1, 0, 0, // 0
            1, 1, 0, // 1
            1, 0, 1, // 2
            1, 1, 1, // 3
        ],
        uv: [
            0, 0,
            0, 1,
            1, 0,
            1, 1,
        ],
        normal: [1, 0, 0], // Normal apuntando a la derecha
        indices: [0, 1, 2, 2, 1, 3],
    },
    // Cara Negativa Y (-Y, Bottom Face)
    {
        positions: [
            0, 0, 0, // 0
            1, 0, 0, // 1
            0, 0, 1, // 2
            1, 0, 1, // 3
        ],
        uv: [
            0, 0,
            1, 0,
            0, 1,
            1, 1,
        ],
        normal: [0, -1, 0], // Normal apuntando hacia abajo
        indices: [0, 1, 2, 2, 1, 3],
    },
    // Cara Positiva Y (+Y, Top Face)
    {
        positions: [
            0, 1, 0, // 0
            0, 1, 1, // 1
            1, 1, 0, // 2
            1, 1, 1, // 3
        ],
        uv: [
            0, 0,
            0, 1,
            1, 0,
            1, 1,
        ],
        normal: [0, 1, 0], // Normal apuntando hacia arriba
        indices: [0, 1, 2, 2, 1, 3],
    },
    // Cara Negativa Z (-Z, Back Face)
    {
        positions: [
            0, 0, 0, // 0
            1, 0, 0, // 1
            0, 1, 0, // 2
            1, 1, 0, // 3
        ],
        uv: [
            0, 0,
            1, 0,
            0, 1,
            1, 1,
        ],
        normal: [0, 0, -1], // Normal apuntando hacia atrás
        indices: [0, 1, 2, 2, 1, 3],
    },
    // Cara Positiva Z (+Z, Front Face)
    {
        positions: [
            0, 0, 1, // 0
            0, 1, 1, // 1
            1, 0, 1, // 2
            1, 1, 1, // 3
        ],
        uv: [
            0, 0,
            0, 1,
            1, 0,
            1, 1,
        ],
        normal: [0, 0, 1], // Normal apuntando hacia adelante
        indices: [0, 1, 2, 2, 1, 3],
    },
];

// =========================================================================
// CLASE GREEDYMESHER
// =========================================================================

export class GreedyMesher implements IMesher {

    private processed = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_SIZE);

    constructor() { }

    /**
     * Helper para obtener el índice lineal de un bloque dentro del chunk.
     * Asume que x, y, z son coordenadas locales del chunk (0 a CHUNK_SIZE-1).
     * @param x Coordenada X local del chunk.
     * @param y Coordenada Y local del chunk.
     * @param z Coordenada Z local del chunk.
     * @returns El índice lineal en un array 1D. Retorna -1 si las coordenadas están fuera de los límites del chunk.
     */
    private getChunkBlockIndex(x: number, y: number, z: number): number {
        if (x < 0 || x >= CHUNK_SIZE ||
            y < 0 || y >= CHUNK_SIZE ||
            z < 0 || z >= CHUNK_SIZE) { // <-- ¡Corregido! Era CHK_SIZE
            return -1;
        }
        // El orden de las coordenadas en tu getIndex de Chunk.ts es y * S^2 + z * S + x
        return y * CHUNK_SIZE * CHUNK_SIZE + z * CHUNK_SIZE + x;
    }

    /**
     * Obtiene el tipo de bloque en una posición de coordenada global,
     * consultando el chunk actual o sus chunks vecinos.
     * @param currentChunk El chunk principal para el que se está generando la malla.
     * @param neighborChunks Un mapa de chunks vecinos, donde la clave es una cadena como "chunkX,chunkY,chunkZ".
     * @param wx Coordenada X global.
     * @param wy Coordenada Y global.
     * @param wz Coordenada Z global.
     * @returns El BlockType del bloque en esa posición.
     */
    private getBlockFromWorld(
        currentChunk: Chunk,
        neighborChunks: Map<string, Chunk>,
        wx: number, wy: number, wz: number
    ): BlockType {
        // Calcular las coordenadas locales del bloque dentro del CHUNK_SIZE x CHUNK_SIZE x CHUNK_SIZE
        // Esto es necesario para la llamada a `currentChunk.getBlock(localX, localY, localZ)`
        const localX_current = wx - (currentChunk.position.x * CHUNK_SIZE);
        const localY_current = wy - (currentChunk.position.y * CHUNK_SIZE);
        const localZ_current = wz - (currentChunk.position.z * CHUNK_SIZE);

        // Si las coordenadas están dentro del chunk actual
        if (localX_current >= 0 && localX_current < CHUNK_SIZE &&
            localY_current >= 0 && localY_current < CHUNK_SIZE &&
            localZ_current >= 0 && localZ_current < CHUNK_SIZE) {
            return currentChunk.getBlock(localX_current, localY_current, localZ_current);
        } else {
            // Si las coordenadas están fuera del chunk actual, calcular el chunk vecino.
            // Necesitamos las coordenadas del CHUNK al que pertenece (wx, wy, wz).
            const targetChunkX = Math.floor(wx / CHUNK_SIZE);
            const targetChunkY = Math.floor(wy / CHUNK_SIZE); // <-- ¡Corregido! Era CHS_SIZE
            const targetChunkZ = Math.floor(wz / CHUNK_SIZE);

            // Calcular las coordenadas LOCALES dentro del CHUNK_SIZE x CHUNK_SIZE x CHUNK_SIZE
            // del chunk de destino. Usamos el operador % para obtener el resto.
            // Se agrega CHUNK_SIZE y se vuelve a aplicar % para manejar correctamente los valores negativos.
            const localX_target = (wx % CHUNK_SIZE + CHUNK_SIZE) % CHUNK_SIZE;
            const localY_target = (wy % CHUNK_SIZE + CHUNK_SIZE) % CHUNK_SIZE;
            const localZ_target = (wz % CHUNK_SIZE + CHUNK_SIZE) % CHUNK_SIZE;

            // Construir la clave para buscar en el mapa de chunks vecinos
            const neighborKey = `${targetChunkX},${targetChunkY},${targetChunkZ}`;

            const neighbor = neighborChunks.get(neighborKey);
            if (neighbor) {
                return neighbor.getBlock(localX_target, localY_target, localZ_target);
            } else {
                // Si no se encuentra el chunk vecino (ej. no está cargado o es el "vacío" del mundo)
                return BlockType.AIR; // Asume que es aire o un bloque "transparente" por defecto
            }
        }
    }


    /**
     * Genera la geometría de la malla (posiciones, normales, UVs, índices) para un chunk dado,
     * utilizando el algoritmo Greedy Meshing para optimizar el número de polígonos.
     * Considera los chunks vecinos para el culling de caras en los bordes.
     * @param chunk El chunk actual para el que se generará la malla.
     * @param neighborChunks Un mapa de chunks vecinos, indexados por una clave (ej. "x,y,z").
     * @returns Un objeto que contiene arrays de posiciones, normales, UVs e índices para la malla.
     */
    public generateMesh(chunk: Chunk, neighborChunks: Map<string, Chunk>): { positions: number[], normals: number[], uvs: number[], indices: number[] } {
        // Inicialización de arrays para almacenar los datos de la malla
        let positions: number[] = [];
        let normals: number[] = [];
        let uvs: number[] = [];
        let indices: number[] = [];
        let numVertices = 0; // Contador de vértices agregados
        let numQuadsGenerated = 0; // Contador de quads generados

        // Vector auxiliar para las coordenadas del bloque actual (x, y, z) en el espacio del mundo.
        // Se reutiliza en los bucles para eficiencia.
        // IMPORTANTE: Estas 'x' son coordenadas relativas al origen del chunk 0,0,0
        // pero se ajustan en la lógica de getBlockFromWorld para ser coordenadas de mundo.
        let x: [number, number, number] = [0, 0, 0];

        // Itera sobre cada dimensión (X, Y, Z)
        // Se realizan 3 pases, uno por cada eje principal.
        for (let dim = 0; dim < 3; ++dim) {
            // Configura los ejes u y v (perpendiculares a la dimensión actual)
            const u = DIMS[dim][0]; // Índice del eje U
            const v = DIMS[dim][1]; // Índice del eje V

            // q representa el vector de offset para el bloque vecino en la dirección de la dimensión actual.
            // Ejemplo: si dim=0 (X), q=[1,0,0] para obtener el bloque a la derecha.
            const q = [0, 0, 0];
            q[dim] = 1;

            // Reinicia el array `processed` para esta dimensión.
            // Esto es crucial porque los quads solo se fusionan en un único pase por dimensión.
            // Las caras que ya fueron parte de un quad en una dimensión (ej. X) no deben ser
            // procesadas de nuevo en la misma dirección, pero sí en otras direcciones (ej. Y o Z).

            // Itera a través de las "rebanadas" del chunk a lo largo de la dimensión actual.
            // Se itera desde -1 hasta CHUNK_SIZE para incluir los bordes del chunk
            // y permitir la comparación con bloques "fuera" del chunk (aire o chunks vecinos).
            for (x[dim] = -1; x[dim] < CHUNK_SIZE + 1; ++x[dim]) {

                this.processed.fill(0);

                // Creamos una "máscara" 2D para la rebanada actual.
                // Almacena el ID del bloque (o su negativo para indicar la cara opuesta)
                // si la cara es visible, o 0 si no lo es.
                // Se reinicia para cada rebanada.
                const mask = new Int8Array(CHUNK_SIZE * CHUNK_SIZE).fill(0);

                // Construimos la máscara para esta rebanada (una "imagen" 2D de las caras visibles).
                for (x[v] = 0; x[v] < CHUNK_SIZE; ++x[v]) {
                    for (x[u] = 0; x[u] < CHUNK_SIZE; ++x[u]) {

                        // Ajustamos las coordenadas `x` para que sean coordenadas de MUNDO antes de pasarlas a getBlockFromWorld.
                        // La `x` actual en este bucle es la coordenada local del chunk (0 a CHUNK_SIZE-1)
                        // o -1/CHUNK_SIZE para los bordes.
                        const worldX = x[0] + chunk.position.x * CHUNK_SIZE;
                        const worldY = x[1] + chunk.position.y * CHUNK_SIZE;
                        const worldZ = x[2] + chunk.position.z * CHUNK_SIZE;

                        // Obtener el índice del bloque actual en el array `processed`.
                        // Solo se marcan como procesados los bloques *dentro* del chunk.

                        // Si el bloque ya fue procesado en esta dirección (en el mismo pase del eje actual), saltarlo.
                        // Esto evita que las caras ya fusionadas se procesen de nuevo.
                        // Solo aplica si la coordenada x[dim] está dentro del chunk actual y el índice es válido.

                        // Obtener el tipo de bloque actual (A) y su definición.
                        const blockA = this.getBlockFromWorld(
                            chunk, neighborChunks,
                            worldX, worldY, worldZ // Usamos coordenadas de MUNDO aquí
                        );
                        const defA = getBlockDefinition(blockA);

                        // Obtener el tipo de bloque adyacente (B) en la dirección del eje 'dim'.
                        const blockB = this.getBlockFromWorld(
                            chunk, neighborChunks,
                            worldX + q[0], worldY + q[1], worldZ + q[2] // Usamos coordenadas de MUNDO aquí
                        );
                        const defB = getBlockDefinition(blockB);

                        // Lógica de Culling de Caras:
                        // Una cara es visible si hay una diferencia de opacidad entre el bloque A y el bloque B.
                        if (defA.isOpaque && !defB.isOpaque) {
                            mask[x[v] * CHUNK_SIZE + x[u]] = blockA;
                        } else if (!defA.isOpaque && defB.isOpaque) {
                            mask[x[v] * CHUNK_SIZE + x[u]] = -blockB;
                        } else {
                            mask[x[v] * CHUNK_SIZE + x[u]] = 0;
                        }

                        // --- MASK_BUILD_DEBUG LOGS ---
                        if (mask[x[v] * CHUNK_SIZE + x[u]] !== 0) {
                            console.log(`MASK_BUILD_DEBUG: dim=${dim} (axis ${['X','Y','Z'][dim]}), slice_pos_local=${x[dim]}`);
                            console.log(`  coords(world): [${worldX},${worldY},${worldZ}] (blockA: ID ${blockA})`);
                            console.log(`  coords(world+q): [${worldX+q[0]},${worldY+q[1]},${worldZ+q[2]}] (blockB: ID ${blockB})`);
                            console.log(`  defA.isOpaque=${defA.isOpaque}, defB.isOpaque=${defB.isOpaque}`);
                            console.log(`  maskValue=${mask[x[v] * CHUNK_SIZE + x[u]]}`);
                        }
                        // --- FIN MASK_BUILD_DEBUG LOGS ---
                    }
                }

                // Ahora, recorremos la máscara 2D para encontrar rectángulos de caras fusionables.
                for (x[v] = 0; x[v] < CHUNK_SIZE; ++x[v]) {
                    let width = 1; // Ancho del rectángulo encontrado
                    for (x[u] = 0; x[u] < CHUNK_SIZE; ) {
                        const maskValue = mask[x[v] * CHUNK_SIZE + x[u]];

                        if (maskValue !== 0) {
                            width = 1;
                            let height = 1;

                            for (; x[u] + width < CHUNK_SIZE &&
                                   mask[x[v] * CHUNK_SIZE + x[u] + width] === maskValue;
                                   ++width) {}

                            for (; x[v] + height < CHUNK_SIZE; ++height) {
                                let k = 0;
                                for (; k < width; ++k) {
                                    if (mask[ (x[v] + height) * CHUNK_SIZE + x[u] + k ] !== maskValue) {
                                        break;
                                    }
                                }
                                if (k < width) break;
                            }

                            const blockId = Math.abs(maskValue);
                            const faceIndex = (maskValue > 0) ? dim * 2 + 1 : dim * 2;
                            const side = faces[faceIndex];

                            const vertexOffset = numVertices;

                            // Los logs de depuración del mesher
                            console.log(`MESHER_DEBUG: Found quad at local_chunk_coords=[${x[0]},${x[1]},${x[2]}] (dim=${dim}, u=${u}, v=${v}) with maskValue=${maskValue}, width=${width}, height=${height}`);

                            numQuadsGenerated++; // <-- INCREMENTA EL CONTADOR DE QUADS AQUÍ

                            // Añadir vértices y normales para el quad fusionado
                            for (let i = 0; i < 4; ++i) {
                                // Obtener las posiciones relativas del vértice de la definición de la cara.
                                // Ya no necesitamos almacenar en variables intermedias si no se usan directamente.
                                // const vertexRelativeX = side.positions[i * 3 + 0]; // ELIMINAR
                                // const vertexRelativeY = side.positions[i * 3 + 1]; // ELIMINAR
                                // const vertexRelativeZ = side.positions[i * 3 + 2]; // ELIMINAR

                                // P son las coordenadas en el espacio LOCAL del CHUNK para el vértice
                                const P = [0, 0, 0];

                                // 1. La coordenada en el eje 'dim' (profundidad de la cara)
                                P[dim] = x[dim] + (maskValue > 0 ? 1 : 0);

                                // 2. Las coordenadas en los ejes 'u' y 'v' (dimensiones de la cara, paralelas al plano)
                                // Accedemos directamente a `side.positions` usando los índices `u` y `v`.
                                P[u] = x[u] + side.positions[i * 3 + u] * width;
                                P[v] = x[v] + side.positions[i * 3 + v] * height;

                                positions.push(
                                    P[0] + chunk.position.x * CHUNK_SIZE,
                                    P[1] + chunk.position.y * CHUNK_SIZE,
                                    P[2] + chunk.position.z * CHUNK_SIZE
                                );
                                normals.push(...side.normal);
                            }

                            // Añadir UVs
                            // Las UVs deben ser ajustadas por el width y height del quad fusionado.
                            // Esto asume que 0,0 a 1,1 es la textura completa para una cara de bloque.
                            // Si tienes un atlas, esto necesitará ser más complejo.
                            // Por ahora, simplemente escalamos las UVs estándar por el tamaño del quad.
                            const baseUVs = side.uv; // UVs base (0-1) para un bloque 1x1
                            uvs.push(
                                baseUVs[0],             baseUVs[1],
                                baseUVs[2] * width,     baseUVs[3],
                                baseUVs[4],             baseUVs[5] * height,
                                baseUVs[6] * width,     baseUVs[7] * height
                            );

                            // Añadir índices
                            indices.push(
                                vertexOffset + side.indices[0],
                                vertexOffset + side.indices[1],
                                vertexOffset + side.indices[2],
                                vertexOffset + side.indices[3],
                                vertexOffset + side.indices[4],
                                vertexOffset + side.indices[5],
                            );
                            numVertices += 4;

                            // Marcar los bloques cubiertos por este rectángulo como "procesados"
                            for (let h = 0; h < height; ++h) {
                                for (let w = 0; w < width; ++w) {
                                    mask[ (x[v] + h) * CHUNK_SIZE + x[u] + w ] = 0;

                                    const currentBlockCoords: [number, number, number] = [...x];
                                    currentBlockCoords[u] = x[u] + w;
                                    currentBlockCoords[v] = x[v] + h;

                                    if (currentBlockCoords[dim] >= 0 && currentBlockCoords[dim] < CHUNK_SIZE) {
                                        const processedIndex = this.getChunkBlockIndex(
                                            currentBlockCoords[0],
                                            currentBlockCoords[1],
                                            currentBlockCoords[2]
                                        );
                                        if (processedIndex !== -1) {
                                            this.processed[processedIndex] = 1;
                                        }
                                    }
                                }
                            }
                        }
                        x[u] += Math.max(1, width);
                    }
                }
            }
        }
        console.log(`MESHER_SUMMARY: Total quads generated: ${numQuadsGenerated}`); // <-- LOG FINAL
        return { positions, normals, uvs, indices };
    }
}