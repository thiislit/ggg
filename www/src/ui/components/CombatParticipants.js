import { CONFIG } from '../../data/config.js';
import { DataManager } from '../../managers/DataManager.js';
import { HeartBar } from './HeartBar.js';
import { LAYOUT } from '../../data/Layout.js';

/** Planetas que puede elegir un jugador en su perfil. */
export const PLAYER_PLANETS = {
    EARTH: { texture: 'planet_tierra', anim: 'anim_earth' },
    MARS: { texture: 'planet_mars', anim: 'anim_mars' },
    KEPLER: { texture: 'planet_kepler', anim: 'anim_kepler' },
    NEBULA: { texture: 'planet_nebula', anim: 'anim_nebula' },
};

/** Convierte el perfil de un jugador online en el formato de oponente que usa la escena. */
export function buildRivalOpponent(rival) {
    const planetName = String(rival?.planet || 'EARTH').toUpperCase();
    return {
        name: String(rival?.name || 'RIVAL').slice(0, 16),
        species: String(rival?.species || 'HUMAN'),
        avatar: rival?.avatar,
        planet: { name: planetName, ...(PLAYER_PLANETS[planetName] || PLAYER_PLANETS.EARTH) },
        stats: { health: 3 },
        dialogues: {},
    };
}

/** Crea y mantiene tarjetas, vidas y avatares de ambos combatientes. */
export class CombatParticipants {
    constructor(scene, enemy, elements) {
        this.scene = scene;
        this.enemy = enemy;
        this.elements = elements;
    }

    initHUD(p1X, p2X, baseY, heartsY) {
        this.elements.p1Profile = this.createProfileCard(
            p1X,
            baseY,
            DataManager.getName(),
            DataManager.getPlanet(),
            true
        );
        this.elements.p1Hearts = new HeartBar(this.scene, p1X, heartsY);
        this.elements.p2Profile = this.createProfileCard(
            p2X,
            baseY,
            this.enemy.name,
            this.enemy.planet.name,
            false
        );
        this.elements.p2Hearts = new HeartBar(this.scene, p2X, heartsY);
    }

    createProfileCard(x, baseY, name, planet, isPlayer) {
        const container = this.scene.add.container(x, baseY);
        const planetSize = LAYOUT.HUD.PLANET_SIZE;
        const planetCenterY = planetSize / 2 + LAYOUT.HUD.SPACING.PLANET_TOP;
        const planetTextY = planetCenterY + planetSize / 2 + LAYOUT.HUD.SPACING.PLANET_TEXT;
        const speciesY = planetTextY + LAYOUT.HUD.SPACING.SPECIES;
        const nameY = speciesY + LAYOUT.HUD.SPACING.NAME;
        const background = this.scene.add.circle(0, planetCenterY, planetSize / 2, 0x000000, 0.8);
        const border = this.scene.add.graphics();
        border.lineStyle(2, CONFIG.THEME.primary, 0.6);
        border.strokeCircle(0, planetCenterY, planetSize / 2);
        const planetConfigs = PLAYER_PLANETS;
        const planetKey = planet.toUpperCase();
        const planetConfig =
            this.enemy && planetKey === this.enemy.planet.name
                ? this.enemy.planet
                : planetConfigs[planetKey] || planetConfigs.EARTH;
        const planetSprite = this.scene.add
            .sprite(0, planetCenterY, planetConfig.texture)
            .setDisplaySize(planetSize * 0.9, planetSize * 0.9)
            .play(planetConfig.anim);
        const nameText = this.scene.add
            .text(0, nameY, name, {
                fontFamily: CONFIG.FONTS.MAIN,
                fontSize: '14px',
                fill: CONFIG.THEME.primaryStr,
            })
            .setOrigin(0.5);
        const species = isPlayer ? DataManager.getSpecies() : this.enemy?.species || '';
        const speciesText = this.scene.add
            .text(0, speciesY, `SPECIES: ${species}`, {
                fontFamily: CONFIG.FONTS.MAIN,
                fontSize: '8px',
                fill: CONFIG.THEME.secondaryStr,
            })
            .setOrigin(0.5)
            .setAlpha(0.7);
        const planetText = this.scene.add
            .text(0, planetTextY, `PLANET: ${planet}`, {
                fontFamily: CONFIG.FONTS.MAIN,
                fontSize: '8px',
                fill: CONFIG.THEME.secondaryStr,
            })
            .setOrigin(0.5)
            .setAlpha(0.7);
        container.add([background, planetSprite, border, planetText, speciesText, nameText]);
        if (isPlayer) this.elements.p1NameTxt = nameText;
        else this.elements.p2NameTxt = nameText;
        return container;
    }

    initAvatars(p1X, p2X, y) {
        this.elements.p1Avatar = this.createAvatar(p1X, y, DataManager.getAvatar());
        this.elements.p2Avatar = this.createAvatar(p2X, y, this.enemy.avatar);
        [this.elements.p1Avatar, this.elements.p2Avatar].forEach((container, index) => {
            this.scene.tweens.add({
                targets: container,
                y: '+=5',
                duration: 2000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
                delay: index * 500,
            });
        });
    }

    createAvatar(x, y, key) {
        const container = this.scene.add.container(x, y);
        const frameWidth = 220;
        const frameHeight = 220;
        const background = this.scene.add.graphics();
        background.fillStyle(0x000000, 0.5).lineStyle(3, CONFIG.THEME.primary, 0.8);
        background.fillRoundedRect(-frameWidth / 2, -frameHeight / 2, frameWidth, frameHeight, 10);
        background.strokeRoundedRect(
            -frameWidth / 2,
            -frameHeight / 2,
            frameWidth,
            frameHeight,
            10
        );
        let avatar;
        if (this.scene.textures.exists(key)) {
            avatar = this.scene.add.image(0, 0, key);
            avatar.setScale(
                Math.min((frameWidth - 20) / avatar.width, (frameHeight - 20) / avatar.height)
            );
            avatar.setAlpha(1).setVisible(true);
        } else {
            console.warn(`AssetKey missing for avatar: ${key}. Using placeholder.`);
            avatar = this.scene.add
                .text(0, 0, '?', { fontSize: '60px', fill: '#FF0000' })
                .setOrigin(0.5);
        }
        container.add([background, avatar]);
        return container;
    }

    updateHearts(container, lives) {
        if (container?.updateLives) container.updateLives(lives);
    }
}
