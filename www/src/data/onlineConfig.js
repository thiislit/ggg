/**
 * Configuración del modo Online Versus (Supabase Realtime).
 *
 * Copia estos dos valores desde tu proyecto de Supabase:
 *   Project Settings → API → "Project URL" y la clave "anon public".
 *
 * La clave "anon" está pensada para ir dentro de apps web/móviles (es pública),
 * así que puede vivir en el código. NUNCA pongas aquí la clave "service_role".
 *
 * Mientras estén vacíos, ONLINE VERSUS solo ofrece la práctica contra un rival simulado.
 */
export const ONLINE_CONFIG = {
    SUPABASE_URL: 'https://tqsbidpyjpwptyinywap.supabase.co',
    SUPABASE_ANON_KEY: 'sb_publishable_RjgoYecwk5upX8dTEfrriw_bU1PFv49',
};

export function isOnlineConfigured() {
    return Boolean(ONLINE_CONFIG.SUPABASE_URL && ONLINE_CONFIG.SUPABASE_ANON_KEY);
}
