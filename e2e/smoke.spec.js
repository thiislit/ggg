import { test, expect } from '@playwright/test';
import {
    preparePage,
    openMenu,
    waitForScene,
    readScene,
    waitForGameState,
    tapGame,
    menuButtonY,
    MENU,
} from './helpers.js';

/** Toca el botón PLAY/NEXT de la escena de combate. */
async function tapNextRoundButton(page) {
    const btn = await readScene(page, 'GameScene', (s) => ({
        x: s.nextRondaBtn.x,
        y: s.nextRondaBtn.y,
    }));
    await tapGame(page, btn.x, btn.y);
}

/** Toca piedra (0), papel (1) o tijera (2) del jugador. */
async function tapChoice(page, index) {
    const pos = await readScene(page, 'GameScene', (s) =>
        s.p1Buttons.map((b) => ({ x: b.x, y: b.y }))
    );
    await tapGame(page, pos[index].x, pos[index].y);
}

async function startQuickPlay(page) {
    await tapGame(page, 360, menuButtonY(MENU.QUICK_PLAY));
    await waitForScene(page, 'GameScene');
    await waitForGameState(page, 'IDLE');
    await page.waitForFunction(() => window.__RPS_GAME__.scene.getScene('GameScene').nextRondaBtn);
}

test.describe('RPS Retro en navegador', () => {
    let errors;

    test.beforeEach(async ({ page }) => {
        errors = await preparePage(page);
    });

    test.afterEach(() => {
        expect(errors, 'El juego no debe lanzar errores de JavaScript').toEqual([]);
    });

    test('arranca y muestra el menú con la versión', async ({ page }) => {
        await openMenu(page);
        const version = await readScene(page, 'MainMenuScene', (s) => s.versionText.text);
        expect(version).toMatch(/^v\d+\.\d+\.\d+$/);
    });

    test('Quick Play: se juega una ronda completa contra la CPU', async ({ page }) => {
        await openMenu(page);
        await startQuickPlay(page);

        const setup = await readScene(page, 'GameScene', (s) => ({
            isOnline: s.isOnline,
            hasOnline: Boolean(s.online),
            cpuButtons: s.p2Buttons.length,
        }));
        expect(setup).toEqual({ isOnline: false, hasOnline: false, cpuButtons: 3 });

        await tapNextRoundButton(page);
        await waitForGameState(page, 'COUNTDOWN');
        await tapChoice(page, 0); // piedra
        await waitForGameState(page, ['RESULT', 'FATALITY']);

        const after = await readScene(page, 'GameScene', (s) => ({
            p1: s.p1Health,
            p2: s.p2Health,
            stats: s.playerStats,
        }));
        expect(after.stats).toEqual([1, 0, 0]);
        // Ganó, perdió o empató: como mucho una vida menos en total
        expect(after.p1 + after.p2).toBeGreaterThanOrEqual(5);
    });

    test('Online PRACTICE muestra el panel online y Quick Play después NO lo hereda', async ({
        page,
    }) => {
        await openMenu(page);
        await tapGame(page, 360, menuButtonY(MENU.ONLINE));
        await waitForScene(page, 'OnlineLobbyScene');

        const practice = await readScene(page, 'OnlineLobbyScene', (s) => {
            const btn = s.viewObjects.find((o) => o.label?.text === 'PRACTICE');
            return { x: btn.x, y: btn.y };
        });
        await tapGame(page, practice.x, practice.y);
        await waitForScene(page, 'GameScene');
        await waitForGameState(page, 'IDLE');

        const online = await readScene(page, 'GameScene', (s) => ({
            isOnline: s.isOnline,
            hasEmojiPanel: Boolean(s.online?.emojiReactions),
            cpuButtons: s.p2Buttons.length,
            hasRivalDisplay: Boolean(s.choiceControls.onlineRivalDisplay),
        }));
        expect(online).toEqual({
            isOnline: true,
            hasEmojiPanel: true,
            cpuButtons: 0,
            hasRivalDisplay: true,
        });

        // Volver al menú y entrar a Quick Play (regresión: antes heredaba el modo online)
        await page.evaluate(() => {
            window.__RPS_GAME__.scene.getScene('GameScene').scene.start('MainMenuScene');
        });
        await waitForScene(page, 'MainMenuScene');
        await startQuickPlay(page);

        const quick = await readScene(page, 'GameScene', (s) => ({
            isOnline: s.isOnline,
            hasOnline: Boolean(s.online),
            cpuButtons: s.p2Buttons.length,
            hasRivalDisplay: Boolean(s.choiceControls.onlineRivalDisplay),
        }));
        expect(quick).toEqual({
            isOnline: false,
            hasOnline: false,
            cpuButtons: 3,
            hasRivalDisplay: false,
        });
    });
});
