import { ASSET_KEYS } from '../constants/AssetKeys.js';

export const OPPONENTS = {
    ZORG: {
        name: 'ZORG',
        species: 'ALIEN',
        avatar: ASSET_KEYS.IMAGES.AVATAR_ZORG, // Usa la nueva clave de ASSET_KEYS
        planet: {
            name: 'ZORGTROPOLIS',
            texture: 'planet_zorg',
            anim: 'anim_zorg_planet',
        },
        stats: {
            health: 3,
            difficulty: 'MEDIUM',
        },
        dialogues: {
            intro: 'PREPARE TO BE COLONIZED!',
            win: 'CONQUEST IS INEVITABLE!',
            lose: 'THIS IS NOT THE END, HUMAN...',
        },
    },
    QUICK_PLAY_POOL: [
        {
            name: 'OCTAVIUS', // Nuevo nombre
            species: 'ALIEN',
            avatar: ASSET_KEYS.IMAGES.AVATAR_OCTAVIUS, // Nueva clave de ASSET_KEYS
            planet: {
                name: 'MARS',
                texture: ASSET_KEYS.SPRITESHEETS.PLANET_MARS,
                anim: ASSET_KEYS.ANIMATIONS.ANIM_MARS,
            },
            stats: { health: 3 },
            dialogues: {
                intro: 'GALACTIC DOMINATION IS NIGH!',
                win: 'ANOTHER VICTORY FOR THE HIVE!',
                lose: 'RETREAT! FOR NOW...',
            },
        },
        {
            name: 'RAPTOR', // Nuevo nombre
            species: 'ALIEN',
            avatar: ASSET_KEYS.IMAGES.AVATAR_RAPTOR, // Nueva clave de ASSET_KEYS
            planet: {
                name: 'KEPLER',
                texture: ASSET_KEYS.SPRITESHEETS.PLANET_KEPLER,
                anim: ASSET_KEYS.ANIMATIONS.ANIM_KEPLER,
            },
            stats: { health: 3 },
            dialogues: {
                intro: 'I SMELL FEAR!',
                win: 'PREY CAPTURED!',
                lose: "I'LL BE BACK FOR YOU!",
            },
        },
        {
            name: 'ECHO', // Nuevo nombre
            species: 'ALIEN',
            avatar: ASSET_KEYS.IMAGES.AVATAR_ECHO, // Nueva clave de ASSET_KEYS
            planet: {
                name: 'KEPLER',
                texture: ASSET_KEYS.SPRITESHEETS.PLANET_KEPLER,
                anim: ASSET_KEYS.ANIMATIONS.ANIM_KEPLER,
            },
            stats: { health: 3 },
            dialogues: {
                intro: 'GHOST IN THE MACHINE.',
                win: "CAN'T CATCH ME.",
                lose: 'A TEMPORARY DISRUPTION.',
            },
        },
        {
            name: 'OSCAR', // Nuevo nombre
            species: 'ROBOT',
            avatar: ASSET_KEYS.IMAGES.AVATAR_OSCAR, // Nueva clave de ASSET_KEYS
            planet: {
                name: 'NEBULA',
                texture: ASSET_KEYS.SPRITESHEETS.PLANET_NEBULA,
                anim: ASSET_KEYS.ANIMATIONS.ANIM_NEBULA,
            },
            stats: { health: 3 },
            dialogues: {
                intro: 'INITIATING COMBAT PROTOCOL.',
                win: 'PERFECT EXECUTION.',
                lose: 'SYSTEM FAILURE. REBOOTING...',
            },
        },
        {
            name: 'MICHAEL', // Nuevo nombre
            species: 'HUMAN',
            avatar: ASSET_KEYS.IMAGES.AVATAR_MICHAEL, // Nueva clave de ASSET_KEYS
            planet: {
                name: 'MARS',
                texture: ASSET_KEYS.SPRITESHEETS.PLANET_MARS,
                anim: ASSET_KEYS.ANIMATIONS.ANIM_MARS,
            },
            stats: { health: 3 },
            dialogues: {
                intro: 'READY FOR ACTION!',
                win: 'TOO SLOW, FRIEND.',
                lose: 'NEXT TIME, I WIN.',
            },
        },
        {
            name: 'MATEO', // Nuevo nombre
            species: 'HUMAN',
            avatar: ASSET_KEYS.IMAGES.AVATAR_MATEO, // Nueva clave de ASSET_KEYS
            planet: {
                name: 'EARTH',
                texture: ASSET_KEYS.SPRITESHEETS.PLANET_TIERRA,
                anim: ASSET_KEYS.ANIMATIONS.ANIM_EARTH,
            },
            stats: { health: 3 },
            dialogues: {
                intro: 'CHALLENGE ACCEPTED!',
                win: 'UNSTOPPABLE!',
                lose: 'A MERE SETBACK.',
            },
        },
        {
            name: 'JOHN', // Nuevo nombre
            species: 'HUMAN',
            avatar: ASSET_KEYS.IMAGES.AVATAR_JOHN, // Nueva clave de ASSET_KEYS
            planet: {
                name: 'EARTH',
                texture: ASSET_KEYS.SPRITESHEETS.PLANET_TIERRA,
                anim: ASSET_KEYS.ANIMATIONS.ANIM_EARTH,
            },
            stats: { health: 3 },
            dialogues: {
                intro: "IT'S SHOWTIME!",
                win: 'GAME OVER!',
                lose: "I'LL BE BACK.",
            },
        },
    ],
};
