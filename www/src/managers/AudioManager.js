import { Storage } from './Storage.js';

export const AudioManager = {
    volumes: {
        music: 0.5,
        sfx: 0.5,
    },
    bgm: null,

    async init(_scene) {
        const savedMusic = await Storage.get('vol_music', '0.5');
        const savedSfx = await Storage.get('vol_sfx', '0.5');
        this.volumes.music = parseFloat(savedMusic);
        this.volumes.sfx = parseFloat(savedSfx);
    },

    setMusicVolume(value) {
        this.volumes.music = value;
        Storage.set('vol_music', value);
        if (this.bgm) {
            this.bgm.setVolume(value);
        }
    },

    setSfxVolume(value) {
        this.volumes.sfx = value;
        Storage.set('vol_sfx', value);
    },

    playMusic(scene, key, options = {}) {
        if (this.bgm && this.bgm.key === key && this.bgm.isPlaying) return;

        if (this.bgm) this.bgm.stop();

        this.bgm = scene.sound.add(key, {
            loop: true,
            volume: this.volumes.music,
            ...options,
        });
        this.bgm.play();
        return this.bgm;
    },

    playSFX(scene, key, options = {}) {
        return scene.sound.play(key, {
            volume: this.volumes.sfx,
            ...options,
        });
    },

    stopMusic() {
        if (this.bgm) this.bgm.stop();
    },
};
