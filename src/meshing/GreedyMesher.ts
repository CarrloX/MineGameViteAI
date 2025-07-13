// src/meshing/GreedyMesher.ts
import * as THREE from 'three';
import type { IMesher } from './IMesher';
import { Chunk } from '../world/Chunk';
import { BlockType, getBlockDefinition } from '../world/Block';
import { CHUNK_SIZE } from '../utils/constants'; // Asegúrate de que CHUNK_SIZE está bien definido aquí

// Definiciones de las caras de un bloque (con normales y UVs).
// Cada entrada en 'faces' describe una cara de un cubo unitario.
// Los índices están adaptados para formar dos triángulos por quad.
const faces = [
    // Left (-X) face
    {
        uv: [0, 1, 1, 1, 0, 0, 1, 0], // U0 V1, U1 V1, U0 V0, U1 V0 (origin bottom-left for texture mapping)
        normal: [-1, 0, 0],
        positions: [ // Coordenadas para un cubo unitario
            0, 0, 0,
            0, 1, 0,
            0, 0, 1,
            0, 1, 1,
        ],
        indices: [ 0, 1, 2, 2, 1, 3 ], // Indices para formar dos triángulos (0,1,2 y 2,1,3)
    },
    // Right (+X) face
    {
        uv: [0, 1, 1, 1, 0, 0, 1, 0],
        normal: [1, 0, 0],
        positions: [
            1, 0, 0,
            1, 1, 0,
            1, 0, 1,
            1, 1, 1,
        ],
        indices: [ 0, 2, 1, 2, 3, 1 ], // Indices ajustados para la orientación de la cara
    },
    // Bottom (-Y) face
    {
        uv: [0, 1, 1, 1, 0, 0, 1, 0],
        normal: [0, -1, 0],
        positions: [
            0, 0, 0,
            1, 0, 0,
            0, 0, 1,
            1, 0, 1,
        ],
        indices: [ 0, 2, 1, 2, 3, 1 ],
    },
    // Top (+Y) face
    {
        uv: [0, 1, 1, 1, 0, 0, 1, 0],
        normal: [0, 1, 0],
        positions: [
            0, 1, 0,
            1, 1, 0,
            0, 1, 1,
            1, 1, 1,
        ],
        indices: [ 0, 1, 2, 2, 1, 3 ],
    },
    // Back (-Z) face
    {
        uv: [0, 1, 1, 1, 0, 0, 1, 0],
        normal: [0, 0, -1],
        positions: [
            0, 0, 0,
            1, 0, 0,
            0, 1, 0,
            1, 1, 0,
        ],
        indices: [ 0, 2, 1, 2, 3, 1 ],
    },
    // Front (+Z) face
    {
        uv: [0, 1, 1, 1, 0, 0, 1, 0],
        normal: [0, 0, 1],
        positions: [
            0, 0, 1,
            1, 0, 1,
            0, 1, 1,
            1, 1, 1,
        ],
        indices: [ 0, 1, 2, 2, 1, 3 ],
    },
];

export class GreedyMesher implements IMesher {
    public generateMesh(chunk: Chunk, neighborChunks?: {
        nx?: Chunk; px?: Chunk; ny?: Chunk; py?: Chunk; nz?: Chunk; pz?: Chunk;
    }): THREE.BufferGeometry {
        const positions: number[] = [];
        const normals: number[] = [];
        const uvs: number[] = [];
        const indices: number[] = [];

        let numVertices = 0;

        // 'processed' se usa para evitar procesar el mismo bloque varias veces en un mismo pase
        const processed = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_SIZE).fill(0);

