import { Storage } from './Storage.js';
import { GAME_DATA } from '../data/GameData.js';
import { CONFIG } from '../data/config.js'; // Import CONFIG

/**
 * @typedef {object} PlayerProfile
 * @property {string} name - Nombre del jugador.
 * @property {string} species - Especie del jugador.
 * @property {string} planet - Planeta del jugador.
 * @property {string} avatar - Clave del avatar del jugador.
 * @property {number} bestStreak - La mejor racha de victorias del jugador.
 */

/**
 * @typedef {object} GameSettings
 * @property {string} difficulty - Nivel de dificultad ('EASY', 'MEDIUM', 'HARD').
 * @property {string} bgTheme - Tema de fondo seleccionado.
 * @property {boolean} isMuted - Si el audio está silenciado.
 * @property {boolean} vibrate - Si la vibración está habilitada.
 * @property {boolean} bgDim - Si el fondo está atenuado.
 * @property {boolean} isPlayerRight - Si el jugador está posicionado a la derecha.
 */

/**
 * @typedef {object} SessionData
 * @property {number} currentStreak - Racha de victorias actual.
 * @property {boolean} introSeen - Si la introducción ha sido vista.
 * @property {boolean} tutorialSeen - Si el tutorial ha sido visto.
 * @property {boolean} storyCompleted - Si la historia ha sido completada.
 */

/**
 * Centraliza la gestión de datos del juego, incluyendo el perfil del jugador,
 * configuraciones y datos de sesión, con persistencia a través de Storage.
 */
const KEYS = {
    // Claves de almacenamiento centralizadas
    /** @type {string} */ PLAYER_NAME: 'playerName',
    /** @type {string} */ PLAYER_SPECIES: 'playerSpecies',
    /** @type {string} */ PLAYER_PLANET: 'playerPlanet',
    /** @type {string} */ PLAYER_AVATAR: 'playerAvatar',
    /** @type {string} */ BEST_STREAK: 'streak_best',
    /** @type {string} */ CURRENT_STREAK: 'streak_current',
    /** @type {string} */ DIFFICULTY: 'difficulty',
    /** @type {string} */ BG_THEME: 'bg_theme',
    /** @type {string} */ IS_MUTED: 'isMuted',
    /** @type {string} */ VIBRATE: 'vibrate',
    /** @type {string} */ BG_DIM: 'bgDim',
    /** @type {string} */ INTRO_SEEN: 'intro_seen',
    /** @type {string} */ TUTORIAL_SEEN: 'tutorial_seen',
    /** @type {string} */ STORY_COMPLETED: 'storyCompleted', // Nuevo flag
};

