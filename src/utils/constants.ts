// src/utils/constants.ts

export const CHUNK_SIZE = 16;
export const WORLD_HEIGHT_CHUNKS = 4; // Por ejemplo, 4 chunks de altura
export const RENDER_DISTANCE_CHUNKS = 2; // Renderizar 2 chunks alrededor del jugador

// =========================================================================
// CONSTANTES DE TEXTURAS (PARA EL ATLAS DE TEXTURAS)
// =========================================================================

// Tamaño en píxeles de cada baldosa de textura individual dentro del atlas
export const TILE_SIZE_PX = 16;

// Dimensiones del atlas de texturas en NÚMERO DE BALDOSAS
// Si tu atlas es 32x32px y cada baldosa es 16x16px, entonces (32/16)x(32/16) = 2x2 baldosas.
// Estas son las constantes que GreedyMesher.ts espera importar.
export const ATLAS_WIDTH_TILES = 2;
export const ATLAS_HEIGHT_TILES = 2;