        // Iteramos sobre los tres ejes (dim 0=X, 1=Y, 2=Z)
        for (let dim = 0; dim < 3; ++dim) {
            const u = (dim + 1) % 3; // Eje 'U' (horizontal en el plano de corte)
            const v = (dim + 2) % 3; // Eje 'V' (vertical en el plano de corte)

            const x = [0, 0, 0]; // Coordenadas del bloque actual en el espacio 3D
            const q = [0, 0, 0]; // Vector unitario en la dirección del eje actual (dim)

            q[dim] = 1; // Por ejemplo, si dim=0 (X), q será [1,0,0]

            processed.fill(0); // Reiniciamos 'processed' para cada pase de eje

            // Recorremos el chunk a lo largo del eje 'dim'.
            // Empezamos en -1 y vamos hasta CHUNK_SIZE para incluir las caras de los bordes del chunk,
            // que necesitan ver los bloques de los chunks vecinos.
            for (x[dim] = -1; x[dim] < CHUNK_SIZE; ) {

                // Creamos una "máscara" 2D para la rebanada actual.
                // Almacena el ID del bloque (o su negativo para indicar la cara opuesta)
                // si la cara es visible, o 0 si no lo es.
                const mask = new Int8Array(CHUNK_SIZE * CHUNK_SIZE).fill(0);

                // Construimos la máscara para esta rebanada
                for (x[v] = 0; x[v] < CHUNK_SIZE; ++x[v]) {
                    for (x[u] = 0; x[u] < CHUNK_SIZE; ++x[u]) {
                        // Si el bloque ya fue procesado en esta dirección (en el mismo pase del eje actual), saltarlo
                        // Esto es para Greedy Meshing: una vez que una cara es parte de un quad grande, no la procesamos de nuevo.
                        // Solo aplicable si x[dim] está dentro del chunk actual.
                        if (x[dim] >= 0 && processed[this.getChunkBlockIndex(x[0], x[1], x[2])] !== 0) {
                            continue;
                        }

                        // Obtener el tipo de bloque actual (A) y su definición
                        const blockA = this.getBlockFromWorld(
                            chunk, neighborChunks,
                            x[0], x[1], x[2]
                        );
                        const defA = getBlockDefinition(blockA);

                        // Obtener el tipo de bloque adyacente (B) en la dirección del eje 'dim'
                        const blockB = this.getBlockFromWorld(
                            chunk, neighborChunks,
                            x[0] + q[0], x[1] + q[1], x[2] + q[2]
                        );
                        const defB = getBlockDefinition(blockB);

                        // Lógica de Culling de Caras:
                        // Una cara es visible si hay una diferencia de opacidad entre el bloque A y el bloque B.
                        if (defA.isOpaque && !defB.isOpaque) {
                            // Bloque A es opaco, Bloque B es transparente o aire: dibujar la cara positiva de A
                            mask[x[v] * CHUNK_SIZE + x[u]] = blockA; // Almacenar el ID del bloque A
                        } else if (!defA.isOpaque && defB.isOpaque) {
                            // Bloque A es transparente o aire, Bloque B es opaco: dibujar la cara negativa de B
                            mask[x[v] * CHUNK_SIZE + x[u]] = -blockB; // Almacenar el ID del bloque B (negativo para indicar la dirección)
                        } else {
                            // Ambos bloques son opacos, ambos transparentes, o A transparente y B aire: no dibujar la cara
                            mask[x[v] * CHUNK_SIZE + x[u]] = 0;
                        }
                    }
                }

                // Ahora, recorremos la máscara para encontrar rectángulos de caras fusionables.
                for (x[v] = 0; x[v] < CHUNK_SIZE; ++x[v]) {
                    let width = 1; // Ancho del rectángulo en dirección U
                    for (x[u] = 0; x[u] < CHUNK_SIZE; ) {
                        const maskValue = mask[x[v] * CHUNK_SIZE + x[u]];

                        // Si hay una cara para dibujar en esta posición Y (importante para los bordes)
                        // no hemos excedido el límite del chunk en la dimensión actual O la cara es una cara negativa.
                        if (maskValue !== 0 && (x[dim] < CHUNK_SIZE || maskValue < 0)) {
                            // **CORRECCIÓN:** Declarar 'width' y 'height' con 'let' dentro de este scope
                            width = 1;
                            let height = 1;

                            // Encontrar el ancho del rectángulo (en dirección U)
                            for (; x[u] + width < CHUNK_SIZE &&
                                   mask[x[v] * CHUNK_SIZE + x[u] + width] === maskValue;
                                   ++width) {}

                            // Encontrar la altura del rectángulo (en dirección V)
                            for (; x[v] + height < CHUNK_SIZE; ++height) {
                                let k = 0; // Declarar 'k' dentro del scope
                                for (; k < width; ++k) {
                                    // Si algún bloque en la fila actual de 'width' no coincide con 'maskValue',
                                    // el rectángulo no puede extenderse más en altura.
                                    if (mask[ (x[v] + height) * CHUNK_SIZE + x[u] + k ] !== maskValue) {
                                        break;
                                    }
                                }
                                if (k < width) break; // Si el bucle interno se rompió, también lo hace el bucle de altura
                            }

                            // --- Hemos encontrado un rectángulo de tamaño width x height ---
                            // Ahora generamos la geometría para esta cara fusionada.
                            const blockId = Math.abs(maskValue); // El ID del bloque de la cara
                            // Determinar qué cara de las predefinidas usar (Left/Right, Bottom/Top, Back/Front)
                            const faceIndex = (maskValue > 0) ? dim * 2 + 1 : dim * 2; // Cara positiva o negativa
                            const side = faces[faceIndex]; // Obtener la definición de la cara

                            const vertexOffset = numVertices; // Offset para los índices
                            // Añadir vértices y normales para el quad fusionado
                            // Un quad tiene 4 vértices
                            for (let i = 0; i < 4; ++i) {
                                const px = side.positions[i * 3 + 0];
                                const py = side.positions[i * 3 + 1];
                                const pz = side.positions[i * 3 + 2];

                                // Calcular las posiciones finales del vértice para el quad fusionado.
                                // La lógica es:
                                // El punto en el eje 'dim' es x[dim] (o x[dim]+1 si es una cara positiva)
                                // Los puntos en los ejes 'u' y 'v' se escalan por width y height.
                                const P = [0, 0, 0];
                                P[dim] = x[dim] + (maskValue > 0 ? 1 : 0); // Posición del plano de la cara
                                P[u] = x[u] + px * width; // El px de la definición de la cara es 0 o 1
                                P[v] = x[v] + py * height; // El py de la definición de la cara es 0 o 1

                                positions.push(P[0], P[1], P[2]);
                                normals.push(...side.normal); // La normal es la misma para toda la cara
                            }

                            // Añadir UVs (asumen un atlas de texturas, por ahora solo cubren 0-1)
                            for (let i = 0; i < side.uv.length; i += 2) {
                                uvs.push(side.uv[i + 0], side.uv[i + 1]);
                            }

                            // Añadir índices
                            indices.push(
                                vertexOffset + side.indices[0],
                                vertexOffset + side.indices[1],
                                vertexOffset + side.indices[2],
                                vertexOffset + side.indices[3],
                                vertexOffset + side.indices[4],
                                vertexOffset + side.indices[5],
                            );
                            numVertices += 4; // Cada cara es un quad, 4 vértices

                            // Marcar los bloques cubiertos por este rectángulo como "procesados"
                            // Esto es crucial para que no se vuelvan a procesar en pases futuros.
                            for (let h = 0; h < height; ++h) {
                                for (let w = 0; w < width; ++w) {
                                    // Marcar el bloque en la máscara como 0 para esta rebanada
                                    mask[ (x[v] + h) * CHUNK_SIZE + x[u] + w ] = 0;

                                    // Marcar el bloque original como procesado en el array 'processed'
                                    // Solo si las coordenadas están dentro del chunk actual.
                                    const currentBlockCoords = [...x]; // Copia las coordenadas iniciales
                                    currentBlockCoords[u] = x[u] + w; // Ajusta U para el bloque actual en el rectángulo
                                    currentBlockCoords[v] = x[v] + h; // Ajusta V para el bloque actual en el rectángulo

                                    if (currentBlockCoords[dim] >= 0 && currentBlockCoords[dim] < CHUNK_SIZE) {
                                        processed[this.getChunkBlockIndex(
                                            currentBlockCoords[0],
                                            currentBlockCoords[1],
                                            currentBlockCoords[2]
                                        )] = 1;
                                    }
                                }
                            }
                        }
                        // Avanzar en la dirección U por el ancho del rectángulo que acabamos de procesar
                        // Si no se procesó ningún rectángulo, 'width' será 1 (el incremento por defecto)
                        x[u] += width; // <-- Esta es la línea que está dando problemas si no está la declaración arriba
                    }
                }
                x[dim]++; // Pasar al siguiente plano en la dirección 'dim'
            }

            // Crear la BufferGeometry de Three.js
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
            geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
            geometry.setIndex(indices);
            geometry.computeVertexNormals(); // Calcular las normales de los vértices (puede ser útil para iluminación)

            return geometry;
        }