export const DataManager = {
    /**
     * Almacena el perfil del jugador en memoria.
     * @type {PlayerProfile}
     */
    profile: {
        name: 'PLAYER 1',
        species: GAME_DATA.SPECIES.HUMAN,
        planet: GAME_DATA.PLANETS.EARTH,
        avatar: GAME_DATA.AVATARS.PLAYER_AVATAR_MICHAEL, // Usar un avatar de jugador como default
        bestStreak: 0,
    },

    /**
     * Almacena las configuraciones del juego en memoria.
     * @type {GameSettings}
     */
    settings: {
        difficulty: 'MEDIUM',
        bgTheme: 'bg_purple',
        isMuted: false,
        vibrate: true,
        bgDim: false,
        isPlayerRight: false,
    },

    /**
     * Almacena datos de sesión del juego en memoria.
     * @type {SessionData}
     */
    session: {
        currentStreak: 0,
        introSeen: false,
        tutorialSeen: false,
        storyCompleted: false, // Inicializar aquí
    },

    // --- Carga Inicial ---
    /**
     * Inicializa el DataManager cargando todos los datos del almacenamiento persistente.
     * Si no existen datos, se usarán los valores por defecto.
     * @async
     * @returns {Promise<void>}
     */
    async init() {
        // Cargar Perfil
        this.profile.name = await Storage.get(KEYS.PLAYER_NAME, 'PLAYER 1');
        this.profile.species = await Storage.get(KEYS.PLAYER_SPECIES, GAME_DATA.SPECIES.HUMAN);
        this.profile.planet = await Storage.get(KEYS.PLAYER_PLANET, GAME_DATA.PLANETS.EARTH);
        this.profile.avatar = await Storage.get(
            KEYS.PLAYER_AVATAR,
            GAME_DATA.AVATARS.PLAYER_AVATAR_MICHAEL
        );
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

        console.log('DataManager initialized.');
    },

    // --- SETTERS CON PERSISTENCIA ---

    // Perfil
    /**
     * Establece el nombre del jugador y lo guarda persistentemente.
     * Se limpia el nombre (mayúsculas, trim, máximo 10 caracteres).
     * @async
     * @param {string} name - El nuevo nombre del jugador.
     * @returns {Promise<void>}
     */
    async setName(name) {
        const finalName = name.trim().toUpperCase().substring(0, 10) || 'PLAYER 1';
        this.profile.name = finalName;
        await Storage.set(KEYS.PLAYER_NAME, finalName);
    },
    /**
     * Establece la especie del jugador y la guarda persistentemente.
     * @async
     * @param {string} species - La nueva especie del jugador.
     * @returns {Promise<void>}
     */
    async setSpecies(species) {
        this.profile.species = species;
        await Storage.set(KEYS.PLAYER_SPECIES, species);
    },
    /**
     * Establece el planeta del jugador y lo guarda persistentemente.
     * @async
     * @param {string} planet - El nuevo planeta del jugador.
     * @returns {Promise<void>}
     */
    async setPlanet(planet) {
        this.profile.planet = planet;
        await Storage.set(KEYS.PLAYER_PLANET, planet);
    },
    /**
     * Establece el avatar del jugador y lo guarda persistentemente.
     * @async
     * @param {string} avatar - La clave del nuevo avatar del jugador.
     * @returns {Promise<void>}
     */
    async setAvatar(avatar) {
        this.profile.avatar = avatar;
        await Storage.set(KEYS.PLAYER_AVATAR, avatar);
    },
    /**
     * Establece la mejor racha de victorias del jugador si la nueva puntuación es mayor.
     * @async
     * @param {number} score - La puntuación a comparar con la mejor racha actual.
     * @returns {Promise<boolean>} - True si se estableció un nuevo récord, false en caso contrario.
     */
    async setBestStreak(score) {
        if (score > this.profile.bestStreak) {
            this.profile.bestStreak = score;
            await Storage.set(KEYS.BEST_STREAK, score);
            return true; // Nuevo récord
        }
        return false;
    },

    // Configuración
    /**
     * Establece el nivel de dificultad y lo guarda persistentemente.
     * @async
     * @param {string} level - El nuevo nivel de dificultad.
     * @returns {Promise<void>}
     */
    async setDifficulty(level) {
        this.settings.difficulty = level;
        await Storage.set(KEYS.DIFFICULTY, level);
    },
    /**
     * Establece el tema de fondo y lo guarda persistentemente, actualizando también el tema global de CONFIG.
     * @async
     * @param {string} themeId - El ID del nuevo tema de fondo.
     * @returns {Promise<void>}
     */
    async setBgTheme(themeId) {
        this.settings.bgTheme = themeId;
        await Storage.set(KEYS.BG_THEME, themeId);
        CONFIG.THEME.setFromPalette(themeId); // Update global theme config
    },
    /**
     * Establece si el audio está silenciado y lo guarda persistentemente.
     * @async
     * @param {boolean} muted - True si el audio debe estar silenciado, false en caso contrario.
     * @returns {Promise<void>}
     */
    async setIsMuted(muted) {
        this.settings.isMuted = muted;
        await Storage.set(KEYS.IS_MUTED, muted);
    },
    /**
     * Establece si la vibración está habilitada y lo guarda persistentemente.
     * @async
     * @param {boolean} enabled - True si la vibración debe estar habilitada, false en caso contrario.
     * @returns {Promise<void>}
     */
    async setVibrate(enabled) {
        this.settings.vibrate = enabled;
        await Storage.set(KEYS.VIBRATE, enabled);
    },
    /**
     * Establece si el fondo está atenuado y lo guarda persistentemente.
     * @async
     * @param {boolean} enabled - True si el fondo debe estar atenuado, false en caso contrario.
     * @returns {Promise<void>}
     */
    async setBgDim(enabled) {
        this.settings.bgDim = enabled;
        await Storage.set(KEYS.BG_DIM, enabled);
    },
    /**
     * Establece si el jugador está posicionado a la derecha y lo guarda persistentemente.
     * @async
     * @param {boolean} isRight - True si el jugador debe estar a la derecha, false en caso contrario.
     * @returns {Promise<void>}
     */
    async setIsPlayerRight(isRight) {
        this.settings.isPlayerRight = isRight;
        await Storage.set('isPlayerRight', isRight);
    },

    // Sesión
    /**
     * Establece la racha de victorias actual y la guarda persistentemente.
     * @async
     * @param {number} streak - La nueva racha de victorias.
     * @returns {Promise<void>}
     */
    async setCurrentStreak(streak) {
        this.session.currentStreak = streak;
        await Storage.set(KEYS.CURRENT_STREAK, streak);
    },
    /**
     * Establece si la introducción ha sido vista y lo guarda persistentemente.
     * @async
     * @param {boolean} seen - True si la introducción ha sido vista.
     * @returns {Promise<void>}
     */
    async setIntroSeen(seen) {
        this.session.introSeen = seen;
        await Storage.set(KEYS.INTRO_SEEN, seen);
    },
    /**
     * Establece si el tutorial ha sido visto y lo guarda persistentemente.
     * @async
     * @param {boolean} seen - True si el tutorial ha sido visto.
     * @returns {Promise<void>}
     */
    async setTutorialSeen(seen) {
        this.session.tutorialSeen = seen;
        await Storage.set(KEYS.TUTORIAL_SEEN, seen);
    },
    /**
     * Establece si la historia ha sido completada y la guarda persistentemente.
     * @async
     * @param {boolean} completed - True si la historia ha sido completada.
     * @returns {Promise<void>}
     */
    async setStoryCompleted(completed) {
        this.session.storyCompleted = completed;
        await Storage.set(KEYS.STORY_COMPLETED, completed);
    },

    // --- Lógica de Juego ---
    /**
     * Registra una victoria en el modo de juego rápido, actualiza la racha actual
     * y la mejor racha si se supera.
     * @async
     * @returns {Promise<{streak: number, isNewRecord: boolean}>} - Objeto con la nueva racha y si es un nuevo récord.
     */
    async registerQuickPlayWin() {
        const newStreak = this.session.currentStreak + 1;
        this.session.currentStreak = newStreak;
        await Storage.set(KEYS.CURRENT_STREAK, newStreak);

        const isNewRecord = await this.setBestStreak(newStreak);
        return { streak: newStreak, isNewRecord: isNewRecord };
    },

    /**
     * Registra una derrota en el modo de juego rápido, reiniciando la racha actual.
     * @async
     * @returns {Promise<void>}
     */
    async registerQuickPlayLoss() {
        this.session.currentStreak = 0;
        await Storage.set(KEYS.CURRENT_STREAK, 0);
    },

    /**
     * Limpia todos los datos del juego del almacenamiento persistente.
     * @async
     * @returns {Promise<void>}
     */
    async clear() {
        await Storage.clear();
        console.log('DataManager data cleared.');
    },

    // --- GETTERS ---

    // Perfil
    /**
     * Obtiene el nombre del jugador.
     * @returns {string} El nombre actual del jugador.
     */
    getName() {
        return this.profile.name;
    },
    /**
     * Obtiene la especie del jugador.
     * @returns {string} La especie actual del jugador.
     */
    getSpecies() {
        return this.profile.species;
    },
    /**
     * Obtiene el planeta del jugador.
     * @returns {string} El planeta actual del jugador.
     */
    getPlanet() {
        return this.profile.planet;
    },
    /**
     * Obtiene la clave del avatar del jugador.
     * @returns {string} La clave del avatar actual del jugador.
     */
    getAvatar() {
        return this.profile.avatar;
    },
    /**
     * Obtiene la mejor racha de victorias del jugador.
     * @returns {number} La mejor racha de victorias.
     */
    getBestStreak() {
        return this.profile.bestStreak;
    },

    // Configuración
    /**
     * Obtiene el nivel de dificultad actual.
     * @returns {string} El nivel de dificultad actual.
     */
    getDifficulty() {
        return this.settings.difficulty;
    },
    /**
     * Obtiene el ID del tema de fondo seleccionado.
     * @returns {string} El ID del tema de fondo.
     */
    getBgTheme() {
        return this.settings.bgTheme;
    },
    /**
     * Comprueba si el audio está silenciado.
     * @returns {boolean} True si el audio está silenciado, false en caso contrario.
     */
    isMuted() {
        return this.settings.isMuted;
    },
    /**
     * Comprueba si la vibración está habilitada.
     * @returns {boolean} True si la vibración está habilitada, false en caso contrario.
     */
    isVibrateEnabled() {
        return this.settings.vibrate;
    },
    /**
     * Comprueba si el fondo está atenuado.
     * @returns {boolean} True si el fondo está atenuado, false en caso contrario.
     */
    isBgDim() {
        return this.settings.bgDim;
    },
    /**
     * Comprueba si el jugador está posicionado a la derecha.
     * @returns {boolean} True si el jugador está a la derecha, false en caso contrario.
     */
    isPlayerRight() {
        return this.settings.isPlayerRight;
    },

    // Sesión
    /**
     * Obtiene la racha de victorias actual.
     * @returns {number} La racha de victorias actual.
     */
    getCurrentStreak() {
        return this.session.currentStreak;
    },
    /**
     * Comprueba si la introducción ha sido vista.
     * @returns {boolean} True si la introducción ha sido vista, false en caso contrario.
     */
    hasSeenIntro() {
        return this.session.introSeen;
    },
    /**
     * Comprueba si el tutorial ha sido visto.
     * @returns {boolean} True si el tutorial ha sido visto, false en caso contrario.
     */
    hasSeenTutorial() {
        return this.session.tutorialSeen;
    },
    /**
     * Comprueba si la historia ha sido completada.
     * @returns {boolean} True si la historia ha sido completada, false en caso contrario.
     */
    hasCompletedStory() {
        return this.session.storyCompleted;
    },
};
