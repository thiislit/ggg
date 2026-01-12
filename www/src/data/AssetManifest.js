export const ASSETS = {
    AUDIO: {
        SFX: [
            { key: 'sfx_rock', path: 'assets/sounds/rockrock-select.mp3' },
            { key: 'sfx_paper', path: 'assets/sounds/paperpaper-select.mp3' },
            { key: 'sfx_scissors', path: 'assets/sounds/scissors-select.mp3' },
            { key: 'sfx_reveal', path: 'assets/sounds/reveal-reveal.mp3' },
            { key: 'sfx_win', path: 'assets/sounds/yooo-win.mp3' },
            { key: 'sfx_lose', path: 'assets/sounds/whywhy-lose.mp3' },
            { key: 'sfx_tie', path: 'assets/sounds/tietie-tie.mp3' },
            { key: 'sfx_button', path: 'assets/sounds/button-click.mp3' }
        ],
        MUSIC: [
            { key: 'bgm', path: 'assets/sounds/background.mp3' }
        ],
        FATALITIES: [
            { key: 'fatality_rock', path: 'assets/sounds/rock-fatality.mp3' },
            { key: 'fatality_paper', path: 'assets/sounds/paper-fatality.mp3' },
            { key: 'fatality_scissor', path: 'assets/sounds/scissor-fatality.mp3' }
        ]
    },
    IMAGES: {
        BACKGROUNDS: [
            { key: 'v3_bg', path: 'assets/v3_space.png' },
            { key: 'bg_green', path: 'assets/backgrounds/bg_green.png' },
            { key: 'bg_purple', path: 'assets/backgrounds/background2-morado.png' },
            { key: 'bg_blue', path: 'assets/backgrounds/background3-azul.png' }
        ],
        AVATARS: [
            { key: 'avatar_human_1', path: 'assets/avatars/human_1.png' },
            { key: 'avatar_human_2', path: 'assets/avatars/human_2.png' },
            { key: 'avatar_human_3', path: 'assets/avatars/human_3.png' },
            { key: 'avatar_zorg', path: 'assets/avatars/zorg.png' },
            { key: 'avatar_alien_2', path: 'assets/avatars/alien_2.png' },
            { key: 'avatar_alien_3', path: 'assets/avatars/alien_3.png' },
            { key: 'avatar_alien_4', path: 'assets/avatars/alien_4.png' },
            { key: 'avatar_alien_5', path: 'assets/avatars/alien_5.png' }
        ]
    },
    SPRITESHEETS: [
        { 
            key: 'planet_tierra', 
            path: 'assets/planets/earth_400.png',
            config: { frameWidth: 100, frameHeight: 100, startFrame: 0, endFrame: 399, margin: 5, spacing: 5 }
        },
        { 
            key: 'planet_mars', 
            path: 'assets/planets/mars_400.png',
            config: { frameWidth: 100, frameHeight: 100, startFrame: 0, endFrame: 399, margin: 5, spacing: 5 }
        },
        { 
            key: 'planet_kepler', 
            path: 'assets/planets/kepler_400.png',
            config: { frameWidth: 100, frameHeight: 100, startFrame: 0, endFrame: 399, margin: 5, spacing: 5 }
        },
        { 
            key: 'planet_nebula', 
            path: 'assets/planets/nebula_400.png',
            config: { frameWidth: 100, frameHeight: 100, startFrame: 0, endFrame: 399, margin: 5, spacing: 5 }
        },
        { 
            key: 'planet_zorg', 
            path: 'assets/planets/zorg_planet_400.png',
            config: { frameWidth: 100, frameHeight: 100, startFrame: 0, endFrame: 399, margin: 5, spacing: 5 }
        }
    ]
};
