import { CONFIG } from '../config.js';
import { Storage } from '../Storage.js';
import { FatalityManager } from '../managers/FatalityManager.js';
import { OpponentAI } from '../managers/OpponentAI.js';
import { AudioManager } from '../managers/AudioManager.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.p1Health = 3;
        this.p2Health = 3;
        this.canPlay = true; 
        this.playerStats = [0, 0, 0];
        this.playerName = 'PLAYER 1';
        this.themes = {
            dark: { 
                background: CONFIG.COLORS.BG_DARK, 
                text: CONFIG.COLORS.TEXT_MAIN, 
                accent: CONFIG.COLORS.P1_BLUE, 
                uiBg: 0x111111 
            }
        };
        this.currentTheme = 'dark';

        // --- SISTEMA DE DIÁLOGOS (Banco de Frases) ---
        // Definimos las frases base. Luego crearemos copias para barajar.
        this.baseDialogues = {
            P1: {
                WIN: ["Hahaha! EZ clap", "Lol, No cap 🧢", "Ratio + L! Hahaha", "Diff! Ez", "Built diff, lol", "Sit down! Hahaha", "Emotional dmg!", "Sheeesh! W", "Bet! Hahaha", "Lol, 2 Ez", "My lobby! Hahaha", "Clapped! Lmfao"],
                LOSE: ["Oh no! Lag!!", "Wait... Hacks?", "Nooo! Cringe...", "Oh no, Unlucky", "Wait, Rigged", "Bruh moment... Noo", "Wait! Misinput", "Who asked? L", "Oh no, Ping diff", "Controller died! Nooo"],
                DRAW: ["Huh? Same brain", "Wait, Hivemind?", "Pause... Lol", "Loading... Huh?", "Sus... Wait", "Twin? Hahaha", "Great minds, lol", "Wait, Lag?"]
            },
            CPU: {
                WIN: ["Hahaha. Deleted.", "L Bozo. Lol", "Touch grass. Hahaha", "Git gud. Hahaha", "Skill issue. Lol", "Calculated. Hahaha", "Imagine losing. Lol", "Bot diff. Hahaha", "Cope harder. Lol", "Uninstall? Hahaha", "Ez Game. Lol"],
                LOSE: ["Oh no! Error 404", "Wait... Glitch...", "Nooo! Lag switch?", "Reported. Nooo", "Rebooting... Wait", "Sus activity! Noo", "Ctrl+Alt+Del... Oh no", "System Fail. Nooo", "Blue Screen! Wait", "Devs fix this! Noo"],
                DRAW: ["Huh? Mirroring...", "Wait, Sync error", "Buffering... Lol", "Copycat. Huh?", "Ping... Wait", "Computing... Lol"]
            }
        };
        
        // Aquí guardaremos las "barajas" actuales
        this.dialogueDecks = { P1: {}, CPU: {} };
    }

    // Función auxiliar para obtener una frase sin repetir
    getDialoguePhrase(speaker, type) {
        // Inicializar mazo si no existe o está vacío
        if (!this.dialogueDecks[speaker][type] || this.dialogueDecks[speaker][type].length === 0) {
            // Clonar las frases base y barajar
            this.dialogueDecks[speaker][type] = Phaser.Utils.Array.Shuffle([...this.baseDialogues[speaker][type]]);
        }
        // Sacar y devolver la última frase
        return this.dialogueDecks[speaker][type].pop();
    }

    async applyTheme() {
        const colors = this.themes['dark']; 
        const bgDim = await Storage.get('bgDim', 'false') === 'true';
        // En modo terminal, el fondo es más oscuro y verdoso si se aplica dim
        const bgColor = bgDim ? 'rgba(0,10,0,0.8)' : 'rgba(0,0,0,0)';
        this.cameras.main.setBackgroundColor(bgColor);
        
        const textElements = [this.p1Status, this.p2Status, this.timeText1, this.timeText2];
        textElements.forEach(el => {
            if (el) el.setFill(colors.text);
        });
        if (this.configBtn) this.configBtn.setFill(colors.text);
        
        if (this.p1ButtonsBg) {
            this.p1ButtonsBg.forEach(bg => {
                if (bg) bg.setStrokeStyle(CONFIG.UI.BORDER_WIDTH, CONFIG.COLORS.P1_BLUE);
            });
        }
        if (this.p2ButtonsBg) {
            this.p2ButtonsBg.forEach(bg => {
                if (bg) bg.setStrokeStyle(CONFIG.UI.BORDER_WIDTH, CONFIG.COLORS.CPU_RED);
            });
        }
        if (this.gridGraphics) this.drawGrid();
    }

    async create() {
        this.playerName = await Storage.get('playerName', 'PLAYER 1');
        this.playerSpecies = await Storage.get('playerSpecies', 'HUMAN');
        this.playerPlanet = await Storage.get('playerPlanet', 'EARTH');
        
        const savedSide = await Storage.get('isPlayerRight', 'false');
        this.isPlayerRight = (savedSide === 'true');
        this.difficulty = await Storage.get('difficulty', 'MEDIUM');

        this.p1Health = 3;
        this.p2Health = 3;
        this.playerStats = [0, 0, 0];
        
        // Almacén para limpiar globos de diálogo
        this.activeBubbles = [];

        // --- CREAR ANIMACIÓN DE PLANETA ---
        if (!this.anims.exists('planet_rotate')) {
            this.anims.create({
                key: 'planet_rotate',
                frames: this.anims.generateFrameNumbers('planet_tierra', { start: 0, end: 399 }),
                frameRate: 6.67,
                repeat: -1
            });
        }

        this.fatalityManager = new FatalityManager(this);

        this.buildGame();
        this.applyTheme(); 
        this.isPlayingRound = false; 
        this.createNextRondaBtn(this.scale.width, this.scale.height, "PLAY");
    }

    buildGame() {
        const { width, height } = this.scale;
        const safeTop = this.game.registry.get('safeTop') || 0;
        const SAFE_TOP = Math.max(safeTop, 40); 
        const CENTER_X = width / 2;
        const FOOT_Y = height * 0.72;
        const BAR_Y = FOOT_Y - 25;
        this.barY = BAR_Y; // Guardamos para referencia del botón PLAY

        // --- RESTAURAR MÁRGENES Y CUADRÍCULA ---
        this.mainMargin = this.add.graphics();
        this.updateMainMargins(width, height, SAFE_TOP);
        this.gridGraphics = this.add.graphics();
        this.drawGrid();

        // ==========================================
        // CAMPO 1: HUD SUPERIOR (IDENTIDAD GALÁCTICA)
        const HUD_BASE_Y = SAFE_TOP + 45; // Bajamos el origen para que el planeta no toque el borde
        
        // Calculamos la posición de la línea divisoria (Campo 1 / Campo 2)
        const HUD_LIMIT_Y = height * 0.18 + 50; 
        const HEARTS_Y = HUD_LIMIT_Y - 3; // Corazones a 3px de la línea

        // --- TARJETAS DE IDENTIDAD ---
        const cpuNames = ['KORB-7', 'ZORGON', 'X-AE-12', 'UNIT-01', 'VOID-WALKER'];
        const cpuPlanets = ['MARS', 'KEPLER-186F', 'CYBERIA', 'NEBULA-X', 'TITAN'];
        
        this.cpuName = Phaser.Utils.Array.GetRandom(cpuNames);
        this.cpuPlanet = Phaser.Utils.Array.GetRandom(cpuPlanets);
        this.cpuSpecies = 'ALIEN'; // Valor por defecto para la CPU

        const p1X = this.isPlayerRight ? CENTER_X * 1.5 : CENTER_X * 0.5;
        const p2X = this.isPlayerRight ? CENTER_X * 0.5 : CENTER_X * 1.5;

        // --- CONSTRUIR PERFIL JUGADOR (P1) ---
        this.createProfileCard(p1X, HUD_BASE_Y, this.playerName, this.playerPlanet, true, HEARTS_Y);
        this.p1Score = this.createHearts(p1X, HEARTS_Y);

        // --- CONSTRUIR PERFIL RIVAL (CPU/P2) ---
        this.createProfileCard(p2X, HUD_BASE_Y, this.cpuName, this.cpuPlanet, false, HEARTS_Y);
        this.p2Score = this.createHearts(p2X, HEARTS_Y);

        // ==========================================
        // CAMPO 2: ZONA CENTRAL (ESCENARIO DE DUELO)
        // ==========================================
        const AVATAR_Y = (height * 0.42) - 90; // Subido 40px adicionales (total -90)
        const EMOJI_Y = (height * 0.58) + 20; // Bajado 20px adicionales

        // --- ÁREA CENTRAL: AVATARES ---
        this.createAvatarFrames(p1X, p2X, AVATAR_Y);

        // --- EMOJIS DE RESULTADO ---
        const emojiStyle = { fontSize: '100px', padding: { x: 20, y: 20 } };
        
        this.p1Emoji = this.add.text(p1X, EMOJI_Y, '✊', emojiStyle).setOrigin(0.5).setScale(0);
        this.p2Emoji = this.add.text(p2X, EMOJI_Y, '✊', emojiStyle).setOrigin(0.5).setScale(0);

        this.p1X = this.add.text(p1X, EMOJI_Y, '❌', emojiStyle).setOrigin(0.5).setAlpha(0).setDepth(10);
        this.p2X = this.add.text(p2X, EMOJI_Y, '❌', emojiStyle).setOrigin(0.5).setAlpha(0).setDepth(10);

        // ==========================================
        // CAMPO 3: PIE DE PANTALLA (INTERFAZ DE CONTROL)
        // ==========================================
        // --- SISTEMA DE TIEMPO (BARRAS INTEGRADAS) ---
        const timerStyle = { fontSize: '12px', fontFamily: CONFIG.FONTS.MAIN, fill: CONFIG.COLORS.TEXT_MAIN };
        const barW = width * 0.4;
        const barH = 20;
        const R = 77; // Radio del botón (75) + 2px de separación
        const xc = width / 2;
        const yc = this.barY - 40; // Centro del botón PLAY

        // Función matemática para dibujar la barra con el recorte circular exacto
        const drawBarPath = (gfx, isP1) => {
            const yTop = this.barY - barH/2;
            const yBottom = this.barY + barH/2;
            
            // Calculamos la intersección X exacta del círculo con las líneas Y superior e inferior
            const dxTop = Math.sqrt(Math.pow(R, 2) - Math.pow(yTop - yc, 2));
            const dxBottom = Math.sqrt(Math.pow(R, 2) - Math.pow(yBottom - yc, 2));
            
            // Ángulos para el arco
            const angleTop = Math.asin((yTop - yc) / R);
            const angleBottom = Math.asin((yBottom - yc) / R);

            const xStart = isP1 ? xc - barW - 20 : xc + barW + 20; // Extremo externo
            const xArcTop = isP1 ? xc - dxTop : xc + dxTop;
            const xArcBottom = isP1 ? xc - dxBottom : xc + dxBottom;

            gfx.beginPath();
            gfx.moveTo(xStart, yTop);
            gfx.lineTo(xArcTop, yTop);
            
            if (isP1) {
                // Arco en la parte izquierda del círculo
                gfx.arc(xc, yc, R, Math.PI - angleTop, Math.PI - angleBottom, true);
            } else {
                // Arco en la parte derecha del círculo
                gfx.arc(xc, yc, R, angleTop, angleBottom, false);
            }
            
            gfx.lineTo(xStart, yBottom);
            gfx.closePath();
            gfx.fillPath();
            gfx.strokePath();
        };

        // Fondo Barra P1
        const bg1 = this.add.graphics().setDepth(100);
        bg1.fillStyle(0x000000, 0.5);
        bg1.lineStyle(2, CONFIG.COLORS.P1_BLUE, 0.5);
        drawBarPath(bg1, true);

        // Progreso P1 (Lado Izquierdo)
        const xP1 = this.isPlayerRight ? width * 0.75 : width * 0.25;
        this.timeBar1 = this.add.rectangle(xP1 + barW/2, this.barY, barW, barH, CONFIG.COLORS.P1_BLUE)
            .setOrigin(1, 0.5) // Origen a la derecha para que se vacíe hacia la izquierda
            .setDepth(101);
        const mask1 = this.add.graphics().setVisible(false);
        mask1.fillStyle(0xffffff);
        drawBarPath(mask1, true);
        this.timeBar1.setMask(mask1.createGeometryMask());

        // Fondo Barra P2 (Lado Derecho)
        const bg2 = this.add.graphics().setDepth(100);
        bg2.fillStyle(0x000000, 0.5);
        bg2.lineStyle(2, CONFIG.COLORS.P1_BLUE, 0.5);
        drawBarPath(bg2, false);

        // Progreso P2 (Lado Derecho)
        const xP2 = !this.isPlayerRight ? width * 0.75 : width * 0.25;
        this.timeBar2 = this.add.rectangle(xP2 - barW/2, this.barY, barW, barH, CONFIG.COLORS.P1_BLUE)
            .setOrigin(0, 0.5) // Origen a la izquierda para que se vacíe hacia la derecha
            .setDepth(101);
        const mask2 = this.add.graphics().setVisible(false);
        mask2.fillStyle(0xffffff);
        drawBarPath(mask2, false);
        this.timeBar2.setMask(mask2.createGeometryMask());

        this.timeText1 = this.add.text(width * 0.25, this.barY - 20, 'READY', timerStyle).setOrigin(0.5).setDepth(102);
        this.timeText2 = this.add.text(width * 0.75, this.barY - 20, 'READY', timerStyle).setOrigin(0.5).setDepth(102);

        this.createResponsiveButtons(width, height, FOOT_Y);
        this.createControls(width, height, 20);

        this.cameras.main.alpha = 0;
        this.tweens.add({ targets: this.cameras.main, alpha: 1, duration: CONFIG.TIMING.FADE_DURATION });
    }

    createProfileCard(x, baseY, name, planet, isP1, heartsY) {
        const container = this.add.container(x, baseY);
        
        // --- CÁLCULO DE CENTRADO SIMÉTRICO PARA EL PLANETA ---
        const planetSize = 140;
        
        const heartsRelativeY = heartsY - baseY;
        const BOTTOM_MARGIN = 25;
        
        // Ajuste de espaciado vertical
        const nameY = heartsRelativeY - (BOTTOM_MARGIN + 15);
        const speciesY = nameY - 28; // Antes -22 (Subimos 6px)
        const planetTxtY = speciesY - 14; // Antes -12 (Subimos un poco más y mantenemos ritmo)
        
        // El centro del planeta debe estar justo a la mitad del espacio superior (0) y el inicio de los textos (planetTxtY)
        // Subimos 25px extra para evitar colisión con textos al animar
        const planetCenterY = ((planetTxtY - (planetSize/2)) / 2) - 15; 

        // 1. Planeta (Sprite Animado)
        // Fondo circular para dar profundidad
        const bgCircle = this.add.circle(0, planetCenterY, planetSize/2, 0x000000, 0.8);
        const borderCircle = this.add.graphics();
        borderCircle.lineStyle(2, CONFIG.COLORS.P1_BLUE, 0.6);
        borderCircle.strokeCircle(0, planetCenterY, planetSize/2);

        const planetSprite = this.add.sprite(0, planetCenterY, 'planet_tierra')
            .setDisplaySize(planetSize * 0.9, planetSize * 0.9) // Ajustar tamaño un poco menor al borde
            .play('planet_rotate');

        // 2. Bloque de Datos
        const nameTxt = this.add.text(0, nameY, name, {
            fontFamily: CONFIG.FONTS.MAIN, fontSize: '14px', fill: CONFIG.COLORS.TEXT_MAIN
        }).setOrigin(0.5);

        const species = isP1 ? this.playerSpecies : this.cpuSpecies;
        const speciesTxt = this.add.text(0, speciesY, `SPECIES: ${species || 'UNKNOWN'}`, {
            fontFamily: CONFIG.FONTS.MAIN, fontSize: '8px', fill: CONFIG.COLORS.TEXT_MUTED
        }).setOrigin(0.5);

        const planetTxt = this.add.text(0, planetTxtY, `PLANET: ${planet}`, {
            fontFamily: CONFIG.FONTS.MAIN, fontSize: '8px', fill: CONFIG.COLORS.TEXT_MUTED
        }).setOrigin(0.5);

        container.add([bgCircle, planetSprite, borderCircle, planetTxt, speciesTxt, nameTxt]);
        
        if (isP1) {
            this.p1Status = nameTxt; 
            this.p1ProfileCard = container; // Guardar referencia al contenedor completo
        } else {
            this.p2Status = nameTxt;
            this.p2ProfileCard = container;
        }
    }

    createAvatarFrames(p1X, p2X, y) {
        const frameW = 220; // Agrandado 40px
        const frameH = 220; // Agrandado 40px

        [p1X, p2X].forEach((x, i) => {
            const isP1 = (i === 0);
            const container = this.add.container(x, y);
            
            // Fondo y borde del Avatar (Estilo Terminal)
            const bg = this.add.graphics();
            bg.fillStyle(0x000000, 0.5);
            bg.lineStyle(3, CONFIG.COLORS.P1_BLUE, 0.8);
            bg.fillRoundedRect(-frameW/2, -frameH/2, frameW, frameH, 10);
            bg.strokeRoundedRect(-frameW/2, -frameH/2, frameW, frameH, 10);
            
            // Avatar Sprite
            const avatarKey = isP1 ? 'avatar_p1' : 'avatar_cpu';
            const avatar = this.add.image(0, 0, avatarKey);
            
            // Escalar manteniendo proporción para encajar en el marco
            // Dejamos un margen de 10px (frameW - 20)
            const scaleX = (frameW - 20) / avatar.width;
            const scaleY = (frameH - 20) / avatar.height;
            const scale = Math.min(scaleX, scaleY);
            avatar.setScale(scale);

            container.add([bg, avatar]);
            
            if (isP1) this.p1AvatarFrame = container;
            else this.p2AvatarFrame = container;
            
            // Animación de respiración para el cuadro del avatar
            this.tweens.add({
                targets: container,
                y: '+=5',
                duration: 2000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
                delay: i * 500
            });
        });
    }

    async checkTutorial() {
        const tutorialSeen = await Storage.get('tutorial_seen', 'false');
        if (tutorialSeen === 'false') {
            this.showTutorial();
        }
    }

    showTutorial() {
        const { width, height } = this.scale;
        this.tutorialContainer = this.add.container(0, 0).setDepth(3000);
        const overlay = this.add.rectangle(0, 0, width, height, CONFIG.COLORS.BG_DARK, 0.8).setOrigin(0).setInteractive();
        const style = { fontFamily: CONFIG.FONTS.MAIN, fontSize: '18px', fill: CONFIG.COLORS.TEXT_MAIN, align: 'center', wordWrap: { width: width * 0.8 } };
        const text = this.add.text(width/2, height * 0.4, "CHOOSE YOUR WEAPON\nBEFORE TIME RUNS OUT!", style).setOrigin(0.5);
        const btn = this.add.container(width/2, height * 0.6);
        const bRect = this.add.rectangle(0, 0, 200, 60, CONFIG.COLORS.P1_BLUE).setStrokeStyle(2, 0xffffff).setInteractive({ useHandCursor: true });
        const bText = this.add.text(0, 0, "GOT IT!", { fontFamily: CONFIG.FONTS.MAIN, fontSize: '16px' }).setOrigin(0.5);
        btn.add([bRect, bText]);
        bRect.on('pointerdown', async () => {
            await Storage.set('tutorial_seen', 'true');
            this.tweens.add({ targets: this.tutorialContainer, alpha: 0, duration: 300, onComplete: () => this.tutorialContainer.destroy() });
        });
        this.tutorialContainer.add([overlay, text, btn]);
        const handEmoji = this.add.text(width/2, height * 0.8, "👆", { fontSize: '60px' }).setOrigin(0.5);
        this.tutorialContainer.add(handEmoji);
        this.tweens.add({ targets: handEmoji, y: '+=30', duration: 500, yoyo: true, repeat: -1 });
    }

    pauseGame() {
        if (this.isPaused) return;
        this.isPaused = true;
        this.sound.pauseAll();
        if (this.isPlayingRound) this.tweens.pauseAll();
        const { width, height } = this.scale;
        this.pauseOverlay = this.add.container(0, 0).setDepth(4000);
        const bg = this.add.rectangle(0, 0, width, height, CONFIG.COLORS.BG_DARK, 0.7).setOrigin(0).setInteractive();
        const txt = this.add.text(width/2, height/2, "PAUSED", { fontFamily: CONFIG.FONTS.MAIN, fontSize: CONFIG.FONTS.SIZES.TITLE, fill: CONFIG.COLORS.TEXT_MAIN }).setOrigin(0.5);
        const subTxt = this.add.text(width/2, height/2 + 60, "TAP TO RESUME", { fontFamily: CONFIG.FONTS.MAIN, fontSize: CONFIG.FONTS.SIZES.NORMAL, fill: CONFIG.COLORS.P1_BLUE }).setOrigin(0.5);
        this.pauseOverlay.add([bg, txt, subTxt]);
        bg.on('pointerdown', () => this.resumeGame());
    }

    resumeGame() {
        if (!this.isPaused) return;
        this.isPaused = false;
        this.sound.resumeAll();
        if (this.isPlayingRound) this.tweens.resumeAll();
        if (this.pauseOverlay) { this.pauseOverlay.destroy(); this.pauseOverlay = null; }
    }

    createHearts(x, y) {
        const container = this.add.container(x, y);
        for (let i = 0; i < 3; i++) {
            const hContainer = this.add.container((i - 1) * 40, 0); 
            const heartGfx = this.add.graphics();
            heartGfx.fillStyle(CONFIG.COLORS.P1_BLUE, 1);
            heartGfx.lineStyle(2, 0xffffff, 1);
            const size = 8; 
            heartGfx.fillCircle(-size, -size/2, size);
            heartGfx.strokeCircle(-size, -size/2, size);
            heartGfx.fillCircle(size, -size/2, size);
            heartGfx.strokeCircle(size, -size/2, size);
            heartGfx.beginPath();
            heartGfx.moveTo(-size*2, -size/2);
            heartGfx.lineTo(0, size*2.5);
            heartGfx.lineTo(size*2, -size/2);
            heartGfx.fillPath();
            heartGfx.beginPath();
            const offset = size * 0.9; 
            heartGfx.moveTo(-size - offset, -size/2 + (size*0.5)); 
            heartGfx.lineTo(0, size*2.5);
            heartGfx.lineTo(size + offset, -size/2 + (size*0.5));
            heartGfx.strokePath();
            const shine = this.add.circle(-size, -size, 3, 0xffffff, 0.4);
            hContainer.add([heartGfx, shine]);
            hContainer.setData('active', true);
            container.add(hContainer);
            this.tweens.add({ targets: hContainer, scale: 1.15, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: i * 150 });
        }
        return container;
    }

    updateHearts(container, lives) {
        if (!container) return;
        container.list.forEach((hContainer, index) => {
            const isActive = hContainer.getData('active');
            if (index < lives) {
                if (!isActive) {
                    hContainer.setData('active', true);
                    hContainer.setAlpha(1);
                    const gfx = hContainer.list[0];
                    gfx.clear();
                    gfx.fillStyle(CONFIG.COLORS.P1_BLUE, 1);
                    gfx.lineStyle(2, 0xffffff, 1);
                    this.redrawHeart(gfx);
                }
            } 
            else if (index >= lives && isActive) {
                hContainer.setData('active', false);
                this.tweens.add({ targets: hContainer, y: -20, scale: 1.5, duration: 200, yoyo: true, onComplete: () => {
                    hContainer.setAlpha(0.3); hContainer.setScale(1);
                    const gfx = hContainer.list[0];
                    gfx.clear(); gfx.fillStyle(CONFIG.COLORS.TEXT_MUTED, 1); gfx.lineStyle(2, CONFIG.COLORS.TEXT_MUTED, 1);
                    this.redrawHeart(gfx);
                }});
            }
        });
    }

    redrawHeart(heartGfx) {
        const size = 8; 
        heartGfx.fillCircle(-size, -size/2, size);
        heartGfx.strokeCircle(-size, -size/2, size);
        heartGfx.fillCircle(size, -size/2, size);
        heartGfx.strokeCircle(size, -size/2, size);
        heartGfx.beginPath();
        heartGfx.moveTo(-size*2, -size/2);
        heartGfx.lineTo(0, size*2.5);
        heartGfx.lineTo(size*2, -size/2);
        heartGfx.fillPath();
        heartGfx.beginPath();
        const offset = size * 0.9;
        heartGfx.moveTo(-size - offset, -size/2 + (size*0.5)); 
        heartGfx.lineTo(0, size*2.5);
        heartGfx.lineTo(size + offset, -size/2 + (size*0.5));
        heartGfx.strokePath();
    }

    updateMainMargins(width, height, safeTop) {
        this.mainMargin.clear();
        const CENTER_X = width / 2;
        const BORDER_W = 10;
        const leftColor = this.isPlayerRight ? CONFIG.COLORS.CPU_RED : CONFIG.COLORS.P1_BLUE; 
        const rightColor = this.isPlayerRight ? CONFIG.COLORS.P1_BLUE : CONFIG.COLORS.CPU_RED;
        this.mainMargin.lineStyle(BORDER_W, leftColor, 1);
        this.mainMargin.beginPath();
        this.mainMargin.moveTo(CENTER_X, BORDER_W / 2);
        this.mainMargin.lineTo(BORDER_W / 2, BORDER_W / 2);
        this.mainMargin.lineTo(BORDER_W / 2, height - BORDER_W / 2);
        this.mainMargin.lineTo(CENTER_X, height - BORDER_W / 2);
        this.mainMargin.strokePath();
        this.mainMargin.lineStyle(BORDER_W, rightColor, 1);
        this.mainMargin.beginPath();
        this.mainMargin.moveTo(CENTER_X, BORDER_W / 2);
        this.mainMargin.lineTo(width - BORDER_W / 2, BORDER_W / 2);
        this.mainMargin.lineTo(width - BORDER_W / 2, height - BORDER_W / 2);
        this.mainMargin.lineTo(CENTER_X, height - BORDER_W / 2);
        this.mainMargin.strokePath();
    }

    createResponsiveButtons(width, height, footerTop) {
        this.p1ButtonsBg = []; this.p2ButtonsBg = [];
        this.p1ButtonsTxt = []; this.p2ButtonsTxt = [];
        const choices = ['ROCK', 'PAPER', 'SCISSORS'];
        const emojis = ['✊', '✋', '✌️'];
        const startY = footerTop || (height * 0.75);
        const p1X = this.isPlayerRight ? width * 0.75 : width * 0.25;
        const p2X = this.isPlayerRight ? width * 0.25 : width * 0.75;
        choices.forEach((name, i) => {
            const yPos = startY + 80 + (i * 100);
            this.makeSingleBtn(p1X, yPos, name, emojis[i], true, i);
            this.makeSingleBtn(p2X, yPos, name, emojis[i], false, i);
        });
    }

    makeSingleBtn(x, y, name, emoji, isP1, index) {
        let baseColor = isP1 ? CONFIG.COLORS.P1_BLUE : CONFIG.COLORS.CPU_RED;
        let container = this.add.container(x, y).setDepth(500); 
        // Borde con color de bando, fondo transparente
        const bg = this.add.circle(0, 0, 38, 0x000000, 0.1).setStrokeStyle(CONFIG.UI.BORDER_WIDTH, baseColor);
        
        const emo = this.add.text(0, 0, emoji, { 
            fontSize: CONFIG.FONTS.SIZES.EMOJI, 
            padding: { x: 10, y: 10 } 
        }).setOrigin(0.5);
        
        // CAPA DE FILTRO (Restaurada)
        const filter = this.add.circle(0, 0, 38, 0x000000, 0.4);

        const txt = this.add.text(0, 50, name, { fontFamily: CONFIG.FONTS.MAIN, fontSize: CONFIG.FONTS.SIZES.SMALL, fill: CONFIG.COLORS.TEXT_MAIN }).setOrigin(0.5);
        container.add([bg, emo, filter, txt]);
        container.add([bg, emo, txt]);
        const audioKeys = ['sfx_rock', 'sfx_paper', 'sfx_scissors'];
        if (isP1) {
            this.p1ButtonsBg[index] = bg; this.p1ButtonsTxt[index] = txt;
            bg.setInteractive({ useHandCursor: true });
            bg.on('pointerdown', () => {
                if (!this.isPlayingRound || this.isResolving) return;
                this.tweens.add({ targets: container, scale: 0.9, duration: CONFIG.TIMING.BUTTON_BOUNCE, yoyo: true });
                AudioManager.playSFX(this, audioKeys[index]);
                if (navigator.vibrate) navigator.vibrate(20);
                this.handleInput(index);
            });
        } else {
            this.p2ButtonsBg[index] = bg; this.p2ButtonsTxt[index] = txt;
        }
    }

    createControls(width, height, safeBottom = 0) {
        const SAFE_BOTTOM = Math.max(safeBottom, 20);
        const BTN_Y = height - 60 - (SAFE_BOTTOM > 20 ? SAFE_BOTTOM / 2 : 0);
        this.configBtn = this.add.text(60, BTN_Y, '⚙️', { fontSize: '30px', padding: { x: 5, y: 5 } }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(2000);
                                                this.configBtn.on('pointerdown', () => {
                                                    AudioManager.playSFX(this, 'sfx_button');
                                                    this.tweens.add({ targets: this.configBtn, scale: 1.2, duration: 100, yoyo: true });
                                                    this.scene.launch('SettingsScene');
                                                    this.scene.get('SettingsScene').events.once('settings-closed', () => this.applyTheme());
                                                });
                                        
                                                        // --- BOTÓN MUTE (VARIABLE ESPEJO) ---
                                                        // Sincronizar variable local con el estado real inicial
                                                        this.localMuteState = this.sound.mute;
                                                
                                                        const setupMuteBtn = () => {
                                                            if (this.muteBtn) this.muteBtn.destroy();
                                                            
                                                            // Usamos la variable LOCAL para decidir el icono (UI Instantánea)
                                                            const icon = this.localMuteState ? '🔇' : '🔊';
                                                            
                                                            this.muteBtn = this.add.text(width - 60, BTN_Y, icon, { 
                                                                fontFamily: 'Arial', 
                                                                fontSize: '30px', 
                                                                padding: { x: 10, y: 10 } 
                                                            })
                                                            .setOrigin(0.5)
                                                            .setInteractive({ useHandCursor: true })
                                                            .setDepth(2000);
                                                
                                                            this.muteBtn.on('pointerdown', () => {
                                                                // 1. Cambiar estado LOCAL primero (UI)
                                                                this.localMuteState = !this.localMuteState;
                                                                
                                                                // 2. Forzar al motor de audio a obedecer
                                                                this.sound.mute = this.localMuteState;
                                                                
                                                                // 3. Recrear botón visualmente
                                                                setupMuteBtn(); 
                                                                
                                                                this.tweens.add({ targets: this.muteBtn, scale: 1.2, duration: 100, yoyo: true });
                                                            });
                                                        };
                                                        setupMuteBtn();                                        
                                                this.switchBtn = this.add.text(width / 2, height - 130 - (SAFE_BOTTOM > 20 ? SAFE_BOTTOM / 2 : 0), '⇄', { fontSize: '40px' }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(2000);
                                                this.switchBtn.on('pointerdown', () => {            if (this.isPlayingRound || this.isSwitchingSide) return;
            AudioManager.playSFX(this, 'sfx_button');
            this.switchSides();
            this.tweens.add({ targets: this.switchBtn, scale: 1.2, duration: 100, yoyo: true });
        });
        this.stopBtn = this.add.container(width / 2, BTN_Y);
        const sShadow = this.add.graphics(); sShadow.fillStyle(0x000000, 0.5); sShadow.fillRoundedRect(-115, -20, 240, 50, CONFIG.UI.BUTTON_RADIUS);
        const sBg = this.add.graphics(); sBg.fillStyle(CONFIG.COLORS.CPU_RED, 1); sBg.fillRoundedRect(-120, -25, 240, 50, CONFIG.UI.BUTTON_RADIUS); sBg.lineStyle(2, 0xffffff, 1); sBg.strokeRoundedRect(-120, -25, 240, 50, CONFIG.UI.BUTTON_RADIUS);
        let sText = this.add.text(0, 0, 'QUIT GAME', { fontFamily: CONFIG.FONTS.MAIN, fontSize: CONFIG.FONTS.SIZES.SMALL, fill: CONFIG.COLORS.TEXT_MAIN }).setOrigin(0.5);
        const sHit = this.add.rectangle(0, 0, 240, 50, 0x000000, 0).setInteractive({ useHandCursor: true });
        this.stopBtn.add([sShadow, sBg, sText, sHit]);
        sHit.on('pointerdown', () => {
             if (navigator.vibrate) navigator.vibrate(20);
             AudioManager.playSFX(this, 'sfx_button');
             this.tweens.add({ targets: this.stopBtn, scale: 0.95, duration: CONFIG.TIMING.BUTTON_BOUNCE, yoyo: true });
             this.tweens.add({ targets: this.cameras.main, alpha: 0, duration: 300, onComplete: () => this.scene.start('MainMenuScene') });
        });
    }

    handleInput(index) {
        if (this.isResolving) return;
        this.isResolving = true; this.playerStats[index]++; this.resetButtonColors();
        if (this.p1ButtonsBg[index]) { this.p1ButtonsBg[index].setFillStyle(0xFFFFFF); this.p1ButtonsTxt[index].setFill(CONFIG.COLORS.TEXT_DARK); }
        AudioManager.playSFX(this, ['sfx_rock', 'sfx_paper', 'sfx_scissors'][index]);
        this.time.delayedCall(800, () => this.resolveRound(index));
    }

    startRound() {
        // --- LIMPIEZA PROFUNDA (GARBAGE COLLECTION) ---
        // Detener cualquier timer pendiente que pudiera disparar un "Next Button" fantasma
        if (this.nextRoundTimer) {
            this.nextRoundTimer.remove(false);
            this.nextRoundTimer = null;
        }
        
        // Detener tweens viejos que pudieran seguir corriendo
        this.tweens.killTweensOf([
            this.p1Emoji, this.p2Emoji, 
            this.timeBar1, this.timeBar2, 
            this.p1Status, this.p2Status,
            this.nextRondaBtn
        ]);

        // Limpiar diálogos anteriores al iniciar ronda
        if (this.activeBubbles) {
            this.activeBubbles.forEach(b => { if (b && b.destroy) b.destroy(); });
            this.activeBubbles = [];
        }

        this.isResolving = false; this.isPlayingRound = true; 
        this.p1X.setAlpha(0); this.p2X.setAlpha(0);
        
        const { width, height } = this.scale;
        const CENTER_X = width / 2;
        const p1TargetX = this.isPlayerRight ? CENTER_X * 1.5 : CENTER_X * 0.5;
        const p2TargetX = this.isPlayerRight ? CENTER_X * 0.5 : CENTER_X * 1.5;
        
        // RESET EXPLÍCITO DE ESTADO VISUAL
        this.p1Emoji.setText('✊').setScale(1).setAlpha(1).setOrigin(0.5);
        this.p2Emoji.setText('✊').setScale(1).setAlpha(1).setOrigin(0.5);
        this.p1Emoji.setAngle(this.isPlayerRight ? -90 : 90).setFlipX(!this.isPlayerRight);
        this.p2Emoji.setAngle(this.isPlayerRight ? 90 : -90).setFlipX(this.isPlayerRight);
        
        // Posición inicial fuera de pantalla para la entrada
        this.p1Emoji.x = p1TargetX < CENTER_X ? -200 : width + 200;
        this.p2Emoji.x = p2TargetX < CENTER_X ? -200 : width + 200;
        
        this.tweens.add({ targets: [this.p1Emoji, this.p2Emoji], x: (target) => (target === this.p1Emoji ? p1TargetX : p2TargetX), duration: 500, ease: 'Back.easeOut', onStart: () => AudioManager.playSFX(this, 'sfx_reveal', { volume: 0.3 * AudioManager.volumes.sfx }) });
        [this.timeBar1, this.timeBar2].forEach(bar => { bar.setVisible(true).setFillStyle(CONFIG.COLORS.SUCCESS).width = (width * 0.4); });
        this.timeBar1.alpha = 0; this.timeBar2.alpha = 0; this.timeText1.alpha = 0; this.timeText2.alpha = 0;
        this.tweens.add({ targets: [this.timeBar1, this.timeBar2, this.timeText1, this.timeText2], alpha: 1, duration: 300 });
        
        // Reset scale before starting
        this.timeBar1.scaleX = 1;
        this.timeBar2.scaleX = 1;

        this.tweens.add({ 
            targets: [this.timeBar1, this.timeBar2], 
            scaleX: 0, 
            duration: CONFIG.TIMING.ROUND_DURATION, 
            onUpdate: (tween) => {
                const remaining = Math.ceil((1 - tween.progress) * 5);
                this.timeText1.setText(remaining + 's'); this.timeText2.setText(remaining + 's');
                if (tween.progress > 0.7) { 
                    this.timeBar1.setFillStyle(0xff0000); // Rojo en peligro
                    this.timeBar2.setFillStyle(0xff0000); 
                }
            }, 
            onComplete: () => this.resolveRound(-1) 
        });
    }

    resolveRound(playerChoice) {
        this.isResolving = true;
        // DETENER TODO: Aseguramos que nada se esté moviendo antes de calcular
        this.tweens.killTweensOf([this.timeBar1, this.timeBar2, this.p1Emoji, this.p2Emoji]);
        
        const cpuChoice = this.getCpuChoice();
        
        // CÁLCULO SEGURO DE ÁNGULOS (Hardcoded)
        // En lugar de leer .angle (que puede tener error), lo definimos según el lado
        const p1StartAngle = this.isPlayerRight ? -90 : 90;
        const p2StartAngle = this.isPlayerRight ? 90 : -90;
        
        // Aseguramos que empiecen en la posición correcta sí o sí
        this.p1Emoji.setAngle(p1StartAngle).setOrigin(0.5, 1);
        this.p2Emoji.setAngle(p2StartAngle).setOrigin(0.5, 1);
        
        // Reset de posición X para evitar que se vayan desplazando al infinito
        const { width } = this.scale;
        const CENTER_X = width / 2;
        const p1FixedX = this.isPlayerRight ? CENTER_X * 1.5 : CENTER_X * 0.5;
        const p2FixedX = this.isPlayerRight ? CENTER_X * 0.5 : CENTER_X * 1.5;
        this.p1Emoji.x = p1FixedX;
        this.p2Emoji.x = p2FixedX;

        const offset = 60; 
        
        // Posición inicial para el martillado (ligeramente desplazados)
        this.p1Emoji.x += (p1StartAngle > 0 ? -offset : offset); 
        this.p2Emoji.x += (p2StartAngle > 0 ? -offset : offset);

        // Animación P1
        this.tweens.add({ 
            targets: this.p1Emoji, 
            angle: p1StartAngle - 90, 
            duration: 150, 
            yoyo: true, 
            repeat: 2, 
            ease: 'Sine.easeInOut', 
            onComplete: () => {
                this.p1Emoji.setAngle(p1StartAngle).setOrigin(0.5); 
                this.p1Emoji.x = p1FixedX; // Restaurar X exacta
            }
        });

        // Animación P2
        this.tweens.add({ 
            targets: this.p2Emoji, 
            angle: p2StartAngle + 90, 
            duration: 150, 
            yoyo: true, 
            repeat: 2, 
            ease: 'Sine.easeInOut', 
            onComplete: () => {
                this.p2Emoji.setAngle(p2StartAngle).setOrigin(0.5); 
                this.p2Emoji.x = p2FixedX; // Restaurar X exacta
                this.showResults(playerChoice, cpuChoice);
            }
        });
    }

    getCpuChoice() { return OpponentAI.getChoice(this.difficulty, this.playerStats); }

    showResults(p1, p2) {
        // NO detener todo el audio, para que la música siga sonando
        // this.sound.stopAll(); 
        const icons = ['✊', '✋', '✌️'];
        if (this.p1Emoji) this.p1Emoji.setText(p1 === -1 ? '❌' : icons[p1]);
        if (this.p2Emoji) this.p2Emoji.setText(icons[p2]);
        this.tweens.add({ targets: [this.p1Emoji, this.p2Emoji], scale: 1.5, duration: 100, yoyo: true, ease: 'Back.easeOut' });
        
        let resultText = ""; let color = CONFIG.COLORS.TEXT_MAIN;
        
        // --- LÓGICA DE RESULTADOS Y DIÁLOGOS ---
        if (p1 === -1) { 
            // SE ACABÓ EL TIEMPO (PIERDE P1)
            resultText = "TIME'S UP!"; color = "#ff0000"; 
            this.p1Health--; 
            AudioManager.playSFX(this, 'sfx_lose'); 
            this.playImpactEffect(CONFIG.COLORS.CPU_RED, 0.8); 
            
            this.time.delayedCall(1000, () => {
                this.showDialogue(true, 'LOSE'); 
                this.showDialogue(false, 'WIN'); 
            });
        }
        else if (p1 === p2) { 
            // EMPATE
            resultText = "DRAW!"; 
            AudioManager.playSFX(this, 'sfx_tie'); 
            this.playImpactEffect(CONFIG.COLORS.TEXT_MUTED, 0.5); 
            this.p2Status.setText("DRAW!").setFill(color).setScale(0); 
            this.tweens.add({ targets: this.p2Status, scale: 1.2, duration: 400, ease: 'Bounce.easeOut' }); 
            
            this.time.delayedCall(1000, () => {
                this.showDialogue(true, 'DRAW');
                this.showDialogue(false, 'DRAW');
            });
        }
        else if ((p1 === 0 && p2 === 2) || (p1 === 1 && p2 === 0) || (p1 === 2 && p2 === 1)) { 
            // GANA JUGADOR
            resultText = "YOU WIN!"; color = CONFIG.COLORS.TEXT_MAIN; 
            this.p2Health--; 
            AudioManager.playSFX(this, 'sfx_win'); 
            this.tweens.add({ targets: this.p2X, alpha: 1, scale: { from: 2, to: 1 }, duration: 300, ease: 'Bounce.easeOut' }); 
            this.playImpactEffect(CONFIG.COLORS.P1_BLUE, 1.0); 
            
            this.time.delayedCall(1000, () => {
                this.showDialogue(true, 'WIN');
                this.showDialogue(false, 'LOSE');
            });
        }
        else { 
            // PIERDE JUGADOR
            resultText = "YOU LOSE!"; color = CONFIG.COLORS.TEXT_MUTED; 
            this.p1Health--; 
            AudioManager.playSFX(this, 'sfx_lose'); 
            this.tweens.add({ targets: this.p1X, alpha: 1, scale: { from: 2, to: 1 }, duration: 300, ease: 'Bounce.easeOut' }); 
            this.playImpactEffect(CONFIG.COLORS.TEXT_MUTED, 0.8); 
            
            this.time.delayedCall(1000, () => {
                this.showDialogue(true, 'LOSE');
                this.showDialogue(false, 'WIN');
            });
        }

        this.p1Status.setText(resultText).setFill(color).setScale(0);
        this.tweens.add({ targets: this.p1Status, scale: 1.2, duration: 400, ease: 'Bounce.easeOut' });
        this.updateHearts(this.p1Score, this.p1Health); this.updateHearts(this.p2Score, this.p2Health);
        
        if (this.p2Health <= 0) { this.time.delayedCall(500, () => this.triggerFatality(p1, this.p2Emoji, this.p1Emoji, true)); } 
        else if (this.p1Health <= 0) { this.time.delayedCall(500, () => this.triggerFatality(p2, this.p1Emoji, this.p2Emoji, false)); } 
        else { 
            // Guardamos referencia al timer para poder cancelarlo si es necesario
            this.nextRoundTimer = this.time.delayedCall(1500, () => this.createNextRondaBtn(this.scale.width, this.scale.height)); 
        }
    }

    triggerFatality(choiceIndex, target, attacker, isPlayerWin) {
        this.tweens.add({ targets: [this.p1Status, this.p2Status, this.p1Score, this.p2Score, this.timeText1, this.timeText2], alpha: 0, duration: 200 });
        this.fatalityManager.play(choiceIndex, target, attacker, isPlayerWin, (winState) => this.finishGame(winState));
    }

    async finishGame(isPlayerWin) {
        const winnerName = isPlayerWin ? this.playerName : this.cpuName;
        let currentStreak = parseInt(await Storage.get('streak_current', '0'));
        let bestStreak = parseInt(await Storage.get('streak_best', '0'));
        if (isPlayerWin) { currentStreak++; if (currentStreak > bestStreak) { bestStreak = currentStreak; await Storage.set('streak_best', bestStreak); } } else { currentStreak = 0; }
        await Storage.set('streak_current', currentStreak);
        this.tweens.add({ targets: this.cameras.main, alpha: 0, duration: CONFIG.TIMING.FADE_DURATION, onComplete: () => this.scene.start('GameOverScene', { winner: winnerName, streak: currentStreak, isNewRecord: (isPlayerWin && currentStreak === bestStreak && currentStreak > 0) }) });
    }

    playImpactEffect(color, intensity) {
        this.cameras.main.flash(200 * intensity, 255, 255, 255); this.cameras.main.shake(200 * intensity, 0.01 * intensity);
        if (this.vfx) {
            const midX = (this.p1Emoji.x + this.p2Emoji.x) / 2; const midY = (this.p1Emoji.y + this.p2Emoji.y) / 2;
            this.vfx.setPosition(midX, midY); this.vfx.forEachAlive(p => p.tint = color); this.vfx.explode(30 + (20 * intensity)); 
        }
    }

    createNextRondaBtn(width, height, labelText = "NEXT") {
        this.isPlayingRound = false; 
        const currentColor = CONFIG.COLORS.TEXT_MAIN;
        this.p1Status.setText(this.playerName).setFill(currentColor);
        
        if (this.nextRondaBtn) this.nextRondaBtn.destroy();
        
        // Posicionamos 40px por encima de las barras de tiempo
        const targetY = this.barY - 40;
        this.nextRondaBtn = this.add.container(width / 2, targetY).setDepth(2000);
        
        const circle = this.add.circle(0, 0, 75, CONFIG.COLORS.SUCCESS).setStrokeStyle(4, 0xffffff);
        const text = this.add.text(0, 0, labelText, { 
            fontFamily: CONFIG.FONTS.MAIN, 
            fontSize: labelText.length > 5 ? '18px' : '24px', 
            fill: '#ffffff' 
        }).setOrigin(0.5);
        
        this.nextRondaBtn.add([circle, text]);
        
        // Interactividad directa en el contenedor
        this.nextRondaBtn.setInteractive(new Phaser.Geom.Circle(0, 0, 75), Phaser.Geom.Circle.Contains);
        
        this.nextRondaBtn.setScale(0);
        this.tweens.add({ targets: this.nextRondaBtn, scale: 1, duration: 400, ease: 'Back.easeOut' });
        
        this.nextRondaBtn.on('pointerdown', () => { 
            AudioManager.playSFX(this, 'sfx_button');
            this.nextRondaBtn.setScale(0.9); 
            if (navigator.vibrate) navigator.vibrate(20); 
        });
        
        this.nextRondaBtn.on('pointerup', () => { 
            this.nextRondaBtn.destroy(); 
            this.nextRondaBtn = null; 
            this.startRound(); 
        });
    }

    drawGrid() {
        this.gridGraphics.clear(); const { width, height } = this.scale; const CENTER_X = width / 2;
        const leftColor = this.isPlayerRight ? CONFIG.COLORS.CPU_RED : CONFIG.COLORS.P1_BLUE; 
        const rightColor = this.isPlayerRight ? CONFIG.COLORS.P1_BLUE : CONFIG.COLORS.CPU_RED;
        this.gridGraphics.lineStyle(4, 0xffffff, 0.3); this.gridGraphics.lineBetween(CENTER_X, 0, CENTER_X, height);
        this.gridGraphics.lineStyle(4, leftColor, 1); this.gridGraphics.lineBetween(0, height * 0.18 + 50, CENTER_X - 2, height * 0.18 + 50);
        this.gridGraphics.lineBetween(0, height * 0.72, CENTER_X - 2, height * 0.72);
        this.gridGraphics.lineStyle(4, rightColor, 1); this.gridGraphics.lineBetween(CENTER_X + 2, height * 0.18 + 50, width, height * 0.18 + 50);
        this.gridGraphics.lineBetween(CENTER_X + 2, height * 0.72, width, height * 0.72);
    }
    
    resetButtonColors() {
        if (!this.p1ButtonsBg || !this.p1ButtonsTxt) return;
        for (let i = 0; i < 3; i++) {
            if (this.p1ButtonsBg[i]) { this.p1ButtonsBg[i].setFillStyle(0x000000, 0.1); this.p1ButtonsTxt[i].setFill(CONFIG.COLORS.TEXT_MAIN); }
            if (this.p2ButtonsBg[i]) { this.p2ButtonsBg[i].setFillStyle(0x000000, 0.1); this.p2ButtonsTxt[i].setFill(CONFIG.COLORS.TEXT_MAIN); }
        }
    }

    switchSides() {
        if (this.isSwitchingSide) return;
        this.isSwitchingSide = true; 
        this.isPlayerRight = !this.isPlayerRight;
        Storage.set('isPlayerRight', this.isPlayerRight); 
        this.drawGrid();
        
        const { width, height } = this.scale; 
        this.updateMainMargins(width, height);
        
        const CENTER_X = width / 2; 
        // Coordenadas objetivo (Swap)
        const p1TargetX = this.isPlayerRight ? CENTER_X * 1.5 : CENTER_X * 0.5; 
        const p2TargetX = this.isPlayerRight ? CENTER_X * 0.5 : CENTER_X * 1.5;
        
        // Coordenadas botones
        const p1BtnX = this.isPlayerRight ? width * 0.75 : width * 0.25; 
        const p2BtnX = this.isPlayerRight ? width * 0.25 : width * 0.75;

        // 1. Mover Tarjetas de Perfil (HUD)
        this.tweens.add({ targets: [this.p1ProfileCard, this.p1Score], x: p1TargetX, duration: 300, ease: 'Power2' });
        this.tweens.add({ targets: [this.p2ProfileCard, this.p2Score], x: p2TargetX, duration: 300, ease: 'Power2' });

        // 2. Mover Marcos de Avatar
        this.tweens.add({ targets: this.p1AvatarFrame, x: p1TargetX, duration: 300, ease: 'Power2' });
        this.tweens.add({ targets: this.p2AvatarFrame, x: p2TargetX, duration: 300, ease: 'Power2' });

        // 3. Mover Emojis de Combate (Flip y Posición)
        // El flip se hace visualmente en el texto interno
        this.p1Emoji.setFlipX(!this.isPlayerRight); 
        this.p2Emoji.setFlipX(this.isPlayerRight);
        
        // Rotar contenedores para mantener lógica de "mirar al centro"
        const angle1 = this.isPlayerRight ? -90 : 90;
        const angle2 = this.isPlayerRight ? 90 : -90;

        this.tweens.add({ 
            targets: this.p1EmojiContainer, // Ahora movemos el contenedor, no el texto suelto
            x: p1TargetX, 
            angle: angle1, 
            duration: 300, 
            ease: 'Power2' 
        });
        
        this.tweens.add({ 
            targets: [this.p1X], // La X de error sí es texto suelto
            x: p1TargetX, 
            duration: 300, 
            ease: 'Power2' 
        });

        this.tweens.add({ 
            targets: this.p2EmojiContainer, 
            x: p2TargetX, 
            angle: angle2, 
            duration: 300, 
            ease: 'Power2' 
        });

        this.tweens.add({ 
            targets: [this.p2X], 
            x: p2TargetX, 
            duration: 300, 
            ease: 'Power2' 
        });

        // 4. Mover Botones de Acción
        this.p1ButtonsBg.forEach((btn, i) => { if(btn && btn.parentContainer) this.tweens.add({ targets: btn.parentContainer, x: p1BtnX, duration: 300, ease: 'Back.easeOut' }); });
        this.p2ButtonsBg.forEach((btn, i) => { if(btn && btn.parentContainer) this.tweens.add({ targets: btn.parentContainer, x: p2BtnX, duration: 300, ease: 'Back.easeOut' }); });
        
        // 5. Mover Globos de Diálogo Activos
        if (this.activeBubbles && this.activeBubbles.length > 0) {
            this.activeBubbles.forEach(bubble => {
                if (bubble && bubble.active) {
                    // Si el globo está a la izquierda (< CENTER_X), va a la derecha, y viceversa.
                    const newX = (bubble.x < CENTER_X) ? (CENTER_X * 1.5) : (CENTER_X * 0.5);
                    this.tweens.add({ targets: bubble, x: newX, duration: 300, ease: 'Power2' });
                }
            });
        }

        this.time.delayedCall(310, () => { this.isSwitchingSide = false; });
    }

    showDialogue(isP1, type) {
        const speakerKey = isP1 ? 'P1' : 'CPU';
        
        // Obtener frase única del sistema de barajas
        const text = this.getDialoguePhrase(speakerKey, type);
        
        // Coordenadas
        const { width, height } = this.scale;
        const CENTER_X = width / 2;
        
        // Determinar posición X basada en el lado del jugador
        let targetX;
        if (isP1) {
            targetX = this.isPlayerRight ? CENTER_X * 1.5 : CENTER_X * 0.5;
        } else {
            targetX = this.isPlayerRight ? CENTER_X * 0.5 : CENTER_X * 1.5;
        }

        // Posición Y: Debajo del Avatar
        // Avatar Y base = (height * 0.42) - 90
        // Altura frame = 220, mitad = 110.
        // Borde inferior = AVATAR_Y + 110.
        // Margen extra = 20.
        const AVATAR_Y = (height * 0.42) - 90;
        const targetY = AVATAR_Y + 110 + 30;

        const color = isP1 ? CONFIG.COLORS.P1_BLUE : CONFIG.COLORS.CPU_RED;

        this.createSpeechBubble(targetX, targetY, 180, 50, text, color);
    }

    createSpeechBubble(x, y, width, height, quote, color) {
        const bubble = this.add.container(x, y).setDepth(2500);
        
        // Guardar referencia para borrar después
        if (!this.activeBubbles) this.activeBubbles = [];
        this.activeBubbles.push(bubble);
        
        // Fondo transparente, solo borde
        const graphics = this.add.graphics();
        graphics.lineStyle(3, color, 1);
        graphics.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);
        
        // Texto vacío inicialmente (para efecto typewriter)
        const content = this.add.text(0, 0, '', { 
            fontFamily: CONFIG.FONTS.MAIN, 
            fontSize: '14px', 
            fill: '#ffffff', 
            align: 'center',
            wordWrap: { width: width - 20 } 
        }).setOrigin(0.5);

        bubble.add([graphics, content]);
        
        // Animación de entrada (Pop)
        bubble.setScale(0);
        this.tweens.add({
            targets: bubble,
            scale: 1,
            duration: 300,
            ease: 'Back.easeOut',
            onComplete: () => {
                // Iniciar efecto de escritura letra por letra
                this.typewriterEffect(content, quote);
            }
        });
    }

    typewriterEffect(textObject, fullText) {
        const length = fullText.length;
        let i = 0;
        this.time.addEvent({
            callback: () => {
                textObject.text += fullText[i];
                i++;
                // Sonido suave de escritura (opcional)
                // if (i % 2 === 0) AudioManager.playSFX(this, 'sfx_blip'); 
            },
            repeat: length - 1,
            delay: 50 // Velocidad de escritura (50ms por letra)
        });
    }
}