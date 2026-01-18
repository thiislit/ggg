import { Storage } from '../managers/Storage.js';
import { CONFIG } from '../data/config.js';
import { AudioManager } from '../managers/AudioManager.js';
import { PlayerManager } from '../managers/PlayerManager.js';
import { GAME_DATA } from '../data/GameData.js';
import { RetroButton } from '../ui/components/RetroButton.js';
import { ArrowSelector } from '../ui/components/ArrowSelector.js';

export class ProfileScene extends Phaser.Scene {
    constructor() {
        super('ProfileScene');
    }

    init(data) {
        this.fromStory = data && data.fromStory ? true : false;
    }

    async create() {
        const { width, height } = this.scale;
        const colors = CONFIG.THEME;

        // 1. Fondo sólido
        this.add.rectangle(0, 0, width, height, colors.BG, 1).setOrigin(0);
        
        // 2. Título Superior
        const titleText = this.fromStory ? "IDENTIFY YOURSELF" : "PLAYER PROFILE";
        this.add.text(width / 2, height * 0.07, titleText, {
            fontFamily: '"Press Start 2P"', fontSize: '26px', fill: colors.PRIMARY_STR
        }).setOrigin(0.5);

        const centerX = width / 2;

        // --- SECCIÓN A: PLANETA (CAMPO CIRCULAR) ---
        let currentY = height * 0.20;
        const P = GAME_DATA.PLANETS;
        this.planets = [P.EARTH, P.MARS, P.KEPLER, P.NEBULA];
        let savedPlanet = PlayerManager.getPlanet();
        this.planetIdx = Math.max(0, this.planets.indexOf(savedPlanet));

        this.planetNameTxt = this.add.text(centerX, currentY - 90, `HOME: ${this.planets[this.planetIdx]}`, {
            fontFamily: '"Press Start 2P"', fontSize: '12px', fill: colors.PRIMARY_STR
        }).setOrigin(0.5);

        // Usando el nuevo componente reutilizable
        new ArrowSelector(this, centerX, currentY, { 
            type: 'circular', 
            size: 130, 
            distance: 120 
        }, (dir) => this.updatePlanet(dir));
        
        const initialPlanet = this.planets[this.planetIdx];
        const planetConfigs = {
            [P.EARTH]: { texture: 'planet_tierra', anim: 'anim_earth' },
            [P.MARS]: { texture: 'planet_mars', anim: 'anim_mars' },
            [P.KEPLER]: { texture: 'planet_kepler', anim: 'anim_kepler' },
            [P.NEBULA]: { texture: 'planet_nebula', anim: 'anim_nebula' },
            [P.ZORGTROPOLIS]: { texture: 'planet_zorg', anim: 'anim_zorg_planet' }
        };

        this.planetPreview = this.add.sprite(centerX, currentY, planetConfigs[initialPlanet].texture)
            .setDisplaySize(100, 100)
            .play(initialPlanet === P.EARTH ? 'planet_rotate' : planetConfigs[initialPlanet].anim);

        // --- SECCIÓN B: NOMBRE (TEXTO EDITABLE CON BOTÓN OK) ---
        currentY += 160; 
        const name = PlayerManager.getName();
        
        // Etiqueta arriba
        this.add.text(centerX, currentY - 50, "CODENAME", {
            fontFamily: '"Press Start 2P"', fontSize: '10px', fill: '#888'
        }).setOrigin(0.5);

        // Contenedor del Input Visual
        const inputContainer = this.add.container(centerX, currentY);
        
        // Fondo del campo de texto
        const inputBg = this.add.graphics();
        inputBg.fillStyle(0x000000, 0.6);
        inputBg.lineStyle(2, colors.PRIMARY, 0.8);
        inputBg.fillRoundedRect(-140, -25, 200, 50, 8);
        inputBg.strokeRoundedRect(-140, -25, 200, 50, 8);

        // Texto del nombre (dentro del fondo)
        this.nameTxt = this.add.text(-130, 0, name, {
            fontFamily: '"Press Start 2P"', fontSize: '18px', fill: colors.ACCENT_STR
        }).setOrigin(0, 0.5);

        // Botón OK al lado
        const okBtn = this.add.container(100, 0);
        const okBg = this.add.graphics();
        okBg.fillStyle(colors.PRIMARY, 1);
        okBg.fillRoundedRect(-35, -25, 70, 50, 8);
        okBg.lineStyle(2, 0xffffff, 1);
        okBg.strokeRoundedRect(-35, -25, 70, 50, 8);
        
        const okTxt = this.add.text(0, 0, "OK", {
            fontFamily: '"Press Start 2P"', fontSize: '14px', fill: '#000'
        }).setOrigin(0.5);
        
        okBtn.add([okBg, okTxt]);
        okBg.setInteractive(new Phaser.Geom.Rectangle(-35, -25, 70, 50), Phaser.Geom.Rectangle.Contains);

        inputContainer.add([inputBg, this.nameTxt, okBtn]);

        // --- CURSOR PARPADEANTE ---
        this.cursor = this.add.text(0, 0, "_", {
            fontFamily: '"Press Start 2P"', fontSize: '18px', fill: colors.ACCENT_STR
        }).setOrigin(0, 0.5).setVisible(false);
        inputContainer.add(this.cursor);

        this.tweens.add({
            targets: this.cursor,
            alpha: 0,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Step'
        });

        // Acción al pulsar el botón OK o el fondo del nombre
        const triggerEdit = () => {
            AudioManager.playSFX(this, 'sfx_button');
            this.tweens.add({ targets: okBtn, scale: 0.9, duration: 80, yoyo: true });
            this.startEditingName();
        };

        okBg.on('pointerdown', triggerEdit);
        inputBg.setInteractive(new Phaser.Geom.Rectangle(-140, -25, 200, 50), Phaser.Geom.Rectangle.Contains);
        inputBg.on('pointerdown', triggerEdit);

        // Limpiar input al salir
        this.events.on('shutdown', () => {
            if (this.hiddenInput) {
                this.hiddenInput.remove();
                this.hiddenInput = null;
            }
        });

        // --- SECCIÓN C: AVATAR (CAMPO CUADRADO) ---
        currentY += 180; 
        const A = GAME_DATA.AVATARS;
        this.avatars = [
            A.HUMAN_1, A.HUMAN_2, A.HUMAN_3,
            A.ALIEN_2, A.ALIEN_3, A.ALIEN_4, A.ALIEN_5
        ];
        let savedAvatar = PlayerManager.getAvatar();
        this.avatarIdx = Math.max(0, this.avatars.indexOf(savedAvatar));

        this.add.text(centerX, currentY - 130, "UNIT APPEARANCE", {
            fontFamily: '"Press Start 2P"', fontSize: '12px', fill: colors.PRIMARY_STR
        }).setOrigin(0.5);

        new ArrowSelector(this, centerX, currentY, { 
            type: 'square', 
            size: 200, 
            distance: 155 
        }, (dir) => this.updateAvatar(dir));
        
        this.avatarPreview = this.add.image(centerX, currentY, this.avatars[this.avatarIdx])
            .setDisplaySize(180, 180);

        // --- SECCIÓN D: ESPECIE (TEXTO CON FLECHAS) ---
        currentY += 200; 
        const S = GAME_DATA.SPECIES;
        this.speciesList = [S.CYBORG, S.HUMAN, S.ALIEN];
        let savedSpecies = PlayerManager.getSpecies();
        this.speciesIdx = Math.max(0, this.speciesList.indexOf(savedSpecies));

        this.add.text(centerX, currentY - 45, "BIOLOGICAL TYPE", {
            fontFamily: '"Press Start 2P"', fontSize: '11px', fill: '#888'
        }).setOrigin(0.5);

        this.speciesTxt = this.add.text(centerX, currentY, this.speciesList[this.speciesIdx], {
            fontFamily: '"Press Start 2P"', fontSize: '20px', fill: colors.PRIMARY_STR
        }).setOrigin(0.5);

        new ArrowSelector(this, centerX, currentY, { distance: 130 }, (dir) => this.updateSpecies(dir));

        // --- BOTÓN FINAL (Usando Componente Reutilizable) ---
        // Si venimos de la historia, el botón dice "CONFIRM IDENTITY" y vuelve a la historia
        const btnText = this.fromStory ? "CONFIRM IDENTITY" : "CONFIRM PROFILE";
        const btnAction = () => {
            // Guardar cambios (ya se hace en cada update, pero aseguramos)
            const finalName = this.nameTxt.text.trim() || "PLAYER 1";
            PlayerManager.setName(finalName);
            
            if (this.fromStory) {
                // Volver a la historia para terminarla
                this.scene.start('StoryScene', { resume: true });
            } else {
                // Ir al menú normal
                this.scene.start('MainMenuScene');
            }
        };

        new RetroButton(
            this, 
            centerX, 
            height * 0.77, 
            btnText, 
            colors.PRIMARY, 
            btnAction
        );
    }

