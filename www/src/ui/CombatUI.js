import { CONFIG } from '../data/config.js';
import { PlayerManager } from '../managers/PlayerManager.js';
import { OPPONENTS } from '../data/Opponents.js';
import { AudioManager } from '../managers/AudioManager.js';
import { Storage } from '../managers/Storage.js';
import { RetroButton } from './components/RetroButton.js';
import { HeartBar } from './components/HeartBar.js';
import { LAYOUT } from '../data/Layout.js';

export class CombatUI {
    constructor(scene) {
        this.scene = scene;
        this.elements = {}; // Almacén para referencias de Phaser
    }

    // --- MÁRGENES Y GRILLA ---
    updateMainMargins(width, height) {
        if (!this.elements.mainMargin) {
            this.elements.mainMargin = this.scene.add.graphics().setDepth(1000);
        }
        this.elements.mainMargin.clear();
        const BORDER_W = 10;
        const borderColor = CONFIG.THEME.primary;
        this.elements.mainMargin.lineStyle(BORDER_W, borderColor, 1);
        this.elements.mainMargin.beginPath();
        this.elements.mainMargin.strokeRect(BORDER_W / 2, BORDER_W / 2, width - BORDER_W, height - BORDER_W);
        this.elements.mainMargin.strokePath();
    }

    drawGrid() {
        if (!this.elements.gridGraphics) {
            this.elements.gridGraphics = this.scene.add.graphics().setDepth(900);
        }
        this.elements.gridGraphics.clear(); 
        const { width, height } = this.scene.scale; 
        const CENTER_X = width / 2;
        const gridColor = CONFIG.THEME.primary;

        // 1. Línea Vertical Central
        this.elements.gridGraphics.lineStyle(4, 0xffffff, 0.3);
        this.elements.gridGraphics.beginPath();
        this.elements.gridGraphics.lineBetween(CENTER_X, 0, CENTER_X, height);
        this.elements.gridGraphics.strokePath();

        // 2. Líneas Horizontales
        this.elements.gridGraphics.lineStyle(4, gridColor, 1); 
        const topY = LAYOUT.getGridTop(height);
        this.elements.gridGraphics.beginPath();
        this.elements.gridGraphics.lineBetween(0, topY, width, topY);
        const bottomY = LAYOUT.getGridBottom(height);
        this.elements.gridGraphics.lineBetween(0, bottomY, width, bottomY);
        this.elements.gridGraphics.strokePath();
    }

    // --- HUD (CARTAS DE PERFIL Y CORAZONES) ---
    initHUD(p1X, p2X, baseY, heartsY) {
        // Player 1
        this.elements.p1Profile = this.createProfileCard(p1X, baseY, PlayerManager.getName(), PlayerManager.getPlanet(), true, heartsY);
        this.elements.p1Hearts = new HeartBar(this.scene, p1X, heartsY);
        
        // CPU (ZORG)
        const enemy = OPPONENTS.ZORG;
        this.elements.p2Profile = this.createProfileCard(p2X, baseY, enemy.name, enemy.planet.name, false, heartsY);
        this.elements.p2Hearts = new HeartBar(this.scene, p2X, heartsY);
    }

