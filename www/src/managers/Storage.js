// Helper para persistencia de datos usando Capacitor Preferences
// Si no estamos en móvil, cae automáticamente a localStorage

// Función utilitaria para obtener las preferencias activas
const getActivePreferences = () =>
    window.Capacitor && window.Capacitor.Plugins ? window.Capacitor.Plugins.Preferences : null;

// Usamos el mock en entorno de test (cargado con require para evitar que se incluya en el bundle de producción)
// y el real en producción/desarrollo.
const getActiveLocalStorage = () => {
    // Esta comprobación asegura que el código se ejecute de forma segura en ambos entornos.
    // `process` solo existe en el entorno de Node.js (y por lo tanto, en Jest).
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
        return require('./__mocks__/localStorageMock.js').localStorageMock;
    }
    return window.localStorage;
};

export const Storage = {
    /**
     * Obtiene un valor y lo parsea automáticamente desde JSON para preservar tipos.
     */
    async get(key, defaultValue) {
        const preferences = getActivePreferences();
        const localStorage = getActiveLocalStorage();
        try {
            let rawValue = null;
            if (preferences) {
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Storage Timeout')), 1500)
                );
                const { value } = await Promise.race([preferences.get({ key }), timeoutPromise]);
                rawValue = value;
            } else if (localStorage) {
                rawValue = localStorage.getItem(key);
            }

            if (rawValue === null) return defaultValue;

            // Intentar parsear JSON para recuperar tipos (number, boolean, object)
            try {
                return JSON.parse(rawValue);
            } catch {
                return rawValue; // Si no es JSON, devolver como string
            }
        } catch (e) {
            console.error(`[Storage] Fallo al leer ${key}:`, e);
            return defaultValue;
        }
    },

    /**
     * Guarda un valor convirtiéndolo a JSON.
     */
    async set(key, value) {
        const preferences = getActivePreferences();
        const localStorage = getActiveLocalStorage();
        try {
            const stringValue = JSON.stringify(value);
            if (preferences) {
                await preferences.set({ key, value: stringValue });
            } else if (localStorage) {
                localStorage.setItem(key, stringValue);
            }
        } catch (e) {
            console.error(`[Storage] Fallo al guardar ${key}:`, e);
        }
    },

    /**
     * Elimina una clave específica.
     */
    async remove(key) {
        const preferences = getActivePreferences();
        const localStorage = getActiveLocalStorage();
        try {
            if (preferences) {
                await preferences.remove({ key });
            } else if (localStorage) {
                localStorage.removeItem(key);
            }
        } catch (e) {
            console.error(`[Storage] Fallo al eliminar ${key}:`, e);
        }
    },

    /**
     * Limpia todo el almacenamiento relacionado con la app.
     */
    async clear() {
        const preferences = getActivePreferences();
        const localStorage = getActiveLocalStorage();
        try {
            if (preferences) {
                await preferences.clear();
            } else if (localStorage) {
                localStorage.clear();
            }
        } catch (e) {
            console.error('[Storage] Fallo al limpiar almacenamiento:', e);
        }
    },
};
