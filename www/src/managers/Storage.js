// Helper para persistencia de datos usando Capacitor Preferences
// Si no estamos en móvil, cae automáticamente a localStorage

const Preferences = (window.Capacitor && window.Capacitor.Plugins) ? window.Capacitor.Plugins.Preferences : null;

export const Storage = {
    /**
     * Obtiene un valor y lo parsea automáticamente desde JSON para preservar tipos.
     */
    async get(key, defaultValue) {
        try {
            let rawValue = null;
            if (Preferences) {
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Storage Timeout')), 1500));
                const { value } = await Promise.race([Preferences.get({ key }), timeoutPromise]);
                rawValue = value;
            } else {
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
        try {
            const stringValue = JSON.stringify(value);
            if (Preferences) {
                await Preferences.set({ key, value: stringValue });
            } else {
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
        try {
            if (Preferences) {
                await Preferences.remove({ key });
            } else {
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
        try {
            if (Preferences) {
                await Preferences.clear();
            } else {
                localStorage.clear();
            }
        } catch (e) {
            console.error("[Storage] Fallo al limpiar almacenamiento:", e);
        }
    }
};
