# RPS Retro 🎮

Juego retro de **Piedra, Papel o Tijera** con historia, combates, diálogos, barra de vida y efectos especiales.

## 📁 Estructura del Proyecto

```text
ggg/
├── www/                       # Código fuente de la aplicación Web (Capacitor webDir)
│   ├── index.html             # Punto de entrada principal HTML
│   ├── css/                   # Hojas de estilo
│   ├── assets/                # Imágenes, audios, fuentes y spritesheets del juego
│   └── src/                   # Código ejecutable JavaScript (ES Modules)
│       ├── main.js            # Inicialización del juego Phaser
│       ├── scenes/            # Escenas de Phaser (GameScene, MainMenu, Story, etc.)
│       ├── managers/          # Gestores del sistema (AudioManager, Storage, Combat, etc.)
│       ├── ui/                # Componentes interactivos de interfaz de usuario
│       ├── data/              # Datos de oponentes, configuración y niveles
│       └── constants/         # Claves de assets y constantes globales
├── scripts/                   # Scripts de utilidad
│   ├── launch_game.bat        # Servidor de desarrollo local de 1-clic
│   └── create_shortcut.ps1    # Generador de acceso directo para el Escritorio
├── android/                   # Proyecto nativo Android (Capacitor)
├── ios/                       # Proyecto nativo iOS (Capacitor)
├── assets/                    # Iconos y Splash oficiales para compilación nativa
├── source_design/             # Diseños y recursos originales
├── TESTS.md                   # Documentación de la arquitectura de pruebas
└── jest.config.cjs            # Configuración de Jest (ESM / JSDOM)
```

## 🚀 Cómo Lanzar el Juego

### 1. Desde el Escritorio (1-Clic)
Haz doble clic en el icono **`Jugar RPS Retro.lnk`** o en el archivo **`🎮 Jugar RPS Retro.bat`** ubicados en tu Escritorio.

### 2. Desde la Terminal
```bash
npm start
```
Esto iniciará el servidor web local y abrirá el juego en `http://localhost:8080`.

## 🧪 Pruebas Unitarias

Para ejecutar la suite de pruebas unitarias automatizadas con Jest:
```bash
npm test
```

## 📱 Sincronización Móvil (Capacitor)

Para compilar y actualizar las plataformas nativas:
```bash
npm run sync
```
