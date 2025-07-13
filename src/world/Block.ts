// src/world/Block.ts

/**
 * Define los tipos de bloques como un objeto constante.
 * Esto evita los problemas de transpilación con 'const enum'
 * y 'isolatedModules', mientras sigue proporcionando valores con nombre.
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
} as const; // 'as const' hace que los valores sean literales de tipo (0, 1, etc.)

// Definir un tipo para las claves de BlockType (ej. "AIR", "GRASS")
export type BlockTypeName = keyof typeof BlockType;

// Definir un tipo para los valores numéricos de BlockType (ej. 0, 1, 2)
export type BlockTypeValue = typeof BlockType[BlockTypeName];

/**
 * Define propiedades para cada tipo de bloque.
 */
export interface BlockDefinition {
    id: BlockTypeValue; // Usamos BlockTypeValue para el ID
    name: string;
    isOpaque: boolean;
    isSolid: boolean;
    isTransparent: boolean;
    isLiquid: boolean;
    isFlammable: boolean;
    LightLevel: number;
    color: number;
    textures: {
        top: [number, number];
        side: [number, number];
        bottom: [number, number];
    };
}

export const BlockDefinitions: Record<BlockTypeValue, BlockDefinition> = { // <-- Usamos BlockTypeValue aquí
    [BlockType.AIR]: {
        id: BlockType.AIR,
        name: "Air",
        isSolid: false,
        isTransparent: true,
        isOpaque: false,
        isLiquid: false,
        isFlammable: false,
        LightLevel: 0,
        color: 0x000000,
        textures: {
            top: [0, 0],
            side: [0, 0],
            bottom: [0, 0],
        },
    },
    [BlockType.GRASS]: {
        id: BlockType.GRASS,
        name: "Grass",
        isSolid: true,
        isTransparent: false,
        isOpaque: true,
        isLiquid: false,
        isFlammable: false,
        LightLevel: 0,
        color: 0x00ff00,
        textures: {
            top: [0, 0],
            side: [1, 0],
            bottom: [0, 1],
        },
    },
    [BlockType.DIRT]: {
        id: BlockType.DIRT,
        name: "Dirt",
        isSolid: true,
        isTransparent: false,
        isOpaque: true,
        isLiquid: false,
        isFlammable: false,
        LightLevel: 0,
        color: 0x8b4513,
        textures: {
            top: [0, 1],
            side: [0, 1],
            bottom: [0, 1],
        },
    },
    [BlockType.STONE]: {
        id: BlockType.STONE,
        name: "Stone",
        isSolid: true,
        isTransparent: false,
        isOpaque: true,
        isLiquid: false,
        isFlammable: false,
        LightLevel: 0,
        color: 0x888888,
        textures: {
            top: [1, 1],
            side: [1, 1],
            bottom: [1, 1],
        },
    },
    [BlockType.WOOD]: {
        id: BlockType.WOOD,
        name: "Wood",
        isSolid: true,
        isTransparent: false,
        isOpaque: true,
        isLiquid: false,
        isFlammable: true,
        LightLevel: 0,
        color: 0xa0522d,
        textures: {
            top: [0, 0],
            side: [0, 0],
            bottom: [0, 0],
        },
    },
    [BlockType.LEAVES]: {
        id: BlockType.LEAVES,
        name: "Leaves",
        isSolid: true,
        isTransparent: true,
        isOpaque: false,
        isLiquid: false,
        isFlammable: true,
        LightLevel: 0,
        color: 0x228b22,
        textures: {
            top: [0, 0],
            side: [0, 0],
            bottom: [0, 0],
        },
    },
    [BlockType.WATER]: {
        id: BlockType.WATER,
        name: "Water",
        isSolid: false,
        isTransparent: true,
        isOpaque: false,
        isLiquid: true,
        isFlammable: false,
        LightLevel: 0,
        color: 0x0000ff,
        textures: {
            top: [0, 0],
            side: [0, 0],
            bottom: [0, 0],
        },
    },
};

/**
 * Obtiene la definición de un tipo de bloque dado su ID.
 * @param type El ID del tipo de bloque.
 * @returns La definición del bloque o una definición de AIR por defecto si no se encuentra.
 */
export function getBlockDefinition(type: BlockTypeValue): BlockDefinition { // <-- Usamos BlockTypeValue aquí
    const def = BlockDefinitions[type];
    if (def === undefined) {
        console.warn(
            `Block definition not found for type: ${type}. Returning AIR definition.`
        );
        return BlockDefinitions[BlockType.AIR];
    }
    return def;
}
