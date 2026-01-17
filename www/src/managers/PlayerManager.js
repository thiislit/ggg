import { Storage } from './Storage.js';
import { GAME_DATA } from '../data/GameData.js';

export const PlayerManager = {
    data: {
        name: 'PLAYER 1',
        species: GAME_DATA.SPECIES.HUMAN,
        planet: GAME_DATA.PLANETS.EARTH,
        avatar: GAME_DATA.AVATARS.HUMAN_1,
        bestStreak: 0
    },

    // Valores por defecto centralizados
    DEFAULTS: {
        NAME: 'PLAYER 1',
        SPECIES: GAME_DATA.SPECIES.HUMAN,
        PLANET: GAME_DATA.PLANETS.EARTH,
        AVATAR: GAME_DATA.AVATARS.HUMAN_1
    },

    async init() {
        this.data.name = await Storage.get('playerName', this.DEFAULTS.NAME);
        this.data.species = await Storage.get('playerSpecies', this.DEFAULTS.SPECIES);
        this.data.planet = await Storage.get('playerPlanet', this.DEFAULTS.PLANET);
        this.data.avatar = await Storage.get('playerAvatar', this.DEFAULTS.AVATAR);
        this.data.bestStreak = await Storage.get('streak_best', 0);
    },

    // --- SETTERS CON PERSISTENCIA ---
    async setName(newName) {
        const finalName = newName.trim().toUpperCase().substring(0, 10) || this.DEFAULTS.NAME;
        this.data.name = finalName;
        await Storage.set('playerName', finalName);
    },

    async setSpecies(newSpecies) {
        this.data.species = newSpecies;
        await Storage.set('playerSpecies', newSpecies);
    },

    async setPlanet(newPlanet) {
        this.data.planet = newPlanet;
        await Storage.set('playerPlanet', newPlanet);
    },

    async setAvatar(newAvatar) {
        this.data.avatar = newAvatar;
        await Storage.set('playerAvatar', newAvatar);
    },

    async setBestStreak(score) {
        if (score > this.data.bestStreak) {
            this.data.bestStreak = score;
            await Storage.set('streak_best', score);
            return true; // Nuevo récord
        }
        return false;
    },

    // --- GETTERS ---
    getName() { return this.data.name; },
    getSpecies() { return this.data.species; },
    getPlanet() { return this.data.planet; },
    getAvatar() { return this.data.avatar; },
    getBestStreak() { return this.data.bestStreak; }
};
