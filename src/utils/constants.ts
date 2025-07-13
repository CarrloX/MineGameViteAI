// src/utils/constants.ts
export const CHUNK_SIZE = 32; // O el tamaño de chunk que desees (ej. 16, 32)
export const WORLD_HEIGHT_CHUNKS = 8; // Altura del mundo en número de chunks (ej. 8 chunks de alto)
export const WORLD_HEIGHT_BLOCKS = CHUNK_SIZE * WORLD_HEIGHT_CHUNKS; // Altura del mundo en bloques
export const MAX_LIGHT_LEVEL = 15; // Nivel máximo de luz en Minecraft