    createProfileCard(x, baseY, name, planet, isP1, heartsY) {
        const container = this.scene.add.container(x, baseY);
        const planetSize = LAYOUT.HUD.PLANET_SIZE; 
        
        // --- CÁLCULO DE POSICIONES (Usando LAYOUT) ---
        const planetCenterY = (planetSize / 2) + LAYOUT.HUD.SPACING.PLANET_TOP;
        const planetTxtY = planetCenterY + (planetSize / 2) + LAYOUT.HUD.SPACING.PLANET_TEXT; 
        const speciesY = planetTxtY + LAYOUT.HUD.SPACING.SPECIES;
        const nameY = speciesY + LAYOUT.HUD.SPACING.NAME;

        const bgCircle = this.scene.add.circle(0, planetCenterY, planetSize/2, 0x000000, 0.8);
        const borderCircle = this.scene.add.graphics();
        borderCircle.lineStyle(2, CONFIG.THEME.primary, 0.6);
        borderCircle.strokeCircle(0, planetCenterY, planetSize/2);

        // Configuración de planetas
        const planetConfigs = {
            'EARTH': { texture: 'planet_tierra', anim: 'anim_earth' },
            'MARS': { texture: 'planet_mars', anim: 'anim_mars' },
            'KEPLER': { texture: 'planet_kepler', anim: 'anim_kepler' },
            'NEBULA': { texture: 'planet_nebula', anim: 'anim_nebula' },
            'ZORGTROPOLIS': { texture: 'planet_zorg', anim: 'anim_zorg_planet' }
        };

        const pKey = planet.toUpperCase();
        let config = planetConfigs[pKey] || planetConfigs['EARTH'];
        if (pKey === OPPONENTS.ZORG.planet.name) config = OPPONENTS.ZORG.planet;

        const planetSprite = this.scene.add.sprite(0, planetCenterY, config.texture)
            .setDisplaySize(planetSize * 0.9, planetSize * 0.9) 
            .play(config.anim);

        const nameTxt = this.scene.add.text(0, nameY, name, { 
            fontFamily: CONFIG.FONTS.MAIN, fontSize: '14px', fill: CONFIG.THEME.primaryStr 
        }).setOrigin(0.5);

        const species = isP1 ? PlayerManager.getSpecies() : OPPONENTS.ZORG.species;
        const speciesTxt = this.scene.add.text(0, speciesY, `SPECIES: ${species}`, { 
            fontFamily: CONFIG.FONTS.MAIN, fontSize: '8px', fill: CONFIG.THEME.secondaryStr 
        }).setOrigin(0.5).setAlpha(0.7); 

        const planetTxt = this.scene.add.text(0, planetTxtY, `PLANET: ${planet}`, { 
            fontFamily: CONFIG.FONTS.MAIN, fontSize: '8px', fill: CONFIG.THEME.secondaryStr 
        }).setOrigin(0.5).setAlpha(0.7);

        container.add([bgCircle, planetSprite, borderCircle, planetTxt, speciesTxt, nameTxt]);
        
        if (isP1) this.elements.p1NameTxt = nameTxt;
        else this.elements.p2NameTxt = nameTxt;

        return container;
    }

    updateHeartsUI(container, lives) {
        if (container && container.updateLives) {
            container.updateLives(lives);
        }
    }

    // --- AVATARES ---
    initAvatars(p1X, p2X, y) {
        const frameW = 220; const frameH = 220;
        
        // P1
        this.elements.p1Avatar = this.createSingleAvatar(p1X, y, PlayerManager.getAvatar(), true);
        // CPU
        this.elements.p2Avatar = this.createSingleAvatar(p2X, y, OPPONENTS.ZORG.avatar, false);
        
        [this.elements.p1Avatar, this.elements.p2Avatar].forEach((container, i) => {
            this.scene.tweens.add({ targets: container, y: '+=5', duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: i * 500 });
        });
    }

    createSingleAvatar(x, y, key, isP1) {
        const container = this.scene.add.container(x, y);
        const frameW = 220; const frameH = 220;
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x000000, 0.5).lineStyle(3, CONFIG.THEME.primary, 0.8);
        bg.fillRoundedRect(-frameW/2, -frameH/2, frameW, frameH, 10);
        bg.strokeRoundedRect(-frameW/2, -frameH/2, frameW, frameH, 10);
        
