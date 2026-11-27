# Arquitectura de RPS Retro

## Propósito

RPS Retro es un juego de piedra, papel o tijera creado con Phaser y empaquetado para Android e iOS con Capacitor. La fuente de verdad de la experiencia es la aplicación web en `www/`; las carpetas `android/` e `ios/` son proyectos nativos generados y sincronizados desde esa aplicación.

## Mapa del código

```text
www/
├── index.html              Punto de entrada web y carga de Phaser
├── src/main.js             Configuración y registro de escenas
├── src/scenes/             Pantallas y flujo de juego
├── src/managers/           Lógica reutilizable: combate, datos, audio, guardado y móvil
├── src/ui/                 Componentes visuales e interacción de combate
├── src/data/               Contenido configurable: oponentes, idioma, diseño y recursos
├── src/constants/          Valores globales y claves de recursos
├── css/                    Estilos de la página contenedora
└── assets/                 Audio, imágenes, iconos y librerías locales

android/ y ios/             Contenedores nativos de Capacitor
assets/ y source_design/    Iconos, splash y fuentes de diseño originales
__mocks__/                  Sustitutos para pruebas que no cargan Phaser real
```

## Reglas de trabajo

1. No se debe acceder a una ruta de recurso directamente desde una escena cuando exista una clave en `AssetManifest.js` o `AssetKeys.js`.
2. La lógica de reglas de juego debe vivir en `managers/`; las escenas deben concentrarse en flujo, animación e interacción.
3. Los cambios web se validan primero con `npm run verify`.
4. Después de modificar recursos o complementos de Capacitor se ejecuta `npm run sync` antes de probar Android o iOS.
5. `android/` e `ios/` no se editan manualmente salvo configuraciones nativas que estén documentadas; cualquier cambio nativo debe probarse en un dispositivo o emulador.

## Online Versus

Partidas 1 contra 1 entre dos dispositivos usando **Supabase Realtime** (sin tablas ni servidor propio).

```text
MainMenuScene ─► OnlineLobbyScene ─► GameScene (+ OnlineVersusController) ─► GameOverScene ─► OnlineLobbyScene
                 crear / unirse con      rondas sincronizadas, emojis,
                 código de 5 dígitos     desconexiones
```

| Pieza | Responsabilidad |
|---|---|
| `data/onlineConfig.js` | URL y clave *publishable* de Supabase (pública por diseño; nunca la `secret`/`service_role`) |
| `managers/OnlineChannel.js` | Interfaz del canal (`send`, `on`, `close`) y rival simulado para PRACTICE |
| `managers/SupabaseOnlineChannel.js` | Sala real: presencia (quién está, máx. 2), broadcast de mensajes, reconexión |
| `managers/OnlineMatch.js` | Protocolo de ronda `ready → commit → reveal` (jugadas justas con huella + sal) |
| `scenes/online/OnlineVersusController.js` | Todo lo online dentro de `GameScene`; Quick Play/Story nunca lo crean |

**Tolerancia a fallos de red**

- Supabase reconecta solo; `SupabaseOnlineChannel` vuelve a anunciar la presencia (mismo `joinedAt`) y emite `connection`.
- `OnlineMatch` reenvía cada 2 s lo pendiente y responde a duplicados (marcados `reply` para evitar bucles): un mensaje perdido no congela la partida.
- Tiempo límite propio por ronda (`setTimeout`): si el temporizador visual de Phaser se congela (app en segundo plano) la ronda se cierra como "no eligió a tiempo".
- Al terminar la partida la sala sigue abierta **15 s** en segundo plano (`LINGER_MS`): si al rival se le perdió la última jugada, la recupera con sus reintentos en vez de quedarse en "WAITING FOR RIVAL...". Si se abandona a mitad, se cierra al instante.
- Rival desconectado: aviso y **20 s de gracia** (`RIVAL_GRACE_MS`) para volver; si no vuelve, se regresa a la sala.
- Sin conexión no se envía nada (evita la vía REST de Supabase y gasto de cuota); los reenvíos recuperan al volver.
- Comprobado contra el servidor real cortando el WebSocket a mitad de ronda: reconexión ~1 s y resultado idéntico en ambos.

**Capacidad del plan Free de Supabase** ([límites](https://supabase.com/docs/guides/realtime/limits), [precios](https://supabase.com/docs/guides/realtime/pricing))

| Límite | Valor | Qué significa para el juego |
|---|---|---|
| Conexiones simultáneas | 200 | ~100 partidas a la vez (1 conexión por dispositivo en sala o partida) |
| Mensajes al mes | 2 millones | Una partida típica gasta ~150–300 mensajes (contando envío y recepción) → del orden de **7.000–13.000 partidas/mes** |
| Mensajes por segundo | 100 | Sobra: una partida envía unos pocos por segundo en los picos |
| Al superar la cuota | Se corta, no se cobra | Revisar *Project → Reports → Realtime* en Supabase; el plan Pro sube los límites |

## Áreas prioritarias para refactorizar

- `GameScene.js`: separar el ciclo de ronda, coordinación visual y navegación (la parte online ya está en `OnlineVersusController`).
- `CombatUI.js`: extraer los paneles de selección, resultado y vida como componentes.
- `DataManager.js`: conservar únicamente el estado y mover transformaciones de contenido a módulos de datos puros.

## Estado de calidad

- `npm run verify`: lint + comprobación de tipos (`tsc`, JS con JSDoc) + pruebas unitarias (Jest). Se ejecuta en CI y antes de cada deploy de Netlify.
- `npm run test:e2e`: pruebas en navegador real (Playwright/Chromium) del arranque, una ronda de Quick Play y la separación online/Quick Play. Se ejecutan en CI.
- Pendiente: prueba e2e del flujo completo de campaña (inicio → perfil → menú → combate → resultado → epílogo).