    startEditingName() {
        if (!this.hiddenInput) {
            this.hiddenInput = document.createElement('input');
            this.hiddenInput.type = 'text';
            this.hiddenInput.maxLength = 10;
            this.hiddenInput.style.position = 'absolute';
            this.hiddenInput.style.opacity = '0';
            this.hiddenInput.style.left = '-1000px';
            document.body.appendChild(this.hiddenInput);

            this.hiddenInput.addEventListener('input', (e) => {
                let val = e.target.value.toUpperCase().replace(/[^A-Z0-9 ]/g, '');
                this.nameTxt.setText(val);
                this.updateCursorPosition();
            });

            this.hiddenInput.addEventListener('blur', () => {
                this.stopEditingName();
            });

            this.hiddenInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.hiddenInput.blur();
            });
        }

        this.hiddenInput.value = this.nameTxt.text;
        this.hiddenInput.focus();
        this.cursor.setVisible(true);
        this.updateCursorPosition();
    }

    updateCursorPosition() {
        // Posicionar el cursor justo después del texto actual
        const textWidth = this.nameTxt.width;
        this.cursor.x = this.nameTxt.x + textWidth + 5;
    }

    stopEditingName() {
        this.cursor.setVisible(false);
        const finalName = this.nameTxt.text.trim() || "PLAYER 1";
        this.nameTxt.setText(finalName);
        PlayerManager.setName(finalName);
    }

    updatePlanet(dir) {
        this.planetIdx = (this.planetIdx + dir + this.planets.length) % this.planets.length;
        const p = this.planets[this.planetIdx];
        this.planetNameTxt.setText(`HOME: ${p}`);
        PlayerManager.setPlanet(p);
        
        const P = GAME_DATA.PLANETS;
        const planetConfigs = {
            [P.EARTH]: { texture: 'planet_tierra', anim: 'anim_earth' },
            [P.MARS]: { texture: 'planet_mars', anim: 'anim_mars' },
            [P.KEPLER]: { texture: 'planet_kepler', anim: 'anim_kepler' },
            [P.NEBULA]: { texture: 'planet_nebula', anim: 'anim_nebula' },
            [P.ZORGTROPOLIS]: { texture: 'planet_zorg', anim: 'anim_zorg_planet' }
        };
        
        const config = planetConfigs[p];
        if (config) {
            this.planetPreview.setTexture(config.texture);
            this.planetPreview.play(p === P.EARTH ? 'planet_rotate' : config.anim);
        }
        
        this.tweens.add({ targets: this.planetPreview, scale: 1.2, duration: 150, yoyo: true });
    }

    updateAvatar(dir) {
        this.avatarIdx = (this.avatarIdx + dir + this.avatars.length) % this.avatars.length;
        const a = this.avatars[this.avatarIdx];
        this.avatarPreview.setTexture(a);
        PlayerManager.setAvatar(a);
        this.tweens.add({ targets: this.avatarPreview, scale: 0.8, duration: 100, yoyo: true });
    }

    updateSpecies(dir) {
        this.speciesIdx = (this.speciesIdx + dir + this.speciesList.length) % this.speciesList.length;
        const s = this.speciesList[this.speciesIdx];
        this.speciesTxt.setText(s);
        PlayerManager.setSpecies(s);
        this.tweens.add({ targets: this.speciesTxt, scale: 1.2, duration: 100, yoyo: true });
    }
}