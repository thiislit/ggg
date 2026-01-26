import { Storage } from './Storage.js';
import { GAME_DATA } from '../data/GameData.js';

// Claves de almacenamiento centralizadas
const KEYS = {
    PLAYER_NAME: 'playerName',
    PLAYER_SPECIES: 'playerSpecies',
    PLAYER_PLANET: 'playerPlanet',
    PLAYER_AVATAR: 'playerAvatar',
    BEST_STREAK: 'streak_best',
    CURRENT_STREAK: 'streak_current',
    DIFFICULTY: 'difficulty',
    BG_THEME: 'bg_theme',
    IS_MUTED: 'isMuted',
    VIBRATE: 'vibrate',
    BG_DIM: 'bgDim',
    INTRO_SEEN: 'intro_seen',
    TUTORIAL_SEEN: 'tutorial_seen',
    STORY_COMPLETED: 'storyCompleted' // Nuevo flag
};

export const DataManager = {
    // --- Valores en memoria ---
    profile: {
        name: 'PLAYER 1',
        species: GAME_DATA.SPECIES.HUMAN,
        planet: GAME_DATA.PLANETS.EARTH,
        avatar: GAME_DATA.AVATARS.PLAYER_AVATAR_MICHAEL, // Usar un avatar de jugador como default
        bestStreak: 0
    },
    
    settings: {
        difficulty: 'MEDIUM',
        bgTheme: 'bg_purple',
        isMuted: false,
        vibrate: true,
        bgDim: false,
        isPlayerRight: false
    },
    
    session: {
        currentStreak: 0,
        introSeen: false,
        tutorialSeen: false,
        storyCompleted: false // Inicializar aquí
    },

    // --- Carga Inicial ---
    async init() {
        // Cargar Perfil
        this.profile.name = await Storage.get(KEYS.PLAYER_NAME, 'PLAYER 1');
        this.profile.species = await Storage.get(KEYS.PLAYER_SPECIES, GAME_DATA.SPECIES.HUMAN);
        this.profile.planet = await Storage.get(KEYS.PLAYER_PLANET, GAME_DATA.PLANETS.EARTH);
        this.profile.avatar = await Storage.get(KEYS.PLAYER_AVATAR, GAME_DATA.AVATARS.PLAYER_AVATAR_MICHAEL);
        this.profile.bestStreak = await Storage.get(KEYS.BEST_STREAK, 0);

        // Cargar Configuración
        this.settings.difficulty = await Storage.get(KEYS.DIFFICULTY, 'MEDIUM');
        this.settings.bgTheme = await Storage.get(KEYS.BG_THEME, 'bg_purple');
        this.settings.isMuted = await Storage.get(KEYS.IS_MUTED, false);
        this.settings.vibrate = await Storage.get(KEYS.VIBRATE, true);
        this.settings.bgDim = await Storage.get(KEYS.BG_DIM, false);
        this.settings.isPlayerRight = await Storage.get('isPlayerRight', false); // Clave original
        
        // Cargar Datos de Sesión
        this.session.currentStreak = await Storage.get(KEYS.CURRENT_STREAK, 0);
        this.session.introSeen = await Storage.get(KEYS.INTRO_SEEN, false);
        this.session.tutorialSeen = await Storage.get(KEYS.TUTORIAL_SEEN, false);
        this.session.storyCompleted = await Storage.get(KEYS.STORY_COMPLETED, false); // Cargar aquí
        
        console.log("DataManager initialized.");
    },

    // --- SETTERS CON PERSISTENCIA ---

    // Perfil
    async setName(name) {
        const finalName = name.trim().toUpperCase().substring(0, 10) || 'PLAYER 1';
        this.profile.name = finalName;
        await Storage.set(KEYS.PLAYER_NAME, finalName);
    },
    async setSpecies(species) {
        this.profile.species = species;
        await Storage.set(KEYS.PLAYER_SPECIES, species);
    },
    async setPlanet(planet) {
        this.profile.planet = planet;
        await Storage.set(KEYS.PLAYER_PLANET, planet);
    },
    async setAvatar(avatar) {
        this.profile.avatar = avatar;
        await Storage.set(KEYS.PLAYER_AVATAR, avatar);
    },
    async setBestStreak(score) {
        if (score > this.profile.bestStreak) {
            this.profile.bestStreak = score;
            await Storage.set(KEYS.BEST_STREAK, score);
            return true; // Nuevo récord
        }
        return false;
    },

    // Configuración
    async setDifficulty(level) {
        this.settings.difficulty = level;
        await Storage.set(KEYS.DIFFICULTY, level);
    },
    async setBgTheme(themeId) {
        this.settings.bgTheme = themeId;
        await Storage.set(KEYS.BG_THEME, themeId);
    },
    async setIsMuted(muted) {
        this.settings.isMuted = muted;
        await Storage.set(KEYS.IS_MUTED, muted);
    },
    async setVibrate(enabled) {
        this.settings.vibrate = enabled;
        await Storage.set(KEYS.VIBRATE, enabled);
    },
    async setBgDim(enabled) {
        this.settings.bgDim = enabled;
        await Storage.set(KEYS.BG_DIM, enabled);
    },
    async setIsPlayerRight(isRight) {
        this.settings.isPlayerRight = isRight;
        await Storage.set('isPlayerRight', isRight);
    },

    // Sesión
    async setCurrentStreak(streak) {
        this.session.currentStreak = streak;
        await Storage.set(KEYS.CURRENT_STREAK, streak);
    },
    async setIntroSeen(seen) {
        this.session.introSeen = seen;
        await Storage.set(KEYS.INTRO_SEEN, seen);
    },
    async setTutorialSeen(seen) {
        this.session.tutorialSeen = seen;
        await Storage.set(KEYS.TUTORIAL_SEEN, seen);
    },
    async setStoryCompleted(completed) { // Nuevo setter
        this.session.storyCompleted = completed;
        await Storage.set(KEYS.STORY_COMPLETED, completed);
    },

    async clear() {
        await Storage.clear();
        console.log("DataManager data cleared.");
    },

    // --- GETTERS ---
    
    // Perfil
    getName() { return this.profile.name; },
    getSpecies() { return this.profile.species; },
    getPlanet() { return this.profile.planet; },
    getAvatar() { return this.profile.avatar; },
    getBestStreak() { return this.profile.bestStreak; },

    // Configuración
    getDifficulty() { return this.settings.difficulty; },
    getBgTheme() { return this.settings.bgTheme; },
    isMuted() { return this.settings.isMuted; },
    isVibrateEnabled() { return this.settings.vibrate; },
    isBgDim() { return this.settings.bgDim; },
    isPlayerRight() { return this.settings.isPlayerRight; },
    
    // Sesión
    getCurrentStreak() { return this.session.currentStreak; },
    hasSeenIntro() { return this.session.introSeen; },
    hasSeenTutorial() { return this.session.tutorialSeen; },
    hasCompletedStory() { return this.session.storyCompleted; } // Nuevo getter
};
