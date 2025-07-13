// src/world/Block.ts

/**
 * Enumeración de los tipos de bloques en el juego.
 * Cada bloque tendrá un ID numérico único.
 */
export const BlockType = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  WOOD: 4,
  LEAVES: 5,
  WATER: 6,
  // Puedes añadir más tipos de bloque aquí
} as const;

export type BlockType = (typeof BlockType)[keyof typeof BlockType];

/**
 * Define propiedades para cada tipo de bloque.
 * Esto será útil para el renderizado (texturas) y la lógica de juego (colisiones, propagación de luz).
 * Aplicando OCP, puedes extender esto fácilmente para nuevos bloques.
 */
export interface BlockDefinition {
  isOpaque: any;
  id: BlockType;
  name: string;
  isSolid: boolean;
  isTransparent: boolean;
  color: number; // Color hexadecimal para renderizado simple
}

// Mapa de definiciones de bloques para fácil acceso
export const BlockDefinitions: Record<BlockType, BlockDefinition> = {
  [BlockType.AIR]: {
    id: BlockType.AIR,
    name: "Air",
    isSolid: false,
    isTransparent: true,
    isOpaque: false,
    color: 0x000000,
  },
  [BlockType.GRASS]: {
    id: BlockType.GRASS,
    name: "Grass",
    isSolid: true,
    isTransparent: false,
    isOpaque: true,
    color: 0x00ff00,
  },
  [BlockType.DIRT]: {
    id: BlockType.DIRT,
    name: "Dirt",
    isSolid: true,
    isTransparent: false,
    isOpaque: true,
    color: 0x8b4513,
  },
  [BlockType.STONE]: {
    id: BlockType.STONE,
    name: "Stone",
    isSolid: true,
    isTransparent: false,
    isOpaque: true,
    color: 0x888888,
  },
  [BlockType.WOOD]: {
    id: BlockType.WOOD,
    name: "Wood",
    isSolid: true,
    isTransparent: false,
    isOpaque: true,
    color: 0xa0522d,
  },
  [BlockType.LEAVES]: {
    id: BlockType.LEAVES,
    name: "Leaves",
    isSolid: true,
    isTransparent: true,
    isOpaque: false,
    color: 0x228b22,
  },
  [BlockType.WATER]: {
    id: BlockType.WATER,
    name: "Water",
    isSolid: false,
    isTransparent: true,
    isOpaque: false,
    color: 0x0000ff,
  },
};

// Función auxiliar para obtener la definición de un bloque por su ID
export function getBlockDefinition(type: BlockType): BlockDefinition {
    const def = BlockDefinitions[type];
    if (def === undefined) { // Mejor chequeo para undefined
        console.warn(`Block definition not found for type: ${type}. Returning AIR definition.`);
        return BlockDefinitions[BlockType.AIR];
    }
    return def;
}
