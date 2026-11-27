import { CONFIG } from '../data/config.js';
import { DataManager } from '../managers/DataManager.js';
import { ASSET_KEYS } from '../constants/AssetKeys.js';

export class BackgroundScene extends Phaser.Scene {
    constructor() {
        super('BackgroundScene');
    }

    async create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // Leer el tema guardado
        const savedTheme = DataManager.getBgTheme();

        this.cameras.main.setScroll(0, 0);
        this.cameras.main.setBackgroundColor(CONFIG.COLORS.BG_DARK);

        // --- MODO IMAGEN ESTÁTICA ---
        this.bgStatic = this.add.image(width / 2, height / 2, savedTheme);

        this.bgStatic.setDisplaySize(width, height);
        this.bgStatic.setDepth(-100);

        if (savedTheme === ASSET_KEYS.IMAGES.BG_GREEN) {
            this.bgStatic.setTint(0x88ff88);
        }

        // --- ANIMACIÓN DE PALPITAR ---
        this.tweens.add({
            targets: this.bgStatic,
            scale: this.bgStatic.scale * 1.04,
            duration: 3000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        this.tweens.add({
            targets: this.bgStatic,
            alpha: 0.85,
            duration: 2500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        // Animaciones creadas globalmente en SplashScene

        // Sprite contenedor para la estrella (oculto por defecto)
        this.campaignStar = this.add
            .sprite(width / 2, height / 2, ASSET_KEYS.SPRITESHEETS.CAMPAIGN_STAR)
            .setAlpha(0)
            .setScale(4)
            .play(ASSET_KEYS.ANIMATIONS.ANIM_CAMPAIGN_STAR);

        // Sprite contenedor para la galaxia púrpura
        this.campaignGalaxy = this.add
            .sprite(width / 2, height / 2, ASSET_KEYS.SPRITESHEETS.CAMPAIGN_GALAXY_PURPLE)
            .setAlpha(0)
            .setScale(8)
            .play(ASSET_KEYS.ANIMATIONS.ANIM_CAMPAIGN_GALAXY_PURPLE);

        // Sprite contenedor para el agujero negro
        this.campaignBlackhole = this.add
            .sprite(width / 2, height / 2, ASSET_KEYS.SPRITESHEETS.CAMPAIGN_BLACKHOLE)
            .setAlpha(0)
            .setScale(4) // Ajustado a 4
            .play(ASSET_KEYS.ANIMATIONS.ANIM_CAMPAIGN_BLACKHOLE);
    }

    applyBackgroundAnimations() {
        // Detener tweens previos en el objeto para evitar que luchen entre sí
        this.tweens.killTweensOf(this.bgStatic);

        // --- LÓGICA DE ESCALADO "COVER" (Mantener proporción) ---
        const width = this.scale.width;
        const height = this.scale.height;
        const scaleX = width / this.bgStatic.width;
        const scaleY = height / this.bgStatic.height;
        const scale = Math.max(scaleX, scaleY);

        this.bgStatic.setScale(scale);

        // --- ANIMACIÓN DE PALPITAR (Zoom suave) ---
        // Usamos la escala de "Cover" calculada como base
        this.tweens.add({
            targets: this.bgStatic,
            scale: scale * 1.04,
            duration: 3000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        // --- ANIMACIÓN DE RESPIRAR (Opacidad) ---
        this.tweens.add({
            targets: this.bgStatic,
            alpha: 0.85,
            duration: 2500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });
    }

    changeBackground(textureKey) {
        if (this.bgStatic) {
            const width = this.scale.width;
            const height = this.scale.height;

            this.bgStatic.setVisible(true);
            this.bgStatic.setTexture(textureKey);
            this.bgStatic.setDisplaySize(width, height); // Forzar tamaño de pantalla
            this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');

            // Reiniciar animaciones para que usen la nueva escala como base
            this.applyBackgroundAnimations();

            // Ensure no tint from previous states
            this.bgStatic.clearTint();
            if (textureKey === ASSET_KEYS.IMAGES.BG_GREEN) {
                this.bgStatic.setTint(0x88ff88);
            }

            // --- GESTIÓN DE ELEMENTOS DE CAMPAÑA ---
            // 1. Galaxia Nivel 1 (show if textureKey was originally easy)
            this.campaignGalaxy.setAlpha(textureKey === ASSET_KEYS.IMAGES.BG_CAMPAIGN_EASY ? 1 : 0);

            // 2. Estrella Nivel 2 (show if textureKey was originally medium)
            this.campaignStar.setAlpha(textureKey === ASSET_KEYS.IMAGES.BG_CAMPAIGN_MEDIUM ? 1 : 0);

            // 3. Agujero Negro Nivel 3 (show if textureKey was originally hard)
            this.campaignBlackhole.setAlpha(
                textureKey === ASSET_KEYS.IMAGES.BG_CAMPAIGN_HARD ? 1 : 0
            );
        }
    }

    /**
     * Aplica un efecto de oscurecimiento al fondo.
     * @param {boolean} enabled Si el oscurecimiento debe estar activado.
     */
    applyDim(enabled) {
        // Podríamos usar un graphics overlay, o simplemente un alpha en la cámara principal.
        // Para simplificar, ajustaremos el alpha del bgStatic y otros elementos.
        // Opcional: Podríamos tener un Graphics overlay que se activa/desactiva.
        // Por ahora, ajustaremos el alpha general de la cámara
        const alphaTarget = enabled ? 0.4 : 1; // 0.4 para oscurecer, 1 para normal
        this.tweens.add({
            targets: this.cameras.main,
            alpha: alphaTarget,
            duration: 300,
        });
    }
}
