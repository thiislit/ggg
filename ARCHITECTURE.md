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

## Áreas prioritarias para refactorizar

- `GameScene.js`: separar el ciclo de ronda, coordinación visual y navegación.
- `CombatUI.js`: extraer los paneles de selección, resultado y vida como componentes.
- `DataManager.js`: conservar únicamente el estado y mover transformaciones de contenido a módulos de datos puros.

## Estado de calidad

La suite unitaria cubre los gestores principales y un componente de interfaz. Para ampliar cobertura, añadir pruebas de integración para el flujo: inicio → perfil → menú → combate → resultado → campaña.