        const avatar = this.scene.add.image(0, 0, key);
        const scale = Math.min((frameW - 20) / avatar.width, (frameH - 20) / avatar.height);
        avatar.setScale(scale);
        container.add([bg, avatar]);
        return container;
    }

    // --- BARRAS DE TIEMPO ---
    initTimerBars(width, barY) {
        const barW = width * 0.4;
        const barH = 20;
        const xc = width / 2;
        const yc = barY - 40;
        const R = 77;

        const drawPath = (gfx, isLeft) => {
            const yTop = barY - barH/2;
            const yBottom = barY + barH/2;
            const dxTop = Math.sqrt(Math.pow(R, 2) - Math.pow(yTop - yc, 2));
            const dxBottom = Math.sqrt(Math.pow(R, 2) - Math.pow(yBottom - yc, 2));
            const angleTop = Math.asin((yTop - yc) / R);
            const angleBottom = Math.asin((yBottom - yc) / R);
            const xStart = isLeft ? xc - barW - 20 : xc + barW + 20; 
            const xArcTop = isLeft ? xc - dxTop : xc + dxTop;
            const xArcBottom = isLeft ? xc - dxBottom : xc + dxBottom;

            gfx.beginPath().moveTo(xStart, yTop).lineTo(xArcTop, yTop);
            if (isLeft) gfx.arc(xc, yc, R, Math.PI - angleTop, Math.PI - angleBottom, true);
            else gfx.arc(xc, yc, R, angleTop, angleBottom, false);
            gfx.lineTo(xStart, yBottom).closePath().fillPath().strokePath();
        };

        this.elements.barLeftBg = this.scene.add.graphics().setDepth(100).fillStyle(0x000000, 0.5).lineStyle(2, CONFIG.THEME.primary, 0.5);
        drawPath(this.elements.barLeftBg, true);

        this.elements.barRightBg = this.scene.add.graphics().setDepth(100).fillStyle(0x000000, 0.5).lineStyle(2, CONFIG.THEME.primary, 0.5);
        drawPath(this.elements.barRightBg, false);

        const maskLeft = this.scene.add.graphics().setVisible(false).fillStyle(0xffffff);
        drawPath(maskLeft, true);
        const maskRight = this.scene.add.graphics().setVisible(false).fillStyle(0xffffff);
        drawPath(maskRight, false);

        this.elements.timeBar1 = this.scene.add.rectangle(0, barY, barW, barH, CONFIG.THEME.primary).setDepth(101);
        this.elements.timeBar2 = this.scene.add.rectangle(0, barY, barW, barH, CONFIG.THEME.primary).setDepth(101);
        
        this.elements.maskLeft = maskLeft;
        this.elements.maskRight = maskRight;

        const timerStyle = { fontSize: '12px', fontFamily: CONFIG.FONTS.MAIN, fill: CONFIG.THEME.primaryStr };
        this.elements.timeText1 = this.scene.add.text(width * 0.25, barY - 20, 'READY', timerStyle).setOrigin(0.5).setDepth(102);
        this.elements.timeText2 = this.scene.add.text(width * 0.75, barY - 20, 'READY', timerStyle).setOrigin(0.5).setDepth(102);
    }

    updateBarPositions(isPlayerRight, width) {
        const tb1 = this.elements.timeBar1;
        const tb2 = this.elements.timeBar2;
        if (isPlayerRight) {
            tb1.setOrigin(0, 0.5).setX(width * 0.5 + 20).setMask(this.elements.maskRight.createGeometryMask());
            tb2.setOrigin(1, 0.5).setX(width * 0.5 - 20).setMask(this.elements.maskLeft.createGeometryMask());
        } else {
            tb1.setOrigin(1, 0.5).setX(width * 0.5 - 20).setMask(this.elements.maskLeft.createGeometryMask());
            tb2.setOrigin(0, 0.5).setX(width * 0.5 + 20).setMask(this.elements.maskRight.createGeometryMask());
        }
    }

    // --- CONTROLES (BOTONES DE ABAJO) ---
    initControls(width, height, safeBottom) {
        const SAFE_BOTTOM = Math.max(safeBottom, 20);
        const BTN_Y = height - LAYOUT.CONTROLS.BTN_Y_OFFSET; 

        // Config
        this.elements.configBtn = this.scene.add.text(45, BTN_Y, '⚙️', { fontSize: '32px', padding: { x: 10, y: 10 } })
            .setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(5000);
        
        this.elements.configBtn.on('pointerdown', (pointer, localX, localY, event) => {
            if (event) event.stopPropagation();
            AudioManager.playSFX(this.scene, 'sfx_button');
            this.scene.tweens.add({ targets: this.elements.configBtn, scale: 1.2, duration: 100, yoyo: true });
            this.scene.scene.launch('SettingsScene');
            this.scene.scene.get('SettingsScene').events.once('settings-closed', () => {
                this.scene.applyTheme();
            });
        });
        
        // Mute
        this.elements.muteBtn = this.scene.add.text(width - 45, BTN_Y, this.scene.sound.mute ? '🔇' : '🔊', { 
            fontFamily: 'Arial, "Segoe UI Emoji", "Apple Color Emoji"', fontSize: '32px', padding: { x: 10, y: 10 } 
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(5000);

        this.elements.muteBtn.on('pointerdown', (pointer, localX, localY, event) => {
            if (event) event.stopPropagation();
            const nextState = !this.scene.sound.mute;
            this.scene.sound.mute = nextState;
            this.elements.muteBtn.setText(nextState ? '🔇' : '🔊');
            this.scene.tweens.add({ targets: this.elements.muteBtn, scale: 1.4, duration: 100, yoyo: true });
            Storage.set('isMuted', nextState);
        });

        // Switch
        this.elements.switchBtn = this.scene.add.text(width / 2, height - LAYOUT.CONTROLS.SWITCH_Y_OFFSET, '⇄', { 
            fontFamily: 'Arial, "Segoe UI Emoji", "Apple Color Emoji"', 
            fontSize: '40px' 
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(5000);

        this.elements.switchBtn.on('pointerdown', (pointer, localX, localY, event) => {
            if (event) event.stopPropagation();
            if (this.scene.isPlayingRound || this.scene.isSwitchingSide) return;
            AudioManager.playSFX(this.scene, 'sfx_button');
            this.scene.switchSides();
            this.scene.tweens.add({ targets: this.elements.switchBtn, scale: 1.2, duration: 100, yoyo: true });
        });

        this.elements.switchBtn.on('pointerover', () => {
            this.scene.tweens.add({ targets: this.elements.switchBtn, scale: 1.1, duration: 200 });
        });

        this.elements.switchBtn.on('pointerout', () => {
            this.scene.tweens.add({ targets: this.elements.switchBtn, scale: 1.0, duration: 200 });
        });

        // Quit (Reducido a escala 0.65 para que no choque)
        this.elements.quitBtn = this.createQuitButton(width / 2, BTN_Y);
        this.elements.quitBtn.setScale(0.65);
        this.elements.quitBtn.setDepth(5000);
    }

    createQuitButton(x, y) {
        return new RetroButton(
            this.scene, 
            x, 
            y, 
            'QUIT GAME', 
            CONFIG.COLORS.CPU_RED, 
            () => {
                this.scene.tweens.add({ 
                    targets: this.scene.cameras.main, 
                    alpha: 0, 
                    duration: 300, 
                    onComplete: () => this.scene.scene.start('MainMenuScene') 
                });
            }
        );
    }

    // --- ELEMENTOS DE RONDA (EMOJIS) ---
    initRoundElements(p1X, p2X, emojiY) {
        const style = { fontSize: '100px', padding: { x: 20, y: 20 } };
        this.elements.p1Emoji = this.scene.add.text(p1X, emojiY, '✊', style).setOrigin(0.5).setScale(0);
        this.elements.p2Emoji = this.scene.add.text(p2X, emojiY, '✊', style).setOrigin(0.5).setScale(0);
        this.elements.p1X = this.scene.add.text(p1X, emojiY, '❌', style).setOrigin(0.5).setAlpha(0).setDepth(10);
        this.elements.p2X = this.scene.add.text(p2X, emojiY, '❌', style).setOrigin(0.5).setAlpha(0).setDepth(10);
    }

    createNextRondaBtn(label, barY) {
        const { width } = this.scene.scale;
        const container = this.scene.add.container(width / 2, barY - 40).setDepth(2000);
        const circle = this.scene.add.circle(0, 0, 75, CONFIG.THEME.secondary).setStrokeStyle(4, CONFIG.THEME.primary);
        const text = this.scene.add.text(0, 0, label, { 
            fontFamily: CONFIG.FONTS.MAIN, fontSize: label.length > 5 ? '18px' : '24px', fill: '#ffffff' 
        }).setOrigin(0.5);
        
        container.add([circle, text]).setScale(0);
        container.setInteractive(new Phaser.Geom.Circle(0, 0, 75), Phaser.Geom.Circle.Contains);
        this.scene.tweens.add({ targets: container, scale: 1, duration: 400, ease: 'Back.easeOut' });
        
        return container;
    }

    applyTheme() {
        const theme = CONFIG.THEME;
        const els = this.elements;
        const { width, height } = this.scene.scale;

        [els.p1NameTxt, els.p2NameTxt, els.timeText1, els.timeText2, els.configBtn].forEach(el => {
            if (el) el.setFill(theme.PRIMARY_STR);
        });
        
        this.drawGrid();
        this.updateMainMargins(width, height);
    }
}
