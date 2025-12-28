// Helper para persistencia de datos usando Capacitor Preferences
// Si no estamos en móvil, cae automáticamente a localStorage

const Preferences = (window.Capacitor && window.Capacitor.Plugins) ? window.Capacitor.Plugins.Preferences : null;

export const Storage = {
    // Obtener un dato (con timeout de seguridad)
    async get(key, defaultValue) {
        try {
            if (Preferences) {
                // Timeout de 1 segundo para evitar que se cuelgue si el plugin no responde
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1000));
                const pluginPromise = Preferences.get({ key });

                const { value } = await Promise.race([pluginPromise, timeoutPromise]);
                return value !== null ? value : defaultValue;
            } else {
                const val = localStorage.getItem(key);
                return val !== null ? val : defaultValue;
            }
        } catch (e) {
            console.warn(`Storage.get error/timeout for ${key}, using default.`, e);
            // Fallback a localStorage por si acaso
            return localStorage.getItem(key) || defaultValue;
        }
    },

    // Guardar un dato
    async set(key, value) {
        try {
            if (Preferences) {
                // No necesitamos esperar el set crítico, pero lo hacemos por seguridad
                Preferences.set({ key, value: String(value) }).catch(e => console.warn('Pref.set failed', e));
            } else {
                localStorage.setItem(key, String(value));
            }
        } catch (e) {
            console.error("Error guardando Storage:", e);
        }
    }
};