        // Si el bucle for (let dim = 0; dim < 3; ++dim) no produce geometría,
        // necesitamos un retorno predeterminado. Esto solo debería ocurrir si
        // el chunk está completamente vacío o si hay un error lógico que impide
        // la generación de caras. Idealmente, esto no se alcanzaría si hay bloques.
        // Pero para satisfacer a TypeScript con todas las rutas de código:
        return new THREE.BufferGeometry();
    }

    /**
     * Helper para obtener el índice 1D de un bloque en un chunk a partir de sus coordenadas 3D.
     */
    private getChunkBlockIndex(x: number, y: number, z: number): number {
        return y * CHUNK_SIZE * CHUNK_SIZE + z * CHUNK_SIZE + x;
    }

    /**
     * Obtiene el tipo de bloque en coordenadas locales, teniendo en cuenta los chunks vecinos.
     * Es esencial para el culling de caras en los bordes del chunk.
     */
    private getBlockFromWorld(
        chunk: Chunk,
        neighborChunks: { nx?: Chunk; px?: Chunk; ny?: Chunk; py?: Chunk; nz?: Chunk; pz?: Chunk; } | undefined,
        x: number, y: number, z: number
    ): BlockType {
        // Si las coordenadas están dentro del chunk actual
        if (x >= 0 && x < CHUNK_SIZE && y >= 0 && y < CHUNK_SIZE && z >= 0 && z < CHUNK_SIZE) {
            return chunk.getBlock(x, y, z);
        }

        // Corrección: neighbors siempre es un objeto
        const neighbors = neighborChunks || {};

        let neighbor: Chunk | undefined;
        if (x < 0) {
            neighbor = neighbors.nx; x += CHUNK_SIZE;
        } else if (x >= CHUNK_SIZE) {
            neighbor = neighbors.px; x -= CHUNK_SIZE;
        } else if (y < 0) {
            neighbor = neighbors.ny; y += CHUNK_SIZE;
        } else if (y >= CHUNK_SIZE) {
            neighbor = neighbors.py; y -= CHUNK_SIZE;
        } else if (z < 0) {
            neighbor = neighbors.nz; z += CHUNK_SIZE;
        } else if (z >= CHUNK_SIZE) {
            neighbor = neighbors.pz; z -= CHUNK_SIZE;
        }

        if (neighbor) {
            // Si encontramos un vecino, obtenemos el bloque de él (con las coordenadas locales ajustadas)
            return neighbor.getBlock(x, y, z);
        }

        // Si no hay chunk vecino cargado o estamos muy fuera de los límites conocidos, asumimos aire
        return BlockType.AIR;
    }
}