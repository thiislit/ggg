/**
 * Globales que el juego recibe por <script> en www/index.html (no por import).
 * Solo sirven para la comprobación de tipos del editor / `npm run typecheck`.
 */

/// <reference types="phaser" />

interface CapacitorPlugins {
    [name: string]: any;
}

interface Window {
    /** Capacitor (solo en la app nativa Android/iOS). */
    Capacitor?: { Plugins: CapacitorPlugins; isNativePlatform?: () => boolean; [key: string]: any };
    /** Supabase UMD: www/assets/js/supabase.min.js */
    supabase?: { createClient: (url: string, key: string, options?: any) => any };
    Sentry?: any;
}

declare var Capacitor: Window['Capacitor'];
declare var supabase: Window['supabase'];
declare var Sentry: any;
declare var WebFont: { load: (config: any) => void };
